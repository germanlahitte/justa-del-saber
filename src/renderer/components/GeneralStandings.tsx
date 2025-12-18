import React from 'react';
import './GeneralStandings.css';

interface TeamStats {
  teamName: string;
  gold: number; // 1ros puestos
  silver: number; // 2dos puestos
  bronze: number; // 3ros puestos
  boomerangs: number; // Ganó posición en desempate por aproximación
  totalPoints: number; // Suma de puntos de todos los certámenes
  participations: number; // Cantidad de certámenes jugados
}

interface Props {
  stats: TeamStats[];
  onBackToHome: () => void;
}

function GeneralStandings({ stats, onBackToHome }: Props) {
  // Ordenar por: oros > platas > bronces > puntos totales
  const sortedStats = [...stats].sort((a, b) => {
    if (b.gold !== a.gold) return b.gold - a.gold;
    if (b.silver !== a.silver) return b.silver - a.silver;
    if (b.bronze !== a.bronze) return b.bronze - a.bronze;
    return b.totalPoints - a.totalPoints;
  });

  return (
    <div className="general-standings">
      <div className="standings-header">
        <button onClick={onBackToHome} className="btn-back">
          🏠 Volver al Inicio
        </button>
        <h1>🏆 Tabla General de Posiciones</h1>
        <p className="subtitle">Estadísticas acumuladas de todos los certámenes</p>
      </div>

      {sortedStats.length === 0 ? (
        <div className="empty-standings">
          <p>📊 No hay estadísticas aún. Completa certámenes para ver la tabla general.</p>
        </div>
      ) : (
        <div className="standings-table-container">
          <table className="standings-table">
            <thead>
              <tr>
                <th className="position-col">#</th>
                <th className="team-col">Equipo</th>
                <th className="medal-col gold-col">🥇 Oros</th>
                <th className="medal-col silver-col">🥈 Platas</th>
                <th className="medal-col bronze-col">🥉 Bronces</th>
                <th className="points-col">Puntos Totales</th>
                <th className="boomerang-col">🪃 Bumeranes</th>
                <th className="participation-col">Participaciones</th>
                <th className="avg-col">Promedio</th>
              </tr>
            </thead>
            <tbody>
              {sortedStats.map((stat, index) => {
                const avgPoints = stat.participations > 0 
                  ? (stat.totalPoints / stat.participations).toFixed(1) 
                  : '0.0';
                
                return (
                  <tr key={stat.teamName} className={index < 3 ? 'podium-row' : ''}>
                    <td className="position-cell">
                      {index === 0 && '🥇'}
                      {index === 1 && '🥈'}
                      {index === 2 && '🥉'}
                      {index > 2 && (index + 1)}
                    </td>
                    <td className="team-cell">{stat.teamName}</td>
                    <td className="medal-cell gold-cell">
                      {stat.gold > 0 ? stat.gold : '-'}
                    </td>
                    <td className="medal-cell silver-cell">
                      {stat.silver > 0 ? stat.silver : '-'}
                    </td>
                    <td className="medal-cell bronze-cell">
                      {stat.bronze > 0 ? stat.bronze : '-'}
                    </td>
                    <td className="points-cell">{stat.totalPoints}</td>
                    <td className="boomerang-cell">
                      {stat.boomerangs > 0 ? stat.boomerangs : '-'}
                    </td>
                    <td className="participation-cell">{stat.participations}</td>
                    <td className="avg-cell">{avgPoints}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="standings-legend">
        <h3>📖 Leyenda</h3>
        <ul>
          <li><strong>Oros/Platas/Bronces:</strong> Cantidad de veces que obtuvo cada posición del podio</li>
          <li><strong>Puntos Totales:</strong> Suma de puntos del certamen regular + desempates de todos los certámenes</li>
          <li><strong>🪃 Bumeranes:</strong> Cantidad de veces que ganó su posición disputada en un desempate por aproximación</li>
          <li><strong>Participaciones:</strong> Cantidad de certámenes en los que participó</li>
          <li><strong>Promedio:</strong> Puntos totales dividido por participaciones</li>
        </ul>
      </div>
    </div>
  );
}

export default GeneralStandings;
