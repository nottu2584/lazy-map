import {
  User,
  Email,
  Username,
  DiscordId,
  IUserRepository,
  IOAuthTokenRepository,
  OAuthToken,
  ILogger
} from '@lazy-map/domain';
import { IDiscordOAuthPort, IAuthenticationPort, ITokenEncryptionPort } from '../ports';

/**
 * Command for completing Discord OAuth sign-in
 */
export class CompleteDiscordSignInCommand {
  constructor(
    public readonly code: string,
    public readonly redirectUri: string,
    public readonly state?: string,
    public readonly timestamp: Date = new Date()
  ) {}
}

/**
 * Use case for completing Discord OAuth sign-in
 * Exchanges code for tokens, creates/updates user, stores OAuth tokens, generates JWT
 */
export class CompleteDiscordSignInUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly oauthTokenRepository: IOAuthTokenRepository,
    private readonly discordOAuthService: IDiscordOAuthPort,
    private readonly authenticationService: IAuthenticationPort,
    private readonly tokenEncryptionService: ITokenEncryptionPort,
    private readonly logger: ILogger
  ) {}

  async execute(command: CompleteDiscordSignInCommand): Promise<CompleteDiscordSignInResult> {
    try {
      this.logger.info('Completing Discord OAuth sign-in', {
        metadata: {
          redirectUri: command.redirectUri,
          hasState: !!command.state
        }
      });

      // 1. Exchange authorization code for tokens
      const oauthTokens = await this.discordOAuthService.exchangeCodeForTokens(
        command.code,
        command.redirectUri
      );

      this.logger.info('Exchanged Discord authorization code for tokens', {
        metadata: {
          hasRefreshToken: !!oauthTokens.refreshToken,
          expiresIn: oauthTokens.expiresIn
        }
      });

      // 2. Get user info from Discord
      const discordUserInfo = await this.discordOAuthService.getUserInfo(oauthTokens.accessToken);

      this.logger.info('Retrieved Discord user info', {
        metadata: {
          email: discordUserInfo.email,
          providerId: discordUserInfo.providerId
        }
      });

      // 3. Find or create user
      const discordId = DiscordId.create(discordUserInfo.providerId);
      let user = await this.userRepository.findByDiscordId(discordId);

      if (user) {
        // Existing Discord user
        this.logger.info('Existing Discord user found', {
          metadata: {
            userId: user.id.value,
            email: user.email.value
          }
        });
      } else {
        // Check if user exists by email
        const email = Email.fromString(discordUserInfo.email);
        user = await this.userRepository.findByEmail(email);

        if (user) {
          // User exists with same email but different auth provider
          if (user.authProvider === 'local') {
            // Auto-link Discord account
            this.logger.info('Linking Discord account to existing local user', {
              metadata: {
                userId: user.id.value,
                email: user.email.value
              }
            });

            user.linkDiscordAccount(discordUserInfo.providerId, command.timestamp, discordUserInfo.picture);
            await this.userRepository.save(user);
          } else {
            // User has different OAuth provider
            return {
              success: false,
              errors: [`Email ${discordUserInfo.email} is already registered with a different provider`],
              user: null,
              token: null
            };
          }
        } else {
          // Create new user
          const username = this.generateUsernameFromDiscord(discordUserInfo);

          // Make username unique
          let uniqueUsername = username;
          let counter = 1;
          while (await this.userRepository.usernameExists(Username.fromString(uniqueUsername.value))) {
            uniqueUsername = Username.fromString(`${username.value}${counter}`);
            counter++;
          }

          user = User.createFromDiscord(
            discordUserInfo.providerId,
            email,
            uniqueUsername,
            command.timestamp,
            discordUserInfo.picture
          );

          await this.userRepository.save(user);

          this.logger.info('Created new Discord user', {
            metadata: {
              userId: user.id.value,
              email: user.email.value,
              username: user.username.value
            }
          });
        }
      }

      // 4. Store OAuth tokens
      const expiresAt = new Date(Date.now() + oauthTokens.expiresIn * 1000);

      // Encrypt tokens before storage
      const encryptedAccessToken = await this.tokenEncryptionService.encrypt(oauthTokens.accessToken);
      const encryptedRefreshToken = oauthTokens.refreshToken
        ? await this.tokenEncryptionService.encrypt(oauthTokens.refreshToken)
        : null;

      const oauthToken = OAuthToken.create(
        user.id,
        'discord',
        encryptedAccessToken,
        encryptedRefreshToken,
        oauthTokens.tokenType,
        expiresAt,
        oauthTokens.scope
      );

      await this.oauthTokenRepository.save(oauthToken);

      this.logger.info('Stored Discord OAuth tokens', {
        metadata: {
          userId: user.id.value,
          hasRefreshToken: !!oauthTokens.refreshToken
        }
      });

      // 5. Record login
      user.recordLogin(command.timestamp);
      await this.userRepository.save(user);

      // 6. Generate JWT token for authentication
      const jwtToken = await this.authenticationService.generateTokenFromUser(user);

      return {
        success: true,
        errors: [],
        user,
        token: jwtToken
      };
    } catch (error) {
      this.logger.logError(error as Error, {
        metadata: {
          operation: 'CompleteDiscordSignIn',
          redirectUri: command.redirectUri
        }
      });

      return {
        success: false,
        errors: [(error as Error).message || 'Discord OAuth sign-in failed'],
        user: null,
        token: null
      };
    }
  }

  /**
   * Generate username from Discord user info
   */
  private generateUsernameFromDiscord(userInfo: { username?: string; email: string; displayName?: string }): Username {
    // Try to use display name or username
    const nameToUse = userInfo.displayName || userInfo.username;

    if (nameToUse) {
      const cleanName = nameToUse
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '');
      if (cleanName.length >= 3) {
        return Username.fromString(cleanName.substring(0, 20));
      }
    }

    // Fall back to email prefix
    const emailPrefix = userInfo.email.split('@')[0];
    const cleanPrefix = emailPrefix
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .substring(0, 20);

    return Username.fromString(cleanPrefix || 'user');
  }
}

/**
 * Result of completing Discord OAuth sign-in
 */
export interface CompleteDiscordSignInResult {
  success: boolean;
  errors: string[];
  user: User | null;
  token: string | null;
}
