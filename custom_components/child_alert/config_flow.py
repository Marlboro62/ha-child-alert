"""Paramétrage : pays des alertes, puis l'État pour les États-Unis (facultatif)."""
from __future__ import annotations

from typing import Any

import voluptuous as vol

from homeassistant.config_entries import ConfigFlow, ConfigFlowResult
from homeassistant.helpers import selector

from .const import CONF_COUNTRY, CONF_REGION, COUNTRIES, DOMAIN, NAME, US_STATES

ALL = "all"


def _title(code: str, region: str | None) -> str:
    country = COUNTRIES[code]
    where = f"{country['name']} · {US_STATES.get(region, region)}" if region else country["name"]
    return f"{NAME} · {where}"


class ChildAlertConfigFlow(ConfigFlow, domain=DOMAIN):
    VERSION = 1

    def __init__(self) -> None:
        self._country: str | None = None

    async def _create(self, code: str, region: str | None) -> ConfigFlowResult:
        await self.async_set_unique_id(f"{code}_{region}" if region else code)
        self._abort_if_unique_id_configured()
        data = {CONF_COUNTRY: code}
        if region:
            data[CONF_REGION] = region
        return self.async_create_entry(title=_title(code, region), data=data)

    async def async_step_user(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        if user_input is not None:
            code = user_input[CONF_COUNTRY]
            if code == "US":
                self._country = code
                return await self.async_step_region()
            return await self._create(code, None)
        guess = (self.hass.config.country or "").upper()
        schema = vol.Schema({
            vol.Required(CONF_COUNTRY, default=guess if guess in COUNTRIES else "FR"): selector.SelectSelector(
                selector.SelectSelectorConfig(
                    options=[
                        selector.SelectOptionDict(value=k, label=f"{v['name']} — {v['alert']}")
                        for k, v in sorted(COUNTRIES.items(), key=lambda kv: kv[1]["name"])
                    ],
                    mode=selector.SelectSelectorMode.DROPDOWN,
                )
            ),
        })
        return self.async_show_form(step_id="user", data_schema=schema)

    async def async_step_region(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        if user_input is not None:
            region = user_input.get(CONF_REGION)
            return await self._create(self._country or "US", None if region in (None, "", ALL) else region)
        schema = vol.Schema({
            vol.Required(CONF_REGION, default=ALL): selector.SelectSelector(
                selector.SelectSelectorConfig(
                    options=[selector.SelectOptionDict(value=ALL, label="—")]
                    + [selector.SelectOptionDict(value=k, label=v) for k, v in sorted(US_STATES.items(), key=lambda kv: kv[1])],
                    mode=selector.SelectSelectorMode.DROPDOWN,
                )
            ),
        })
        return self.async_show_form(step_id="region", data_schema=schema)
