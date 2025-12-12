import * as crypto from 'crypto';
import { ITokenEncryptionPort } from '@lazy-map/application';
import { ILogger } from '@lazy-map/domain';

/**
 * AES-256-GCM encryption service for OAuth tokens
 * Uses authenticated encryption to prevent tampering
 */
export class AesTokenEncryptionService implements ITokenEncryptionPort {
  private readonly algorithm = 'aes-256-gcm';
  private readonly key: Buffer | null;
  private readonly enabled: boolean;

  constructor(
    encryptionKey: string | undefined,
    private readonly logger: ILogger
  ) {
    if (!encryptionKey || encryptionKey.length === 0) {
      this.enabled = false;
      this.key = null;
      this.logger.warn('Token encryption not configured - tokens will be stored in plain text', {
        component: 'AesTokenEncryptionService',
        operation: 'constructor',
        metadata: {
          message: 'Set OAUTH_TOKEN_ENCRYPTION_KEY environment variable to enable encryption'
        }
      });
    } else {
      this.enabled = true;
      // Derive a 32-byte key from the provided key using SHA-256
      this.key = crypto.createHash('sha256').update(encryptionKey).digest();
      this.logger.info('Token encryption enabled', {
        component: 'AesTokenEncryptionService',
        operation: 'constructor'
      });
    }
  }

  /**
   * Encrypt a token using AES-256-GCM
   * Format: iv:authTag:encryptedData (all hex encoded)
   */
  async encrypt(token: string): Promise<string> {
    if (!this.enabled || !this.key) {
      // Return plain text if encryption is not enabled
      return token;
    }

    try {
      // Generate a random initialization vector
      const iv = crypto.randomBytes(16);

      // Create cipher
      const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);

      // Encrypt the token
      let encrypted = cipher.update(token, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      // Get authentication tag
      const authTag = cipher.getAuthTag();

      // Combine iv, authTag, and encrypted data
      const result = `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;

      this.logger.debug('Token encrypted successfully', {
        metadata: { ivLength: iv.length, encryptedLength: encrypted.length }
      });

      return result;
    } catch (error) {
      this.logger.logError(error as Error, {
        metadata: { operation: 'encrypt' }
      });

      throw new Error('Failed to encrypt token');
    }
  }

  /**
   * Decrypt a token using AES-256-GCM
   */
  async decrypt(encryptedToken: string): Promise<string> {
    if (!this.enabled || !this.key) {
      // Return as-is if encryption is not enabled (plain text)
      return encryptedToken;
    }

    try {
      // Split the encrypted token into components
      const parts = encryptedToken.split(':');

      if (parts.length !== 3) {
        throw new Error('Invalid encrypted token format');
      }

      const [ivHex, authTagHex, encryptedData] = parts;

      // Convert from hex
      const iv = Buffer.from(ivHex, 'hex');
      const authTag = Buffer.from(authTagHex, 'hex');

      // Create decipher
      const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv);
      decipher.setAuthTag(authTag);

      // Decrypt the token
      let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      this.logger.debug('Token decrypted successfully', {
        metadata: { decryptedLength: decrypted.length }
      });

      return decrypted;
    } catch (error) {
      this.logger.logError(error as Error, {
        metadata: { operation: 'decrypt' }
      });

      throw new Error('Failed to decrypt token - token may be corrupted or key may have changed');
    }
  }

  /**
   * Check if encryption is enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }
}
