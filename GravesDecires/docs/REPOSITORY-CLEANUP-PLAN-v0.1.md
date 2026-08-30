# REPOSITORY CLEANUP PLAN v0.1

Status: **PROPOSAL — AWAITING APPROVAL. Not executed.**
Scope: `GravesDecires` (git root `C:\Users\germa\Documents`). This plan audits and proposes a reorganization of auxiliary files under `data/`, `content/`, and `docs/`. **It moves nothing. It deletes nothing. It regenerates nothing.**

---

## A. Objective

Give the repository a clear, maintainable layout by classifying every auxiliary file by its
actual semantic role and its real code/CI dependency — **not** by its filename version stamp.
Files fall into four groups:

1. **CANONICAL** — the data the web app and regression gates actually consume. Must keep a **stable path**.
2. **ACTIVE-DOCUMENTATION** — current, in-force project documents. Keep at a stable, discoverable path.
3. **HISTORICAL** — superseded intermediate versions, old reports, and process records. Archive (never delete).
4. **BACKUP** — pre-mutation snapshots used as a version-control substitute and as "OLD" inputs to diff tools. Keep for traceability; never delete.

**Hard constraints (unchanged):**
- Do NOT modify `book-model.json`, `page-model.json`, `assets-manifest.json`, `source-references.json`,
  the five `data/editorial/*.json`, or the canonical `content/` JSON (`concepts-v0.3`, `readings-v0.3`, `master-map-v0.2`).
- Do NOT break any frontend import/route, any `tools/*.py` path, or the regression gate.
- Do NOT delete anything. Intermediate versions move **into a coherent history structure**, never out of the repo.
- A still-vigent decision held only in a historical document is first consolidated into live docs
  before the old document is archived. (See §J.)

**Safety net (NEW, verified):** the repo is now fully under git.
`git ls-files` shows 199 tracked files under `data/`, `content/`, `docs/`, `tools/`; the `docs/` directory is tracked (17 files).
Every move below is therefore reversible via a single `git mv` / `git rm --cached` + commit.
This is why the `_pre-*` tiers and `.rendermissing-backup` exist — they were the version-control substitute.
Now that git exists, several of these become pure historical trace and can be archived without risk.

---

## B. Canonical set (stable paths — DO NOT MOVE)

Consumed by `web/src/content.config.ts` (SOURCE map), `web/src/lib/masterMap.ts` (hardcoded), or a regression gate:

| Path | Consumer | Notes |
| --- | --- | --- |
| `data/book-model.json` | web `books`, `units` collections | 47 units |
| `data/page-model.json` | web `pages` collection | |
| `data/assets-manifest.json` | web `assets` collection + G1/G2 + tool inputs | generated_by `tools/build_model.py` |
| `data/source-references.json` | web `sourceReferences` + G3 | |
| `data/editorial/asset-context.json` | web | |
| `data/editorial/song-credits.json` | web | |
| `data/editorial/page-presentation.json` | web | |
| `data/editorial/page-editorial.json` | web | |
| `data/editorial/book-index.json` | web | |
| `content/concepts/concepts-v0.3.json` | web `concepts` | version 0.3, canonical-consolidated |
| `content/readings/readings-v0.3.json` | web `readings` | version 0.3, 33 readings |
| `content/maps/master-map-v0.2.json` | web `mapArcs`/`mapHypotheses`/`mapBandAxis`; hardcoded in `masterMap.ts` | |
| `data/baselines/source-references-approved-v1.json` | **ACTIVE-BASELINE** — `verify_rebaseline_assets.py` G3 (`VALIDATED_BASELINE`) | approved = live (byte-identical today) |

**Aux (regenerable inputs/derived, code-fed but not web-consumed) — recommended to KEEP at current path:
the diff/model tools read them as the "current" side.** Not moved (see §F).

---

## C. Code-consumed data — the dependency map

Dependency trace from a grep of `tools/*.py` (392 match sites) plus `web/src` (source of truth).

### Web app consumers
- `web/src/content.config.ts` → the 12 canonical JSON + 5 `editorial/*` above.
- `web/src/lib/masterMap.ts` → hardcodes `../content/maps/master-map-v0.2.json`.
- `web/src/pages/api/asset/[file].ts` → serves `assets/docx-media` byte-for-byte (`ASSET_DIR`). Not under `data/content/docs/tools`; **out of scope** for this cleanup.

### Regression gate (`tools/verify_rebaseline_assets.py`)
- G1: `data/assets-manifest.json` + `assets/docx-media/*` (hash verify).
- G2: `data/image-match.json` + `data/extraction-log.json`.
- G3: `data/source-references.json` vs `data/baselines/source-references-approved-v1.json`.

### Model/derivation tools (stable "current" inputs)
- `build_model.py` reads `data/asset-classification.json`, `data/image-match.json`, `data/extraction-log.json`; writes `data/assets-manifest.json`, `data/book-model-index.json`.
- `build_book_model.py` reads `data/assets-manifest.json`; writes `data/book-model.json`.
- `build_page_model.py` reads `data/book-model.json`, `data/assets-manifest.json`, PDF; writes `data/page-model.json`.
- `build_source_references.py` reads book/page/manifest + `_pre-rebaseline-v2-backup/asset-hash-diff.json`, `_pre-rebaseline-v3-backup/source-references.json`, `_pre-rebaseline-backup/assets-manifest.json`; writes `data/source-references.json` + `_pre-rebaseline-v2-backup/source-references-report.txt`.
- `re_resolve_readings_after_rebaseline(_v3).py` read `--old-book` from `_pre-rebaseline-v2-backup/book-model.json` / `_pre-rebaseline-v3-backup/book-model.json`; rewrite `content/readings/readings-v0.3.json`.
- `check_editorial_coverage_after_rebaseline.py` reads `_pre-rebaseline-v2-backup/asset-hash-diff.json`.
- `check_editorial_layer_impact.py` reads `_pre-rebaseline-backup/assets-manifest.json`; writes `_pre-rebaseline-v2-backup/editorial-impact-report.json`.
- `diff_assets_by_hash.py` reads/writes `_pre-rebaseline-v2-backup/*` (dead path `extraction-log-OLD.json` noted, harmless).
- `diff_book_model.py` reads `_pre-rebaseline-v2-backup/book-model.json` + `asset-hash-diff.json`.
- `diff_docx_versions.py` reads `_pre-rebaseline-backup/book-model.json`.
- `verify_editorial_layer.py` reads `_pre-rebaseline-backup/assets-manifest.json`.
- `consolidate_readings_v03.py` / `normalize_readings_concepts.py` / `resolve_readings_book_links.py` cite root `content/readings/*` paths in documented usage.

**KEY**: `_pre-rebaseline-backup/`, `_pre-rebaseline-v2-backup/`, `_pre-rebaseline-v3-backup/` are **hard-coded**
in 8 tools (≈17 reference sites) as the "OLD" side of version diffs. Moving them **breaks tooling** unless
those tool paths are updated too. This is a dependency you asked to have reported before any move (it is now, see §K).

---

## D. Full inventory + classification (data/)

`PATH | CLASSIFICATION | CONSUMED-BY | REPLACED-BY | PROPOSED-HOME`

### D1. `data/` top level
| Path | Classification | Consumed by | Replaced by | Proposed home |
| --- | --- | --- | --- | --- |
| `asset-classification.json` | ACTIVE-DERIVED | `build_model.py` | none | `data/` (current) |
| `assets-manifest.json` | **CANONICAL** | web G1/G2 + tools | none | `data/` (current) |
| `assets-manifest.json.rendermissing-backup` | **TEMPORARY** | only `docs/web/REBASELINE-V3-RENDER-REGRESSION-v0.1.md` | repaired live manifest | `data/history/repairs/` (or delete, needs decision) |
| `book-model.json` | **CANONICAL** | web + tools | none | `data/` (current) |
| `book-model-index.json` | ACTIVE-DERIVED | none (docs mention) | arguably superseded by `data/editorial/book-index.json` + `src/lib/pageIndex.ts` | `data/` (current) |
| `docx-pdf-diff.txt` | ACTIVE-DERIVED | none | none | `data/` (current) |
| `docx-structure.txt` | ACTIVE-DERIVED | `build_model.py` (regenerated in-memory) | none | `data/` (current) |
| `ETAPA-1-INFORME.md` | **HISTORICAL** | none | later stage docs | `data/history/process/` |
| `ETAPA-1.5-CONSOLIDACION.md` | **HISTORICAL** | none | (DEC-01..DEC-12 now in editorial files) | `data/history/process/` |
| `ETAPA-1.5-INFORME.md` | **HISTORICAL** | none | same | `data/history/process/` |
| `extraction-log.json` | ACTIVE-DERIVED | `build_model.py` + G2 | none | `data/` (current) |
| `image-match.json` | ACTIVE-DERIVED | `build_model.py` + G2 | none | `data/` (current) |
| `page-model.json` | **CANONICAL** | web + tools | none | `data/` (current) |
| `pdf-map.json` | ACTIVE-DERIVED | none | none | `data/` (current) |
| `pdf-outline.txt` | ACTIVE-DERIVED | none | none | `data/` (current) |
| `source-references.json` | **CANONICAL** | web + G3 + tools | none | `data/` (current) |

### D2. `data/baselines/`
| Path | Classification | Consumed by | Replaced by | Proposed home |
| --- | --- | --- | --- | --- |
| `source-references-approved-v1.json` | **ACTIVE-BASELINE** | `verify_rebaseline_assets.py` G3 | none (is approved state; byte-identical to live) | `data/baselines/` (current) |

### D3. `data/editorial/`
All 5 files **CANONICAL** (web-consumed). Do not move.
`asset-context.json`, `song-credits.json`, `page-presentation.json`, `page-editorial.json`, `book-index.json`.

### D4. `data/` backup directories
`PATH | CLASSIFICATION | CONSUMED-BY | REPLACED-BY | PROPOSED-HOME` (note the backup chain: heading-fix → rebaseline → v2 → v3 → repair-v3; each is a state-capture snapshots, but v1/v2/v3 are the diff "OLD" side and are **hard-coded in tools**).

| Directory | Classification | Consumed by | Replaced by | Proposed home |
| --- | --- | --- | --- | --- |
| `_pre-heading-fix-backup/` | **BACKUP** | none (no tool refs) | superseded as snapshot by v1 tier | `data/backups/` (freely movable) |
| `_pre-rebaseline-backup/` | **BACKUP** | 4 tools (assets-manifest.json; docx-structure-OLD + unique diagnostics) | superseded as capture by v2/v3, NOT interchangeable | `data/backups/` — move only with tool update |
| `_pre-rebaseline-v2-backup/` | **BACKUP** | 6 tools (asset-hash-diff.json, book-model.json, report, impact-report) | superseded as capture by v3 | `data/backups/` — move only with tool update |
| `_pre-rebaseline-v3-backup/` | **BACKUP** | 2 tools + G3 provenance (`verify_rebaseline_assets.py` docstring) | superseded by repair-v3/live | `data/backups/` — move only with tool update |
| `_pre-repair-v3/` | **BACKUP** | none (only doc) — unique: pre-repair manifest with association fields on all 55 assets | superseded by live | `data/backups/` (freely movable) |

---

## E. Full inventory + classification (content/)

### E1. `content/readings/` root
| Path | Classification | Consumed by | Replaced by | Proposed home |
| --- | --- | --- | --- | --- |
| `readings-v0.3.json` | **CANONICAL** | web `readings` | none | `content/readings/` (current) |
| `READINGS-v0.3-REPORT.md` | ACTIVE-DOCUMENTATION | none | none | `content/readings/` (current) |
| `README-READINGS-v0.3.md` | ACTIVE-DOCUMENTATION | none | none | `content/readings/` (current) |
| `BOOK-LINK-REBASELINE-V3-REPORT.md` | ACTIVE-DOCUMENTATION | none | none | `content/readings/` (current) |
| `readings-v0.2.json` | **HISTORICAL** | pipeline input only | `readings-v0.3.json` | `content/readings/history/v0.2/` (dedupe root copy) |
| `readings-v0.2.page-linked.json` | **HISTORICAL** | intermediate | v0.3 | `content/readings/history/v0.2/` |
| `readings-v0.2-linked.json` | **HISTORICAL** | intermediate | v0.3 | `content/readings/history/v0.2/` |
| `readings-v0.2-linked.normalized.json` | **HISTORICAL** | input to `consolidate_readings_v03.py` | v0.3 | `content/readings/history/v0.2/` |
| `readings-book-link-spec-v0.2.json` | **HISTORICAL** | input to `resolve_readings_book_links.py --spec` | v0.3 (spec done) | `content/readings/history/v0.2/` |
| `readings-concept-migration-v0.3.json` | **HISTORICAL** | input to `normalize_readings_concepts.py --migration` | v0.3 (migration done) | `content/readings/history/v0.2/` |
| `READINGS-v0.2.md` | **HISTORICAL** | none | v0.3 docs | `content/readings/history/v0.2/` |
| `BOOK-LINK-REPORT-v0.2.md` | **HISTORICAL** | none | V2/V3 reports | `content/readings/history/v0.2/` |
| `BOOK-LINK-REBASELINE-V2-REPORT.md` | **HISTORICAL** | none | V3 report | `content/readings/history/v0.2/` |
| `CONCEPT-NORMALIZATION-REPORT-v0.3.md` | **HISTORICAL** | none | `READINGS-v0.3-REPORT.md` | `content/readings/history/v0.2/` |
| `README.md` | **HISTORICAL** | none (v0.2-era package README) | `README-READINGS-v0.3.md` | `content/readings/history/v0.2/` |
| `README-READINGS-v0.2.md` | **HISTORICAL** | none | `README-READINGS-v0.3.md` | `content/readings/history/v0.2/` |

### E2. `content/readings/history/v0.2/` (already the tool-created archive)
8 files, **byte-identical to the root copies** (see E1 — root copies are the redundant odd ones out).
Classification: **HISTORICAL (this is the proper home)**. Consolidate the root duplicates into this folder.

### E3. `content/readings/.old/`
`readings-v0.1.json`, `READINGS-v0.1.md`, `README.md` — **HISTORICAL** (v0.1 lineage root). Keep in `.old/` or move under `history/`. Recommended: `content/readings/history/v0.1/`.

### E4. `content/concepts/`
| Path | Classification | Proposed home |
| --- | --- | --- |
| `concepts-v0.3.json` | **CANONICAL** | `content/concepts/` (current) |
| `CONCEPTS-v0.3.md` | ACTIVE-DOCUMENTATION | `content/concepts/` (current) |
| `.old/concepts-v0.2.json` | **HISTORICAL** | `.old/` (current) |
| `.old/CONCEPTS-v0.2.md` | **HISTORICAL** | `.old/` (current) |

### E5. `content/maps/`
| Path | Classification | Proposed home |
| --- | --- | --- |
| `master-map-v0.2.json` | **CANONICAL** | `content/maps/` (current) |
| `MASTER-MAP-v0.2.md` | ACTIVE-DOCUMENTATION | `content/maps/` (current) |
| `MASTER-MAP-v0.2-REPORT.md` | ACTIVE-DOCUMENTATION | `content/maps/` (current) |
| `README-MASTER MAP-v0.2.md` | ACTIVE-DOCUMENTATION | `content/maps/` (current) |
| `history/MASTER-MAP-v0.1.md` | **HISTORICAL** | `content/maps/history/` (current) |

---

## F. Full inventory + classification (docs/)

`docs/` is tracked (17 files). **All are ACTIVE-DOCUMENTATION unless classified HISTORICAL.** No code consumes them (verified — zero `tools/*.py` references to `docs/`).

| Path | Classification | Proposed home |
| --- | --- | --- |
| `README-analysis.md` | ACTIVE-DOCUMENTATION (top-level index) | `docs/` (current) |
| `audits/NORMALIZATION-VERIFICATION-v0.3.json` | ACTIVE-DOCUMENTATION (verification evidence) | `docs/audits/` (current) |
| `migrations/CONCEPTS-READINGS-v0.3.md` | ACTIVE-DOCUMENTATION (migration record) | `docs/migrations/` (current) |
| `web/A5-GEOMETRY-v0.1.md` | ACTIVE-DOCUMENTATION | `docs/web/` (current) |
| `web/BOOK-REBASELINE-v0.1.md` | ACTIVE-DOCUMENTATION | `docs/web/` (current) |
| `web/PAGE-REVIEW-IMPLEMENTATION-v0.1.md` | ACTIVE-DOCUMENTATION (current fix record) | `docs/web/` (current) |
| `web/PAGE-REVIEW-v0.1.md` | ACTIVE-DOCUMENTATION (reusable editorial worksheet — see D2) | `docs/web/` |
| `web/REBASELINE-V2-v0.1.md` | HISTORICAL (superseded by V3 docs) | `docs/web/history/` |
| `web/REBASELINE-V3-ASSET-AUDIT-v0.1.md` | HISTORICAL (completed audit) | `docs/web/history/` |
| `web/REBASELINE-V3-ASSET-REPAIR-v0.1.md` | ACTIVE-DOCUMENTATION (the repair that produced live state — keep with the regression doc) | `docs/web/` |
| `web/REBASELINE-V3-RENDER-REGRESSION-v0.1.md` | ACTIVE-DOCUMENTATION (references the `.rendermissing-backup`; keep the evidence link intact) | `docs/web/` |
| `web/REBASELINE-V3-v0.1.md` | ACTIVE-DOCUMENTATION (V3 re-baseline audit; no V4 supersedes — see D1) | `docs/web/` |
| `web/STRUCTURAL-FIXES-v0.1.md` | ACTIVE-DOCUMENTATION (ongoing structural fixes log) | `docs/web/` |
| `web/TECH-DEBT-READINGS-EVIDENCE-v0.1.md` | ACTIVE-DOCUMENTATION (debt evidence) | `docs/web/` |
| `web/VISUAL-PROTOTYPE-v0.1.md` | HISTORICAL (superseded by v0.2) | `docs/web/history/` |
| `web/VISUAL-PROTOTYPE-v0.2.md` | ACTIVE-DOCUMENTATION (current prototype spec) | `docs/web/` |
| `web/WEB-EXPERIENCE-v0.1.md` | ACTIVE-DOCUMENTATION (experience spec) | `docs/web/` |

**Note on `docs/web/REBASELINE-V3-v0.1.md`, `PAGE-REVIEW-v0.1.md`**: needs a quick read to decide ACTIVE vs HISTORICAL
(see §J). Both are safe either way — nothing references them from code.

---

## G. Current proposed target tree (for discussion — NOT MANDATORY)

Only the files that are freely movable (no code dependency) and the pure-historical docs are candidates.
The `_pre-*-backup` dirs and `data/` ACTIVE-DERIVED aux files are **locked at their current path until tools are updated**
(see §K). Proposed sketch:

```
docs/
  README-analysis.md
  audits/          (keep)
  migrations/      (keep)
  web/
    ...active docs (keep)
    history/       # NEW: REBASELINE-V2, ASSET-AUDIT, VISUAL-PROTOTYPE-v0.1, [PAGE-REVIEW]
data/
  baselines/       (keep, ACTIVE)
  editorial/       (keep, CANONICAL)
  history/
    process/       # NEW: ETAPA-1*, ETAPA-1.5* reports
    repairs/       # NEW: assets-manifest.json.rendermissing-backup
  backups/         # NEW: the five _pre-* dirs (only after tool path update)
content/
  readings/
    readings-v0.3.json + 3 active docs (keep)
    history/
      v0.1/        # from .old/
      v0.2/        # consolidate the 8 root duplicates here (already tool-created archive)
  concepts/        (keep: canonical + .old)
  maps/            (keep: canonical + history/)
```

---

## H. Exact proposed moves (numbered) — NONE EXECUTED

### Freely movable (no code dependency)
| # | From | To | Verdict |
| --- | --- | --- | --- |
| M1 | `data/ETAPA-1-INFORME.md` | `data/history/process/ETAPA-1-INFORME.md` | SAFE (only docs mention) |
| M2 | `data/ETAPA-1.5-CONSOLIDACION.md` | `data/history/process/` | SAFE |
| M3 | `data/ETAPA-1.5-INFORME.md` | `data/history/process/` | SAFE |
| M4 | `data/assets-manifest.json.rendermissing-backup` | `data/history/repairs/` | SAFE (only one doc references it) |
| M5 | `data/_pre-heading-fix-backup/` | `data/backups/_pre-heading-fix-backup/` | SAFE (no tool refs) |
| M6 | `data/_pre-repair-v3/` | `data/backups/_pre-repair-v3/` | SAFE (no tool refs; unique pre-repair manifest preserved) |
| M7 | `content/readings/.old/` → `content/readings/history/v0.1/` | — | SAFE (renumber the lineage home) |
| M8 | `content/readings/readings-v0.2.json` (root) | `content/readings/history/v0.2/` (dedupe) | SAFE (root is a duplicate of the archive copy) |
| M9 | `content/readings/readings-v0.2.page-linked.json` (root) | `content/readings/history/v0.2/` | SAFE (duplicate) |
| M10 | `content/readings/readings-v0.2-linked.json` (root) | `content/readings/history/v0.2/` | SAFE (duplicate) |
| M11 | `content/readings/readings-v0.2-linked.normalized.json` (root) | `content/readings/history/v0.2/` | SAFE (duplicate) |
| M12 | `content/readings/readings-book-link-spec-v0.2.json` (root) | `content/readings/history/v0.2/` | SAFE (duplicate) |
| M13 | `content/readings/readings-concept-migration-v0.3.json` (root) | `content/readings/history/v0.2/` | SAFE (duplicate) |
| M14 | `content/readings/READINGS-v0.2.md` (root) | `content/readings/history/v0.2/` | SAFE |
| M15 | `content/readings/BOOK-LINK-REPORT-v0.2.md` (root) | `content/readings/history/v0.2/` | SAFE (duplicate) |
| M16 | `content/readings/BOOK-LINK-REBASELINE-V2-REPORT.md` (root) | `content/readings/history/v0.2/` | SAFE |
| M17 | `content/readings/CONCEPT-NORMALIZATION-REPORT-v0.3.md` (root) | `content/readings/history/v0.2/` | SAFE (duplicate) |
| M18 | `content/readings/README.md` (root) | `content/readings/history/v0.2/` | SAFE |
| M19 | `content/readings/README-READINGS-v0.2.md` (root) | `content/readings/history/v0.2/` | SAFE |
| M20 | `docs/web/REBASELINE-V2-v0.1.md` | `docs/web/history/REBASELINE-V2-v0.1.md` | SAFE |
| M21 | `docs/web/REBASELINE-V3-ASSET-AUDIT-v0.1.md` | `docs/web/history/` | SAFE (completed audit) |
| M22 | `docs/web/VISUAL-PROTOTYPE-v0.1.md` | `docs/web/history/` | SAFE (superseded by v0.2) |

### Locked (requires tool path update first — see §K)
| # | From | To | Verdict |
| --- | --- | --- | --- |
| M23 | `data/_pre-rebaseline-backup/` | `data/backups/_pre-rebaseline-backup/` | BLOCKED until 4 tools updated |
| M24 | `data/_pre-rebaseline-v2-backup/` | `data/backups/_pre-rebaseline-v2-backup/` | BLOCKED until 6 tools updated |
| M25 | `data/_pre-rebaseline-v3-backup/` | `data/backups/_pre-rebaseline-v3-backup/` | BLOCKED until 2 tools + G3 docstring updated |

### Open decisions (resolved pending your sign-off)
| # | Item | Question → resolution |
| --- | --- | --- |
| D1 | `docs/web/REBASELINE-V3-v0.1.md` | **ACTIVE-DOCUMENTATION** — it is the audit of the V3 re-baseline that produced the current live state and documents the `_pre-rebaseline-v3-backup` provenance; no V4 supersedes it. **Keep ACTIVE** (matches plan default). |
| D2 | `docs/web/PAGE-REVIEW-v0.1.md` | **ACTIVE-DOCUMENTATION** — it is a reusable manual page-by-page editorial **worksheet** (metadata precomputed, observations filled by hand), complementary to (not superseded by) `PAGE-REVIEW-IMPLEMENTATION-v0.1.md` (the fix record). **Keep ACTIVE**. |
| D3 | `data/assets-manifest.json.rendermissing-backup` | **Move to `data/history/repairs/`, do not delete** (you said never delete; it is the regression evidence for the V3 render miss). |
| D4 | `data/book-model-index.json` | **ACTIVE-DERIVED (keep)** — it is a **tool output** (written by `tools/build_model.py`, line 210), regenerable, distinct from the web-consumed `data/editorial/book-index.json`. Not superseded; keep current path. |

---

## I. Imports / scripts / globs that reference paths (must stay consistent if any move happens)

```
tools/verify_rebaseline_assets.py          → data/baselines/source-references-approved-v1.json  (G3, keep)
tools/build_source_references.py           → data/_pre-rebaseline-v2-backup/asset-hash-diff.json
                                          → data/_pre-rebaseline-v3-backup/source-references.json
                                          → data/_pre-rebaseline-v2-backup/source-references-report.txt
                                          → data/_pre-rebaseline-backup/assets-manifest.json
tools/check_editorial_coverage_after_rebaseline.py → data/_pre-rebaseline-v2-backup/asset-hash-diff.json
tools/check_editorial_layer_impact.py      → data/_pre-rebaseline-backup/assets-manifest.json
                                          → writes data/_pre-rebaseline-v2-backup/editorial-impact-report.json
tools/diff_assets_by_hash.py               → reads/writes data/_pre-rebaseline-v2-backup/*  (dead path extraction-log-OLD.json, harmless)
tools/diff_book_model.py                   → data/_pre-rebaseline-v2-backup/book-model.json + asset-hash-diff.json
tools/diff_docx_versions.py                → data/_pre-rebaseline-backup/book-model.json
tools/re_resolve_readings_after_rebaseline(_v3).py → --old-book data/_pre-rebaseline-v2-backup/book-model.json
                                                    --old-book data/_pre-rebaseline-v3-backup/book-model.json
tools/verify_editorial_layer.py            → data/_pre-rebaseline-backup/assets-manifest.json
docs/web/REBASELINE-V3-RENDER-REGRESSION-v0.1.md → data/assets-manifest.json.rendermissing-backup (M4)
```

## J. Still-vigent decisions held only in a historical/archived doc (consolidate before archiving)

1. **ETAPA-1.5-CONSOLIDACION.md** — records the DEC-01..DEC-12 editorial resolutions. These are now encoded in the live `data/editorial/*.json`. **Before** archiving (M2), confirm each DEC resolution is present in the current editorial files; if any is NOT yet reflected, keep the doc ACTIVE until the editorial layer is updated.
2. **REBASELINE-V3 docs (ASSET-AUDIT, ASSET-REPAIR, RENDER-REGRESSION)** — these record the exact repair operations that produced the live `assets-manifest.json` (association fields backfilled). They are the provenance for why the live manifest differs from the baseline. Until a `data/history/` + `data/backups/` arrangement exists that preserves that provenance, keep the RENDER-REGRESSION and ASSET-REPAIR docs ACTIVE. Only ASSET-AUDIT (a completed audit, no residual requirement) may move to history (M21).

## K. Risk register

| Risk | Mitigation |
| --- | --- |
| Moving `_pre-rebaseline-{v1,v2,v3}-backup/` breaks 8 tools (17 ref sites) | Do NOT move M23–M25 until the tool paths + G3 docstring are updated in a coordinated commit. Tools are the only consumer; a single `git mv` + tool-patch commit makes it safe. |
| `.rendermissing-backup` is a broken-state snapshot (all 55 assets missing the 2 schema fields) | Preserve as evidence under `data/history/repairs/` (M4) — never merge into live, never serve. |
| Baseline == live today; any future editorial edit flips G3 to FAIL by design | That is intentional (G3 is the gate). Keep `source-references-approved-v1.json` stable; it is the approved state. |
| `readings-v0.2*` root duplicates also exist in `history/v0.2/` AND in `_pre-rebaseline-v3-backup/content-readings/` | Root duplicates are redundant → consolidate to `history/v0.2/` (M8–M13). The v3-backup copies are the pre-rebaseline state and stay with the v3 backup. |
| `docs/web/REBASELINE-V3-RENDER-REGRESSION-v0.1.md` references `data/assets-manifest.json.rendermissing-backup` | M4 moves both doc and evidence together; update the doc's relative reference if the path changes. |
| No git safety net before | **Resolved**: repo fully tracked (199 files in data/content/docs/tools, incl. docs/ 17 files). All moves reversible via `git mv`. |
| `extraction-log-NEW-mislabeled.json` is byte-identical to v2 backup's extraction-log | Keep as-is in its backup dir; it's a mislabeled diagnostic, harmless, and part of the v1 tier. |

## L. Path/reference table (final)

`CURRENT PATH | CLASSIFICATION | PROPOSED PATH | REFERENCED BY | SAFE TO MOVE | REASON`

| Current | Classification | Proposed | Referenced by | Safe to move | Reason |
| --- | --- | --- | --- | --- | --- |
| `data/book-model.json` | CANONICAL | (keep) | web, tools | NO | core model |
| `data/page-model.json` | CANONICAL | (keep) | web, tools | NO | core model |
| `data/assets-manifest.json` | CANONICAL | (keep) | web, G1/G2, tools | NO | core + gate |
| `data/source-references.json` | CANONICAL | (keep) | web, G3, tools | NO | core + gate |
| `data/editorial/*` (5) | CANONICAL | (keep) | web | NO | editorial layer |
| `data/baselines/source-references-approved-v1.json` | ACTIVE-BASELINE | (keep) | G3 | NO | approved baseline, stable path |
| `content/concepts/concepts-v0.3.json` | CANONICAL | (keep) | web | NO | core |
| `content/readings/readings-v0.3.json` | CANONICAL | (keep) | web | NO | core |
| `content/maps/master-map-v0.2.json` | CANONICAL | (keep) | web (hardcoded masterMap.ts) | NO | core |
| `data/asset-classification.json` | ACTIVE-DERIVED | (keep) | build_model.py | NO (locked) | tool input |
| `data/image-match.json` | ACTIVE-DERIVED | (keep) | build_model.py, G2 | NO (locked) | tool + gate input |
| `data/extraction-log.json` | ACTIVE-DERIVED | (keep) | build_model.py, G2 | NO (locked) | tool + gate input |
| `data/book-model-index.json` | ACTIVE-DERIVED | (keep) | none (docs) | yes | diagnostic only (D4) |
| `data/docx-pdf-diff.txt` | ACTIVE-DERIVED | (keep) | none | yes | regenerable diagnostic |
| `data/docx-structure.txt` | ACTIVE-DERIVED | (keep) | build_model.py (in-memory) | yes | trace |
| `data/pdf-map.json` | ACTIVE-DERIVED | (keep) | none | yes | regenerable diagnostic |
| `data/pdf-outline.txt` | ACTIVE-DERIVED | (keep) | none | yes | regenerable diagnostic |
| `data/ETAPA-1-INFORME.md` | HISTORICAL | `data/history/process/` | none | yes | stage-1 process report |
| `data/ETAPA-1.5-CONSOLIDACION.md` | HISTORICAL | `data/history/process/` | none (decs in editorial) | yes* | *consolidate DECs first (J1) |
| `data/ETAPA-1.5-INFORME.md` | HISTORICAL | `data/history/process/` | none | yes | stage-1.5 report |
| `data/assets-manifest.json.rendermissing-backup` | TEMPORARY | `data/history/repairs/` | 1 doc | yes (D3: move vs delete) | broken-state evidence |
| `data/_pre-heading-fix-backup/` | BACKUP | `data/backups/` | none | yes | oldest snapshot |
| `data/_pre-repair-v3/` | BACKUP | `data/backups/` | none (doc only) | yes | pre-repair manifest evidence |
| `data/_pre-rebaseline-backup/` | BACKUP | `data/backups/` | 4 tools | **NO (M23)** | tool "OLD" side |
| `data/_pre-rebaseline-v2-backup/` | BACKUP | `data/backups/` | 6 tools | **NO (M24)** | tool "OLD" side |
| `data/_pre-rebaseline-v3-backup/` | BACKUP | `data/backups/` | 2 tools + G3 | **NO (M25)** | tool + baseline provenance |
| `content/readings/readings-v0.3.json` | CANONICAL | (keep) | web | NO | core |
| `content/readings/READINGS-v0.3-REPORT.md` | ACTIVE-DOC | (keep) | none | yes (keep) | current |
| `content/readings/README-READINGS-v0.3.md` | ACTIVE-DOC | (keep) | none | yes (keep) | current |
| `content/readings/BOOK-LINK-REBASELINE-V3-REPORT.md` | ACTIVE-DOC | (keep) | none | yes (keep) | current |
| `content/readings/readings-v0.2*.json` (root, 5) | HISTORICAL | `history/v0.2/` | pipeline input | yes (M8–M13) | redundant duplicates |
| `content/readings/spec + migration` (root, 2) | HISTORICAL | `history/v0.2/` | tool input | yes (M12–M13) | duplicates |
| `content/readings/READINGS-v0.2.md` | HISTORICAL | `history/v0.2/` | none | yes (M14) | superseded |
| `content/readings/README.md` | HISTORICAL | `history/v0.2/` | none | yes (M18) | v0.2-era |
| `content/readings/README-READINGS-v0.2.md` | HISTORICAL | `history/v0.2/` | none | yes (M19) | superseded |
| `content/readings/BOOK-LINK-REPORT-v0.2.md` | HISTORICAL | `history/v0.2/` | none | yes (M15) | superseded |
| `content/readings/BOOK-LINK-REBASELINE-V2-REPORT.md` | HISTORICAL | `history/v0.2/` | none | yes (M16) | superseded by V3 |
| `content/readings/CONCEPT-NORMALIZATION-REPORT-v0.3.md` | HISTORICAL | `history/v0.2/` | none | yes (M17) | superseded |
| `content/readings/.old/` (3) | HISTORICAL | `history/v0.1/` | none | yes (M7) | lineage root |
| `content/concepts/.old/` (2) | HISTORICAL | (keep) | none | yes (keep) | lineage root |
| `content/maps/history/` (1) | HISTORICAL | (keep) | none | yes (keep) | lineage root |
| `docs/README-analysis.md` | ACTIVE-DOC | (keep) | none | no | index |
| `docs/audits/NORMALIZATION-VERIFICATION-v0.3.json` | ACTIVE-DOC | (keep) | none | no | verification evidence |
| `docs/migrations/CONCEPTS-READINGS-v0.3.md` | ACTIVE-DOC | (keep) | none | no | migration record |
| `docs/web/*.md` (active set) | ACTIVE-DOC | (keep in `docs/web/`) | none | no | live web docs |
| `docs/web/REBASELINE-V2-v0.1.md` | HISTORICAL | `docs/web/history/` | none | yes (M20) | superseded by V3 |
| `docs/web/REBASELINE-V3-ASSET-AUDIT-v0.1.md` | HISTORICAL | `docs/web/history/` | none | yes (M21) | completed audit |
| `docs/web/VISUAL-PROTOTYPE-v0.1.md` | HISTORICAL | `docs/web/history/` | none | yes (M22) | superseded by v0.2 |

## M. Recommended execution order (ONLY after your approval)

**Phase 1 — safe, code-independent moves (M1–M22):**
1. Create `docs/web/history/`, `data/history/process/`, `data/history/repairs/`, `data/backups/`, `content/readings/history/v0.1/`.
2. `git mv` M1–M22 (each move is one commit for clean history; or one commit per logical group).
4. Update the one doc reference (RENDER-REGRESSION → new `.rendermissing-backup` path, if M4 executes).
4. Run `npx astro check` (expect 0 errors — content/config paths unchanged), `npx astro build`, and `verify_rebaseline_assets.py` (expect ALL GATES PASS) to prove no regression.

**Phase 2 — coordinated backup relocation (M23–M25), SECONDS optional:**
1. In the same commit as the moves, update the hard-coded paths in the 8 tools + the G3 docstring.
2. `git mv` `_pre-rebaseline-{v1,v2,v3}-backup/` → `data/backups/`.
3. Re-run `verify_rebaseline_assets.py` (G1/G2/G3 must still PASS) + a diff tool smoke test (e.g. `diff_book_model.py`) to confirm the "OLD" side resolves to the new path.

**Nothing in Phase 1 or Phase 2 modifies the book/data/site behavior.** They are path-only, git-tracked moves.

---

*Generated by the repository-cleanup audit. Proposal only — awaiting approval before any move.*

---

# PHASE 1 — EXECUTION RESULT

Status: **EXECUTED and VERIFIED.** Approved by the user (FASE 1), executed on 2026-08-30.
Phase 2 (`_pre-rebaseline-*` relocation + tool path updates) is **NOT executed** — awaiting review.

## 1. Moves executed (M1–M22)

Executed as `git mv` (tracked renames), by logical group. **4 commits** (+2 completion commits for the data/ group; see §6 note).

| Commit | Group | Moves |
| --- | --- | --- |
| `da013cd` | data/history (process + repair) | M1, M2, M3, M4 |
| `6eb3c1e` | backups (freely movable) | M5, M6 |
| `8acc193` | readings history | M7–M19 |
| `d75fabf` | docs/web history | M20, M21, M22 |
| `1f2b8e3` | data/history deletions (completion of `da013cd`) | M1–M4 old-path removal |
| `5293692` | data/backups deletions (completion of `6eb3c1e`) | M5–M6 old-path removal |

## 2. Duplicates removed by byte-identity

Verificado SHA-256 byte-identity de cada par antes de actuar. Se conservó como
**historia canónica** la copia ya presente en `content/readings/history/v0.2/`
y se **retiró del root** la copia redundante (via Git; la historia queda preservada).

**8 archivos retirados del root (byte-idénticos a `history/v0.2/`):**
- `readings-v0.2.json` (M8)
- `readings-v0.2.page-linked.json` (M9)
- `readings-v0.2-linked.json` (M10)
- `readings-v0.2-linked.normalized.json` (M11)
- `readings-book-link-spec-v0.2.json` (M12)
- `readings-concept-migration-v0.3.json` (M13)
- `BOOK-LINK-REPORT-v0.2.md` (M15)
- `CONCEPT-NORMALIZATION-REPORT-v0.3.md` (M17)

Cada uno re-verificado IDENTICAL (SHA256) antes del `git rm`. Cero archivos
afectados sin confirmación previa de identidad.

## 3. Files with unique content — preserved (moved, not deleted)

Estos 4 archivos root **no** tenían copia en `history/v0.2/` (contenido único).
Para no perder contenido, se **movieron** (no eliminar) a `history/v0.2/`:
- `READINGS-v0.2.md` (M14)
- `BOOK-LINK-REBASELINE-V2-REPORT.md` (M16)
- `README.md` (M18)
- `README-READINGS-v0.2.md` (M19)

> Desviación respecto del plan original: el plan marcaba M14/M16/M18/M19 como
> "duplicados a dedupe". La verificación byte-identidad mostró que NO tenían copia
> en `history/v0.2/` (contenido único), así que se trataron como **moves**, no como
> deletes. Ningún archivo con contenido único fue borrado.

Además:
- `content/readings/.old/` (M7) → `content/readings/history/v0.1/` (3 archivos únicos, movidos).
- El directorio `.old/` quedó vacío tras el move y fue removido.

## 4. Deviation: `ETAPA-1.5-CONSOLIDACION.md` (M2) — J1 check realizado

Antes de archivar (M2), se verificó el guard J1: las resoluciones DEC-01..DEC-12
sí están codificadas en las capas editoriales vigentes
(`data/editorial/song-credits.json` y `data/editorial/asset-context.json`),
verificado por `tools/verify_editorial_layer.py`. La decisión vigente está
consolidada en los archivos live, por lo que archivar el informe es seguro.
Archivado a `data/history/process/`.

## 5. Doc references updated (moved path fixes)

Referencias documentales a rutas movidas actualizadas (código **no** se tocó):
- `docs/web/REBASELINE-V3-RENDER-REGRESSION-v0.1.md`
  - línea 86: `data/_pre-repair-v3/assets-manifest.json` → `data/backups/_pre-repair-v3/assets-manifest.json`
  - línea 92: `data/assets-manifest.json.rendermissing-backup` → `data/history/repairs/assets-manifest.json.rendermissing-backup`
- `docs/web/STRUCTURAL-FIXES-v0.1.md`
  - línea 9: `data/_pre-heading-fix-backup/` → `data/backups/_pre-heading-fix-backup/`

## 6. Final relevant tree

```
docs/
  README.md                     (NUEVO — índice de documentación)
  REPOSITORY-CLEANUP-PLAN-v0.1.md (este plan)
  README-analysis.md
  audits/                       (NORMALIZATION-VERIFICATION-v0.3.json)
  migrations/                   (CONCEPTS-READINGS-v0.3.md)
  web/
    ...docs activos (A5-GEOMETRY, BOOK-REBASELINE, PAGE-REVIEW*, REBASELINE-V3*,
         STRUCTURAL-FIXES, TECH-DEBT, VISUAL-PROTOTYPE-v0.2, WEB-EXPERIENCE)
    history/                    (NUEVO: REBASELINE-V2, ASSET-AUDIT, VISUAL-PROTOTYPE-v0.1)
data/
  baselines/                    (ACTIVE-BASELINE, intacto)
  editorial/                    (CANONICAL, intacto)
  history/
    process/                    (NUEVO: ETAPA-1*, ETAPA-1.5*)
    repairs/                    (NUEVO: assets-manifest.json.rendermissing-backup)
  backups/
    _pre-heading-fix-backup/    (NUEVO home)
    _pre-repair-v3/             (NUEVO home)
  /* CANONICAL + ACTIVE-DERIVED + _pre-rebaseline-* quedan en data/ (Phase 2) */
content/
  readings/
    readings-v0.3.json + 3 docs activos
    history/
      v0.1/                     (desde .old/)
      v0.2/                     (consolidado: 8 root duplicates retirados + 4 únicos movidos)
  concepts/                     (canonical + .old intacto)
  maps/                         (canonical + history/ intacto)
```

## 7. git status

Tras los 6 commits, el árbol de trabajo para `data/ content/ docs/ tools/` está
**limpio** (cero cambios sin commitear; único untracked: `docs/REPOSITORY-CLEANUP-PLAN-v0.1.md`
si no se ha commiteado aún, y `docs/README.md` recién creado).
Todos los moves están trackeados como renames `R` en Git.

> Nota de historia: los commits `da013cd` y `6eb3c1e` contienen solo la cara
> "add nuevo path" porque el `git reset` previo desarmó los renames unitarios;
> las caras "delete old path" se completaron en `1f2b8e3` y `5293692`. Git
> reconstruye los renames por similitud de contenido. Los commits C (`8acc193`)
> y D (`d75fabf`) quedaron como renames completos `R100`.

## 8. Checks (post-move)

| Check | Result |
| --- | --- |
| `git status -- data/ content/ docs/ tools/` | limpio (renames commiteados) |
| `npx astro check` (en `web/`) | **0 errors, 0 warnings** (241 hints preexistentes `z` deprecated, no relacionados) |
| `npx astro build` (en `web/`) | **Complete — 158 pages** |
| `python tools/verify_rebaseline_assets.py` | **ALL GATES PASS** (G1 identity 55/55, G2 placement 55/55, G3 content 43/43), exit 0 |
| Canonic paths (13) | **sin cambios** (verificado: todos existen en su ruta estable) |

## 9. Differences vs plan

1. M14/M16/M18/M19 reclasificados de "dedupe (delete)" a **move** (contenido único, sin copia en history/v0.2).
2. `ETAPA-1.5-CONSOLIDACION.md` (M2) archivado tras pasar el guard J1 (DECs ya en editorial live).
3. Commit A y B quedaron partidos add/delete (nota §7) en lugar de un rename unitario.
4. `docs/README.md` (índice) y este ejecutar adicional a `docs/CURRENT-STATE.md` propuesto — ver abajo.
5. No se ejecutó Fase 2 (rutas `_pre-rebaseline-*` + 8 tools) — **pendiente de revisión del usuario.**

## 10. Propuesta `docs/CURRENT-STATE.md` (índice — NO escrito aún)

Se propone un documento corto (1 página, sin duplicar la documentación activa) que
sirva de snapshot de estado. Contenido propuesto:

1. **Estado del proyecto** — web build OK (158 páginas), gates G1/G2/G3 PASS.
2. **Estructura** — canon vs histórico vs backups (una línea por capa).
3. **Capas y su fuente** — BOOK/PAGE/ASSET (`data/*.json`), Editorial (`data/editorial/*`),
   Concepts (`content/concepts/concepts-v0.3.json`), Readings (`content/readings/readings-v0.3.json`),
   Master Map (`content/maps/master-map-v0.2.json`).
4. **Modo Leer / web** — enrutado, página por página, hojas A5.
5. **Deuda técnica restante** — vínculo a `docs/web/TECH-DEBT-READINGS-EVIDENCE-v0.1.md`.
6. **Gate** — comando `verify_rebaseline_assets.py`, expectativa ALL GATES PASS.
7. **Enlaces** — a `docs/README.md` y a cada layer doc.

> Decision: NO se escribe todavía. El usuario quiere primero revisar qué doc activa
> queda tras la limpieza, para no duplicar. Se espera revisión antes de crearlo.

---

*End of Phase 1 execution result. Next phase (Fase 2) awaits user review.*
