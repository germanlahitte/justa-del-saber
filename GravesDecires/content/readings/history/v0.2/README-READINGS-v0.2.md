# READINGS v0.2 — incorporación

## Ubicación

```text
content/
└── readings/
    ├── README.md
    ├── READINGS-v0.2.md
    └── readings-v0.2.json
```

## Qué cambia respecto de v0.1

v0.1 consolidaba 12 fichas seleccionadas. v0.2 reconstruye la capa desde el corpus completo de análisis de ambas mitades del libro y la organiza siguiendo el arco del Master Map.

La capa pasa a 33 Readings y cubre: arquitectura Estética/Ética/Síntesis; Enajenación/Individualismo; Represión; Domesticación; Destrucción del entramado social; Los Nadies; Desarrollo de la subjetividad; La libertad de todos; transmisión/emancipación; límite biográfico; trascendencia y epílogo.

## Regla de fuente única

`BOOK` sigue siendo la única fuente de verdad para letras, prosa autoral, epílogo, imágenes y secuencia editorial. READINGS no debe duplicar esas entidades.

## Regla de atribución

Distinguir siempre:

- formulación literal del corpus;
- interpretación surgida de la conversación analítica;
- tesis autoral ya presente en los ensayos del libro.

No atribuir a Iorio una fórmula creada por la capa interpretativa. En especial: “La forma más eficaz de represión…” y “Para ser vos no me necesitás a mí” son hipótesis del proyecto.

## Vinculación con BOOK

v0.2 usa referencias humanas de ámbito/página/título, pero deliberadamente no inventa `book_unit_id`. El siguiente paso técnico es resolver esos IDs contra `data/book-model.json` real y agregarlos a `book_refs` sin modificar BOOK.

## JSON

`readings-v0.2.json` es un índice estructural de las 33 fichas. El Markdown contiene el desarrollo editorial completo. El JSON está pensado para navegación, cards, filtros y relaciones de la web.
