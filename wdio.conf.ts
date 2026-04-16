import type { Options } from '@wdio/types';
import { config as dotenvConfig } from 'dotenv';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
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

    // ── Video → Allure attachment ─────────────────────────────────────────
    // wdio-video-reporter's built-in allure integration depends on matching
    // the reporter name via runner.instanceOptions, which fails in WDIO v8
    // (reporter resolves to '@wdio/allure-reporter' instead of 'allure').
    // This hook directly injects videos into allure result JSON files.
    const allureDir = path.resolve('allure-results');
    const videoDir = path.resolve('_results_');
    if (!fs.existsSync(allureDir) || !fs.existsSync(videoDir)) return;

    // Step 1: Patch any existing stubs (text files containing a video path)
    const allureFiles = fs.readdirSync(allureDir);
    for (const f of allureFiles.filter(f => f.endsWith('.mp4'))) {
      const filePath = path.resolve(allureDir, f);
      if (fs.statSync(filePath).size < 1024) {
        const videoPath = fs.readFileSync(filePath, 'utf8').trim();
        if (fs.existsSync(videoPath)) {
          fs.copyFileSync(videoPath, filePath);
          console.log(`  📹 Patched video stub: ${f}`);
        }
      }
    }

    // Step 2: Collect all video files from the video reporter output
    const videos = fs.readdirSync(videoDir)
      .filter(f => f.endsWith('.mp4'))
      .map(f => ({ name: f, fullPath: path.resolve(videoDir, f) }));
    if (videos.length === 0) return;

    // Step 3: For each allure result JSON, try to match a video and attach it
    const resultFiles = allureFiles.filter(f => f.endsWith('-result.json'));
    let attached = 0;
    for (const rf of resultFiles) {
      const rfPath = path.resolve(allureDir, rf);
      const result = JSON.parse(fs.readFileSync(rfPath, 'utf8'));

      // Skip if this result already has a video attachment
      const existingAttachments: Array<{ type?: string }> = result.attachments ?? [];
      if (existingAttachments.some(a => a.type === 'video/mp4')) continue;

      // Build a normalized name to match against video filenames
      // Video files are named: SuiteTitle--TestTitle.mp4 (spaces → dashes)
      const testFullName = [
        ...(result.labels ?? [])
          .filter((l: { name: string }) => l.name === 'suite' || l.name === 'parentSuite')
          .map((l: { value: string }) => l.value),
        result.name,
      ]
        .filter(Boolean)
        .join('--')
        .replace(/ /g, '-')
        .replace(/-{2,}/g, '-');

      const match = videos.find(v => {
        const vName = v.name.replace(/\.mp4$/, '');
        return vName === testFullName
          || vName.endsWith(`--${(result.name ?? '').replace(/ /g, '-')}`);
      });

      if (match) {
        const attachId = crypto.randomUUID();
        const attachName = `${attachId}-attachment.mp4`;
        fs.copyFileSync(match.fullPath, path.resolve(allureDir, attachName));

        result.attachments = [
          ...existingAttachments,
          { name: 'Execution video', source: attachName, type: 'video/mp4' },
        ];
        fs.writeFileSync(rfPath, JSON.stringify(result, null, 2));
        console.log(`  📹 Attached video to: ${result.name}`);
        attached++;
      }
    }
    console.log(`  📹 Attached ${attached} video(s) to Allure results`);
  },
};
