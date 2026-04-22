import { OAuth2Client } from 'google-auth-library';
import {
  IGoogleOAuthPort,
  OAuthTokens,
  OAuthUserInfo
} from '@lazy-map/application';
import { ILogger } from '@lazy-map/domain';

/**
 * Google OAuth service implementation
 * Handles Google Sign-In token validation and OAuth flow
 */
export class GoogleOAuthService implements IGoogleOAuthPort {
  private readonly client: OAuth2Client;

  constructor(
    private readonly clientId: string,
    private readonly clientSecret: string | null,
    private readonly redirectUri: string,
    private readonly logger: ILogger
  ) {
    this.client = new OAuth2Client(this.clientId, this.clientSecret || undefined);
  }

  /**
   * Generate Google OAuth authorization URL
   */
  getAuthorizationUrl(redirectUri: string, state?: string): string {
    // Use configured redirect URI, ignore user input
    const scopes = [
      'openid',
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile'
    ];

    const authUrl = this.client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      redirect_uri: this.redirectUri,
      state: state,
      prompt: 'consent' // Force consent to get refresh token
    });

    this.logger.debug('Generated Google OAuth URL', {
      metadata: { redirectUri: this.redirectUri, hasState: !!state }
    });

    return authUrl;
  }

  /**
   * Exchange authorization code for tokens
   */
  async exchangeCodeForTokens(code: string, _redirectUri: string): Promise<OAuthTokens> {
    // Use configured redirect URI, ignore user input
    try {
      const { tokens } = await this.client.getToken({
        code,
        redirect_uri: this.redirectUri
      });

      if (!tokens.access_token) {
        throw new Error('No access token received from Google');
      }

      this.logger.debug('Exchanged Google authorization code for tokens', {
        metadata: {
          hasRefreshToken: !!tokens.refresh_token,
          expiresIn: tokens.expiry_date
        }
      });

      return {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token || undefined,
        idToken: tokens.id_token || undefined,
        expiresIn: tokens.expiry_date
          ? Math.floor((tokens.expiry_date - Date.now()) / 1000)
          : 3600,
        tokenType: tokens.token_type || 'Bearer',
        scope: tokens.scope
      };
    } catch (error) {
      this.logger.logError(error as Error, {
        metadata: { operation: 'exchangeCodeForTokens' }
      });

      if (error instanceof Error) {
        throw new Error(`Failed to exchange Google code for tokens: ${error.message}`);
      }
      throw new Error('Failed to exchange Google code for tokens');
    }
  }

  /**
   * Get user information from Google using ID token
   * @param idToken - Google ID token (JWT)
   */
  async getUserInfo(idToken: string): Promise<OAuthUserInfo> {
    try {
      const ticket = await this.client.verifyIdToken({
        idToken: idToken,
        audience: this.clientId
      });

      const payload = ticket.getPayload();

      if (!payload) {
        throw new Error('Invalid Google access token: no payload');
      }

      this.logger.debug('Retrieved Google user info', {
        metadata: {
          email: payload.email,
          sub: payload.sub
        }
      });

      return {
        providerId: payload.sub,
        email: payload.email || '',
        emailVerified: payload.email_verified || false,
        username: payload.given_name,
        displayName: payload.name,
        picture: payload.picture,
        provider: 'google'
      };
    } catch (error) {
      this.logger.logError(error as Error, {
        metadata: { operation: 'getUserInfo' }
      });

      if (error instanceof Error) {
        throw new Error(`Failed to get Google user info: ${error.message}`);
      }
      throw new Error('Failed to get Google user info');
    }
  }

  /**
   * Refresh Google access token
   */
  async refreshAccessToken(refreshToken: string): Promise<OAuthTokens> {
    try {
      this.client.setCredentials({ refresh_token: refreshToken });

      const { credentials } = await this.client.refreshAccessToken();

      if (!credentials.access_token) {
        throw new Error('No access token received from Google refresh');
      }

      this.logger.debug('Refreshed Google access token', {
        metadata: {
          hasRefreshToken: !!credentials.refresh_token,
          expiresIn: credentials.expiry_date
        }
      });

      return {
        accessToken: credentials.access_token,
        refreshToken: credentials.refresh_token || undefined,
        expiresIn: credentials.expiry_date
          ? Math.floor((credentials.expiry_date - Date.now()) / 1000)
          : 3600,
        tokenType: credentials.token_type || 'Bearer',
        scope: credentials.scope
      };
    } catch (error) {
      this.logger.logError(error as Error, {
        metadata: { operation: 'refreshAccessToken' }
      });

      if (error instanceof Error) {
        throw new Error(`Failed to refresh Google token: ${error.message}`);
      }
      throw new Error('Failed to refresh Google token');
    }
  }

  /**
   * Revoke Google OAuth token
   */
  async revokeToken(token: string): Promise<void> {
    try {
      await this.client.revokeToken(token);

      this.logger.debug('Revoked Google token', {
        metadata: { operation: 'revokeToken' }
      });
    } catch (error) {
      this.logger.logError(error as Error, {
        metadata: { operation: 'revokeToken' }
      });

      if (error instanceof Error) {
        throw new Error(`Failed to revoke Google token: ${error.message}`);
      }
      throw new Error('Failed to revoke Google token');
    }
  }

}

/**
 * Factory function to create GoogleOAuthService
 */
export function createGoogleOAuthService(
  clientId: string,
  clientSecret: string | null,
  redirectUri: string,
  logger: ILogger
): GoogleOAuthService {
  if (!clientId) {
    throw new Error('Google Client ID is required');
  }

  if (!redirectUri) {
    throw new Error('Google OAuth Redirect URI is required');
  }

  return new GoogleOAuthService(clientId, clientSecret, redirectUri, logger);
}
