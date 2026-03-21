/**
 * starByPalace 與 ziwei.palaces（含 adjectiveStars）應合併，避免財帛等宮漏三台、八座。
 */
import { describe, expect, it } from "vitest";
import { getStarByPalaceFromChart } from "../src/lifebook/normalize/normalizePalaces.js";

describe("getStarByPalaceFromChart merges palaces.adjectiveStars", () => {
  it("unions adjective stars into existing starByPalace for 財帛宮", () => {
    const palaces = Array.from({ length: 12 }, (_, i) =>
      i === 8
        ? {
            majorStars: [] as { name: string }[],
            minorStars: [] as { name: string }[],
            /** 權威來源僅 palaces 時，雜曜須落在對應地支格，不能只靠 starByPalace */
            adjectiveStars: [{ name: "地劫" }, { name: "三台" }, { name: "八座" }, { name: "冠帶" }],
          }
        : { majorStars: [], minorStars: [], adjectiveStars: [] }
    );

    const chart = {
      ziwei: {
        earthlyBranchOfSoulPalace: "寅",
        starByPalace: {
          財帛宮: ["地劫"],
        },
        palaces,
      },
    };

    const map = getStarByPalaceFromChart(chart);
    const cai = map.get("財帛宮") ?? [];
    expect(cai).toContain("地劫");
    expect(cai).toContain("三台");
    expect(cai).toContain("八座");
    expect(cai).toContain("冠帶");
  });

  it("滿 12 格 palaces 時以盤面為準，忽略誤植在 starByPalace 的主星／煞星", () => {
    const palaces = Array.from({ length: 12 }, (_, i) => {
      if (i === 7) {
        return {
          majorStars: [{ name: "紫微" }],
          minorStars: [] as { name: string }[],
          adjectiveStars: [] as { name: string }[],
        };
      }
      if (i === 8) {
        return {
          majorStars: [] as { name: string }[],
          minorStars: [] as { name: string }[],
          adjectiveStars: [{ name: "地劫" }, { name: "三台" }, { name: "八座" }],
        };
      }
      return { majorStars: [], minorStars: [], adjectiveStars: [] };
    });

    const chart = {
      ziwei: {
        earthlyBranchOfSoulPalace: "寅",
        starByPalace: {
          財帛宮: ["紫微", "鈴星", "地劫"],
          疾厄宮: [],
        },
        palaces,
      },
    };

    const map = getStarByPalaceFromChart(chart);
    const cai = map.get("財帛宮") ?? [];
    const jie = map.get("疾厄宮") ?? [];
    expect(cai).not.toContain("紫微");
    expect(cai).not.toContain("鈴星");
    expect(cai).toContain("地劫");
    expect(jie).toContain("紫微");
  });

  it("core.minggongBranch 優先於 earthlyBranchOfSoulPalace；滿盤時不採錯誤的 starByPalace 主星", () => {
    const palaces = Array.from({ length: 12 }, (_, i) => {
      const base = {
        majorStars: [] as { name: string }[],
        minorStars: [] as { name: string }[],
        adjectiveStars: [] as { name: string }[],
      };
      if (i === 9) {
        return { ...base, name: "命宮", majorStars: [{ name: "太陰" }] };
      }
      return base;
    });

    const chart = {
      ziwei: {
        earthlyBranchOfSoulPalace: "子",
        core: { minggongBranch: "亥" },
        starByPalace: {
          命宮: ["武曲", "天相"],
        },
        palaces,
      },
    };

    const map = getStarByPalaceFromChart(chart);
    const ming = map.get("命宮") ?? [];
    expect(ming).toContain("太陰");
    expect(ming).not.toContain("武曲");
    expect(ming).not.toContain("天相");
  });

  it("滿 12 格 + name 時，主星/輔星/雜曜都只取同一格，不與 starByPalace 混用", () => {
    const palaces = Array.from({ length: 12 }, (_, i) => {
      const base = {
        name: i === 1 ? "命宮" : "",
        majorStars: [] as { name: string }[],
        minorStars: [] as { name: string }[],
        adjectiveStars: [] as { name: string }[],
      };
      if (i === 1) {
        return {
          ...base,
          majorStars: [{ name: "太陰" }],
          minorStars: [{ name: "祿存" }],
          adjectiveStars: [{ name: "天才" }, { name: "恩光" }, { name: "病符" }],
        };
      }
      return base;
    });
    const chart = {
      ziwei: {
        core: { minggongBranch: "寅" },
        starByPalace: {
          命宮: ["武曲", "天相", "鈴星", "三台"],
        },
        palaces,
      },
    };
    const map = getStarByPalaceFromChart(chart);
    const ming = map.get("命宮") ?? [];
    expect(ming).toContain("太陰");
    expect(ming).toContain("祿存");
    expect(ming).toContain("天才");
    expect(ming).toContain("恩光");
    expect(ming).toContain("病符");
    expect(ming).not.toContain("武曲");
    expect(ming).not.toContain("天相");
    expect(ming).not.toContain("鈴星");
    expect(ming).not.toContain("三台");
  });

  it("缺 name 時才啟用 rotation fallback", () => {
    const palaces = Array.from({ length: 12 }, (_, i) =>
      i === 9
        ? {
            majorStars: [{ name: "太陰" }],
            minorStars: [] as { name: string }[],
            adjectiveStars: [] as { name: string }[],
          }
        : { majorStars: [], minorStars: [], adjectiveStars: [] }
    );
    const chart = {
      ziwei: {
        core: { minggongBranch: "亥" },
        palaces,
      },
    };
    const map = getStarByPalaceFromChart(chart);
    expect(map.get("命宮") ?? []).toContain("太陰");
  });

  it("compute/all 固定宮序（無 name）不得再旋轉，命宮應維持 index 0", () => {
    const palaces = Array.from({ length: 12 }, (_, i) =>
      i === 0
        ? {
            majorStars: [{ name: "太陰" }],
            minorStars: [{ name: "祿存" }],
            adjectiveStars: [{ name: "天才" }],
          }
        : { majorStars: [], minorStars: [], adjectiveStars: [] }
    );
    const chart = {
      ziwei: {
        core: { minggongBranch: "亥" },
        mainStars: {
          命宮: ["太陰"],
        },
        palaces,
      },
    };
    const map = getStarByPalaceFromChart(chart);
    const ming = map.get("命宮") ?? [];
    expect(ming).toContain("太陰");
    expect(ming).toContain("祿存");
    expect(ming).toContain("天才");
  });
});
