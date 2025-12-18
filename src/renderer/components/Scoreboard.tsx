import React from 'react';
import './Scoreboard.css';
import { Team, TieBreakResult, FinalTieBreakResult } from '../App';
import { TieBreakGroup } from '../utils/tieBreakUtils';

interface Props {
  teams: Team[];
  contestCompleted?: boolean;
  onShowPodium?: () => void;
  // Props para modo desempate
  isTieBreakMode?: boolean;
  tieBreakGroups?: TieBreakGroup[];
  tieBreakResults?: TieBreakResult;
  // Para mostrar resultados finales con desempates resueltos
  finalTieBreakResult?: FinalTieBreakResult;
}

function Scoreboard({ 
  teams, 
  contestCompleted = false, 
  onShowPodium,
  isTieBreakMode = false,
  tieBreakGroups = [],
  tieBreakResults,
  finalTieBreakResult
}: Props) {
  // Determinar el orden de los equipos
  let sortedTeams: Team[];
  
  // Si hay resultado de desempate por aproximación resuelto
  if (finalTieBreakResult?.allResolved) {
    // Primero, ordenar todos los equipos por puntaje del certamen
    const allTeamsSorted = [...teams].sort((a, b) => b.score - a.score);
    const finalOrderArray: string[] = allTeamsSorted.map(t => t.id);
    
    // Recolectar todos los IDs de equipos que participaron en desempates
    const teamsInTieBreaks = new Set<string>();
    finalTieBreakResult.groups
      .filter(g => g.resolved && g.finalOrder)
      .forEach(group => {
        group.finalOrder!.forEach(teamId => teamsInTieBreaks.add(teamId));
      });
    
    // Remover equipos que participaron en desempates de sus posiciones originales
    const tempArray = finalOrderArray.filter(id => !teamsInTieBreaks.has(id));
    
    // Aplicar los resultados de desempates insertando equipos en sus posiciones finales
    finalTieBreakResult.groups
      .filter(g => g.resolved && g.finalOrder)
      .forEach(group => {
        const startPosition = group.positionInDispute - 1; // Convertir a 0-indexed
        
        // Insertar los equipos del grupo en el orden correcto
        group.finalOrder!.forEach((teamId, index) => {
          tempArray.splice(startPosition + index, 0, teamId);
        });
      });
    
    sortedTeams = tempArray
      .map(id => teams.find(t => t.id === id)!)
      .filter(t => t);
  }
  // Si hay resultado de desempate normal resuelto
  else if (tieBreakResults?.finalPositions) {
    sortedTeams = [...teams].sort((a, b) => {
      const posA = (tieBreakResults.finalPositions?.[a.id]) || 999;
      const posB = (tieBreakResults.finalPositions?.[b.id]) || 999;
      return posA - posB;
    });
  }
  // Si no hay desempate, ordenar por score
  else {
    sortedTeams = [...teams].sort((a, b) => b.score - a.score);
  }

  const getTeamTieBreakScore = (teamId: string): number => {
    return tieBreakResults?.teamScores[teamId] || 0;
  };

  const isTeamResolved = (teamId: string): boolean => {
    return tieBreakResults?.resolvedTeams.includes(teamId) || false;
  };

  return (
    <div className="scoreboard">
      {isTieBreakMode && tieBreakGroups.length > 0 ? (
        <>
          <h2>Marcador - Desempate</h2>
          {tieBreakGroups.map((group, groupIndex) => {
            const groupTeams = group.teams;
            // Ordenar equipos del grupo por puntaje de desempate
            const sortedGroupTeams = [...groupTeams].sort((a, b) => 
              getTeamTieBreakScore(b.id) - getTeamTieBreakScore(a.id)
            );
            
            // Separar equipos resueltos y activos
            const resolvedTeams = sortedGroupTeams.filter(team => isTeamResolved(team.id));
            const activeTeams = sortedGroupTeams.filter(team => !isTeamResolved(team.id));
            
            return (
              <div key={groupIndex} className="tiebreak-group">
                <h3 className="group-title">🏆 {group.positions}</h3>
                
                {/* Equipos que siguen compitiendo */}
                {activeTeams.length > 0 && (
                  <>
                    <h4 className="section-subtitle">En competencia</h4>
                    <div className="teams-list">
                      {activeTeams.map((team, index) => {
                        const tieBreakScore = getTeamTieBreakScore(team.id);
                        
                        return (
                          <div 
                            key={team.id} 
                            className="team-card"
                          >
                            <div className="team-rank">#{index + 1}</div>
                            <div className="team-info">
                              <div className="team-name">{team.name}</div>
                              <div className="team-score">
                                {tieBreakScore} pts
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
                
                {/* Equipos que ya aseguraron su posición */}
                {resolvedTeams.length > 0 && (
                  <>
                    <h4 className="section-subtitle resolved-subtitle">Posición asegurada</h4>
                    <div className="teams-list">
                      {resolvedTeams.map((team, index) => {
                        const tieBreakScore = getTeamTieBreakScore(team.id);
                        
                        return (
                          <div 
                            key={team.id} 
                            className="team-card resolved"
                          >
                            <div className="team-rank">#{index + 1}</div>
                            <div className="team-info">
                              <div className="team-name">
                                {team.name}
                                <span className="resolved-badge">✓</span>
                              </div>
                              <div className="team-score">
                                {tieBreakScore} pts
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </>
      ) : (
        <>
          <div className="scoreboard-header">
            <h2>Marcador</h2>
            {contestCompleted && onShowPodium && (
              <button className="btn-show-podium-header" onClick={onShowPodium}>
                🏆 Mostrar Podio
              </button>
            )}
          </div>
          <div className="teams-list">
            {sortedTeams.map((team, index) => {
              const hasTieBreak = tieBreakResults?.teamScores?.[team.id] !== undefined;
              const tieBreakScore = tieBreakResults?.teamScores?.[team.id] || 0;
              const totalScore = team.score + tieBreakScore;
              const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : null;
              
              // Verificar si este equipo ganó su posición en un desempate por aproximación
              let wonByApproximation = false;
              if (finalTieBreakResult?.allResolved) {
                const position = index + 1;
                for (const group of finalTieBreakResult.groups) {
                  if (group.resolved && group.finalOrder && group.finalOrder[0] === team.id && group.positionInDispute === position) {
                    wonByApproximation = true;
                    break;
                  }
                }
              }
              
              return (
                <div key={team.id} className={`team-card ${index < 3 ? 'podium-position' : ''}`}>
                  <div className="team-rank">
                    {medal || `#${index + 1}`}
                  </div>
                  <div className="team-info">
                    <div className="team-name">
                      {team.name}
                      {wonByApproximation && (
                        <span className="boomerang-badge" title="Ganó posición en desempate por aproximación">
                          {' '}🪃
                        </span>
                      )}
                    </div>
                    <div className="team-score">
                      {hasTieBreak ? (
                        <>
                          <span className="score-breakdown">
                            <span className="contest-score">{team.score}</span>
                            <span className="score-separator">+</span>
                            <span className="tiebreak-score">{tieBreakScore}</span>
                            <span className="score-separator">=</span>
                          </span>
                          <span className="total-score">{totalScore} pts</span>
                        </>
                      ) : (
                        <span>{team.score} pts</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

export default Scoreboard;
