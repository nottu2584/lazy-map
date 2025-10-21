import { UserId, Email, Password, Username, UserRole, UserStatus } from '../value-objects';

/**
 * User aggregate root
 * Supports both local (password) and OAuth authentication
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
  private _authProvider: string;
  private _googleId?: string;
  private _profilePicture?: string;
  private _emailVerified: boolean;

  constructor(
    private _id: UserId,
    private _email: Email,
    private _password: Password | null, // Now nullable for OAuth users
    private _username: Username,
    role?: UserRole,
    status?: UserStatus,
    createdAt?: Date,
    updatedAt?: Date,
    lastLoginAt?: Date | null,
    suspendedAt?: Date | null,
    suspendedBy?: UserId | null,
    suspensionReason?: string | null,
    authProvider?: string,
    googleId?: string,
    profilePicture?: string,
    emailVerified?: boolean
  ) {
    this._createdAt = createdAt || new Date();
    this._updatedAt = updatedAt || new Date();
    this._lastLoginAt = lastLoginAt || null;
    this._role = role || UserRole.user();
    this._status = status || UserStatus.active();
    this._suspendedAt = suspendedAt || null;
    this._suspendedBy = suspendedBy || null;
    this._suspensionReason = suspensionReason || null;
    this._authProvider = authProvider || 'local';
    this._googleId = googleId;
    this._profilePicture = profilePicture;
    this._emailVerified = emailVerified || false;
  }

  // Getters
  get id(): UserId { return this._id; }
  get email(): Email { return this._email; }
  get password(): Password | null { return this._password; }
  get username(): Username { return this._username; }
  get role(): UserRole { return this._role; }
  get status(): UserStatus { return this._status; }
  get createdAt(): Date { return this._createdAt; }
  get updatedAt(): Date { return this._updatedAt; }
  get lastLoginAt(): Date | null { return this._lastLoginAt; }
  get suspendedAt(): Date | null { return this._suspendedAt; }
  get suspendedBy(): UserId | null { return this._suspendedBy; }
  get suspensionReason(): string | null { return this._suspensionReason; }
  get authProvider(): string { return this._authProvider; }
  get googleId(): string | undefined { return this._googleId; }
  get profilePicture(): string | undefined { return this._profilePicture; }
  get emailVerified(): boolean { return this._emailVerified; }

  // Business methods
  static create(email: Email, password: Password, username: Username): User {
    const id = UserId.generate();
    return new User(id, email, password, username);
  }

  static createFromGoogle(
    googleId: string,
    email: Email,
    username: Username,
    profilePicture?: string
  ): User {
    const id = UserId.generate();
    return new User(
      id,
      email,
      null, // No password for OAuth users
      username,
      UserRole.user(),
      UserStatus.active(),
      new Date(),
      new Date(),
      null,
      null,
      null,
      null,
      'google',
      googleId,
      profilePicture,
      true // Google emails are pre-verified
    );
  }

  static fromPersistence(
    id: UserId,
    email: Email,
    hashedPassword: Password | null,
    username: Username,
    role: UserRole,
    status: UserStatus,
    createdAt: Date,
    updatedAt: Date,
    lastLoginAt: Date | null,
    suspendedAt: Date | null = null,
    suspendedBy: UserId | null = null,
    suspensionReason: string | null = null,
    authProvider: string = 'local',
    googleId?: string,
    profilePicture?: string,
    emailVerified: boolean = false
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
      suspensionReason,
      authProvider,
      googleId,
      profilePicture,
      emailVerified
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
    if (this._authProvider !== 'local') {
      throw new Error('Cannot change password for OAuth users');
    }
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

  // OAuth-specific methods
  isOAuthUser(): boolean {
    return this._authProvider !== 'local';
  }

  hasGoogleAccount(): boolean {
    return this._googleId !== undefined;
  }

  linkGoogleAccount(googleId: string, profilePicture?: string): void {
    if (this._googleId) {
      throw new Error('User already has a Google account linked');
    }
    this._googleId = googleId;
    this._profilePicture = profilePicture;
    this._emailVerified = true;
    this.markUpdated();
  }

  unlinkGoogleAccount(): void {
    if (!this._password) {
      throw new Error('Cannot unlink Google account without a password');
    }
    this._googleId = undefined;
    this._profilePicture = undefined;
    this.markUpdated();
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