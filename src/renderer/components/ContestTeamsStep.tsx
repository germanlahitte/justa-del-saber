import React, { useState } from 'react';
import './ContestWizard.css';
import WizardProgress from './WizardProgress';
import { TeamTemplate } from '../App';

interface Props {
  contestName: string;
  teamBank: TeamTemplate[];
  selectedTeams: TeamTemplate[];
  onNext: (teams: TeamTemplate[]) => void;
  onBack: () => void;
  onCancel: () => void;
}

function ContestTeamsStep({ contestName, teamBank, selectedTeams, onNext, onBack, onCancel }: Props) {
  const [selected, setSelected] = useState<TeamTemplate[]>(selectedTeams);
  const [draggedTeam, setDraggedTeam] = useState<TeamTemplate | null>(null);

  const availableTeams = teamBank.filter(t => !selected.find(s => s.id === t.id));

  const handleDragStart = (team: TeamTemplate, fromSelected: boolean) => {
    setDraggedTeam(team);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDropToSelected = (e: React.DragEvent) => {
    e.preventDefault();
    if (draggedTeam && !selected.find(t => t.id === draggedTeam.id)) {
      setSelected([...selected, draggedTeam]);
    }
    setDraggedTeam(null);
  };

  const handleDropToAvailable = (e: React.DragEvent) => {
    e.preventDefault();
    if (draggedTeam) {
      setSelected(selected.filter(t => t.id !== draggedTeam.id));
    }
    setDraggedTeam(null);
  };

  const handleDoubleClickToAdd = (team: TeamTemplate) => {
    if (!selected.find(t => t.id === team.id)) {
      setSelected([...selected, team]);
    }
  };

  const handleDoubleClickToRemove = (team: TeamTemplate) => {
    setSelected(selected.filter(t => t.id !== team.id));
  };

  const handleNext = () => {
    if (selected.length >= 2) {
      onNext(selected);
    }
  };

  return (
    <div className="contest-wizard">
      <div className="wizard-header">
        <button onClick={onCancel} className="btn-back">
          🏠 Volver al Inicio
        </button>
        <h1>➕ Nuevo Certamen: {contestName}</h1>
      </div>

      <div className="wizard-content">
        <WizardProgress currentStep={2} />

        <div className="drag-drop-container">
          <div className="drag-drop-section">
            <h2>Equipos Disponibles ({availableTeams.length})</h2>
            <p className="section-hint">Arrastra o haz doble clic para agregar</p>
            <div
              className="team-list available-list"
              onDragOver={handleDragOver}
              onDrop={handleDropToAvailable}
            >
              {availableTeams.length === 0 ? (
                <p className="empty-list">Todos los equipos han sido seleccionados</p>
              ) : (
                availableTeams.map(team => (
                  <div
                    key={team.id}
                    className="team-item"
                    draggable
                    onDragStart={() => handleDragStart(team, false)}
                    onDoubleClick={() => handleDoubleClickToAdd(team)}
                  >
                    <span className="team-icon">👥</span>
                    <span className="team-name">{team.name}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="drag-drop-divider">
            <div className="divider-line"></div>
            <div className="divider-icon">⇄</div>
            <div className="divider-line"></div>
          </div>

          <div className="drag-drop-section">
            <h2>Equipos Seleccionados ({selected.length})</h2>
            <p className="section-hint">Arrastra o haz doble clic para quitar</p>
            <div
              className="team-list selected-list"
              onDragOver={handleDragOver}
              onDrop={handleDropToSelected}
            >
              {selected.length === 0 ? (
                <p className="empty-list">Arrastra equipos aquí o haz doble clic en ellos</p>
              ) : (
                selected.map(team => (
                  <div
                    key={team.id}
                    className="team-item selected"
                    draggable
                    onDragStart={() => handleDragStart(team, true)}
                    onDoubleClick={() => handleDoubleClickToRemove(team)}
                  >
                    <span className="team-icon">✓</span>
                    <span className="team-name">{team.name}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {selected.length < 2 && (
          <div className="wizard-warning">
            ⚠️ Debes seleccionar al menos 2 equipos para continuar
          </div>
        )}

        <div className="wizard-actions">
          <button
            type="button"
            onClick={onBack}
            className="btn-back-wizard"
          >
            ← Atrás
          </button>
          <button
            type="button"
            onClick={handleNext}
            className="btn-next-wizard"
            disabled={selected.length < 2}
          >
            Siguiente →
          </button>
        </div>
      </div>
    </div>
  );
}

export default ContestTeamsStep;
