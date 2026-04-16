import { useCallback } from 'react';
import { logger } from '@/services';
import type { AuthUser } from '@/types/auth';

interface OAuthSuccessData {
  type: 'oauth-success';
  provider: 'google' | 'discord';
  user: AuthUser;
  token: string;
}

interface OAuthErrorData {
  type: 'oauth-error';
  provider: 'google' | 'discord';
  error: string;
}

type OAuthMessageData = OAuthSuccessData | OAuthErrorData;

interface UseOAuthPopupOptions {
  onSuccess: (user: AuthUser, token: string) => void;
  onError?: (error: string) => void;
}

function getAllowedOrigins(): string[] {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3030/api';
  return [
    new URL(apiUrl).origin,
    window.location.origin,
  ].filter((origin, index, arr) => arr.indexOf(origin) === index);
}

export function useOAuthPopup({ onSuccess, onError }: UseOAuthPopupOptions) {
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

      // Timeout after 5 minutes
      const timeout = setTimeout(() => {
        logger.warn('OAuth popup timeout', {
          component: 'useOAuthPopup',
          metadata: { provider },
        });

        onError?.('Authentication timed out. Please try again.');
        window.removeEventListener('message', handleOAuthMessage);
        clearInterval(checkPopup);

        if (popup && !popup.closed) {
          popup.close();
        }
      }, 5 * 60 * 1000);

      // Listen for postMessage from OAuth popup
      const handleOAuthMessage = (event: MessageEvent<OAuthMessageData>) => {
        const allowedOrigins = getAllowedOrigins();

        if (!allowedOrigins.includes(event.origin)) {
          return;
        }

        if (event.data?.type === 'oauth-success' && event.data.provider === provider) {
          logger.info('OAuth success message received', {
            component: 'useOAuthPopup',
            metadata: { provider },
          });

          clearTimeout(timeout);
          clearInterval(checkPopup);
          window.removeEventListener('message', handleOAuthMessage);

          onSuccess(event.data.user, event.data.token);

          if (popup && !popup.closed) {
            popup.close();
          }
        }

        if (event.data?.type === 'oauth-error' && event.data.provider === provider) {
          logger.warn('OAuth error message received', {
            component: 'useOAuthPopup',
            metadata: { provider, error: event.data.error },
          });

          clearTimeout(timeout);
          clearInterval(checkPopup);
          window.removeEventListener('message', handleOAuthMessage);

          onError?.(event.data.error || 'Authentication failed. Please try again.');

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
          clearTimeout(timeout);
        }
      }, 500);
    },
    [onSuccess, onError]
  );

  return { openOAuthPopup };
}
