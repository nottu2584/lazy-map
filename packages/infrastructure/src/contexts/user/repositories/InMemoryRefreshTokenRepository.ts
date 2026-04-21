import { IRefreshTokenRepository, RefreshToken, UserId } from '@lazy-map/domain';

/**
 * In-memory implementation of refresh token repository (for development)
 */
export class InMemoryRefreshTokenRepository implements IRefreshTokenRepository {
  private tokens: Map<string, RefreshToken> = new Map();

  async save(token: RefreshToken): Promise<void> {
    this.tokens.set(token.id, token);
  }

  async findByTokenHash(tokenHash: string): Promise<RefreshToken | null> {
    for (const token of this.tokens.values()) {
      if (token.tokenHash === tokenHash) {
        return token;
      }
    }
    return null;
  }

  async findActiveByUser(userId: UserId): Promise<RefreshToken[]> {
    return Array.from(this.tokens.values()).filter(
      (token) => token.userId.equals(userId) && token.isValid(),
    );
  }

  async revokeAllByUser(userId: UserId): Promise<void> {
    for (const [id, token] of this.tokens.entries()) {
      if (token.userId.equals(userId) && !token.isRevoked()) {
        this.tokens.set(id, token.revoke());
      }
    }
  }

  async deleteExpired(): Promise<void> {
    for (const [id, token] of this.tokens.entries()) {
      if (token.isExpired()) {
        this.tokens.delete(id);
      }
    }
  }
}
