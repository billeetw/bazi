/**
 * 命書 Viewer 入口：明確 root id、storage 載入、ErrorBoundary，避免白屏與未捕獲錯誤。
 * 若在掛載前設定 window.__LIFEBOOK_INITIAL_STATE__ 或由 parent 經 postMessage 傳 LIFEBOOK_DOC，viewer 會顯示命書。
 */

import type { LifeBookDocument } from "./types";

const ROOT_ID = "lifebook-root";
const STORAGE_KEY = "lifebook_doc";

function renderFallback(message: string) {
  const el = document.getElementById(ROOT_ID);
  if (el) {
    el.innerHTML = `<div style="padding:2rem;text-align:center;color:#94a3b8;font-family:system-ui;background:#0f172a;min-height:100vh;display:flex;align-items:center;justify-content:center;"><p>${message}</p></div>`;
  }
}

/** 依序從 window / sessionStorage / localStorage 讀取命書，解析失敗不拋錯 */
function loadInitialDocFromStorage(): LifeBookDocument | null {
  if (typeof window === "undefined") return null;
  try {
    const fromWindow = (window as unknown as { __LIFEBOOK_INITIAL_STATE__?: LifeBookDocument }).__LIFEBOOK_INITIAL_STATE__;
    if (fromWindow && typeof fromWindow === "object" && typeof (fromWindow as LifeBookDocument).sections === "object") {
      return fromWindow as LifeBookDocument;
    }
  } catch {
    /* ignore */
  }
  for (const key of [STORAGE_KEY]) {
    try {
      const raw = sessionStorage.getItem(key) ?? localStorage.getItem(key);
      if (!raw) continue;
      const parsed = JSON.parse(raw) as LifeBookDocument;
      if (parsed && typeof parsed === "object" && typeof parsed.sections === "object") {
        return parsed;
      }
    } catch (e) {
      console.error("[lifebook-viewer] Failed to parse", key, e);
    }
  }
  return null;
}

(async function main() {
  try {
    const container = document.getElementById(ROOT_ID);
    if (!container) {
      console.error("[lifebook-viewer] root element #" + ROOT_ID + " not found");
      renderFallback("尚未載入命書資料");
      return;
    }
    const initialDoc = loadInitialDocFromStorage();
    console.log("[lifebook-viewer] initialDoc from storage:", initialDoc ? { sectionsCount: Object.keys(initialDoc.sections || {}).length, hasMeta: !!initialDoc.meta } : null);

    const [React, { createRoot }, { App }, { buildLifeBookDocument }, { LifebookErrorBoundary }] = await Promise.all([
      import("react"),
      import("react-dom/client"),
      import("./App"),
      import("./utils/lifebook-assembler"),
      import("./ErrorBoundary"),
    ]);
    if (typeof window !== "undefined") {
      try {
        (window as unknown as { buildLifeBookDocument: typeof buildLifeBookDocument }).buildLifeBookDocument = buildLifeBookDocument;
      } catch {
        /* ignore */
      }
    }
    const root = createRoot(container);
    root.render(
      React.createElement(
        LifebookErrorBoundary,
        null,
        React.createElement(App, { initialDocument: initialDoc ?? undefined })
      )
    );
  } catch (e) {
    console.error("[lifebook-viewer]", e);
    const errMsg = e instanceof Error ? e.message : String(e);
    renderFallback("尚未載入命書資料" + (errMsg ? " · " + errMsg : ""));
  }
})();
