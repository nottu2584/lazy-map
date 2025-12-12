import { UserId } from '../value-objects/UserId';
import { OAuthToken } from '../value-objects/OAuthToken';

/**
 * Repository interface for OAuth tokens
 */
export interface IOAuthTokenRepository {
  /**
   * Save or update an OAuth token
   */
  save(token: OAuthToken): Promise<void>;

  /**
   * Find OAuth token by user ID and provider
   */
  findByUserAndProvider(userId: UserId, provider: 'google' | 'discord'): Promise<OAuthToken | null>;

  /**
   * Find all OAuth tokens for a user
   */
  findByUser(userId: UserId): Promise<OAuthToken[]>;

  /**
   * Delete OAuth token by user ID and provider
   */
  deleteByUserAndProvider(userId: UserId, provider: 'google' | 'discord'): Promise<void>;

  /**
   * Delete all OAuth tokens for a user
   */
  deleteByUser(userId: UserId): Promise<void>;

  /**
   * Find all expired tokens
   * Useful for cleanup jobs
   */
  findExpired(): Promise<OAuthToken[]>;
}
