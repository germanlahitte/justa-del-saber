# CONCEPTS v0.3 + READINGS normalization

## Resultado

Esta entrega formaliza el contrato entre CONCEPTS y READINGS.

- CONCEPTS: **32** IDs canónicos.
- READINGS: **33** fichas.
- `concept_labels[]` deja de ser contrato técnico.
- `concept_ids[]` pasa a ser la referencia canónica.
- términos analíticos no ontológicos pasan a `tags[]`.
- `connections[]` deja de usar `R01..R33` y pasa a IDs `reading-*`.
- las referencias `book_refs` del archivo linked local se preservan intactas.

## Nuevos Concepts v0.3

- `concept-tiempo`
- `concept-identidad`
- `concept-memoria`
- `concept-enajenacion`

Además:
- `concept-los-nadies` se agrega explícitamente al Reading del giro ético.
- `concept-intuicion` se agrega explícitamente a `reading-ideando-la-fuga`.

## Ubicación recomendada

```text
content/
├── concepts/
│   ├── CONCEPTS-v0.3.md
│   └── concepts-v0.3.json
│
└── readings/
    └── readings-concept-migration-v0.3.json

tools/
└── normalize_readings_concepts.py
```

`readings-v0.2.normalized-template.json` es sólo una referencia para inspección:
no contiene los `book_refs` que resolviste localmente.

## Generar el READINGS linked final

Desde la raíz del repo, en PowerShell:

```powershell
python tools/normalize_readings_concepts.py `
  --concepts content/concepts/concepts-v0.3.json `
  --readings content/readings/readings-v0.2-linked.json `
  --migration content/readings/readings-concept-migration-v0.3.json `
  --out content/readings/readings-v0.2-linked.normalized.json `
  --report content/readings/CONCEPT-NORMALIZATION-REPORT-v0.3.md
```

## Condición de cierre

El comando debe terminar con:

```text
Normalized all 33 readings against 32 canonical Concepts.
```

y el reporte debe mostrar:

- 0 unresolved labels
- 0 invalid concept IDs
- 0 invalid reading connections

No reemplaces todavía `readings-v0.2-linked.json`; primero verificá ese reporte.
