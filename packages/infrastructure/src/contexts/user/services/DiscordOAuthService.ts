import {
  IDiscordOAuthPort,
  DiscordUserInfo,
  OAuthTokens,
  OAuthUserInfo
} from '@lazy-map/application';
import { ILogger } from '@lazy-map/domain';

/**
 * Discord OAuth service implementation
 * Handles Discord OAuth token validation and OAuth flow
 */
export class DiscordOAuthService implements IDiscordOAuthPort {
  private readonly apiBase = 'https://discord.com/api/v10';
  private readonly authBase = 'https://discord.com/api/oauth2';

  constructor(
    private readonly clientId: string,
    private readonly clientSecret: string,
    private readonly redirectUri: string,
    private readonly logger: ILogger
  ) {}

  /**
   * Generate Discord OAuth authorization URL
   */
  getAuthorizationUrl(redirectUri: string, state?: string): string {
    // Use configured redirect URI, ignore user input
    const scopes = ['identify', 'email'];
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      response_type: 'code',
      scope: scopes.join(' '),
      ...(state && { state })
    });

    const authUrl = `${this.authBase}/authorize?${params.toString()}`;

    this.logger.debug('Generated Discord OAuth URL', {
      metadata: { redirectUri: this.redirectUri, hasState: !!state }
    });

    return authUrl;
  }

  /**
   * Exchange authorization code for tokens
   */
  async exchangeCodeForTokens(code: string, redirectUri: string): Promise<OAuthTokens> {
    // Use configured redirect URI, ignore user input
    try {
      const response = await fetch(`${this.authBase}/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          client_id: this.clientId,
          client_secret: this.clientSecret,
          grant_type: 'authorization_code',
          code,
          redirect_uri: this.redirectUri
        })
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Discord API error: ${response.statusText} - ${error}`);
      }

      const data = await response.json();

      this.logger.debug('Exchanged Discord authorization code for tokens', {
        metadata: {
          hasRefreshToken: !!data.refresh_token,
          expiresIn: data.expires_in
        }
      });

      return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresIn: data.expires_in,
        tokenType: data.token_type,
        scope: data.scope
      };
    } catch (error) {
      this.logger.logError(error as Error, {
        metadata: { operation: 'exchangeCodeForTokens' }
      });

      if (error instanceof Error) {
        throw new Error(`Failed to exchange Discord code for tokens: ${error.message}`);
      }
      throw new Error('Failed to exchange Discord code for tokens');
    }
  }

  /**
   * Get user information from Discord using access token
   */
  async getUserInfo(accessToken: string): Promise<OAuthUserInfo> {
    try {
      const response = await fetch(`${this.apiBase}/users/@me`, {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });

      if (!response.ok) {
        throw new Error(`Discord API error: ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.id || !data.email || !data.username) {
        throw new Error('Invalid Discord user data: missing required fields');
      }

      this.logger.debug('Retrieved Discord user info', {
        metadata: {
          email: data.email,
          id: data.id,
          username: data.username
        }
      });

      return {
        providerId: data.id,
        email: data.email,
        emailVerified: data.verified || false,
        username: data.username,
        displayName: data.global_name || data.username,
        picture: data.avatar
          ? `https://cdn.discordapp.com/avatars/${data.id}/${data.avatar}.png`
          : undefined,
        provider: 'discord'
      };
    } catch (error) {
      this.logger.logError(error as Error, {
        metadata: { operation: 'getUserInfo' }
      });

      if (error instanceof Error) {
        throw new Error(`Failed to get Discord user info: ${error.message}`);
      }
      throw new Error('Failed to get Discord user info');
    }
  }

  /**
   * Refresh Discord access token
   */
  async refreshAccessToken(refreshToken: string): Promise<OAuthTokens> {
    try {
      const response = await fetch(`${this.authBase}/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          client_id: this.clientId,
          client_secret: this.clientSecret,
          grant_type: 'refresh_token',
          refresh_token: refreshToken
        })
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Discord API error: ${response.statusText} - ${error}`);
      }

      const data = await response.json();

      this.logger.debug('Refreshed Discord access token', {
        metadata: {
          hasRefreshToken: !!data.refresh_token,
          expiresIn: data.expires_in
        }
      });

      return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresIn: data.expires_in,
        tokenType: data.token_type,
        scope: data.scope
      };
    } catch (error) {
      this.logger.logError(error as Error, {
        metadata: { operation: 'refreshAccessToken' }
      });

      if (error instanceof Error) {
        throw new Error(`Failed to refresh Discord token: ${error.message}`);
      }
      throw new Error('Failed to refresh Discord token');
    }
  }

  /**
   * Revoke Discord OAuth token
   */
  async revokeToken(token: string): Promise<void> {
    try {
      const response = await fetch(`${this.authBase}/token/revoke`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          client_id: this.clientId,
          client_secret: this.clientSecret,
          token
        })
      });

      if (!response.ok) {
        throw new Error(`Discord API error: ${response.statusText}`);
      }

      this.logger.debug('Revoked Discord token', {
        metadata: { operation: 'revokeToken' }
      });
    } catch (error) {
      this.logger.logError(error as Error, {
        metadata: { operation: 'revokeToken' }
      });

      if (error instanceof Error) {
        throw new Error(`Failed to revoke Discord token: ${error.message}`);
      }
      throw new Error('Failed to revoke Discord token');
    }
  }

  /**
   * Validates a Discord access token and returns user information
   * This is a helper method that uses getUserInfo
   * @deprecated Use getUserInfo directly instead
   */
  async validateDiscordToken(accessToken: string): Promise<DiscordUserInfo> {
    const userInfo = await this.getUserInfo(accessToken);

    // Fetch additional Discord-specific data
    try {
      const response = await fetch(`${this.apiBase}/users/@me`, {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        return {
          ...userInfo,
          provider: 'discord',
          discriminator: data.discriminator || '0',
          globalName: data.global_name,
          avatar: data.avatar
        };
      }
    } catch (error) {
      this.logger.warn('Failed to fetch Discord-specific user data', {
        metadata: { error }
      });
    }

    // Fallback to basic user info
    return {
      ...userInfo,
      provider: 'discord',
      discriminator: '0'
    };
  }
}

/**
 * Factory function to create DiscordOAuthService
 */
export function createDiscordOAuthService(
  clientId: string,
  clientSecret: string,
  redirectUri: string,
  logger: ILogger
): DiscordOAuthService {
  if (!clientId) {
    throw new Error('Discord Client ID is required');
  }

  if (!clientSecret) {
    throw new Error('Discord Client Secret is required');
  }

  if (!redirectUri) {
    throw new Error('Discord OAuth Redirect URI is required');
  }

  return new DiscordOAuthService(clientId, clientSecret, redirectUri, logger);
}
