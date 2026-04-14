import { browser, expect } from '@wdio/globals';
import { LoginPage } from '../../../src/pages/LoginPage';
import { HomePage } from '../../../src/pages/HomePage';
import { loginCredentials } from '../../../src/data/testData';

/**
 * UI Spec — Login flow
 *
 * Targets the Sauce Demo application (https://www.saucedemo.com).
 * The BASE_URL env var selects the environment.
 *
 * These are skeleton tests that demonstrate the Page Object Model pattern.
 * Replace the selectors in LoginPage / HomePage for your real application.
 */
describe('Login Page', () => {
  let loginPage: LoginPage;
  let homePage: HomePage;

  before(() => {
    loginPage = new LoginPage();
    homePage = new HomePage();
  });

  beforeEach(async () => {
    await loginPage.open();
  });

  // ── Happy path ─────────────────────────────────────────────────────────────

  it('should display the login form', async () => {
    const title = await browser.getTitle();
    expect(title).toBeTruthy();
  });

  it('should show an error for invalid credentials', async () => {
    await loginPage.login(
      loginCredentials.invalid.username,
      loginCredentials.invalid.password,
    );

    const isErrorVisible = await loginPage.isErrorVisible();
    expect(isErrorVisible).toBe(true);
  });

  it('should navigate to the home page after a successful login', async () => {
    await loginPage.login(
      loginCredentials.valid.username,
      loginCredentials.valid.password,
    );

    const isProductListVisible = await homePage.isProductListVisible();
    expect(isProductListVisible).toBe(true);
  });

  // ── Sad path ───────────────────────────────────────────────────────────────

  it('should show an error for empty credentials', async () => {
    await loginPage.clickLogin();

    const isErrorVisible = await loginPage.isErrorVisible();
    expect(isErrorVisible).toBe(true);
  });
});
