import { User } from '../entities/User';
import { UserId, Email, Username } from '../value-objects';

/**
 * Repository interface for User aggregate
 */
export interface IUserRepository {
  /**
   * Save a user to the repository
   */
  save(user: User): Promise<void>;

  /**
   * Find a user by their ID
   */
  findById(id: UserId): Promise<User | null>;

  /**
   * Find a user by their email
   */
  findByEmail(email: Email): Promise<User | null>;

  /**
   * Find a user by their username
   */
  findByUsername(username: Username): Promise<User | null>;

  /**
   * Check if an email already exists in the system
   */
  emailExists(email: Email): Promise<boolean>;

  /**
   * Check if a username already exists in the system
   */
  usernameExists(username: Username): Promise<boolean>;

  /**
   * Delete a user from the repository
   */
  delete(id: UserId): Promise<void>;

  /**
   * Get total count of users
   */
  count(): Promise<number>;
}