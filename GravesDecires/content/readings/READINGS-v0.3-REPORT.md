# READINGS v0.3 — Consolidation report

## Resultado

- Estado: **PASSED**
- Readings canónicos: **33**
- Referencias BOOK: **113**
- Referencias CONCEPTS: **133**
- Conexiones entre Readings: **109**
- Tags/facetas: **21**
- Legacy `concept_labels`: **0**
- BOOK refs sin `book_unit` entero: **0**
- Concept IDs inválidos: **0**
- Reading connections inválidas: **0**

## Archivo canónico

`content/readings/readings-v0.3.json`

Este archivo reemplaza como versión de trabajo a los artefactos intermedios v0.2.
Los intermedios deben conservarse sólo como historial/trazabilidad.

## Historial

- `content\readings\history\v0.2\readings-v0.2.json`
- `content\readings\history\v0.2\readings-v0.2.page-linked.json`
- `content\readings\history\v0.2\readings-v0.2-linked.json`
- `content\readings\history\v0.2\readings-v0.2-linked.normalized.json`
- `content\readings\history\v0.2\readings-book-link-spec-v0.2.json`
- `content\readings\history\v0.2\readings-concept-migration-v0.3.json`
- `content\readings\history\v0.2\BOOK-LINK-REPORT-v0.2.md`
- `content\readings\history\v0.2\CONCEPT-NORMALIZATION-REPORT-v0.3.md`

## Contrato final

- BOOK → `book_refs[].book_unit`
- CONCEPTS v0.3 → `concept_ids[]`
- READINGS → `connections[]` mediante IDs `reading-*`
- facetas analíticas → `tags[]`

La web y el próximo MASTER-MAP deben consumir `readings-v0.3.json`, no los archivos intermedios.
