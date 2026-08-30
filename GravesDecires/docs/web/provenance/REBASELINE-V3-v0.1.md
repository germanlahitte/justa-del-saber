# Graves decires — Re-baseline editorial v3

**Fecha:** 2026-08-28
**Motivo:** el autor corrigió nuevamente el DOCX original (y el PDF derivado)
después de la Re-baseline v2: **re-agrega UNA página física en blanco** (página
63 del layout), volviendo el total a **79 páginas**. Las páginas 1–62 quedan
idénticas a v2; la nueva página 63 es intencionalmente en blanco y el resto
corre **+1** (≥ 64). Este documento audita el impacto completo sobre el
pipeline técnico y las capas derivadas antes de tocar el frontend.
**Alcance:** regeneración y comparación de `data/assets-manifest.json`,
`data/book-model.json`, `data/page-model.json`, `data/source-references.json`,
re-resolución de `content/readings/readings-v0.3.json` y actualización de
`data/editorial/book-index.json`. `CONCEPTS` y `MASTER MAP` no se modifican.

Todos los artefactos previos a esta re-baseline quedaron respaldados en
`data/_pre-rebaseline-v3-backup/`.

---

## 1. Cambios del DOCX/PDF nuevos

Confirmadas explícitamente y verificadas programáticamente:

1. **El conteo de páginas del PDF subió de 78 a 79 páginas.**
2. El DOCX ganó un párrafo: **1449 → 1453 párrafos** (conteo exacto
   verificado por `verify_page_model.py` sin mismatches).
3. **Página nueva:** la página física **63 del layout nuevo** es una página
   intencionalmente en blanco (`is_blank_or_folio_only: True`, 0 bloques,
   ninguna unidad). Ocupa su posición real de pliego **[62|63]** (decisión 14).
4. **Página 64** del layout nuevo (“La libertad de todos”) es el comienzo del
   corrimiento **+1**: todo el contenido ≥ 64 coincide con el layout v2 con
   número de página +1.
5. **Verificación de integridad:** `verify_page_model.py` → **1453/1453
   párrafos, 0 mismatches**; `verify_verbatim_glyphs.py` → **752 párrafos de
   una sola página byte-idénticos, 0 mismatches**. Ninguna palabra perdida,
   duplicada ni reordenada.

**Páginas en blanco (7):** 2, 19, 31, 39, 50, 63 (nueva), 76.
**Páginas visual-only (3):** 9, 37, 45.

## 2. Page Model nuevo

Regenerado con `tools/build_page_model.py` sobre el DOCX/PDF nuevos.

- **79 páginas** (paridad: impar → la página 79 es la hoja derecha de [78|79],
  sin bug de página-terminal par; ver §5).
- **7 párrafos cruzan dos páginas** (por bandera del page-model). 1 párrafo de
  canción cruza páginas (unidad 31, entre 54|55), el resto son ensayos.
- **1 bloque de alineación sin mapear** sigue siendo el caso trivial ya
  documentado (“…publicaron 8 discos de estudio”, posición del dígito).

### Layout de pliegos nuevos

| Pliego | Rol | Pliego | Rol |
|---|---|---|---|
| 1\|2 | text \| BLANK | 41\|42 | text \| text |
| 3\|4 | text \| text | 43\|44 | text \| text |
| 5\|6 | text \| text | 45\|46 | VISUAL \| text |
| 7\|8 | text \| text | 47\|48 | text \| text |
| 9\|10 | VISUAL \| text | 49\|50 | text \| BLANK |
| 11\|12 | text \| text | 51\|52 | text \| text |
| 13\|14 | text \| text | 53\|54 | text \| text |
| 15\|16 | text \| text | 55\|56 | text \| text |
| 17\|18 | text \| text | 57\|58 | text \| text |
| 19\|20 | BLANK \| text | 59\|60 | text \| text |
| 21\|22 | text \| text | 61\|62 | text \| text |
| 23\|24 | text \| text | **63\|64** | **BLANK** \| text |
| 25\|26 | text \| text | 65\|66 | text \| text |
| 27\|28 | text \| text | 67\|68 | text \| text |
| 29\|30 | text \| text | 69\|70 | text \| text |
| 31\|32 | BLANK \| text | 71\|72 | text \| text |
| 33\|34 | text \| text | 73\|74 | text \| text |
| 35\|36 | text \| text | 75\|76 | text \| BLANK |
| 37\|38 | VISUAL \| text | 77\|78 | text \| text |
| 39\|40 | BLANK \| text | 79\|80 | text \| — |

## 3. V2 → V3: correspondencia de unidades por identidad de contenido

Se derivó por **identidad de contenido** (verbatim completo exacto; luego
primera línea / firma; ordinal para las vacías), no por corrimiento ciego:

> **Unidades 1–38 sin cambios; unidades ≥ 39 corren +1** (39→40, 40→41,
> 41→42, 42→43, 43→44, 44→45, 45→46, 46→47). Vacías sin texto: 16→16, 20→20,
> 26→26 (estables), 45→46.

**Book model = 47 unidades.** Se **revierten** la fusión y el −1 de v2: la
unidad 12 “Represión” [401,456] y la unidad 13 “Lucero del alba” [457,474]
vuelven a ser **unidades separadas** (v2 las había fusionado). 34 unidades
tienen créditos; 40 créditos impresos en total.

## 4. Source references (corrección de regresión)

`data/source-references.json` es un artefacto derivado. En la regeneración de
v3, **16 de 43 referencias QR perdieron su resolución** (27/43) porque Word
renumeró los medios incrustados en el re-guardado del DOCX, rompiendo la
asociación unidad→asset de `build_book_model.py` (usada para el `owning_units`
del resolver).

**Corrección aplicada** (`tools/build_source_references.py`): fallback
`RESTORED` que, ante una QR sin resolver, restaura la resolución del baseline
validado anterior (`data/_pre-rebaseline-v3-backup/source-references.json`)
**solo si** la canción (título, banda) sigue existiendo como crédito impreso en
el book-model actual (identidad por contenido; nunca adivina una canción nueva).

**Resultado tras la corrección: 43/43 resueltas, 0 sin resolver**
(42 song + 1 press-conference). Las 16 restauradas quedan marcadas con
`resolution_source: "RESTORED (previous validated baseline; …)"` y sus
identidades de canción verificadas contra los créditos de v3.

> Nota: el campo `book_units` de esas referencias restauradas conserva el
> bucket de unidad DOCX (roto) de v3, pero **no es load-bearing**: el footer
> web resuelve por `qr_asset_id → source_ref`, no por `book_units`.

Referencias relevantes para las decisiones (página v3):
- p7 → press-conference “Conferencia de prensa de Hermética — Oberá Rock 1993”.
- p13 → asset-image14 (“Olvídalo y volverá por más”) + asset-image24
  (“Memoria de Siglos”).
- Unidad 47 / epílogo: asset-image34 (p77) y asset-image42 (p52) → hoy “Por ser
  yo” (Piedra libre, 2001); **p79** es el objetivo de la decisión 17
  (→ “Si me ves volver”, Trillando la fina, 2012, Almafuerte).

## 5. Pliegos, paridad y criterio de canción a doble página

- **Paridad terminal:** 79 es impar → la página 79 se renderiza como hoja
  derecha de [78|79]. No hay bug de página-terminal par en v3 (el fix
  generalizado de v2 en `[n].astro` sigue vigente y es seguro).
- El criterio de que toda canción de dos páginas permanezca en el mismo pliego
  se mantiene y las canciones de doble página siguen en spreads válidos.
- La página en blanco 63 conserva su posición real [62|63] (decisión 14).

## 6. READINGS → BOOK (re-resolución)

`content/readings/readings-v0.3.json` re-resuelto con el nuevo
`tools/re_resolve_readings_after_rebaseline_v3.py` (identidad de contenido:
verbatim completo, primera línea, firma, ordinal para vacías; fail-loud):

> **113 book refs en 33 lecturas re-resueltas, 0 fallos.**

Spot-checks: lectura-si-me-ves-volver→[47]; lectura-se-vos-por-ser-yo→[37,47];
lectura-epilogo-demostracion→[47]; lectura-libertad-de-todos→[38,40,41,42,43,44];
lectura-del-yo-al-nosotros→[17,36,38,40,41,42,43,44].
Reporte en `content/readings/BOOK-LINK-REBASELINE-V3-REPORT.md`.

## 7. Book index (índice editorial)

`data/editorial/book-index.json` actualizado con **verificación de contenido**
sobre el page-model v3 (no corrimiento ciego), 14 entradas:

| entrada | página v2 → v3 |
|---|---|
| ensayo3 | 69 → **70** |
| epilogo | 78 → **79** |
| cierre | 77 → **78** |
| libertad-de-todos | 63 → **64** |
| portada/apertura/dedicatorias/prologo/ensayo1/ensayo2/enajenacion/domesticacion/destruccion/los-nadies | sin cambios (≤62) |

Ninguna entrada cae en la página en blanco 63. JSON validado (todas las páginas
en 1..79).

## 8. Estado final de la re-baseline v3

- ✅ 79 páginas; página 63 nueva en blanco en pliego [62|63].
- ✅ 47 unidades (fusión de v2 revertida).
- ✅ 113 READINGS re-resueltas (0 fallos).
- ✅ book-index actualizado por contenido.
- ✅ source-references 43/43 (regresión corregida).
- ✅ pliegos/spreads y paridad terminal correctos.

**Siguiente:** clasificar e implementar las decisiones 2–20 (diseño editorial)
sobre esta base re-baselineada, y generar el reporte de revisión por página
(pendiente de la especificación de la decisión 21).
