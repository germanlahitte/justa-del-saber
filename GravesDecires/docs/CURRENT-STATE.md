# Current State

> **Snapshot vigente** del proyecto Graves decires de aguda intuición.
> Para navegar/índice ver `docs/README.md`. Los **datos canónicos** (JSON) son lo
> que consumen la web y el gate; sus rutas son estables y **no se mueven**.
> Este documento no es cronológico ni duplica los cuerpos de los docs
> especializados: sintetiza el **contrato vigente** y enlaza la provenance.

## 1. Estado

- **79 páginas** · **47 BookUnits** · **55 assets** · **43 SourceReferences**
- Concepts **v0.3** · Readings **v0.3** · Master Map **v0.2**
- Build: **158 páginas** · `astro check` 0 errores
- Gate G1/G2/G3 **ALL GATES PASS**

## 2. Capas

| Capa | Archivo canónico | Función | Qué puede / no puede modificarse |
|------|------------------|---------|----------------------------------|
| **BOOK** | `data/book-model.json` | **contenido / estructura semántica** del libro | inmutable; solo re-baseline aprobado |
| **PAGE** | `data/page-model.json` | **paginación física** / superficie MODO LEER | sí, vía capa editorial |
| **ASSET** | `data/assets-manifest.json` | identidad SHA + placement | identidad = **SHA-256** (el filename es desechable) |
| **EDITORIAL** | `data/editorial/*.json` (5) | metadata sobre BOOK | sí; anclado por `docx_paragraph_index` |
| **READINGS** | `content/readings/readings-v0.3.json` | análisis | con normalización; ver deuda §6 |
| **CONCEPTS** | `content/concepts/concepts-v0.3.json` | ontología | con normalización |
| **MASTER MAP** | `content/maps/master-map-v0.2.json` | mapa estructural | con normalización; no duplica BOOK |
| **WEB** | `web/` (astro) | presentación | Modo Leer con fetch-lazy de Readings |

> **Regla de fuentes de verdad estructurales:**
> **PDF = fuente de verdad para PAGINACIÓN.**
> **DOCX = fuente de verdad para ESTRUCTURA INTERNA DEL TEXTO.**

## 3. Modo Leer

Page · Spread · SourceReferenceFooter · editorial quotes/excerpts ·
ReadingTrigger · blank pages · índice editorial.

Geometría A5 (umbral spread 688px, reader-sheet): `docs/web/A5-GEOMETRY-v0.1.md`.

## 4. Sources of Truth (paths canónicos)

Rutas estables, consumidas por la web y el gate. **No mover.**

- `data/book-model.json`
- `data/page-model.json`
- `data/assets-manifest.json`
- `data/source-references.json`
- `data/editorial/*.json` (5 archivos)
- `content/concepts/concepts-v0.3.json`
- `content/readings/readings-v0.3.json`
- `content/maps/master-map-v0.2.json`
- `data/baselines/source-references-approved-v1.json` *(baseline G3)*

## 5. Regression Gates

```
python tools/verify_rebaseline_assets.py
```

→ **G1** identidad ASSET · **G2** placement (`pdf_page` derivado del SHA) ·
**G3** contenido contra baseline validado. Debe dar **ALL GATES PASS**.

Web:
```
cd web
npx astro check    # 0 errores
npx astro build    # Complete
```

## 6. Deuda técnica abierta

Solo deuda **real todavía vigente**, documentada, **no corregida**:

1. **111 `evidence.docx_paragraph_range` stale** (en 39 unidades) en
   `readings-v0.3.json` — corridos −1 por el merge de heading del DOCX.
   No bloqueante; fix = re-derivación mecánica en una futura normalización.
2. **24 `matched_anchors` sin match literal** — pre-existentes (no regresión V3);
   requiere **decisión editorial por caso**, no resolver en silencio.

Detalle y evidencia: `docs/web/TECH-DEBT-READINGS-EVIDENCE-v0.1.md`.

## 7. Contrato vigente consolidado

Decisiones que gobiernan el sistema y que **deben cumplirse** al trabajar
(consolidadas desde su provenance al archivar):

- **Capas (6 Reglas):** BOOK inmutable; EDITORIAL agrega metadata sin modificar
  BOOK; la web distingue siempre **fuente vs metadata vs interpretación**;
  EDITORIAL anclada por `docx_paragraph_index`.
- **Identidad de assets = SHA-256 del contenido**, nunca el filename interno del
  DOCX; las decisiones editoriales de asset se dirigen por `asset_sha256`.
- **Modelo Page = superficie MODO LEER**; **BookUnit = trazabilidad interna**;
  **no inventar texto de sistema** en páginas blank/continuaciones.
- **Gate G1/G2/G3:** identidad y placement tan baratas que `pdf_page` debe igualar
  el match perceptual resuelto por SHA; **no re-resolver READINGS contra un modelo
  viejo** (duplicaría el +1). Requisito de schema en `assets-manifest`:
  `association_status` y `association_method`.
- **Baseline G3** = `data/baselines/source-references-approved-v1.json`.
- **UX Modo Leer:** ReadingDrawer contextual; **Readings lazy-load solo tras
  activación** (no `display:none`); dirección **band-axis / mapa longitudinal**;
  **no `/ensayos` todavía**.

## 8. Documentación especializada

- **Arquitectura:** `docs/web/provenance/README-analysis.md` *(provenance de las 6 Reglas)* ·
  `docs/web/STRUCTURAL-FIXES-v0.1.md` · `docs/web/REBASELINE-V3-ASSET-REPAIR-v0.1.md` ·
  `docs/web/REBASELINE-V3-RENDER-REGRESSION-v0.1.md` ·
  `docs/web/PAGE-REVIEW-IMPLEMENTATION-v0.1.md`
- **Editorial / Web:** `docs/web/A5-GEOMETRY-v0.1.md` · `data/editorial/*.json`
- **Concepts:** `content/concepts/CONCEPTS-v0.3.md`
- **Readings:** `docs/web/provenance/READINGS-v0.3-REPORT.md` *(provenance)* ·
  `content/readings/BOOK-LINK-REBASELINE-V3-REPORT.md`
- **Master Map:** `content/maps/MASTER-MAP-v0.2.md` ·
  `docs/web/provenance/MASTER-MAP-v0.2-REPORT.md` *(provenance)*
- **Deuda:** `docs/web/TECH-DEBT-READINGS-EVIDENCE-v0.1.md`
- **Provenance:** `docs/web/provenance/` · `docs/web/history/` ·
  `data/history/` · `content/*/history/`
