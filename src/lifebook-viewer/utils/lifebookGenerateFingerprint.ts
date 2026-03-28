/**
 * 命書整本生成快取鍵：與 `worker/src/lifebook/lifebookGenerateFingerprint.ts` 一致。
 */

import { SECTION_ORDER } from "../constants";

export const LIFEBOOK_CACHE_ALG_VERSION = "1";

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

/** 與 Worker `normalizePlanSectionList` 對齊，供快取鍵一致 */
export function normalizeUnlockForFingerprint(raw: unknown): string[] {
  const inOrder = new Set(SECTION_ORDER as readonly string[]);
  const seen = new Set<string>();
  const out: string[] = [];
  if (!Array.isArray(raw)) return out;
  for (const key of raw) {
    if (typeof key !== "string") continue;
    const k = key.trim();
    if (!k || !inOrder.has(k) || seen.has(k)) continue;
    seen.add(k);
    out.push(k);
  }
  return out;
}

export function buildLifebookGenerateFingerprint(input: {
  chart_json: Record<string, unknown>;
  weight_analysis: Record<string, unknown>;
  plan_tier: string;
  unlock_sections: string[];
  output_mode: string;
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

export const LIFEBOOK_CLIENT_CACHE_PREFIX = "lifebook_generate_cache_v1_";
/** 預設 7 天 */
export const LIFEBOOK_CLIENT_CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
