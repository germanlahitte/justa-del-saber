import React, { useState, useEffect } from 'react';
import './TeamScoring.css';
import { Team, Question, TieBreakResult } from '../App';
import { TieBreakGroup, hasEarlyVictory } from '../utils/tieBreakUtils';

interface Props {
  teams: Team[];
  question: Question;
  questionNumber?: number;
  previousCorrectTeamIds?: string[];
  isEditMode?: boolean;
  onSaveScores?: (correctTeamIds: string[]) => void;
  onViewResults?: () => void;
  onBackToHome: () => void;
  // Props para modo desempate
  isTieBreakMode?: boolean;
  tieBreakGroups?: TieBreakGroup[];
  tieBreakResults?: TieBreakResult;
  questionsRemaining?: number;
  onSave?: (correctTeamIds: string[]) => void;
  // Props para disputa de preguntas
  isDisputed?: boolean;
  onMarkAsDisputed?: () => void;
}

function TeamScoring({ 
  teams, 
  question, 
  questionNumber,
  previousCorrectTeamIds = [],
  isEditMode = false,
  onSaveScores,
  onViewResults,
  onBackToHome,
  isTieBreakMode = false,
  tieBreakGroups = [],
  tieBreakResults,
  questionsRemaining = 0,
  onSave,
  isDisputed = false,
  onMarkAsDisputed
}: Props) {
  const [correctTeams, setCorrectTeams] = useState<Set<string>>(new Set(previousCorrectTeamIds));
  const [editingEnabled, setEditingEnabled] = useState(!isEditMode);
  const [resolvedTeamsNotification, setResolvedTeamsNotification] = useState<string[]>([]);
  const [showDisputeModal, setShowDisputeModal] = useState(false);

  const toggleTeam = (teamId: string) => {
    if (!editingEnabled || isDisputed) return;
    
    // En modo desempate, solo permitir seleccionar equipos que participan
    if (isTieBreakMode && tieBreakResults) {
      const isParticipating = tieBreakResults.teamScores.hasOwnProperty(teamId);
      const isResolved = tieBreakResults.resolvedTeams.includes(teamId);
      if (!isParticipating || isResolved) return;
    }
    
    const newSet = new Set(correctTeams);
    if (newSet.has(teamId)) {
      newSet.delete(teamId);
    } else {
      newSet.add(teamId);
    }
    setCorrectTeams(newSet);
  };

  const handleSave = () => {
    const correctArray = Array.from(correctTeams);
    
    if (isTieBreakMode && tieBreakResults) {
      // La detección de victorias prematuras ahora se maneja en App.tsx
      // Aquí solo limpiamos la notificación
      setResolvedTeamsNotification([]);
      
      // Usar onSaveScores si existe, sino onSave (por compatibilidad)
      if (onSaveScores) {
        onSaveScores(correctArray);
      } else if (onSave) {
        onSave(correctArray);
      }
    } else if (onSaveScores) {
      onSaveScores(correctArray);
    }
  };

  const getTeamTieBreakScore = (teamId: string) => {
    if (!tieBreakResults) return 0;
    return tieBreakResults.teamScores[teamId] || 0;
  };

  const isTeamResolved = (teamId: string) => {
    if (!tieBreakResults) return false;
    return tieBreakResults.resolvedTeams.includes(teamId);
  };

  const handleDisputeClick = () => {
    setShowDisputeModal(true);
  };

  const handleConfirmDispute = () => {
    setShowDisputeModal(false);
    if (onMarkAsDisputed) {
      onMarkAsDisputed();
    }
  };

  const handleCancelDispute = () => {
    setShowDisputeModal(false);
  };

  return (
    <div className="team-scoring">
      <div className="scoring-header">
        <h2>
          {isTieBreakMode 
            ? '⚔️ Desempate: Marcar Respuestas Correctas (+1 pt)'
            : `Pregunta ${questionNumber}: ${isEditMode ? 'Corrección de Respuestas' : 'Marcar Respuestas Correctas'}`
          }
        </h2>
        {isEditMode && !isTieBreakMode && (
          <div className="edit-mode-notice">
            ℹ️ Estás corrigiendo una pregunta completada. Habilita la edición para modificar.
          </div>
        )}
        {resolvedTeamsNotification.length > 0 && (
          <div className="resolved-notification">
            🎉 ¡Posiciones definidas! Los siguientes equipos han ganado su lugar en el podio
          </div>
        )}
      </div>

      <div className="scoring-content">
        <div className="question-reminder">
          <h3>Pregunta:</h3>
          <p>{question.text}</p>
          <div className="correct-answer-reminder">
            <strong>Respuesta correcta:</strong> {question.correctAnswer} - {question.options[question.correctAnswer]}
          </div>
        </div>

{isTieBreakMode && tieBreakGroups.length > 0 ? (
          // Modo desempate: una tabla por cada grupo
          tieBreakGroups.map((group, groupIndex) => {
            const groupTeams = group.teams;
            
            return (
              <div key={groupIndex} className="teams-scoring-table">
                <div className="table-header">
                  <h3>
                    🏆 Desempate por {group.positions}
                    <span className="group-subtitle-inline"> - {groupTeams.map(t => t.name).join(', ')}</span>
                  </h3>
                  {isEditMode && groupIndex === 0 && (
                    <button 
                      onClick={() => setEditingEnabled(!editingEnabled)} 
                      className={editingEnabled ? 'btn-disable-edit' : 'btn-enable-edit'}
                    >
                      {editingEnabled ? '🔒 Bloquear Edición' : '✏️ Habilitar Edición'}
                    </button>
                  )}
                </div>
                <table>
                  <thead>
                    <tr>
                      <th>Equipo</th>
                      <th>Puntaje Actual</th>
                      <th>Contestó Bien</th>
                    </tr>
                  </thead>
                  <tbody>
                    {groupTeams.map(team => {
                      const isResolved = isTeamResolved(team.id);
                      const tieBreakScore = getTeamTieBreakScore(team.id);
                      
                      return (
                        <tr 
                          key={team.id} 
                          className={`${correctTeams.has(team.id) ? 'selected' : ''} ${isResolved ? 'resolved-team' : ''} ${resolvedTeamsNotification.includes(team.id) ? 'newly-resolved-highlight' : ''}`}
                        >
                          <td className="team-name">
                            {team.name}
                            {isResolved && <span className="resolved-tag">✓ Definido</span>}
                          </td>
                          <td className="team-score">
                            {tieBreakScore} pts
                          </td>
                          <td className="team-checkbox">
                            <label className="checkbox-label">
                              <input
                                type="checkbox"
                                checked={correctTeams.has(team.id)}
                                onChange={() => toggleTeam(team.id)}
                                disabled={!editingEnabled || isResolved || isDisputed}
                                aria-label={`Marcar ${team.name} como correcto`}
                              />
                              <span className="checkbox-custom"></span>
                            </label>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            );
          })
        ) : (
          // Modo normal: una sola tabla con todos los equipos
          <div className="teams-scoring-table">
            <div className="table-header">
              <h3>{editingEnabled ? 'Selecciona los equipos que contestaron correctamente:' : 'Equipos que contestaron correctamente:'}</h3>
              {isEditMode && (
                <button 
                  onClick={() => setEditingEnabled(!editingEnabled)} 
                  className={editingEnabled ? 'btn-disable-edit' : 'btn-enable-edit'}
                >
                  {editingEnabled ? '🔒 Bloquear Edición' : '✏️ Habilitar Edición'}
                </button>
              )}
            </div>
            <table>
              <thead>
                <tr>
                  <th>Equipo</th>
                  <th>Puntaje Actual</th>
                  <th>Contestó Bien</th>
                </tr>
              </thead>
              <tbody>
                {teams.map(team => (
                  <tr 
                    key={team.id} 
                    className={correctTeams.has(team.id) ? 'selected' : ''}
                  >
                    <td className="team-name">{team.name}</td>
                    <td className="team-score">{team.score} pts</td>
                    <td className="team-checkbox">
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={correctTeams.has(team.id)}
                          onChange={() => toggleTeam(team.id)}
                          disabled={!editingEnabled || isDisputed}
                          aria-label={`Marcar ${team.name} como correcto`}
                        />
                        <span className="checkbox-custom"></span>
                      </label>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="scoring-summary">
          <p>Equipos que contestaron correctamente: <strong>{correctTeams.size}</strong></p>
        </div>
      </div>

      <div className="scoring-actions">
        <button onClick={handleSave} className="btn-save" disabled={!editingEnabled || isDisputed}>
          💾 Guardar Cambios
        </button>
        {onMarkAsDisputed && !isDisputed && (
          <button onClick={handleDisputeClick} className="btn-dispute">
            ⚠️ Marcar como Disputada
          </button>
        )}
        {isDisputed && (
          <div className="disputed-badge">
            ⚠️ Pregunta Disputada - No se puede modificar
          </div>
        )}
        <button onClick={onViewResults} className="btn-results">
          📊 Ver Resultados Parciales
        </button>
        <button onClick={onBackToHome} className="btn-home">
          🏠 Volver al Inicio
        </button>
      </div>

      {showDisputeModal && (
        <div className="modal-overlay">
          <div className="modal-content dispute-modal">
            <h2>⚠️ Marcar Pregunta como Disputada</h2>
            <p className="modal-warning">
              Esta acción es <strong>irreversible</strong>. Al marcar esta pregunta como disputada:
            </p>
            <ul className="modal-list">
              <li>Se descontarán los puntos de los equipos que la contestaron correctamente</li>
              <li>La pregunta quedará marcada visualmente en el mapa</li>
              <li>Se habilitará la opción de seleccionar una pregunta de reemplazo</li>
              <li>El certamen continuará normalmente</li>
            </ul>
            <p className="modal-confirm">¿Estás seguro de que deseas marcar esta pregunta como disputada?</p>
            <div className="modal-actions">
              <button onClick={handleCancelDispute} className="btn-modal-cancel">
                Cancelar
              </button>
              <button onClick={handleConfirmDispute} className="btn-modal-confirm">
                Sí, Marcar como Disputada
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TeamScoring;
