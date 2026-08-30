# READINGS v0.3 — consolidación

> **Archivado (HISTORICAL).** Receta del proceso de consolidación v0.3, que ya
> se ejecutó. El reporte que generaba (`READINGS-v0.3-REPORT.md`) quedó
> archivado en `docs/web/provenance/READINGS-v0.3-REPORT.md`.

Esta etapa toma el archivo que ya validaste localmente:

`content/readings/readings-v0.2-linked.normalized.json`

y produce el nuevo archivo canónico:

`content/readings/readings-v0.3.json`

## Qué significa v0.3

No introduce nuevas interpretaciones.

Es la consolidación de:

- READINGS v0.2
- referencias exactas a BOOK
- `concept_ids[]` normalizados contra CONCEPTS v0.3
- `connections[]` con IDs canónicos
- `tags[]` para facetas no ontológicas

## Estructura final recomendada

```text
content/
├── concepts/
│   ├── CONCEPTS-v0.3.md
│   └── concepts-v0.3.json
│
└── readings/
    ├── README.md
    ├── READINGS-v0.2.md
    ├── readings-v0.3.json
    ├── READINGS-v0.3-REPORT.md
    │
    └── history/
        └── v0.2/
            ├── readings-v0.2.json
            ├── readings-v0.2.page-linked.json
            ├── readings-v0.2-linked.json
            ├── readings-v0.2-linked.normalized.json
            ├── readings-book-link-spec-v0.2.json
            ├── readings-concept-migration-v0.3.json
            ├── BOOK-LINK-REPORT-v0.2.md
            └── CONCEPT-NORMALIZATION-REPORT-v0.3.md

tools/
├── resolve_readings_book_links.py
├── normalize_readings_concepts.py
└── consolidate_readings_v03.py
```

`READINGS-v0.2.md` puede seguir siendo el documento humano de las fichas hasta que
hagamos una versión MD v0.3; el JSON canónico para consumo técnico pasa a ser
`readings-v0.3.json`.

## PowerShell

Primero copiá `consolidate_readings_v03.py` a `tools/`.

Luego:

```powershell
python tools/consolidate_readings_v03.py `
  --readings content/readings/readings-v0.2-linked.normalized.json `
  --concepts content/concepts/concepts-v0.3.json `
  --out content/readings/readings-v0.3.json `
  --report content/readings/READINGS-v0.3-REPORT.md `
  --history-dir content/readings/history/v0.2
```

Por defecto **copia** los intermedios al historial; no los borra de su ubicación
actual. Esto es intencionalmente conservador.

Cuando verifiques que el reporte dice `PASSED`, podés eliminar manualmente las
copias intermedias de `content/readings/` y dejar únicamente las del historial.

Si querés que el script las mueva automáticamente, podés agregar:

`--move-history`

pero recomiendo hacer el primer pase sin ese flag.

## Resultado esperado

```text
READINGS v0.3 consolidation PASSED.
Canonical output: content/readings/readings-v0.3.json
Report: content/readings/READINGS-v0.3-REPORT.md
```

Desde ese momento, `readings-v0.3.json` es la única versión de READINGS que
debería consumir la web y el futuro MASTER-MAP v0.2.
