/**
 * 命書 Viewer 入口：明確 root id、storage 載入、ErrorBoundary，避免白屏與未捕獲錯誤。
 * 若在掛載前設定 window.__LIFEBOOK_INITIAL_STATE__ 或由 parent 經 postMessage 傳 LIFEBOOK_DOC，viewer 會顯示命書。
 *
 * 使用靜態 import 載入 App（勿對 App 做 dynamic import）：Vite dev 下 dynamic import 偶發
 * Failed to fetch dynamically imported module，導致整頁只顯示「尚未載入命書資料」。
 */

import "./syncDefaultTimelineUrl";
import "@/design-system/tokens.css";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { LifebookErrorBoundary } from "./ErrorBoundary";
import { resolveInitialDocument } from "./bootstrapAccountLifebook";
import { buildLifeBookDocument } from "./utils/lifebook-assembler";
import { chartJsonHasZiwei, mergeDocWithBetaSeed, tryLoadBetaSeedDocument } from "./utils/betaSeedDocument";
import type { LifeBookDocument } from "./types";

const ROOT_ID = "lifebook-root";
const STORAGE_KEY = "lifebook_doc";

function lifeBookDocHasRenderableContent(doc: LifeBookDocument): boolean {
  const sec = doc.sections;
  if (sec && typeof sec === "object" && Object.keys(sec).length > 0) return true;
  return !!(doc.chart_json && typeof doc.chart_json === "object");
}

function renderFallback(message: string) {
  const el = document.getElementById(ROOT_ID);
  if (el) {
    el.innerHTML = `<div style="padding:2rem;text-align:center;color:#94a3b8;font-family:system-ui;background:#0f172a;min-height:100vh;display:flex;align-items:center;justify-content:center;"><p>${message}</p></div>`;
  }
}

/** 依序從 window / sessionStorage / localStorage 讀取命書，解析失敗不拋錯 */
function loadInitialDocFromStorage(): LifeBookDocument | null {
  if (typeof window === "undefined") return null;
  const seed = tryLoadBetaSeedDocument();
  try {
    const fromWindow = (window as unknown as { __LIFEBOOK_INITIAL_STATE__?: LifeBookDocument }).__LIFEBOOK_INITIAL_STATE__;
    if (fromWindow && typeof fromWindow === "object" && typeof (fromWindow as LifeBookDocument).sections === "object") {
      const merged = mergeDocWithBetaSeed(fromWindow as LifeBookDocument, seed);
      return merged ?? seed;
    }
  } catch {
    /* ignore */
  }
  for (const key of [STORAGE_KEY]) {
    try {
      const raw = sessionStorage.getItem(key) ?? localStorage.getItem(key);
      if (!raw) continue;
      const parsed = JSON.parse(raw) as LifeBookDocument;
      if (parsed && typeof parsed === "object" && typeof parsed.sections === "object" && lifeBookDocHasRenderableContent(parsed)) {
        const merged = mergeDocWithBetaSeed(parsed, seed);
        return merged ?? seed;
      }
    } catch (e) {
      console.error("[lifebook-viewer] Failed to parse", key, e);
    }
  }
  return seed;
}

void (async () => {
  try {
    const container = document.getElementById(ROOT_ID);
    if (!container) {
      console.error("[lifebook-viewer] root element #" + ROOT_ID + " not found");
      renderFallback("尚未載入命書資料");
      return;
    }

    const initialDoc = await resolveInitialDocument(loadInitialDocFromStorage);
    console.log("[lifebook-viewer] initialDoc resolved:", initialDoc
      ? {
          sectionsCount: Object.keys(initialDoc.sections || {}).length,
          hasMeta: !!initialDoc.meta,
          hasZiwei: chartJsonHasZiwei(initialDoc.chart_json),
        }
      : null);

    if (typeof window !== "undefined") {
      try {
        (window as unknown as { buildLifeBookDocument: typeof buildLifeBookDocument }).buildLifeBookDocument = buildLifeBookDocument;
      } catch {
        /* ignore */
      }
    }
    const root = createRoot(container);
    root.render(
      <LifebookErrorBoundary>
        <App initialDocument={initialDoc ?? undefined} />
      </LifebookErrorBoundary>
    );
  } catch (e) {
    console.error("[lifebook-viewer]", e);
    const errMsg = e instanceof Error ? e.message : String(e);
    renderFallback("尚未載入命書資料" + (errMsg ? " · " + errMsg : ""));
  }
})();
