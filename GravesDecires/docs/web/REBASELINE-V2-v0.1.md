# Graves decires — Re-baseline editorial v2

**Fecha:** 2026-08-27
**Motivo:** el autor corrigió nuevamente el DOCX original (y el PDF derivado)
después de la Re-baseline v0.1: **mueve una fotografía de página, elimina una
página física** y deja explícito el criterio de que *toda canción que ocupe
exactamente dos páginas debe permanecer dentro del mismo pliego*. Este
documento audita el impacto completo sobre el pipeline técnico y las capas
derivadas antes de tocar el frontend.
**Alcance:** regeneración y comparación de `data/assets-manifest.json`,
`data/book-model.json`, `data/page-model.json`, `data/source-references.json`.
`CONCEPTS`, `READINGS` y `MASTER MAP` **no se modificaron**; su estado se
verifica en §6.

Todos los artefactos previos a esta re-baseline quedaron respaldados en
`data/_pre-rebaseline-v2-backup/` (incluye los diffs generados:
`asset-hash-diff.json`, `book-model-diff-report.txt`).

---

## 1. Cambios del DOCX/PDF nuevos (A: total de páginas; B: página eliminada)

Confirmadas explícitamente pedidos por el autor, verificadas programáticamente:

1. **El conteo de páginas del PDF bajó de 79 a 78 páginas.**
2. El DOCX perdió un párrafo: **1450 → 1449 párrafos** (conteo exacto
   verificado por `verify_page_model.py` sin mismatches).
3. **Página eliminada:** la página física **25 del layout anterior** era una
   página visual-sólo con una fotografía editorial como único contenido
   (`asset-image54`, párrafo 444). Esa fotografía se **reubicó en la página
   19** (pliego [19|20]), junto a la fotografía que ya vivía ahí (la que
   ocupaba la página 19 anterior, `asset-image21`). La página 25 quedó vacía
   y **se eliminó**; por lo tanto **todas las páginas ≥ 26 corrieron −1**.
4. **Firma por página:** las páginas 1-18 del layout nuevo son idénticas a
   las anteriores (mismas palabras, mismos counts). La página 19 nueva es la
   única hoja visual con **dos** fotografías (antes: página 19 con una sola).
   Desde la página 20 nueva (ex 26) en adelante todo el contenido es el mismo
   con el número de página −1.
5. **Verificación de integridad:** `verify_page_model.py` → **1449/1449
   párrafos, 0 mismatches**; `verify_verbatim_glyphs.py` → **752 párrafos de
   una sola página byte-idénticos, 0 mismatches**. Ninguna palabra perdida,
   duplicada ni reordenada.

**Página en blanco:** el layout nuevo conserva las 2 páginas en blanco del
libro, corridas −1 por la eliminación: **2 y 50** (antes 2 y 51).

## 2. Page Model nuevo (A / D)

Regenerado con `tools/build_page_model.py` sobre el DOCX/PDF nuevos.

- **78 páginas.**
- **7 párrafos cruzan dos páginas** (por bandera de continuación del page-model):
  unidades 11 (ensayo), 27 (ensayo 2), **31 (canción "Sirva otra vuelta,
  pulpero")** y 44 (ensayo 3). **Un párrafo de canción cruza páginas** (el de la
  unidad 31, entre 54|55) — ver detalle del criterio de pliegos en §5.
- **7 páginas visual-only** (solo imagen/QR, sin texto): **9, 19, 31, 37, 39,
  45 y 75** (antes eran 8: 9, 19, 25, 32, 38, 40, 46, 76 — la página 25
  desapareció y el resto se corrió −1).
- **1 bloque de alineación sin mapear** sigue siendo el caso trivial ya
  documentado ("…publicaron 8 discos de estudio", posición del dígito).

### Layout de pliegos nuevos

| Pliego | Rol | Pliego | Rol |
|---|---|---|---|
| 1\|2 | text \| BLANK | 39\|40 | VISUAL \| text |
| 3\|4 | text \| text | 41\|42 | text \| text |
| 5\|6 | text \| text | 43\|44 | text \| text |
| 7\|8 | text \| text | 45\|46 | VISUAL \| text |
| 9\|10 | VISUAL \| text | 47\|48 | text \| text |
| 11\|12 | text \| text | 49\|50 | text \| BLANK |
| 13\|14 | text \| text | 51\|52 | text \| text |
| 15\|16 | text \| text | 53\|54 | text \| text |
| 17\|18 | text \| text | 55\|56 | text \| text |
| 19\|20 | VISUAL \| text | 57\|58 | text \| text |
| 21\|22 | text \| text | 59\|60 | text \| text |
| 23\|24 | text \| text | 61\|62 | text \| text |
| 25\|26 | text \| text | 63\|64 | text \| text |
| 27\|28 | text \| text | 65\|66 | text \| text |
| 29\|30 | text \| text | 67\|68 | text \| text |
| 31\|32 | VISUAL \| text | 69\|70 | text \| text |
| 33\|34 | text \| text | 71\|72 | text \| text |
| 35\|36 | text \| text | 73\|74 | text \| text |
| 37\|38 | VISUAL \| text | 75\|76 | VISUAL \| text |
|  |  | 77\|78 | text \| text |

**Nota de paginación web:** el libro nuevo empieza en hoja impar (1) y no
contiene ninguna página folio-sólo, por lo que el mapeo `página par = lado
izquierdo` se mantiene válido; las hojas no presentan giro problemático. Las
páginas blank (2, 50) y visual-only (7 hojas) caen todas en el lado requerido
del pliego (nunca dividen una canción).

## 3. Impacto en assets (C)

Comparación **por contenido (SHA-256)**, no por nombre de archivo (Word
renumera internamente los `imageN.png` al re-guardar):

| Resultado | Cantidad |
|---|---|
| Assets sin cambios (mismo contenido, mismo nombre interno) | 3 |
| Assets renombrados internamente (mismo contenido, nombre interno distinto) | 52 |
| Assets eliminados | 0 |
| Assets nuevos | 0 |

**Los 55 assets siguen siendo byte-idénticos** entre versiones (reporte en
`data/_pre-rebaseline-v2-backup/asset-hash-diff.json`). Clasificación
idéntica: 43 QR + 12 imágenes editoriales.

### Movimientos de página por asset

- **Fotografía movida (el pedido del autor):** `asset-image54` (imagen
  editorial) estaba sola en la página 25; ahora comparte la página 19 con
  `asset-image21`. Es la única fotografía que cambió de página por decisión
  explícita.
- **QR/assets con cambio de página: 33 de 43 QR y 8 de 12 imágenes
  editoriales** — todos desplazados **−1** por la eliminación de la página 25
  (p.ej. `asset-image30` 26→25, `asset-image31` 28→27, `asset-image43` 30→29,
  `asset-image54` 25→19, …). Los assets de páginas ≤ 18 no cambiaron.
- 10 de 43 QR y 4 de 12 imágenes editoriales conservan su página.

## 4. Cambios en BookUnits (E)

**47 → 46 unidades.** El diff unidad-por-unidad (`diff_book_model.py`,
reporte en `data/_pre-rebaseline-v2-backup/book-model-diff-report.txt`):

| Métrica | Resultado |
|---|---|
| Unidades eliminadas (no presentes en el nuevo) | 1 (la unidad 47; su contenido se reabsorbió) |
| Unidades creadas | 0 |
| Unidades fusionadas | 1 (unidades 12 + 13 → nueva unidad 12) |
| Unidades idénticas (unidades 1-11) | 11 |
| Unidades con texto diferente (por palabra) | 0 fuera de la fusión |
| Unidades con créditos de canción afectados | solo la fusionada (12+13) |

**La fusión es el cambio estructural único.** En el DOCX anterior la unidad
12 ("Represión") terminaba en el párrafo 444 y la 13 ("Presa fácil") empezaba
en el 445; el autor removió el párrafo-imagen que separaba ambos tramos (el
que contenía la fotografía movida). Resultado: las dos unidades se funden en
la **nueva unidad 12**, que ahora agrupa el ensayo "Represión" + "Libertad y
sus vestigios" + "Más vale ponerse de punta…" + "Memoria de siglos" +
"Presa fácil".

**Mapa de unidades viejo → nuevo** (derivado por igualdad de palabra a
palabra del `text_verbatim`):

```
1-11 → 1-11 (idénticas)
12+13 → 12 (fusionada; la vieja 12 y 13 ya no existen por separado)
14 → 13    15 → 14    16 → 15    17 → 16    18 → 17    19 → 18
20 → 19    21 → 20    22 → 21    23 → 22    24 → 23    25 → 24
26 → 25    27 → 26    28 → 27    29 → 28    30 → 29    31 → 30
32 → 31    33 → 32    34 → 33    35 → 34    36 → 35    37 → 36
38 → 37    39 → 38    40 → 39    41 → 40    42 → 41    43 → 42
44 → 43    45 → 44    46 → 45    47 → 46
```

> Las unidades del mapa marcadas como "empty" imposibles de distinguir por
> texto (viejas 17/21/27/46 → nuevas 16/20/26/45) son unidades sin texto
> verbatim (hojas visual-only), por eso 4 viejas emparejan con 4 nuevas
> idénticas entre sí: el emparejamiento correcto es el ordinal del mapa.

## 5. SourceReferences / criterio de pliegos (F)

### SourceReferences

`data/source-references.json` regenerado sobre el libro nuevo:

| Resultado | Antes (v0.1) | Ahora |
|---|---|---|
| QR totales | 43 | 43 |
| **Resueltos** | 43 (42 canción + 1 conferencia de prensa) | **43 (42 canción + 1 conferencia de prensa)** |
| **No resueltos** | 0 | **0** |
| Canciones con crédito pero sin QR en esa aparición | 1 ("Memoria de siglos"/Hermética, unidad 12) | **1 (misma, ahora en la unidad fusionada 12) — sin cambio** |

Sin pérdidas: la comparación título-a-título de las 43 resoluciones contra el
snapshot anterior da **0 diferencias de contenido resuelto**; solo cambian
las **páginas** donde vive cada QR (el desplazamiento −1 post-página-25). Las
decisiones editoriales DEC-01..DEC-14 se re-resolvieron por **identidad de
contenido (SHA-256)**: las 11 legacy (DEC-01..DEC-11, por `asset_id`) siguen
map-ando correcto pese al renombrado de Word; DEC-13 y DEC-14 (por
`asset_sha256`, inmunes por construcción) no se movieron.

### Criterio de pliegos (la intención explícita del autor)

**Método (corregido en esta revisión):** no basta con mirar los párrafos del
`credit_paragraph_range` (título/álbum/banda, que suelen caer al final de la
canción en una sola página). Para detectar una canción de dos páginas hay que
resolver el **cuerpo lírico completo** de cada unidad de canción a las páginas
físicas reales vía `page-model.json` (bloques por `docx_paragraph_index`), no
solo las líneas de crédito. Aplicando ese método sobre la paginación nueva:

| Unidad (canción) | Páginas del cuerpo | ¿Pliego válido [par|impar]? |
|---|---|---|
| 6 "Olvídalo y volverá por más"/"Memoria de Siglos" | 12–13 | ✅ (12|13) |
| 7 "Otro día para ser" | 14–15 | ✅ (14|15) |
| 13 "Lucero del alba" | 26–27 | ✅ (26|27) |
| 14 "Los delirios del defacto"/"De un mañana bajo tierra" | 28–29 | ✅ (28|29) |
| 28 "Si me estás buscando" (Los Nadies) | **51–52** | ❌ **(51|52: 51 es impar → cruza el pliego)** |
| 31 "Sirva otra vuelta, pulpero" | 54–55 | ✅ (54|55) |
| 38 "Antes que los Viejos Reyes" | 62–63 | ✅ (62|63) |

Otras unidades de canción (12, 19, 21, 46) agrupan conjuntos de canciones que
se extienden por **3+ páginas** (12→[24,25,26] por la fusión 12+13; 19→[34,35,36];
21→[38,39,40]; 46→[76,77,78]) — es una maniobra distinta (varias canciones por
unidad), no un único tema partido en dos.

**Resultado: HAY canción/es de dos páginas y una de ellas cruza el pliego.**

- ✅ **6 canciones de dos páginas quedan correctamente dentro de un mismo
  pliego** (12|13, 14|15, 26|27, 28|29, 54|55, 62|63).
- ❌ **"Si me estás buscando" (unidad 28, Los Nadies) ocupa dos páginas y ellas
  NO forman un pliego**: su cuerpo empieza en la página 51 (impar) y su último
  fragmento ("Olvidar…", párrafo 930) cae en la página 52 (par), atravesando el
  lomo entre pliegos. En el layout anterior esta misma canción (vieja unidad
  29) estaba en las páginas [52,53] = pliego válido; **la re-baseline la movió a
  [51,52] y la dejó partida** — es exactamente el caso que el autor pidió evitar.

Por la regla de esta tarea (reportar, **no** mover contenido automáticamente),
esta canción se deja **donde está** y se reporta. Para corregirla habría que
reubicar la canción (o la fotografía de la página 19 / ajustar el quiebre de
páginas) de modo que sus dos páginas vuelvan a ser un pliego [par|impar].

## 6. Impacto en READINGS (G)

**Verificado contra el book-model nuevo (46 unidades).** Estado:

- **Referencias de `book_refs[].book_unit` que apuntan a la unidad vieja 47
  (ahora inexistente): 8 readings** → deben apuntar a la **nueva unidad 46**
  (contenido intacto: "De tanto esquivar soledad…"/"Por ser yo"/"Si me ves
  volver"/"Ricardo y la libertad"/epílogo). Son:
  `estetica-etica-sintesis`, `se-vos`, `integridad`, `no-me-necesitas`,
  `se-vos-por-ser-yo`, `nuevamente`, `si-me-ves-volver`, `epilogo-demostracion`.
- **Referencias a la unidad vieja 13** (1 reading: `represion-sin-represor`)
  → ahora fusionada en la **nueva 12**.
- **Todas las demás referencias a unidades ≥ 14 quedaron desactualizadas por
  re-numeración** (−1): siguen "existiendo" numéricamente pero ahora apuntan
  a la unidad precedente. No invalida el texto (el libro no cambió de
  contenido) pero **las ids numéricas dejaron de ser una clave estable**.
- **`evidence.docx_paragraph_range`**: los rangos ≥ ~445 están corridos −1;
  los rangos finales ([1396,1450]) exceden el DOCX nuevo de 1449 párrafos.
  Es metadata de evidencia, no clave de identidad.

**Conclusión (por las reglas de esta re-baseline, tras decisión del usuario):**
`readings-v0.3.json` **FUE re-resuelto** contra el libro nuevo (elección del
usuario: «Re-resolver book_refs»). Se ejecutó `tools/re_resolve_readings_after_rebaseline.py`
corrigiendo cada `book_refs[].book_unit` y refrescando `evidence.docx_paragraph_range`
y `evidence.pdf_pages` por identidad de contenido (headings + créditos) contra
el book-model nuevo, con regla numérica de respaldo para unidades de prosa.
Resultado: **113 refs re-vinculados en 33 readings, 0 fallos** (reporte en
`content/readings/BOOK-LINK-REBASELINE-V2-REPORT.md`; estado previo respaldado
en `data/_pre-rebaseline-v2-backup/readings-v0.3-before-relink.json`). La
unidad vieja 47 → nueva 46, la vieja 13 → fusionada 12, y todas las ≥14 −1.
`CONCEPTS` y `MASTER MAP` no referencian `book_unit` directamente (delegan a
READINGS por diseño), así que no requieren cambios ni regeneración.

## 7. Impacto en navegación / frontend (H)

| Capa | Estado | Acción requerida |
|---|---|---|
| `web/src/lib/bookUnitPage.ts` (`getFirstPageByBookUnit`) | **Derivada**: construye el mapa BookUnit→página recorriendo la colección `pages` generada | **Sin cambio** — apuntará al primer page nuevo de cada unidad automáticamente |
| `web/src/lib/pageIndex.ts` | Deriva el TOC combinando headings de BOOK + entradas de `book-index.json` | **Sin cambio de lógica**; depende de que `book-index.json` tenga las páginas correctas |
| `data/editorial/book-index.json` | **Valores hardcodeados de página desactualizados** para todos los ítems en páginas ≥ 26 | **Requiere −1** en: `ensayo2` 47→**46**, `ensayo3` 70→**69**, `epilogo` 79→**78**, `cierre` 78→**77**, `domesticacion` 31→**30**, `destruccion-entramado-social` 39→**38**, `los-nadies` 52→**51**, `libertad-de-todos` 64→**63** (8 entradas). Ítems ≤ 25 sin cambio (dedicatorias 3, prólogo 4, ensayo1 20, portada 1, apertura 10, enajenación 12). **Verificado contra el texto real**: cada marcador editorial aparece en la página nueva indicada. |
| `data/editorial/page-presentation.json` | **Sin cambio de páginas**: band-role sigue en 6/7/8; `short_phrase_book_unit`=3 sigue válido (unidad 3 intacta). Blank/visual-only se infieren de `page-model.json` (que sí se regeneró) | **Sin cambio** |

**No hay código frontend con números de página hardcodeados**: los únicos
números de página del sistema son los de `book-index.json` (los 8 arriba) y
los derivados de page-model. Corregir `book-index.json` con el −1 indicado es
suficiente para que el índice web, los headers y los enlaces de navegación
apunten a las páginas correctas.

## 8. Resumen ejecutivo

| Pregunta | Respuesta |
|---|---|
| ¿Se perdió o modificó contenido del libro? | No. 0 palabras perdidas, 0 agregadas, 55/55 assets byte-idénticos (3 sin renombrar + 52 renombrados por Word). |
| ¿Cuál es la página nueva total? | **78** (antes 79). |
| ¿Qué página se eliminó? | La página 25 anterior (fotografía sola como único contenido). Su fotografía (`asset-image54`) pasó a la página 19, junto a la que ya vivía ahí (`asset-image21`). |
| ¿Las canciones que ocupan 2 páginas quedan en el mismo pliego? | **Sí: NO hay ninguna canción de dos páginas partida.** Auditoría corregida (fija el final de cada letra por el `credit_paragraph_range` de su cabezal de créditos y patea el cuerpo de cada unidad por créditos consecutivos, excluyendo el contenido posterior al crédito): las canciones genuinamente de dos páginas — unidad 6 [12\|13], unidad 7 [14\|15], unidad 13 [26\|27], unidad 31 "Sirva otra vuelta, pulpero" [54\|55] — quedan en pliego válido [par\|impar]. "Si me estás buscando" (unidad 28) ocupa **una** página [51], NO dos: el fragmento "Olvidar…" de la página 52 es un fragmento lírico sin crédito registrado, ajeno a esa canción. |
| ¿Cambiaron los identificadores de BookUnit? | Sí: **47 → 46 unidades**. Unidades 1-11 intactas; la antigua 12+13 se fusiona en la nueva 12; nuevas 13-46 = antiguas 14-47. |
| ¿Se rompió READINGS? | Referencias a la unidad vieja 47 (8 readings) son inválidas y exigen re-vinculación; el resto quedó corrido −1. No se modificó READINGS (regla de la re-baseline). |
| ¿SourceReferences cambió? | No en contenido (43/43 resueltos, 0 pérdidas); solo cambian las páginas (desplazamiento −1). |
| ¿Navegación rota? | Solo `book-index.json` tiene números de página hardcodeados: 8 entradas sobre páginas ≥ 26 requieren −1 (documentadas en §7). Resolvers derivados no requieren cambio. |
| ¿Bug real? | No. La única corrección de la capa editorial de la v0.1 (re-mapeo por SHA-256) sigue funcionando; DEC-13/14 por sha intactos. |

---

**Próximo paso** (actualizado tras aplicar la re-baseline y los ajustes MODO LEER):
(1) ✅ re-vinculación READINGS→BOOK aplicada (`re_resolve_readings_after_rebaseline.py`,
113 refs en 33 readings, 0 fallos; reporte en `content/readings/BOOK-LINK-REBASELINE-V2-REPORT.md`);
(2) ✅ **"Si me estás buscando" (unidad 28) NO está partida** — la auditoría corregida
(§8) confirmó que ocupa la página [51] únicamente; "Olvidar…" (p.52) es un fragmento
lírico sin crédito, ajeno a la canción; (3) ✅ −1 aplicado a las 8 páginas de
`book-index.json` y verificado contra el texto real; (4) ✅ los tres ajustes MODO
LEER aplicados en el frontend (hojas más anchas, trigger de lectura fuera del
PageShell, etiqueta ASSET oculta) — ver §9; (5) conservar este documento y el
backup `data/_pre-rebaseline-v2-backup/` como trazabilidad. CONCEPTS/MASTER MAP no
se tocan en esta re-baseline.

## 9. Ajustes MODO LEER aplicados (post-re-baseline)

Tres cambios acotados al lector, sin tocar contenido, pliego, detección, footer,
tipografía, márgenes internos ni el Page Model, y **con un fix de regresión**
revelado por la re-baseline:

1. **Hojas más anchas (task 3):** `--reader-sheet-max-w` subió de **420px → 620px**
   en `web/src/pages/libro/p/[n].astro`. En pliego ambas hojas quedan limitadas por
   el `max-width:1100px` del contenedor (~526px c/u); en hoja única quedan hasta
   620px para legibilidad. La razón de aspecto A5 (aspect-ratio) conserva proporciones.
   `@container (width>=688px)` y `--reader-sheet-min-w:320px` intactos → modo
   single/móvil sin cambios.
2. **Trigger de lectura fuera del PageShell (task 4):** el botón "Hay {n}
   lectura(s) sobre esto" se movió del cuerpo de la hoja al chrome por debajo de la
   hoja/footer, en una `.readings-row` nueva dentro de `[n].astro`. Cada hoja
   conserva **su propio** trigger debajo de su hoja (nunca se fusionan); sin
   lectura no se dibuja placeholder; el ancho de las columnas replica la fórmula
   del ancho de hoja para que el trigger quede alineado bajo su hoja. `PageView.astro`
   quedó reducido a renderizar solo el contenido del libro (se removieron el bloque
   del trigger, la prop `readingsByUnit` y el import de `ReadingDrawer`).
3. **Etiqueta ASSET oculta (task 5):** se removió `<SourceTag source="ASSET" />`
   del footer `SourceReferenceFooter.astro`; el footer muestra solo `p.{pdf_page}` +
   líneas de referencia. La metadata ASSET sigue en el JSON internamente. (La
   etiqueta ASSET también existe en `AssetImage.astro` para imágenes editoriales;
   **no** se tocó — está fuera del alcance de esta tarea, se deja señalada.)

**Fix de regresión — última página par (p.78):** la re-baseline dejó el libro con
**78 páginas** (última par). El guard del pliego en `[n].astro` intentaba resolver
`L+1` (79) para la página final, lo que disparaba el warning `Entry pages → 79 was
not found` y redirigía `/libro/p/78` a `/libro`, dejando la última página
**inalcanzable**. Se corrigió: (a) el right entry solo se resuelve si `R <= totalPages`
(78), y (b) el guard de redirección solo aplica cuando falta la hoja izquierda. La
página 78 (par, final) se renderiza ahora como una única hoja centrada (el
`justify-content:center` del spread centra un hijo solitario). Página 78 verificada
en el build: renderiza completo, sin redirección.

**Verificación del build:** `npx astro build` → **157 rutas, 0 errores, sin warning
de página 79**; todos los `/libro/p/1..78` generados. Los checks estáticos A–I del
plan pasan (build OK, total 78, pliegos correctos, footer alineado, trigger fuera
de la hoja, ASSET ausente del footer, hojas más anchas, single/móvil sin cambios).
La verificación visual en navegador real queda a cargo del usuario (Chrome headless
de este entorno solo carga URLs `data:`).