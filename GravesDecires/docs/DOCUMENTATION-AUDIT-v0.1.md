# DOCUMENTATION AUDIT — v0.1

Auditoría semántica de la **documentación activa** de Graves decires para:

- separar rol por rol qué documento es **estado actual**, **operativo**, **deuda**, **provenance** o **histórico**;
- decidir qué queda **ACTIVE**, qué pasa a **PROVENANCE** y qué a **HISTORICAL**;
- preparar `docs/CURRENT-STATE.md` como **entrada principal** del proyecto;
- proponer una **Fase 1.5** de consolidación (qué mover tras la auditoría).

> **Alcance:** solo documentación activa. No se ejecutó ni Fase 2 ni ningún movimiento.
> No se tocaron herramientas, datos canónicos ni frontend.
> Estado: **pendiente de aprobación** del usuario para crear `CURRENT-STATE.md` y mover archivos.

---

## 0. Hecho de contexto que gobierna toda la auditoría

**Ningún archivo `.md` es consumido por la web ni por el gate.** La web
(`web/src/content.config.ts`) y el gate (`tools/verify_rebaseline_assets.py`)
consumen **solo los JSON canónicos**. Todo `.md` activo es documentación para
humanos. Por eso "CURRENTLY REQUIRED?" significa *"un humano necesita leer esto
para entender o trabajar con el estado actual"* y "CAN CURRENT-STATE LINK?"
significa *"CURRENT-STATE.md debería apuntar acá"*.

Dos piezas son **load-bearing** y no deben perderse al consolidar:

- el **gate de regresión** G1/G2/G3 (`tools/verify_rebaseline_assets.py`), cuyo
  diseño y baseline viven en documentos de `docs/web/`;
- el **baseline G3** `data/baselines/source-references-approved-v1.json`, cuya
  justificación escrita está en `PAGE-REVIEW-IMPLEMENTATION`.

---

## 1. Tabla de documentos activos

### 1.1 `docs/`

| PATH | ROLE | CURRENTLY REQUIRED? | WHAT UNIQUE INFORMATION | CAN CURRENT-STATE LINK? | MOVE TO HISTORY AFTER CONSOLIDATION? | PROPOSED ROLE |
|---|---|---|---|---|---|---|
| `docs/README.md` | Índice de navegación de todo el árbol de documentación (convenciones + gate + comandos) | **SÍ** — quien entra a `docs/` lo usa para ubicarse | Taxonomía CANONICAL/ACTIVE/HISTORICAL/BACKUP; mapa de rutas; comando del gate; nota de Fase 2 sobre `_pre-rebaseline-*` | — (es el índice) | No — es el índice, se actualiza | **CURRENT-STATE** (navegación) |
| `docs/README-analysis.md` | Índice/paquete de análisis interpretativo con las **6 Reglas de capas FUTURE-ANALYSIS** | **SÍ, parcial** — las 6 reglas son la única declaración escrita del contrato de capas | 6 Reglas: BOOK inmutable; EDITORIAL agrega metadata sin tocar BOOK; FUTURE-ANALYSIS=numeraciones; la web distingue siempre fuente/metadata/interpretación, etc. Los artefactos que inventaría (v0.2/v0.1) están superados | Sí | Parcial — promover las 6 Reglas a CURRENT-STATE/spec antes de archivar | **ARCHITECTURE** (con contrato vigente a consolidar) |
| `docs/audits/NORMALIZATION-VERIFICATION-v0.3.json` | Verificación machine-readable PASSED (concepts=32, readings=33, 0 refs inválidas) | **NO** — resultado ya capturado; aserciones re-derivables de datos + reports | Un snapshot congelado PASSED de integridad de normalización v0.3 | No (es artefacto puntual, no spec) | Sí | **PROVENANCE** |

### 1.2 `docs/web/` (los 11 pedidos explícitamente)

| PATH | ROLE | CURRENTLY REQUIRED? | WHAT UNIQUE INFORMATION | CAN CURRENT-STATE LINK? | MOVE TO HISTORY AFTER CONSOLIDATION? | PROPOSED ROLE |
|---|---|---|---|---|---|---|
| `docs/web/A5-GEOMETRY-v0.1.md` | Spec de la geometría del shell de lectura A5 (PageShell, container queries spread-vs-single, PageNav, anclaje footer, diagnóstico de overflow) | **SÍ** — todo dev que toque layout del lector / CSS de página / PageNav | **Umbral spread 688px**; `--reader-sheet-max-w 420px` / `--reader-sheet-min-w 320px` / `--reader-gutter 48px`; regla de sync CSS/JS (literal `688px` en `@container` porque lightningcss rechaza `var()`, con comentario keep-in-sync); `margin-top:auto` del footer; contrato de diagnóstico `data-overflow-v/h` | Sí | No | **CURRENT-STATE / ARCHITECTURE** |
| `docs/web/BOOK-REBASELINE-v0.1.md` | Auditoría que produjo el re-baseline v0.1 y la **generalización SourceReference** | **NO como revisión** (superado por V2/V3) — **SÍ como registro escrito de dos principios vigentes** | Método de re-baseline DOCX; **regla de identidad de contenido SHA-256** para assets; DEC-05 `superseded-by-book-rebaseline`; generalización SongReference→SourceReference (typed `song\|press-conference\|…`); DEC-13/14 resueltos por `asset_sha256` | Parcial (enlazar los principios vivos, no el cuerpo de la auditoría) | Sí — tras promover las 2 reglas | **PROVENANCE** (porta principios vigentes) |
| `docs/web/PAGE-REVIEW-v0.1.md` | Planilla de revisión editorial página por página (todos los status PENDIENTE) con metadata precomputada | **NO** — la revisión se ejecutó y sus resoluciones quedaron en datos, capturadas en IMPLEMENTATION | Matriz precomputada por página: headings/layout/SourceReference ("qué mirar") | No | Sí | **PROVENANCE / OPERATIONS-template** |
| `docs/web/PAGE-REVIEW-IMPLEMENTATION-v0.1.md` | Registro de cómo se implementaron las 22 decisiones de PAGE-REVIEW (capa editorial, re-apuntado baseline G3) | **SÍ** — es la autoridad escrita del baseline G3 y del contrato de edición en capas | **G3 ahora compara contra `data/baselines/source-references-approved-v1.json`**; modelo page-editorial anclado por `docx_paragraph_index`; regla sistémica de párrafo `CONSUMED`; las 2 ediciones aprobadas de source-reference (p79 "Si me ves volver", p7 "Conferencia de Prensa") | Sí | No | **ARCHITECTURE / OPERATIONS** |
| `docs/web/REBASELINE-V3-v0.1.md` | Auditoría del re-baseline V3 (página en blanco 63, 47 unidades, 113 readings re-resueltas, fallback source-ref RESTORED) | **NO como descripción operativa** (su descripción de estado final la superó ASSET-REPAIR; su tabla de re-link vive en BOOK-LINK-REBASELINE-V3-REPORT) | Método de re-resolución por identidad de contenido y explicación del fallback RESTORED | No | Sí | **PROVENANCE / HISTORICAL** |
| `docs/web/REBASELINE-V3-ASSET-REPAIR-v0.1.md` | Diseño + verificación de la **reparación del pipeline de assets SHA-first** y del **gate de regresión permanente** | **SÍ** — es el diseño del propio gate (`verify_rebaseline_assets.py`) y de la capa de identidad SHA-first de la que dependen `content.config.ts`/assets | G1 identidad, G2 placement (`pdf_page` derivado de SHA), G3 contenido vs baseline validado, G4 imágenes editoriales; principio "el filename es desechable, el SHA es la identidad"; test negativo del gate | Sí | No | **ARCHITECTURE / OPERATIONS** |
| `docs/web/REBASELINE-V3-RENDER-REGRESSION-v0.1.md` | Causa raíz + evidencia de la regresión de render (assets-manifest perdió 2 campos requeridos por schema) | **SÍ** — documenta un contrato que sigue vigente: `assets-manifest` DEBE llevar `association_status`/`association_method` (aún requerido por el schema de `content.config.ts`) + trazas end-to-end foot/photo/credit | La causa del quiebre de schema; traza end-to-end (asset→page→footer→supresión); estado ReadingTrigger-fuera-del-sheet | Sí | No (trace autoritativa de ese modo de fallo + contrato vivo de schema) | **ARCHITECTURE** (naturaleza incidente/provenance) |
| `docs/web/STRUCTURAL-FIXES-v0.1.md` | Registro de 3 correcciones sistémicas: merge de heading multilínea, dedupe de créditos, preservación de versos/saltos de línea | **SÍ** — quien toque `pageIndex.ts`, `PageView` o tooling de preservación de palabras lo necesita; sus contratos están vivos | Regla `mergeHeadingRuns()`; esquema de supresión `credit_paragraph_range` (hoy en schema de `content.config.ts`); **regla PDF=paginación fuente / DOCX=estructura interna de texto**; decisión `whitespace-pre-line` | Sí | No | **ARCHITECTURE / CURRENT-STATE** |
| `docs/web/TECH-DEBT-READINGS-EVIDENCE-v0.1.md` | **Registro de deuda de READINGS** — la fuente de verdad para la sección de deuda de CURRENT-STATE | **SÍ** — si no se sabe por qué READINGS arrastra evidencia stale, este es el doc | Los 2 ítems de deuda (111 `evidence.docx_paragraph_range` stale, 24 `matched_anchors` sin match literal) con números exactos, verificación y el encuadre "read-only, no arreglar en silencio" | Sí (la sección de deuda de CURRENT-STATE debe espejarlo) | No — hasta que la deuda se resuelva/re-registre en CURRENT-STATE | **TECH-DEBT / OPERATIONS** |
| `docs/web/VISUAL-PROTOTYPE-v0.2.md` | Prototipo v0.2 que introdujo el **modelo Page** (BookUnit ≠ página) | **NO como geometría** (la geometría la superó A5-GEOMETRY) — **SÍ como fundamento conceptual del modelo Page** | Decisión de que `page-model.json` es la superficie primaria de MODO LEER y BookUnit es trazabilidad interna (aún en `content.config.ts`); principios de página en blanco/continuación sin texto de sistema; granularidad ReadingDrawer por unidad | Parcial | Sí — tras promover la racional del modelo Page | **PROVENANCE / HISTORICAL** (porta decisiones conceptuales vigentes) |
| `docs/web/WEB-EXPERIENCE-v0.1.md` | Propuesta de arquitectura UX (sitemap, modelo de modos, patrón drawer, dirección visual) | **SÍ parcial** — los patrones aprobados están implementados y siguen rigiendo (drawer/bottom-sheet, MODO LEER sin fetch antes de activación, no `/ensayos`); el resto es historial de diseño superado | La decisión del drawer contextual (implementado como ReadingDrawer), regla de lazy-load de MODO LEER, dirección visual "mapa longitudinal" & band-axis (implementada), decisión de diferir `/ensayos` | Sí | Parcial — promover lo aprobado vigente, archivar el resto | **ARCHITECTURE** (propuesta cuyo núcleo aprobado es estado actual) |

### 1.3 `content/` (documentos activos, NO los JSON canónicos)

| PATH | ROLE | CURRENTLY REQUIRED? | WHAT UNIQUE INFORMATION | CAN CURRENT-STATE LINK? | MOVE TO HISTORY AFTER CONSOLIDATION? | PROPOSED ROLE |
|---|---|---|---|---|---|---|
| `content/readings/READINGS-v0.3-REPORT.md` | Reporte de consolidación PASSED confirmando el archivo canónico | **SÍ, leve** — el chequeo humano de que `readings-v0.3.json` es la versión en uso y los intermedios son historia | Conteos finales (33 readings, 113 book refs, 133 concept refs, 109 connections, 21 tags, 0 labels legacy) + lista de contratos | Sí | Sí (aserciones re-derivables de datos) | **OPERATIONS / PROVENANCE** |
| `content/readings/README-READINGS-v0.3.md` | How-to para correr `consolidate_readings_v03.py` + layout estructural | **NO** — la consolidación ya corrió y produjo v0.3 | El comando exacto de consolidación y el layout recomendado `content/`+`tools/` (receta para re-correr) | No | Sí | **OPERATIONS / HISTORICAL** |
| `content/readings/BOOK-LINK-REBASELINE-V3-REPORT.md` | Tabla machine del re-link V3: unidad vieja→nueva de las 113 book refs | **SÍ** — es el registro auditable de lo que el re-resuelto V3 cambió realmente (0 fallos) | Tabla por-reading de shift old/new `book_unit` (ej. unidades ≥39 → +1) y desglose de campos cambiados | Sí | No (es el ledger autoritativo del re-link) | **OPERATIONS / PROVENANCE** |
| `content/concepts/CONCEPTS-v0.3.md` | **Espejo legible** de `concepts-v0.3.json` (32 concepts) | **SÍ** — es la spec editorial legible de la ontología de concepts | Ontología completa: definiciones, distinciones clave, hipótesis, fórmulas y relaciones tipadas — la spec en prosa que el JSON codifica | Sí | No (spec canónica legible; se conserva como versión humana de la ontología de CURRENT-STATE) | **EDITORIAL-SPEC / CURRENT-STATE** |
| `content/maps/MASTER-MAP-v0.2.md` | **Espejo legible** de `master-map-v0.2.json` (9 arcos, 8 hipótesis, eje bandas, estructura terminal) | **SÍ** — es la spec legible del mapa estructural | Los 9 arcos con preguntas+claims+IDs concept/reading; H-01..H-08; meta-eje V8/Hermética/Almafuerte; secuencia terminal; regla "MASTER MAP no duplica BOOK" | Sí | No (spec canónica legible) | **EDITORIAL-SPEC / CURRENT-STATE** |
| `content/maps/MASTER-MAP-v0.2-REPORT.md` | Reporte de verificación PASSED | **SÍ, leve** — confirma 9 arcos / 8 hipótesis / 0 refs huérfanas | Conteos PASSED congelados y la aserción "no hay texto de BOOK duplicado" | No | Sí | **PROVENANCE** |
| `content/maps/README-MASTER MAP-v0.2.md` | Placement + contrato + cómo se genera/sitúa el mapa | **NO** — placement/generación ya hechos; el contrato repite lo que declara `depends_on` del JSON | El layout recomendado y la instrucción "v0.1 puede ir a history" | No | Sí | **OPERATIONS / HISTORICAL** |

---

## 2. Decisiones VIGENTES que viven solo en documentos (consolidar antes de archivar)

Estas decisiones **todavía gobiernan el sistema** pero **NO están** en datos
canónicos ni en una spec vigente. Si archivamos su documento fuente sin
consolidarlas, se pierden. Deben migrar a `CURRENT-STATE.md` (o a una spec
enlazada desde él) **antes** de que su fuente pase a provenance/histórico.

1. **`docs/README-analysis.md` → las 6 Reglas de capas.** Las más críticas:
   *BOOK permanece inmutable*, *EDITORIAL agrega metadata sin modificar BOOK*,
   *la web debe distinguir siempre fuente, metadata e interpretación*. (Es la
   razón de que `content.config.ts` trate BOOK como read-only y de que todo lo
   editorial viva en `data/editorial/`.)
2. **`BOOK-REBASELINE-v0.1.md` →** (a) **identidad de asset = SHA-256 del contenido,
   nunca el filename interno del DOCX** (Word renumera en cada re-save);
   (b) **las nuevas decisiones editoriales de asset se dirigen por `asset_sha256`,
   no por `asset_id`** (DEC-13/14 en adelante).
3. **`VISUAL-PROTOTYPE-v0.2.md` → el modelo Page es la superficie MODO LEER;
   BookUnit es solo trazabilidad interna** (núcleo conceptual que aún da forma a
   `content.config.ts`), + el principio **no-inventar-texto-de-sistema** para
   páginas en blanco/continuación.
4. **`REBASELINE-V3-ASSET-REPAIR-v0.1.md` + `RENDER-REGRESSION-v0.1.md` →
   el contrato del gate G1/G2/G3** (identidad y placement tan baratas que
   `pdf_page` debe igualar el match perceptual resuelto por SHA; READINGS no debe
   re-resolverse contra un modelo viejo, duplicaría el +1) **+ el requisito de
   schema `association_status`/`association_method`** en `assets-manifest`.
5. **`WEB-EXPERIENCE-v0.1.md` → los contratos UX aprobados/implementados:**
   drawer contextual; **MODO LEER no debe fetchear Readings hasta activación
   explícita** (lazy, no `display:none`); dirección del mapa band-axis; no `/ensayos` aún.
6. **`PAGE-REVIEW-IMPLEMENTATION-v0.1.md` → el baseline G3** apunta a
   `source-references-approved-v1.json` + el modelo de edición en capas anclado
   por `docx_paragraph_index`.
7. **`TECH-DEBT-READINGS-EVIDENCE-v0.1.md` → los 2 ítems de deuda** (verbatim, §5).

---

## 3. Decisiones conceptuales vigentes en histórico (conservar referencia)

Estos docs **ya están** en `history/`, pero portan una decisión que sigue viva y
que `CURRENT-STATE` debería citar como referencia de provenance:

- `docs/web/history/REBASELINE-V2-v0.1.md` → el criterio **la canción de dos
  páginas permanece en el mismo pliego** (V3 confirma "se mantiene").
- `data/history/process/ETAPA-1.5-*` → las DEC-01..DEC-12 de la capa editorial
  (ya codificadas en `data/editorial/*.json`; verificado por `verify_editorial_layer.py`).

---

## 4. Deuda técnica ABIERTA (fuente de verdad = `TECH-DEBT-READINGS-EVIDENCE-v0.1.md`)

Para la sección de deuda de `CURRENT-STATE`, espejar estos **dos** ítems:

1. **111 `evidence.docx_paragraph_range` stale** (en 39 unidades) en
   `readings-v0.3.json[]book_refs[].evidence.docx_paragraph_range` — corridos −1 por
   el merge de heading del DOCX. **No bloqueante** (`book_unit` ints 1–47
   intactos y válidos). Fix = re-derivación mecánica desde `book-model.json`
   vigente durante una futura normalización de READINGS; no urgente.
2. **24 `matched_anchors` sin match literal de texto** (ej. "La Estética"
   anclada desde `reading-estetica-etica-sintesis` contra la unidad 2, que no la
   contiene — vive en la 3). **Pre-existente**, no es regresión V3 (verificado
   idéntico en `_pre-rebaseline-backup`). Heredado del linker original v0.2→v0.3.
   **Requiere decisión editorial por caso:** (a) ajustar `book_unit` a la unidad
   vecina, o (b) tratar como paráfrasis y renombrar/dropar el requisito de match
   literal. **No debe resolverse en silencio.**

Ambos están *documentados, no corregidos* — READINGS, CONCEPTS y MASTER MAP quedan intactos.

---

## 5. Propuesta de `docs/CURRENT-STATE.md`

**CORTO, snapshot, sin cronología.** Se redactaría al aprobarse esta auditoría.

```markdown
# Current State

> Snapshot vigente del proyecto. Para índices/navegación ver `docs/README.md`.
> Datos canónicos = lo que consumen la web y el gate (rutas estables, no mover).

## 1. Estado
- 79 páginas · 47 BookUnits · 55 assets · 43 SourceReferences
- Concepts v0.3 · Readings v0.3 · Master Map v0.2
- Build: 158 páginas · `astro check` 0 errores · gate G1/G2/G3 PASS

## 2. Capas
| Capa | Archivo canónico | Función | Qué puede/no puede modificarse |
|------|------------------|---------|-------------------------------|
| BOOK | `data/book-model.json` | texto del libro + paginación | inmutable; solo re-baseline aprobado |
| PAGE | `data/page-model.json` | superficie MODO LEER | sí, vía capa editorial |
| ASSET | `data/assets-manifest.json` | identidad SHA + placement | identidad = SHA-256 (filename es desechable) |
| EDITORIAL | `data/editorial/*.json` (5) | metadata sobre BOOK | sí; anclado por `docx_paragraph_index` |
| READINGS | `content/readings/readings-v0.3.json` | análisis | con normalización; ver deuda §6 |
| CONCEPTS | `content/concepts/concepts-v0.3.json` | ontología | con normalización |
| MASTER MAP | `content/maps/master-map-v0.2.json` | mapa estructural | con normalización; no duplica BOOK |
| WEB | `web/` (astro) | presentación | Modo Leer con fetch-lazy de Readings |

## 3. Modo Leer
Page · Spread · SourceReferenceFooter · editorial quotes/excerpts ·
ReadingTrigger · blank pages · índice editorial.
(Geometría A5: ver `docs/web/A5-GEOMETRY-v0.1.md`.)

## 4. Sources of Truth (paths canónicos)
- `data/book-model.json`, `data/page-model.json`, `data/assets-manifest.json`,
  `data/source-references.json`, `data/editorial/*.json` (5),
  `content/concepts/concepts-v0.3.json`, `content/readings/readings-v0.3.json`,
  `content/maps/master-map-v0.2.json`,
  `data/baselines/source-references-approved-v1.json` (baseline G3).

## 5. Regression Gates
`python tools/verify_rebaseline_assets.py` → G1 identidad · G2 placement ·
G3 contenido vs baseline. Debe dar **ALL GATES PASS**.
(`cd web && npx astro check && npx astro build`)

## 6. Deuda técnica abierta
1. 111 `evidence.docx_paragraph_range` stale (mecánico, no urgente).
2. 24 `matched_anchors` sin match literal (decisión editorial por caso).
   Detalle y evidencia: `docs/web/TECH-DEBT-READINGS-EVIDENCE-v0.1.md`.

## 7. Documentación especializada (links)
- Arquitectura: `docs/README-analysis.md` (6 Reglas) · `STRUCTURAL-FIXES` ·
  `REBASELINE-V3-ASSET-REPAIR` · `RENDER-REGRESSION` · `PAGE-REVIEW-IMPLEMENTATION`
- Editorial/web: `A5-GEOMETRY` · `WEB-EXPERIENCE` · `data/editorial/*.json`
- Concepts: `content/concepts/CONCEPTS-v0.3.md`
- Readings: `READINGS-v0.3-REPORT.md` · `BOOK-LINK-REBASELINE-V3-REPORT.md`
- Master Map: `content/maps/MASTER-MAP-v0.2.md`
- Operaciones: comandos de gate/build · re-baseline (ver provenance)
- Histórico: `docs/web/history/` · `data/history/` · `content/*/history/`
```

**Decisiones vigentes a consolidar ahí** (no duplicar cuerpos): las 6 Reglas de
capas (§2.1), identidad SHA-256 (§2.2), modelo Page = MODO LEER (§2.3), contrato
del gate G1/G2/G3 + schema `association_status`/`method` (§2.4), contratos UX
aprobados (§2.5), baseline G3 (§2.6) y la deuda (§2.7).

---

## 6. Ajuste de `docs/README.md`

Una vez exista `CURRENT-STATE.md`, `README.md` pasa a ser **mapa** y `CURRENT-STATE`
**snapshot**:

1. **PRIMERA entrada** → `docs/CURRENT-STATE.md`.
2. Luego, en orden: **arquitectura** → **editorial/web** → **corpus interpretativo**
   (Concepts · Readings · Master Map) → **operaciones** → **deuda** → **histórico**.
3. La sección "Estado actual" actual (que hoy es solo el link propuesto) se
   reemplaza por el link real a `CURRENT-STATE.md` como primera entrada.

---

## 7. FASE 1.5 — propuesta de movimientos (tras aprobación y consolidación)

> Nada de esto se ejecuta todavía. Es la propuesta de qué mover **después** de
> crear `CURRENT-STATE.md` y consolidar las decisiones vigentes de §2.

### 7.1 A `PROVENANCE` (se conserva activo pero marcado, o se mueve a un subdir `provenance/`)
- `docs/README-analysis.md` → a `PROVENANCE` tras promover las 6 Reglas a CURRENT-STATE.
- `docs/audits/NORMALIZATION-VERIFICATION-v0.3.json` → `PROVENANCE`.
- `content/readings/READINGS-v0.3-REPORT.md` → `PROVENANCE` (aserciones re-derivables).
- `content/maps/MASTER-MAP-v0.2-REPORT.md` → `PROVENANCE`.

### 7.2 A `HISTORICAL` / `history/`
- `docs/web/BOOK-REBASELINE-v0.1.md` → tras consolidar §2.2.
- `docs/web/REBASELINE-V3-v0.1.md` → `HISTORICAL` (superado por ASSET-REPAIR + BOOK-LINK-REPORT).
- `docs/web/PAGE-REVIEW-v0.1.md` → sus resoluciones ya están en datos.
- `docs/web/VISUAL-PROTOTYPE-v0.2.md` → tras consolidar §2.3.
- `content/readings/README-READINGS-v0.3.md` → `HISTORICAL`.
- `content/maps/README-MASTER MAP-v0.2.md` → `HISTORICAL`.

### 7.3 Se quedan ACTIVOS (no se mueven)
- `docs/README.md` (índice) · `docs/web/A5-GEOMETRY-v0.1.md` ·
  `docs/web/PAGE-REVIEW-IMPLEMENTATION-v0.1.md` ·
  `docs/web/REBASELINE-V3-ASSET-REPAIR-v0.1.md` ·
  `docs/web/REBASELINE-V3-RENDER-REGRESSION-v0.1.md` ·
  `docs/web/STRUCTURAL-FIXES-v0.1.md` ·
  `docs/web/TECH-DEBT-READINGS-EVIDENCE-v0.1.md` ·
  `docs/web/WEB-EXPERIENCE-v0.1.md` (parcial, tras extraer lo aprobado) ·
  `content/readings/BOOK-LINK-REBASELINE-V3-REPORT.md` ·
  `content/concepts/CONCEPTS-v0.3.md` · `content/maps/MASTER-MAP-v0.2.md`.

### 7.4 Decisión abierta (requiere tu input)
- `docs/web/WEB-EXPERIENCE-v0.1.md`: archivar solo la parte superada y dejar el
  núcleo aprobado como ARCHITECTURE vigente, o arquivar completo tras consolidar
  los contratos en CURRENT-STATE.

---

## 8. Resumen de consolidación (qué se mueve a CURRENT-STATE antes de archivar)

| Fuente | Decisión/contrato a consolidar |
|---|---|
| `README-analysis` | 6 Reglas de capas (BOOK inmutable, EDITORIAL agrega, web distingue fuente/metadata/interpretación) |
| `BOOK-REBASELINE` | identidad SHA-256; decisiones de asset dirigidas por `asset_sha256` |
| `VISUAL-PROTOTYPE-v0.2` | Page-model = MODO LEER; BookUnit = trazabilidad; no-inventar-texto-de-sistema |
| `REBASELINE-V3-ASSET-REPAIR` + `RENDER-REGRESSION` | contrato G1/G2/G3; requisito de schema `association_status`/`method` |
| `WEB-EXPERIENCE` | contratos UX aprobados: drawer, lazy-fetch Readings, band-axis, no `/ensayos` |
| `TECH-DEBT-READINGS-EVIDENCE` | los 2 ítems de deuda (verbatim) |
| `PAGE-REVIEW-IMPLEMENTATION` | baseline G3 = `source-references-approved-v1.json` + modelo en capas |

---

## Cierre (auditoría)

La auditoría propuso. La upstream (§ arriba) quedó ejecutada — ver
**PHASE 1.5 — EXECUTION RESULT** a continuación.

---

## PHASE 1.5 — EXECUTION RESULT

**Fecha:** 2026-08-30
**Estado:** EJECUTADO — pendiente de revisión del usuario antes de FASE 2.
**FASE 2:** NO ejecutada (`data/_pre-rebaseline-{backup,v2,v3}` y las 8 tools quedan intactas).

### 1. `docs/CURRENT-STATE.md` creado

- Snapshot vigente (corto, no cronológico) con:
  - estado (79 páginas · 47 BookUnits · 55 assets · 43 SourceReferences · v0.3/v0.3/v0.2 · 158 build);
  - capas con archivos canónicos y reglas de mutación;
  - **corrección BOOK/PAGE aplicada**: BOOK = contenido/estructura semántica;
    PAGE = paginación física/superficie MODO LEER; regla **PDF = fuente de
    paginación, DOCX = fuente de estructura interna del texto**;
  - Modo Leer; Sources of Truth; Regression Gates; deuda; contrato vigente;
    documentación especializada.

### 2. Decisiones consolidadas (A–L)

Consolidadas explícitamente en `docs/CURRENT-STATE.md` §7:

- (A) 6 Reglas de capas; (B) identidad de assets SHA-256; (C) decisiones editoriales
  por `asset_sha256`; (D) Page Model = MODO LEER; (E) BookUnit = trazabilidad;
  (F) no inventar texto de sistema en blank/continuaciones; (G) contrato G1/G2/G3;
  (H) requisito de schema `association_status`/`association_method`; (I) baseline G3 =
  `source-references-approved-v1.json`; (J) edición editorial por `docx_paragraph_index`;
  (K) UX: ReadingDrawer contextual, lazy-load Readings, band-axis, no `/ensayos`;
  (L) deuda de READINGS (111 stale + 24 sin match).

### 3. Decisiones de documentos

- **`WEB-EXPERIENCE-v0.1.md` → PROVENANCE** (decisión del usuario: no dejarlo como
  arquitectura parcial activa; sus contratos aprobados quedan consolidados en CURRENT-STATE §7).
- `docs/README-analysis.md` → PROVENANCE tras consolidar las 6 Reglas.

### 4. Movimientos ejecutados (FASE 1.5)

**→ `docs/web/provenance/`** (valor auditable, cómo llegamos al estado vigente):
- `README-analysis.md` (de `docs/`)
- `BOOK-REBASELINE-v0.1.md`
- `REBASELINE-V3-v0.1.md`
- `VISUAL-PROTOTYPE-v0.2.md`
- `WEB-EXPERIENCE-v0.1.md`
- `READINGS-v0.3-REPORT.md` (de `content/readings/`)
- `MASTER-MAP-v0.2-REPORT.md` (de `content/maps/`)
- `NORMALIZATION-VERIFICATION-v0.3.json` (de `docs/audits/`; `docs/audits/` quedó vacía y se eliminó)

**→ `docs/web/history/`** (superado, sin necesidad cotidiana):
- `PAGE-REVIEW-v0.1.md`
- `README-READINGS-v0.3.md` (de `content/readings/`)
- `README-MASTER MAP-v0.2.md` (de `content/maps/`; renombrado a `README-MASTER-MAP-v0.2.md`, sin el espacio de la ruta original)

**Conservados ACTIVOS** (no movidos): `A5-GEOMETRY`, `PAGE-REVIEW-IMPLEMENTATION`,
`REBASELINE-V3-ASSET-REPAIR`, `REBASELINE-V3-RENDER-REGRESSION`, `STRUCTURAL-FIXES`,
`TECH-DEBT-READINGS-EVIDENCE`, `BOOK-LINK-REBASELINE-V3-REPORT.md`, `CONCEPTS-v0.3.md`,
`MASTER-MAP-v0.2.md`, `docs/README.md`, `docs/CURRENT-STATE.md`.

### 5. Árbol final de documentación

```
docs/
  README.md                      (MAPA, CURRENT-STATE primero)
  CURRENT-STATE.md               (SNAPSHOT vigente)
  REPOSITORY-CLEANUP-PLAN-v0.1.md
  DOCUMENTATION-AUDIT-v0.1.md    (este documento, con este Execution Result)
  migrations/CONCEPTS-READINGS-v0.3.md
  web/
    A5-GEOMETRY-v0.1.md          ACTIVE
    PAGE-REVIEW-IMPLEMENTATION-v0.1.md  ACTIVE
    REBASELINE-V3-ASSET-REPAIR-v0.1.md  ACTIVE
    REBASELINE-V3-RENDER-REGRESSION-v0.1.md  ACTIVE
    STRUCTURAL-FIXES-v0.1.md     ACTIVE
    TECH-DEBT-READINGS-EVIDENCE-v0.1.md  ACTIVE
    history/                     PAGE-REVIEW, REBASELINE-V2, REBASELINE-V3-ASSET-AUDIT,
                                 VISUAL-PROTOTYPE-v0.1, README-READINGS-v0.3, README-MASTER-MAP-v0.2
    provenance/                  README-analysis, BOOK-REBASELINE, REBASELINE-V3,
                                 VISUAL-PROTOTYPE-v0.2, WEB-EXPERIENCE,
                                 READINGS-v0.3-REPORT, MASTER-MAP-v0.2-REPORT,
                                 NORMALIZATION-VERIFICATION-v0.3.json
```

### 6. Links corregidos (ninguno stale)

- `docs/CURRENT-STATE.md` §8 → rutas provenance (`README-analysis`, `READINGS-v0.3-REPORT`, `MASTER-MAP-v0.2-REPORT`).
- `docs/web/STRUCTURAL-FIXES-v0.1.md` → `history/PAGE-REVIEW-v0.1.md`.
- `docs/web/PAGE-REVIEW-IMPLEMENTATION-v0.1.md` → `history/PAGE-REVIEW-v0.1.md`.
- `docs/web/TECH-DEBT-READINGS-EVIDENCE-v0.1.md` → `provenance/BOOK-REBASELINE-v0.1.md` (×2).
- `docs/web/REBASELINE-V3-ASSET-REPAIR-v0.1.md` → `history/REBASELINE-V3-ASSET-AUDIT-v0.1.md`.
- `docs/web/provenance/VISUAL-PROTOTYPE-v0.2.md` → `provenance/BOOK-REBASELINE-v0.1.md`.
- `docs/web/provenance/WEB-EXPERIENCE-v0.1.md` → `history/README-READINGS-v0.3`, `history/README-MASTER-MAP-v0.2`, `provenance/NORMALIZATION-VERIFICATION-v0.3.json`, `provenance/MASTER-MAP-v0.2-REPORT`.
- `docs/web/history/VISUAL-PROTOTYPE-v0.1.md` → `provenance/WEB-EXPERIENCE-v0.1.md`.
- `docs/web/history/README-READINGS-v0.3.md` → banner apuntando al reporte en provenance.

### 7. Checks (todos PASS)

- **Gate de regresión:** `ALL GATES PASS` (G1 identity · G2 placement · G3 content).
- **`npx astro check`** → 0 errores / 0 warnings.
- **`npx astro build`** → Complete.
- **Datos canónicos:** sin cambios (no se movió ni modificó ningún JSON canónico;
  las rutas de `data/`, `content/*.json` idénticas). Confirmado vía git status.
- **`git status`:** cambios solo en `docs/` (renames FASE 1.5 + CURRENT-STATE + este resultado) + archivos sin seguimiento ajenos al repo. Nada en `data/`, `content/`, `tools/`, `web/src/`.

### 8. FASE 2 — NO ejecutada

`data/_pre-rebaseline-backup/`, `data/_pre-rebaseline-v2-backup/`,
`data/_pre-rebaseline-v3-backup/` permanecen en `data/`. Las 8 tools sin modificar.
Queda pendiente de revisión/instrucción del usuario.
