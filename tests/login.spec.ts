import { $, expect } from '@wdio/globals';
import { LoginPage } from '../pages/login.page';

/**
 * Login tests.
 * Skip entire describe block if TEST_USERNAME / TEST_PASSWORD are empty
 * or equal to placeholder values.
 */
const username = process.env.TEST_USERNAME ?? '';
const password = process.env.TEST_PASSWORD ?? '';
const isPlaceholder =
  !username ||
  !password ||
  username === 'your_username@example.com' ||
  password === 'your_password';

(isPlaceholder ? describe.skip : describe)('Login Page', () => {
  const loginPage = new LoginPage();

  beforeEach(async () => {
    await loginPage.goto();
  });

  it('should display login form', async () => {
    await loginPage.assertOnLoginPage();
  });

  it('should log in with valid credentials', async () => {
    await loginPage.loginAndExpectRedirect(username, password, '/');
  });

  it('should show error for invalid credentials', async () => {
    await loginPage.login('invalid_user', 'wrong_password');
    const error = await loginPage.getErrorMessage();
    expect(error).toBeTruthy();
  });

  it('should display forgot password link', async () => {
    const link = await $('a[href*="forgot"], [data-testid="forgot-password"]');
    await expect(link).toBeExisting();
  });
});
