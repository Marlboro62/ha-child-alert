<p>
  ☕ <strong>If this card is useful to you, you can support the project:</strong>
</p>

<div style="white-space: nowrap; line-height: 0;">
  <a
    href="https://www.buymeacoffee.com/Marlboro62"
    target="_blank"
    rel="noopener noreferrer"
    style="display: inline-block; text-decoration: none; vertical-align: middle;"
  ><img
    src="https://img.buymeacoffee.com/button-api/?text=Buy%20me%20a%20coffee&emoji=%E2%98%95&slug=Marlboro62&button_colour=FF5F5F&font_colour=ffffff&font_family=Cookie&outline_colour=000000&coffee_colour=FFDD00"
    alt="Buy me a coffee"
    height="45"
    style="display: block; border: 0;"
  ></a>&nbsp;&nbsp;<a
    href="https://ko-fi.com/M4M2QL45X"
    target="_blank"
    rel="noopener noreferrer"
    style="display: inline-block; text-decoration: none; vertical-align: middle;"
  ><img
    src="https://storage.ko-fi.com/cdn/kofi6.png?v=6"
    alt="Support the project on Ko-fi"
    height="45"
    style="display: block; border: 0;"
  ></a>
</div>

🌐 [Français](README.md) · **English** · [Nederlands](README.nl.md) · [Deutsch](README.de.md) · [Español](README.es.md)

# Child Abduction Alert

Home Assistant integration and card that warn you when a **child abduction alert** is issued in your country: **AMBER Alert** (United States, Canada, Australia, Netherlands, Luxembourg), **Child Rescue Alert** (United Kingdom), **Child Abduction Alert** (Ireland), **Alerte Enlèvement** (France), **Child Alert** (Belgium)…

Made for: 🇺🇸 United States · 🇨🇦 Canada · 🇬🇧 United Kingdom · 🇮🇪 Ireland · 🇦🇺 Australia (and every other country in the table below).

During setup you pick **your country** (and, in the United States, your state). While an alert is active:

- the **Child abduction alert** sensor turns on ("Detected"), with the title, area, photo and link when the source provides them;
- a **pop-up** opens on top of Home Assistant, on every device, with the **number to call**; « J'ai pris connaissance » ("I have read it") closes it for that alert;
- the **card** shows the alert in red; with no alert, a simple "no alert in progress" message (or nothing at all, your choice).

> **Language:** the setup screens and the sensor name follow your Home Assistant language (English or French). The card and the pop-up are **in French for now**.

**🎮 [Try the online demo](https://marlboro62.github.io/ha-child-alert/docs/demo.html)**: the real card and pop-up for each of the 11 countries, with fictional alerts (no alert, active alert, source unavailable; dark, light or Home Assistant theme).

> **Unofficial integration**, not affiliated with any authority or with the media mentioned. It does not replace official channels (Wireless Emergency Alerts, Alert Ready, Emergency Alert…). If you have information, always call the **number given in the alert** and never intervene yourself.

## Countries and sources

| Country | Alert | Source | Number shown |
| --- | --- | --- | --- |
| Canada | AMBER Alert · Alerte AMBER | **official**: national Alert Ready feed (NAAD) | 911 |
| United States | AMBER Alert | **official**: "Child Abduction Emergency" alerts from the National Weather Service (NWS); with a state selected, also that state's media | 911 |
| France | Alerte Enlèvement | media | 197 |
| Belgium | Child Alert | media (French and Dutch speaking) | 112 |
| Switzerland | Alerte enlèvement · Entführungsalarm | media (French and German speaking) | 117 |
| Luxembourg | AMBER Alert | media | 113 |
| Netherlands | AMBER Alert | media | 112 |
| United Kingdom | Child Rescue Alert | media | 999 |
| Ireland | Child Abduction Alert | media | 999 |
| Mexico | Alerta Amber | media | 911 |
| Australia | AMBER Alert | media | 000 |

**Official sources**: checked every 5 minutes.

**Media**: in these countries the alert system has no feed or API. The integration looks for the alert's name in the headlines of the country's media (Google News, last 24 hours), every 10 minutes. The alert is considered **active** when **at least two different outlets** report it within the last 6 hours, and **over** as soon as a headline announces it has been lifted (child found, alert cancelled). Articles about the system itself (anniversary, statistics, false alarm) are ignored. This detection can lag a few minutes behind the official broadcast: always check the official page.

Missing a country? Suggest it in the [GitHub issues](https://github.com/Marlboro62/ha-child-alert/issues), with the exact name of the alert and, if there is one, its official feed.

## Installation

1. **Settings › Marketplace** (or HACS before 2026.11) › ⋮ menu › **Custom repositories**: add `https://github.com/Marlboro62/ha-child-alert`, type **Integration**.
2. Install **Alerte Enlèvement**, then restart Home Assistant.
3. **Settings › Devices & services › Add integration** › **Alerte Enlèvement**, then pick your country (your Home Assistant country is suggested). In the United States, then pick your state, or "—" for all of them.

You can add the integration several times to follow several countries (for example the United States and Canada near the border).

The card is loaded automatically by the integration: **no resource to add**.

## The card

Add the **Alerte Enlèvement** card to a dashboard, or in YAML:

```yaml
type: custom:child-alert-card
```

| Option | Role | Default |
| --- | --- | --- |
| `entity` | Alert sensor (`binary_sensor.…`) | the first one found |
| `title` | Card title | the country's alert name |
| `show_when_clear` | Show the card when no alert is active (`false`: the card only appears during an alert) | `true` |
| `show_image` | Photo published with the alert, when the source provides one | `true` |
| `theme` | `v2` (dark, like my other cards), `auto` (light or dark following Home Assistant) or `ha` (Home Assistant theme) | `v2` |

## The sensor

`binary_sensor.alerte_enlevement_…`: **on** during an alert. Its attributes: `title`, `summary`, `area`, `image`, `url`, `since`, `expires`, `sources`, `method` (`official` or `media`), `alert_name`, `phone`, `country_name`, `region`, `checked` (last check) and `errors` (unreachable source).

Example automation: a phone notification when an alert is issued.

```yaml
alias: Child abduction alert - notification
triggers:
  - trigger: state
    entity_id: binary_sensor.alerte_enlevement_etats_unis_child_abduction_alert
    to: "on"
actions:
  - action: notify.mobile_app_my_phone
    data:
      title: "⚠️ {{ state_attr(trigger.entity_id, 'alert_name') }}"
      message: >-
        {{ state_attr(trigger.entity_id, 'title') }}
        Information: call {{ state_attr(trigger.entity_id, 'phone') }}.
      data:
        priority: high
        url: "{{ state_attr(trigger.entity_id, 'url') }}"
```

Replace the sensor and phone names with yours (**Developer tools › States**).

## Feedback and bugs

Only through the [GitHub issues](https://github.com/Marlboro62/ha-child-alert/issues).

## License

MIT. Alerts remain the property of their issuers (authorities, media); the integration keeps no copy beyond the active alert.
