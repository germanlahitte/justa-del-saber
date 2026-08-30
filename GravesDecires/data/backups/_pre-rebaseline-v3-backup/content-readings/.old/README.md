# READINGS v0.1 — incorporación

## Ubicación

Incorporar esta carpeta completa en:

```text
content/
└── readings/
    ├── README.md
    ├── READINGS-v0.1.md
    └── readings-v0.1.json
```

## Función de la capa READINGS

`READINGS` es una capa interpretativa derivada del corpus. Contiene lecturas construidas a partir de relaciones entre letras, textos autorales, estructura del libro, epílogo y Concepts.

No es una segunda copia del libro ni una colección de los ensayos originales.

## Regla de fuente única

`BOOK` es la única fuente de verdad para el contenido original de *Graves decires de aguda intuición*.

Esto incluye, entre otros:

- los textos originales del autor;
- las letras y fragmentos seleccionados en el libro;
- el epílogo;
- la estructura y secuencia editorial de la obra.

Por lo tanto, ningún contenido ya perteneciente a `BOOK` debe duplicarse en `READINGS`, `CONCEPTS` ni en futuras capas analíticas. Cuando una lectura dependa de un texto del libro, deberá **referenciar la unidad BOOK correspondiente**, no reproducirla como una nueva entidad editorial.

## Qué sí pertenece a READINGS

Un Reading registra contenido interpretativo nuevo: una hipótesis de lectura, una relación transversal, una observación sobre una formulación puntual o una interpretación de la arquitectura general del libro.

Puede tomar como objeto una letra, un texto autoral, el epílogo o varios elementos simultáneamente. Su valor está en explicitar relaciones que el corpus permite construir pero que el libro no necesariamente desarrolla de manera directa.

Ejemplos de esta versión son `Saber heredar`, `Represión sin represor` y las lecturas sobre la arquitectura estética–ética–síntesis.

## Relaciones

Esta versión contiene 12 fichas interpretativas consolidadas.

- `concept_ids` referencia la ontología `concepts-v0.2`.
- `connections` enlaza Readings entre sí y permite construir navegación relacional en etapas posteriores.
- `source` identifica actualmente el objeto inmediato de lectura cuando corresponde.

### Próxima mejora estructural

Antes de considerar estabilizado el modelo de READINGS, conviene incorporar referencias explícitas a las entidades o unidades `BOOK` que fundamentan cada Reading. Esa relación debe implementarse mediante identificadores, sin copiar el contenido original dentro de esta capa.

## Límites editoriales

- No modificar `BOOK`, `ASSET` ni `EDITORIAL` desde esta capa.
- No atribuir a Iorio hipótesis que pertenecen a la lectura crítica salvo que exista fundamento explícito para hacerlo.
- Preservar lecturas múltiples cuando el texto admita más de una interpretación razonable.
- No crear una capa `Essays` para duplicar los textos autorales que ya forman parte de `BOOK`.
- Si en el futuro se escriben ensayos nuevos específicamente para la web o para otra publicación, podrán constituir una capa nueva; no deben confundirse con los textos originales del libro.

## Estado

`READINGS v0.1` debe considerarse una primera consolidación del contenido interpretativo. El contenido de las 12 fichas se conserva; la siguiente revisión estructural debería centrarse en su enlace formal con `BOOK`.
