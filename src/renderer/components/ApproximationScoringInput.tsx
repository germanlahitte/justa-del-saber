import React, { useState } from 'react';
import './TeamScoring.css';
import './Approximation.css';
import { Team } from '../App';

interface Props {
  teams: Team[];
  onSubmit: (answers: { [teamId: string]: number }) => void;
  onBack: () => void;
}

function ApproximationScoringInput({ teams, onSubmit, onBack }: Props) {
  const [answers, setAnswers] = useState<{ [teamId: string]: string }>({});

  const handleAnswerChange = (teamId: string, value: string) => {
    setAnswers(prev => ({
      ...prev,
      [teamId]: value
    }));
  };

  const handleSubmit = () => {
    // Convertir todas las respuestas a números
    const numericAnswers: { [teamId: string]: number } = {};
    let allValid = true;

    teams.forEach(team => {
      const answer = answers[team.id];
      if (answer === undefined || answer.trim() === '') {
        allValid = false;
        return;
      }
      const num = parseFloat(answer);
      if (isNaN(num)) {
        allValid = false;
        return;
      }
      numericAnswers[team.id] = num;
    });

    if (!allValid) {
      alert('Por favor, ingresa respuestas numéricas válidas para todos los equipos.');
      return;
    }

    onSubmit(numericAnswers);
  };

  const allAnswersEntered = teams.every(team => {
    const answer = answers[team.id];
    return answer !== undefined && answer.trim() !== '' && !isNaN(parseFloat(answer));
  });

  return (
    <div className="team-scoring">
      <div className="scoring-header">
        <h2>Registrar Respuestas de los Equipos</h2>
        <p className="instructions">
          Ingresa la respuesta numérica que cada equipo entregó en su papel.
        </p>
      </div>

      <div className="approximation-answers-form">
        {teams.map(team => (
          <div key={team.id} className="approximation-answer-row">
            <div className="team-name-label">
              <span className="team-icon">👥</span>
              <span className="team-name">{team.name}</span>
            </div>
            <input
              type="number"
              step="any"
              value={answers[team.id] || ''}
              onChange={(e) => handleAnswerChange(team.id, e.target.value)}
              placeholder="Respuesta numérica"
              className="approximation-answer-input"
            />
          </div>
        ))}
      </div>

      <div className="scoring-actions">
        <button onClick={onBack} className="btn-secondary">
          🏠 Volver
        </button>
        <button 
          onClick={handleSubmit} 
          disabled={!allAnswersEntered}
          className="btn-primary"
        >
          Revelar Respuesta Correcta →
        </button>
      </div>
    </div>
  );
}

export default ApproximationScoringInput;
