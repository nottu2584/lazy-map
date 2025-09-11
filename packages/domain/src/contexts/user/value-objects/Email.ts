/**
 * Email value object with validation
 */
export class Email {
  private static readonly EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  constructor(public readonly value: string) {
    this.validate();
  }

  static fromString(value: string): Email {
    return new Email(value);
  }

  private validate(): void {
    if (!this.value || typeof this.value !== 'string') {
      throw new Error('Email must be a non-empty string');
    }

    if (this.value.length > 320) {
      throw new Error('Email address is too long (max 320 characters)');
    }

    if (!Email.EMAIL_REGEX.test(this.value)) {
      throw new Error('Invalid email format');
    }
  }

  get domain(): string {
    return this.value.split('@')[1];
  }

  get localPart(): string {
    return this.value.split('@')[0];
  }

  equals(other: Email): boolean {
    return this.value.toLowerCase() === other.value.toLowerCase();
  }

  toString(): string {
    return this.value;
  }
}