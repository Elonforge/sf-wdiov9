import type { Options } from '@wdio/types';
import { config as dotenvConfig } from 'dotenv';
import path from 'path';
import fs from 'fs';
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

export const config: Options.Testrunner = {
  // ── TypeScript compilation ────────────────────────────────────────────────
  autoCompileOpts: {
    tsNodeOpts: {
      project: './tsconfig.json',
      transpileOnly: true,
    },
  },

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
    },
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
      'video',
      {
        outputDir: '_results_',
        saveAllVideos: true,
        videoSlowdownMultiplier: 3,
        videoFormat: 'mp4',
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

    // ── Video → Allure attachment fix ──────────────────────────────────────
    // wdio-video-reporter v5 creates text-stub attachments in allure-results
    // (containing the video file path) and replaces them with actual mp4
    // binaries in its `onExit` handler. That handler depends on detecting
    // the allure reporter via runner.instanceOptions — which can fail when
    // WDIO resolves reporter names to full package paths. This fallback
    // scans for any remaining stubs and patches them reliably.
    const allureDir = path.resolve('allure-results');
    const videoDir = path.resolve('_results_');
    if (fs.existsSync(allureDir) && fs.existsSync(videoDir)) {
      const stubs = fs.readdirSync(allureDir)
        .filter(f => f.endsWith('.mp4'))
        .map(f => path.resolve(allureDir, f))
        .filter(f => fs.statSync(f).size < 1024);

      for (const stubPath of stubs) {
        const videoPath = fs.readFileSync(stubPath, 'utf8').trim();
        if (fs.existsSync(videoPath)) {
          fs.copyFileSync(videoPath, stubPath);
          console.log(`  📹 Patched video stub: ${path.basename(stubPath)}`);
        }
      }
    }
  },
};
