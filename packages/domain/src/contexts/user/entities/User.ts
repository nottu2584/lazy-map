import { UserId, Email, Password, Username } from '../value-objects';

/**
 * User aggregate root
 */
export class User {
  private _createdAt: Date;
  private _updatedAt: Date;
  private _lastLoginAt: Date | null;

  constructor(
    private _id: UserId,
    private _email: Email,
    private _password: Password,
    private _username: Username,
    createdAt?: Date,
    updatedAt?: Date,
    lastLoginAt?: Date | null
  ) {
    this._createdAt = createdAt || new Date();
    this._updatedAt = updatedAt || new Date();
    this._lastLoginAt = lastLoginAt || null;
  }

  // Getters
  get id(): UserId { return this._id; }
  get email(): Email { return this._email; }
  get password(): Password { return this._password; }
  get username(): Username { return this._username; }
  get createdAt(): Date { return this._createdAt; }
  get updatedAt(): Date { return this._updatedAt; }
  get lastLoginAt(): Date | null { return this._lastLoginAt; }

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
    createdAt: Date,
    updatedAt: Date,
    lastLoginAt: Date | null
  ): User {
    return new User(id, email, hashedPassword, username, createdAt, updatedAt, lastLoginAt);
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