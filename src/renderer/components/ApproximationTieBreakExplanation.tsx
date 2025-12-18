import React from 'react';
import './TieBreakExplanation.css';
import { FinalTieBreakGroup, Team, TieBreakResult } from '../App';

interface Props {
  groups: FinalTieBreakGroup[];
  teams: Team[];
  tieBreakResults?: TieBreakResult;
  onStart: () => void;
  onCancel: () => void;
  onBackToTieBreak: () => void;
}

function ApproximationTieBreakExplanation({ groups, teams, tieBreakResults, onStart, onCancel, onBackToTieBreak }: Props) {
  const getTeamById = (teamId: string): Team | undefined => {
    return teams.find(t => t.id === teamId);
  };

  return (
    <div className="tiebreak-explanation">
      <div className="explanation-container">
        <div className="explanation-header">
          <h1>🎯 Desempate por Aproximación</h1>
          <p className="subtitle">
            El desempate normal no pudo resolver el empate. 
            Los equipos responderán preguntas numéricas donde gana quien más se aproxime al valor correcto.
          </p>
        </div>

        <div className="tiebreak-groups">
          {groups.map((group, index) => {
            const positionLabel = group.positionInDispute === 1 ? '1er lugar' :
                                 group.positionInDispute === 2 ? '2do lugar' :
                                 group.positionInDispute === 3 ? '3er lugar' :
                                 `${group.positionInDispute}º lugar`;
            
            return (
              <div key={index} className="tiebreak-group-card">
                <div className="group-header">
                  <span className="group-icon">🎯</span>
                  <h2>Disputa por {positionLabel}</h2>
                </div>
                
                <div className="group-teams">
                  <p className="teams-label">Equipos participantes:</p>
                  <div className="teams-list">
                    {group.teamIds.map(teamId => {
                      const team = getTeamById(teamId);
                      const regularScore = team?.score || 0;
                      const tieBreakScore = tieBreakResults?.teamScores?.[teamId] || 0;
                      const totalScore = regularScore + tieBreakScore;
                      return (
                        <div key={teamId} className="team-badge">
                          <span className="team-name">{team?.name || 'Equipo desconocido'}</span>
                          <span className="team-score">{totalScore} pts</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="group-explanation">
                  {group.teamIds.length === 2 ? (
                    <p>
                      Estos 2 equipos competirán directamente. El que responda más cercano gana el puesto.
                    </p>
                  ) : (
                    <p>
                      Estos {group.teamIds.length} equipos competirán simultáneamente. Se irán definiendo posiciones según la proximidad a las respuestas correctas.
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="rules-section">
          <h3>📋 Reglas del Desempate por Aproximación</h3>
          <ul className="rules-list">
            <li>Solo se dirimen las posiciones del <strong>podio (1º, 2º, 3º)</strong></li>
            <li>Se formularán <strong>preguntas numéricas</strong> hasta resolver todos los empates</li>
            <li>Los equipos tienen 30 segundos para escribir su respuesta en un papel</li>
            <li>La respuesta debe ser un número</li>
            <li>Al terminar el tiempo, deben entregar el papel al jurado</li>
            <li>El equipo cuya respuesta esté más cerca del valor correcto ganará la posición en disputa</li>
          </ul>
        </div>

        <div className="explanation-actions">
          <button onClick={onCancel} className="btn-cancel-tiebreak">
            ← Salir
          </button>
          <button onClick={onBackToTieBreak} className="btn-back-to-tiebreak">
            📝 Editar Desempate Regular
          </button>
          <button onClick={onStart} className="btn-start-tiebreak">
            🎯 Iniciar Desempate por Aproximación
          </button>
        </div>
      </div>
    </div>
  );
}

export default ApproximationTieBreakExplanation;
