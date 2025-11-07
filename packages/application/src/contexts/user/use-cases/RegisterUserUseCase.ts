import { 
  IUserRepository, 
  IPasswordService, 
  User, 
  Email, 
  Password, 
  Username
} from '@lazy-map/domain';
import { IAuthenticationPort } from '../ports/IAuthenticationPort';

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
  errors: string[];
}

/**
 * Use case for registering a new user
 */
export class RegisterUserUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly passwordService: IPasswordService,
    private readonly authenticationPort: IAuthenticationPort
  ) {}

  async execute(command: RegisterUserCommand): Promise<RegisterUserResult> {
    const errors: string[] = [];

    try {
      // Validate and create value objects
      const email = new Email(command.email);
      const password = new Password(command.password);
      const username = new Username(command.username);

      // Check if user already exists
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

      // Hash password
      const hashedPassword = await this.passwordService.hash(password);

      // Create user
      const user = User.create(email, hashedPassword, username, command.createdAt);

      // Save user
      await this.userRepository.save(user);

      // Generate authentication token
      const token = await this.authenticationPort.generateToken(
        user.id.value,
        user.email.value,
        user.username.value,
        user.role?.value || 'USER'
      );

      return {
        success: true,
        user,
        token,
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