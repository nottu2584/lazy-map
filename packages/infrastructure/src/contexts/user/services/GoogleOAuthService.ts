import { OAuth2Client } from 'google-auth-library';
import * as jwt from 'jsonwebtoken';
import {
  IOAuthService,
  GoogleUserInfo,
  TokenPayload,
  User,
  ILogger
} from '@lazy-map/domain';

/**
 * Google OAuth service implementation
 * Handles Google Sign-In token validation and JWT generation
 */
export class GoogleOAuthService implements IOAuthService {
  private readonly client: OAuth2Client;
  private readonly jwtSecret: string;
  private readonly jwtExpiresIn: string;

  constructor(
    private readonly clientId: string,
    jwtSecret: string,
    private readonly logger: ILogger,
    jwtExpiresIn: string = '7d'
  ) {
    this.client = new OAuth2Client(clientId);
    this.jwtSecret = jwtSecret;
    this.jwtExpiresIn = jwtExpiresIn;
  }

  /**
   * Validates a Google ID token and returns user information
   */
  async validateGoogleToken(idToken: string): Promise<GoogleUserInfo> {
    try {
      const ticket = await this.client.verifyIdToken({
        idToken,
        audience: this.clientId
      });

      const payload = ticket.getPayload();

      if (!payload) {
        throw new Error('Invalid Google ID token: no payload');
      }

      // Ensure the token is for our client
      if (payload.aud !== this.clientId) {
        throw new Error('Invalid Google ID token: audience mismatch');
      }

      // Check token expiration
      const currentTime = Math.floor(Date.now() / 1000);
      if (payload.exp && payload.exp < currentTime) {
        throw new Error('Google ID token has expired');
      }

      this.logger.debug('Google token validated successfully', {
        metadata: {
          email: payload.email,
          sub: payload.sub
        }
      });

      return {
        googleId: payload.sub,
        email: payload.email || '',
        emailVerified: payload.email_verified || false,
        name: payload.name,
        picture: payload.picture,
        givenName: payload.given_name,
        familyName: payload.family_name
      };
    } catch (error) {
      this.logger.logError(error as Error, {
        metadata: {
          operation: 'validateGoogleToken'
        }
      });

      if (error instanceof Error) {
        throw new Error(`Google token validation failed: ${error.message}`);
      }
      throw new Error('Google token validation failed');
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
 * Factory function to create GoogleOAuthService
 */
export function createGoogleOAuthService(
  clientId: string,
  jwtSecret: string,
  logger: ILogger,
  jwtExpiresIn?: string
): GoogleOAuthService {
  if (!clientId) {
    throw new Error('Google Client ID is required');
  }

  if (!jwtSecret) {
    throw new Error('JWT secret is required');
  }

  return new GoogleOAuthService(clientId, jwtSecret, logger, jwtExpiresIn);
}