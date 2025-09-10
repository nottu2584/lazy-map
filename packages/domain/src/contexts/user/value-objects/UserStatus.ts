/**
 * User status enumeration for account management
 */
export enum UserStatusType {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  PENDING = 'PENDING',
  DEACTIVATED = 'DEACTIVATED'
}

/**
 * User status value object
 */
export class UserStatus {
  private static readonly VALID_STATUSES = Object.values(UserStatusType);

  constructor(public readonly value: UserStatusType) {
    this.validate();
  }

  private validate(): void {
    if (!UserStatus.VALID_STATUSES.includes(this.value)) {
      throw new Error(`Invalid user status: ${this.value}`);
    }
  }

  static active(): UserStatus {
    return new UserStatus(UserStatusType.ACTIVE);
  }

  static suspended(): UserStatus {
    return new UserStatus(UserStatusType.SUSPENDED);
  }

  static pending(): UserStatus {
    return new UserStatus(UserStatusType.PENDING);
  }

  static deactivated(): UserStatus {
    return new UserStatus(UserStatusType.DEACTIVATED);
  }

  static fromString(value: string): UserStatus {
    const upperValue = value.toUpperCase() as UserStatusType;
    return new UserStatus(upperValue);
  }

  isActive(): boolean {
    return this.value === UserStatusType.ACTIVE;
  }

  isSuspended(): boolean {
    return this.value === UserStatusType.SUSPENDED;
  }

  isPending(): boolean {
    return this.value === UserStatusType.PENDING;
  }

  isDeactivated(): boolean {
    return this.value === UserStatusType.DEACTIVATED;
  }

  canLogin(): boolean {
    return this.isActive();
  }

  canUseSystem(): boolean {
    return this.isActive();
  }

  requiresActivation(): boolean {
    return this.isPending();
  }

  equals(other: UserStatus): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}