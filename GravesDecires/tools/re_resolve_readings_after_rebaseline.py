#!/usr/bin/env python3
"""
Re-resolve READINGS book_refs after EDITORIAL REBASELINE V2.

Background: the author re-baselined the book (new DOCX/PDF). One empty BookUnit
was removed (so every unit n>=14 renumbered to n-1) and one visual-only page
(old p25) was deleted (so physical pages >25 shifted -1). Both BookUnit numbers
and per-unit docx_paragraph_range / pdf_pages changed in the regenerated
book-model.json / page-model.json.

This tool re-links each reading's book_refs by CONTENT IDENTITY: it matches the
old unit's headings+song-credits signature against the regenerated book-model,
then refreshes book_unit, docx_paragraph_range and pdf_pages from the canonical
regenerated data. It NEVER edits the book model or the page model — it only
rewrites content/readings/readings-v0.3.json.

It is conservative: any ref whose old-unit signature cannot be matched to
exactly one regenerated unit FAILS loudly and writes no output.

Usage:
  python tools/re_resolve_readings_after_rebaseline.py \
    --readings content/readings/readings-v0.3.json \
    --old-book data/backups/_pre-rebaseline-v2-backup/book-model.json \
    --new-book data/book-model.json \
    --new-page-model data/page-model.json \
    --out content/readings/readings-v0.3.json \
    --report content/readings/BOOK-LINK-REBASELINE-V2-REPORT.md
"""

import argparse
import json
import re
import unicodedata
from pathlib import Path


def norm(s):
    s = unicodedata.normalize("NFKD", str(s or ""))
    s = "".join(c for c in s if not unicodedata.combining(c))
    s = (
        s.lower()
        .replace("“", "")
        .replace("”", "")
        .replace("«", "")
        .replace("»", "")
        .replace("'", "")
    )
    return re.sub(r"\s+", " ", s).strip()


def unit_signature(u):
    """Stable, content-identity signature for a BOOK unit (headings + credits)."""
    bits = []
    bits.extend(u.get("headings") or [])
    for c in u.get("song_credits") or []:
        if isinstance(c, dict):
            for k in ("song_title", "title", "band", "album"):
                if c.get(k):
                    bits.append(c[k])
        else:
            bits.append(c)
    return norm(" ".join(bits))


def load(path):
    return json.loads(Path(path).read_text(encoding="utf-8"))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--readings", required=True)
    ap.add_argument("--old-book", required=True)
    ap.add_argument("--new-book", required=True)
    ap.add_argument("--new-page-model", required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--report", required=True)
    args = ap.parse_args()

    readings = load(args.readings)
    old_book = load(args.old_book)
    new_book = load(args.new_book)
    page_model = load(args.new_page_model)

    # Index NEW units by number and by signature (for subset matching).
    new_by_num = {u["unit"]: u for u in new_book["units"]}
    new_sig_units = []  # (signature, unit)
    for u in new_book["units"]:
        s = unit_signature(u)
        if s:
            new_sig_units.append((s, u))

    # Deterministic renumbering rule from the re-baseline:
    #  - units 1..12 keep their number
    #  - old unit 13 ("Presa fácil") was MERGED into unit 12 (Represión)
    #  - units >=14 shift -1 (one unit removed)
    def numeric_target(old_n):
        if old_n <= 12:
            return old_n
        if old_n == 13:
            return 12
        return old_n - 1

    # Index OLD units by number.
    old_by_num = {u["unit"]: u for u in old_book["units"]}

    # New unit number -> list of physical pages from page-model.
    unit_pages = {}
    for p in page_model["pages"]:
        for u in p.get("book_units") or []:
            unit_pages.setdefault(u, []).append(p["page"])
    unit_pages = {k: sorted(set(v)) for k, v in unit_pages.items()}

    changes = []  # (reading_id, old_unit, new_unit, changed_fields)
    failures = []

    for reading in readings["readings"]:
        rid = reading["id"]
        new_refs = []
        for br in reading.get("book_refs") or []:
            old_unit = br.get("book_unit")
            old_u = old_by_num.get(old_unit)
            sig = unit_signature(old_u) if old_u else ""

            # Determine the matched new unit.
            nu = None
            method = None
            if sig:
                # Subset matching: a new unit whose signature CONTAINS the old
                # unit's signature is a candidate (handles units that were merged
                # after a renumbering). Must be unambiguous.
                cands = [u for s, u in new_sig_units if sig in s]
                if len(cands) == 1:
                    nu = cands[0]
                    method = "content-identity"
                elif len(cands) > 1:
                    failures.append(
                        (rid, old_unit, f"signature matched {len(cands)} new units")
                    )
                    continue
                else:
                    # No candidate -> content removed -> fail loudly.
                    failures.append((rid, old_unit, "signature not found in new model"))
                    continue
            else:
                # Empty unit (prose/essay, no headings/credits) -> numeric rule.
                target = numeric_target(old_unit)
                nu = new_by_num.get(target)
                if not nu:
                    failures.append((rid, old_unit, f"numeric target {target} missing"))
                    continue
                if not (nu.get("text_verbatim") or "").strip():
                    failures.append((rid, old_unit, f"numeric target {target} has no text"))
                    continue

            # Cross-check: when content-identity matched, it MUST agree with the
            # deterministic numeric rule (guards against silent drift).
            if method == "content-identity":
                nr = numeric_target(old_unit)
                if nu["unit"] != nr:
                    failures.append(
                        (rid, old_unit, f"identity->{nu['unit']} != numeric->{nr}")
                    )
                    continue

            new_ref = dict(br)
            new_ref["book_unit"] = nu["unit"]
            ep = dict(br.get("evidence") or {})
            ep["docx_paragraph_range"] = nu.get("docx_paragraph_range")
            npages = unit_pages.get(nu["unit"], [])
            ep["pdf_pages"] = npages
            # page_overlap_hits = intersection of the ref's old pages with new pages
            old_pages = set((br.get("evidence") or {}).get("pdf_pages") or [])
            ep["page_overlap_hits"] = len(old_pages & set(npages))
            new_ref["evidence"] = ep
            new_refs.append(new_ref)

            changed = []
            if br.get("book_unit") != new_ref["book_unit"]:
                changed.append("book_unit")
            if (br.get("evidence") or {}).get("docx_paragraph_range") != ep["docx_paragraph_range"]:
                changed.append("docx_paragraph_range")
            if (br.get("evidence") or {}).get("pdf_pages") != ep["pdf_pages"]:
                changed.append("pdf_pages")
            changes.append(
                (rid, br.get("book_unit"), new_ref["book_unit"], changed, method or "numeric")
            )

        reading["book_refs"] = new_refs
        if not new_refs:
            reading["book_unit_link_status"] = "UNRESOLVED-AFTER-REBASELINE"
        else:
            reading["book_unit_link_status"] = "resolved-exact-book-model"

    if failures:
        print("FAILURES (no output written):")
        for f in failures:
            print("  ", f)
        # also print the unmatched signatures sample
        raise SystemExit("Re-resolution incomplete. Nothing was written.")

    # Write output.
    out_path = Path(args.out)
    out_path.write_text(
        json.dumps(readings, ensure_ascii=False, indent=2), encoding="utf-8"
    )

    # Report.
    md = [
        "# READINGS book_refs — REBASELINE V2 re-resolution",
        "",
        f"- BOOK units regenerated: {len(new_book['units'])}",
        f"- Readings: {len(readings['readings'])}",
        f"- Book refs re-linked: {len(changes)}",
        f"- Failures: {len(failures)}",
        "",
        "| Reading | old unit | new unit | method | changed fields |",
        "|---|---|---|---|---|",
    ]
    for rid, ou, nu_, ch, m in changes:
        md.append(f"| `{rid}` | {ou} | {nu_} | {m} | {', '.join(ch) or '—'} |")
    Path(args.report).write_text("\n".join(md) + "\n", encoding="utf-8")

    n_changed_readings = len({c[0] for c in changes})
    print(f"Re-resolved {len(changes)} book refs across {n_changed_readings} readings.")
    print("Output:", out_path)
    print("Report:", args.report)


if __name__ == "__main__":
    main()
