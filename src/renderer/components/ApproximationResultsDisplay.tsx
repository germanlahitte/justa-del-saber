import React from 'react';
import './Podium.css';
import './Approximation.css';
import { Team, ApproximationAnswer, FinalTieBreakGroup } from '../App';

interface Props {
  question: string;
  correctAnswer: number;
  answers: ApproximationAnswer[];
  teams: Team[];
  groups: FinalTieBreakGroup[];
  hasUnresolvedTies: boolean;
  onContinue: () => void;
  onFinish: () => void;
}

function ApproximationResultsDisplay({ 
  question, 
  correctAnswer, 
  answers, 
  teams,
  groups,
  hasUnresolvedTies,
  onContinue,
  onFinish 
}: Props) {
  // Ordenar respuestas por diferencia (menor diferencia = mejor)
  const sortedAnswers = [...answers].sort((a, b) => a.difference - b.difference);

  // Obtener nombre del equipo
  const getTeamName = (teamId: string) => {
    const team = teams.find(t => t.id === teamId);
    return team ? team.name : 'Desconocido';
  };

  // Determinar si un equipo está en un grupo resuelto o empatado
  const getTeamStatus = (teamId: string, answer: ApproximationAnswer) => {
    // Buscar el grupo al que pertenece este equipo
    const teamGroup = groups.find(g => g.teamIds.includes(teamId));
    
    if (!teamGroup) {
      // Si no está en ningún grupo, asumir que está resuelto
      return { isResolved: true, isTied: false };
    }

    // Si el grupo está marcado como resuelto, el equipo está resuelto
    if (teamGroup.resolved) {
      return { isResolved: true, isTied: false };
    }

    // Si el grupo no está resuelto, verificar si este equipo sigue empatado
    const lastRound = teamGroup.rounds[teamGroup.rounds.length - 1];
    const sortedGroupAnswers = [...lastRound.answers].sort((a, b) => a.difference - b.difference);
    
    // Agrupar por diferencia
    const byDifference = new Map<number, string[]>();
    sortedGroupAnswers.forEach(ans => {
      const existing = byDifference.get(ans.difference) || [];
      existing.push(ans.teamId);
      byDifference.set(ans.difference, existing);
    });
    
    // Encontrar la diferencia del equipo actual
    const currentAnswer = sortedGroupAnswers.find(a => a.teamId === teamId);
    if (!currentAnswer) {
      return { isResolved: false, isTied: false };
    }
    
    // Verificar si hay otros equipos con la misma diferencia
    const teamsWithSameDifference = byDifference.get(currentAnswer.difference) || [];
    const isTied = teamsWithSameDifference.length > 1;
    
    // Un equipo está resuelto si:
    // 1. El grupo está resuelto, O
    // 2. No está empatado con nadie más
    return { isResolved: !isTied, isTied };
  };

  return (
    <div className="podium-container">
      <div className="podium-header">
        <h1>📊 Resultados de la Pregunta de Aproximación</h1>
      </div>

      <div className="approximation-question-recap">
        <h3>Pregunta:</h3>
        <p className="question-text">{question}</p>
        <div className="correct-answer-display">
          <span className="label">Respuesta Correcta:</span>
          <span className="value">{correctAnswer}</span>
        </div>
      </div>

      <div className="approximation-results-table">
        <h3>Ordenamiento por Aproximación:</h3>
        <table>
          <thead>
            <tr>
              <th>Posición</th>
              <th>Equipo</th>
              <th>Respuesta</th>
              <th>Diferencia</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {sortedAnswers.map((answer, index) => {
              const teamName = getTeamName(answer.teamId);
              const position = index + 1;
              
              // Verificar el estado del equipo según su grupo
              const { isResolved, isTied } = getTeamStatus(answer.teamId, answer);
              
              console.log(`📊 [Tabla] Equipo ${teamName}: diff=${answer.difference}, isResolved=${isResolved}, isTied=${isTied}`);

              return (
                <tr key={answer.teamId} className={isTied ? 'tied-row' : ''}>
                  <td className="position-cell">
                    {isTied ? '🔄' : `${position}°`}
                  </td>
                  <td className="team-cell">{teamName}</td>
                  <td className="answer-cell">{answer.answer}</td>
                  <td className="difference-cell">
                    {answer.difference === 0 ? (
                      <span className="exact-match">¡Exacto!</span>
                    ) : (
                      `±${answer.difference}`
                    )}
                  </td>
                  <td className="status-cell">
                    {isResolved ? (
                      <span className="resolved-badge">✓ Resuelto</span>
                    ) : isTied ? (
                      <span className="tied-badge">🔄 Empatado</span>
                    ) : (
                      <span className="resolved-badge">✓ Resuelto</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {hasUnresolvedTies && (
        <div className="tie-warning">
          ⚠️ Algunos equipos tienen la misma diferencia. Se requiere otra pregunta de aproximación para resolver el empate.
        </div>
      )}

      <div className="approximation-actions">
        {hasUnresolvedTies ? (
          <button onClick={onContinue} className="btn-primary btn-large">
            ➡️ Continuar con otra pregunta de aproximación
          </button>
        ) : (
          <button onClick={onFinish} className="btn-primary btn-large">
            ✓ Finalizar - Todos los empates resueltos
          </button>
        )}
      </div>
    </div>
  );
}

export default ApproximationResultsDisplay;
