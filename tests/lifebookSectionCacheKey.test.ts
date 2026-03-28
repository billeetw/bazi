import { describe, expect, it } from "vitest";
import {
  lifebookSectionCacheKey,
  lifebookSectionRateLimitKey,
  buildLifebookGenerateFingerprint,
} from "../worker/src/lifebook/lifebookGenerateFingerprint";

describe("P0 generate-section KV keys", () => {
  const fp = buildLifebookGenerateFingerprint({
    chart_json: { a: 1 },
    weight_analysis: { b: 2 },
    plan_tier: "free",
    unlock_sections: ["s10"],
    output_mode: "technical",
    invite_fingerprint: "ABC",
  });

  it("section cache key 含 fingerprint 與 section_key", () => {
    expect(lifebookSectionCacheKey(fp, "s10")).toContain(fp);
    expect(lifebookSectionCacheKey(fp, "s10")).toContain("s10");
  });

  it("section cache key 含時區與 day_key 時附加兩段", () => {
    const k = lifebookSectionCacheKey(fp, "s10", { timeZone: "Asia/Taipei", dayKey: "2026-03-28" });
    expect(k).toContain("Asia/Taipei");
    expect(k).toContain("2026-03-28");
    expect(k).toContain(":s10:");
  });

  it("rate limit key 與 section 無關、僅 fingerprint", () => {
    expect(lifebookSectionRateLimitKey(fp)).toContain(fp);
    expect(lifebookSectionRateLimitKey(fp)).not.toContain("s10");
  });
});
