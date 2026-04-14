import axios, { type AxiosInstance, type AxiosResponse } from 'axios';
import type { ApiResponse } from '../types/index';

/**
 * Thin wrapper around Axios for REST API testing.
 * Provides typed helpers for GET / POST / PUT / DELETE requests and
 * automatic assertion-friendly response shaping.
 */
export class ApiHelper {
  private readonly client: AxiosInstance;

  constructor(baseUrl?: string) {
    const url = baseUrl ?? process.env.API_BASE_URL ?? '';
    if (!url) {
      throw new Error('ApiHelper: API_BASE_URL is not set and no baseUrl was provided.');
    }

    this.client = axios.create({
      baseURL: url,
      headers: { 'Content-Type': 'application/json' },
      validateStatus: () => true, // Never throw on non-2xx — let tests assert status
    });
  }

  /** Set (or clear) a Bearer token on all subsequent requests. */
  setBearerToken(token: string | null): void {
    if (token) {
      this.client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete this.client.defaults.headers.common['Authorization'];
    }
  }

  async get<T = unknown>(path: string): Promise<ApiResponse<T>> {
    const response: AxiosResponse<T> = await this.client.get(path);
    return this.toApiResponse(response);
  }

  async post<T = unknown>(path: string, body: unknown): Promise<ApiResponse<T>> {
    const response: AxiosResponse<T> = await this.client.post(path, body);
    return this.toApiResponse(response);
  }

  async put<T = unknown>(path: string, body: unknown): Promise<ApiResponse<T>> {
    const response: AxiosResponse<T> = await this.client.put(path, body);
    return this.toApiResponse(response);
  }

  async patch<T = unknown>(path: string, body: unknown): Promise<ApiResponse<T>> {
    const response: AxiosResponse<T> = await this.client.patch(path, body);
    return this.toApiResponse(response);
  }

  async delete<T = unknown>(path: string): Promise<ApiResponse<T>> {
    const response: AxiosResponse<T> = await this.client.delete(path);
    return this.toApiResponse(response);
  }

  // ── Private ────────────────────────────────────────────────────────────────

  private toApiResponse<T>(response: AxiosResponse<T>): ApiResponse<T> {
    return {
      status: response.status,
      data: response.data,
      headers: response.headers as Record<string, string>,
    };
  }
}
