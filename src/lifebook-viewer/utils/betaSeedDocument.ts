/**
 * 主站 `lifebook_v2_seed` 與 `lifebook_doc` 並存時：章節-only 的 doc 需補上 chart_json，降生藍圖才會顯示真實命主／身主／身宮。
 */

import type { LifeBookDocument } from "../types";
import { LIFEBOOK_SCHEMA_VERSION } from "../../../js/lifebook-version.js";

const BETA_SEED_SESSION_KEY = "lifebook_v2_seed";
const BETA_SEED_BACKUP_KEY = "lifebook_v2_seed_backup";

export function chartJsonHasZiwei(chart: unknown): boolean {
  if (!chart || typeof chart !== "object") return false;
  const z = (chart as { ziwei?: unknown }).ziwei;
  return z != null && typeof z === "object";
}

export function tryLoadBetaSeedDocument(): LifeBookDocument | null {
  if (typeof window === "undefined") return null;
  let raw: string | null = null;
  try {
    raw = sessionStorage.getItem(BETA_SEED_SESSION_KEY) ?? localStorage.getItem(BETA_SEED_BACKUP_KEY);
  } catch {
    return null;
  }
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as {
      chart_json?: Record<string, unknown>;
      weight_analysis?: LifeBookDocument["weight_analysis"];
    };
    if (!parsed?.chart_json || typeof parsed.chart_json !== "object") return null;
    return {
      meta: { schema_version: LIFEBOOK_SCHEMA_VERSION },
      sections: {},
      chart_json: parsed.chart_json,
      weight_analysis: parsed.weight_analysis && typeof parsed.weight_analysis === "object" ? parsed.weight_analysis : null,
    };
  } catch {
    return null;
  }
}

export function mergeDocWithBetaSeed(doc: LifeBookDocument | null, seed: LifeBookDocument | null): LifeBookDocument | null {
  if (!seed?.chart_json) return doc;
  if (!doc) return seed;
  if (chartJsonHasZiwei(doc.chart_json)) return doc;
  return {
    ...doc,
    chart_json: seed.chart_json,
    weight_analysis: doc.weight_analysis ?? seed.weight_analysis ?? null,
    meta: doc.meta ?? seed.meta ?? { schema_version: LIFEBOOK_SCHEMA_VERSION },
  };
}
