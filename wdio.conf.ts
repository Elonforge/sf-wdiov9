import type { Options, Capabilities } from '@wdio/types';
import { config as dotenvConfig } from 'dotenv';
import path from 'path';

// ── dotenv fallback chain ────────────────────────────────────────────────────
// 1. Load .env.{TEST_ENV} (defaults to "dev") — may not exist, that's OK
// 2. Load .env.example as fallback (override: false → won't overwrite existing vars)
const testEnv = process.env.TEST_ENV ?? 'dev';
dotenvConfig({ path: path.resolve(process.cwd(), `.env.${testEnv}`) });
dotenvConfig({ path: path.resolve(process.cwd(), '.env.example'), override: false });

// ── Derived settings ─────────────────────────────────────────────────────────
const isCI = !!process.env.CI;
const isHeadless = (process.env.HEADLESS ?? 'true').toLowerCase() !== 'false';

const chromeArgs = [
  '--no-sandbox',
  '--disable-dev-shm-usage',
  '--disable-gpu',
  '--remote-debugging-port=0',
  '--window-size=1920,1080',
  ...(isHeadless ? ['--headless=new'] : []),
];

const firefoxArgs = isHeadless ? ['-headless'] : [];

export const config: Options.Testrunner & Capabilities.WithRequestedTestrunnerCapabilities = {
  // ── Runner ─────────────────────────────────────────────────────────────────
  runner: 'local',

  // ── Base URL ───────────────────────────────────────────────────────────────
  baseUrl: process.env.BASE_URL ?? 'https://demo.playwright.dev/todomvc',

  // ── Specs ──────────────────────────────────────────────────────────────────
  specs: ['./tests/**/*.spec.ts'],
  exclude: [],

  suites: {
    web: ['./tests/web/**/*.spec.ts'],
    api: ['./tests/api/**/*.spec.ts'],
    login: ['./tests/login.spec.ts'],
    home: ['./tests/home.spec.ts'],
  },

  // ── Capabilities ───────────────────────────────────────────────────────────
  // Web browser capabilities exclude API tests.
  // API capability runs only tests/api/ with no real browser needed.
  maxInstances: isCI ? 1 : 5,
  capabilities: [
    {
      browserName: 'chrome',
      'goog:chromeOptions': { args: chromeArgs },
      specs: ['./tests/web/**/*.spec.ts', './tests/login.spec.ts', './tests/home.spec.ts'],
      exclude: ['./tests/api/**/*.spec.ts'],
    } as WebdriverIO.Capabilities,
    {
      browserName: 'firefox',
      'moz:firefoxOptions': { args: firefoxArgs },
      specs: ['./tests/web/**/*.spec.ts', './tests/login.spec.ts', './tests/home.spec.ts'],
      exclude: ['./tests/api/**/*.spec.ts'],
    } as WebdriverIO.Capabilities,
    {
      // API tests — use Chrome headless as a lightweight session host
      browserName: 'chrome',
      'goog:chromeOptions': { args: ['--headless=new', '--no-sandbox', '--disable-dev-shm-usage'] },
      specs: ['./tests/api/**/*.spec.ts'],
    } as WebdriverIO.Capabilities,
  ],

  // ── Timeouts ───────────────────────────────────────────────────────────────
  waitforTimeout: 10_000,
  connectionRetryTimeout: 120_000,
  connectionRetryCount: 3,

  // ── Framework ──────────────────────────────────────────────────────────────
  framework: 'mocha',
  mochaOpts: {
    ui: 'bdd',
    timeout: 60_000,
    ...(isCI ? { forbidOnly: true } : {}),
  },

  // ── Retries ────────────────────────────────────────────────────────────────
  specFileRetries: isCI ? 2 : 0,

  // ── Reporters ──────────────────────────────────────────────────────────────
  reporters: [
    'spec',
    [
      'allure',
      {
        outputDir: 'allure-results',
        disableWebdriverStepsReporting: false,
        disableWebdriverScreenshotsReporting: false,
      },
    ],
  ],

  // ── Output ─────────────────────────────────────────────────────────────────
  outputDir: 'test-results',

  // ── Hooks ──────────────────────────────────────────────────────────────────
  onPrepare() {
    console.log(
      `\n🚀  Starting tests | TEST_ENV: ${testEnv} | CI: ${isCI} | ` +
      `BASE_URL: ${process.env.BASE_URL} | headless: ${isHeadless}\n`,
    );
  },

  afterTest(test, _context, { error, passed }) {
    if (!passed) {
      // Screenshot on failure is handled by WDIO's built-in afterTest hook
      void (async () => {
        try {
          const { browser } = await import('@wdio/globals');
          await browser.saveScreenshot(
            `test-results/screenshots/${test.title.replace(/\s+/g, '_')}.png`,
          );
        } catch {
          // ignore — screenshot best-effort
        }
      })();
      if (error) {
        console.error(`  ✗ ${test.title} — ${(error as Error).message}`);
      }
    }
  },

  onComplete(_exitCode, _config, _capabilities, results) {
    const failed = (results as { failed?: number }).failed ?? 0;
    console.log(`\n✅  Run complete | Failures: ${failed}\n`);
  },
};
