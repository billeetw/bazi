import { describe, expect, it } from "vitest";
import {
  buildTimelineHeroViewModelV0,
  buildTimelineRailNodesV0,
  parseYearFromDayKey,
  resolveCurrentFocusV0,
} from "../src/lifebook-viewer/viewmodels/timelineNarrativeV0";
import type { DayContractV1 } from "../src/lifebook-viewer/types/dayContract";

const tc = {
  time_zone: "Asia/Taipei",
  day_key: "2026-03-28",
  client_now_iso: "2026-03-28T12:00:00.000Z",
  day_key_mode: "civil_client_tz" as const,
  timezone_source: "client_iana" as const,
};

describe("timelineNarrativeV0", () => {
  it("parseYearFromDayKey", () => {
    expect(parseYearFromDayKey("2026-03-28")).toBe(2026);
    expect(parseYearFromDayKey("bad")).toBeNull();
  });

  it("resolveCurrentFocusV0: contract → day", () => {
    const c = { surface_label_key: "zwds_daily" } as Partial<DayContractV1>;
    expect(
      resolveCurrentFocusV0({
        contract: c as DayContractV1,
        timeContext: tc,
        loading: false,
      })
    ).toBe("day");
  });

  it("buildTimelineRailNodesV0 has span + year + day with presentation", () => {
    const nodes = buildTimelineRailNodesV0({
      contract: null,
      timeContext: tc,
      currentFocus: "year",
      dayKey: "2026-03-28",
    });
    expect(nodes).toHaveLength(3);
    expect(nodes[0]?.kind).toBe("span");
    expect(nodes[1]?.kind).toBe("point");
    if (nodes[1]?.kind === "point") {
      expect(nodes[1].granularity).toBe("year");
      expect(nodes[1].presentation.emphasis).toBe("yearGlow");
    }
    expect(nodes[2]?.kind).toBe("point");
    if (nodes[2]?.kind === "point") {
      expect(nodes[2].presentation.showDot).toBe(true);
      expect(nodes[2].presentation.dotPulse).toBe(false);
      expect(nodes[2].primaryText).toBe("2026-03-28");
    }
  });

  it("buildTimelineHeroViewModelV0 loading clears headline", () => {
    const vm = buildTimelineHeroViewModelV0({
      contract: null,
      timeContext: tc,
      loading: true,
      error: null,
      currentFocus: "day",
    });
    expect(vm.headline).toBe("");
  });
});
