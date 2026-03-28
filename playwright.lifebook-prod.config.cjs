// @ts-check
const { defineConfig, devices } = require("@playwright/test");

/**
 * 僅對正式站驗證命書 viewer 網址是否補上 view=timeline（不啟動本機 webServer）。
 * 執行：LIFEBOOK_E2E_PROD=1 npx playwright test --config=playwright.lifebook-prod.config.cjs
 */
module.exports = defineConfig({
  testDir: "./e2e/lifebook-viewer",
  testMatch: /prod-view-url\.spec\.ts/,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: "list",
  timeout: 90000,
  expect: { timeout: 30000 },
  use: {
    baseURL: process.env.LIFEBOOK_E2E_BASE_URL || "https://www.17gonplay.com",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
