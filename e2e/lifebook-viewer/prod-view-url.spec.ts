/**
 * 正式站：開啟無 view 的命書連結後，網址應出現 view=timeline（HTML 內嵌或 bundle 內 sync）。
 * 需網路；預設 skip，設 LIFEBOOK_E2E_PROD=1 才執行。
 */
import { test, expect } from "@playwright/test";

test.describe("17gonplay 命書 viewer · view=timeline", () => {
  test.skip(process.env.LIFEBOOK_E2E_PROD !== "1", "請設 LIFEBOOK_E2E_PROD=1 才對正式站跑此檔（需網路）");

  test("dist/lifebook-viewer?beta=1&autogen=1 最終網址含 view=timeline", async ({ page }) => {
    await page.goto("/dist/lifebook-viewer?beta=1&autogen=1", {
      waitUntil: "domcontentloaded",
    });
    await expect(page).toHaveURL(/[?&]view=timeline(?:&|$)/, { timeout: 45000 });
    const u = page.url();
    expect(u, "應保留 beta/autogen 或至少含 view=timeline").toMatch(/view=timeline/);
  });

  test("dist/lifebook-viewer.html?beta=1&autogen=1 最終網址含 view=timeline", async ({ page }) => {
    await page.goto("/dist/lifebook-viewer.html?beta=1&autogen=1", {
      waitUntil: "domcontentloaded",
    });
    await expect(page).toHaveURL(/[?&]view=timeline(?:&|$)/, { timeout: 45000 });
  });
});
