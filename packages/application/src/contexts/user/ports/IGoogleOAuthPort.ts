import { IOAuthPort, OAuthUserInfo } from './IOAuthPort';

/**
 * Google-specific OAuth port
 * Extends base OAuth port with Google-specific operations
 */
export interface IGoogleOAuthPort extends IOAuthPort {
  /**
   * Validate Google ID token (for backward compatibility with client-side flow)
   * @param idToken - Google ID token from client
   * @returns Google user information
   * @deprecated Use server-side OAuth flow (getUserInfo) instead
   */
  validateGoogleIdToken(idToken: string): Promise<GoogleUserInfo>;
}

/**
 * Google-specific user information
 * Contains additional fields specific to Google
 */
export interface GoogleUserInfo extends OAuthUserInfo {
  provider: 'google';
  givenName?: string;
  familyName?: string;
}
