// @ts-check
const { defineConfig, devices } = require("@playwright/test");

/**
 * 命書 Viewer（React）E2E：Home Shell 十二宮矩陣、`#palace-*` 宮位 overlay。
 * 執行：npm run test:e2e:lifebook-viewer
 * 以 Vite dev 提供 `/lifebook-viewer.html`（與 HTML 內 isViteDev 埠一致）。
 */
module.exports = defineConfig({
  testDir: "./e2e/lifebook-viewer",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: "list",
  timeout: 60000,
  expect: { timeout: 15000 },
  use: {
    /** 與預設 `vite` 5173 分開，避免與本機 dev 衝突；`lifebook-viewer.html` 已將 5174 視為 Vite dev */
    baseURL: "http://127.0.0.1:5174",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "npx vite --host 127.0.0.1 --port 5174",
    url: "http://127.0.0.1:5174/lifebook-viewer.html",
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
