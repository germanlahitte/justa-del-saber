# Graves decires — Arquitectura de experiencia web v0.1

**Etapa:** 3 — Diseño de experiencia (no implementación)
**Fecha:** 2026-08-27
**Estado:** propuesta para aprobación. Ningún archivo de BOOK, ASSET,
EDITORIAL, CONCEPTS, READINGS o MASTER MAP fue modificado para producir
este documento.

---

## A. Inventario de fuentes

### A.1 Mapa real de archivos canónicos

El repositorio no coincide 100% con las rutas hipotéticas del enunciado,
pero cada responsabilidad tiene un archivo canónico localizable y
verificado. Resumen por capa:

| Capa | Archivo canónico | Rol | Estado |
|---|---|---|---|
| **BOOK** | `data/book-model.json` | 47 `BookUnit` verbatim, texto íntegro, rangos de párrafo DOCX y páginas PDF | inmutable, generado en Etapa 1 |
| **BOOK (índice)** | `data/book-model-index.json` | Índice compacto de 40 canciones + 8 secciones detectadas | derivado de BOOK, solo lectura |
| **ASSET** | `data/assets-manifest.json` | 55 assets (43 QR + 12 fotos), con `pdf_page`, `qr_value`, estado de asociación técnica | inmutable, generado en Etapa 1 |
| **ASSET (binario)** | `assets/docx-media/*` | Los 55 archivos originales extraídos byte a byte del DOCX | inmutable |
| **EDITORIAL** | `data/editorial/song-credits.json` | 1 registro: crédito editorial del fragmento de "La Síntesis" (p.8) | cerrado en Etapa 1.5 |
| **EDITORIAL** | `data/editorial/asset-context.json` | 11 registros: resolución de QR ambiguos + contexto descriptivo de fotos | cerrado en Etapa 1.5 |
| **CONCEPTS** | `content/concepts/concepts-v0.3.json` | 32 `Concept` canónicos + 6 `structural_relations` | canónico vigente |
| **CONCEPTS (legible)** | `content/concepts/CONCEPTS-v0.3.md` | Misma información en prosa | espejo de lectura humana |
| **READINGS** | `content/readings/readings-v0.3.json` | 33 `Reading` consolidados, con `book_refs[]`, `concept_ids[]`, `connections[]`, `tags[]` | canónico vigente, reporte `PASSED` |
| **MASTER MAP** | `content/maps/master-map-v0.2.json` | 9 arcos, 8 hipótesis estructurales (`H-01`..`H-08`), meta-eje de bandas, estructura terminal | canónico vigente, reporte `PASSED` |
| **MASTER MAP (legible)** | `content/maps/MASTER-MAP-v0.2.md` | Misma información en prosa | espejo de lectura humana |

Todo lo demás en `content/**/history/`, `content/**/.old/`,
`docs/audits/`, `docs/migrations/` es **trazabilidad histórica**: documenta
cómo se llegó a v0.3/v0.2, pero no debe alimentar la web. Lo confirmé
leyendo los propios README de cada carpeta (`content/readings/README.md`,
`docs/web/history/README-READINGS-v0.3.md`, `docs/web/history/README-MASTER-MAP-v0.2.md`), que declaran
explícitamente cuál es el artefacto de consumo y cuáles son intermedios.

No encontré ningún `content/essays/*` todavía (carpeta vacía) ni ningún
`src/`/`package.json`/scaffolding de framework: la Etapa 3 arranca sin
deuda técnica de implementación previa.

### A.2 Relaciones reales verificadas entre capas

Antes de diseñar nada, verifiqué programáticamente (lectura, sin
escritura) que las capas efectivamente resuelven entre sí:

- **READINGS → BOOK**: los 33 Readings tienen `book_refs[].book_unit`
  apuntando a unidades reales de `book-model.json` (40 de las 47 unidades
  del libro están referenciadas por al menos un Reading; `book_unit_link_status:
  "resolved-exact-book-model"` en el 100% de los casos). Las 7 unidades sin
  Reading son mayormente páginas visuales o de transición ya identificadas
  en la Etapa 1 (p. ej. unidades puramente de imagen).
- **READINGS → CONCEPTS**: 133 referencias `concept_ids[]`, todas contra
  IDs existentes en `concepts-v0.3.json` (0 inválidas, según
  `CONCEPT-NORMALIZATION-REPORT-v0.3.md` y
  `docs/web/provenance/NORMALIZATION-VERIFICATION-v0.3.json`, ambos `PASSED`).
- **READINGS → READINGS**: 109 `connections[]` entre IDs `reading-*`, 0
  inválidas.
- **MASTER MAP → CONCEPTS**: los 9 arcos referencian `concept_ids[]`
  existentes; 0 huérfanos (`docs/web/provenance/MASTER-MAP-v0.2-REPORT.md`, `PASSED`).
- **MASTER MAP → READINGS**: los 9 arcos referencian `reading_ids[]`
  existentes; 0 huérfanos.
- **MASTER MAP → BOOK**: no referencia BOOK directamente — por diseño
  (ver `depends_on` en `master-map-v0.2.json`), delega esa trazabilidad a
  READINGS. Esto es correcto y coherente con la regla "Master Map no
  duplica ni reinterpreta BOOK".
- **ASSET/EDITORIAL → BOOK**: cada `asset-context` y `song-credit`
  referencia `asset_id`/`book_unit_id` reales (verificado en la Etapa 1.5
  con `tools/verify_editorial_layer.py`, 12/12 decisiones cubiertas).

**Conclusión: la cadena `BOOK ← EDITORIAL`, `BOOK ← READINGS →
CONCEPTS`, `CONCEPTS/READINGS ← MASTER MAP` resuelve end-to-end sin
huecos ni referencias rotas.** Esto es inusualmente sólido para una etapa
de diseño y simplifica mucho la arquitectura de datos de la web: **no hace
falta joinear nada a mano en el frontend**, los propios JSON ya son el
grafo.

### A.3 Inconsistencias / advertencias que sí afectan la UI

1. **Cobertura desigual de Readings por arco.** El arco 6 ("La libertad de
   todos") tiene solo 2 Readings propios (uno compartido con el arco 5). Si
   la UI de arco muestra "cantidad de lecturas" como señal de profundidad,
   este arco se va a ver más liviano — no es un error de datos, es honesto
   reflejarlo, no rellenarlo.
2. **`kind` de Reading es heterogéneo y no está en MASTER MAP.**
   `readings-v0.3.json` tiene 7 valores de `kind` (`structural-reading`,
   `arc-reading`, `transversal-reading`, `close-reading`,
   `essay-linked-reading`, `closing-reading`, `book-structure-reading`) que
   no aparecen en el contrato de MASTER MAP. Son útiles para decidir *cómo*
   presentar cada Reading (ver §E), pero hoy solo existen dentro de
   `readings-v0.3.json` — la UI debe leerlos de ahí, no inferirlos de nuevo.
3. **`tags[]` es una capa "sub-conceptual" sin ontología propia.** 14 tags
   (`empatía`, `obediencia`, `cuidado`, etc.) aparecen en 21 de 33 Readings
   pero no tienen entidad propia ni relaciones — son señales de faceta, no
   nodos navegables de igual jerarquía que un Concept. Recomiendo tratarlos
   como **metadata de color/filtro secundario**, nunca como si fueran
   Concepts.
4. **`connections[]` en Reading no lleva calificador de relación
   (`RelationKind`)** — a diferencia de lo que propusimos en Etapa 1.5 para
   `ReadingTarget.relation`. En v0.3 las conexiones son simétricas y sin
   tipo ("A se conecta con B"), no direccionadas ni calificadas. La UI no
   debe inventar un tipo de relación (resonance/contrast/etc.) que el dato
   no tiene: se muestra como "lecturas relacionadas", sin calificarla.
5. **`section` de Reading vs `title`/`headings` de BookSection no son el
   mismo vocabulario 1:1.** Ej.: Reading section "Amor, transmisión y
   emancipación" no es un título literal de sección del libro — es una
   agrupación editorial de READINGS. Esto es exactamente la separación
   BookSection/Concept que fijamos en Etapa 1.5, y se sostiene: `section`
   de un Reading **no debe presentarse como si fuera BookSection**.
6. **El meta-eje de bandas vive en dos lugares con distinta granularidad**:
   `master-map-v0.2.json.band_meta_axis` (una frase por banda) y
   `book-model-index.json` / `book-model.json` (la reseña completa,
   verbatim, de cada banda tal como aparece en el libro, p. 6-8). Son
   complementarios, no duplicados: uno es BOOK, el otro es lectura del
   mapa. La UI debe dejar claro cuál es cuál (ver §6 del enunciado: "no
   afirma que V8 sea *solamente* estética").
7. **Ningún Reading referencia unidades 1, 4, 5, 10, 17, 21, 46** (7 de 47).
   Revisé qué son: unidad 1 (portada), 4 (epígrafe corto "Mis años y la
   madrugada..."), 5 (dedicatoria/dedication), 10 (epígrafe), 17 y 21 (letra
   sin Reading propio todavía — cubiertas indirectamente por Readings de
   unidades vecinas de la misma sección), 46 (imagen visual sin texto). No
   es un error: son extremos legítimos de "la lectura no cubre el 100% del
   libro todavía", coherente con "no completar huecos por inferencia".

Ninguna de estas siete observaciones requiere tocar contenido: son notas
para que el diseño de UI no dé por sentado más estructura de la que el
dato realmente tiene.

---

## B. Modelo de experiencia

### B.1 Los dos modos como estados de una misma sesión, no como sitios distintos

LEER y EXPLORAR no son dos aplicaciones. Son dos **modos de foco** sobre el
mismo grafo de datos, con una regla de transición explícita:

- **MODO LEER**: la unidad de atención es el `BookUnit`. Todo lo demás
  (Readings, Concepts) queda oculto por defecto, disponible solo bajo
  demanda mediante un gesto explícito y reversible.
- **MODO EXPLORAR**: la unidad de atención es el `Concept`, el `Reading` o
  el `Arc`. El libro aparece como **destino de trazabilidad**, nunca como
  contenedor visual dominante.

La transición entre modos ocurre en **un solo punto de contacto
consistente**: cada fragmento del libro que tiene al menos un Reading
asociado (`book_refs[].book_unit`) expone un control discreto — no un
overlay permanente, no un ícono repetido cada dos líneas — que dice, en
esencia, "hay una lectura sobre esto". Activarlo abre EXPLORAR con
contexto (ver §F). Desde cualquier nodo de EXPLORAR (Concept, Reading,
Arc), volver al libro siempre aterriza en el `BookUnit` exacto de origen,
nunca en la portada ni en un índice genérico — eso es lo que llamamos
"regreso al contexto original" y depende pura y simplemente de que
`book_refs[].book_unit` sea un entero real (ya lo es, verificado en A.2).

### B.2 Jerarquía de la información

```
Nivel 0 — Portal (Home)
Nivel 1 — Modo (Libro | Mapa)
Nivel 2 — Unidad de foco (BookUnit | Arc | Concept | Reading | Band)
Nivel 3 — Detalle (fragmento / QR / canción | Reading completo / Concept completo)
Nivel 4 — Cruce (Reading↔BookUnit, Concept↔Reading, Reading↔Reading)
```

Ningún nivel obliga a pasar por el nivel anterior en orden estricto salvo
Nivel 0→1. A partir de ahí la navegación es una red, no un árbol: por eso
el sitemap (§C) lista superficies, no una jerarquía de carpetas.

### B.3 Puntos de entrada

Derivados directamente de lo que el dato permite resolver sin inventar
nada (`navigation_entry_points` de `master-map-v0.2.json` ya declara
`by_concept`, `by_reading`, `by_book_unit`, `by_arc`, `by_band_meta_axis` —
coincide con el pedido del enunciado):

1. **Por el libro** (`/libro`) → lectura secuencial.
2. **Por banda** (`/bandas/{v8|hermetica|almafuerte}`) → reseña BOOK
   verbatim + canciones de esa banda + rol en el meta-eje (marcado como
   lectura, no como BOOK).
3. **Por canción** (`/canciones`) → 40 canciones, filtrable por banda/año.
4. **Por concepto** (`/conceptos`) → 32 Concepts, red de relaciones.
5. **Por arco** (`/mapa`) → 9 arcos del Master Map.
6. **Por lectura** (`/lecturas`) → 33 Readings, filtrables por sección,
   tag, o concepto.

No hay una entrada "por ensayo" independiente porque los 3 ensayos del
autor **son BookUnits** (unidades 2, 28, 45) — no necesitan ruta propia,
aparecen dentro de `/libro` como cualquier otra unidad, y algunos Readings
ya los referencian (`essay-linked-reading`, 2 casos).

### B.4 Regla de no invasión (principio §9 del enunciado)

Ningún componente de MODO LEER carga contenido de READINGS por defecto.
Esto es una restricción de **datos en el momento de render**, no solo de
estilo visual: la página de una `BookUnit` en modo lectura no debe ni
siquiera hacer fetch de Readings hasta que el usuario active el control de
trazabilidad. Así se preserva de verdad el principio "la poesía tiene que
poder ser leída sola", y no solo visualmente sino también en términos de
qué se le presenta primero a la atención del lector.

---

## C. Sitemap

No es una lista de páginas; cada nivel tiene una función distinta.

```
/                              → Portal. Elegir LEER o EXPLORAR. No es un
                                  índice de contenidos, es una decisión de modo.

/libro                         → Índice secuencial de las 47 unidades (tabla
                                  de contenido real del libro: dedicatoria,
                                  prólogo, 8 secciones, 3 ensayos, epílogo).
                                  Función: preservar el recorrido tal como
                                  fue impreso.

/libro/[unit]                  → Una BookUnit. Texto verbatim, imagen(es),
                                  QR con qr_value original, canción(es)
                                  asociada(s). Control discreto de
                                  trazabilidad hacia Readings si existen.
                                  Función: leer sin interferencia.

/bandas                        → Las tres bandas + meta-eje (marcado
                                  explícitamente como lectura del libro, no
                                  como taxonomía cerrada).
                                  Función: entrada temática por banda/época.

/bandas/[band]                 → Reseña BOOK verbatim de la banda + lista de
                                  canciones de esa banda con link a su
                                  BookUnit.
                                  Función: recorte editorial por banda.

/canciones                     → Grid/lista de 40 canciones. Filtro por
                                  banda, álbum, año.
                                  Función: acceso lateral, no lineal, al
                                  corpus lírico.

/canciones/[song]               → Fragmento(s) de esa canción (BOOK), QR
                                  original, y — si existe — el/los Reading
                                  que la referencian.
                                  Función: unidad mínima de cruce entre BOOK
                                  y READINGS.

/mapa                          → Vista general de los 9 arcos + estructura
                                  terminal + meta-eje. Es la puerta principal
                                  de EXPLORAR.
                                  Función: dar una imagen del recorrido
                                  intelectual completo antes de entrar en
                                  el detalle.

/mapa/[arc]                    → Un arco: pregunta, claim, Concepts
                                  involucrados, Readings involucrados, en
                                  orden.
                                  Función: recorrido guiado temático.

/conceptos                     → Los 32 Concepts como red navegable (ver §G
                                  para la representación visual del mapa
                                  general; esta vista es más ligera / lista +
                                  filtro).
                                  Función: entrada por vocabulario, no por
                                  narrativa.

/conceptos/[concept]           → Definición, distinciones, relaciones
                                  tipadas (`opposes`, `requires`, etc.),
                                  Readings que lo usan, arcos donde aparece.
                                  Función: nodo de vocabulario canónico.

/lecturas                      → Los 33 Readings, filtrables por sección,
                                  tag, concepto, o arco.
                                  Función: capa analítica completa, para
                                  quien quiere leer "todo el análisis"
                                  seguido.

/lecturas/[reading]            → Un Reading completo: thesis, BookUnits
                                  referenciadas (con extracto/anchor, no el
                                  fragmento completo salvo que el usuario lo
                                  pida), Concepts, Readings conectados.
                                  Función: unidad mínima de interpretación,
                                  siempre trazable hacia BOOK.
```

No propongo `/ensayos` como ruta de primer nivel: los ensayos del autor
viven en `/libro` (son BOOK) y no existe todavía ningún Essay de la web
(`content/essays/` vacío). Cuando aparezca contenido en `content/essays/`,
la ruta natural es `/ensayos` como quinta entrada de EXPLORAR — pero
crearla vacía hoy sería exponer una sección sin contenido real.

---

## D. Modelo de navegación — user flows representativos

### Flow 1 — Lectura pura, sin analítica

```
HOME → elijo "Leer"
  → /libro (tabla de contenido: dedicatoria, prólogo, La Estética/Ética/
    Síntesis, 8 secciones, epílogo)
  → /libro/6 (sección "Los Nadies", unidad con "Si me estás buscando")
  → sigo leyendo linealmente (siguiente/anterior unidad)
  → llego a /libro/47 (epílogo)
FIN — nunca pasé por READINGS ni CONCEPTS.
```

### Flow 2 — De un fragmento a la interpretación y de vuelta (núcleo de F)

```
HOME → "Leer" → /libro/38 (unidad "Se vos")
  → veo el control discreto "hay una lectura sobre esto"
  → lo activo → panel muestra reading-se-vos (thesis + concept_ids)
  → dentro del panel, toco concept-autonomia
  → /conceptos/concept-autonomia (definición + relaciones + "aparece en 4 Readings")
  → elijo otro Reading que usa concept-autonomia: reading-integridad
  → dentro de reading-integridad veo su book_refs → unidad 39
  → "ir al libro" → /libro/39
FIN — terminé en una unidad distinta de donde empecé, sin perder nunca de
vista que estaba "en el libro" o "en la lectura".
```

### Flow 3 — Desde el mapa hacia el libro

```
HOME → "Explorar" → /mapa
  → veo los 9 arcos como recorrido longitudinal (ver G)
  → elijo arco 7 "Herencia, transmisión y emancipación"
  → /mapa/arc-07-transmision (pregunta, claim, concept_ids, reading_ids en orden)
  → abro reading-saber-heredar
  → veo sus book_refs → unidad correspondiente a "Orgullo argentino"
  → "ir al libro" → /libro/[unit] con el fragmento verbatim
FIN — llegué al libro habiendo entrado por una pregunta conceptual, no por
el índice.
```

### Flow 4 — Desde una canción

```
HOME → "Leer" → /canciones → filtro banda=Hermética
  → /canciones/en-las-calles-de-liniers
  → veo el fragmento (BOOK), el QR original (ASSET, con qr_value real de
    Spotify), y si existe, el Reading que la usa
  → si no hay Reading directo, veo "esta canción no tiene lectura propia
    todavía" (estado honesto, no vacío disfrazado de contenido)
FIN
```

### Flow 5 — Desde el cierre del libro (arquitectura del final, §7)

```
HOME → "Leer" → recorro linealmente hasta /libro/38 ("Se vos")
  → sigo hasta /libro/47 (epílogo — "Por ser yo", "Si me ves volver",
    cierre "Ricardo y la libertad")
  → activo trazabilidad → veo 4 Readings encadenados por `connections[]`:
    reading-se-vos-por-ser-yo → reading-nuevamente →
    reading-si-me-ves-volver → reading-epilogo-demostracion
  → los recorro en ese orden (la propia `terminal_structure.sequence` del
    Master Map ya define ese orden — la UI no inventa la secuencia, la lee)
FIN — el usuario puede descubrir el movimiento "represor→domesticación /
emancipador→emancipación" siguiendo conexiones reales entre Readings, sin
que la web se lo explique de entrada. Si nunca activa la trazabilidad, el
libro igual termina en un cierre poéticamente completo por sí mismo.
```

Este quinto flow es la prueba de aceptación más exigente del criterio de
éxito del enunciado (§14): el dato (`terminal_structure`) ya modela
exactamente el recorrido que pedís, sin que la web tenga que narrarlo con
texto nuevo.

---

## E. Componentes de experiencia

Nombrados por función, no como contrato final de código.

| Componente | Representa | Consume | Se relaciona con |
|---|---|---|---|
| **BookUnitView** | Una unidad del libro en su disposición original (texto, imagen, QR) | `book-model.json[unit]` | Asset, SongReference, TraceabilityTrigger |
| **BookToc** | Tabla de contenido secuencial del libro | `book-model.json` (headings, orden) | BookUnitView |
| **Asset** | Imagen o QR original, sin recompresión | `assets-manifest.json[asset]` + binario en `assets/docx-media/` | AssetContext (EDITORIAL), SongReference |
| **AssetContext** | Contexto editorial de un asset ambiguo/visual | `data/editorial/asset-context.json` | Asset |
| **SongReference** | Ficha mínima de una canción (banda, álbum, año) + link a su BookUnit | `book-model-index.json` + `song-credits.json` cuando aplica | BookUnitView, BandView, ReadingCard |
| **BandView** | Reseña BOOK verbatim de una banda + su rol en el meta-eje | `book-model.json` (unidad 3) + `master-map-v0.2.json.band_meta_axis` | SongReference |
| **TraceabilityTrigger** | El control discreto que abre la capa analítica desde una BookUnit | presencia/ausencia de `readings-v0.3.json` con `book_refs.book_unit == N` | ReadingPanel |
| **ReadingPanel / ReadingCard** | Un Reading (thesis, no el análisis completo por defecto) | `readings-v0.3.json[reading]` | ConceptChip, BookUnitView (vía book_refs), otro ReadingCard (vía connections) |
| **ConceptChip** | Referencia corta e inline a un Concept (nombre, sin definición completa) | `concepts-v0.3.json[concept].name` | ConceptView |
| **ConceptView** | Ficha completa de un Concept: definición, distinciones, relaciones tipadas | `concepts-v0.3.json[concept]` | ReadingCard (Readings que lo usan), ArcView (arcos que lo contienen) |
| **ArcView** | Un arco del Master Map: pregunta, claim, Concepts y Readings en orden | `master-map-v0.2.json.arcs[n]` | ConceptChip, ReadingCard |
| **MapNavigator** | Vista general de los 9 arcos como recorrido (ver G) | `master-map-v0.2.json` (arcs, structural_hypotheses, terminal_structure) | ArcView |
| **HypothesisNote** | Presentación no intrusiva de una `structural_hypothesis` (H-01..H-08) | `master-map-v0.2.json.structural_hypotheses` | ConceptChip, ReadingCard |
| **TerminalSequence** | El recorrido final encadenado (§7) | `master-map-v0.2.json.terminal_structure` | ReadingCard, BookUnitView |
| **ModeSwitcher** | Alterna foco LEER/EXPLORAR preservando la unidad actual | estado de sesión (no un dato de contenido) | BookUnitView ↔ ReadingPanel/ArcView |

Ningún componente necesita lógica de relación "a mano": todas las
relaciones que consumen (`concept_ids`, `book_refs`, `connections`,
`reading_ids`, `concept_ids` en arcos) ya vienen resueltas en los JSON
canónicos. El trabajo del frontend es **leer y renderizar el grafo, no
reconstruirlo**.

---

## F. Original ↔ Lectura: evaluación y decisión

### F.1 Tres soluciones evaluadas

**1. Flipping card (frente=fragmento, dorso=lectura)**
- Lectura: obliga a un gesto activo (flip) por cada unidad, que funciona
  bien para "una canción, una idea", pero un Reading real referencia en
  promedio 3-4 `book_refs` (hasta 6 en `reading-estetica-etica-sintesis`).
  El modelo 1 tarjeta = 1 fragmento no representa Readings que cruzan
  varias unidades.
- Accesibilidad: el flip 3D con `transform` es problemático con lectores de
  pantalla (el contenido "de atrás" suele quedar en el DOM mientras está
  visualmente oculto, o hay que duplicar aria-live) y con "reduce motion".
  Solucionable, pero agrega complejidad para un beneficio decorativo.
  Mobile: el flip por tap compite con el gesto de scroll natural de leer un
  fragmento largo; en pantallas chicas, forzar una tarjeta de tamaño fijo
  para contener un fragmento de 8-10 versos es incómodo.
- Preservación de contexto: al voltear pierdo de vista el fragmento
  original mientras leo la interpretación (están en las dos caras de la
  misma superficie, nunca simultáneas).
- Profundidad: el dorso de una card no es buen contenedor para un `thesis`
  + `concept_ids` + `book_refs` múltiples + `connections`. Se queda corto o
  hay que scrollear dentro de una tarjeta que ya rotó — mala combinación.

**2. Navegación por página completa (ir a `/lecturas/[id]`)**
- Lectura: preserva perfecto foco en cada modo (nunca hay literal
  superposición).
- Accesibilidad: es el patrón más simple y accesible (nueva vista, foco de
  teclado predecible).
- Mobile: perfecto por sí solo.
- Preservación de contexto: **débil** — al navegar a una página nueva se
  pierde la posición de scroll y el fragmento que disparó la exploración,
  salvo que se implemente manejo de historial cuidadoso (viable, pero es
  carga extra para compensar la debilidad del patrón).
- Profundidad: sin límite (es una página entera).

**3. Panel lateral / bottom-sheet contextual (drawer que se abre sin
  navegar)**
- Lectura: el fragmento original permanece visible o a un scroll de
  distancia; el panel se superpone o empuja el layout sin reemplazar la
  vista.
- Accesibilidad: patrón bien resuelto (dialog/drawer con
  `aria-modal`, foco atrapado, `Esc` para cerrar) y ampliamente soportado.
- Mobile: se comporta naturalmente como bottom-sheet (patrón nativo ya
  conocido por el usuario de cualquier app), sin competir con el gesto de
  scroll de lectura.
- Preservación de contexto: **la mejor de las tres** — el usuario nunca
  deja de estar "parado" en la BookUnit que lo disparó; cerrar el panel no
  es "volver", es simplemente dejar de mirar el panel.
- Profundidad: admite contenido rico (thesis, chips de concepto, lista de
  book_refs, conexiones) y, si el usuario quiere el Reading completo con
  todos sus cruces, un enlace dentro del panel puede llevar a
  `/lecturas/[id]` como vista completa (combinando con la opción 2 solo
  para el caso "quiero profundizar de verdad").

### F.2 Decisión

**Panel contextual (drawer/bottom-sheet), con expansión opcional a página
completa.** No flipping card.

Justificación resumida: el dato real (`Reading` con múltiples
`book_refs`, `concept_ids`, `connections`) no encaja en la metáfora
"una cara ↔ otra cara"; el panel contextual es el único de los tres
patrones que cumple simultáneamente accesibilidad, mobile-first y
preservación de contexto sin sacrificar profundidad, porque no obliga a
elegir entre "todo cabe en una tarjeta" y "pierdo dónde estaba". El
flipping card queda descartado no por ser poco elegante sino porque el
modelo real de datos ya superó su capacidad expresiva (1 Reading : N
BookUnits, no 1:1).

El principio ORIGINAL ↔ LECTURA se preserva así: abrir el panel es un acto
explícito y reversible (nunca automático al hacer scroll), y cerrarlo
devuelve exactamente al punto de lectura sin recarga ni pérdida de scroll,
porque nunca hubo navegación real — solo una capa que se muestra y se
oculta sobre el mismo estado.

---

## G. Representación del Master Map

### G.1 Por qué no un grafo de nodos genérico

Un grafo libre (force-directed, nodos flotando, líneas cruzándose) es la
solución por defecto cuando "hay datos con relaciones", pero acá el dato
**ya tiene una dirección**: los 9 arcos están numerados (`order: 1..9`),
tienen una `core_thesis` que describe explícitamente un recorrido
("captura → construcción de un criterio propio → apertura al otro →
libertad universalizable → transmisión"), y una `terminal_structure` que
cierra la secuencia. Un grafo de nodos sin jerarquía visual escondería
precisamente lo que el dato quiere mostrar: que hay un **orden
argumental**, aunque la exploración lateral (por concepto, por reading)
siga siendo libre.

### G.2 Propuesta: recorrido longitudinal con desvíos laterales (híbrido)

- **Eje principal horizontal (o vertical en mobile) = los 9 arcos en
  orden**, presentados como estaciones de un recorrido, no como tarjetas
  sueltas. Cada estación muestra: número de orden, título, pregunta
  (`question`), y un indicador de "peso" (cantidad de concepts/readings)
  sin forzar a entrar.
- **Cada estación se puede abrir** (expandir in-place o navegar a
  `/mapa/[arc]`) para ver su `claim`, sus `concept_ids` como chips, y sus
  `reading_ids` como lista.
- **Los Concepts que se repiten entre arcos** (ej. `concept-comunidad`
  aparece en arcos 2, 3, 5 y 6; `concept-integridad` en 4, 5, 7, 8) se
  señalan visualmente con una marca sutil de recurrencia — no un grafo de
  líneas cruzadas, sino algo como una pequeña "traza" que conecta las
  estaciones donde ese concepto reaparece, visible solo al enfocar ese
  concepto (hover/tap), no todo el tiempo simultáneamente. Esto responde
  directamente a "quiero descubrir conexiones" sin caer en spaghetti visual
  permanente.
- **El meta-eje de bandas (V8/Hermética/Almafuerte) se superpone como una
  franja de contexto**, no como arcos adicionales: dado que el propio
  Master Map declara V8→arcos tempranos (estética, irrupción),
  Hermética→arcos intermedios (ética, responsabilidad) y
  Almafuerte→arcos tardíos y el cierre (síntesis), una franja de fondo con
  las tres bandas alineada aproximadamente sobre el eje de arcos comunica
  ese dispositivo narrativo del libro sin afirmar una correspondencia
  rígida 1:1 arco↔banda (que el propio dato no declara con esa precisión:
  `band_meta_axis` es independiente de `arcs[]`). La etiqueta debe decir
  explícitamente algo como "eje narrativo del libro", para preservar la
  sutileza pedida en §6.
- **La `terminal_structure` se representa como una coda visualmente
  distinta al final del recorrido** (no como un décimo arco): una secuencia
  corta y marcada (`reading-se-vos-por-ser-yo → reading-nuevamente →
  reading-si-me-ves-volver → reading-epilogo-demostracion`), con menos
  ornamento que las 9 estaciones — comunicando que es un cierre, no un
  tema más.
- **Las `structural_hypotheses` (H-01..H-08)** no son arcos ni estaciones:
  se presentan como notas breves ancladas al arco o par de arcos donde
  aplican (ej. H-01 "represión→domesticación" anclada entre las estaciones
  1 y su desarrollo), disponibles al enfocar, no en el recorrido principal.

### G.3 Por qué "longitudinal con desvíos" y no cartográfico/radial

- **Cartográfico** (mapa de territorio con "zonas") sugeriría regiones
  independientes explorables en cualquier orden — pero el dato tiene
  secuencia explícita (`order`) y una tesis de recorrido; usar una
  metáfora de mapa territorial escondería esa direccionalidad.
- **Radial** (arcos como pétalos alrededor de un centro) funciona bien
  para taxonomías sin orden, pero acá 9 elementos con orden fuerte y un
  cierre narrativo puntual (terminal_structure) pierden claridad en
  disposición circular: no hay "centro" temático único, hay un trayecto.
- **Estratificado** (capas apiladas) es más apto para jerarquía de
  abstracción (ej. Concepts arriba, Readings abajo, BOOK en la base) — se
  reserva esa idea para la vista de detalle de un Concept individual (ver
  ConceptView: Concept arriba, Readings que lo usan debajo, BookUnits al
  fondo), no para la vista general del mapa.

**Mobile**: el mismo recorrido longitudinal se vuelve vertical (scroll
natural = avance en el recorrido), que es exactamente el patrón de
"historia con paradas" ya familiar en móvil, sin necesitar gestos de
pinch/zoom de un grafo o mapa libre.

---

## H. Sistema visual preliminar (dirección, no design system)

### H.1 Referencias de tono, no de imitación literal

- **Archivo/memoria**: papel, tipografía con carácter editorial (una serif
  contemporánea para cuerpo de lectura — pensar en algo con la calidez de
  una Literata/Source Serif/Spectral más que una serif clásica de
  periódico), texturas mínimas de "documento" sin simular papel viejo de
  forma kitsch.
- **Pensamiento/tiempo**: mucho espacio negativo, jerarquía tipográfica
  clara en vez de decoración; el Master Map como "recorrido" (§G) ya aporta
  la sensación de tiempo/trayecto sin necesitar iconografía de reloj.
- **Metal argentino, sin cliché**: la referencia visual más honesta no es
  el merch de banda sino el **archivo under de la escena under de los 80s-90s**:
  tipografías de máquina de escribir/mimeógrafo para citas y metadata
  técnica (créditos, años, QR), contraste alto pero no agresivo, texturas
  de fotocopia sutiles reservadas a elementos secundarios (nunca al cuerpo
  de lectura). Esto conecta con "archivo" y con "metal argentino" sin caer
  en fuego/calaveras/cuero.
- **Materialidad**: los QR e imágenes originales (assets reales, nunca
  reemplazados) funcionan como anclas materiales — se presentan con marco
  discreto tipo "recorte de archivo", no integrados como si fueran
  ilustraciones modernas del sitio.

### H.2 Paleta (dirección, no tokens finales)

- Base: papel/hueso apagado y grafito/carbón — evitar negro puro (#000) y
  blanco puro (#fff) para dar densidad de "archivo impreso" en vez de
  "pantalla".
- Un solo acento cromático, saturación media-baja (candidato: un rojo óxido
  apagado o un ámbar quemado — a decidir en etapa visual, no ahora), usado
  exclusivamente para: (a) el control de trazabilidad LEER→EXPLORAR, (b)
  el estado activo en el recorrido del mapa. Nunca decorativo, siempre
  funcional — así el acento adquiere significado ("esto es un puente hacia
  la interpretación") en vez de ser mero color de marca.
- Sin gradientes tipo SaaS, sin sombras de dashboard (drop-shadow
  suave/difusa está bien para el panel contextual de F, pero como recurso
  funcional de profundidad, no de "card bonita").

### H.3 Tipografía (dirección)

- Cuerpo de lectura (BOOK): una serif de texto con buena legibilidad en
  pantalla y alto contraste de trazo moderado (candidatas a evaluar:
  Source Serif 4, Literata, Spectral).
- Metadata / UI / Concepts / chips: una sans neutra y discreta, nunca
  geométrica-tech (evitar la sensación "SaaS"); algo con carácter editorial
  (candidatas: Inter solo para UI utilitaria, o una sans con más
  personalidad tipo Public Sans/IBM Plex Sans para textos de interfaz que
  sí se leen, como thesis de Readings).
- Un tercer registro tipográfico monoespaciado/mecanográfico reservado
  para créditos técnicos (año, álbum, ids, qr_value) — refuerza "archivo
  documental" y separa visualmente "dato" de "texto poético" y de
  "interpretación".

### H.4 Explícitamente evitar

Confirmado del enunciado y reforzado por el corpus real (el propio libro
ya evita esos clichés en PROJECT-BRIEF §19): llamas, calaveras, cuero,
merchandising, nostalgia rockera, gradientes SaaS, dashboards
corporativos, cyberpunk/neón gratuito, grafos de nodos genéricos con
líneas fosforescentes.

---

## I. Mobile

Diseño mobile-first real, no desktop apilado:

- **Lectura (`/libro/[unit]`)**: columna única, ancho de línea controlado
  (~65ch equivalente), tipografía de cuerpo priorizada sobre chrome de
  interfaz. El control de trazabilidad es un elemento fijo pequeño y
  discreto (no un FAB genérico tipo "chat"), ubicado de forma consistente
  (ej. margen inferior del fragmento, no flotante sobre el texto).
- **Apertura de Readings**: bottom-sheet nativo del patrón F — se desliza
  desde abajo, ocupa una porción de la pantalla (no full-screen salvo que
  el usuario expanda a "ver Reading completo"), permite cerrar con swipe
  down o tap fuera. Nunca tapa completamente el fragmento disparador sin
  gesto explícito de expansión.
- **Navegación conceptual (`/conceptos`, `ConceptChip`→`ConceptView`)**: en
  mobile, las relaciones tipadas de un Concept (`opposes`, `requires`,
  etc.) se listan verticalmente agrupadas por tipo de relación, no como
  mini-grafo — un grafo de relaciones conceptuales es aún más difícil de
  manipular con el dedo que el Master Map general.
- **Mapa (`/mapa`)**: el recorrido longitudinal pasa a scroll vertical
  natural (ver G.3) — es el caso mobile más favorecido de todo el sitio,
  porque el patrón "estaciones en columna" es nativo de mobile.
- **Imágenes**: los 12 assets editoriales se presentan a ancho completo de
  columna con lazy-load; nunca recortadas/recomprimidas para el thumbnail
  (usar `loading="lazy"` + `sizes` responsive sobre el archivo original,
  no generar variantes que alteren el asset).
- **QR / links a canciones**: en mobile el QR es redundante como imagen
  para escanear (el usuario ya está en el teléfono) — se muestra el asset
  original igual (por fidelidad editorial, es parte de la disposición del
  libro) pero el enlace real (`qr_value`) se ofrece también como texto/botón
  tocable "Escuchar en Spotify/YouTube" al lado, para no obligar a
  screenshot-y-escanear en el propio dispositivo que ya tiene la app.

---

## J. Arquitectura técnica mínima

Coherente con lo ya aprobado en Etapa 1 (Astro, contenido en archivos,
sin base de datos) — esta sección solo aterriza esa aprobación a la
experiencia ya diseñada, sin reabrir la decisión de framework.

### J.1 Fuente de datos

Los JSON canónicos (`book-model.json`, `assets-manifest.json`,
`data/editorial/*.json`, `concepts-v0.3.json`, `readings-v0.3.json`,
`master-map-v0.2.json`) se consumen **tal cual**, sin duplicarlos a mano en
componentes. Astro Content Collections (`src/content.config.ts`, a crear
recién en implementación) puede tipar estos JSON con schemas Zod que
reflejen los contratos ya declarados dentro de cada archivo (`contracts` en
`readings-v0.3.json`, `depends_on` en `master-map-v0.2.json`) — es decir,
el propio dato ya documenta su esquema, así que el trabajo de tipado es
transcripción, no diseño desde cero.

### J.2 Transformación necesaria

Mínima y **de lectura, no de escritura**:
- Un índice invertido en build-time: `book_unit → reading_ids[]` (hoy la
  relación vive como `reading → book_refs[]`; para el `TraceabilityTrigger`
  de una BookUnit conviene precalcular el sentido inverso una sola vez en
  build, no en cada render).
- Merge de EDITORIAL sobre ASSET/BOOK en build-time (tal como se definió en
  Etapa 1.5 §4): un asset con `asset-context.json` resuelto se enriquece en
  build, nunca se reescribe el manifest original.
- Ningún otro cruce necesita transformación: `concept_ids`, `connections`,
  `reading_ids`/`concept_ids` de arcos ya están resueltos como arrays de
  IDs planos, listos para `Astro.glob`/`getCollection` + lookup por id.

### J.3 Routing

Rutas dinámicas de archivo único por colección (patrón estándar de Astro
Content Collections):
`/libro/[unit].astro`, `/canciones/[song].astro`, `/conceptos/[concept].astro`,
`/lecturas/[reading].astro`, `/mapa/[arc].astro`, más las vistas índice
(`/libro.astro`, `/canciones.astro`, etc.) y `/bandas/[band].astro`.

### J.4 Estado

Estado de cliente mínimo y local, sin store global: el `ModeSwitcher` y el
panel contextual (F) son estado de interacción (abierto/cerrado, foco
actual), no estado de datos — no requieren Zustand/Redux ni nada
equivalente. Si en implementación se detecta necesidad real de estado
compartido entre islas (ej. sincronizar qué Concept está "enfocado" en el
Master Map con un panel lateral simultáneo), evaluar en ese momento; no
se preselecciona una librería de estado ahora.

### J.5 Componentes / islas

Astro por defecto (cero JS) para todo lo que es lectura pura
(BookUnitView, ConceptView, ArcView como contenido estático). Islas
interactivas (React o Preact, a definir en implementación, ninguna
decisión tomada aún) solo donde hay estado real de interacción: el panel
contextual (F), el recorrido de mapa con "enfocar concepto recurrente"
(G.2), y el ModeSwitcher. Esto minimiza JS enviado al cliente y es
coherente con "sin sofisticación porque sí" del enunciado (§11).

### J.6 Estrategia responsive

Mobile-first con CSS estándar (container queries donde beneficie al panel
contextual y al recorrido del mapa); no se requiere ningún framework CSS
adicional más allá de lo que ya se evalúe en implementación. No se decide
Tailwind ni CSS Modules en esta etapa — es una decisión de implementación,
no de experiencia.

### J.7 Explícitamente fuera de alcance en esta etapa

Ningún prototipo de código se generó para este documento (no hizo falta:
las tres opciones de F se pudieron comparar sobre el dato real y los
criterios de accesibilidad/mobile sin necesidad de construir nada). Si en
la aprobación se pide validar interactivamente el panel contextual antes
de comprometerse, puede hacerse como prototipo aislado de una sola
pantalla — pero no está hecho todavía y no se hace sin pedido explícito.

---

## Resumen de decisiones que requieren tu aprobación

1. **Sitemap de §C** — en particular, la ausencia deliberada de `/ensayos`
   como ruta de primer nivel hasta que exista contenido real en
   `content/essays/`.
2. **Patrón Original↔Lectura**: panel contextual (drawer/bottom-sheet), no
   flipping cards (§F).
3. **Representación del Master Map**: recorrido longitudinal con desvíos
   laterales, franja de meta-eje de bandas superpuesta, coda visual para
   `terminal_structure` (§G).
4. **Regla dura de MODO LEER**: no se hace fetch de READINGS hasta
   activación explícita del usuario (§B.4) — impacto en implementación
   (carga diferida real, no solo `display:none`).
5. **Dirección visual de §H** como punto de partida (paleta/tipografía
   final se define en etapa de diseño visual, no ahora).
6. **No crear `/ensayos`, ni Concepts, ni Readings nuevos** — este
   documento no tocó ninguna fuente canónica, solo las leyó y las
   organizó en una propuesta de experiencia.

Quedo a la espera de tu aprobación (total, parcial, o con ajustes) antes
de tocar `src/` o generar cualquier prototipo.
