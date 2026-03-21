import { describe, expect, it } from "vitest";
import { buildWeightedPalaceContext } from "../src/lifebook/s17/weights/parser.js";
import { toCanonicalPalaceName, toDisplayPalaceName } from "../src/lifebook/s17/weights/alias.js";
import type { PalaceRawInput } from "../src/lifebook/s17/palaceNarrative/palaceNarrativeTypes.js";

describe("s17 weights parser (safe phase)", () => {
  it("maps palace alias: 交友宮 display / 僕役宮 canonical", () => {
    expect(toCanonicalPalaceName("交友宮")).toBe("僕役宮");
    expect(toDisplayPalaceName("僕役宮")).toBe("交友宮");
  });

  it("parses same-palace stars and brightness without affecting renderer path", () => {
    const raw: PalaceRawInput = {
      palace: "財帛宮",
      mainStars: ["武曲"],
      minorStars: ["文昌", "祿存"],
      miscStars: ["地劫", "三台"],
      brightness: { 武曲: "得", 文昌: "陷", 地劫: "廟" },
    };
    const ctx = buildWeightedPalaceContext(raw);
    expect(ctx.palaceCanonical).toBe("財帛宮");
    expect(ctx.stars.map((s) => s.star)).toEqual(["武曲", "文昌", "祿存", "地劫", "三台"]);

    const wuqu = ctx.stars.find((s) => s.star === "武曲");
    const dijie = ctx.stars.find((s) => s.star === "地劫");
    expect(wuqu?.starClass).toBe("main");
    expect(wuqu?.finalScores.core).toBeGreaterThan(4.5);
    expect(dijie?.starClass).toBe("malefic");
    expect((dijie?.finalScores.pitfall ?? 0) > (dijie?.finalScores.core ?? 0)).toBe(true);
  });
});
