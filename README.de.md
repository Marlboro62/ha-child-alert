<p>
  ☕ <strong>Wenn dir diese Karte nützt, kannst du das Projekt unterstützen:</strong>
</p>

<div style="white-space: nowrap; line-height: 0;">
  <a
    href="https://www.buymeacoffee.com/Marlboro62"
    target="_blank"
    rel="noopener noreferrer"
    style="display: inline-block; text-decoration: none; vertical-align: middle;"
  ><img
    src="https://img.buymeacoffee.com/button-api/?text=Spendier%20einen%20Kaffee&emoji=%E2%98%95&slug=Marlboro62&button_colour=FF5F5F&font_colour=ffffff&font_family=Cookie&outline_colour=000000&coffee_colour=FFDD00"
    alt="Einen Kaffee spendieren über Buy Me a Coffee"
    height="45"
    style="display: block; border: 0;"
  ></a>&nbsp;&nbsp;<a
    href="https://ko-fi.com/M4M2QL45X"
    target="_blank"
    rel="noopener noreferrer"
    style="display: inline-block; text-decoration: none; vertical-align: middle;"
  ><img
    src="https://storage.ko-fi.com/cdn/kofi6.png?v=6"
    alt="Das Projekt auf Ko-fi unterstützen"
    height="45"
    style="display: block; border: 0;"
  ></a>
</div>

🌐 [Français](README.md) · [English](README.en.md) · [Nederlands](README.nl.md) · **Deutsch** · [Español](README.es.md)

# Entführungsalarm

Integration und Karte für Home Assistant, die dich warnen, sobald in deinem Land ein **Alarm wegen einer Kindesentführung** ausgelöst wird: **Entführungsalarm · Alerte enlèvement** (Schweiz), **AMBER Alert** (Luxemburg, Niederlande, USA, Kanada, Australien), **Alerte Enlèvement** (Frankreich), **Child Alert** (Belgien)…

Gemacht für: 🇨🇭 Schweiz · 🇱🇺 Luxemburg (und alle anderen Länder der Tabelle unten).

Bei der Einrichtung wählst du **dein Land** (in den USA zusätzlich deinen Bundesstaat). Solange ein Alarm läuft:

- schaltet der Sensor **Entführungsalarm** auf „Erkannt“, mit Titel, Gebiet, Foto und Link, wenn die Quelle sie liefert;
- öffnet sich ein **Fenster** über Home Assistant, auf jedem Gerät, mit der **Nummer, die du anrufen sollst**; **Zur Kenntnis genommen** schließt es für diesen Alarm;
- zeigt die **Karte** den Alarm in Rot; ohne Alarm eine einfache Meldung „kein Alarm“ (oder gar nichts, nach Wahl).

> **Sprache:** Einrichtungsdialog, Sensorname, Karte und Fenster folgen der Sprache von Home Assistant: Deutsch, Französisch, Englisch, Niederländisch oder Spanisch (Englisch für jede andere Sprache). Der Text des Alarms selbst (Titel, Zusammenfassung, Gebiet) bleibt in der Sprache der Quelle.

**🎮 [Online-Demo ausprobieren](https://marlboro62.github.io/ha-child-alert/docs/demo.html)**: die echte Karte und das Alarmfenster für jedes der 11 Länder, mit erfundenen Alarmen (kein Alarm, laufender Alarm, Quelle nicht erreichbar; dunkles, helles oder Home-Assistant-Design).

> **Inoffizielle Integration**, ohne Verbindung zu Behörden oder den genannten Medien. Sie ersetzt die offiziellen Kanäle nicht (Alertswiss, GouvAlert…). Wenn du etwas weißt, ruf immer die **im Alarm angegebene Nummer** an und greif nie selbst ein.

## Länder und Quellen

| Land | Alarm | Quelle | Angezeigte Nummer |
| --- | --- | --- | --- |
| Schweiz | Alerte enlèvement · Entführungsalarm | Medien (französisch- und deutschsprachig) | 117 |
| Luxemburg | AMBER Alert | Medien | 113 |
| Frankreich | Alerte Enlèvement | Medien | 197 |
| Belgien | Child Alert | Medien (französisch- und niederländischsprachig) | 112 |
| Niederlande | AMBER Alert | Medien | 112 |
| Vereinigtes Königreich | Child Rescue Alert | Medien | 999 |
| Irland | Child Abduction Alert | Medien | 999 |
| Kanada | AMBER Alert · Alerte AMBER | **offiziell**: nationaler Feed En Alerte / Alert Ready (NAAD) | 911 |
| USA | AMBER Alert | **offiziell**: „Child Abduction Emergency“-Meldungen des nationalen Wetterdienstes (NWS); mit gewähltem Bundesstaat auch dessen Medien | 911 |
| Mexiko | Alerta Amber | Medien | 911 |
| Australien | AMBER Alert | Medien | 000 |

**Offizielle Quellen**: alle 5 Minuten abgefragt.

**Medien**: In diesen Ländern hat das Alarmsystem weder Feed noch API. Die Integration sucht alle 10 Minuten nach dem Namen des Alarms in den Schlagzeilen der Medien des Landes (Google News, letzte 24 Stunden). Der Alarm gilt als **laufend**, wenn **mindestens zwei verschiedene Medien** ihn in den letzten 6 Stunden melden, und als **beendet**, sobald eine Schlagzeile seine Aufhebung meldet (Kind gefunden, Alarm aufgehoben). Artikel über das System selbst (Jahrestag, Bilanz, Fehlalarm) werden ignoriert. Diese Erkennung kann einige Minuten hinter der offiziellen Verbreitung liegen: prüf immer die offizielle Seite.

Fehlt ein Land? Schlag es in den [GitHub-Issues](https://github.com/Marlboro62/ha-child-alert/issues) vor, mit dem genauen Namen des Alarms und, falls vorhanden, seinem offiziellen Feed.

## Installation

1. **Einstellungen › Marketplace** (oder HACS vor 2026.11) › Menü ⋮ › **Benutzerdefinierte Repositories**: `https://github.com/Marlboro62/ha-child-alert` hinzufügen, Typ **Integration**.
2. **Alerte Enlèvement** installieren und Home Assistant neu starten.
3. **Einstellungen › Geräte & Dienste › Integration hinzufügen** › **Alerte Enlèvement**, dann dein Land wählen (das Land von Home Assistant ist vorgeschlagen). In den USA danach deinen Bundesstaat wählen, oder „—“ für alle.

Du kannst die Integration mehrmals hinzufügen, um mehrere Länder zu verfolgen (zum Beispiel Schweiz und Frankreich als Grenzgänger).

Die Karte wird von der Integration automatisch geladen: **keine Ressource hinzuzufügen**.

## Die Karte

Füge die Karte **Alerte Enlèvement** zu einem Dashboard hinzu, oder in YAML:

```yaml
type: custom:child-alert-card
```

| Option | Funktion | Standard |
| --- | --- | --- |
| `entity` | Sensor des Alarms (`binary_sensor.…`) | der erste gefundene |
| `title` | Titel der Karte | Name des Alarms im Land |
| `show_when_clear` | Karte auch ohne laufenden Alarm anzeigen (`false`: die Karte erscheint nur während eines Alarms) | `true` |
| `show_image` | Mit dem Alarm verbreitetes Foto, wenn die Quelle eines liefert | `true` |
| `theme` | `v2` (dunkel, wie meine anderen Karten), `auto` (hell oder dunkel nach Home Assistant) oder `ha` (Design von Home Assistant) | `v2` |

## Der Sensor

`binary_sensor.alerte_enlevement_…`: **an** während eines Alarms. Attribute: `title`, `summary`, `area`, `image`, `url`, `since`, `expires`, `sources`, `method` (`official` oder `media`), `alert_name`, `phone`, `country_name`, `region`, `checked` (letzte Prüfung) und `errors` (Quelle nicht erreichbar).

Beispiel einer Automatisierung: eine Benachrichtigung aufs Handy, sobald ein Alarm ausgelöst wird.

```yaml
alias: Entführungsalarm - Benachrichtigung
triggers:
  - trigger: state
    entity_id: binary_sensor.alerte_enlevement_suisse_entfuhrungsalarm
    to: "on"
actions:
  - action: notify.mobile_app_mein_handy
    data:
      title: "⚠️ {{ state_attr(trigger.entity_id, 'alert_name') }}"
      message: >-
        {{ state_attr(trigger.entity_id, 'title') }}
        Hinweise: {{ state_attr(trigger.entity_id, 'phone') }} anrufen.
      data:
        priority: high
        url: "{{ state_attr(trigger.entity_id, 'url') }}"
```

Ersetze die Namen von Sensor und Handy durch deine eigenen (**Entwicklerwerkzeuge › Zustände**).

## Rückmeldungen und Fehler

Nur über die [GitHub-Issues](https://github.com/Marlboro62/ha-child-alert/issues).

## Lizenz

MIT. Die Alarme bleiben Eigentum ihrer Herausgeber (Behörden, Medien); die Integration speichert keine Kopie über den laufenden Alarm hinaus.
