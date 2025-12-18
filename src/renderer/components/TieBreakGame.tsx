import React, { useState, useEffect } from 'react';
import './TeamScoring.css';
import { Team, Question, TieBreakResult } from '../App';
import { TieBreakGroup, hasEarlyVictory } from '../utils/tieBreakUtils';

interface Props {
  groups: TieBreakGroup[];
  allTeams: Team[];
  tieBreakQuestions: Question[];
  initialTieBreakResult: TieBreakResult | null;
  onComplete: (result: TieBreakResult) => void;
  onBackToHome: () => void;
}

interface TeamTieBreakStatus {
  teamId: string;
  score: number;
  resolved: boolean;
  position?: number;
}

function TieBreakGame({ groups, allTeams, tieBreakQuestions, initialTieBreakResult, onComplete, onBackToHome }: Props) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(initialTieBreakResult?.currentQuestionIndex || 0);
  const [teamScores, setTeamScores] = useState<{ [teamId: string]: number }>(
    initialTieBreakResult?.teamScores || {}
  );
  const [resolvedTeams, setResolvedTeams] = useState<string[]>(
    initialTieBreakResult?.resolvedTeams || []
  );
  const [showingQuestion, setShowingQuestion] = useState(true);
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);
  const [timerSeconds, setTimerSeconds] = useState(30);
  const [timerActive, setTimerActive] = useState(false);
  const [answerRevealed, setAnswerRevealed] = useState(false);
  const [newlyResolvedTeams, setNewlyResolvedTeams] = useState<string[]>([]);
  const [isCardFlipped, setIsCardFlipped] = useState(false);

  // Inicializar puntajes si es la primera vez
  useEffect(() => {
    if (Object.keys(teamScores).length === 0) {
      const initialScores: { [teamId: string]: number } = {};
      groups.forEach(group => {
        group.teams.forEach(team => {
          initialScores[team.id] = 0;
        });
      });
      setTeamScores(initialScores);
    }
  }, [groups, teamScores]);

  // Timer
  useEffect(() => {
    if (timerActive && timerSeconds > 0) {
      const interval = setInterval(() => {
        setTimerSeconds(prev => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [timerActive, timerSeconds]);

  const currentQuestion = tieBreakQuestions[currentQuestionIndex];
  const allTeamsParticipating = groups.flatMap(g => g.teams);
  const activeTeams = allTeamsParticipating.filter(t => !resolvedTeams.includes(t.id));

  const handleStartTimer = () => {
    setIsCardFlipped(true);
    setTimerSeconds(30);
    setTimerActive(true);
    setAnswerRevealed(false);
    setSelectedTeams([]);
    setNewlyResolvedTeams([]);
  };

  const handleToggleTeam = (teamId: string) => {
    if (resolvedTeams.includes(teamId)) return;
    
    setSelectedTeams(prev =>
      prev.includes(teamId)
        ? prev.filter(id => id !== teamId)
        : [...prev, teamId]
    );
  };

  const handleRevealAnswer = () => {
    setTimerActive(false);
    setAnswerRevealed(true);

    // Actualizar puntajes
    const newScores = { ...teamScores };
    selectedTeams.forEach(teamId => {
      newScores[teamId] = (newScores[teamId] || 0) + 1;
    });
    setTeamScores(newScores);

    // Detectar victorias prematuras
    const questionsRemaining = 4 - currentQuestionIndex;
    const newlyResolved: string[] = [];

    groups.forEach(group => {
      const activeTeamsInGroup = group.teams.filter(t => !resolvedTeams.includes(t.id));
      
      if (activeTeamsInGroup.length > 1) {
        // Ordenar equipos del grupo por puntaje de desempate
        const sorted = [...activeTeamsInGroup].sort((a, b) => 
          (newScores[b.id] || 0) - (newScores[a.id] || 0)
        );

        // Verificar si el primer lugar tiene victoria prematura
        const firstScore = newScores[sorted[0].id] || 0;
        const secondScore = newScores[sorted[1].id] || 0;

        if (hasEarlyVictory(firstScore, secondScore, questionsRemaining)) {
          newlyResolved.push(sorted[0].id);
        }
      }
    });

    if (newlyResolved.length > 0) {
      setNewlyResolvedTeams(newlyResolved);
      setResolvedTeams(prev => [...prev, ...newlyResolved]);
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < 4) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setShowingQuestion(true);
      setSelectedTeams([]);
      setAnswerRevealed(false);
      setTimerSeconds(30);
      setTimerActive(false);
      setNewlyResolvedTeams([]);
      setIsCardFlipped(false);
    } else {
      handleFinishTieBreak();
    }
  };

  const handleFinishTieBreak = () => {
    // Calcular posiciones finales
    const finalPositions: { [teamId: string]: number } = {};
    
    groups.forEach(group => {
      const teamsInGroup = group.teams.map(t => ({
        ...t,
        tieBreakScore: teamScores[t.id] || 0
      })).sort((a, b) => b.tieBreakScore - a.tieBreakScore);

      teamsInGroup.forEach((team, index) => {
        const position = group.positionNumbers[index] || group.positionNumbers[group.positionNumbers.length - 1];
        finalPositions[team.id] = position;
      });
    });

    const result: TieBreakResult = {
      currentQuestionIndex: currentQuestionIndex + 1,
      teamScores,
      resolvedTeams,
      finalPositions
    };

    onComplete(result);
  };

  const getTeamTieBreakScore = (teamId: string) => teamScores[teamId] || 0;

  const getGroupForTeam = (teamId: string) => {
    return groups.find(g => g.teams.some(t => t.id === teamId));
  };

  return (
    <div className="team-scoring">
      <div className="scoring-header">
        <button onClick={onBackToHome} className="btn-back-scoring">
          🏠 Volver
        </button>
        <div className="question-info">
          <h2>⚔️ Desempate - Pregunta {currentQuestionIndex + 1} de 5</h2>
        </div>
      </div>

      <div className="scoring-content">
        <div className="question-section">
          {!isCardFlipped ? (
            <div className="tiebreak-card-back">
              <div className="card-back-content">
                <div className="card-back-icon">⚔️</div>
                <h2>Pregunta de Desempate</h2>
                <p>Presiona ▶ Iniciar Timer para revelar la pregunta</p>
              </div>
            </div>
          ) : (
            <div className="question-box-large">
              <h3 className="question-text-large">{currentQuestion.text}</h3>
              <div className="options-grid-large">
                {Object.entries(currentQuestion.options).map(([letter, text]) => (
                  <div
                    key={letter}
                    className={`option-large ${
                      answerRevealed && letter === currentQuestion.correctAnswer ? 'correct' : ''
                    }`}
                  >
                    <span className="option-letter-large">{letter}</span>
                    <span className="option-text-large">{text}</span>
                  </div>
                ))}
              </div>
              {answerRevealed && (
                <div className="correct-answer-banner">
                  ✓ Respuesta correcta: {currentQuestion.correctAnswer}
                </div>
              )}
            </div>
          )}

          <div className="timer-controls">
            {!timerActive && !answerRevealed && (
              <button onClick={handleStartTimer} className="btn-start-timer">
                ▶️ Iniciar Timer (30s)
              </button>
            )}
            {timerActive && (
              <div className={`timer-display ${timerSeconds <= 10 ? 'warning' : ''}`}>
                ⏱️ {timerSeconds}s
              </div>
            )}
            {timerActive && (
              <button onClick={handleRevealAnswer} className="btn-reveal-answer">
                👁️ Revelar Respuesta
              </button>
            )}
            {answerRevealed && (
              <button onClick={handleNextQuestion} className="btn-next-question-tiebreak">
                {currentQuestionIndex < 4 ? '➡️ Siguiente Pregunta' : '🏆 Finalizar Desempate'}
              </button>
            )}
          </div>
        </div>

        <div className="teams-scoring-section">
          <h3>Equipos en Desempate</h3>
          
          {groups.map((group, groupIndex) => {
            const activeInGroup = group.teams.filter(t => !resolvedTeams.includes(t.id));
            const resolvedInGroup = group.teams.filter(t => resolvedTeams.includes(t.id));

            return (
              <div key={groupIndex} className="tiebreak-group-scoring">
                <div className="group-label">
                  🏆 Disputa por {group.positions}
                </div>

                {activeInGroup.length > 0 && (
                  <div className="active-teams-section">
                    {activeInGroup.map(team => {
                      const isSelected = selectedTeams.includes(team.id);
                      const tieBreakScore = getTeamTieBreakScore(team.id);
                      const isNewlyResolved = newlyResolvedTeams.includes(team.id);

                      return (
                        <div
                          key={team.id}
                          className={`team-scoring-card ${isSelected ? 'selected' : ''} ${
                            isNewlyResolved ? 'newly-resolved' : ''
                          }`}
                          onClick={() => !answerRevealed && handleToggleTeam(team.id)}
                        >
                          <div className="team-scoring-info">
                            <div className="team-scoring-name">{team.name}</div>
                            <div className="team-original-score">{team.score} pts originales</div>
                          </div>
                          <div className="team-tiebreak-score">
                            {tieBreakScore} pts
                          </div>
                          {isNewlyResolved && (
                            <div className="resolved-badge">
                              ✓ Posición Definida
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {resolvedInGroup.length > 0 && (
                  <div className="resolved-teams-section">
                    <p className="resolved-label">✓ Posiciones Ya Definidas:</p>
                    {resolvedInGroup.map(team => (
                      <div key={team.id} className="team-scoring-card resolved">
                        <div className="team-scoring-info">
                          <div className="team-scoring-name">{team.name}</div>
                        </div>
                        <div className="team-tiebreak-score">
                          {getTeamTieBreakScore(team.id)} pts
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default TieBreakGame;
