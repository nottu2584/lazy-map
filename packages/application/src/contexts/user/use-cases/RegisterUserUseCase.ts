import {
  IUserRepository,
  IPasswordService,
  User,
  Email,
  Password,
  Username,
  IRefreshTokenRepository,
  RefreshToken,
} from '@lazy-map/domain';
import { IAuthenticationPort } from '../ports/IAuthenticationPort';
import { IRefreshTokenPort } from '../ports/IRefreshTokenPort';

export class RegisterUserCommand {
  constructor(
    public readonly email: string,
    public readonly password: string,
    public readonly username: string,
    public readonly createdAt: Date = new Date()
  ) {}
}

export interface RegisterUserResult {
  success: boolean;
  user?: User;
  token?: string;
  refreshToken?: string;
  errors: string[];
}

export class RegisterUserUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly passwordService: IPasswordService,
    private readonly authenticationPort: IAuthenticationPort,
    private readonly refreshTokenService: IRefreshTokenPort,
    private readonly refreshTokenRepository: IRefreshTokenRepository,
  ) {}

  async execute(command: RegisterUserCommand): Promise<RegisterUserResult> {
    const errors: string[] = [];

    try {
      const email = new Email(command.email);
      const password = new Password(command.password);
      const username = new Username(command.username);

      const [emailExists, usernameExists] = await Promise.all([
        this.userRepository.emailExists(email),
        this.userRepository.usernameExists(username)
      ]);

      if (emailExists) {
        errors.push('Email is already registered');
      }

      if (usernameExists) {
        errors.push('Username is already taken');
      }

      if (errors.length > 0) {
        return { success: false, errors };
      }

      const hashedPassword = await this.passwordService.hash(password);
      const user = User.create(email, hashedPassword, username, command.createdAt);
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
      const errorMessage = error instanceof Error ? error.message : 'Registration failed';
      errors.push(errorMessage);

      return {
        success: false,
        errors
      };
    }
  }
}
