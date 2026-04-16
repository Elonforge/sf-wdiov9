import { $, $$, browser } from '@wdio/globals';
import { expect } from '@wdio/globals';
import { BasePage } from './base.page';

/**
 * TodoPage — wraps the Playwright TodoMVC demo app.
 * URL read from TODO_APP_URL env var with fallback default.
 */
export class TodoPage extends BasePage {
  private get url(): string {
    return process.env.TODO_APP_URL ?? 'https://demo.playwright.dev/todomvc';
  }

  // ── Selectors ──────────────────────────────────────────────────────────────
  private get newTodoInput()   { return $('.new-todo'); }
  private get todoItems()      { return $$('.todo-list li'); }
  private get todoCount()      { return $('.todo-count'); }
  private get filterAll()      { return $('a[href="#/"]'); }
  private get filterActive()   { return $('a[href="#/active"]'); }
  private get filterCompleted(){ return $('a[href="#/completed"]'); }
  private get clearCompleted() { return $('.clear-completed'); }

  // ── Actions ────────────────────────────────────────────────────────────────

  async goto(): Promise<void> {
    await this.navigate(this.url);
    await this.waitForPageLoad();
  }

  async addTodo(text: string): Promise<void> {
    const input = await this.newTodoInput;
    await input.waitForDisplayed();
    await input.setValue(text);
    await browser.keys('Enter');
  }

  async getTodoCount(): Promise<number> {
    const items = await this.todoItems;
    return items.length;
  }

  async completeTodo(index: number): Promise<void> {
    const items = await this.todoItems;
    const toggle = await items[index].$('.toggle');
    await toggle.click();
  }

  async deleteTodo(index: number): Promise<void> {
    const items = await this.todoItems;
    const item = items[index];
    await item.moveTo();
    const destroyBtn = await item.$('.destroy');
    await destroyBtn.waitForDisplayed();
    await destroyBtn.click();
  }

  async getRemainingText(): Promise<string> {
    const el = await this.todoCount;
    await el.waitForDisplayed();
    return el.getText();
  }

  async getTodoText(index: number): Promise<string> {
    const items = await this.todoItems;
    const label = await items[index].$('label');
    return label.getText();
  }

  async isTodoCompleted(index: number): Promise<boolean> {
    const items = await this.todoItems;
    const className = await items[index].getAttribute('class');
    return (className ?? '').includes('completed');
  }

  // ── Filters ────────────────────────────────────────────────────────────────

  async clickFilterAll(): Promise<void> {
    const el = await this.filterAll;
    await el.click();
  }

  async clickFilterActive(): Promise<void> {
    const el = await this.filterActive;
    await el.click();
  }

  async clickFilterCompleted(): Promise<void> {
    const el = await this.filterCompleted;
    await el.click();
  }

  async clickClearCompleted(): Promise<void> {
    const el = await this.clearCompleted;
    await el.click();
  }

  // ── Assertions ─────────────────────────────────────────────────────────────

  async assertTodoCount(expected: number): Promise<void> {
    await browser.waitUntil(
      async () => (await this.getTodoCount()) === expected,
      { timeout: 5_000, timeoutMsg: `Expected ${expected} todos but found ${await this.getTodoCount()}` },
    );
  }

  async assertTodoText(index: number, text: string): Promise<void> {
    const actual = await this.getTodoText(index);
    expect(actual).toBe(text);
  }
}
