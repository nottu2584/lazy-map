import * as bcrypt from 'bcrypt';
import { Password, IPasswordService } from '@lazy-map/domain';
import { ILogger } from '@lazy-map/domain';

/**
 * Bcrypt implementation of password service
 */
export class BcryptPasswordService implements IPasswordService {
  private readonly saltRounds = 12;
  private readonly currentVersion = '2b'; // bcrypt version

  constructor(private readonly logger?: ILogger) {}

  async hash(password: Password): Promise<Password> {
    if (password.isHashed) {
      throw new Error('Password is already hashed');
    }

    const hashedValue = await bcrypt.hash(password.value, this.saltRounds);
    return Password.fromHash(hashedValue);
  }

  async verify(plainPassword: Password, hashedPassword: Password): Promise<boolean> {
    if (plainPassword.isHashed) {
      throw new Error('Cannot verify against a hashed password');
    }

    if (!hashedPassword.isHashed) {
      throw new Error('Expected hashed password for verification');
    }

    try {
      return await bcrypt.compare(plainPassword.value, hashedPassword.value);
    } catch (error) {
      // Log error in production
      this.logger?.warn('Password verification failed', {
        component: 'BcryptPasswordService',
        operation: 'verify'
      });
      this.logger?.logError(error, {
        component: 'BcryptPasswordService',
        operation: 'verify'
      });
      return false;
    }
  }

  needsRehash(hashedPassword: Password): boolean {
    if (!hashedPassword.isHashed) {
      throw new Error('Can only check rehash for hashed passwords');
    }

    try {
      // Extract salt rounds from hash
      const hashParts = hashedPassword.value.split('$');
      if (hashParts.length < 4) {
        return true; // Invalid hash format, needs rehash
      }

      const version = hashParts[1];
      const rounds = parseInt(hashParts[2], 10);

      // Need rehash if version is outdated or rounds are too low
      return version !== this.currentVersion || rounds < this.saltRounds;
    } catch {
      // If we can't parse the hash, assume it needs rehashing
      return true;
    }
  }
}