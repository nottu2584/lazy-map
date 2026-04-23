import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import type { OAuthState } from './OAuthCallback';

export function OAuthNotifier() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const state = location.state as OAuthState | null;
    if (!state) return;

    if (state.oauthSuccess) {
      toast.success(`Welcome, ${state.username || 'back'}`);
    } else if (state.oauthError) {
      toast.error('Sign-in failed', { description: state.oauthError });
    }

    // Clear state so toast doesn't re-fire on browser back/forward
    navigate(location.pathname, { replace: true, state: null });
  }, [location.state, location.pathname, navigate]);

  return null;
}
