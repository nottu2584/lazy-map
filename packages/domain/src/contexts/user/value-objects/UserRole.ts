import { DomainRuleError } from '../../../common/errors/DomainError';

/**
 * User role enumeration for role-based access control
 * Simplified to USER and ADMIN roles only
 */
export enum UserRoleType {
  USER = 'USER',
  ADMIN = 'ADMIN'
}

/**
 * User role value object
 * Immutable representation of user permissions level
 */
export class UserRole {
  private static readonly VALID_ROLES = Object.values(UserRoleType);

  private constructor(public readonly value: UserRoleType) {
    Object.freeze(this);
  }

  /**
   * Create a regular user role
   */
  static user(): UserRole {
    return new UserRole(UserRoleType.USER);
  }

  /**
   * Create an admin role
   */
  static admin(): UserRole {
    return new UserRole(UserRoleType.ADMIN);
  }

  /**
   * Create role from string value
   */
  static fromString(value: string): UserRole {
    const upperValue = value.toUpperCase();

    if (!UserRole.VALID_ROLES.includes(upperValue as UserRoleType)) {
      throw new DomainRuleError(
        'INVALID_USER_ROLE',
        `Invalid user role: ${value}. Must be USER or ADMIN`,
        'Invalid user role provided',
        { component: 'UserRole', operation: 'fromString' },
        ['Use either USER or ADMIN role']
      );
    }

    return new UserRole(upperValue as UserRoleType);
  }

  /**
   * Check if role is regular user
   */
  isUser(): boolean {
    return this.value === UserRoleType.USER;
  }

  /**
   * Check if role is admin
   */
  isAdmin(): boolean {
    return this.value === UserRoleType.ADMIN;
  }

  /**
   * Check if user can manage system resources
   */
  canManageSystem(): boolean {
    return this.isAdmin();
  }

  /**
   * Check if user can manage other users
   */
  canManageUsers(): boolean {
    return this.isAdmin();
  }

  /**
   * Check if user can view system statistics
   */
  canViewStats(): boolean {
    return this.isAdmin();
  }

  /**
   * Check if user can manage maps globally
   */
  canManageMaps(): boolean {
    return this.isAdmin();
  }

  /**
   * Check if user can access admin panel
   */
  canAccessAdminPanel(): boolean {
    return this.isAdmin();
  }

  /**
   * Compare roles for equality
   */
  equals(other: UserRole): boolean {
    return this.value === other.value;
  }

  /**
   * Get string representation
   */
  toString(): string {
    return this.value;
  }

  /**
   * Get display name for UI
   */
  getDisplayName(): string {
    return this.value === UserRoleType.ADMIN ? 'Administrator' : 'User';
  }
}