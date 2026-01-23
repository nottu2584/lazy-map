import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface PasswordValidation {
  hasMinLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumber: boolean;
  hasSpecialChar: boolean;
  passwordsMatch?: boolean;
}

export function validatePassword(password: string, confirmPassword?: string): PasswordValidation {
  return {
    hasMinLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    passwordsMatch: confirmPassword !== undefined ? password === confirmPassword : undefined,
  };
}

export function isPasswordValid(validation: PasswordValidation): boolean {
  return (
    validation.hasMinLength &&
    validation.hasUppercase &&
    validation.hasLowercase &&
    validation.hasNumber &&
    validation.hasSpecialChar
  );
}

interface PasswordRequirementsProps {
  password: string;
  confirmPassword?: string;
  showConfirmMatch?: boolean;
}

export function PasswordRequirements({
  password,
  confirmPassword,
  showConfirmMatch = false,
}: PasswordRequirementsProps) {
  const validation = validatePassword(password, confirmPassword);
  const hasStartedTyping = password.length > 0;

  const RequirementItem = ({ met, label }: { met: boolean; label: string }) => (
    <div className="flex items-center gap-2 text-sm">
      {hasStartedTyping ? (
        met ? (
          <Check className="h-4 w-4 text-accent" />
        ) : (
          <X className="h-4 w-4 text-destructive" />
        )
      ) : (
        <div className="h-4 w-4 rounded-full border-2 border-muted-foreground" />
      )}
      <span
        className={cn(
          'text-xs',
          hasStartedTyping
            ? met
              ? 'text-foreground'
              : 'text-muted-foreground'
            : 'text-muted-foreground'
        )}
      >
        {label}
      </span>
    </div>
  );

  return (
    <div className="space-y-2 mt-3 p-3 rounded-md bg-muted/30 border border-border">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">
        Password Requirements:
      </p>
      <div className="space-y-1.5">
        <RequirementItem met={validation.hasMinLength} label="At least 8 characters" />
        <RequirementItem met={validation.hasUppercase} label="One uppercase letter (A-Z)" />
        <RequirementItem met={validation.hasLowercase} label="One lowercase letter (a-z)" />
        <RequirementItem met={validation.hasNumber} label="One number (0-9)" />
        <RequirementItem met={validation.hasSpecialChar} label="One special character (!@#$%...)" />
        {showConfirmMatch && validation.passwordsMatch !== undefined && (
          <RequirementItem met={validation.passwordsMatch} label="Passwords match" />
        )}
      </div>
    </div>
  );
}
