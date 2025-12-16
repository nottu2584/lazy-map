import { IDiscordOAuthPort } from '../ports';
import { ILogger } from '@lazy-map/domain';

/**
 * Command for initiating Discord OAuth sign-in
 */
export class InitiateDiscordSignInCommand {
  constructor(
    public readonly redirectUri: string,
    public readonly state?: string
  ) {}
}

/**
 * Use case for initiating Discord OAuth sign-in
 * Returns the authorization URL to redirect the user to
 */
export class InitiateDiscordSignInUseCase {
  constructor(
    private readonly discordOAuthService: IDiscordOAuthPort,
    private readonly logger: ILogger
  ) {}

  async execute(command: InitiateDiscordSignInCommand): Promise<InitiateDiscordSignInResult> {
    try {
      this.logger.info('Initiating Discord OAuth sign-in', {
        metadata: {
          redirectUri: command.redirectUri,
          hasState: !!command.state
        }
      });

      // Generate the authorization URL
      const authorizationUrl = this.discordOAuthService.getAuthorizationUrl(
        command.redirectUri,
        command.state
      );

      this.logger.info('Generated Discord authorization URL', {
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
          operation: 'InitiateDiscordSignIn',
          redirectUri: command.redirectUri
        }
      });

      return {
        success: false,
        authorizationUrl: null,
        errors: [(error as Error).message || 'Failed to initiate Discord sign-in']
      };
    }
  }
}

/**
 * Result of initiating Discord OAuth sign-in
 */
export interface InitiateDiscordSignInResult {
  success: boolean;
  authorizationUrl: string | null;
  errors: string[];
}
