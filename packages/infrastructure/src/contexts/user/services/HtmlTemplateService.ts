import { ITemplatePort, OAuthSuccessData, OAuthErrorData } from '@lazy-map/application';
import * as fs from 'fs';
import * as path from 'path';

/**
 * HTML template service implementation
 * Reads HTML templates from disk and performs simple placeholder replacement
 */
export class HtmlTemplateService implements ITemplatePort {
  private readonly templatesPath: string;
  private templateCache: Map<string, string>;

  constructor(templatesPath?: string) {
    // Default to backend/src/templates directory
    this.templatesPath = templatesPath || path.join(__dirname, '../../../templates');
    this.templateCache = new Map();
  }

  /**
   * Render OAuth success template
   */
  renderOAuthSuccess(data: OAuthSuccessData): string {
    const template = this.loadTemplate('oauth-success.html');

    return template
      .replace(/{{PROVIDER}}/g, this.escapeHtml(data.provider))
      .replace(/{{TOKEN}}/g, this.escapeHtml(data.token))
      .replace(/{{USER_ID}}/g, this.escapeHtml(data.user.id))
      .replace(/{{USER_EMAIL}}/g, this.escapeHtml(data.user.email))
      .replace(/{{USER_USERNAME}}/g, this.escapeHtml(data.user.username));
  }

  /**
   * Render OAuth error template
   */
  renderOAuthError(data: OAuthErrorData): string {
    const template = this.loadTemplate('oauth-error.html');

    return template
      .replace(/{{PROVIDER}}/g, this.escapeHtml(data.provider))
      .replace(/{{ERROR_MESSAGE}}/g, this.escapeHtml(data.errorMessage));
  }

  /**
   * Load template from disk with caching
   */
  private loadTemplate(filename: string): string {
    if (this.templateCache.has(filename)) {
      return this.templateCache.get(filename)!;
    }

    const templatePath = path.join(this.templatesPath, filename);

    try {
      const template = fs.readFileSync(templatePath, 'utf-8');
      this.templateCache.set(filename, template);
      return template;
    } catch (error) {
      throw new Error(`Failed to load template ${filename}: ${(error as Error).message}`);
    }
  }

  /**
   * Escape HTML special characters to prevent XSS
   */
  private escapeHtml(text: string): string {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
      '`': '&#96;',
      '=': '&#61;'
    };

    return text.replace(/[&<>"'`=]/g, (char) => map[char]);
  }

  /**
   * Clear template cache (useful for development)
   */
  clearCache(): void {
    this.templateCache.clear();
  }
}
