# Graves decires — Prototipo visual v0.2 (corrección de MODO LEER)

**Etapa:** 3 (corrección) — modelo de paginación real, no implementación
completa
**Fecha:** 2026-08-27
**Alcance:** exclusivamente MODO LEER. El resto de la web (mapa, conceptos,
lecturas) no se tocó salvo lo estrictamente necesario para que siga
compilando.
**Estado:** `BOOK`, `ASSET`, `EDITORIAL`, `CONCEPTS`, `READINGS`, `MASTER
MAP` permanecen exactamente iguales. Se agregó un artefacto nuevo,
derivado y de solo lectura: `data/page-model.json`.

> **Nota de vigencia (2026-08-27, misma jornada):** el DOCX/PDF fue
> corregido por el autor después de este documento (re-baseline completa en
> `docs/web/BOOK-REBASELINE-v0.1.md`), y luego se generalizó el modelo de
> QR de "canción" a **SourceReference** tipado (§ Adenda v0.2 de ese mismo
> documento). El modelo de página (§1-§8 de este documento) sigue vigente
> sin cambios; lo que cambió es la fuente de datos que alimenta al pie de
> página (ahora `data/source-references.json`, no `data/song-references.json`)
> y el índice de `/libro` (ahora combina headings reales con etiquetas
> editoriales de `data/editorial/book-index.json`). Ver la Adenda v0.2 para
> el detalle completo de esos cambios.

---

## 0. Qué estaba mal y por qué

La v0.1 trataba `BookUnit` como si fuera "una página". Eso es
estructuralmente incorrecto: `BookUnit` es una unidad *técnica* de
trazabilidad, delimitada por los **saltos de página manuales** que el
DOCX original tiene en puntos editoriales (inicio de sección, inicio de
canción). El **PDF final**, en cambio, tiene la paginación *real* del
libro: 79 páginas físicas, producidas por Google Docs al exportar, que
reflowea automáticamente el texto de una `BookUnit` en cuanto no entra en
una sola hoja.

Prueba concreta: la `BookUnit 3` (presentación de las tres bandas — "La
Estética" / "La Ética" / "La Síntesis") ocupa **tres páginas físicas
distintas** del PDF (6, 7 y 9 — la 8 pertenece también a la unidad 3, y la
9 es una página puramente visual). La v0.1 mostraba esto como "unidad 38"
o "unidad 3", una sola pantalla — rompiendo por completo la sensación de
recorrer un libro paginado.

---

## 1. Modelo técnico `Page` — cómo se construyó

### 1.1 Fuente de verdad de la paginación

Por instrucción explícita: **el PDF es la referencia de composición**, el
DOCX aporta el contenido con fidelidad total, y `book-model.json` aporta
trazabilidad. El nuevo script `tools/build_page_model.py` combina los
tres:

1. Reconstruye el flujo completo de palabras del DOCX (idéntico al usado
   en `tools/compare_docx_pdf.py`, que ya había probado 99.99% de
   coincidencia palabra-por-palabra entre DOCX y PDF en la Etapa 1).
2. Reconstruye el flujo completo de palabras del PDF, página por página
   (79 páginas), descartando los folios (números de página sueltos).
3. Alinea ambos flujos con `difflib.SequenceMatcher` (la misma técnica ya
   verificada) para saber, palabra por palabra, **en qué página física
   cae cada palabra del DOCX**.
4. Para cada párrafo del DOCX, esto permite saber si sus palabras caen
   todas en una página o se reparten entre dos — y en ese caso, el punto
   exacto de corte (nunca aproximado, nunca redondeado a "el párrafo
   entero pasa a la página siguiente").
5. Las imágenes/QR se ubican por la **coincidencia perceptual verificada
   en la Etapa 1** (`assets-manifest.json[].pdf_page`), independiente de
   la alineación de palabras — un asset no tiene texto que alinear.
6. Se agregó además `asset_placements[]`: la posición del asset dentro del
   flujo de párrafos del DOCX (índice de párrafo), para poder intercalar
   imagen y texto en el orden real del documento, no agrupar "primero todo
   el texto, después todas las imágenes".

Salida: `data/page-model.json` — 79 entradas `Page`, cada una con sus
bloques de texto (con el slice verbatim exacto), sus `book_units`
presentes, y sus assets.

### 1.2 Verificación de fidelidad (no es una afirmación, es una prueba)

Se escribió `tools/verify_page_model.py`, que reconstruye —concatenando
en orden todos los `text_verbatim_slice` de cada párrafo a través de las
79 páginas— la secuencia de palabras completa de cada uno de los **1451
párrafos** del DOCX, y la compara palabra por palabra contra el DOCX
original.

```
paragraphs checked: 1451
mismatches: 0
VERIFICATION PASSED: every DOCX paragraph word sequence is reproduced
exactly across the derived pages (no loss, no duplication, no reordering).
```

Es decir: **no se perdió, duplicó ni reordenó ni una sola palabra** al
partir el libro en páginas. Esto es una garantía verificable, no una
promesa.

### 1.3 Casos límite encontrados y cómo se resolvieron

- **7 párrafos cruzan una página** (todos dentro de los 3 ensayos en
  prosa del autor — unidades 11, 28 y 45; es esperable que la prosa larga
  sea la que más desborda una hoja). En todos los casos el corte cae
  exactamente en un límite de palabra real, sin frases partidas a la
  mitad de forma artificial ni texto repetido en ambas páginas.
- **1 bloque de alineación no resuelto automáticamente**: es exactamente
  el mismo caso trivial ya documentado en la Etapa 1 ("...publicaron 8
  discos de estudio" — una diferencia de posición del dígito "8" que no
  afecta el contenido). Se resuelve heredando la página del vecino más
  cercano, sin inventar ubicación.
- **8 páginas "solo visuales"** (sin ningún bloque de texto, solo
  imagen/QR): páginas 9, 19, 25, 32, 38, 40, 46, 76 — coinciden
  exactamente con las páginas fotográficas ya identificadas en la Etapa 1
  (los mismos assets que resolvimos editorialmente en la Etapa 1.5,
  DEC-06 a DEC-11).
- **2 páginas en blanco** (páginas 2 y 51) — folios sin contenido,
  también ya documentados en la Etapa 1.

---

## 2. Relación Page ↔ BookUnit

```
Page (1..79, real, del PDF)
  └─ blocks[] → cada bloque de texto apunta a UN BookUnit (book_unit)
  └─ assets[] → cada asset apunta a su Asset original (ASSET)

BookUnit (1..47, técnico, trazabilidad)
  └─ puede aparecer en 1 o más Page (ej. BookUnit 3 → páginas 6, 7, 8, 9)
```

`BookUnit` **no desaparece**: sigue siendo la clave de trazabilidad hacia
`READINGS` (`book_refs[].book_unit`) y hacia `book-model.json`. Lo que
cambió es su rol en la interfaz: **ya no es una ruta navegable ni una
"página de lectura"** — es metadata interna que cada bloque de una `Page`
lleva consigo para poder resolver, en el momento de renderizar esa página,
qué Readings corresponden a qué fragmento.

Una página puede (y de hecho ocurre en el corpus real):
- pertenecer enteramente a una sola `BookUnit` (caso más común);
- ser el punto de transición entre dos `BookUnit` (ej. el final de la
  presentación de bandas y el inicio del epígrafe siguiente);
- no tener ninguna `BookUnit` con texto, solo un asset (páginas visuales).

---

## 3. Fragmentos que cruzan páginas: cómo se resuelven

Cuando un párrafo se parte entre la página N y N+1:

- La página N recibe el bloque con `continues_on_next_page: true` y el
  texto verbatim exacto **hasta la palabra donde el PDF realmente corta**.
- La página N+1 recibe el resto, con `continues_from_previous_page: true`.
- **No se repite texto en ambas páginas.** No se resume ni se indica "..."
  — se corta exactamente donde el libro impreso corta, porque eso es
  literalmente lo que la fuente de verdad (el PDF) hace.
- No se inserta ningún indicador visual de "continúa en la página
  siguiente" en la interfaz todavía — se consideró, pero se decidió no
  agregar texto de sistema que el libro mismo no tiene; queda como
  candidato a validar en la revisión (ver §6).

---

## 4. Trazabilidad: Page → BookUnit(s) → Reading(s)

Corregido exactamente como se pidió. Cadena real de resolución en
`/libro/p/[n].astro`:

```
Page.book_units[]           (derivado de page-model.json)
  → para cada BookUnit, se buscan los Readings cuyo
    book_refs[].book_unit === esa unidad
  → se arma un Map<book_unit, ReadingSummary[]>
  → PageView renderiza el trigger de trazabilidad AGRUPADO POR UNIDAD,
    no uno solo para toda la página
```

Si una página tiene fragmentos de dos `BookUnit` distintas con Readings
distintos, aparecen **dos controles separados** (uno por cada unidad con
Reading), en vez de un único botón genérico "hay una lectura en esta
página". Esto preserva exactamente la granularidad pedida: *"si en una
misma página existen varios fragmentos con Readings distintos, la UI debe
conservar esa granularidad"*.

El principio de MODO LEER sigue intacto y sin relajarse: el servidor sabe
en build-time qué Readings existen para cada unidad de cada página (para
decidir si mostrar el botón), pero el **contenido** de esos Readings
(thesis, concepts, connections) no se monta en el DOM hasta que el lector
hace clic — mismo mecanismo `ReadingDrawer` de la v0.1, ahora invocado una
vez por unidad presente en la página en vez de una vez por página.

---

## 5. Qué se implementó

### Rutas

| Antes (v0.1, incorrecto) | Ahora (v0.2) |
|---|---|
| `/libro/[unit]` (~47 "artículos") | `/libro/p/[n]` (79 páginas reales) |
| índice → abre una unidad aislada | índice → entra a la página donde empieza esa sección, sigue leyendo de corrido |

`/libro` (índice) ahora lista los **títulos reales** del libro (estilo
`Title`/`Heading1`/`Heading2` del DOCX) con la página donde cada uno
empieza — no una lista de 47 filas técnicas. Se señala explícitamente la
inconsistencia ya documentada en la Etapa 1: "La Síntesis" (p. 8) no tiene
estilo de título en el DOCX (a diferencia de "La Estética" y "La Ética"),
así que no aparece en el índice — se reporta la inconsistencia en pantalla
en vez de inventarle un estilo que la fuente no tiene.

### Navegación continua

`PageNav` (isla React): "← Página anterior", indicador `N / 79`, "Página
siguiente →", más:
- flechas de teclado (← →),
- **swipe en mobile** (deslizar izquierda = siguiente, derecha = anterior),
- barra fija (`sticky bottom-0`) para que la navegación esté siempre
  accesible sin scrollear hasta el final.

### Composición fiel dentro de la página

`PageView` intercala texto e imagen/QR **en el orden real del documento**
(usando `asset_placements[].docx_paragraph_index`), no agrupados por tipo.
Los títulos (`Title`/`Heading1`/`Heading2`) se renderizan con jerarquía
tipográfica distinta al cuerpo. Las páginas puramente visuales muestran
solo su asset, sin texto de relleno inventado.

### Prueba concreta del tramo pedido

Se probó explícitamente el tramo páginas 6→9 (inicio de sección
"La Estética" con QR → "La Ética" con QR → "La Síntesis" sin asset propio
pero con Reading real → página 9 puramente visual con dos assets) y el
tramo de la unidad "Sé vos", que en la paginación real cae en **página
física 62** (no "unidad 38" como en la v0.1) — con su QR real, 4 Readings
reales en el drawer, y navegación anterior (61) / siguiente (63) correcta.

---

## 6. Diferencias que quedan respecto del PDF original (documentadas, no ocultas)

- **Tipografía y layout no son pixel-perfect** respecto del PDF (columnas,
  interlineado exacto, posición absoluta de imágenes en la hoja). Esto es
  explícitamente aceptado por vos: *"No necesito una réplica pixel-perfect
  del DOCX. Sí necesito que al recorrer el sitio pueda reconocer el libro
  que diseñé."* — se priorizó el orden, la secuencia y el contenido
  exacto sobre el layout milimétrico.
- **Sin indicador visual de "el fragmento continúa"** en los 7 casos de
  párrafo partido — decisión deliberada de no agregar texto de sistema
  que el libro no tiene, pendiente de tu validación (¿lo agregamos o no?).
- **El índice usa el estilo tipográfico del DOCX para decidir qué es un
  título** — por eso "La Síntesis" queda fuera, honestamente, en vez de
  ser adivinada.
- **Las páginas en blanco (2, 51)** se muestran con una nota discreta
  ("página sin contenido de texto o imagen en el original") en vez de
  saltearse silenciosamente de la navegación secuencial — preserva la
  sensación real de "esta página del libro estaba vacía", que también es
  parte de la composición original.

---

## 7. Estado de las otras superficies (no tocadas más de lo necesario)

`/mapa`, `/mapa/[arc]`, `/conceptos`, `/conceptos/[concept]`, `/lecturas`,
`/lecturas/[reading]` siguen exactamente como en v0.1 — no se generalizó
ni se rediseñó nada ahí. Se verificó que siguen compilando (0 errores en
`astro check`, build completo sin fallos, 158 páginas generadas).

---

## 8. Verificación técnica

```
astro check   → 0 errors
astro build   → 158 páginas generadas, sin errores
tools/verify_page_model.py → 1451/1451 párrafos, 0 mismatches
```

Servidor de desarrollo disponible en `http://localhost:4321` para revisión
en vivo (`cd web && npx astro dev --background`, detener con
`npx astro dev stop`).

---

## 9. Preguntas para tu revisión

1. ¿El corte de los 7 párrafos multi-página necesita algún indicador
   visual ("continúa →"), o preferís que quede silencioso como está?
2. ¿Las páginas en blanco (2, 51) deberían mostrarse igual dentro de la
   navegación secuencial (como ahora) o saltearse automáticamente al
   navegar con anterior/siguiente?
3. ¿El índice de `/libro` (solo títulos con estilo real) es suficiente, o
   necesitás además una vista de "todas las páginas" para saltar a un
   número de página directamente?
4. ¿Aprobás generalizar ahora este modelo de página al resto de la
   navegación (Reading → apunta a página física en vez de a BookUnit en
   los links de "ir al libro" desde Concept/Arc/Reading), o preferís
   iterar primero sobre estas preguntas?

No continué hacia una generalización completa ni toqué las demás
superficies. Quedo a la espera de tu revisión.
