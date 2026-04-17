import type { Options } from '@wdio/types';
import { config as dotenvConfig } from 'dotenv';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import allureReporter from '@wdio/allure-reporter';

// ── dotenv fallback chain ────────────────────────────────────────────────────
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

// ── Video → Allure attachment helper ─────────────────────────────────────────
// wdio-video-reporter v5 names files as:
//   <testTitle-kebab>-<workerCid>--<BROWSER>--<timestamp>.mp4
// We normalize the allure result test name the same way to match.
function normalizeForVideoMatch(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9 -]/g, '')
    .replace(/ /g, '-')
    .replace(/-{2,}/g, '-')
    .toLowerCase();
}

function attachVideosToAllureResults(): void {
  const allureDir = path.resolve('allure-results');
  const videoDir = path.resolve('_results_');
  if (!fs.existsSync(allureDir) || !fs.existsSync(videoDir)) return;

  // Patch stub .mp4 files (text pointers left by wdio-video-reporter)
  for (const f of fs.readdirSync(allureDir).filter(f => f.endsWith('.mp4'))) {
    const filePath = path.resolve(allureDir, f);
    if (fs.statSync(filePath).size < 1024) {
      const videoPath = fs.readFileSync(filePath, 'utf8').trim();
      if (fs.existsSync(videoPath)) {
        fs.copyFileSync(videoPath, filePath);
        console.log(`  Patched video stub: ${f}`);
      }
    }
  }

  // Collect videos
  const videos = fs.readdirSync(videoDir)
    .filter(f => f.endsWith('.mp4'))
    .map(f => ({ name: f, fullPath: path.resolve(videoDir, f) }));
  if (videos.length === 0) return;

  // Match each allure result JSON to a video by normalized test name
  const resultFiles = fs.readdirSync(allureDir).filter(f => f.endsWith('-result.json'));
  let attached = 0;

  for (const rf of resultFiles) {
    const rfPath = path.resolve(allureDir, rf);
    const result = JSON.parse(fs.readFileSync(rfPath, 'utf8'));
    const existingAttachments: Array<{ type?: string }> = result.attachments ?? [];

    if (existingAttachments.some(a => a.type === 'video/mp4')) continue;

    const normalized = normalizeForVideoMatch(result.name ?? '');
    const match = videos.find(v =>
      v.name.replace(/\.mp4$/, '').toLowerCase().startsWith(normalized),
    );

    if (match) {
      const attachName = `${crypto.randomUUID()}-attachment.mp4`;
      fs.copyFileSync(match.fullPath, path.resolve(allureDir, attachName));
      result.attachments = [
        ...existingAttachments,
        { name: 'Execution video', source: attachName, type: 'video/mp4' },
      ];
      fs.writeFileSync(rfPath, JSON.stringify(result, null, 2));
      console.log(`  Attached video to: ${result.name}`);
      attached++;
    }
  }

  console.log(`  Attached ${attached} video(s) to Allure results`);
}

export const config: Options.Testrunner = {
  autoCompileOpts: {
    tsNodeOpts: {
      project: './tsconfig.json',
      transpileOnly: true,
    },
  },

  runner: 'local',
  baseUrl: process.env.BASE_URL ?? 'https://demo.playwright.dev/todomvc',

  specs: ['./tests/**/*.spec.ts'],
  exclude: [],

  suites: {
    web: ['./tests/web/**/*.spec.ts'],
    api: ['./tests/api/**/*.spec.ts'],
  },

  maxInstances: isCI ? 1 : 5,
  capabilities: [
    {
      browserName: 'chrome',
      'goog:chromeOptions': { args: chromeArgs },
    },
  ],

  waitforTimeout: 10_000,
  connectionRetryTimeout: 120_000,
  connectionRetryCount: 3,

  framework: 'mocha',
  mochaOpts: {
    ui: 'bdd',
    timeout: 60_000,
    ...(isCI ? { forbidOnly: true } : {}),
  },

  specFileRetries: 0,

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

  outputDir: 'test-results',

  onPrepare() {
    console.log(
      `\nStarting tests | TEST_ENV: ${testEnv} | CI: ${isCI} | ` +
      `BASE_URL: ${process.env.BASE_URL} | headless: ${isHeadless}\n`,
    );
  },

  beforeTest() {
    const target = process.env.WDIO_TARGET;
    if (target) {
      allureReporter.addArgument('target', target);
    }
  },

  afterTest(test, _context, { error, passed }) {
    if (!passed) {
      void (async () => {
        try {
          const { browser } = await import('@wdio/globals');
          await browser.saveScreenshot(
            `test-results/screenshots/${test.title.replace(/\s+/g, '_')}.png`,
          );
        } catch {
          // screenshot best-effort
        }
      })();
      if (error) {
        console.error(`  x ${test.title} - ${(error as Error).message}`);
      }
    }
  },

  onComplete(_exitCode, _config, _capabilities, results) {
    const failed = (results as { failed?: number }).failed ?? 0;
    console.log(`\nRun complete | Failures: ${failed}\n`);
    attachVideosToAllureResults();
  },
};
