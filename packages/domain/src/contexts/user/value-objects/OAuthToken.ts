import { UserId } from './UserId';

/**
 * Value object representing OAuth tokens for a user
 * Stores access and refresh tokens with expiration
 */
export class OAuthToken {
  private constructor(
    private readonly _id: string,
    private readonly _userId: UserId,
    private readonly _provider: 'google' | 'discord',
    private readonly _accessToken: string,
    private readonly _refreshToken: string | null,
    private readonly _tokenType: string,
    private readonly _expiresAt: Date,
    private readonly _scope: string | null,
    private readonly _createdAt: Date,
    private readonly _updatedAt: Date
  ) {
    Object.freeze(this);
  }

  // Getters
  get id(): string { return this._id; }
  get userId(): UserId { return this._userId; }
  get provider(): 'google' | 'discord' { return this._provider; }
  get accessToken(): string { return this._accessToken; }
  get refreshToken(): string | null { return this._refreshToken; }
  get tokenType(): string { return this._tokenType; }
  get expiresAt(): Date { return this._expiresAt; }
  get scope(): string | null { return this._scope; }
  get createdAt(): Date { return this._createdAt; }
  get updatedAt(): Date { return this._updatedAt; }

  /**
   * Create a new OAuth token
   */
  static create(
    userId: UserId,
    provider: 'google' | 'discord',
    accessToken: string,
    refreshToken: string | null,
    tokenType: string,
    expiresAt: Date,
    scope: string | null = null
  ): OAuthToken {
    const now = new Date();
    const id = crypto.randomUUID();

    return new OAuthToken(
      id,
      userId,
      provider,
      accessToken,
      refreshToken,
      tokenType,
      expiresAt,
      scope,
      now,
      now
    );
  }

  /**
   * Reconstitute from persistence
   */
  static fromPersistence(
    id: string,
    userId: UserId,
    provider: 'google' | 'discord',
    accessToken: string,
    refreshToken: string | null,
    tokenType: string,
    expiresAt: Date,
    scope: string | null,
    createdAt: Date,
    updatedAt: Date
  ): OAuthToken {
    return new OAuthToken(
      id,
      userId,
      provider,
      accessToken,
      refreshToken,
      tokenType,
      expiresAt,
      scope,
      createdAt,
      updatedAt
    );
  }

  /**
   * Check if the access token is expired
   */
  isExpired(): boolean {
    return this._expiresAt < new Date();
  }

  /**
   * Check if the token expires soon (within 5 minutes)
   */
  expiresSoon(): boolean {
    const fiveMinutesFromNow = new Date(Date.now() + 5 * 60 * 1000);
    return this._expiresAt < fiveMinutesFromNow;
  }

  /**
   * Create a new token with updated access token (after refresh)
   */
  withRefreshedToken(
    accessToken: string,
    refreshToken: string | null,
    expiresAt: Date
  ): OAuthToken {
    return new OAuthToken(
      this._id,
      this._userId,
      this._provider,
      accessToken,
      refreshToken || this._refreshToken,
      this._tokenType,
      expiresAt,
      this._scope,
      this._createdAt,
      new Date()
    );
  }

  /**
   * Check if this token has a refresh token
   */
  hasRefreshToken(): boolean {
    return this._refreshToken !== null && this._refreshToken.length > 0;
  }
}
