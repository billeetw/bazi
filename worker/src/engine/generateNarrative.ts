/**
 * 四化敘事總管：events → normalize → detect → merge → 字典查表 → 主文 + debug
 * 主文禁止 ruleId/raw；debug 必含 ruleId、evidence、diagnostics、R11 因果命中
 */

import { normalizeSiHuaEvents, type NormalizerInputEvent } from "./normalizeSiHuaEvents.js";
import { runAllDetectors } from "./patternDetectors.js";
import { mergePatternHits } from "./patternMerge.js";
import {
  getPalaceCausalityMatrix,
  getPalaceTransformDictionary,
  getStarTransformDictionary,
  star_consultation_dictionary,
  lookupCausality,
  type PalaceCausalityRow,
} from "./loadData.js";
import type { SiHuaEvent, SiHuaDiagnostics, PatternHit, TransformZh } from "./types.js";
import { getStarSemanticPhrases } from "../lifebook/starSemanticDictionary.js";

export interface NarrativeResult {
  mainText: string;
  debug: DebugBlock[];
  diagnostics: SiHuaDiagnostics;
  /** 已去重 hits，供決策引擎或命書 s00 使用 */
  mergedHits: PatternHit[];
}

export interface DebugBlock {
  ruleId: string;
  evidenceCount: number;
  causalityMatch?: boolean;
  payload?: Record<string, unknown>;
}

/** 主文用：取 Top1 R01、Top1 R02、最多 2 條 R11（R03/R30 僅 debug） */
function getMainHits(hits: PatternHit[]): PatternHit[] {
  const r01 = hits.filter((h) => h.ruleId === "R01");
  const r02 = hits.filter((h) => h.ruleId === "R02");
  const r11 = hits.filter((h) => h.ruleId === "R11");
  const out: PatternHit[] = [];
  if (r01.length > 0) out.push(r01[0]);
  if (r02.length > 0) out.push(r02.sort((a, b) => b.severity - a.severity)[0]);
  for (let i = 0; i < Math.min(2, r11.length); i++) out.push(r11[i]);
  return out;
}

function lookupStarConsultation(star: string): { themes: string[]; tension: string; strategy: string } | undefined {
  const row = star_consultation_dictionary.find((r) => r.star === star);
  return row ? { themes: row.themes, tension: row.tension, strategy: row.strategy } : undefined;
}

function lookupPalaceTransform(palace: string, transform: string): { meaning: string; advice: string } | undefined {
  const dict = getPalaceTransformDictionary();
  const row = dict.find((r) => r.palace === palace && r.transform === transform);
  return row ? { meaning: row.meaning, advice: row.advice } : undefined;
}

function lookupStarTransform(star: string, transform: string): { meaning: string; counsel: string; do: string; dont: string } | undefined {
  const dict = getStarTransformDictionary();
  const row = dict.find((r) => r.star === star && r.transform === transform);
  return row ? { meaning: row.meaning, counsel: row.counsel, do: row.do, dont: row.dont } : undefined;
}

/** R11 飛宮導線：因果矩陣未命中時固定 fallback，主文不可空白。 */
const R11_CAUSALITY_FALLBACK = (from: string, to: string) =>
  `${from} 的壓力／資源會在 ${to} 顯化，可留意兩宮之間的連動。`;

/** R11 主文：有因果矩陣用 consultation + advice；無則固定 fallback（不可空白） */
function buildR11MainLine(
  hit: PatternHit,
  causality: PalaceCausalityRow | undefined,
  from: string,
  to: string,
  transform: string
): string {
  if (causality) {
    const line = `${causality.consultation} ${causality.advice}`.trim();
    if (line) return line;
  }
  return R11_CAUSALITY_FALLBACK(from, to);
}

/** 單段主文（不含 [Rxx]）：R01 用星曜語義 + consultation；R02 用 palace+transform；R11 用 causality 或 fallback */
function buildMainParagraph(hit: PatternHit, causalityMatrix: PalaceCausalityRow[]): string {
  if (hit.ruleId === "R01") {
    const star = (hit.payload?.star as string) ?? hit.evidence[0]?.star ?? "";
    const phrases = getStarSemanticPhrases(star);
    const lead = `${phrases.name}代表『${phrases.coreForQuote}』，多個時間層級都指向它，是這局的核心槓桿。`;
    const cons = lookupStarConsultation(star);
    if (cons) return `${lead} ${cons.tension} ${cons.strategy}`.trim();
    return lead;
  }
  if (hit.ruleId === "R02") {
    const palace = (hit.payload?.toPalace as string) ?? "";
    const row = lookupPalaceTransform(palace, "祿");
    if (row) return `${hit.summary} ${row.meaning} ${row.advice}`.trim();
    return hit.summary;
  }
  if (hit.ruleId === "R11") {
    const from = (hit.payload?.fromPalace as string) ?? "";
    const to = (hit.payload?.toPalace as string) ?? "";
    const transform = (hit.payload?.transform as TransformZh) ?? "忌";
    const causality = lookupCausality(causalityMatrix, from, to, transform);
    return buildR11MainLine(hit, causality, from, to, transform);
  }
  return hit.summary;
}

export function generateNarrative(input: NormalizerInputEvent[] | null | undefined): NarrativeResult {
  const { events, diagnostics } = normalizeSiHuaEvents(input);
  if (events.length === 0) {
    return {
      mainText: "",
      debug: [],
      diagnostics: { ...diagnostics, emptyReason: "無四化事件" },
      mergedHits: [],
    };
  }

  const matrix = getPalaceCausalityMatrix();
  const isCausalityMatch = (from: string, to: string, transform: string) =>
    !!lookupCausality(matrix, from, to, transform as TransformZh);

  const hits = runAllDetectors(events);
  const merged = mergePatternHits(hits, isCausalityMatch);
  const mainHits = getMainHits(merged);

  const mainText = mainHits.map((h) => buildMainParagraph(h, matrix)).filter(Boolean).join("\n\n");
  const debug: DebugBlock[] = merged.map((h) => {
    const from = (h.payload?.fromPalace as string) ?? "";
    const to = (h.payload?.toPalace as string) ?? "";
    const transform = (h.payload?.transform as string) ?? "";
    const causalityMatch = h.ruleId === "R11" ? !!lookupCausality(matrix, from, to, transform as TransformZh) : undefined;
    return {
      ruleId: h.ruleId,
      evidenceCount: h.evidence.length,
      causalityMatch,
      payload: h.payload,
    };
  });

  return {
    mainText,
    debug,
    diagnostics,
    mergedHits: merged,
  };
}

/** 僅回傳主文（無 debug/diagnostics） */
export function generateMainTextOnly(input: NormalizerInputEvent[] | null | undefined): string {
  return generateNarrative(input).mainText;
}
