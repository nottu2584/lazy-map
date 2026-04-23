import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Field, FieldLabel } from '@/components/ui/field';
import { DiscordIcon, GoogleIcon } from '@/components/ui/icons';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import {
  isPasswordValid,
  PasswordRequirements,
  validatePassword,
} from '@/components/ui/password-requirements';
import { Separator } from '@/components/ui/separator';
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts';
import { apiService, logger } from '@/services';

interface LoginModalProps {
  onClose: () => void;
}

export function LoginModal({ onClose }: LoginModalProps) {
  const { login } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    username: '',
    confirmPassword: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [confirmPasswordTouched, setConfirmPasswordTouched] = useState(false);

  const handleOAuthLogin = async (provider: 'google' | 'discord') => {
    try {
      const authorizationUrl = await apiService.getOAuthLoginUrl(provider);
      window.location.href = authorizationUrl;
    } catch (err) {
      setError(`Failed to start ${provider} login. Please try again.`);
    }
  };

  const passwordValidation = isSignUp
    ? validatePassword(
        formData.password,
        confirmPasswordTouched ? formData.confirmPassword : undefined,
      )
    : null;

  const isPasswordFormValid =
    !isSignUp ||
    (isPasswordValid(passwordValidation!) && formData.password === formData.confirmPassword);

  useEffect(() => {
    setConfirmPasswordTouched(false);
    setError(null);
    setFormData({
      email: '',
      password: '',
      username: '',
      confirmPassword: '',
    });
  }, [isSignUp]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (isSignUp) {
        if (formData.password !== formData.confirmPassword) {
          setError('Passwords do not match');
          setIsLoading(false);
          return;
        }
        const data = await apiService.register(
          formData.email,
          formData.password,
          formData.username,
        );
        login(data.user);
      } else {
        const data = await apiService.login(formData.email, formData.password);
        login(data.user);
      }
      onClose();
    } catch (err) {
      logger.error('Authentication error', {
        component: 'LoginModal',
        operation: 'handleSubmit',
        metadata: {
          error: err instanceof Error ? err.message : 'Unknown error',
          isSignUp,
        },
      });

      if (err instanceof TypeError && err.message.includes('Network')) {
        setError('Unable to connect. Please try again later.');
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Something went wrong. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="mb-6">
          <DialogTitle>{isSignUp ? 'Create Account' : 'Welcome Back'}</DialogTitle>
          <DialogDescription>
            {isSignUp ? 'Sign up to save your generated maps' : 'Sign in to access your saved maps'}
          </DialogDescription>
        </DialogHeader>

        {/* OAuth Buttons */}
        <div className="space-y-3">
          <Button variant="outline" onClick={() => handleOAuthLogin('google')} className="w-full">
            <GoogleIcon />
            Continue with Google
          </Button>

          <Button variant="outline" onClick={() => handleOAuthLogin('discord')} className="w-full">
            <DiscordIcon />
            Continue with Discord
          </Button>
        </div>

        <div className="relative my-6">
          <Separator />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="px-2 bg-background text-sm text-muted-foreground">
              OR CONTINUE WITH EMAIL
            </span>
          </div>
        </div>

        {/* Email Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <Field>
              <FieldLabel htmlFor="username">Username</FieldLabel>
              <Input
                id="username"
                type="text"
                required
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                placeholder="Choose a username"
              />
            </Field>
          )}

          <Field>
            <FieldLabel htmlFor="email">Email</FieldLabel>
            <Input
              id="email"
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="you@example.com"
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="password">Password</FieldLabel>
            <PasswordInput
              id="password"
              required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="••••••••"
            />
            {isSignUp && passwordValidation && (
              <PasswordRequirements
                password={formData.password}
                confirmPassword={formData.confirmPassword}
                showConfirmMatch={confirmPasswordTouched && formData.confirmPassword.length > 0}
              />
            )}
          </Field>

          {isSignUp && isPasswordValid(passwordValidation!) && (
            <Field>
              <FieldLabel htmlFor="confirmPassword">Confirm Password</FieldLabel>
              <PasswordInput
                id="confirmPassword"
                required
                value={formData.confirmPassword}
                onChange={(e) => {
                  setFormData({ ...formData, confirmPassword: e.target.value });
                  if (!confirmPasswordTouched) setConfirmPasswordTouched(true);
                }}
                onBlur={() => setConfirmPasswordTouched(true)}
                placeholder="••••••••"
              />
              {confirmPasswordTouched &&
                formData.confirmPassword &&
                formData.password !== formData.confirmPassword && (
                  <p className="text-sm text-destructive">Passwords do not match</p>
                )}
            </Field>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button type="submit" disabled={isLoading || !isPasswordFormValid} className="w-full">
            {isLoading ? 'Processing...' : isSignUp ? 'Create Account' : 'Sign In'}
          </Button>
        </form>

        <div className="text-center mt-4">
          <Button
            variant="link"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError(null);
              setFormData({ email: '', password: '', username: '', confirmPassword: '' });
            }}
          >
            {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
          </Button>
        </div>

        <p className="text-center text-sm text-muted-foreground mt-2">
          By continuing, you agree to our Terms of Service and Privacy Policy
        </p>
      </DialogContent>
    </Dialog>
  );
}
