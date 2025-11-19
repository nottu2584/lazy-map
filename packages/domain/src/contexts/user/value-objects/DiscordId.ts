/**
 * Value object representing a Discord user ID
 * Discord IDs are snowflake IDs - numeric strings typically 17-19 digits
 */
export class DiscordId {
  constructor(private readonly value: string) {
    if (!value || value.trim().length === 0) {
      throw new Error('Discord ID cannot be empty');
    }

    // Discord IDs are numeric strings (snowflake format)
    if (!/^\d{17,19}$/.test(value)) {
      throw new Error('Invalid Discord ID format');
    }
  }

  static create(value: string): DiscordId {
    return new DiscordId(value);
  }

  getValue(): string {
    return this.value;
  }

  equals(other: DiscordId): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
