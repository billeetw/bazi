/**
 * 與 `functions/api/life-book/[[path]].js` 內 `extractLifeBookSubpath` 邏輯一致。
 * 若修改代理，請同步更新該函式與本測試（避免多段 path 如 `beta/redeem` 轉發錯誤 → Worker 404 Not found）。
 */
import { describe, expect, it } from "vitest";

function extractLifeBookSubpath(requestLike: { url: string }): string {
  try {
    const url = new URL(requestLike.url);
    const prefix = "/api/life-book/";
    if (!url.pathname.startsWith(prefix)) return "";
    return url.pathname.slice(prefix.length).replace(/\/$/, "") || "";
  } catch {
    return "";
  }
}

function workerTargetUrl(remote: string, requestUrl: string): string {
  const path = extractLifeBookSubpath({ url: requestUrl });
  const u = new URL(requestUrl);
  return `${remote}/api/life-book/${path}${u.search}`;
}

describe("life-book Pages proxy: extractLifeBookSubpath", () => {
  it("POST 邀請碼驗證：多段路徑 beta/redeem 須完整保留", () => {
    const u = "https://www.17gonplay.com/api/life-book/beta/redeem";
    expect(extractLifeBookSubpath({ url: u })).toBe("beta/redeem");
    expect(workerTargetUrl("https://bazi-api.billeetw.workers.dev", u)).toBe(
      "https://bazi-api.billeetw.workers.dev/api/life-book/beta/redeem"
    );
  });

  it("generate / generate-section / daily-flow / config 單段或帶 search", () => {
    expect(extractLifeBookSubpath({ url: "https://x.com/api/life-book/generate" })).toBe("generate");
    expect(extractLifeBookSubpath({ url: "https://x.com/api/life-book/generate-section" })).toBe("generate-section");
    expect(extractLifeBookSubpath({ url: "https://x.com/api/life-book/daily-flow" })).toBe("daily-flow");
    expect(extractLifeBookSubpath({ url: "https://x.com/api/life-book/config?locale=zh-TW" })).toBe("config");
    expect(
      workerTargetUrl("https://bazi-api.billeetw.workers.dev", "https://x.com/api/life-book/config?locale=zh-TW")
    ).toBe("https://bazi-api.billeetw.workers.dev/api/life-book/config?locale=zh-TW");
  });

  it("尾端斜線會去掉", () => {
    expect(extractLifeBookSubpath({ url: "https://x.com/api/life-book/beta/redeem/" })).toBe("beta/redeem");
  });

  it("非 life-book 前綴回傳空字串", () => {
    expect(extractLifeBookSubpath({ url: "https://x.com/api/other/thing" })).toBe("");
  });
});
