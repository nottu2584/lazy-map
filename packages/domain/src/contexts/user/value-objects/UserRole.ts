/**
 * User role enumeration for role-based access control
 */
export enum UserRoleType {
  USER = 'USER',
  ADMIN = 'ADMIN',
  SUPER_ADMIN = 'SUPER_ADMIN'
}

/**
 * User role value object
 */
export class UserRole {
  private static readonly VALID_ROLES = Object.values(UserRoleType);

  constructor(public readonly value: UserRoleType) {
    this.validate();
  }

  private validate(): void {
    if (!UserRole.VALID_ROLES.includes(this.value)) {
      throw new Error(`Invalid user role: ${this.value}`);
    }
  }

  static user(): UserRole {
    return new UserRole(UserRoleType.USER);
  }

  static admin(): UserRole {
    return new UserRole(UserRoleType.ADMIN);
  }

  static superAdmin(): UserRole {
    return new UserRole(UserRoleType.SUPER_ADMIN);
  }

  static fromString(value: string): UserRole {
    const upperValue = value.toUpperCase() as UserRoleType;
    return new UserRole(upperValue);
  }

  isUser(): boolean {
    return this.value === UserRoleType.USER;
  }

  isAdmin(): boolean {
    return this.value === UserRoleType.ADMIN;
  }

  isSuperAdmin(): boolean {
    return this.value === UserRoleType.SUPER_ADMIN;
  }

  hasAdminPrivileges(): boolean {
    return this.isAdmin() || this.isSuperAdmin();
  }

  canManageUsers(): boolean {
    return this.hasAdminPrivileges();
  }

  canPromoteUsers(): boolean {
    return this.isSuperAdmin();
  }

  canDeleteUsers(): boolean {
    return this.isSuperAdmin();
  }

  equals(other: UserRole): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}