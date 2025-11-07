import { IOAuthService, OAuthProfile } from '@lazy-map/application';
import { ILogger } from '@lazy-map/domain';

/**
 * Stub OAuth service for when OAuth is not configured
 * Returns errors for all operations
 */
export class StubOAuthService implements IOAuthService {
  constructor(private readonly logger?: ILogger) {
    this.logger?.info('OAuth not configured - using stub service', {
      component: 'StubOAuthService',
      operation: 'constructor'
    });
  }

  async authenticate(code: string): Promise<{ profile: OAuthProfile; token: string }> {
    throw new Error('OAuth is not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables.');
  }

  async getUserInfo(accessToken: string): Promise<OAuthProfile> {
    throw new Error('OAuth is not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables.');
  }

  async refreshToken(refreshToken: string): Promise<string> {
    throw new Error('OAuth is not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables.');
  }

  getAuthorizationUrl(state?: string): string {
    throw new Error('OAuth is not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables.');
  }

  async validateToken(token: string): Promise<boolean> {
    return false;
  }
}