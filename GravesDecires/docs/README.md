# Graves decires — Documentación (mapa)

Web book project for *Graves decires de aguda intuición* de Ricardo Iorio.

> Este README es el **mapa** de la documentación. Para el **snapshot vigente**
> del estado del proyecto (capas, gates, deuda, contratos), ver
> **`docs/CURRENT-STATE.md`**.
>
> Guía: **canonical content** (lo que consumen la web y el gate) vive en `data/`
> y `content/` con rutas estables. Documentación activa en `docs/`. Material
> superado en `docs/web/history/`; provenance (cómo llegamos al estado vigente,
> con valor auditable) en `docs/web/provenance/`.

## 1. Current State
- **`docs/CURRENT-STATE.md`** — snapshot único del estado vigente (capas, gates, deuda, contratos). **Primera lectura siempre acá.**

## 2. Architecture
- `docs/web/A5-GEOMETRY-v0.1.md` — geometría/layout de hojas A5 del Modo Leer.
- `docs/web/STRUCTURAL-FIXES-v0.1.md` — correcciones estructurales sistémicas (merge de headings, créditos, paginación PDF vs texto DOCX).
- `docs/web/REBASELINE-V3-ASSET-REPAIR-v0.1.md` — diseño del gate de regresión y la capa de identidad SHA-first de assets.
- `docs/web/REBASELINE-V3-RENDER-REGRESSION-v0.1.md` — causa raíz de la regresión de render + contrato de schema `assets-manifest` (referencia `data/history/repairs/`).
- `docs/web/PAGE-REVIEW-IMPLEMENTATION-v0.1.md` — cómo se implementaron las decisiones de revisión de páginas; autoridad del baseline G3.

## 3. Editorial / Web
- `data/editorial/*.json` — capa editorial vigente (5 archivos CANONICAL consumidos por la web).
- `docs/web/TECH-DEBT-READINGS-EVIDENCE-v0.1.md` — evidencia de deuda técnica en Readings (ver Current State §6).
- `docs/migrations/CONCEPTS-READINGS-v0.3.md` — migración de la capa Concepts/Readings.

## 4. Interpretative Corpus
- **Concepts**
  - `content/concepts/concepts-v0.3.json` — canon vigente (CANONICAL, consumido por la web).
  - `content/concepts/CONCEPTS-v0.3.md` — spec legible de la ontología de Concepts.
- **Readings**
  - `content/readings/readings-v0.3.json` — canon vigente (CANONICAL, consumido por la web).
  - `content/readings/BOOK-LINK-REBASELINE-V3-REPORT.md` — ledger de re-resolución de vínculos libro↔lectura v3.
- **Master Map**
  - `content/maps/master-map-v0.2.json` — canon vigente (CANONICAL, consumido por la web).
  - `content/maps/MASTER-MAP-v0.2.md` — spec legible del mapa estructural.

## 5. Operations / Gates
- Gate de regresión: `python tools/verify_rebaseline_assets.py` → **ALL GATES PASS** (G1 identidad ASSET, G2 placement, G3 contenido contra baseline).
- Web: `cd web && npx astro check` (0 errores) · `npx astro build` (Complete).

## 6. Technical Debt
- `docs/web/TECH-DEBT-READINGS-EVIDENCE-v0.1.md` — los 2 ítems abiertos (111 `evidence.docx_paragraph_range` stale; 24 `matched_anchors` sin match literal). Resumen en `docs/CURRENT-STATE.md` §6.

## 7. Provenance / History
- **Provenance** (`docs/web/provenance/`) — cómo llegamos al estado vigente; valor auditable, ya no necesario para trabajar hoy:
  - `README-analysis.md` — análisis/capas (origen de las 6 Reglas, hoy consolidadas en Current State §7).
  - `BOOK-REBASELINE-v0.1.md` — re-baseline v0.1 y la regla de identidad SHA-256.
  - `REBASELINE-V3-v0.1.md` — auditoría del re-baseline v3 (superado por ASSET-REPAIR + BOOK-LINK-REPORT).
  - `VISUAL-PROTOTYPE-v0.2.md` — origen del modelo Page = MODO LEER.
  - `WEB-EXPERIENCE-v0.1.md` — propuesta UX; los contratos aprobados están consolidados en Current State §7.
  - `READINGS-v0.3-REPORT.md`, `MASTER-MAP-v0.2-REPORT.md`, `NORMALIZATION-VERIFICATION-v0.3.json` — verificaciones PASSED.
- **History** (`docs/web/history/`) — claramente superado, sin necesidad cotidiana:
  - `REBASELINE-V2-v0.1.md`, `VISUAL-PROTOTYPE-v0.1.md`, `REBASELINE-V3-ASSET-AUDIT-v0.1.md`, `PAGE-REVIEW-v0.1.md`, `README-READINGS-v0.3.md`, `README-MASTER-MAP-v0.2.md`.
- **Versionado de corpus** — `content/readings/history/` (v0.1, v0.2 y cadena intermedia), `content/concepts/.old/` (v0.2), `content/maps/history/` (v0.1).
- **Proceso** — `data/history/process/` (ETAPA-1 / ETAPA-1.5), `data/history/repairs/` (evidencia de reparaciones).

## 8. Backups
- `data/backups/` — snapshots previos a mutaciones (`_pre-heading-fix-backup`, `_pre-repair-v3`, `_pre-rebaseline-backup`, `_pre-rebaseline-v2-backup`, `_pre-rebaseline-v3-backup`).
- `data/baselines/source-references-approved-v1.json` — baseline aprobado (G3), **no mover**.

---

## Convenciones

- **CANONICAL** = consumido por `web/src/content.config.ts` y/o el gate
  `tools/verify_rebaseline_assets.py` (G1/G2/G3). Rutas estables; no mover.
- **ACTIVE-DOCUMENTATION** = documento vigente; ruta estable y descubrible.
- **PROVENANCE** = explica cómo llegamos al estado actual; valor auditable, no
  necesario para trabajar hoy.
- **HISTORICAL** = versión superada; archivado, nunca borrado.
- **BACKUP** = snapshot pre-mutación; trazabilidad.
