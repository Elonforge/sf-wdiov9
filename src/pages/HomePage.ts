import { BasePage } from './BasePage';

/**
 * HomePage — represents the page a user lands on after a successful login.
 *
 * Selectors target the Sauce Demo inventory page.
 * Replace with your application's real selectors.
 */
export class HomePage extends BasePage {
  protected path = '/inventory.html';

  // ── Selectors ──────────────────────────────────────────────────────────────

  private readonly selectors = {
    pageTitle: '.title',
    productList: '.inventory_list',
    productItem: '.inventory_item',
    cartBadge: '.shopping_cart_badge',
    menuButton: '#react-burger-menu-btn',
    logoutLink: '#logout_sidebar_link',
  } as const;

  // ── Actions ────────────────────────────────────────────────────────────────

  async open(): Promise<void> {
    await super.open({ waitForElement: this.selectors.productList });
  }

  async logout(): Promise<void> {
    await this.clickElement(this.selectors.menuButton);
    await this.waitForSelector(this.selectors.logoutLink);
    await this.clickElement(this.selectors.logoutLink);
  }

  // ── Assertions / state queries ─────────────────────────────────────────────

  async getPageTitle(): Promise<string> {
    return this.getText(this.selectors.pageTitle);
  }

  async isProductListVisible(): Promise<boolean> {
    return this.isVisible(this.selectors.productList);
  }

  async getCartCount(): Promise<number> {
    const visible = await this.isVisible(this.selectors.cartBadge);
    if (!visible) return 0;
    const text = await this.getText(this.selectors.cartBadge);
    return parseInt(text, 10);
  }
}
