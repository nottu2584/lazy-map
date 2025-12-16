import {
  User,
  Email,
  Username,
  GoogleId,
  IUserRepository,
  IOAuthTokenRepository,
  OAuthToken,
  ILogger
} from '@lazy-map/domain';
import { IGoogleOAuthPort, IAuthenticationPort, ITokenEncryptionPort } from '../ports';

/**
 * Command for completing Google OAuth sign-in
 */
export class CompleteGoogleSignInCommand {
  constructor(
    public readonly code: string,
    public readonly redirectUri: string,
    public readonly state?: string,
    public readonly timestamp: Date = new Date()
  ) {}
}

/**
 * Use case for completing Google OAuth sign-in
 * Exchanges code for tokens, creates/updates user, stores OAuth tokens, generates JWT
 */
export class CompleteGoogleSignInUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly oauthTokenRepository: IOAuthTokenRepository,
    private readonly googleOAuthService: IGoogleOAuthPort,
    private readonly authenticationService: IAuthenticationPort,
    private readonly tokenEncryptionService: ITokenEncryptionPort,
    private readonly logger: ILogger
  ) {}

  async execute(command: CompleteGoogleSignInCommand): Promise<CompleteGoogleSignInResult> {
    try {
      this.logger.info('Completing Google OAuth sign-in', {
        metadata: {
          redirectUri: command.redirectUri,
          hasState: !!command.state
        }
      });

      // 1. Exchange authorization code for tokens
      const oauthTokens = await this.googleOAuthService.exchangeCodeForTokens(
        command.code,
        command.redirectUri
      );

      this.logger.info('Exchanged Google authorization code for tokens', {
        metadata: {
          hasRefreshToken: !!oauthTokens.refreshToken,
          expiresIn: oauthTokens.expiresIn
        }
      });

      // 2. Get user info from Google
      const googleUserInfo = await this.googleOAuthService.getUserInfo(oauthTokens.accessToken);

      this.logger.info('Retrieved Google user info', {
        metadata: {
          email: googleUserInfo.email,
          providerId: googleUserInfo.providerId
        }
      });

      // 3. Find or create user
      const googleId = GoogleId.create(googleUserInfo.providerId);
      let user = await this.userRepository.findByGoogleId(googleId);

      if (user) {
        // Existing Google user
        this.logger.info('Existing Google user found', {
          metadata: {
            userId: user.id.value,
            email: user.email.value
          }
        });
      } else {
        // Check if user exists by email
        const email = Email.fromString(googleUserInfo.email);
        user = await this.userRepository.findByEmail(email);

        if (user) {
          // User exists with same email but different auth provider
          if (user.authProvider === 'local') {
            // Auto-link Google account
            this.logger.info('Linking Google account to existing local user', {
              metadata: {
                userId: user.id.value,
                email: user.email.value
              }
            });

            user.linkGoogleAccount(googleUserInfo.providerId, command.timestamp, googleUserInfo.picture);
            await this.userRepository.save(user);
          } else {
            // User has different OAuth provider
            return {
              success: false,
              errors: [`Email ${googleUserInfo.email} is already registered with a different provider`],
              user: null,
              token: null
            };
          }
        } else {
          // Create new user
          const username = this.generateUsernameFromGoogle(googleUserInfo);

          // Make username unique
          let uniqueUsername = username;
          let counter = 1;
          while (await this.userRepository.usernameExists(Username.fromString(uniqueUsername.value))) {
            uniqueUsername = Username.fromString(`${username.value}${counter}`);
            counter++;
          }

          user = User.createFromGoogle(
            googleUserInfo.providerId,
            email,
            uniqueUsername,
            command.timestamp,
            googleUserInfo.picture
          );

          await this.userRepository.save(user);

          this.logger.info('Created new Google user', {
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
        'google',
        encryptedAccessToken,
        encryptedRefreshToken,
        oauthTokens.tokenType,
        expiresAt,
        oauthTokens.scope
      );

      await this.oauthTokenRepository.save(oauthToken);

      this.logger.info('Stored Google OAuth tokens', {
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
          operation: 'CompleteGoogleSignIn',
          redirectUri: command.redirectUri
        }
      });

      return {
        success: false,
        errors: [(error as Error).message || 'Google OAuth sign-in failed'],
        user: null,
        token: null
      };
    }
  }

  /**
   * Generate username from Google user info
   */
  private generateUsernameFromGoogle(userInfo: { username?: string; email: string; displayName?: string }): Username {
    // Try to use display name first
    if (userInfo.displayName) {
      const cleanName = userInfo.displayName
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
 * Result of completing Google OAuth sign-in
 */
export interface CompleteGoogleSignInResult {
  success: boolean;
  errors: string[];
  user: User | null;
  token: string | null;
}
