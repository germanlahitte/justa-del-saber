import React from 'react';
import './DocumentacionFuncional.css';

interface Props {
  onBack: () => void;
}

function DocumentacionFuncional({ onBack }: Props) {
  return (
    <div className="docs-page">
      <div className="docs-header">
        <button onClick={onBack} className="back-button">
          🏠 Volver al Inicio
        </button>
        <h1>📝 Documentación Funcional - Justa del Saber</h1>
      </div>

      <div className="docs-content">
        <section className="docs-section intro">
          <h2>Descripción General</h2>
          <p>Aplicación de escritorio (Electron + React + TypeScript) para gestionar certámenes de trivia, con sistema avanzado de desempate, estadísticas y persistencia local.</p>
        </section>

        <section className="docs-section">
          <h2>🎯 Funcionalidades Principales</h2>

          <div className="feature-card">
            <h3>1. Gestión de Certámenes</h3>
            <ul>
              <li><strong>Creación de certámenes</strong>: Alta de certamen con pasos para nombre, equipos, preguntas y configuración de desempates.</li>
              <li><strong>Persistencia</strong>: Todos los datos (equipos, preguntas, aproximaciones, certámenes) se guardan automáticamente en el equipo.</li>
              <li><strong>Recuperación</strong>: Se puede continuar certámenes en progreso o revisar los finalizados.</li>
              <li><strong>Finalización manual</strong>: Botón "🏁 Finalizar Certamen" disponible en el mapa de preguntas para terminar el certamen en cualquier momento, calculando el podio con las preguntas completadas e iniciando automáticamente el desempate si hay empates.</li>
            </ul>
          </div>

          <div className="feature-card">
            <h3>2. Juego y Puntaje</h3>
            <ul>
              <li><strong>Timer de 30 segundos</strong> con alerta a los 10 segundos y controles de pausa/reanudar.</li>
              <li><strong>Marcador en tiempo real</strong>: Visualización de puntajes y posiciones.</li>
              <li><strong>Sistema de puntos</strong>: 10 puntos por respuesta correcta.</li>
              <li><strong>Mapa de preguntas</strong>: Navegación visual del progreso del certamen con indicadores de estado (actual, completada, disputada, bloqueada).</li>
              <li><strong>Preguntas disputadas</strong>: Sistema para marcar preguntas como disputadas, agregar preguntas de reemplazo del banco, y continuar el certamen de forma ordenada.</li>
            </ul>
          </div>

          <div className="feature-card">
            <h3>3. Sistema de Desempate</h3>
            <ul>
              <li><strong>Desempate regular</strong>: 5 preguntas especiales para equipos empatados en el podio.</li>
              <li><strong>Desempate por aproximación</strong>: Preguntas numéricas para resolver empates persistentes.</li>
              <li><strong>Detección automática</strong> de empates y gestión independiente para 1°, 2° y 3° puesto.</li>
              <li><strong>Resolución simultánea</strong>: Todos los grupos compiten con la misma pregunta, pero se calcula por separado.</li>
              <li><strong>Preguntas disputadas en desempate</strong>: El sistema de disputa funciona también en el desempate regular, permitiendo agregar preguntas de reemplazo sin alterar la dinámica del juego.</li>
              <li><strong>Conteo dinámico</strong>: El sistema ajusta automáticamente la cantidad total de preguntas según las disputas y reemplazos agregados.</li>
            </ul>
          </div>

          <div className="feature-card highlight">
            <h3>Respecto del desempate regular: Sistema de Puntaje</h3>
            <ul>
              <li>En el desempate regular, <strong>cada equipo participante suma 1 punto por respuesta correcta</strong>.</li>
              <li>Estos puntos se contabilizan en la <strong>tabla general acumulada</strong> (estadísticas históricas), agregando valor a la competición y premiando el esfuerzo en desempates.</li>
              <li><strong>No afectan el resultado del certamen</strong>: la cantidad máxima de puntos posibles en el desempate es menor a la diferencia mínima que puede haber con posiciones superiores del podio, por lo que no alteran el orden final del certamen.</li>
              <li className="note">Esta regla es una libertad tomada por el desarrollador para enriquecer la experiencia y será presentada al comité del Rotary para su consideración.</li>
            </ul>
          </div>

          <div className="feature-card highlight">
            <h3>Respecto del desempate por aproximación: Criterio de selección de preguntas</h3>
            <ul>
              <li>El sistema selecciona automáticamente la pregunta de aproximación <strong>menos utilizada</strong> (menor usedCount) del banco.</li>
              <li><strong>Filtrado por certamen</strong>: Las preguntas ya utilizadas en el certamen actual no se repiten, garantizando variedad en cada desempate.</li>
              <li>Si hay varias con el mismo valor mínimo, se toma la primera disponible.</li>
              <li>Esto garantiza rotación y equidad en el uso de las preguntas.</li>
            </ul>
          </div>

          <div className="feature-card highlight">
            <h3>Respecto del desempate por aproximación: Reconocimiento con Boomerang 🪃</h3>
            <ul>
              <li>El <strong>Boomerang</strong> es un distintivo adicional y simpático que se otorga al equipo que obtiene su posición final mediante el desempate por aproximación.</li>
              <li><strong>No influye en el puntaje</strong> ni en el resultado del certamen, pero sí aparece en la tabla general como reconocimiento especial.</li>
              <li>El espíritu del Boomerang es destacar el mérito de llegar a esta instancia de definición, donde el resultado depende de la precisión y el arrojo, simbolizando una "plegaria" que vuelve con éxito.</li>
              <li className="note">Esta regla es una libertad tomada por el desarrollador para enriquecer la experiencia y será presentada al comité del Rotary para su consideración.</li>
            </ul>
          </div>

          <div className="feature-card">
            <h3>4. Estadísticas y Tablero General</h3>
            <ul>
              <li><strong>Tabla de posiciones acumuladas</strong>: Medallas, puntos totales, participaciones y promedio.</li>
              <li><strong>Medallero</strong>: 🥇 oro, 🥈 plata, 🥉 bronce.</li>
              <li><strong>Boomerangs</strong>: Indica equipos que ganaron posición en desempate por aproximación.</li>
              <li><strong>Orden multi-criterio</strong>: Medallas &gt; puntos &gt; boomerangs &gt; participaciones.</li>
            </ul>
          </div>

          <div className="feature-card">
            <h3>5. Administración de Bancos</h3>
            <ul>
              <li><strong>Equipos</strong>: Alta, edición y eliminación.</li>
              <li><strong>Preguntas</strong>: Gestión y seguimiento de uso.</li>
              <li><strong>Aproximaciones</strong>: Banco de preguntas numéricas para desempates.</li>
            </ul>
          </div>

          <div className="feature-card">
            <h3>6. Importación/Exportación</h3>
            <ul>
              <li><strong>Exportar</strong>: Descarga de backup completo en JSON.</li>
              <li><strong>Importar</strong>: Opción de reemplazar o combinar datos existentes.</li>
            </ul>
          </div>

          <div className="feature-card">
            <h3>7. Interfaz y Experiencia</h3>
            <ul>
              <li><strong>Branding Rotary Club</strong>: Logo animado y colores institucionales.</li>
              <li><strong>Botones y diálogos personalizados</strong>: Consistencia visual y textual.</li>
              <li><strong>Navegación clara</strong>: Acceso rápido a todas las funciones.</li>
            </ul>
          </div>
        </section>

        <section className="docs-section">
          <h2>💻 Requisitos Técnicos</h2>
          <ul>
            <li>Windows 10/11 (ejecutable portable o instalador)</li>
            <li>No requiere conexión a internet</li>
            <li>Datos almacenados en AppData del usuario</li>
          </ul>
        </section>

        <section className="docs-section">
          <h2>🔄 Flujos Clave</h2>
          <div className="flow-list">
            <div className="flow-item">
              <span className="flow-number">1</span>
              <p><strong>Crear certamen</strong> → Seleccionar equipos y preguntas → Jugar → Resolver desempates → Ver podio → Consultar estadísticas.</p>
            </div>
            <div className="flow-item">
              <span className="flow-number">2</span>
              <p><strong>Finalización manual</strong> → Durante el certamen, usar el botón "🏁 Finalizar Certamen" → Confirmar en modal → Sistema marca preguntas restantes como completadas → Calcula podio e inicia desempate automáticamente si hay empates.</p>
            </div>
            <div className="flow-item">
              <span className="flow-number">3</span>
              <p><strong>Gestión de disputas</strong> → Marcar pregunta como disputada → Seleccionar reemplazo del banco → Continuar certamen (funciona tanto en certamen regular como en desempate).</p>
            </div>
            <div className="flow-item">
              <span className="flow-number">4</span>
              <p><strong>Administrar bancos</strong> → Agregar/editar equipos, preguntas y aproximaciones.</p>
            </div>
            <div className="flow-item">
              <span className="flow-number">5</span>
              <p><strong>Exportar/Importar</strong> → Compartir datos entre PCs.</p>
            </div>
            <div className="flow-item">
              <span className="flow-number">6</span>
              <p><strong>Modo de prueba</strong> → Activar desde la pantalla principal → Timer ajustado para ensayar el certamen sin esperas.</p>
            </div>
          </div>
        </section>

        <section className="docs-section">
          <h2>🔒 Seguridad y Privacidad</h2>
          <p>Los datos se guardan localmente, no se transmiten ni comparten sin exportación explícita.</p>
        </section>

        <section className="docs-section">
          <h2>📄 Licencia</h2>
          <div className="license-card">
            <h3>Creative Commons Reconocimiento-NoComercial 4.0 (CC BY-NC 4.0)</h3>
            <p>Esta aplicación es donada al Rotary Club bajo licencia CC BY-NC 4.0.</p>
            <div className="license-terms">
              <h4>Usted es libre de:</h4>
              <ul>
                <li>Usar la aplicación sin restricciones de tiempo o lugar</li>
                <li>Copiar y distribuir la aplicación en su forma original</li>
              </ul>
              <h4>Bajo las siguientes condiciones:</h4>
              <ul>
                <li><strong>Atribución</strong>: Debe reconocer al autor original (Germán Lahitte)</li>
                <li><strong>No Comercial</strong>: No puede usar la aplicación para fines comerciales o lucrativos sin autorización explícita</li>
              </ul>
              <p className="license-link">
                Más información: <a href="https://creativecommons.org/licenses/by-nc/4.0/deed.es" target="_blank" rel="noopener noreferrer">
                  creativecommons.org/licenses/by-nc/4.0
                </a>
              </p>
            </div>
          </div>
        </section>

        <section className="docs-section">
          <h2>📋 Registro de Documento</h2>
          <div className="registry-card">
            <table className="registry-table">
              <tbody>
                <tr>
                  <td className="registry-label">Elaborado por:</td>
                  <td className="registry-value">Germán Lahitte - Desarrollador</td>
                </tr>
                <tr>
                  <td className="registry-label">Contacto:</td>
                  <td className="registry-value">germanlahitte@gmail.com</td>
                </tr>
                <tr>
                  <td className="registry-label">Fecha de elaboración:</td>
                  <td className="registry-value">Diciembre 2025</td>
                </tr>
                <tr>
                  <td className="registry-label">Versión del documento:</td>
                  <td className="registry-value">2.0</td>
                </tr>
                <tr>
                  <td className="registry-label">Versión de la aplicación:</td>
                  <td className="registry-value">1.01 (MVP + Ajustes)</td>
                </tr>
                <tr>
                  <td className="registry-label">Última actualización:</td>
                  <td className="registry-value">13/12/2025</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}

export default DocumentacionFuncional;
