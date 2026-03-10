/**
 * (5) Normalizer：缺欄位時事件仍保留且 diagnostics 有記錄
 */
import { describe, it, expect } from "vitest";
import { normalizeSiHuaEvents } from "../../src/engine/normalizeSiHuaEvents.js";

describe("normalizeSiHuaEvents", () => {
  it("保留缺欄位事件並在 diagnostics.missingFields 記錄", () => {
    const input = [
      { layer: "natal", transform: "lu", starName: "天同", fromPalace: "命宮", toPalace: "財帛宮" },
      { layer: "decade", transform: "ji", fromPalace: "官祿宮", toPalace: "夫妻宮" }, // 缺 star
      { layer: "year", starName: "天機", toPalace: "遷移宮" }, // 缺 fromPalace
    ];
    const { events, diagnostics } = normalizeSiHuaEvents(input);
    expect(events.length).toBe(3);
    expect(diagnostics.missingFields.length).toBeGreaterThanOrEqual(2);
    const missingStar = diagnostics.missingFields.find((m) => m.fields.includes("star"));
    const missingFrom = diagnostics.missingFields.find((m) => m.fields.includes("fromPalace"));
    expect(missingStar).toBeDefined();
    expect(missingFrom).toBeDefined();
  });

  it("空輸入回傳空 events 與空 diagnostics", () => {
    const r1 = normalizeSiHuaEvents(null);
    expect(r1.events).toEqual([]);
    const r2 = normalizeSiHuaEvents(undefined);
    expect(r2.events).toEqual([]);
    const r3 = normalizeSiHuaEvents([]);
    expect(r3.events).toEqual([]);
  });

  it("將 lu/quan/ke/ji 轉為祿權科忌", () => {
    const input = [
      { layer: "natal", transform: "lu", starName: "天同", fromPalace: "命宮", toPalace: "財帛宮" },
      { layer: "decade", transform: "ji", starName: "天機", fromPalace: "兄弟宮", toPalace: "官祿宮" },
    ];
    const { events } = normalizeSiHuaEvents(input);
    expect(events[0].transform).toBe("祿");
    expect(events[1].transform).toBe("忌");
  });
});
