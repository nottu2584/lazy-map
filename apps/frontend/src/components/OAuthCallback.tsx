import { useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts';

export interface OAuthState {
  oauthSuccess?: boolean;
  oauthError?: string;
  username?: string;
}

export function OAuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    const status = searchParams.get('status');
    let state: OAuthState;

    if (status === 'success') {
      const username = searchParams.get('username') || '';
      const avatarUrl = searchParams.get('avatarUrl') || undefined;
      login({
        id: searchParams.get('id') || '',
        email: searchParams.get('email') || '',
        username,
        avatarUrl,
      });
      state = { oauthSuccess: true, username };
    } else {
      state = { oauthError: searchParams.get('error') || 'Authentication failed' };
    }

    navigate('/', { replace: true, state });
  }, [searchParams, login, navigate]);

  return null;
}
