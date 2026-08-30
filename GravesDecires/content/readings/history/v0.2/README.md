# READINGS → BOOK linkage v0.2

## Qué resuelve este paquete

`READINGS v0.2` había quedado correctamente sin `book_unit_id` inventados.
La fuente BOOK real está en el repositorio, en `data/book-model.json`, y el
modelo fue definido como inmutable.

Este paquete agrega una etapa determinística de vinculación:

1. `readings-v0.2.page-linked.json`
   - Los 33 Readings tienen ya localizadores BOOK por páginas PDF y anclas
     editoriales.
   - Es utilizable como metadata de trazabilidad, pero todavía no inventa IDs.

2. `readings-book-link-spec-v0.2.json`
   - Especificación de las 33 relaciones, con páginas, anclas y tipo de relación.

3. `resolve_readings_book_links.py`
   - Se ejecuta DENTRO del repo, contra el `data/book-model.json` canónico.
   - Escribe IDs reales de `BookUnit`.
   - No modifica BOOK.
   - Falla si una lectura no puede resolverse.

## Ubicación recomendada

```text
content/
└── readings/
    ├── READINGS-v0.2.md
    ├── readings-v0.2.json
    ├── readings-v0.2.page-linked.json
    ├── readings-book-link-spec-v0.2.json
    └── README.md

tools/
└── resolve_readings_book_links.py
```

## Comando

Desde la raíz del repo:

```bash
python tools/resolve_readings_book_links.py   --book data/book-model.json   --readings content/readings/readings-v0.2.json   --spec content/readings/readings-book-link-spec-v0.2.json   --out content/readings/readings-v0.2-linked.json   --report content/readings/BOOK-LINK-REPORT-v0.2.md
```

## Resultado esperado

- `content/readings/readings-v0.2-linked.json`
- `content/readings/BOOK-LINK-REPORT-v0.2.md`
- 33/33 Readings con `book_unit_link_status: resolved-exact-book-model`
- 0 escrituras sobre `data/book-model.json`

## Regla

No reemplazar `readings-v0.2.json` por el resultado enlazado hasta que el
reporte dé 33/33 y cero `UNRESOLVED`.
