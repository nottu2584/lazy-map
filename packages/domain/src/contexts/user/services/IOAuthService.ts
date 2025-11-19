import { User } from '../entities/User';

/**
 * Domain service interface for OAuth authentication
 */
export interface IOAuthService {
  /**
   * Validates a Google ID token and returns user information
   */
  validateGoogleToken(idToken: string): Promise<GoogleUserInfo>;

  /**
   * Validates a Discord access token and returns user information
   */
  validateDiscordToken(accessToken: string): Promise<DiscordUserInfo>;

  /**
   * Generates a JWT token for the authenticated user
   */
  generateAuthToken(user: User): string;

  /**
   * Verifies and decodes a JWT token
   */
  verifyAuthToken(token: string): Promise<TokenPayload>;
}

/**
 * Google user information from validated ID token
 */
export interface GoogleUserInfo {
  googleId: string;
  email: string;
  emailVerified: boolean;
  name?: string;
  picture?: string;
  givenName?: string;
  familyName?: string;
}

/**
 * Discord user information from validated access token
 */
export interface DiscordUserInfo {
  discordId: string;
  email: string;
  emailVerified: boolean;
  username: string;
  discriminator: string;
  avatar?: string;
  globalName?: string;
}

/**
 * JWT token payload
 */
export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}