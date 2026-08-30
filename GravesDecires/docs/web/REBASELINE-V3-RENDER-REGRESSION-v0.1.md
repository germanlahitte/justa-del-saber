# REBASELINE V3 — RENDER REGRESSION (v0.1)

Diagnostic + evidence for: “V3 asset repair passes all 4 data gates, but MODO LEER renders 0 editorial photos, 0 SourceReferenceFooters, and printed song credits reappear in the body.”

**Status:** root cause identified, minimal repair applied, verified statically. Awaiting user’s visual verification.

---

## TL;DR (one paragraph)

The V3 SHA-first data repair itself was **correct** (G1–G4 pass; identity/placement/content stable). The render regression was caused by a **separate contract break**: the maintenance run that regenerated `data/assets-manifest.json` **dropped the `association_status` and `association_method` fields from every one of the 55 assets**. `web/src/content.config.ts` declares both as **Required** in the `assets` collection schema. The result was `[InvalidContentEntryDataError]` during Astro content sync → the `pages`, `assets`, and `sourceReferences` collections all failed to load → the `/libro/p/[n]` route could not resolve its data → 0 photos, 0 footers, and printed credits rendered (unsuppressed) in the body. The data gates never caught this because they validate identity/placement/content only, never the frontend content-schema contract.

Minimal repair: **backfilled** `association_status`/`association_method` for all 55 assets from the validated pre-repair backup, matched by `sha256` (SHA sets are identical, so no identity assumption). Build now succeeds and static verification confirms photos, footers, and credit suppression on every page.

---

## A. Editorial photo traced END-TO-END

Concrete trace for one editorial photo: **asset-image41 on page 9** (file `image41.png`).

| Stage | File | Value |
|---|---|---|
| DOCX embedded media | book DOCX | `media\image41.png` → SHA `cda1dab3452a…` |
| ASSET manifest | `data/assets-manifest.json` | `{ id: "asset-image41", type: "imagen-editorial", pdf_page: 9, extracted_file: "...image41.png", sha256 }` |
| PAGE model | `data/page-model.json` page 9 | `assets: ["asset-image41"]`, `asset_placements: [{ asset_id: "asset-image41", docx_paragraph_index: 179 }]` |
| Frontend map | `[n].astro` → `PageView.astro` | `assetsById` (id→asset) ; PageView filters `page.data.asset_placements` for `type === 'imagen-editorial'` |
| RENDER | `AssetImage.astro` | `<img src="/api/asset/image41.png">` (alt “Fotografía original del libro”) |

Verified in the rebuilt `dist/libro/p/9/index.html`: `img src="/api/asset/image41.png"` present. 12/12 editorial photos across 10 pages (19 & 39 have two each) render on the correct spread — **0 missing**.

Why it broke before: the build/schema failure aborted every collection load, so `asset_placements`/`assetsById` were empty → zero `<AssetImage>` components emitted.

## B. QR / SourceReferenceFooter traced END-TO-END

Concrete trace: **asset-image1 (QR “Se vos”, page 55)** and **asset-image31 (QR “Se vos”, page 61)**.

| Stage | Value |
|---|---|
| ASSET manifest | `asset-image1`, `type: "qr"`, `pdf_page: 55`, `qr_value: <url>` |
| SOURCE REFERENCE | `source-references.json` → `{ qr_asset_id: "asset-image1", pdf_page: 55, book_units, source_ref: { type:"song", title:"Se vos", band, album, year, credit_paragraph_range:[…] } }` |
| Page model | page 55 `assets: ["asset-image1"]` |
| Frontend footer resolution | `[n].astro footersFor()` → `page.data.assets.filter(type==='qr')` → `sourceRefsByAssetId.get(qr_asset_id)` (keyed `r.data.qr_asset_id`) → `SourceReferenceFooter` |
| RENDER | `web/dist/libro/p/55/index.html` → footer `<a ... p.55 ...>Se vos ...` |

Verified: 100% of qr assets (41 pages) render a footer on the correct spread — **0 missing**.

## C. Song credit suppression traced

Printed credit block for asset-image31 (page 61) = docx paragraphs `[1110, 1112]`:
- 1110 → `Se vos`
- 1111 → `Almafuerte - 1998`
- 1112 → `Almafuerte`

Suppression chain (PageView): `qrAssetIds` → `sourceRefsByAssetId.get(aid)?.data.source_ref?.credit_paragraph_range` → `isSuppressed(docxIndex)` excludes those paragraphs from body `items`.

In the rebuilt `web/dist/libro/p/61/index.html`:
- `Almafuerte - 1998` (the exact printed credit body line) → **0 occurrences**
- `Se vos` → appears **only** inside the SourceReferenceFooter (`aria-label="Escuchar Se vos — abre en una pestaña nueva"` + footer “Se vos / Almafuerte · Almafuerte / p.61”)

So the credit is shown exactly once (footer) and suppressed from the body. BOOK `/text_verbatim` is untouched — suppression is web-presentation only.

## D. PRE-V3 vs CURRENT diff

Because the repo has a single initial commit (everything untracked), there is no git diff for the frontend. Evidence instead comes from file timestamps + backups:

- `web/src/pages/libro/p/[n].astro`, `PageView.astro`, `SourceReferenceFooter.astro`, `content.config.ts` — modified **08:48–08:56** (28/8).
- `web/dist` — built **08:57** (from those sources, with the then-current data).
- `data/assets-manifest.json`, `page-model.json`, `book-model.json`, `source-references.json` — **regenerated 09:58–10:00** (the V3 SHA-first re-run) — **AFTER** the dist build.

So the failure sequence: sources correct + first build fine → data regenerated at 10:00 drops the two required fields → build from the NEW data fails → user sees the regression (stale preview / failed sync).

`data/backups/_pre-repair-v3/assets-manifest.json` and `data/backups/_pre-rebaseline-v3-backup/assets-manifest.json` both carry `association_status`+`association_method` on all assets (unchanged across both backups). Current (regenerated) file had none.

## E. Root cause of each of the 3 regressions

| Symptom | Root cause |
|---|---|
| 0 editorial photos | `pages`/`assets` collections failed schema validation → collection load aborted → no `asset_placements`/`assetsById` → no `<AssetImage>`. |
| 0 SourceReferenceFooter | Same collection-load failure → `footersFor()` got empty `assets`/`sourceRefsByAssetId` → no footer. |
| Credits in body | Same failure → `PageView` never computed `qrAssetIds`/`suppressedParaRanges` → `isSuppressed` returned false for every paragraph → printed credit rendered as body. |

All three are the SAME single root cause: **assets-manifest missing two schema-required fields → content-layer build error.** One cause explains all three symptoms.

## F. Exact files to modify (minimal set)

1. `data/assets-manifest.json` — **restore `association_status` + `association_method`** on all 55 assets (done, from `data/backups/_pre-repair-v3/assets-manifest.json` matched by `sha256`).

No frontend code, no schema change, no other data file changed. No re-run of the maintenance pipeline.

## G. Minimal repair plan (applied)

1. Safety-copied the broken manifest → `data/history/repairs/assets-manifest.json.rendermissing-backup`.
2. Backfilled `association_status` + `association_method` for all 55 assets, keyed by `sha256`, from the validated pre-repair backup. (Values are unchanged extraction metadata — not identity — so copying them is safe and requires no editorial reinterpretation.)
3. Rebuilt `npx astro build` → **158 pages, Complete**, no schema error.
4. Static verification: 0 photos missing, 0 footers missing, credit body suppression confirmed.
5. Re-ran the permanent regression gate → G1/G2/G3 still **PASS**.

## H. SHA-first repair intact

- The backfill touched only the two metadata fields; `sha256`, `extracted_file`, `id`, `type`, `pdf_page`, `qr_value` etc. are byte-identical.
- Regression gate re-run after repair: **ALL GATES PASS** (G1 identity 55/55, G2 placement 55/55, G3 content 43/43).
- No reverting of the SHA-first identity layer; identity remains SHA↔asset↔qr↔SourceReference.

## I. ReadingTrigger (MODO LEER) state

`ReadingDrawer` triggers remain **outside** the sheet, in reader chrome below the `.spread` (`.readings-row` / `.readings-col` in `[n].astro` lines 459–478), one per book unit per page, never fused across the two pages of a spread. This is correct and was not modified. The sheet body is only book content (PageView), so sheet height is unaffected by whether a reading exists.

---

## Acceptance (next step)

User to do a real-browser check of `/libro/p/[n]` (dev or preview). Expect: editorial photos inline on the correct pages (9, 12, 19, 24, 31, 37, 39, 45, 64, 76); SourceReferenceFooter bottom-anchored on every QR page; printed song credits shown once (footer), not duplicated in the body. If any of those still fails after a FRESH build/serve, report back with the specific page — do not re-run the maintenance pipeline.
