import { v4 as uuidv4 } from 'uuid';
import { UserId } from '../value-objects/UserId';

/**
 * Refresh token entity for session persistence and token rotation
 */
export class RefreshToken {
  private constructor(
    public readonly id: string,
    public readonly userId: UserId,
    public readonly tokenHash: string,
    public readonly expiresAt: Date,
    public readonly createdAt: Date,
    public readonly revokedAt: Date | null,
    public readonly replacedByTokenId: string | null,
    public readonly userAgent: string | null,
    public readonly ipAddress: string | null,
  ) {
    Object.freeze(this);
  }

  static create(
    userId: UserId,
    tokenHash: string,
    expiresAt: Date,
    userAgent?: string,
    ipAddress?: string,
  ): RefreshToken {
    return new RefreshToken(
      uuidv4(),
      userId,
      tokenHash,
      expiresAt,
      new Date(),
      null,
      null,
      userAgent ?? null,
      ipAddress ?? null,
    );
  }

  static reconstitute(
    id: string,
    userId: UserId,
    tokenHash: string,
    expiresAt: Date,
    createdAt: Date,
    revokedAt: Date | null,
    replacedByTokenId: string | null,
    userAgent: string | null,
    ipAddress: string | null,
  ): RefreshToken {
    return new RefreshToken(
      id,
      userId,
      tokenHash,
      expiresAt,
      createdAt,
      revokedAt,
      replacedByTokenId,
      userAgent,
      ipAddress,
    );
  }

  isExpired(): boolean {
    return new Date() >= this.expiresAt;
  }

  isRevoked(): boolean {
    return this.revokedAt !== null;
  }

  isValid(): boolean {
    return !this.isExpired() && !this.isRevoked();
  }

  revoke(revokedAt?: Date, replacedById?: string): RefreshToken {
    return new RefreshToken(
      this.id,
      this.userId,
      this.tokenHash,
      this.expiresAt,
      this.createdAt,
      revokedAt ?? new Date(),
      replacedById ?? this.replacedByTokenId,
      this.userAgent,
      this.ipAddress,
    );
  }
}
