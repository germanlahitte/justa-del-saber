import React from 'react';
import './ContestWizard.css';

interface Props {
  currentStep: number; // 1, 2, 3, o 4
}

function WizardProgress({ currentStep }: Props) {
  const steps = [
    { number: 1, label: 'Nombre' },
    { number: 2, label: 'Equipos' },
    { number: 3, label: 'Preguntas' },
    { number: 4, label: 'Desempate' }
  ];

  return (
    <div className="wizard-step-indicator">
      {steps.map(step => (
        <div 
          key={step.number}
          className={`step ${currentStep === step.number ? 'active' : ''} ${currentStep > step.number ? 'completed' : ''}`}
        >
          {step.number}. {step.label}
        </div>
      ))}
    </div>
  );
}

export default WizardProgress;
