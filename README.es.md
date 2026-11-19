<p>
  ☕ <strong>Si esta tarjeta te resulta útil, puedes apoyar el proyecto:</strong>
</p>

<div style="white-space: nowrap; line-height: 0;">
  <a
    href="https://www.buymeacoffee.com/Marlboro62"
    target="_blank"
    rel="noopener noreferrer"
    style="display: inline-block; text-decoration: none; vertical-align: middle;"
  ><img
    src="https://img.buymeacoffee.com/button-api/?text=Inv%C3%ADtame%20un%20caf%C3%A9&emoji=%E2%98%95&slug=Marlboro62&button_colour=FF5F5F&font_colour=ffffff&font_family=Cookie&outline_colour=000000&coffee_colour=FFDD00"
    alt="Invítame un café en Buy Me a Coffee"
    height="45"
    style="display: block; border: 0;"
  ></a>&nbsp;&nbsp;<a
    href="https://ko-fi.com/M4M2QL45X"
    target="_blank"
    rel="noopener noreferrer"
    style="display: inline-block; text-decoration: none; vertical-align: middle;"
  ><img
    src="https://storage.ko-fi.com/cdn/kofi6.png?v=6"
    alt="Apoya el proyecto en Ko-fi"
    height="45"
    style="display: block; border: 0;"
  ></a>
</div>

🌐 [Français](README.md) · [English](README.en.md) · [Nederlands](README.nl.md) · [Deutsch](README.de.md) · **Español**

# Alerta Amber

Integración y tarjeta de Home Assistant que te avisan cuando se emite una **alerta por sustracción o desaparición de un niño** en tu país: **Alerta Amber** (México), **AMBER Alert** (Estados Unidos, Canadá, Australia, Países Bajos, Luxemburgo), **Alerte Enlèvement** (Francia), **Child Alert** (Bélgica)…

Hecha para: 🇲🇽 México (y todos los demás países de la tabla de abajo).

Al instalarla eliges **tu país** (y, en Estados Unidos, tu estado). Mientras haya una alerta activa:

- el sensor **Child abduction alert** se activa («Detectado»), con el título, la zona, la foto y el enlace cuando la fuente los ofrece;
- se abre una **ventana** sobre Home Assistant, en cada dispositivo, con el **número al que llamar**; « J'ai pris connaissance » («Enterado») la cierra para esa alerta;
- la **tarjeta** muestra la alerta en rojo; sin alerta, un simple mensaje «ninguna alerta» (o nada, a tu elección).

> **Idioma:** las pantallas de configuración y el nombre del sensor aparecen en inglés o en francés, según el idioma de Home Assistant. La tarjeta y la ventana están **por ahora en francés**.

**🎮 [Prueba la demo en línea](https://marlboro62.github.io/ha-child-alert/docs/demo.html)**: la tarjeta real y la ventana de alerta para cada uno de los 11 países, con alertas ficticias (sin alerta, alerta activa, fuente no disponible; tema oscuro, claro o el de Home Assistant).

> **Integración no oficial**, sin relación con las autoridades ni con los medios citados. No sustituye los canales oficiales (Alerta Amber México, autoridades locales…). Si tienes información, llama siempre al **número indicado en la alerta** y nunca intervengas por tu cuenta.

## Países y fuentes

| País | Alerta | Fuente | Número mostrado |
| --- | --- | --- | --- |
| México | Alerta Amber | medios | 911 |
| Estados Unidos | AMBER Alert | **oficial**: alertas «Child Abduction Emergency» del Servicio Meteorológico Nacional (NWS); con un estado elegido, también los medios de ese estado | 911 |
| Canadá | AMBER Alert · Alerte AMBER | **oficial**: flujo nacional En Alerte / Alert Ready (NAAD) | 911 |
| Francia | Alerte Enlèvement | medios | 197 |
| Bélgica | Child Alert | medios (francófonos y neerlandófonos) | 112 |
| Suiza | Alerte enlèvement · Entführungsalarm | medios (francófonos y germanófonos) | 117 |
| Luxemburgo | AMBER Alert | medios | 113 |
| Países Bajos | AMBER Alert | medios | 112 |
| Reino Unido | Child Rescue Alert | medios | 999 |
| Irlanda | Child Abduction Alert | medios | 999 |
| Australia | AMBER Alert | medios | 000 |

**Fuentes oficiales**: se consultan cada 5 minutos.

**Medios**: en estos países el sistema de alerta no tiene flujo ni API. La integración busca el nombre de la alerta en los titulares de los medios del país (Google Noticias, últimas 24 horas) cada 10 minutos. La alerta se considera **activa** cuando **al menos dos medios distintos** la publican en las últimas 6 horas, y **terminada** en cuanto un titular anuncia que se desactivó (niño localizado, alerta desactivada). Los artículos sobre el propio sistema (aniversario, balance, falsa alarma) se ignoran. Esta detección puede ir unos minutos por detrás de la difusión oficial: consulta siempre la página oficial.

¿Falta un país? Propónlo en los [issues de GitHub](https://github.com/Marlboro62/ha-child-alert/issues), con el nombre exacto de la alerta y, si existe, su flujo oficial.

## Instalación

1. **Ajustes › Marketplace** (o HACS antes de la 2026.11) › menú ⋮ › **Repositorios personalizados**: añade `https://github.com/Marlboro62/ha-child-alert`, tipo **Integración**.
2. Instala **Alerte Enlèvement** y reinicia Home Assistant.
3. **Ajustes › Dispositivos y servicios › Añadir integración** › **Alerte Enlèvement**, y elige tu país (se propone el país de Home Assistant). En Estados Unidos, elige después tu estado, o «—» para todos.

Puedes añadir la integración varias veces para seguir varios países (por ejemplo México y Estados Unidos en la frontera).

La tarjeta se carga automáticamente con la integración: **no hay que añadir ningún recurso**.

## La tarjeta

Añade la tarjeta **Alerte Enlèvement** a un panel, o en YAML:

```yaml
type: custom:child-alert-card
```

| Opción | Función | Por defecto |
| --- | --- | --- |
| `entity` | Sensor de la alerta (`binary_sensor.…`) | el primero encontrado |
| `title` | Título de la tarjeta | nombre de la alerta del país |
| `show_when_clear` | Mostrar la tarjeta cuando no hay alerta (`false`: la tarjeta solo aparece durante una alerta) | `true` |
| `show_image` | Foto difundida con la alerta, cuando la fuente ofrece una | `true` |
| `theme` | `v2` (oscuro, como mis otras tarjetas), `auto` (claro u oscuro según Home Assistant) o `ha` (tema de Home Assistant) | `v2` |

## El sensor

`binary_sensor.alerte_enlevement_…`: **activado** durante una alerta. Sus atributos: `title`, `summary`, `area`, `image`, `url`, `since`, `expires`, `sources`, `method` (`official` o `media`), `alert_name`, `phone`, `country_name`, `region`, `checked` (última comprobación) y `errors` (fuente inaccesible).

Ejemplo de automatización: una notificación en el celular cuando se emite una alerta.

```yaml
alias: Alerta Amber - notificación
triggers:
  - trigger: state
    entity_id: binary_sensor.alerte_enlevement_mexique_child_abduction_alert
    to: "on"
actions:
  - action: notify.mobile_app_mi_celular
    data:
      title: "⚠️ {{ state_attr(trigger.entity_id, 'alert_name') }}"
      message: >-
        {{ state_attr(trigger.entity_id, 'title') }}
        Información: llama al {{ state_attr(trigger.entity_id, 'phone') }}.
      data:
        priority: high
        url: "{{ state_attr(trigger.entity_id, 'url') }}"
```

Sustituye los nombres del sensor y del celular por los tuyos (**Herramientas para desarrolladores › Estados**).

## Comentarios y errores

Solo a través de los [issues de GitHub](https://github.com/Marlboro62/ha-child-alert/issues).

## Licencia

MIT. Las alertas siguen siendo propiedad de sus emisores (autoridades, medios); la integración no guarda ninguna copia más allá de la alerta en curso.
