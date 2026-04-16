import { randomBytes } from 'crypto';
import type { IOAuthStatePort } from '@lazy-map/application';

const STATE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * In-memory implementation of OAuth CSRF state management.
 * Stores state tokens with TTL for single-use validation.
 */
export class InMemoryOAuthStateService implements IOAuthStatePort {
  private readonly states = new Map<string, number>();

  async generateState(): Promise<string> {
    this.cleanup();

    const state = randomBytes(32).toString('hex');
    this.states.set(state, Date.now() + STATE_TTL_MS);
    return state;
  }

  async validateAndConsume(state: string): Promise<boolean> {
    this.cleanup();

    const expiresAt = this.states.get(state);
    if (!expiresAt) {
      return false;
    }

    this.states.delete(state);

    return Date.now() < expiresAt;
  }

  /**
   * Remove expired entries to prevent unbounded growth
   */
  private cleanup(): void {
    const now = Date.now();
    for (const [state, expiresAt] of this.states) {
      if (now >= expiresAt) {
        this.states.delete(state);
      }
    }
  }
}
