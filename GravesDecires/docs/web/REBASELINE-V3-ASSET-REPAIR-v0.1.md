# REBASELINE V3 — Asset & Source-Reference Repair (v0.1)

**Status:** REPAIRED — approved plan applied, 4 gates pass
**Date:** 2026-08-28
**Depends on:** [REBASELINE-V3-ASSET-AUDIT-v0.1.md](./REBASELINE-V3-ASSET-AUDIT-v0.1.md) (the frozen diagnosis this repair resolves)
**Scope:** Apply the user-approved §10 repair of the V3 re-baseline: make asset **identity and placement SHA-first** (immune to Word's media renumbering/extension-swap), regenerate the derived pipeline, and add a permanent regression gate. **No DOCX/PDF was modified. No frontend file was touched.**

---

## 1. Executive Summary

The audit found: identity 55/55 SOUND, placement 1/55 correct, one root cause = **identity/placement resolved by DOCX-internal filename** (`image1.png`, …) which Word renumbers on every re-save. This repair makes the whole pipeline **SHA-first**: an asset is identified by its SHA-256 content, and every DOCX image blip is resolved blip → media bytes → SHA-256 → canonical `asset_id`. Placement is then **derived** from `data/image-match.json` (the perceptual page match, resolved through SHA), not from a historical/stale filename or a frozen page number.

Final result after regeneration + verification:

| Gate | Requirement | Result |
|---|---|---|
| **G1 IDENTITY** | 55/55 manifest `sha256` physically matches each `extracted_file`; 0 missing / 0 duplicate / 0 filename-derived | ✅ **55/55** |
| **G2 PLACEMENT** | 55/55 assets placed; manifest `pdf_page` == SHA-resolved perceptual match, consistent with V2+1 (pages ≥ 63) | ✅ **55/55** |
| **G3 SOURCE-REFERENCE** | 43/43 **CONTENT-CORRECT** **and** 43/43 **PLACEMENT-CORRECT**, reported separately | ✅ **43/43** + **43/43** |
| **G4 EDITORIAL IMAGES** | all 12 `imagen-editorial` assets present and on the correct page | ✅ **12/12** |

Downstream: `data/readings` book-refs already valid (113 refs resolve against the regenerated model, 0 stal.); `data/editorial/book-index.json` already V3-correct (content-verified), no change.

Also added: `tools/verify_rebaseline_assets.py` — permanent regression gate; negative-tested to confirm it **catches** drift.

---

## 2. Root Cause Addressed (recap)

V3 re-save renumbered all 55 media files (`image1.png`→`image48.png`) and swapped 16 extensions. Two scripts bound an asset to a DOCX image **by filename**:

- `build_model.py` wrote `original_path_in_docx` / `extracted_file` by an old-name mapping → **stale for 53/55**.
- `build_page_model.py`'s `docx_media_to_asset_id = {original_path_in_docx_basename: asset_id}` mapped blips **by filename** → 16 unplaced, 8 wrong-page, 29 image/footer mismatch.
- `build_book_model.py`'s `asset_by_media = {…by filename}` had the same fragility.

Fix: everywhere, resolve by **content**. `original_path_in_docx` / `extracted_file` are now traceability-only (real V3 path), never identity.

> Note re `extract_assets.py`: it already writes the **real** current `info.filename` into `original_path_in_docx` and cleans the output dir each run. The stale 53/55 came from `build_model.py`'s old name-keyed derivation, **not** from extraction. No change to `extract_assets.py` was required.

---

## 3. Script Changes (SHA-first rebinding)

### `tools/build_model.py`
- Loads the **previous** manifest read-only as the canonical identity table `id_by_sha = {sha256: asset_id}` (the sound layer).
- Resolves each V3 media file by `sha256` → canonical `asset_id`; **any sha with no canonical id → `SystemExit` "AMBIGUITY"** (refuses to guess by filename — Gate 1 precondition, per the user's item-2 rule).
- `pdf_page` resolved via **SHA**: `page_by_sha` built from `extraction-log` (name→sha) + `image-match` (name→pdf_page), so a renumbered/extension-swapped file still gets the correct perceptual page.
- `original_path_in_docx` / `extracted_file` = the **real V3** path/name from `extraction-log` (traceability only).

### `tools/build_book_model.py`
- Added `asset_by_sha = {sha256: asset}` + `media_sha_by_name` computed from the DOCX zip **bytes** (hashlib), and `asset_for_blip(blip)` → blip → bytes → sha → canonical asset.
- The unit asset loop now calls `asset_for_blip` (renumbering-immune) instead of the old filename-keyed map.

### `tools/build_page_model.py`
- Replaced the filename-keyed `docx_media_to_asset_id` map with `asset_id_for_blip(blip)`: blip → DOCX-zip media bytes → sha256 → `asset_id`.
- Placement stays on `page_by_asset` from the **regenerated (now SHA-correct) manifest** `pdf_page`.

All three keep the canonical principle: a DOCX-internal filename is a throwaway location, never identity.

---

## 4. Regeneration (derived pipeline)

Run bare from repo root, in order:

```
python tools/extract_assets.py          # 55 files, cleans dir
python tools/classify_and_decode.py     # 43 qr + 12 imagen-editorial
python tools/match_images_perceptual.py # 55/55 matched
python tools/build_model.py             # SHA-first rebind (writes assets-manifest.json + book-model-index.json)
python tools/build_book_model.py        # 47 units, 40 credits
python tools/build_page_model.py        # 79 pages, 1 unmapped block ("8 discos" known case), 3 blank
python tools/build_source_references.py # 43/43 resolved
```

Effects: `data/assets-manifest.json` (53 stale `original_path`/`extracted_file` now corrected; all 55 `pdf_page` now V3-correct), `data/book-model.json`, `data/page-model.json`, `data/source-references.json` all regenerated.

**Downstream did NOT need regen** (verified, see §8): the readings book-refs were already re-resolved against the V3 unit structure (47 units, unchanged), and book-index.json is editorial with V3-correct pages already.

---

## 5. GATE 1 — Identity (55/55)

Method: for every manifest asset, hash the physical `extracted_file` and the `original_path_in_docx` basename; each must equal the asset's `sha256`; plus uniqueness and type counts.

- 55 assets, **55 unique SHA-256, 0 duplicates**.
- Every asset's `original_path_in_docx` basename physically holds that asset's own SHA (**55/55**, vs 2/55 before repair).
- Type counts: 43 `qr` + 12 `imagen-editorial`.
- **Identity layer preserved through repair**: `asset_id ↔ sha256` is byte-identical to the pre-repair manifest (repair changed metadata/placement only, never identity).

---

## 6. GATE 2 — Placement (55/55)

Method: for each asset, assert manifest `pdf_page` == the **perceptual page match resolved via SHA** (`image-match.json` + `extraction-log`), and cross-check against the V2→V3 expectation (pages ≥ 63 → +1, else same) using the pre-repair backup as the V2 baseline.

- `manifest.pdf_page` == SHA-resolved perceptual match: **0 mismatches**.
- Every asset's page satisfies the V2+1 invariant: **55/55 OK** (all 16 previously-UNPLACED now placed; all previously WRONG-PAGE now correct; e.g. asset-image34 "Por ser yo" V2 77 → V3 **78**; asset-image15 64→65; asset-image37 68→69; asset-image50 75→76).
- **0 UNPLACED / 0 WRONG-PAGE / 0 shaMISMATCH.**

Per-asset V2 → derived → manifest → expected was printed during the run; all 55 rows `OK`.

---

## 7. GATE 3 — Source References (43/43 content + 43/43 placement, separately)

Two independent oracles:

- **CONTENT oracle (47):** compare each current `source-references.json` entry (keyed by `qr_asset_id`) against the **editorially-validated baseline** (`data/_pre-rebaseline-v3-backup/source-references.json`).
- **PLACEMENT oracle:** verify every reference's `pdf_page` is the V2-correct page (same, or +1 for pages ≥ 63) and consistent with the QR's owning unit.

Result:
- **CONTENT-CORRECT 43/43** — current refs identical to the validated baseline (42 `song` + 1 `press-conference`). The 16 fallback-restored QRs are now resolved placement-derived and content-identical.
- **PLACEMENT-CORRECT 43/43** — every reference page correct, 0 unexplained shifts.
- Resolution sources: 30 BOOK single-credit, 6 BOOK page-disambiguated, 6 EDITORIAL asset-context, 1 EDITORIAL song-credits — all content-derived; **the stale 43→27→43 fallback path is no longer needed for placement**.

---

## 8. GATE 4 — Editorial Images (12/12) + Downstream Verification

**Editorial (Gate 4):** all 12 `imagen-editorial` assets present in `page-model.json` and on their SHA-correct perceptual page (incl. shifted ones: image39 63→64, image50 75→76). **12/12 PASS.**

**READINGS:** `content/readings/readings-v0.3.json` (33 readings, 113 book refs) — verified **0** refs to a unit outside the regenerated 47-unit book-model, **0** refs to a missing page, **0** para-range escapes. Already correct; the re-resolver was not re-run (re-running against the V2 old-book would double-apply an already-applied +1 unit shift).

**book-index:** `data/editorial/book-index.json` — editorial navigation layer; verified each entry's page holds the expected content in the regenerated page-model (portada p1, apertura p10, enajenación-individualismo p12, dedicatorias p3, prólogo p4, ensayo1 p20, ensayo2 p46, ensayo3 p70, epílogo p79, domesticación p30, destrucción p38, los-nadies p51, libertad-de-todos p64, cierre p78). **V3-correct, no change.**

---

## 9. Permanent Regression Gate (new)

Added **`tools/verify_rebaseline_assets.py`** — `python tools/verify_rebaseline_assets.py`:

- **G1 IDENTITY** (permanent, no baseline): 55 assets, unique SHA, each `extracted_file` hashes to its `sha256`, QR assets carry a `qr_value`.
- **G2 PLACEMENT** (permanent, no baseline): manifest `pdf_page` must equal the **SHA-resolved perceptual page** — perpetually derivable from curated `image-match.json` + `extraction-log.json`.
- **G3 CONTENT** (vs validated baseline, best-effort): source-references content-identical to `data/_pre-rebaseline-v3-backup/source-references.json`.

The gate is deliberately **Word renumbering-tolerant**: it never keys on `imageN.ext`. If a future re-baseline renames all 55 files or swaps extensions but the content is unchanged, G1/G2 still pass (that is the *supported* case). It fails loudly on **actual** drift (a sha that no longer matches its file, or a pdf_page that disagrees with the perceptual match).

**Negative test (proof the gate is real):** with one `pdf_page` corrupted to 999, G2 reports `asset-image31: manifest pdf_page 999 != perceptual 61` and exits non-zero. The gate is not vacuous.

---

## 10. What Was NOT Changed

- **No DOCX / PDF modification** (canonical book sources untouched).
- **No frontend change** — `[n].astro`, `PageView`, `PageShell`, `Footer` are faithful consumers; their data inputs are now correct. (User verifies real-browser footers visually.)
- **No hand-editing** of page-model / source-references / readings (all regenerated).
- **No CONCEPTS / MASTER MAP / editorial content** changes.

## 11. Next / Open

- User to visually confirm footer/photos on the rebuilt site (real-browser verification is the final human gate).
- If a future re-baseline renames media: the SHA-first pipeline + regression gate now keep identity and placement correct by construction.

**Awaiting user review of this repair.**
