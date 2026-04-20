import {
  RefreshToken,
  IRefreshTokenRepository,
  IUserRepository,
  ILogger,
} from '@lazy-map/domain';
import { IAuthenticationPort, IRefreshTokenPort } from '../ports';

/**
 * Command for refreshing an access token
 */
export class RefreshTokenCommand {
  constructor(
    public readonly rawRefreshToken: string,
    public readonly userAgent?: string,
    public readonly ipAddress?: string,
  ) {}
}

/**
 * Use case for token refresh with rotation and theft detection.
 * If a revoked token is reused, all user tokens are revoked (potential theft).
 */
export class RefreshTokenUseCase {
  constructor(
    private readonly refreshTokenRepository: IRefreshTokenRepository,
    private readonly userRepository: IUserRepository,
    private readonly refreshTokenService: IRefreshTokenPort,
    private readonly authenticationService: IAuthenticationPort,
    private readonly logger: ILogger,
  ) {}

  async execute(command: RefreshTokenCommand): Promise<RefreshTokenResult> {
    try {
      const tokenHash = this.refreshTokenService.hashToken(command.rawRefreshToken);
      const existingToken = await this.refreshTokenRepository.findByTokenHash(tokenHash);

      if (!existingToken) {
        return {
          success: false,
          errors: ['Invalid refresh token'],
          accessToken: null,
          refreshToken: null,
          user: null,
        };
      }

      // Theft detection: revoked token reuse → revoke all user tokens
      if (existingToken.isRevoked()) {
        this.logger.warn('Revoked refresh token reused — revoking all user tokens', {
          metadata: {
            userId: existingToken.userId.value,
            tokenId: existingToken.id,
          },
        });
        await this.refreshTokenRepository.revokeAllByUser(existingToken.userId);
        return {
          success: false,
          errors: ['Token has been revoked — all sessions invalidated'],
          accessToken: null,
          refreshToken: null,
          user: null,
        };
      }

      if (existingToken.isExpired()) {
        return {
          success: false,
          errors: ['Refresh token expired'],
          accessToken: null,
          refreshToken: null,
          user: null,
        };
      }

      // Load user
      const user = await this.userRepository.findById(existingToken.userId);
      if (!user) {
        return {
          success: false,
          errors: ['User not found'],
          accessToken: null,
          refreshToken: null,
          user: null,
        };
      }

      // Generate new refresh token (rotation)
      const newRefreshData = await this.refreshTokenService.generateRefreshToken();

      const newRefreshToken = RefreshToken.create(
        existingToken.userId,
        newRefreshData.tokenHash,
        newRefreshData.expiresAt,
        command.userAgent,
        command.ipAddress,
      );

      // Revoke old token, linking to new one
      const revokedToken = existingToken.revoke(new Date(), newRefreshToken.id);

      await this.refreshTokenRepository.save(revokedToken);
      await this.refreshTokenRepository.save(newRefreshToken);

      // Generate new access token
      const accessToken = await this.authenticationService.generateTokenFromUser(user);

      this.logger.info('Refresh token rotated successfully', {
        metadata: {
          userId: existingToken.userId.value,
          oldTokenId: existingToken.id,
          newTokenId: newRefreshToken.id,
        },
      });

      return {
        success: true,
        errors: [],
        accessToken,
        refreshToken: newRefreshData.token,
        user: {
          id: user.id.value,
          email: user.email.value,
          username: user.username.value,
        },
      };
    } catch (error) {
      this.logger.logError(error as Error, {
        metadata: { operation: 'RefreshToken' },
      });

      return {
        success: false,
        errors: [(error as Error).message || 'Token refresh failed'],
        accessToken: null,
        refreshToken: null,
        user: null,
      };
    }
  }
}

/**
 * Result of the refresh token operation
 */
export interface RefreshTokenResult {
  success: boolean;
  errors: string[];
  accessToken: string | null;
  refreshToken: string | null;
  user: { id: string; email: string; username: string } | null;
}
