# Deuda técnica documentada — evidencia de READINGS v0.3

**Fecha:** 2026-08-27
**Origen:** detectado durante la re-baseline editorial
(`docs/web/provenance/BOOK-REBASELINE-v0.1.md`), pero **no introducido por ella** — se
verificó explícitamente que ambos hallazgos ya existían idénticos en el
`book-model.json` previo a la re-baseline.
**Estado:** documentado, **no corregido en esta iteración**. `READINGS`,
`CONCEPTS` y `MASTER MAP` permanecen intactos.

---

## 1. `evidence.docx_paragraph_range` desactualizado

**111 referencias** dentro de `readings-v0.3.json[].book_refs[].evidence.docx_paragraph_range`
(en 39 unidades distintas) ya no coinciden con el `docx_paragraph_range`
real de `data/book-model.json`, porque una corrección editorial del DOCX
(fusión de un heading multilínea) desplazó en **-1** el rango interno de
45 de las 47 `BookUnit`.

**Por qué no bloquea nada:** este campo vive dentro de `evidence` —
metadata informativa sobre *cómo* se generó originalmente el vínculo
Reading↔BookUnit — no es una clave de identidad. La clave real,
`book_refs[].book_unit` (un entero 1-47), **no cambió y sigue siendo
100% válida** (verificado: 0 de 33 Readings quedaron con una unidad
inexistente).

**Cuándo corregirlo:** en una futura normalización de READINGS, re-derivar
`evidence.docx_paragraph_range` desde el `book-model.json` vigente para
cada `book_unit` ya referenciado — es una operación mecánica de
actualización de metadata, no requiere reinterpretar ningún Reading.

## 2. `matched_anchors` con 24 casos preexistentes sin coincidencia textual exacta

**24 entradas** de `evidence.matched_anchors` (ej. `"La Estética"` referenciado
desde `reading-estetica-etica-sintesis` contra la unidad 2, que no contiene
ese texto — vive en la unidad 3) no se encuentran literalmente dentro del
texto verbatim de la unidad que dicen anclar.

**Verificación de que no es una regresión:** se comparó explícitamente
contra el `book-model.json` respaldado antes de la re-baseline
(`data/backups/_pre-rebaseline-backup/book-model.json`) y **los mismos 24 casos,
exactamente idénticos, ya existían ahí**. Es un comportamiento heredado del
pipeline original de vinculación READINGS v0.2→v0.3
(`tools/resolve_readings_book_links.py` / `tools/normalize_readings_concepts.py`),
probablemente porque esos anchors se resolvieron originalmente contra
`pdf_pages` cercanas a la unidad, no contra el texto exacto de la unidad
referenciada.

**Cuándo corregirlo:** en una futura normalización, sería razonable decidir
para cada uno de los 24 casos si (a) el anchor pertenece a una unidad
vecina y el `book_unit` debería ajustarse, o (b) el anchor es una
paráfrasis/resumen del Reading y no un texto literal, en cuyo caso el campo
debería re-nombrarse o dejar de exigir coincidencia literal. Es una
decisión editorial, no una corrección mecánica — no debe resolverse
silenciosamente.

---

## Lista completa para referencia futura

Ambas listas quedan preservadas en:
- `data/backups/_pre-rebaseline-backup/book-model-diff-report.txt` (unidades con
  `docx_paragraph_range` desplazado)
- Recomputable en cualquier momento ejecutando el diagnóstico usado durante
   la re-baseline (ver `docs/web/provenance/BOOK-REBASELINE-v0.1.md` §6 para el método
   exacto de verificación).

---

**Regla aplicada:** no se resolvió esta deuda ahora porque no bloquea
ninguna funcionalidad actual (READINGS sigue siendo 100% consumible por la
web) y porque corregirla toca `content/readings/readings-v0.3.json`, un
artefacto que esta sesión tenía instrucción explícita de no modificar. Se
deja como tarea futura, con el diagnóstico ya hecho para que no haya que
re-investigarla desde cero.
