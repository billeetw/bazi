import { describe, it, expect } from "vitest";
import {
  canonicalMingDualStarKey,
  getMingDualMainStarNarrativeText,
} from "../worker/src/lifebook/s17/palaceNarrative/mingDualMainStarNarrative";
import type { PalaceRawInput } from "../worker/src/lifebook/s17/palaceNarrative/palaceNarrativeTypes";

describe("mingDualMainStarNarrative", () => {
  it("canonicalMingDualStarKey is order-independent", () => {
    expect(canonicalMingDualStarKey("巨門", "天機")).toBe("天機+巨門");
    expect(canonicalMingDualStarKey("天機", "巨門")).toBe("天機+巨門");
  });

  it("returns null when not 命宮 or not exactly two main stars", () => {
    const base: PalaceRawInput = {
      palace: "命宮",
      mainStars: ["紫微"],
      minorStars: [],
      miscStars: [],
    };
    expect(getMingDualMainStarNarrativeText(base)).toBeNull();
    expect(
      getMingDualMainStarNarrativeText({
        ...base,
        palace: "財帛宮",
        mainStars: ["天機", "巨門"],
      })
    ).toBeNull();
  });

  it("returns null when pair is not in entries (e.g. 紫微+天機)", () => {
    const raw: PalaceRawInput = {
      palace: "命宮",
      mainStars: ["紫微", "天機"],
      minorStars: [],
      miscStars: [],
    };
    expect(getMingDualMainStarNarrativeText(raw)).toBeNull();
  });

  it("returns text when pair hits ming-dual corpus (天機+巨門)", () => {
    const raw: PalaceRawInput = {
      palace: "命宮",
      mainStars: ["天機", "巨門"],
      minorStars: [],
      miscStars: [],
    };
    const t = getMingDualMainStarNarrativeText(raw);
    expect(t).toBeTruthy();
    expect(t).toContain("【命宮雙主星專題】");
    expect(t).toContain("機巨");
  });
});
