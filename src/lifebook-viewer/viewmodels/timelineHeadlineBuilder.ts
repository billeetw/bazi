/**
 * 唯一文案來源：Hero 的 headline / description / 無盤時標籤。
 * UI 與 `buildTimelineHeroViewModelV0` 不得再自造主敘事字串。
 */

import type { TimeContextTelemetryPayload } from "../components/home/types";
import type { DayContractV1 } from "../types/dayContract";

export type TimelineHeroHeadlineBundle = {
  headline: string;
  description: string;
  /** 無 surface_label_key 時的 kicker 後備 */
  label_text: string;
};

/** 有 DayContract 時：主標／內文僅由此函式從 signals / anchors / palace 產出 */
export function buildHeadlineFromDayContract(contract: DayContractV1): Pick<TimelineHeroHeadlineBundle, "headline" | "description"> {
  const palaceLine = contract.palace ? `流日命宮：${contract.palace}` : "流日命宮";
  const sig = contract.signals.filter((s) => typeof s === "string" && s.trim());
  const headline = sig[0]?.trim() || palaceLine;
  const rest = sig.slice(1);
  const anchorLine = contract.anchors.length ? contract.anchors.join(" · ") : "";
  const description =
    rest.join("；") ||
    anchorLine ||
    (contract.flows.length ? "今日星曜與四化已就緒，可搭配完整閱讀深入。" : "參考命盤結構與今日時間索引。");
  return { headline, description };
}

/**
 * Phase 1 上線測試：不對使用者顯示 raw error（除錯用 telemetry / console）。
 * `error` 保留供呼叫端記 log，不進入 UI。
 */
export function buildHeadlineWhenError(
  _tc: TimeContextTelemetryPayload | null,
  _error: string
): TimelineHeroHeadlineBundle {
  return {
    headline: "暫時無法對齊今日節奏",
    description: "請稍後再試，我們正在重新整理時間與命盤資料",
    label_text: "時間敘事",
  };
}

/**
 * 無 contract 且非 loading、非 error：語氣從容、不講技術，傳達「系統正在運作」。
 * （`tc` 保留供 Phase 2 依語境微調；目前不顯示曆法細節以免焦急。）
 */
export function buildHeadlineWhenNoContract(_tc: TimeContextTelemetryPayload | null): TimelineHeroHeadlineBundle {
  return {
    headline: "正在觀測星象...",
    description: "請稍候片刻",
    label_text: "觀測中",
  };
}

export const TIMELINE_HERO_LOADING_COPY = {
  headline: "",
  description: "",
  label_text: "",
} as const;
