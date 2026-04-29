import React from 'react';
import type { ApplyStep } from '@/types';

// ─── Types ────────────────────────────────────────────────────────────────────

interface StepProgressBarProps {
  currentStep: ApplyStep;
}

interface Step {
  number: ApplyStep;
  label: string;
  description: string;
}

// ─── Steps Config ─────────────────────────────────────────────────────────────

const STEPS: Step[] = [
  { number: 1, label: 'Personal Details',  description: 'Basic info & BRE check' },
  { number: 2, label: 'Salary Slip',       description: 'Upload your document'   },
  { number: 3, label: 'Loan Application',  description: 'Configure & apply'      },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function StepProgressBar({ currentStep }: StepProgressBarProps) {
  return (
    <nav aria-label="Application progress" className="w-full">
      <ol className="flex items-center w-full">
        {STEPS.map((step, index) => {
          const isCompleted = currentStep > step.number;
          const isCurrent   = currentStep === step.number;
          const isUpcoming  = currentStep < step.number;
          const isLast      = index === STEPS.length - 1;

          return (
            <li
              key={step.number}
              className={`flex items-center ${isLast ? 'flex-none' : 'flex-1'}`}
            >
              {/* Step indicator + label */}
              <div className="flex flex-col items-center gap-1.5 min-w-0">
                {/* Circle */}
                <div
                  aria-current={isCurrent ? 'step' : undefined}
                  className={[
                    'flex items-center justify-center w-9 h-9 rounded-full shrink-0',
                    'text-sm font-semibold transition-all duration-200',
                    'ring-2 ring-offset-2',
                    isCompleted
                      ? 'bg-blue-600 text-white ring-blue-600'
                      : isCurrent
                      ? 'bg-blue-600 text-white ring-blue-600'
                      : 'bg-white text-gray-400 ring-gray-200',
                  ].join(' ')}
                >
                  {isCompleted ? (
                    /* Checkmark */
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2.5}
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  ) : (
                    step.number
                  )}
                </div>

                {/* Labels — hidden on very small screens */}
                <div className="hidden sm:flex flex-col items-center text-center">
                  <span
                    className={[
                      'text-xs font-semibold whitespace-nowrap',
                      isCompleted || isCurrent
                        ? 'text-blue-600'
                        : 'text-gray-400',
                    ].join(' ')}
                  >
                    {step.label}
                  </span>
                  <span className="text-xs text-gray-400 whitespace-nowrap">
                    {step.description}
                  </span>
                </div>
              </div>

              {/* Connector line between steps */}
              {!isLast && (
                <div className="flex-1 mx-3 mt-[-18px] sm:mt-[-36px]">
                  <div
                    className={[
                      'h-0.5 w-full rounded-full transition-colors duration-300',
                      isCompleted ? 'bg-blue-600' : 'bg-gray-200',
                    ].join(' ')}
                  />
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}