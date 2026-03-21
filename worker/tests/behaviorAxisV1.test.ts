import { describe, expect, it } from "vitest";
import {
  applyBehaviorAxisLayersToPalaceNarrative,
  getBehaviorAxis,
  getLoopLineV1,
  getStarAxisConflictLineV1,
  mainStarsIncludeStar,
  textPassesBehaviorAxisToneGateV1,
} from "../src/lifebook/s17/palaceNarrative/behaviorAxisV1.js";

describe("behaviorAxisV1", () => {
  it("getBehaviorAxis by ming branch", () => {
    expect(getBehaviorAxis("寅")).toBe("dynamic");
    expect(getBehaviorAxis("亥")).toBe("dynamic");
    expect(getBehaviorAxis("子")).toBe("relational");
    expect(getBehaviorAxis("酉")).toBe("relational");
    expect(getBehaviorAxis("辰")).toBe("introverted");
    expect(getBehaviorAxis("未")).toBe("introverted");
  });

  it("getStarAxisConflictLineV1 returns first by priority", () => {
    expect(getStarAxisConflictLineV1(["太陰", "天同"], "dynamic")).toMatch(/感受與消化/);
    expect(getStarAxisConflictLineV1(["武曲"], "introverted")).toMatch(/扛起來/);
    expect(getStarAxisConflictLineV1(["武曲"], "dynamic")).toBeUndefined();
  });

  it("mainStarsIncludeStar matches 化忌後綴", () => {
    expect(mainStarsIncludeStar(["太陰化忌"], "太陰")).toBe(true);
  });

  it("getLoopLineV1", () => {
    expect(getLoopLineV1("命宮")).toContain("比較像你");
    expect(getLoopLineV1("遷移宮")).toBeUndefined();
  });

  it("tone gate rejects framework phrases", () => {
    expect(textPassesBehaviorAxisToneGateV1("你是那種會拖延的人")).toBe(false);
    expect(textPassesBehaviorAxisToneGateV1("先慢一點再動")).toBe(true);
  });

  it("applyBehaviorAxisLayersToPalaceNarrative narrow palaces only", () => {
    const base = {
      palace: "遷移宮",
      mainStars: ["天機"],
      decisionPatterns: ["a", "b", "c"],
      pitfalls: ["p1", "p2", "p3"],
      mingSoulBranch: "寅",
      flags: { behaviorAxisV1: true },
      narrowPalacesOnly: true,
    };
    const out = applyBehaviorAxisLayersToPalaceNarrative(base);
    expect(out.pitfalls).toEqual(base.pitfalls);
  });

  it("applyBehaviorAxisLayersToPalaceNarrative 福德 + v1 + loop", () => {
    const out = applyBehaviorAxisLayersToPalaceNarrative({
      palace: "福德宮",
      mainStars: [],
      decisionPatterns: ["d1", "d2", "d3"],
      pitfalls: ["e1", "e2", "e3"],
      mingSoulBranch: "子",
      flags: { behaviorAxisV1: true, behaviorAxisLoopV1: true },
      narrowPalacesOnly: true,
    });
    expect(out.behaviorAxis).toBe("relational");
    expect(out.pitfalls[2]).toContain("這樣下來");
    expect(out.decisionPatterns[2]).toContain("評估人與關係");
    expect(out.behaviorLoopLine).toContain("先讓自己好一點");
  });
});
