import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { logger } from '../services';

export function OAuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get token and user from URL params
        const token = searchParams.get('token');
        const error = searchParams.get('error');

        if (error) {
          logger.error('OAuth error', { component: 'OAuthCallback', metadata: { error } });
          navigate('/', { state: { authError: `Authentication failed: ${error}` } });
          return;
        }

        if (!token) {
          logger.error('No token in OAuth callback', { component: 'OAuthCallback' });
          navigate('/', { state: { authError: 'Authentication failed: No token received' } });
          return;
        }

        // Get user data from URL or fetch from API
        const userId = searchParams.get('userId');
        const email = searchParams.get('email');
        const username = searchParams.get('username');

        if (userId && email && username) {
          // User data provided in URL
          login(
            {
              id: userId,
              email,
              username,
              role: 'user', // Default role for OAuth users
            },
            token
          );
          logger.info('OAuth login successful', { component: 'OAuthCallback', metadata: { email } });
        } else {
          // Fetch user data from API using token
          const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3030/api';
          const response = await fetch(`${apiUrl}/auth/profile`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          if (!response.ok) {
            throw new Error('Failed to fetch user profile');
          }

          const userData = await response.json();
          login(userData, token);
          logger.info('OAuth login successful', { component: 'OAuthCallback', metadata: { email: userData.email } });
        }

        // Redirect to home
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
