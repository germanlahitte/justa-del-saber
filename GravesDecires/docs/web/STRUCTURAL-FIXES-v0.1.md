# Graves decires — Correcciones estructurales v0.1

**Fecha:** 2026-08-27
**Alcance:** tres correcciones sistémicas detectadas antes de iniciar la
revisión estética página por página. No se avanzó con dirección visual
general. `CONCEPTS`, `READINGS`, `MASTER MAP` no se modificaron.

Todos los artefactos previos a estas correcciones quedaron respaldados en
`data/_pre-heading-fix-backup/`.

---

## 1. Índice — headings multilínea

### Causa exacta

El DOCX no representa un título visualmente multilínea con **un solo
párrafo con saltos de línea internos** (`<w:br/>`). Word, al ajustar un
título largo a varias líneas, lo divide en **varios `<w:p>` separados**,
cada uno con el mismo estilo (`Heading1`, `Heading2` o `Title`) — confirmado
inspeccionando el XML crudo de los 8 casos reales del corpus (portada,
"Mis años…", "Enajenación/Individualismo", "Domesticación + epígrafe",
"Destrucción del entramado social + 'El Vaciamiento'", "Los Nadies +
epígrafe", "Desarrollo de la subjetividad / La libertad individual", "La
libertad de todos + epígrafe", "Si me ves volver…").

`src/lib/pageIndex.ts` recorría cada bloque con estilo heading y generaba
**una entrada de índice por párrafo DOCX**, sin agrupar los que eran
fragmentos de un mismo título. Por eso "Mis años" / "y la madrugada," /
"anudan sueños por cumplir" aparecían como tres filas del índice en vez
de una.

### Por qué la corrección es en `pageIndex.ts` y no en `book-index.json`

Se evaluó y descartó resolverlo con excepciones manuales porque:
1. No es una decisión editorial — es un hecho estructural del DOCX
   (Word parte títulos largos en múltiples párrafos, siempre con el mismo
   patrón).
2. `book-index.json` es la capa de *etiquetas de navegación agregadas*
   (Dedicatorias, Prólogo, ensayos, Epílogo) — no debe usarse para parchear
   una fragmentación que la fuente estructural (`page-model.json`) ya
   permite resolver con una regla objetiva.

### Regla implementada (determinística, sin heurísticas frágiles)

> Bloques con estilo heading, **consecutivos por índice de párrafo DOCX**
> (sin ningún otro párrafo intermedio), que caen en la **misma página
> física**, son un único heading semántico.

Verificado contra los 8 casos reales: en todos, los fragmentos son
consecutivos y comparten página. La regla no depende de balance de
comillas, capitalización, ni ninguna otra heurística textual — usa
únicamente la estructura ya presente en `page-model.json`
(`docx_paragraph_index` + `page`), coherente con la cadena
DOCX → book-model → page-model → pageIndex.ts → `/libro`.

### Archivo modificado

`web/src/lib/pageIndex.ts` — nueva función `mergeHeadingRuns()`.

### Verificación

- "Mis años y la madrugada, anudan sueños por cumplir" → 1 entrada (antes: 3).
- "Enajenación Individualismo" → 1 entrada (antes: 2).
- "La libertad de todos "Lo soñamos ayer Y lo cumplimos hoy"" → 1 entrada
  (antes: 3).
- ""Si me ves volver, no me atiendas ni me abras la puerta. Loco,
  solitario y enredado, no soy yo"" → 1 entrada (antes: 6).
- Headings que son secciones genuinamente distintas en páginas distintas
  (ej. "La Estética" p.6 / "La Ética" p.7 / "La Síntesis" p.8) **no se
  fusionan**, porque no comparten página — la regla los distingue
  correctamente.

---

## 2. Créditos duplicados de SourceReference

### Causa exacta

`SourceReferenceFooter` ya mostraba título/disco/año/banda en el pie de
página, pero `PageView` seguía renderizando **todos** los bloques de texto
de la página en el cuerpo — incluidos los párrafos que en el libro impreso
son exactamente el bloque de crédito (ej. "Amanecer en Open Door" / "Piedra
Libre - 2001" / "Almafuerte"). Resultado: el mismo dato aparecía dos veces
en la página.

### Por qué no se resolvió con coincidencia textual genérica

Se descartó deliberadamente "ocultar cualquier párrafo cuyo texto coincida
con el título/banda/año del SourceReference" porque:
1. No es determinístico — un título de canción puede además aparecer como
   verso dentro de la letra (confirmado: "Amanecer en Open Door." aparece
   una vez como verso en el cuerpo de la canción y otra vez, con el patrón
   exacto título/álbum-año/banda, como crédito real — solo la segunda debe
   suprimirse).
2. No está vinculado a una posición real del documento — sería una
   coincidencia de casualidad, no trazabilidad.

### Solución determinística implementada

Se extendió `detect_credit()` en `tools/build_book_model.py` para que,
además del título/álbum-año/banda ya detectados, registre el
**rango exacto de párrafos DOCX** (`credit_paragraph_range`) que ese
bloque de crédito impreso ocupa — usando la misma lógica que ya localizaba
el patrón (título → álbum-año → banda), no una búsqueda nueva.

`tools/build_source_references.py` propaga ese rango exacto hacia el
`SourceReference` correspondiente (por igualdad exacta de
`title+band+album+year`, nunca por proximidad textual difusa) — incluyendo
los 4 casos EDITORIAL (DEC-01 a DEC-04) que también tienen un crédito
impreso real en el libro (solo estaban ambiguos entre dos canciones en la
misma página, no huérfanos).

En el frontend, `PageView.astro` calcula qué párrafos de la página caen
dentro de algún `credit_paragraph_range` de un `SourceReference`
efectivamente presente en esa página, y los excluye únicamente del
render del cuerpo — **el dato sigue existiendo íntegro en
`book-model.json`/`page-model.json`** para trazabilidad; solo se evita
duplicar su representación visual.

### Archivos modificados

- `tools/build_book_model.py` — `credit_paragraph_range` agregado a cada
  `song_credits[]`.
- `tools/build_source_references.py` — propaga el rango exacto al
  `source_ref` de tipo `song`.
- `web/src/content.config.ts` — schema actualizado (`book_model.units[].song_credits[].credit_paragraph_range`,
  `sourceReferences[].source_ref.credit_paragraph_range`).
- `web/src/components/PageView.astro` — nueva función `isSuppressed()`.

### Verificación

- Página 57 ("Amanecer en Open Door"): el verso legítimo ("Amanecer en
  Open Door." dentro de la letra) permanece en el cuerpo; el bloque de
  crédito ("Amanecer en Open Door" / "Piedra Libre - 2001" / "Almafuerte")
  ya no aparece como párrafo del cuerpo, solo en el pie.
- Páginas 6/7/8 (band-role): no tienen crédito impreso real, por lo tanto
  `credit_paragraph_range: null` — nada se suprime ahí (correcto, no había
  nada que duplicar).

---

## 3. Preservación de versos y saltos de línea

### Causa exacta

`tools/build_page_model.py` reconstruía el texto de cada bloque con
`' '.join(words)` sobre una lista de *palabras* tokenizadas con `\S+`
(que trata cualquier whitespace, incluido `\n`, como separador de
palabra). Al reunir con un simple espacio, **se perdía la distinción
entre "espacio entre palabras" y "salto de línea entre versos"** — la
letra completa de una estrofa se aplanaba a una sola línea de prosa.

Este bug es anterior a la re-baseline: viene de la primera implementación
del modelo de página (Etapa 3, corrección de MODO LEER), y afecta
**18 páginas** en todo el libro (no solo 6/7/8): 6, 15, 16, 17, 27, 28, 36,
41, 42, 44, 45, 52, 53, 55, 56, 60, 63, 66 — todas las páginas cuyos
párrafos tienen saltos de línea internos (versos).

### Regla aplicada

> PDF = fuente de verdad para PAGINACIÓN (qué porción de texto cae en qué
> página física).
> DOCX = fuente de verdad para ESTRUCTURA INTERNA DEL TEXTO (saltos de
> verso, saltos manuales, párrafos).

### Solución implementada

Se reemplazó la tokenización por palabras + rejoin por **tokenización con
offsets de carácter** (`tokenize_with_offsets()`): cada palabra conserva su
posición exacta (inicio, fin) dentro del texto **original** del párrafo
(con sus `\n` reales). La alineación palabra-por-palabra contra el PDF
sigue decidiendo **qué rango de palabras** cae en cada página (eso es
correcto: el PDF decide la paginación), pero el texto final de cada bloque
se obtiene con `p['text'][char_start:char_end]` — un **substring literal
del párrafo original**, nunca una reconstrucción por join. Esto preserva
cualquier `\n` que quede dentro del rango, exactamente como está escrito en
el DOCX.

En el frontend, se agregó la clase CSS `whitespace-pre-line` a los
párrafos de cuerpo (`PageView.astro` y `BandRoleLayout.astro`) — sin esto,
el navegador colapsa igualmente cualquier `\n` a un espacio por defecto en
un elemento `<p>`.

### Archivos modificados

- `tools/build_page_model.py` — `normalize_for_alignment()` (normalización
  1:1 carácter-a-carácter, ya no genera una lista de palabras separada del
  texto original) + `tokenize_with_offsets()` + slicing por offset en vez
  de `' '.join()`.
- `tools/verify_page_model.py` — actualizado para comparar normalizado en
  ambos lados (la verificación de identidad de palabras sigue siendo
  válida; el texto almacenado ahora preserva los glifos y saltos
  originales, que es justamente lo que se quería lograr).
- `tools/verify_verbatim_glyphs.py` (nuevo) — verificación adicional más
  estricta: byte-identidad completa (no solo identidad de palabras) para
  todo párrafo que cae íntegro en una sola página.
- `web/src/components/PageView.astro`, `web/src/components/BandRoleLayout.astro`
  — `whitespace-pre-line` agregado a los párrafos de cuerpo.

### Verificación

- `tools/verify_page_model.py`: **1450/1450 párrafos, 0 mismatches**
  (identidad de palabras, como antes).
- `tools/verify_verbatim_glyphs.py` (nueva verificación, más estricta):
  **752/752 párrafos de una sola página, byte-identidad exacta** con el
  DOCX original (glifos reales, saltos de línea reales preservados).
- Confirmado visualmente: página 6 ahora muestra "Basta ya de signos de la
  paz" / "Basta de cargar con el morral" / "Si estás cansado de llorar" /
  "Este es el momento de gritar" como 4 versos, no como una prosa corrida.
- Las 18 páginas afectadas verificadas: todas tienen `whitespace-pre-line`
  aplicado correctamente.

---

## Verificación técnica final

```
astro check   → 0 errors
astro build   → 158 páginas generadas, sin errores
```

## Entregable

`docs/web/PAGE-REVIEW-v0.1.md` — 79 secciones (una por página física), con
metadata factual precompletada (heading/sección + fuente BOOK/EDITORIAL,
layout, SourceReferences presentes) y campo de observaciones vacío para tu
revisión manual. Ninguna crítica estética fue generada.

---

**No se avanzó con dirección visual general.** Quedo a la espera de tu
revisión de `PAGE-REVIEW-v0.1.md`.
