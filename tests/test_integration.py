"""Paramétrage par pays, capteur et panne d'une source (sites simulés)."""
from homeassistant import config_entries
from homeassistant.core import HomeAssistant
from homeassistant.data_entry_flow import FlowResultType
from pytest_homeassistant_custom_component.common import MockConfigEntry

from custom_components.child_alert.const import (
    CONF_COUNTRY,
    CONF_REGION,
    COUNTRIES,
    DOMAIN,
    NAAD_FEEDS,
    NEWS_URL,
    NWS_EVENT,
    NWS_URL,
)
from custom_components.child_alert.sources import news_url, nws_url

from .test_sources import nws

EMPTY_RSS = b'<?xml version="1.0"?><rss version="2.0"><channel><title>Recherche</title></channel></rss>'
EMPTY_ATOM = b'<?xml version="1.0"?><feed xmlns="http://www.w3.org/2005/Atom"><title>NAAD</title></feed>'


def recent_rss(*items):
    """Flux de recherche avec des titres publiés il y a quelques minutes (horloge réelle)."""
    from datetime import UTC, datetime, timedelta

    now = datetime.now(UTC)
    body = "".join(
        f"<item><title>{t} - {s}</title><link>https://news.google.com/rss/articles/{i}</link>"
        f"<pubDate>{(now - timedelta(minutes=m)).strftime('%a, %d %b %Y %H:%M:%S GMT')}</pubDate>"
        f"<source url=\"https://example.org\">{s}</source></item>"
        for i, (t, s, m) in enumerate(items)
    )
    return f'<?xml version="1.0"?><rss version="2.0"><channel><title>R</title>{body}</channel></rss>'.encode()


def mock_country(aioclient_mock, code, content=EMPTY_RSS, region=None):
    for search in COUNTRIES[code].get("searches", []):
        aioclient_mock.get(news_url(NEWS_URL, search, region), content=content)


async def test_parametrage_france_sans_alerte(hass: HomeAssistant, aioclient_mock):
    mock_country(aioclient_mock, "FR")
    result = await hass.config_entries.flow.async_init(DOMAIN, context={"source": config_entries.SOURCE_USER})
    assert result["type"] is FlowResultType.FORM and result["step_id"] == "user"
    done = await hass.config_entries.flow.async_configure(result["flow_id"], {CONF_COUNTRY: "fr"})
    assert done["type"] is FlowResultType.CREATE_ENTRY and done["data"] == {CONF_COUNTRY: "FR"}
    await hass.async_block_till_done()
    states = hass.states.async_all("binary_sensor")
    assert len(states) == 1
    st = states[0]
    assert st.state == "off" and st.attributes["alert_name"] == "Alerte Enlèvement" and st.attributes["phone"] == "197"
    # même pays une seconde fois : refusé
    again = await hass.config_entries.flow.async_init(DOMAIN, context={"source": config_entries.SOURCE_USER})
    dup = await hass.config_entries.flow.async_configure(again["flow_id"], {CONF_COUNTRY: "fr"})
    assert dup["type"] is FlowResultType.ABORT and dup["reason"] == "already_configured"


async def test_france_alerte_en_cours(hass: HomeAssistant, aioclient_mock):
    mock_country(aioclient_mock, "FR", recent_rss(
        ("Alerte enlèvement déclenchée pour une fillette de 4 ans", "franceinfo", 40),
        ("Alerte enlèvement : appel à témoins", "Le Parisien", 15),
    ))
    entry = MockConfigEntry(domain=DOMAIN, title="Alerte Enlèvement · France", data={CONF_COUNTRY: "FR"}, unique_id="FR")
    entry.add_to_hass(hass)
    assert await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()
    st = hass.states.async_all("binary_sensor")[0]
    assert st.state == "on" and st.attributes["method"] == "media"
    assert st.attributes["sources"] == ["Le Parisien", "franceinfo"]


async def test_etats_unis_avec_un_etat(hass: HomeAssistant, aioclient_mock):
    from datetime import UTC, datetime, timedelta

    sent = datetime.now(UTC) - timedelta(minutes=20)
    live = {"id": "urn:1", "event": NWS_EVENT, "headline": "Child Abduction Emergency issued by Texas DPS",
            "description": "AMBER Alert for a 5-year-old girl.", "areaDesc": "Harris, TX", "sent": sent.isoformat(),
            "expires": (sent + timedelta(hours=6)).isoformat(), "status": "Actual", "messageType": "Alert",
            "senderName": "Texas Department of Public Safety"}
    aioclient_mock.get(nws_url(NWS_URL, NWS_EVENT, "TX"), content=nws(live))
    mock_country(aioclient_mock, "US", region="Texas")
    result = await hass.config_entries.flow.async_init(DOMAIN, context={"source": config_entries.SOURCE_USER})
    step = await hass.config_entries.flow.async_configure(result["flow_id"], {CONF_COUNTRY: "us"})
    assert step["type"] is FlowResultType.FORM and step["step_id"] == "region"
    done = await hass.config_entries.flow.async_configure(step["flow_id"], {CONF_REGION: "TX"})
    assert done["type"] is FlowResultType.CREATE_ENTRY and done["data"] == {CONF_COUNTRY: "US", CONF_REGION: "TX"}
    await hass.async_block_till_done()
    st = hass.states.async_all("binary_sensor")[0]
    # alerte officielle (NWS) en cours, prioritaire sur les médias
    assert st.state == "on" and st.attributes["method"] == "official" and st.attributes["region"] == "Texas"


async def test_canada_sans_alerte_et_second_serveur(hass: HomeAssistant, aioclient_mock):
    aioclient_mock.get(NAAD_FEEDS[0], status=503)
    aioclient_mock.get(NAAD_FEEDS[1], content=EMPTY_ATOM)
    entry = MockConfigEntry(domain=DOMAIN, title="Alerte Enlèvement · Canada", data={CONF_COUNTRY: "CA"}, unique_id="CA")
    entry.add_to_hass(hass)
    assert await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()
    st = hass.states.async_all("binary_sensor")[0]
    assert st.state == "off" and st.attributes["phone"] == "911"


async def test_source_injoignable(hass: HomeAssistant, aioclient_mock):
    for search in COUNTRIES["BE"]["searches"]:
        aioclient_mock.get(news_url(NEWS_URL, search), status=503)
    entry = MockConfigEntry(domain=DOMAIN, title="Alerte Enlèvement · Belgique", data={CONF_COUNTRY: "BE"}, unique_id="BE")
    entry.add_to_hass(hass)
    assert not await hass.config_entries.async_setup(entry.entry_id)
    assert entry.state is config_entries.ConfigEntryState.SETUP_RETRY
