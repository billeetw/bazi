/**
 * 宮干飛化：每宮以該宮宮干查四化表，得祿/權/科/忌星，再查該星在本命盤何宮 → 從該宮出、入星所在宮。
 * 僅用於本命 flows；大限/流年本版不產 from→to flow。
 */

import { toPalaceCanonical } from "./lifebook/canonicalKeys.js";
import { SI_HUA_BY_STEM } from "./sihua-stem-table.js";
import type { TransformDisplay, TransformEdge } from "./lifebook/normalizedChart.js";
import { PALACES } from "./lifebook/schema.js";

export type TransformType = TransformDisplay; // "祿" | "權" | "科" | "忌"

export interface GongGanFlow {
  layer: "natal" | "decade" | "year" | "month";
  fromPalace: string;
  triggerStem: string;
  star: string;
  transform: TransformType;
  toPalace: string;
  sourceOfTruth: "gonggan-fly";
}

/** 宮位 → 天干（命宮、兄弟宮… → 甲乙丙…） */
export type PalaceStemMap = Record<string, string>;

const STEMS = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"] as const;
const PALACE_ORDER = PALACES.map((p) => toPalaceCanonical(p.name));

/**
 * 找星在本命盤哪一宮。
 * @returns 宮位 canonical 名，找不到則 null（不產髒邊）
 */
export function findPalaceByStar(
  starsByPalace: Record<string, string[]> | Map<string, string[]>,
  starName: string
): string | null {
  if (!starName || typeof starName !== "string") return null;
  const star = starName.trim();
  if (!star) return null;
  const entries = starsByPalace instanceof Map ? starsByPalace.entries() : Object.entries(starsByPalace);
  for (const [palace, stars] of entries) {
    const list = Array.isArray(stars) ? stars : [];
    if (list.some((s) => (s || "").trim() === star)) return toPalaceCanonical(palace);
  }
  return null;
}

/**
 * 從 chartJson 建出「本命盤每宮宮干」。
 * 優先：chartJson.palaceStemMap 或 chartJson.ziwei.palaceStemMap；
 * 其次：ziwei.core.minggongStem + 宮位索引順推；
 * 再次：bazi 年干 + ziwei.core.minggongBranch 推命宮天干後順推。
 */
export function buildPalaceStemMap(chartJson: Record<string, unknown> | undefined): PalaceStemMap {
  const out: PalaceStemMap = {};
  if (!chartJson) return out;

  const direct = (chartJson.palaceStemMap ?? (chartJson.ziwei as Record<string, unknown>)?.palaceStemMap) as
    | Record<string, string>
    | undefined;
  if (direct && typeof direct === "object") {
    for (const [palace, stem] of Object.entries(direct)) {
      if (stem && typeof stem === "string") out[toPalaceCanonical(palace)] = stem.trim();
    }
    if (Object.keys(out).length >= 12) return out;
  }

  const ziwei = chartJson.ziwei as Record<string, unknown> | undefined;
  const core = ziwei?.core as Record<string, unknown> | undefined;
  let mingStem: string | null = (core?.minggongStem as string) ?? null;
  if (!mingStem && chartJson.bazi && core?.minggongBranch) {
    const bazi = chartJson.bazi as Record<string, unknown>;
    const yearStem =
      (bazi.display as Record<string, string>)?.yG ??
      (bazi.year as { stem?: string })?.stem ??
      "";
    const mingBranch = String(core.minggongBranch ?? "").trim();
    if (yearStem && mingBranch) {
      const stemIdx = STEMS.indexOf(yearStem as (typeof STEMS)[number]);
      const branchOrder = ["寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥", "子", "丑"];
      const branchIdx = branchOrder.indexOf(mingBranch);
      if (stemIdx >= 0 && branchIdx >= 0) mingStem = STEMS[(stemIdx + branchIdx) % 10];
    }
  }
  if (!mingStem) return out;

  const mingStemIdx = STEMS.indexOf(mingStem as (typeof STEMS)[number]);
  if (mingStemIdx < 0) return out;

  for (let i = 0; i < PALACE_ORDER.length; i++) {
    const palace = PALACE_ORDER[i];
    out[palace] = STEMS[(mingStemIdx + i) % 10];
  }
  return out;
}

/**
 * 建立宮干飛化 flows。
 * 當 findPalaceByStar 回傳 null 時不推入該條，避免 toPalace 為空之髒資料。
 */
export function buildGongGanFlows(params: {
  layer: "natal" | "decade" | "year";
  palaceStemMap: PalaceStemMap;
  starsByPalace: Record<string, string[]> | Map<string, string[]>;
}): GongGanFlow[] {
  const { layer, palaceStemMap, starsByPalace } = params;
  const flows: GongGanFlow[] = [];

  for (const [fromPalace, stem] of Object.entries(palaceStemMap)) {
    if (!stem?.trim()) continue;
    const sihua = SI_HUA_BY_STEM[stem.trim()];
    if (!sihua) continue;

    (["祿", "權", "科", "忌"] as const).forEach((transform) => {
      const star = sihua[transform];
      if (!star) return;
      const toPalace = findPalaceByStar(starsByPalace, star);
      if (!toPalace) return;

      flows.push({
        layer,
        fromPalace: toPalaceCanonical(fromPalace),
        triggerStem: stem.trim(),
        star,
        transform,
        toPalace,
        sourceOfTruth: "gonggan-fly",
      });
    });
  }
  return flows;
}

/** 將宮干飛化轉成 NormalizedChart 使用的 TransformEdge[]（供 natal.flows） */
export function gongGanFlowsToTransformEdges(flows: GongGanFlow[]): TransformEdge[] {
  const out: TransformEdge[] = [];
  for (const f of flows) {
    if (f.layer === "month") continue; // TransformEdge 目前僅支援 natal/decade/year
    out.push({
      fromPalace: f.fromPalace,
      toPalace: f.toPalace,
      transform: f.transform,
      layer: f.layer,
      starName: f.star,
    });
  }
  return out;
}

/**
 * 大限四化飛星公式：大限宮位宮干 → 十干四化 → 飛入本命盤該星所在宮位。
 * 公式：大限四化落宮 = f(大限宮干, 本命星曜位置)；以干飛化，以星定宮。
 * 僅產出「當前大限」一宮的 4 條邊（祿權科忌各一），不疊加本命 12 宮。
 *
 * 重要：必須用「該步大限自己的宮干」(decadalStem)，不可用本命盤該宮的宮干 (palaceStemMap[decadalPalace])。
 * 例如 54–63 歲大限在甲辰宮，宮干為甲，應取甲干四化；若誤用本命僕役宮宮干（戊等）會得到戊干四化，整組錯誤。
 */
export function buildDecadalSihuaFlows(params: {
  palaceStemMap: PalaceStemMap;
  starsByPalace: Record<string, string[]> | Map<string, string[]>;
  decadalPalace: string;
  /** 該步大限的宮干（來自 iztro horoscope.decadal.heavenlyStem 或 decadalLimits[i].stem）；有則優先使用，否則才用 palaceStemMap[decadalPalace] */
  decadalStem?: string;
}): GongGanFlow[] {
  const { palaceStemMap, starsByPalace, decadalPalace, decadalStem } = params;
  const fromPalace = toPalaceCanonical(decadalPalace.trim());
  if (!fromPalace) return [];
  const stem = (decadalStem ?? palaceStemMap[fromPalace])?.trim();
  if (!stem) return [];
  const sihua = SI_HUA_BY_STEM[stem];
  if (!sihua) return [];

  const flows: GongGanFlow[] = [];
  (["祿", "權", "科", "忌"] as const).forEach((transform) => {
    const star = sihua[transform];
    if (!star) return;
    const toPalace = findPalaceByStar(starsByPalace, star);
    if (!toPalace) return;
    flows.push({
      layer: "decade",
      fromPalace,
      triggerStem: stem,
      star,
      transform,
      toPalace,
      sourceOfTruth: "gonggan-fly",
    });
  });
  return flows;
}

/**
 * 流年四化飛星公式：流年天干 → 十干四化 → 自流年命宮飛出 → 飛入本命盤該星所在宮位。
 * 規格 A：飛出宮 = 流年命宮（flowYearPalace）。
 * 規格 B：飛入宮 = 本命盤該四化星所在宮（findPalaceByStar）。
 * 僅產出 4 條邊（祿權科忌各一），與 buildDecadalSihuaFlows 同結構。
 */
export function buildYearlySihuaFlows(params: {
  yearStem: string;
  flowYearPalace: string;
  starsByPalace: Record<string, string[]> | Map<string, string[]>;
}): GongGanFlow[] {
  const { yearStem, flowYearPalace, starsByPalace } = params;
  const stem = (yearStem ?? "").trim();
  if (!stem) return [];
  const fromPalace = toPalaceCanonical(flowYearPalace.trim());
  if (!fromPalace) return [];
  const sihua = SI_HUA_BY_STEM[stem];
  if (!sihua) return [];

  const flows: GongGanFlow[] = [];
  (["祿", "權", "科", "忌"] as const).forEach((transform) => {
    const star = sihua[transform];
    if (!star) return;
    const toPalace = findPalaceByStar(starsByPalace, star);
    if (!toPalace) return;
    flows.push({
      layer: "year",
      fromPalace,
      triggerStem: stem,
      star,
      transform,
      toPalace,
      sourceOfTruth: "gonggan-fly",
    });
  });
  return flows;
}

/**
 * 流月四化飛星公式（S19 用）：
 * - fromPalace = flowMonthPalace（= palaceByBranch[monthly.earthlyBranch]）
 * - toPalace = findPalaceByStar(starsByPalace, mutagen[i])
 * - triggerStem = monthStem（= monthly.heavenlyStem）
 *
 * 四化星名 mutagenStars 由 iztro 流月 horoscope 直接提供（建議必傳）
 * 若未提供則僅作 fallback：使用 SI_HUA_BY_STEM 推導四化星名（可能與 iztro 不一致）
 */
export function buildMonthlySihuaFlows(
  monthStem: string,
  flowMonthPalace: string,
  starsByPalace: Record<string, string[]> | Map<string, string[]>,
  mutagenStars?: Record<string, string> | null
): GongGanFlow[] {
  const stem = (monthStem ?? "").trim();
  if (!stem) return [];

  const fromPalace = toPalaceCanonical(flowMonthPalace.trim());
  if (!fromPalace) return [];

  const sihua = mutagenStars
    ? null
    : SI_HUA_BY_STEM[stem]; // fallback only

  const transforms: Array<{ key: "祿" | "權" | "科" | "忌"; transform: TransformType }> = [
    { key: "祿", transform: "祿" },
    { key: "權", transform: "權" },
    { key: "科", transform: "科" },
    { key: "忌", transform: "忌" },
  ];

  const flows: GongGanFlow[] = [];
  for (const { key, transform } of transforms) {
    const star = (mutagenStars?.[key] ?? sihua?.[key])?.trim();
    if (!star) continue;
    const toPalace = findPalaceByStar(starsByPalace, star);
    if (!toPalace) continue;

    flows.push({
      layer: "month",
      fromPalace,
      triggerStem: stem,
      star,
      transform,
      toPalace,
      sourceOfTruth: "gonggan-fly",
    });
  }
  return flows;
}
