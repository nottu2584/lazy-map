import { useCallback } from 'react';
import { logger } from '../services';

interface OAuthSuccessData {
  type: 'oauth-success';
  provider: 'google' | 'discord';
  user: any;
  token: string;
}

interface UseOAuthPopupOptions {
  onSuccess: (user: any, token: string) => void;
}

export function useOAuthPopup({ onSuccess }: UseOAuthPopupOptions) {
  const openOAuthPopup = useCallback(
    (provider: 'google' | 'discord') => {
      logger.info(`OAuth login initiated with ${provider}`, {
        component: 'useOAuthPopup',
        operation: 'openOAuthPopup',
      });

      // Open OAuth in popup window
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3030/api';
      const oauthUrl = `${apiUrl}/auth/${provider}/login`;

      const popup = window.open(
        oauthUrl,
        `${provider}-oauth`,
        'width=600,height=700,scrollbars=yes'
      );

      // Listen for postMessage from OAuth popup
      const handleOAuthMessage = (event: MessageEvent<OAuthSuccessData>) => {
        // Verify origin
        const allowedOrigins = [
          'http://localhost:3030',
          import.meta.env.VITE_API_URL,
        ].filter(Boolean);

        if (!allowedOrigins.includes(event.origin)) {
          return;
        }

        // Check if it's an OAuth success message
        if (event.data?.type === 'oauth-success' && event.data.provider === provider) {
          logger.info('OAuth success message received', {
            component: 'useOAuthPopup',
            metadata: { provider },
          });

          // Login with received token and user data
          onSuccess(event.data.user, event.data.token);

          // Remove event listener
          window.removeEventListener('message', handleOAuthMessage);

          // Close popup if still open
          if (popup && !popup.closed) {
            popup.close();
          }
        }
      };

      window.addEventListener('message', handleOAuthMessage);

      // Cleanup listener if popup is closed manually
      const checkPopup = setInterval(() => {
        if (popup && popup.closed) {
          window.removeEventListener('message', handleOAuthMessage);
          clearInterval(checkPopup);
        }
      }, 500);
    },
    [onSuccess]
  );

  return { openOAuthPopup };
}
