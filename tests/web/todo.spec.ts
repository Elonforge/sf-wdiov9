import { expect, browser } from '@wdio/globals';
import { TodoPage } from '../../pages/todo.page';

describe('TodoMVC', () => {
  const todoPage = new TodoPage();

  beforeEach(async () => {
    await todoPage.goto();
    await browser.execute('localStorage.clear()');
    await browser.refresh();
  });

  it('should add a new todo item', async () => {
    await todoPage.addTodo('Buy groceries');
    await todoPage.assertTodoCount(1);
    await todoPage.assertTodoText(0, 'Buy groceries');
  });

  it('should add multiple todo items', async () => {
    await todoPage.addTodo('Item 1');
    await todoPage.addTodo('Item 2');
    await todoPage.addTodo('Item 3');

    await todoPage.assertTodoCount(3);
    await todoPage.assertTodoText(0, 'Item 1');
    await todoPage.assertTodoText(1, 'Item 2');
    await todoPage.assertTodoText(2, 'Item 3');
  });

  it('should mark a todo item as completed', async () => {
    await todoPage.addTodo('Complete me');
    await todoPage.completeTodo(0);

    const isCompleted = await todoPage.isTodoCompleted(0);
    expect(isCompleted).toBe(true);
  });

  it('should display correct remaining items count', async () => {
    await todoPage.addTodo('Task 1');
    await todoPage.addTodo('Task 2');
    await todoPage.addTodo('Task 3');
    await todoPage.completeTodo(0);

    const remaining = await todoPage.getRemainingText();
    expect(remaining).toContain('2');
  });

  it('should filter active and completed todos', async () => {
    await todoPage.addTodo('Active task');
    await todoPage.addTodo('Completed task');
    await todoPage.completeTodo(1);

    // Filter Active — should show 1 item
    await todoPage.clickFilterActive();
    await todoPage.assertTodoCount(1);

    // Filter Completed — should show 1 item
    await todoPage.clickFilterCompleted();
    await todoPage.assertTodoCount(1);

    // Filter All — should show 2 items
    await todoPage.clickFilterAll();
    await todoPage.assertTodoCount(2);
  });

  it('should delete a todo item', async () => {
    await todoPage.addTodo('Keep me');
    await todoPage.addTodo('Delete me');

    await todoPage.deleteTodo(0);

    await todoPage.assertTodoCount(1);
    await todoPage.assertTodoText(0, 'Delete me');
  });

  // Long-running end-to-end flow — deliberately exercises many commands so
  // that wdio-video-reporter has plenty of frames to encode. Useful as a
  // smoke test for the Allure video attachment in CI.
  it('should handle a full lifecycle of adding, completing, filtering and clearing', async () => {
    const items = [
      'Write spec',
      'Review PR',
      'Deploy build',
      'Update docs',
      'Notify team',
      'Archive ticket',
      'Sync calendar',
      'Run retro',
    ];

    for (const text of items) {
      await todoPage.addTodo(text);
      await browser.pause(250);
    }
    await todoPage.assertTodoCount(items.length);

    for (let i = 0; i < items.length; i += 2) {
      await todoPage.completeTodo(i);
      await browser.pause(200);
    }

    await todoPage.clickFilterActive();
    await browser.pause(300);
    await todoPage.assertTodoCount(items.length / 2);

    await todoPage.clickFilterCompleted();
    await browser.pause(300);
    await todoPage.assertTodoCount(items.length / 2);

    await todoPage.clickFilterAll();
    await browser.pause(300);
    await todoPage.assertTodoCount(items.length);

    await todoPage.deleteTodo(0);
    await todoPage.deleteTodo(0);
    await todoPage.assertTodoCount(items.length - 2);

    const remaining = await todoPage.getRemainingText();
    expect(remaining).toMatch(/\d+/);
  });
});
