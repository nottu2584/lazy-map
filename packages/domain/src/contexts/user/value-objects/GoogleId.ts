/**
 * Value object representing a Google user ID
 * Google IDs are numeric strings up to 21 digits
 */
export class GoogleId {
  constructor(private readonly value: string) {
    if (!value || value.trim().length === 0) {
      throw new Error('Google ID cannot be empty');
    }

    // Google IDs are numeric strings
    if (!/^\d{1,21}$/.test(value)) {
      throw new Error('Invalid Google ID format');
    }
  }

  static create(value: string): GoogleId {
    return new GoogleId(value);
  }

  getValue(): string {
    return this.value;
  }

  equals(other: GoogleId): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}