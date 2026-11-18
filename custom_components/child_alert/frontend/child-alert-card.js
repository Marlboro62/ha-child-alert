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
const CARD_VERSION = "0.1.0";

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

function ago(iso) {
  const t = iso ? new Date(iso).getTime() : NaN;
  if (!Number.isFinite(t)) return "";
  const s = Math.max(0, (Date.now() - t) / 1000);
  if (s < 60) return "à l'instant";
  if (s < 3600) return `il y a ${Math.floor(s / 60)} min`;
  if (s < 86400) return `il y a ${Math.floor(s / 3600)} h`;
  return new Date(t).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}
const fullDate = (iso) => {
  const d = iso ? new Date(iso) : null;
  return d && Number.isFinite(d.getTime())
    ? d.toLocaleString("fr-FR", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" }) : "";
};

/** Capteurs de l'intégration (un par pays ou État suivi). */
const alertIds = (hass) => Object.keys(hass?.entities || {})
  .filter((e) => e.startsWith("binary_sensor.") && hass.entities[e].platform === "child_alert");
const where = (a) => [a.country_name, a.region].filter(Boolean).join(" · ");

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
    const box = document.createElement("div");
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
      <div class="h">⚠️ ${esc(a.alert_name || "Alerte enlèvement")} · ${esc(where(a))}</div>
      <div class="b">
        ${img ? `<img src="${esc(img)}" alt="Photo diffusée avec l'alerte" referrerpolicy="no-referrer">` : ""}
        <div class="t" id="child-alert-pop-t">${esc(a.title || "Une alerte d'enlèvement d'enfant est en cours.")}</div>
        ${a.summary ? `<p>${esc(a.summary)}</p>` : ""}
        ${a.area ? `<p><b>Secteur :</b> ${esc(a.area)}</p>` : ""}
        <div class="tel">Si vous avez une information : <b>appelez le ${esc(a.phone || "112")}</b>, ou le numéro indiqué dans l'alerte.<br>N'intervenez pas vous-même.</div>
        <div class="m">${esc((a.sources || [a.source]).filter(Boolean).join(", "))}${a.since ? ` · depuis ${esc(fullDate(a.since))}` : ""}${a.method === "media" ? " · repérée dans les titres des médias : vérifiez sur la page officielle" : ""}</div>
      </div>
      <div class="a">
        ${url ? `<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">Lire l'alerte</a>` : ""}
        <button type="button">J'ai pris connaissance</button>
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
    return {
      schema: [
        { name: "entity", selector: { entity: { domain: "binary_sensor", integration: "child_alert" } } },
        { name: "title", selector: { text: {} } },
        { name: "show_when_clear", selector: { boolean: {} } },
        { name: "show_image", selector: { boolean: {} } },
        { name: "theme", selector: { select: { mode: "dropdown", options: [
          { value: "v2", label: "Sombre (cartes Marlboro62)" }, { value: "auto", label: "Automatique (clair ou sombre)" },
          { value: "ha", label: "Thème de Home Assistant" }] } } },
      ],
      computeLabel: (s) => ({
        entity: "Capteur de l'alerte (vide : le premier trouvé)",
        title: "Titre (vide : nom de l'alerte du pays)",
        show_when_clear: "Afficher la carte sans alerte en cours",
        show_image: "Photo diffusée avec l'alerte",
        theme: "Couleurs de la carte",
      }[s.name]),
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
    const sig = [id, st?.last_changed, a.alert_id, a.checked, c.theme, c.show_when_clear, c.show_image, this._hass.themes?.darkMode,
      Math.floor(Date.now() / 60000)].join("|");
    if (sig === this._sig) return;
    this._sig = sig;

    if (!st) {
      this.shadowRoot.innerHTML = `${STYLE}<ha-card class="${this._themeClass()}"><div class="empty">
        <ha-icon icon="mdi:account-search-outline"></ha-icon><b>Aucun capteur d'alerte</b>
        <span>Ajoutez l'intégration <b>Alerte Enlèvement</b> (Paramètres › Appareils et services) et choisissez votre pays.</span></div></ha-card>`;
      return;
    }
    // sans alerte en cours, la carte peut disparaître du tableau de bord
    if (!this._on && c.show_when_clear === false) {
      this.shadowRoot.innerHTML = "";
      this.style.display = "none";
      return;
    }
    this.style.display = "";

    const title = c.title || a.alert_name || "Alerte enlèvement";
    const head = `<header>
      <div class="brand"><div class="logo${this._on ? " on" : ""}"><ha-icon icon="${this._on ? "mdi:account-alert" : "mdi:account-child-circle"}"></ha-icon></div>
        <div><div class="title">${esc(title)}</div><div class="sub">${esc(where(a))} · ${esc(a.source_type || "")}</div></div></div>
      ${this._on ? `<span class="led bad"><i></i>En cours</span>` : `<span class="led ok"><i></i>Aucune alerte</span>`}
    </header>`;
    const err = a.errors ? `<div class="warn"><ha-icon icon="mdi:alert-outline"></ha-icon>Source indisponible : ${esc([].concat(a.errors).join(" ; "))}</div>` : "";

    let body;
    if (!this._on) {
      body = `<div class="clear"><ha-icon icon="mdi:shield-check-outline"></ha-icon><div>
          <b>Aucune alerte d'enlèvement en cours</b>
          <span>${a.checked ? `Vérifié ${esc(ago(a.checked))}` : "Vérification en cours…"}${a.ended ? ` · dernière alerte terminée ${esc(ago(a.ended))}` : ""}</span>
        </div></div>`;
    } else {
      const img = c.show_image !== false ? safeUrl(a.image) : "", url = safeUrl(a.url);
      body = `<div class="alert" role="alert">
          <div class="ah"><ha-icon icon="mdi:alert"></ha-icon>${esc(a.alert_name || "Alerte enlèvement")}${a.since ? ` · ${esc(ago(a.since))}` : ""}</div>
          ${img ? `<img src="${esc(img)}" alt="Photo diffusée avec l'alerte" referrerpolicy="no-referrer">` : ""}
          <div class="at">${esc(a.title || "Une alerte d'enlèvement d'enfant est en cours.")}</div>
          ${a.summary ? `<p>${esc(a.summary)}</p>` : ""}
          ${a.area ? `<p><b>Secteur :</b> ${esc(a.area)}</p>` : ""}
          <div class="tel"><ha-icon icon="mdi:phone"></ha-icon><span>Si vous avez une information : <b>appelez le ${esc(a.phone || "112")}</b>, ou le numéro indiqué dans l'alerte. N'intervenez pas vous-même.</span></div>
          <div class="am">${a.since ? `Depuis ${esc(fullDate(a.since))}` : ""}${a.expires ? ` · jusqu'à ${esc(fullDate(a.expires))}` : ""}<br>
            ${a.method === "media" ? `Repérée dans les titres de : ${esc((a.sources || []).join(", "))}. Vérifiez sur la page officielle.` : `Source : ${esc((a.sources || [a.source]).filter(Boolean).join(", "))}`}</div>
          ${url ? `<a class="read" href="${esc(url)}" target="_blank" rel="noopener noreferrer"><ha-icon icon="mdi:open-in-new"></ha-icon>Lire l'alerte</a>` : ""}
        </div>`;
    }
    this.shadowRoot.innerHTML = `${STYLE}<ha-card class="${this._themeClass()}${this._on ? " is-on" : ""}">${head}${err}${body}</ha-card>`;
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
    description: "Alerte d'enlèvement d'enfant en cours dans votre pays (AMBER Alert et équivalents), avec le numéro à appeler.",
    preview: true,
    documentationURL: "https://github.com/Marlboro62/ha-child-alert",
  });
}
popup.start();
console.info(`%c CHILD-ALERT-CARD %c ${CARD_VERSION} © Marlboro62 `, "background:#96d21f;color:#1a2434;font-weight:700", "background:#1d93e3;color:#fff");
})();
