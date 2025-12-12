import { IOAuthPort, OAuthUserInfo } from './IOAuthPort';

/**
 * Discord-specific OAuth port
 * Extends base OAuth port with Discord-specific operations
 */
export interface IDiscordOAuthPort extends IOAuthPort {
  /**
   * Validates a Discord access token and returns user information
   * @deprecated Use getUserInfo directly instead
   */
  validateDiscordToken(accessToken: string): Promise<DiscordUserInfo>;
}

/**
 * Discord-specific user information
 * Contains additional fields specific to Discord
 */
export interface DiscordUserInfo extends OAuthUserInfo {
  provider: 'discord';
  discriminator: string; // Discord discriminator (e.g., "0001")
  globalName?: string; // Discord global display name
  avatar?: string; // Avatar hash
}
