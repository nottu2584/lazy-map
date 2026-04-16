/**
 * Port for refresh token generation and hashing
 */
export interface IRefreshTokenPort {
  /**
   * Generate a new refresh token with its hash and expiry
   */
  generateRefreshToken(userId: string): Promise<{
    token: string;
    tokenHash: string;
    expiresAt: Date;
  }>;

  /**
   * Hash a raw token for storage/lookup
   */
  hashToken(token: string): string;
}
