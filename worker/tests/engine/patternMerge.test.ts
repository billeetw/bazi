/**
 * 去重：同 ruleId + 同 canonicalKey 只留一筆
 */
import { describe, it, expect } from "vitest";
import { mergePatternHits } from "../../src/engine/patternMerge.js";
import type { PatternHit } from "../../src/engine/types.js";

function hit(ruleId: string, canonicalKey: string, severity = 1): PatternHit {
  return {
    ruleId,
    severity,
    summary: "",
    evidence: [],
    payload: { canonicalKey },
  };
}

describe("mergePatternHits", () => {
  it("同 ruleId + 同 canonicalKey 只保留第一筆", () => {
    const hits: PatternHit[] = [
      hit("R01", "star:天同"),
      hit("R01", "star:天同"),
      hit("R02", "to:財帛宮|t:祿"),
    ];
    const merged = mergePatternHits(hits);
    const r01 = merged.filter((h) => h.ruleId === "R01");
    expect(r01.length).toBe(1);
    expect(merged.length).toBe(2);
  });

  it("不同 key 皆保留", () => {
    const hits: PatternHit[] = [
      hit("R01", "star:天同"),
      hit("R01", "star:天機"),
      hit("R11", "from:命宮|to:官祿宮|t:忌"),
    ];
    const merged = mergePatternHits(hits);
    expect(merged.length).toBe(3);
  });
});
