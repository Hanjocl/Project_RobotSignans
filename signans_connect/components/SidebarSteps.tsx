'use client';
import React from 'react';


export interface StepStatus {
  step: string;
  status: 'pending' | 'complete';
}

interface SidebarStepsProps {
  steps: StepStatus[]; // Use StepStatus interface for the steps prop
  selectedStep: string;
  onStepClick: (step: string) => void;
}

export default function SidebarSteps({ steps, selectedStep, onStepClick }: SidebarStepsProps) {
  return (
    <div className="w-1/4 bg-base-200 p-4 rounded">
      <h2 className="text-lg font-bold mb-4">Setup Steps</h2>
      <ul className="steps steps-vertical w-full">
        {steps.map(({ step, status }) => {
          const isActive = selectedStep === step;
          const isComplete = status === 'complete';

          return (
            <li
              key={step}
              onClick={() => onStepClick(step)}
              className={`step cursor-pointer transition-all
                ${isComplete ? 'step-success' : ''}
                ${isActive ? 'text-yellow-600 font-bold' : ''}`}
            >
              {step}
            </li>
          );
        })}
      </ul>
    </div>
  );
}