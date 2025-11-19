import {
  User,
  Email,
  Username,
  DiscordId,
  IUserRepository,
  IOAuthService,
  DiscordUserInfo
} from '@lazy-map/domain';
import { DiscordSignInCommand } from '../commands/DiscordSignInCommand';
import { ILogger } from '@lazy-map/domain';

/**
 * Use case for Discord Sign-In authentication
 * Handles both new user registration and existing user login via Discord OAuth
 */
export class DiscordSignInUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly oauthService: IOAuthService,
    private readonly logger: ILogger
  ) {}

  async execute(command: DiscordSignInCommand): Promise<DiscordSignInResult> {
    try {
      // 1. Validate the Discord access token
      const discordUserInfo = await this.oauthService.validateDiscordToken(command.accessToken);

      this.logger.info('Discord token validated successfully', {
        metadata: {
          email: discordUserInfo.email,
          discordId: discordUserInfo.discordId
        }
      });

      // 2. Check if user exists by Discord ID
      const discordId = DiscordId.create(discordUserInfo.discordId);
      let user = await this.userRepository.findByDiscordId(discordId);

      if (user) {
        // Existing Discord user - just log them in
        this.logger.info('Existing Discord user found', {
          metadata: {
            userId: user.id.value,
            email: user.email.value
          }
        });
      } else {
        // 3. Check if user exists by email
        const email = Email.fromString(discordUserInfo.email);
        user = await this.userRepository.findByEmail(email);

        if (user) {
          // User exists with same email but different auth provider
          if (user.authProvider === 'local') {
            // Allow linking Discord account to existing local account
            this.logger.info('Linking Discord account to existing user', {
              metadata: {
                userId: user.id.value,
                email: user.email.value
              }
            });

            const profilePicture = this.buildDiscordAvatarUrl(discordUserInfo);
            user.linkDiscordAccount(discordUserInfo.discordId, command.timestamp, profilePicture);
            await this.userRepository.save(user);
          } else {
            // User has a different OAuth provider
            return {
              success: false,
              errors: [`Email ${discordUserInfo.email} is already registered with a different provider`],
              user: null,
              token: null
            };
          }
        } else {
          // 4. Create new user from Discord account
          const username = this.generateUsernameFromDiscord(discordUserInfo);

          // Check if username exists and make it unique if necessary
          let uniqueUsername = username;
          let counter = 1;
          while (await this.userRepository.usernameExists(Username.fromString(uniqueUsername.value))) {
            uniqueUsername = Username.fromString(`${username.value}${counter}`);
            counter++;
          }

          const profilePicture = this.buildDiscordAvatarUrl(discordUserInfo);

          user = User.createFromDiscord(
            discordUserInfo.discordId,
            email,
            uniqueUsername,
            command.timestamp,
            profilePicture
          );

          await this.userRepository.save(user);

          this.logger.info('New Discord user created', {
            metadata: {
              userId: user.id.value,
              email: user.email.value,
              username: user.username.value
            }
          });
        }
      }

      // 5. Record login
      user.recordLogin(command.timestamp);
      await this.userRepository.save(user);

      // 6. Generate JWT token
      const token = this.oauthService.generateAuthToken(user);

      return {
        success: true,
        errors: [],
        user,
        token
      };
    } catch (error) {
      this.logger.logError(error as Error, {
        metadata: {
          accessTokenLength: command.accessToken?.length
        }
      });

      return {
        success: false,
        errors: [(error as Error).message || 'Discord sign-in failed'],
        user: null,
        token: null
      };
    }
  }

  /**
   * Generate a username from Discord user info
   */
  private generateUsernameFromDiscord(discordUserInfo: DiscordUserInfo): Username {
    // Try to use global name first, then username
    const nameToUse = discordUserInfo.globalName || discordUserInfo.username;

    const cleanName = nameToUse
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '');

    if (cleanName.length >= 3) {
      return Username.fromString(cleanName.substring(0, 20)); // Limit length
    }

    // Fall back to email prefix if username is too short
    const emailPrefix = discordUserInfo.email.split('@')[0];
    const cleanPrefix = emailPrefix
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .substring(0, 20); // Limit length

    return Username.fromString(cleanPrefix || 'user');
  }

  /**
   * Build Discord avatar URL from user info
   */
  private buildDiscordAvatarUrl(discordUserInfo: DiscordUserInfo): string | undefined {
    if (!discordUserInfo.avatar) {
      return undefined;
    }

    // Discord CDN avatar URL format
    return `https://cdn.discordapp.com/avatars/${discordUserInfo.discordId}/${discordUserInfo.avatar}.png`;
  }
}

/**
 * Result of Discord Sign-In operation
 */
export interface DiscordSignInResult {
  success: boolean;
  errors: string[];
  user: User | null;
  token: string | null;
}
