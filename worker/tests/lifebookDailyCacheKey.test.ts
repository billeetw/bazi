import { describe, expect, it } from "vitest";
import { lifebookDailyHoroscopeCacheKey } from "../src/lifebook/lifebookGenerateFingerprint.js";
import { IZTRO_TIME_INDEX_MAPPING_VERSION } from "../../shared/iztroTimeIndex.js";

describe("lifebookDailyHoroscopeCacheKey", () => {
  it("含 fingerprint、tz、day_key、timeIndex、idxmap 版本", () => {
    const k = lifebookDailyHoroscopeCacheKey("fp1", "2026-03-28", "Asia/Taipei", 5);
    expect(k).toContain("fp1");
    expect(k).toContain("Asia/Taipei");
    expect(k).toContain("2026-03-28");
    expect(k).toContain("ti05");
    expect(k).toContain(`idxmap${IZTRO_TIME_INDEX_MAPPING_VERSION}`);
  });
});
