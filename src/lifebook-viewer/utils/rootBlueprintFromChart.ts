/**
 * 降生藍圖 Hero：由主站寫入之 chart_json（contract／strategic_features_v1）推導命主、身主、身宮。
 * 與主站 ziwei-grid / strategic-panel 欄位對齊。
 */

import type { RootBlueprintHeroMock } from "../components/home/root/rootBlueprintMock";

/** 與 bodyPalaceEngine.findShengongPalace 一致（十二宮順逆） */
const BRANCH_RING = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"] as const;
const PALACE_DEFAULT = [
  "命宮",
  "兄弟",
  "夫妻",
  "子女",
  "財帛",
  "疾厄",
  "遷移",
  "僕役",
  "官祿",
  "田宅",
  "福德",
  "父母",
] as const;

function stripStarLabel(s: unknown): string {
  return String(s ?? "")
    .replace(/^\d+\.?\s*/, "")
    .trim();
}

function findShengongPalaceZh(ziwei: Record<string, unknown>): string | null {
  const core = (ziwei.core as { shengongBranch?: string; minggongBranch?: string } | undefined) ?? undefined;
  const shengongBranch = core?.shengongBranch;
  const minggongBranch = core?.minggongBranch ?? "寅";
  if (!shengongBranch) return null;
  const mingIdx = BRANCH_RING.indexOf(minggongBranch as (typeof BRANCH_RING)[number]);
  const shenIdx = BRANCH_RING.indexOf(shengongBranch as (typeof BRANCH_RING)[number]);
  if (mingIdx < 0 || shenIdx < 0) return null;
  const palaceIndex = (mingIdx - shenIdx + 12) % 12;
  const raw = PALACE_DEFAULT[palaceIndex];
  return raw ? `${raw}宮` : null;
}

/**
 * 有命盤時覆寫降生藍圖 Hero；資料不足時回傳 null（UI 可退回 mock）。
 */
function firstMainStarFromPalace(mainStars: unknown, palaceLabel: string): string {
  if (!mainStars || typeof mainStars !== "object") return "";
  const ms = mainStars as Record<string, unknown>;
  const raw = ms[palaceLabel] ?? ms[palaceLabel.replace("宮", "")];
  if (Array.isArray(raw) && raw.length > 0) return stripStarLabel(raw[0]);
  return "";
}

export function buildRootBlueprintHeroFromChart(chart: Record<string, unknown> | null): RootBlueprintHeroMock | null {
  if (!chart?.ziwei || typeof chart.ziwei !== "object") return null;
  const z = chart.ziwei as Record<string, unknown>;
  const basic = (z.basic as Record<string, unknown>) ?? {};
  const core = (z.core as Record<string, unknown>) ?? {};
  const mainStars = z.mainStars;
  let ming = stripStarLabel(basic.masterStar ?? core.mingzhu ?? core["命主"]);
  const shenStar = stripStarLabel(basic.bodyStar ?? core.shengong ?? core["身主"]);
  if (!ming) ming = firstMainStarFromPalace(mainStars, "命宮");

  let shenGongName = "";
  const bpr = chart.bodyPalaceReport as { bodyPalaceZh?: string } | undefined;
  if (bpr?.bodyPalaceZh) {
    const zh = String(bpr.bodyPalaceZh).trim();
    shenGongName = zh.endsWith("宮") ? zh : `${zh}宮`;
  } else {
    shenGongName = findShengongPalaceZh(z) ?? "";
  }

  if (!ming && !shenStar && !shenGongName) return null;

  return {
    tag: "INCARNATION BLUEPRINT",
    titleLine1: "降生藍圖",
    titleLine2: "你為這具身體準備了什麼？",
    mingZhuLabel: "命主",
    mingZhuName: ming || "—",
    shenZhuLabel: "身主",
    shenZhuName: shenStar || "—",
    shenGongLabel: "身宮",
    shenGongName: shenGongName || "—",
  };
}
