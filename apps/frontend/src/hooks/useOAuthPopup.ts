import { useCallback } from 'react';
import { apiService, logger } from '@/services';
import type { AuthUser } from '@/types/auth';

interface OAuthSuccessData {
  type: 'oauth-success';
  provider: 'google' | 'discord';
  user: AuthUser;
}

interface OAuthErrorData {
  type: 'oauth-error';
  provider: 'google' | 'discord';
  error: string;
}

type OAuthMessageData = OAuthSuccessData | OAuthErrorData;

interface UseOAuthPopupOptions {
  onSuccess: (user: AuthUser) => void;
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
    async (provider: 'google' | 'discord') => {
      logger.info(`OAuth login initiated with ${provider}`, {
        component: 'useOAuthPopup',
        operation: 'openOAuthPopup',
      });

      let authorizationUrl: string;
      try {
        authorizationUrl = await apiService.getOAuthLoginUrl(provider);
      } catch (err) {
        onError?.(`Failed to start ${provider} login. Please try again.`);
        return;
      }

      const popup = window.open(authorizationUrl, `${provider}-oauth`);

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

          onSuccess(event.data.user);

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
