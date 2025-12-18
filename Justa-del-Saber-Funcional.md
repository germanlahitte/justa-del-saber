# Documentación Funcional - Justa del Saber

## Descripción General
Aplicación de escritorio (Electron + React + TypeScript) para gestionar certámenes de trivia, con sistema avanzado de desempate, estadísticas y persistencia local.

## Funcionalidades Principales

### 1. Gestión de Certámenes
- **Creación de certámenes**: Alta de certamen con pasos para nombre, equipos, preguntas y configuración de desempates.
- **Persistencia**: Todos los datos (equipos, preguntas, aproximaciones, certámenes) se guardan automáticamente en el equipo.
- **Recuperación**: Se puede continuar certámenes en progreso o revisar los finalizados.
- **Finalización manual**: Botón "🏁 Finalizar Certamen" disponible en el mapa de preguntas para terminar el certamen en cualquier momento, calculando el podio con las preguntas completadas e iniciando automáticamente el desempate si hay empates.

### 2. Juego y Puntaje
- **Timer de 30 segundos** con alerta a los 10 segundos y controles de pausa/reanudar.
- **Marcador en tiempo real**: Visualización de puntajes y posiciones.
- **Sistema de puntos**: 10 puntos por respuesta correcta.
- **Mapa de preguntas**: Navegación visual del progreso del certamen con indicadores de estado (actual, completada, disputada, bloqueada).
- **Preguntas disputadas**: Sistema para marcar preguntas como disputadas, agregar preguntas de reemplazo del banco, y continuar el certamen de forma ordenada.

### 3. Sistema de Desempate
- **Desempate regular**: 5 preguntas especiales para equipos empatados en el podio.
- **Desempate por aproximación**: Preguntas numéricas para resolver empates persistentes.
- **Detección automática** de empates y gestión independiente para 1°, 2° y 3° puesto.
- **Resolución simultánea**: Todos los grupos compiten con la misma pregunta, pero se calcula por separado.
- **Preguntas disputadas en desempate**: El sistema de disputa funciona también en el desempate regular, permitiendo agregar preguntas de reemplazo sin alterar la dinámica del juego.
- **Conteo dinámico**: El sistema ajusta automáticamente la cantidad total de preguntas según las disputas y reemplazos agregados.

### Respecto del desempate regular: Sistema de Puntaje

- En el desempate regular, **cada equipo participante suma 1 punto por respuesta correcta**.
- Estos puntos se contabilizan en la **tabla general acumulada** (estadísticas históricas), agregando valor a la competición y premiando el esfuerzo en desempates.
- **No afectan el resultado del certamen**: la cantidad máxima de puntos posibles en el desempate es menor a la diferencia mínima que puede haber con posiciones superiores del podio, por lo que no alteran el orden final del certamen.
- Esta regla es una **libertad tomada por el desarrollador** para enriquecer la experiencia y será presentada al comité del Rotary para su consideración.

### Respecto del desempate por aproximación: Criterio de selección de preguntas

- El sistema selecciona automáticamente la pregunta de aproximación **menos utilizada** (menor `usedCount`) del banco.
- **Filtrado por certamen**: Las preguntas ya utilizadas en el certamen actual no se repiten, garantizando variedad en cada desempate.
- Si hay varias con el mismo valor mínimo, se toma la primera disponible.
- Esto garantiza rotación y equidad en el uso de las preguntas.

### Respecto del desempate por aproximación: Reconocimiento con Boomerang

- El **Boomerang** es un distintivo adicional y simpático que se otorga al equipo que obtiene su posición final mediante el desempate por aproximación.
- **No influye en el puntaje** ni en el resultado del certamen, pero sí aparece en la tabla general como reconocimiento especial.
- El espíritu del Boomerang es destacar el mérito de llegar a esta instancia de definición, donde el resultado depende de la precisión y el arrojo, simbolizando una "plegaria" que vuelve con éxito.
- Esta regla es una **libertad tomada por el desarrollador** para enriquecer la experiencia y será presentada al comité del Rotary para su consideración.

### 4. Estadísticas y Tablero General
- **Tabla de posiciones acumuladas**: Medallas, puntos totales, participaciones y promedio.
- **Medallero**: 🥇 oro, 🥈 plata, 🥉 bronce.
- **Boomerangs**: Indica equipos que ganaron posición en desempate por aproximación.
- **Orden multi-criterio**: Medallas > puntos > boomerangs > participaciones.

### 5. Administración de Bancos
- **Equipos**: Alta, edición y eliminación.
- **Preguntas**: Gestión y seguimiento de uso.
- **Aproximaciones**: Banco de preguntas numéricas para desempates.

### 6. Importación/Exportación
- **Exportar**: Descarga de backup completo en JSON.
- **Importar**: Opción de reemplazar o combinar datos existentes.

### 7. Interfaz y Experiencia
- **Branding Rotary Club**: Logo animado y colores institucionales.
- **Botones y diálogos personalizados**: Consistencia visual y textual.
- **Navegación clara**: Acceso rápido a todas las funciones.

## Requisitos Técnicos
- Windows 10/11 (ejecutable portable o instalador)
- No requiere conexión a internet
- Datos almacenados en AppData del usuario

## Flujos Clave

1. **Crear certamen** → Seleccionar equipos y preguntas → Jugar → Resolver desempates → Ver podio → Consultar estadísticas.
2. **Finalización manual** → Durante el certamen, usar el botón "🏁 Finalizar Certamen" → Confirmar en modal → Sistema marca preguntas restantes como completadas → Calcula podio e inicia desempate automáticamente si hay empates.
3. **Gestión de disputas** → Marcar pregunta como disputada → Seleccionar reemplazo del banco → Continuar certamen (funciona tanto en certamen regular como en desempate).
4. **Administrar bancos** → Agregar/editar equipos, preguntas y aproximaciones.
5. **Exportar/Importar** → Compartir datos entre PCs.
6. **Modo de prueba** → Activar desde la pantalla principal → Timer ajustado para ensayar el certamen sin esperas.

## Seguridad y Privacidad
- Los datos se guardan localmente, no se transmiten ni comparten sin exportación explícita.

---

## Licencia

**Creative Commons Reconocimiento-NoComercial 4.0 (CC BY-NC 4.0)**

Esta aplicación es donada al Rotary Club Dolores bajo licencia CC BY-NC 4.0.

**Usted es libre de:**
- Usar la aplicación sin restricciones de tiempo o lugar
- Copiar y distribuir la aplicación en su forma original

**Bajo las siguientes condiciones:**
- **Atribución**: Debe reconocer al autor original (Germán Lahitte)
- **No Comercial**: No puede usar la aplicación para fines comerciales o lucrativos sin autorización explícita

**Más información:**
Para obtener detalles completos de la licencia, visite: https://creativecommons.org/licenses/by-nc/4.0/deed.es

---

## Registro de Documento

| Campo | Valor |
|-------|-------|
| **Elaborado por** | Germán Lahitte - Desarrollador |
| **Contacto** | germanlahitte@gmail.com |
| **Fecha de elaboración** | Diciembre 2025 |
| **Versión del documento** | 2.0 |
| **Versión de la aplicación** | 1.01 (MVP + Ajustes) |
| **Última actualización** | 13/12/2025 |

---
