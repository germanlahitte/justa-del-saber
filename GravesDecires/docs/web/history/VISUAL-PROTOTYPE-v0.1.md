# Graves decires — Prototipo visual v0.1

**Etapa:** 3 (continuación) — prototipo navegable, no implementación completa
**Fecha:** 2026-08-27
**Ubicación del código:** `web/` (Astro + isla React mínima, aprobado en la
consulta previa a esta etapa)
**Estado:** las seis superficies pedidas están construidas y responden
`200`. `BOOK`, `ASSET`, `EDITORIAL`, `CONCEPTS`, `READINGS` y `MASTER MAP`
permanecen exactamente como estaban — el prototipo solo los lee.

Cómo verlo: `cd web && npx astro dev` (o `npx astro dev --background` +
`npx astro dev stop` para cerrarlo). El servidor quedó corriendo en
`http://localhost:4321` al terminar esta entrega.

---

## 1. Qué se construyó

### Stack (decisión confirmada antes de tocar código)

Astro 7 + isla React 19 mínima + Tailwind 4 (vía plugin de Vite), tal como
se preguntó explícitamente y aprobaste. Cero base de datos: `content.config.ts`
lee los JSON canónicos directamente desde `../data` y `../content` (el
repositorio raíz), sin copiarlos ni duplicarlos dentro de `web/`.

### Las seis superficies

| # | Ruta | Qué prueba |
|---|---|---|
| 1 | `/` | HOME editorial, no selector de modo |
| 2 | `/libro/38` | BOOK UNIT real ("Sé vos") con texto verbatim + QR original |
| 3 | `/libro/38` + drawer abierto | ORIGINAL ↔ LECTURA (contextual drawer) |
| 4 | `/mapa` | MASTER MAP: recorrido longitudinal + recurrencia + meta-eje + coda |
| 5 | `/mapa/arc-04-construccion-de-si` | ARC DETAIL |
| 6 | `/conceptos/concept-integridad` | CONCEPT → Readings → BookUnits |

Superficies de apoyo, necesarias para que los links de las seis anteriores
no lleven a un 404 (no eran parte del pedido explícito, pero sin ellas el
prototipo no sería navegable de verdad): `/libro` (índice/TOC),
`/lecturas` y `/lecturas/[id]` (destino del "ver lectura completa"),
`/conceptos` (índice), `/mapa/[arc]` para los otros 8 arcos, y un endpoint
`/api/asset/[file]` que sirve los 55 assets originales byte a byte.

### Datos reales usados, ninguno inventado

- **BookUnit 38** ("Sé vos"): texto verbatim completo, crédito de canción
  (Almafuerte, *Almafuerte*, 1998), asset `asset-image22` (QR real,
  `qr_value` = enlace real de Spotify), 4 Readings reales conectados
  (`reading-integridad`, `reading-no-me-necesitas`, `reading-se-vos`,
  `reading-se-vos-por-ser-yo`).
- **Master Map**: los 9 `arcs` reales con su `question`/`claim` exactos, la
  `core_thesis` general, los 3 `band_meta_axis`, y `terminal_structure`
  (secuencia real de 4 Readings + su `meaning`).
- **Arc detail**: `arc-04-construccion-de-si` con sus 7 `concept_ids` y 4
  `reading_ids` reales.
- **Concept detail**: `concept-integridad`, elegido porque el dato real
  confirmó la conectividad que pedías evaluar — 9 Readings lo usan, que
  alcanzan 12 unidades distintas del libro (verificado antes de construir
  nada, ver `docs/web/provenance/WEB-EXPERIENCE-v0.1.md` §A.2 y el chequeo puntual que
  hice sobre `readings-v0.3.json` antes de elegir el candidato).

Cero lorem ipsum, cero Readings/Concepts/fragmentos inventados, cero
reemplazo de assets. El único texto que no proviene de un JSON canónico es
la copita de interfaz (labels de botones, "Índice del libro", etc.), que es
chrome de UI, no contenido.

---

## 2. Decisiones tomadas durante la construcción

### 2.1 HOME sin selector de modo

El epígrafe de portada usa **las primeras líneas reales del libro**
(unidad 0, la portada tipográfica: "Graves decires / de / aguda
intuición") en vez de un texto de bienvenida inventado. Las dos entradas
("Leer la obra" / "Explorar sus ideas") se presentan como dos bloques
editoriales con contexto propio (conteo real de unidades/conceptos/
lecturas), no como botones neutros de un dashboard — cada uno cuenta qué
hay del otro lado antes de que el usuario decida entrar.

### 2.2 Regla revisada de MODO LEER (§3 de tu aprobación)

Implementada literalmente: `getReadingIdsByBookUnit()` en
`src/lib/traceability.ts` calcula en build-time el índice inverso
`book_unit → reading_ids[]` recorriendo `readings-v0.3.json`. La página
`/libro/[unit].astro` usa ese índice **solo para decidir si mostrar el
botón** "Hay N lecturas sobre esto" — pero el contenido de cada Reading
(thesis, concepts, connections) se resuelve también en build-time y se pasa
como prop ya armada al componente React `ReadingDrawer`, que **no
renderiza nada de eso hasta que `open === true`** (estado local, nunca
fetch). Es decir: el servidor conoce la trazabilidad completa (Astro
genera todo estático), pero el DOM del cliente no monta el contenido
interpretativo hasta el clic — la regla "BOOK puede saber, no debe
mostrar" se cumple a nivel de interacción del usuario, que es donde importa
para la experiencia de lectura.

### 2.3 Drawer, no flipping card (§4)

`ReadingDrawer.tsx` es panel lateral en desktop (`sm:w-[420px] sm:border-l`)
y bottom-sheet en mobile (`w-full ... border-t`, con `margin-top: auto`
empujándolo hacia abajo) usando exactamente las mismas clases condicionadas
por breakpoint de Tailwind — no son dos componentes distintos. Incluye:
- Cierre con `Escape`, foco atrapado en el botón de cierre al abrir
  (accesibilidad básica de diálogo).
- Selector de pestañas cuando hay más de un Reading para la misma unidad
  (unidad 38 tiene 4).
- Chips de Concepts que navegan a `/conceptos/[id]`.
- Lista de "esta lectura también cruza" hacia otras BookUnits.
- Botón "Ver lectura completa →" hacia `/lecturas/[id]` (la expansión
  opcional aprobada).

### 2.4 Master Map: longitudinal + recurrencia + meta-eje + coda (§5)

`MasterMapJourney.tsx` implementa:
- **Recorrido longitudinal**: los 9 arcos en una lista vertical con línea
  guía (`border-l-2`), orden real (`order: 1..9`), expandibles individualmente.
- **Recurrencia conceptual**: al hacer hover/focus sobre un chip de
  concepto dentro de un arco expandido, **todas las estaciones** que
  comparten ese concepto se resaltan (`border-accent bg-accent-bg/40`) —
  usando el dato real de `concept_ids` por arco, no una simulación. Verifiqué
  antes de construir que hay 14 conceptos que aparecen en 2+ arcos
  (`concept-comunidad` en 4, `concept-responsabilidad` en 4, etc.), así que
  el efecto tiene sustancia real para probar.
- **Meta-eje de bandas**: franja superior con los 3 `band_meta_axis` reales,
  con una nota explícita ("eje narrativo del libro, no una clasificación
  exhaustiva...") para preservar la sutileza pedida en tu instrucción
  original de Etapa 3 §6.
- **Terminal structure como coda**: separada visualmente por un borde
  punteado distinto (`border-t-2 border-dashed border-accent/50`), fuera de
  la lista `<ol>` de arcos — explícitamente no es un décimo `<li>`.
- **Cero force-directed graph**: no se usó ninguna librería de grafos; toda
  la interacción es DOM + estado de React sobre listas.

### 2.5 Trazabilidad visual (`SourceTag`)

Agregué un componente pequeño no pedido explícitamente pero que considero
necesario para validar "identidad" y "relación poesía/análisis" (objetivo
del prototipo): cada bloque de contenido lleva una etiqueta `BOOK` / `ASSET`
/ `EDITORIAL` / `FUTURE-ANALYSIS` discreta (monoespaciada, pequeña) que
nunca se confunde con el contenido mismo. Es una implementación literal del
principio de trazabilidad de PROJECT-BRIEF §10 y Etapa 1.5 §4 —no es
un capricho visual, ayuda a juzgar si la separación editorial "se siente"
en la interfaz.

---

## 3. Hipótesis visuales (explícitamente no aprobadas, solo para poder navegar algo real)

Per tu instrucción: tipografías concretas, rojo óxido, ámbar, textura de
fotocopia y paleta definitiva **no están aprobadas**. Lo que implementé es
**una sola hipótesis concreta** (llamada "Hipótesis A" en el propio CSS,
`web/src/styles/global.css`), aislada en variables `@theme` para poder
reemplazarla entera sin tocar ningún componente:

- Fondo "papel" (`#f2ede2`) / tinta (`#221f1a`) — evita blanco y negro
  puros a propósito, para no verse "pantalla nativa".
- Un acento óxido (`#9a4a2c`) usado **solo** para el trigger de trazabilidad
  y el estado activo del mapa — nunca decorativo.
- Fuentes: se declararon `--font-serif`/`--font-sans`/`--font-mono` con
  nombres candidatos (Source Serif 4 / Public Sans / IBM Plex Mono) pero
  **no se cargaron webfonts reales** — el navegador cae a los fallbacks del
  sistema. Esto es intencional: evita comprometer una tipografía concreta
  mientras se navega el prototipo.

Todo esto vive en un único archivo y un único bloque `@theme`, precisamente
para que la revisión visual pueda decir "cambiemos el acento" o "probemos
otra base tipográfica" sin tocar ningún `.astro`/`.tsx`.

---

## 4. Qué es deliberadamente provisional

- **Ningún filtro real** en `/lecturas` o `/conceptos` (índices planos,
  marcados con `PrototypeBadge`).
- **`/libro` como TOC completo pero sin resumen curado por unidad** — el
  resumen que se muestra por fila es una heurística simple (primer heading,
  o primer crédito de canción, o primera línea de texto), no una
  descripción editorial.
- **El posicionamiento del meta-eje de bandas sobre el recorrido** es una
  aproximación visual (franja fija arriba de las 9 estaciones), no un
  alineamiento matemático arco-por-arco — el propio dato (`band_meta_axis`)
  no declara esa correspondencia con esa precisión, así que no se inventó
  una.
- **Sin manejo de error 404 diseñado** — usa el default de Astro.
- **Sin animaciones de transición** entre páginas — cada navegación es una
  carga de página normal (coherente con "no se decide nada de motion todavía").
- **Sin service worker/offline/PWA** — fuera de alcance de esta etapa.
- **El endpoint `/api/asset/[file]`** es una solución de prototipo para
  servir los originales sin duplicarlos en `public/`; en implementación
  final conviene evaluar si Astro Assets (`astro:assets`) o una copia
  read-only a `public/assets` es preferible — **no decidido, marcado para
  discusión** (ver §5).

---

## 5. Qué necesitamos validar antes de implementar el resto

1. **¿La HOME se siente ya "parte del libro" o todavía parece landing?**
   Es la pregunta central de tu ajuste §1 — necesito tu ojo, no solo el mío.
2. **¿El drawer contextual resuelve bien ORIGINAL↔LECTURA en mobile real?**
   Lo construí mobile-first en CSS, pero no lo probé en un dispositivo
   físico — solo con el breakpoint de escritorio angosto.
3. **¿La recurrencia conceptual del mapa (hover→resaltado) comunica lo que
   se buscaba, o es demasiado sutil / demasiado ruidosa?**
4. **¿El meta-eje de bandas como franja fija arriba comunica bien "esto es
   una franja narrativa, no una fila más del recorrido"**, o necesita
   integrarse de otra forma dentro del recorrido en sí?
5. **Estrategia de assets** (`/api/asset/[file]` vs. copiar a `public/` vs.
   `astro:assets`): decisión técnica pendiente que no afecta la experiencia
   pero sí el pipeline de build para producción.
6. **Tipografías y paleta real** — cuando estés listo para esa evaluación,
   el único archivo a tocar es `web/src/styles/global.css`.

---

## 6. Decisiones que requieren tu aprobación

1. **HOME**: ¿el tratamiento actual (epígrafe real del libro + dos bloques
   contextualizados) cumple con "no parecer selector de modo"? ¿Ajustes?
2. **Drawer**: ¿aprobás el patrón implementado (tabs cuando hay múltiples
   Readings, chips de concepto, cross-links a otras unidades) o hay algo
   que sobra/falta antes de generalizarlo a las 47 unidades?
3. **Master Map**: ¿la franja de meta-eje y el mecanismo de recurrencia por
   hover son la dirección correcta, o preferís explorar una variante
   (por ejemplo, recurrencia siempre visible en vez de on-hover)?
4. **Estrategia de assets** para producción (§5.5) — decisión técnica, no
   de experiencia, pero conviene resolverla antes de escalar a los 55
   assets en todas las unidades.
5. **Alcance de la siguiente iteración**: ¿generalizamos ya estas seis
   superficies a las 47 unidades / 33 Readings / 32 Concepts, o iteramos
   primero sobre lo construido con ajustes de estas cinco preguntas?

No continué hacia una implementación completa del sitio. Quedo a la espera
de tu revisión.
