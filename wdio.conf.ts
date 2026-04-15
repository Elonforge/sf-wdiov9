import type { Options, Capabilities } from '@wdio/types';
import { config as dotenvConfig } from 'dotenv';
import path from 'path';
import video from 'wdio-video-reporter';
import allureReporter from '@wdio/allure-reporter';

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
  '--disable-gpu',
  '--disable-dev-shm-usage',
  '--disable-extensions',
  '--no-first-run',
  '--no-default-browser-check',
  '--remote-debugging-pipe',
  `--user-data-dir=${path.join(
    process.env.RUNNER_TEMP ?? process.env.TEMP ?? '/tmp',
    `chrome-profile-${process.pid}-${Date.now()}`,
  )}`,
  '--window-size=1920,1080',
  ...(isHeadless ? ['--headless=new'] : []),
];

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
  },

  // ── Capabilities ───────────────────────────────────────────────────────────
  // Single Chrome capability. Spec selection is handled by the top-level
  // `specs` glob + `suites` map + CLI flags (--suite / --spec). API tests
  // re-use the same Chrome session as a lightweight host for HTTP calls.
  maxInstances: isCI ? 1 : 5,
  capabilities: [
    {
      browserName: 'chrome',
      'goog:chromeOptions': { args: chromeArgs },
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
  // Intentionally 0 in CI so flaky tests surface in the Allure report rather
  // than being masked by silent reruns. Investigate & fix, don't retry.
  specFileRetries: 0,

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
    [
      video,
      {
        outputDir: '_results_',
        saveAllVideos: true,
        videoSlowdownMultiplier: 3,
        videoFormat: 'mp4',
        // Default is 5000ms — too tight for ffmpeg on Windows CI, leaves the
        // Allure attachment as a text stub containing the video path (Allure
        // then serves it as video/mp4 → 0:00, unplayable). 60s is comfortable.
        videoRenderTimeout: 60_000,
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

  beforeTest() {
    // Tag every test with the matrix target from CI so that runs across
    // matrix legs don't collapse into a single entry via Allure's historyId
    // (which otherwise dedupes identical test names — e.g. running the
    // "api" suite and "./tests/api/users.spec.ts" as two targets would
    // otherwise merge into one set of 6 Users API tests instead of 12).
    const target = process.env.WDIO_TARGET;
    if (target) {
      allureReporter.addArgument('target', target);
    }
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
