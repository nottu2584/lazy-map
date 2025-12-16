import {
  UserId,
  IUserRepository,
  DiscordId,
  ILogger
} from '@lazy-map/domain';
import { IDiscordOAuthPort } from '../ports';

/**
 * Command for linking a Discord account to an existing user
 */
export class LinkDiscordAccountCommand {
  constructor(
    public readonly userId: string,
    public readonly accessToken: string,
    public readonly linkedAt: Date = new Date()
  ) {}
}

/**
 * Use case for linking a Discord account to an existing user
 */
export class LinkDiscordAccountUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly discordOAuthService: IDiscordOAuthPort,
    private readonly logger: ILogger
  ) {}

  async execute(command: LinkDiscordAccountCommand): Promise<LinkDiscordAccountResult> {
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

      // 2. Check if user already has a Discord account linked
      if (user.hasDiscordAccount()) {
        return {
          success: false,
          errors: ['User already has a Discord account linked']
        };
      }

      // 3. Validate the Discord access token
      const discordUserInfo = await this.discordOAuthService.validateDiscordToken(command.accessToken);

      // 4. Check if this Discord ID is already linked to another user
      const discordId = DiscordId.create(discordUserInfo.providerId);
      const existingDiscordUser = await this.userRepository.findByDiscordId(discordId);

      if (existingDiscordUser) {
        return {
          success: false,
          errors: ['This Discord account is already linked to another user']
        };
      }

      // 5. Verify email matches (optional - you might want to allow different emails)
      if (user.email.value !== discordUserInfo.email) {
        this.logger.warn('Discord email does not match user email', {
          metadata: {
            userId: user.id.value,
            userEmail: user.email.value,
            discordEmail: discordUserInfo.email
          }
        });
        // You could return an error here if you want to enforce email matching
        // return {
        //   success: false,
        //   errors: ['Discord account email does not match your account email']
        // };
      }

      // 6. Link the Discord account
      user.linkDiscordAccount(discordUserInfo.providerId, command.linkedAt, discordUserInfo.picture);
      await this.userRepository.save(user);

      this.logger.info('Discord account linked successfully', {
        metadata: {
          userId: user.id.value,
          discordId: discordUserInfo.providerId
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
        errors: [(error as Error).message || 'Failed to link Discord account']
      };
    }
  }
}

/**
 * Result of linking a Discord account
 */
export interface LinkDiscordAccountResult {
  success: boolean;
  errors: string[];
}
