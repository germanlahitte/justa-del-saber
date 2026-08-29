# Graves decires — Modelo de geometría A5 (reader shell) v0.1

**Propósito:** documentar el modelo geométrico de la HOJA A5 fija del MODO
LEER (`/libro/p/[n]`) y el mecanismo de detección de *spread vs single* basado
en el ancho real del contenedor (CSS container queries), en reemplazo del
prototipo v0.3 que usaba ancho de viewport (`@media (min-width:1024px)`).

Este documento describe únicamente el CHROME/geometría del lector. El
CONTENIDO del libro (page-model.json, slices, bloques) es canon cerrado y no
se toca en este refinamiento.

---

## 1. La hoja A5 fija (PageShell)

`web/src/components/PageShell.astro` es el ÚNICO contenedor visual que define
la hoja física A5 para **todas** las páginas (generic, band-role, blank,
visual-only).

- **Aspect ratio fijo A5:** `aspect-ratio: 1 / 1.4142` (√2 ≈ 1.4142 →
  148×210 mm). La ALTURA de la hoja sale SIEMPRE de la relación de aspecto y el
  ancho disponible por el padre. **Nunca** del contenido y **nunca** de
  `min-height`.
- **Ancho:** lo fija el padre (ruta) por modo — ver §2.
- **Slots Astro:** `content` (cuerpo de página, lo que PageView renderiza hasta
  antes del pie) y `footer` (los SourceReferenceFooter de esa página,
  renderizados por la ruta). Si una página NO tiene SourceReference, la ruta
  SÍ provee un slot `footer` vacío para que toda hoja conserve la misma
  estructura vertical.
- **Layout interno:** columna flex. `content` es el cuerpo flexible;
  `footer` anclado al borde inferior con `margin-top:auto` (el espacio libre va
  arriba del pie; si el contenido excede la hoja, el pie fluye por debajo =
  overflow natural). Ambas hojas de un spread comparten alto + padding
  idénticos, así `margin-top:auto` deja los dos pies en la MISMA línea de base.
- **Sin overflow:hidden.** El desborde queda visible/medible (ver §5).

## 2. Geometría por contenedor (spread vs single)

El shell del lector en `web/src/pages/libro/p/[n].astro` es un **CSS
container** (`container-type: inline-size`). La decisión de *spread vs single*
se toma por el ANCHO REAL del contenedor (no viewport, no dispositivo) y
reacciona automáticamente a un resize (los container queries reflowean solos).

Variables (single source of truth):

| Variable | Valor | Rol |
|---|---|---|
| `--reader-gutter` | `48px` | canal central entre las dos hojas en spread |
| `--reader-sheet-max-w` | `420px` | tope de ancho de hoja (legibilidad) |
| `--reader-sheet-min-w` | `320px` | mínimo "legible" de hoja, solo para razonar el umbral |
| `--reader-spread-min` | `688px` | = 2×320 + 48 → umbral de spread |

**Umbral elegido:** `688px`. Rationale: dos hojas A5 a 320px de ancho cada una
(≥ mínimo legible) + canal de 48px = 688px de ancho de contenedor. Por debajo
de 688px el contenedor solo aloja UNA hoja (single); desde 688px caben las dos.

**Fórmulas de ancho por modo** (idénticas para toda página dentro del modo,
por eso todas las hojas del modo tienen las mismas dimensiones):

- **Single** (contenedor angosto): hoja = `min(100cqw, var(--reader-sheet-max-w))`,
  centrada horizontalmente.
- **Spread** (contenedor ancho): cada hoja =
  `min(calc((100cqw - var(--reader-gutter)) / 2), var(--reader-sheet-max-w))`,
  lado a lado con canal, alineadas arriba/abajo (mismo alto por aspecto).

**Mecánica de los dos modos:** en single se muestra SOLO el panel `.is-active`
(el de la página solicitada); en spread se muestran ambos (is-active solo
marca la página activa para el indicador de PageNav).

### Nota de sincronización CSS/JS

`--reader-spread-min` es la fuente de verdad para **PageNav** (lo lee vía
`getComputedStyle` dentro de un `ResizeObserver` sobre `[data-reader-shell]`),
de modo que JS nunca se desvía del CSS. El `@container (min-width: 688px)`
usa el **literal** 688px porque minificador `lightningcss` no acepta `var()`
dentro de una condición `@container`; hay un comentario explícito en
`[n].astro` pidiendo mantener ambos en sincronía al tunear.

## 3. Navegación sensible a resize (PageNav)

`web/src/components/react/PageNav.tsx` dejó de usar `matchMedia('(min-width:
1024px)')`. Ahora:

- Observa el contenedor real `[data-reader-shell]` con un `ResizeObserver`.
- Compara `clientWidth` del contenedor contra el umbral leído de
  `--reader-spread-min`.
- Comportamiento idéntico al de antes: spread → ±2 páginas (portada → next es
  [2|3], prev ninguno); single → ±1. Indicador: spread "L–R / total", single
  "n / total", portada sola "1 / total". Flechas de teclado + swipe con los
  objetivos del modo.
- SSR sigue sirviendo el chrome en single-mode antes de hidratar (default
  `isSpread=false`).

## 4. Footers anclados al pie (estructura uniforme)

Tanto `PageView` como `BandRoleLayout` DEJARON de emitir su propio
SourceReferenceFooter. La ruta computa los SourceReferenceFooter de cada página
desde sus assets QR (`footersFor`) y los renderiza en el slot `footer` del
PageShell de esa página. Resultado: spreads [6|7], [8|9], [12|13], [50|51],
[64|65], [78|79] tienen altos de hoja idénticos y ambos pies anclados al borde
inferior en la misma línea de base.

## 5. Diagnóstico de overflow (observador, nunca oculta)

La ruta incluye un `<script>` (cliente) que tras `load` y con un `ResizeObserver`
(re-measure con debounce) mide CADA `.sheet` a su ancho real renderizado (single
o spread):

- `data-overflow-v`: `content.scrollHeight > content.clientHeight + 1`
- `data-overflow-h`: `content.scrollWidth > content.clientWidth + 1`

Reporta por página `{ page, layout, overflow_horizontal, overflow_vertical }`
en consola y setea `data-overflow-h/v` en la hoja. Ve §6 sobre la verificación.

---

## 6. Verificación (best-effort del escritor)

```
npx astro sync    → OK
npx astro check   → 0 errors
npx astro build   → 158 pages OK (incluye /libro/p/{1,6,7,8,12,50,51,64,78,79})
```

- **Spreads (HTML build):** p6 y p7 contienen la spread [6|7] (cada página una
  vez, un solo `is-active` = la solicitada). p1 solo [1]. p51 blank presente
  con su nota de chrome FUERA de la hoja (sibling, no dentro). El
  SourceReferenceFooter está DENTRO del slot `footer` de la hoja, no en el
  cuerpo. ✔
- **Identidad dimensional:** todas las hojas usan el MISMO `aspect-ratio`
  (definido una vez en PageShell.astro) y la misma fórmula de ancho por modo.
  Sin lógica de alto por página y sin `min-height` para el alto de hoja. ✔
- **Overflow:** EL ESCRITOR **NO** pudo ejecutar el diagnóstico en navegador
  real (Chrome headless sin acceso a red en este entorno; sin Playwright/
  Puppeteer/jsdom instalados; sin instalar dependencias). Mediciones abajo son
  **estimadas por volumen de texto (NO medidas en navegador)** y deben ser
  re-verificadas por el orquestador con el `data-overflow-*` de un navegador.

  Estima (spread desktop, hoja 420px → caja interior 340×514px):

  | Spread | Página | Layout | Est. alto contenido | Overflow |
  |---|---|---|---|---|
  | 6–7 | 6 | band-role | ~530 | marginal (cercano) |
  | 6–7 | 7 | band-role | ~604 | probable |
  | 8–9 | 8 | band-role | ~1003 | sí |
  | 8–9 | 9 | visual-only | ~64 | no |
  | 12–13 | 12 | generic | ~284 | no |
  | 12–13 | 13 | generic | ~459 | no |
  | 50–51 | 50 | generic | ~993 | sí |
  | 50–51 | 51 | blank | 0 | no |
  | 64–65 | 64 | generic | ~345 | no |
  | 64–65 | 65 | generic | ~512 | marginal/no |
  | 78–79 | 78 | generic | ~464 | no |
  | 78–79 | 79 | generic | ~1149 | sí |

  **Lectura esperable:** la hoja A5 con el tope elegido (420px de ancho, 594px
  de alto) y la tipografía actual (serif 18px, leading-relaxed) es PEQUEÑA para
  las páginas densas (8, 50, 79). El diagnóstico está diseñado justamente para
  DETECTAR y REPORTAR esto, no para ocultarlo. Las páginas de contenido
  moderado (12, 13, 64, 65, 78, blanks, visual-only) caben. La cifra exacta de
  cada página debe confirmarse en navegador (el mecanismo `data-overflow-*` ya
  está desplegado y listo).

**Caveats:** las estimaciones asumen ~41 caracteres/línea a 340px y no modelan
el renderizado real de fuente, los word-wraps exactos ni el alto de imágenes
editoriales; por eso son orientativas. El orquestador debe re-verificar con el
diagnóstico en navegador.
