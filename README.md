# sf-webdriverio

A **WebDriverIO v9 + TypeScript** test-automation skeleton that supports both **web UI testing** and **REST API testing**, uses a **Page Object Model**, supports **multi-environment configuration** via dotenv with a fallback chain, and includes a **GitHub Actions CI** workflow with a dynamic matrix strategy, blob/merged Allure reporting, and GitHub Pages deployment with history.

---

## 📁 Project Structure

```
sf-webdriverio/
├── .github/
│   └── workflows/
│       └── wdio.yml               # CI pipeline (4-job: prepare → test → merge-reports → deploy)
├── pages/
│   ├── base.page.ts               # Base page object (navigate, waitForPageLoad, getTitle, takeScreenshot)
│   ├── todo.page.ts               # TodoMVC page object (add, complete, delete, filter todos)
│   ├── login.page.ts              # Login page object (login, error handling, assertions)
│   └── home.page.ts               # Home/dashboard page object (heading, nav, logout)
├── tests/
│   ├── web/
│   │   └── todo.spec.ts           # 6 TodoMVC web UI tests
│   ├── api/
│   │   └── users.spec.ts          # 6 JSONPlaceholder API tests
│   ├── login.spec.ts              # 4 login tests (skipped with placeholder creds)
│   └── home.spec.ts               # 4 home page tests (skipped with placeholder creds)
├── .env.example                   # Committed — fallback env vars (sample tests work out of the box)
├── wdio.conf.ts                   # WebDriverIO configuration (dotenv, capabilities, reporters, hooks)
├── package.json
├── tsconfig.json
└── README.md
```

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** ≥ 18
- **Chrome** and/or **Firefox** installed locally

### Install

```bash
npm install
```

### Run tests

Sample tests (TodoMVC + JSONPlaceholder API) work immediately — no configuration needed.

```bash
# Run all tests (all capabilities)
npm test

# Run web UI tests only
npm run test:web

# Run API tests only
npm run test:api

# Run sample tests (web + api)
npm run test:sample

# Run against a specific environment
npm run test:dev
npm run test:staging
npm run test:prod

# Run headed (visible browser)
npm run test:headed

# Debug mode
npm run test:debug

# Generate & open Allure report
npm run test:report
```

---

## 🌍 Environment Configuration (dotenv)

The framework uses a **dotenv fallback chain**:

1. Load `.env.{TEST_ENV}` (where `TEST_ENV` defaults to `dev`) — this file may not exist
2. Load `.env.example` as fallback (`override: false` — won't overwrite existing vars)

This means **sample tests work immediately after cloning** — no `.env.dev` file needed.

### Environment Variables

| Variable | Description | Default |
|---|---|---|
| `BASE_URL` | Application URL for web tests | `https://demo.playwright.dev/todomvc` |
| `TODO_APP_URL` | TodoMVC app URL | `https://demo.playwright.dev/todomvc` |
| `API_BASE_URL` | Base URL for REST API tests | `https://jsonplaceholder.typicode.com` |
| `API_TEST_USER_NAME` | Name for API POST/PUT tests | `Jane Doe` |
| `API_TEST_USER_JOB` | Job for API POST/PUT tests | `Test Engineer` |
| `TEST_USERNAME` | Login username (custom app) | `your_username@example.com` |
| `TEST_PASSWORD` | Login password (custom app) | `your_password` |
| `HEADLESS` | Run browsers headless | `true` |
| `TEST_ENV` | Environment name | `dev` |

> **Note:** `.env.dev`, `.env.staging`, `.env.prod` are all git-ignored. Only `.env.example` is committed.

---

## 🏗 Architecture

### WebDriverIO Configuration (`wdio.conf.ts`)

- **dotenv fallback chain** — loads `.env.{TEST_ENV}` then `.env.example`
- **baseUrl** from `process.env.BASE_URL`
- **Headless** controlled by `HEADLESS` env var
- **Capabilities**: Chrome + Firefox for web tests (exclude `tests/api/`), dedicated Chrome headless for API tests (only `tests/api/`)
- **CI mode**: `specFileRetries: 2`, `maxInstances: 1`, `forbidOnly: true`
- **Local mode**: `specFileRetries: 0`, `maxInstances: 5`
- **Reporters**: spec (console) + Allure (HTML)
- **Screenshots on failure** saved to `test-results/screenshots/`
- **Output directory**: `test-results/`

### Page Object Model

| Page Object | Description |
|---|---|
| `BasePage` | `navigate(path)`, `waitForPageLoad()`, `getTitle()`, `takeScreenshot(name)` |
| `TodoPage` | TodoMVC: `goto()`, `addTodo()`, `getTodoCount()`, `completeTodo()`, `deleteTodo()`, `getRemainingText()`, filters, assertions |
| `LoginPage` | Login form: `goto()`, `login()`, `loginAndExpectRedirect()`, `getErrorMessage()`, `assertOnLoginPage()` |
| `HomePage` | Dashboard: `goto()`, `logout()`, `getHeadingText()`, `assertOnHomePage()`, `getNavigationLinkCount()` |

### Test Specs

| Spec | Tests | Target |
|---|---|---|
| `tests/web/todo.spec.ts` | 6 tests | TodoMVC demo (no credentials) |
| `tests/api/users.spec.ts` | 6 tests | JSONPlaceholder API (no credentials) |
| `tests/login.spec.ts` | 4 tests | Login form (skipped with placeholder creds) |
| `tests/home.spec.ts` | 4 tests | Home page (skipped with placeholder creds) |

---

## ⚙️ CI / GitHub Actions

The workflow (`.github/workflows/wdio.yml`) runs on push/PR to `main`, plus `workflow_dispatch` with comma-separated targets.

### Pipeline

```
install → test (matrix) → report & deploy
```

| Stage | Details |
|---|---|
| **Install** | `npm ci` + `node_modules` cache |
| **Test** | Matrix: `{chrome, firefox} × {dev, staging}`, uploads Allure blob artifacts |
| **Report** | Merges blobs, restores history from `gh-pages`, generates Allure report, deploys to GitHub Pages |

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
