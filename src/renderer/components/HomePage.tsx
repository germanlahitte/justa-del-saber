import React from 'react';
import './HomePage.css';
import rotaryLogo from '/rotary-logo.png';

interface Props {
  onNavigate: (view: 'teams' | 'questions' | 'approximations' | 'contests' | 'standings' | 'new-contest' | 'reglamento' | 'documentacion') => void;
  onResetWizard?: () => void;
  onExportData: () => void;
  onImportData: () => void;
}

function HomePage({ onNavigate, onResetWizard, onExportData, onImportData }: Props) {
  console.log('HomePage rendering - should have 6 cards including standings');
  
  return (
    <div className="home-page">
      <div className="home-header">
        <div className="header-title">
          <img src={rotaryLogo} alt="Rotary Logo" className="rotary-logo" />
          <h1>Justa del Saber</h1>
        </div>
        <p className="home-subtitle">Sistema de gestión de certámenes de trivia</p>
      </div>

      <div className="home-grid">
        <button 
          className="home-card teams-card"
          onClick={() => onNavigate('teams')}
        >
          <div className="card-icon">👥</div>
          <h2>Equipos</h2>
          <p>Administrar banco de equipos</p>
        </button>

        <button 
          className="home-card standings-card"
          onClick={() => onNavigate('standings')}
        >
          <div className="card-icon">📊</div>
          <h2>Tabla General</h2>
          <p>Estadísticas acumuladas por equipo</p>
        </button>

        <button 
          className="home-card questions-card"
          onClick={() => onNavigate('questions')}
        >
          <div className="card-icon">❓</div>
          <h2>Preguntas</h2>
          <p>Administrar banco de preguntas</p>
        </button>

        <button 
          className="home-card approximations-card"
          onClick={() => onNavigate('approximations')}
        >
          <div className="card-icon">🪃</div>
          <h2>Aproximación</h2>
          <p>Preguntas de desempate numérico</p>
        </button>

        <button 
          className="home-card contests-card"
          onClick={() => onNavigate('contests')}
        >
          <div className="card-icon">🏆</div>
          <h2>Certámenes</h2>
          <p>Ver certámenes guardados</p>
        </button>

        <button 
          className="home-card new-contest-card"
          onClick={() => {
            if (onResetWizard) onResetWizard();
            onNavigate('new-contest');
          }}
        >
          <div className="card-icon">➕</div>
          <h2>Nuevo Certamen</h2>
          <p>Crear certamen y comenzar</p>
        </button>
        <button 
          className="home-card rules-card"
          onClick={() => onNavigate('reglamento')}
        >
          <div className="card-icon">📖</div>
          <h2>Reglamento</h2>
          <p>Consultar reglas oficiales</p>
        </button>

        <button 
          className="home-card docs-card"
          onClick={() => onNavigate('documentacion')}
        >
          <div className="card-icon">📝</div>
          <h2>Documentación</h2>
          <p>Guía funcional del sistema</p>
        </button>      </div>

      <div className="backup-actions">
        <button className="btn-export" onClick={onExportData}>
          💾 Exportar Datos
        </button>
        <button className="btn-import" onClick={onImportData}>
          📥 Importar Datos
        </button>
      </div>
    </div>
  );
}

export default HomePage;
