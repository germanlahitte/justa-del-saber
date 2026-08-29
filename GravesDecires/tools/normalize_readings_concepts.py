#!/usr/bin/env python3
"""
Normalize READINGS v0.2-linked against CONCEPTS v0.3.

What it does:
- preserves exact BOOK refs already resolved locally;
- converts concept_labels[] to canonical concept_ids[];
- sends non-ontology analytic terms to tags[];
- converts connections[] from Rxx aliases to canonical reading IDs;
- validates all concepts and reading connections;
- never modifies BOOK.

PowerShell example:
python tools/normalize_readings_concepts.py `
  --concepts content/concepts/concepts-v0.3.json `
  --readings content/readings/readings-v0.2-linked.json `
  --migration content/readings/readings-concept-migration-v0.3.json `
  --out content/readings/readings-v0.2-linked.normalized.json `
  --report content/readings/CONCEPT-NORMALIZATION-REPORT-v0.3.md
"""
import argparse, json, re, unicodedata
from pathlib import Path

def norm(s):
    s = unicodedata.normalize("NFKD", str(s or ""))
    s = "".join(ch for ch in s if not unicodedata.combining(ch))
    return re.sub(r"\s+", " ", s.lower().strip().rstrip(".")).strip()

ap = argparse.ArgumentParser()
ap.add_argument("--concepts", required=True)
ap.add_argument("--readings", required=True)
ap.add_argument("--migration", required=True)
ap.add_argument("--out", required=True)
ap.add_argument("--report", required=True)
args = ap.parse_args()

concepts = json.loads(Path(args.concepts).read_text(encoding="utf-8"))
readings = json.loads(Path(args.readings).read_text(encoding="utf-8"))
migration = json.loads(Path(args.migration).read_text(encoding="utf-8"))

concept_by_id = {c["id"]: c for c in concepts["concepts"]}
name_to_id = {}
for c in concepts["concepts"]:
    name_to_id[norm(c["name"])] = c["id"]
    for part in c["name"].split("/"):
        name_to_id[norm(part)] = c["id"]

aliases = {norm(k): v for k, v in migration["label_aliases"].items()}
facet_terms = {norm(x) for x in migration["facet_terms"]}
supplemental = migration["supplemental_concepts"]
order_aliases = migration["reading_order_aliases"]

reading_ids = {r["id"] for r in readings["readings"]}

unresolved_labels = []
invalid_concepts = []
invalid_connections = []
rows = []

for r in readings["readings"]:
    labels = r.pop("concept_labels", [])
    concept_ids = []
    tags = []

    for raw in labels:
        n = norm(raw)
        cid = name_to_id.get(n) or aliases.get(n)

        if cid:
            if cid not in concept_by_id:
                invalid_concepts.append((r["id"], raw, cid))
            elif cid not in concept_ids:
                concept_ids.append(cid)
        elif n in facet_terms:
            pretty = str(raw).strip().rstrip(".")
            if pretty not in tags:
                tags.append(pretty)
        else:
            unresolved_labels.append((r["id"], raw))

    for cid in supplemental.get(r["id"], []):
        if cid not in concept_by_id:
            invalid_concepts.append((r["id"], "[supplemental]", cid))
        elif cid not in concept_ids:
            concept_ids.append(cid)

    old_connections = r.get("connections", [])
    new_connections = []
    for conn in old_connections:
        target = order_aliases.get(conn, conn)
        if target not in reading_ids:
            invalid_connections.append((r["id"], conn, target))
        if target not in new_connections:
            new_connections.append(target)

    # Preserve BOOK linkage fields because we mutate only concept/navigation fields.
    r["concept_ids"] = concept_ids
    r["tags"] = tags
    r["connections"] = new_connections

    rows.append((r["id"], len(concept_ids), len(tags), len(new_connections)))

readings["normalization"] = {
    "concept_contract": "CONCEPTS v0.3",
    "status": "normalized-canonical",
    "removed_field": "concept_labels",
    "canonical_fields": ["concept_ids", "connections"],
    "facet_field": "tags",
    "book_refs_preserved": True
}

errors = []
if unresolved_labels:
    errors.append(f"unresolved labels: {len(unresolved_labels)}")
if invalid_concepts:
    errors.append(f"invalid concepts: {len(invalid_concepts)}")
if invalid_connections:
    errors.append(f"invalid connections: {len(invalid_connections)}")

out_path = Path(args.out)
out_path.parent.mkdir(parents=True, exist_ok=True)
out_path.write_text(json.dumps(readings, ensure_ascii=False, indent=2), encoding="utf-8")

md = [
    "# CONCEPT normalization report v0.3",
    "",
    f"- Concepts available: {len(concept_by_id)}",
    f"- Readings processed: {len(readings['readings'])}",
    f"- Unresolved labels: {len(unresolved_labels)}",
    f"- Invalid concept IDs: {len(invalid_concepts)}",
    f"- Invalid reading connections: {len(invalid_connections)}",
    "",
    "| Reading | Concepts | Tags | Connections |",
    "|---|---:|---:|---:|"
]
for rid, nc, nt, nx in rows:
    md.append(f"| `{rid}` | {nc} | {nt} | {nx} |")

if unresolved_labels:
    md += ["", "## Unresolved labels", ""]
    for rid, raw in unresolved_labels:
        md.append(f"- `{rid}`: `{raw}`")
if invalid_concepts:
    md += ["", "## Invalid concepts", ""]
    for rid, raw, cid in invalid_concepts:
        md.append(f"- `{rid}`: `{raw}` → `{cid}`")
if invalid_connections:
    md += ["", "## Invalid connections", ""]
    for rid, raw, target in invalid_connections:
        md.append(f"- `{rid}`: `{raw}` → `{target}`")

Path(args.report).write_text("\n".join(md) + "\n", encoding="utf-8")

if errors:
    raise SystemExit("NORMALIZATION FAILED: " + "; ".join(errors))

print(
    f"Normalized all {len(readings['readings'])} readings "
    f"against {len(concept_by_id)} canonical Concepts."
)
print("Output:", args.out)
print("Report:", args.report)
