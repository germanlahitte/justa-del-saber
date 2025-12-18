import React, { useState, useEffect, useRef } from 'react';
import './QuestionDisplay.css';
import { Question } from '../App';

interface Props {
  question: Question;
  questionNumber?: number;
  onRevealAnswer: () => void;
  revealButtonText?: string;
  testMode?: boolean;
}

function QuestionDisplay({ question, questionNumber, onRevealAnswer, revealButtonText, testMode = false }: Props) {
  const [timeLeft, setTimeLeft] = useState(testMode ? 0 : 30);
  const [isRunning, setIsRunning] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isMediaMaximized, setIsMediaMaximized] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const isApproximation = !!revealButtonText;
  const hasMedia = question.mediaType && question.mediaUrl;

  useEffect(() => {
    setTimeLeft(testMode ? 0 : 30);
    setIsRunning(false);
    setShowAnswer(false);
    setIsFlipped(false);
    setIsMediaMaximized(false);
  }, [question, testMode]);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev === 11) {
            playBell();
          }
          if (prev <= 1) {
            setIsRunning(false);
            playTimeoutSound();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, timeLeft]);

  const playBell = () => {
    // Sonido de diapasón (tuning fork) con sustain - frecuencia A4 (440 Hz)
    const audioContext = new AudioContext();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Frecuencia de diapasón A4
    oscillator.frequency.value = 440;
    oscillator.type = 'sine';
    
    // Ataque rápido, sustain y fade-out suave
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.4, audioContext.currentTime + 0.01); // Ataque
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 2.3); // Sustain
    gainNode.gain.linearRampToValueAtTime(0.0001, audioContext.currentTime + 2.5); // Fade-out suave
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 2.5);
  };

  const playTimeoutSound = () => {
    // Sonido de finalización: dos tonos descendentes (ding-dong)
    const audioContext = new AudioContext();
    
    // Primer tono (más alto)
    const osc1 = audioContext.createOscillator();
    const gain1 = audioContext.createGain();
    osc1.connect(gain1);
    gain1.connect(audioContext.destination);
    
    osc1.frequency.value = 523.25; // C5
    osc1.type = 'sine';
    gain1.gain.setValueAtTime(0.3, audioContext.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.35);
    gain1.gain.linearRampToValueAtTime(0.0001, audioContext.currentTime + 0.4); // Fade-out suave
    
    osc1.start(audioContext.currentTime);
    osc1.stop(audioContext.currentTime + 0.4);
    
    // Segundo tono (más bajo) con delay
    const osc2 = audioContext.createOscillator();
    const gain2 = audioContext.createGain();
    osc2.connect(gain2);
    gain2.connect(audioContext.destination);
    
    osc2.frequency.value = 392; // G4
    osc2.type = 'sine';
    gain2.gain.setValueAtTime(0.3, audioContext.currentTime + 0.2);
    gain2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.75);
    gain2.gain.linearRampToValueAtTime(0.0001, audioContext.currentTime + 0.8); // Fade-out suave
    
    osc2.start(audioContext.currentTime + 0.2);
    osc2.stop(audioContext.currentTime + 0.8);
  };

  const handleStart = () => {
    if (!isFlipped) {
      setIsFlipped(true);
    }
    
    // En modo de prueba, solo voltear la carta sin iniciar el timer
    if (testMode) {
      return;
    }
    
    setIsRunning(true);
    if (timeLeft === 0) {
      setTimeLeft(30);
      setShowAnswer(false);
    }
  };

  const handleStop = () => {
    setIsRunning(false);
  };

  const handleReset = () => {
    setTimeLeft(testMode ? 0 : 30);
    setIsRunning(false);
    setShowAnswer(false);
  };

  const handleShowAnswer = () => {
    setShowAnswer(!showAnswer);
  };

  const getTimerColor = () => {
    if (timeLeft > 20) return '#27ae60';
    if (timeLeft > 10) return '#f39c12';
    return '#e74c3c';
  };

  const getTimerClass = () => {
    if (timeLeft > 20) return 'timer timer-normal';
    if (timeLeft > 10) return 'timer timer-warning';
    return 'timer timer-critical';
  };

  const handleMediaPlay = () => {
    if (question.mediaType === 'video' && videoRef.current) {
      videoRef.current.play();
    } else if (question.mediaType === 'audio' && audioRef.current) {
      audioRef.current.play();
    }
  };

  const getYouTubeEmbedUrl = (url: string): string | null => {
    if (!url) return null;
    
    // Detectar diferentes formatos de URL de YouTube
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
      /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return `https://www.youtube.com/embed/${match[1]}`;
      }
    }
    
    return null;
  };

  const isYouTubeUrl = question.mediaType === 'video' && question.mediaUrl ? 
    getYouTubeEmbedUrl(question.mediaUrl) !== null : false;

  return (
    <div className="question-display">
      {/* Overlay cuando multimedia está maximizado */}
      {isMediaMaximized && (
        <div 
          className="multimedia-overlay"
          onClick={() => setIsMediaMaximized(false)}
        />
      )}

      {/* Timer Section - Arriba de todo */}
      <div className="timer-section">
        <div className="timer-controls">
          <button 
            onClick={isRunning ? handleStop : handleStart} 
            className={`btn-timer ${isRunning ? 'btn-pause' : 'btn-play'}`}
            title={isRunning ? 'Pausar' : 'Iniciar'}
          >
            {isRunning ? '' : '▶'}
          </button>
          <button onClick={handleReset} className="btn-timer btn-reset" title="Reiniciar">
            ↻
          </button>
        </div>

        <div className={getTimerClass()}>
          <div className="timer-value">{timeLeft}</div>
          <div className="timer-label">segundos</div>
        </div>

        <div className="timer-actions">
          {timeLeft === 0 && (
            <>
              {revealButtonText ? (
                // Modo aproximación: botón directo sin revelar respuesta
                <button onClick={onRevealAnswer} className="btn-continue">
                  {revealButtonText}
                </button>
              ) : (
                // Modo normal: revelar respuesta y luego anotar puntos
                <>
                  <button onClick={handleShowAnswer} className="btn-answer">
                    {showAnswer ? 'Ocultar' : 'Revelar'} Respuesta
                  </button>
                  {showAnswer && (
                    <button onClick={onRevealAnswer} className="btn-continue">
                      ✓ Anotar Puntos
                    </button>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>

      {/* Contenedor de dos columnas: Multimedia y Pregunta */}
      <div className="content-columns">
        {/* Columna de Multimedia */}
        {hasMedia && (
          <div className={`multimedia-panel ${isMediaMaximized ? 'maximized' : ''}`}>
            <div className="multimedia-header">
              <h3>
                {question.mediaType === 'image' ? '🖼️ Imagen' : 
                 question.mediaType === 'video' ? '🎥 Video' : 
                 '🔊 Audio'}
              </h3>
              <button 
                onClick={() => setIsMediaMaximized(!isMediaMaximized)}
                className="btn-maximize"
                title={isMediaMaximized ? 'Minimizar' : 'Maximizar'}
              >
                {isMediaMaximized ? '🗗' : '🗖'}
              </button>
            </div>
            <div className="multimedia-content">
              {question.mediaType === 'image' && (
                <img 
                  src={question.mediaUrl} 
                  alt="Contenido multimedia de la pregunta"
                  className="media-image"
                />
              )}
              
              {question.mediaType === 'video' && (
                <div className="media-video-container">
                  {isYouTubeUrl ? (
                    <iframe
                      src={getYouTubeEmbedUrl(question.mediaUrl!)}
                      className="media-video youtube-video"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      title="Video de YouTube"
                    />
                  ) : (
                    <>
                      <video 
                        ref={videoRef}
                        src={question.mediaUrl}
                        controls
                        className="media-video"
                      >
                        Tu navegador no soporta video.
                      </video>
                      <button onClick={handleMediaPlay} className="btn-media-control">
                        ▶️ Reproducir
                      </button>
                    </>
                  )}
                </div>
              )}
              
              {question.mediaType === 'audio' && (
                <div className="media-audio-container">
                  <audio 
                    ref={audioRef}
                    src={question.mediaUrl}
                    controls
                    className="media-audio"
                  >
                    Tu navegador no soporta audio.
                  </audio>
                  <button onClick={handleMediaPlay} className="btn-media-control">
                    ▶️ Reproducir
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Columna de Pregunta */}
        <div className={`question-column ${hasMedia ? 'with-media' : 'full-width'}`}>
          {!isFlipped ? (
            <div className="question-card-back-container">
              <div className="card-back">
                <div className="card-back-content">
                  <div className="card-back-icon">{isApproximation ? '🎯' : '❓'}</div>
                  <h2>{isApproximation ? 'Pregunta de Aproximación' : 'Pregunta'}</h2>
                  <p>Presiona ▶ en el timer para revelar la pregunta</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="question-content">
              {questionNumber !== undefined && <h2>Pregunta {questionNumber}</h2>}
              <p className="question-text">{question.text}</p>

              {/* Solo mostrar opciones si no es pregunta de aproximación y las opciones no están vacías */}
              {!revealButtonText && question.options.A && (
              <div className="options">
                <div className={`option ${showAnswer && question.correctAnswer === 'A' ? 'correct' : ''}`}>
                  <span className="option-letter">A</span>
                  <span className="option-text">{question.options.A}</span>
                </div>
                <div className={`option ${showAnswer && question.correctAnswer === 'B' ? 'correct' : ''}`}>
                  <span className="option-letter">B</span>
                  <span className="option-text">{question.options.B}</span>
                </div>
                <div className={`option ${showAnswer && question.correctAnswer === 'C' ? 'correct' : ''}`}>
                  <span className="option-letter">C</span>
                  <span className="option-text">{question.options.C}</span>
                </div>
                <div className={`option ${showAnswer && question.correctAnswer === 'D' ? 'correct' : ''}`}>
                  <span className="option-letter">D</span>
                  <span className="option-text">{question.options.D}</span>
                </div>
              </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default QuestionDisplay;
