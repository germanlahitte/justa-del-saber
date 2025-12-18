import React from 'react';
import './GameHome.css';
import { Question, QuestionResult } from '../App';

interface Props {
  contestName: string;
  questions: Question[];
  currentQuestionIndex: number;
  results: QuestionResult[];
  onSelectQuestion: (index: number) => void;
  onViewResults: () => void;
  onSelectReplacement?: () => void;
  originalQuestionCount?: number;
}

function GameHome({ 
  contestName, 
  questions, 
  currentQuestionIndex,
  results,
  onSelectQuestion,
  onViewResults,
  onSelectReplacement,
  originalQuestionCount
}: Props) {

  const isQuestionAvailable = (index: number) => {
    return index === currentQuestionIndex;
  };

  const isQuestionCompleted = (index: number) => {
    return results[index]?.completed && results[index]?.answerRevealed;
  };
  
  const isQuestionDisputed = (index: number) => {
    return results[index]?.disputed || false;
  };
  
  const isQuestionLocked = (index: number) => {
    return index !== currentQuestionIndex && !isQuestionCompleted(index);
  };

  // Calcular preguntas disputadas pendientes de reemplazo
  const disputedCount = results.filter(r => r.disputed).length;
  const currentQuestionCount = questions.length;
  const originalCount = originalQuestionCount || currentQuestionCount;
  const replacementsAdded = currentQuestionCount - originalCount;
  const pendingReplacements = Math.max(0, disputedCount - replacementsAdded);
  
  const allQuestionsCompleted = results.every(r => r.completed && r.answerRevealed);

  return (
    <div className="game-home">
      <div className="game-home-header">
        <h1>{contestName}</h1>
        <div className="header-actions">
          {pendingReplacements > 0 && onSelectReplacement && (
            <button onClick={onSelectReplacement} className="btn-select-replacement">
              🔄 Seleccionar Reemplazo ({pendingReplacements} pendiente{pendingReplacements > 1 ? 's' : ''})
            </button>
          )}
          <button onClick={onViewResults} className="btn-view-results">
            📊 Ver Resultados
          </button>
        </div>
      </div>

      {allQuestionsCompleted && (
        <div className="contest-completed-banner">
          <div className="banner-icon">🎉</div>
          <div className="banner-content">
            <h2>¡Certamen Finalizado!</h2>
            <p>Todas las preguntas han sido completadas. Haz clic en "Ver Resultados" para conocer al ganador.</p>
          </div>
          <button onClick={onViewResults} className="btn-view-final-results">
            Ver Resultados Finales →
          </button>
        </div>
      )}
      
      <div className="questions-map">
        <h2>{allQuestionsCompleted ? 'Todas las Preguntas' : 'Selecciona una pregunta'}</h2>
        {!allQuestionsCompleted && (
          <p className="map-instructions">
            Haz clic en la pregunta <strong>actual</strong> para responderla, o en preguntas <strong>completadas</strong> para corregir respuestas.
          </p>
        )}
        <div className="questions-grid">
          {questions.map((question, index) => (
            <button
              key={question.id}
              onClick={() => onSelectQuestion(index)}
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
                Pregunta {index + 1}
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
          <span>Progreso: {results.filter(r => r.completed).length} / {questions.length} preguntas</span>
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${(results.filter(r => r.completed).length / questions.length) * 100}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default GameHome;
