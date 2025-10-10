"use client";

import { useOnboarding } from '@/hooks/use-onboarding';
import { Progress } from '@/components/ui/progress';
import { CheckCircle } from 'lucide-react';

interface OnboardingProgressProps {
  className?: string;
}

const steps = [
  { key: 'signup', label: 'Sign Up', completed: true },
  { key: 'email_verification', label: 'Verify Email', completed: false },
  { key: 'profile_setup', label: 'Profile Setup', completed: false },
  { key: 'welcome', label: 'Welcome', completed: false },
  { key: 'tour', label: 'Tour', completed: false },
];

export function OnboardingProgress({ className = '' }: OnboardingProgressProps) {
  const { currentStep } = useOnboarding();

  const currentStepIndex = steps.findIndex(step => step.key === currentStep);
  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  return (
    <div className={`sticky top-0 z-50 bg-background border-b border-border ${className}`}>
      <div className="max-w-md mx-auto px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-muted-foreground">
            Step {currentStepIndex + 1} of {steps.length}
          </span>
          <span className="text-sm text-muted-foreground">
            {Math.round(progress)}% Complete
          </span>
        </div>
        
        <Progress value={progress} className="h-2 mb-3" />
        
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div
              key={step.key}
              className={`flex items-center gap-1 text-xs ${
                index <= currentStepIndex
                  ? 'text-primary font-medium'
                  : 'text-muted-foreground'
              }`}
            >
              {index < currentStepIndex ? (
                <CheckCircle className="w-3 h-3 text-green-600" />
              ) : (
                <div
                  className={`w-3 h-3 rounded-full border-2 ${
                    index === currentStepIndex
                      ? 'border-primary bg-primary'
                      : 'border-muted-foreground'
                  }`}
                />
              )}
              <span className="hidden sm:inline">{step.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
