import { expect } from '@wdio/globals';
import axios from 'axios';

/**
 * API tests against JSONPlaceholder (https://jsonplaceholder.typicode.com).
 * No credentials needed. Uses env vars with fallback defaults.
 */
describe('Users API', () => {
  const baseUrl = process.env.API_BASE_URL ?? 'https://jsonplaceholder.typicode.com';
  const userName = process.env.API_TEST_USER_NAME ?? 'Jane Doe';
  const userJob  = process.env.API_TEST_USER_JOB ?? 'Test Engineer';

  const api = axios.create({
    baseURL: baseUrl,
    headers: { 'Content-Type': 'application/json' },
    validateStatus: () => true,
  });

  it('GET /users — returns 200, non-empty array with id/email/name', async () => {
    const res = await api.get('/users');

    expect(res.status).toBe(200);
    expect(Array.isArray(res.data)).toBe(true);
    expect(res.data.length).toBeGreaterThan(0);

    const first = res.data[0];
    expect(first.id).toBeDefined();
    expect(first.email).toBeDefined();
    expect(first.name).toBeDefined();
  });

  it('GET /users/2 — returns 200 with id:2 and truthy email/name', async () => {
    const res = await api.get('/users/2');

    expect(res.status).toBe(200);
    expect(res.data.id).toBe(2);
    expect(res.data.email).toBeTruthy();
    expect(res.data.name).toBeTruthy();
  });

  it('GET /users/9999 — returns 404', async () => {
    const res = await api.get('/users/9999');

    expect(res.status).toBe(404);
  });

  it('POST /users — sends name/job, expects 201 with matching data and defined id', async () => {
    const payload = { name: userName, job: userJob };
    const res = await api.post('/users', payload);

    expect(res.status).toBe(201);
    expect(res.data.name).toBe(userName);
    expect(res.data.job).toBe(userJob);
    expect(res.data.id).toBeDefined();
  });

  it('PUT /users/2 — sends updated name/job, expects 200 with matching data', async () => {
    const payload = { name: 'Updated Name', job: 'Updated Job' };
    const res = await api.put('/users/2', payload);

    expect(res.status).toBe(200);
    expect(res.data.name).toBe(payload.name);
    expect(res.data.job).toBe(payload.job);
  });

  it('DELETE /users/2 — expects 200', async () => {
    const res = await api.delete('/users/2');

    expect(res.status).toBe(200);
  });
});
