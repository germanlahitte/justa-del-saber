import React from 'react';
import './GameHome.css';
import { Question, TieBreakResult } from '../App';
import { TieBreakGroup } from '../utils/tieBreakUtils';

interface Props {
  contestName: string;
  tieBreakQuestions: Question[];
  currentQuestionIndex: number;
  tieBreakResults: TieBreakResult;
  tieBreakGroups: TieBreakGroup[];
  onSelectQuestion: (index: number) => void;
  onEditCompletedQuestion: (index: number) => void;
  onBackToResults: () => void;
  onSelectReplacement?: () => void;
  originalQuestionCount?: number;
}

function TieBreakHome({ 
  contestName, 
  tieBreakQuestions,
  currentQuestionIndex,
  tieBreakResults,
  tieBreakGroups,
  onSelectQuestion,
  onEditCompletedQuestion,
  onBackToResults,
  onSelectReplacement,
  originalQuestionCount
}: Props) {
  const isQuestionCompleted = (index: number) => {
    return tieBreakResults.currentQuestionIndex > index;
  };

  const isQuestionAvailable = (index: number) => {
    return index === currentQuestionIndex;
  };
  
  const isQuestionLocked = (index: number) => {
    return index > currentQuestionIndex;
  };

  const isQuestionDisputed = (index: number) => {
    return tieBreakResults.disputedQuestions?.[index] || false;
  };

  // Calcular preguntas disputadas pendientes de reemplazo
  const disputedCount = Object.values(tieBreakResults.disputedQuestions || {}).filter(Boolean).length;
  const currentQuestionCount = tieBreakQuestions.length;
  const originalCount = originalQuestionCount || 5; // 5 es el número original de preguntas de desempate
  const replacementsAdded = currentQuestionCount - originalCount;
  const pendingReplacements = Math.max(0, disputedCount - replacementsAdded);
  
  console.log('🔍 [TieBreakHome] Cálculo de reemplazos:', {
    disputedCount,
    currentQuestionCount,
    originalCount,
    replacementsAdded,
    pendingReplacements
  });

  const allQuestionsCompleted = currentQuestionIndex >= tieBreakQuestions.length;

  // Calcular cuántos equipos siguen compitiendo (no resueltos)
  const teamsStillCompeting = tieBreakGroups.reduce((sum, group) => {
    return sum + group.teams.filter(t => !tieBreakResults.resolvedTeams.includes(t.id)).length;
  }, 0);

  return (
    <div className="game-home">
      <div className="game-home-header">
        <h1>⚔️ Desempate - {contestName}</h1>
        <div className="header-actions">
          {pendingReplacements > 0 && onSelectReplacement && (
            <button onClick={onSelectReplacement} className="btn-select-replacement">
              🔄 Seleccionar Reemplazo ({pendingReplacements} pendiente{pendingReplacements > 1 ? 's' : ''})
            </button>
          )}
          <button onClick={onBackToResults} className="btn-view-results">
            🏠 Volver a Resultados
          </button>
        </div>
      </div>

      {teamsStillCompeting === 0 && (
        <div className="contest-completed-banner">
          <div className="banner-icon">🏆</div>
          <div className="banner-content">
            <h2>¡Desempate Resuelto!</h2>
            <p>Todas las posiciones han sido definidas. Vuelve a resultados para ver el podio final.</p>
          </div>
          <button onClick={onBackToResults} className="btn-view-final-results">
            Ver Resultados Finales →
          </button>
        </div>
      )}

      {teamsStillCompeting > 0 && (
        <div className="tiebreak-status-info">
          <div className="status-card">
            <span className="status-label">Equipos compitiendo:</span>
            <span className="status-value">{teamsStillCompeting}</span>
          </div>
          <div className="status-card">
            <span className="status-label">Preguntas jugadas:</span>
            <span className="status-value">{currentQuestionIndex} / {tieBreakQuestions.length}</span>
          </div>
          <div className="status-card">
            <span className="status-label">Equipos resueltos:</span>
            <span className="status-value">{tieBreakResults.resolvedTeams.length}</span>
          </div>
        </div>
      )}
      
      <div className="questions-map">
        <h2>{allQuestionsCompleted ? 'Preguntas de Desempate' : 'Selecciona una pregunta'}</h2>
        {!allQuestionsCompleted && (
          <p className="map-instructions">
            Haz clic en la pregunta <strong>actual</strong> para mostrarla, o en preguntas <strong>completadas</strong> para corregir respuestas.
          </p>
        )}
        <div className="questions-grid">
          {tieBreakQuestions.map((question, index) => (
            <button
              key={question.id}
              onClick={() => {
                if (isQuestionCompleted(index)) {
                  onEditCompletedQuestion(index);
                } else {
                  onSelectQuestion(index);
                }
              }}
              disabled={isQuestionLocked(index)}
              className={`question-button ${
                isQuestionDisputed(index) ? 'disputed' :
                isQuestionCompleted(index) ? 'completed' : 
                isQuestionAvailable(index) ? 'available' : 
                'locked'
              }`}
            >
              <div className="question-number">
                {isQuestionDisputed(index) && <span className="disputed-icon">⚠️ </span>}
                Desempate {index + 1}
              </div>
              <div className="question-status">
                {isQuestionDisputed(index) ? '⚠️ Disputada' :
                 isQuestionCompleted(index) ? '✓ Completada (clic para corregir)' : 
                 isQuestionAvailable(index) ? '▶ Actual' : 
                 '🔒 Bloqueada'}
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="game-home-progress">
        <div className="progress-info">
          <span>Progreso: {currentQuestionIndex} / {tieBreakQuestions.length} preguntas de desempate</span>
          <div className="progress-bar">
            <div 
              className="progress-fill"
              style={{ width: `${(currentQuestionIndex / tieBreakQuestions.length) * 100}%` } as React.CSSProperties}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default TieBreakHome;
