/**
 * 命書整本生成快取鍵：與前端 `src/lifebook-viewer/utils/lifebookGenerateFingerprint.ts` 演算法一致。
 */

import { IZTRO_TIME_INDEX_MAPPING_VERSION } from "../../../shared/iztroTimeIndex.js";

export const LIFEBOOK_CACHE_ALG_VERSION = "1";

/** 日層（流日）快取鍵演算法版本；與 iztro 升級或 `buildDailyFlowResult` 契約變更時 bump */
export const LIFEBOOK_DAILY_CACHE_ALG_VERSION = "1";

function stableStringify(v: unknown): string {
  if (v === null || typeof v !== "object") return JSON.stringify(v);
  if (Array.isArray(v)) return `[${v.map((x) => stableStringify(x)).join(",")}]`;
  const o = v as Record<string, unknown>;
  const keys = Object.keys(o).sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${stableStringify(o[k])}`).join(",")}}`;
}

function djb2Hex(s: string): string {
  let h = 5381;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
  }
  return h.toString(16).padStart(8, "0");
}

export function buildLifebookGenerateFingerprint(input: {
  chart_json: Record<string, unknown>;
  weight_analysis: Record<string, unknown>;
  plan_tier: string;
  unlock_sections: string[];
  output_mode: string;
  /** 與請求 body.beta_invite_code 一致（大寫 trim），無則空字串 */
  invite_fingerprint: string;
}): string {
  const unlock = [...input.unlock_sections].map((s) => String(s).trim()).filter(Boolean).sort().join(",");
  const raw =
    stableStringify(input.chart_json) +
    "|" +
    stableStringify(input.weight_analysis) +
    "|" +
    input.plan_tier +
    "|" +
    unlock +
    "|" +
    input.output_mode +
    "|" +
    input.invite_fingerprint +
    "|" +
    LIFEBOOK_CACHE_ALG_VERSION;
  return djb2Hex(raw) + "_" + raw.length.toString(16);
}

export function lifebookKvCacheKey(fingerprint: string): string {
  return `lb:gen:v${LIFEBOOK_CACHE_ALG_VERSION}:${fingerprint}`;
}

/** 單章 generate-section：與 fingerprint + section_key + 時區日 對應，TTL 24h */
export const LIFEBOOK_SECTION_CACHE_TTL_SEC = 86400;

/** 同一 fingerprint 連續 generate-section 節流（秒） */
export const LIFEBOOK_SECTION_RATE_LIMIT_SEC = 5;

/**
 * 單章 KV 鍵。若帶 `timeContext`，則附加 **時區 + day_key**，使「同一盤不同日」不共用快取。
 * 舊版僅 fingerprint+section 之鍵自然失效（新鍵格式不同）。
 */
export function lifebookSectionCacheKey(
  fingerprint: string,
  sectionKey: string,
  timeContext?: { timeZone: string; dayKey: string }
): string {
  const base = `lb:sec:v${LIFEBOOK_CACHE_ALG_VERSION}:${fingerprint}:${sectionKey}`;
  if (!timeContext) return base;
  const tz = String(timeContext.timeZone || "UTC")
    .replace(/[^a-zA-Z0-9_+/.\-]/g, "_")
    .slice(0, 80);
  const dk = /^\d{4}-\d{2}-\d{2}$/.test(String(timeContext.dayKey || "").trim())
    ? String(timeContext.dayKey).trim()
    : "unknown-day";
  return `${base}:${tz}:${dk}`;
}

export function lifebookSectionRateLimitKey(fingerprint: string): string {
  return `lb:sec:rl:v${LIFEBOOK_CACHE_ALG_VERSION}:${fingerprint}`;
}

/**
 * 日層（`horoscope.daily` 等）KV 鍵：含 **fingerprint、IANA、民曆 day_key、timeIndex、映射版本**。
 * 時辰變動會改變輸出時必須帶 `timeIndex`；`idxmap` 與 `shared/iztroTimeIndex.ts` 同步 bump。
 */
export function lifebookDailyHoroscopeCacheKey(
  fingerprint: string,
  dayKey: string,
  timeZone: string,
  timeIndex: number
): string {
  const tz = String(timeZone || "UTC")
    .replace(/[^a-zA-Z0-9_+/.\-]/g, "_")
    .slice(0, 80);
  const dk = /^\d{4}-\d{2}-\d{2}$/.test(String(dayKey || "").trim())
    ? String(dayKey).trim()
    : "unknown-day";
  const ti = Math.max(0, Math.min(11, Math.floor(Number(timeIndex))));
  return `lb:daily:v${LIFEBOOK_DAILY_CACHE_ALG_VERSION}:${fingerprint}:${tz}:${dk}:ti${String(ti).padStart(2, "0")}:idxmap${IZTRO_TIME_INDEX_MAPPING_VERSION}`;
}
