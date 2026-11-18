"""Lecture périodique de la source du pays : officielle toutes les 5 minutes, médias toutes les 10 minutes."""
from __future__ import annotations

import asyncio
from datetime import UTC, datetime, timedelta
import logging
from typing import Any

import aiohttp

from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.helpers.aiohttp_client import async_get_clientsession
from homeassistant.helpers.update_coordinator import DataUpdateCoordinator, UpdateFailed

from .const import (
    CONF_COUNTRY,
    CONF_REGION,
    COUNTRIES,
    DOMAIN,
    NAAD_FEEDS,
    NEWS_MINUTES,
    NEWS_URL,
    NWS_EVENT,
    NWS_URL,
    OFFICIAL_MINUTES,
    US_STATES,
    VERSION,
)
from .sources import detect_naad, detect_news, detect_nws, news_url, nws_url, parse_naad, parse_news, parse_nws

_LOGGER = logging.getLogger(__name__)
TIMEOUT = aiohttp.ClientTimeout(total=20)
MAX_BYTES = 5 * 1024 * 1024
HEADERS = {
    # api.weather.gov demande un User-Agent qui identifie l'application et un contact
    "User-Agent": f"HomeAssistant-child_alert/{VERSION} (https://github.com/Marlboro62/ha-child-alert)",
    "Accept": "application/rss+xml, application/atom+xml, application/geo+json, application/xml;q=0.9, */*;q=0.5",
}


class AlertCoordinator(DataUpdateCoordinator[dict[str, Any]]):
    def __init__(self, hass: HomeAssistant, entry: ConfigEntry) -> None:
        opts = {**entry.data, **entry.options}
        self.code: str = opts[CONF_COUNTRY]
        self.country: dict[str, Any] = COUNTRIES[self.code]
        self.region: str | None = opts.get(CONF_REGION) or None
        official = self.country["source"] in ("naad", "nws")
        super().__init__(
            hass, _LOGGER, name=DOMAIN, config_entry=entry,
            update_interval=timedelta(minutes=OFFICIAL_MINUTES if official else NEWS_MINUTES),
        )
        self._session = async_get_clientsession(hass)
        self._news_at: datetime | None = None
        self._news: dict[str, Any] = {"active": False}
        self.errors: list[str] = []
        self.checked: str | None = None

    async def _get(self, url: str) -> bytes:
        async with self._session.get(url, headers=HEADERS, timeout=TIMEOUT, allow_redirects=True) as resp:
            if resp.status >= 400:
                raise ValueError(f"le serveur répond {resp.status}")
            chunks: list[bytes] = []
            size = 0
            async for chunk in resp.content.iter_chunked(65536):
                size += len(chunk)
                if size > MAX_BYTES:
                    raise ValueError("réponse trop volumineuse")
                chunks.append(chunk)
            return b"".join(chunks)

    async def _naad(self) -> dict[str, Any]:
        """Canada : flux national En Alerte, second serveur si le premier ne répond pas."""
        last = ""
        for url in NAAD_FEEDS:
            try:
                entries = await self.hass.async_add_executor_job(parse_naad, await self._get(url))
            except (aiohttp.ClientError, TimeoutError, ValueError) as err:
                last = f"En Alerte ({url}) : {err or type(err).__name__}"
                continue
            return detect_naad(entries)
        raise ValueError(last)

    async def _nws(self) -> dict[str, Any]:
        data = await self._get(nws_url(NWS_URL, NWS_EVENT, self.region))
        return detect_nws(await self.hass.async_add_executor_job(parse_nws, data))

    async def _search(self, search: dict[str, str]) -> list[dict[str, Any]]:
        region = US_STATES.get(self.region or "", self.region) if self.code == "US" else self.region
        data = await self._get(news_url(NEWS_URL, search, region))
        return await self.hass.async_add_executor_job(parse_news, data, search.get("lang", "fr"))

    async def _media(self) -> dict[str, Any]:
        """Titres des médias du pays (une recherche par langue). Au moins une recherche doit répondre."""
        searches = self.country.get("searches") or []
        results = await asyncio.gather(*(self._search(s) for s in searches), return_exceptions=True)
        articles: list[dict[str, Any]] = []
        failed: list[str] = []
        for search, res in zip(searches, results, strict=True):
            if isinstance(res, BaseException):
                failed.append(f"recherche {search['ceid']} : {res or type(res).__name__}")
            else:
                articles.extend(res)
        self.errors.extend(failed)
        if searches and len(failed) == len(searches):
            raise ValueError(" ; ".join(failed))
        return detect_news(articles, self.country)

    async def _async_update_data(self) -> dict[str, Any]:
        now = datetime.now(UTC)
        self.errors = []
        source = self.country["source"]
        # médias : pour les pays sans flux officiel, et pour un État américain choisi (alertes que la NWS ne relaie pas)
        use_news = source == "news" or (self.code == "US" and self.region)
        news_due = use_news and (self._news_at is None or now - self._news_at >= timedelta(minutes=NEWS_MINUTES - 0.5))
        official: dict[str, Any] | None = None
        try:
            if source == "naad":
                official = await self._naad()
            elif source == "nws":
                official = await self._nws()
        except (aiohttp.ClientError, TimeoutError, ValueError) as err:
            self.errors.append(str(err) or type(err).__name__)
        if news_due:
            try:
                self._news = await self._media()
                self._news_at = now
            except (aiohttp.ClientError, TimeoutError, ValueError) as err:
                self.errors.append(str(err) or type(err).__name__)
        if self.errors:
            _LOGGER.warning("Alerte enlèvement (%s) : %s", self.country["name"], " ; ".join(self.errors))
        if official is None and (not use_news or self._news_at is None):
            raise UpdateFailed(" ; ".join(self.errors) or "aucune source lisible")
        self.checked = now.isoformat()
        # source officielle d'abord ; à défaut, les médias
        if official and official.get("active"):
            return {**official, "method": "official"}
        if use_news and self._news.get("active"):
            return {**self._news, "method": "media"}
        return {**(official or self._news), "active": False}
