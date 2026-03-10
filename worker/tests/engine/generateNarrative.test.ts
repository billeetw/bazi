/**
 * (3) R11 忌 A→B 且 causality matrix 命中
 * (6) 去重後主文不重複且不含 ruleId；debug 必含 diagnostics 與 evidence
 */
import { describe, it, expect } from "vitest";
import { generateNarrative } from "../../src/engine/generateNarrative.js";

describe("generateNarrative", () => {
  it("R11 忌 命宮→官祿宮 時 causality 命中，主文含 consultation/advice", () => {
    const input = [
      {
        layer: "natal",
        transform: "ji",
        starName: "天同",
        fromPalace: "命宮",
        toPalace: "官祿宮",
      },
    ];
    const { mainText, debug } = generateNarrative(input);
    expect(mainText.length).toBeGreaterThan(0);
    expect(mainText).not.toMatch(/\[R\d+\]/);
    const r11Debug = debug.find((d) => d.ruleId === "R11");
    expect(r11Debug).toBeDefined();
    expect(r11Debug!.causalityMatch).toBe(true);
  });

  it("主文不含 ruleId，debug 含 ruleId 與 evidenceCount", () => {
    const input = [
      { layer: "natal", transform: "lu", starName: "天同", fromPalace: "命宮", toPalace: "財帛宮" },
      { layer: "decade", transform: "lu", starName: "天機", fromPalace: "兄弟宮", toPalace: "財帛宮" },
    ];
    const { mainText, debug, diagnostics } = generateNarrative(input);
    expect(mainText).not.toMatch(/\[R01\]|\[R02\]|\[R11\]|\[R30\]/);
    expect(debug.length).toBeGreaterThan(0);
    expect(debug.every((d) => typeof d.ruleId === "string" && typeof d.evidenceCount === "number")).toBe(true);
    expect(diagnostics).toBeDefined();
    expect(diagnostics.missingFields !== undefined || diagnostics.unresolvedPalaceKey !== undefined).toBe(true);
  });

  it("空輸入回傳空 mainText 與 emptyReason", () => {
    const { mainText, diagnostics } = generateNarrative([]);
    expect(mainText).toBe("");
    expect(diagnostics.emptyReason).toBe("無四化事件");
  });
});
