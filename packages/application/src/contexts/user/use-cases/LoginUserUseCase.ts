import {
  IUserRepository,
  IPasswordService,
  User,
  Email,
  Password,
  IRefreshTokenRepository,
  RefreshToken,
} from '@lazy-map/domain';
import { IAuthenticationPort } from '../ports/IAuthenticationPort';
import { IRefreshTokenPort } from '../ports/IRefreshTokenPort';

export class LoginUserCommand {
  constructor(
    public readonly email: string,
    public readonly password: string,
    public readonly loginTime: Date = new Date()
  ) {}
}

export interface LoginUserResult {
  success: boolean;
  user?: User;
  token?: string;
  refreshToken?: string;
  errors: string[];
}

export class LoginUserUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly passwordService: IPasswordService,
    private readonly authenticationPort: IAuthenticationPort,
    private readonly refreshTokenService: IRefreshTokenPort,
    private readonly refreshTokenRepository: IRefreshTokenRepository,
  ) {}

  async execute(command: LoginUserCommand): Promise<LoginUserResult> {
    const errors: string[] = [];

    try {
      const email = new Email(command.email);
      const password = new Password(command.password);

      const user = await this.userRepository.findByEmail(email);
      if (!user) {
        errors.push('Invalid email or password');
        return { success: false, errors };
      }

      if (!user.password) {
        errors.push('This account uses Google Sign-In. Please sign in with Google.');
        return { success: false, errors };
      }

      const isPasswordValid = await this.passwordService.verify(password, user.password);
      if (!isPasswordValid) {
        errors.push('Invalid email or password');
        return { success: false, errors };
      }

      user.recordLogin(command.loginTime);
      await this.userRepository.save(user);

      const token = await this.authenticationPort.generateToken(
        user.id.value,
        user.email.value,
        user.username.value,
        user.role?.value || 'USER'
      );

      const refreshData = await this.refreshTokenService.generateRefreshToken();
      const refreshToken = RefreshToken.create(
        user.id,
        refreshData.tokenHash,
        refreshData.expiresAt,
      );
      await this.refreshTokenRepository.save(refreshToken);

      return {
        success: true,
        user,
        token,
        refreshToken: refreshData.token,
        errors: []
      };

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      errors.push(errorMessage);

      return {
        success: false,
        errors
      };
    }
  }
}
