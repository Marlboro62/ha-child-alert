"""Lecture des sources et état de l'alerte (sans Home Assistant)."""
from datetime import UTC, datetime, timedelta
import json

import pytest

from custom_components.child_alert.const import COUNTRIES
from custom_components.child_alert.sources import (
    detect_naad,
    detect_news,
    detect_nws,
    news_url,
    nws_url,
    parse_naad,
    parse_news,
    parse_nws,
)

NOW = datetime(2026, 11, 18, 12, 0, tzinfo=UTC)


# ---------------------------------------------------------------- Canada (NAAD)

def naad_entry(title, minutes, msg="Alert", status="Actual", lang="fr-CA", expires_h=6, oid="1", event="amber"):
    upd = (NOW - timedelta(minutes=minutes)).isoformat()
    exp = (NOW - timedelta(minutes=minutes) + timedelta(hours=expires_h)).isoformat()
    summary = (f"Description: Enfant de 7 ans vu pour la dernière fois à Laval.&lt;br&gt;&lt;br&gt;###&lt;br&gt;"
               f"Expires: {exp}&lt;br&gt;Area: Laval")
    return f"""<entry><id>tag:x:urn:oid:{oid}</id><title>{title}</title><updated>{upd}</updated>
<author><name>Sûreté du Québec</name></author><link href="http://capcp.example/{oid}.xml" rel="alternate"/>
<summary type="html">{summary}</summary>
<category term="status={status}"/><category term="msgType={msg}"/><category term="language={lang}"/><category term="event={event}"/></entry>"""


def naad(*entries):
    return ('<?xml version="1.0"?><feed xmlns="http://www.w3.org/2005/Atom">' + "".join(entries) + "</feed>").encode()


def test_naad_en_cours():
    r = detect_naad(parse_naad(naad(
        naad_entry("Alerte AMBER - en vigueur", 30, oid="a1"),
        naad_entry("AMBER Alert - in effect", 30, lang="en-CA", oid="a1en"),
        naad_entry("Avertissement de pluie", 5, event="rainfall"),
    )), NOW)
    assert r["active"] and r["title"] == "Alerte AMBER - en vigueur" and r["area"] == "Laval"
    assert r["url"] is None  # lien vers le fichier CAP (XML) : non repris


def test_naad_terminee_test_expiree():
    assert not detect_naad(parse_naad(naad(
        naad_entry("Alerte AMBER - en vigueur", 60), naad_entry("Alerte AMBER - terminée", 5, msg="Cancel"))), NOW)["active"]
    assert not detect_naad(parse_naad(naad(naad_entry("Alerte AMBER - test", 5, status="Test"))), NOW)["active"]
    assert not detect_naad(parse_naad(naad(naad_entry("Alerte AMBER", 8 * 60, expires_h=2))), NOW)["active"]


def test_naad_illisible():
    with pytest.raises(ValueError):
        parse_naad(b"<!DOCTYPE html><html></html>")


# --------------------------------------------------------- États-Unis (NWS)

def nws(*alerts):
    return json.dumps({"type": "FeatureCollection", "features": [{"id": a.get("id", "x"), "properties": a} for a in alerts]}).encode()


def nws_alert(minutes, hours=6, status="Actual", msg="Alert", aid="urn:1"):
    sent = NOW - timedelta(minutes=minutes)
    return {"id": aid, "event": "Child Abduction Emergency", "headline": "Child Abduction Emergency issued by Texas DPS",
            "description": "The Texas Department of Public Safety has issued an AMBER Alert for a 5-year-old girl.",
            "instruction": "Call 911 with any information.", "areaDesc": "Harris, TX", "sent": sent.isoformat(),
            "expires": (sent + timedelta(hours=hours)).isoformat(), "status": status, "messageType": msg,
            "senderName": "Texas Department of Public Safety"}


def test_nws_en_cours_et_url():
    r = detect_nws(parse_nws(nws(nws_alert(20))), NOW)
    assert r["active"] and r["area"] == "Harris, TX" and "Call 911" in r["summary"]
    assert r["source"] == "Texas Department of Public Safety"
    assert "area=TX" in nws_url("https://api.weather.gov/alerts/active", "Child Abduction Emergency", "TX")


def test_nws_aucune_expiree_ou_exercice():
    assert not detect_nws(parse_nws(nws()), NOW)["active"]
    assert not detect_nws(parse_nws(nws(nws_alert(600, hours=2))), NOW)["active"]
    assert not detect_nws(parse_nws(nws(nws_alert(10, status="Exercise"))), NOW)["active"]
    with pytest.raises(ValueError):
        parse_nws(b"pas du json")


# ----------------------------------------------------------- Médias (Google Actualités)

def rss(*items):
    body = "".join(
        f"<item><title>{t} - {s}</title><link>https://news.google.com/rss/articles/{i}</link>"
        f"<pubDate>{(NOW - timedelta(minutes=m)).strftime('%a, %d %b %Y %H:%M:%S GMT')}</pubDate>"
        f'<source url="https://{s.lower().replace(" ", "")}.example">{s}</source></item>'
        for i, (t, s, m) in enumerate(items)
    )
    return f'<?xml version="1.0"?><rss version="2.0"><channel><title>Recherche</title>{body}</channel></rss>'.encode()


FR = COUNTRIES["FR"]


def test_titre_sans_le_media():
    arts = parse_news(rss(("Alerte enlèvement déclenchée pour une fillette de 4 ans", "franceinfo", 30)))
    assert arts[0]["title"] == "Alerte enlèvement déclenchée pour une fillette de 4 ans" and arts[0]["source"] == "franceinfo"


def test_france_deux_medias():
    r = detect_news(parse_news(rss(
        ("Alerte enlèvement déclenchée pour une fillette de 4 ans dans le Nord", "franceinfo", 60),
        ("Alerte enlèvement : ce que l'on sait de la disparition", "Le Parisien", 20),
    )), FR, NOW)
    assert r["active"] and r["sources"] == ["Le Parisien", "franceinfo"]
    assert r["title"] == "Alerte enlèvement : ce que l'on sait de la disparition"


def test_france_un_seul_media_ou_levee():
    assert not detect_news(parse_news(rss(("Alerte enlèvement déclenchée dans le Nord", "franceinfo", 30))), FR, NOW)["active"]
    r = detect_news(parse_news(rss(
        ("Alerte enlèvement déclenchée dans le Nord", "franceinfo", 120),
        ("Alerte enlèvement dans le Nord : l'enquête avance", "BFMTV", 90),
        ("Alerte enlèvement levée : la fillette retrouvée saine et sauve", "Le Monde", 10),
    )), FR, NOW)
    assert not r["active"] and r["ended"]


def test_france_articles_sur_le_dispositif_ou_anciens():
    assert not detect_news(parse_news(rss(
        ("Le dispositif Alerte enlèvement a 20 ans", "info.gouv.fr", 30),
        ("Une fausse alerte enlèvement vise la maire", "20 Minutes", 20),
        ("Alerte enlèvement déclenchée hier", "franceinfo", 60 * 9),
        ("Alerte enlèvement déclenchée hier soir", "BFMTV", 60 * 8),
    )), FR, NOW)["active"]


def test_pays_bas_alerte_etrangere_ignoree():
    nl = COUNTRIES["NL"]
    arts = parse_news(rss(
        ("Amber Alert in Texas voor vermist meisje", "NOS", 30),
        ("Amerikaanse Amber Alert na ontvoering", "NU.nl", 20),
    ), "nl")
    assert not detect_news(arts, nl, NOW)["active"]
    arts = parse_news(rss(
        ("Amber Alert uitgegeven voor vermiste jongen (6) uit Utrecht", "NOS", 30),
        ("Amber Alert: politie zoekt jongen uit Utrecht", "NU.nl", 20),
    ), "nl")
    assert detect_news(arts, nl, NOW)["active"]


def test_url_de_recherche_sur_24_heures():
    url = news_url("https://news.google.com/rss/search", COUNTRIES["US"]["searches"][0], "Texas")
    assert "when%3A1d" in url and "Texas" in url and "ceid=US%3Aen" in url


@pytest.mark.parametrize("code", sorted(COUNTRIES))
def test_chaque_pays_complet(code):
    c = COUNTRIES[code]
    assert c["name"] and c["alert"] and c["phone"] and c["source"] in ("news", "naad", "nws")
    if c["source"] == "news":
        assert c["searches"] and c["pattern"]
