import { LoginPage } from '../pages/login.page';
import { HomePage } from '../pages/home.page';

/**
 * Home page tests.
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

(isPlaceholder ? describe.skip : describe)('Home Page', () => {
  const loginPage = new LoginPage();
  const homePage  = new HomePage();

  beforeEach(async () => {
    await loginPage.goto();
    await loginPage.loginAndExpectRedirect(username, password, '/');
  });

  it('should display the home page heading', async () => {
    const heading = await homePage.getHeadingText();
    expect(heading).toBeTruthy();
  });

  it('should be on the home page', async () => {
    await homePage.assertOnHomePage();
  });

  it('should display navigation links', async () => {
    const count = await homePage.getNavigationLinkCount();
    expect(count).toBeGreaterThan(0);
  });

  it('should log out successfully', async () => {
    await homePage.logout();

    // Verify redirected back to login page
    const { browser } = await import('@wdio/globals');
    await browser.waitUntil(
      async () => {
        const url = await browser.getUrl();
        return url.includes('/login');
      },
      { timeout: 10_000, timeoutMsg: 'Expected redirect to /login after logout' },
    );
  });
});
