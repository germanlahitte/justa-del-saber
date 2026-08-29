# Etapa 1.5 — Consolidación editorial y del modelo

**Proyecto:** Graves decires... (web)
**Fecha:** 2026-08-26
**Estado:** planificación/documentación únicamente. No se implementó interfaz,
no se generó contenido interpretativo, no se modificó el libro.

---

## 1. Modelo de datos revisado

Cambios respecto a la Etapa 1: se separa explícitamente lo impreso (BOOK) de
la metadata editorial (EDITORIAL) y de la capa interpretativa
(FUTURE-ANALYSIS); `Reading` deja de tener un target único; se agrega
calificación de relación; se elimina toda derivación automática
`BookSection → Concept`.

```
// ---------- SOURCE: BOOK (inmutable, generado una sola vez desde DOCX/PDF) ----------

BookSection   { id, title, subtitle?, order }
              // Estructura editorial de la obra. NUNCA genera Concept.

BookUnit      { id, order, sectionId?, pdfPages[], docxParagraphRange,
                headings[] }

Fragment      { id, bookUnitId, textVerbatim, kind, docxParagraphRange,
                pdfPages[] }
              // kind: lyric-full | lyric-quote | statement | prose | epigraph
              // textVerbatim es sagrado: nunca se edita, nunca se completa.

Asset         { id, file, sha256, type, pdfPage, qrValue?, qrDecodeMethod?,
                verification }

Essay         { id, scope: "book", bookUnitIds[], source: "BOOK" }
              // Los 3 ensayos del autor ya existentes en el libro.

// ---------- SOURCE: EDITORIAL (metadata provista por vos, no impresa) ----------

SongCredit    { id, fragmentId, songId, confidence: "printed" | "editorial",
                note?, source: "EDITORIAL" | "BOOK" }
              // Si el crédito está impreso junto al fragmento -> source BOOK,
              // confidence "printed" (ya lo tenemos para 40 casos).
              // Si lo agregás vos después (ej. "La Síntesis" sin crédito
              // visible) -> source EDITORIAL, confidence "editorial".
              // El Fragment.textVerbatim no cambia en ningún caso.

AssetContext  { id, assetId, note, providedBy, source: "EDITORIAL" }
              // Resolución manual de NEEDS-REVIEW/UNKNOWN (qué canción
              // acompaña un QR ambiguo, qué muestra una foto, etc.)
              // sin tocar el Asset ni el manifest técnico original.

// ---------- Entidades de catálogo (derivadas de BOOK, estables) ----------

Band          { id, name, period, stance }   // stance: estética|ética|síntesis (BOOK)
Album         { id, bandId, title, year }
Song          { id, bandId, albumId, title, year }
              // Song puede existir sin Fragment asociado todavía (crédito
              // editorial pendiente) — no se infiere.

// ---------- SOURCE: FUTURE-ANALYSIS (capa interpretativa, vacía por ahora) ----------

Concept       { id, name, definition, source: "FUTURE-ANALYSIS" }
              // Independiente de BookSection. Ver §2.

Reading       { id, title?, body, source: "FUTURE-ANALYSIS" }
              // Ya NO tiene targetType/targetId único. Ver §3.

ReadingTarget { id, readingId, targetType: "song"|"fragment"|"bookUnit"|
                                            "concept"|"essay"|"band",
                targetId, role?, relation, source: "FUTURE-ANALYSIS" }
              // N:M entre Reading y cualquier combinación de elementos.
              // relation: ver vocabulario en §3.

EssayWeb      { id, scope: "web", body, source: "FUTURE-ANALYSIS" }
              // Ensayos nuevos de la web (distintos de Essay del libro).

Link          { id, fromType, fromId, toType, toId, relation, source }
              // Uso general para relaciones simples 1:1 (ej. Concept↔BookSection
              // explícito). Para relaciones ricas N:M usar Reading+ReadingTarget.
```

### Regla de oro del modelo

Toda entidad tiene `source` obligatorio ∈ `{BOOK, ASSET, EDITORIAL,
FUTURE-ANALYSIS}`. Ninguna entidad `EDITORIAL` o `FUTURE-ANALYSIS` puede
escribir sobre un campo de una entidad `BOOK`. Solo pueden **apuntar hacia**
ella mediante `fragmentId` / `targetId` / `bookUnitId`, etc.

---

## 2. Separación BookSection / Concept — explicación breve

- **BookSection** es un hecho editorial impreso: existe porque el libro tiene
  un título de sección en esa página (p. ej. "Represión", "Los Nadies"). Se
  genera una sola vez desde el DOCX/PDF y no cambia salvo que se descubra un
  error de transcripción.
- **Concept** pertenece exclusivamente a la capa interpretativa futura. No se
  crea ningún `Concept` automáticamente a partir de los títulos de
  `BookSection`, aunque el nombre coincida textualmente (ej. no existe todavía
  ningún `Concept("Represión")`).
- Si en el futuro querés decir "el concepto Represión se relaciona con la
  sección Represión del libro", esa relación se declara **explícitamente**
  con un `Link { fromType: "concept", toType: "bookSection", relation:
  "contextual" }` (o vía `Reading/ReadingTarget` si además involucra
  canciones/fragmentos). Nunca es automática ni implícita.
- Consecuencia práctica: hoy la tabla `Concept` está vacía y seguirá vacía
  hasta que proveas el corpus interpretativo. `BookSection` ya está completa
  (8 secciones) porque es parte de la obra cerrada.

---

## 3. Reading / ReadingTarget — estructura revisada

Antes (Etapa 1): `Reading { targetType, targetId }` — un solo destino.
Ahora: relación N:M mediante tabla intermedia, sin target único ni relación
implícita de continuidad.

```
Reading {
  id: string
  title?: string
  body: string              // el texto de la lectura (MDX en disco)
  source: "FUTURE-ANALYSIS"
}

ReadingTarget {
  id: string
  readingId: string          // FK a Reading
  targetType: "song" | "fragment" | "bookUnit" | "band" | "essay" | "concept"
  targetId: string
  role?: string               // rol libre dentro de esa lectura (ej. "punto de partida", "contraste")
  relation: RelationKind      // calificador obligatorio, ver vocabulario abajo
  source: "FUTURE-ANALYSIS"
}

RelationKind =
  | "resonance"    // ecos temáticos sin implicar desarrollo
  | "contrast"     // tensión u oposición entre elementos
  | "development"  // uno amplía o profundiza al otro (explícito, no asumido)
  | "recurrence"    // el mismo motivo reaparece en otro momento/banda
  | "tension"       // contradicción reconocida, no resuelta
  | "synthesis"     // un elemento integra o combina a los anteriores
  | "contextual"    // vínculo de contexto (histórico, biográfico, editorial)
  | "editorial"     // vínculo introducido por decisión editorial, no textual
```

Ejemplo de uso (una lectura que cruza dos canciones de distintas bandas y un
fragmento de ensayo, sin asumir continuidad):

```
Reading { id: "reading-herencia-01", title: "Sobre heredar",
          body: "...", source: "FUTURE-ANALYSIS" }

ReadingTarget { readingId: "reading-herencia-01",
                targetType: "song", targetId: "song-orgullo-argentino",
                relation: "resonance", source: "FUTURE-ANALYSIS" }

ReadingTarget { readingId: "reading-herencia-01",
                targetType: "song", targetId: "song-patria-al-hombro",
                relation: "recurrence", source: "FUTURE-ANALYSIS" }

ReadingTarget { readingId: "reading-herencia-01",
                targetType: "essay", targetId: "essay-web-comunidad",
                relation: "contextual", source: "FUTURE-ANALYSIS" }
```

Ningún `ReadingTarget` implica por sí solo que un elemento explique, continúe
o complete a otro: eso solo lo dice `relation`, y siempre de forma explícita.
El vocabulario de `RelationKind` queda abierto a refinarse cuando llegue el
corpus real.

---

## 4. Metadata editorial sin modificar la fuente BOOK

Mecanismo de tres capas, estrictamente aditivo:

1. **Capa BOOK (inmutable):** `Fragment.textVerbatim`, `BookUnit`,
   `BookSection`, `Asset` — generados una sola vez por los scripts de
   ingesta (`tools/*.py`) a partir de DOCX/PDF. No se re-generan a mano ni se
   editan directamente.
2. **Capa EDITORIAL (aditiva, versionada aparte):** archivos nuevos que
   *anotan* la capa BOOK sin tocarla:
   - `data/editorial/song-credits.json` → registros `SongCredit` con
     `confidence: "editorial"` para créditos que vos aportes (ej. asociar la
     letra de "La Síntesis" p.8 a una `Song` concreta).
   - `data/editorial/asset-context.json` → registros `AssetContext` que
     resuelven cada NEEDS-REVIEW/UNKNOWN del §5 (ej. "image7.png en p.13
     acompaña a Memoria de Siglos, no a Olvídalo y volverá por más").
3. **Merge en tiempo de build (no en la fuente):** un paso de construcción
   combina `book-model.json` (BOOK) + `data/editorial/*.json` (EDITORIAL)
   para producir las vistas finales (ej. tarjeta de canción con su fragmento
   y su asset). El archivo `book-model.json` nunca se reescribe a mano; si
   hace falta regenerarlo, se vuelve a correr el script de ingesta sobre las
   fuentes originales.

Esto permite: (a) diff claro en git entre "lo que dice el libro" y "lo que
decidiste vos después"; (b) revertir una decisión editorial sin tocar la
fuente; (c) que el build falle visiblemente si `data/editorial/*.json`
referencia un `fragmentId`/`assetId` que no existe en `book-model.json`.

---

## 5. Lista compacta de decisiones pendientes (NEEDS-REVIEW / UNKNOWN)

Identificador estable `DEC-NN`. Respondé con el id y tu decisión; estos
valores se van a volcar en `data/editorial/*.json` sin tocar el libro.

### Créditos de QR ambiguos (dos citas en la misma página)

| ID | Página | Asset | QR (spotify, recortado) | Ambigüedad |
|---|---|---|---|---|
| **DEC-01** | p.13 | `asset-image7` | …305nzjHiIAnr1DmyZcRLRD | ¿Acompaña a "Olvídalo y volverá por más" o a "Memoria de Siglos" (ambas citadas en esa página)? |
| **DEC-02** | p.13 | `asset-image17` | …174gCegpUjug5Z2yQ8ectM | Idem DEC-01, el otro QR de la misma página. |
| **DEC-03** | p.65 | `asset-image29` | …6woKpva7Uwdpxr3tqhHbhD | ¿Acompaña a "Ayer deseo, hoy realidad" o a "Debes saberlo" (ambas citadas en esa página)? |
| **DEC-04** | p.65 | `asset-image13` | …0RK3rIJW884dpTq89P21NN | Idem DEC-03, el otro QR de la misma página. |

### Assets en páginas visuales sin texto (contexto no verificable técnicamente)

| ID | Página | Asset | Tipo | Pendiente |
|---|---|---|---|---|
| **DEC-05** | p.9 | `asset-image6` | QR (…7DOGpaCNsjoo5jjZnkEMYH) | ¿A qué canción/momento corresponde? |
| **DEC-06** | p.9 | `asset-image39` | foto editorial | ¿Contexto a registrar (o se deja sin asociar)? |
| **DEC-07** | p.19 | `asset-image32` | foto editorial | Idem. |
| **DEC-08** | p.32 | `asset-image16` | foto editorial | Idem. |
| **DEC-09** | p.38 | `asset-image52` | foto editorial | Idem. |
| **DEC-10** | p.46 | `asset-image25` | foto editorial | Idem. |
| **DEC-11** | p.76 | `asset-image28` | foto editorial | Idem. |

(Recordatorio: por indicación tuya, no se intenta identificar personas o
bandas en las fotos si no está explícito en la fuente. Estos ítems solo
preguntan si querés dejar constancia de algún contexto editorial o si quedan
sin asociar de forma permanente.)

### Crédito faltante en el texto impreso

| ID | Página | Elemento | Pendiente |
|---|---|---|---|
| **DEC-12** | p.8 | Fragmento "Canto mi razón para que quien quiera, guarde…" (unidad "La Síntesis") | El libro no imprime crédito de título/álbum/año junto a esta letra. ¿Querés asociarla editorialmente a una `Song` específica (vía `SongCredit` con `confidence: "editorial"`), o se deja como fragmento sin crédito? |

**Total: 12 decisiones.** Ninguna requiere que yo interprete o infiera nada
adicional — quedo a la espera de tus respuestas por ID.

---

## 6. Estructura de carpetas propuesta

Solo estructura y convención de nombres — sin componentes visuales todavía.

```
GravesDecires/
├── PROJECT-BRIEF.md
├── book/                          # fuentes originales, intocables
│   ├── Graves decires de aguda intuición.docx
│   └── Graves decires de aguda intuición.pdf
│
├── assets/
│   └── docx-media/                # 55 assets extraídos byte a byte (ya existe)
│
├── tools/                         # scripts de ingesta (ya existen, se re-corren
│   └── *.py                       #   si hace falta regenerar book-model.json)
│
├── data/
│   ├── book-model.json            # SOURCE: BOOK — generado, inmutable a mano
│   ├── assets-manifest.json       # SOURCE: ASSET — generado, inmutable a mano
│   ├── editorial/                 # SOURCE: EDITORIAL — aditivo, versionado, editable a mano
│   │   ├── song-credits.json      #   SongCredit[]
│   │   └── asset-context.json     #   AssetContext[]
│   └── ETAPA-*.md                 # informes de cada etapa (histórico)
│
├── content/                       # SOURCE: FUTURE-ANALYSIS — capa interpretativa (vacía hoy)
│   ├── concepts/                  # Concept en MDX, uno por archivo (a futuro)
│   ├── readings/                  # Reading en MDX + frontmatter con ReadingTarget[]
│   └── essays/                    # EssayWeb en MDX
│
├── src/                           # (a futuro, cuando se apruebe implementación)
│   ├── content.config.ts          # Astro Content Collections: book (JSON) + concepts/readings/essays (MDX)
│   ├── pages/
│   │   ├── libro/
│   │   ├── bandas/
│   │   ├── canciones/
│   │   ├── conceptos/
│   │   ├── lecturas/
│   │   └── ensayos/
│   └── components/                # vacío hasta la etapa de implementación
│
└── public/
    └── qr/                        # (a futuro) copia estática de los QR originales para <img>, sin recomprimir
```

Notas de diseño:
- `content/concepts|readings|essays` empiezan **vacíos**: son la capa que vos
  vas a proveer. No se genera ningún archivo ahí en esta etapa.
- `data/editorial/` es la única carpeta pensada para que se edite a mano de
  forma recurrente sin re-correr los scripts de ingesta.
- `src/` no se crea todavía — es la carpeta de implementación futura, incluida
  solo para mostrar cómo encajaría Astro con Content Collections sobre este
  mismo modelo.
- Las seis rutas de navegación siguen como hipótesis de trabajo, no
  definitiva, tal como pediste.

---

**Fin de la Etapa 1.5.** No se implementaron componentes visuales, no se
generó contenido interpretativo, no se resolvió ningún NEEDS-REVIEW por
inferencia. Esperando tus respuestas a DEC-01..DEC-12 y aprobación para
continuar.
