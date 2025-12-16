/**
 * Port for rendering HTML templates
 */
export interface ITemplatePort {
  /**
   * Render OAuth success template
   */
  renderOAuthSuccess(data: OAuthSuccessData): string;

  /**
   * Render OAuth error template
   */
  renderOAuthError(data: OAuthErrorData): string;
}

/**
 * Data for OAuth success template
 */
export interface OAuthSuccessData {
  provider: 'google' | 'discord';
  token: string;
  user: {
    id: string;
    email: string;
    username: string;
  };
}

/**
 * Data for OAuth error template
 */
export interface OAuthErrorData {
  provider: 'google' | 'discord';
  errorMessage: string;
}
