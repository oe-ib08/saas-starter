"use client";

import { Check, X } from "lucide-react";

interface PasswordStrengthProps {
  password: string;
}

export interface PasswordRequirement {
  label: string;
  met: boolean;
}

export function checkPasswordStrength(password: string): {
  score: number;
  requirements: PasswordRequirement[];
} {
  const requirements: PasswordRequirement[] = [
    {
      label: "At least 8 characters",
      met: password.length >= 8,
    },
    {
      label: "Contains uppercase letter",
      met: /[A-Z]/.test(password),
    },
    {
      label: "Contains lowercase letter", 
      met: /[a-z]/.test(password),
    },
    {
      label: "Contains number",
      met: /\d/.test(password),
    },
    {
      label: "Contains special character",
      met: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    },
  ];

  const metCount = requirements.filter(req => req.met).length;
  const score = Math.round((metCount / requirements.length) * 100);

  return { score, requirements };
}

export function PasswordStrengthIndicator({ password }: PasswordStrengthProps) {
  const { score, requirements } = checkPasswordStrength(password);

  const getStrengthColor = (score: number) => {
    if (score < 40) return "bg-red-500";
    if (score < 70) return "bg-yellow-500";
    if (score < 90) return "bg-blue-500";
    return "bg-green-500";
  };

  const getStrengthLabel = (score: number) => {
    if (score < 40) return "Weak";
    if (score < 70) return "Fair";
    if (score < 90) return "Good";
    return "Strong";
  };

  if (!password) return null;

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Password strength:</span>
          <span className={`font-medium ${
            score < 40 ? "text-red-500" : 
            score < 70 ? "text-yellow-500" : 
            score < 90 ? "text-blue-500" : "text-green-500"
          }`}>
            {getStrengthLabel(score)}
          </span>
        </div>
        <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className={`h-full transition-all duration-300 ${getStrengthColor(score)}`}
            style={{ width: `${score}%` }}
          />
        </div>
      </div>
      
      <div className="space-y-1">
        <p className="text-sm font-medium text-muted-foreground">Requirements:</p>
        <div className="space-y-1">
          {requirements.map((requirement, index) => (
            <div
              key={index}
              className={`flex items-center gap-2 text-xs ${
                requirement.met ? "text-green-600" : "text-muted-foreground"
              }`}
            >
              {requirement.met ? (
                <Check className="h-3 w-3" />
              ) : (
                <X className="h-3 w-3" />
              )}
              <span>{requirement.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}