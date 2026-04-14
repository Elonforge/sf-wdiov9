// ─── Environment ──────────────────────────────────────────────────────────────
export type Environment = 'dev' | 'staging' | 'prod';

export interface EnvConfig {
  baseUrl: string;
  apiBaseUrl: string;
  username: string;
  password: string;
  env: Environment;
}

// ─── API ──────────────────────────────────────────────────────────────────────
export interface ApiResponse<T = unknown> {
  status: number;
  data: T;
  headers: Record<string, string>;
}

export interface User {
  id: number;
  name: string;
  username: string;
  email: string;
  phone?: string;
  website?: string;
  address?: Address;
  company?: Company;
}

export interface Address {
  street: string;
  suite: string;
  city: string;
  zipcode: string;
}

export interface Company {
  name: string;
  catchPhrase: string;
  bs: string;
}

export interface Post {
  id: number;
  userId: number;
  title: string;
  body: string;
}

// ─── Page Object ──────────────────────────────────────────────────────────────
export interface NavigationOptions {
  waitForElement?: string;
  timeout?: number;
}
