/**
 * Port for managing OAuth CSRF state tokens
 * Generates cryptographically random state values and validates them on callback
 */
export interface IOAuthStatePort {
  /**
   * Generate a cryptographically random state string and store it with a TTL
   */
  generateState(): Promise<string>;

  /**
   * Validate a state string and consume it (one-time use)
   * Returns true if valid and not expired, false otherwise
   */
  validateAndConsume(state: string): Promise<boolean>;
}
