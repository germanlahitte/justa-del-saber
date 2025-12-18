import React, { useState } from 'react';
import './BankManager.css';
import { Question } from '../App';

interface Props {
  questionBank: Question[];
  onAddQuestion: (question: Question) => void;
  onRemoveQuestion: (id: string) => void;
  onUpdateBank: (questions: Question[]) => void;
  onBackToHome: () => void;
}

function QuestionBankManager({ questionBank, onAddQuestion, onRemoveQuestion, onUpdateBank, onBackToHome }: Props) {
  const [questionText, setQuestionText] = useState('');
  const [optionA, setOptionA] = useState('');
  const [optionB, setOptionB] = useState('');
  const [optionC, setOptionC] = useState('');
  const [optionD, setOptionD] = useState('');
  const [correctAnswer, setCorrectAnswer] = useState<'' | 'A' | 'B' | 'C' | 'D'>('');
  const [mediaType, setMediaType] = useState<'' | 'image' | 'video' | 'audio'>('');
  const [mediaUrl, setMediaUrl] = useState('');

  const handleAddQuestion = () => {
    if (questionText.trim() && optionA.trim() && optionB.trim() && optionC.trim() && optionD.trim() && correctAnswer) {
      const newQuestion: Question = {
        id: Date.now().toString(),
        text: questionText.trim(),
        options: {
          A: optionA.trim(),
          B: optionB.trim(),
          C: optionC.trim(),
          D: optionD.trim(),
        },
        correctAnswer: correctAnswer as 'A' | 'B' | 'C' | 'D',
        usedCount: 0,
        mediaType: mediaType || undefined,
        mediaUrl: mediaUrl.trim() || undefined
      };
      onAddQuestion(newQuestion);
      setQuestionText('');
      setOptionA('');
      setOptionB('');
      setOptionC('');
      setOptionD('');
      setCorrectAnswer('');
      setMediaType('');
      setMediaUrl('');
    }
  };

  const handleUpdateQuestion = (id: string, updates: Partial<Question>) => {
    const updatedBank = questionBank.map(q => 
      q.id === id ? { ...q, ...updates } : q
    );
    onUpdateBank(updatedBank);
  };

  const isFormValid = questionText.trim() && optionA.trim() && optionB.trim() && optionC.trim() && optionD.trim() && correctAnswer;

  return (
    <div className="bank-manager question-bank-manager">
      <div className="bank-header">
        <button onClick={onBackToHome} className="btn-back">
          🏠 Volver al Inicio
        </button>
        <h1>❓ Banco de Preguntas</h1>
      </div>

      <div className="question-form-section">
        <h2>Agregar Nueva Pregunta</h2>
        <div className="question-form-horizontal">
          <input
            type="text"
            value={questionText}
            onChange={(e) => setQuestionText(e.target.value)}
            placeholder="Texto de la pregunta"
            className="input-question-text"
          />
          
          <div className="options-row">
            <input
              type="text"
              value={optionA}
              onChange={(e) => setOptionA(e.target.value)}
              placeholder="Opción A"
            />
            <input
              type="text"
              value={optionB}
              onChange={(e) => setOptionB(e.target.value)}
              placeholder="Opción B"
            />
            <input
              type="text"
              value={optionC}
              onChange={(e) => setOptionC(e.target.value)}
              placeholder="Opción C"
            />
            <input
              type="text"
              value={optionD}
              onChange={(e) => setOptionD(e.target.value)}
              placeholder="Opción D"
            />
          </div>

          <div className="form-actions">
            <div className="correct-answer-selector">
              <label>Respuesta correcta:</label>
              <select 
                value={correctAnswer} 
                onChange={(e) => setCorrectAnswer(e.target.value as '' | 'A' | 'B' | 'C' | 'D')}
                aria-label="Respuesta correcta"
              >
                <option value="">Seleccionar...</option>
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="C">C</option>
                <option value="D">D</option>
              </select>
            </div>

            <button 
              onClick={handleAddQuestion}
              className="btn-add-question"
              disabled={!isFormValid}
            >
              Agregar Pregunta
            </button>
          </div>

          <div className="multimedia-section">
            <h3>📎 Contenido Multimedia (opcional)</h3>
            <div className="multimedia-fields">
              <div className="field-group">
                <label>Tipo de multimedia:</label>
                <select 
                  value={mediaType} 
                  onChange={(e) => setMediaType(e.target.value as '' | 'image' | 'video' | 'audio')}
                  aria-label="Tipo de multimedia"
                >
                  <option value="">Ninguno</option>
                  <option value="image">🖼️ Imagen</option>
                  <option value="video">🎥 Video</option>
                  <option value="audio">🔊 Audio</option>
                </select>
              </div>

              {mediaType && (
                <div className="field-group">
                  <label>URL o ruta del archivo:</label>
                  <div className="multimedia-input-group">
                    <input
                      type="text"
                      value={mediaUrl}
                      onChange={(e) => setMediaUrl(e.target.value)}
                      placeholder="https://ejemplo.com/archivo.mp4 o C:\ruta\archivo.mp4"
                      aria-label="URL del archivo multimedia"
                    />
                    <label className="btn-file-select">
                      📁 Seleccionar
                      <input
                        type="file"
                        accept={mediaType === 'image' ? 'image/*' : mediaType === 'video' ? 'video/*' : 'audio/*'}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setMediaUrl(file.path || file.name);
                          }
                        }}
                        className="hidden-file-input"
                      />
                    </label>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="question-list-section">
        <h2>Preguntas en el Banco ({questionBank.length})</h2>
        {questionBank.length === 0 ? (
          <p className="empty-message">No hay preguntas en el banco. Agrega la primera pregunta arriba.</p>
        ) : (
          <div className="question-bank-list">
            {questionBank.map((q, index) => (
              <QuestionCard 
                key={q.id}
                question={q}
                index={index}
                onRemove={onRemoveQuestion}
                onUpdate={handleUpdateQuestion}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface QuestionCardProps {
  question: Question;
  index: number;
  onRemove: (id: string) => void;
  onUpdate: (id: string, updates: Partial<Question>) => void;
}

function QuestionCard({ question, index, onRemove, onUpdate }: QuestionCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(question.text);
  const [editOptionA, setEditOptionA] = useState(question.options.A);
  const [editOptionB, setEditOptionB] = useState(question.options.B);
  const [editOptionC, setEditOptionC] = useState(question.options.C);
  const [editOptionD, setEditOptionD] = useState(question.options.D);
  const [editCorrectAnswer, setEditCorrectAnswer] = useState<'A' | 'B' | 'C' | 'D'>(question.correctAnswer);
  const [editMediaType, setEditMediaType] = useState<'' | 'image' | 'video' | 'audio'>(question.mediaType || '');
  const [editMediaUrl, setEditMediaUrl] = useState(question.mediaUrl || '');

  const handleSave = () => {
    // Update the question via parent callback
    onUpdate(question.id, {
      text: editText.trim(),
      options: {
        A: editOptionA.trim(),
        B: editOptionB.trim(),
        C: editOptionC.trim(),
        D: editOptionD.trim()
      },
      correctAnswer: editCorrectAnswer,
      mediaType: editMediaType || undefined,
      mediaUrl: editMediaUrl.trim() || undefined
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditText(question.text);
    setEditOptionA(question.options.A);
    setEditOptionB(question.options.B);
    setEditOptionC(question.options.C);
    setEditOptionD(question.options.D);
    setEditCorrectAnswer(question.correctAnswer);
    setEditMediaType(question.mediaType || '');
    setEditMediaUrl(question.mediaUrl || '');
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="question-card editing">
        <div className="question-card-header">
          <span className="question-number">Pregunta {index + 1}</span>
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
          />
          <div className="edit-options">
            <input
              type="text"
              value={editOptionA}
              onChange={(e) => setEditOptionA(e.target.value)}
              placeholder="Opción A"
            />
            <input
              type="text"
              value={editOptionB}
              onChange={(e) => setEditOptionB(e.target.value)}
              placeholder="Opción B"
            />
            <input
              type="text"
              value={editOptionC}
              onChange={(e) => setEditOptionC(e.target.value)}
              placeholder="Opción C"
            />
            <input
              type="text"
              value={editOptionD}
              onChange={(e) => setEditOptionD(e.target.value)}
              placeholder="Opción D"
            />
          </div>
          <div className="edit-correct-answer">
            <label>Respuesta correcta:</label>
            <select 
              value={editCorrectAnswer} 
              onChange={(e) => setEditCorrectAnswer(e.target.value as 'A' | 'B' | 'C' | 'D')}
            >
              <option value="A">A</option>
              <option value="B">B</option>
              <option value="C">C</option>
              <option value="D">D</option>
            </select>
          </div>
          <div className="multimedia-section">
            <h4>📎 Contenido Multimedia (opcional)</h4>
            <select 
              value={editMediaType} 
              onChange={(e) => setEditMediaType(e.target.value as '' | 'image' | 'video' | 'audio')}
              aria-label="Tipo de multimedia"
            >
              <option value="">Ninguno</option>
              <option value="image">🖼️ Imagen</option>
              <option value="video">🎥 Video</option>
              <option value="audio">🔊 Audio</option>
            </select>
            {editMediaType && (
              <div className="multimedia-input-group">
                <input
                  type="text"
                  value={editMediaUrl}
                  onChange={(e) => setEditMediaUrl(e.target.value)}
                  placeholder="URL o ruta del archivo"
                  aria-label="URL del multimedia"
                />
                <label className="btn-file-select">
                  📁 Seleccionar archivo
                  <input
                    type="file"
                    accept={editMediaType === 'image' ? 'image/*' : editMediaType === 'video' ? 'video/*' : 'audio/*'}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setEditMediaUrl(file.path || file.name);
                      }
                    }}
                    style={{ display: 'none' }}
                  />
                </label>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="question-card">
      <div className="question-card-header">
        <div className="question-header-left">
          <span className="question-number">Pregunta {index + 1}</span>
          {(question.usedCount || 0) > 0 && (
            <span className="used-badge-bank">
              Usada {question.usedCount}x
            </span>
          )}
          {question.mediaType && (
            <span className="multimedia-badge" title={`Incluye ${question.mediaType === 'image' ? 'imagen' : question.mediaType === 'video' ? 'video' : 'audio'}`}>
              {question.mediaType === 'image' ? '🖼️' : question.mediaType === 'video' ? '🎥' : '🔊'}
            </span>
          )}
        </div>
        <div className="card-actions">
          <button onClick={() => setIsEditing(true)} className="btn-edit" title="Editar pregunta">
            ✏️ Editar
          </button>
          <button onClick={() => onRemove(question.id)} className="btn-delete" title="Eliminar pregunta">
            🗑️ Eliminar
          </button>
        </div>
      </div>
      <div className="question-card-body">
        <p className="question-text-display">{question.text}</p>
        <div className="options-display">
          <div className={`option-item ${question.correctAnswer === 'A' ? 'correct' : ''}`}>
            <span className="option-letter">A</span>
            <span className="option-text">{question.options.A}</span>
          </div>
          <div className={`option-item ${question.correctAnswer === 'B' ? 'correct' : ''}`}>
            <span className="option-letter">B</span>
            <span className="option-text">{question.options.B}</span>
          </div>
          <div className={`option-item ${question.correctAnswer === 'C' ? 'correct' : ''}`}>
            <span className="option-letter">C</span>
            <span className="option-text">{question.options.C}</span>
          </div>
          <div className={`option-item ${question.correctAnswer === 'D' ? 'correct' : ''}`}>
            <span className="option-letter">D</span>
            <span className="option-text">{question.options.D}</span>
          </div>
        </div>
        {question.mediaType && question.mediaUrl && (
          <div className="multimedia-info">
            <span className="multimedia-label">
              {question.mediaType === 'image' ? '🖼️ Imagen' : question.mediaType === 'video' ? '🎥 Video' : '🔊 Audio'}:
            </span>
            <span className="multimedia-url" title={question.mediaUrl}>
              {question.mediaUrl.length > 50 ? question.mediaUrl.substring(0, 50) + '...' : question.mediaUrl}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export default QuestionBankManager;
