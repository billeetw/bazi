/**
 * 決策引擎：R11 因果命中 decisionTags 彙總 → Top 3，每條 ≤2 句
 */
import { describe, it, expect } from "vitest";
import {
  buildDecisionAdvice,
  buildDecisionAdviceFromHits,
} from "../../src/engine/decisionEngine.js";
import { runAllDetectors } from "../../src/engine/patternDetectors.js";
import { normalizeSiHuaEvents } from "../../src/engine/normalizeSiHuaEvents.js";
import { mergePatternHits } from "../../src/engine/patternMerge.js";
import { getPalaceCausalityMatrix, lookupCausality } from "../../src/engine/loadData.js";
import type { PatternHit } from "../../src/engine/types.js";

describe("decisionEngine", () => {
  it("從 R11 因果命中彙總出最多 3 條建議", () => {
    const input = [
      {
        layer: "natal",
        transform: "ji",
        starName: "天同",
        fromPalace: "命宮",
        toPalace: "官祿宮",
      },
      {
        layer: "decade",
        transform: "ji",
        starName: "天機",
        fromPalace: "官祿宮",
        toPalace: "夫妻宮",
      },
    ];
    const { events } = normalizeSiHuaEvents(input);
    const hits = runAllDetectors(events);
    const matrix = getPalaceCausalityMatrix();
    const isMatch = (from: string, to: string, t: string) =>
      !!lookupCausality(matrix, from, to, t as "祿" | "權" | "科" | "忌");
    const merged = mergePatternHits(hits, isMatch);
    const advice = buildDecisionAdviceFromHits(merged);
    expect(advice.length).toBeLessThanOrEqual(3);
    if (advice.length > 0) {
      expect(advice.every((a) => typeof a === "string" && a.length > 0)).toBe(true);
    }
  });

  it("buildDecisionAdvice 空陣列回傳空陣列", () => {
    const advice = buildDecisionAdvice([]);
    expect(advice).toEqual([]);
  });
});
