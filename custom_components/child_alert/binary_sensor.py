"""Capteur « Alerte enlèvement » : actif tant qu'une alerte d'enlèvement d'enfant est en cours dans le pays choisi."""
from __future__ import annotations

from typing import Any

from homeassistant.components.binary_sensor import BinarySensorDeviceClass, BinarySensorEntity
from homeassistant.core import HomeAssistant
from homeassistant.helpers.device_registry import DeviceEntryType, DeviceInfo
from homeassistant.helpers.entity_platform import AddEntitiesCallback
from homeassistant.helpers.update_coordinator import CoordinatorEntity

from . import AlertConfigEntry
from .const import DOMAIN, US_STATES, VERSION
from .coordinator import AlertCoordinator

SOURCE_LABEL = {"naad": "En Alerte (officiel)", "nws": "National Weather Service (officiel)", "news": "médias du pays"}


async def async_setup_entry(hass: HomeAssistant, entry: AlertConfigEntry, async_add_entities: AddEntitiesCallback) -> None:
    async_add_entities([ChildAlertSensor(entry.runtime_data)])


class ChildAlertSensor(CoordinatorEntity[AlertCoordinator], BinarySensorEntity):
    _attr_has_entity_name = True
    _attr_translation_key = "child_alert"
    _attr_device_class = BinarySensorDeviceClass.SAFETY
    _unrecorded_attributes = frozenset({"summary", "image", "url", "sources", "alert_id", "checked", "errors"})

    def __init__(self, coordinator: AlertCoordinator) -> None:
        super().__init__(coordinator)
        entry = coordinator.config_entry
        self._attr_unique_id = f"{entry.entry_id}_child_alert"
        self._attr_device_info = DeviceInfo(
            identifiers={(DOMAIN, entry.entry_id)},
            name=entry.title,
            manufacturer="Marlboro62",
            model=coordinator.country["alert"],
            sw_version=VERSION,
            entry_type=DeviceEntryType.SERVICE,
            configuration_url="https://github.com/Marlboro62/ha-child-alert",
        )

    @property
    def is_on(self) -> bool:
        return bool((self.coordinator.data or {}).get("active"))

    @property
    def icon(self) -> str:
        return "mdi:account-alert" if self.is_on else "mdi:account-check-outline"

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        c = self.coordinator
        a = c.data or {}
        base = {
            "country": c.code,
            "country_name": c.country["name"],
            "region": US_STATES.get(c.region or "", c.region),
            "alert_name": c.country["alert"],
            "phone": c.country["phone"],
            "source_type": SOURCE_LABEL[c.country["source"]],
            # code de la source (naad, nws, news) : la carte affiche son libellé dans la langue de l'utilisateur
            "source_kind": c.country["source"],
            "checked": c.checked,
            "errors": c.errors or None,
        }
        if not a.get("active"):
            return {**base, "ended": a.get("ended")}
        return {
            **base,
            "alert_id": a.get("id"),
            "method": a.get("method"),
            "since": a.get("since"),
            "expires": a.get("expires"),
            "title": a.get("title"),
            "summary": a.get("summary"),
            "area": a.get("area"),
            "image": a.get("image"),
            "url": a.get("url"),
            "source": a.get("source"),
            "sources": a.get("sources"),
        }
