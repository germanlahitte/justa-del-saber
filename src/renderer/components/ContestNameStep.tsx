import React, { useState, useEffect, useRef } from 'react';
import './ContestWizard.css';
import WizardProgress from './WizardProgress';

interface Props {
  onNext: (contestName: string, testMode: boolean) => void;
  onCancel: () => void;
  initialName?: string;
  initialTestMode?: boolean;
}

function ContestNameStep({ onNext, onCancel, initialName = '', initialTestMode = false }: Props) {
  const [contestName, setContestName] = useState(initialName);
  const [testMode, setTestMode] = useState(initialTestMode);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (contestName.trim()) {
      onNext(contestName.trim(), testMode);
    }
  };

  return (
    <div className="contest-wizard">
      <div className="wizard-header">
        <button onClick={onCancel} className="btn-back">
          🏠 Volver al Inicio
        </button>
        <h1>➕ Nuevo Certamen</h1>
      </div>

      <div className="wizard-content">
        <WizardProgress currentStep={1} />

        <form onSubmit={handleSubmit} className="wizard-form">
          <h2>Nombre del Certamen</h2>
          <p className="form-description">Ingresa un nombre identificador para este certamen</p>
          
          <input
            ref={inputRef}
            type="text"
            value={contestName}
            onChange={(e) => setContestName(e.target.value)}
            placeholder="Ej: Trivia de Historia 2025"
            className="input-contest-name"
            maxLength={50}
            autoFocus
          />

          <div className="mode-toggle-section">
            <div className="mode-toggle-container">
              <button
                type="button"
                className={`mode-toggle-option ${!testMode ? 'active' : ''}`}
                onClick={() => setTestMode(false)}
              >
                <div className="mode-toggle-title">⭐ Normal</div>
                <div className="mode-toggle-description">
                  <div>⏱️ Timer: 30 segundos</div>
                  <div>📊 Cuenta para Tabla General</div>
                </div>
              </button>
              <button
                type="button"
                className={`mode-toggle-option ${testMode ? 'active' : ''}`}
                onClick={() => setTestMode(true)}
              >
                <div className="mode-toggle-title">🧪 Prueba</div>
                <div className="mode-toggle-description">
                  <div>⏱️ Timer: 0 segundos</div>
                  <div>📊 No cuenta para Tabla General</div>
                </div>
              </button>
            </div>
          </div>
          
          <div className="wizard-actions">
            <button
              type="button"
              onClick={onCancel}
              className="btn-cancel-wizard"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn-next-wizard"
              disabled={!contestName.trim()}
            >
              Siguiente →
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ContestNameStep;
