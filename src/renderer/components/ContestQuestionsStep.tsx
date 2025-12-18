import React, { useState } from 'react';
import './ContestWizard.css';
import WizardProgress from './WizardProgress';
import { Question, TeamTemplate } from '../App';

interface Props {
  contestName: string;
  selectedTeams: TeamTemplate[];
  questionBank: Question[];
  selectedQuestions: Question[];
  onFinish: (questions: Question[]) => void;
  onBack: () => void;
  onCancel: () => void;
}

type FilterType = 'all' | 'unused' | 'used';

function ContestQuestionsStep({ contestName, selectedTeams, questionBank, selectedQuestions, onFinish, onBack, onCancel }: Props) {
  const [selected, setSelected] = useState<Question[]>(selectedQuestions);
  const [draggedQuestion, setDraggedQuestion] = useState<Question | null>(null);
  const [filter, setFilter] = useState<FilterType>('unused');

  // Aplicar filtro a las preguntas disponibles
  const getFilteredQuestions = () => {
    let filtered = questionBank.filter(q => !selected.find(s => s.id === q.id));
    
    if (filter === 'unused') {
      filtered = filtered.filter(q => (q.usedCount || 0) === 0);
    } else if (filter === 'used') {
      filtered = filtered.filter(q => (q.usedCount || 0) > 0);
    }
    
    return filtered;
  };

  const availableQuestions = getFilteredQuestions();

  const handleDragStart = (question: Question, fromSelected: boolean) => {
    setDraggedQuestion(question);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDropToSelected = (e: React.DragEvent) => {
    e.preventDefault();
    if (draggedQuestion && !selected.find(q => q.id === draggedQuestion.id)) {
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
    if (!selected.find(q => q.id === question.id)) {
      setSelected([...selected, question]);
    }
  };

  const handleDoubleClickToRemove = (question: Question) => {
    setSelected(selected.filter(q => q.id !== question.id));
  };

  const handleFinish = () => {
    if (selected.length >= 1) {
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
        <WizardProgress currentStep={3} />

        <div className="drag-drop-container">
          <div className="drag-drop-section">
            <div className="section-header-with-filter">
              <h2>Preguntas Disponibles ({availableQuestions.length})</h2>
              <div className="filter-buttons">
                <button 
                  className={`btn-filter ${filter === 'unused' ? 'active' : ''}`}
                  onClick={() => setFilter('unused')}
                >
                  No Utilizadas
                </button>
                <button 
                  className={`btn-filter ${filter === 'all' ? 'active' : ''}`}
                  onClick={() => setFilter('all')}
                >
                  Todas
                </button>
                <button 
                  className={`btn-filter ${filter === 'used' ? 'active' : ''}`}
                  onClick={() => setFilter('used')}
                >
                  Utilizadas
                </button>
              </div>
            </div>
            <p className="section-hint">Arrastra o haz doble clic para agregar</p>
            <div
              className="question-list available-list"
              onDragOver={handleDragOver}
              onDrop={handleDropToAvailable}
            >
              {availableQuestions.length === 0 ? (
                <p className="empty-list">
                  {filter === 'unused' ? 'No hay preguntas sin utilizar' : 
                   filter === 'used' ? 'No hay preguntas utilizadas' :
                   'Todas las preguntas han sido seleccionadas'}
                </p>
              ) : (
                availableQuestions.map((question, index) => (
                  <div
                    key={question.id}
                    className="question-item-drag"
                    draggable
                    onDragStart={() => handleDragStart(question, false)}
                    onDoubleClick={() => handleDoubleClickToAdd(question)}
                  >
                    <div className="question-item-header">
                      <span className="question-icon">❓</span>
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
            <h2>Preguntas Seleccionadas ({selected.length})</h2>
            <p className="section-hint">Arrastra o haz doble clic para quitar</p>
            <div
              className="question-list selected-list"
              onDragOver={handleDragOver}
              onDrop={handleDropToSelected}
            >
              {selected.length === 0 ? (
                <p className="empty-list">Arrastra preguntas aquí o haz doble clic en ellas</p>
              ) : (
                selected.map((question, index) => (
                  <div
                    key={question.id}
                    className={`question-item-drag selected ${(question.usedCount || 0) > 0 ? 'previously-used' : ''}`}
                    draggable
                    onDragStart={() => handleDragStart(question, true)}
                    onDoubleClick={() => handleDoubleClickToRemove(question)}
                  >
                    <div className="question-item-header">
                      <span className="question-icon">✓</span>
                      <span className="question-number">Pregunta {index + 1}</span>
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

        {selected.length < 1 && (
          <div className="wizard-warning">
            ⚠️ Debes seleccionar al menos 1 pregunta para continuar
          </div>
        )}

        <div className="wizard-actions">
          <button
            type="button"
            onClick={onBack}
            className="btn-back-wizard"
          >
            ← Atrás
          </button>
          <button
            type="button"
            onClick={handleFinish}
            className="btn-next-wizard"
            disabled={selected.length < 1}
          >
            Siguiente: Desempate →
          </button>
        </div>
      </div>
    </div>
  );
}

export default ContestQuestionsStep;
