/**
 * 星曜狀態 slice：SoT 組裝 smoke test
 */
import { describe, it, expect } from "vitest";
import { buildStarStateNarrativeSlice } from "../src/lifebook/lifeModel/starStateNarrativeSlice.js";
import type { PalaceStructure } from "../src/lifebook/normalizedChart.js";
import type { PalaceScoreResult } from "../src/lifebook/lifeModel/types.js";

function emptyPalace(over: Partial<PalaceStructure>): PalaceStructure {
  return {
    palace: "命宮",
    mainStars: [],
    assistantStars: [],
    shaStars: [],
    miscStars: [],
    natalTransformsIn: [],
    natalTransformsOut: [],
    decadalTransformsIn: [],
    decadalTransformsOut: [],
    yearlyTransformsIn: [],
    yearlyTransformsOut: [],
    ...over,
  };
}

function score(p: Partial<PalaceScoreResult>): PalaceScoreResult {
  return {
    score: p.score ?? 3,
    raw: p.raw ?? 3,
    scoreVersion: "v1",
    isEmptyPalace: p.isEmptyPalace ?? false,
  };
}

describe("buildStarStateNarrativeSlice", () => {
  it("紫微在財帛宮：corePattern 來自 starPalacesMain，並帶 provenance", () => {
    const p = emptyPalace({
      palace: "財帛宮",
      mainStars: [{ name: "紫微", brightness: "廟" }],
    });
    const slice = buildStarStateNarrativeSlice(p, score({ score: 4 }));
    expect(slice.corePattern.length).toBeGreaterThan(5);
    expect(slice.provenance.corePattern).toMatch(/starPalacesMain:紫微_/);
    expect(slice.blindSpot.length).toBeGreaterThan(3);
    expect(slice.underStress.length).toBeGreaterThan(3);
    expect(slice.punchline.length).toBeGreaterThan(3);
    expect(["穩定敘事", "中性", "提醒敘事", "高壓敘事"]).toContain(slice.tone);
  });

  it("弱宮＋雙煞：tone 傾向高壓敘事", () => {
    const p = emptyPalace({
      palace: "官祿宮",
      mainStars: [{ name: "天機", brightness: "陷" }],
      shaStars: [{ name: "火星" }, { name: "鈴星" }],
    });
    const slice = buildStarStateNarrativeSlice(p, score({ score: 2 }));
    expect(slice.tone).toBe("高壓敘事");
    expect(slice.provenance.underStress).toMatch(/star-stress-patterns/);
  });

  it("空宮：fallback corePattern", () => {
    const p = emptyPalace({ palace: "福德宮", mainStars: [] });
    const slice = buildStarStateNarrativeSlice(p, score({ score: 1, isEmptyPalace: true }));
    expect(slice.corePattern).toMatch(/無主星/);
    expect(slice.provenance.corePattern).toBe("fallback:empty_or_unknown");
  });
});
