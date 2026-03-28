import { describe, expect, it } from "vitest";
import { clockHourToTimeIndex, IZTRO_TIME_INDEX_MAPPING_VERSION } from "@shared/iztroTimeIndex";

describe("clockHourToTimeIndex（唯一映射）", () => {
  it("子時：23:00–00:59 → 0", () => {
    expect(clockHourToTimeIndex(23)).toBe(0);
    expect(clockHourToTimeIndex(0)).toBe(0);
  });

  it("丑時：01:00–02:59 → 1", () => {
    expect(clockHourToTimeIndex(1)).toBe(1);
    expect(clockHourToTimeIndex(2)).toBe(1);
  });

  it("亥時：21:00–22:59 → 11", () => {
    expect(clockHourToTimeIndex(21)).toBe(11);
    expect(clockHourToTimeIndex(22)).toBe(11);
  });

  it("映射表版本常數存在（bump 時同步 KV／文件）", () => {
    expect(IZTRO_TIME_INDEX_MAPPING_VERSION.length).toBeGreaterThan(0);
  });
});
