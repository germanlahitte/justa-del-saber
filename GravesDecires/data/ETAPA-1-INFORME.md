# Etapa 1 — Ingesta, Inventario y Modelado

**Proyecto:** Graves decires... (web)
**Fecha:** 2026-08-26
**Fuentes analizadas:**
- `book/Graves decires de aguda intuición.docx` (fuente estructural)
- `book/Graves decires de aguda intuición.pdf` (referencia canónica, 79 páginas)

**Regla de trazabilidad aplicada:** todo lo listado aquí proviene de
SOURCE: BOOK o SOURCE: ASSET salvo indicación explícita. Las propuestas de
las secciones 9–11 son SOURCE: PROJECT-BRIEF + criterio técnico propio y no
tocan el contenido del libro.

---

## 1. Resumen de lo encontrado

- **Libro:** "Graves decires de aguda intuición". Metadato interno del PDF:
  `title: Ricardo y la libertad` (el título del borrador original — coincide
  con lo que el propio libro cuenta en su cierre, p. 79). Producido con
  Google Docs (Skia/PDF renderer).
- **79 páginas** en el PDF. **1452 párrafos** en el DOCX, segmentables en
  **47 unidades** por saltos de página explícitos.
- **55 assets embebidos** en el DOCX: **43 códigos QR** (todos decodificados)
  y **12 imágenes editoriales** (fotografías).
- **40 créditos de canciones** detectados con el patrón exacto del libro
  (título / álbum - año / banda): 8 de V8, 10 de Hermética, 22 de Almafuerte.
- **Estructura editorial:** dedicatoria → prólogo del autor → presentación de
  las tres bandas (Estética / Ética / Síntesis) → secciones temáticas con
  letras + QR + imágenes + tres ensayos en prosa del autor → cierre.
- **DOCX vs PDF: prácticamente idénticos** (similitud 99.99% a nivel palabra
  tras normalizar saltos de línea). **Una sola discrepancia real** (ver §5).

## 2. Estructura completa detectada del libro

Numeración de páginas según el PDF canónico.

| Págs. | Contenido |
|---|---|
| 1–2 | Portada: "Graves decires de aguda intuición" |
| 3 | Dedicatorias ("A Joni, que puso Almafuerte en mi walkman…"). Declaración de autoría: "La poesía es de Ricardo Iorio / La prosa es mía / Las imágenes no sé, están disponibles en internet." |
| 4–5 | Prólogo del autor (Germán Lahitte, junio 2024) |
| 6 | **La Estética** — V8 (cita "Loco, V8 ponganlé…", fragmento de letra, QR, reseña de la banda 1979-1987) |
| 7 | **La Ética** — Hermética (declaración de Iorio sobre documentar el presente, QR, reseña 1988-1994) |
| 8 | **La Síntesis** — Almafuerte (letra completa sin crédito visible en la página — es "Canto mi razón…", reseña 1995-2016) |
| 9 | Página visual: imagen editorial + QR (sin texto) |
| 10 | Epígrafe: "Mis años y la madrugada, anudan sueños por cumplir" |
| 11 | Yo traigo la semilla (Ultimando - 2003, Almafuerte) + QR |
| 12 | **Sección: Enajenación / Individualismo** + imagen editorial |
| 13 | Citas: Olvídalo y volverá por más (Hermética) y Memoria de Siglos (Hermética) + 2 QR |
| 14–15 | Otro día para ser (Víctimas del vaciamiento - 1994, Hermética) + QR |
| 16 | Siervos del Mal (Un paso más en la batalla - 1984, V8) + QR |
| 17 | Ciega ambición (El fin de los inicuos - 1986, V8) + QR |
| 18 | Por nacer (Del Entorno - 1996, Almafuerte) + QR |
| 19 | Página visual: imagen editorial (sin texto) |
| 20–23 | **Ensayo del autor** sobre la libertad ("Y sí. Viva…") — cierra con cita de J.B. Alberdi |
| 24 | **Sección: Represión** — cita Memoria de siglos + imagen editorial |
| 25 | Página visual: imagen editorial |
| 26 | Presa fácil (Del entorno - 1996, Almafuerte) + QR |
| 27–28 | Lucero del alba (Del Entorno - 1996, Almafuerte) + QR |
| 29 | Los delirios del defacto (Del entorno - 1996, Almafuerte) + QR |
| 30 | De un mañana bajo tierra (Piedra Libre - 2001, Almafuerte) + QR |
| 31 | **Sección: Domesticación** — "Están adorando un santo de madera" — cita Cautivos del sistema (V8) + QR |
| 32 | Página visual: imagen editorial |
| 33–34 | Ser humano junto a los míos (Almafuerte - 1998, Almafuerte) + QR |
| 35 | 1999 (Del Entorno - 1996, Almafuerte) + QR |
| 36 | Sentir indiano (Mundo Guanaco - 1995, Almafuerte) + QR |
| 37 | Del más allá (Almafuerte - 1998, Almafuerte) + QR |
| 38 | Página visual: imagen editorial |
| 39 | **Sección: Destrucción del entramado social** — "El Vaciamiento" — cita El fin de los inicuos (V8) + QR |
| 40 | Página visual: 2 imágenes editoriales |
| 41–42 | En las calles de Liniers (Ácido Argentino - 1991, Hermética) + QR |
| 43 | Gil Trabajador (Ácido Argentino - 1991, Hermética) + QR |
| 44 | Como estaba ahí Dios (Ultimando - 2003, Almafuerte) + QR |
| 45 | Hacia el abismo (Del entorno - 1996, Almafuerte) + QR |
| 46 | Página visual: imagen editorial |
| 47–50 | **Ensayo del autor** sobre comunidad y dirigencia — cierra con cita de J.D. Perón |
| 51 | Página en blanco (folio) |
| 52 | **Sección: Los Nadies** — "Sin poder esquivar el dolor ajeno" — Si me estás buscando (A fondo blanco - 1999, Almafuerte) + QR |
| 53 | El visitante (A fondo blanco - 1999, Almafuerte) + QR |
| 54 | Hospitalarias Realidades (Víctimas del vaciamiento - 1994, Hermética) + QR |
| 55–56 | Sirva otra vuelta, pulpero (Piedra Libre - 2001, Almafuerte) + QR |
| 57 | Amanecer en Open Door (Piedra Libre - 2001, Almafuerte) + QR |
| 58 | Regresando (Piedra libre - 2001, Almafuerte) + QR |
| 59 | **Sección: Desarrollo de la subjetividad / La libertad individual** — cita Camino al sepulcro (V8) + QR |
| 60 | Ideando la fuga (Un paso más en la batalla - 1984, V8) + QR |
| 61 | Tu eres su seguridad (Hermética - 1989, Hermética) + QR |
| 62 | Se vos (Almafuerte - 1998, Almafuerte) + QR |
| 63 | Antes que los Viejos Reyes (El fin de los inicuos - 1986, V8) + QR |
| 64 | **Sección: La libertad de todos** — "Lo soñamos ayer y lo cumplimos hoy" + imagen editorial |
| 65 | Citas: Ayer deseo, hoy realidad (Hermética) y Debes saberlo (Toro y Pampa - 2006, Almafuerte) + 2 QR |
| 66 | Hoy es (A fondo blanco - 1999, Almafuerte) + QR |
| 67 | Todo es en vano si no hay amor (Ultimando - 2003, Almafuerte) + QR |
| 68 | Orgullo argentino (Piedra libre - 2001, Almafuerte) + QR |
| 69 | Patria al hombro (Ultimando - 2003, Almafuerte) + QR |
| 70–75 | **Ensayo del autor** sobre redes sociales, subjetividad y libertad de pensamiento — cierra con cita de Julia Prilutzky Farny |
| 76 | Página visual: imagen editorial |
| 77 | Por ser yo (Piedra libre - 2001, Almafuerte) + QR |
| 78 | Cierre: "Si me ves volver, no me atiendas ni me abras la puerta…" + QR |
| 79 | Colofón: explicación de "Ricardo y la libertad" como borrador origen |

**Secciones temáticas detectadas (Heading2 del DOCX):**
1. La Estética / La Ética / La Síntesis (presentación de bandas)
2. Enajenación · Individualismo
3. Represión
4. Domesticación — "Están adorando un santo de madera"
5. Destrucción del entramado social — "El Vaciamiento"
6. Los Nadies — "Sin poder esquivar el dolor ajeno"
7. Desarrollo de la subjetividad · La libertad individual
8. La libertad de todos — "Lo soñamos ayer y lo cumplimos hoy"

**Tres ensayos en prosa del autor** (intercalados): libertad/democracia
(p. 20–23), comunidad/dirigencia (p. 47–50), redes/subjetividad (p. 70–75).
Cada uno cierra con una cita de autoridad (Alberdi, Perón, Prilutzky Farny).

## 3. Inventario de assets

- Total: **55** archivos extraídos byte a byte a `assets/docx-media/`
  (nombres originales `imageN.png|jpg` de `word/media/` conservados; SHA-256
  registrado en `data/extraction-log.json`).
- **43 QR** (PNG ~560–606 bytes, 148×148 px, todos decodificados).
- **12 imágenes editoriales** (JPG/PNG, fotografías de las bandas/artista).
- Los 55 assets fueron ubicados en su página del PDF por coincidencia
  perceptual (error medio ≤ 0.5 sobre 255 — coincidencia casi exacta; el
  match por hash directo falló porque Google Docs recomprimió al exportar).
- Manifest completo: `data/assets-manifest.json`.

Asociación asset → canción/sección:
- 24 verificadas por doble evidencia (anclaje DOCX + texto de página PDF).
- 17 con evidencia única (una de las dos).
- 3 a nivel sección (QR/imagen de apertura de sección).
- 4 NEEDS-REVIEW (páginas con dos créditos: ver §6).
- 7 UNKNOWN (imágenes/QR en páginas visuales sin texto: ver §6).

## 4. Inventario de códigos QR y destinos

Los 43 QR decodificaron correctamente (**estado: verified**). 42 apuntan a
`open.spotify.com/intl-es/track/...` y 1 a YouTube. Valores literales
completos en `data/assets-manifest.json` (campo `qr_value`). Resumen:

| Asset | Pág. PDF | Acompaña | Destino (literal, recortado) |
|---|---|---|---|
| image2.png | 6 | Sección La Estética (V8) | spotify …3JfieA8AhdSTGXHAAAr4Uy |
| image42.png | 7 | Sección La Ética (Hermética) | **youtube.com/watch?v=0xI8UhUaOO8&ab_channel=HELLROCK** |
| image6.png | 9 | UNKNOWN (página visual) | spotify …7DOGpaCNsjoo5jjZnkEMYH |
| image4.png | 11 | Yo traigo la semilla | spotify …6NVfU6IQuxPqH6hKtiSOMH |
| image7.png | 13 | NEEDS-REVIEW (2 citas en pág.) | spotify …305nzjHiIAnr1DmyZcRLRD |
| image17.png | 13 | NEEDS-REVIEW (2 citas en pág.) | spotify …174gCegpUjug5Z2yQ8ectM |
| image18.png | 15 | Otro día para ser | spotify …5VkftS3xixRBFbJjWzY2cf |
| image49.png | 16 | Siervos del Mal | spotify …2eYIlRr6RkpU85a9ncU4bK |
| image40.png | 17 | Ciega ambición | spotify …1vceYAVuScSsCQwvbkWT8j |
| image19.png | 18 | Por nacer | spotify …4X2nqt4Pu1lcmYYeuGBjkG |
| image37.png | 26 | Presa fácil | spotify …6wkSYibNvkulaL96eJGEyC |
| image20.png | 28 | Lucero del alba | spotify …2JiodPAAXzYPp3OV9oA1gT |
| image48.png | 29 | Los delirios del defacto | spotify …6BwNzZsnpmxFgezVbGWyRs |
| image44.png | 30 | De un mañana bajo tierra | spotify …5HS39PXqvK3YyKhPJb608Y |
| image54.png | 31 | Cautivos del sistema | spotify …5h6i3AEIuCowRyypsQx2Gq |
| image53.png | 34 | Ser humano junto a los míos | spotify …3svUZhKr5L1yfd55BqAgHc |
| image3.png | 35 | 1999 | spotify …6Qa3SYPRN4RpN7ORAjsgWQ |
| image33.png | 36 | Sentir indiano | spotify …0KNUb4xONAX9MaY6DdpUvn |
| image1.png | 37 | Del más allá | spotify …3JWXX7tlSPCoeRFOxcikhR |
| image27.png | 39 | El fin de los inicuos | spotify …6UXRmSINHZ0mEL2bknDKdN |
| image30.png | 42 | En las calles de Liniers | spotify …6Z8sv0vpi9I8yYanAJWz3v |
| image8.png | 43 | Gil Trabajador | spotify …3l7ihSOrFwIMBBDcMpfKVL |
| image15.png | 44 | Como estaba ahí Dios | spotify …1JmZcgj8z6qCOLWK9m673J |
| image21.png | 45 | Hacia el abismo | spotify …5im6eXJOOr6iDuWd3Y7flW |
| image43.png | 52 | Si me estás buscando | spotify …6xHgQwHoSm3JaaEmTKiT7v |
| image51.png | 53 | El visitante | spotify …0RmwVg25oTbhHs1gaIZNiw |
| image35.png | 54 | Hospitalarias Realidades | spotify …7MxQs6yYYMdlPctpF5WQGF |
| image12.png | 56 | Sirva otra vuelta, pulpero | spotify …6l3Ff4NbNkGdECrAQh9Se4 |
| image10.png | 57 | Amanecer en Open Door | spotify …3QFUkM0hMpUfvVumwwXXVE |
| image38.png | 58 | Regresando | spotify …2eRXQeH1NZkZyr1jdTQWle |
| image14.png | 59 | Camino al sepulcro | spotify …26qopSV1KsnVIl2FwjAcJS |
| image36.png | 60 | Ideando la fuga | spotify …402W9iALZu6LtOC6kc8hq4 |
| image11.png | 61 | Tu eres su seguridad | spotify …4DWvOeinTzhj4DeGYn9tqz |
| image22.png | 62 | Se vos | spotify …4MUhGA8YfsYDqD4NhTUtSf |
| image5.png | 63 | Antes que los Viejos Reyes | spotify …5dQ9nup0Lsc3Z5nQKK9PYd |
| image29.png | 65 | NEEDS-REVIEW (2 citas en pág.) | spotify …6woKpva7Uwdpxr3tqhHbhD |
| image13.png | 65 | NEEDS-REVIEW (2 citas en pág.) | spotify …0RK3rIJW884dpTq89P21NN |
| image26.png | 66 | Hoy es | spotify …1PiIgwH7hUH8CrCcpiekH7 |
| image46.png | 67 | Todo es en vano si no hay amor | spotify …5fFR6IEDb4VOQDAol4pR9G |
| image31.png | 68 | Orgullo argentino | spotify …0ArCOqIQ5rNIEg2YZYMUou |
| image34.png | 69 | Patria al hombro | spotify …4dhMxlB0xQXYafSN13NPft |
| image47.png | 77 | Por ser yo | spotify …7G17t7MKSuvlU7WsMT83YN |
| image41.png | 78 | UNKNOWN (cierre "Si me ves volver…") | spotify …0Ssu7J0wxOxbNyQn4LTnQe |

- Los 43 valores son únicos (sin QR duplicados).
- No se navegó a ninguna URL; los valores se registran literalmente.
- Estado global: **43 verified / 0 needs-review de decodificación / 0 unreadable**.
  (Las marcas NEEDS-REVIEW de la tabla refieren a la *asociación* con canción,
  no a la decodificación.)

## 5. Inconsistencias DOCX vs PDF

Tras normalizar saltos de línea suaves (artefactos de exportación, no
diferencias de contenido), la similitud a nivel palabra es **99.99%** con
**una única discrepancia real**:

1. **SOURCE-CONFLICT (menor) — resuelto a favor del PDF:** el fragmento
   "…y publicaron 8 discos de estudio" (reseña de Almafuerte, unidad de
   La Síntesis) aparece en el PDF (p. 8) pero el dígito "8" se ubica en una
   posición de texto distinta en el flujo del DOCX. Verificado contra la
   página 8 del PDF: el texto completo con el "8" está presente. Es un
   artefacto de orden de extracción, no una diferencia editorial. **No
   requiere acción.**

2. **Observación (no es conflicto):** el metadato `title` interno del PDF es
   "Ricardo y la libertad" (nombre del borrador), no el título final del
   libro. Coherente con la historia contada en la p. 79.

3. **Observación:** el título de la unidad "La Síntesis" en el DOCX no tiene
   estilo Heading2 (a diferencia de "La Estética" y "La Ética"); en el PDF
   aparece visualmente como título equivalente. Es una inconsistencia de
   estilos del DOCX, no de contenido.

## 6. Elementos que requieren revisión manual (NEEDS-REVIEW / UNKNOWN)

**Asociación QR ↔ canción ambigua (páginas con dos citas):**
- p. 13: `image7.png` y `image17.png` — la página contiene las citas de
  "Olvídalo y volverá por más" y "Memoria de Siglos". Cada QR corresponde a
  una, pero decidir cuál es cuál requiere confirmación visual (o tuya).
- p. 65: `image29.png` y `image13.png` — ídem con "Ayer deseo, hoy realidad"
  y "Debes saberlo". Por el orden de anclaje en el DOCX, `image29` acompaña
  a "Ayer deseo, hoy realidad" e `image13` a "Debes saberlo", pero lo marco
  para tu confirmación.

**Assets en páginas visuales sin texto (contexto no verificable
técnicamente):**
- p. 9: `image39.png` (foto) + `image6.png` (QR) — página visual previa al
  epígrafe "Mis años y la madrugada…". El QR decodifica a un track de
  Spotify; a qué canción corresponde requiere tu confirmación.
- p. 19, 25, 32, 38, 40 (×2), 46, 76: imágenes editoriales a página completa
  (`image32.jpg`, `image55.jpg`, `image16.jpg`, `image52.jpg`, `image23.jpg`,
  `image9.jpg`, `image25.jpg`, `image28.jpg`). Son fotografías; identificar
  qué/a quién muestran es una decisión editorial que no infiero.
- p. 78: `image41.png` (QR del cierre "Si me ves volver…") — decodifica
  correctamente; la canción a la que refiere queda a tu confirmación.

**Nota:** la unidad "La Síntesis" (p. 8) transcribe una letra completa
("Canto mi razón para que quien quiera, guarde…") sin bloque de crédito
en esa página. No lo completé: queda como fragmento sin crédito explícito
en el modelo (UNKNOWN).

## 7. Manifest generado

`data/assets-manifest.json` — 55 entradas con: id interno, archivo extraído,
ruta original dentro del DOCX, SHA-256 del original, tipo, formato,
dimensiones, página PDF (método perceptual), párrafo de anclaje DOCX,
elemento al que acompaña + estado y método de asociación, y para QR: valor
literal decodificado, método de decodificación y estado `verified`.

Archivos de soporte:
- `data/extraction-log.json` — log de extracción con hashes.
- `data/asset-classification.json` — clasificación técnica.
- `data/image-match.json` — matching perceptual asset↔página.
- `data/pdf-map.json`, `data/pdf-outline.txt` — mapa del PDF.
- `data/docx-structure.txt` — volcado estructural del DOCX.
- `data/docx-pdf-diff.txt` — diff de texto DOCX↔PDF.

## 8. Modelo estructurado del libro

`data/book-model.json` — 47 unidades secuenciales (segmentadas por saltos de
página explícitos del DOCX), cada una con:
- `docx_paragraph_range` (trazabilidad a la fuente estructural);
- `pdf_pages_via_assets` (trazabilidad a la referencia canónica);
- `headings` (títulos con estilo);
- `song_credits` (título/álbum/año/banda detectados con el patrón exacto);
- `assets` (QR e imágenes con su id del manifest);
- `text_verbatim` (texto copiado sin ninguna edición).

Distinción de tipos de contenido en el modelo: encabezado de sección,
letra/fragmento con crédito, declaración/cita, prosa del autor (ensayos),
imagen, QR. Nada fue reescrito; el modelo es un índice estructural sobre el
texto literal.

`data/book-model-index.json` — índice compacto: 40 canciones + capítulos.

---

*Las secciones que siguen son propuestas (SOURCE: PROJECT-BRIEF + análisis
técnico). No modifican nada del libro y quedan sujetas a tu aprobación.*

## 9. Propuesta de arquitectura de información

La estructura real del material sugiere seis entidades navegables, con una
séptima (Períodos) implícita:

```
LIBRO (obra cerrada)
 └─ 47 unidades / 8 secciones temáticas / 79 páginas espejo del PDF

BANDAS (3): V8 → Estética | Hermética → Ética | Almafuerte → Síntesis

CANCIONES (40 con crédito + citas menores)
 └─ tarjeta: título, banda, disco, año, fragmento, QR original

CONCEPTOS (capa futura; semillas ya presentes en los títulos de sección:
 enajenación, represión, domesticación, vaciamiento, los nadies,
 libertad individual, libertad de todos)

LECTURAS (capa futura: claves de lectura breves por canción)

ENSAYOS
 ├─ del libro (3, SOURCE: BOOK — ya existentes)
 └─ de la web (futuros, SOURCE: FUTURE-ANALYSIS)
```

Rutas de entrada propuestas:
- **/libro** — lectura secuencial fiel (unidad a unidad, con la página PDF
  como referencia visible). Es el "modo obra cerrada".
- **/bandas/{v8|hermetica|almafuerte}** — presentación Estética/Ética/Síntesis
  + canciones de esa banda en el libro.
- **/canciones** — grid de tarjetas (anverso: datos + fragmento; reverso:
  conceptos y enlaces — el reverso queda vacío hasta la capa interpretativa).
- **/conceptos** — red navegable (vacía al inicio, crece con la capa nueva).
- **/lecturas** y **/ensayos** — capa interpretativa futura, siempre
  etiquetada como tal.

Decisión editorial pendiente (no la tomo yo): si las secciones temáticas del
libro (Enajenación, Represión, …) deben ser también "conceptos" navegables o
mantenerse solo como estructura del libro. Ambas opciones son coherentes;
la primera reutiliza la semántica ya presente, la segunda separa más
estrictamente obra y lectura.

## 10. Propuesta de modelo de datos

Entidades con `source` obligatorio (`BOOK | ASSET | PROJECT-BRIEF |
FUTURE-ANALYSIS`) en cada registro:

```
Band        { id, name, period, stance }            // stance: estética/ética/síntesis (SOURCE: BOOK)
Album       { id, bandId, title, year }
Song        { id, bandId, albumId, title, year }
Fragment    { id, songId?, bookUnitId, textVerbatim, kind }
            // kind: lyric-full | lyric-quote | statement | prose | epigraph
Asset       { id, file, sha256, type, pdfPage, qrValue?, verification }
BookUnit    { id, order, sectionId?, pdfPages[], docxParagraphRange, headings[] }
BookSection { id, title, subtitle?, order }
Essay       { id, scope: book|web, bookUnitIds?|body, source }
Concept     { id, name, definition, source: FUTURE-ANALYSIS }
Reading     { id, targetType: song|fragment|unit, targetId, body, source }
Link        { id, fromType, fromId, toType, toId, relation, source }
```

Claves del diseño:
- **El libro es inmutable:** `BookUnit`, `Fragment`, `Asset`, los 3 `Essay`
  del libro y `BookSection` se generan una sola vez desde las fuentes y no se
  editan. La capa nueva (`Concept`, `Reading`, `Essay` web, `Link`) solo
  **apunta hacia** ellos, nunca los modifica.
- **Relaciones N:M vía `Link`:** una canción ↔ varios conceptos; un concepto
  atraviesa bandas y períodos; un ensayo web enlaza fragmentos de distintas
  unidades. Todo con `source` y `relation` explícitos.
- **Trazabilidad doble:** cada fragmento conserva rango de párrafos DOCX y
  página(s) PDF.
- Formato propuesto: contenido del libro como JSON generado (ya existe:
  `book-model.json`), capa interpretativa como Markdown/MDX con frontmatter
  (crece sin tocar lo anterior).

## 11. Recomendación técnica preliminar

- **Astro** (sitio estático con islas interactivas): el contenido es
  esencialmente editorial y estable; Astro rinde HTML puro con excelente
  tipografía/legibilidad y permite islas (flipping cards, red de conceptos)
  solo donde hagan falta. Content Collections tipadas encajan directo con el
  modelo de datos propuesto (JSON del libro + MD/MDX de la capa nueva).
- Alternativa si preferís ecosistema React completo: **Next.js 15 SSG**.
  Tradeoff: más peso de runtime para un sitio mayormente estático.
- **Sin base de datos** en esta fase: los datos caben en archivos versionados
  en Git, lo que además da trazabilidad e historial editorial gratis.
- Los QR de la web deben ser **las imágenes originales extraídas** (nunca
  regenerados); los enlaces textuales, si se agregan, usan el `qr_value`
  literal del manifest.
- La visualización de la red de conceptos puede resolverse más adelante
  (isla con D3/vis ligera); no condiciona la elección de framework.
- Tipografía y estética: pendiente para la etapa de diseño (según brief:
  editorial, sobria, contemplativa; sin clichés metaleros).

---

**Fin de la etapa 1.** No se implementó interfaz, no se generó contenido
interpretativo, no se modificó ningún contenido original. Esperando
aprobación para continuar.
