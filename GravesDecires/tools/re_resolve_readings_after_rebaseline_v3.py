#!/usr/bin/env python3
"""
Re-resolve READINGS book_refs after EDITORIAL REBASELINE V3.

Background: the author re-baselined the book again (new DOCX/PDF). This time a
blank physical page was inserted after old p.62 (so the book is 79 pages again)
and the V2 unit merge was reversed: the regenerated book-model has 47 units,
with V3 unit 39 ("La libertad de todos" prose) restored as its own unit, so
every V2 unit >= 39 renumbered to n+1 (V2 39->40 ... V2 46->47). Units 1..38
keep their numbers; the four zero-text (visual-only/blank) units 16,20,26,45
stay at their ordinal position.

This tool re-links each reading's book_refs by CONTENT IDENTITY: it matches the
old (V2) unit's full text_verbatim (or headings+song-credits signature, then an
ordinal fallback for zero-text units) against the regenerated (V3) book-model,
then refreshes book_unit, docx_paragraph_range and pdf_pages from the canonical
regenerated data. It NEVER edits the book model or the page model -- it only
rewrites content/readings/readings-v0.3.json.

It is conservative: any old-unit signature that cannot be matched to exactly
one regenerated unit FAILS loudly and writes no output.

Usage:
  python tools/re_resolve_readings_after_rebaseline_v3.py \
    --readings content/readings/readings-v0.3.json \
    --old-book data/backups/_pre-rebaseline-v3-backup/book-model.json \
    --new-book data/book-model.json \
    --new-page-model data/page-model.json \
    --out content/readings/readings-v0.3.json \
    --report content/readings/BOOK-LINK-REBASELINE-V3-REPORT.md
"""

import argparse
import json
import re
import unicodedata
from pathlib import Path


def norm(s):
    s = unicodedata.normalize("NFKD", str(s or ""))
    s = "".join(c for c in s if not unicodedata.combining(c))
    s = s.lower().replace("\u201c", "").replace("\u201d", "").replace("\u00ab", "").replace("\u00bb", "").replace("'", "")
    return re.sub(r"\s+", " ", s).strip()


def text_sig(u):
    """Full normalized text_verbatim -- the strongest content-identity signal."""
    return norm(u.get("text_verbatim"))


def hdr_sig(u):
    """Headings + song credits signature."""
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


def build_old_to_new(old_units, new_units):
    """Map each OLD unit (by number) to exactly ONE new unit by content identity.

    Deterministic order: full-text exact -> full-text first-line -> hdr/credit
    signature -> ordinal among zero-text units. Any ambiguity fails loudly.
    """
    new_by_num = {u["unit"]: u for u in new_units}
    text_idx = {}
    first_idx = {}
    sig_idx = {}
    for u in new_units:
        text_idx.setdefault(text_sig(u), []).append(u["unit"])
        first = norm((u.get("text_verbatim") or "").split("\n")[0])
        first_idx.setdefault(first, []).append(u["unit"])
        sig_idx.setdefault(hdr_sig(u), []).append(u["unit"])

    # zero-text new units, in order
    zero_new = [u["unit"] for u in new_units if not (u.get("text_verbatim") or "").strip()]
    zero_old = [u["unit"] for u in old_units if not (u.get("text_verbatim") or "").strip()]

    result = {}
    problems = []

    for ou in old_units:
        on = ou["unit"]
        t = text_sig(ou)
        cands = None
        method = "full-text"
        if not t:
            # zero-text unit (visual-only/blank): ordinal position among the
            # zero-text new units (unchanged positions here, since the +1 shift
            # only affects units >= 39 and the empty units live below it).
            if on in zero_old:
                pos = zero_old.index(on)
                if pos < len(zero_new):
                    cands = [zero_new[pos]]
                    method = "ordinal-empty"
                else:
                    cands = []
        elif t:
            cands = text_idx.get(t)
        if not cands and method != "ordinal-empty":
            first = norm((ou.get("text_verbatim") or "").split("\n")[0])
            cands = first_idx.get(first)
            method = "first-line"
        if not cands and method != "ordinal-empty" and hdr_sig(ou):
            cands = sig_idx.get(hdr_sig(ou))
            method = "signature"
        uniq = list(dict.fromkeys(cands or []))
        if len(uniq) == 1:
            result[on] = uniq[0]
        elif len(uniq) > 1:
            problems.append((on, method, f"ambiguous {uniq}"))
        else:
            problems.append((on, method, "no match"))

    return result, problems


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

    new_by_num = {u["unit"]: u for u in new_book["units"]}
    old_by_num = {u["unit"]: u for u in old_book["units"]}

    # Map every OLD unit -> new unit; fails if ANY old unit is ambiguous/unmapped.
    mapping, problems = build_old_to_new(old_book["units"], new_book["units"])
    if problems:
        print("UNIT MAPPING PROBLEMS (no output written):")
        for p in problems:
            print("  ", p)
        raise SystemExit("V3 re-resolution aborted: old->new unit mapping not complete/unambiguous.")

    # Physical pages per NEW unit.
    unit_pages = {}
    for p in page_model["pages"]:
        for u in p.get("book_units") or []:
            unit_pages.setdefault(u, []).append(p["page"])
    unit_pages = {k: sorted(set(v)) for k, v in unit_pages.items()}

    changes = []
    failures = []

    for reading in readings["readings"]:
        rid = reading["id"]
        new_refs = []
        for br in reading.get("book_refs") or []:
            old_unit = br.get("book_unit")
            if old_unit not in mapping:
                failures.append((rid, old_unit, "old unit not in V2 model"))
                continue
            nu = mapping[old_unit]
            new_u = new_by_num[nu]
            new_ref = dict(br)
            new_ref["book_unit"] = nu
            ep = dict(br.get("evidence") or {})
            ep["docx_paragraph_range"] = new_u.get("docx_paragraph_range")
            npages = unit_pages.get(nu, [])
            ep["pdf_pages"] = npages
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
            changes.append((rid, br.get("book_unit"), new_ref["book_unit"], changed))

        reading["book_refs"] = new_refs
        if not new_refs:
            reading["book_unit_link_status"] = "UNRESOLVED-AFTER-REBASELINE"
        else:
            reading["book_unit_link_status"] = "resolved-exact-book-model"

    if failures:
        print("REF FAILURES (no output written):")
        for f in failures:
            print("  ", f)
        raise SystemExit("V3 re-resolution incomplete. Nothing was written.")

    Path(args.out).write_text(json.dumps(readings, ensure_ascii=False, indent=2), encoding="utf-8")

    md = [
        "# READINGS book_refs — REBASELINE V3 re-resolution",
        "",
        f"- BOOK units regenerated: {len(new_book['units'])}",
        f"- Readings: {len(readings['readings'])}",
        f"- Book refs re-linked: {len(changes)}",
        f"- Failures: {len(failures)}",
        "",
        "| Reading | old unit | new unit | changed fields |",
        "|---|---|---|---|",
    ]
    for rid, ou, nu_, ch in changes:
        md.append(f"| `{rid}` | {ou} | {nu_} | {', '.join(ch) or '—'} |")
    Path(args.report).write_text("\n".join(md) + "\n", encoding="utf-8")

    n_changed_readings = len({c[0] for c in changes})
    print(f"Re-resolved {len(changes)} book refs across {n_changed_readings} readings.")
    print("Also printed mapping:")
    print("  ", sorted(mapping.items()))
    print("Output:", args.out)
    print("Report:", args.report)


if __name__ == "__main__":
    main()
