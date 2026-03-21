import { describe, expect, it } from "vitest";
import { buildPhenomenaSummary } from "../src/lifebook/s17/palaceNarrative/phenomenaSummary.js";

describe("buildPhenomenaSummary", () => {
  it("returns null when only one non-phenomenon line", () => {
    expect(
      buildPhenomenaSummary({
        entries: [{ star: "祿存", text: "代表守成。", isPhenomenon: false }],
        palaceShortLabel: "自我結構",
      })
    ).toBeNull();
  });

  it("returns summary when two explainable lines", () => {
    const s = buildPhenomenaSummary({
      entries: [
        { star: "祿存", text: "代表守成。", isPhenomenon: false },
        { star: "文昌", text: "代表邏輯。", isPhenomenon: false },
      ],
      palaceShortLabel: "自我結構",
    });
    expect(s).toContain("祿存");
    expect(s).toContain("文昌");
  });

  it("returns summary when one phenomenon line", () => {
    const s = buildPhenomenaSummary({
      entries: [{ star: "天馬", text: "你面對外界變化時。", isPhenomenon: true }],
      palaceShortLabel: "自我結構",
    });
    expect(s).toContain("天馬");
  });
});
