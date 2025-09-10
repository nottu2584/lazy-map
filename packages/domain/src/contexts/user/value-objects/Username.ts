/**
 * Username value object with validation
 */
export class Username {
  private static readonly MIN_LENGTH = 3;
  private static readonly MAX_LENGTH = 30;
  private static readonly VALID_REGEX = /^[a-zA-Z0-9_-]+$/;

  constructor(public readonly value: string) {
    this.validate();
  }

  private validate(): void {
    if (!this.value || typeof this.value !== 'string') {
      throw new Error('Username must be a non-empty string');
    }

    if (this.value.length < Username.MIN_LENGTH) {
      throw new Error(`Username must be at least ${Username.MIN_LENGTH} characters long`);
    }

    if (this.value.length > Username.MAX_LENGTH) {
      throw new Error(`Username must be at most ${Username.MAX_LENGTH} characters long`);
    }

    if (!Username.VALID_REGEX.test(this.value)) {
      throw new Error('Username can only contain letters, numbers, underscores, and hyphens');
    }

    if (this.value.startsWith('_') || this.value.startsWith('-') || 
        this.value.endsWith('_') || this.value.endsWith('-')) {
      throw new Error('Username cannot start or end with underscore or hyphen');
    }
  }

  get normalized(): string {
    return this.value.toLowerCase();
  }

  equals(other: Username): boolean {
    return this.normalized === other.normalized;
  }

  toString(): string {
    return this.value;
  }
}