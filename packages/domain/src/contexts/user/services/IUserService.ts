import { User } from '../entities/User';
import { Email, Username, Password } from '../value-objects';

export interface UserRegistrationResult {
  success: boolean;
  user?: User;
  errors: string[];
}

/**
 * Domain service for user business logic
 */
export interface IUserService {
  /**
   * Register a new user with validation
   */
  registerUser(email: Email, password: Password, username: Username): Promise<UserRegistrationResult>;

  /**
   * Validate user credentials for authentication
   */
  validateCredentials(email: Email, password: Password): Promise<User | null>;

  /**
   * Check if user can change their email to the new one
   */
  canChangeEmail(user: User, newEmail: Email): Promise<boolean>;

  /**
   * Check if user can change their username to the new one
   */
  canChangeUsername(user: User, newUsername: Username): Promise<boolean>;
}