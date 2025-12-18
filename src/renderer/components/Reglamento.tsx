import React from 'react';
import './Reglamento.css';

interface Props {
  onBack: () => void;
}

function Reglamento({ onBack }: Props) {
  return (
    <div className="reglamento-page">
      <div className="reglamento-header">
        <button onClick={onBack} className="back-button">
          🏠 Volver al Inicio
        </button>
        <h1>📖 Reglamento Oficial - Justa del Saber</h1>
      </div>

      <div className="reglamento-content">
        <section className="reglamento-section">
          <h2>1. Objetivo del Certamen</h2>
          <p>La Justa del Saber es una competencia de conocimientos generales donde los equipos responden preguntas para acumular puntos y alcanzar las primeras posiciones del podio.</p>
        </section>

        <section className="reglamento-section">
          <h2>2. Conformación de Equipos</h2>
          <ul>
            <li>Cada certamen cuenta con equipos participantes previamente registrados.</li>
            <li>Los equipos compiten de forma simultánea en cada ronda de preguntas.</li>
            <li>No hay límite en la cantidad de equipos participantes por certamen.</li>
            <li>Cada equipo estará conformado por tres integrantes.</li>
            <li>Durante los intervalos y entre jornadas, los equipos pueden realizar cambios de sus integrantes respetando el plantel inscripto.</li>
          </ul>
        </section>

        <section className="reglamento-section">
          <h2>3. Dinámica del Juego</h2>
          
          <h3>3.1 Preguntas Regulares</h3>
          <ul>
            <li>Cada pregunta tiene un <strong>tiempo límite de 30 segundos</strong>.</li>
            <li>Se emite una <strong>alerta sonora a los 10 segundos</strong> restantes.</li>
            <li>Cada <strong>respuesta correcta suma 10 puntos</strong> al equipo que levante la paleta con la opción correcta al cumplirse el tiempo límite.</li>
          </ul>

          <h3>3.2 Preguntas Disputadas</h3>
          <ul>
            <li>Si una pregunta es <strong>objetada o disputada</strong>, el jurado puede marcarla como tal si todos los equipos participantes están de acuerdo.</li>
            <li>Una pregunta disputada <strong>no suma puntos</strong> a ningún equipo.</li>
            <li>Se podrá seleccionar una <strong>pregunta de reemplazo</strong> del banco disponible.</li>
            <li>La pregunta de reemplazo se juega como una pregunta regular.</li>
            <li>Este sistema funciona tanto en el <strong>certamen regular</strong> como en el <strong>desempate</strong>.</li>
          </ul>
        </section>

        <section className="reglamento-section">
          <h2>4. Finalización del Certamen</h2>
          
          <h3>4.1 Finalización Natural</h3>
          <ul>
            <li>El certamen termina cuando se completan todas las preguntas programadas.</li>
            <li>Se calculan los puntajes finales y se determina el podio.</li>
          </ul>

          <h3>4.2 Finalización Manual</h3>
          <ul>
            <li>El moderador puede finalizar el certamen en cualquier momento.</li>
            <li>Al confirmar la finalización:
              <ul>
                <li>Las preguntas no jugadas se marcan como completadas sin puntos.</li>
                <li>Se calcula el podio con los resultados hasta ese momento.</li>
                <li>Si hay empates en el podio, se inicia automáticamente el desempate.</li>
              </ul>
            </li>
          </ul>
        </section>

        <section className="reglamento-section">
          <h2>5. Sistema de Desempate</h2>
          
          <h3>5.1 Detección de Empates</h3>
          <ul>
            <li>El sistema detecta automáticamente empates en las <strong>posiciones de podio</strong> (1°, 2° y 3°).</li>
            <li>Los empates se resuelven de forma <strong>simultánea e independiente por posición</strong>.</li>
          </ul>

          <h3>5.2 Desempate Regular (5 Preguntas)</h3>
          <ul>
            <li>Se juegan <strong>5 preguntas especiales de desempate</strong>.</li>
            <li>Solo participan los equipos empatados en cada grupo.</li>
            <li>Cada <strong>respuesta correcta suma 1 punto</strong> en el desempate.</li>
            <li>El desempate continúa hasta completar todas las preguntas (incluyendo reemplazos) mientras ningún equipo alcance la diferencia suficiente.</li>
          </ul>

          <h3>5.3 Puntaje del Desempate Regular</h3>
          <ul>
            <li>Los puntos del desempate regular <strong>se suman a la tabla general acumulada</strong>.</li>
            <li><strong>No afectan el resultado del certamen actual</strong> (el puntaje máximo del desempate es menor que la diferencia mínima entre posiciones del podio).</li>
            <li>Este sistema premia el esfuerzo en los desempates y enriquece las estadísticas históricas.</li>
          </ul>

          <h3>5.4 Desempate por Aproximación</h3>
          <ul>
            <li>Si persiste el empate después de las 5 preguntas, se activa el <strong>desempate por aproximación</strong>.</li>
            <li>Se utiliza una <strong>pregunta numérica</strong> donde los equipos deben aproximarse al valor correcto.</li>
            <li>El equipo cuya respuesta esté <strong>más cerca del valor real</strong> gana la posición.</li>
            <li>Los grupos de desempate compiten con la <strong>misma pregunta simultáneamente</strong>, pero se calculan por separado.</li>
            <li>Las preguntas de aproximación <strong>no se repiten</strong> dentro del mismo certamen.</li>
          </ul>

          <h3>5.5 Criterio de Selección de Preguntas de Aproximación</h3>
          <ul>
            <li>Se selecciona automáticamente la pregunta <strong>menos utilizada</strong> del banco (menor contador de uso).</li>
            <li>Se excluyen las preguntas ya usadas en el certamen actual.</li>
            <li>Esto garantiza equidad y rotación de preguntas.</li>
          </ul>

          <h3>5.6 Reconocimiento Boomerang 🪃</h3>
          <ul>
            <li>Los equipos que obtienen su posición final mediante <strong>desempate por aproximación</strong> reciben un distintivo especial: el <strong>Boomerang</strong>.</li>
            <li>El Boomerang <strong>no afecta el puntaje ni el resultado</strong>, pero aparece en la tabla general como reconocimiento.</li>
            <li>Simboliza el mérito de llegar a esta instancia de definición, donde el resultado depende de la precisión y el arrojo.</li>
          </ul>
        </section>

        <section className="reglamento-section">
          <h2>6. Podio y Resultados</h2>
          <ul>
            <li>El podio está compuesto por las <strong>tres primeras posiciones</strong>.</li>
            <li>Se otorgan medallas: 🥇 Oro (1°), 🥈 Plata (2°), 🥉 Bronce (3°).</li>
            <li>Los resultados se registran en la tabla general acumulada.</li>
          </ul>
        </section>

        <section className="reglamento-section">
          <h2>7. Tabla General Acumulada</h2>
          
          <h3>7.1 Estadísticas</h3>
          <ul>
            <li><strong>Medallas</strong>: Total de oros, platas y bronces obtenidos.</li>
            <li><strong>Puntos totales</strong>: Suma de todos los puntos en certámenes completados.</li>
            <li><strong>Boomerangs</strong>: Cantidad de posiciones ganadas por aproximación.</li>
            <li><strong>Participaciones</strong>: Cantidad de certámenes jugados.</li>
            <li><strong>Promedio</strong>: Puntos totales dividido por participaciones.</li>
          </ul>

          <h3>7.2 Orden de Clasificación</h3>
          <ol>
            <li><strong>Medallas</strong> (se compara oro, luego plata, luego bronce)</li>
            <li><strong>Puntos totales</strong></li>
            <li><strong>Boomerangs</strong></li>
            <li><strong>Promedio de puntos</strong></li>
            <li><strong>Participaciones</strong> (desempate final)</li>
          </ol>
        </section>

        <section className="reglamento-section">
          <h2>8. Modo de Prueba</h2>
          <ul>
            <li>Disponible para ensayar certámenes sin afectar estadísticas.</li>
            <li>El timer se reduce significativamente para agilizar las pruebas.</li>
            <li>Los resultados <strong>no se contabilizan</strong> en la tabla general.</li>
          </ul>
        </section>

        <section className="reglamento-section">
          <h2>9. Administración</h2>
          
          <h3>9.1 Bancos de Datos</h3>
          <ul>
            <li><strong>Banco de Equipos</strong>: Lista de equipos registrados.</li>
            <li><strong>Banco de Preguntas</strong>: Preguntas regulares y de desempate con contador de uso.</li>
            <li><strong>Banco de Aproximaciones</strong>: Preguntas numéricas con contador de uso.</li>
          </ul>

          <h3>9.2 Persistencia</h3>
          <ul>
            <li>Todos los datos se guardan automáticamente en el equipo local.</li>
            <li>Los certámenes en progreso pueden ser retomados.</li>
            <li>Los certámenes completados permanecen en el historial.</li>
          </ul>

          <h3>9.3 Exportación e Importación</h3>
          <ul>
            <li>Permite crear <strong>backups completos</strong> en formato JSON.</li>
            <li>Al importar se puede <strong>combinar</strong> con datos existentes o <strong>reemplazar</strong> todo.</li>
          </ul>
        </section>

        <section className="reglamento-section">
          <h2>10. Responsabilidades del Moderador</h2>
          <ul>
            <li>Leer las preguntas y opciones en voz alta.</li>
            <li>Gestionar el timer (pausar/reanudar según necesidad).</li>
            <li>Registrar las respuestas correctas de cada equipo.</li>
            <li>Marcar preguntas como disputadas si corresponde.</li>
            <li>Seleccionar preguntas de reemplazo cuando sea necesario.</li>
            <li>Decidir cuándo finalizar manualmente el certamen (si aplica).</li>
          </ul>
        </section>

        <section className="reglamento-section">
          <h2>11. Normas de Conducta</h2>
          <ul>
            <li>Respetar los tiempos establecidos.</li>
            <li>Aceptar las decisiones del moderador.</li>
            <li>Valorar el conocimiento y el esfuerzo de todos los participantes.</li>
            <li>Mantener un ambiente de sana competencia y camaradería.</li>
          </ul>
        </section>

        <div className="reglamento-note">
          <p><strong>Nota:</strong> Las reglas referentes a la suma de puntos en el desempate regular y el reconocimiento Boomerang son propuestas del desarrollador para enriquecer la experiencia del certamen y serán presentadas al comité del Rotary Club para su consideración y aprobación oficial.</p>
        </div>
      </div>
    </div>
  );
}

export default Reglamento;
