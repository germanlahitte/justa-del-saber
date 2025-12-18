import React, { useState } from 'react';
import './ContestWizard.css';
import WizardProgress from './WizardProgress';
import { Question, TeamTemplate } from '../App';

interface Props {
  contestName: string;
  selectedTeams: TeamTemplate[];
  selectedQuestions: Question[];
  questionBank: Question[];
  selectedTieBreakQuestions: Question[];
  onFinish: (tieBreakQuestions: Question[]) => void;
  onBack: () => void;
  onCancel: () => void;
}

function ContestTieBreakStep({ 
  contestName, 
  selectedTeams, 
  selectedQuestions,
  questionBank, 
  selectedTieBreakQuestions, 
  onFinish, 
  onBack, 
  onCancel 
}: Props) {
  const [selected, setSelected] = useState<Question[]>(selectedTieBreakQuestions);
  const [draggedQuestion, setDraggedQuestion] = useState<Question | null>(null);

  // Filtrar preguntas disponibles: excluir las ya seleccionadas para el certamen y las de desempate
  const availableQuestions = questionBank.filter(
    q => !selectedQuestions.find(sq => sq.id === q.id) && 
         !selected.find(s => s.id === q.id)
  );

  const handleDragStart = (question: Question) => {
    setDraggedQuestion(question);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDropToSelected = (e: React.DragEvent) => {
    e.preventDefault();
    if (draggedQuestion && !selected.find(q => q.id === draggedQuestion.id) && selected.length < 5) {
      setSelected([...selected, draggedQuestion]);
    }
    setDraggedQuestion(null);
  };

  const handleDropToAvailable = (e: React.DragEvent) => {
    e.preventDefault();
    if (draggedQuestion) {
      setSelected(selected.filter(q => q.id !== draggedQuestion.id));
    }
    setDraggedQuestion(null);
  };

  const handleDoubleClickToAdd = (question: Question) => {
    if (!selected.find(q => q.id === question.id) && selected.length < 5) {
      setSelected([...selected, question]);
    }
  };

  const handleDoubleClickToRemove = (question: Question) => {
    setSelected(selected.filter(q => q.id !== question.id));
  };

  const handleFinish = () => {
    if (selected.length === 5) {
      onFinish(selected);
    }
  };

  return (
    <div className="contest-wizard">
      <div className="wizard-header">
        <button onClick={onCancel} className="btn-back">
          🏠 Volver al Inicio
        </button>
        <h1>➕ Nuevo Certamen: {contestName}</h1>
      </div>

      <div className="wizard-content">
        <WizardProgress currentStep={4} />

        <div className="tiebreak-info-banner">
          <h3>⚔️ Preguntas de Desempate</h3>
          <p>
            Selecciona <strong>5 preguntas</strong> que se usarán <strong>solo si hay empates en el podio</strong> (primeros 3 lugares).
            Estas preguntas son opcionales y pueden no utilizarse si no hay empates.
          </p>
        </div>

        <div className="drag-drop-container">
          <div className="drag-drop-section">
            <h2>Preguntas Disponibles ({availableQuestions.length})</h2>
            <p className="section-hint">Arrastra o haz doble clic para agregar</p>
            <div
              className="question-list available-list"
              onDragOver={handleDragOver}
              onDrop={handleDropToAvailable}
            >
              {availableQuestions.length === 0 ? (
                <p className="empty-list">No hay más preguntas disponibles</p>
              ) : (
                availableQuestions.map((question) => (
                  <div
                    key={question.id}
                    className="question-item-drag"
                    draggable
                    onDragStart={() => handleDragStart(question)}
                    onDoubleClick={() => handleDoubleClickToAdd(question)}
                  >
                    <div className="question-item-header">
                      <span className="question-icon">⚔️</span>
                      <span className="question-number">Pregunta {questionBank.findIndex(q => q.id === question.id) + 1}</span>
                      {(question.usedCount || 0) > 0 && (
                        <span className="used-badge">
                          Usada {question.usedCount}x
                        </span>
                      )}
                    </div>
                    <div className="question-text-preview">{question.text}</div>
                    <div className="question-correct-badge">
                      Correcta: {question.correctAnswer}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="drag-drop-divider">
            <div className="divider-line"></div>
            <div className="divider-icon">⇄</div>
            <div className="divider-line"></div>
          </div>

          <div className="drag-drop-section">
            <h2>Preguntas de Desempate ({selected.length}/5)</h2>
            <p className="section-hint">Arrastra o haz doble clic para quitar</p>
            <div
              className="question-list selected-list"
              onDragOver={handleDragOver}
              onDrop={handleDropToSelected}
            >
              {selected.length === 0 ? (
                <p className="empty-list">Arrastra 5 preguntas aquí para desempate</p>
              ) : (
                selected.map((question, index) => (
                  <div
                    key={question.id}
                    className="question-item-drag selected tiebreak-question"
                    draggable
                    onDragStart={() => handleDragStart(question)}
                    onDoubleClick={() => handleDoubleClickToRemove(question)}
                  >
                    <div className="question-item-header">
                      <span className="question-icon">⚔️</span>
                      <span className="question-number">Desempate {index + 1}</span>
                      {(question.usedCount || 0) > 0 && (
                        <span className="used-badge">
                          Usada {question.usedCount}x
                        </span>
                      )}
                    </div>
                    <div className="question-text-preview">{question.text}</div>
                    <div className="question-correct-badge">
                      Correcta: {question.correctAnswer}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {selected.length !== 5 && (
          <div className="wizard-warning">
            ⚠️ Debes seleccionar exactamente 5 preguntas para desempate
          </div>
        )}

        <div className="wizard-actions">
          <button onClick={onBack} className="btn-back-wizard">
            ← Atrás
          </button>
          <button
            onClick={handleFinish}
            className="btn-finish-wizard"
            disabled={selected.length !== 5}
          >
            ✓ Crear Certamen
          </button>
        </div>
      </div>
    </div>
  );
}

export default ContestTieBreakStep;
