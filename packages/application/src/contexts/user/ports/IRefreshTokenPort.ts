export interface IRefreshTokenPort {
  generateRefreshToken(): Promise<{
    token: string;
    tokenHash: string;
    expiresAt: Date;
  }>;

  hashToken(token: string): string;
}
