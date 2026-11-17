import { defineConfig, devices } from "@playwright/test";

const PORT = 4317;

/**
 * End-to-end tests run against the production build (run `npm run build`
 * first), served by `next start`. The public pages read live Testnet state.
 * The wallet tests sign real Testnet transactions and need
 * E2E_SUI_PRIVATE_KEY; without it they skip and only the public tests run.
 */
export default defineConfig({
  testDir: "./e2e",
  testMatch: "**/*.spec.ts",
  // Live chain reads, and one wallet: a single worker keeps the public
  // fullnode from rate limiting and never signs two transactions at once.
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  timeout: 120_000,
  expect: { timeout: 30_000 },
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: `npm run start -- --port ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
  },
});
