import { randomBytes, createHash } from 'crypto';
import type { IRefreshTokenPort } from '@lazy-map/application';

const REFRESH_TOKEN_TTL_DAYS = 30;

/**
 * Service for generating and hashing refresh tokens
 */
export class RefreshTokenService implements IRefreshTokenPort {
  async generateRefreshToken(): Promise<{
    token: string;
    tokenHash: string;
    expiresAt: Date;
  }> {
    const token = randomBytes(48).toString('base64url');
    const tokenHash = this.hashToken(token);
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);

    return { token, tokenHash, expiresAt };
  }

  hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}
