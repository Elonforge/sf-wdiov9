import { browser, $ } from '@wdio/globals';
import type { NavigationOptions } from '../types/index';

/**
 * BasePage — parent for every Page Object.
 *
 * Provides common navigation, waiting, and screenshot helpers so that
 * concrete page objects stay focused on their own selectors and actions.
 */
export abstract class BasePage {
  /** Absolute URL path (e.g. "/login"). Concrete classes must define this. */
  protected abstract path: string;

  // ── Navigation ─────────────────────────────────────────────────────────────

  async open(options: NavigationOptions = {}): Promise<void> {
    const baseUrl = process.env.BASE_URL ?? '';
    await browser.url(`${baseUrl}${this.path}`);

    if (options.waitForElement) {
      await this.waitForSelector(options.waitForElement, options.timeout);
    }
  }

  async getTitle(): Promise<string> {
    return browser.getTitle();
  }

  async getUrl(): Promise<string> {
    return browser.getUrl();
  }

  // ── Waiting helpers ────────────────────────────────────────────────────────

  async waitForSelector(
    selector: string,
    timeout: number = 10_000,
  ): Promise<WebdriverIO.Element> {
    const el = await $(selector);
    await el.waitForDisplayed({ timeout });
    return el as unknown as WebdriverIO.Element;
  }

  async waitForText(selector: string, text: string, timeout: number = 10_000): Promise<void> {
    const el = await $(selector);
    await el.waitUntil(
      async () => {
        const t = await el.getText();
        return t.includes(text);
      },
      { timeout, timeoutMsg: `Expected element "${selector}" to contain text "${text}"` },
    );
  }

  // ── Interaction helpers ────────────────────────────────────────────────────

  async clickElement(selector: string): Promise<void> {
    const el = await $(selector);
    await el.waitForClickable();
    await el.click();
  }

  async typeText(selector: string, text: string): Promise<void> {
    const el = await $(selector);
    await el.waitForDisplayed();
    await el.clearValue();
    await el.setValue(text);
  }

  async getText(selector: string): Promise<string> {
    const el = await $(selector);
    await el.waitForDisplayed();
    return el.getText();
  }

  async isVisible(selector: string): Promise<boolean> {
    try {
      const el = await $(selector);
      return el.isDisplayed();
    } catch {
      return false;
    }
  }

  // ── Screenshot ─────────────────────────────────────────────────────────────

  async takeScreenshot(name: string): Promise<void> {
    await browser.saveScreenshot(`allure-results/${name}.png`);
  }
}
