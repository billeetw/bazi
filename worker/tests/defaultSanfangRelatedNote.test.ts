import { describe, expect, it } from "vitest";
import { defaultSanfangRelatedNote } from "../src/lifebook/s17/palaceNarrative/palaceNarrativeCopy.js";

describe("defaultSanfangRelatedNote", () => {
  it("財帛宮 lists ming guanlu fude", () => {
    const s = defaultSanfangRelatedNote("財帛宮");
    expect(s).toContain("財帛宮");
    expect(s).toContain("命宮");
    expect(s).toContain("官祿宮");
    expect(s).toContain("福德宮");
    expect(s).toContain("三方四正");
  });
});
