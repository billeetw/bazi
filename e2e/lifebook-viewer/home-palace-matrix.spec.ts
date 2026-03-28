/**
 * Home Shell：十二宮矩陣渲染、權重引動高亮、`#palace-*` 宮位閱讀 overlay。
 */
import { test, expect } from "@playwright/test";

const META = { schema_version: "1.0" as const };

function minimalSection(sectionKey: string, title: string) {
  return {
    section_key: sectionKey,
    title,
    importance_level: "high" as const,
    structure_analysis: "e2e",
    behavior_pattern: "e2e",
    blind_spots: "e2e",
    strategic_advice: "e2e",
  };
}

/** 可序列化、供 addInitScript 注入 window.__LIFEBOOK_INITIAL_STATE__ */
function docPayload(overrides: {
  sections?: Record<string, ReturnType<typeof minimalSection>>;
  weight_analysis?: { risk_palaces?: string[] } | null;
  chart_json?: Record<string, unknown> | null;
}) {
  return {
    meta: META,
    chart_json: overrides.chart_json ?? null,
    weight_analysis: overrides.weight_analysis ?? null,
    sections: overrides.sections ?? { s02: minimalSection("s02", "命宮綜合分析") },
  };
}

test.describe("命書 Viewer · Home 十二宮矩陣", () => {
  test("顯示標題與 12 個宮位連結（無資料時無引動高亮）", async ({ page }) => {
    await page.goto("/lifebook-viewer.html?view=home");
    await expect(page.getByTestId("home-palace-matrix")).toBeVisible();
    await expect(page.getByRole("heading", { name: "十二宮 · 當前引動" })).toBeVisible();

    const cells = page.locator("[data-testid=home-palace-matrix] a[data-lb-palace-id]");
    await expect(cells).toHaveCount(12);

    const hrefs = await cells.evaluateAll((els) => els.map((e) => (e as HTMLAnchorElement).getAttribute("href")));
    for (const h of hrefs) {
      expect(h).toMatch(/^#palace-(ming|xiongdi|fuqi|zinv|caibo|jie|qianyi|nuppu|guanlu|tianzhai|fude|fumu)$/);
    }

    const actives = page.locator('[data-lb-palace-active="true"]');
    await expect(actives).toHaveCount(0);
  });

  test("權重 risk_palaces 會標記對應宮格為引動", async ({ page }) => {
    const payload = docPayload({
      weight_analysis: { risk_palaces: ["疾厄宮"] },
    });
    await page.addInitScript((p) => {
      (window as unknown as { __LIFEBOOK_INITIAL_STATE__?: typeof p }).__LIFEBOOK_INITIAL_STATE__ = p;
    }, payload);

    await page.goto("/lifebook-viewer.html?view=home");
    await expect(page.getByTestId("home-palace-matrix")).toBeVisible();

    const jie = page.locator('[data-lb-palace-id="jie"]');
    await expect(jie).toHaveAttribute("data-lb-palace-active", "true");

    const actives = page.locator('[data-lb-palace-active="true"]');
    await expect(actives).toHaveCount(1);
  });

  test("點擊夫妻宮 → 網址為 #palace-fuqi 且宮位閱讀 overlay 顯示", async ({ page }) => {
    const payload = docPayload({
      sections: {
        s02: minimalSection("s02", "命宮綜合分析"),
        s13: minimalSection("s13", "夫妻宮綜合分析"),
      },
    });
    await page.addInitScript((p) => {
      (window as unknown as { __LIFEBOOK_INITIAL_STATE__?: typeof p }).__LIFEBOOK_INITIAL_STATE__ = p;
    }, payload);

    await page.goto("/lifebook-viewer.html?view=home");
    await expect(page.getByTestId("home-palace-matrix")).toBeVisible();

    const fuqi = page.locator('[data-lb-palace-id="fuqi"]');
    await expect(fuqi).toBeVisible();

    await Promise.all([
      page.waitForURL(
        (u) => {
          try {
            const url = new URL(u);
            return url.hash === "#palace-fuqi";
          } catch {
            return false;
          }
        },
        { timeout: 20000 }
      ),
      fuqi.click(),
    ]);

    await expect(page.getByTestId("lifebook-palace-reader-overlay")).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole("dialog", { name: /夫妻宮/ })).toBeVisible();
  });
});
