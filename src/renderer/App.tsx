import React, { useState, useEffect } from 'react';
import './App.css';
import HomePage from './components/HomePage';
import TeamBankManager from './components/TeamBankManager';
import QuestionBankManager from './components/QuestionBankManager';
import ApproximationBankManager from './components/ApproximationBankManager';
import ContestManager from './components/ContestManager';
import ContestWizard from './components/ContestWizard';
import QuestionDisplay from './components/QuestionDisplay';
import ApproximationQuestionDisplay from './components/ApproximationQuestionDisplay';
import Scoreboard from './components/Scoreboard';
import GameHome from './components/GameHome';
import TeamScoring from './components/TeamScoring';
import TieBreakHome from './components/TieBreakHome';
import TieBreakExplanation from './components/TieBreakExplanation';
import ApproximationTieBreakExplanation from './components/ApproximationTieBreakExplanation';
import Podium from './components/Podium';
import ApproximationScoringInput from './components/ApproximationScoringInput';
import ApproximationResultsDisplay from './components/ApproximationResultsDisplay';
import GeneralStandings from './components/GeneralStandings';
import Reglamento from './components/Reglamento';
import DocumentacionFuncional from './components/DocumentacionFuncional';
import { detectPodiumTies, detectFinalTies } from './utils/tieBreakUtils';
import { jsPDF } from 'jspdf';

export interface TeamStats {
  teamName: string;
  gold: number;
  silver: number;
  bronze: number;
  boomerangs: number;
  totalPoints: number;
  participations: number;
}

export interface Team {
  id: string;
  name: string;
  score: number;
}

export interface Question {
  id: string;
  text: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  usedCount: number; // Contador de veces que se ha utilizado en certámenes
  // Campos multimedia opcionales
  mediaType?: 'image' | 'video' | 'audio';
  mediaUrl?: string; // Ruta al archivo multimedia
}

export interface ApproximationQuestion {
  id: string;
  text: string;
  correctAnswer: number; // La respuesta numérica correcta
  usedCount: number; // Contador de veces que se ha utilizado
}

export interface QuestionResult {
  questionId: string;
  correctTeamIds: string[];
  completed: boolean;
  answerRevealed: boolean;
  usageCounted?: boolean; // Indica si ya se contabilizó el uso de la pregunta
  disputed?: boolean; // Indica si la pregunta fue marcada como disputada
}

export interface Contest {
  id: string;
  name: string;
  teams: Team[];
  questions: Question[];
  results: QuestionResult[];
  tieBreakQuestions: Question[]; // 5 preguntas para desempate del podio
  tieBreakResults?: TieBreakResult; // Resultados del desempate si se jugó
  finalTieBreakResult?: FinalTieBreakResult; // Resultados del desempate final con aproximación
  testMode?: boolean; // Modo de prueba: timer en 0 y no cuenta para estadísticas generales
  originalQuestionCount?: number; // Número de preguntas originales (antes de reemplazos)
}

export interface TieBreakResult {
  currentQuestionIndex: number; // 0-4 (5 preguntas)
  teamScores: { [teamId: string]: number }; // Puntos de desempate por equipo
  resolvedTeams: string[]; // IDs de equipos que ya ganaron su posición
  finalPositions?: { [teamId: string]: number }; // Posición final (1, 2, o 3)
  questionResults?: { [questionIndex: number]: string[] }; // IDs de equipos que contestaron bien cada pregunta
  disputedQuestions?: { [questionIndex: number]: boolean }; // Preguntas marcadas como disputadas
  originalQuestionCount?: number; // Número original de preguntas (antes de reemplazos)
}

// Interfaces para el desempate final con preguntas de aproximación
export interface ApproximationAnswer {
  teamId: string;
  answer: number;
  difference: number; // |answer - correctAnswer|
}

export interface ApproximationRound {
  questionId: string;
  answers: ApproximationAnswer[];
  resolved: boolean; // Si esta ronda resolvió todos los empates
}

export interface FinalTieBreakGroup {
  teamIds: string[]; // IDs de equipos que ACTUALMENTE compiten en este grupo
  positionInDispute: number; // Posición por la que compiten (1, 2, 3)
  rounds: ApproximationRound[]; // Rondas específicas de este grupo
  resolved: boolean; // Si este grupo ya está resuelto
  finalOrder?: string[]; // Orden final de los equipos (cuando se resuelve completamente)
  partialWinners?: string[]; // Equipos que ya ganaron posiciones en resoluciones parciales
}

export interface FinalTieBreakResult {
  groups: FinalTieBreakGroup[]; // Grupos independientes de desempate
  currentGroupIndex: number; // Grupo que se está disputando actualmente
  allResolved: boolean; // Si todos los grupos están resueltos
}

// Tipos para los bancos (sin el campo score para equipos)
export interface TeamTemplate {
  id: string;
  name: string;
}

function App() {
  // Bancos de datos
  const [teamBank, setTeamBank] = useState<TeamTemplate[]>([]);
  const [questionBank, setQuestionBank] = useState<Question[]>([]);
  const [approximationBank, setApproximationBank] = useState<ApproximationQuestion[]>([]);
  const [savedContests, setSavedContests] = useState<Contest[]>([]);
  
  const [currentContest, setCurrentContest] = useState<Contest | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [view, setView] = useState<'home' | 'teams' | 'questions' | 'approximations' | 'contests' | 'standings' | 'new-contest' | 'game-home' | 'question' | 'scoring' | 'results' | 'podium' | 'tiebreak-explanation' | 'tiebreak-home' | 'tiebreak-question' | 'tiebreak-scoring' | 'approximation-tiebreak-explanation' | 'approximation-question' | 'approximation-scoring' | 'approximation-results' | 'reglamento' | 'documentacion'>('home');
  const [gameView, setGameView] = useState<'home' | 'question' | 'scoring' | 'results'>('home');
  const [isTieBreakMode, setIsTieBreakMode] = useState(false);
  const [tieBreakQuestionIndex, setTieBreakQuestionIndex] = useState(0);
  const [isFinalTieBreak, setIsFinalTieBreak] = useState(false);
  const [currentApproximationQuestion, setCurrentApproximationQuestion] = useState<ApproximationQuestion | null>(null);
  const [wizardKey, setWizardKey] = useState(0);
  const [contestsTab, setContestsTab] = useState<'normal' | 'test'>('normal');
  const [showReplacementModal, setShowReplacementModal] = useState(false);
  const [showFinishModal, setShowFinishModal] = useState(false);

  // Cargar datos del localStorage al iniciar
  useEffect(() => {
    const savedTeams = localStorage.getItem('teamBank');
    const savedQuestions = localStorage.getItem('questionBank');
    const savedApproximations = localStorage.getItem('approximationBank');
    const savedContestsData = localStorage.getItem('savedContests');
    
    if (savedTeams) {
      setTeamBank(JSON.parse(savedTeams));
    }
    if (savedQuestions) {
      const questions = JSON.parse(savedQuestions);
      // Asegurar que todas las preguntas tengan el campo usedCount
      const questionsWithUsedCount = questions.map((q: Question) => ({
        ...q,
        usedCount: q.usedCount || 0
      }));
      setQuestionBank(questionsWithUsedCount);
    }
    if (savedApproximations) {
      const approximations = JSON.parse(savedApproximations);
      // Asegurar que todas las preguntas de aproximación tengan el campo usedCount
      const approximationsWithUsedCount = approximations.map((a: ApproximationQuestion) => ({
        ...a,
        usedCount: a.usedCount || 0
      }));
      setApproximationBank(approximationsWithUsedCount);
    }
    if (savedContestsData) {
      const contests = JSON.parse(savedContestsData);
      // Asegurar que todos los certámenes tengan tieBreakQuestions (para compatibilidad con versiones anteriores)
      const contestsWithTieBreak = contests.map((c: Contest) => ({
        ...c,
        tieBreakQuestions: c.tieBreakQuestions || []
      }));
      setSavedContests(contestsWithTieBreak);
    }
  }, []);

  // Guardar bancos en localStorage cuando cambien
  useEffect(() => {
    localStorage.setItem('teamBank', JSON.stringify(teamBank));
  }, [teamBank]);

  useEffect(() => {
    localStorage.setItem('questionBank', JSON.stringify(questionBank));
  }, [questionBank]);

  useEffect(() => {
    localStorage.setItem('savedContests', JSON.stringify(savedContests));
  }, [savedContests]);

  useEffect(() => {
    localStorage.setItem('approximationBank', JSON.stringify(approximationBank));
  }, [approximationBank]);

  const handleAddTeamToBank = (team: TeamTemplate) => {
    setTeamBank([...teamBank, team]);
  };

  const handleRemoveTeamFromBank = (id: string) => {
    setTeamBank(teamBank.filter(t => t.id !== id));
  };

  const handleAddQuestionToBank = (question: Question) => {
    // Asegurar que la nueva pregunta tenga usedCount inicializado
    const questionWithUsedCount = { ...question, usedCount: 0 };
    setQuestionBank([...questionBank, questionWithUsedCount]);
  };

  const handleRemoveQuestionFromBank = (id: string) => {
    setQuestionBank(questionBank.filter(q => q.id !== id));
  };

  const handleSaveContest = (contest: Contest) => {
    // Verificar si el certamen ya existe
    const existingIndex = savedContests.findIndex(c => c.id === contest.id);
    if (existingIndex >= 0) {
      // Actualizar certamen existente
      const updated = [...savedContests];
      updated[existingIndex] = contest;
      setSavedContests(updated);
    } else {
      // Agregar nuevo certamen
      setSavedContests([...savedContests, contest]);
    }
  };

  const handleStartContest = (contest: Contest) => {
    handleSaveContest(contest);
    setCurrentContest(contest);
    // Buscar la primera pregunta no completada
    const firstIncomplete = contest.results.findIndex(r => !r.completed);
    setCurrentQuestionIndex(firstIncomplete >= 0 ? firstIncomplete : 0);
    setGameView('home');
    setView('game-home');
  };

  const handleLoadContest = (contest: Contest) => {
    setCurrentContest(contest);
    
    // Verificar si todas las preguntas regulares están completadas
    const allQuestionsCompleted = contest.results.every(r => r.completed && r.answerRevealed);
    
    if (allQuestionsCompleted) {
      // Detectar si hay empates pendientes
      const tieBreakGroups = detectPodiumTies(contest.teams);
      const hasPendingTieBreak = tieBreakGroups && tieBreakGroups.length > 0 && !isContestFullyCompleted(contest);
      
      if (hasPendingTieBreak) {
        // Hay un desempate pendiente, redirigir a la vista explicativa apropiada
        setIsTieBreakMode(true);
        
        // Determinar el tipo de desempate
        if (contest.tieBreakResults && !contest.tieBreakResults.finalPositions) {
          // Desempate normal en progreso
          setView('tiebreak-explanation');
        } else if (contest.tieBreakResults?.finalPositions && !contest.finalTieBreakResult?.allResolved) {
          // Desempate normal completado pero hay empates en aproximación
          setView('approximation-tiebreak-explanation');
        } else {
          // Primer desempate
          setView('tiebreak-explanation');
        }
        return;
      }
    }
    
    // No hay desempate pendiente, continuar normalmente
    const firstIncomplete = contest.results.findIndex(r => !r.completed);
    setCurrentQuestionIndex(firstIncomplete >= 0 ? firstIncomplete : 0);
    setGameView('home');
    setView('game-home');
  };

  const handleDeleteContest = (id: string) => {
    if (confirm('¿Estás seguro de que deseas eliminar este certamen?')) {
      setSavedContests(savedContests.filter(c => c.id !== id));
    }
  };

  const handleGeneratePrintableQuestions = (contest: Contest) => {
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 12;
    const contentWidth = pageWidth - (margin * 2);
    let yPosition = margin;
    let questionsOnPage = 0;

    // Función auxiliar para agregar nueva página si es necesario
    const checkPageBreak = (requiredSpace: number, forceNewPage: boolean = false) => {
      if (forceNewPage || yPosition + requiredSpace > pageHeight - margin) {
        pdf.addPage();
        yPosition = margin;
        questionsOnPage = 0;
        return true;
      }
      return false;
    };

    // Función para escribir texto con ajuste de línea
    const writeText = (text: string, x: number, fontSize: number, style: 'normal' | 'bold' = 'normal', maxWidth?: number) => {
      pdf.setFont('helvetica', style);
      pdf.setFontSize(fontSize);
      const lines = pdf.splitTextToSize(text, maxWidth || contentWidth);
      pdf.text(lines, x, yPosition);
      yPosition += lines.length * (fontSize * 0.4);
    };

    // Encabezado
    pdf.setFillColor(233, 69, 96); // #e94560
    pdf.rect(margin, yPosition, contentWidth, 12, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(16);
    pdf.text('LISTADO DE PREGUNTAS', pageWidth / 2, yPosition + 8, { align: 'center' });
    yPosition += 16;

    pdf.setTextColor(15, 52, 96); // #0f3460
    pdf.setFontSize(11);
    pdf.text(contest.name, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 7;

    // Línea separadora
    pdf.setDrawColor(233, 69, 96);
    pdf.setLineWidth(0.3);
    pdf.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 6;

    // Función para dibujar una pregunta
    const drawQuestion = (question: Question, index: number, isRegular: boolean) => {
      // Forzar salto si ya hay 5 preguntas en la página
      if (questionsOnPage >= 5) {
        checkPageBreak(0, true);
      }
      
      checkPageBreak(48); // Espacio mínimo requerido para una pregunta

      // Fondo de la pregunta
      pdf.setFillColor(248, 249, 250);
      pdf.setDrawColor(15, 52, 96);
      pdf.setLineWidth(0.2);
      const questionStartY = yPosition;
      
      // Número de pregunta
      pdf.setFillColor(233, 69, 96);
      pdf.roundedRect(margin, yPosition, 25, 6, 1.5, 1.5, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(9);
      pdf.text(isRegular ? `Pregunta ${index + 1}` : `Desempate ${index + 1}`, margin + 12.5, yPosition + 4.5, { align: 'center' });
      yPosition += 9;

      // Texto de la pregunta
      pdf.setTextColor(26, 26, 46);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(10);
      const questionLines = pdf.splitTextToSize(question.text, contentWidth - 4);
      pdf.text(questionLines, margin + 2, yPosition);
      yPosition += questionLines.length * 4.2;

      // Opciones
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);
      const options = [
        { letter: 'A', text: question.options.A },
        { letter: 'B', text: question.options.B },
        { letter: 'C', text: question.options.C },
        { letter: 'D', text: question.options.D }
      ];

      options.forEach(opt => {
        const optionLines = pdf.splitTextToSize(`${opt.letter}) ${opt.text}`, contentWidth - 10);
        pdf.setFont('helvetica', 'bold');
        pdf.text(opt.letter + ')', margin + 4, yPosition);
        pdf.setFont('helvetica', 'normal');
        pdf.text(optionLines.join(' ').substring(3), margin + 10, yPosition);
        yPosition += optionLines.length * 3.8;
      });

      // Respuesta correcta
      yPosition += 1;
      pdf.setFillColor(39, 174, 96); // #27ae60
      pdf.roundedRect(margin + 2, yPosition, contentWidth - 4, 6, 1.5, 1.5, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(9);
      pdf.text(`RESPUESTA CORRECTA: ${question.correctAnswer}`, margin + 4, yPosition + 4.2);
      yPosition += 7;

      // Borde de la pregunta
      const questionHeight = yPosition - questionStartY;
      pdf.setDrawColor(15, 52, 96);
      pdf.roundedRect(margin, questionStartY, contentWidth, questionHeight, 1.5, 1.5, 'S');
      
      yPosition += 3.5;
      questionsOnPage++;
    };

    // Sección de preguntas regulares
    pdf.setTextColor(255, 255, 255);
    pdf.setFillColor(15, 52, 96);
    pdf.roundedRect(margin, yPosition, contentWidth, 8, 1.5, 1.5, 'F');
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11);
    pdf.text(`PREGUNTAS REGULARES (${contest.questions.length})`, margin + 2, yPosition + 5.5);
    yPosition += 11;

    contest.questions.forEach((q, index) => {
      drawQuestion(q, index, true);
    });

    // Sección de preguntas de desempate
    if (contest.tieBreakQuestions && contest.tieBreakQuestions.length > 0) {
      // Agregar nueva página para que todas las preguntas de desempate estén juntas
      pdf.addPage();
      yPosition = margin;
      questionsOnPage = 0;
      
      pdf.setTextColor(255, 255, 255);
      pdf.setFillColor(15, 52, 96);
      pdf.roundedRect(margin, yPosition, contentWidth, 8, 1.5, 1.5, 'F');
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(11);
      pdf.text(`PREGUNTAS DE DESEMPATE (${contest.tieBreakQuestions.length})`, margin + 2, yPosition + 5.5);
      yPosition += 11;

      contest.tieBreakQuestions.forEach((q, index) => {
        drawQuestion(q, index, false);
      });
    }

    // Pie de página con numeración en todas las páginas
    const totalPages = pdf.internal.pages.length - 1; // -1 porque la primera página es null
    
    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i);
      
      // Línea separadora superior
      pdf.setDrawColor(15, 52, 96);
      pdf.setLineWidth(0.3);
      pdf.line(margin, pageHeight - 20, pageWidth - margin, pageHeight - 20);
      
      pdf.setTextColor(127, 140, 141);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8);
      
      // Información solo en la última página
      if (i === totalPages) {
        const dateStr = new Date().toLocaleDateString('es-ES', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
        pdf.text(`Justa del Saber - Generado el ${dateStr}`, pageWidth / 2, pageHeight - 15, { align: 'center' });
        pdf.setFont('helvetica', 'italic');
        pdf.text('Documento para uso exclusivo del maestro de ceremonias', pageWidth / 2, pageHeight - 10, { align: 'center' });
      }
      
      // Número de página en todas las páginas
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);
      pdf.text(`Página ${i} de ${totalPages}`, pageWidth - margin, pageHeight - 10, { align: 'right' });
    }

    // Generar nombre de archivo y descargar
    const fileName = `${contest.name.replace(/[^a-zA-Z0-9]/g, '_')}_Preguntas.pdf`;
    pdf.save(fileName);
  };

  const handleToggleContestTestMode = (contestId: string) => {
    const updatedContests = savedContests.map(c => {
      if (c.id === contestId) {
        return { ...c, testMode: !c.testMode };
      }
      return c;
    });
    setSavedContests(updatedContests);
    localStorage.setItem('savedContests', JSON.stringify(updatedContests));
    
    // Si el certamen actual es el que se está modificando, actualizar también
    if (currentContest && currentContest.id === contestId) {
      setCurrentContest({ ...currentContest, testMode: !currentContest.testMode });
    }
  };

  // Determinar si un certamen está realmente completo (incluyendo desempates)
  const isContestFullyCompleted = (contest: Contest): boolean => {
    // Verificar que todas las preguntas regulares estén completadas
    const allQuestionsCompleted = contest.results.every(r => r.completed && r.answerRevealed);
    if (!allQuestionsCompleted) return false;
    
    // Detectar si hay empates en el podio
    const tieBreakGroups = detectPodiumTies(contest.teams);
    
    // Si no hay empates, el certamen está completo
    if (!tieBreakGroups || tieBreakGroups.length === 0) return true;
    
    // Si hay empates, verificar si fueron resueltos
    // Caso 1: Desempate por aproximación resuelto
    if (contest.finalTieBreakResult?.allResolved) return true;
    
    // Caso 2: Desempate normal resuelto (tiene posiciones finales)
    if (contest.tieBreakResults?.finalPositions) {
      // Verificar si aún hay empates después del desempate normal
      const teamsWithFinalPositions = Object.keys(contest.tieBreakResults.finalPositions);
      if (teamsWithFinalPositions.length === 0) return false;
      
      // Si tiene posiciones finales pero también tiene finalTieBreakResult sin resolver, no está completo
      if (contest.finalTieBreakResult && !contest.finalTieBreakResult.allResolved) return false;
      
      return true;
    }
    
    // Si hay empates pero no fueron resueltos, el certamen no está completo
    return false;
  };

  // Obtener el podio final de un certamen (considerando tiebreaks)
  const getContestPodium = (contest: Contest): { teamId: string; teamName: string; score: number; position: number; wonByApproximation?: boolean }[] => {
    const podium: { teamId: string; teamName: string; score: number; position: number; wonByApproximation?: boolean }[] = [];
    
    // Si hay resultado de desempate por aproximación
    if (contest.finalTieBreakResult?.allResolved) {
      const totalTeams = contest.teams.length;
      const finalOrderArray: string[] = new Array(totalTeams).fill('');
      
      // Primero, ordenar todos los equipos por puntaje del certamen
      const allTeamsSorted = [...contest.teams].sort((a, b) => b.score - a.score);
      
      // Llenar el array con el orden por defecto (por puntaje)
      allTeamsSorted.forEach((team, index) => {
        finalOrderArray[index] = team.id;
      });
      
      // Luego, sobrescribir con los resultados del desempate por aproximación
      console.log('🏆 [Podio] Construyendo podio final:');
      console.log('  Grupos resueltos:', contest.finalTieBreakResult.groups.filter(g => g.resolved));
      
      contest.finalTieBreakResult.groups
        .filter(g => g.resolved && g.finalOrder)
        .forEach(group => {
          // La posición en disputa es 1-indexed (1, 2, 3)
          // El array es 0-indexed, entonces positionInDispute - 1 es el índice correcto
          const startPosition = group.positionInDispute - 1;
          
          console.log(`  Grupo posición ${group.positionInDispute}: colocando ${group.finalOrder!.length} equipos desde índice ${startPosition}`);
          console.log(`    Equipos:`, group.finalOrder);
          
          // Colocar el orden final del grupo en las posiciones correspondientes
          group.finalOrder!.forEach((teamId, index) => {
            console.log(`    finalOrderArray[${startPosition + index}] = ${teamId}`);
            finalOrderArray[startPosition + index] = teamId;
          });
        });
      
      console.log('  finalOrderArray resultado:', finalOrderArray);
      
      // Tomar los primeros 3
      for (let i = 0; i < Math.min(3, finalOrderArray.length); i++) {
        const teamId = finalOrderArray[i];
        if (teamId) {
          const team = contest.teams.find(t => t.id === teamId);
          if (team) {
            // Sumar puntos del certamen regular + puntos del desempate (si existen)
            const totalScore = team.score + (contest.tieBreakResults?.teamScores?.[team.id] || 0);
            
            // Verificar si este equipo ganó su posición en un desempate por aproximación
            let wonByApproximation = false;
            for (const group of contest.finalTieBreakResult.groups) {
              if (group.resolved && group.finalOrder && group.finalOrder[0] === teamId && group.positionInDispute === i + 1) {
                wonByApproximation = true;
                break;
              }
            }
            
            podium.push({ teamId: team.id, teamName: team.name, score: totalScore, position: i + 1, wonByApproximation });
          }
        }
      }
    }
    // Si hay resultado de desempate normal
    else if (contest.tieBreakResults?.finalPositions) {
      const sortedByPosition = contest.teams
        .map(team => ({
          teamId: team.id,
          teamName: team.name,
          score: team.score + (contest.tieBreakResults?.teamScores?.[team.id] || 0),
          position: (contest.tieBreakResults?.finalPositions?.[team.id]) || 999
        }))
        .sort((a, b) => a.position - b.position)
        .slice(0, 3);
      
      podium.push(...sortedByPosition);
    }
    // Si no hay desempate, usar puntaje
    else {
      const sortedByScore = [...contest.teams]
        .sort((a, b) => b.score - a.score)
        .slice(0, 3)
        .map((team, index) => ({
          teamId: team.id,
          teamName: team.name,
          score: team.score,
          position: index + 1
        }));
      
      podium.push(...sortedByScore);
    }
    
    return podium;
  };

  const calculateGeneralStats = (): TeamStats[] => {
    const statsMap = new Map<string, TeamStats>();

    // Filtrar solo certámenes completados y que NO estén en modo de prueba
    const completedContests = savedContests.filter(contest => 
      isContestFullyCompleted(contest) && !contest.testMode
    );

    completedContests.forEach(contest => {
      // Acumular estadísticas para cada equipo
      contest.teams.forEach(team => {
        if (!statsMap.has(team.name)) {
          statsMap.set(team.name, {
            teamName: team.name,
            gold: 0,
            silver: 0,
            bronze: 0,
            boomerangs: 0,
            totalPoints: 0,
            participations: 0
          });
        }

        const stats = statsMap.get(team.name)!;
        
        // Determinar posición del equipo
        let position = -1;
        let wonApproximation = false; // Flag para saber si ganó por aproximación

        // Si hay resultado de desempate por aproximación, buscar en los grupos
        if (contest.finalTieBreakResult?.allResolved) {
          // Construir el orden final respetando las posiciones en disputa
          const totalTeams = contest.teams.length;
          const finalOrderArray: string[] = new Array(totalTeams).fill('');
          
          // Primero, ordenar todos los equipos por puntaje del certamen
          const allTeamsSorted = [...contest.teams].sort((a, b) => b.score - a.score);
          
          // Llenar el array con el orden por defecto (por puntaje)
          allTeamsSorted.forEach((t, index) => {
            finalOrderArray[index] = t.id;
          });
          
          // Luego, sobrescribir con los resultados del desempate por aproximación
          contest.finalTieBreakResult.groups
            .filter(g => g.resolved && g.finalOrder)
            .forEach(group => {
              // La posición en disputa es 1-indexed (1, 2, 3)
              // El array es 0-indexed, entonces positionInDispute - 1 es el índice correcto
              const startPosition = group.positionInDispute - 1;
              
              // Colocar el orden final del grupo en las posiciones correspondientes
              group.finalOrder!.forEach((teamId, index) => {
                finalOrderArray[startPosition + index] = teamId;
                
                // Si este equipo ganó la posición en disputa (primer lugar del grupo)
                if (teamId === team.id && index === 0) {
                  wonApproximation = true;
                }
              });
            });
          
          position = finalOrderArray.indexOf(team.id);
        }
        // Si hay resultado de desempate normal, usar esas posiciones
        else if (contest.tieBreakResults?.finalPositions) {
          position = contest.tieBreakResults.finalPositions[team.id] || -1;
          if (position > 0) position--; // Convertir de 1-indexed a 0-indexed
        }
        // Si no, ordenar por puntaje del certamen
        else {
          const sortedTeams = [...contest.teams].sort((a, b) => b.score - a.score);
          position = sortedTeams.findIndex(t => t.id === team.id);
        }

        // Contar medallas
        if (position === 0) stats.gold++;
        else if (position === 1) stats.silver++;
        else if (position === 2) stats.bronze++;

        // Contar bumeranes (ganó posición disputada en aproximación)
        if (wonApproximation) stats.boomerangs++;

        // Sumar puntos totales (certamen + desempate si existe)
        let totalPoints = team.score;
        if (contest.tieBreakResults?.teamScores) {
          const tieBreakScore = contest.tieBreakResults.teamScores[team.id] || 0;
          totalPoints += tieBreakScore;
        }
        stats.totalPoints += totalPoints;
        stats.participations++;
      });
    });

    // Convertir a array y ordenar: medallas → puntos → bumeranes → participaciones
    return Array.from(statsMap.values()).sort((a, b) => {
      if (b.gold !== a.gold) return b.gold - a.gold;
      if (b.silver !== a.silver) return b.silver - a.silver;
      if (b.bronze !== a.bronze) return b.bronze - a.bronze;
      if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
      if (b.boomerangs !== a.boomerangs) return b.boomerangs - a.boomerangs;
      return b.participations - a.participations;
    });
  };

  const handleBackToHome = () => {
    // Guardar el certamen actual antes de salir
    if (currentContest) {
      handleSaveContest(currentContest);
    }
    setView('home');
    setCurrentContest(null);
    setCurrentQuestionIndex(0);
  };

  const handleSelectQuestion = (index: number) => {
    if (!currentContest) return;
    
    setCurrentQuestionIndex(index);
    
    const questionResult = currentContest.results[index];
    
    // Incrementar contador de uso si es la primera vez que se muestra
    if (!questionResult.answerRevealed && !questionResult.usageCounted) {
      const question = currentContest.questions[index];
      const updatedQuestionBank = questionBank.map(q => {
        if (q.id === question.id) {
          return { ...q, usedCount: (q.usedCount || 0) + 1 };
        }
        return q;
      });
      setQuestionBank(updatedQuestionBank);
      
      // Marcar que el uso fue contabilizado
      const updatedResults = [...currentContest.results];
      updatedResults[index] = {
        ...updatedResults[index],
        usageCounted: true
      };
      const updatedContest = {
        ...currentContest,
        results: updatedResults
      };
      setCurrentContest(updatedContest);
      handleSaveContest(updatedContest);
    }
    
    // Si ya se reveló la respuesta, ir directamente a scoring (para corregir)
    // Si no se reveló, mostrar la pregunta
    if (questionResult.answerRevealed) {
      setGameView('scoring');
      setView('scoring');
    } else {
      setGameView('question');
      setView('question');
    }
  };

  const handleRevealAnswer = () => {
    if (!currentContest) return;
    
    // Marcar que la respuesta fue revelada
    const updatedResults = [...currentContest.results];
    updatedResults[currentQuestionIndex] = {
      ...updatedResults[currentQuestionIndex],
      answerRevealed: true
    };
    
    const updatedContest = {
      ...currentContest,
      results: updatedResults
    };
    
    setCurrentContest(updatedContest);
    handleSaveContest(updatedContest);
    
    setGameView('scoring');
    setView('scoring');
  };

  const handleSaveScores = (correctTeamIds: string[]) => {
    if (!currentContest) return;
    
    const currentQuestion = currentContest.questions[currentQuestionIndex];
    const currentResult = currentContest.results[currentQuestionIndex];
    
    // Calcular cambio de puntos
    const previousCorrectIds = currentResult.correctTeamIds;
    const addedIds = correctTeamIds.filter(id => !previousCorrectIds.includes(id));
    const removedIds = previousCorrectIds.filter(id => !correctTeamIds.includes(id));
    
    const updatedContest = {
      ...currentContest,
      teams: currentContest.teams.map(team => {
        let newScore = team.score;
        if (addedIds.includes(team.id)) newScore += 10;
        if (removedIds.includes(team.id)) newScore -= 10;
        return { ...team, score: newScore };
      }),
      results: currentContest.results.map((result, idx) => 
        idx === currentQuestionIndex 
          ? { ...result, correctTeamIds, completed: true }
          : result
      )
    };
    
    setCurrentContest(updatedContest);
    handleSaveContest(updatedContest);
    
    // Buscar siguiente pregunta no completada
    const nextIncomplete = updatedContest.results.findIndex((r, idx) => !r.completed && idx > currentQuestionIndex);
    if (nextIncomplete >= 0) {
      setCurrentQuestionIndex(nextIncomplete);
    }
    
    // Volver al home
    setGameView('home');
    setView('game-home');
  };

  const handleMarkQuestionAsDisputed = () => {
    if (!currentContest) return;
    
    const currentResult = currentContest.results[currentQuestionIndex];
    
    // Descontar puntos de los equipos que habían acertado
    const updatedContest = {
      ...currentContest,
      teams: currentContest.teams.map(team => {
        if (currentResult.correctTeamIds.includes(team.id)) {
          return { ...team, score: team.score - 10 };
        }
        return team;
      }),
      results: currentContest.results.map((result, idx) => 
        idx === currentQuestionIndex 
          ? { ...result, disputed: true, correctTeamIds: [], completed: true, answerRevealed: true }
          : result
      )
    };
    
    setCurrentContest(updatedContest);
    handleSaveContest(updatedContest);
    
    // Volver al home
    setGameView('home');
    setView('game-home');
  };

  const handleMarkTieBreakAsDisputed = (questionIndex: number) => {
    if (!currentContest || !currentContest.tieBreakResults) return;
    
    const tieBreakResults = currentContest.tieBreakResults;
    const previousCorrect = tieBreakResults.questionResults?.[questionIndex] || [];
    const totalQuestions = currentContest.tieBreakQuestions.length;
    
    // Descontar puntos de desempate de los equipos que habían acertado
    const newScores = { ...tieBreakResults.teamScores };
    previousCorrect.forEach(teamId => {
      if (newScores[teamId] !== undefined) {
        newScores[teamId] = Math.max(0, newScores[teamId] - 1);
      }
    });
    
    // Determinar si debemos avanzar currentQuestionIndex
    let newCurrentQuestionIndex = tieBreakResults.currentQuestionIndex;
    // Si disputamos la pregunta actual, siempre avanzar a la siguiente (si hay más preguntas)
    if (questionIndex === tieBreakResults.currentQuestionIndex && questionIndex < totalQuestions) {
      newCurrentQuestionIndex = questionIndex + 1;
    }
    
    console.log('⚠️ [Disputar Desempate]', {
      questionIndex,
      currentIdx: tieBreakResults.currentQuestionIndex,
      totalQuestions,
      newCurrentIdx: newCurrentQuestionIndex
    });
    
    // Marcar pregunta como disputada y limpiar respuestas correctas
    const updatedContest = {
      ...currentContest,
      tieBreakResults: {
        ...tieBreakResults,
        currentQuestionIndex: newCurrentQuestionIndex,
        teamScores: newScores,
        disputedQuestions: {
          ...(tieBreakResults.disputedQuestions || {}),
          [questionIndex]: true
        },
        questionResults: {
          ...(tieBreakResults.questionResults || {}),
          [questionIndex]: []
        }
      }
    };
    
    setCurrentContest(updatedContest);
    handleSaveContest(updatedContest);
    
    // Volver al home del desempate
    setView('tiebreak-home');
  };

  const handleSelectReplacement = () => {
    setShowReplacementModal(true);
  };

  const handleAddReplacementQuestion = (question: Question) => {
    if (!currentContest) return;
    
    let updatedContest;
    
    // Detectar si estamos en modo desempate
    if (isTieBreakMode && currentContest.tieBreakResults) {
      const tieBreakResults = currentContest.tieBreakResults;
      const currentIdx = tieBreakResults.currentQuestionIndex;
      const currentLength = currentContest.tieBreakQuestions.length;
      
      // Si el currentIdx es >= currentLength, significa que ya completamos todas las preguntas
      // y la nueva pregunta debería estar disponible
      const shouldEnableNewQuestion = currentIdx >= currentLength;
      
      // Agregar pregunta al final de las preguntas de desempate
      updatedContest = {
        ...currentContest,
        tieBreakQuestions: [...currentContest.tieBreakQuestions, question],
        tieBreakResults: {
          ...tieBreakResults,
          // Si todas las preguntas están completadas, el nuevo índice es currentLength (la nueva pregunta)
          currentQuestionIndex: shouldEnableNewQuestion ? currentLength : currentIdx
        }
      };
      
      console.log('🔄 [Reemplazo Desempate]', {
        currentIdx,
        currentLength,
        newLength: currentLength + 1,
        shouldEnableNewQuestion,
        newCurrentIdx: shouldEnableNewQuestion ? currentLength : currentIdx
      });
    } else {
      // Agregar pregunta al final del certamen regular
      updatedContest = {
        ...currentContest,
        questions: [...currentContest.questions, question],
        results: [
          ...currentContest.results,
          {
            questionId: question.id,
            correctTeamIds: [],
            completed: false,
            answerRevealed: false,
            usageCounted: false
          }
        ]
      };
      
      // Si estábamos en la última pregunta y estaba completada, actualizar el índice a la nueva pregunta
      if (currentQuestionIndex === currentContest.questions.length - 1 && 
          currentContest.results[currentQuestionIndex]?.completed) {
        setCurrentQuestionIndex(currentContest.questions.length);
      }
    }
    
    // Incrementar usedCount de la pregunta en el banco
    const updatedQuestionBank = questionBank.map(q => 
      q.id === question.id 
        ? { ...q, usedCount: q.usedCount + 1 }
        : q
    );
    
    setQuestionBank(updatedQuestionBank);
    localStorage.setItem('questionBank', JSON.stringify(updatedQuestionBank));
    
    setCurrentContest(updatedContest);
    handleSaveContest(updatedContest);
    
    setShowReplacementModal(false);
  };

  const handleFinishContest = () => {
    if (!currentContest) return;

    // Marcar todas las preguntas restantes como completadas y con respuesta revelada
    const updatedResults = currentContest.results.map(result => ({
      ...result,
      completed: true,
      answerRevealed: true
    }));

    const updatedContest = {
      ...currentContest,
      results: updatedResults
    };

    setCurrentContest(updatedContest);
    handleSaveContest(updatedContest);

    // Ahora verificar si hay empates en el podio
    const tieBreakGroups = detectPodiumTies(updatedContest.teams);
    
    if (tieBreakGroups && tieBreakGroups.length > 0) {
      // Hay empates en el podio
      if (updatedContest.tieBreakQuestions.length === 5) {
        // Tenemos preguntas de desempate, mostrar explicación
        setView('tiebreak-explanation');
        return;
      } else {
        // No hay preguntas de desempate
        alert('Se detectaron empates en el podio pero no hay preguntas de desempate configuradas.');
      }
    }
    
    // Si no hay empates, mostrar resultados/podio
    setGameView('results');
    setView('results');
  };

  const handleViewResults = () => {
    if (!currentContest) {
      setGameView('results');
      setView('results');
      return;
    }

    // Verificar si el certamen está completo
    const isComplete = currentContest.results.every(r => r.completed && r.answerRevealed);
    
    if (isComplete) {
      // Si ya hay desempates resueltos, ir directo a resultados/podio
      const hasTieBreakResolved = currentContest.tieBreakResults?.finalPositions || currentContest.finalTieBreakResult?.allResolved;
      
      if (hasTieBreakResolved) {
        // Desempate ya resuelto, mostrar resultados con el orden final
        setGameView('results');
        setView('results');
        return;
      }
      
      // Detectar empates en el podio
      const tieBreakGroups = detectPodiumTies(currentContest.teams);
      
      if (tieBreakGroups && tieBreakGroups.length > 0) {
        // Hay empates en el podio sin resolver
        if (currentContest.tieBreakQuestions.length === 5) {
          // Tenemos preguntas de desempate, mostrar explicación
          setView('tiebreak-explanation');
          return;
        } else {
          // No hay preguntas de desempate, avisar
          alert('Se detectaron empates en el podio pero no hay preguntas de desempate configuradas.');
        }
      }
    }
    
    // Si no hay empates o el certamen no está completo, mostrar resultados normales
    setGameView('results');
    setView('results');
  };

  const handleBackToGameHome = () => {
    if (currentContest) {
      handleSaveContest(currentContest);
      
      // Recalcular la pregunta actual (primera no completada)
      const firstIncomplete = currentContest.results.findIndex(r => !r.completed);
      if (firstIncomplete >= 0) {
        setCurrentQuestionIndex(firstIncomplete);
      }
    }
    setGameView('home');
    setView('game-home');
  };

  const handleExportData = () => {
    const data = {
      teamBank,
      questionBank,
      approximationBank,
      savedContests,
      exportDate: new Date().toISOString(),
      version: '1.0.0'
    };

    const dataStr = JSON.stringify(data, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const date = new Date().toISOString().split('T')[0];
    const link = document.createElement('a');
    link.href = url;
    link.download = `trivia-backup-${date}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    alert('✅ Datos exportados correctamente');
  };

  const handleImportData = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = (e: Event) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const importedData = JSON.parse(event.target?.result as string);
          
          // Crear diálogo personalizado
          const dialog = document.createElement('div');
          dialog.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); display: flex; align-items: center; justify-content: center; z-index: 10000;';
          
          const dialogBox = document.createElement('div');
          dialogBox.style.cssText = 'background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 40px; border-radius: 16px; max-width: 500px; box-shadow: 0 8px 32px rgba(0,0,0,0.5); border: 2px solid #e94560;';
          
          dialogBox.innerHTML = `
            <h2 style="color: #e94560; margin: 0 0 20px 0; font-size: 24px; text-align: center;">¿Cómo deseas importar los datos?</h2>
            <p style="color: #eee; margin-bottom: 30px; line-height: 1.6; text-align: center;">
              Elige una opción para continuar con la importación
            </p>
            <div style="display: flex; gap: 15px;">
              <button id="replaceBtn" style="flex: 1; padding: 15px 20px; background: linear-gradient(135deg, #e94560 0%, #d63851 100%); color: white; border: none; border-radius: 8px; font-size: 16px; font-weight: bold; cursor: pointer; transition: all 0.3s;">
                🔄 Reemplazar
              </button>
              <button id="mergeBtn" style="flex: 1; padding: 15px 20px; background: linear-gradient(135deg, #27ae60 0%, #219653 100%); color: white; border: none; border-radius: 8px; font-size: 16px; font-weight: bold; cursor: pointer; transition: all 0.3s;">
                ➕ Combinar
              </button>
            </div>
            <p style="color: #999; font-size: 13px; margin-top: 20px; text-align: center; line-height: 1.5;">
              <strong style="color: #e94560;">Reemplazar:</strong> Borra todos los datos actuales<br/>
              <strong style="color: #27ae60;">Combinar:</strong> Mantiene los existentes y agrega los nuevos
            </p>
          `;
          
          dialog.appendChild(dialogBox);
          document.body.appendChild(dialog);
          
          const replaceBtn = document.getElementById('replaceBtn')!;
          const mergeBtn = document.getElementById('mergeBtn')!;
          
          replaceBtn.onmouseover = () => replaceBtn.style.transform = 'translateY(-2px)';
          replaceBtn.onmouseout = () => replaceBtn.style.transform = 'translateY(0)';
          mergeBtn.onmouseover = () => mergeBtn.style.transform = 'translateY(-2px)';
          mergeBtn.onmouseout = () => mergeBtn.style.transform = 'translateY(0)';
          
          replaceBtn.onclick = () => {
            document.body.removeChild(dialog);
            // REEMPLAZAR: sobrescribir todo
            setTeamBank(importedData.teamBank || []);
            setQuestionBank(importedData.questionBank || []);
            setApproximationBank(importedData.approximationBank || []);
            setSavedContests(importedData.savedContests || []);
            alert('✅ Datos reemplazados correctamente');
          };
          
          mergeBtn.onclick = () => {
            document.body.removeChild(dialog);
            // FUSIONAR: combinar sin duplicados
            const mergedTeams = [...teamBank];
            const mergedQuestions = [...questionBank];
            const mergedApproximations = [...approximationBank];
            const mergedContests = [...savedContests];

            // Fusionar equipos (evitar duplicados por ID)
            (importedData.teamBank || []).forEach((team: Team) => {
              if (!mergedTeams.find(t => t.id === team.id)) {
                mergedTeams.push(team);
              }
            });

            // Fusionar preguntas (evitar duplicados por ID)
            (importedData.questionBank || []).forEach((question: Question) => {
              if (!mergedQuestions.find(q => q.id === question.id)) {
                mergedQuestions.push(question);
              }
            });

            // Fusionar aproximaciones (evitar duplicados por ID)
            (importedData.approximationBank || []).forEach((approx: ApproximationQuestion) => {
              if (!mergedApproximations.find(a => a.id === approx.id)) {
                mergedApproximations.push(approx);
              }
            });

            // Fusionar certámenes (evitar duplicados por ID)
            (importedData.savedContests || []).forEach((contest: Contest) => {
              if (!mergedContests.find(c => c.id === contest.id)) {
                mergedContests.push(contest);
              }
            });

            setTeamBank(mergedTeams);
            setQuestionBank(mergedQuestions);
            setApproximationBank(mergedApproximations);
            setSavedContests(mergedContests);
            alert('✅ Datos fusionados correctamente');
          };
        } catch (error) {
          alert('❌ Error al importar datos. Verifica que el archivo sea válido.');
          console.error('Error importing data:', error);
        }
      };
      
      reader.readAsText(file);
    };
    
    input.click();
  };

  return (
    <div className="app">
      {view === 'reglamento' ? (
        <Reglamento onBack={() => setView('home')} />
      ) : view === 'documentacion' ? (
        <DocumentacionFuncional onBack={() => setView('home')} />
      ) : view === 'home' ? (
        <HomePage 
          onNavigate={(newView) => setView(newView)}
          onResetWizard={() => setWizardKey(prev => prev + 1)}
          onExportData={handleExportData}
          onImportData={handleImportData}
        />
      ) : view === 'teams' ? (
        <TeamBankManager
          teamBank={teamBank}
          onAddTeam={handleAddTeamToBank}
          onRemoveTeam={handleRemoveTeamFromBank}
          onBackToHome={() => setView('home')}
        />
      ) : view === 'questions' ? (
        <QuestionBankManager
          questionBank={questionBank}
          onAddQuestion={handleAddQuestionToBank}
          onRemoveQuestion={handleRemoveQuestionFromBank}
          onUpdateBank={setQuestionBank}
          onBackToHome={() => setView('home')}
        />
      ) : view === 'approximations' ? (
        <ApproximationBankManager
          approximationBank={approximationBank}
          onAddApproximation={(q) => {
            const updated = [...approximationBank, q];
            setApproximationBank(updated);
            localStorage.setItem('approximationBank', JSON.stringify(updated));
          }}
          onRemoveApproximation={(id) => {
            const updated = approximationBank.filter(q => q.id !== id);
            setApproximationBank(updated);
            localStorage.setItem('approximationBank', JSON.stringify(updated));
          }}
          onUpdateBank={(questions) => {
            setApproximationBank(questions);
            localStorage.setItem('approximationBank', JSON.stringify(questions));
          }}
          onBackToHome={() => setView('home')}
        />
      ) : view === 'new-contest' ? (
        <ContestWizard
          key={wizardKey}
          teamBank={teamBank}
          questionBank={questionBank}
          onStartContest={handleStartContest}
          onBackToHome={() => setView('home')}
        />
      ) : view === 'contests' ? (
        <div className="contest-list-view">
          <div className="contest-list-header">
            <button onClick={() => setView('home')} className="back-button">
              🏠 Volver al Inicio
            </button>
            <h1>🏆 Certámenes Guardados</h1>
          </div>
          
          <div className="contests-tabs">
            <button 
              className={`contests-tab ${contestsTab === 'normal' ? 'active' : ''}`}
              onClick={() => setContestsTab('normal')}
            >
              ⭐ Normales ({savedContests.filter(c => !c.testMode).length})
            </button>
            <button 
              className={`contests-tab ${contestsTab === 'test' ? 'active' : ''}`}
              onClick={() => setContestsTab('test')}
            >
              🧪 Prueba ({savedContests.filter(c => c.testMode).length})
            </button>
          </div>

          <div className="contests-container">
            {(() => {
              const filteredContests = savedContests.filter(c => 
                contestsTab === 'normal' ? !c.testMode : c.testMode
              );
              
              return filteredContests.length === 0 ? (
                <div className="empty-state">
                  <p>No hay certámenes {contestsTab === 'normal' ? 'normales' : 'de prueba'} guardados todavía.</p>
                  <button onClick={() => {
                    setWizardKey(prev => prev + 1);
                    setView('new-contest');
                  }} className="btn-primary">
                    Crear Certamen
                  </button>
                </div>
              ) : (
                <div className="contests-grid">
                  {filteredContests.map(contest => {
                  const isCompleted = isContestFullyCompleted(contest);
                  const allQuestionsAnswered = contest.results.every(r => r.completed && r.answerRevealed);
                  const completedQuestions = contest.results.filter(r => r.completed && r.answerRevealed).length;
                  const hasPendingTieBreak = allQuestionsAnswered && !isCompleted;
                  
                  return (
                    <div key={contest.id} className={`contest-card ${isCompleted ? 'completed' : ''} ${contest.testMode ? 'test-mode' : ''}`}>
                      <div className="contest-card-header">
                        <h3>{contest.name}</h3>
                        <div className="contest-card-header-actions">
                          {contest.testMode && <span className="test-mode-badge" title="Modo de prueba activado">🧪</span>}
                          <button 
                            onClick={() => handleDeleteContest(contest.id)} 
                            className="delete-btn"
                            title="Eliminar certamen"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                      <div className="contest-card-body">
                        {isCompleted && (
                          <div className="contest-status completed">
                            ✓ Certamen Finalizado
                          </div>
                        )}
                        {hasPendingTieBreak && (
                          <div className="contest-status pending-tiebreak">
                            ⚔️ Desempate Pendiente
                          </div>
                        )}
                        {!allQuestionsAnswered && (
                          <div className="contest-status in-progress">
                            ⏳ En progreso: {completedQuestions}/{contest.questions.length} preguntas
                          </div>
                        )}
                        <div className="contest-info">
                          <span className="info-label">Equipos:</span>
                          <span className="info-value">{contest.teams.length}</span>
                        </div>
                        <div className="contest-info">
                          <span className="info-label">Preguntas:</span>
                          <span className="info-value">{contest.questions.length}</span>
                        </div>
                        <div className="contest-test-mode-control">
                          <label className="test-mode-toggle-label">
                            <input 
                              type="checkbox" 
                              checked={contest.testMode || false}
                              onChange={() => handleToggleContestTestMode(contest.id)}
                              className="test-mode-checkbox"
                            />
                            <span className="test-mode-text">🧪 Modo Prueba</span>
                            <span className="test-mode-description">
                              {contest.testMode ? '(Timer: 0s, no cuenta para estadísticas)' : '(Timer: 30s, cuenta para estadísticas)'}
                            </span>
                          </label>
                        </div>
                        {isCompleted && (
                          <div className="contest-teams">
                            <strong>Podio:</strong>
                            <ol>
                              {getContestPodium(contest).map(podiumEntry => {
                                const medal = podiumEntry.position === 1 ? '🥇' : podiumEntry.position === 2 ? '🥈' : '🥉';
                                return (
                                  <li key={podiumEntry.teamId}>
                                    {medal} {podiumEntry.teamName}: <strong>{podiumEntry.score} pts</strong>
                                    {podiumEntry.wonByApproximation && <span className="boomerang-award"> 🪃</span>}
                                  </li>
                                );
                              })}
                            </ol>
                          </div>
                        )}
                      </div>
                      <div className="contest-card-actions">
                        <button 
                          onClick={() => handleGeneratePrintableQuestions(contest)} 
                          className="btn-print-questions"
                          title="Descargar PDF con listado de preguntas y respuestas"
                        >
                          📥 Descargar Listado
                        </button>
                        {isCompleted ? (
                          <button 
                            onClick={() => {
                              setCurrentContest(contest);
                              setView('results');
                            }} 
                            className="btn-view-results-final"
                          >
                            📊 Ver Resultados Finales
                          </button>
                        ) : (
                          <button 
                            onClick={() => handleLoadContest(contest)} 
                            className="btn-load"
                          >
                            {hasPendingTieBreak ? '⚔️ Resolver Desempate' : '▶ Continuar Certamen'}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
                </div>
              );
            })()}
          </div>
        </div>
      ) : view === 'standings' ? (
        <GeneralStandings 
          stats={calculateGeneralStats()} 
          onBackToHome={() => setView('home')} 
        />
      ) : view === 'game-home' && currentContest ? (
        <div className="game-wrapper">
          <div className="game-header">
            <button onClick={handleBackToHome} className="back-button">
              🏠 Salir del Certamen
            </button>
            <h1>{currentContest.name}</h1>
            {!currentContest.results.every(r => r.completed && r.answerRevealed) && (
              <button onClick={() => setShowFinishModal(true)} className="btn-finish-contest-header">
                🏁 Finalizar Certamen
              </button>
            )}
          </div>
          <GameHome
            contestName={currentContest.name}
            questions={currentContest.questions}
            currentQuestionIndex={currentQuestionIndex}
            results={currentContest.results}
            onSelectQuestion={handleSelectQuestion}
            onViewResults={handleViewResults}
            onSelectReplacement={handleSelectReplacement}
            originalQuestionCount={currentContest.originalQuestionCount}
          />
        </div>
      ) : view === 'question' && currentContest ? (
        <div className="game-wrapper">
          <div className="game-header">
            <button onClick={handleBackToGameHome} className="back-button">
              🏠 Volver al Mapa
            </button>
            <h1>{currentContest.name}</h1>
          </div>
          <QuestionDisplay
            question={currentContest.questions[currentQuestionIndex]}
            questionNumber={currentQuestionIndex + 1}
            onRevealAnswer={handleRevealAnswer}
            testMode={currentContest.testMode || false}
          />
        </div>
      ) : view === 'scoring' && currentContest ? (
        <div className="game-wrapper">
          <TeamScoring
            teams={currentContest.teams}
            question={currentContest.questions[currentQuestionIndex]}
            questionNumber={currentQuestionIndex + 1}
            previousCorrectTeamIds={currentContest.results[currentQuestionIndex]?.correctTeamIds || []}
            isEditMode={currentContest.results[currentQuestionIndex]?.completed || false}
            onSaveScores={handleSaveScores}
            onViewResults={handleViewResults}
            onBackToHome={handleBackToGameHome}
            isDisputed={currentContest.results[currentQuestionIndex]?.disputed || false}
            onMarkAsDisputed={handleMarkQuestionAsDisputed}
          />
        </div>
      ) : view === 'results' && currentContest ? (
        <div className="game-wrapper">
          <div className="game-header">
            <button onClick={handleBackToGameHome} className="back-button">
              🏠 Volver al Mapa
            </button>
            <h1>{currentContest.name}</h1>
          </div>
          <Scoreboard
            teams={currentContest.teams}
            contestCompleted={currentContest.results.every(r => r.completed)}
            tieBreakResults={currentContest.tieBreakResults}
            finalTieBreakResult={currentContest.finalTieBreakResult}
            onShowPodium={() => {
              // Si ya existe un desempate resuelto, mostrar podio directamente
              if (currentContest.tieBreakResults?.finalPositions || currentContest.finalTieBreakResult?.allResolved) {
                setView('podium');
                return;
              }
              
              // Detectar empates en el podio
              const tieBreakGroups = detectPodiumTies(currentContest.teams);
              
              if (tieBreakGroups && currentContest.tieBreakQuestions.length === 5) {
                // Hay empates y tenemos preguntas de desempate
                setView('tiebreak-explanation');
              } else {
                // No hay empates o no hay preguntas de desempate, mostrar podio directo
                setView('podium');
              }
            }}
          />
        </div>
      ) : view === 'tiebreak-explanation' && currentContest ? (
        <TieBreakExplanation
          groups={detectPodiumTies(currentContest.teams) || []}
          onStartTieBreak={() => {
            // Inicializar estado de desempate
            setIsTieBreakMode(true);
            setTieBreakQuestionIndex(0);
            
            // Inicializar tieBreakResults si no existe
            if (!currentContest.tieBreakResults) {
              const tieBreakGroups = detectPodiumTies(currentContest.teams) || [];
              const initialScores: { [teamId: string]: number } = {};
              tieBreakGroups.forEach(group => {
                group.teams.forEach(team => {
                  initialScores[team.id] = 0;
                });
              });
              
              const updatedContest = {
                ...currentContest,
                tieBreakResults: {
                  currentQuestionIndex: 0,
                  teamScores: initialScores,
                  resolvedTeams: [],
                  originalQuestionCount: 5
                }
              };
              setCurrentContest(updatedContest);
            }
            
            setView('tiebreak-home');
          }}
          onCancel={() => {
            setIsTieBreakMode(false);
            setIsFinalTieBreak(false);
            setView('home');
          }}
          onBackToResults={() => {
            setIsTieBreakMode(false);
            setView('game-home');
            setGameView('map');
          }}
        />
      ) : view === 'tiebreak-home' && currentContest && isTieBreakMode ? (
        <TieBreakHome
          contestName={currentContest.name}
          tieBreakQuestions={currentContest.tieBreakQuestions}
          currentQuestionIndex={currentContest.tieBreakResults!.currentQuestionIndex}
          tieBreakResults={currentContest.tieBreakResults!}
          tieBreakGroups={detectPodiumTies(currentContest.teams) || []}
          onSelectReplacement={() => setShowReplacementModal(true)}
          originalQuestionCount={currentContest.tieBreakResults!.originalQuestionCount}
          onSelectQuestion={(index) => {
            setTieBreakQuestionIndex(index);
            
            // Incrementar contador de uso al mostrar la pregunta
            if (currentContest.tieBreakQuestions[index]) {
              const question = currentContest.tieBreakQuestions[index];
              const updatedQuestionBank = questionBank.map(q => {
                if (q.id === question.id) {
                  return { ...q, usedCount: (q.usedCount || 0) + 1 };
                }
                return q;
              });
              setQuestionBank(updatedQuestionBank);
            }
            
            setView('tiebreak-question');
          }}
          onEditCompletedQuestion={(index) => {
            setTieBreakQuestionIndex(index);
            // Ir directamente al scoring para editar
            setView('tiebreak-scoring');
          }}
          onBackToResults={() => {
            console.log('🔍 [onBackToResults] Recalculando empates...');
            console.log('🔍 [onBackToResults] currentContest:', currentContest);
            console.log('🔍 [onBackToResults] tieBreakResults:', currentContest.tieBreakResults);
            
            if (!currentContest.tieBreakResults) {
              console.error('❌ [onBackToResults] No hay tieBreakResults');
              setIsTieBreakMode(false);
              setView('results');
              return;
            }
            
            // Recalcular empates finales para ver si necesitamos desempate por aproximación
            const originalTieGroups = detectPodiumTies(currentContest.teams) || [];
            const finalTiesArrays = detectFinalTies(
              currentContest.teams,
              currentContest.tieBreakResults.teamScores,
              originalTieGroups
            );
            
            console.log('🔍 [onBackToResults] Empates detectados (arrays):', finalTiesArrays);
            
            // Convertir a FinalTieBreakGroup[] con posiciones
            const totalScores = currentContest.teams.map(team => ({
              teamId: team.id,
              totalScore: team.score + (currentContest.tieBreakResults.teamScores[team.id] || 0)
            })).sort((a, b) => b.totalScore - a.totalScore);
            
            const finalTieBreakGroups: FinalTieBreakGroup[] = finalTiesArrays
              .map(teamIds => {
                // Encontrar qué posición del podio corresponde
                const firstTeamInGroup = totalScores.findIndex(t => teamIds.includes(t.teamId));
                const positionInDispute = firstTeamInGroup + 1; // 1, 2, o 3
                
                return {
                  teamIds,
                  positionInDispute,
                  rounds: []
                };
              })
              .filter(group => group.positionInDispute <= 3); // Solo grupos en el podio (1°, 2° o 3°)
            
            console.log('🔍 [onBackToResults] Grupos de empate con posiciones:', finalTieBreakGroups);
            console.log('🔍 [onBackToResults] Preguntas de aproximación disponibles:', approximationBank.length);
            
            if (finalTieBreakGroups.length > 0 && approximationBank.length > 0) {
              // Todavía hay empates sin resolver, ir a explicación de desempate por aproximación
              const initialFinalTieBreak: FinalTieBreakResult = {
                groups: finalTieBreakGroups.map(g => ({
                  positionInDispute: g.positionInDispute,
                  teamIds: g.teamIds,
                  resolved: false,
                  finalOrder: null
                })),
                allResolved: false
              };
              
              const contestWithFinalTieBreak = {
                ...currentContest,
                finalTieBreakResult: initialFinalTieBreak
              };
              
              setCurrentContest(contestWithFinalTieBreak);
              handleSaveContest(contestWithFinalTieBreak);
              
              console.log('🎯 [onBackToResults] Redirigiendo a approximation-tiebreak-explanation');
              setView('approximation-tiebreak-explanation');
            } else {
              // No hay más empates, volver a resultados
              console.log('✅ [onBackToResults] No hay empates, volviendo a resultados');
              setIsTieBreakMode(false);
              setView('results');
            }
          }}
        />
      ) : view === 'approximation-tiebreak-explanation' && currentContest && currentContest.finalTieBreakResult ? (
        <ApproximationTieBreakExplanation
          groups={currentContest.finalTieBreakResult.groups}
          teams={currentContest.teams}
          tieBreakResults={currentContest.tieBreakResults}
          onBackToTieBreak={() => {
            // Volver al mapa de preguntas del desempate regular para editar
            setView('tiebreak-home');
            setIsTieBreakMode(true);
            setIsFinalTieBreak(false);
          }}
          onStart={() => {
            // Iniciar el desempate por aproximación
            setIsFinalTieBreak(true);
            
            // Recopilar IDs de preguntas ya usadas en este certamen
            const usedInContestIds = new Set<string>();
            if (currentContest.finalTieBreakResult?.groups) {
              currentContest.finalTieBreakResult.groups.forEach(group => {
                group.rounds.forEach(round => {
                  usedInContestIds.add(round.questionId);
                });
              });
            }
            
            // Filtrar preguntas no usadas en este certamen
            const availableQuestions = approximationBank.filter(q => !usedInContestIds.has(q.id));
            
            // Seleccionar pregunta de aproximación menos usada de las disponibles
            const leastUsed = availableQuestions.length > 0
              ? availableQuestions.reduce((min, q) => q.usedCount < min.usedCount ? q : min)
              : approximationBank.reduce((min, q) => q.usedCount < min.usedCount ? q : min); // Fallback si todas están usadas
            
            setCurrentApproximationQuestion(leastUsed);
            
            // Incrementar contador de uso al mostrar la pregunta
            const updatedApproximationBank = approximationBank.map(q => {
              if (q.id === leastUsed.id) {
                return { ...q, usedCount: (q.usedCount || 0) + 1 };
              }
              return q;
            });
            setApproximationBank(updatedApproximationBank);
            
            setView('approximation-question');
          }}
          onCancel={() => {
            setIsTieBreakMode(false);
            setIsFinalTieBreak(false);
            setView('home');
          }}
        />
      ) : view === 'tiebreak-question' && currentContest && isTieBreakMode ? (
        <div className="game-wrapper">
          <div className="game-header">
            <button onClick={() => setView('tiebreak-home')} className="back-button">
              🏠 Volver al Mapa
            </button>
            <h1>⚔️ Desempate - Pregunta {tieBreakQuestionIndex + 1} de {currentContest.tieBreakQuestions.length}</h1>
          </div>
          <div className="game-content">
            <div className="left-panel">
              <QuestionDisplay
                question={currentContest.tieBreakQuestions[tieBreakQuestionIndex]}
                onRevealAnswer={() => setView('tiebreak-scoring')}
                testMode={currentContest.testMode || false}
              />
            </div>
            <div className="right-panel">
              <Scoreboard 
                teams={currentContest.teams}
                isTieBreakMode={true}
                tieBreakGroups={detectPodiumTies(currentContest.teams) || []}
                tieBreakResults={currentContest.tieBreakResults!}
              />
            </div>
          </div>
        </div>
      ) : view === 'tiebreak-scoring' && currentContest && isTieBreakMode ? (
        (() => {
          // Solo considerar que estamos editando si el índice de pregunta actual es MENOR que currentQuestionIndex
          // Esto significa que ya pasamos por esta pregunta
          const isEditingTieBreak = tieBreakQuestionIndex < (currentContest.tieBreakResults?.currentQuestionIndex || 0);
          const previousCorrectTeamIds = currentContest.tieBreakResults?.questionResults?.[tieBreakQuestionIndex] || [];
          
          console.log('🔧 [Desempate Scoring]', {
            tieBreakQuestionIndex,
            currentQuestionIndex: currentContest.tieBreakResults?.currentQuestionIndex,
            isEditingTieBreak,
            previousCorrectTeamIds,
            questionResults: currentContest.tieBreakResults?.questionResults
          });
          
          return (
            <TeamScoring
              question={currentContest.tieBreakQuestions[tieBreakQuestionIndex]}
              questionNumber={tieBreakQuestionIndex + 1}
              teams={currentContest.teams}
              isTieBreakMode={true}
              isEditMode={isEditingTieBreak}
              previousCorrectTeamIds={previousCorrectTeamIds}
              tieBreakGroups={detectPodiumTies(currentContest.teams) || []}
              tieBreakResults={currentContest.tieBreakResults!}
              questionsRemaining={currentContest.tieBreakQuestions.length - 1 - tieBreakQuestionIndex}
              onViewResults={isEditingTieBreak ? () => setView('tiebreak-home') : undefined}
              isDisputed={currentContest.tieBreakResults?.disputedQuestions?.[tieBreakQuestionIndex] || false}
              onMarkAsDisputed={() => handleMarkTieBreakAsDisputed(tieBreakQuestionIndex)}
              onSaveScores={(correctTeamIds) => {
                const tieBreakResults = currentContest.tieBreakResults!;
                const questionResults = { ...(tieBreakResults.questionResults || {}) };
                const previousCorrect = questionResults[tieBreakQuestionIndex] || [];
                
                // Guardar los equipos correctos para esta pregunta
                questionResults[tieBreakQuestionIndex] = correctTeamIds;
                
                // Recalcular puntajes desde cero basándose en todos los resultados
                const newScores: { [teamId: string]: number } = {};
                Object.keys(tieBreakResults.teamScores).forEach(teamId => {
                  newScores[teamId] = 0;
                });
                
                // Sumar puntos de todas las preguntas (excepto las disputadas)
                const disputedQuestions = tieBreakResults.disputedQuestions || {};
                console.log('📊 Recalculando puntajes, questionResults:', questionResults);
                Object.keys(questionResults).forEach(key => {
                  const questionIdx = parseInt(key);
                  // Ignorar preguntas disputadas
                  if (disputedQuestions[questionIdx]) {
                    console.log(`  Pregunta ${key}: DISPUTADA (ignorada)`);
                    return;
                  }
                  const teamIds = questionResults[questionIdx];
                  console.log(`  Pregunta ${key}:`, teamIds);
                  teamIds.forEach((teamId: string) => {
                    if (newScores[teamId] !== undefined) {
                      newScores[teamId] = (newScores[teamId] || 0) + 1;
                    }
                  });
                });
            
            // Detectar equipos que ya tienen su posición definida (resueltos)
            // Hay dos casos:
            // CASO 1: Equipos de arriba con ventaja inalcanzable (ganan 1°, 2°, etc)
            //         Ejemplo: A=4pts, B=1pts, quedan 2 preguntas → A gana su posición
            // CASO 2: Equipos de abajo que no pueden alcanzar a nadie (quedan últimos)
            //         Ejemplo: A=3pts, B=2pts, C=0pts, quedan 1 pregunta → C queda último
            const tieBreakGroups = detectPodiumTies(currentContest.teams) || [];
            const newResolvedTeams = [...tieBreakResults.resolvedTeams];
            const totalTieBreakQuestions = currentContest.tieBreakQuestions.length;
            const questionsLeft = totalTieBreakQuestions - 1 - tieBreakQuestionIndex; // Preguntas restantes después de esta
            
            console.log('🔍 [Resolución Automática]', {
              tieBreakQuestionIndex,
              totalTieBreakQuestions,
              questionsLeft,
              currentScores: newScores
            });
            
            tieBreakGroups.forEach(group => {
              // Solo considerar equipos que aún compiten (no resueltos)
              const activeTeamsInGroup = group.teams.filter(t => !newResolvedTeams.includes(t.id));
              
              if (activeTeamsInGroup.length > 1) {
                // Ordenar por puntaje de desempate (mayor a menor)
                const sorted = [...activeTeamsInGroup].sort((a, b) => 
                  (newScores[b.id] || 0) - (newScores[a.id] || 0)
                );

                // CASO 1: Equipos de arriba con ventaja inalcanzable
                // Verificar de arriba hacia abajo si tienen ventaja sobre el siguiente
                for (let i = 0; i < sorted.length - 1; i++) {
                  const teamScore = newScores[sorted[i].id] || 0;
                  const nextScore = newScores[sorted[i + 1].id] || 0;
                  
                  if (teamScore - nextScore > questionsLeft) {
                    newResolvedTeams.push(sorted[i].id);
                  } else {
                    break; // Si este no tiene ventaja, los de abajo tampoco
                  }
                }
                
                // CASO 2: Equipos de abajo que ya no pueden alcanzar a nadie
                // Verificar de abajo hacia arriba si pueden alcanzar al de arriba
                for (let i = sorted.length - 1; i > 0; i--) {
                  const teamScore = newScores[sorted[i].id] || 0;
                  const prevScore = newScores[sorted[i - 1].id] || 0;
                  const maxPossible = teamScore + questionsLeft;
                  
                  // Si ni siquiera con todas las preguntas puede alcanzar al anterior, está fuera
                  if (maxPossible < prevScore) {
                    // Verificar que este equipo no fue resuelto en CASO 1
                    if (!newResolvedTeams.includes(sorted[i].id)) {
                      newResolvedTeams.push(sorted[i].id);
                    }
                  } else {
                    break; // Si este puede alcanzar, los de arriba también pueden
                  }
                }
              }
            });
            
                // Actualizar contest con nuevos puntajes, equipos resueltos y resultados por pregunta
                const updatedContest = {
                  ...currentContest,
                  tieBreakResults: {
                    ...tieBreakResults,
                    teamScores: newScores,
                    resolvedTeams: newResolvedTeams,
                    currentQuestionIndex: isEditingTieBreak ? tieBreakResults.currentQuestionIndex : tieBreakQuestionIndex + 1,
                    questionResults
                  }
                };
                setCurrentContest(updatedContest);
                handleSaveContest(updatedContest);
                
                console.log('💾 Contest guardado:', {
                  isEditingTieBreak,
                  currentQuestionIndex: updatedContest.tieBreakResults?.currentQuestionIndex,
                  questionResults: updatedContest.tieBreakResults?.questionResults
                });
                
                // Si estamos editando, simplemente volver al mapa
                if (isEditingTieBreak) {
                  setView('tiebreak-home');
                  return;
                }
            
                // Verificar si todos los equipos en desempate ya están resueltos
                // (reutilizamos tieBreakGroups y totalTieBreakQuestions ya declarados arriba)
                const totalTeamsInTieBreak = tieBreakGroups.reduce((sum, group) => sum + group.teams.length, 0);
                const allResolved = newResolvedTeams.length === totalTeamsInTieBreak;
            
                console.log('🔍 [Verificar Finalización]', {
                  tieBreakQuestionIndex,
                  totalTieBreakQuestions,
                  allResolved,
                  shouldFinish: tieBreakQuestionIndex >= totalTieBreakQuestions - 1 || allResolved
                });
            
                // Finalizar si llegamos a la última pregunta O si todos los equipos están resueltos
                if (tieBreakQuestionIndex >= totalTieBreakQuestions - 1 || allResolved) {
              // Calcular posiciones finales
              const finalPositions: { [teamId: string]: number } = {};
              
              tieBreakGroups.forEach(group => {
                const teamsInGroup = group.teams.map(t => ({
                  ...t,
                  tieBreakScore: newScores[t.id] || 0
                })).sort((a, b) => b.tieBreakScore - a.tieBreakScore);

                teamsInGroup.forEach((team, index) => {
                  const position = group.positionNumbers[index] || group.positionNumbers[group.positionNumbers.length - 1];
                  finalPositions[team.id] = position;
                });
              });
              
              const finalContest = {
                ...updatedContest,
                tieBreakResults: {
                  ...updatedContest.tieBreakResults!,
                  finalPositions
                }
              };
              setCurrentContest(finalContest);
              handleSaveContest(finalContest);
              setIsTieBreakMode(false);
              
              // Detectar empates finales: equipos con el mismo puntaje de desempate
              // Calcular puntaje total (certamen + desempate) para cada equipo
              const totalScores = currentContest.teams.map(team => ({
                teamId: team.id,
                totalScore: team.score + (newScores[team.id] || 0)
              })).sort((a, b) => b.totalScore - a.totalScore);
              
              const finalTieBreakGroups: FinalTieBreakGroup[] = [];
              
              tieBreakGroups.forEach(group => {
                // Agrupar equipos por su puntaje de desempate
                const scoreMap = new Map<number, string[]>();
                
                group.teams.forEach(team => {
                  const score = newScores[team.id] || 0;
                  if (!scoreMap.has(score)) {
                    scoreMap.set(score, []);
                  }
                  scoreMap.get(score)!.push(team.id);
                });
                
                // Si hay grupos con más de un equipo, hay empate
                scoreMap.forEach((teamIds) => {
                  if (teamIds.length > 1) {
                    // Determinar la posición en disputa usando el puntaje total
                    const avgTotalScore = teamIds.reduce((sum, id) => {
                      const teamData = totalScores.find(t => t.teamId === id);
                      return sum + (teamData?.totalScore || 0);
                    }, 0) / teamIds.length;
                    
                    // Encontrar qué posición del podio corresponde
                    const sortedByTotal = [...totalScores];
                    const firstTeamInGroup = sortedByTotal.findIndex(t => teamIds.includes(t.teamId));
                    const positionInDispute = firstTeamInGroup + 1; // 1, 2, o 3
                    
                    // Solo agregar si la posición está en el podio (1°, 2° o 3°)
                    if (positionInDispute <= 3) {
                      finalTieBreakGroups.push({
                        teamIds,
                        positionInDispute,
                        rounds: [],
                        resolved: false
                      });
                    }
                  }
                });
              });
              
              // Si hay empates finales y tenemos preguntas de aproximación, mostrar explicación
              if (finalTieBreakGroups.length > 0 && approximationBank.length > 0) {
                console.log('Grupos de empate final detectados:', finalTieBreakGroups);
                console.log('Preguntas de aproximación disponibles:', approximationBank.length);
                
                // Inicializar el desempate final
                const initialFinalTieBreak: FinalTieBreakResult = {
                  groups: finalTieBreakGroups,
                  currentGroupIndex: 0,
                  allResolved: false
                };
                
                const contestWithFinalTieBreak = {
                  ...finalContest,
                  finalTieBreakResult: initialFinalTieBreak
                };
                
                setCurrentContest(contestWithFinalTieBreak);
                handleSaveContest(contestWithFinalTieBreak);
                
                // Mostrar explicación del desempate por aproximación
                setView('approximation-tiebreak-explanation');
              } else {
                // No hay empates finales o no hay preguntas de aproximación, ir al podio
                if (finalTieBreakGroups.length > 0) {
                  console.warn('Hay empates sin resolver pero no hay preguntas de aproximación');
                  alert('Hay empates que no pudieron resolverse. No hay preguntas de aproximación disponibles.');
                }
                setView('podium');
              }
            } else {
              // Avanzar el índice para desbloquear la siguiente pregunta
              const nextIndex = tieBreakQuestionIndex + 1;
              setTieBreakQuestionIndex(nextIndex);
              
              // Volver al mapa de desempate
              setView('tiebreak-home');
            }
              }}
              onBackToHome={() => setView('tiebreak-home')}
            />
          );
        })()
      ) : view === 'approximation-question' && currentContest && currentApproximationQuestion && isFinalTieBreak ? (
        (() => {
          const totalGroups = currentContest.finalTieBreakResult!.groups.length;
          const unresolvedGroups = currentContest.finalTieBreakResult!.groups.filter(g => !g.resolved);
          
          // Crear un objeto Question temporal para usar QuestionDisplay (sin opciones)
          const approximationAsQuestion: Question = {
            id: currentApproximationQuestion.id,
            text: currentApproximationQuestion.text,
            options: {
              A: '',
              B: '',
              C: '',
              D: ''
            },
            correctAnswer: 'A',
            usedCount: currentApproximationQuestion.usedCount
          };
          
          return (
            <div className="game-wrapper">
              <div className="game-header">
                <button onClick={() => {
                  setIsFinalTieBreak(false);
                  setView('results');
                }} className="back-button">
                  🏠 Volver a Resultados
                </button>
                <h1>🎯 Desempate Final - Pregunta de Aproximación</h1>
              </div>
              <div className="game-content">
                <div className="left-panel">
                  <QuestionDisplay
                    question={approximationAsQuestion}
                    onRevealAnswer={() => setView('approximation-scoring')}
                    revealButtonText="Ingresar Respuestas"
                    testMode={currentContest.testMode || false}
                  />
                </div>
                <div className="right-panel">
                  <div className="approximation-info-panel">
                    <h3>📋 Grupos en Competencia</h3>
                    {unresolvedGroups.map((group, idx) => {
                      // Determinar qué equipos SIGUEN COMPITIENDO en este grupo
                      let activeTeamIds = group.teamIds;
                      if (group.rounds.length > 0) {
                        // Si ya hay rondas, solo mostrar los equipos que siguen empatados
                        const lastRound = group.rounds[group.rounds.length - 1];
                        const sortedAnswers = [...lastRound.answers].sort((a, b) => a.difference - b.difference);
                        const minDifference = sortedAnswers[0].difference;
                        activeTeamIds = sortedAnswers
                          .filter(a => a.difference === minDifference)
                          .map(a => a.teamId);
                      }
                      
                      return (
                        <div key={idx} className="group-info-card">
                          <h4>Disputa por {group.positionInDispute}° puesto</h4>
                          <div className="competing-teams">
                            {activeTeamIds.map(teamId => {
                              const team = currentContest.teams.find(t => t.id === teamId);
                              return team ? (
                                <span key={teamId} className="team-badge">{team.name}</span>
                              ) : null;
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          );
        })()
      ) : view === 'approximation-scoring' && currentContest && currentApproximationQuestion && isFinalTieBreak ? (
        <ApproximationScoringInput
          teams={currentContest.teams.filter(t => {
            // Incluir solo equipos que SIGUEN EMPATADOS en grupos no resueltos
            const unresolvedGroups = currentContest.finalTieBreakResult!.groups.filter(g => !g.resolved);
            
            return unresolvedGroups.some(group => {
              // Si el grupo no tiene rondas, incluir todos los equipos del grupo
              if (group.rounds.length === 0) {
                return group.teamIds.includes(t.id);
              }
              
              // Si tiene rondas, determinar qué equipos siguen empatados
              const lastRound = group.rounds[group.rounds.length - 1];
              const sortedAnswers = [...lastRound.answers].sort((a, b) => a.difference - b.difference);
              const minDifference = sortedAnswers[0].difference;
              const tiedTeamIds = sortedAnswers
                .filter(a => a.difference === minDifference)
                .map(a => a.teamId);
              
              return tiedTeamIds.includes(t.id);
            });
          })}
          onSubmit={(answers) => {
            console.log('🎯 Respuesta correcta:', currentApproximationQuestion.correctAnswer);
            console.log('📝 Respuestas ingresadas:', answers);
            
            // Calcular diferencias para todas las respuestas
            const allApproximationAnswers: ApproximationAnswer[] = Object.keys(answers).map(teamId => {
              const answer = answers[teamId];
              const difference = Math.abs(answer - currentApproximationQuestion.correctAnswer);
              console.log(`  Equipo ${teamId}: respuesta=${answer}, diferencia=${difference}`);
              return {
                teamId,
                answer,
                difference
              };
            });
            
            // Actualizar TODOS los grupos no resueltos con la misma pregunta
            const updatedGroups = currentContest.finalTieBreakResult!.groups.map(group => {
              if (group.resolved) {
                return group; // Grupo ya resuelto, no cambiar
              }
              
              // Determinar qué equipos de este grupo deben participar
              let activeTeamIds = group.teamIds;
              if (group.rounds.length > 0) {
                // Si ya hay rondas, solo incluir los equipos que siguen empatados
                const lastRound = group.rounds[group.rounds.length - 1];
                const sortedAnswers = [...lastRound.answers].sort((a, b) => a.difference - b.difference);
                const minDifference = sortedAnswers[0].difference;
                activeTeamIds = sortedAnswers
                  .filter(a => a.difference === minDifference)
                  .map(a => a.teamId);
              }
              
              // Filtrar respuestas solo de los equipos activos de este grupo
              const groupAnswers = allApproximationAnswers.filter(answer => 
                activeTeamIds.includes(answer.teamId)
              );
              
              // Crear ronda para este grupo
              const groupRound: ApproximationRound = {
                questionId: currentApproximationQuestion.id,
                answers: groupAnswers,
                resolved: false // Se determinará en la vista de resultados
              };
              
              return {
                ...group,
                rounds: [...group.rounds, groupRound]
              };
            });
            
            // Actualizar el contest con las rondas de todos los grupos
            const updatedContest = {
              ...currentContest,
              finalTieBreakResult: {
                ...currentContest.finalTieBreakResult!,
                groups: updatedGroups
              }
            };
            
            setCurrentContest(updatedContest);
            setView('approximation-results');
          }}
          onBack={() => setView('approximation-question')}
        />
      ) : view === 'approximation-results' && currentContest && currentApproximationQuestion && isFinalTieBreak ? (
        (() => {
          // Procesar TODOS los grupos para determinar si hay empates sin resolver
          const groupsStatus = currentContest.finalTieBreakResult!.groups.map(group => {
            if (group.resolved) {
              return { group, hasUnresolvedTies: false };
            }
            
            const lastRound = group.rounds[group.rounds.length - 1];
            
            // Ordenar respuestas por diferencia
            const sortedAnswers = [...lastRound.answers].sort((a, b) => a.difference - b.difference);
            
            // Agrupar por diferencia para detectar TODOS los empates
            const byDifference = new Map<number, string[]>();
            sortedAnswers.forEach(answer => {
              if (!byDifference.has(answer.difference)) {
                byDifference.set(answer.difference, []);
              }
              byDifference.get(answer.difference)!.push(answer.teamId);
            });
            
            // Hay empate sin resolver si:
            // 1. Todos tienen la misma diferencia Y son más de 1 (empate total)
            // 2. O hay UN ganador pero algunos perdedores están empatados entre sí
            let hasUnresolvedTies = false;
            
            const minDifference = sortedAnswers[0].difference;
            const winnersWithMinDiff = byDifference.get(minDifference)!;
            
            if (winnersWithMinDiff.length > 1) {
              // Todos los mejores están empatados
              hasUnresolvedTies = true;
            } else {
              // Un ganador claro, pero verificar si hay empates entre perdedores
              const losers = Array.from(byDifference.entries())
                .filter(([diff]) => diff > minDifference);
              
              // Verificar si algún grupo de perdedores tiene más de 1 equipo (empate)
              // Y si la posición está dentro del podio
              let currentPosition = group.positionInDispute + 1;
              for (const [, teamIds] of losers) {
                if (teamIds.length > 1 && currentPosition < 4) {
                  hasUnresolvedTies = true;
                  break;
                }
                currentPosition += teamIds.length;
              }
            }
            
            console.log(`🔍 [Vista Resultados] Grupo posición ${group.positionInDispute}:`);
            console.log(`   Diferencias:`, Array.from(byDifference.entries()).map(([d, ids]) => ({ diff: d, count: ids.length })));
            console.log(`   hasUnresolvedTies: ${hasUnresolvedTies}`);
            
            return { group, hasUnresolvedTies, lastRound };
          });
          
          // Combinar todas las respuestas de los grupos no resueltos para mostrar
          const allAnswers: ApproximationAnswer[] = [];
          groupsStatus.forEach(status => {
            if (!status.group.resolved && status.lastRound) {
              allAnswers.push(...status.lastRound.answers);
            }
          });
          
          // Verificar si ALGÚN grupo tiene empates sin resolver
          const anyUnresolvedTies = groupsStatus.some(s => !s.group.resolved && s.hasUnresolvedTies);
          
          return (
            <ApproximationResultsDisplay
              question={currentApproximationQuestion.text}
              correctAnswer={currentApproximationQuestion.correctAnswer}
              answers={allAnswers}
              teams={currentContest.teams}
              groups={currentContest.finalTieBreakResult!.groups}
              hasUnresolvedTies={anyUnresolvedTies}
          onContinue={() => {
            // IMPORTANTE: Procesar grupos para manejar resoluciones parciales y completas
            const updatedGroups: FinalTieBreakGroup[] = [];
            
            console.log('🔍 [onContinue] Procesando grupos:', currentContest.finalTieBreakResult!.groups);
            
            currentContest.finalTieBreakResult!.groups.forEach(group => {
              if (group.resolved) {
                console.log('✓ Grupo ya resuelto, no cambiar');
                updatedGroups.push(group); // Ya resuelto, no cambiar
                return;
              }
              
              const lastRound = group.rounds[group.rounds.length - 1];
              
              // Ordenar respuestas por diferencia (menor a mayor)
              const sortedAnswers = [...lastRound.answers].sort((a, b) => a.difference - b.difference);
              
              console.log('📊 Respuestas ordenadas:', sortedAnswers);
              
              // Obtener la diferencia mínima (los mejores, los que están más cerca)
              const minDifference = sortedAnswers[0].difference;
              
              // Equipos con diferencia mínima = GANADORES (están más cerca de la respuesta correcta)
              const winnersWithMinDiff = sortedAnswers
                .filter(a => a.difference === minDifference)
                .map(a => a.teamId);
              
              // Equipos con diferencia mayor = PERDEDORES (están más lejos)
              const losersWithHigherDiff = sortedAnswers
                .filter(a => a.difference > minDifference)
                .map(a => a.teamId);
              
              console.log(`Min diff: ${minDifference}, Winners (${winnersWithMinDiff.length}):`, winnersWithMinDiff);
              console.log(`Losers (${losersWithHigherDiff.length}):`, losersWithHigherDiff);
              
              // Si solo hay UN ganador con la diferencia mínima, el grupo está completamente resuelto
              if (winnersWithMinDiff.length === 1 && losersWithHigherDiff.length === 0) {
                console.log('✅ Grupo completamente resuelto - un solo ganador');
                const finalOrder = sortedAnswers.map(a => a.teamId);
                
                updatedGroups.push({
                  ...group,
                  resolved: true,
                  finalOrder
                });
              }
              // Si hay UN ganador pero también hay perdedores
              else if (winnersWithMinDiff.length === 1 && losersWithHigherDiff.length > 0) {
                console.log('✅ Un ganador claro, pero hay perdedores');
                
                // El ganador ocupa la posición en disputa, los perdedores compiten por la siguiente
                const winnerPosition = group.positionInDispute;
                const nextPosition = group.positionInDispute + 1;
                
                console.log(`  Ganador: ${winnersWithMinDiff[0]} -> posición ${winnerPosition}`);
                console.log(`  Procesando ${losersWithHigherDiff.length} perdedores desde posición ${nextPosition}...`);
                
                // Agrupar perdedores por su diferencia (equipos con misma diferencia están empatados)
                const losersByDifference = new Map<number, string[]>();
                sortedAnswers.forEach(answer => {
                  if (answer.difference > minDifference) {
                    if (!losersByDifference.has(answer.difference)) {
                      losersByDifference.set(answer.difference, []);
                    }
                    losersByDifference.get(answer.difference)!.push(answer.teamId);
                  }
                });
                
                console.log('📊 Mapa de perdedores por diferencia:', Array.from(losersByDifference.entries()));
                
                // Ordenar grupos de perdedores por diferencia (mejor a peor)
                const sortedLoserGroups = Array.from(losersByDifference.entries()).sort((a, b) => a[0] - b[0]);
                
                console.log('📊 Grupos ordenados:', sortedLoserGroups.map(([diff, ids]) => ({ diff, ids, count: ids.length })));
                
                // Verificar si hay empates entre perdedores que requieren desempate
                let hasUnresolvedLoserTies = false;
                let currentPosition = nextPosition;
                
                console.log(`🔍 Iniciando análisis desde posición ${nextPosition}:`);
                sortedLoserGroups.forEach(([difference, teamIds]) => {
                  console.log(`  🔍 Grupo diferencia=${difference}:`);
                  console.log(`     - Equipos: ${teamIds.join(', ')} (${teamIds.length} equipos)`);
                  console.log(`     - Posición actual: ${currentPosition}`);
                  console.log(`     - ¿Más de 1 equipo? ${teamIds.length > 1}`);
                  console.log(`     - ¿Posición < 4? ${currentPosition < 4}`);
                  
                  if (teamIds.length > 1 && currentPosition < 4) {
                    console.log(`    ✅ EMPATE DETECTADO: ${teamIds.length} equipos compitiendo por posición ${currentPosition}`);
                    hasUnresolvedLoserTies = true;
                  } else {
                    console.log(`    ❌ NO requiere desempate`);
                  }
                  currentPosition += teamIds.length;
                });
                
                console.log(`\n📋 RESULTADO FINAL: hasUnresolvedLoserTies = ${hasUnresolvedLoserTies}`);
                
                // SIEMPRE marcar el grupo con el ganador como resuelto (o parcialmente resuelto)
                // Construir la lista de winners que incluye ganadores previos
                const allWinners = [
                  ...(group.partialWinners || []),
                  ...winnersWithMinDiff
                ];
                
                // Si NO hay empates sin resolver entre perdedores, el grupo está completamente resuelto
                if (!hasUnresolvedLoserTies) {
                  console.log('  ✅ No hay empates entre perdedores -> grupo completamente resuelto');
                  const winnerOrder = [
                    ...allWinners,
                    ...losersWithHigherDiff
                  ];
                  
                  updatedGroups.push({
                    ...group,
                    resolved: true,
                    finalOrder: winnerOrder
                  });
                } else {
                  // Hay empates entre perdedores -> marcar este grupo como resuelto con ganadores parciales
                  console.log('  🔄 Hay empates entre perdedores -> grupo resuelto parcialmente, crear grupos para perdedores');
                  
                  // Marcar el grupo como resuelto con los ganadores (ya no participarán en más rondas)
                  updatedGroups.push({
                    ...group,
                    resolved: true,
                    finalOrder: winnersWithMinDiff, // Solo el ganador de ESTA ronda
                    partialWinners: allWinners // Mantener registro de ganadores previos para contexto
                  });
                  
                  // Crear grupos de desempate para perdedores empatados
                  currentPosition = nextPosition;
                  sortedLoserGroups.forEach(([difference, teamIds]) => {
                    console.log(`  Grupo con diferencia ${difference}: ${teamIds.length} equipos -> posición ${currentPosition}`);
                    
                    if (teamIds.length > 1 && currentPosition < 4) {
                      console.log(`  ➡️ Creando grupo de desempate para posición ${currentPosition}`);
                      updatedGroups.push({
                        teamIds,
                        positionInDispute: currentPosition,
                        rounds: [],
                        resolved: false,
                        partialWinners: allWinners // Heredar ganadores previos para contexto
                      });
                    } else if (teamIds.length === 1) {
                      console.log(`  ✅ Un solo equipo -> posición ${currentPosition} resuelta`);
                      // Crear grupo resuelto para este equipo único
                      updatedGroups.push({
                        teamIds,
                        positionInDispute: currentPosition,
                        rounds: [],
                        resolved: true,
                        finalOrder: teamIds, // Solo este equipo, sin incluir ganadores previos
                        partialWinners: allWinners
                      });
                    }
                    
                    currentPosition += teamIds.length;
                  });
                }
              }
              // Si hay MÚLTIPLES ganadores con la diferencia mínima pero también hay perdedores
              else if (winnersWithMinDiff.length > 1 && losersWithHigherDiff.length > 0) {
                console.log('🔄 RESOLUCIÓN PARCIAL: Múltiples ganadores empatados, perdedores separados');
                
                // Los ganadores empatan por las N posiciones desde positionInDispute
                // Los perdedores compiten por las posiciones siguientes
                const nextPosition = group.positionInDispute + winnersWithMinDiff.length;
                
                console.log(`  ${winnersWithMinDiff.length} ganadores empatan por posición ${group.positionInDispute}`);
                console.log(`  Procesando ${losersWithHigherDiff.length} perdedores desde posición ${nextPosition}...`);
                
                // Agrupar perdedores por su diferencia (equipos con misma diferencia están empatados)
                const losersByDifference = new Map<number, string[]>();
                sortedAnswers.forEach(answer => {
                  if (answer.difference > minDifference) {
                    if (!losersByDifference.has(answer.difference)) {
                      losersByDifference.set(answer.difference, []);
                    }
                    losersByDifference.get(answer.difference)!.push(answer.teamId);
                  }
                });
                
                // Ordenar grupos de perdedores por diferencia (mejor a peor)
                const sortedLoserGroups = Array.from(losersByDifference.entries()).sort((a, b) => a[0] - b[0]);
                
                // Crear/actualizar grupo de ganadores (siguen empatados entre ellos)
                updatedGroups.push({
                  ...group,
                  teamIds: winnersWithMinDiff,
                  resolved: false
                });
                
                let currentPosition = nextPosition;
                const allWinners = [...(group.partialWinners || []), ...winnersWithMinDiff];
                
                sortedLoserGroups.forEach(([difference, teamIds]) => {
                  console.log(`  Grupo con diferencia ${difference}: ${teamIds.length} equipos -> posición ${currentPosition}`);
                  
                  // Solo crear grupo de desempate si:
                  // 1. Hay más de 1 equipo con esta diferencia (empate)
                  // 2. La posición está dentro del podio (< 4)
                  if (teamIds.length > 1 && currentPosition < 4) {
                    console.log(`  ➡️ Creando grupo de desempate para posición ${currentPosition}`);
                    updatedGroups.push({
                      teamIds,
                      positionInDispute: currentPosition,
                      rounds: [],
                      resolved: false,
                      partialWinners: allWinners // Heredar ganadores previos
                    });
                  } else if (teamIds.length === 1) {
                    console.log(`  ✅ Un solo equipo -> posición ${currentPosition} resuelta`);
                    // Crear grupo resuelto para este equipo único
                    updatedGroups.push({
                      teamIds,
                      positionInDispute: currentPosition,
                      rounds: [],
                      resolved: true,
                      finalOrder: teamIds, // Solo este equipo, sin incluir ganadores previos
                      partialWinners: allWinners
                    });
                  } else {
                    console.log(`  ✅ Empate fuera del podio (posición >= 4) -> resuelto por orden`);
                  }
                  
                  currentPosition += teamIds.length;
                });
              }
              // Si TODOS tienen la misma diferencia mínima, el grupo sigue sin resolver
              else {
                console.log('⏭️ Todos siguen empatados, continuar');
                updatedGroups.push(group);
              }
            });
            
            console.log('✨ Grupos actualizados:', updatedGroups);
            
            // Actualizar el contest con los grupos actualizados
            const updatedContest = {
              ...currentContest,
              finalTieBreakResult: {
                ...currentContest.finalTieBreakResult!,
                groups: updatedGroups
              }
            };
            setCurrentContest(updatedContest);
            
            // Recopilar IDs de preguntas ya usadas en este certamen
            const usedInContestIds = new Set<string>();
            updatedContest.finalTieBreakResult!.groups.forEach(group => {
              group.rounds.forEach(round => {
                usedInContestIds.add(round.questionId);
              });
            });
            
            // Filtrar preguntas no usadas en este certamen
            const availableQuestions = approximationBank.filter(q => !usedInContestIds.has(q.id));
            
            // Seleccionar pregunta de aproximación menos usada de las disponibles
            const leastUsed = availableQuestions.length > 0
              ? availableQuestions.reduce((min, q) => q.usedCount < min.usedCount ? q : min)
              : approximationBank.reduce((min, q) => q.usedCount < min.usedCount ? q : min); // Fallback si todas están usadas
            
            console.log('🔍 [Selección Aproximación]', {
              usedInContest: Array.from(usedInContestIds),
              availableCount: availableQuestions.length,
              selected: leastUsed.id
            });
            
            setCurrentApproximationQuestion(leastUsed);
            
            // Incrementar contador de uso de la nueva pregunta
            const updatedApproximationBank = approximationBank.map(q => {
              if (q.id === leastUsed.id) {
                return { ...q, usedCount: (q.usedCount || 0) + 1 };
              }
              return q;
            });
            setApproximationBank(updatedApproximationBank);
            
            setView('approximation-question');
          }}
          onFinish={() => {
            // Procesar TODOS los grupos no resueltos
            const updatedGroups: FinalTieBreakGroup[] = [];
            
            currentContest.finalTieBreakResult!.groups.forEach(group => {
              if (group.resolved) {
                updatedGroups.push(group); // Ya resuelto, no cambiar
                return;
              }
              
              const lastRound = group.rounds[group.rounds.length - 1];
              
              // Ordenar respuestas por diferencia (menor a mayor)
              const sortedAnswers = [...lastRound.answers].sort((a, b) => a.difference - b.difference);
              
              // Obtener la diferencia mínima (los mejores)
              const minDifference = sortedAnswers[0].difference;
              
              // Equipos con diferencia mínima = GANADORES
              const winnersWithMinDiff = sortedAnswers
                .filter(a => a.difference === minDifference)
                .map(a => a.teamId);
              
              // Equipos con diferencia mayor = PERDEDORES
              const losersWithHigherDiff = sortedAnswers
                .filter(a => a.difference > minDifference)
                .map(a => a.teamId);
              
              // Si solo hay UN ganador y NO hay perdedores, grupo resuelto
              if (winnersWithMinDiff.length === 1 && losersWithHigherDiff.length === 0) {
                const finalOrder = sortedAnswers.map(a => a.teamId);
                
                updatedGroups.push({
                  ...group,
                  resolved: true,
                  finalOrder
                });
              }
              // Si hay UN ganador pero hay perdedores
              else if (winnersWithMinDiff.length === 1 && losersWithHigherDiff.length > 0) {
                // Crear grupo resuelto solo con los equipos de este grupo
                const winnerOrder = [
                  ...winnersWithMinDiff,
                  ...losersWithHigherDiff
                ];
                
                updatedGroups.push({
                  ...group,
                  teamIds: [...winnersWithMinDiff, ...losersWithHigherDiff],
                  resolved: true,
                  finalOrder: winnerOrder
                });
                
                // NO crear grupo adicional - perdedores quedan resueltos por orden
              }
              // Si hay MÚLTIPLES ganadores con diferencia mínima pero también hay perdedores
              else if (winnersWithMinDiff.length > 1 && losersWithHigherDiff.length > 0) {
                const nextPositionForLosers = group.positionInDispute + winnersWithMinDiff.length + (group.partialWinners?.length || 0);
                
                // Grupo de ganadores (siguen empatados)
                updatedGroups.push({
                  ...group,
                  teamIds: winnersWithMinDiff,
                  resolved: false
                });
                
                // Solo crear grupo de perdedores si posición < 4 y más de 2 equipos
                if (nextPositionForLosers < 4 && losersWithHigherDiff.length > 2) {
                  updatedGroups.push({
                    teamIds: losersWithHigherDiff,
                    positionInDispute: nextPositionForLosers,
                    rounds: [],
                    resolved: false
                  });
                }
              }
              // Si TODOS tienen la misma diferencia, continúan todos
              else {
                updatedGroups.push(group);
              }
            });
            
            // Verificar si TODOS los grupos están resueltos
            const allResolved = updatedGroups.every(g => g.resolved);
            
            if (allResolved) {
              // Todos los grupos resueltos, ir al podio
              const updatedContest = {
                ...currentContest,
                finalTieBreakResult: {
                  ...currentContest.finalTieBreakResult!,
                  groups: updatedGroups,
                  allResolved: true
                }
              };
              setCurrentContest(updatedContest);
              handleSaveContest(updatedContest);
              setIsFinalTieBreak(false);
              setCurrentApproximationQuestion(null);
              setView('podium');
            } else {
              // Aún hay grupos sin resolver, continuar con otra pregunta
              const updatedContest = {
                ...currentContest,
                finalTieBreakResult: {
                  ...currentContest.finalTieBreakResult!,
                  groups: updatedGroups
                }
              };
              setCurrentContest(updatedContest);
              handleSaveContest(updatedContest);
              
              // Seleccionar nueva pregunta
              const leastUsed = approximationBank.reduce((min, q) => 
                q.usedCount < min.usedCount ? q : min
              );
              setCurrentApproximationQuestion(leastUsed);
              
              // Incrementar contador de uso de la nueva pregunta
              const updatedApproximationBank = approximationBank.map(q => {
                if (q.id === leastUsed.id) {
                  return { ...q, usedCount: (q.usedCount || 0) + 1 };
                }
                return q;
              });
              setApproximationBank(updatedApproximationBank);
              
              setView('approximation-question');
            }
          }}
            />
          );
        })()
      ) : view === 'podium' && currentContest ? (
        <Podium
          teams={currentContest.teams}
          tieBreakResult={currentContest.tieBreakResults}
          finalTieBreakResult={currentContest.finalTieBreakResult}
          onBackToResults={() => setView('results')}
        />
      ) : null}

      {/* Modal de selección de pregunta de reemplazo */}
      {showReplacementModal && currentContest && (
        <div className="modal-overlay" onClick={() => setShowReplacementModal(false)}>
          <div className="modal-content replacement-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>🔄 Seleccionar Pregunta de Reemplazo</h2>
              <button onClick={() => setShowReplacementModal(false)} className="modal-close-btn">✕</button>
            </div>
            <p className="modal-subtitle">
              Selecciona una pregunta del banco que no esté en {isTieBreakMode ? 'el desempate' : 'el certamen actual'}
            </p>
            <div className="replacement-questions-list">
              {questionBank
                .filter(q => {
                  // Si estamos en desempate, filtrar por tieBreakQuestions
                  if (isTieBreakMode) {
                    return !currentContest.tieBreakQuestions.some(cq => cq.id === q.id);
                  }
                  // Si no, filtrar por questions del certamen regular
                  return !currentContest.questions.some(cq => cq.id === q.id);
                })
                .map(question => (
                  <div key={question.id} className="replacement-question-card">
                    <div className="replacement-question-text">{question.text}</div>
                    <div className="replacement-question-meta">
                      <span className="question-used-count">Usada {question.usedCount} {question.usedCount === 1 ? 'vez' : 'veces'}</span>
                      {question.mediaType && (
                        <span className="question-media-badge">
                          {question.mediaType === 'image' ? '🖼️' : question.mediaType === 'video' ? '🎥' : '🔊'}
                        </span>
                      )}
                    </div>
                    <button 
                      onClick={() => handleAddReplacementQuestion(question)}
                      className="btn-select-question"
                    >
                      Seleccionar ✓
                    </button>
                  </div>
                ))}
              {questionBank.filter(q => {
                if (isTieBreakMode) {
                  return !currentContest.tieBreakQuestions.some(cq => cq.id === q.id);
                }
                return !currentContest.questions.some(cq => cq.id === q.id);
              }).length === 0 && (
                <div className="empty-replacement-state">
                  <p>No hay preguntas disponibles para reemplazo.</p>
                  <p className="empty-hint">Todas las preguntas del banco ya están en {isTieBreakMode ? 'el desempate' : 'este certamen'}.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showFinishModal && (
        <div className="modal-overlay" onClick={() => setShowFinishModal(false)}>
          <div className="modal-content finish-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>🏁 Finalizar Certamen</h2>
              <button onClick={() => setShowFinishModal(false)} className="modal-close-btn">✕</button>
            </div>
            <div className="modal-body">
              <p className="warning-text">⚠️ ¿Estás seguro de que deseas finalizar el certamen?</p>
              <div className="consequences-list">
                <p><strong>Esto hará lo siguiente:</strong></p>
                <ul>
                  <li>✅ Calculará el podio con las preguntas completadas hasta ahora</li>
                  <li>🏆 Si hay empates en el podio, iniciará el desempate automáticamente</li>
                  <li>❌ Las preguntas no completadas quedarán sin responder</li>
                  <li>🚫 No podrás continuar con el certamen después de finalizarlo</li>
                </ul>
              </div>
              <p className="confirmation-note">
                <strong>Nota:</strong> Solo finaliza si estás seguro de que no jugarás más preguntas.
              </p>
            </div>
            <div className="modal-actions">
              <button onClick={() => setShowFinishModal(false)} className="btn-cancel">
                ← Cancelar
              </button>
              <button 
                onClick={() => {
                  setShowFinishModal(false);
                  handleFinishContest();
                }} 
                className="btn-confirm-finish"
              >
                ✔ Sí, Finalizar Certamen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
