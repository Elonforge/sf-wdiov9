import { expect } from '@wdio/globals';
import { ApiHelper } from '../../../src/helpers/ApiHelper';
import type { User, Post } from '../../../src/types/index';
import { testPosts } from '../../../src/data/testData';

/**
 * API Spec — JSONPlaceholder REST API
 *
 * Uses https://jsonplaceholder.typicode.com as the demo API endpoint.
 * The API_BASE_URL env var selects the environment.
 *
 * These are skeleton tests that demonstrate the ApiHelper pattern.
 * Replace the endpoints and assertions for your real API.
 */
describe('Users API', () => {
  let api: ApiHelper;

  before(() => {
    // Fall back to the public demo API when no env var is set
    const baseUrl = process.env.API_BASE_URL ?? 'https://jsonplaceholder.typicode.com';
    api = new ApiHelper(baseUrl);
  });

  // ── GET /users ─────────────────────────────────────────────────────────────

  it('GET /users — should return a list of users with status 200', async () => {
    const response = await api.get<User[]>('/users');

    expect(response.status).toBe(200);
    expect(Array.isArray(response.data)).toBe(true);
    expect(response.data.length).toBeGreaterThan(0);
  });

  it('GET /users/1 — should return the first user', async () => {
    const response = await api.get<User>('/users/1');

    expect(response.status).toBe(200);
    expect(response.data.id).toBe(1);
    expect(typeof response.data.name).toBe('string');
    expect(typeof response.data.email).toBe('string');
  });

  it('GET /users/9999 — should return 404 for a non-existent user', async () => {
    const response = await api.get<unknown>('/users/9999');

    expect(response.status).toBe(404);
  });

  // ── POST /posts ────────────────────────────────────────────────────────────

  it('POST /posts — should create a new post and return 201', async () => {
    const payload = testPosts[0];
    const response = await api.post<Post>('/posts', payload);

    expect(response.status).toBe(201);
    expect(response.data.title).toBe(payload.title);
    expect(response.data.body).toBe(payload.body);
    expect(typeof response.data.id).toBe('number');
  });

  // ── PUT /posts/1 ───────────────────────────────────────────────────────────

  it('PUT /posts/1 — should update a post and return 200', async () => {
    const updated: Partial<Post> = {
      id: 1,
      userId: 1,
      title: 'Updated Title',
      body: 'Updated body.',
    };

    const response = await api.put<Post>('/posts/1', updated);

    expect(response.status).toBe(200);
    expect(response.data.title).toBe(updated.title);
  });

  // ── DELETE /posts/1 ────────────────────────────────────────────────────────

  it('DELETE /posts/1 — should delete a post and return 200', async () => {
    const response = await api.delete('/posts/1');

    expect(response.status).toBe(200);
  });
});
