/**
 * 預設進時間軸：無 `view` 時補 `?view=timeline`（與 lifebook-viewer.html 內嵌腳本一致）。
 * 放在入口最前 import，避免 CDN 仍快取舊 HTML 時首屏落在降生藍圖。
 */
function syncDefaultTimelineUrl(): void {
  if (typeof window === "undefined") return;
  try {
    const url = new URL(window.location.href);
    if (url.searchParams.get("view")) return;
    const path = (url.pathname || "").replace(/\/$/, "") || "/";
    if (path === "/viewer" || path.endsWith("/viewer")) return;
    if (!path.includes("lifebook-viewer")) return;
    url.searchParams.set("view", "timeline");
    if (window.location.href === url.href) return;
    /** 部分瀏覽器／WebView 僅 replaceState 不會更新網址列；replace 會觸發一次導覽，確保 query 生效 */
    window.location.replace(url.href);
  } catch {
    /* ignore */
  }
}

syncDefaultTimelineUrl();
