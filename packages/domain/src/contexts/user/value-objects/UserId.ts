import { v4 as uuidv4, validate as uuidValidate } from 'uuid';

/**
 * User identifier value object
 */
export class UserId {
  constructor(public readonly value: string) {
    this.validate();
  }

  private validate(): void {
    if (!this.value || typeof this.value !== 'string') {
      throw new Error('UserId must be a non-empty string');
    }
    if (!uuidValidate(this.value)) {
      throw new Error('UserId must be a valid UUID');
    }
  }

  static generate(): UserId {
    return new UserId(uuidv4());
  }

  static fromString(id: string): UserId {
    return new UserId(id);
  }

  equals(other: UserId): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}