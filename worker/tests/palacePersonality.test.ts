/**
 * 命盤人格層：主星＋強弱 → 行為傾向（敘事用）
 */
import { describe, it, expect } from "vitest";
import { getPalacePersonality } from "../src/lifebook/lifeModel/palacePersonality.js";
import type { PalaceStructure } from "../src/lifebook/normalizedChart.js";
import type { PalaceScoreResult } from "../src/lifebook/lifeModel/types.js";

function palace(p: Partial<PalaceStructure>): PalaceStructure {
  return {
    palace: p.palace ?? "財帛宮",
    mainStars: p.mainStars ?? [],
    assistantStars: p.assistantStars ?? [],
    shaStars: p.shaStars ?? [],
    miscStars: [],
    natalTransformsIn: [],
    natalTransformsOut: [],
    decadalTransformsIn: [],
    decadalTransformsOut: [],
    yearlyTransformsIn: [],
    yearlyTransformsOut: [],
  };
}

function score(n: Partial<PalaceScoreResult>): PalaceScoreResult {
  return {
    score: n.score ?? 2,
    raw: n.raw ?? 2,
    scoreVersion: "v1",
    isEmptyPalace: n.isEmptyPalace ?? false,
  };
}

describe("getPalacePersonality", () => {
  it("財帛宮弱＋廉貞 → 控制型與管錢敘事", () => {
    const p = palace({
      palace: "財帛宮",
      mainStars: [{ name: "廉貞", brightness: "陷" }],
    });
    const r = getPalacePersonality(p, score({ score: 2 }));
    expect(r.style).toBe("controlling");
    expect(r.styleLabel).toBe("控制型");
    expect(r.pattern).toMatch(/掌控|管/);
  });

  it("空宮弱 → 仍有可讀 pattern", () => {
    const p = palace({ palace: "福德宮", mainStars: [] });
    const r = getPalacePersonality(p, score({ score: 1, isEmptyPalace: true }));
    expect(r.styleLabel).toBeTruthy();
    expect(r.pattern.length).toBeGreaterThan(10);
  });
});
