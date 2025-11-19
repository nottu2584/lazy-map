import * as jwt from 'jsonwebtoken';
import {
  IOAuthService,
  DiscordUserInfo,
  TokenPayload,
  GoogleUserInfo,
  User,
  ILogger
} from '@lazy-map/domain';

/**
 * Discord OAuth service implementation
 * Handles Discord OAuth token validation and JWT generation
 */
export class DiscordOAuthService implements IOAuthService {
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly jwtSecret: string;
  private readonly jwtExpiresIn: string;

  constructor(
    clientId: string,
    clientSecret: string,
    jwtSecret: string,
    private readonly logger: ILogger,
    jwtExpiresIn: string = '7d'
  ) {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.jwtSecret = jwtSecret;
    this.jwtExpiresIn = jwtExpiresIn;
  }

  /**
   * Validates a Google ID token (not implemented for Discord service)
   */
  async validateGoogleToken(idToken: string): Promise<GoogleUserInfo> {
    throw new Error('Google OAuth not supported by Discord OAuth service');
  }

  /**
   * Validates a Discord access token and returns user information
   */
  async validateDiscordToken(accessToken: string): Promise<DiscordUserInfo> {
    try {
      // Fetch user info from Discord API
      const response = await fetch('https://discord.com/api/users/@me', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Discord API error: ${response.statusText}`);
      }

      const data = await response.json();

      // Validate that we have required fields
      if (!data.id || !data.email || !data.username) {
        throw new Error('Invalid Discord user data: missing required fields');
      }

      this.logger.debug('Discord token validated successfully', {
        metadata: {
          email: data.email,
          id: data.id,
          username: data.username
        }
      });

      return {
        discordId: data.id,
        email: data.email,
        emailVerified: data.verified || false,
        username: data.username,
        discriminator: data.discriminator || '0',
        avatar: data.avatar,
        globalName: data.global_name
      };
    } catch (error) {
      this.logger.logError(error as Error, {
        metadata: {
          operation: 'validateDiscordToken'
        }
      });

      if (error instanceof Error) {
        throw new Error(`Discord token validation failed: ${error.message}`);
      }
      throw new Error('Discord token validation failed');
    }
  }

  /**
   * Generates a JWT token for the authenticated user
   */
  generateAuthToken(user: User): string {
    const payload = {
      userId: user.id.value,
      email: user.email.value,
      role: user.role.value,
      sub: user.id.value,
      iss: 'lazy-map'
    };

    const token = jwt.sign(payload, this.jwtSecret, {
      expiresIn: this.jwtExpiresIn
    } as jwt.SignOptions);

    this.logger.debug('JWT token generated', {
      metadata: {
        userId: user.id.value,
        email: user.email.value
      }
    });

    return token;
  }

  /**
   * Verifies and decodes a JWT token
   */
  async verifyAuthToken(token: string): Promise<TokenPayload> {
    try {
      const decoded = jwt.verify(token, this.jwtSecret) as TokenPayload;
      return decoded;
    } catch (error) {
      this.logger.logError(error as Error, {
        metadata: {
          operation: 'verifyAuthToken'
        }
      });

      if (error instanceof Error) {
        throw new Error(`Token verification failed: ${error.message}`);
      }
      throw new Error('Token verification failed');
    }
  }
}

/**
 * Factory function to create DiscordOAuthService
 */
export function createDiscordOAuthService(
  clientId: string,
  clientSecret: string,
  jwtSecret: string,
  logger: ILogger,
  jwtExpiresIn?: string
): DiscordOAuthService {
  if (!clientId) {
    throw new Error('Discord Client ID is required');
  }

  if (!clientSecret) {
    throw new Error('Discord Client Secret is required');
  }

  if (!jwtSecret) {
    throw new Error('JWT secret is required');
  }

  return new DiscordOAuthService(clientId, clientSecret, jwtSecret, logger, jwtExpiresIn);
}
