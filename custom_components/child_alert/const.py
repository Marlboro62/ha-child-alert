"""Constantes de l'intégration Alerte Enlèvement : pays proposés et leurs sources."""
from __future__ import annotations

from typing import Any, Final

DOMAIN: Final = "child_alert"
VERSION: Final = "0.1.0b1"
NAME: Final = "Alerte Enlèvement"

CONF_COUNTRY: Final = "country"
CONF_REGION: Final = "region"

# relecture : sources officielles toutes les 5 minutes, recherche dans les médias toutes les 10 minutes
OFFICIAL_MINUTES: Final = 5
NEWS_MINUTES: Final = 10

# Canada : flux public du système national En Alerte (NAAD, Pelmorex), deux serveurs (Québec, Toronto)
NAAD_FEEDS: Final = ("https://rss.naad-adna.pelmorex.com/", "https://rss1.naad-adna.pelmorex.com/")
# États-Unis : alertes « Child Abduction Emergency » (CAE) relayées par la météo nationale (NWS, IPAWS)
NWS_URL: Final = "https://api.weather.gov/alerts/active"
NWS_EVENT: Final = "Child Abduction Emergency"
# Pays sans flux officiel : recherche Google Actualités dans les médias du pays, sur les dernières 24 heures
NEWS_URL: Final = "https://news.google.com/rss/search"

# États des États-Unis : code postal → nom (filtre des alertes NWS et de la recherche dans les médias)
US_STATES: Final[dict[str, str]] = {
    "AL": "Alabama", "AK": "Alaska", "AZ": "Arizona", "AR": "Arkansas", "CA": "California", "CO": "Colorado",
    "CT": "Connecticut", "DE": "Delaware", "DC": "District of Columbia", "FL": "Florida", "GA": "Georgia",
    "HI": "Hawaii", "ID": "Idaho", "IL": "Illinois", "IN": "Indiana", "IA": "Iowa", "KS": "Kansas", "KY": "Kentucky",
    "LA": "Louisiana", "ME": "Maine", "MD": "Maryland", "MA": "Massachusetts", "MI": "Michigan", "MN": "Minnesota",
    "MS": "Mississippi", "MO": "Missouri", "MT": "Montana", "NE": "Nebraska", "NV": "Nevada", "NH": "New Hampshire",
    "NJ": "New Jersey", "NM": "New Mexico", "NY": "New York", "NC": "North Carolina", "ND": "North Dakota",
    "OH": "Ohio", "OK": "Oklahoma", "OR": "Oregon", "PA": "Pennsylvania", "RI": "Rhode Island",
    "SC": "South Carolina", "SD": "South Dakota", "TN": "Tennessee", "TX": "Texas", "UT": "Utah", "VT": "Vermont",
    "VA": "Virginia", "WA": "Washington", "WV": "West Virginia", "WI": "Wisconsin", "WY": "Wyoming",
    "PR": "Puerto Rico",
}

# Pays proposés à l'installation.
# - source « naad » ou « nws » : flux officiel lisible par une machine ;
# - « news » : le dispositif n'a ni flux ni API ; l'alerte est repérée dans les titres d'au moins deux médias du pays
#   (recherche Google Actualités, une ou plusieurs langues), comme dans l'intégration Actualités France.
# alert : expression régulière du nom de l'alerte dans les titres ; phone : numéro d'urgence du pays.
COUNTRIES: Final[dict[str, dict[str, Any]]] = {
    "FR": {
        "name": "France", "alert": "Alerte Enlèvement", "phone": "197", "source": "news",
        "pattern": r"alerte[\s\-‑–]*enl[eèé]vement",
        "searches": [{"q": '"alerte enlèvement"', "hl": "fr", "gl": "FR", "ceid": "FR:fr", "lang": "fr"}],
    },
    "BE": {
        "name": "Belgique", "alert": "Child Alert", "phone": "112", "source": "news",
        "pattern": r"child[\s\-]*alert|alerte[\s\-‑–]*enl[eèé]vement|ontvoeringsalarm",
        "searches": [
            {"q": '"Child Alert" OR "alerte enlèvement"', "hl": "fr", "gl": "BE", "ceid": "BE:fr", "lang": "fr"},
            {"q": '"Child Alert" OR "ontvoeringsalarm"', "hl": "nl", "gl": "BE", "ceid": "BE:nl", "lang": "nl"},
        ],
    },
    "CH": {
        "name": "Suisse", "alert": "Alerte enlèvement · Entführungsalarm", "phone": "117", "source": "news",
        "pattern": r"alerte[\s\-‑–]*enl[eèé]vement|entf(?:ü|ue)hrungsalarm",
        "searches": [
            {"q": '"alerte enlèvement"', "hl": "fr", "gl": "CH", "ceid": "CH:fr", "lang": "fr"},
            {"q": '"Entführungsalarm"', "hl": "de", "gl": "CH", "ceid": "CH:de", "lang": "de"},
        ],
    },
    "LU": {
        "name": "Luxembourg", "alert": "AMBER Alert", "phone": "113", "source": "news",
        "pattern": r"amber[\s\-]*alert",
        "require": r"luxemb",
        "searches": [
            {"q": '"Amber Alert" Luxembourg', "hl": "fr", "gl": "BE", "ceid": "BE:fr", "lang": "fr"},
            {"q": '"Amber Alert" Luxemburg', "hl": "de", "gl": "DE", "ceid": "DE:de", "lang": "de"},
        ],
    },
    "NL": {
        "name": "Pays-Bas", "alert": "AMBER Alert", "phone": "112", "source": "news",
        "pattern": r"amber[\s\-]*alert",
        # une Amber Alert américaine ou mexicaine relayée par un média néerlandais n'est pas une alerte aux Pays-Bas
        "exclude": r"\b(VS|Verenigde Staten|Amerika|Amerikaans|Texas|Florida|Californi|Mexico|Canada)\b",
        "searches": [{"q": '"Amber Alert"', "hl": "nl", "gl": "NL", "ceid": "NL:nl", "lang": "nl"}],
    },
    "GB": {
        "name": "Royaume-Uni", "alert": "Child Rescue Alert", "phone": "999", "source": "news",
        "pattern": r"child[\s\-]*rescue[\s\-]*alert",
        "searches": [{"q": '"Child Rescue Alert"', "hl": "en-GB", "gl": "GB", "ceid": "GB:en", "lang": "en"}],
    },
    "IE": {
        "name": "Irlande", "alert": "Child Abduction Alert", "phone": "999", "source": "news",
        "pattern": r"child[\s\-]*abduction[\s\-]*alert",
        "searches": [{"q": '"Child Abduction Alert"', "hl": "en-IE", "gl": "IE", "ceid": "IE:en", "lang": "en"}],
    },
    "CA": {"name": "Canada", "alert": "Alerte AMBER · AMBER Alert", "phone": "911", "source": "naad"},
    "US": {
        "name": "États-Unis", "alert": "AMBER Alert", "phone": "911", "source": "nws",
        "pattern": r"amber[\s\-]*alert",
        # avec un État choisi : aussi les médias, pour les alertes que la météo nationale ne relaie pas
        "searches": [{"q": '"Amber Alert" "{region}"', "hl": "en-US", "gl": "US", "ceid": "US:en", "lang": "en"}],
    },
    "MX": {
        "name": "Mexique", "alert": "Alerta Amber", "phone": "911", "source": "news",
        "pattern": r"alerta[\s\-]*amber",
        "searches": [{"q": '"Alerta Amber"', "hl": "es-419", "gl": "MX", "ceid": "MX:es-419", "lang": "es"}],
    },
    "AU": {
        "name": "Australie", "alert": "AMBER Alert", "phone": "000", "source": "news",
        "pattern": r"amber[\s\-]*alert",
        "exclude": r"\b(US|U\.S\.|America|American|Texas|Florida|California|Mexico|Canada)\b",
        "searches": [{"q": '"Amber Alert"', "hl": "en-AU", "gl": "AU", "ceid": "AU:en", "lang": "en"}],
    },
}

# Fichier de la carte, servi par Home Assistant et chargé dans l'interface
CARD_URL: Final = f"/{DOMAIN}/child-alert-card.js"
CARD_FILE: Final = "frontend/child-alert-card.js"
