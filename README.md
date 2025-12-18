# Aplicación de Trivia Desktop

Aplicación de escritorio desarrollada con Electron, React y TypeScript para gestionar certámenes de trivia con temporizador y marcador en tiempo real.

## Características

### Gestión de Bancos
- ✅ **Banco de Equipos**: Crea y administra equipos con persistencia local
- ✅ **Banco de Preguntas**: Gestiona preguntas regulares con 4 opciones (A, B, C, D)
- ✅ **Banco de Aproximación**: Preguntas numéricas para desempates finales

### Certámenes
- ✅ **Asistente de Creación**: Wizard paso a paso para configurar certámenes
- ✅ **Persistencia**: Guarda y recupera certámenes automáticamente
- ⏱️ **Temporizador de 30 segundos**: Con alerta sonora a los 10 segundos restantes
- 🏆 **Marcador en Tiempo Real**: Visualiza los puntajes ordenados por ranking
- 📊 **Sistema de Puntuación**: 10 puntos por respuesta correcta
- 🎮 **Navegación de Preguntas**: Controles de avance y retroceso

### Sistema de Desempates
- � **Desempate Regular**: 5 preguntas especiales para resolver empates por posiciones
- 🎲 **Desempate por Aproximación**: Preguntas numéricas para desempates finales
- ⚖️ **Resolución Simultánea**: Todos los empates se resuelven con la misma pregunta
- 🏅 **Grupos Independientes**: Cada posición (1°, 2°, 3°) se computa por separado

### Estadísticas
- 📊 **Tabla General**: Acumula estadísticas de todos los certámenes finalizados
- 🥇 **Medallas**: Oro (1er puesto), Plata (2do), Bronce (3ro)
- 📈 **Métricas**: Puntos totales, participaciones, promedio de puntos por certamen

## Estructura del Proyecto

```
trivia-app/
├── src/
│   ├── main/                          # Proceso principal de Electron
│   │   ├── main.ts                    # Punto de entrada de Electron
│   │   └── preload.ts                 # Script de precarga
│   └── renderer/                      # Interfaz de React
│       ├── components/                # Componentes de React
│       │   ├── HomePage.tsx           # Pantalla principal con navegación
│       │   ├── TeamBankManager.tsx    # Gestión del banco de equipos
│       │   ├── QuestionBankManager.tsx # Gestión del banco de preguntas
│       │   ├── ApproximationBankManager.tsx # Gestión de preguntas de aproximación
│       │   ├── ContestWizard.tsx      # Asistente de creación de certámenes
│       │   ├── ContestManager.tsx     # Vista de certámenes guardados
│       │   ├── GameHome.tsx           # Pantalla principal del certamen en curso
│       │   ├── QuestionDisplay.tsx    # Visualización de preguntas y timer
│       │   ├── Scoreboard.tsx         # Marcador de equipos
│       │   ├── TeamScoring.tsx        # Panel de puntuación por equipo
│       │   ├── TieBreakGame.tsx       # Desempate regular
│       │   ├── ApproximationQuestionDisplay.tsx # Desempate por aproximación
│       │   ├── ApproximationScoringInput.tsx    # Entrada de respuestas numéricas
│       │   ├── ApproximationResultsDisplay.tsx  # Resultados de aproximación
│       │   ├── GeneralStandings.tsx   # Tabla general de estadísticas
│       │   └── Podium.tsx             # Podio final
│       ├── utils/
│       │   └── tieBreakUtils.ts       # Utilidades para detección de empates
│       ├── App.tsx                    # Componente principal y routing
│       ├── main.tsx                   # Punto de entrada de React
│       └── index.css                  # Estilos globales
├── dist/                              # Archivos compilados
├── package.json                       # Dependencias y scripts
└── README.md                          # Este archivo
```

## Requisitos

- Node.js 18 o superior
- npm 9 o superior

## Instalación

1. Clona o descarga este proyecto
2. Abre una terminal en la carpeta del proyecto
3. Instala las dependencias:

```bash
npm install
```

## Uso

### Modo Desarrollo

Para ejecutar la aplicación en modo desarrollo:

```bash
npm run dev
```

### Modo Producción

Para ejecutar la aplicación compilada:

```bash
npm start
```

O usa la tarea de VS Code: presiona `Ctrl+Shift+B` y selecciona "Run Trivia App"

### Compilar

Para compilar el proyecto:

```bash
npm run build
```

### Empaquetar

Para crear un instalador de la aplicación:

```bash
npm run package
```

## Flujo de Uso

### 1. Preparación

**Crear Bancos de Datos:**
1. **Equipos**: Desde la página principal, accede a "Equipos" y agrega todos los equipos que participarán
2. **Preguntas**: Crea preguntas regulares con 4 opciones (A, B, C, D) y marca la correcta
3. **Aproximación**: Crea preguntas numéricas para desempates finales (ej: "¿Cuántos metros mide...?")

### 2. Crear Certamen

Usa el **Asistente de Creación** (wizard) que guía paso a paso:
1. **Nombre**: Define el nombre del certamen
2. **Equipos**: Selecciona los equipos participantes del banco
3. **Preguntas**: Selecciona las preguntas para el certamen
4. **Desempate**: (Opcional) Configura preguntas de desempate regular
5. **Iniciar**: El certamen se guarda automáticamente y comienza

### 3. Durante el Certamen

La pantalla se divide en dos paneles:

**Panel Izquierdo (Pregunta):**
- Visualiza la pregunta actual con sus 4 opciones
- **Timer de 30 segundos** con controles Iniciar/Pausar/Reiniciar
- Alerta sonora (campana) a los 10 segundos restantes
- Botón para revelar/ocultar la respuesta correcta
- Navegación: Anterior/Siguiente pregunta

**Panel Derecho (Marcador):**
- Muestra todos los equipos ordenados por puntaje descendente
- Actualización en tiempo real del ranking

**Mecánica de Juego:**
1. El moderador muestra la pregunta
2. Inicia el temporizador (30 segundos)
3. Suena la campana a los 10 segundos
4. Al terminar, los equipos muestran sus respuestas (paletas A, B, C, D)
5. El moderador otorga +10 puntos a los que acertaron
6. Continúa con la siguiente pregunta

### 4. Sistema de Desempates

**Detección Automática:**
- Al finalizar todas las preguntas, el sistema detecta empates en las primeras 3 posiciones
- Si hay empates, inicia el **Desempate Regular**

**Desempate Regular:**
- 5 preguntas especiales de desempate
- Solo participan los equipos empatados
- Timer y controles iguales al certamen regular
- Al finalizar, si persisten empates, pasa a **Desempate por Aproximación**

**Desempate por Aproximación:**
- Detecta grupos de empate por separado (ej: empate por 1° y empate por 3°)
- Todos los grupos responden **la misma pregunta simultáneamente**
- Cada grupo se computa de forma independiente
- Preguntas numéricas: los equipos dan una respuesta numérica
- Gana quien se aproxime más al valor correcto
- Si persisten empates, continúa con más preguntas
- Timer y controles unificados con el resto del certamen

**Flujo de Resolución:**
```
Certamen → Empates detectados → Desempate Regular (5 preguntas)
    ↓
¿Empates resueltos? 
    ├─ Sí → Podio Final
    └─ No → Desempate por Aproximación
         ├─ Misma pregunta para todos los grupos
         ├─ Cómputo independiente por posición
         └─ Repite hasta resolver → Podio Final
```

### 5. Resultados y Estadísticas

**Podio Final:**
- Muestra los 3 primeros lugares con medallas (🥇🥈🥉)
- Incluye puntajes totales (certamen + desempates)

**Tabla General:**
- Accede desde la página principal a "Tabla General"
- Acumula estadísticas de **todos** los certámenes finalizados
- Métricas por equipo:
  - 🥇 Oros (1ros puestos)
  - 🥈 Platas (2dos puestos)
  - 🥉 Bronces (3ros puestos)
  - 📊 Puntos totales acumulados
  - 🎯 Participaciones (cantidad de certámenes)
  - 📈 Promedio de puntos por certamen
- Ordenamiento: Oro > Plata > Bronce > Puntos totales

## Tecnologías Utilizadas

- **Electron 28**: Framework para aplicaciones de escritorio
- **React 18**: Biblioteca de interfaz de usuario
- **TypeScript 5**: Tipado estático para JavaScript
- **Vite 5**: Herramienta de construcción rápida
- **Web Audio API**: Para generar el sonido de la campana

## Scripts Disponibles

- `npm start`: Ejecuta la aplicación en modo producción
- `npm run dev`: Ejecuta en modo desarrollo con hot-reload
- `npm run build`: Compila el proyecto
- `npm run package`: Crea el instalador de la aplicación

## Almacenamiento Local

La aplicación usa `localStorage` para persistir:
- **teamBank**: Banco de equipos
- **questionBank**: Banco de preguntas regulares
- **approximationBank**: Banco de preguntas de aproximación
- **savedContests**: Certámenes guardados (en curso y finalizados)

Los datos se mantienen entre sesiones sin necesidad de base de datos externa.

## Personalización

### Modificar el tiempo del temporizador

Edita `src/renderer/components/QuestionDisplay.tsx` y cambia el valor inicial:

```typescript
const INITIAL_TIME = 30; // Cambia 30 por el valor deseado en segundos
const BELL_TIME = 10; // Momento en que suena la alerta
```

### Modificar los puntos por respuesta correcta

Busca en `src/renderer/App.tsx` la constante `POINTS_PER_CORRECT`:

```typescript
const POINTS_PER_CORRECT = 10; // Cambia 10 por el valor deseado
```

### Cambiar colores del tema

Edita `src/renderer/index.css` para ajustar el esquema de colores:

```css
:root {
  --primary: #e94560;    /* Color principal (rojo/rosa) */
  --secondary: #0f3460;  /* Color secundario (azul oscuro) */
  --background: #1a1a2e; /* Fondo principal */
  --surface: #16213e;    /* Fondo de tarjetas */
}
```

## Problemas Conocidos

### Input del Asistente No Responde

**Síntoma:** Después de eliminar todos los certámenes guardados, al hacer clic en "Crear Primer Certamen", el campo de texto para ingresar el nombre del certamen puede no responder durante algunos segundos.

**Causa:** Este es un problema de renderizado de Electron relacionado con ciertos drivers de GPU y configuraciones de hardware. No puede ser resuelto a nivel de código React/JavaScript.

**Solución temporal:** 
- Minimiza y maximiza la ventana de la aplicación
- Esto fuerza a Electron a redibujar completamente la interfaz
- El input responderá normalmente después de este paso

Este problema no afecta la funcionalidad general de la aplicación y solo ocurre en esta situación específica.

## Licencia

MIT

## Autor

germen

Desarrollado como herramienta de apoyo para certámenes de trivia
