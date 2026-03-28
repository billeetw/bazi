/**
 * Quantum Link URL 單一建構點（勿在 Root／Timeline／Viewer 各處手拼）。
 * 契約見 docs/lifebook-cosmic-narrative-ia-and-refactor-plan.md § 二。
 */

import type { TimelineEntrySource, ViewerEntrySource } from "./viewerEntrySource";

export type { TimelineEntrySource, ViewerEntrySource } from "./viewerEntrySource";

/** 與目前靜態入口一致；若部署改為根路徑 `/` 僅需改此常數。 */
export const LIFEBOOK_APP_ENTRY_PATH = "/lifebook-viewer.html";

/** 正式站建置後實際入口（含 `/dist/`，與 `vite.lifebook-viewer.config.ts` 的 `base: "/dist/"` 一致）。 */
export const LIFEBOOK_DIST_ENTRY_PATH = "/dist/lifebook-viewer.html";

function isViteDevLifebookPort(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const port = window.location.port;
    return port === "5173" || port === "5174" || port === "5180" || port === "5181";
  } catch {
    return false;
  }
}

/**
 * 命書 SPA 實際 HTML 路徑（同頁導航時保留 `/dist/` 等前綴，避免 `/viewer` 依賴 rewrites 而 404 黑屏）。
 *
 * **重要**：`_redirects` 將 `/viewer`、`/timeline` 改寫為 dist HTML 時，網址列 pathname 仍為 `/viewer`／`/timeline`。
 * 若此時回退成 `/lifebook-viewer.html`，會載入**根目錄**含 `/src/*.tsx` 的檔案 → 生產環境 MIME 錯誤與黑屏。
 */
export function resolveLifebookEntryPath(): string {
  if (typeof window === "undefined") return LIFEBOOK_APP_ENTRY_PATH;
  try {
    const p = window.location.pathname;
    if (p.endsWith("lifebook-viewer.html")) return p;
    if (p === "/viewer" || p === "/timeline") {
      return isViteDevLifebookPort() ? "/lifebook-viewer.html" : LIFEBOOK_DIST_ENTRY_PATH;
    }
    if (p === "/dist/lifebook-viewer" || p.endsWith("/dist/lifebook-viewer")) {
      return LIFEBOOK_DIST_ENTRY_PATH;
    }
  } catch {
    /* ignore */
  }
  return LIFEBOOK_APP_ENTRY_PATH;
}

/**
 * 產品契約上 Root 含 `view=domains` 為 **`/?view=domains`**。
 * 過渡期 builder 落地在 `LIFEBOOK_APP_ENTRY_PATH`；rewrite 完成後應改為 pathname `/` + search，不再暴露 `.html`。
 */
export const ROOT_VIEW_DOMAINS_CONTRACT = "/?view=domains";

export interface BuildViewerUrlOptions {
  palaceId: string;
  year?: number | null;
  timelineNodeId?: string | null;
  source?: ViewerEntrySource | null;
  /** 結構層等：`structure` */
  panel?: string | null;
  /** 與 panel 擇一語意；如 `full` */
  mode?: string | null;
  /**
   * 預設 true：補 `view=viewer` 以相容既有依賴 query 的邏輯。
   * 長期 pathname `/viewer` 為真相時，可改 false，僅保留過渡。
   */
  compatViewQuery?: boolean;
}

/**
 * 降生藍圖／時間軸主場內開啟單宮閱讀層：僅改 hash，不切 `?view=viewer`（避免僅有 chart seed、無章節時進入空白閱讀頁）。
 * 使用相對錨點 `#palace-*`，保留當前 pathname（含 `/viewer` rewrite）與 query（如 `view=timeline`），避免跨路徑整頁重載。
 */
export function buildHomePalaceReadUrl(palaceId: string): string {
  return `#palace-${String(palaceId)}`;
}

/**
 * 產物：`{lifebook-viewer.html}?view=viewer&…#palace-{id}`（不依賴 `/viewer` rewrite）。
 */
export function buildViewerUrl(opts: BuildViewerUrlOptions): string {
  const basePath = resolveLifebookEntryPath();
  const params = new URLSearchParams();
  if (opts.compatViewQuery !== false) {
    params.set("view", "viewer");
  }
  if (opts.source) params.set("source", opts.source);
  if (opts.year != null && !Number.isNaN(Number(opts.year))) params.set("year", String(opts.year));
  if (opts.timelineNodeId) params.set("timeline_node", opts.timelineNodeId);
  if (opts.panel) params.set("panel", opts.panel);
  if (opts.mode) params.set("mode", opts.mode);
  if (opts.compatViewQuery === false && !params.has("view")) {
    params.set("view", "viewer");
  }
  const qs = params.toString();
  const hash = opts.palaceId ? `#palace-${String(opts.palaceId)}` : "";
  return `${basePath}?${qs}${hash}`;
}

export interface BuildTimelineUrlOptions {
  focus?: string | null;
  source?: TimelineEntrySource | null;
}

export function buildTimelineUrl(opts: BuildTimelineUrlOptions = {}): string {
  const basePath = resolveLifebookEntryPath();
  const params = new URLSearchParams();
  params.set("view", "timeline");
  if (opts.focus) params.set("focus", opts.focus);
  if (opts.source) params.set("source", opts.source);
  return `${basePath}?${params.toString()}`;
}

export interface BuildRootUrlOptions {
  /** `domains` = Root 內 canonical 十二宮矩陣 surface（`/?view=domains` 語義） */
  view?: "domains" | null;
}

export function buildRootUrl(opts: BuildRootUrlOptions = {}): string {
  const basePath = resolveLifebookEntryPath();
  const params = new URLSearchParams();
  if (opts.view === "domains") {
    params.set("view", "domains");
  } else {
    params.set("view", "home");
  }
  return `${basePath}?${params.toString()}`;
}
