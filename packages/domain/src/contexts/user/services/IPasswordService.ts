import { Password } from '../value-objects/Password';

/**
 * Domain service for password operations
 */
export interface IPasswordService {
  /**
   * Hash a plain text password
   */
  hash(password: Password): Promise<Password>;

  /**
   * Verify a plain text password against a hashed password
   */
  verify(plainPassword: Password, hashedPassword: Password): Promise<boolean>;

  /**
   * Check if password needs rehashing (due to security updates)
   */
  needsRehash(hashedPassword: Password): boolean;
}