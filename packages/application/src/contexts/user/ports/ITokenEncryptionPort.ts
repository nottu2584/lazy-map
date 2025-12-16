/**
 * Port for encrypting and decrypting sensitive tokens
 * Used for securely storing OAuth refresh tokens
 */
export interface ITokenEncryptionPort {
  /**
   * Encrypt a token for secure storage
   * @param token - Plain text token to encrypt
   * @returns Encrypted token string
   */
  encrypt(token: string): Promise<string>;

  /**
   * Decrypt a token from storage
   * @param encryptedToken - Encrypted token string
   * @returns Plain text token
   */
  decrypt(encryptedToken: string): Promise<string>;

  /**
   * Check if encryption is enabled/configured
   * @returns true if encryption is available
   */
  isEnabled(): boolean;
}
