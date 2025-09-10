import { UserId, Email, Password, Username, UserRole, UserStatus } from '../value-objects';

/**
 * User aggregate root
 */
export class User {
  private _createdAt: Date;
  private _updatedAt: Date;
  private _lastLoginAt: Date | null;
  private _role: UserRole;
  private _status: UserStatus;
  private _suspendedAt: Date | null;
  private _suspendedBy: UserId | null;
  private _suspensionReason: string | null;

  constructor(
    private _id: UserId,
    private _email: Email,
    private _password: Password,
    private _username: Username,
    role?: UserRole,
    status?: UserStatus,
    createdAt?: Date,
    updatedAt?: Date,
    lastLoginAt?: Date | null,
    suspendedAt?: Date | null,
    suspendedBy?: UserId | null,
    suspensionReason?: string | null
  ) {
    this._createdAt = createdAt || new Date();
    this._updatedAt = updatedAt || new Date();
    this._lastLoginAt = lastLoginAt || null;
    this._role = role || UserRole.user();
    this._status = status || UserStatus.active();
    this._suspendedAt = suspendedAt || null;
    this._suspendedBy = suspendedBy || null;
    this._suspensionReason = suspensionReason || null;
  }

  // Getters
  get id(): UserId { return this._id; }
  get email(): Email { return this._email; }
  get password(): Password { return this._password; }
  get username(): Username { return this._username; }
  get role(): UserRole { return this._role; }
  get status(): UserStatus { return this._status; }
  get createdAt(): Date { return this._createdAt; }
  get updatedAt(): Date { return this._updatedAt; }
  get lastLoginAt(): Date | null { return this._lastLoginAt; }
  get suspendedAt(): Date | null { return this._suspendedAt; }
  get suspendedBy(): UserId | null { return this._suspendedBy; }
  get suspensionReason(): string | null { return this._suspensionReason; }

  // Business methods
  static create(email: Email, password: Password, username: Username): User {
    const id = UserId.generate();
    return new User(id, email, password, username);
  }

  static fromPersistence(
    id: UserId,
    email: Email,
    hashedPassword: Password,
    username: Username,
    role: UserRole,
    status: UserStatus,
    createdAt: Date,
    updatedAt: Date,
    lastLoginAt: Date | null,
    suspendedAt: Date | null = null,
    suspendedBy: UserId | null = null,
    suspensionReason: string | null = null
  ): User {
    return new User(
      id, 
      email, 
      hashedPassword, 
      username, 
      role, 
      status, 
      createdAt, 
      updatedAt, 
      lastLoginAt,
      suspendedAt,
      suspendedBy,
      suspensionReason
    );
  }

  changeEmail(newEmail: Email): void {
    if (this._email.equals(newEmail)) {
      return; // No change needed
    }
    this._email = newEmail;
    this.markUpdated();
  }

  changePassword(newPassword: Password): void {
    this._password = newPassword;
    this.markUpdated();
  }

  changeUsername(newUsername: Username): void {
    if (this._username.equals(newUsername)) {
      return; // No change needed
    }
    this._username = newUsername;
    this.markUpdated();
  }

  recordLogin(): void {
    this._lastLoginAt = new Date();
    this.markUpdated();
  }

  // Administrative operations
  suspend(adminId: UserId, reason: string): void {
    if (this._status.isSuspended()) {
      throw new Error('User is already suspended');
    }
    
    this._status = UserStatus.suspended();
    this._suspendedAt = new Date();
    this._suspendedBy = adminId;
    this._suspensionReason = reason;
    this.markUpdated();
  }

  reactivate(): void {
    if (!this._status.isSuspended()) {
      throw new Error('User is not suspended');
    }
    
    this._status = UserStatus.active();
    this._suspendedAt = null;
    this._suspendedBy = null;
    this._suspensionReason = null;
    this.markUpdated();
  }

  promote(newRole: UserRole): void {
    if (this._role.equals(newRole)) {
      return; // No change needed
    }
    
    this._role = newRole;
    this.markUpdated();
  }

  deactivate(): void {
    this._status = UserStatus.deactivated();
    this.markUpdated();
  }

  // Permission checks
  canLogin(): boolean {
    return this._status.canLogin();
  }

  canUseSystem(): boolean {
    return this._status.canUseSystem();
  }

  hasAdminPrivileges(): boolean {
    return this._role.hasAdminPrivileges() && this.canUseSystem();
  }

  canManageUsers(): boolean {
    return this._role.canManageUsers() && this.canUseSystem();
  }

  canPromoteUsers(): boolean {
    return this._role.canPromoteUsers() && this.canUseSystem();
  }

  canDeleteUsers(): boolean {
    return this._role.canDeleteUsers() && this.canUseSystem();
  }

  private markUpdated(): void {
    this._updatedAt = new Date();
  }

  equals(other: User): boolean {
    return this._id.equals(other._id);
  }

  toString(): string {
    return `User(id: ${this._id.value}, username: ${this._username.value}, email: ${this._email.value})`;
  }
}