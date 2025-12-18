import React, { useState } from 'react';
import './ContestManager.css';
import { Contest, Team, Question, TeamTemplate } from '../App';

interface Props {
  onStartContest: (contest: Contest) => void;
  onViewContests: () => void;
  onBackToHome: () => void;
  teamBank: TeamTemplate[];
  questionBank: Question[];
  onAddTeamToBank: (team: TeamTemplate) => void;
  onRemoveTeamFromBank: (id: string) => void;
  onAddQuestionToBank: (question: Question) => void;
  onRemoveQuestionFromBank: (id: string) => void;
}

function ContestManager({ 
  onStartContest,
  onViewContests,
  onBackToHome,
  teamBank, 
  questionBank,
  onAddTeamToBank,
  onRemoveTeamFromBank,
  onAddQuestionToBank,
  onRemoveQuestionFromBank
}: Props) {
  const [view, setView] = useState<'banks' | 'contest'>('banks');
  const [activeTab, setActiveTab] = useState<'teams' | 'questions'>('teams');
  
  // Para el banco de equipos
  const [teamName, setTeamName] = useState('');
  
  // Para el banco de preguntas
  const [questionText, setQuestionText] = useState('');
  const [optionA, setOptionA] = useState('');
  const [optionB, setOptionB] = useState('');
  const [optionC, setOptionC] = useState('');
  const [optionD, setOptionD] = useState('');
  const [correctAnswer, setCorrectAnswer] = useState<'' | 'A' | 'B' | 'C' | 'D'>('');

  // Para crear certamen
  const [contestName, setContestName] = useState('');
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([]);

  const handleAddTeamToBank = () => {
    if (teamName.trim()) {
      const newTeam: TeamTemplate = {
        id: Date.now().toString(),
        name: teamName.trim(),
      };
      onAddTeamToBank(newTeam);
      setTeamName('');
    }
  };

  const handleAddQuestionToBank = () => {
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
      };
      onAddQuestionToBank(newQuestion);
      setQuestionText('');
      setOptionA('');
      setOptionB('');
      setOptionC('');
      setOptionD('');
      setCorrectAnswer('');
    }
  };

  const toggleTeamSelection = (teamId: string) => {
    if (selectedTeams.includes(teamId)) {
      setSelectedTeams(selectedTeams.filter(id => id !== teamId));
    } else {
      setSelectedTeams([...selectedTeams, teamId]);
    }
  };

  const toggleQuestionSelection = (questionId: string) => {
    if (selectedQuestions.includes(questionId)) {
      setSelectedQuestions(selectedQuestions.filter(id => id !== questionId));
    } else {
      setSelectedQuestions([...selectedQuestions, questionId]);
    }
  };

  const handleStartContest = () => {
    if (contestName.trim() && selectedTeams.length > 0 && selectedQuestions.length > 0) {
      const teams: Team[] = teamBank
        .filter(t => selectedTeams.includes(t.id))
        .map(t => ({ ...t, score: 0 }));
      
      const questions = questionBank.filter(q => selectedQuestions.includes(q.id));

      const contest: Contest = {
        id: Date.now().toString(),
        name: contestName.trim(),
        teams,
        questions,
        results: questions.map(q => ({
          questionId: q.id,
          correctTeamIds: [],
          completed: false,
          answerRevealed: false
        }))
      };
      onStartContest(contest);
    } else {
      alert('Por favor completa el nombre del certamen, selecciona al menos un equipo y una pregunta.');
    }
  };

  if (view === 'banks') {
    return (
      <div className="contest-manager">
        <div className="manager-header">
          <button onClick={onBackToHome} className="btn-back-home">
            🏠 Volver al Inicio
          </button>
          <h1>➕ Nuevo Certamen</h1>
          <button onClick={onViewContests} className="btn-view-contests">
            📋 Ver Certámenes Guardados
          </button>
        </div>
        
        <div className="tabs">
          <button 
            className={activeTab === 'teams' ? 'tab active' : 'tab'}
            onClick={() => setActiveTab('teams')}
          >
            Banco de Equipos ({teamBank.length})
          </button>
          <button 
            className={activeTab === 'questions' ? 'tab active' : 'tab'}
            onClick={() => setActiveTab('questions')}
          >
            Banco de Preguntas ({questionBank.length})
          </button>
        </div>

        {activeTab === 'teams' ? (
          <div className="section">
            <h2>Agregar Equipo al Banco</h2>
            <div className="add-form">
              <input
                type="text"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="Nombre del equipo"
                onKeyPress={(e) => e.key === 'Enter' && handleAddTeamToBank()}
              />
              <button onClick={handleAddTeamToBank}>Agregar</button>
            </div>
            <ul className="item-list">
              {teamBank.map(team => (
                <li key={team.id}>
                  <span>{team.name}</span>
                  <button onClick={() => onRemoveTeamFromBank(team.id)} className="remove-btn">
                    Eliminar
                  </button>
                </li>
              ))}
            </ul>
            {teamBank.length === 0 && (
              <p className="empty-message">No hay equipos en el banco. Agrega algunos para poder crear certámenes.</p>
            )}
          </div>
        ) : (
          <div className="section questions-section">
            <div className="question-form-container">
              <h2>Agregar Pregunta al Banco</h2>
              <div className="question-form">
                <input
                  type="text"
                  value={questionText}
                  onChange={(e) => setQuestionText(e.target.value)}
                  placeholder="Pregunta"
                  className="input-large"
                />
                <div className="options-grid">
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
                <div className="correct-answer">
                  <label>Respuesta correcta:</label>
                  <select 
                    value={correctAnswer} 
                    onChange={(e) => setCorrectAnswer(e.target.value as 'A' | 'B' | 'C' | 'D')}
                    title="Seleccionar respuesta correcta"
                  >
                    <option value="">Seleccionar...</option>
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="C">C</option>
                    <option value="D">D</option>
                  </select>
                </div>
                <button 
                  onClick={handleAddQuestionToBank} 
                  className="btn-primary"
                  disabled={!questionText.trim() || !optionA.trim() || !optionB.trim() || !optionC.trim() || !optionD.trim() || !correctAnswer}
                >
                  Agregar Pregunta
                </button>
              </div>
            </div>
            
            <div className="question-list-container">
              <h2>Preguntas en el Banco ({questionBank.length})</h2>
              <ul className="item-list">
                {questionBank.map((q, index) => (
                  <li key={q.id}>
                    <div>
                      <strong>P{index + 1}:</strong> {q.text}
                      <div className="question-options">
                        A: {q.options.A} | B: {q.options.B} | C: {q.options.C} | D: {q.options.D}
                        <span className="correct-badge">Correcta: {q.correctAnswer}</span>
                      </div>
                    </div>
                    <button onClick={() => onRemoveQuestionFromBank(q.id)} className="remove-btn">
                      Eliminar
                    </button>
                  </li>
                ))}
              </ul>
              {questionBank.length === 0 && (
                <p className="empty-message">No hay preguntas en el banco.</p>
              )}
            </div>
          </div>
        )}

        <div className="start-section">
          <button 
            onClick={() => setView('contest')} 
            className="btn-start"
            disabled={teamBank.length === 0 || questionBank.length === 0}
          >
            Crear Certamen
          </button>
          {(teamBank.length === 0 || questionBank.length === 0) && (
            <p className="warning-message">Necesitas al menos 1 equipo y 1 pregunta en los bancos para crear un certamen.</p>
          )}
        </div>
      </div>
    );
  }

  // Vista de creación de certamen
  return (
    <div className="contest-manager">
      <div className="header-with-back">
        <button onClick={() => setView('banks')} className="back-button">
          🏠 Volver a Bancos
        </button>
        <h1>Crear Certamen</h1>
      </div>
      
      <div className="section">
        <h2>Nombre del Certamen</h2>
        <input
          type="text"
          value={contestName}
          onChange={(e) => setContestName(e.target.value)}
          placeholder="Ej: Trivia de Conocimientos Generales"
          className="input-large"
        />
      </div>

      <div className="section">
        <h2>Seleccionar Equipos ({selectedTeams.length} seleccionados)</h2>
        <div className="selection-buttons">
          <button onClick={() => setSelectedTeams(teamBank.map(t => t.id))} className="btn-secondary">
            Seleccionar Todos
          </button>
          <button onClick={() => setSelectedTeams([])} className="btn-secondary">
            Deseleccionar Todos
          </button>
        </div>
        <ul className="selectable-list">
          {teamBank.map(team => (
            <li 
              key={team.id}
              className={selectedTeams.includes(team.id) ? 'selected' : ''}
              onClick={() => toggleTeamSelection(team.id)}
            >
              <input 
                type="checkbox" 
                checked={selectedTeams.includes(team.id)}
                onChange={() => toggleTeamSelection(team.id)}
              />
              <span>{team.name}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="section">
        <h2>Seleccionar Preguntas ({selectedQuestions.length} seleccionadas)</h2>
        <div className="selection-buttons">
          <button onClick={() => setSelectedQuestions(questionBank.map(q => q.id))} className="btn-secondary">
            Seleccionar Todas
          </button>
          <button onClick={() => setSelectedQuestions([])} className="btn-secondary">
            Deseleccionar Todas
          </button>
        </div>
        <ul className="selectable-list">
          {questionBank.map((q, index) => (
            <li 
              key={q.id}
              className={selectedQuestions.includes(q.id) ? 'selected' : ''}
              onClick={() => toggleQuestionSelection(q.id)}
            >
              <input 
                type="checkbox" 
                checked={selectedQuestions.includes(q.id)}
                onChange={() => toggleQuestionSelection(q.id)}
              />
              <div>
                <strong>P{index + 1}:</strong> {q.text}
                <div className="question-preview">
                  A: {q.options.A} | B: {q.options.B} | C: {q.options.C} | D: {q.options.D}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="start-section">
        <button onClick={handleStartContest} className="btn-start">
          Iniciar Certamen
        </button>
      </div>
    </div>
  );
}

export default ContestManager;
