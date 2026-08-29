#!/usr/bin/env python3
"""
Resolve READINGS v0.2 anchors to the canonical BOOK units used by this project.

Actual book-model schema:
  {
    "units": [
      {
        "unit": 1,
        "docx_paragraph_range": [...],
        "pdf_pages_via_assets": ...,
        "headings": [...],
        "song_credits": [...],
        "text_verbatim": "..."
      }
    ]
  }

Important:
- The canonical BOOK model has NO `id` on BookUnit.
- Therefore this resolver stores the exact canonical integer key as
  `book_unit`, rather than inventing a `book_unit_id`.
- BOOK is read-only and is never modified.

Usage:
  python tools/resolve_readings_book_links.py ^
    --book data/book-model.json ^
    --readings content/readings/readings-v0.2.json ^
    --spec content/readings/readings-book-link-spec-v0.2.json ^
    --out content/readings/readings-v0.2-linked.json ^
    --report content/readings/BOOK-LINK-REPORT-v0.2.md
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
    )
    return re.sub(r"\s+", " ", s).strip()


def as_list(x):
    if x is None:
        return []
    return x if isinstance(x, list) else [x]


def extract_units(book):
    if not isinstance(book, dict):
        raise SystemExit(
            f"Expected book-model root to be dict, got {type(book).__name__}"
        )
    units = book.get("units")
    if not isinstance(units, list):
        raise SystemExit("Cannot locate canonical `units` list in book-model.json")
    return units


def unit_number(u):
    value = u.get("unit")
    if isinstance(value, int):
        return value
    if isinstance(value, str) and value.isdigit():
        return int(value)

    raise SystemExit(
        "A canonical BOOK unit has no valid `unit` number.\n"
        f"keys={list(u.keys())}\n"
        f"object={json.dumps(u, ensure_ascii=False, indent=2)[:3000]}"
    )


def parse_pages(value):
    """
    Supports:
      13
      [13, 14]
      "13"
      "13-14"
      "UNKNOWN"
      null
    """
    if value is None:
        return []

    if isinstance(value, int):
        return [value]

    if isinstance(value, list):
        out = []
        for x in value:
            out.extend(parse_pages(x))
        return sorted(set(out))

    if isinstance(value, str):
        if norm(value) in {"unknown", "none", "null", ""}:
            return []

        # Handle ranges such as "13-15" or "13–15"
        m = re.fullmatch(r"\s*(\d+)\s*[-–]\s*(\d+)\s*", value)
        if m:
            a, b = map(int, m.groups())
            lo, hi = min(a, b), max(a, b)
            return list(range(lo, hi + 1))

        nums = [int(x) for x in re.findall(r"\d+", value)]
        return sorted(set(nums))

    return []


def unit_pages(u):
    # Actual canonical key first.
    for key in ("pdf_pages_via_assets", "pdf_pages", "pdfPages", "pages"):
        if key in u:
            return parse_pages(u.get(key))
    return []


def flatten_text(value):
    bits = []

    if isinstance(value, str):
        bits.append(value)
    elif isinstance(value, (int, float)):
        bits.append(str(value))
    elif isinstance(value, list):
        for item in value:
            bits.extend(flatten_text(item))
    elif isinstance(value, dict):
        for item in value.values():
            bits.extend(flatten_text(item))

    return bits


def unit_text(u):
    bits = []
    # Actual canonical schema fields first.
    for key in (
        "headings",
        "song_credits",
        "text_verbatim",
        "title",
        "songCredits",
        "textVerbatim",
    ):
        if key in u:
            bits.extend(flatten_text(u.get(key)))
    return norm(" ".join(bits))


def score_unit(u, pages, anchors):
    requested_pages = set(pages or [])
    available_pages = set(unit_pages(u))

    page_hits = len(requested_pages & available_pages)

    txt = unit_text(u)
    matched_anchors = [
        a for a in (anchors or [])
        if norm(a) and norm(a) in txt
    ]
    anchor_hits = len(matched_anchors)

    # Anchor evidence dominates page metadata.
    score = anchor_hits * 100 + page_hits * 10
    return score, anchor_hits, page_hits, matched_anchors


PAGE_EXPANDING_RELATIONS = {
    "section-basis",
    "section-and-essay-basis",
    "essay-linked-basis",
    "essay-and-section-basis",
    "transversal-basis",
    "structural-basis",
    "structural-transversal-basis",
}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--book", required=True)
    ap.add_argument("--readings", required=True)
    ap.add_argument("--spec", required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--report", required=True)
    args = ap.parse_args()

    book = json.loads(Path(args.book).read_text(encoding="utf-8"))
    readings = json.loads(Path(args.readings).read_text(encoding="utf-8"))
    spec_payload = json.loads(Path(args.spec).read_text(encoding="utf-8"))
    spec = spec_payload["readings"]

    units = extract_units(book)

    # Validate canonical unit numbers once, early.
    numbers = [unit_number(u) for u in units]
    if len(numbers) != len(set(numbers)):
        raise SystemExit("Duplicate canonical `unit` numbers found in BOOK.")

    report_rows = []
    unresolved = []

    for reading in readings["readings"]:
        rid = reading["id"]

        if rid not in spec:
            unresolved.append(rid)
            reading["book_refs"] = []
            reading["book_unit_link_status"] = "UNRESOLVED-SPEC-MISSING"
            report_rows.append((rid, [], "UNRESOLVED-SPEC-MISSING"))
            continue

        s = spec[rid]
        pages = s.get("pdf_pages", [])
        anchors = s.get("anchors", [])
        relation = s.get("relation", "basis")

        ranked = []

        for u in units:
            score, ah, ph, matched = score_unit(u, pages, anchors)
            if score:
                ranked.append(
                    {
                        "score": score,
                        "anchor_hits": ah,
                        "page_hits": ph,
                        "matched_anchors": matched,
                        "unit": u,
                    }
                )

        ranked.sort(
            key=lambda x: (
                x["score"],
                x["anchor_hits"],
                x["page_hits"],
                -unit_number(x["unit"]),
            ),
            reverse=True,
        )

        anchor_units = [x for x in ranked if x["anchor_hits"] > 0]
        page_units = [x for x in ranked if x["page_hits"] > 0]

        selected = []
        seen = set()

        for x in anchor_units:
            n = unit_number(x["unit"])
            if n not in seen:
                selected.append(x)
                seen.add(n)

        if relation in PAGE_EXPANDING_RELATIONS:
            for x in page_units:
                n = unit_number(x["unit"])
                if n not in seen:
                    selected.append(x)
                    seen.add(n)

        if not selected:
            unresolved.append(rid)
            reading["book_refs"] = []
            reading["book_unit_link_status"] = "UNRESOLVED"
            report_rows.append((rid, [], "UNRESOLVED"))
            continue

        selected.sort(key=lambda x: unit_number(x["unit"]))

        refs = []
        for x in selected:
            u = x["unit"]
            refs.append(
                {
                    # Exact canonical BOOK reference:
                    "book_unit": unit_number(u),
                    "relation": relation,
                    "source": "BOOK",
                    "evidence": {
                        "pdf_pages": unit_pages(u),
                        "matched_anchors": x["matched_anchors"],
                        "anchor_hits": x["anchor_hits"],
                        "page_overlap_hits": x["page_hits"],
                        "docx_paragraph_range": u.get("docx_paragraph_range"),
                    },
                }
            )

        reading["book_refs"] = refs
        reading["book_unit_link_status"] = "resolved-exact-book-model"
        report_rows.append(
            (
                rid,
                [str(x["book_unit"]) for x in refs],
                "RESOLVED",
            )
        )

    readings["schema_version"] = "0.2-book-linked"
    readings["book_linkage"] = {
        "status": (
            "resolved-exact-book-model"
            if not unresolved
            else "PARTIAL"
        ),
        "canonical_book_unit_key": "unit",
        "book_model": args.book,
        "unresolved": unresolved,
        "note": (
            "The canonical book model identifies units with integer field `unit`; "
            "no synthetic BookUnit IDs were created."
        ),
    }

    out_path = Path(args.out)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(
        json.dumps(readings, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )

    md = [
        "# BOOK ↔ READINGS link report v0.2",
        "",
        f"- BOOK units detected: {len(units)}",
        "- Canonical BOOK unit key: `unit` (integer)",
        f"- Readings: {len(readings['readings'])}",
        f"- Resolved: {len(readings['readings']) - len(unresolved)}",
        f"- Unresolved: {len(unresolved)}",
        "",
        "| Reading | BOOK units | Estado |",
        "|---|---|---|",
    ]

    for rid, refs, status in report_rows:
        formatted = ", ".join(f"`{x}`" for x in refs) if refs else "—"
        md.append(f"| `{rid}` | {formatted} | {status} |")

    if unresolved:
        md += [
            "",
            "## Unresolved",
            "",
            *[f"- `{x}`" for x in unresolved],
        ]

    report_path = Path(args.report)
    report_path.parent.mkdir(parents=True, exist_ok=True)
    report_path.write_text("\n".join(md) + "\n", encoding="utf-8")

    if unresolved:
        raise SystemExit(
            "UNRESOLVED: " + ", ".join(unresolved)
            + f"\nPartial output was written to {args.out}"
            + f"\nReport: {args.report}"
        )

    print(
        f"Resolved all {len(readings['readings'])} readings "
        f"against {len(units)} canonical BOOK units."
    )
    print("Output:", args.out)
    print("Report:", args.report)


if __name__ == "__main__":
    main()
