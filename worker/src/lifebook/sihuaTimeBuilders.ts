/**
 * Time module / 四化時間軸 builder：流年宮位與四化顯示、本命宮干飛化區塊、SihuaTimeBlocks 型別。
 *
 * 模組二四項基礎資料契約（第一階段：單一真值）：
 * - 大限命宮：decadalLimits[含當前年齡].palace（不讀流年／小限）
 * - 大限四化：唯一來源 = decadalLimits[當前].mutagenStars 或 fourTransformations.decadal；不讀 overlap。禁止用 liunian／流年。
 * - 流年命宮：liunian.branch + palaceByBranch 查表，或 liunian.palace（禁止用大限命宮）
 * - 流年四化：唯一來源 = liunian.mutagenStars 或 fourTransformations.liunian。禁止用大限四化。
 */

import { buildPalaceByBranch, getFlowYearPalace } from "../palace-map.js";
import { normalizeChart } from "./normalize/index.js";

/** 正規化 key：祿權科忌 支援中英文 key。 */
function normMutagenStar(
  m: Record<string, string> | null | undefined,
  zh: string,
  en: string
): string {
  if (!m || typeof m !== "object") return "";
  const s = m[zh] ?? m[en];
  return typeof s === "string" ? s.trim() : "";
}

/** 大限四化單一真值：僅從 decadalLimits[當前].mutagenStars 或 fourTransformations.decadal 組裝；不讀 overlap。 */
function getDecadeSihuaMap(
  currentLimitMutagenStars?: Record<string, string> | null
): Record<string, string> {
  const map: Record<string, string> = { 祿: "", 權: "", 科: "", 忌: "" };
  const keys: Array<{ zh: string; en: string }> = [{ zh: "祿", en: "lu" }, { zh: "權", en: "quan" }, { zh: "科", en: "ke" }, { zh: "忌", en: "ji" }];
  if (currentLimitMutagenStars && typeof currentLimitMutagenStars === "object") {
    for (const { zh, en } of keys) {
      const star = normMutagenStar(currentLimitMutagenStars, zh, en);
      if (star) map[zh] = star;
    }
  }
  return map;
}

function formatDecadeSihuaLineFromMap(map: Record<string, string>): string {
  const parts = ["祿", "權", "科", "忌"].map((t) => (map[t] ? `${map[t]}化${t}` : "")).filter(Boolean);
  return parts.length > 0 ? parts.join("、") : "";
}

/**
 * 模組二唯一時間真值：僅從 chartJson 組裝五個時間欄位；大限與流年不互相引用。
 * 大限四化：僅 decadalLimits[當前].mutagenStars 或 fourTransformations.decadal；不讀 overlap。禁止用 liunian。
 */
export function buildTimeModuleDisplayFromChartJson(chartJson: Record<string, unknown>): {
  birthSihuaLine: string;
  currentDecadalPalace: string;
  currentDecadeSihuaLine: string;
  flowYearMingPalace: string;
  flowYearSihuaLine: string;
} {
  const ziwei = chartJson.ziwei as Record<string, unknown> | undefined;
  const yearly = (chartJson.yearlyHoroscope ?? ziwei?.yearlyHoroscope) as { year?: number; mutagenStars?: Record<string, string> } | undefined;
  const ft = (chartJson.fourTransformations ?? ziwei?.fourTransformations) as {
    benming?: { mutagenStars?: Record<string, string> };
    decadal?: { mutagenStars?: Record<string, string> };
    liunian?: { mutagenStars?: Record<string, string> };
  } | undefined;
  const fmt = (m: Record<string, string> | undefined) =>
    m && typeof m === "object"
      ? Object.entries(m)
          .filter(([, v]) => v)
          .map(([k, v]) => `${v}化${k}`)
          .join("、") || ""
      : "";
  const birthSihuaLine = fmt(ft?.benming?.mutagenStars) || "（無生年四化資料）";

  // 大限命宮：仍用 decadalLimits[含當前年齡].palace（年齡用 nominalAge 或 year - birthYear）
  const decadalLimitsForDisplay = (chartJson.decadalLimits ?? ziwei?.decadalLimits) as Array<{ startAge?: number; endAge?: number; palace?: string; mutagenStars?: Record<string, string> }> | undefined;
  const yearlyForAge = (chartJson.yearlyHoroscope ?? ziwei?.yearlyHoroscope) as { nominalAge?: number; age?: number; year?: number } | undefined;
  const birthYear = (chartJson.birthInfo as { year?: number } | undefined)?.year ?? (chartJson.bazi as { year?: number } | undefined)?.year;
  const flowYear = yearlyForAge?.year;
  const nominalAgeForDisplay =
    yearlyForAge?.nominalAge ?? yearlyForAge?.age ?? (flowYear != null && birthYear != null && !Number.isNaN(flowYear) && !Number.isNaN(birthYear) ? flowYear - birthYear : undefined);
  const currentLimitForDisplay =
    Array.isArray(decadalLimitsForDisplay) && decadalLimitsForDisplay.length > 0
      ? nominalAgeForDisplay != null && !Number.isNaN(nominalAgeForDisplay)
        ? decadalLimitsForDisplay.find(
            (lim) =>
              lim.startAge != null &&
              lim.endAge != null &&
              nominalAgeForDisplay >= lim.startAge &&
              nominalAgeForDisplay <= lim.endAge
          ) ?? decadalLimitsForDisplay[0]
        : decadalLimitsForDisplay[0]
      : undefined;
  const palaceRaw = currentLimitForDisplay?.palace ?? "";
  const currentDecadalPalace = palaceRaw ? (palaceRaw.endsWith("宮") ? palaceRaw : palaceRaw + "宮") : "（當前大限）";

  // 大限四化單一真值：優先 decadalLimits[當前].mutagenStars，其次 fourTransformations.decadal（絕不用 liunian）
  const decadeMutagenSource =
    currentLimitForDisplay?.mutagenStars
    ?? (ft?.decadal?.mutagenStars && typeof ft.decadal.mutagenStars === "object" ? ft.decadal.mutagenStars : undefined);
  const decadeMap = getDecadeSihuaMap(decadeMutagenSource);
  const currentDecadeSihuaLine = formatDecadeSihuaLineFromMap(decadeMap) || "（無大限四化資料）";

  const liunian = (chartJson.liunian ?? ziwei?.liunian) as {
    palace?: string;
    destinyPalace?: string;
    palaceName?: string;
    branch?: string;
    mutagenStars?: Record<string, string>;
  } | undefined;
  // 流年命宮：僅查表 palaceByBranch[branch]（唯一權威），禁止再用 offset 公式
  const mingBranch = (chartJson?.ziwei as { core?: { minggongBranch?: string } } | undefined)?.core?.minggongBranch ?? "";
  const palaceByBranch =
    (chartJson as { palaceByBranch?: Record<string, string> }).palaceByBranch
    ?? (mingBranch ? buildPalaceByBranch(mingBranch) : undefined);
  const flowYearPalaceLookup = liunian?.branch && palaceByBranch ? getFlowYearPalace(liunian.branch, palaceByBranch) : null;
  const palaceName =
    (chartJson?.liunian as { palace?: string } | undefined)?.palace ??
    (chartJson?.liunian as { destinyPalace?: string } | undefined)?.destinyPalace ??
    (chartJson?.liunian as { palaceName?: string } | undefined)?.palaceName ??
    null;
  const year = yearly?.year;
  const flowYearMingPalace = flowYearPalaceLookup
    ? flowYearPalaceLookup
    : palaceName
      ? (String(palaceName).trim().endsWith("宮") ? String(palaceName).trim() : `${String(palaceName).trim()}宮`)
      : liunian?.branch && year != null
        ? `${year}年${liunian.branch}位`
        : "（無流年命宮資料）";

  // 流年四化單一真值：僅來自 liunian / fourTransformations.liunian；不讀 overlap。
  const flowYearTransforms =
    liunian?.mutagenStars ??
    ft?.liunian?.mutagenStars ??
    null;
  const liunianStr = fmt(flowYearTransforms ?? undefined);
  const flowYearSihuaLineFinal = liunianStr || "（無流年四化資料）";
  return {
    birthSihuaLine,
    currentDecadalPalace,
    currentDecadeSihuaLine,
    flowYearMingPalace,
    flowYearSihuaLine: flowYearSihuaLineFinal,
  };
}

/** ④ 本命宮干飛化（宮干飛入何宮）：來源 normalizeChart.natal.flows，與 12 宮四化流向一致。 */
export function buildNatalGongganFlowBlock(chartJson: Record<string, unknown> | undefined): string {
  if (!chartJson) return "";
  const chart = normalizeChart(chartJson);
  const flows = chart.natal?.flows;
  const palaceStemMap = chart.palaceStemMap ?? {};
  if (!Array.isArray(flows) || flows.length === 0) return "";
  const lines: string[] = [];
  for (const e of flows) {
    const stem = palaceStemMap[e.fromPalace] ?? "";
    const stemLabel = stem ? `（${stem}干）` : "";
    const star = e.starName ?? "星";
    lines.push(`${e.fromPalace}${stemLabel}化${e.transform}，飛${star}，入${e.toPalace}。`);
  }
  return lines.join("\n");
}

/** 時間軸原子欄位（與 LifebookFindings.timeAxis 對齊）；僅供 Worker 產出 Findings 時使用。 */
export interface SihuaTimeBlocks {
  timelineSummary: string;
  sihuaPlacement: string;
  sihuaEnergy: string;
  natalFlows: string;
  timeAxis: {
    birthSihuaLine: string;
    currentDecadalPalace: string;
    currentDecadeSihuaLine: string;
    flowYearMingPalace: string;
    flowYearSihuaLine: string;
    flowYearSihuaNote: string;
    flowYearSihuaFlyBlock?: string;
    flowYearSihuaFlyExplanations?: string;
  };
}
