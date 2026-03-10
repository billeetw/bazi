/**
 * (1) R01 同星疊 (2) R02 同宮祿疊 (4) R30 至少 3 宮 loop
 */
import { describe, it, expect } from "vitest";
import {
  detectR01,
  detectR02,
  detectR30,
  runAllDetectors,
} from "../../src/engine/patternDetectors.js";
import type { SiHuaEvent } from "../../src/engine/types.js";

function ev(
  star: string,
  transform: "祿" | "權" | "科" | "忌",
  from: string,
  to: string,
  layer: "natal" | "decade" | "year" = "natal"
): SiHuaEvent {
  return { star, transform, fromPalace: from, toPalace: to, layer };
}

describe("R01 同星疊", () => {
  it("同一星多層級 → R01 命中，evidence 含多筆", () => {
    const events: SiHuaEvent[] = [
      ev("天同", "祿", "命宮", "財帛宮", "natal"),
      ev("天同", "權", "兄弟宮", "官祿宮", "decade"),
      ev("天同", "科", "夫妻宮", "遷移宮", "year"),
    ];
    const hits = detectR01(events);
    expect(hits.length).toBeGreaterThanOrEqual(1);
    const r01 = hits.find((h) => h.ruleId === "R01");
    expect(r01).toBeDefined();
    expect(r01!.evidence.length).toBe(3);
    expect(r01!.payload.canonicalKey).toBe("star:天同");
  });
});

describe("R02 同宮祿疊", () => {
  it("同一 toPalace 多層祿 → R02 命中", () => {
    const events: SiHuaEvent[] = [
      ev("天同", "祿", "命宮", "財帛宮", "natal"),
      ev("天機", "祿", "兄弟宮", "財帛宮", "decade"),
    ];
    const hits = detectR02(events);
    expect(hits.length).toBeGreaterThanOrEqual(1);
    const r02 = hits.find((h) => h.ruleId === "R02");
    expect(r02).toBeDefined();
    expect(r02!.payload.toPalace).toBe("財帛宮");
    expect(r02!.evidence.length).toBe(2);
  });
});

describe("R30 能量環", () => {
  it("至少 3 宮有向環 → R30 命中", () => {
    const events: SiHuaEvent[] = [
      ev("天同", "忌", "命宮", "官祿宮", "natal"),
      ev("天機", "忌", "官祿宮", "夫妻宮", "natal"),
      ev("太陽", "忌", "夫妻宮", "命宮", "natal"),
    ];
    const hits = detectR30(events);
    expect(hits.length).toBeGreaterThanOrEqual(1);
    const r30 = hits.find((h) => h.ruleId === "R30");
    expect(r30).toBeDefined();
    expect(r30!.payload.loop).toBeDefined();
    const loop = r30!.payload.loop as string[];
    expect(loop.length).toBeGreaterThanOrEqual(3);
  });
});

describe("runAllDetectors", () => {
  it("回傳順序為 R01, R02, R03, R30, R11", () => {
    const events: SiHuaEvent[] = [
      ev("天同", "祿", "命宮", "財帛宮", "natal"),
      ev("天同", "權", "兄弟宮", "財帛宮", "decade"),
      ev("天機", "忌", "命宮", "官祿宮", "year"),
    ];
    const hits = runAllDetectors(events);
    const ids = hits.map((h) => h.ruleId);
    const order = ["R01", "R02", "R03", "R30", "R11"];
    for (let i = 1; i < ids.length; i++) {
      const prevIdx = order.indexOf(ids[i - 1]);
      const currIdx = order.indexOf(ids[i]);
      expect(currIdx).toBeGreaterThanOrEqual(prevIdx);
    }
  });
});
