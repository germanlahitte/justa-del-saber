# Graves decires — CONCEPTS v0.3

**Capa:** FUTURE-ANALYSIS  
**Estado:** normalized-consolidated  
**Origen:** CONCEPTS v0.2 + auditoría contra READINGS v0.2  
**Cantidad:** 32 Concepts

## Cambios de v0.2 a v0.3

- Added Tiempo, Identidad, Memoria and Enajenación as first-class Concepts.
- Removed internal relation targets that were not Concepts (Aislamiento, Representación, Acción).
- Kept the previous 28 Concepts; none were deleted.
- The ontology now has 32 canonical Concepts.

---

## Libertad

**ID:** `concept-libertad`

Capacidad de constituirse como sujeto y conducir la propia vida según un criterio que pueda reconocerse como propio.

**Distinción clave:** Libertad no equivale simplemente a ausencia de prohibición.

**Relaciones**

- `opposes` → Represión
- `requires` → Subjetividad, Discernimiento
- `can_degrade_into` → Individualismo
- `universalizes_as` → Libertad de todos
- `pedagogical_completion` → Emancipación

---

## Represión

**ID:** `concept-represion`

Limitación exterior de la autonomía mediante coerción, prohibición, persecución, disciplinamiento o imposición.

**Distinción clave:** En la represión, el poder todavía necesita ejercerse desde afuera.

**Relaciones**

- `opposes` → Libertad
- `can_produce` → Captura
- `can_evolve_into` → Domesticación

---

## Captura

**ID:** `concept-captura`

Proceso mediante el cual fuerzas externas intervienen no sólo sobre lo que una persona puede hacer, sino también sobre aquello que desea, valora, teme, piensa o considera propio.

**Hipótesis:** Una persona puede experimentar como propia una forma de vida que no construyó libremente.

**Relaciones**

- `deepens` → Represión
- `threatens` → Subjetividad
- `leads_to` → Domesticación
- `resisted_by` → Discernimiento

---

## Domesticación

**ID:** `concept-domesticacion`

Interiorización del mecanismo de dominación hasta el punto en que el sujeto reproduce autónomamente aquello que inicialmente debía imponérsele.

**Hipótesis:** La forma más eficaz de represión es aquella que deja de necesitar al represor.

**Relaciones**

- `culmination_of` → Captura
- `negates` → Autonomía
- `structural_inverse_of` → Emancipación

---

## Subjetividad

**ID:** `concept-subjetividad`

Construcción de una posición propia desde la cual interpretar la experiencia, formular deseos, producir juicios y tomar decisiones.

**Relaciones**

- `enables` → Autonomía
- `requires` → Discernimiento
- `threatened_by` → Captura
- `expressed_as` → Ser uno mismo
- `limited_by` → Falibilidad

---

## Intuición

**ID:** `concept-intuicion`

Percepción inicial de que algo merece ser interrogado aun antes de disponer de una explicación completa.

**Distinción clave:** No reemplaza al pensamiento ni garantiza verdad: lo pone en movimiento.

**Relaciones**

- `initiates` → Discernimiento
- `feeds` → Subjetividad

---

## Discernimiento

**ID:** `concept-discernimiento`

Capacidad de someter aquello que se recibe —ideas, tradiciones, discursos, valores, prejuicios y experiencias— a juicio antes de hacerlo propio.

**Fórmula:** No simplemente heredar: saber heredar.

**Relaciones**

- `protects_from` → Captura
- `builds` → Subjetividad
- `transforms` → Herencia
- `enables` → Autonomía
- `supports` → Integridad

---

## Herencia

**ID:** `concept-herencia`

Conjunto de lenguajes, valores, historias, tradiciones, pertenencias y experiencias recibidas de quienes nos precedieron.

**Distinción clave:** Recibir no equivale a heredar plenamente.

**Relaciones**

- `requires` → Discernimiento
- `projects_forward_through` → Transmisión
- `can_become` → Nueva voz

---

## Autonomía / Ser uno mismo

**ID:** `concept-autonomia`

Capacidad de asumir una posición propia y conducir la propia existencia sin delegar en otro la tarea de determinar quién se debe ser.

**Distinción clave:** Autonomía no equivale a individualismo.

**Relaciones**

- `arises_from` → Subjetividad
- `requires` → Discernimiento
- `realizes` → Libertad
- `can_degrade_into` → Individualismo
- `opens_to` → El Otro
- `stabilized_by` → Integridad

---

## Individualismo

**ID:** `concept-individualismo`

Reducción de la libertad al ámbito del individuo, considerando secundarias o irrelevantes las condiciones en las que los demás pueden ejercer la suya.

**Relaciones**

- `possible_deviation_of` → Autonomía
- `ignores` → El Otro
- `tensions_with` → Comunidad
- `prevents` → Libertad de todos

---

## El Otro

**ID:** `concept-otro`

Reconocimiento de que fuera del yo existen otros sujetos cuyos deseos, sufrimientos, libertades y proyectos poseen dignidad propia.

**Relaciones**

- `limits` → Individualismo
- `enables` → Amor
- `grounds` → Comunidad
- `universalizes` → Libertad

---

## Los Nadies

**ID:** `concept-los-nadies`

Categoría interpretativa que reúne a quienes aparecen desplazados, invisibilizados, descartados o fuera de los relatos dominantes.

**Función:** Obliga a que la libertad abandone la abstracción y confronte existencias concretas.

**Relaciones**

- `embodies` → El Otro
- `interpellates` → Libertad
- `leads_to` → Amor
- `belongs_to` → Comunidad

---

## Amor

**ID:** `concept-amor`

Movimiento mediante el cual el sujeto sale de la clausura sobre sí mismo y reconoce activamente la existencia del otro.

**Distinción clave:** No se reduce a sentimiento romántico; puede ser práctica, búsqueda y disposición activa.

**Relaciones**

- `presupposes` → El Otro
- `combats` → Individualismo
- `grounds_ethically` → Comunidad
- `leads_to` → Libertad de todos
- `requires` → Integridad

---

## Comunidad

**ID:** `concept-comunidad`

Trama de relaciones mediante la cual individuos diferentes pueden reconocerse, organizarse, cooperar, disputar intereses y hacerse responsables de un mundo compartido.

**Relaciones**

- `requires` → El Otro
- `sustained_by` → Organización
- `gives_content_to` → Democracia
- `can_expand_as` → Patria

---

## Organización

**ID:** `concept-organizacion`

Conversión de vínculos sociales dispersos en formas relativamente estables de acción colectiva.

**Hipótesis:** Cuando desaparecen las organizaciones sociales no desaparecen necesariamente los cargos: desaparecen los mecanismos sociales capaces de producir dirigentes y representación.

**Relaciones**

- `structures` → Comunidad
- `forms_subjects_for` → Democracia

**Nota de modelado:** Aislamiento and Representación remain analytically useful terms, but are treated as facets rather than first-class Concepts.

---

## Democracia

**ID:** `concept-democracia`

Forma de organización política cuya vitalidad depende no sólo del voto y las instituciones formales, sino de la capacidad efectiva de una sociedad para organizarse, deliberar, producir representación y reconocer la libertad de sus integrantes.

**Relaciones**

- `requires` → Organización
- `politically_expresses` → Comunidad
- `institutionalizes` → Libertad de todos

---

## Patria

**ID:** `concept-patria`

Pertenencia histórica y comunitaria que vincula al sujeto con aquello que recibió, con quienes comparten su presente y con quienes habitarán después.

**Fórmula:** Esto es mío → esto también está a mi cargo.

**Relaciones**

- `received_as` → Herencia
- `requires` → Discernimiento
- `expands` → Comunidad
- `generates` → Responsabilidad
- `projects_through` → Transmisión

---

## Responsabilidad

**ID:** `concept-responsabilidad`

Consecuencia ética del reconocimiento de que la propia acción afecta un mundo compartido y a personas cuya existencia no puede considerarse indiferente.

**Relaciones**

- `arises_from` → El Otro
- `transforms` → Patria
- `sustains` → Comunidad
- `orients` → Transmisión
- `expresses` → Integridad

---

## Libertad de todos

**ID:** `concept-libertad-de-todos`

Universalización de la pretensión de libertad: aquello que reclamo legítimamente para mí debo poder reconocer también en los demás.

**Hipótesis:** Una libertad que sólo puede realizarse para algunos a costa de otros deja de funcionar como principio universal y se convierte en privilegio.

**Relaciones**

- `universalizes` → Libertad
- `requires` → El Otro, Comunidad
- `horizon_for` → Democracia

---

## Transmisión

**ID:** `concept-transmision`

Acto mediante el cual una experiencia, una verdad, una memoria o una razón es ofrecida a otro sin exigir que sea reproducida intacta.

**Distinción clave:** Transmitir no es imponer.

**Relaciones**

- `projects` → Herencia
- `requires` → Responsabilidad
- `must_allow` → Discernimiento
- `completes_in` → Emancipación

---

## Emancipación

**ID:** `concept-emancipacion`

Proceso mediante el cual alguien adquiere capacidad suficiente para pensar, juzgar y actuar sin permanecer subordinado a quien contribuyó a su formación.

**Hipótesis:** La forma más lograda de emancipación es aquella que deja de necesitar al emancipador.

**Fórmula:** Para ser vos no me necesitás a mí.

**Relaciones**

- `completes` → Transmisión
- `realizes` → Autonomía
- `structural_inverse_of` → Domesticación
- `requires` → Integridad

---

## Integridad

**ID:** `concept-integridad`

Condición de un sujeto que procura ser entero: no delega en una autoridad, una pareja, un ídolo, una ideología o una comunidad la tarea de completarlo; y busca correspondencia entre aquello que reconoce como verdadero, aquello que expresa y la forma en que procura vivir.

**Distinciones clave**
- Integridad no equivale a aislamiento.
- Integridad no equivale a coherencia perfecta.
- Necesitar vínculos no equivale a necesitar que otro me complete.

**Dimensiones**
- Integridad ontológica: reconocerse entero; no necesitar algo externo para constituirse como sujeto completo.
- Integridad ética: procurar correspondencia entre verdad, palabra y acción.

**Fórmula:** Ser íntegro es hacerse responsable de ser uno mismo.

**Relaciones**

- `requires` → Discernimiento
- `orients` → Autonomía
- `relates_to` → Verdad
- `admits` → Falibilidad / Contradicción
- `demands` → Responsabilidad
- `supports` → Transmisión
- `enables_non_dependent` → Amor
- `condition_for` → Emancipación

**Nota de modelado:** Acción remains part of the ethical definition of Integridad, but is not modeled as a standalone Concept.

---

## Verdad

**ID:** `concept-verdad`

Aquello que el sujeto reconoce, después de su experiencia y discernimiento, como digno de ser sostenido, expresado o transmitido.

**Fórmula:** La verdad es aquello que reconozco; la integridad es lo que estoy dispuesto a hacer con ello.

**Nota de alcance:** No pretende resolver una teoría filosófica de la verdad; describe el uso recurrente de verdad, razón y mis verdades dentro del corpus.

**Relaciones**

- `examined_through` → Discernimiento
- `demands` → Integridad
- `offered_through` → Transmisión
- `can_exceed_individual_through` → Trascendencia

---

## Falibilidad / Contradicción

**ID:** `concept-falibilidad`

Reconocimiento de que ninguna conquista subjetiva, ética o intelectual vuelve al individuo definitivamente coherente con aquello que alguna vez comprendió o defendió.

**Función:** Evita convertir a Iorio en autoridad moral infalible y permite separar la validez posible de una idea de la conducta posterior de quien la formuló.

**Relaciones**

- `tests` → Integridad
- `requires` → Discernimiento
- `prepares` → Retirada

---

## Legado

**ID:** `concept-legado`

Aquello que permanece disponible para otros después de que quien lo produjo deja de estar presente.

**Relaciones**

- `results_from` → Transmisión
- `becomes` → Herencia
- `enables` → Nueva voz

---

## Trascendencia

**ID:** `concept-trascendencia`

Posibilidad de que aquello que un individuo encontró o expresó continúe más allá de su existencia particular.

**Lectura asociada:** La verdad no sobrevive porque pertenezca al autor; puede sobrevivir precisamente porque nunca le perteneció enteramente.

**Relaciones**

- `crosses` → Legado
- `feeds` → Herencia
- `enables` → Nueva voz

---

## Retirada

**ID:** `concept-retirada`

Renuncia del transmisor a ocupar indefinidamente el lugar de autoridad, referencia o respuesta para quienes recibieron su obra.

**Fórmula:** Ya dije → ya entregué → no me esperes → seguí.

**Relaciones**

- `recognizes` → Falibilidad
- `completes` → Emancipación
- `releases_toward` → Nueva voz

---

## Nueva voz

**ID:** `concept-nueva-voz`

Aparición de una expresión propia producida por quien recibió una herencia pero no se limitó a repetirla.

**Función en el libro:** El epílogo realiza narrativamente este concepto: la última voz ya no es la de Iorio, sino la de quien recibió, discernió y escribió.

**Relaciones**

- `receives` → Legado
- `exercises` → Discernimiento
- `demonstrates` → Emancipación
- `produces_new` → Transmisión

---

## Tiempo

**ID:** `concept-tiempo`

Dimensión existencial en la que el sujeto puede pensar, experimentar, recordar, decidir y construir una vida propia; por eso su apropiación o confiscación tiene consecuencias directas sobre la subjetividad.

**Distinción clave:** No se modela sólo como duración cronológica, sino como tiempo disponible para constituirse como sujeto.

**Relaciones**

- `conditions` → Subjetividad, Discernimiento
- `can_be_captured_by` → Captura, Domesticación
- `reveals` → Falibilidad / Contradicción
- `opens_to` → Trascendencia

---

## Identidad

**ID:** `concept-identidad`

Forma histórica y revisable mediante la cual un sujeto se reconoce como alguien y organiza continuidades entre experiencia, pertenencias, herencia y elección.

**Distinción clave:** Identidad no equivale a esencia fija: puede recibirse, construirse, disputarse, deformarse y revisarse.

**Relaciones**

- `built_through` → Subjetividad, Discernimiento
- `receives_material_from` → Herencia
- `threatened_by` → Captura, Domesticación
- `oriented_by` → Integridad

---

## Memoria

**ID:** `concept-memoria`

Conservación activa de una experiencia personal o colectiva que impide que lo vivido desaparezca sin dejar huella y vuelve posible su transmisión.

**Distinción clave:** Recordar no es sólo retener datos: puede ser una responsabilidad frente al olvido y frente a quienes vienen después.

**Relaciones**

- `feeds` → Herencia
- `enables` → Transmisión
- `demands` → Responsabilidad
- `can_become` → Legado

---

## Enajenación

**ID:** `concept-enajenacion`

Separación del sujeto respecto de su propio tiempo, trabajo, deseo, juicio o experiencia, hasta vivir bajo criterios y ritmos que reconoce como normales aunque no haya construido libremente.

**Distinción clave:** No es sinónimo de individualismo: puede coexistir con él e incluso ayudar a producir individuos aislados pero profundamente modelados.

**Relaciones**

- `can_result_from` → Captura, Domesticación
- `weakens` → Subjetividad, Autonomía
- `can_coexist_with` → Individualismo
- `resisted_by` → Discernimiento, Integridad

---
