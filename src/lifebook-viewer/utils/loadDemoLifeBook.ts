/**
 * 載入內建示範命書 JSON，正規化後回傳 LifeBookViewerState
 * 用於「載入示範命書」按鈕，不呼叫任何 API
 */

import type { LifeBookViewerState } from "../types";
import { normalizeApiResponse } from "./normalizeApiResponse";

/**
 * 以 `import.meta.env.BASE_URL` + 當前頁面解析 `public/demo-lifebook.json`，避免從 `/viewer` 用相對路徑誤抓到 `/viewer/demo-…`。
 */
function resolveDemoLifebookUrl(): string {
  if (typeof window === "undefined") return "/demo-lifebook.json";
  const base = import.meta.env.BASE_URL ?? "/";
  return new URL(`${base}demo-lifebook.json`, window.location.href).href;
}

export async function loadDemoLifeBook(): Promise<LifeBookViewerState> {
  const res = await fetch(resolveDemoLifebookUrl());
  if (!res.ok) {
    throw new Error(`無法載入示範命書（${res.status}）`);
  }
  const raw = (await res.json()) as unknown;
  if (!raw || typeof raw !== "object") {
    throw new Error("示範命書格式錯誤");
  }
  const obj = raw as Record<string, unknown>;
  return normalizeApiResponse({
    ok: obj.ok === true,
    sections: obj.sections as Record<string, unknown> | undefined,
    weight_analysis: obj.weight_analysis as LifeBookViewerState["weight_analysis"],
    chart_json: obj.chart_json as Record<string, unknown> | undefined,
    meta:
      obj.meta && typeof obj.meta === "object"
        ? (obj.meta as { client_name?: string; birth_info?: string })
        : undefined,
    sections_json: typeof obj.sections_json === "string" ? obj.sections_json : undefined,
  });
}
