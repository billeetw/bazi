import { describe, expect, it } from "vitest";
import { getPrimarySectionKeyForPalaceId } from "../src/lifebook-viewer/constants";

describe("getPrimarySectionKeyForPalaceId", () => {
  it("命宮：SECTION_ORDER 中 s04 早於 s02", () => {
    expect(getPrimarySectionKeyForPalaceId("ming")).toBe("s04");
  });

  it("十二宮皆有 primary key", () => {
    const ids = [
      "ming",
      "xiongdi",
      "fuqi",
      "zinv",
      "caibo",
      "jie",
      "qianyi",
      "nuppu",
      "guanlu",
      "tianzhai",
      "fude",
      "fumu",
    ] as const;
    for (const id of ids) {
      expect(getPrimarySectionKeyForPalaceId(id)).toMatch(/^s\d/);
    }
  });
});
