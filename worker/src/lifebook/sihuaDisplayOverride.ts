/**
 * Phase 3：顯式四化「顯示層」覆寫，與 normalize + mutagen 推導分離。
 * 不得使用舊的 chartJson.sihuaLayers；覆寫資料放在 chartJson.lifebookSiHuaDisplayOverride。
 */

import type { BuiltSiHuaLayer, BuiltSiHuaLayers } from "./builtSiHuaTypes.js";
import { getNodeProcessEnv } from "./nodeEnv.js";

/** chartJson 上的欄位名（單一物件，避免與 sihuaLayers wire 混淆） */
export const LIFEBOOK_SIHUA_DISPLAY_OVERRIDE_KEY = "lifebookSiHuaDisplayOverride" as const;

export interface SiHuaDisplayOverrideAudit {
  /** 人類可讀原因（實驗／地區規則／除錯等） */
  reason: string;
  /** 例如 "region:HK" | "experiment:exp-42" */
  source?: string;
  correlationId?: string;
}

/**
 * 顯式覆寫請求：`enabled` 必須為 literal true；需帶 audit。
 * `layers` 可只覆寫部分層（benming／decadal／yearly），未出現的鍵保留 worker 計算結果。
 */
export interface LifebookSiHuaDisplayOverride {
  enabled: true;
  audit: SiHuaDisplayOverrideAudit;
  layers: Partial<BuiltSiHuaLayers>;
}

export interface ApplySiHuaDisplayOverrideResult {
  layers: BuiltSiHuaLayers;
  applied: boolean;
  audit?: SiHuaDisplayOverrideAudit;
}

function isBuiltSiHuaLayer(x: unknown): x is BuiltSiHuaLayer {
  if (!x || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  const keys = ["lu", "quan", "ke", "ji"] as const;
  return keys.some((k) => k in o);
}

function readOverride(chartJson: Record<string, unknown> | undefined): LifebookSiHuaDisplayOverride | undefined {
  if (!chartJson) return undefined;
  const raw = chartJson[LIFEBOOK_SIHUA_DISPLAY_OVERRIDE_KEY];
  if (!raw || typeof raw !== "object") return undefined;
  const o = raw as Record<string, unknown>;
  if (o.enabled !== true) return undefined;
  const audit = o.audit;
  if (!audit || typeof audit !== "object") return undefined;
  const reason = (audit as { reason?: unknown }).reason;
  if (typeof reason !== "string" || !reason.trim()) return undefined;
  const layers = o.layers;
  if (!layers || typeof layers !== "object") return undefined;
  const L = layers as Record<string, unknown>;
  const out: Partial<BuiltSiHuaLayers> = {};
  if (L.benming !== undefined) {
    if (L.benming !== null && !isBuiltSiHuaLayer(L.benming)) return undefined;
    out.benming = L.benming as BuiltSiHuaLayer | undefined;
  }
  if (L.decadal !== undefined) {
    if (L.decadal !== null && !isBuiltSiHuaLayer(L.decadal)) return undefined;
    out.decadal = L.decadal as BuiltSiHuaLayer | undefined;
  }
  if (L.yearly !== undefined) {
    if (L.yearly !== null && !isBuiltSiHuaLayer(L.yearly)) return undefined;
    out.yearly = L.yearly as BuiltSiHuaLayer | undefined;
  }
  if (Object.keys(out).length === 0) return undefined;
  return {
    enabled: true,
    audit: {
      reason: reason.trim(),
      source: typeof (audit as { source?: unknown }).source === "string" ? (audit as { source: string }).source : undefined,
      correlationId:
        typeof (audit as { correlationId?: unknown }).correlationId === "string"
          ? (audit as { correlationId: string }).correlationId
          : undefined,
    },
    layers: out,
  };
}

/** 設為 `"1"` 時一律不套用覆寫（production kill switch） */
export function isSiHuaDisplayOverrideDisabledByEnv(): boolean {
  return getNodeProcessEnv("LIFEBOOK_SIHUA_DISPLAY_OVERRIDE_DISABLE") === "1";
}

/**
 * 將 worker 計算結果與顯式覆寫合併。無效或關閉的覆寫會忽略並回傳 worker 結果。
 */
export function applySiHuaDisplayOverride(
  chartJson: Record<string, unknown> | undefined,
  workerLayers: BuiltSiHuaLayers
): ApplySiHuaDisplayOverrideResult {
  if (isSiHuaDisplayOverrideDisabledByEnv()) {
    return { layers: { ...workerLayers }, applied: false };
  }
  const ov = readOverride(chartJson);
  if (!ov) {
    return { layers: { ...workerLayers }, applied: false };
  }
  const merged: BuiltSiHuaLayers = { ...workerLayers };
  if (ov.layers.benming !== undefined) merged.benming = ov.layers.benming;
  if (ov.layers.decadal !== undefined) merged.decadal = ov.layers.decadal;
  if (ov.layers.yearly !== undefined) merged.yearly = ov.layers.yearly;
  return { layers: merged, applied: true, audit: ov.audit };
}

/**
 * 結構化稽核 log（JSON 單行）；由 buildSiHuaLayers 在 applied 時呼叫。
 */
export function logSiHuaDisplayOverrideApplied(audit: SiHuaDisplayOverrideAudit): void {
  console.info(
    JSON.stringify({
      tag: "lifebook/sihua-display-override",
      reason: audit.reason,
      source: audit.source ?? null,
      correlationId: audit.correlationId ?? null,
    })
  );
}
