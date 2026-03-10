/**
 * 四化事件 normalizer：既有 SiHuaEvent[] → NormalizedSiHuaEvent[] + diagnostics
 * 不改既有資料來源；缺欄位不丟事件，列入 diagnostics.missingFields
 */

import type { SiHuaEvent } from "./s00PatternEngine.js";
import { toPalaceCanonical, toStarName } from "./canonicalKeys.js";
import type {
  NormalizedSiHuaEvent,
  SiHuaDiagnostics,
  SiHuaLayerNormalized,
  SiHuaTransformKey,
} from "./s00UnifiedTypes.js";

const VALID_LAYERS: SiHuaLayerNormalized[] = ["natal", "decade", "year"];
const VALID_TRANSFORMS: SiHuaTransformKey[] = ["lu", "quan", "ke", "ji"];

/** 既有 SiHuaEvent 正規化輸入 */
export type NormalizerInputEvent = Omit<SiHuaEvent, "layer"> & {
  layer: SiHuaLayerNormalized;
};

/** 12 宮 canonical 名（用於判斷 unresolved） */
const PALACE_KEYS_ZH = new Set([
  "命宮", "兄弟宮", "夫妻宮", "子女宮", "財帛宮", "疾厄宮", "遷移宮", "僕役宮", "官祿宮", "田宅宮", "福德宮", "父母宮",
]);

export interface NormalizeResult {
  events: NormalizedSiHuaEvent[];
  diagnostics: SiHuaDiagnostics;
}

function isLayer(x: string): x is SiHuaLayerNormalized {
  return VALID_LAYERS.includes(x as SiHuaLayerNormalized);
}

function isTransform(x: string): x is SiHuaTransformKey {
  return VALID_TRANSFORMS.includes(x as SiHuaTransformKey);
}

/**
 * 將既有事件（含可選 minor）正規化為統一格式，並收集 diagnostics
 */
export function normalizeSiHuaEvents(input: NormalizerInputEvent[] | null | undefined): NormalizeResult {
  const list = Array.isArray(input) ? input : [];
  const diagnostics: SiHuaDiagnostics = {
    missingFields: [],
    unresolvedPalaceKey: [],
    unresolvedStarName: [],
  };
  const events: NormalizedSiHuaEvent[] = [];
  const seenPalaceKeys = new Set<string>();
  const seenStarNames = new Set<string>();

  for (let i = 0; i < list.length; i++) {
    const e = list[i];
    const layer = isLayer(e.layer) ? e.layer : "natal";
    const transform = isTransform(e.transform) ? e.transform : "lu";
    const starNameZh = toStarName(e.starName || (e as { starNameZh?: string }).starNameZh || "");
    const starId = (e as NormalizedSiHuaEvent).starId;
    const fromRaw = (e as SiHuaEvent).fromPalace ?? (e as { fromPalace?: string }).fromPalace ?? "";
    const toRaw = (e as SiHuaEvent).toPalace ?? (e as { toPalace?: string }).toPalace ?? "";

    const missing: string[] = [];
    if (!fromRaw?.trim()) missing.push("fromPalace");
    if (!toRaw?.trim()) missing.push("toPalace");
    if (!starNameZh && !starId) missing.push("star");
    if (missing.length > 0) {
      diagnostics.missingFields.push({ eventIndex: i, fields: missing, raw: e });
    }

    const fromPalace = fromRaw?.trim() ? toPalaceCanonical(fromRaw) : null;
    const toPalace = toRaw?.trim() ? toPalaceCanonical(toRaw) : null;

    if (fromPalace && !PALACE_KEYS_ZH.has(fromPalace)) {
      const key = fromPalace.replace(/宮$/, "");
      if (!seenPalaceKeys.has(key)) {
        seenPalaceKeys.add(key);
        diagnostics.unresolvedPalaceKey.push(fromPalace);
      }
    }
    if (toPalace && !PALACE_KEYS_ZH.has(toPalace)) {
      const key = toPalace.replace(/宮$/, "");
      if (!seenPalaceKeys.has(key)) {
        seenPalaceKeys.add(key);
        diagnostics.unresolvedPalaceKey.push(toPalace);
      }
    }
    if (!starNameZh && !starId && e.starName && !seenStarNames.has(e.starName)) {
      seenStarNames.add(e.starName);
      diagnostics.unresolvedStarName.push(e.starName);
    }

    events.push({
      layer,
      transform,
      starId: starId ?? undefined,
      starNameZh: starNameZh || undefined,
      fromPalace,
      toPalace,
      raw: e,
    });
  }

  return { events, diagnostics };
}
