#!/usr/bin/env python3
"""
Consolidate validated READINGS v0.2-linked.normalized into canonical READINGS v0.3.

This script:
- reads the locally validated normalized READINGS file;
- preserves all exact BOOK refs;
- preserves canonical concept_ids, tags and reading connections;
- removes migration-only scaffolding;
- writes a clean canonical `readings-v0.3.json`;
- optionally archives intermediate v0.2 files under a history directory;
- never modifies BOOK or CONCEPTS.

PowerShell:
python tools/consolidate_readings_v03.py `
  --readings content/readings/readings-v0.2-linked.normalized.json `
  --concepts content/concepts/concepts-v0.3.json `
  --out content/readings/readings-v0.3.json `
  --report content/readings/READINGS-v0.3-REPORT.md `
  --history-dir content/readings/history/v0.2
"""

import argparse
import json
import shutil
from pathlib import Path

INTERMEDIATE_FILES = [
    "readings-v0.2.json",
    "readings-v0.2.page-linked.json",
    "readings-v0.2-linked.json",
    "readings-v0.2-linked.normalized.json",
    "readings-book-link-spec-v0.2.json",
    "readings-concept-migration-v0.3.json",
    "BOOK-LINK-REPORT-v0.2.md",
    "CONCEPT-NORMALIZATION-REPORT-v0.3.md",
]

def fail(msg):
    raise SystemExit("CONSOLIDATION FAILED: " + msg)

ap = argparse.ArgumentParser()
ap.add_argument("--readings", required=True)
ap.add_argument("--concepts", required=True)
ap.add_argument("--out", required=True)
ap.add_argument("--report", required=True)
ap.add_argument("--history-dir")
ap.add_argument(
    "--move-history",
    action="store_true",
    help="Move intermediate files into history instead of copying them."
)
args = ap.parse_args()

readings_path = Path(args.readings)
concepts_path = Path(args.concepts)
out_path = Path(args.out)
report_path = Path(args.report)

readings = json.loads(readings_path.read_text(encoding="utf-8"))
concepts = json.loads(concepts_path.read_text(encoding="utf-8"))

if not isinstance(readings.get("readings"), list):
    fail("input has no readings[] array")

concept_ids = {c["id"] for c in concepts.get("concepts", [])}
reading_ids = {r["id"] for r in readings["readings"]}

if len(reading_ids) != len(readings["readings"]):
    fail("duplicate Reading IDs")

errors = []
book_ref_count = 0
concept_ref_count = 0
connection_count = 0
tag_count = 0

for r in readings["readings"]:
    rid = r.get("id")
    if not rid:
        errors.append("reading without id")
        continue

    if "concept_labels" in r:
        errors.append(f"{rid}: legacy concept_labels still present")

    for cid in r.get("concept_ids", []):
        concept_ref_count += 1
        if cid not in concept_ids:
            errors.append(f"{rid}: invalid concept_id {cid}")

    for target in r.get("connections", []):
        connection_count += 1
        if target not in reading_ids:
            errors.append(f"{rid}: invalid reading connection {target}")

    refs = r.get("book_refs", [])
    if not refs:
        errors.append(f"{rid}: no book_refs")
    for ref in refs:
        book_ref_count += 1
        if not isinstance(ref.get("book_unit"), int):
            errors.append(f"{rid}: book_ref missing canonical integer book_unit")

    tag_count += len(r.get("tags", []))

    status = r.get("book_unit_link_status")
    if status != "resolved-exact-book-model":
        errors.append(f"{rid}: unexpected BOOK link status {status!r}")

if errors:
    fail("\n- " + "\n- ".join(errors))

# Build a clean canonical top-level object.
canonical = {
    "version": "0.3",
    "layer": readings.get("layer", "FUTURE-ANALYSIS"),
    "status": "canonical-consolidated",
    "source_version": "READINGS v0.2 + exact BOOK linking + CONCEPTS v0.3 normalization",
    "contracts": {
        "book": {
            "reference_field": "book_refs[].book_unit",
            "canonical_key": "unit",
            "source": "BOOK",
            "mutability": "read-only"
        },
        "concepts": {
            "version": concepts.get("version", "0.3"),
            "reference_field": "concept_ids[]",
            "source": "CONCEPTS"
        },
        "readings": {
            "connection_field": "connections[]",
            "connection_key": "reading id"
        },
        "facets": {
            "field": "tags[]",
            "note": "Analytic terms useful for navigation but not modeled as first-class Concepts."
        }
    },
    "editorial_principles": readings.get("editorial_principles", []),
    "readings": readings["readings"]
}

# Remove migration-only fields from individual readings if they exist.
for r in canonical["readings"]:
    r.pop("concept_labels", None)

# Remove migration process metadata from top level by construction.
out_path.parent.mkdir(parents=True, exist_ok=True)
out_path.write_text(
    json.dumps(canonical, ensure_ascii=False, indent=2),
    encoding="utf-8"
)

# Re-open and verify final file exactly as written.
final = json.loads(out_path.read_text(encoding="utf-8"))
if final.get("version") != "0.3":
    fail("final version is not 0.3")
if final.get("status") != "canonical-consolidated":
    fail("final status is not canonical-consolidated")
if len(final["readings"]) != 33:
    fail(f"expected 33 readings, got {len(final['readings'])}")

# Archive/copy historical intermediates.
archived = []
if args.history_dir:
    history_dir = Path(args.history_dir)
    history_dir.mkdir(parents=True, exist_ok=True)
    source_dir = readings_path.parent

    for name in INTERMEDIATE_FILES:
        p = source_dir / name
        if not p.exists():
            continue
        # Do not move the input until canonical output has passed verification.
        dest = history_dir / name
        if dest.resolve() == p.resolve():
            continue
        if args.move_history:
            shutil.move(str(p), str(dest))
        else:
            shutil.copy2(str(p), str(dest))
        archived.append(str(dest))

report = [
    "# READINGS v0.3 — Consolidation report",
    "",
    "## Resultado",
    "",
    "- Estado: **PASSED**",
    f"- Readings canónicos: **{len(final['readings'])}**",
    f"- Referencias BOOK: **{book_ref_count}**",
    f"- Referencias CONCEPTS: **{concept_ref_count}**",
    f"- Conexiones entre Readings: **{connection_count}**",
    f"- Tags/facetas: **{tag_count}**",
    "- Legacy `concept_labels`: **0**",
    "- BOOK refs sin `book_unit` entero: **0**",
    "- Concept IDs inválidos: **0**",
    "- Reading connections inválidas: **0**",
    "",
    "## Archivo canónico",
    "",
    f"`{out_path.as_posix()}`",
    "",
    "Este archivo reemplaza como versión de trabajo a los artefactos intermedios v0.2.",
    "Los intermedios deben conservarse sólo como historial/trazabilidad.",
    "",
    "## Historial",
    "",
]
if archived:
    report += [f"- `{x}`" for x in archived]
else:
    report += [
        "No se archivó ningún archivo automáticamente.",
        "Si se pasó `--history-dir`, sólo se copian/mueven archivos intermedios que existen localmente."
    ]

report += [
    "",
    "## Contrato final",
    "",
    "- BOOK → `book_refs[].book_unit`",
    "- CONCEPTS v0.3 → `concept_ids[]`",
    "- READINGS → `connections[]` mediante IDs `reading-*`",
    "- facetas analíticas → `tags[]`",
    "",
    "La web y el próximo MASTER-MAP deben consumir `readings-v0.3.json`, no los archivos intermedios."
]

report_path.parent.mkdir(parents=True, exist_ok=True)
report_path.write_text("\n".join(report) + "\n", encoding="utf-8")

print("READINGS v0.3 consolidation PASSED.")
print("Canonical output:", out_path)
print("Report:", report_path)
if args.history_dir:
    print("History files archived/copied:", len(archived))
