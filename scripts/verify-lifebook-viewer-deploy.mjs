#!/usr/bin/env node
/**
 * 檢查線上命書 viewer 的 **HTML 原始碼**（不執行 JS）：
 * - 是否含補 `view=timeline` 的 `location.replace`（代表已部署新版 lifebook-viewer.html）
 *
 * 用法：
 *   node scripts/verify-lifebook-viewer-deploy.mjs
 *   LIFEBOOK_VERIFY_BASE=https://www.17gonplay.com node scripts/verify-lifebook-viewer-deploy.mjs
 */

const BASE = process.env.LIFEBOOK_VERIFY_BASE || "https://www.17gonplay.com";

const PATHS = [
  "/dist/lifebook-viewer.html?beta=1&autogen=1",
  "/dist/lifebook-viewer?beta=1&autogen=1",
];

async function check(path) {
  const url = `${BASE.replace(/\/$/, "")}${path}`;
  const res = await fetch(url, { redirect: "follow" });
  const html = await res.text();
  /** 舊版 HTML 只有「根目錄 lifebook-viewer.html → /dist」的 replace，不含補 view=timeline */
  const hasViewTimelineSync =
    html.includes('searchParams.set("view", "timeline")') ||
    html.includes("searchParams.set('view', 'timeline')");
  const hasViewerBundleRef = html.includes("lifebook-viewer.js");
  return {
    url,
    status: res.status,
    finalUrl: res.url,
    bytes: html.length,
    hasViewTimelineSync,
    hasViewerBundleRef,
  };
}

async function main() {
  console.log("Base:", BASE);
  console.log("");
  for (const p of PATHS) {
    try {
      const r = await check(p);
      console.log("Request:", r.url);
      console.log("  HTTP:", r.status, "| final URL:", r.finalUrl, "| body ~", r.bytes, "bytes");
      console.log("  HTML 含補 view=timeline 腳本 (searchParams.set):", r.hasViewTimelineSync);
      console.log("  References lifebook viewer bundle:", r.hasViewerBundleRef);
      if (!r.hasViewTimelineSync) {
        console.log(
          "  ⚠️  線上 dist/lifebook-viewer.html 與本機 npm run build:lifebook-viewer 產物不一致。"
        );
        console.log(
          "     若 body 很大且像主站 index（含 <base href=\"/\" />），代表 /dist/lifebook-viewer.html 未命中靜態檔（SPA fallback）；"
        );
        console.log(
          "     Cloudflare Pages 請勿用會失敗的 npm run build（tsc）；改用 npm run build:pages，成功後再 Purge /dist/lifebook-viewer*。"
        );
      }
      console.log("");
    } catch (e) {
      console.error("Failed:", p, e);
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
