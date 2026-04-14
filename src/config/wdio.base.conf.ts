import type { Options, Capabilities } from '@wdio/types';
import { config as loadEnv } from 'dotenv';
import path from 'path';

// ── Load environment-specific .env file ──────────────────────────────────────
const env = process.env.ENV ?? 'dev';
loadEnv({ path: path.resolve(process.cwd(), `.env.${env}`) });

export const config: Options.Testrunner & Capabilities.WithRequestedTestrunnerCapabilities = {
  // ── Runner ─────────────────────────────────────────────────────────────────
  runner: 'local',

  // ── Test Suites ────────────────────────────────────────────────────────────
  suites: {
    ui: ['test/specs/ui/**/*.spec.ts'],
    api: ['test/specs/api/**/*.spec.ts'],
    all: ['test/specs/**/*.spec.ts'],
  },

  // Default spec pattern (runs everything when no suite is specified)
  specs: ['test/specs/**/*.spec.ts'],
  exclude: [],

  // ── Browser / Capabilities (overridden per-browser config) ─────────────────
  maxInstances: 5,
  capabilities: [
    {
      browserName: 'chrome',
      'goog:chromeOptions': {
        args: ['--headless', '--no-sandbox', '--disable-dev-shm-usage'],
      },
    },
  ],

  // ── Timeouts ───────────────────────────────────────────────────────────────
  waitforTimeout: 10000,
  connectionRetryTimeout: 120000,
  connectionRetryCount: 3,

  // ── Framework ─────────────────────────────────────────────────────────────
  framework: 'mocha',
  mochaOpts: {
    ui: 'bdd',
    timeout: 60000,
  },

  // ── Reporters ─────────────────────────────────────────────────────────────
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

  // ── Hooks ─────────────────────────────────────────────────────────────────
  onPrepare() {
    console.log(`\n🚀  Starting tests | ENV: ${env} | BASE_URL: ${process.env.BASE_URL}\n`);
  },

  beforeSuite(suite) {
    console.log(`\n▶  Suite: ${suite.title}`);
  },

  afterTest(test, _context, { error, passed }) {
    if (!passed) {
      console.error(`  ✗ ${test.title} — ${(error as Error | undefined)?.message}`);
    }
  },

  onComplete(_exitCode, _config, _capabilities, results) {
    const failed = (results as { failed?: number }).failed ?? 0;
    console.log(`\n✅  Run complete | Failures: ${failed}\n`);
  },
};
