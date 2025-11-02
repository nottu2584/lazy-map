import {
  User,
  Email,
  Username,
  GoogleId,
  IUserRepository,
  IOAuthService,
  GoogleUserInfo
} from '@lazy-map/domain';
import { GoogleSignInCommand } from '../commands/GoogleSignInCommand';
import { ILogger } from '@lazy-map/domain';

/**
 * Use case for Google Sign-In authentication
 * Handles both new user registration and existing user login via Google OAuth
 */
export class GoogleSignInUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly oauthService: IOAuthService,
    private readonly logger: ILogger
  ) {}

  async execute(command: GoogleSignInCommand): Promise<GoogleSignInResult> {
    try {
      // 1. Validate the Google ID token
      const googleUserInfo = await this.oauthService.validateGoogleToken(command.idToken);

      this.logger.info('Google token validated successfully', {
        metadata: {
          email: googleUserInfo.email,
          googleId: googleUserInfo.googleId
        }
      });

      // 2. Check if user exists by Google ID
      const googleId = GoogleId.create(googleUserInfo.googleId);
      let user = await this.userRepository.findByGoogleId(googleId);

      if (user) {
        // Existing Google user - just log them in
        this.logger.info('Existing Google user found', {
          metadata: {
            userId: user.id.value,
            email: user.email.value
          }
        });
      } else {
        // 3. Check if user exists by email
        const email = Email.fromString(googleUserInfo.email);
        user = await this.userRepository.findByEmail(email);

        if (user) {
          // User exists with same email but different auth provider
          if (user.authProvider === 'local') {
            // Allow linking Google account to existing local account
            this.logger.info('Linking Google account to existing user', {
              metadata: {
                userId: user.id.value,
                email: user.email.value
              }
            });

            user.linkGoogleAccount(googleUserInfo.googleId, command.timestamp, googleUserInfo.picture);
            await this.userRepository.save(user);
          } else {
            // User has a different OAuth provider
            return {
              success: false,
              errors: [`Email ${googleUserInfo.email} is already registered with a different provider`],
              user: null,
              token: null
            };
          }
        } else {
          // 4. Create new user from Google account
          const username = this.generateUsernameFromGoogle(googleUserInfo);

          // Check if username exists and make it unique if necessary
          let uniqueUsername = username;
          let counter = 1;
          while (await this.userRepository.usernameExists(Username.fromString(uniqueUsername.value))) {
            uniqueUsername = Username.fromString(`${username.value}${counter}`);
            counter++;
          }

          user = User.createFromGoogle(
            googleUserInfo.googleId,
            email,
            uniqueUsername,
            command.timestamp,
            googleUserInfo.picture
          );

          await this.userRepository.save(user);

          this.logger.info('New Google user created', {
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
          idTokenLength: command.idToken?.length
        }
      });

      return {
        success: false,
        errors: [(error as Error).message || 'Google sign-in failed'],
        user: null,
        token: null
      };
    }
  }

  /**
   * Generate a username from Google user info
   */
  private generateUsernameFromGoogle(googleUserInfo: GoogleUserInfo): Username {
    // Try to use given name, or fall back to email prefix
    if (googleUserInfo.givenName) {
      const cleanName = googleUserInfo.givenName
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '');
      if (cleanName.length >= 3) {
        return Username.fromString(cleanName);
      }
    }

    // Fall back to email prefix
    const emailPrefix = googleUserInfo.email.split('@')[0];
    const cleanPrefix = emailPrefix
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .substring(0, 20); // Limit length

    return Username.fromString(cleanPrefix || 'user');
  }
}

/**
 * Result of Google Sign-In operation
 */
export interface GoogleSignInResult {
  success: boolean;
  errors: string[];
  user: User | null;
  token: string | null;
}