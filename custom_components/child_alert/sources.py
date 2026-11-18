"""Lecture des sources d'alerte (bibliothèque standard seulement, testable sans Home Assistant).

- Canada : flux Atom du système national En Alerte (NAAD) ;
- États-Unis : alertes « Child Abduction Emergency » de la météo nationale (api.weather.gov, GeoJSON) ;
- autres pays : titres des médias du pays (recherche Google Actualités, RSS). L'alerte est en cours quand au moins deux
  médias différents la titrent dans les dernières heures, et terminée dès qu'un titre annonce sa levée.

Chaque source donne le même résultat : {"active": bool, ...détails de l'alerte}.
"""
from __future__ import annotations

from datetime import UTC, datetime, timedelta
from email.utils import parsedate_to_datetime
import hashlib
import html
import json
import re
from typing import Any
from urllib.parse import urlencode
import xml.etree.ElementTree as ET

_ATOM = "{http://www.w3.org/2005/Atom}"
_TAGS = re.compile(r"<[^>]+>")
_SPACES = re.compile(r"\s+")
# sans date d'expiration lisible, une alerte reste affichée au plus 24 heures
MAX_AGE = timedelta(hours=24)


def _text(value: str | None, limit: int | None = None) -> str:
    text = _SPACES.sub(" ", html.unescape(_TAGS.sub(" ", value or ""))).strip()
    return text[:limit] if limit else text


def _iso(value: str | None) -> datetime | None:
    try:
        when = datetime.fromisoformat((value or "").strip().replace("Z", "+00:00"))
    except ValueError:
        return None
    return when if when.tzinfo else when.replace(tzinfo=UTC)


def _web(url: Any) -> str | None:
    return url if isinstance(url, str) and url.startswith(("https://", "http://")) else None


def _xml(data: bytes) -> ET.Element:
    head = data[:512].lstrip().lower()
    if not head or head.startswith((b"<!doctype html", b"<html")):
        raise ValueError("le site renvoie une page web (ou une page vide) au lieu du flux")
    try:
        return ET.fromstring(data)
    except ET.ParseError as err:
        raise ValueError(f"flux illisible ({err})") from err


# ----------------------------------------------------------------- Canada : En Alerte (NAAD)

_EXPIRES = re.compile(r"Expires:\s*([0-9T:\-+.Z]+)", re.I)
_AREA = re.compile(r"Area:\s*(.+?)(?:<br|$)", re.I | re.S)
_DESC = re.compile(r"Description:\s*(.+?)(?:###|Expires:)", re.I | re.S)
_ENDED_CA = re.compile(r"\b(ended|terminée?|annulée?|cancelled|canceled|levée)\b", re.I)


def parse_naad(data: bytes) -> list[dict[str, Any]]:
    """Entrées AMBER du flux NAAD. ValueError si le flux est illisible."""
    root = _xml(data)
    out: list[dict[str, Any]] = []
    for entry in root.iter(f"{_ATOM}entry"):
        terms = dict(
            (t.split("=", 1) + [""])[:2] for t in (c.get("term") or "" for c in entry.iter(f"{_ATOM}category")) if "=" in t
        )
        if terms.get("event", "").lower() != "amber":
            continue
        summary = html.unescape(entry.findtext(f"{_ATOM}summary") or "")
        link = next((ln.get("href") for ln in entry.iter(f"{_ATOM}link") if ln.get("rel", "alternate") == "alternate"), None)
        desc, area, expires = _DESC.search(summary), _AREA.search(summary), _EXPIRES.search(summary)
        out.append({
            "id": (entry.findtext(f"{_ATOM}id") or "").strip(),
            "title": _text(entry.findtext(f"{_ATOM}title")),
            "summary": _text(desc.group(1) if desc else summary, 1200),
            "area": _text(area.group(1)) if area else "",
            "updated": _iso(entry.findtext(f"{_ATOM}updated")),
            "expires": _iso(expires.group(1)) if expires else None,
            "status": terms.get("status", ""),
            "msg_type": terms.get("msgType", ""),
            "language": terms.get("language", ""),
            "author": _text(entry.findtext(f"{_ATOM}author/{_ATOM}name")),
            # l'adresse du flux pointe vers le fichier CAP (XML) : pas de lien vers ce fichier
            "url": None if re.search(r"\.xml(\?|$)", link or "", re.I) else _web(link),
        })
    return out


def detect_naad(entries: list[dict[str, Any]], now: datetime | None = None) -> dict[str, Any]:
    """Alerte AMBER en cours au Canada, en français de préférence."""
    now = now or datetime.now(UTC)
    real = [e for e in entries if e["status"] == "Actual" and e["updated"]]
    ends = [e["updated"] for e in real if e["msg_type"] == "Cancel" or _ENDED_CA.search(e["title"])]
    live = [
        e for e in real
        if e["msg_type"] in ("Alert", "Update") and not _ENDED_CA.search(e["title"])
        and (e["expires"] or e["updated"] + MAX_AGE) > now and e["updated"] > now - MAX_AGE
    ]
    if not live:
        return {"active": False, "ended": max(ends).isoformat() if ends else None}
    if ends and max(ends) >= max(e["updated"] for e in live):
        return {"active": False, "ended": max(ends).isoformat()}
    latest = max(e["updated"] for e in live)
    recent = [e for e in live if e["updated"] >= latest - timedelta(minutes=10)]
    best = next((e for e in recent if e["language"].startswith("fr")), recent[0])
    expires = [e["expires"] for e in live if e["expires"]]
    return {
        "active": True,
        # identifiant stable de l'alerte : sa première diffusion (les mises à jour en changent l'identifiant)
        "id": (min(live, key=lambda e: e["updated"])["id"].rsplit("/", 1)[-1] or best["title"])[:80],
        "since": min(e["updated"] for e in live).isoformat(),
        "expires": max(expires).isoformat() if expires else None,
        "title": best["title"],
        "summary": best["summary"],
        "area": best["area"],
        "image": None,
        "url": best["url"],
        "source": best["author"] or "En Alerte",
        "sources": sorted({e["author"] for e in live if e["author"]}) or ["En Alerte"],
    }


# ------------------------------------------------- États-Unis : météo nationale (NWS, IPAWS)

def nws_url(base: str, event: str, region: str | None) -> str:
    params = {"event": event, "status": "actual"}
    if region:
        params["area"] = region
    return f"{base}?{urlencode(params)}"


def parse_nws(data: bytes) -> list[dict[str, Any]]:
    """Alertes du GeoJSON de api.weather.gov. ValueError si la réponse est illisible."""
    try:
        doc = json.loads(data)
    except (ValueError, UnicodeDecodeError) as err:
        raise ValueError(f"réponse illisible ({err})") from err
    if not isinstance(doc, dict) or not isinstance(doc.get("features"), list):
        raise ValueError("réponse inattendue (pas de liste d'alertes)")
    out: list[dict[str, Any]] = []
    for feat in doc["features"]:
        p = (feat or {}).get("properties") or {}
        desc = _text(p.get("description"))
        instr = _text(p.get("instruction"))
        out.append({
            "id": str(p.get("id") or feat.get("id") or ""),
            "title": _text(p.get("headline")) or _text(p.get("event")),
            "summary": (desc + (f" {instr}" if instr else ""))[:1200],
            "area": _text(p.get("areaDesc")),
            "sent": _iso(p.get("sent")) or _iso(p.get("effective")),
            "expires": _iso(p.get("ends")) or _iso(p.get("expires")),
            "status": p.get("status") or "",
            "msg_type": p.get("messageType") or "",
            "author": _text(p.get("senderName")),
        })
    return out


def detect_nws(entries: list[dict[str, Any]], now: datetime | None = None) -> dict[str, Any]:
    """Alerte en cours : la plus récente des alertes réelles, non annulées et non expirées."""
    now = now or datetime.now(UTC)
    live = [
        e for e in entries
        if e["status"] == "Actual" and e["msg_type"] in ("Alert", "Update") and e["sent"]
        and (e["expires"] or e["sent"] + MAX_AGE) > now
    ]
    if not live:
        return {"active": False}
    best = max(live, key=lambda e: e["sent"])
    expires = [e["expires"] for e in live if e["expires"]]
    return {
        "active": True,
        "id": hashlib.sha1(min(live, key=lambda e: e["sent"])["id"].encode()).hexdigest()[:12],
        "since": min(e["sent"] for e in live).isoformat(),
        "expires": max(expires).isoformat() if expires else None,
        "title": best["title"],
        "summary": best["summary"],
        "area": best["area"],
        "image": None,
        "url": None,
        "source": best["author"] or "National Weather Service",
        "sources": sorted({e["author"] for e in live if e["author"]}) or ["National Weather Service"],
    }


# ------------------------------------------------------------ Autres pays : titres des médias

NEWS_WINDOW = timedelta(hours=6)
MIN_SOURCES = 2

# fin de l'alerte, par langue : levée, enfant retrouvé, alerte annulée
_END = {
    "fr": r"\blev[ée]e?s?\b|retrouv[ée]e?s?|lib[ée]r[ée]e?s?|sains? et saufs?|saine? et sauve|fin de l.alerte|annul[ée]e?",
    "nl": r"ingetrokken|teruggevonden|\bgevonden\b|\bterecht\b|be[eë]indigd|opgeheven",
    "de": r"aufgehoben|gefunden|wohlbehalten|beendet|widerrufen|wieder aufgetaucht",
    "en": r"\bcancel+ed\b|\bfound\b|\blocated\b|\brecovered\b|\bsafely\b|\bended\b|stood down|\blifted\b|discontinued",
    "es": r"desactivad[ao]|localizad[ao]|encontrad[ao]|cancelad[ao]|a salvo|sano y salvo|sana y salva",
}
# articles qui parlent du dispositif ou d'une fausse alerte : jamais une alerte en cours
_ABOUT = {
    "fr": r"\bans du dispositif|anniversaire|\bbilan\b|qu.est.ce que|comment fonctionne|fausse alerte|canular|\bexercice\b",
    "nl": r"jubileum|hoe werkt|\bnep\b|\bvals(e)?\b|\boefening\b",
    "de": r"jubil[äa]um|wie funktioniert|fehlalarm|falscher alarm|\bübung\b",
    "en": r"anniversary|\byears of\b|how .{0,20}works|\bhoax\b|\bfake\b|false alarm|\btest\b|statistics",
    "es": r"aniversario|c[oó]mo funciona|falsa alerta|\bsimulacro\b",
}
_SOURCE_SUFFIX = re.compile(r"\s+[-–—]\s+[^-–—]{2,80}$")


def news_url(base: str, search: dict[str, str], region: str | None = None) -> str:
    """Recherche Google Actualités sur les dernières 24 heures."""
    q = search["q"].replace("{region}", region or "")
    return f"{base}?{urlencode({'q': f'{q} when:1d', 'hl': search['hl'], 'gl': search['gl'], 'ceid': search['ceid']})}"


def _rfc822(value: str | None) -> datetime | None:
    try:
        when = parsedate_to_datetime((value or "").strip())
    except (TypeError, ValueError, IndexError):
        return _iso(value)
    return when if when.tzinfo else when.replace(tzinfo=UTC)


def parse_news(data: bytes, lang: str = "fr") -> list[dict[str, Any]]:
    """Articles d'un flux RSS de recherche (Google Actualités). ValueError si le flux est illisible."""
    root = _xml(data)
    out: list[dict[str, Any]] = []
    for item in root.iter("item"):
        source = _text(item.findtext("source"))
        title = _text(item.findtext("title"))
        # Google Actualités ajoute « - Nom du média » à la fin du titre
        if source and title.endswith(f" - {source}"):
            title = title[: -len(source) - 3].rstrip()
        elif not source and (m := _SOURCE_SUFFIX.search(title)):
            source, title = m.group(0).lstrip(" -–—"), title[: m.start()].rstrip()
        out.append({
            "title": title,
            "url": _web((item.findtext("link") or "").strip()),
            "published": _rfc822(item.findtext("pubDate")),
            "source": source or "?",
            "lang": lang,
        })
    return out


def detect_news(articles: list[dict[str, Any]], country: dict[str, Any], now: datetime | None = None) -> dict[str, Any]:
    """Alerte en cours d'après les titres : au moins deux médias différents sur les dernières heures, sans levée."""
    now = now or datetime.now(UTC)
    since = now - NEWS_WINDOW
    alert = re.compile(country["pattern"], re.I)
    require = re.compile(country["require"], re.I) if country.get("require") else None
    exclude = re.compile(country["exclude"], re.I) if country.get("exclude") else None
    hits: list[dict[str, Any]] = []
    ends: list[datetime] = []
    for art in articles:
        title, when, lang = art.get("title") or "", art.get("published"), art.get("lang") or "fr"
        if not when or when < since or when > now + timedelta(minutes=30) or not alert.search(title):
            continue
        if (require and not require.search(title)) or (exclude and exclude.search(title)):
            continue
        if re.search(_ABOUT.get(lang, _ABOUT["en"]), title, re.I):
            continue
        if re.search(_END.get(lang, _END["en"]), title, re.I):
            ends.append(when)
        else:
            hits.append(art)
    sources = {a["source"] for a in hits}
    if len(sources) < MIN_SOURCES:
        return {"active": False, "ended": max(ends).isoformat() if ends else None}
    start = min(a["published"] for a in hits)
    if any(e >= start for e in ends):
        return {"active": False, "ended": max(ends).isoformat()}
    first = min(hits, key=lambda a: a["published"])
    best = max(hits, key=lambda a: a["published"])
    return {
        "active": True,
        "id": hashlib.sha1(f"{start.isoformat()}|{first['title']}".encode()).hexdigest()[:12],
        "since": start.isoformat(),
        "expires": None,
        "title": best["title"],
        "summary": "",
        "area": "",
        "image": None,
        "url": best["url"],
        "source": best["source"],
        "sources": sorted(sources),
    }
