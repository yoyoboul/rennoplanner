'use client';

import * as React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Step {
  id: string;
  title: string;
  description?: string;
}

interface StepperProps {
  steps: Step[];
  currentStep: number;
  onStepClick?: (step: number) => void;
  className?: string;
}

export function Stepper({ steps, currentStep, onStepClick, className }: StepperProps) {
  return (
    <nav aria-label="Progress" className={className}>
      <ol className="flex items-center justify-between sm:justify-start">
        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;
          const isClickable = onStepClick && (isCompleted || isCurrent);

          return (
            <li key={step.id} className="relative flex-1 sm:flex-none">
              {/* Connector line (not on last item) */}
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    'absolute top-5 left-[calc(50%+1.5rem)] sm:left-[calc(100%+0.5rem)]',
                    'w-[calc(100%-3rem)] sm:w-24',
                    'h-0.5',
                    isCompleted || isCurrent ? 'bg-blue-600' : 'bg-gray-300'
                  )}
                  aria-hidden="true"
                />
              )}

              <button
                type="button"
                onClick={() => isClickable && onStepClick?.(index)}
                disabled={!isClickable}
                className={cn(
                  'group flex flex-col items-center relative',
                  isClickable && 'cursor-pointer',
                  !isClickable && 'cursor-default'
                )}
                aria-current={isCurrent ? 'step' : undefined}
              >
                {/* Circle */}
                <div
                  className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center',
                    'transition-all duration-200',
                    'border-2',
                    isCompleted && 'bg-blue-600 border-blue-600',
                    isCurrent && 'bg-white border-blue-600 ring-4 ring-blue-100',
                    !isCompleted && !isCurrent && 'bg-white border-gray-300',
                    isClickable && 'group-hover:border-blue-500'
                  )}
                >
                  {isCompleted ? (
                    <Check className="w-5 h-5 text-white" aria-hidden="true" />
                  ) : (
                    <span
                      className={cn(
                        'text-sm font-semibold',
                        isCurrent ? 'text-blue-600' : 'text-gray-500'
                      )}
                    >
                      {index + 1}
                    </span>
                  )}
                </div>

                {/* Label */}
                <div className="mt-2 text-center">
                  <span
                    className={cn(
                      'text-xs sm:text-sm font-medium block',
                      isCurrent && 'text-blue-600',
                      isCompleted && 'text-gray-900',
                      !isCompleted && !isCurrent && 'text-gray-500'
                    )}
                  >
                    {step.title}
                  </span>
                  {step.description && (
                    <span className="hidden sm:block text-xs text-gray-500 mt-0.5">
                      {step.description}
                    </span>
                  )}
                </div>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

interface StepperContentProps {
  children: React.ReactNode;
  className?: string;
}

export function StepperContent({ children, className }: StepperContentProps) {
  return (
    <div className={cn('mt-8', className)} role="region" aria-live="polite">
      {children}
    </div>
  );
}

