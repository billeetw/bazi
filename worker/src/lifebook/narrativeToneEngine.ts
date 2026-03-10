/**
 * 命理師語氣渲染引擎：pattern hits → 觀察→解釋→建議 段落，以命盤證據列點，不輸出 ruleId。
 * 同 canonicalKey（palace+transform 或 star）的 hits 合併成一段，避免重複。
 */

import type { PatternHit } from "./s00PatternEngine.js";
import type { S00RuleId } from "./s00FourTransformRules.js";
import { getPalaceSemantic } from "./starSemanticDictionary.js";

export type NarrativeCorpusSection = Record<
  string,
  { openers: string[]; explainers: string[]; advisers: string[]; connectors?: string[] }
>;

export interface NarrativeToneInput {
  hits: PatternHit[];
  corpus: NarrativeCorpusSection;
  context?: Record<string, string | string[]>;
}

const RULE_TO_CORPUS_KEY: Partial<Record<S00RuleId, string>> = {
  R01_SAME_STAR_OVERLAP: "sameStarOverlap",
  R02_SAME_PALACE_OVERLAP: "samePalaceLuStack",
  R03_SAME_TRANSFORM_OVERLAP: "samePalaceLuStack",
  R04_SAME_STAR_LU_JI: "sameStarLuJi",
  R05_SAME_PALACE_LU_JI: "samePalaceLuJi",
  R09_DECADE_YEAR_SAME_JI: "samePalaceJiStack",
  R10_DECADE_YEAR_SAME_LU: "samePalaceLuStack",
  R20_SAME_PALACE_SAME_TRANSFORM_STACK: "samePalaceLuStack",
};

/** 從 evidence 建 canonicalKey，同 key 的 hits 合併成一段 */
function getCanonicalKey(hit: PatternHit): string {
  const ev = hit.evidence ?? {};
  const star = typeof ev.star === "string" ? ev.star : Array.isArray(ev.star) ? ev.star[0] : "";
  const palace = typeof ev.palace === "string" ? ev.palace : Array.isArray(ev.palace) ? ev.palace[0] : "";
  const transform = typeof ev.transform === "string" ? ev.transform : "";

  switch (hit.ruleId) {
    case "R01_SAME_STAR_OVERLAP":
      return `star:${star}`;
    case "R04_SAME_STAR_LU_JI":
      return `starLuJi:${star}`;
    case "R05_SAME_PALACE_LU_JI":
      return `palaceLuJi:${palace}`;
    case "R02_SAME_PALACE_OVERLAP":
    case "R03_SAME_TRANSFORM_OVERLAP":
    case "R10_DECADE_YEAR_SAME_LU":
    case "R20_SAME_PALACE_SAME_TRANSFORM_STACK":
      return `palace:祿:${palace}`;
    case "R09_DECADE_YEAR_SAME_JI":
      return `palace:忌:${palace}`;
    default:
      return `${hit.ruleId}:${star}:${palace}`;
  }
}

function fillTemplate(tpl: string, vars: Record<string, string | string[]>): string {
  let out = tpl;
  for (const [k, v] of Object.entries(vars)) {
    const val = Array.isArray(v) ? v.join("、") : (v ?? "");
    out = out.replace(new RegExp(`\\{${k}\\}`, "g"), String(val));
  }
  return out.replace(/\{[^}]+\}/g, "").trim();
}

/** 將 evidence 轉成命理師語言的證據列點（不出現 ruleId） */
function formatEvidenceBullets(hits: PatternHit[]): string {
  const lines: string[] = [];
  const seen = new Set<string>();
  for (const hit of hits) {
    const ev = hit.evidence ?? {};
    const layers = ev.layers;
    const layerArr = Array.isArray(layers) ? (layers as string[]) : layers ? [String(layers)] : [];
    const star = ev.star != null ? String(ev.star) : "";
    const palace = ev.palace != null ? String(ev.palace) : "";
    const transform = ev.transform != null ? String(ev.transform) : "祿";

    if (layerArr.length >= 2 && star) {
      const line = `證據：${layerArr.join("、")} 同時命中 ${star}`;
      if (!seen.has(line)) {
        seen.add(line);
        lines.push(line);
      }
    } else if (layerArr.length >= 2 && palace) {
      const line =
        transform === "忌"
          ? `證據：多層忌星飛入 ${palace}`
          : `證據：${layerArr.map((l) => l + "化" + transform).join("、")} 飛入 ${palace}`;
      if (!seen.has(line)) {
        seen.add(line);
        lines.push(line);
      }
    } else if (star && palace) {
      const line = `證據：${star} 與 ${palace} 相關結構`;
      if (!seen.has(line)) {
        seen.add(line);
        lines.push(line);
      }
    } else if (star) {
      const line = `證據：${star} 被多層四化引動`;
      if (!seen.has(line)) {
        seen.add(line);
        lines.push(line);
      }
    } else if (palace) {
      const line = `證據：四化指向 ${palace}`;
      if (!seen.has(line)) {
        seen.add(line);
        lines.push(line);
      }
    }
  }
  if (lines.length === 0 && hits.length > 0) {
    const ev = hits[0].evidence ?? {};
    const star = ev.star != null ? String(ev.star) : "";
    const palace = ev.palace != null ? String(ev.palace) : "";
    const layers = ev.layers;
    const arr = Array.isArray(layers) ? layers : layers ? [String(layers)] : [];
    if (arr.length) lines.push(`證據：${arr.join("、")}${star ? " 命中 " + star : ""}${palace ? " 飛入 " + palace : ""}`);
  }
  return lines.join("\n");
}

/** 合併一組 hits 的 evidence 成單一 vars 供模板使用（含 palaceCore 供 narrative 句型使用） */
function mergeEvidenceVars(hits: PatternHit[]): Record<string, string | string[]> {
  const ev = hits[0]?.evidence ?? {};
  const layers = ev.layers;
  const layerArr = Array.isArray(layers) ? (layers as string[]) : layers != null ? [String(layers)] : [];
  const star = ev.star != null ? String(ev.star) : "";
  const palace = ev.palace != null ? String(ev.palace) : "";
  const transform = ev.transform != null ? String(ev.transform) : "";
  const palaceCore = palace ? (getPalaceSemantic(palace)?.core ?? "該領域") : "該領域";
  const detail = formatEvidenceBullets(hits);
  const hitsText =
    layerArr.length && (star || palace)
      ? layerArr.join("、") + (star ? " 同時命中 " + star : "") + (palace ? " 飛入 " + palace : "")
      : detail;
  return {
    star,
    palace,
    palaceCore,
    layers: layerArr.length ? layerArr.join("、") : "本命、大限、流年",
    transform: transform || "祿",
    hits: hitsText,
    detail: detail.split("\n")[0] ?? detail,
    fromPalace: (ev.fromPalace != null ? String(ev.fromPalace) : "") as string,
    toPalace: (ev.toPalace != null ? String(ev.toPalace) : palace) as string,
  };
}

/** 確定性選一句：用 ruleId + groupIndex 取模 */
function pickIndex(ruleId: string, groupIndex: number, length: number): number {
  let h = 0;
  for (let i = 0; i < ruleId.length; i++) h = (h * 31 + ruleId.charCodeAt(i)) >>> 0;
  return ((h + groupIndex) % length) >>> 0;
}

/**
 * 輸入 pattern hits 與 corpus，輸出命理師語言段落（觀察→解釋→建議），
 * 同 canonicalKey 合併為一段，證據以命理師語句列點，絕不輸出 ruleId。
 */
export function renderNarrativeBlocks(input: NarrativeToneInput): string[] {
  const { hits, corpus } = input;
  if (!hits.length) return [];

  const byKey = new Map<string, PatternHit[]>();
  for (const hit of hits) {
    const key = getCanonicalKey(hit);
    const list = byKey.get(key) ?? [];
    list.push(hit);
    byKey.set(key, list);
  }

  const blocks: string[] = [];
  let groupIndex = 0;
  for (const [, groupHits] of byKey) {
    if (groupHits.length === 0) continue;
    const hit = groupHits[0];
    const corpusKey = RULE_TO_CORPUS_KEY[hit.ruleId as S00RuleId];
    const ruleSet = corpusKey ? corpus[corpusKey] : undefined;
    if (!ruleSet?.openers?.length || !ruleSet.explainers?.length || !ruleSet.advisers?.length) {
      groupIndex++;
      continue;
    }

    const vars = { ...mergeEvidenceVars(groupHits), ...(input.context ?? {}) };
    const oi = pickIndex(hit.ruleId, groupIndex, ruleSet.openers.length);
    const ei = pickIndex(hit.ruleId + "_e", groupIndex, ruleSet.explainers.length);
    const ai = pickIndex(hit.ruleId + "_a", groupIndex, ruleSet.advisers.length);

    const opener = fillTemplate(ruleSet.openers[oi] ?? ruleSet.openers[0], vars);
    const explainer = fillTemplate(ruleSet.explainers[ei] ?? ruleSet.explainers[0], vars);
    const evidenceBlock = formatEvidenceBullets(groupHits);
    const adviser = fillTemplate(ruleSet.advisers[ai] ?? ruleSet.advisers[0], vars);

    const paragraph = [opener, explainer, evidenceBlock ? `\n${evidenceBlock}` : "", adviser].filter(Boolean).join("\n");
    blocks.push(paragraph.trim());
    groupIndex++;
  }

  return blocks;
}

/**
 * 同上，回傳已 join 的單一字串（段落之間雙換行）。
 */
export function renderNarrativeBlocksAsString(input: NarrativeToneInput): string {
  return renderNarrativeBlocks(input).join("\n\n");
}
