import { v4 as uuidv4 } from 'uuid';
import { UserId } from '../value-objects/UserId';

export class RefreshToken {
  private constructor(
    private readonly _id: string,
    private readonly _userId: UserId,
    private readonly _tokenHash: string,
    private readonly _expiresAt: Date,
    private readonly _createdAt: Date,
    private readonly _revokedAt: Date | null,
    private readonly _replacedByTokenId: string | null,
    private readonly _userAgent: string | null,
    private readonly _ipAddress: string | null,
  ) {
    Object.freeze(this);
  }

  get id(): string { return this._id; }
  get userId(): UserId { return this._userId; }
  get tokenHash(): string { return this._tokenHash; }
  get expiresAt(): Date { return this._expiresAt; }
  get createdAt(): Date { return this._createdAt; }
  get revokedAt(): Date | null { return this._revokedAt; }
  get replacedByTokenId(): string | null { return this._replacedByTokenId; }
  get userAgent(): string | null { return this._userAgent; }
  get ipAddress(): string | null { return this._ipAddress; }

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
    return new Date() >= this._expiresAt;
  }

  isRevoked(): boolean {
    return this._revokedAt !== null;
  }

  isValid(): boolean {
    return !this.isExpired() && !this.isRevoked();
  }

  revoke(revokedAt?: Date, replacedById?: string): RefreshToken {
    return new RefreshToken(
      this._id,
      this._userId,
      this._tokenHash,
      this._expiresAt,
      this._createdAt,
      revokedAt ?? new Date(),
      replacedById ?? this._replacedByTokenId,
      this._userAgent,
      this._ipAddress,
    );
  }
}
