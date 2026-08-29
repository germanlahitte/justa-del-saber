# PAGE-REVIEW — Implementación editorial v0.1

> Implementación de las 22 decisiones de `PAGE-REVIEW-v0.1.md` sobre la **baseline V3 validada** del libro.
> **Esta fase NO regenera el pipeline**: no se ejecutó ningún build de modelo, extracción de assets ni re-baseline.
> Todo el contenido BOOK permanece **verbatim**; solo se añade una capa editorial `EDITORIAL` por encima.

---

## 1. Resumen ejecutivo

Esta implementación materializa la capa editorial sobre el libro **sin tocar la fuente de verdad** (DOCX/PDF)
ni los modelos derivados (`book-model`, `page-model`, `assets-manifest`). Se apoya en dos principios:

1. **Anclas, no texto inventado**: toda cita/fragmento/firma se resuelve por rango `docx_paragraph_index` contra
   los bloques BOOK existentes en render-time. Nada se escribe a mano.
2. **Layered editing**: la semántica nueva vive en `data/editorial/`; los únicos archivos de datos editados son
   los dos cambios editoriales aprobados (índice p58 y las dos `SourceReference` corregidas).

La validación final confirma que **la baseline no se degradó**:

| Verificación | Resultado |
|---|---|
| `tools/verify_rebaseline_assets.py` — G1 identidad (55 assets, SHA únicos) | ✅ PASS |
| G2 colocación (0 drift de página) | ✅ PASS |
| G3 contenido (0 drift vs baseline editorial aprobada) | ✅ PASS |
| `npx astro build` (158 páginas) | ✅ PASS |
| `npx astro check` (0 errores / 0 warnings) | ✅ PASS |

---

## 2. Modelo en capas (recordatorio del contrato)

```
BOOK            contenido original  (text_verbatim)   -> intocable
PAGE MODEL      distribución física real por página    -> data/page-model.json (intocable)
PAGE EDITORIAL  asociaciones de PRESENTACIÓN sobre bloques BOOK  -> data/editorial/  (nuevo)
```

`PAGE EDITORIAL` nunca inserta en `text_verbatim`, nunca usa CSS codificado por página y nunca busca cadenas
en runtime. Cada entrada es una **regla anclada por rango de párrafo DOCX**, resuelta sobre la colección
`pages` de Astro.

---

## 3. Fuente de datos: `page-editorial.json`

Nuevo archivo `data/editorial/page-editorial.json`, con un `entries[]` unificado discriminado por `rec_type`:

| `rec_type` | Significado | Campos clave |
|---|---|---|
| `quote` | Cita o fragmento musical en itálica, alineado a la derecha | `page`, `kind` (`excerpt`\|`quote`), `docx_paragraph_range`, opcional `attribution_docx_paragraph`, opcional `group` |
| `web_source_reference` | Footer de fuente **web-only** que **reutiliza** una `SourceReference` canónica (sin QR nuevo) | `page`, `qr_asset_id`, `photo_align_right`, `suppress_credit_range` |
| `editorial_footer` | Texto BOOK movido al pie derecho de la hoja | `page`, `docx_paragraph_range` |

### 3.1 Presentaciones por página (resumen)

| Página | Tipo | Rango `docx_paragraph_index` | Nota / atribución |
|---|---|---|---|
| p1 | layout `cover` | Títulos 0–2 | Los bloques `Title` de BOOK se componen en portada; texto verbatim |
| p3 | layout `right-italic` | todo el cuerpo | Dedicatoria completa en derecha + cursiva (decisión PAGE-REVIEW) |
| p5 | `editorial_footer` | [50, 51] | Firma final del prólogo movida al pie derecho |
| p13 | `excerpt` ×2 | [256, 258] · [266, 269] | Hermética ×2; el segundo fragmento (group 2) recibe mayor separación |
| p23 | `quote` | [398, 398] + atribución [399] | Juan Bautista Alberdi |
| p24 | `excerpt` | [403, 406] | Memoria de siglos — Hermética |
| p30 | `excerpt` | [537, 540] | Cautivos del sistema — V8 (decisión es **p30**, no p31) |
| p49 | `quote` | [915, 915] + atribución [916] | Juan Domingo Perón |
| p58 | `excerpt` | [1042, 1044] | Camino al sepulcro — V8 |
| p65 | `excerpt` ×2 | [1136, 1141] · [1149, 1153] | Hermética + Almafuerte; group 2 separado |
| p75 | `quote` | [1339, 1339] + atribución [1340] | Julia Prilutzky Farny |

> **Regla de atribución (consumida, no duplicada)**: en `quote`, la línea de autor/fuente se toma del bloque en
> `attribution_docx_paragraph` (nunca se escribe a mano). Ese párrafo **es consumido** por `<EditorialQuote>`
> y **no** se vuelve a renderizar como párrafo BOOK normal en el body (ver §5).

### 3.2 p24 — Asociación de fuente web-only (decision 9)

En el libro impreso este QR **no se repite** (la misma canción "Memoria de Siglos — Hermética" ya fue
referenciada en p13). En web:

- `rec_type: web_source_reference`, `qr_asset_id: asset-image24` → **reutiliza** la `SourceReference`
  canónica existente (Hermética · Ácido Argentino · 1991). **No** se crea una entrada nueva en
  `source-references.json` ni un QR nuevo.
- `photo_align_right: true` → la foto del asset se alinea a la derecha de la hoja.
- `suppress_credit_range: [408, 410]` → suprime el bloque técnico de crédito del cuerpo en esa página.

### 3.3 p5 — Firma editorial al pie (decision 5)

`editorial_footer` mueve la firma del prólogo ([50, 51]: "Germán Lahitte — Junio 2024" /
"germanlahitte@gmail.com") del cuerpo genérico a un footer derecho anclado al pie de la hoja. Texto BOOK verbatim.

### 3.4 p1 — Portada (decision 3)

`page-presentation.json` asigna a p1 `layout: "cover"`. La rama `cover` de `PageView` compone los bloques
`Title` existentes de BOOK (0–2) en composición de portada; **todo el contenido BOOK se conserva verbatim**,
solo cambia la presentación.

### 3.5 p3 — Dedicatoria toda la página en derecha y cursiva

`page-presentation.json` asigna a p3 `layout: "right-italic"` (decisión PAGE-REVIEW). Es una **regla editorial
semántica sobre TODA la página**: el cuerpo completo (dedicatoria: "A Joni, que puso Almafuerte en mi
walkman" … "¡Vamos, che!") se presenta **alineado a la derecha y en cursiva**. Se resuelve como **presentación
de layout en la capa EDITORIAL**, nunca como CSS hardcodeado por número de página. El contenido BOOK permanece
verbatim (`text_verbatim_slice`); solo cambian alineación y énfasis.

---

## 5. Consumo sistémico de párrafos (attribution / footer / suppress)

Los defectos de revisión detectaron que p23 (["JB Alberdi", parr. 399]), p49 (["J.D. Perón", parr. 916]) y
p75 (["Julia Prilutzky Farny", parr. 1340]) renderizaban su atribución **dos veces**: una dentro de
`<EditorialQuote>` y otra como párrafo BOOK normal alineado a la izquierda.

**Corrección sistémica** (no suppressRanges manuales por página): si un párrafo es **consumido** por una
representación editorial, PageView lo considera `CONSUMED` y no lo renderiza en el flujo genérico.

```text
consumedParagraphs =
    quote ranges                 (se muestran como <EditorialQuote>)
  + attribution docx paragraphs  (consumidos por la cita, no en body)
  + editorial footer ranges      (p5, movidos al pie)
  + explicit suppress ranges     (p24 crédito [408,410])
```

Implementación:

- `EditorialQuoteData` ahora lleva `attributionDocxParagraph` (el índice del párrafo de atribución).
- La ruta lo propaga desde `e.data.attribution_docx_paragraph`.
- `PageView` lo agrega al conjunto de supresión → el párrafo de atribución aparece **una sola vez**, dentro
  de la cita.

> Resultado verificado: p23 → "JB Alberdi" ×1 · p49 → "J.D. Perón" ×1 · p75 → "Julia Prilutzky Farny" ×1,
> siempre dentro del `<blockquote>` derecho y en itálica, sin párrafo genérico duplicado.

---

## 4. Cambios a `source-references.json` (decisiones 6 y 16)

Los **únicos** dos cambios de contenido a datos en toda la fase (más el índice p58). Ambos son correcciones
editoriales aprobadas, no regresión:

### 4.1 p79 — riqueteo de canción (`asset-image34`, pdf_page 78)

| Campo | Antes | Después |
|---|---|---|
| `title` | Por ser yo | **Si me ves volver** |
| `album` | (—) | **Trillando la fina** |
| `year` | 2001 | **2012** |
| `band` | Almafuerte | Almafuerte (sin cambio) |

Se mantienen sin cambios `band` (Almafuerte), `qr_value` y `credit_paragraph_range` [1426, 1428].
La canción "Por ser yo" también existe en `asset-image55` (pdf_page 77) y **se deja intacta**.

**Render (web)**: al ser `source_ref.type: song`, el footer muestra `Si me ves volver` /
`Almafuerte · Trillando la fina` / `2012`.

### 4.2 p7 — descripción de conferencia de prensa (`asset-image35`, pdf_page 7)

| Campo | Antes | Después |
|---|---|---|
| `description` | Conferencia de prensa de Hermética — Oberá Rock, 1993 | **Conferencia de Prensa** |

Se mantienen intactos `band` (Hermética), `event` (Oberá Rock) y `year` (1993).

**Render (web)**: al ser `source_ref.type: press-conference`, el footer muestra `Conferencia de Prensa` /
`Hermética · Oberá Rock` / `1993` — la descripción se acorta pero la riqueza de metadata persiste
(decision 14 cubre la forma del footer; el texto técnico del QR se consolida en el pie).

### 4.3 p58 — entrada de índice (decision 13)

`data/editorial/book-index.json` añade la entrada `{ id: "la-libertad-individual", label: "La libertad
individual", operation: "rename" }` sobre la página 58, que reemplaza el run combinado "Desarrollo de la
subjetividad / La libertad individual" por el rótulo único **La libertad individual**.

---

## 6. Re-baseline de G3 (CONTENT) — decisión explícita

`tools/verify_rebaseline_assets.py` G3 compara el contenido de referencias contra un baseline. Era
actualizado con un **histórico** de pre-rebaseline, por lo que tras los dos cambios editoriales intencionales
(decisiones 6 y 16) marcaba drift permanente (falsa alarma en cada corrida).

**Resolución acordada** (no es regresión de datos — son dos ediciones deliberadas):

- Se creó el snapshot explícito del estado aprobado: `data/baselines/source-references-approved-v1.json`
  (byte-idéntico al `source-references.json` actual, 43 referencias, con los cambios p7/p79).
- G3 **ahora compara contra ese baseline aprobado**, no contra el backup histórico.
- El histórico `data/_pre-rebaseline-v3-backup/source-references.json` **se preserva intacto** como
  trazabilidad (verificado: conserva "Por ser yo" y la descripción completa de 1993).

> Resultado: **G1 PASS · G2 PASS · G3 PASS · build PASS**, con validación del estado final aprobado.

---

## 7. Archivos tocados / creados

### Data (solo los 2 cambios de datos + la capa editorial)

| Archivo | Tipo | Cambio |
|---|---|---|
| `data/editorial/page-editorial.json` | **creado** | Capa editorial: `entries[]` con `rec_type` (quote / web_source_reference / editorial_footer) |
| `data/editorial/page-presentation.json` | editado | p1 → `layout: "cover"`; p3 → `layout: "right-italic"` (dedicatoria derecha + cursiva) |
| `data/editorial/book-index.json` | editado | p58 → `rename` "La libertad individual" |
| `data/source-references.json` | editado | `asset-image34` (p79) + `asset-image35` (p7) |
| `data/baselines/source-references-approved-v1.json` | **creado** | Baseline editorial aprobada para G3 |

### Web (implementación frontend)

| Archivo | Cambio |
|---|---|
| `web/src/content.config.ts` | Nueva colección `pageEditorial`; `pagePresentations.layout` acepta `band-role`\|`cover`\|`right-italic`; `role` opcional |
| `web/src/components/PageView.astro` | Props editoriales (`editorialQuotes`, `editorialFooterRange`, `suppressRanges`, `photoAlignRight`); ramas `cover` y `right-italic` (p3); inserción de citas en orden doc; consumición sistémica de atribución/footer/suppress; footer p5; p24 foto a la derecha |
| `web/src/components/EditorialQuote.astro` | **nuevo** — bloque de cita en itálica alineado a la derecha con atribución (el párrafo de atribución se consume aquí, no en body) |
| `web/src/lib/editorialQuote.ts` | **nuevo** — `EditorialQuoteData` (incluye `attributionDocxParagraph`) |
| `web/src/pages/libro/p/[n].astro` | `buildPageProps()` resuelve anclas contra `page.data.blocks` y propaga `attributionDocxParagraph`; `webFootersFor()` reutiliza la `SourceReference` canónica sin QR |

### Herramientas

| Archivo | Cambio |
|---|---|
| `tools/verify_rebaseline_assets.py` | G3 compara contra `data/baselines/source-references-approved-v1.json` (no contra el histórico) |

---

## 8. Lo que NO se tocó

- `book/Graves decires de aguda intuición.{docx,pdf}` — fuente de verdad intacta.
- `book-model.json`, `page-model.json`, `assets-manifest.json`, `source-references.json` (estructura), y el
  resto de archivos derivados — intactos.
- **No** se ejecutaron: `build_model.py`, `build_book_model.py`, `build_page_model.py`, `extract_assets.py`,
  `resolve_readings_book_links.py`, ni ninguna regeneración/re-baseline.

---

## 9. Lista de verificación del usuario (VERIFICACIÓN)

| Ítem | Estado |
|---|---|
| p3: dedicatoria TODA la página en derecha + cursiva | ✅ (`layout: "right-italic"`, body 13/13 derecha + itálica, verbatim) |
| p23: cita Alberdi + atribución consumida (una sola vez) | ✅ ("JB Alberdi" ×1, dentro del `blockquote`) |
| p49: cita Perón + atribución consumida (una sola vez) | ✅ ("J.D. Perón" ×1, dentro del `blockquote`) |
| p75: cita Prilutzky Farny + atribución consumida (una sola vez) | ✅ ("Julia Prilutzky Farny" ×1, dentro del `blockquote`) |
| Consumo sistémico de parágrafos (attribution/footer/suppress) | ✅ sin duplicados en body |
| Footers de nota / fuente en el pie derecho | ✅ consolidados al pie |
| Créditos técnicos suprimidos del cuerpo | ✅ (`suppress_credit_range`) |
| p24: footer de fuente web-only + foto derecha | ✅ |
| p1: portada (cover) | ✅ |
| p5: firma editorial al pie (consumida una vez) | ✅ |
| Citas/fragmentos en itálica a la derecha | ✅ (p13/23/24/30/49/58/65/75) |
| p7: "Conferencia de Prensa" | ✅ |
| p79: "Si me ves volver" / Trillando la fina / 2012 | ✅ |
| p58: índice "La libertad individual" | ✅ |
| Baseline sin regeneración (G1/G2/G3 + build) | ✅ |

---

## 10. Siguiente paso

**Revisión visual del usuario.** Esta implementación está funcional y validada; la aceptación final
depende de la revisión en navegador. **No** se harán más ajustes estéticos después de este punto salvo
que se reporte un defecto concreto.
