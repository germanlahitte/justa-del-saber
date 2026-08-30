# Graves decires — Re-baseline editorial v0.1

**Fecha:** 2026-08-27
**Motivo:** el autor corrigió el DOCX original (y el PDF derivado) antes de
continuar con el prototipo. Este documento audita el impacto de esa
corrección sobre todo el pipeline técnico antes de tocar el frontend.
**Alcance:** regeneración y comparación de `data/book-model.json`,
`data/assets-manifest.json`, `data/page-model.json`; nueva entidad derivada
`data/source-references.json` (ver Adenda v0.2 al final de este documento);
nueva metadata `data/editorial/page-presentation.json` y
`data/editorial/book-index.json`. `CONCEPTS`, `READINGS` y `MASTER MAP`
**no se modificaron** — se verifica en §5 que sus referencias siguen siendo
válidas.

Todos los artefactos previos a la re-baseline quedaron respaldados en
`data/_pre-rebaseline-backup/` para trazabilidad histórica.

---

## 1. Diferencias del DOCX nuevo

Confirmadas explícitamente pedidas por el autor, verificadas
programáticamente:

1. **"La Síntesis" ahora tiene estilo `Heading2`** (antes no tenía ningún
   estilo — era texto plano). Confirmado en `data/docx-structure.txt`,
   párrafo 89.
2. **El QR de la unidad 3 que antes quedaba huérfano en una página visual
   posterior ahora está embebido dentro del propio párrafo de la letra de
   "La Síntesis"** (antes en un párrafo de imagen aparte, más adelante en
   el documento).
3. **Los versos "La libertad de todos" / "Lo soñamos ayer / Y lo cumplimos
   hoy" se reordenaron**: antes el título de sección aparecía *después*
   del epígrafe entre comillas; ahora aparece *antes* (unidad 39 del
   book-model). Mismas palabras exactas, solo orden de líneas.
4. **Una fusión de líneas de heading multilínea** contrajo el conteo total
   de párrafos del DOCX de **1451 a 1450** (un párrafo menos), lo cual
   desplazó en **-1** el `docx_paragraph_range` de 45 de las 47 unidades
   (efecto en cascada puramente posicional, no de contenido — ver §3).
5. **El total de palabras del documento no cambió**: 7854 en ambas
   versiones. No se agregó ni quitó texto, solo se reorganizó marcado de
   estilo y la posición interna de un embed de imagen.
6. **Los 55 assets embebidos son byte-idénticos** en ambas versiones
   (verificado por SHA-256, ver §4) — Word solo renumeró internamente los
   nombres de archivo (`imageN.png`) al re-guardar, que es un
   comportamiento normal y esperado de Word/Office al editar un documento
   con imágenes.

## 2. Diferencias del PDF nuevo

- **79 páginas** en ambas versiones (sin cambio de paginación general).
- **DOCX↔PDF: 99.99% de similitud palabra por palabra** en ambas versiones,
  con el mismo único caso trivial ya documentado en la Etapa 1 ("...publicaron
  8 discos de estudio" — posición del dígito, no afecta contenido).
- **El QR que antes aparecía en la página 9 (visual, sin texto) ahora
  aparece en la página 8**, junto al fragmento de "La Síntesis" — exactamente
  el comportamiento que el autor reportó como corregido.
- Página 9 ahora contiene únicamente la fotografía editorial que antes
  compartía espacio con ese QR.

## 3. Cambios en BookUnits

**47 unidades en ambas versiones — ninguna unidad se creó, eliminó ni
fusionó.** El diff unidad-por-unidad (`tools/diff_book_model.py`) da:

| Métrica | Resultado |
|---|---|
| Unidades idénticas | 2 |
| Unidades con `docx_paragraph_range` desplazado | 45 |
| Unidades con texto verbatim distinto (por palabra) | 0 exacto* |
| Unidades con headings distintos | 2 |
| Unidades con créditos de canción distintos | 0 |
| Unidades con identidad de assets distinta | 0 |

\* La unidad 39 aparece marcada con "texto diferente" en el diff automático
porque compara el string completo (que incluye saltos de línea), pero la
comparación palabra-por-palabra confirma que son exactamente las mismas 138
palabras, solo con 3 líneas finales reordenadas (§1.3).

**El desplazamiento de -1 en 45 unidades es enteramente atribuible a la
fusión de un heading multilínea** (§1.4) y no representa pérdida ni
alteración de contenido — es un corrimiento posicional en cascada, ya
verificado con integridad perfecta por `tools/verify_page_model.py` (ver §4).

**Cambios de contenido reales, ambos ya esperados y confirmados:**
- Unidad 3: ganó el heading "La Síntesis" en su lista de `headings`.
- Unidad 39: reordenó 3 líneas finales (mismo texto, mismas palabras).

## 4. Cambios en Page Model

Regenerado con `tools/build_page_model.py` sobre el DOCX/PDF nuevos.

- **79 páginas, igual que antes.**
- **Verificación de integridad: 1450/1450 párrafos, 0 mismatches**
  (`tools/verify_page_model.py`) — ninguna palabra perdida, duplicada o
  reordenada al derivar las páginas.
- **7 párrafos siguen cruzando dos páginas** (mismos ensayos en prosa que
  antes, unidades 11/28/45).
- **8 páginas visuales** (solo imagen/QR, sin texto): 9, 19, 25, 32, 38,
  40, 46, 76 — mismo conjunto que antes.
- **2 páginas en blanco**: 2 y 51 — mismo conjunto que antes, preservadas
  con su número, sin contenido inventado.
- **Cambio real de composición**: la página 8 ahora incluye el QR
  (`asset-image17`, mismo contenido que el `asset-image6` de antes) además
  del texto de "La Síntesis"; la página 9 pasó de tener 2 assets a 1.

## 5. Impacto en assets

Comparación **por contenido (SHA-256)**, no por nombre de archivo — porque
Word renumera internamente los `imageN.png` embebidos cada vez que el DOCX
se re-guarda (comportamiento normal, no un error editorial):

| Resultado | Cantidad |
|---|---|
| Assets sin cambios (mismo contenido, mismo nombre interno) | 3 |
| Assets renombrados internamente (mismo contenido, nombre interno distinto) | 52 |
| Assets eliminados | 0 |
| Assets nuevos | 0 |

**Los 55 assets originales son byte-idénticos entre versiones.** Ninguna
imagen ni QR fue sustituido, editado ni regenerado. Clasificación técnica
idéntica en ambas versiones: 43 QR + 12 imágenes editoriales.

### Hallazgo crítico de trazabilidad (corregido en esta etapa)

La capa `data/editorial/asset-context.json` (Etapa 1.5) usa `asset_id`
(derivado del nombre interno `imageN.png` vigente al momento de escribirla)
como clave de referencia. Como Word renombró 52 de los 55 archivos
internos al re-guardar, **los 11 registros editoriales de asset-context.json
quedaron apuntando a contenido incorrecto** si se los interpretara
literalmente contra el manifest nuevo (ej. `asset-image7` ya no es la
misma imagen que era en la Etapa 1.5).

**Esto se detectó y corrigió como parte de esta re-baseline**
(`tools/check_editorial_layer_impact.py` + `tools/build_song_references.py`):
cada referencia se re-resolvió por **identidad de contenido (SHA-256)**, no
por nombre de archivo. Las 11 decisiones editoriales originales (DEC-01 a
DEC-11) se re-mapearon correctamente sin pérdida de ninguna decisión.

**Una de las 11 decisiones quedó obsoleta, no incorrecta**: `DEC-05`
(el QR "huérfano" de la página 9 que el editor asoció manualmente a la
canción de la página 8 anterior) ya no es necesaria, porque el DOCX
corregido ubica ese mismo QR directamente en la página 8, donde el pipeline
técnico ya lo resuelve automáticamente ("Sección: La Síntesis"). Se marcó
`"status": "superseded-by-book-rebaseline"` en el registro, se conserva
como trazabilidad histórica, y se excluyó explícitamente del merge en
`tools/build_song_references.py`. Las otras 10 decisiones (DEC-01 a
DEC-04, DEC-06 a DEC-11) siguen siendo necesarias y se verificaron vigentes
contra el manifest nuevo.

## 6. Impacto en READINGS

**Verificado exhaustivamente — cero referencias inválidas.**

- Los 33 Readings de `readings-v0.3.json` referencian `book_refs[].book_unit`
  con números de unidad (1..47). **Ningún número de unidad cambió** (las
  unidades son las mismas 47, solo su `docx_paragraph_range` interno se
  desplazó -1). Por lo tanto **0 de 33 Readings quedaron con una referencia
  de `book_unit` inexistente**.
- Se verificó además, más profundamente, si la metadata de **evidencia**
  dentro de cada `book_refs[].evidence.docx_paragraph_range` seguía
  coincidiendo con el rango real de la unidad: **111 de esas referencias de
  evidencia** (en 39 unidades) quedaron desactualizadas por el mismo
  corrimiento de -1 ya explicado. Esto es metadata informativa dentro de
  `evidence` (no una clave de identidad), y su desactualización no invalida
  ningún Reading ni requiere volver a ejecutar el pipeline de resolución
  BOOK-linking — **no se tocó READINGS**, tal como indicaste, porque los
  identificadores de unidad permanecen válidos.
- Se verificó también `matched_anchors` (otro campo de evidencia): 24
  anchors no se encuentran textualmente dentro del texto exacto de su
  unidad referenciada. **Se confirmó que estos 24 casos ya existían
  idénticos en el book-model anterior a la re-baseline** — es decir, es un
  comportamiento preexistente del pipeline de vinculación original (Etapa
  READINGS v0.2→v0.3), no una regresión introducida por esta corrección.

**Conclusión: no fue necesario re-ejecutar `resolve_readings_book_links.py`
ni ningún otro paso del pipeline de READINGS.** Los identificadores que
READINGS usa como clave (`book_unit`, números enteros 1-47) permanecen
100% válidos. `CONCEPTS` y `MASTER MAP` no referencian `book_unit`
directamente (delegan esa trazabilidad a READINGS, por diseño ya
documentado en la Etapa 3), así que tampoco requieren cambios.

## 7. SongReferences resueltos / no resueltos

Nueva entidad derivada: **`data/song-references.json`**
(`tools/build_song_references.py`). Resuelve, para cada uno de los 43 QR
del libro: título, banda, disco, año, URL, asset del QR, y unidad(es)/página
donde aparece — combinando exclusivamente BOOK.song_credits,
ASSET.qr_value, EDITORIAL.song-credits y EDITORIAL.asset-context (re-mapeado
por contenido, §5). Ninguna metadata fue inventada.

| Resultado | Cantidad |
|---|---|
| QR totales | 43 |
| **Resueltos** (título+banda+disco+año+URL+página) | **41** |
| **No resueltos** | **2** |

**Los 2 no resueltos son legítimos, no un error**: los QR de las páginas 6
y 7 (V8/"La Estética" y Hermética/"La Ética") acompañan la *presentación de
la banda*, no una canción con crédito impreso — el libro no declara qué
canción son, así que no se les inventó una. (El QR de la página 8,
Almafuerte/"La Síntesis", sí resuelve correctamente vía el crédito
editorial DEC-12, porque para esa banda el editor sí proveyó un crédito.)

**1 canción con crédito pero sin QR encontrado**: "Memoria de siglos"
(Hermética) — la cita de esa canción en la unidad 12 ("Represión") no tiene
ningún QR asociado en el libro (solo dos fotografías). Es coherente con lo
ya reportado en la Etapa 1: esta canción sí tiene QR en otras apariciones
del libro (unidad 6, resuelto), pero no en esta.

Se corrigió además, durante la construcción de esta entidad, un caso de
desambiguación insuficiente: la unidad 20 tiene **tres** créditos de
canción impresos ("1999", "Sentir indiano", "Del más allá") con tres QR en
tres páginas físicas distintas (35, 36, 37) — la primera versión del
resolutor tomaba "el primer crédito de la unidad" para los tres, lo cual
era incorrecto. Se corrigió para desambiguar por **coincidencia de texto en
la misma página física exacta**, reutilizando `page-model.json`.

## 8. Propuesta de page-presentation.json

Creada en `data/editorial/page-presentation.json`, con la separación de
capas pedida:

```
BOOK             → contenido original (texto, headings, créditos)
PAGE MODEL       → distribución física real (qué cae en qué página)
PAGE PRESENTATION → decisión de qué layout usar para cada página
```

Layouts declarados:

| Layout | Uso |
|---|---|
| `default` | Composición estándar (la mayoría de las páginas) |
| `band-role` | Páginas 6, 7 y 8 — presentación de V8/Hermética/Almafuerte |
| `blank` | Inferido automáticamente desde `page-model.json.is_blank_or_folio_only` — no requiere declaración editorial |
| `visual-only` | Inferido automáticamente desde `page-model.json.is_visual_only` — no requiere declaración editorial |

Solo `band-role` requiere declaración editorial explícita (páginas 6, 7, 8)
porque es la única variante que no puede inferirse de `page-model.json` por
sí sola — depende de una decisión de curaduría, no de un hecho estructural
del PDF. `blank` y `visual-only` se infieren automáticamente del propio
Page Model, sin necesidad de listarlas acá.

Cada entrada de `band-role` declara: banda, `role_label` (el heading real
de BOOK, ej. "La Estética"), y si corresponde, la unidad de BOOK donde vive
la frase corta opcional (ej. "Loco, V8 ponganlé..." en la unidad 3, página
6). El archivo nunca duplica el texto en sí — solo apunta a dónde
encontrarlo.

---

## 9. Resumen ejecutivo

| Pregunta | Respuesta |
|---|---|
| ¿Se perdió o modificó contenido del libro? | No. 0 palabras perdidas, 0 agregadas, 55/55 assets byte-idénticos. |
| ¿Cambiaron los identificadores de BookUnit? | No, siguen siendo 1-47. Solo su rango de párrafo interno se desplazó -1 (efecto en cascada de un fix de heading). |
| ¿Se rompió algo en READINGS/CONCEPTS/MASTER MAP? | No. 0 referencias `book_unit` inválidas. Metadata de evidencia (no identidad) quedó desactualizada en 111 puntos, documentado, no requiere acción. |
| ¿Hubo que re-ejecutar el pipeline de resolución de READINGS? | No fue necesario — se verificó explícitamente antes de decidir esto. |
| ¿Se encontró algún bug real? | Sí: la capa EDITORIAL referenciaba assets por nombre de archivo interno inestable. Corregido con re-mapeo por SHA-256; ninguna decisión editorial se perdió. |
| ¿Quedó alguna decisión editorial obsoleta? | Sí, DEC-05 (ya no aplica porque el propio DOCX corrigió lo que esa decisión parcheaba) — marcada `superseded-by-book-rebaseline`, conservada como historial. |
| ¿Cuántos QR quedan sin resolver a una canción? | 2 de 43 (páginas 6 y 7 — presentación de banda sin canción, no un error). |

---

**Próximo paso** (pendiente de tu aprobación antes de ejecutar): actualizar
MODO LEER para consumir `page-model.json` regenerado, `song-references.json`
nuevo, y `page-presentation.json` nuevo — específicamente: índice
regenerado desde los headings reales (ya no necesita la excepción temporal
de "La Síntesis"), QR/SongReference siempre en el pie de página, layout
`band-role` para páginas 6-8, y páginas en blanco preservadas con indicación
exterior del lector (nunca dentro de la superficie de la página).

---

## Adenda v0.2 — Generalización a SourceReference, índice editorial y MODO LEER actualizado

**Fecha:** 2026-08-27 (misma jornada, segunda ronda de decisiones editoriales)

### A. SongReference generalizado a SourceReference

Se detectó que asumir "todo QR es una canción" era una hipótesis demasiado
estrecha: el QR de la página 7 remite a una **conferencia de prensa**, no a
una canción. Se migró el modelo:

- **Retirado**: `data/song-references.json` y `tools/build_song_references.py`.
- **Nuevo**: `data/source-references.json` (`tools/build_source_references.py`),
  con `source_ref.type` discriminado:
  `song | interview | press-conference | video | declaration | other`.
  - `type: "song"` conserva: `title`, `band`, `album`, `year`.
  - Tipos no musicales usan: `description`, `band`/`author`/`person`,
    `event`, `year`.
- **Verificado sin pérdida**: las 41 asociaciones de canción ya resueltas
  se migraron exactas (0 perdidas, 0 cambiadas) — comprobado comparando
  contra un snapshot del archivo anterior antes de retirarlo.

### B. Los 2 QR pendientes, resueltos (43/43)

Se agregaron `DEC-13` y `DEC-14` a `data/editorial/asset-context.json`,
direccionadas por **`asset_sha256`** en vez de `asset_id` (inmunes por
construcción al renombrado interno de Word en futuros re-guardados,
a diferencia de las decisiones legacy DEC-01..DEC-11):

| Página | QR (sha256 abreviado) | Resolución |
|---|---|---|
| 6 | `f6b80f77...` | `type: song` — "Brigadas Metálicas", V8, *Luchando por el metal*, 1983 |
| 7 | `6333311c...` | `type: press-conference` — "Conferencia de prensa de Hermética — Oberá Rock, 1993" |

Resultado: **43/43 QR del libro resueltos a una SourceReference**
(antes: 41/43). El único registro sin QR sigue siendo "Memoria de siglos"
(cita sin QR propio en esa aparición del libro — ya documentado, no es un
error).

### C. SourceReferenceFooter

`SongReferenceFooter.astro` fue reemplazado por `SourceReferenceFooter.astro`:
- Adapta el contenido mostrado según `source_ref.type` (línea principal +
  metadata secundaria + año, con las etiquetas correctas para canción vs.
  fuente no musical).
- El **bloque entero es un único `<a>` clickeable** (QR + texto), no solo
  el título — cumpliendo el pedido de que "el bloque completo debe ser
  clickeable además de conservar el QR original".
- Sigue viviendo siempre en el pie de página, alineado a la derecha, en
  ambos layouts (`default` y `band-role`).

### D. Índice combinado (BOOK + EDITORIAL)

Nuevo `data/editorial/book-index.json`: 6 etiquetas de navegación web
explícitas para tramos del libro sin heading visible (Dedicatorias p.3,
Prólogo p.4, tres ensayos p.20/47/70, Epílogo p.79). `src/lib/pageIndex.ts`
combina headings reales (`source: 'BOOK'`) con estas etiquetas
(`source: 'EDITORIAL'`), ordena por página, y **descarta la entrada
editorial si coincide en página con un heading real** (evita duplicados).
La UI distingue visualmente ambas fuentes (`SourceTag` + estilo itálico
para las etiquetas editoriales) tanto en el índice `/libro` como en el
header de cada página — nunca se presenta una etiqueta de navegación como
si fuera un título impreso en la obra.

### E. Deuda técnica documentada, no corregida

Nuevo documento `docs/web/TECH-DEBT-READINGS-EVIDENCE-v0.1.md`: registra
los 111 `evidence.docx_paragraph_range` desactualizados y los 24
`matched_anchors` preexistentes sin coincidencia textual (ambos ya
verificados como preexistentes a esta re-baseline, no regresiones). No se
tocó `readings-v0.3.json`.

### F. Verificación final

- `astro check`: 0 errores.
- `astro build`: 158 páginas generadas, sin errores.
- Escaneo automatizado de enlaces: **0 enlaces rotos** hacia la ruta
  retirada `/libro/[unit]`.
- Contenido verificado en páginas 6, 7, 8 (band-role + SourceReference),
  13 y 65 (2 QR por página), e índice `/libro` (6 etiquetas editoriales
  presentes).
- `CONCEPTS`, `READINGS`, `MASTER MAP`: confirmado sin modificaciones
  (timestamps de archivo anteriores a esta sesión).
