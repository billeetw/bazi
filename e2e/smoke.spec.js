/**
 * 煙霧測試：關鍵流程驗證
 * 1. 推算時辰按鈕可點、不報錯
 * 2. 填表單 → 點「開始人生分析」→ 結果區顯示
 */
import { test, expect } from "@playwright/test";

test.describe("關鍵流程", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
  });

  test("推算時辰按鈕可點、不觸發 JS 錯誤", async ({ page }) => {
    const errors = [];
    page.on("pageerror", (err) => errors.push(err.message));

    const btn = page.locator("#btnIdentifyBirthTimeGlobal");
    await expect(btn).toBeVisible();
    await btn.click();

    // 未登入時可能跳出登入或關閉，不應有 ReferenceError
    await expect(errors.filter((e) => e.includes("openModal") || e.includes("ReferenceError"))).toHaveLength(0);
  });

  test("填表單 → 開始人生分析 → 結果區顯示", async ({ page }) => {
    // 等待表單選項載入（option 在 select 內為 hidden，用 attached）
    await page.locator("#birthYear option[value='1990']").waitFor({ state: "attached", timeout: 10000 });

    await page.selectOption("#birthYear", "1990");
    await page.selectOption("#birthMonth", "6");
    await page.selectOption("#birthDay", "15");
    await page.selectOption("#gender", "M");

    // 時辰模式：選子時上半
    const timeMode = page.locator("#timeMode");
    if ((await timeMode.inputValue()) !== "shichen") {
      await timeMode.selectOption("shichen");
      await page.waitForTimeout(300);
    }
    await page.selectOption("#birthShichen", "子");
    await page.selectOption("#birthShichenHalf", "upper");

    const launchBtn = page.locator("#btnLaunch");
    await expect(launchBtn).toBeEnabled();
    await launchBtn.click();

    // 等待計算完成：system 區塊顯示（需遠端 API 可用；tacticalBox 依 API 回傳可能為空）
    await expect(page.locator("#system")).not.toHaveClass("hidden", { timeout: 25000 });
  });
});
