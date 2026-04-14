import { BasePage } from './BasePage';

/**
 * LoginPage — wraps the login UI.
 *
 * Selectors use data-test attributes (common in Sauce Demo / React apps).
 * Swap these for your real application's selectors.
 */
export class LoginPage extends BasePage {
  protected path = '/';

  // ── Selectors ──────────────────────────────────────────────────────────────

  private readonly selectors = {
    usernameInput: '#user-name',
    passwordInput: '#password',
    loginButton: '#login-button',
    errorMessage: '[data-test="error"]',
    loginContainer: '.login_container',
  } as const;

  // ── Actions ────────────────────────────────────────────────────────────────

  async open(): Promise<void> {
    await super.open({ waitForElement: this.selectors.loginContainer });
  }

  async enterUsername(username: string): Promise<void> {
    await this.typeText(this.selectors.usernameInput, username);
  }

  async enterPassword(password: string): Promise<void> {
    await this.typeText(this.selectors.passwordInput, password);
  }

  async clickLogin(): Promise<void> {
    await this.clickElement(this.selectors.loginButton);
  }

  /** Convenience: fill credentials and submit in one call. */
  async login(username: string, password: string): Promise<void> {
    await this.enterUsername(username);
    await this.enterPassword(password);
    await this.clickLogin();
  }

  // ── Assertions / state queries ─────────────────────────────────────────────

  async getErrorMessage(): Promise<string> {
    return this.getText(this.selectors.errorMessage);
  }

  async isErrorVisible(): Promise<boolean> {
    return this.isVisible(this.selectors.errorMessage);
  }
}
