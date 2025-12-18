import React from 'react';
import './TieBreakExplanation.css';
import { TieBreakGroup } from '../utils/tieBreakUtils';

interface Props {
  groups: TieBreakGroup[];
  onStartTieBreak: () => void;
  onCancel: () => void;
  onBackToResults: () => void;
}

function TieBreakExplanation({ groups, onStartTieBreak, onCancel, onBackToResults }: Props) {
  return (
    <div className="tiebreak-explanation">
      <div className="explanation-container">
        <div className="explanation-header">
          <h1>⚔️ Desempate del Podio</h1>
          <p className="subtitle">
            Se han detectado empates en las posiciones del podio. 
            Los equipos jugarán 5 preguntas para definir los ganadores.
          </p>
        </div>

        <div className="tiebreak-groups">
          {groups.map((group, index) => (
            <div key={index} className="tiebreak-group-card">
              <div className="group-header">
                <span className="group-icon">🏆</span>
                <h2>Disputa por {group.positions}</h2>
              </div>
              
              <div className="group-teams">
                <p className="teams-label">Equipos participantes:</p>
                <div className="teams-list">
                  {group.teams.map(team => (
                    <div key={team.id} className="team-badge">
                      <span className="team-name">{team.name}</span>
                      <span className="team-score">{team.score} pts</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="group-explanation">
                {group.teams.length === 2 ? (
                  <p>
                    Estos 2 equipos competirán para definir quién ocupa cada posición.
                    El ganador obtendrá la posición superior.
                  </p>
                ) : group.teams.length === 3 ? (
                  <p>
                    Estos 3 equipos competirán para definir el orden de las posiciones.
                    Los resultados determinarán quién ocupa cada lugar del podio.
                  </p>
                ) : (
                  <p>
                    Estos {group.teams.length} equipos competirán para definir las posiciones.
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="rules-section">
          <h3>📋 Reglas del Desempate</h3>
          <ul className="rules-list">
            <li>Se jugarán <strong>5 preguntas</strong> de desempate</li>
            <li>Cada respuesta correcta suma <strong>+1 punto</strong></li>
            <li>Los equipos compiten <strong>simultáneamente</strong> con las mismas preguntas</li>
            <li>Un equipo que obtenga <strong>+3 puntos de ventaja</strong> gana su posición automáticamente</li>
            <li>Los duelos resueltos se <strong>anunciarán</strong> y esos equipos dejarán de competir</li>
          </ul>
        </div>

        <div className="explanation-actions">
          <button onClick={onCancel} className="btn-cancel-tiebreak">
            ← Salir
          </button>
          <button onClick={onBackToResults} className="btn-back-to-tiebreak">
            📝 Editar Resultados
          </button>
          <button onClick={onStartTieBreak} className="btn-start-tiebreak">
            ⚔️ Iniciar Desempate
          </button>
        </div>
      </div>
    </div>
  );
}

export default TieBreakExplanation;
