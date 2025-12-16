/**
 * Base port interface for OAuth operations
 * Defines the contract for OAuth provider implementations
 */
export interface IOAuthPort {
  /**
   * Generate OAuth authorization URL for user to authenticate
   * @param redirectUri - Callback URI after authentication
   * @param state - Optional state parameter for CSRF protection
   * @returns Authorization URL to redirect user to
   */
  getAuthorizationUrl(redirectUri: string, state?: string): string;

  /**
   * Exchange authorization code for access tokens
   * @param code - Authorization code from OAuth provider
   * @param redirectUri - Same redirect URI used in authorization
   * @returns OAuth tokens (access token, refresh token, expiry)
   */
  exchangeCodeForTokens(code: string, redirectUri: string): Promise<OAuthTokens>;

  /**
   * Get user information from OAuth provider using access token
   * @param accessToken - Valid OAuth access token
   * @returns User profile information from provider
   */
  getUserInfo(accessToken: string): Promise<OAuthUserInfo>;

  /**
   * Refresh expired access token using refresh token
   * @param refreshToken - Valid refresh token
   * @returns New OAuth tokens
   */
  refreshAccessToken(refreshToken: string): Promise<OAuthTokens>;

  /**
   * Revoke OAuth token (for logout/unlink)
   * @param token - Access token or refresh token to revoke
   */
  revokeToken(token: string): Promise<void>;
}

/**
 * OAuth tokens returned from token exchange
 */
export interface OAuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresIn: number; // Seconds until expiration
  tokenType: string; // Usually "Bearer"
  scope?: string;
}

/**
 * User information from OAuth provider
 * Provider-agnostic representation
 */
export interface OAuthUserInfo {
  providerId: string; // Unique ID from provider (Google ID, Discord ID)
  email: string;
  emailVerified: boolean;
  username?: string;
  displayName?: string;
  picture?: string;
  provider: 'google' | 'discord';
}
