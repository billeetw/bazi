/**
 * 命書 Viewer：匯入（檔案/貼上）、匯出（JSON/HTML）、列印
 * HTML 匯出改為共用 renderLifeBookDocumentToHtml(doc)。
 */

import type { LifeBookViewerState } from "../types";
import { normalizeApiResponse } from "./normalizeApiResponse";
import { renderLifeBookDocumentToHtml } from "./html-renderer";

/**
 * 由 Viewer state（即 LifeBookDocument 使用者視角）產出 HTML
 */
export function exportHtml(state: LifeBookViewerState): string {
  return renderLifeBookDocumentToHtml(state as import("../types").LifeBookDocument);
}

/**
 * 觸發下載 JSON（當前 state）
 */
export function downloadJson(state: LifeBookViewerState, filenameBase?: string): void {
  const name = filenameBase || state.meta?.client_name || "命書";
  const safe = String(name).replace(/[/\s:]+/g, "-").slice(0, 40);
  const filename = `life-book-${safe}-${new Date().toISOString().slice(0, 10)}.json`;
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json; charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

/**
 * 觸發下載 HTML
 */
export function downloadHtml(state: LifeBookViewerState, filenameBase?: string): void {
  const html = exportHtml(state);
  const name = filenameBase || state.meta?.client_name || "命書";
  const safe = String(name).replace(/[/\s:]+/g, "-").slice(0, 40);
  const filename = `life-book-${safe}-${new Date().toISOString().slice(0, 10)}.html`;
  const blob = new Blob([html], { type: "text/html; charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

/**
 * 從檔案 input 讀取 JSON，resolve 正規化後的 state（由呼叫方 setState）
 */
export function readFileAsState(file: File): Promise<LifeBookViewerState> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const text = reader.result as string;
        const raw = JSON.parse(text) as unknown;
        if (!raw || typeof raw !== "object") {
          reject(new Error("無效的 JSON"));
          return;
        }
        const obj = raw as Record<string, unknown>;
        const state = normalizeApiResponse({
          ok: obj.ok === true,
          sections: obj.sections as Record<string, unknown> | undefined,
          weight_analysis: obj.weight_analysis as LifeBookViewerState["weight_analysis"],
          chart_json: obj.chart_json as Record<string, unknown> | undefined,
          client_name: obj.meta && typeof obj.meta === "object" ? (obj.meta as { client_name?: string }).client_name : undefined,
          birth_info: obj.meta && typeof obj.meta === "object" ? (obj.meta as { birth_info?: string }).birth_info : undefined,
          sections_json: typeof obj.sections_json === "string" ? obj.sections_json : undefined,
        });
        resolve(state);
      } catch (e) {
        reject(e instanceof Error ? e : new Error("解析失敗"));
      }
    };
    reader.onerror = () => reject(new Error("讀取檔案失敗"));
    reader.readAsText(file, "utf-8");
  });
}
