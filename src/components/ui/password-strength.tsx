"use client";

import { useState, useEffect } from 'react';
import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PasswordStrengthProps {
  password: string;
  className?: string;
}

interface StrengthRule {
  label: string;
  test: (password: string) => boolean;
}

const strengthRules: StrengthRule[] = [
  {
    label: "At least 6 characters",
    test: (password) => password.length >= 6
  },
  {
    label: "Contains a number",
    test: (password) => /\d/.test(password)
  },
  {
    label: "Contains uppercase letter",
    test: (password) => /[A-Z]/.test(password)
  },
  {
    label: "Contains lowercase letter",
    test: (password) => /[a-z]/.test(password)
  },
  {
    label: "Contains special character",
    test: (password) => /[!@#$%^&*(),.?":{}|<>]/.test(password)
  }
];

export function PasswordStrength({ password, className }: PasswordStrengthProps) {
  const [strength, setStrength] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (password.length > 0) {
      setIsVisible(true);
      const passedRules = strengthRules.filter(rule => rule.test(password));
      setStrength(passedRules.length);
    } else {
      setIsVisible(false);
      setStrength(0);
    }
  }, [password]);

  if (!isVisible) return null;

  const getStrengthColor = () => {
    if (strength <= 2) return 'text-red-500';
    if (strength <= 3) return 'text-yellow-500';
    if (strength <= 4) return 'text-blue-500';
    return 'text-green-500';
  };

  const getStrengthLabel = () => {
    if (strength <= 2) return 'Weak';
    if (strength <= 3) return 'Fair';
    if (strength <= 4) return 'Good';
    return 'Strong';
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Password strength:</span>
        <span className={cn("font-medium", getStrengthColor())}>
          {getStrengthLabel()}
        </span>
      </div>
      
      <div className="space-y-1">
        {strengthRules.map((rule, index) => {
          const isPassed = rule.test(password);
          return (
            <div key={index} className="flex items-center gap-2 text-xs">
              {isPassed ? (
                <Check className="w-3 h-3 text-green-500" />
              ) : (
                <X className="w-3 h-3 text-muted-foreground" />
              )}
              <span className={cn(
                isPassed ? "text-green-600" : "text-muted-foreground"
              )}>
                {rule.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
