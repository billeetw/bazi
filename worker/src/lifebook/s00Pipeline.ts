/**
 * s00 統一 pipeline：normalize → detect → dedupe → render 主文 + debug
 * 不改既有 buildS00EventsFromChart，只在其上做一層轉換與診斷。
 */

import type { SiHuaEvent } from "./s00PatternEngine.js";
import { normalizeSiHuaEvents, type NormalizerInputEvent } from "./s00Normalizer.js";
import { runAllDetectors, dedupeByCanonicalKey, renderMainNarrative, renderDebugEvidence } from "./s00DetectorsV2.js";
import type { PatternHitV2 } from "./s00UnifiedTypes.js";
import { detectDominantPalaces, formatDominantPalacesBlock } from "./dominantPalaceDetector.js";
import type { SiHuaDiagnostics } from "./s00UnifiedTypes.js";

export interface S00PipelineResult {
  mainNarrative: string;
  debugEvidence: string;
  diagnostics: SiHuaDiagnostics;
  dominantPalacesBlock: string;
  hitCount: number;
  /** 已去重的 hits，供 renderMainNarrativeMergedByPalace 等使用 */
  hits: PatternHitV2[];
}

export interface S00PipelineOptions {
  config?: { tenGodByPalace?: Record<string, string> } | null;
  /** 由呼叫端傳入，避免循環依賴（例如 lifeBookPrompts.buildS00EventsFromChart） */
  buildEvents: (chart: Record<string, unknown>) => SiHuaEvent[];
}

/**
 * 從 chartJson 產出 s00 主文、debug 區塊、diagnostics、主戰場區塊
 */
export function runS00Pipeline(chartJson: Record<string, unknown>, options: S00PipelineOptions): S00PipelineResult {
  const rawEvents = options.buildEvents(chartJson);
  const inputEvents: NormalizerInputEvent[] = rawEvents.map((e) => ({ ...e, layer: e.layer }));

  const { events, diagnostics } = normalizeSiHuaEvents(inputEvents);
  let hits = runAllDetectors(events);
  hits = dedupeByCanonicalKey(hits);

  if (hits.length === 0) {
    if (events.length === 0) diagnostics.emptyReason = "無四化事件可分析（events 為空）";
    else if (diagnostics.missingFields.length >= events.length) diagnostics.emptyReason = "events 全部缺 from/to 或必填欄位，無法命中規則";
    else diagnostics.emptyReason = "四化層級只剩單層或無符合條件的疊加／忌線／環";
  }

  const mainNarrative = renderMainNarrative(hits);
  const debugEvidence = renderDebugEvidence(hits, diagnostics);
  const dominant = detectDominantPalaces({ chartJson, config: options.config ?? null, events });
  const dominantPalacesBlock = formatDominantPalacesBlock(dominant);

  return {
    mainNarrative,
    debugEvidence,
    diagnostics,
    dominantPalacesBlock,
    hitCount: hits.length,
    hits,
  };
}
