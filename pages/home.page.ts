import { $, $$, browser } from '@wdio/globals';
import { expect } from '@wdio/globals';
import { BasePage } from './base.page';

/**
 * HomePage — wraps the home / dashboard page.
 */
export class HomePage extends BasePage {
  // ── Selectors ──────────────────────────────────────────────────────────────
  private get heading()        { return $('h1'); }
  private get userMenu()       { return $('[data-testid="user-menu"], .user-menu, #user-menu'); }
  private get logoutButton()   { return $('[data-testid="logout"], .logout, #logout, a[href*="logout"]'); }
  private get navLinks()       { return $$('nav a, .nav-link, [data-testid="nav-link"]'); }

  // ── Actions ────────────────────────────────────────────────────────────────

  async goto(): Promise<void> {
    await this.navigate('/');
    await this.waitForPageLoad();
  }

  async logout(): Promise<void> {
    const menu = await this.userMenu;
    if (await menu.isExisting()) {
      await menu.click();
    }
    const btn = await this.logoutButton;
    await btn.waitForDisplayed();
    await btn.click();
  }

  // ── Queries ────────────────────────────────────────────────────────────────

  async getHeadingText(): Promise<string> {
    const el = await this.heading;
    await el.waitForDisplayed();
    return el.getText();
  }

  async getNavigationLinkCount(): Promise<number> {
    const links = await this.navLinks;
    return links.length;
  }

  // ── Assertions ─────────────────────────────────────────────────────────────

  async assertOnHomePage(): Promise<void> {
    const el = await this.heading;
    await expect(el).toBeDisplayed();

    const url = await browser.getUrl();
    expect(url).toContain('/');
  }
}
