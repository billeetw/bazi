import type { HomeEventPayload, TimeContextTelemetryPayload } from "../components/home/types";
import type { DayContractV1 } from "../types/dayContract";
import type { CurrentFocusV0 } from "../viewmodels/timelineFocusTypes";
import {
  buildTimelineHeroViewModelV0,
  parseYearFromDayKey,
  type TimelineHeroViewModelV0,
} from "../viewmodels/timelineNarrativeV0";

/** `home_core_viewed`：精簡時間敘事欄位（全量 `time_context` 仍以 payload 為主，由 enrich 補預設） */
export function buildHomeCoreViewedNarrativePayload(input: {
  hero: TimelineHeroViewModelV0;
  timeContext: TimeContextTelemetryPayload | null;
}): Pick<HomeEventPayload, "time_context" | "timeline_narrative_focus" | "surface_label_key" | "fallback_reason" | "year"> {
  const { hero, timeContext } = input;
  const y = timeContext ? parseYearFromDayKey(timeContext.day_key) : undefined;
  return {
    time_context: timeContext ?? undefined,
    timeline_narrative_focus: hero.current_focus,
    surface_label_key: hero.label_key ?? undefined,
    fallback_reason: hero.fallback_reason ?? undefined,
    year: y ?? undefined,
  };
}

/** 由 raw day-flow 狀態組 hero 再組 telemetry payload */
export function buildHomeCoreViewedPayloadFromDayFlow(input: {
  contract: DayContractV1 | null;
  timeContext: TimeContextTelemetryPayload | null;
  loading: boolean;
  error: string | null;
  currentFocus: CurrentFocusV0;
}): Pick<HomeEventPayload, "time_context" | "timeline_narrative_focus" | "surface_label_key" | "fallback_reason" | "year"> {
  const hero = buildTimelineHeroViewModelV0(input);
  return buildHomeCoreViewedNarrativePayload({ hero, timeContext: input.timeContext });
}
