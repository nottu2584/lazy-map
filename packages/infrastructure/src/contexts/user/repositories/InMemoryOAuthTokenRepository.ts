import { IOAuthTokenRepository, UserId, OAuthToken } from '@lazy-map/domain';

/**
 * In-memory implementation of OAuth token repository (for testing and development)
 */
export class InMemoryOAuthTokenRepository implements IOAuthTokenRepository {
  private tokens: Map<string, OAuthToken> = new Map();

  private getKey(userId: UserId, provider: 'google' | 'discord'): string {
    return `${userId.value}-${provider}`;
  }

  async save(token: OAuthToken): Promise<void> {
    const key = this.getKey(token.userId, token.provider);
    this.tokens.set(key, token);
  }

  async findByUserAndProvider(userId: UserId, provider: 'google' | 'discord'): Promise<OAuthToken | null> {
    const key = this.getKey(userId, provider);
    return this.tokens.get(key) || null;
  }

  async findByUser(userId: UserId): Promise<OAuthToken[]> {
    const userIdValue = userId.value;
    return Array.from(this.tokens.values()).filter(token => token.userId.value === userIdValue);
  }

  async deleteByUserAndProvider(userId: UserId, provider: 'google' | 'discord'): Promise<void> {
    const key = this.getKey(userId, provider);
    this.tokens.delete(key);
  }

  async deleteByUser(userId: UserId): Promise<void> {
    const userIdValue = userId.value;
    const keysToDelete: string[] = [];

    for (const [key, token] of this.tokens.entries()) {
      if (token.userId.value === userIdValue) {
        keysToDelete.push(key);
      }
    }

    for (const key of keysToDelete) {
      this.tokens.delete(key);
    }
  }

  async findExpired(): Promise<OAuthToken[]> {
    return Array.from(this.tokens.values()).filter(token => token.isExpired());
  }

  // Testing utilities
  clear(): void {
    this.tokens.clear();
  }

  getAllTokens(): OAuthToken[] {
    return Array.from(this.tokens.values());
  }
}
