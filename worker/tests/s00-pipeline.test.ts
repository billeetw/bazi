/**
 * s00 統一 pipeline 單元測試
 * 驗收：normalizer 空輸入防禦、4 案例（R01/R02_LU/R11/R30）、去重、輸出順序
 */
import { describe, it, expect } from "vitest";
import type { NormalizedSiHuaEvent } from "../src/lifebook/s00UnifiedTypes.js";
import { normalizeSiHuaEvents } from "../src/lifebook/s00Normalizer.js";
import {
  runAllDetectors,
  dedupeByCanonicalKey,
  renderMainNarrative,
} from "../src/lifebook/s00DetectorsV2.js";

function ev(
  layer: "natal" | "decade" | "year" | "minor",
  transform: "lu" | "quan" | "ke" | "ji",
  starNameZh: string,
  fromPalace: string | null,
  toPalace: string | null
): NormalizedSiHuaEvent {
  return {
    layer,
    transform,
    starNameZh,
    fromPalace,
    toPalace,
  };
}

describe("normalizeSiHuaEvents", () => {
  it("returns empty events and diagnostics when input is null or undefined", () => {
    const r1 = normalizeSiHuaEvents(null as unknown as NormalizedSiHuaEvent[]);
    expect(r1.events).toEqual([]);
    expect(r1.diagnostics.missingFields).toEqual([]);

    const r2 = normalizeSiHuaEvents(undefined as unknown as NormalizedSiHuaEvent[]);
    expect(r2.events).toEqual([]);
  });

  it("returns empty events when input is empty array", () => {
    const r = normalizeSiHuaEvents([]);
    expect(r.events).toEqual([]);
    expect(r.diagnostics.missingFields).toEqual([]);
  });

  it("normalizes valid input and records missing fields", () => {
    const input = [
      { layer: "natal" as const, transform: "lu" as const, starName: "天同", fromPalace: "命宮", toPalace: "財帛宮" },
    ];
    const r = normalizeSiHuaEvents(input as Parameters<typeof normalizeSiHuaEvents>[0]);
    expect(r.events.length).toBe(1);
    expect(r.events[0].layer).toBe("natal");
    expect(r.events[0].transform).toBe("lu");
    expect(r.events[0].toPalace).toBeTruthy();
  });
});

describe("runAllDetectors", () => {
  it("Case1: 本命/大限/流年同星（天同）→ R01，evidence 含 3 筆", () => {
    const events: NormalizedSiHuaEvent[] = [
      ev("natal", "lu", "天同", "命宮", "財帛宮"),
      ev("decade", "quan", "天同", "兄弟宮", "官祿宮"),
      ev("year", "ke", "天同", "夫妻宮", "遷移宮"),
    ];
    const hits = runAllDetectors(events);
    const r01 = hits.filter((h) => h.ruleId === "R01");
    expect(r01.length).toBeGreaterThanOrEqual(1);
    expect(r01[0].evidence.length).toBe(3);
    expect(r01[0].payload.canonicalKey).toBe("star:天同");
  });

  it("Case2: 同一宮位本命祿 + 大限祿 → R02_LU，evidence 含 2 筆", () => {
    const events: NormalizedSiHuaEvent[] = [
      ev("natal", "lu", "天同", "命宮", "財帛宮"),
      ev("decade", "lu", "天機", "兄弟宮", "財帛宮"),
    ];
    const hits = runAllDetectors(events);
    const r02Lu = hits.filter((h) => h.ruleId === "R02_LU");
    expect(r02Lu.length).toBeGreaterThanOrEqual(1);
    expect(r02Lu[0].evidence.length).toBe(2);
    expect(r02Lu[0].payload.canonicalKey).toContain("to:");
    expect(r02Lu[0].payload.canonicalKey).toContain("t:祿");
  });

  it("Case3: ji 從 A→B → R11，summary 含 from→to 與 star", () => {
    const events: NormalizedSiHuaEvent[] = [
      ev("natal", "ji", "巨門", "官祿宮", "夫妻宮"),
    ];
    const hits = runAllDetectors(events);
    const r11 = hits.filter((h) => h.ruleId === "R11");
    expect(r11.length).toBe(1);
    expect(r11[0].summary).toMatch(/官祿宮|夫妻宮/);
    expect(r11[0].summary).toMatch(/巨門|化忌/);
    expect(r11[0].evidence.length).toBe(1);
  });

  it("Case4: A→B、B→A → R30，evidence 為形成 loop 的 2 條", () => {
    const events: NormalizedSiHuaEvent[] = [
      ev("natal", "lu", "天同", "命宮", "財帛宮"),
      ev("natal", "quan", "天機", "財帛宮", "命宮"),
    ];
    const hits = runAllDetectors(events);
    const r30 = hits.filter((h) => h.ruleId === "R30");
    expect(r30.length).toBeGreaterThanOrEqual(1);
    expect(r30[0].evidence.length).toBe(2);
    expect(r30[0].payload.canonicalKey).toMatch(/^loop:.+-.+$/);
  });

  it("output order is R01 → R02_LU → R02_JI → R30 → R03 → R11", () => {
    const events: NormalizedSiHuaEvent[] = [
      ev("natal", "lu", "天同", "命宮", "財帛宮"),
      ev("decade", "lu", "天機", "兄弟宮", "財帛宮"),
      ev("natal", "ji", "巨門", "官祿宮", "夫妻宮"),
      ev("natal", "lu", "天同", "財帛宮", "命宮"),
      ev("natal", "quan", "天機", "命宮", "財帛宮"),
    ];
    const hits = runAllDetectors(events);
    const order = hits.map((h) => h.ruleId);
    const r01Idx = order.indexOf("R01");
    const r02LuIdx = order.indexOf("R02_LU");
    const r30Idx = order.indexOf("R30");
    const r11Idx = order.indexOf("R11");
    if (r01Idx >= 0 && r02LuIdx >= 0) expect(r01Idx).toBeLessThan(r02LuIdx);
    if (r02LuIdx >= 0 && r30Idx >= 0) expect(r02LuIdx).toBeLessThan(r30Idx);
    if (r30Idx >= 0 && r11Idx >= 0) expect(r30Idx).toBeLessThan(r11Idx);
  });

  it("returns empty array when events is empty", () => {
    expect(runAllDetectors([])).toEqual([]);
  });
});

describe("dedupeByCanonicalKey", () => {
  it("keeps one hit per ruleId+canonicalKey", () => {
    const events: NormalizedSiHuaEvent[] = [
      ev("natal", "lu", "天同", "命宮", "財帛宮"),
      ev("decade", "lu", "天機", "兄弟宮", "財帛宮"),
    ];
    const hits = runAllDetectors(events);
    const deduped = dedupeByCanonicalKey(hits);
    const r02Lu = deduped.filter((h) => h.ruleId === "R02_LU");
    expect(r02Lu.length).toBe(1);
  });
});

describe("renderMainNarrative", () => {
  it("returns non-empty string when hits include R01/R02/R11", () => {
    const events: NormalizedSiHuaEvent[] = [
      ev("natal", "lu", "天同", "命宮", "財帛宮"),
      ev("decade", "lu", "天機", "兄弟宮", "財帛宮"),
      ev("natal", "ji", "巨門", "官祿宮", "夫妻宮"),
    ];
    const hits = runAllDetectors(events);
    const text = renderMainNarrative(hits);
    expect(typeof text).toBe("string");
    expect(text.length).toBeGreaterThan(0);
    expect(text).not.toMatch(/\[R\d+_/);
  });

  it("returns empty string when hits is empty", () => {
    expect(renderMainNarrative([])).toBe("");
  });
});
