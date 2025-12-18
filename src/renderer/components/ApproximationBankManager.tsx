import React, { useState } from 'react';
import './BankManager.css';
import { ApproximationQuestion } from '../App';

interface Props {
  approximationBank: ApproximationQuestion[];
  onAddApproximation: (question: ApproximationQuestion) => void;
  onRemoveApproximation: (id: string) => void;
  onUpdateBank: (questions: ApproximationQuestion[]) => void;
  onBackToHome: () => void;
}

function ApproximationBankManager({ 
  approximationBank, 
  onAddApproximation, 
  onRemoveApproximation, 
  onUpdateBank, 
  onBackToHome 
}: Props) {
  const [questionText, setQuestionText] = useState('');
  const [correctAnswer, setCorrectAnswer] = useState('');

  const handleAddQuestion = () => {
    const answerNum = parseFloat(correctAnswer);
    if (questionText.trim() && !isNaN(answerNum)) {
      const newQuestion: ApproximationQuestion = {
        id: Date.now().toString(),
        text: questionText.trim(),
        correctAnswer: answerNum,
        usedCount: 0
      };
      onAddApproximation(newQuestion);
      setQuestionText('');
      setCorrectAnswer('');
    }
  };

  const handleUpdateQuestion = (id: string, updates: Partial<ApproximationQuestion>) => {
    const updatedBank = approximationBank.map(q => 
      q.id === id ? { ...q, ...updates } : q
    );
    onUpdateBank(updatedBank);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && isFormValid) {
      handleAddQuestion();
    }
  };

  const isFormValid = questionText.trim() && correctAnswer.trim() && !isNaN(parseFloat(correctAnswer));

  return (
    <div className="bank-manager approximation-bank-manager">
      <div className="bank-header">
        <button onClick={onBackToHome} className="btn-back">
          🏠 Volver al Inicio
        </button>
        <h1>🎯 Banco de Preguntas de Aproximación</h1>
      </div>

      <div className="info-banner">
        <h3>ℹ️ ¿Qué son las preguntas de aproximación?</h3>
        <p>
          Las preguntas de aproximación tienen una <strong>única respuesta numérica correcta</strong>.
          Se utilizan para resolver empates que puedan surgir dentro del sistema de desempate.
          El equipo cuya respuesta esté más cercana al valor correcto gana.
        </p>
      </div>

      <div className="question-form-section">
        <h2>Agregar Nueva Pregunta de Aproximación</h2>
        <div className="approximation-form">
          <input
            type="text"
            value={questionText}
            onChange={(e) => setQuestionText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ejemplo: ¿En qué año se fundó Roma?"
            className="input-question-text"
          />
          
          <div className="answer-input-group">
            <label>Respuesta correcta (numérica):</label>
            <input
              type="number"
              step="any"
              value={correctAnswer}
              onChange={(e) => setCorrectAnswer(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ejemplo: 753"
              className="input-answer-number"
            />
          </div>
          
          <button 
            onClick={handleAddQuestion}
            disabled={!isFormValid}
            className="btn-add-question"
          >
            ➕ Agregar Pregunta
          </button>
        </div>
      </div>

      <div className="question-list-section">
        <h2>Preguntas en el Banco ({approximationBank.length})</h2>
        {approximationBank.length === 0 ? (
          <p className="empty-message">
            No hay preguntas de aproximación. Agrega la primera pregunta arriba.
          </p>
        ) : (
          <div className="question-bank-list">
            {approximationBank.map((question, index) => (
              <ApproximationCard
                key={question.id}
                question={question}
                index={index}
                onRemove={onRemoveApproximation}
                onUpdate={handleUpdateQuestion}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface ApproximationCardProps {
  question: ApproximationQuestion;
  index: number;
  onRemove: (id: string) => void;
  onUpdate: (id: string, updates: Partial<ApproximationQuestion>) => void;
}

function ApproximationCard({ question, index, onRemove, onUpdate }: ApproximationCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(question.text);
  const [editAnswer, setEditAnswer] = useState(question.correctAnswer.toString());

  const handleSave = () => {
    const answerNum = parseFloat(editAnswer);
    if (editText.trim() && !isNaN(answerNum)) {
      onUpdate(question.id, {
        text: editText.trim(),
        correctAnswer: answerNum
      });
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setEditText(question.text);
    setEditAnswer(question.correctAnswer.toString());
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="question-card editing">
        <div className="question-card-header">
          <span className="question-number">Pregunta de Aproximación {index + 1}</span>
          <div className="card-actions">
            <button onClick={handleSave} className="btn-save" title="Guardar cambios">
              ✓ Guardar
            </button>
            <button onClick={handleCancel} className="btn-cancel" title="Cancelar">
              ✕ Cancelar
            </button>
          </div>
        </div>
        <div className="question-card-body">
          <input
            type="text"
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            className="edit-question-text"
            placeholder="Texto de la pregunta"
          />
          <div className="edit-approximation-answer">
            <label>Respuesta correcta (numérica):</label>
            <input
              type="number"
              step="any"
              value={editAnswer}
              onChange={(e) => setEditAnswer(e.target.value)}
              className="input-answer-number"
              placeholder="Valor numérico"
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="question-card">
      <div className="question-card-header">
        <div className="question-header-left">
          <span className="question-number">Pregunta de Aproximación {index + 1}</span>
          {(question.usedCount || 0) > 0 && (
            <span className="used-badge-bank">
              Usada {question.usedCount}x
            </span>
          )}
        </div>
        <div className="card-actions">
          <button onClick={() => setIsEditing(true)} className="btn-edit" title="Editar pregunta">
            ✏️
          </button>
          <button onClick={() => onRemove(question.id)} className="btn-remove" title="Eliminar pregunta">
            🗑️
          </button>
        </div>
      </div>
      <div className="question-card-body">
        <p className="question-text">{question.text}</p>
        <div className="approximation-answer-display">
          <span className="answer-label">Respuesta correcta:</span>
          <span className="answer-value">{question.correctAnswer}</span>
        </div>
      </div>
    </div>
  );
}

export default ApproximationBankManager;
