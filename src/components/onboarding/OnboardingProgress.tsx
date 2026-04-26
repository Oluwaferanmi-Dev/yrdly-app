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
    <div 
      className={`sticky top-0 z-50 ${className}`}
      style={{ 
        background: "#1E2126", 
        borderBottom: "1px solid rgba(255,255,255,0.05)",
        fontFamily: "Work Sans, sans-serif"
      }}
    >
      <div className="max-w-md mx-auto px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium" style={{ color: "#a1a1aa" }}>
            Step {currentStepIndex + 1} of {steps.length}
          </span>
          <span className="text-sm" style={{ color: "#a1a1aa" }}>
            {Math.round(progress)}% Complete
          </span>
        </div>
        
        {/* Progress Bar Container */}
        <div className="h-2 w-full rounded-full mb-3" style={{ background: "rgba(255,255,255,0.1)" }}>
          <div 
            className="h-full rounded-full transition-all duration-300"
            style={{ width: `${progress}%`, background: "#388E3C" }}
          />
        </div>
        
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div
              key={step.key}
              className={`flex items-center gap-1 text-xs`}
              style={{
                color: index <= currentStepIndex ? "#388E3C" : "#666",
                fontWeight: index <= currentStepIndex ? "600" : "400"
              }}
            >
              {index < currentStepIndex ? (
                <CheckCircle className="w-3 h-3" style={{ color: "#388E3C" }} />
              ) : (
                <div
                  className="w-3 h-3 rounded-full border-2"
                  style={{
                    borderColor: index === currentStepIndex ? "#388E3C" : "#555",
                    background: index === currentStepIndex ? "#388E3C" : "transparent"
                  }}
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
