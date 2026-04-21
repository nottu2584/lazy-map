import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts';
import { apiService, logger } from '@/services';

export function OAuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const error = searchParams.get('error');

        if (error) {
          logger.error('OAuth error', { component: 'OAuthCallback', metadata: { error } });
          navigate('/', { state: { authError: `Authentication failed: ${error}` } });
          return;
        }

        // Cookie is already set by the backend — fetch profile to get user data
        const profile = await apiService.getProfile();
        login({
          id: profile.id,
          email: profile.email,
          username: profile.username,
        });
        logger.info('OAuth login successful', { component: 'OAuthCallback', metadata: { email: profile.email } });

        navigate('/');
      } catch (err) {
        logger.error('OAuth callback error', { component: 'OAuthCallback', metadata: { error: err } });
        navigate('/', { state: { authError: 'Authentication failed. Please try again.' } });
      }
    };

    handleCallback();
  }, [searchParams, navigate, login]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="scroll-m-20 mb-4">
          Signing you in...
        </h1>
        <p className="text-lg text-muted-foreground">Please wait</p>
      </div>
    </div>
  );
}
