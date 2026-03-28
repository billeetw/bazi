/**
 * 產品契約 pathname 與既有 `?view=viewer` 並存期間的 surface 判定。
 * 見 docs/lifebook-cosmic-narrative-ia-and-refactor-plan.md § 正式 URL 表。
 *
 * **預設 landing**：無 `view` 且非 `/viewer`／`/timeline` pathname 時為 **時間軸**（`timeline`）。
 * **降生藍圖**（Root）需 **`?view=home`** 或 **`?view=domains`**（十二宮矩陣子視圖）。
 *
 * **過渡期**：`syncCanonicalViewerPathToSearch` 僅為補齊 `view=viewer`；
 * 長期應以 pathname `/viewer` 為唯一真相，`view=viewer` 僅作相容層，避免雙真相永久並存。
 */

export type AppSurface = "root" | "viewer" | "timeline";

/** Root 內可分享子視圖（仍為同一 surface=root） */
export type RootSubView = "default" | "domains";

function normalizePathname(pathname: string): string {
  const p = pathname.replace(/\/$/, "") || "/";
  return p;
}

/** 由 pathname + search 判定目前表面（不依賴 React） */
export function getAppSurfaceFromLocation(href: string = typeof window !== "undefined" ? window.location.href : ""): AppSurface {
  try {
    const url = new URL(href, typeof window !== "undefined" ? window.location.origin : "http://localhost");
    const path = normalizePathname(url.pathname);
    const view = url.searchParams.get("view");
    /**
     * Query 優先於 pathname `/viewer`：同一 HTML 可能掛在 `/viewer` 又帶 `?view=timeline`／`domains`。
     * 若先判 pathname，會永遠落在 viewer surface → 時間軸／降生藍圖黑屏。
     */
    if (view === "timeline") return "timeline";
    if (view === "viewer") return "viewer";
    if (view === "domains" || view === "home") return "root";

    if (path === "/timeline" || path.endsWith("/timeline")) return "timeline";
    if (path === "/viewer" || path.endsWith("/viewer")) return "viewer";
    return "timeline";
  } catch {
    return "timeline";
  }
}

/** 僅在 surface=root 時有意義：`/?view=domains` → Domains（十二宮矩陣）為 canonical 狀態 */
export function getRootSubViewFromLocation(href: string = typeof window !== "undefined" ? window.location.href : ""): RootSubView {
  try {
    const url = new URL(href, typeof window !== "undefined" ? window.location.origin : "http://localhost");
    if (url.searchParams.get("view") === "domains") return "domains";
    return "default";
  } catch {
    return "default";
  }
}

/**
 * pathname 為 `/viewer` 時，補上 `view=viewer`，讓既有依賴 query 的邏輯（如 palace preview）一致。
 * 應在 App 最早之 `useLayoutEffect` 呼叫一次。
 */
export function syncCanonicalViewerPathToSearch(): void {
  if (typeof window === "undefined") return;
  try {
    const url = new URL(window.location.href);
    const path = normalizePathname(url.pathname);
    const isViewerPath = path === "/viewer" || path.endsWith("/viewer");
    if (!isViewerPath) return;
    const v = url.searchParams.get("view");
    if (v === "viewer" || v === "timeline" || v === "domains") return;
    url.searchParams.set("view", "viewer");
    window.history.replaceState(null, "", url.toString());
  } catch {
    /* ignore */
  }
}

/**
 * 預設 surface 為時間軸時，補上 `?view=timeline`，讓網址列與產品契約一致（便於部署驗證、避免舊快取誤判）。
 * 須在 `syncCanonicalViewerPathToSearch` **之後**呼叫（`/viewer` 無 query 時應先變成 `view=viewer`）。
 */
export function syncCanonicalTimelineSurfaceToSearch(): void {
  if (typeof window === "undefined") return;
  try {
    const url = new URL(window.location.href);
    if (url.searchParams.get("view") === "timeline") return;
    const surface = getAppSurfaceFromLocation(url.href);
    if (surface !== "timeline") return;
    url.searchParams.set("view", "timeline");
    window.history.replaceState(null, "", url.toString());
  } catch {
    /* ignore */
  }
}
