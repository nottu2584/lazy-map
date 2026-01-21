import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { logger } from '../services/logger';

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
          logger.error('OAuth error', { component: 'OAuthCallback', error });
          alert(`Authentication failed: ${error}`);
          navigate('/');
          return;
        }

        if (!token) {
          logger.error('No token in OAuth callback', { component: 'OAuthCallback' });
          alert('Authentication failed: No token received');
          navigate('/');
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
            },
            token
          );
          logger.info('OAuth login successful', { component: 'OAuthCallback', email });
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
          logger.info('OAuth login successful', { component: 'OAuthCallback', email: userData.email });
        }

        // Redirect to home
        navigate('/');
      } catch (err) {
        logger.error('OAuth callback error', { component: 'OAuthCallback', error: err });
        alert('Authentication failed. Please try again.');
        navigate('/');
      }
    };

    handleCallback();
  }, [searchParams, navigate, login]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="text-4xl font-heading font-bold mb-4">Signing you in...</div>
        <p className="text-body-large text-muted-foreground">Please wait</p>
      </div>
    </div>
  );
}
