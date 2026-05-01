import { Check } from 'lucide-react';
import type { ApplyStep } from '@/types';

interface StepProgressBarProps {
  currentStep: ApplyStep;
}

interface Step {
  number: ApplyStep;
  label: string;
}

const STEPS: Step[] = [
  { number: 1, label: 'Personal Details' },
  { number: 2, label: 'Salary Slip' },
  { number: 3, label: 'Loan Config' },
];

export default function StepProgressBar({ currentStep }: StepProgressBarProps) {
  return (
    <nav aria-label="Application progress" className="w-full">
      <ol className="flex w-full items-center justify-center gap-0 px-4 py-5">
        {STEPS.map((step, index) => {
          const isCompleted = currentStep > step.number;
          const isCurrent = currentStep === step.number;
          const isLast = index === STEPS.length - 1;

          return (
            <li key={step.number} className={`flex items-center ${isLast ? 'flex-none' : 'flex-1'}`}>
              <div className="relative z-10 flex flex-col items-center">
                <div
                  aria-current={isCurrent ? 'step' : undefined}
                  className={[
                    'flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold transition-all duration-300',
                    isCompleted
                      ? 'bg-brand-600 text-white shadow-glow-sm dark:bg-brand-500'
                      : isCurrent
                      ? 'bg-brand-600 text-white shadow-glow ring-4 ring-brand-100 dark:bg-brand-500 dark:ring-brand-950'
                      : 'border-2 border-slate-200 bg-white text-slate-400 dark:border-[#1e293b] dark:bg-[#111827] dark:text-slate-600',
                  ].join(' ')}
                >
                  {isCompleted ? <Check className="h-5 w-5 text-white" /> : step.number}
                </div>
                <span
                  className={[
                    'mt-2.5 hidden whitespace-nowrap text-center text-xs font-medium sm:block',
                    isCompleted || isCurrent
                      ? 'text-brand-600 dark:text-brand-400'
                      : 'text-slate-400 dark:text-slate-600',
                  ].join(' ')}
                >
                  {step.label}
                </span>
              </div>

              {!isLast && (
                <div className="relative z-0 mx-2 mt-[-24px] h-0.5 flex-1">
                  <div
                    className={[
                      'h-full w-full rounded-full transition-colors duration-500',
                      isCompleted ? 'bg-brand-600 dark:bg-brand-500' : 'bg-slate-200 dark:bg-[#1e293b]',
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
