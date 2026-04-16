import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiService, logger } from '../services';
import { Alert, AlertDescription } from './ui/alert';
import { Button } from './ui/button';
import { Field, FieldLabel } from './ui/field';
import { Input } from './ui/input';

export function LoginForm() {
  const { login } = useAuth();
  const [email, setEmail] = useState('demo@example.com');
  const [password, setPassword] = useState('demo');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const data = await apiService.login(email, password);
      login(data.user, data.accessToken);
    } catch (err) {
      logger.error('Login error', {
        component: 'LoginForm',
        operation: 'handleSubmit',
        metadata: { error: err instanceof Error ? err.message : 'Unknown error' },
      });
      setError(
        err instanceof Error ? err.message : 'Unable to sign in. Try demo@example.com / demo',
      );
    }

    setIsLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Field>
        <FieldLabel htmlFor="email">Email</FieldLabel>
        <Input
          type="email"
          id="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </Field>

      <Field>
        <FieldLabel htmlFor="password">Password</FieldLabel>
        <Input
          type="password"
          id="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </Field>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? 'Signing in...' : 'Sign In'}
      </Button>

      <p className="text-sm text-center">Demo credentials: demo@example.com / demo</p>
    </form>
  );
}
