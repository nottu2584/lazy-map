/**
 * Value object representing the authentication provider
 */
export class AuthProvider {
  static readonly LOCAL = 'local';
  static readonly GOOGLE = 'google';
  // Future providers
  static readonly GITHUB = 'github';
  static readonly DISCORD = 'discord';
  static readonly MICROSOFT = 'microsoft';

  private static readonly VALID_PROVIDERS = [
    AuthProvider.LOCAL,
    AuthProvider.GOOGLE,
    AuthProvider.GITHUB,
    AuthProvider.DISCORD,
    AuthProvider.MICROSOFT,
  ];

  constructor(private readonly value: string) {
    if (!AuthProvider.VALID_PROVIDERS.includes(value)) {
      throw new Error(`Invalid auth provider: ${value}`);
    }
  }

  static local(): AuthProvider {
    return new AuthProvider(AuthProvider.LOCAL);
  }

  static google(): AuthProvider {
    return new AuthProvider(AuthProvider.GOOGLE);
  }

  static fromString(value: string): AuthProvider {
    return new AuthProvider(value);
  }

  isLocal(): boolean {
    return this.value === AuthProvider.LOCAL;
  }

  isOAuth(): boolean {
    return this.value !== AuthProvider.LOCAL;
  }

  isGoogle(): boolean {
    return this.value === AuthProvider.GOOGLE;
  }

  equals(other: AuthProvider): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}