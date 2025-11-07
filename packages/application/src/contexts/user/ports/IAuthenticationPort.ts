/**
 * Port for JWT token operations
 */
export interface IAuthenticationPort {
  /**
   * Generate a JWT token for a user
   */
  generateToken(userId: string, email: string, username?: string, role?: string): Promise<string>;

  /**
   * Verify and decode a JWT token
   */
  verifyToken(token: string): Promise<{ userId: string; email: string } | null>;

  /**
   * Check if a token is expired
   */
  isTokenExpired(token: string): boolean;

  /**
   * Get token expiration time in seconds
   */
  getTokenTTL(): number;
}