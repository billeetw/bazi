/**
 * 決策引擎：從 R11 因果命中彙總 decisionTags → 權重排序 → Top 3，每條最多 2 句
 */

import { getPalaceCausalityMatrix, lookupCausality } from "./loadData.js";
import type { PatternHit, DecisionTag } from "./types.js";

const MAX_ADVICE = 3;
const MAX_SENTENCES_PER_ADVICE = 2;

/** 從 R11 hit 的 (from, to, transform) 查因果矩陣，取 decisionTags */
function getTagsForHit(matrix: PalaceCausalityRow[], hit: PatternHit): DecisionTag[] {
  const from = (hit.payload?.fromPalace as string) ?? "";
  const to = (hit.payload?.toPalace as string) ?? "";
  const transform = (hit.payload?.transform as "祿" | "權" | "科" | "忌") ?? "忌";
  const row = lookupCausality(matrix, from, to, transform);
  return (row?.decisionTags as DecisionTag[] | undefined) ?? [];
}

/** 合併 advice 句：每條建議最多 2 句（以。！？分） */
function trimToTwoSentences(text: string): string {
  const parts = text.split(/([。！？])/).filter(Boolean);
  const sentences: string[] = [];
  let buf = "";
  for (let i = 0; i < parts.length; i++) {
    buf += parts[i];
    if (/[。！？]$/.test(parts[i])) {
      sentences.push(buf.trim());
      buf = "";
      if (sentences.length >= MAX_SENTENCES_PER_ADVICE) break;
    }
  }
  if (buf.trim()) sentences.push(buf.trim());
  return sentences.slice(0, MAX_SENTENCES_PER_ADVICE).join("");
}

/**
 * 輸入：events（可選）、R11 的 PatternHit[]（含因果命中的）
 * 輸出：最多 3 條操作建議，每條 ≤2 句
 */
export function buildDecisionAdvice(r11HitsWithCausality: PatternHit[]): string[] {
  const matrix = getPalaceCausalityMatrix();
  const tagScores = new Map<DecisionTag, { score: number; advice: string }>();

  for (const hit of r11HitsWithCausality) {
    const row = lookupCausality(
      matrix,
      (hit.payload?.fromPalace as string) ?? "",
      (hit.payload?.toPalace as string) ?? "",
      (hit.payload?.transform as "祿" | "權" | "科" | "忌") ?? "忌"
    );
    if (!row) continue;
    const tags = (row.decisionTags as DecisionTag[] | undefined) ?? [];
    const weight = hit.severity;
    const advice = trimToTwoSentences([row.consultation, row.advice].filter(Boolean).join(" "));
    for (const tag of tags) {
      const cur = tagScores.get(tag);
      const score = (cur?.score ?? 0) + weight;
      tagScores.set(tag, { score, advice: cur?.advice ?? advice });
    }
  }

  const sorted = [...tagScores.entries()]
    .sort((a, b) => b[1].score - a[1].score)
    .slice(0, MAX_ADVICE);
  return sorted.map(([, v]) => v.advice).filter(Boolean);
}

/**
 * 從完整 PatternHit[] 中篩出 R11 且有因果矩陣命中的，再彙總 Top 3 建議
 */
export function buildDecisionAdviceFromHits(allHits: PatternHit[]): string[] {
  const matrix = getPalaceCausalityMatrix();
  const r11WithCausality = allHits.filter((h) => {
    if (h.ruleId !== "R11") return false;
    const from = (h.payload?.fromPalace as string) ?? "";
    const to = (h.payload?.toPalace as string) ?? "";
    const t = (h.payload?.transform as "祿" | "權" | "科" | "忌") ?? "忌";
    return !!lookupCausality(matrix, from, to, t);
  });
  return buildDecisionAdvice(r11WithCausality);
}
