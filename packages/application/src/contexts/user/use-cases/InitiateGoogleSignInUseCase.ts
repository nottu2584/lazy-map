import { IGoogleOAuthPort } from '../ports';
import { ILogger } from '@lazy-map/domain';

/**
 * Command for initiating Google OAuth sign-in
 */
export class InitiateGoogleSignInCommand {
  constructor(
    public readonly redirectUri: string,
    public readonly state?: string
  ) {}
}

/**
 * Use case for initiating Google OAuth sign-in
 * Returns the authorization URL to redirect the user to
 */
export class InitiateGoogleSignInUseCase {
  constructor(
    private readonly googleOAuthService: IGoogleOAuthPort,
    private readonly logger: ILogger
  ) {}

  async execute(command: InitiateGoogleSignInCommand): Promise<InitiateGoogleSignInResult> {
    try {
      this.logger.info('Initiating Google OAuth sign-in', {
        metadata: {
          redirectUri: command.redirectUri,
          hasState: !!command.state
        }
      });

      // Generate the authorization URL
      const authorizationUrl = this.googleOAuthService.getAuthorizationUrl(
        command.redirectUri,
        command.state
      );

      this.logger.info('Generated Google authorization URL', {
        metadata: {
          redirectUri: command.redirectUri
        }
      });

      return {
        success: true,
        authorizationUrl,
        errors: []
      };
    } catch (error) {
      this.logger.logError(error as Error, {
        metadata: {
          operation: 'InitiateGoogleSignIn',
          redirectUri: command.redirectUri
        }
      });

      return {
        success: false,
        authorizationUrl: null,
        errors: [(error as Error).message || 'Failed to initiate Google sign-in']
      };
    }
  }
}

/**
 * Result of initiating Google OAuth sign-in
 */
export interface InitiateGoogleSignInResult {
  success: boolean;
  authorizationUrl: string | null;
  errors: string[];
}
