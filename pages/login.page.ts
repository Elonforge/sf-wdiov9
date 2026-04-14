import { $, browser } from '@wdio/globals';
import { expect } from '@wdio/globals';
import { BasePage } from './base.page';

/**
 * LoginPage — wraps a login form.
 */
export class LoginPage extends BasePage {
  // ── Selectors ──────────────────────────────────────────────────────────────
  private get usernameInput()  { return $('input[name="username"], #username, [data-testid="username"]'); }
  private get passwordInput()  { return $('input[name="password"], #password, [data-testid="password"]'); }
  private get loginButton()    { return $('button[type="submit"], #login-button, [data-testid="login-button"]'); }
  private get errorAlert()     { return $('.error, .alert-error, [data-testid="error"], [role="alert"]'); }
  private get forgotPassword() { return $('a[href*="forgot"], [data-testid="forgot-password"]'); }

  // ── Actions ────────────────────────────────────────────────────────────────

  async goto(): Promise<void> {
    await this.navigate('/login');
    await this.waitForPageLoad();
  }

  async login(username: string, password: string): Promise<void> {
    const user = await this.usernameInput;
    await user.waitForDisplayed();
    await user.setValue(username);

    const pass = await this.passwordInput;
    await pass.setValue(password);

    const btn = await this.loginButton;
    await btn.click();
  }

  async loginAndExpectRedirect(
    username: string,
    password: string,
    expectedPath: string,
  ): Promise<void> {
    await this.login(username, password);
    await browser.waitUntil(
      async () => {
        const url = await browser.getUrl();
        return url.includes(expectedPath);
      },
      { timeout: 10_000, timeoutMsg: `Expected URL to contain "${expectedPath}"` },
    );
  }

  // ── Queries ────────────────────────────────────────────────────────────────

  async getErrorMessage(): Promise<string> {
    const el = await this.errorAlert;
    await el.waitForDisplayed();
    return el.getText();
  }

  // ── Assertions ─────────────────────────────────────────────────────────────

  async assertOnLoginPage(): Promise<void> {
    const user = await this.usernameInput;
    const pass = await this.passwordInput;
    const btn  = await this.loginButton;

    await expect(user).toBeDisplayed();
    await expect(pass).toBeDisplayed();
    await expect(btn).toBeDisplayed();
  }
}
