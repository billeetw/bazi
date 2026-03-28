/**
 * s17–s19 正式讀者版／技術版共用：疊宮 overlay、s18 訊號、s19 流月 **同一批**預算結果。
 * 僅於 P2 建置 findings 時算一次，寫入 LifebookFindings.timeModuleS17S19ReaderSnapshot；
 * getPlaceholderMapFromContext 與 injectTimeModuleDataIntoSection 只讀此快照，不重算 overlay／不重跑 buildEventSignals。
 */

import type { NormalizedChart } from "./normalizedChart.js";
import { buildPalaceOverlay, buildPalaceOverlayBlocks, buildPalaceOverlayFromNormalizedChart } from "./palaceOverlay.js";
import { buildEventSignals, signalsToNarrative } from "./s18/eventSignals.js";
import { buildS19MonthlyOutput, formatS19MonthlyOutputToCard } from "./s19/index.js";
import {
  buildTimeModuleChartFingerprint,
  isTimeModuleS17S19ReaderSnapshotStale,
} from "./timeModuleChartFingerprint.js";

/** 與 getSectionTechnicalBlocks 強制骨架 {palaceOverlayBlocks}／{s18SignalsBlocks}／{s19MonthlyBlocks} 對齊。 */
export interface TimeModuleS17S19ReaderSnapshot {
  palaceOverlayBlocks: string;
  s18SignalsBlocks: string;
  s19MonthlyBlocks: string;
  /**
   * S17 疊宮邊來源（ADR-0001）：有 NormalizedChart 時為 flows 權威；否則走 chartJson 宮干重建 overlay。
   */
  s17EdgeAuthority?: "normalizedChart_flows" | "chartJson_overlay_only";
  /**
   * S18 訊號與 S17 同源 overlay；與 s17EdgeAuthority 同值。
   */
  s18EdgeAuthority?: "normalizedChart_flows" | "chartJson_overlay_only";
  /**
   * `buildTimeModuleChartFingerprint(chartJson)`；與當前請求的 chart 不符時，placeholder／inject 應即場重算，避免底層新、畫面舊。
   * 舊快照無此欄時視為相容，仍沿用快照內容。
   */
  chartInputFingerprint?: string;
}

const EMPTY: TimeModuleS17S19ReaderSnapshot = {
  palaceOverlayBlocks: "",
  s18SignalsBlocks: "",
  s19MonthlyBlocks: "",
  chartInputFingerprint: "",
};

/**
 * 與 getPlaceholderMapFromContext 內 S17/S18/S19 overlay 區塊同源（單次 overlay + 單次 EventSignals 供 s18 與 s19 共用）。
 */
export function buildTimeModuleS17S19ReaderSnapshot(args: {
  chartJson: Record<string, unknown>;
  normalizedChart?: NormalizedChart | null;
}): TimeModuleS17S19ReaderSnapshot {
  const { chartJson, normalizedChart } = args;
  const chartInputFingerprint = buildTimeModuleChartFingerprint(chartJson);
  const yearlyForAge = (chartJson.yearlyHoroscope ?? (chartJson.ziwei as Record<string, unknown>)?.yearlyHoroscope) as
    | { nominalAge?: number; age?: number; year?: number }
    | undefined;
  const currentAge =
    yearlyForAge?.nominalAge != null
      ? Number(yearlyForAge.nominalAge)
      : yearlyForAge?.age != null
        ? Number(yearlyForAge.age)
        : undefined;
  const flowYear = yearlyForAge?.year ?? (chartJson.yearlyHoroscope as { year?: number } | undefined)?.year;
  const overlay = normalizedChart
    ? buildPalaceOverlayFromNormalizedChart(normalizedChart)
    : buildPalaceOverlay(chartJson, { currentAge, flowYear });
  const s17EdgeAuthority: TimeModuleS17S19ReaderSnapshot["s17EdgeAuthority"] = normalizedChart
    ? "normalizedChart_flows"
    : "chartJson_overlay_only";

  if (!overlay.length) {
    return { ...EMPTY, s17EdgeAuthority, s18EdgeAuthority: s17EdgeAuthority, chartInputFingerprint };
  }

  const signals = buildEventSignals(overlay, chartJson);
  return {
    palaceOverlayBlocks: buildPalaceOverlayBlocks(overlay),
    s18SignalsBlocks: signalsToNarrative(signals),
    s19MonthlyBlocks: formatS19MonthlyOutputToCard(
      buildS19MonthlyOutput({ chartJson, normalizedChart: normalizedChart ?? undefined, s18Signals: signals })
    ),
    s17EdgeAuthority,
    s18EdgeAuthority: s17EdgeAuthority,
    chartInputFingerprint,
  };
}

/** P2 inject：依章節覆寫技術版欄位，與快照對齊（不經 assembleS18 的 selector 文案）。 */
export function mergeInjectP2TimeModuleS17S19Snapshot(
  map: Record<string, string>,
  snap: TimeModuleS17S19ReaderSnapshot | undefined,
  sectionKey: string,
  chartJson?: Record<string, unknown>
): void {
  if (!snap) return;
  if (chartJson && isTimeModuleS17S19ReaderSnapshotStale(snap, chartJson)) return;
  if (sectionKey === "s17") {
    map.palaceOverlayBlocks = snap.palaceOverlayBlocks;
    if (snap.s17EdgeAuthority) map.s17EdgeAuthority = snap.s17EdgeAuthority;
  }
  if (sectionKey === "s18") {
    map.s18SignalsBlocks = snap.s18SignalsBlocks;
    if (snap.s18EdgeAuthority) map.s18EdgeAuthority = snap.s18EdgeAuthority;
  }
  if (sectionKey === "s19") map.s19MonthlyBlocks = snap.s19MonthlyBlocks;
}
