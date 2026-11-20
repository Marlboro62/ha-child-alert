<p>
  ☕ <strong>Is deze kaart nuttig voor je? Je kunt het project steunen:</strong>
</p>

<div style="white-space: nowrap; line-height: 0;">
  <a
    href="https://www.buymeacoffee.com/Marlboro62"
    target="_blank"
    rel="noopener noreferrer"
    style="display: inline-block; text-decoration: none; vertical-align: middle;"
  ><img
    src="https://img.buymeacoffee.com/button-api/?text=Trakteer%20op%20koffie&emoji=%E2%98%95&slug=Marlboro62&button_colour=FF5F5F&font_colour=ffffff&font_family=Cookie&outline_colour=000000&coffee_colour=FFDD00"
    alt="Trakteer op koffie via Buy Me a Coffee"
    height="45"
    style="display: block; border: 0;"
  ></a>&nbsp;&nbsp;<a
    href="https://ko-fi.com/M4M2QL45X"
    target="_blank"
    rel="noopener noreferrer"
    style="display: inline-block; text-decoration: none; vertical-align: middle;"
  ><img
    src="https://storage.ko-fi.com/cdn/kofi6.png?v=6"
    alt="Steun het project op Ko-fi"
    height="45"
    style="display: block; border: 0;"
  ></a>
</div>

🌐 [Français](README.md) · [English](README.en.md) · **Nederlands** · [Deutsch](README.de.md) · [Español](README.es.md)

# Vermissingsalarm voor kinderen

<img src="images/brand/icon-256.png" alt="Pictogram vermissingsalarm" width="128" align="right">

Integratie en kaart voor Home Assistant die je waarschuwen zodra in je land een **alarm voor een vermist of ontvoerd kind** wordt uitgegeven: **AMBER Alert** (Nederland, Luxemburg), **Child Alert** (België), **Alerte Enlèvement** (Frankrijk), **AMBER Alert** (Verenigde Staten, Canada, Australië)…

Gemaakt voor: 🇳🇱 Nederland · 🇧🇪 België (Vlaanderen) (en alle andere landen in de tabel hieronder).

Bij de installatie kies je **je land** (en in de Verenigde Staten je staat). Zolang er een alarm loopt:

- gaat de sensor **Alarm kinderontvoering** aan ("Gedetecteerd"), met de titel, het gebied, de foto en de link als de bron die geeft;
- opent een **venster** boven Home Assistant, op elk apparaat, met het **nummer om te bellen**; **Gelezen** sluit het voor dat alarm;
- toont de **kaart** het alarm in het rood; zonder alarm een eenvoudige melding "geen alarm" (of helemaal niets, naar keuze).

> **Taal:** de installatieschermen, de naam van de sensor, de kaart en het venster volgen de taal van Home Assistant: Nederlands, Frans, Engels, Duits of Spaans (Engels voor elke andere taal). De tekst van het alarm zelf (titel, samenvatting, gebied) blijft in de taal van de bron.

**🎮 [Probeer de online demo](https://marlboro62.github.io/ha-child-alert/docs/demo.html)**: de echte kaart en het venster voor elk van de 11 landen, met verzonnen alarmen (geen alarm, actief alarm, bron niet bereikbaar; donker, licht of het thema van Home Assistant).

> **Onofficiële integratie**, zonder band met de overheid of met de genoemde media. Ze vervangt de officiële kanalen niet (NL-Alert, BE-Alert, de AMBER Alert-app…). Heb je informatie? Bel altijd het **nummer in het alarm** en grijp nooit zelf in.

## Landen en bronnen

| Land | Alarm | Bron | Getoond nummer |
| --- | --- | --- | --- |
| Nederland | AMBER Alert | media | 112 |
| België | Child Alert | media (Franstalig en Nederlandstalig) | 112 |
| Luxemburg | AMBER Alert | media | 113 |
| Frankrijk | Alerte Enlèvement | media | 197 |
| Zwitserland | Alerte enlèvement · Entführungsalarm | media (Franstalig en Duitstalig) | 117 |
| Verenigd Koninkrijk | Child Rescue Alert | media | 999 |
| Ierland | Child Abduction Alert | media | 999 |
| Canada | AMBER Alert · Alerte AMBER | **officieel**: nationale feed En Alerte / Alert Ready (NAAD) | 911 |
| Verenigde Staten | AMBER Alert | **officieel**: "Child Abduction Emergency"-meldingen van de nationale weerdienst (NWS); met een gekozen staat ook de media van die staat | 911 |
| Mexico | Alerta Amber | media | 911 |
| Australië | AMBER Alert | media | 000 |

**Officiële bronnen**: elke 5 minuten gecontroleerd.

**Media**: in deze landen heeft het alarmsysteem geen feed of API. De integratie zoekt elke 10 minuten naar de naam van het alarm in de koppen van de media van het land (Google Nieuws, laatste 24 uur). Het alarm geldt als **actief** wanneer **minstens twee verschillende media** het in de laatste 6 uur melden, en als **beëindigd** zodra een kop meldt dat het is ingetrokken (kind gevonden, alarm ingetrokken). Artikelen over het systeem zelf (verjaardag, balans, vals alarm) worden genegeerd. Deze detectie kan enkele minuten achterlopen op de officiële verspreiding: controleer altijd de officiële pagina.

Mis je een land? Stel het voor in de [GitHub-issues](https://github.com/Marlboro62/ha-child-alert/issues), met de exacte naam van het alarm en, als die bestaat, de officiële feed.

## Installatie

1. **Instellingen › Marketplace** (of HACS vóór 2026.11): zoek **Alerte Enlèvement**, installeer het en herstart Home Assistant.
2. **Instellingen › Apparaten & diensten › Integratie toevoegen** › **Alerte Enlèvement**, en kies je land (het land van Home Assistant wordt voorgesteld). In de Verenigde Staten kies je daarna je staat, of "—" voor alle staten.

Je kunt de integratie meerdere keren toevoegen om meerdere landen te volgen (bijvoorbeeld Nederland en België in de grensstreek).

De kaart wordt automatisch door de integratie geladen: **geen resource toe te voegen**.

## De kaart

Voeg de kaart **Alerte Enlèvement** toe aan een dashboard, of in YAML:

```yaml
type: custom:child-alert-card
```

| Optie | Functie | Standaard |
| --- | --- | --- |
| `entity` | Sensor van het alarm (`binary_sensor.…`) | de eerste die gevonden wordt |
| `title` | Titel van de kaart | naam van het alarm in het land |
| `show_when_clear` | Kaart tonen als er geen alarm loopt (`false`: de kaart verschijnt alleen tijdens een alarm) | `true` |
| `show_image` | Foto die met het alarm wordt verspreid, als de bron er een geeft | `true` |
| `theme` | `v2` (donker, zoals mijn andere kaarten), `auto` (licht of donker volgens Home Assistant) of `ha` (thema van Home Assistant) | `v2` |

## De sensor

`binary_sensor.alerte_enlevement_…`: **aan** tijdens een alarm. Attributen: `title`, `summary`, `area`, `image`, `url`, `since`, `expires`, `sources`, `method` (`official` of `media`), `alert_name`, `phone`, `country_name`, `region`, `checked` (laatste controle) en `errors` (bron niet bereikbaar).

Voorbeeld van een automatisering: een melding op de telefoon zodra een alarm wordt uitgegeven.

```yaml
alias: Alarm kinderontvoering - melding
triggers:
  - trigger: state
    entity_id: binary_sensor.alerte_enlevement_pays_bas_alarm_kinderontvoering
    to: "on"
actions:
  - action: notify.mobile_app_mijn_telefoon
    data:
      title: "⚠️ {{ state_attr(trigger.entity_id, 'alert_name') }}"
      message: >-
        {{ state_attr(trigger.entity_id, 'title') }}
        Informatie: bel {{ state_attr(trigger.entity_id, 'phone') }}.
      data:
        priority: high
        url: "{{ state_attr(trigger.entity_id, 'url') }}"
```

Vervang de namen van de sensor en de telefoon door die van jou (**Ontwikkelhulpmiddelen › Toestanden**).

## Feedback en bugs

Alleen via de [GitHub-issues](https://github.com/Marlboro62/ha-child-alert/issues).

## Licentie

MIT. De alarmen blijven eigendom van wie ze uitgeeft (overheid, media); de integratie bewaart geen kopie buiten het lopende alarm.
