import { User } from '../entities/User';
import { UserId, Email, Username, UserRole, UserStatus, GoogleId } from '../value-objects';

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
   * Find a user by their Google ID
   */
  findByGoogleId(googleId: GoogleId): Promise<User | null>;

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

  /**
   * Find all users with optional filtering and pagination
   */
  findAll(options?: {
    role?: UserRole;
    status?: UserStatus;
    limit?: number;
    offset?: number;
    searchTerm?: string;
  }): Promise<User[]>;

  /**
   * Find users by role
   */
  findByRole(role: UserRole): Promise<User[]>;

  /**
   * Find users by status
   */
  findByStatus(status: UserStatus): Promise<User[]>;

  /**
   * Get paginated users with filtering
   */
  findPaginated(options: {
    limit: number;
    offset: number;
    role?: UserRole;
    status?: UserStatus;
    searchTerm?: string;
  }): Promise<{
    users: User[];
    total: number;
    hasMore: boolean;
  }>;

  /**
   * Get user statistics for admin dashboard
   */
  getStats(): Promise<{
    totalUsers: number;
    activeUsers: number;
    suspendedUsers: number;
    pendingUsers: number;
    adminUsers: number;
  }>;
}