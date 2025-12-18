import React, { useState, useEffect } from 'react';
import ContestNameStep from './ContestNameStep';
import ContestTeamsStep from './ContestTeamsStep';
import ContestQuestionsStep from './ContestQuestionsStep';
import ContestTieBreakStep from './ContestTieBreakStep';
import { TeamTemplate, Question, Team, Contest } from '../App';

interface Props {
  teamBank: TeamTemplate[];
  questionBank: Question[];
  onStartContest: (contest: Contest) => void;
  onBackToHome: () => void;
}

type WizardStep = 'name' | 'teams' | 'questions' | 'tiebreak';

function ContestWizard({ teamBank, questionBank, onStartContest, onBackToHome }: Props) {
  const [currentStep, setCurrentStep] = useState<WizardStep>('name');
  const [contestName, setContestName] = useState('');
  const [testMode, setTestMode] = useState(false);
  const [selectedTeams, setSelectedTeams] = useState<TeamTemplate[]>([]);
  const [selectedQuestions, setSelectedQuestions] = useState<Question[]>([]);
  const [selectedTieBreakQuestions, setSelectedTieBreakQuestions] = useState<Question[]>([]);

  const handleNameNext = (name: string, isTestMode: boolean) => {
    setContestName(name);
    setTestMode(isTestMode);
    setCurrentStep('teams');
  };

  const handleTeamsNext = (teams: TeamTemplate[]) => {
    setSelectedTeams(teams);
    setCurrentStep('questions');
  };

  const handleQuestionsNext = (questions: Question[]) => {
    setSelectedQuestions(questions);
    setCurrentStep('tiebreak');
  };

  const handleTieBreakFinish = (tieBreakQuestions: Question[]) => {
    setSelectedTieBreakQuestions(tieBreakQuestions);
    
    // Crear el certamen
    const teams: Team[] = selectedTeams.map(t => ({
      ...t,
      score: 0
    }));

    const contest: Contest = {
      id: Date.now().toString(),
      name: contestName,
      teams: teams,
      questions: selectedQuestions,
      tieBreakQuestions: tieBreakQuestions,
      results: selectedQuestions.map(q => ({
        questionId: q.id,
        correctTeamIds: [],
        completed: false,
        answerRevealed: false
      })),
      testMode: testMode,
      originalQuestionCount: selectedQuestions.length
    };

    onStartContest(contest);
  };

  const handleBackToName = () => {
    setCurrentStep('name');
  };

  const handleBackToTeams = () => {
    setCurrentStep('teams');
  };

  const handleBackToQuestions = () => {
    setCurrentStep('questions');
  };

  if (currentStep === 'name') {
    return (
      <ContestNameStep
        onNext={handleNameNext}
        onCancel={onBackToHome}
        initialName={contestName}
        initialTestMode={testMode}
      />
    );
  }

  if (currentStep === 'teams') {
    return (
      <ContestTeamsStep
        contestName={contestName}
        teamBank={teamBank}
        selectedTeams={selectedTeams}
        onNext={handleTeamsNext}
        onBack={handleBackToName}
        onCancel={onBackToHome}
      />
    );
  }

  if (currentStep === 'questions') {
    return (
      <ContestQuestionsStep
        contestName={contestName}
        selectedTeams={selectedTeams}
        questionBank={questionBank}
        selectedQuestions={selectedQuestions}
        onFinish={handleQuestionsNext}
        onBack={handleBackToTeams}
        onCancel={onBackToHome}
      />
    );
  }

  return (
    <ContestTieBreakStep
      contestName={contestName}
      selectedTeams={selectedTeams}
      selectedQuestions={selectedQuestions}
      questionBank={questionBank}
      selectedTieBreakQuestions={selectedTieBreakQuestions}
      onFinish={handleTieBreakFinish}
      onBack={handleBackToQuestions}
      onCancel={onBackToHome}
    />
  );
}

export default ContestWizard;
