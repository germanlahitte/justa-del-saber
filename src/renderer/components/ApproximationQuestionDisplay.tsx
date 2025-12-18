import React, { useState, useEffect } from 'react';
import './QuestionDisplay.css';
import './Approximation.css';

interface Props {
  question: string;
  onTimeUp: () => void;
}

function ApproximationQuestionDisplay({ question, onTimeUp }: Props) {
  const [timeLeft, setTimeLeft] = useState(30);
  const [showBellWarning, setShowBellWarning] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);
  const [timerStarted, setTimerStarted] = useState(false);

  useEffect(() => {
    // Resetear estados cuando cambia la pregunta
    setTimeLeft(30);
    setShowBellWarning(false);
    setIsFlipped(false);
    setTimerStarted(false);
  }, [question]);

  useEffect(() => {
    if (!timerStarted || timeLeft <= 0) {
      if (timeLeft <= 0) {
        onTimeUp();
      }
      return;
    }

    // Mostrar campana de advertencia a los 10 segundos restantes
    if (timeLeft === 10) {
      setShowBellWarning(true);
      playBellSound();
    }

    const timer = setTimeout(() => {
      setTimeLeft(timeLeft - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [timeLeft, onTimeUp, timerStarted]);

  const playBellSound = () => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 2.3);
    gainNode.gain.linearRampToValueAtTime(0.0001, audioContext.currentTime + 2.5);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 2.5);
  };

  const playTimeoutSound = () => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Primer tono (ding)
    const osc1 = audioContext.createOscillator();
    const gain1 = audioContext.createGain();
    osc1.connect(gain1);
    gain1.connect(audioContext.destination);
    osc1.frequency.value = 800;
    osc1.type = 'sine';
    gain1.gain.setValueAtTime(0.3, audioContext.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.28);
    gain1.gain.linearRampToValueAtTime(0.0001, audioContext.currentTime + 0.3);
    osc1.start(audioContext.currentTime);
    osc1.stop(audioContext.currentTime + 0.3);
    
    // Segundo tono (dong)
    const osc2 = audioContext.createOscillator();
    const gain2 = audioContext.createGain();
    osc2.connect(gain2);
    gain2.connect(audioContext.destination);
    osc2.frequency.value = 600;
    osc2.type = 'sine';
    gain2.gain.setValueAtTime(0.3, audioContext.currentTime + 0.3);
    gain2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.88);
    gain2.gain.linearRampToValueAtTime(0.0001, audioContext.currentTime + 0.9);
    osc2.start(audioContext.currentTime + 0.3);
    osc2.stop(audioContext.currentTime + 0.9);
  };

  useEffect(() => {
    if (timeLeft === 0) {
      playTimeoutSound();
    }
  }, [timeLeft]);

  const getTimerColor = () => {
    if (timeLeft <= 5) return '#e74c3c';
    if (timeLeft <= 10) return '#f39c12';
    return '#27ae60';
  };

  const handleFlipCard = () => {
    if (!isFlipped) {
      setIsFlipped(true);
    }
  };

  const handleStartTimer = () => {
    setTimerStarted(true);
  };

  const getTimerClass = () => {
    let baseClass = 'timer';
    if (timeLeft <= 5) return `${baseClass} timer-critical`;
    if (timeLeft <= 10) return `${baseClass} timer-warning`;
    return `${baseClass} timer-normal`;
  };

  return (
    <div className="question-display">
      {!isFlipped ? (
        <div className="approximation-card-container">
          <div className="card-back" onClick={handleFlipCard}>
            <div className="card-back-content">
              <div className="card-back-icon">🎯</div>
              <h2>Pregunta de Aproximación</h2>
              <p>Haz clic para revelar la pregunta</p>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="question-header">
            <h2>Pregunta de Aproximación</h2>
            <div className={getTimerClass()}>
              {timeLeft}s
            </div>
          </div>
          
          {showBellWarning && timeLeft > 0 && (
            <div className="bell-warning">
              🔔 ¡10 segundos restantes!
            </div>
          )}
          
          <div className="question-content">
            <p className="question-text">{question}</p>
          </div>

          {timeLeft === 0 && (
            <div className="timeout-message">
              ⏰ ¡Tiempo terminado! Los equipos deben entregar sus respuestas al jurado.
            </div>
          )}

          {!timerStarted ? (
            <div className="start-timer-section">
              <button onClick={handleStartTimer} className="btn-start-timer">
                ▶️ Iniciar Cronómetro (30s)
              </button>
            </div>
          ) : (
            <div className="approximation-instructions">
              <h3>📝 Instrucciones:</h3>
              <ul>
                <li>Los equipos tienen 30 segundos para escribir su respuesta en un papel</li>
                <li>La respuesta debe ser un número</li>
                <li>Al terminar el tiempo, deben entregar el papel al jurado</li>
                <li>El equipo cuya respuesta esté más cerca del valor correcto ganará</li>
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default ApproximationQuestionDisplay;
