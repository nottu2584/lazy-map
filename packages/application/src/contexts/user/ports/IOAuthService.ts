/**
 * OAuth profile information returned from OAuth providers
 */
export interface OAuthProfile {
  id: string;
  email: string;
  name?: string;
  picture?: string;
  provider: 'google' | 'discord';
}

/**
 * Port for OAuth authentication operations
 */
export interface IOAuthService {
  /**
   * Authenticate with OAuth provider using authorization code
   */
  authenticate(code: string): Promise<{ profile: OAuthProfile; token: string }>;

  /**
   * Get user information from OAuth provider
   */
  getUserInfo(accessToken: string): Promise<OAuthProfile>;

  /**
   * Refresh OAuth access token
   */
  refreshToken(refreshToken: string): Promise<string>;

  /**
   * Get OAuth authorization URL
   */
  getAuthorizationUrl(state?: string): string;

  /**
   * Validate OAuth token
   */
  validateToken(token: string): Promise<boolean>;
}