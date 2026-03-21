import { describe, expect, it } from "vitest";
import { findZiweiPalaceSlotIndexForCanonical } from "../src/lifebook/normalize/normalizePalaces.js";

describe("findZiweiPalaceSlotIndexForCanonical", () => {
  it("有 name 時即使 minggongBranch 與 earthlyBranchOfSoulPalace 不一致，仍以 name 找到正確格", () => {
    const palaces = Array.from({ length: 12 }, (_, i) => ({
      name: i === 5 ? "命宮" : "兄弟",
      majorStars: [],
      minorStars: [],
      adjectiveStars: [],
    }));
    const chart = {
      ziwei: {
        core: { minggongBranch: "亥" },
        earthlyBranchOfSoulPalace: "寅",
        palaces,
      },
    };
    expect(findZiweiPalaceSlotIndexForCanonical(chart, "命宮")).toBe(5);
  });

  it("固定宮序且無 name 時，命宮索引應為 0（不得再旋轉）", () => {
    const palaces = Array.from({ length: 12 }, () => ({
      majorStars: [],
      minorStars: [],
      adjectiveStars: [],
    }));
    const chart = {
      ziwei: {
        core: { minggongBranch: "亥" },
        mainStars: { 命宮: ["太陰"] },
        palaces,
      },
    };
    expect(findZiweiPalaceSlotIndexForCanonical(chart, "命宮")).toBe(0);
  });
});
