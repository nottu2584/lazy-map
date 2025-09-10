/**
 * Password value object with validation
 */
export class Password {
  private static readonly MIN_LENGTH = 8;
  private static readonly MAX_LENGTH = 128;

  constructor(public readonly value: string, public readonly isHashed: boolean = false) {
    if (!isHashed) {
      this.validate();
    }
  }

  private validate(): void {
    if (!this.value || typeof this.value !== 'string') {
      throw new Error('Password must be a non-empty string');
    }

    if (this.value.length < Password.MIN_LENGTH) {
      throw new Error(`Password must be at least ${Password.MIN_LENGTH} characters long`);
    }

    if (this.value.length > Password.MAX_LENGTH) {
      throw new Error(`Password must be at most ${Password.MAX_LENGTH} characters long`);
    }

    // Check for at least one number, one lowercase, one uppercase, one special char
    const hasNumber = /\d/.test(this.value);
    const hasLowercase = /[a-z]/.test(this.value);
    const hasUppercase = /[A-Z]/.test(this.value);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(this.value);

    if (!hasNumber || !hasLowercase || !hasUppercase || !hasSpecialChar) {
      throw new Error('Password must contain at least one number, one lowercase letter, one uppercase letter, and one special character');
    }
  }

  static fromHash(hashedValue: string): Password {
    if (!hashedValue || typeof hashedValue !== 'string') {
      throw new Error('Hashed password must be a non-empty string');
    }
    return new Password(hashedValue, true);
  }

  get strength(): 'weak' | 'medium' | 'strong' {
    if (this.isHashed) {
      throw new Error('Cannot determine strength of hashed password');
    }

    const length = this.value.length;
    const hasVariety = /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])/.test(this.value);
    
    if (length >= 12 && hasVariety) return 'strong';
    if (length >= 8 && hasVariety) return 'medium';
    return 'weak';
  }

  toString(): string {
    return this.isHashed ? '[HASHED]' : '[PASSWORD]';
  }
}