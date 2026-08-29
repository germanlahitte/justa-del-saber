# REBASELINE V3 — Asset & Source-Reference Audit (v0.1)

**Status:** FROZEN audit (diagnosis only — no repairs applied)
**Date:** 2026-08-28
**Scope:** Identity + Placement + Association audit of all 55 assets and the 43 source-references for the re-baselined V3 book.
**Verdict:** The `asset_id ↔ sha256 ↔ qr_value` **identity layer is 100% SOUND** (55/55 content-identical V2→V3), but the **placement layer is broken for 54/55 assets** and the **source-reference semantic layer was restored correctly** (43/43, content-derived) — the user-visible regressions come from placement, not from lost song identity.

---

## 1. Executive Summary

The author's V3 re-save of the DOCX (which added the blank page 63 and returned the book to 79 pages) **renumbered every one of the 55 embedded media files** (`image1.png`→`image48.png`, etc.) and **swapped the file extension** of 16 of them (`.png`↔`.jpg`).

The change left `assets-manifest.json`'s **`original_path_in_docx` (and `extracted_file`) stale for 53 of 55 assets** — they still record the pre-renumber V2 filenames. Because `build_page_model.py` links a DOCX image to an asset **by filename** (`docx_media_to_asset_id = {original_path_in_docx_basename: asset_id}`), the renumbering silently corrupted every placement:

| Layer | Files | Verdict |
|---|---|---|
| **ASSET IDENTITY** (content) | `assets-manifest.json` `sha256`/`qr_value` | ✅ **55/55 SOUND** — SHA-256 identical V2↔V3; URL→song 1:1 |
| **ASSET PLACEMENT** (where it renders) | `page-model.json` | ❌ **1/55 correct** — 16 **UNPLACED**, 8 **WRONG-PAGE**, 29 **image/footer MISMATCH** |
| **SOURCE REFERENCE** (song identity) | `source-references.json` | ✅ **43/43 resolved, content-derived** (but based on the broken placement's asset set) |
| **FOOTER RENDER** | `web/src/pages/.../[n].astro` | ❌ Regressed — footers read from broken placement |

**One root cause, three symptoms.** The renumbering + stale `original_path_in_docx` broke placement; broken placement cascaded into missing footers and the 43→27→43 source-reference episode; my prior "fix" restored *song identity* (content) but **not physical placement**.

---

## 2. The 43 → 27 → 43 Source-Reference Episode (exact story)

1. **Pre-V3 (backup)**: `source-references.json` had 43 references, resolved from the V2 page-model (which referenced all 55 assets).
2. **After REBASELINE V3**: the V3 DOCX renumbered media → `build_page_model.py` **failed to place 16 assets** → page-model referenced only 39 assets.
3. The V3 `build_source_references.py` run resolved **only 27/43** — the 16 unplaced assets had no owning unit/page → could not resolve → count dropped to 27.
4. **My prior "fix"** (fallback in `build_source_references.py`, applied *before* the freeze): for each unplaced/unresolved Qr asset, restored the song identity by re-resolving the asset to its credit **via the manifest `qr_value` → song**, after verifying the (title, band) is still a printed credit in the V3 book-model. This restored **43/43 *coverage***.

**Critical correction to my earlier claim:** the 43/43 restoration fixed **semantic song identity only** — it did **NOT** fix physical placement. The 16 assets are **still absent from `page-model.json`**, so their footers/photos are **still missing in the rendered web** regardless of the 43/43 count. Coverage ≠ correctness.

---

## 3. Asset Identity Audit (55/55 SOUND)

**Method:** compared each asset's `sha256` in the current manifest against the V2 backup manifest, and confirmed every V3 SHA physically exists in the V3 DOCX media (`assets/docx-media/`).

**Result:**
- All **55/55** assets: `sha256` **identical V2↔V3** (`shaSame=True` for all).
- All **55/55** content SHAs found in the V3 DOCX media (0 missing).
- `asset_id → sha256 → qr_value` is **mutually consistent and 1:1** (in current `source-references.json`, each unique QR URL maps to exactly one song; duplicate song titles correspond to distinct URLs — legitimate).
- **Conclusion:** no QR content was lost or swapped at the *identity* level. `asset-image13` is still (by content) the "Antes que los Viejos Reyes" QR, exactly as in V2. **The trap "don't reassociate by name/position" is honored: identity is by SHA, not filename.**

> The only displayed "identity inconsistency" observed (2/55 `orig_path==sha`) is a **manifest-field staleness**, not a content change — see §4.

---

## 4. Asset Placement Audit (54/55 BROKEN)

**Method:** for each asset, checked (a) whether the manifest's `original_path_in_docx` basename physically holds that asset's own SHA (`origok`), (b) whether the asset appears in `page-model.json`, and (c) whether the page it's placed on equals the V3-expected page (`expected = V2 page + 1` for V2 pages ≥ 63, else same).

**Why placement is broken:** `build_page_model.py` maps each DOCX image blip to an asset **by filename**. After renumbering, a blip's filename no longer holds that asset's content, so:

- **16 assets (BROKEN-UNPLACED)** — their DOCX media got an extension swap, so the blip name has no match in `original_path_in_docx` → never placed → **missing footers/photos**.
- **8 assets (PLACED-WRONG-PAGE)** — placed at the stale manifest page instead of the +1-shifted V3 page (the new blank p63 pushes them 1 page late). 7 of these also have content mismatch; `image34` is content-ok but 1 page early (77 vs expected 78).
- **29 assets (PLACED/shaMISMATCH)** — placed at the manifest page, but that page's displayed image is a **different asset's content** → the rendered image and the footer attribution **disagree**.
- **1 asset (asset-image4) fully correct** — name and content agree and page is right.

**Placement correctness summary: 1/55 fully correct; 16 missing; 8 wrong page; 29 image/footer mismatch.**

Concrete example (`rId54 image1.png`):
- `image1.png` physically contains SHA `da22fe1c` = the **"Ciega ambición"** QR.
- The manifest says `asset-image1.original_path_in_docx = image1.png`, so page-model labels that blip **`asset-image1`**.
- But `asset-image1`'s content (SHA `e2cb570a`) = **"Se vos"**, which physically sits in `image48.png`.
- → The page **displays the "Ciega ambición" QR but the footer attributes it to "Se vos".** This is the regression you observed.

---

## 5. Source-Reference Semantic Audit (43/43, content-derived)

**Method:** compared current vs backup `asset_id → song`. For the ~18 Qr assets where they differ, verified the current assignment is **content-consistent**: current `qr_value` → exactly one song, and `qr_value` matches the manifest (content) ground truth.

| Qr asset | Current song (V3) | Backup song (V2) | Note |
|---|---|---|---|
| asset-image1 | Se vos (Almafuerte) | Sirva otra vuelta, pulpero | current=content-correct |
| asset-image5 | Yo traigo la semilla | Como estaba ahí Dios | current=content-correct |
| asset-image8 | Antes que los Viejos Reyes | Camino al sepulcro | current=content-correct |
| asset-image9 | El fin de los inicuos | Yo traigo la semilla | current=content-correct |
| asset-image10 | Gil Trabajador | El amasijo de un gran sueño | current=content-correct |
| … (18 total Qr differ; 25 Qr identical) | | | |

**Key finding:** the divergences are because **the V2/backup source-references had matched ~18 QRs to the *credit printed on the page* rather than to the *content of the QR***. The V3 fallback re-associated them to the song the QR URL actually encodes (content-derived), so **current identity is the correct one**. All 43 Qr assets now resolve to a content-consistent song reference (**43/43**, all `type=song` except press-conference `asset-image35`).

**Caveat:** 43/43 semantic coverage rests on the fallback (content-derived identity). It is **correct in identity**, but its *placement-driven rendering* (footer presence on the right page) is still broken until §4 is repaired. Status per the user's column: the 43 references are **RESOLVED (content-correct)**; the 16 that required fallback are labeled **NEEDS-REVIEW** in the sense that their *physical page placement* must be re-verified after placement repair.

---

## 6. Footer Corruption — Root Cause (A–E)

The user's options, resolved:

| Option | Verdict |
|---|---|
| **A. `source-references.json` wrong** | **No.** Its semantic song identity is correct (content-derived, URL→song 1:1). It was *nearly* a culprit, but the content layer is sound. |
| **B. page-model asset placement incorrect** | **YES — the primary root cause.** Stale `original_path_in_docx` + renumbered media → 16 missing, 8 wrong-page, 29 image/footer mismatch. |
| **C. `Page→SourceReference` resolver wrong** | **Partial / secondary.** `build_source_references.py` resolves via the broken `owning_units` from placement. Its *identity* fallback is correct; but it consumed the broken placement, so it could not place the 16. |
| **D. Renderer (`[n].astro`) wrong** | **No.** The renderer faithfully shows `page.data.assets.filter(qr)` footers from the (broken) page-model. It is a faithful consumer of bad data. |
| **E. Something else** | The renumbering + stale manifest fields (a **data-ingestion bug in `extract_assets.py`**, which recorded stale `original_path_in_docx`/`extracted_file`). This is the true trigger that folds into B. |

**Root cause statement:** `extract_assets.py` bound V3 media to assets **by filename** after Word renumbered the media, writing stale `original_path_in_docx`/`extracted_file` (53/55) into the manifest. Everything that keys on those filenames (`build_page_model.py` placement, and through it source-reference owning-units and footers) is therefore broken. No content was lost; attribution/placement was.

---

## 7. Full Asset Table (55 rows)

Legend — origok: whether the manifest filename field physically holds this asset's own SHA (content-correct attribution). Status: BROKEN-UNPLACED / PLACED-WRONG-PAGE / PLACED(shaMISMATCH) / PLACED(ok).

| asset_id | type | sha V3==V2 | V2 pg | exp V3 | cur pg | origok | Status |
|---|---|---|---|---|---|---|---|
| asset-image1 | qr | ✔ | 55 | 55 | 55 | ✘ | PLACED/shaMISMATCH |
| asset-image2 | qr | ✔ | 34 | 34 | 34 | ✘ | PLACED/shaMISMATCH |
| asset-image3 | qr | ✔ | 36 | 36 | — | ✘ | BROKEN-UNPLACED |
| asset-image4 | qr | ✔ | 6 | 6 | 6 | ✔ | PLACED (ok) |
| asset-image5 | qr | ✔ | 43 | 43 | 43 | ✘ | PLACED/shaMISMATCH |
| asset-image6 | qr | ✔ | 56 | 56 | 56 | ✘ | PLACED/shaMISMATCH |
| asset-image7 | imagen-editorial | ✔ | 39 | 39 | — | ✘ | BROKEN-UNPLACED |
| asset-image8 | qr | ✔ | 58 | 58 | 58 | ✘ | PLACED/shaMISMATCH |
| asset-image9 | qr | ✔ | 11 | 11 | 11 | ✘ | PLACED/shaMISMATCH |
| asset-image10 | qr | ✔ | 8 | 8 | 8 | ✘ | PLACED/shaMISMATCH |
| asset-image11 | qr | ✔ | 42 | 42 | 42 | ✘ | PLACED/shaMISMATCH |
| asset-image12 | qr | ✔ | 27 | 27 | 27 | ✘ | PLACED/shaMISMATCH |
| asset-image13 | qr | ✔ | 62 | 62 | — | ✘ | BROKEN-UNPLACED |
| asset-image14 | qr | ✔ | 13 | 13 | — | ✘ | BROKEN-UNPLACED |
| asset-image15 | qr | ✔ | 64 | 65 | 64 | ✘ | PLACED-WRONG-PAGE/shaMISMATCH |
| asset-image16 | qr | ✔ | 38 | 38 | 38 | ✘ | PLACED/shaMISMATCH |
| asset-image17 | qr | ✔ | 18 | 18 | — | ✘ | BROKEN-UNPLACED |
| asset-image18 | qr | ✔ | 57 | 57 | — | ✘ | BROKEN-UNPLACED |
| asset-image19 | imagen-editorial | ✔ | 31 | 31 | — | ✘ | BROKEN-UNPLACED |
| asset-image20 | qr | ✔ | 44 | 44 | 44 | ✘ | PLACED/shaMISMATCH |
| asset-image21 | imagen-editorial | ✔ | 19 | 19 | — | ✘ | BROKEN-UNPLACED |
| asset-image22 | qr | ✔ | 64 | 65 | 64 | ✘ | PLACED-WRONG-PAGE/shaMISMATCH |
| asset-image23 | qr | ✔ | 25 | 25 | 25 | ✘ | PLACED/shaMISMATCH |
| asset-image24 | qr | ✔ | 13 | 13 | 13 | ✘ | PLACED/shaMISMATCH |
| asset-image25 | qr | ✔ | 17 | 17 | 17 | ✘ | PLACED/shaMISMATCH |
| asset-image26 | qr | ✔ | 28 | 28 | 28 | ✘ | PLACED/shaMISMATCH |
| asset-image27 | imagen-editorial | ✔ | 19 | 19 | — | ✘ | BROKEN-UNPLACED |
| asset-image28 | qr | ✔ | 41 | 41 | 41 | ✘ | PLACED/shaMISMATCH |
| asset-image29 | imagen-editorial | ✔ | 39 | 39 | — | ✘ | BROKEN-UNPLACED |
| asset-image30 | qr | ✔ | 60 | 60 | 60 | ✘ | PLACED/shaMISMATCH |
| asset-image31 | qr | ✔ | 61 | 61 | 61 | ✘ | PLACED/shaMISMATCH |
| asset-image32 | qr | ✔ | 15 | 15 | — | ✘ | BROKEN-UNPLACED |
| asset-image33 | qr | ✔ | 65 | 66 | 65 | ✘ | PLACED-WRONG-PAGE/shaMISMATCH |
| asset-image34 | qr | ✔ | 77 | 78 | 77 | ✔ | PLACED-WRONG-PAGE (content ok) |
| asset-image35 | qr (press-conf) | ✔ | 7 | 7 | 7 | ✘ | PLACED/shaMISMATCH |
| asset-image36 | qr | ✔ | 59 | 59 | 59 | ✘ | PLACED/shaMISMATCH |
| asset-image37 | qr | ✔ | 68 | 69 | 68 | ✘ | PLACED-WRONG-PAGE/shaMISMATCH |
| asset-image38 | qr | ✔ | 16 | 16 | 16 | ✘ | PLACED/shaMISMATCH |
| asset-image39 | imagen-editorial | ✔ | 63 | 64 | — | ✘ | BROKEN-UNPLACED |
| asset-image40 | imagen-editorial | ✔ | 24 | 24 | 24 | ✘ | PLACED/shaMISMATCH |
| asset-image41 | imagen-editorial | ✔ | 9 | 9 | 9 | ✘ | PLACED/shaMISMATCH |
| asset-image42 | qr | ✔ | 52 | 52 | 52 | ✘ | PLACED/shaMISMATCH |
| asset-image43 | imagen-editorial | ✔ | 45 | 45 | 45 | ✘ | PLACED/shaMISMATCH |
| asset-image44 | qr | ✔ | 35 | 35 | 35 | ✘ | PLACED/shaMISMATCH |
| asset-image45 | qr | ✔ | 66 | 67 | 66 | ✘ | PLACED-WRONG-PAGE/shaMISMATCH |
| asset-image46 | qr | ✔ | 51 | 51 | 51 | ✘ | PLACED/shaMISMATCH |
| asset-image47 | qr | ✔ | 53 | 53 | 53 | ✘ | PLACED/shaMISMATCH |
| asset-image48 | qr | ✔ | 67 | 68 | 67 | ✘ | PLACED-WRONG-PAGE/shaMISMATCH |
| asset-image49 | qr | ✔ | 33 | 33 | 33 | ✘ | PLACED/shaMISMATCH |
| asset-image50 | imagen-editorial | ✔ | 75 | 76 | — | ✘ | BROKEN-UNPLACED |
| asset-image51 | imagen-editorial | ✔ | 12 | 12 | — | ✘ | BROKEN-UNPLACED |
| asset-image52 | qr | ✔ | 30 | 30 | — | ✘ | BROKEN-UNPLACED |
| asset-image53 | qr | ✔ | 29 | 29 | 29 | ✘ | PLACED/shaMISMATCH |
| asset-image54 | imagen-editorial | ✔ | 37 | 37 | 37 | ✘ | PLACED/shaMISMATCH |
| asset-image55 | qr | ✔ | 76 | 77 | — | ✘ | BROKEN-UNPLACED |

**Counts:** fully-correct **1** · BROKEN-UNPLACED **16** · PLACED-WRONG-PAGE **8** · PLACED/shaMISMATCH **29** · (unlabelled image-editorial placed but content-mismatch included in the 29).

---

## 8. Source-Reference Table (43 rows, content-derived)

All 43 Qr assets resolved to a song reference with `qr_value → song` 1:1 (100% content-consistent). The full list of 43 (asset → current song) matches §5; the 18 that differ from backup are content-corrected (see §5 sample). All 43 **EXCEPT** the 16 fallback-restored are independently page-verifiable after placement repair.

---

## 9. Root Cause & Evidence Chain

1. **Trigger:** V3 DOCX re-save renumbered all 55 media files and swapped 16 extensions (confirmed: `assets/docx-media/image13.jpg` exists; manifest says `image13.png`; SHA `90c22541` for that asset now lives in `image8.png`).
2. **Manifest bug:** `extract_assets.py` wrote **stale** `original_path_in_docx`/`extracted_file` (53/55) — filename attribution no longer matches content.
3. **Placement bug:** `build_page_model.py` keys image→asset **by filename** → 16 not placed, 29 mislabeled, 8 wrong page.
4. **Cascade:** page-model (broken) → book-model `unit.assets` (broken) → source-references owning-units (couldn't resolve 16 → 27) → fallback restored identity (43) but not placement → footers (`[n].astro`) read broken placement → **user-visible regression**.

No DOCX/PDF/book-model was modified. Repairs not applied (freeze).

---

## 10. Safe Repair Plan (for approval — NOT yet applied)

The repair must be **content-SHA-first**, immune to renumbering and extension swaps, per the user's item-9 directive.

1. **Rebind `original_path_in_docx` / `extracted_file` by SHA:** for each manifest asset, find the V3 DOCX media file whose bytes hash to that asset's `sha256`, and set `original_path_in_docx` to that real file (`word/media/<actual>.png|.jpg`). This is a pure data fix — no content changes.
2. **Shift `pdf_page` +1** for every asset with V2 page ≥ 63 (accounts for the new blank p63) so placement matches the 79-page V3 layout.
3. **Rebuild pipeline** bare from repo root: `extract(classify)→map→match→build_book_model.py→build_page_model.py→build_source_references.py`. `build_page_model.py` will then resolve every blip by content-SHA and place 55/55.
4. **Re-run READINGS + index** (unchanged commands).
5. **Re-verify:** 55/55 assets placed on the correct page with matching content; the 16 previously-unplaced restored; 43/43 source-references page-consistent. Only then consider footers visually re-checked.
6. Do **not** change `[n].astro` (it is correct); do **not** hand-edit page-model/source-references (they will be regenerated).

**Files that will change on approval:** `data/assets-manifest.json` (original_path/extracted_file/pdf_page), regenerated `data/page-model.json`, `data/book-model.json`, `data/source-references.json`. (`extract_assets.py` fix to prevent recurrence is a separate follow-up.)

**Blocking:** wait for explicit user approval before applying any of §10. Ambiguity → stop.
