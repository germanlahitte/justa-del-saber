# Graves decires — Documentación (índice)

Web book project for *Graves decires de aguda intuición* de Ricardo Iorio.
Documentation index. For a one-page snapshot of the current state of the
project, see **`docs/CURRENT-STATE.md`** (proposed).

> Guide: **canonical content** (what the web + regression gates consume) lives
> in `data/` and `content/` with **stable paths**. **Historical** and **backup**
> material is archived under `docs/web/history/`, `data/history/`, and
> `data/backups/`. Documentation lives in `docs/`.

## Índice rápido

### Estado actual del proyecto
- `docs/CURRENT-STATE.md` — _(propuesto)_ snapshot único del estado vigente del proyecto (deuda, capas, gates).

### Arquitectura
- `docs/README-analysis.md` — análisis/índice de arquitectura y capas.
- `docs/web/WEB-EXPERIENCE-v0.1.md` — especificación de experiencia del Modo Leer.
- `docs/web/A5-GEOMETRY-v0.1.md` — geometría/layout de hojas A5 del Modo Leer.

### BOOK / PAGE / ASSET
- `docs/web/BOOK-REBASELINE-v0.1.md` — re-baseline del modelo BOOK frente al DOCX/PDF.
- `docs/web/REBASELINE-V3-v0.1.md` — auditoría del re-baseline editorial v3 (estado vigente).
- `docs/web/REBASELINE-V3-ASSET-REPAIR-v0.1.md` — reparación del manifest (ASSET) tras la regresión v3.
- `docs/web/REBASELINE-V3-RENDER-REGRESSION-v0.1.md` — causa raíz + evidencia de la regresión de render (referencia `data/history/repairs/`).
- `docs/web/PAGE-REVIEW-v0.1.md` — planilla de revisión página por página del Modo Leer.
- `docs/web/PAGE-REVIEW-IMPLEMENTATION-v0.1.md` — registro de implementación de la revisión de páginas.
- `docs/web/STRUCTURAL-FIXES-v0.1.md` — correcciones estructurales sistémicas.

### Capa editorial
- `data/editorial/*.json` — la capa editorial vigente (5 archivos CANONICAL consumidos por la web).
- `docs/migrations/CONCEPTS-READINGS-v0.3.md` — migración de la capa Concepts/Readings.
- `docs/audits/NORMALIZATION-VERIFICATION-v0.3.json` — verificación de normalización.

### Concepts
- `content/concepts/concepts-v0.3.json` — canon vigente (CANONICAL, consumido por la web).
- `content/concepts/CONCEPTS-v0.3.md` — documento de Concepts v0.3.

### Readings
- `content/readings/readings-v0.3.json` — canon vigente (CANONICAL, consumido por la web).
- `content/readings/READINGS-v0.3-REPORT.md` — reporte de consolidación v0.3.
- `content/readings/README-READINGS-v0.3.md` — incorporación de Readings v0.3.
- `content/readings/BOOK-LINK-REBASELINE-V3-REPORT.md` — re-resolución de vínculos libro↔lectura v3.

### Master Map
- `content/maps/master-map-v0.2.json` — canon vigente (CANONICAL, consumido por la web).
- `content/maps/MASTER-MAP-v0.2.md` — documento del mapa.
- `content/maps/MASTER-MAP-v0.2-REPORT.md` — verificación del mapa (PASSED).
- `content/maps/README-MASTER MAP-v0.2.md` — cómo se genera/sitúa el mapa.

### Deuda técnica
- `docs/web/TECH-DEBT-READINGS-EVIDENCE-v0.1.md` — evidencia de deuda técnica en Readings.

### Histórico
- `docs/web/history/` — documentos superados (REBASELINE-V2, ASSET-AUDIT, VISUAL-PROTOTYPE-v0.1).
- `content/readings/history/` — versionado histórico de Readings (v0.1, v0.2 y la cadena intermedia).
- `content/concepts/.old/` — Concepts v0.2 (histórico).
- `content/maps/history/` — Master Map v0.1 (histórico).
- `data/history/process/` — informes de proceso ETAPA-1 / ETAPA-1.5 (histórico).
- `data/history/repairs/` — evidencia de reparaciones (ej. `.rendermissing-backup`).

### Backups
- `data/backups/` — snapshots previos a mutaciones (p. ej. `_pre-heading-fix-backup`, `_pre-repair-v3`).
  > Nota: los snapshots `_pre-rebaseline-{backup,v2,v3}` quedan por ahora en `data/`
  > porque 8 herramientas los referencia como lado "OLD" de diffs; su reubicación a
  > `data/backups/` es la **Fase 2** (requiere actualizar rutas en las herramientas).
- `data/baselines/source-references-approved-v1.json` — baseline aprobado (G3), **no mover**.

---

## Convenciones

- **CANONICAL** = consumido por `web/src/content.config.ts` y/o por el gate
  `tools/verify_rebaseline_assets.py` (G1/G2/G3). Sus rutas son estables; no mover.
- **ACTIVE-DOCUMENTATION** = documento vigente; ruta estable y descubrible.
- **HISTORICAL** = versión superada; archivado, nunca borrado.
- **BACKUP** = snapshot pre-mutación; trazabilidad.

## Gate de regresión

`python tools/verify_rebaseline_assets.py` debe arrojar **ALL GATES PASS**
(G1 identidad ASSET, G2 placement, G3 contenido contra baseline).

## Comandos web

```
cd web
npx astro check     # 0 errores
npx astro build     # 158 páginas, Complete
```
