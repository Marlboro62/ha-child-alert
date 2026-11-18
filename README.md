<p>
  ☕ <strong>Si cette carte vous est utile, vous pouvez soutenir le projet :</strong>
</p>

<div style="white-space: nowrap; line-height: 0;">
  <a
    href="https://www.buymeacoffee.com/Marlboro62"
    target="_blank"
    rel="noopener noreferrer"
    style="display: inline-block; text-decoration: none; vertical-align: middle;"
  ><img
    src="https://img.buymeacoffee.com/button-api/?text=Offrir%20un%20caf%C3%A9&emoji=%E2%98%95&slug=Marlboro62&button_colour=FF5F5F&font_colour=ffffff&font_family=Cookie&outline_colour=000000&coffee_colour=FFDD00"
    alt="Offrir un café sur Buy Me a Coffee"
    height="45"
    style="display: block; border: 0;"
  ></a>&nbsp;&nbsp;<a
    href="https://ko-fi.com/M4M2QL45X"
    target="_blank"
    rel="noopener noreferrer"
    style="display: inline-block; text-decoration: none; vertical-align: middle;"
  ><img
    src="https://storage.ko-fi.com/cdn/kofi6.png?v=6"
    alt="Soutenir le projet sur Ko-fi"
    height="45"
    style="display: block; border: 0;"
  ></a>
</div>

# Alerte Enlèvement

Intégration et carte Home Assistant pour être prévenu quand une **alerte d'enlèvement d'enfant** est déclenchée dans votre pays : **Alerte Enlèvement** (France), **Child Alert** (Belgique), **AMBER Alert** (Canada, États-Unis, Pays-Bas, Luxembourg, Australie), **Child Rescue Alert** (Royaume-Uni)…

À l'installation, vous choisissez **votre pays** (et, aux États-Unis, votre État). Quand une alerte est en cours :

- le capteur **Alerte enlèvement** passe à « Détecté », avec le titre, le secteur, la photo et le lien quand la source les donne ;
- une **fenêtre** s'ouvre par-dessus Home Assistant, sur chaque appareil, avec le **numéro à appeler** ; « J'ai pris connaissance » la ferme pour cette alerte ;
- la **carte** affiche l'alerte en rouge ; sans alerte, un simple « Aucune alerte en cours » (ou rien du tout, au choix).

**🎮 [Essayer la démo en ligne](https://marlboro62.github.io/ha-child-alert/docs/demo.html)** : la vraie carte et la fenêtre d'alerte pour chacun des 11 pays, avec des alertes fictives (aucune alerte, alerte en cours, source indisponible ; thème sombre, clair ou celui de Home Assistant).

> **Intégration non officielle**, sans lien avec les autorités ni avec les médias cités. Elle ne remplace pas les canaux officiels (FR-Alert, Wireless Emergency Alerts, En Alerte…). En cas d'information, appelez toujours le **numéro indiqué dans l'alerte** et n'intervenez pas vous-même.

## Pays et sources

| Pays | Alerte | Source | Numéro affiché |
| --- | --- | --- | --- |
| Canada | Alerte AMBER · AMBER Alert | **officielle** : flux national En Alerte (NAAD) | 911 |
| États-Unis | AMBER Alert | **officielle** : alertes « Child Abduction Emergency » de la météo nationale (NWS) ; avec un État choisi, aussi les médias de cet État | 911 |
| France | Alerte Enlèvement | médias | 197 |
| Belgique | Child Alert | médias (francophones et néerlandophones) | 112 |
| Suisse | Alerte enlèvement · Entführungsalarm | médias (francophones et germanophones) | 117 |
| Luxembourg | AMBER Alert | médias | 113 |
| Pays-Bas | AMBER Alert | médias | 112 |
| Royaume-Uni | Child Rescue Alert | médias | 999 |
| Irlande | Child Abduction Alert | médias | 999 |
| Mexique | Alerta Amber | médias | 911 |
| Australie | AMBER Alert | médias | 000 |

**Sources officielles** : relues toutes les 5 minutes.

**Médias** : dans ces pays, le dispositif n'a ni flux ni API. L'intégration cherche le nom de l'alerte dans les titres des médias du pays (Google Actualités, dernières 24 heures), toutes les 10 minutes. L'alerte est considérée **en cours** quand **au moins deux médias différents** la titrent dans les 6 dernières heures, et **terminée** dès qu'un titre annonce sa levée (enfant retrouvé, alerte levée). Les articles sur le dispositif lui-même (anniversaire, bilan, fausse alerte) sont ignorés. Cette détection peut avoir quelques minutes de retard sur la diffusion officielle : vérifiez toujours sur la page officielle.

Un pays manque ? Proposez-le dans les [Issues GitHub](https://github.com/Marlboro62/ha-child-alert/issues), avec le nom exact de l'alerte et, s'il existe, son flux officiel.

## Installation

1. **Paramètres › Marketplace** (ou HACS avant la 2026.11) › menu ⋮ › **Dépôts personnalisés** : ajoutez `https://github.com/Marlboro62/ha-child-alert`, catégorie **Intégration**.
2. Installez **Alerte Enlèvement**, puis redémarrez Home Assistant.
3. **Paramètres › Appareils et services › Ajouter une intégration** › **Alerte Enlèvement**, puis choisissez votre pays (le pays de Home Assistant est proposé par défaut). Aux États-Unis, choisissez ensuite votre État, ou « — » pour tous.

Vous pouvez ajouter l'intégration plusieurs fois pour suivre plusieurs pays (par exemple France et Belgique pour un frontalier).

La carte est chargée automatiquement par l'intégration : **aucune ressource à ajouter**.

## La carte

Ajoutez la carte **Alerte Enlèvement** à un tableau de bord, ou en YAML :

```yaml
type: custom:child-alert-card
```

| Option | Rôle | Défaut |
| --- | --- | --- |
| `entity` | Capteur de l'alerte (`binary_sensor.…`) | le premier trouvé |
| `title` | Titre de la carte | nom de l'alerte du pays |
| `show_when_clear` | Afficher la carte quand aucune alerte n'est en cours (`false` : la carte n'apparaît qu'en cas d'alerte) | `true` |
| `show_image` | Photo diffusée avec l'alerte, quand la source en donne une | `true` |
| `theme` | `v2` (sombre, comme mes autres cartes), `auto` (clair ou sombre selon Home Assistant) ou `ha` (thème de Home Assistant) | `v2` |

## Le capteur

`binary_sensor.alerte_enlevement_…` : **activé** pendant une alerte. Ses attributs : `title`, `summary`, `area`, `image`, `url`, `since`, `expires`, `sources`, `method` (`official` ou `media`), `alert_name`, `phone`, `country_name`, `region`, `checked` (dernière vérification) et `errors` (source injoignable).

Exemple d'automatisation : une notification sur le téléphone au déclenchement d'une alerte.

```yaml
alias: Alerte enlèvement - notification
triggers:
  - trigger: state
    entity_id: binary_sensor.alerte_enlevement_france_alerte_enlevement
    to: "on"
actions:
  - action: notify.mobile_app_mon_telephone
    data:
      title: "⚠️ {{ state_attr(trigger.entity_id, 'alert_name') }}"
      message: >-
        {{ state_attr(trigger.entity_id, 'title') }}
        Information : appelez le {{ state_attr(trigger.entity_id, 'phone') }}.
      data:
        priority: high
        url: "{{ state_attr(trigger.entity_id, 'url') }}"
```

Remplacez le nom du capteur et du téléphone par les vôtres (**Outils de développement › États**).

## Retours et bugs

Uniquement par les [Issues GitHub](https://github.com/Marlboro62/ha-child-alert/issues).

## Licence

MIT. Les alertes restent la propriété de leurs émetteurs (autorités, médias) ; l'intégration n'en garde aucune copie au-delà de l'alerte en cours.
