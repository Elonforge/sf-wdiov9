# sf-webdriverio

A **WebDriverIO v9 + TypeScript** test-automation skeleton that supports both **web UI testing** and **REST API testing**, uses a **Page Object Model**, supports **multi-environment configuration** via dotenv, and includes a **GitHub Actions CI** workflow with a dynamic matrix strategy, blob/merged Allure reporting, and GitHub Pages deployment with history.

---

## 📁 Project Structure

```
sf-webdriverio/
├── .github/
│   └── workflows/
│       └── ci.yml              # CI pipeline (matrix × browser × env, Allure, GH Pages)
├── src/
│   ├── config/
│   │   ├── wdio.base.conf.ts   # Shared WebDriverIO configuration
│   │   ├── wdio.chrome.conf.ts # Chrome-specific overrides
│   │   └── wdio.firefox.conf.ts# Firefox-specific overrides
│   ├── data/
│   │   ├── envConfig.ts        # Typed environment variable loader
│   │   └── testData.ts         # Static test fixtures
│   ├── helpers/
│   │   └── ApiHelper.ts        # Axios-based REST API helper
│   ├── pages/
│   │   ├── BasePage.ts         # Abstract base page with shared helpers
│   │   ├── LoginPage.ts        # Login page object
│   │   └── HomePage.ts         # Home/inventory page object
│   └── types/
│       └── index.ts            # Shared TypeScript interfaces & types
├── test/
│   ├── specs/
│   │   ├── api/
│   │   │   └── users.api.spec.ts  # REST API test examples
│   │   └── ui/
│   │       └── login.spec.ts      # UI test examples (Page Object Model)
│   └── utils/
│       └── mergeDeep.ts           # Deep-merge utility for WDIO configs
├── .env.dev                    # Dev environment variables (placeholder values)
├── .env.staging                # Staging environment variables (placeholder values)
├── .env.example                # Template — copy to .env.<env> and fill in values
├── package.json
├── tsconfig.json
└── README.md
```

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** ≥ 18
- **Chrome** or **Firefox** installed locally

### Install

```bash
npm install
```

### Configure environment

```bash
# Copy and fill in your own values
cp .env.example .env.dev
```

### Run tests

```bash
# Run all tests (Chrome, dev environment)
npm test

# Run UI tests only
npm run test:ui

# Run API tests only
npm run test:api

# Run on a specific browser
npm run test:chrome
npm run test:firefox

# Run against a specific environment
npm run test:env:dev
npm run test:env:staging
```

### Generate & open Allure report

```bash
npm run report:generate
npm run report:open
```

---

## 🌍 Multi-Environment Configuration (dotenv)

The framework loads the correct `.env.<ENV>` file at startup based on the `ENV` environment variable (defaults to `dev`).

| Variable | Description |
|---|---|
| `ENV` | Target environment (`dev` \| `staging` \| `prod`) |
| `BASE_URL` | Application URL for UI tests |
| `API_BASE_URL` | Base URL for REST API tests |
| `TEST_USERNAME` | Login username for UI tests |
| `TEST_PASSWORD` | Login password for UI tests |

> **Tip:** The `.env.dev` and `.env.staging` files committed here contain only placeholder values. Override them with real values locally or via GitHub Secrets in CI.

---

## 🏗 Architecture

### Page Object Model

Every page extends `BasePage`, which provides:
- `open()` — navigate to the page and wait for a key element
- `waitForSelector()` / `waitForText()` — explicit waits
- `clickElement()` / `typeText()` / `getText()` — safe interaction helpers
- `isVisible()` — non-throwing visibility check
- `takeScreenshot()` — save screenshot to `allure-results/`

Concrete pages (e.g. `LoginPage`, `HomePage`) add their own selectors and actions and are instantiated directly in spec files.

### REST API Helper

`ApiHelper` wraps Axios and provides typed `get / post / put / patch / delete` methods that:
- Never throw on non-2xx status codes (let tests assert the status)
- Return a consistent `ApiResponse<T>` shape (`status`, `data`, `headers`)
- Support optional Bearer-token injection via `setBearerToken()`

### Config merging

`wdio.chrome.conf.ts` and `wdio.firefox.conf.ts` use a `mergeDeep()` utility to merge browser-specific options on top of `wdio.base.conf.ts`, keeping the base config as the single source of truth for shared settings.

---

## ⚙️ CI / GitHub Actions

The workflow (`.github/workflows/ci.yml`) runs on every push / PR to `main`, `master`, or `develop`, and can be triggered manually via `workflow_dispatch`.

### Pipeline stages

```
install → test (matrix) → report & deploy
```

#### Stage 1 — Install

Installs dependencies and caches `node_modules`.

#### Stage 2 — Test (Dynamic Matrix)

Runs tests in **parallel** across a matrix of:

| Dimension | Values |
|---|---|
| `browser` | `chrome`, `firefox` |
| `environment` | `dev`, `staging` |

Each matrix combination uploads its raw Allure result files as a **blob artifact** named `allure-results-<browser>-<environment>`.

#### Stage 3 — Report

1. **Downloads** all blob artifacts and merges them into a single `allure-results/` folder.
2. **Restores Allure history** from the `gh-pages` branch (preserves run history across builds).
3. **Generates** the merged Allure HTML report via `simple-elf/allure-report-action`.
4. **Deploys** the report to **GitHub Pages** (`gh-pages` branch) using `peaceiris/actions-gh-pages`.
5. **Uploads** the generated HTML report as a merged artifact for download.

### GitHub Pages setup

1. Go to **Settings → Pages** in your repository.
2. Set **Source** to `Deploy from a branch` → branch `gh-pages`, folder `/ (root)`.
3. The report will be available at `https://<org>.github.io/<repo>/allure-report/`.

### Secrets

Configure these in **Settings → Secrets and variables → Actions**:

| Secret | Example |
|---|---|
| `BASE_URL_DEV` | `https://dev.example.com` |
| `BASE_URL_STAGING` | `https://staging.example.com` |
| `API_BASE_URL_DEV` | `https://api-dev.example.com` |
| `API_BASE_URL_STAGING` | `https://api-staging.example.com` |
| `TEST_USERNAME_DEV` | `dev-user@example.com` |
| `TEST_PASSWORD_DEV` | `dev-password` |
| `TEST_USERNAME_STAGING` | `staging-user@example.com` |
| `TEST_PASSWORD_STAGING` | `staging-password` |

---

## 📦 Key Dependencies

| Package | Purpose |
|---|---|
| `@wdio/cli` | WebDriverIO test runner |
| `@wdio/mocha-framework` | Mocha BDD test framework |
| `@wdio/allure-reporter` | Allure result generation |
| `@wdio/spec-reporter` | Console output |
| `axios` | HTTP client for API tests |
| `dotenv` | Environment variable loading |
| `typescript` + `ts-node` | TypeScript compilation |
| `allure-commandline` | Local report generation |
