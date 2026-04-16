import { UserId } from '../value-objects/UserId';
import { RefreshToken } from '../entities/RefreshToken';

/**
 * Repository interface for refresh tokens
 */
export interface IRefreshTokenRepository {
  /**
   * Save a refresh token
   */
  save(token: RefreshToken): Promise<void>;

  /**
   * Find a refresh token by its hash
   */
  findByTokenHash(tokenHash: string): Promise<RefreshToken | null>;

  /**
   * Find all active (non-revoked, non-expired) tokens for a user
   */
  findActiveByUser(userId: UserId): Promise<RefreshToken[]>;

  /**
   * Revoke all refresh tokens for a user
   */
  revokeAllByUser(userId: UserId): Promise<void>;

  /**
   * Delete expired tokens (cleanup)
   */
  deleteExpired(): Promise<void>;
}
