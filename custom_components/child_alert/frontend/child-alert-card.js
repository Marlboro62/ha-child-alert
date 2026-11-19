/*
 * Carte Alerte Enlèvement — custom:child-alert-card
 *
 * Affiche le capteur de l'intégration Alerte Enlèvement (non officielle) : alerte d'enlèvement d'enfant en cours
 * (AMBER Alert et équivalents) dans le pays choisi, avec le numéro à appeler. Sans alerte, un simple état « aucune
 * alerte » (ou rien, avec show_when_clear: false).
 * Une alerte en cours ouvre aussi une fenêtre par-dessus Home Assistant, sur chaque appareil.
 * Chargée automatiquement par l'intégration : aucune ressource à ajouter.
 *
 * © 2026 Marlboro62.
 */
(() => {
const CARD_VERSION = "0.2.0-beta.1";

const DEFAULTS = {
  entity: "",
  title: "",
  show_when_clear: true,
  show_image: true,
  theme: "v2",
};

const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const safeUrl = (u) => (typeof u === "string" && /^https?:\/\/[^\s"'<>]+$/.test(u) ? u : "");
const store = {
  get(k, d) { try { const v = JSON.parse(window.localStorage.getItem(k)); return v ?? d; } catch (e) { return d; } },
  set(k, v) { try { window.localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* stockage indisponible */ } },
};

/* ------------------------------------------------------------ langues
 * La carte et la fenêtre suivent la langue de Home Assistant (profil de l'utilisateur) : français, anglais,
 * néerlandais, allemand ou espagnol ; toute autre langue prend l'anglais. Les textes de l'alerte elle-même
 * (titre, résumé, secteur) restent dans la langue de la source.
 */
const I18N = {
  fr: {
    now: "à l'instant", min: (n) => `il y a ${n} min`, hours: (n) => `il y a ${n} h`,
    alert: "Alerte enlèvement", default_title: "Une alerte d'enlèvement d'enfant est en cours.",
    photo: "Photo diffusée avec l'alerte", area: "Secteur :",
    call: (p) => `Si vous avez une information : <b>appelez le ${p}</b>, ou le numéro indiqué dans l'alerte.`,
    dont: "N'intervenez pas vous-même.", since: "depuis", since_cap: "Depuis", until: "jusqu'à",
    media_pop: "repérée dans les titres des médias : vérifiez sur la page officielle",
    media_card: (s) => `Repérée dans les titres de : ${s}. Vérifiez sur la page officielle.`, source: "Source :",
    read: "Lire l'alerte", ack: "J'ai pris connaissance",
    no_sensor: "Aucun capteur d'alerte",
    no_sensor_help: "Ajoutez l'intégration <b>Alerte Enlèvement</b> (Paramètres › Appareils et services) et choisissez votre pays.",
    on: "En cours", off: "Aucune alerte", clear: "Aucune alerte d'enlèvement en cours",
    checked: (t) => `Vérifié ${t}`, checking: "Vérification en cours…", ended: (t) => `dernière alerte terminée ${t}`,
    unavailable: "Source indisponible :",
    src: { naad: "En Alerte (officiel)", nws: "National Weather Service (officiel)", news: "médias du pays" },
    ed: { entity: "Capteur de l'alerte (vide : le premier trouvé)", title: "Titre (vide : nom de l'alerte du pays)",
      show_when_clear: "Afficher la carte sans alerte en cours", show_image: "Photo diffusée avec l'alerte", theme: "Couleurs de la carte",
      v2: "Sombre (cartes Marlboro62)", auto: "Automatique (clair ou sombre)", ha: "Thème de Home Assistant" },
    desc: "Alerte d'enlèvement d'enfant en cours dans votre pays (AMBER Alert et équivalents), avec le numéro à appeler.",
  },
  en: {
    now: "just now", min: (n) => `${n} min ago`, hours: (n) => `${n} h ago`,
    alert: "Child abduction alert", default_title: "A child abduction alert is in progress.",
    photo: "Photo published with the alert", area: "Area:",
    call: (p) => `If you have any information: <b>call ${p}</b>, or the number given in the alert.`,
    dont: "Do not intervene yourself.", since: "since", since_cap: "Since", until: "until",
    media_pop: "spotted in media headlines: check the official page",
    media_card: (s) => `Spotted in the headlines of: ${s}. Check the official page.`, source: "Source:",
    read: "Read the alert", ack: "I have read it",
    no_sensor: "No alert sensor",
    no_sensor_help: "Add the <b>Alerte Enlèvement</b> integration (Settings › Devices & services) and pick your country.",
    on: "Active", off: "No alert", clear: "No child abduction alert in progress",
    checked: (t) => `Checked ${t}`, checking: "Checking…", ended: (t) => `last alert ended ${t}`,
    unavailable: "Source unavailable:",
    src: { naad: "Alert Ready (official)", nws: "National Weather Service (official)", news: "national media" },
    ed: { entity: "Alert sensor (empty: the first one found)", title: "Title (empty: the country's alert name)",
      show_when_clear: "Show the card when no alert is active", show_image: "Photo published with the alert", theme: "Card colours",
      v2: "Dark (Marlboro62 cards)", auto: "Automatic (light or dark)", ha: "Home Assistant theme" },
    desc: "Child abduction alert in progress in your country (AMBER Alert and equivalents), with the number to call.",
  },
  nl: {
    now: "zojuist", min: (n) => `${n} min geleden`, hours: (n) => `${n} u geleden`,
    alert: "Alarm kinderontvoering", default_title: "Er loopt een alarm voor een vermist of ontvoerd kind.",
    photo: "Foto verspreid met het alarm", area: "Gebied:",
    call: (p) => `Heb je informatie? <b>Bel ${p}</b>, of het nummer in het alarm.`,
    dont: "Grijp niet zelf in.", since: "sinds", since_cap: "Sinds", until: "tot",
    media_pop: "gevonden in de krantenkoppen: controleer de officiële pagina",
    media_card: (s) => `Gevonden in de koppen van: ${s}. Controleer de officiële pagina.`, source: "Bron:",
    read: "Lees het alarm", ack: "Gelezen",
    no_sensor: "Geen alarmsensor",
    no_sensor_help: "Voeg de integratie <b>Alerte Enlèvement</b> toe (Instellingen › Apparaten & diensten) en kies je land.",
    on: "Actief", off: "Geen alarm", clear: "Geen alarm voor kinderontvoering",
    checked: (t) => `Gecontroleerd ${t}`, checking: "Bezig met controleren…", ended: (t) => `laatste alarm beëindigd ${t}`,
    unavailable: "Bron niet bereikbaar:",
    src: { naad: "Alert Ready (officieel)", nws: "National Weather Service (officieel)", news: "media van het land" },
    ed: { entity: "Sensor van het alarm (leeg: de eerste die gevonden wordt)", title: "Titel (leeg: naam van het alarm in het land)",
      show_when_clear: "Kaart tonen zonder lopend alarm", show_image: "Foto verspreid met het alarm", theme: "Kleuren van de kaart",
      v2: "Donker (kaarten van Marlboro62)", auto: "Automatisch (licht of donker)", ha: "Thema van Home Assistant" },
    desc: "Lopend alarm voor kinderontvoering in je land (AMBER Alert en vergelijkbaar), met het nummer om te bellen.",
  },
  de: {
    now: "gerade eben", min: (n) => `vor ${n} Min.`, hours: (n) => `vor ${n} Std.`,
    alert: "Entführungsalarm", default_title: "Ein Alarm wegen einer Kindesentführung läuft.",
    photo: "Mit dem Alarm verbreitetes Foto", area: "Gebiet:",
    call: (p) => `Wenn du etwas weißt: <b>ruf ${p} an</b> oder die im Alarm angegebene Nummer.`,
    dont: "Greif nicht selbst ein.", since: "seit", since_cap: "Seit", until: "bis",
    media_pop: "in den Schlagzeilen der Medien gefunden: prüf die offizielle Seite",
    media_card: (s) => `Gefunden in den Schlagzeilen von: ${s}. Prüf die offizielle Seite.`, source: "Quelle:",
    read: "Alarm lesen", ack: "Zur Kenntnis genommen",
    no_sensor: "Kein Alarmsensor",
    no_sensor_help: "Füge die Integration <b>Alerte Enlèvement</b> hinzu (Einstellungen › Geräte & Dienste) und wähle dein Land.",
    on: "Läuft", off: "Kein Alarm", clear: "Kein Entführungsalarm",
    checked: (t) => `Geprüft ${t}`, checking: "Wird geprüft…", ended: (t) => `letzter Alarm beendet ${t}`,
    unavailable: "Quelle nicht erreichbar:",
    src: { naad: "Alert Ready (offiziell)", nws: "National Weather Service (offiziell)", news: "Medien des Landes" },
    ed: { entity: "Sensor des Alarms (leer: der erste gefundene)", title: "Titel (leer: Name des Alarms im Land)",
      show_when_clear: "Karte ohne laufenden Alarm anzeigen", show_image: "Mit dem Alarm verbreitetes Foto", theme: "Farben der Karte",
      v2: "Dunkel (Karten von Marlboro62)", auto: "Automatisch (hell oder dunkel)", ha: "Design von Home Assistant" },
    desc: "Laufender Entführungsalarm in deinem Land (AMBER Alert und Entsprechungen), mit der Nummer zum Anrufen.",
  },
  es: {
    now: "ahora mismo", min: (n) => `hace ${n} min`, hours: (n) => `hace ${n} h`,
    alert: "Alerta Amber", default_title: "Hay una alerta activa por la desaparición o sustracción de un niño.",
    photo: "Foto difundida con la alerta", area: "Zona:",
    call: (p) => `Si tienes información: <b>llama al ${p}</b>, o al número indicado en la alerta.`,
    dont: "No intervengas por tu cuenta.", since: "desde", since_cap: "Desde", until: "hasta",
    media_pop: "detectada en los titulares de los medios: consulta la página oficial",
    media_card: (s) => `Detectada en los titulares de: ${s}. Consulta la página oficial.`, source: "Fuente:",
    read: "Leer la alerta", ack: "Enterado",
    no_sensor: "Ningún sensor de alerta",
    no_sensor_help: "Añade la integración <b>Alerte Enlèvement</b> (Ajustes › Dispositivos y servicios) y elige tu país.",
    on: "Activa", off: "Sin alerta", clear: "Ninguna alerta Amber activa",
    checked: (t) => `Comprobado ${t}`, checking: "Comprobando…", ended: (t) => `última alerta terminada ${t}`,
    unavailable: "Fuente no disponible:",
    src: { naad: "Alert Ready (oficial)", nws: "National Weather Service (oficial)", news: "medios del país" },
    ed: { entity: "Sensor de la alerta (vacío: el primero encontrado)", title: "Título (vacío: nombre de la alerta del país)",
      show_when_clear: "Mostrar la tarjeta sin alerta activa", show_image: "Foto difundida con la alerta", theme: "Colores de la tarjeta",
      v2: "Oscuro (tarjetas de Marlboro62)", auto: "Automático (claro u oscuro)", ha: "Tema de Home Assistant" },
    desc: "Alerta por sustracción de un niño activa en tu país (AMBER Alert y equivalentes), con el número al que llamar.",
  },
};
const langOf = (hass) => {
  const l = String(hass?.locale?.language || hass?.language || (typeof navigator !== "undefined" ? navigator.language : "") || "")
    .slice(0, 2).toLowerCase();
  return I18N[l] ? l : "en";
};
const tr = (lang) => I18N[lang] || I18N.en;
/** Nom du pays dans la langue de l'interface (Intl), sinon celui envoyé par l'intégration. */
const countryName = (a, lang) => {
  try { return (a.country && new Intl.DisplayNames([lang], { type: "region" }).of(a.country)) || a.country_name || ""; }
  catch (e) { return a.country_name || ""; }
};
const sourceLabel = (a, lang) => tr(lang).src[a.source_kind] || a.source_type || "";

function ago(iso, lang = "fr") {
  const t = iso ? new Date(iso).getTime() : NaN;
  if (!Number.isFinite(t)) return "";
  const T = tr(lang);
  const s = Math.max(0, (Date.now() - t) / 1000);
  if (s < 60) return T.now;
  if (s < 3600) return T.min(Math.floor(s / 60));
  if (s < 86400) return T.hours(Math.floor(s / 3600));
  return new Date(t).toLocaleDateString(lang, { day: "numeric", month: "short" });
}
const fullDate = (iso, lang = "fr") => {
  const d = iso ? new Date(iso) : null;
  return d && Number.isFinite(d.getTime())
    ? d.toLocaleString(lang, { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" }) : "";
};

/** Capteurs de l'intégration (un par pays ou État suivi). */
const alertIds = (hass) => Object.keys(hass?.entities || {})
  .filter((e) => e.startsWith("binary_sensor.") && hass.entities[e].platform === "child_alert");
const where = (a, lang = "fr") => [countryName(a, lang), a.region].filter(Boolean).join(" · ");

/* ------------------------------------------------ fenêtre d'alerte
 * Ouverte par-dessus Home Assistant, quelle que soit la vue affichée et sur chaque appareil. « J'ai pris
 * connaissance » la ferme pour cette alerte, sur cet appareil.
 */
const popup = {
  started: false,
  start() {
    if (this.started || typeof document === "undefined") return;
    this.started = true;
    setInterval(() => this.check(), 5000);
    this.check();
  },
  check() {
    const hass = document.querySelector("home-assistant")?.hass;
    const st = alertIds(hass).map((id) => hass.states[id]).find((s) => s && s.state === "on");
    const a = st?.attributes || {};
    const key = `child-alert:vue:${a.country || ""}:${a.alert_id || ""}`;
    if (!st || store.get(key, false)) { if (!st) this.close(); return; }
    if (document.getElementById("child-alert-pop")) return;
    const img = safeUrl(a.image), url = safeUrl(a.url);
    const lang = langOf(hass), T = tr(lang);
    const box = document.createElement("div");
    box.lang = lang;
    box.id = "child-alert-pop";
    box.setAttribute("role", "alertdialog");
    box.setAttribute("aria-modal", "true");
    box.setAttribute("aria-labelledby", "child-alert-pop-t");
    box.innerHTML = `<style>
      #child-alert-pop { position: fixed; inset: 0; z-index: 2147483000; display: grid; place-items: center; padding: 16px;
        background: rgba(0,0,0,.72); font-family: Roboto, "Segoe UI", sans-serif; }
      #child-alert-pop .k { width: min(520px, 100%); max-height: calc(100vh - 32px); overflow: auto; border-radius: 18px;
        background: #1a2434; color: #e7edf5; border: 3px solid #e5484d; box-shadow: 0 20px 60px rgba(0,0,0,.6); }
      #child-alert-pop .h { display: flex; align-items: center; gap: 10px; padding: 14px 18px; background: #b3261e; color: #fff;
        font-size: 1.1rem; font-weight: 800; letter-spacing: .04em; text-transform: uppercase; }
      #child-alert-pop .b { padding: 16px 18px; display: flex; flex-direction: column; gap: 12px; }
      #child-alert-pop img { width: 100%; max-height: 300px; object-fit: contain; border-radius: 10px; background: #0d1624; }
      #child-alert-pop .t { font-size: 1.05rem; font-weight: 700; line-height: 1.35; }
      #child-alert-pop p { margin: 0; line-height: 1.5; font-size: .92rem; }
      #child-alert-pop .tel { padding: 10px 12px; border-radius: 10px; background: #2b1416; border: 1px solid #e5484d; font-size: .95rem; }
      #child-alert-pop .tel b { font-size: 1.3rem; color: #ff8a80; }
      #child-alert-pop .m { font-size: .76rem; color: #8fa0b8; }
      #child-alert-pop .a { display: flex; gap: 10px; flex-wrap: wrap; padding: 0 18px 18px; }
      #child-alert-pop .a a, #child-alert-pop .a button { flex: 1 1 180px; padding: 10px 14px; border-radius: 999px; font: inherit;
        font-weight: 700; font-size: .9rem; text-align: center; text-decoration: none; cursor: pointer; }
      #child-alert-pop .a a { background: #e5484d; color: #fff; border: 0; }
      #child-alert-pop .a button { background: none; color: #e7edf5; border: 1px solid #8fa0b8; }
      #child-alert-pop :focus-visible { outline: 3px solid #ffd23f; outline-offset: 2px; }
    </style>
    <div class="k">
      <div class="h">⚠️ ${esc(a.alert_name || T.alert)} · ${esc(where(a, lang))}</div>
      <div class="b">
        ${img ? `<img src="${esc(img)}" alt="${esc(T.photo)}" referrerpolicy="no-referrer">` : ""}
        <div class="t" id="child-alert-pop-t">${esc(a.title || T.default_title)}</div>
        ${a.summary ? `<p>${esc(a.summary)}</p>` : ""}
        ${a.area ? `<p><b>${esc(T.area)}</b> ${esc(a.area)}</p>` : ""}
        <div class="tel">${T.call(esc(a.phone || "112"))}<br>${esc(T.dont)}</div>
        <div class="m">${esc((a.sources || [a.source]).filter(Boolean).join(", "))}${a.since ? ` · ${esc(T.since)} ${esc(fullDate(a.since, lang))}` : ""}${a.method === "media" ? ` · ${esc(T.media_pop)}` : ""}</div>
      </div>
      <div class="a">
        ${url ? `<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(T.read)}</a>` : ""}
        <button type="button">${esc(T.ack)}</button>
      </div>
    </div>`;
    box.querySelector("button").addEventListener("click", () => { store.set(key, true); this.close(); });
    document.body.appendChild(box);
    box.querySelector("button").focus();
  },
  close() {
    document.getElementById("child-alert-pop")?.remove();
  },
};

/* ------------------------------------------------------------- carte */

class ChildAlertCard extends HTMLElement {
  static getStubConfig(hass) {
    return { entity: alertIds(hass)[0] || "" };
  }

  static getConfigForm() {
    const T = tr(langOf(document.querySelector("home-assistant")?.hass)).ed;
    return {
      schema: [
        { name: "entity", selector: { entity: { domain: "binary_sensor", integration: "child_alert" } } },
        { name: "title", selector: { text: {} } },
        { name: "show_when_clear", selector: { boolean: {} } },
        { name: "show_image", selector: { boolean: {} } },
        { name: "theme", selector: { select: { mode: "dropdown", options: [
          { value: "v2", label: T.v2 }, { value: "auto", label: T.auto }, { value: "ha", label: T.ha }] } } },
      ],
      computeLabel: (s) => T[s.name],
    };
  }

  setConfig(config) {
    this._config = { ...DEFAULTS, ...(config || {}) };
    this._sig = null;
    if (!this.shadowRoot) this.attachShadow({ mode: "open" });
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    this._render();
  }

  connectedCallback() {
    clearInterval(this._tick);
    // « vérifié il y a … » : relu chaque minute
    this._tick = setInterval(() => { this._sig = null; this._render(); }, 60000);
  }

  disconnectedCallback() {
    clearInterval(this._tick);
  }

  getCardSize() {
    return this._on ? 6 : 2;
  }

  _themeClass() {
    const t = this._config.theme;
    if (t === "ha") return "th-ha";
    if (t === "auto" && this._hass?.themes?.darkMode === false) return "light";
    return "";
  }

  _render() {
    if (!this._config || !this._hass || !this.shadowRoot) return;
    const c = this._config;
    const id = c.entity && this._hass.states[c.entity] ? c.entity : alertIds(this._hass)[0];
    const st = id ? this._hass.states[id] : null;
    const a = st?.attributes || {};
    this._on = st?.state === "on";
    const lang = langOf(this._hass), T = tr(lang);
    const sig = [id, st?.last_changed, a.alert_id, a.checked, c.theme, c.show_when_clear, c.show_image, this._hass.themes?.darkMode, lang,
      Math.floor(Date.now() / 60000)].join("|");
    if (sig === this._sig) return;
    this._sig = sig;

    if (!st) {
      this.shadowRoot.innerHTML = `${STYLE}<ha-card class="${this._themeClass()}"><div class="empty">
        <ha-icon icon="mdi:account-search-outline"></ha-icon><b>${esc(T.no_sensor)}</b>
        <span>${T.no_sensor_help}</span></div></ha-card>`;
      return;
    }
    // sans alerte en cours, la carte peut disparaître du tableau de bord
    if (!this._on && c.show_when_clear === false) {
      this.shadowRoot.innerHTML = "";
      this.style.display = "none";
      return;
    }
    this.style.display = "";

    const title = c.title || a.alert_name || T.alert;
    const head = `<header>
      <div class="brand"><div class="logo${this._on ? " on" : ""}"><ha-icon icon="${this._on ? "mdi:account-alert" : "mdi:account-child-circle"}"></ha-icon></div>
        <div><div class="title">${esc(title)}</div><div class="sub">${esc(where(a, lang))} · ${esc(sourceLabel(a, lang))}</div></div></div>
      ${this._on ? `<span class="led bad"><i></i>${esc(T.on)}</span>` : `<span class="led ok"><i></i>${esc(T.off)}</span>`}
    </header>`;
    const err = a.errors ? `<div class="warn"><ha-icon icon="mdi:alert-outline"></ha-icon>${esc(T.unavailable)} ${esc([].concat(a.errors).join(" ; "))}</div>` : "";

    let body;
    if (!this._on) {
      body = `<div class="clear"><ha-icon icon="mdi:shield-check-outline"></ha-icon><div>
          <b>${esc(T.clear)}</b>
          <span>${a.checked ? esc(T.checked(ago(a.checked, lang))) : esc(T.checking)}${a.ended ? ` · ${esc(T.ended(ago(a.ended, lang)))}` : ""}</span>
        </div></div>`;
    } else {
      const img = c.show_image !== false ? safeUrl(a.image) : "", url = safeUrl(a.url);
      body = `<div class="alert" role="alert">
          <div class="ah"><ha-icon icon="mdi:alert"></ha-icon>${esc(a.alert_name || T.alert)}${a.since ? ` · ${esc(ago(a.since, lang))}` : ""}</div>
          ${img ? `<img src="${esc(img)}" alt="${esc(T.photo)}" referrerpolicy="no-referrer">` : ""}
          <div class="at">${esc(a.title || T.default_title)}</div>
          ${a.summary ? `<p>${esc(a.summary)}</p>` : ""}
          ${a.area ? `<p><b>${esc(T.area)}</b> ${esc(a.area)}</p>` : ""}
          <div class="tel"><ha-icon icon="mdi:phone"></ha-icon><span>${T.call(esc(a.phone || "112"))} ${esc(T.dont)}</span></div>
          <div class="am">${a.since ? `${esc(T.since_cap)} ${esc(fullDate(a.since, lang))}` : ""}${a.expires ? ` · ${esc(T.until)} ${esc(fullDate(a.expires, lang))}` : ""}<br>
            ${a.method === "media" ? esc(T.media_card((a.sources || []).join(", "))) : `${esc(T.source)} ${esc((a.sources || [a.source]).filter(Boolean).join(", "))}`}</div>
          ${url ? `<a class="read" href="${esc(url)}" target="_blank" rel="noopener noreferrer"><ha-icon icon="mdi:open-in-new"></ha-icon>${esc(T.read)}</a>` : ""}
        </div>`;
    }
    this.shadowRoot.innerHTML = `${STYLE}<ha-card lang="${lang}" class="${this._themeClass()}${this._on ? " is-on" : ""}">${head}${err}${body}</ha-card>`;
  }
}

const STYLE = `<style>
:host {
  --f-bg: #1a2434; --f-surface: #212d40; --f-line: #2f3d55; --f-text: #e7edf5; --f-muted: #8fa0b8;
  --f-accent: #1d93e3; --f-ok: #3fb950; --f-warn: #f0a33a; --f-bad: #e5484d; --f-on-accent: #fff;
}
ha-card { display: block; background: var(--f-bg); color: var(--f-text); border: 1px solid var(--f-line); border-radius: 18px; overflow: hidden; }
ha-card.is-on { border-color: var(--f-bad); }
ha-card.light { --f-bg: #f4f6fa; --f-surface: #e8edf4; --f-line: #d3dbe6; --f-text: #1a2434; --f-muted: #5b6b82; --f-accent: #1673b8; --f-ok: #1f883d; --f-warn: #b35619; --f-bad: #c62828; }
ha-card.th-ha { --f-bg: var(--ha-card-background, var(--card-background-color)); --f-surface: color-mix(in srgb, var(--primary-text-color, #000) 6%, transparent);
  --f-line: var(--divider-color, rgba(127,127,127,.25)); --f-text: var(--primary-text-color); --f-muted: var(--secondary-text-color);
  --f-accent: var(--primary-color, #1d93e3); --f-on-accent: var(--text-primary-color, #fff); border-radius: var(--ha-card-border-radius, 12px); }
header { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 14px 16px 10px; }
.brand { display: flex; align-items: center; gap: 10px; min-width: 0; }
.logo { display: grid; place-items: center; width: 36px; height: 36px; border-radius: 10px; background: color-mix(in srgb, var(--f-accent) 18%, transparent); flex: none; }
.logo ha-icon { --mdc-icon-size: 22px; color: var(--f-accent); }
.logo.on { background: color-mix(in srgb, var(--f-bad) 22%, transparent); }
.logo.on ha-icon { color: var(--f-bad); }
.title { font-size: 1.1rem; font-weight: 700; }
.sub { font-size: .76rem; color: var(--f-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.led { display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; border-radius: 999px; font-size: .74rem; font-weight: 600;
  border: 1px solid var(--f-line); white-space: nowrap; flex: none; }
.led i { width: 8px; height: 8px; border-radius: 50%; }
.led.ok i { background: var(--f-ok); } .led.bad { color: #fff; background: var(--f-bad); border-color: var(--f-bad); } .led.bad i { background: #fff; }
.warn { display: flex; align-items: center; gap: 6px; margin: 0 12px 8px; padding: 8px 10px; border-radius: 10px; font-size: .78rem;
  color: var(--f-warn); border: 1px solid color-mix(in srgb, var(--f-warn) 50%, var(--f-line)); }
.warn ha-icon { --mdc-icon-size: 16px; flex: none; }
.clear { display: flex; gap: 12px; align-items: center; margin: 0 12px 12px; padding: 12px; border-radius: 12px; background: var(--f-surface); }
.clear ha-icon { --mdc-icon-size: 28px; color: var(--f-ok); flex: none; }
.clear div { display: flex; flex-direction: column; gap: 3px; }
.clear b { font-size: .9rem; } .clear span { font-size: .76rem; color: var(--f-muted); }
.alert { display: flex; flex-direction: column; gap: 10px; margin: 0 12px 12px; padding: 12px; border-radius: 12px;
  background: color-mix(in srgb, var(--f-bad) 10%, var(--f-surface)); border: 1px solid var(--f-bad); }
.ah { display: flex; align-items: center; gap: 8px; font-size: .8rem; font-weight: 800; text-transform: uppercase; letter-spacing: .04em; color: var(--f-bad); }
.ah ha-icon { --mdc-icon-size: 20px; }
.alert img { width: 100%; max-height: 280px; object-fit: contain; border-radius: 10px; background: var(--f-line); }
.at { font-size: 1rem; font-weight: 700; line-height: 1.35; }
.alert p { margin: 0; font-size: .86rem; line-height: 1.5; }
.tel { display: flex; gap: 10px; align-items: center; padding: 10px; border-radius: 10px; background: var(--f-bad); color: #fff; font-size: .86rem; line-height: 1.4; }
.tel ha-icon { --mdc-icon-size: 22px; flex: none; }
.tel b { font-size: 1rem; }
.am { font-size: .74rem; color: var(--f-muted); line-height: 1.5; }
.read { align-self: flex-start; display: inline-flex; align-items: center; gap: 6px; padding: 7px 14px; border-radius: 999px;
  background: var(--f-accent); color: var(--f-on-accent); text-decoration: none; font-size: .82rem; font-weight: 600; }
.read ha-icon { --mdc-icon-size: 16px; }
.read:focus-visible { outline: 2px solid var(--f-accent); outline-offset: 2px; }
.empty { display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 24px 16px; text-align: center; color: var(--f-muted); font-size: .85rem; }
.empty ha-icon { --mdc-icon-size: 32px; } .empty b { color: var(--f-text); }
</style>`;

if (!customElements.get("child-alert-card")) customElements.define("child-alert-card", ChildAlertCard);
window.customCards = window.customCards || [];
if (!window.customCards.some((c) => c.type === "child-alert-card")) {
  window.customCards.push({
    type: "child-alert-card",
    name: "Alerte Enlèvement",
    description: tr(langOf({ language: typeof navigator !== "undefined" ? navigator.language : "" })).desc,
    preview: true,
    documentationURL: "https://github.com/Marlboro62/ha-child-alert",
  });
}
popup.start();
console.info(`%c CHILD-ALERT-CARD %c ${CARD_VERSION} © Marlboro62 `, "background:#96d21f;color:#1a2434;font-weight:700", "background:#1d93e3;color:#fff");
})();
