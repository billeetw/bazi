/**
 * Phase 1：時間敘事 v0 型別與 ViewModel builders（Focus → Node → Explanation → Hero 聚合順序）。
 * headline / description 文案僅來自 `timelineHeadlineBuilder.ts`。
 */

import type { TimeContextTelemetryPayload } from "../components/home/types";
import type { DayContractV1 } from "../types/dayContract";
import type { SurfaceLabelKey } from "@shared/dayContractSurface";
import { surfaceLabelZh } from "@shared/dayContractSurface";
import type { CurrentFocusV0 } from "./timelineFocusTypes";
import {
  buildHeadlineFromDayContract,
  buildHeadlineWhenError,
  buildHeadlineWhenNoContract,
  TIMELINE_HERO_LOADING_COPY,
} from "./timelineHeadlineBuilder";
import { parseYearFromDayKey } from "./timelineTimeParse";

export type { CurrentFocusV0 } from "./timelineFocusTypes";
export { resolveCurrentFocusV0 } from "./timelineFocusTypes";

/** @deprecated 請自 `timelineTimeParse` 匯入；保留 re-export 相容舊 import */
export { parseYearFromDayKey } from "./timelineTimeParse";

export type TimelinePrecisionV0 = "high" | "summary" | "placeholder";
export type TimelineSourceV0 = "engine" | "copy" | "degraded";

export type TimelinePointGranularityV0 = "day" | "year";

export type PointEmphasisV0 = "muted" | "yearGlow" | "default";

/** 軌道節點：Rail 只依此渲染，不再推導粒度／光點 */
export type TimelinePointNodeV0 = {
  id: string;
  kind: "point";
  granularity: TimelinePointGranularityV0;
  /** 軸上主文案（唯一顯示列） */
  primaryText: string;
  precision: TimelinePrecisionV0;
  source: TimelineSourceV0;
  presentation: {
    showDot: boolean;
    dotPulse: boolean;
    emphasis: PointEmphasisV0;
  };
};

export type TimelineSpanNodeV0 = {
  id: string;
  kind: "span";
  label: string;
  rangeLabel: string;
  precision: TimelinePrecisionV0;
  source: TimelineSourceV0;
};

export type TimelineNodeV0 = TimelinePointNodeV0 | TimelineSpanNodeV0;

/** LayerExplanationModelV0：Phase 1 可不渲染，型別先定 */
export type LayerExplanationModelV0 = {
  layer: "month" | "year" | "decade";
  role: "reason" | "background";
  precision: TimelinePrecisionV0;
  source: TimelineSourceV0;
  title?: string;
  body?: string;
};

/** TimelineHeroViewModelV0：由 DayContract + time_context + headline builder 聚合 */
export type TimelineHeroViewModelV0 = {
  current_focus: CurrentFocusV0;
  label_key: SurfaceLabelKey | null;
  label_text: string;
  headline: string;
  description: string;
  fallback_reason: DayContractV1["fallback_reason"] | null;
  is_fallback: boolean;
  timezone_hint: string | null;
  explanations?: LayerExplanationModelV0[];
};

export function buildTimelineHeroViewModelV0(input: {
  contract: DayContractV1 | null;
  timeContext: TimeContextTelemetryPayload | null;
  loading: boolean;
  error: string | null;
  /** 由 `useTimelineNarrativeFocusV0` 或外層 state 傳入 */
  currentFocus: CurrentFocusV0;
}): TimelineHeroViewModelV0 {
  const tc = input.timeContext;
  const tz = tc?.time_zone ?? null;
  const focus = input.currentFocus;

  if (input.loading) {
    return {
      current_focus: focus,
      label_key: null,
      label_text: TIMELINE_HERO_LOADING_COPY.label_text,
      headline: TIMELINE_HERO_LOADING_COPY.headline,
      description: TIMELINE_HERO_LOADING_COPY.description,
      fallback_reason: null,
      is_fallback: false,
      timezone_hint: tz,
      explanations: undefined,
    };
  }

  if (input.error && !input.contract) {
    const copy = buildHeadlineWhenError(tc, input.error);
    return {
      current_focus: focus,
      label_key: null,
      label_text: copy.label_text,
      headline: copy.headline,
      description: copy.description,
      fallback_reason: null,
      is_fallback: true,
      timezone_hint: tz,
      explanations: undefined,
    };
  }

  if (!input.contract) {
    const copy = buildHeadlineWhenNoContract(tc);
    return {
      current_focus: focus,
      label_key: null,
      label_text: copy.label_text,
      headline: copy.headline,
      description: copy.description,
      fallback_reason: null,
      is_fallback: false,
      timezone_hint: tz,
      explanations: undefined,
    };
  }

  const c = input.contract;
  const label_key = c.surface_label_key;
  const label_text = surfaceLabelZh(label_key);
  const { headline, description } = buildHeadlineFromDayContract(c);

  return {
    current_focus: "day",
    label_key,
    label_text,
    headline,
    description,
    fallback_reason: c.fallback_reason ?? null,
    is_fallback: c.is_fallback,
    timezone_hint: tz ?? c.time_zone,
    explanations: undefined,
  };
}

/** Rail：所有呈現欄位在 builder 內算完 */
export function buildTimelineRailNodesV0(input: {
  contract: DayContractV1 | null;
  timeContext: TimeContextTelemetryPayload | null;
  currentFocus: CurrentFocusV0;
  /** 曆法日 YYYY-MM-DD（今日節點主文案） */
  dayKey: string;
}): TimelineNodeV0[] {
  const tc = input.timeContext;
  const yFromTc = tc ? parseYearFromDayKey(tc.day_key) : null;
  const yFromContract = input.contract ? parseYearFromDayKey(input.contract.day_key) : null;
  const year = yFromContract ?? yFromTc ?? new Date().getFullYear();
  const decadeStart = Math.floor(year / 10) * 10;
  const decadeEnd = decadeStart + 9;

  const hasContract = Boolean(input.contract);
  const yearPrecision: TimelinePrecisionV0 = hasContract ? "summary" : "placeholder";
  const dayPrecision: TimelinePrecisionV0 = hasContract ? "high" : "placeholder";
  const yearEmphasis: PointEmphasisV0 =
    input.currentFocus === "year" ? "yearGlow" : yearPrecision === "placeholder" ? "muted" : "default";
  const dayEmphasis: PointEmphasisV0 = dayPrecision === "placeholder" ? "muted" : "default";
  const dayKeyShort = /^\d{4}-\d{2}-\d{2}$/.test(input.dayKey.trim()) ? input.dayKey.trim().slice(0, 10) : input.dayKey;

  const nodes: TimelineNodeV0[] = [
    {
      id: "span-decade",
      kind: "span",
      label: "十年",
      rangeLabel: `${decadeStart}–${decadeEnd}`,
      precision: "placeholder",
      source: "copy",
    },
    {
      id: "point-year",
      kind: "point",
      granularity: "year",
      primaryText: String(year),
      precision: yearPrecision,
      source: hasContract ? "engine" : "copy",
      presentation: {
        showDot: false,
        dotPulse: false,
        emphasis: yearEmphasis,
      },
    },
    {
      id: "point-day",
      kind: "point",
      granularity: "day",
      primaryText: dayKeyShort,
      precision: dayPrecision,
      source: hasContract ? "engine" : "copy",
      presentation: {
        showDot: true,
        dotPulse: input.currentFocus === "day",
        emphasis: dayEmphasis,
      },
    },
  ];
  return nodes;
}
