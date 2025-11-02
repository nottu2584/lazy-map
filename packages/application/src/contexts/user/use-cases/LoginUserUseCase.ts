import { 
  IUserRepository, 
  IPasswordService,
  User, 
  Email, 
  Password 
} from '@lazy-map/domain';
import { IAuthenticationPort } from '../ports/IAuthenticationPort';

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
  errors: string[];
}

/**
 * Use case for user authentication
 */
export class LoginUserUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly passwordService: IPasswordService,
    private readonly authenticationPort: IAuthenticationPort
  ) {}

  async execute(command: LoginUserCommand): Promise<LoginUserResult> {
    const errors: string[] = [];

    try {
      // Validate input
      const email = new Email(command.email);
      const password = new Password(command.password);

      // Find user by email
      const user = await this.userRepository.findByEmail(email);
      if (!user) {
        errors.push('Invalid email or password');
        return { success: false, errors };
      }

      // Check if user has a password (OAuth users don't)
      if (!user.password) {
        errors.push('This account uses Google Sign-In. Please sign in with Google.');
        return { success: false, errors };
      }

      // Verify password
      const isPasswordValid = await this.passwordService.verify(password, user.password);
      if (!isPasswordValid) {
        errors.push('Invalid email or password');
        return { success: false, errors };
      }

      // Record login
      user.recordLogin(command.loginTime);
      await this.userRepository.save(user);

      // Generate authentication token
      const token = await this.authenticationPort.generateToken(user.id.value, user.email.value);

      return {
        success: true,
        user,
        token,
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