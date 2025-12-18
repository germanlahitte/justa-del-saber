import React, { useState } from 'react';
import './BankManager.css';
import { TeamTemplate } from '../App';

interface Props {
  teamBank: TeamTemplate[];
  onAddTeam: (team: TeamTemplate) => void;
  onRemoveTeam: (id: string) => void;
  onBackToHome: () => void;
}

function TeamBankManager({ teamBank, onAddTeam, onRemoveTeam, onBackToHome }: Props) {
  const [teamName, setTeamName] = useState('');

  const handleAddTeam = () => {
    if (teamName.trim()) {
      const newTeam: TeamTemplate = {
        id: Date.now().toString(),
        name: teamName.trim(),
      };
      onAddTeam(newTeam);
      setTeamName('');
    }
  };

  return (
    <div className="bank-manager">
      <div className="bank-header">
        <button onClick={onBackToHome} className="btn-back">
          🏠 Volver al Inicio
        </button>
        <h1>👥 Banco de Equipos</h1>
      </div>

      <div className="bank-content">
        <div className="bank-form">
          <h2>Agregar Equipo</h2>
          <div className="form-group">
            <input
              type="text"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="Nombre del equipo"
              onKeyPress={(e) => e.key === 'Enter' && handleAddTeam()}
            />
            <button 
              onClick={handleAddTeam}
              className="btn-add"
              disabled={!teamName.trim()}
            >
              Agregar
            </button>
          </div>
        </div>

        <div className="bank-list">
          <h2>Equipos en el Banco ({teamBank.length})</h2>
          <ul className="item-list">
            {teamBank.map((team, index) => (
              <li key={team.id}>
                <span className="item-number">{index + 1}</span>
                <span className="item-name">{team.name}</span>
                <button 
                  onClick={() => onRemoveTeam(team.id)} 
                  className="btn-remove"
                  title="Eliminar equipo"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
          {teamBank.length === 0 && (
            <p className="empty-message">No hay equipos en el banco.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default TeamBankManager;
