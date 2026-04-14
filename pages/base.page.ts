import { browser } from '@wdio/globals';

/**
 * BasePage — parent class for every page object.
 *
 * Provides common navigation, waiting, and screenshot helpers so that
 * concrete page objects stay focused on their own selectors and actions.
 */
export class BasePage {
  /**
   * Navigate to a relative URL (resolved against `baseUrl` in wdio.conf.ts).
   */
  async navigate(path: string): Promise<void> {
    await browser.url(path);
  }

  /**
   * Wait for the page to be fully loaded (document.readyState === 'complete').
   */
  async waitForPageLoad(timeout = 30_000): Promise<void> {
    await browser.waitUntil(
      async () => String(await browser.execute('return document.readyState')) === 'complete',
      { timeout, timeoutMsg: 'Page did not reach readyState "complete"' },
    );
  }

  /**
   * Return the current page title.
   */
  async getTitle(): Promise<string> {
    return browser.getTitle();
  }

  /**
   * Capture a screenshot and save it to test-results/.
   */
  async takeScreenshot(name: string): Promise<void> {
    await browser.saveScreenshot(`test-results/screenshots/${name}.png`);
  }
}
