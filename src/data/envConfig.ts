import type { EnvConfig, Environment } from '../types/index';

/**
 * Reads environment variables (already loaded via dotenv in wdio.base.conf.ts)
 * and returns a typed configuration object.
 */
export function getEnvConfig(): EnvConfig {
  const env = (process.env.ENV ?? 'dev') as Environment;

  return {
    env,
    baseUrl: requireEnv('BASE_URL'),
    apiBaseUrl: requireEnv('API_BASE_URL'),
    username: requireEnv('TEST_USERNAME'),
    password: requireEnv('TEST_PASSWORD'),
  };
}

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}
