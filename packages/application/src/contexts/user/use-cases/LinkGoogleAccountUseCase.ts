import {
  UserId,
  IUserRepository,
  IOAuthService,
  GoogleId
} from '@lazy-map/domain';
import { ILogger } from '@lazy-map/domain';

/**
 * Command for linking a Google account to an existing user
 */
export class LinkGoogleAccountCommand {
  constructor(
    public readonly userId: string,
    public readonly idToken: string
  ) {}
}

/**
 * Use case for linking a Google account to an existing user
 */
export class LinkGoogleAccountUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly oauthService: IOAuthService,
    private readonly logger: ILogger
  ) {}

  async execute(command: LinkGoogleAccountCommand): Promise<LinkGoogleAccountResult> {
    try {
      // 1. Find the existing user
      const userId = UserId.fromString(command.userId);
      const user = await this.userRepository.findById(userId);

      if (!user) {
        return {
          success: false,
          errors: ['User not found']
        };
      }

      // 2. Check if user already has a Google account linked
      if (user.hasGoogleAccount()) {
        return {
          success: false,
          errors: ['User already has a Google account linked']
        };
      }

      // 3. Validate the Google ID token
      const googleUserInfo = await this.oauthService.validateGoogleToken(command.idToken);

      // 4. Check if this Google ID is already linked to another user
      const googleId = GoogleId.create(googleUserInfo.googleId);
      const existingGoogleUser = await this.userRepository.findByGoogleId(googleId);

      if (existingGoogleUser) {
        return {
          success: false,
          errors: ['This Google account is already linked to another user']
        };
      }

      // 5. Verify email matches (optional - you might want to allow different emails)
      if (user.email.value !== googleUserInfo.email) {
        this.logger.warn('Google email does not match user email', {
          metadata: {
            userId: user.id.value,
            userEmail: user.email.value,
            googleEmail: googleUserInfo.email
          }
        });
        // You could return an error here if you want to enforce email matching
        // return {
        //   success: false,
        //   errors: ['Google account email does not match your account email']
        // };
      }

      // 6. Link the Google account
      user.linkGoogleAccount(googleUserInfo.googleId, googleUserInfo.picture);
      await this.userRepository.save(user);

      this.logger.info('Google account linked successfully', {
        metadata: {
          userId: user.id.value,
          googleId: googleUserInfo.googleId
        }
      });

      return {
        success: true,
        errors: []
      };
    } catch (error) {
      this.logger.logError(error as Error, {
        metadata: {
          userId: command.userId
        }
      });

      return {
        success: false,
        errors: [(error as Error).message || 'Failed to link Google account']
      };
    }
  }
}

/**
 * Result of linking a Google account
 */
export interface LinkGoogleAccountResult {
  success: boolean;
  errors: string[];
}