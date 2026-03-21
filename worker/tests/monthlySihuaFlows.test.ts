import { describe, it, expect } from "vitest";
import { buildMonthlySihuaFlows } from "../src/gonggan-flows.js";
import { buildMonthlyFlowsForS19 } from "../src/lifebook/s19/buildMonthlyFlowsForS19.js";

describe("buildMonthlySihuaFlows", () => {
  it("builds month flows for 祿/權/科/忌 with correct toPalace", () => {
    const starsByPalace = new Map<string, string[]>([
      ["兄弟宮", ["廉貞"]],
      ["子女宮", ["破軍"]],
      ["僕役宮", ["武曲"]],
      ["官祿宮", ["太陽"]],
    ]);

    const mutagenStars = {
      祿: "廉貞",
      權: "破軍",
      科: "武曲",
      忌: "太陽",
    };

    const flows = buildMonthlySihuaFlows("甲", "兄弟宮", starsByPalace, mutagenStars);
    expect(flows).toHaveLength(4);
    expect(flows.every((f) => f.layer === "month")).toBe(true);
    expect(flows.every((f) => f.triggerStem === "甲")).toBe(true);
    expect(flows.find((f) => f.transform === "祿")?.toPalace).toBe("兄弟宮");
    expect(flows.find((f) => f.transform === "權")?.toPalace).toBe("子女宮");
    expect(flows.find((f) => f.transform === "科")?.toPalace).toBe("僕役宮");
    expect(flows.find((f) => f.transform === "忌")?.toPalace).toBe("官祿宮");
  });
});

describe("buildMonthlyFlowsForS19", () => {
  it("reads monthlyHoroscope from features.ziwei.monthlyHoroscope", () => {
    const chartJson = {
      ziwei: {
        starByPalace: {
          兄弟宮: ["廉貞"],
          子女宮: ["破軍"],
          僕役宮: ["武曲"],
          官祿宮: ["太陽"],
        },
      },
      features: {
        ziwei: {
          monthlyHoroscope: {
            stem: "甲",
            branch: "寅",
            palace: "兄弟宮",
            mutagenStars: {
              祿: "廉貞",
              權: "破軍",
              科: "武曲",
              忌: "太陽",
            },
            stars: [],
          },
        },
      },
    } as unknown as Record<string, unknown>;

    const flows = buildMonthlyFlowsForS19(chartJson);
    expect(flows).toHaveLength(4);
    expect(flows.every((f) => f.layer === "month")).toBe(true);
  });
});

