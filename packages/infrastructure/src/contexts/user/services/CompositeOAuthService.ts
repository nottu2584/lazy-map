import {
  IOAuthService,
  GoogleUserInfo,
  DiscordUserInfo,
  TokenPayload,
  User,
  ILogger
} from '@lazy-map/domain';
import { GoogleOAuthService } from './GoogleOAuthService';
import { DiscordOAuthService } from './DiscordOAuthService';

/**
 * Composite OAuth service that delegates to provider-specific services
 * Supports multiple OAuth providers (Google, Discord) through a single interface
 */
export class CompositeOAuthService implements IOAuthService {
  constructor(
    private readonly googleService: GoogleOAuthService | null,
    private readonly discordService: DiscordOAuthService | null,
    private readonly logger: ILogger
  ) {}

  async validateGoogleToken(idToken: string): Promise<GoogleUserInfo> {
    if (!this.googleService) {
      this.logger.warn('Google OAuth service not configured');
      throw new Error('Google OAuth is not configured');
    }
    return this.googleService.validateGoogleToken(idToken);
  }

  async validateDiscordToken(accessToken: string): Promise<DiscordUserInfo> {
    if (!this.discordService) {
      this.logger.warn('Discord OAuth service not configured');
      throw new Error('Discord OAuth is not configured');
    }
    return this.discordService.validateDiscordToken(accessToken);
  }

  generateAuthToken(user: User): string {
    // Use whichever service is available for JWT generation
    // Both services use the same JWT logic
    if (this.googleService) {
      return this.googleService.generateAuthToken(user);
    }
    if (this.discordService) {
      return this.discordService.generateAuthToken(user);
    }
    throw new Error('No OAuth service configured');
  }

  async verifyAuthToken(token: string): Promise<TokenPayload> {
    // Use whichever service is available for JWT verification
    // Both services use the same JWT logic
    if (this.googleService) {
      return this.googleService.verifyAuthToken(token);
    }
    if (this.discordService) {
      return this.discordService.verifyAuthToken(token);
    }
    throw new Error('No OAuth service configured');
  }
}
