import { Team } from '../App';

export interface TieBreakGroup {
  teams: Team[];
  positions: string; // Ej: "1° y 2°", "3°", "1°, 2° y 3°"
  positionNumbers: number[]; // [1, 2] o [3] o [1, 2, 3]
}

/**
 * Analiza el podio (top 3) y detecta empates que requieren desempate
 * @param teams Lista de equipos ordenados por puntaje (mayor a menor)
 * @returns Lista de grupos que necesitan desempate, o null si no hay empates
 */
export function detectPodiumTies(teams: Team[]): TieBreakGroup[] | null {
  if (teams.length < 2) return null;

  // Ordenar equipos por puntaje descendente
  const sortedTeams = [...teams].sort((a, b) => b.score - a.score);
  
  // Agrupar equipos por puntaje
  const scoreGroups = new Map<number, Team[]>();
  sortedTeams.forEach(team => {
    const score = team.score;
    if (!scoreGroups.has(score)) {
      scoreGroups.set(score, []);
    }
    scoreGroups.get(score)!.push(team);
  });

  // Obtener los puntajes únicos ordenados
  const uniqueScores = Array.from(scoreGroups.keys()).sort((a, b) => b - a);
  
  // Determinar qué equipos están en el podio (top 3 posiciones)
  const podiumTeams: Team[] = [];
  const tieBreakGroups: TieBreakGroup[] = [];
  let currentPosition = 1;

  for (const score of uniqueScores) {
    const teamsWithScore = scoreGroups.get(score)!;
    
    // Si ya completamos el podio, no procesar más equipos
    if (currentPosition > 3) break;
    
    if (teamsWithScore.length > 1) {
      // Hay empate en este puntaje
      const positionsInGroup: number[] = [];
      
      // Determinar qué posiciones del podio están en disputa
      // Los equipos disputan tantas posiciones como equipos haya (o hasta completar el podio)
      // Ej: 2 equipos en 1° → disputan [1, 2]
      //     3 equipos en 1° → disputan [1, 2, 3]
      //     2 equipos en 3° → disputan [3] (solo queda una posición en el podio)
      const positionsAvailable = Math.min(teamsWithScore.length, 4 - currentPosition);
      for (let i = 0; i < positionsAvailable; i++) {
        positionsInGroup.push(currentPosition + i);
      }
      
      // Incluir TODOS los equipos empatados (incluso si son más que las posiciones disponibles)
      // porque todos tienen el mismo puntaje y deben competir
      if (positionsInGroup.length > 0) {
        tieBreakGroups.push({
          teams: teamsWithScore, // TODOS los equipos empatados
          positions: formatPositions(positionsInGroup),
          positionNumbers: positionsInGroup
        });
      }
      
      // Solo agregar al podio los que caben
      const spotsAvailable = 4 - currentPosition;
      podiumTeams.push(...teamsWithScore.slice(0, spotsAvailable));
    } else {
      // Un solo equipo con este puntaje
      if (currentPosition <= 3) {
        podiumTeams.push(teamsWithScore[0]);
      }
    }
    
    currentPosition += teamsWithScore.length;
  }

  return tieBreakGroups.length > 0 ? tieBreakGroups : null;
}

/**
 * Formatea las posiciones en texto legible
 * Ej: [1, 2] => "1° y 2°"
 *     [3] => "3°"
 *     [1, 2, 3] => "1°, 2° y 3°"
 */
function formatPositions(positions: number[]): string {
  if (positions.length === 1) {
    return `${positions[0]}°`;
  }
  
  if (positions.length === 2) {
    return `${positions[0]}° y ${positions[1]}°`;
  }
  
  const lastPos = positions[positions.length - 1];
  const otherPos = positions.slice(0, -1).map(p => `${p}°`).join(', ');
  return `${otherPos} y ${lastPos}°`;
}

/**
 * Verifica si un equipo ha ganado su posición de forma prematura
 * (tiene +3 puntos de ventaja sobre el siguiente)
 */
export function hasEarlyVictory(
  teamScore: number,
  nextTeamScore: number,
  questionsRemaining: number
): boolean {
  const maxPossibleScore = nextTeamScore + questionsRemaining;
  return teamScore > maxPossibleScore;
}

/**
 * Detecta equipos que quedaron empatados después del desempate normal
 * Retorna grupos de equipos que tienen el mismo puntaje de desempate
 * @param teams Todos los equipos del concurso
 * @param tieBreakScores Puntajes del desempate normal
 * @param originalTieGroups Los grupos originales que disputaron el desempate
 * @returns Array de arrays, donde cada sub-array contiene los IDs de equipos empatados
 */
export function detectFinalTies(
  teams: Team[],
  tieBreakScores: { [teamId: string]: number },
  originalTieGroups: TieBreakGroup[]
): string[][] {
  const finalTies: string[][] = [];
  
  // Recorrer cada grupo original de desempate
  originalTieGroups.forEach(group => {
    // Agrupar equipos por su puntaje de desempate
    const scoreMap = new Map<number, string[]>();
    
    group.teams.forEach(team => {
      const score = tieBreakScores[team.id] || 0;
      if (!scoreMap.has(score)) {
        scoreMap.set(score, []);
      }
      scoreMap.get(score)!.push(team.id);
    });
    
    // Si hay grupos con más de un equipo, hay empate
    scoreMap.forEach((teamIds) => {
      if (teamIds.length > 1) {
        finalTies.push(teamIds);
      }
    });
  });
  
  return finalTies.length > 0 ? finalTies : [];
}
