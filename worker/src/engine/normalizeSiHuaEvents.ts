/**
 * 四化事件 normalizer：輸入（buildS00EventsFromChart 格式或相容）→ SiHuaEvent[] + diagnostics
 * 缺欄位不刪事件，列入 diagnostics.missingFields；宮位/星曜用 canonical
 */

import { toPalaceCanonical, toStarName } from "../lifebook/canonicalKeys.js";
import type { SiHuaEvent, SiHuaDiagnostics, NormalizeResult, TransformZh, Layer } from "./types.js";

const PALACE_KEYS_ZH = new Set([
  "命宮", "兄弟宮", "夫妻宮", "子女宮", "財帛宮", "疾厄宮", "遷移宮", "僕役宮", "官祿宮", "田宅宮", "福德宮", "父母宮",
]);

const TRANSFORM_TO_ZH: Record<string, TransformZh> = {
  lu: "祿", quan: "權", ke: "科", ji: "忌",
  祿: "祿", 權: "權", 科: "科", 忌: "忌",
};

const VALID_LAYERS: Layer[] = ["natal", "decade", "year", "minor"];

/** 相容既有 buildS00EventsFromChart 的單筆格式 */
export interface NormalizerInputEvent {
  layer?: string;
  transform?: string;
  starName?: string;
  starNameZh?: string;
  starId?: string;
  fromPalace?: string;
  toPalace?: string;
  [k: string]: unknown;
}

function toTransform(v: string): TransformZh {
  const key = (v || "").trim().toLowerCase();
  return (TRANSFORM_TO_ZH[key] as TransformZh) ?? "祿";
}

function toLayer(v: string): Layer {
  const x = (v || "natal").trim().toLowerCase();
  return VALID_LAYERS.includes(x as Layer) ? (x as Layer) : "natal";
}

export function normalizeSiHuaEvents(input: NormalizerInputEvent[] | null | undefined): NormalizeResult {
  const list = Array.isArray(input) ? input : [];
  const diagnostics: SiHuaDiagnostics = {
    missingFields: [],
    unresolvedPalaceKey: [],
    unresolvedStarName: [],
  };
  const events: SiHuaEvent[] = [];
  const seenPalace = new Set<string>();
  const seenStar = new Set<string>();

  for (let i = 0; i < list.length; i++) {
    const e = list[i];
    const layer = toLayer((e.layer as string) ?? "natal");
    const transform = toTransform((e.transform as string) ?? "lu");
    const starRaw = (e.starName ?? e.starNameZh ?? e.starId ?? "") as string;
    const star = toStarName(String(starRaw || "").trim()) || (starRaw && String(starRaw).trim()) || "";
    const fromRaw = (e.fromPalace ?? "") as string;
    const toRaw = (e.toPalace ?? "") as string;

    const missing: string[] = [];
    if (!String(fromRaw || "").trim()) missing.push("fromPalace");
    if (!String(toRaw || "").trim()) missing.push("toPalace");
    if (!star) missing.push("star");
    if (missing.length > 0) {
      diagnostics.missingFields.push({ eventIndex: i, fields: missing, raw: e });
    }

    const fromPalace = fromRaw?.trim() ? toPalaceCanonical(fromRaw) : "";
    const toPalace = toRaw?.trim() ? toPalaceCanonical(toRaw) : "";

    if (fromPalace && !PALACE_KEYS_ZH.has(fromPalace) && !seenPalace.has(fromPalace)) {
      seenPalace.add(fromPalace);
      diagnostics.unresolvedPalaceKey.push(fromPalace);
    }
    if (toPalace && !PALACE_KEYS_ZH.has(toPalace) && !seenPalace.has(toPalace)) {
      seenPalace.add(toPalace);
      diagnostics.unresolvedPalaceKey.push(toPalace);
    }
    if (starRaw && !star && !seenStar.has(starRaw)) {
      seenStar.add(starRaw);
      diagnostics.unresolvedStarName.push(starRaw);
    }

    events.push({
      star,
      transform,
      fromPalace,
      toPalace,
      layer,
      raw: e,
    });
  }

  return { events, diagnostics };
}
