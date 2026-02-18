// @ts-check
const { defineConfig, devices } = require("@playwright/test");

/**
 * E2E 煙霧測試：部署前驗證關鍵流程
 * 執行：npm run test:e2e
 * 需先 build：npm run build:main
 */
module.exports = defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: "list",
  timeout: 60000,
  expect: { timeout: 10000 },
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"], channel: "chrome" } }],
  // 本地：用 wrangler pages dev 避免 CORS（同源代理 /compute/* 到遠端 Worker）
  // 需先 npm run build:main；或手動啟動後設 reuseExistingServer: true
  webServer: {
    command: "npx wrangler pages dev . --port 3000",
    url: "http://localhost:3000",
    reuseExistingServer: true,
    timeout: 60000,
  },
});
