/**
 * 疊宮純資料層：僅用本命星曜、大限四化飛星、流年四化飛星建立每宮 overlay。
 * 不讀 overlap、不做 tag、不做文案；第一版不含本命宮干飛化。
 *
 * 統一架構：NormalizedChart 為唯一真相時，使用 buildPalaceOverlayFromNormalizedChart(chart)。
 */

import { toPalaceCanonical } from "./canonicalKeys.js";
import { getStarByPalaceFromChart } from "./normalize/index.js";
import { buildPalaceByBranch, getFlowYearPalace } from "../palace-map.js";
import {
  buildDecadalSihuaFlows,
  buildYearlySihuaFlows,
  buildPalaceStemMap,
  type GongGanFlow,
} from "../gonggan-flows.js";
import type { NormalizedChart, TransformEdge } from "./normalizedChart.js";
import { PALACES } from "./schema.js";

const CANONICAL_PALACE_ORDER = PALACES.map((p) => toPalaceCanonical(p.name));

/** TransformEdge → GongGanFlow（overlay 適配用；triggerStem 由 chart 無從還原時留空） */
function transformEdgeToGongGanFlow(e: TransformEdge): GongGanFlow {
  return {
    layer: e.layer,
    fromPalace: e.fromPalace,
    triggerStem: "",
    star: (e.starName ?? "").trim() || "星",
    transform: e.transform,
    toPalace: e.toPalace,
    sourceOfTruth: "gonggan-fly",
  };
}

type DecadalLimitRow = {
  palace?: string;
  startAge?: number;
  endAge?: number;
  stem?: string;
};

/** 依當前年齡從 decadalLimits 取包含該年齡的那一步大限；無年齡或找不到則用第一步。 */
function getCurrentDecadalLimit(
  decadalLimits: DecadalLimitRow[] | undefined,
  currentAge: number | undefined
): DecadalLimitRow | null {
  if (!Array.isArray(decadalLimits) || decadalLimits.length === 0) return null;
  if (currentAge != null && !Number.isNaN(currentAge)) {
    const limit = decadalLimits.find(
      (lim) =>
        lim.startAge != null &&
        lim.endAge != null &&
        currentAge >= lim.startAge &&
        currentAge <= lim.endAge
    );
    if (limit) return limit;
  }
  return decadalLimits[0];
}

export interface PalaceOverlayEntry {
  palace: string;
  natalStars: string[];
  /** 本命四化飛入此宮（由 buildPalaceOverlayFromNormalizedChart 填入；舊路徑不填） */
  natalIncoming?: GongGanFlow[];
  /** 本命四化自此宮飛出（同上） */
  natalOutgoing?: GongGanFlow[];
  decadalIncoming: GongGanFlow[];
  decadalOutgoing: GongGanFlow[];
  yearlyIncoming: GongGanFlow[];
  yearlyOutgoing: GongGanFlow[];
}

export interface BuildPalaceOverlayOptions {
  /** 當前年齡，用於選取當前大限；未傳則用 decadalLimits[0] */
  currentAge?: number;
  /** 流年西元年；未傳則用 chartJson.yearlyHoroscope?.year */
  flowYear?: number;
}

/**
 * 只用三層正確資料建立每宮 overlay：本命星曜、大限四化飛星、流年四化飛星。
 * 不讀 overlap、不用已刪除的 fallback、不納入 minorFortune；第一版不含本命宮干飛化。
 */
export function buildPalaceOverlay(
  chartJson: Record<string, unknown> | undefined,
  options?: BuildPalaceOverlayOptions
): PalaceOverlayEntry[] {
  const out: PalaceOverlayEntry[] = [];
  if (!chartJson || typeof chartJson !== "object") return out;

  const starsByPalace = getStarByPalaceFromChart(chartJson);
  const ziwei = chartJson.ziwei as Record<string, unknown> | undefined;
  const decadalLimits = (chartJson.decadalLimits ?? ziwei?.decadalLimits) as DecadalLimitRow[] | undefined;
  const birthYear = (chartJson.birthInfo as { year?: number } | undefined)?.year
    ?? (chartJson.bazi as { year?: number } | undefined)?.year;
  const flowYear = options?.flowYear
    ?? (chartJson.yearlyHoroscope as { year?: number } | undefined)?.year
    ?? (ziwei?.yearlyHoroscope as { year?: number } | undefined)?.year;
  const currentAge =
    options?.currentAge ??
    (flowYear != null && birthYear != null && !Number.isNaN(flowYear) && !Number.isNaN(birthYear)
      ? flowYear - birthYear
      : undefined);

  const currentLimit = getCurrentDecadalLimit(decadalLimits, currentAge);
  const decadalPalace = currentLimit?.palace ? toPalaceCanonical(String(currentLimit.palace).trim()) : "";
  const decadalStem = currentLimit?.stem?.trim();

  const palaceStemMap = buildPalaceStemMap(chartJson);
  const hasDecadal =
    decadalPalace &&
    starsByPalace.size > 0 &&
    (decadalStem || (palaceStemMap[decadalPalace] ?? "").trim());
  const decadalFlows: GongGanFlow[] = hasDecadal
    ? buildDecadalSihuaFlows({
        palaceStemMap,
        starsByPalace,
        decadalPalace,
        decadalStem: decadalStem || undefined,
      })
    : [];

  const yearlyHoroscope = (chartJson.yearlyHoroscope ?? ziwei?.yearlyHoroscope) as { stem?: string; year?: number } | undefined;
  const liunian = (chartJson.liunian ?? ziwei?.liunian) as { stem?: string; branch?: string; palace?: string } | undefined;
  const flowYearStem = yearlyHoroscope?.stem ?? liunian?.stem ?? "";
  const mingBranch = (ziwei?.core as { minggongBranch?: string } | undefined)?.minggongBranch ?? "";
  const palaceByBranch =
    (chartJson.palaceByBranch as Record<string, string> | undefined) ??
    (mingBranch ? buildPalaceByBranch(mingBranch) : undefined);
  const flowYearPalaceRaw =
    (liunian?.branch && palaceByBranch ? getFlowYearPalace(liunian.branch, palaceByBranch) : null) ??
    (liunian?.palace ? (String(liunian.palace).trim().endsWith("宮") ? String(liunian.palace).trim() : `${String(liunian.palace).trim()}宮`) : "");
  const flowYearPalace = flowYearPalaceRaw ? toPalaceCanonical(flowYearPalaceRaw) : "";

  const hasYearly = flowYearStem && flowYearPalace && starsByPalace.size > 0;
  const yearlyFlows: GongGanFlow[] = hasYearly
    ? buildYearlySihuaFlows({
        yearStem: flowYearStem.trim(),
        flowYearPalace,
        starsByPalace,
      })
    : [];

  for (const palace of CANONICAL_PALACE_ORDER) {
    const canon = toPalaceCanonical(palace);
    const natalStars = starsByPalace.get(canon) ?? [];
    const decadalIncoming = decadalFlows.filter((f) => toPalaceCanonical(f.toPalace) === canon);
    const decadalOutgoing = decadalFlows.filter((f) => toPalaceCanonical(f.fromPalace) === canon);
    const yearlyIncoming = yearlyFlows.filter((f) => toPalaceCanonical(f.toPalace) === canon);
    const yearlyOutgoing = yearlyFlows.filter((f) => toPalaceCanonical(f.fromPalace) === canon);

    out.push({
      palace: canon,
      natalStars: [...natalStars],
      decadalIncoming: [...decadalIncoming],
      decadalOutgoing: [...decadalOutgoing],
      yearlyIncoming: [...yearlyIncoming],
      yearlyOutgoing: [...yearlyOutgoing],
    });
  }

  return out;
}

/**
 * 由 NormalizedChart 產出 12 宮 overlay（單一真相來源適配器）。
 * 用於 S17/S18/S19 當組裝層已有 chart 時，不再呼叫 buildPalaceOverlay(chartJson)。
 */
export function buildPalaceOverlayFromNormalizedChart(chart: NormalizedChart): PalaceOverlayEntry[] {
  const palaces = chart.palaces ?? [];
  const byPalace = new Map<string, (typeof palaces)[0]>();
  for (const p of palaces) {
    const key = toPalaceCanonical(p.palace);
    if (key) byPalace.set(key, p);
  }
  const out: PalaceOverlayEntry[] = [];
  for (const palaceKey of CANONICAL_PALACE_ORDER) {
    const pal = byPalace.get(palaceKey);
    if (!pal) {
      out.push({
        palace: palaceKey,
        natalStars: [],
        decadalIncoming: [],
        decadalOutgoing: [],
        yearlyIncoming: [],
        yearlyOutgoing: [],
      });
      continue;
    }
    const natalStars = [
      ...(pal.mainStars ?? []).map((s) => (s?.name ?? "").trim()).filter(Boolean),
      ...(pal.assistantStars ?? []).map((s) => (s?.name ?? "").trim()).filter(Boolean),
      ...(pal.shaStars ?? []).map((s) => (s?.name ?? "").trim()).filter(Boolean),
      ...(pal.miscStars ?? []).map((s) => (s?.name ?? "").trim()).filter(Boolean),
    ];
    out.push({
      palace: pal.palace,
      natalStars,
      natalIncoming: (pal.natalTransformsIn ?? []).map(transformEdgeToGongGanFlow),
      natalOutgoing: (pal.natalTransformsOut ?? []).map(transformEdgeToGongGanFlow),
      decadalIncoming: (pal.decadalTransformsIn ?? []).map(transformEdgeToGongGanFlow),
      decadalOutgoing: (pal.decadalTransformsOut ?? []).map(transformEdgeToGongGanFlow),
      yearlyIncoming: (pal.yearlyTransformsIn ?? []).map(transformEdgeToGongGanFlow),
      yearlyOutgoing: (pal.yearlyTransformsOut ?? []).map(transformEdgeToGongGanFlow),
    });
  }
  return out;
}

/** 單條飛星顯示格式：星名化X，自 fromPalace 飛入 toPalace（S17 專用，不縮寫）。 */
export function formatOverlayFlow(flow: GongGanFlow): string {
  const transformLabel = flow.transform; // 已是 祿|權|科|忌
  return `${flow.star}化${transformLabel}，自${flow.fromPalace}飛入${flow.toPalace}`;
}

/** 單宮 overlay 區塊：本命星曜、大限飛入/飛出、流年飛入/飛出；空則「無」或「- 無」。 */
export function formatPalaceOverlayBlock(item: PalaceOverlayEntry): string {
  const natalLine = item.natalStars.length > 0 ? item.natalStars.join("、") : "無";
  const decadalInLines = item.decadalIncoming.length > 0
    ? item.decadalIncoming.map(formatOverlayFlow).map((s) => `- ${s}`).join("\n")
    : "- 無";
  const decadalOutLines = item.decadalOutgoing.length > 0
    ? item.decadalOutgoing.map(formatOverlayFlow).map((s) => `- ${s}`).join("\n")
    : "- 無";
  const yearlyInLines = item.yearlyIncoming.length > 0
    ? item.yearlyIncoming.map(formatOverlayFlow).map((s) => `- ${s}`).join("\n")
    : "- 無";
  const yearlyOutLines = item.yearlyOutgoing.length > 0
    ? item.yearlyOutgoing.map(formatOverlayFlow).map((s) => `- ${s}`).join("\n")
    : "- 無";

  return [
    `【${item.palace}】`,
    `本命星曜：${natalLine}`,
    "大限飛入：",
    decadalInLines,
    "大限飛出：",
    decadalOutLines,
    "流年飛入：",
    yearlyInLines,
    "流年飛出：",
    yearlyOutLines,
  ].join("\n");
}

/** S17 疊宮分析全文：【疊宮分析】+ 12 宮區塊，僅用 buildPalaceOverlay 結果，不讀 overlap。 */
export function buildPalaceOverlayBlocks(overlay: PalaceOverlayEntry[]): string {
  if (!Array.isArray(overlay) || overlay.length === 0) return "【疊宮分析】\n\n（無 overlay 資料）";
  const header = "【疊宮分析】";
  const blocks = overlay.map(formatPalaceOverlayBlock).join("\n\n");
  return `${header}\n\n${blocks}`;
}

/** 供驗收：印出 12 宮 overlay 摘要（palace, natalStars, decadalIncoming/Outgoing, yearlyIncoming/Outgoing）。 */
export function debugPalaceOverlay(overlay: PalaceOverlayEntry[]): void {
  if (!Array.isArray(overlay)) return;
  console.log("[palace-overlay] === 12 宮 overlay 結果 ===");
  for (const entry of overlay) {
    const decIn = entry.decadalIncoming.length ? entry.decadalIncoming.map((f) => `${f.star}化${f.transform}(←${f.fromPalace})`).join(", ") : "—";
    const decOut = entry.decadalOutgoing.length ? entry.decadalOutgoing.map((f) => `${f.star}化${f.transform}(→${f.toPalace})`).join(", ") : "—";
    const yearIn = entry.yearlyIncoming.length ? entry.yearlyIncoming.map((f) => `${f.star}化${f.transform}(←${f.fromPalace})`).join(", ") : "—";
    const yearOut = entry.yearlyOutgoing.length ? entry.yearlyOutgoing.map((f) => `${f.star}化${f.transform}(→${f.toPalace})`).join(", ") : "—";
    console.log(
      `[palace-overlay] ${entry.palace} | natalStars: [${entry.natalStars.join(", ") || "—"}] | decadalIn: ${decIn} | decadalOut: ${decOut} | yearlyIn: ${yearIn} | yearlyOut: ${yearOut}`
    );
  }
  console.log("[palace-overlay] === end ===");
}
