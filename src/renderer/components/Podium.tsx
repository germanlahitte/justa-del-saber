import React from 'react';
import './Podium.css';
import { Team, TieBreakResult, FinalTieBreakResult } from '../App';

interface Props {
  teams: Team[];
  tieBreakResult?: TieBreakResult;
  finalTieBreakResult?: FinalTieBreakResult;
  onBackToResults: () => void;
}

function Podium({ teams, tieBreakResult, finalTieBreakResult, onBackToResults }: Props) {
  // Ordenar equipos por puntaje
  const sortedTeams = [...teams].sort((a, b) => b.score - a.score);

  // Determinar posiciones finales (siempre mostrar top 3)
  let finalPositions: { team: Team; position: number; tieBreakScore?: number; wonByApproximation?: boolean }[] = [];

  if (finalTieBreakResult?.allResolved) {
    // Hubo desempate por aproximación: usar el orden de los grupos resueltos
    const totalTeams = teams.length;
    const finalOrderArray: string[] = new Array(totalTeams).fill('');
    
    // Primero, ordenar todos los equipos por puntaje del certamen
    const allTeamsSorted = [...teams].sort((a, b) => b.score - a.score);
    
    // Llenar el array con el orden por defecto (por puntaje)
    allTeamsSorted.forEach((team, index) => {
      finalOrderArray[index] = team.id;
    });
    
    // Luego, sobrescribir con los resultados del desempate por aproximación
    finalTieBreakResult.groups
      .filter(g => g.resolved && g.finalOrder)
      .forEach(group => {
        // La posición en disputa es 1-indexed (1, 2, 3)
        // El array es 0-indexed, entonces positionInDispute - 1 es el índice correcto
        const startPosition = group.positionInDispute - 1;
        
        // Colocar el orden final del grupo en las posiciones correspondientes
        group.finalOrder!.forEach((teamId, index) => {
          finalOrderArray[startPosition + index] = teamId;
        });
      });
    
    finalPositions = finalOrderArray
      .filter(teamId => teamId) // Filtrar posiciones vacías
      .map((teamId, index) => {
        const team = teams.find(t => t.id === teamId)!;
        const position = index + 1; // 1-indexed
        
        // Verificar si este equipo ganó su posición en un desempate por aproximación
        let wonByApproximation = false;
        for (const group of finalTieBreakResult.groups) {
          if (group.resolved && group.finalOrder && group.finalOrder[0] === teamId && group.positionInDispute === position) {
            wonByApproximation = true;
            break;
          }
        }
        
        // Obtener puntaje de desempate si existe
        const tieBreakScore = tieBreakResult?.teamScores?.[teamId];
        
        return {
          team,
          position,
          wonByApproximation,
          tieBreakScore
        };
      })
      .slice(0, 3); // Solo top 3
  } else if (tieBreakResult && tieBreakResult.finalPositions) {
    // Hubo desempate: combinar equipos con posiciones del desempate y el resto por puntaje original
    const tieBreakTeamIds = Object.keys(tieBreakResult.finalPositions);
    
    // Equipos que participaron en el desempate
    const tieBreakPositions = Object.entries(tieBreakResult.finalPositions)
      .map(([teamId, position]) => {
        const team = teams.find(t => t.id === teamId)!;
        return {
          team,
          position,
          tieBreakScore: tieBreakResult.teamScores[teamId]
        };
      });
    
    // Equipos que NO participaron en el desempate (usar posiciones por puntaje original)
    const nonTieBreakTeams = sortedTeams
      .filter(team => !tieBreakTeamIds.includes(team.id))
      .map((team, index) => {
        // Determinar posición: contar cuántos equipos tienen mejor puntaje
        const position = sortedTeams.findIndex(t => t.id === team.id) + 1;
        return {
          team,
          position
        };
      });
    
    // Combinar ambos grupos y ordenar por posición
    finalPositions = [...tieBreakPositions, ...nonTieBreakTeams]
      .sort((a, b) => a.position - b.position)
      .slice(0, 3); // Solo top 3
  } else {
    // No hubo desempate, usar puntajes originales
    finalPositions = sortedTeams.slice(0, 3).map((team, index) => ({
      team,
      position: index + 1
    }));
  }

  const first = finalPositions.find(p => p.position === 1);
  const second = finalPositions.find(p => p.position === 2);
  const third = finalPositions.find(p => p.position === 3);

  return (
    <div className="podium-screen">
      <div className="podium-container">
        <div className="podium-header">
          <h1>🏆 Podio Final</h1>
          <p className="podium-subtitle">¡Felicitaciones a los ganadores!</p>
        </div>

        <div className="podium-structure">
          {/* Segundo Lugar - Izquierda */}
          {second && (
            <div className="podium-place second-place">
              <div className="winner-info">
                <div className="position-medal silver">🥈</div>
                <div className="team-name-podium">
                  {second.team.name}
                  {second.wonByApproximation && <span className="boomerang-award"> 🪃</span>}
                </div>
                <div className="team-score-podium">
                  {second.tieBreakScore !== undefined ? (
                    <>
                      <span className="total-score">{second.team.score + second.tieBreakScore} pts</span>
                      <span className="score-breakdown">({second.team.score} + {second.tieBreakScore})</span>
                    </>
                  ) : (
                    <span>{second.team.score} pts</span>
                  )}
                </div>
              </div>
              <div className="podium-block second-block">
                <div className="position-number">2°</div>
              </div>
            </div>
          )}

          {/* Primer Lugar - Centro */}
          {first && (
            <div className="podium-place first-place">
              <div className="winner-crown">👑</div>
              <div className="winner-info">
                <div className="position-medal gold">🥇</div>
                <div className="team-name-podium champion">
                  {first.team.name}
                  {first.wonByApproximation && <span className="boomerang-award"> 🪃</span>}
                </div>
                <div className="team-score-podium">
                  {first.tieBreakScore !== undefined ? (
                    <>
                      <span className="total-score">{first.team.score + first.tieBreakScore} pts</span>
                      <span className="score-breakdown">({first.team.score} + {first.tieBreakScore})</span>
                    </>
                  ) : (
                    <span>{first.team.score} pts</span>
                  )}
                </div>
              </div>
              <div className="podium-block first-block">
                <div className="position-number">1°</div>
              </div>
            </div>
          )}

          {/* Tercer Lugar - Derecha */}
          {third && (
            <div className="podium-place third-place">
              <div className="winner-info">
                <div className="position-medal bronze">🥉</div>
                <div className="team-name-podium">
                  {third.team.name}
                  {third.wonByApproximation && <span className="boomerang-award"> 🪃</span>}
                </div>
                <div className="team-score-podium">
                  {third.tieBreakScore !== undefined ? (
                    <>
                      <span className="total-score">{third.team.score + third.tieBreakScore} pts</span>
                      <span className="score-breakdown">({third.team.score} + {third.tieBreakScore})</span>
                    </>
                  ) : (
                    <span>{third.team.score} pts</span>
                  )}
                </div>
              </div>
              <div className="podium-block third-block">
                <div className="position-number">3°</div>
              </div>
            </div>
          )}
        </div>

        <div className="podium-actions">
          <button onClick={onBackToResults} className="btn-back-to-results">
            🏠 Volver a Resultados
          </button>
        </div>
      </div>

      {/* Confetti effect */}
      <div className="confetti-container">
        {[...Array(50)].map((_, i) => (
          <div
            key={i}
            className={`confetti confetti-${i % 5}`}
          />
        ))}
      </div>
    </div>
  );
}

export default Podium;
