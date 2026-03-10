/**
 * 命書流水線組裝器：將 chartJson + contentDb + lifeBookJson 組裝成正式 LifeBookDocument
 * 此 mapping 必須與 Worker 的 SECTION_TEMPLATES / palace_focus 同步。
 */

import type {
  LifeBookDocument,
  LifeBookMeta,
  LifeBookUserSection,
  LifeBookExpertBlock,
  WeightAnalysis,
} from "../types";
import { SECTION_ORDER } from "../constants";
import {
  LIFEBOOK_SCHEMA_VERSION,
  LIFEBOOK_GENERATOR_VERSION,
} from "../../../js/lifebook-version.js";

/** 與 worker lifeBookTemplates 一致：有宮位聚焦的章節 → 該章要顯示的宮位 */
const SECTION_PALACE_FOCUS: Record<string, string[] | undefined> = {
  s00: undefined,
  s01: ["福德"],
  s02: ["命宮"],
  s03: undefined,
  s04: ["命宮", "福德"],
  s05: ["父母"],
  s06: ["兄弟"],
  s07: ["僕役"],
  s08: ["官祿"],
  s09: ["田宅"],
  s10: ["財帛"],
  s11: ["疾厄"],
  s12: ["遷移"],
  s13: ["夫妻"],
  s14: ["子女"],
  s15: undefined,
  s15a: undefined,
  s16: undefined,
  s17: undefined,
  s18: undefined,
  s19: undefined,
  s20: undefined,
  s21: undefined,
};

type ZiweiMainStars = Record<string, string[]>;

/** /content/2026 回傳結構（至少 starPalaces） */
export interface ContentDb {
  starPalaces?: Record<string, string> | null;
}

/** Worker/GPT 回傳的命書 JSON 形狀 */
export interface LifeBookJsonInput {
  ok?: boolean;
  sections?: Record<string, Partial<LifeBookUserSection>>;
  weight_analysis?: WeightAnalysis | null;
  meta?: Partial<LifeBookMeta> | null;
  expert?: LifeBookExpertBlock | null;
}

export interface BuildLifeBookDocumentParams {
  chartJson: Record<string, unknown> | null | undefined;
  contentDb?: ContentDb | null;
  lifeBookJson: LifeBookJsonInput | null | undefined;
  meta?: Partial<LifeBookMeta>;
}

/**
 * 從 chartJson.ziwei 取得「宮位 → 星曜名[]」
 * 支援 /compute/all 回傳的 mainStars 格式：{ "命宮": ["紫微","天府"], ... }
 */
function getMainStarsFromChart(chartJson: Record<string, unknown> | null | undefined): ZiweiMainStars {
  if (!chartJson?.ziwei || typeof chartJson.ziwei !== "object") return {};
  const ziwei = chartJson.ziwei as Record<string, unknown>;
  const mainStars = ziwei.mainStars;
  if (!mainStars || typeof mainStars !== "object" || Array.isArray(mainStars)) return {};
  const out: ZiweiMainStars = {};
  for (const [palace, stars] of Object.entries(mainStars)) {
    if (Array.isArray(stars) && palace) {
      const list = stars.filter((s): s is string => typeof s === "string" && s.length > 0);
      if (list.length) out[palace] = list;
    }
  }
  return out;
}

/**
 * 為某一章節產生「星曜_宮位」key 列表（僅該章 palace_focus 的宮位）
 */
function getUsedStarPalaceKeysForSection(
  sectionKey: string,
  mainStars: ZiweiMainStars
): string[] {
  const palaces = SECTION_PALACE_FOCUS[sectionKey];
  if (!palaces?.length) return [];
  const keys: string[] = [];
  for (const palace of palaces) {
    const stars = mainStars[palace];
    if (!Array.isArray(stars)) continue;
    for (const star of stars) {
      if (star && typeof star === "string") keys.push(`${star}_${palace}`);
    }
  }
  return keys;
}

/**
 * 從 contentDb.starPalaces 取出 usedKeys 對應的評語
 */
function pickStarPalaceQuotes(
  contentDb: ContentDb,
  usedKeys: string[]
): Record<string, string> {
  const starPalaces = contentDb?.starPalaces;
  if (!starPalaces || typeof starPalaces !== "object") return {};
  const set = new Set(usedKeys);
  const out: Record<string, string> = {};
  for (const k of set) {
    if (typeof starPalaces[k] === "string") out[k] = starPalaces[k];
  }
  return out;
}

function normalizeSection(
  raw: Partial<LifeBookUserSection> | undefined,
  sectionKey: string,
  fallbackTitle: string
): LifeBookUserSection {
  const o = raw ?? {};
  const importance = ["high", "medium", "low"].includes(String(o.importance_level))
    ? (o.importance_level as LifeBookUserSection["importance_level"])
    : "medium";
  return {
    section_key: typeof o.section_key === "string" ? o.section_key : sectionKey,
    title: typeof o.title === "string" ? o.title : fallbackTitle,
    importance_level: importance,
    structure_analysis: String(o.structure_analysis ?? ""),
    behavior_pattern: String(o.behavior_pattern ?? ""),
    blind_spots: String(o.blind_spots ?? ""),
    strategic_advice: String(o.strategic_advice ?? ""),
    star_palace_quotes:
      o.star_palace_quotes && typeof o.star_palace_quotes === "object" && !Array.isArray(o.star_palace_quotes)
        ? (o.star_palace_quotes as Record<string, string>)
        : undefined,
  };
}

/** 章節 key → 顯示標題（與 worker SECTION_TEMPLATES 一致，僅用於 fallback） */
const SECTION_TITLE_FALLBACK: Record<string, string> = {
  s00: "這一局，你為什麼要來？（靈魂行前簡報）",
  s01: "你的心靈休息站（福德宮）",
  s02: "你是帶著什麼狀態上場？（命宮）",
  s03: "你的底層程式碼（五行氣勢與生剋）",
  s04: "你為這具身體準備了什麼？（命主・身主・身宮・身體使用說明）",
  s05: "學習看自己的鏡子（父母宮）",
  s06: "互相成就課題（兄弟宮）",
  s07: "服務他人、團隊默契（僕役宮）",
  s08: "穩定成長區（官祿宮）",
  s09: "生活根基與安全基地（田宅宮）",
  s10: "你怎麼看錢、用錢、創造錢？（財帛宮）",
  s11: "身體訊號與修復課題（疾厄宮）",
  s12: "對外舞台與社會運勢（遷移宮）",
  s13: "重要調整區（夫妻宮）",
  s14: "紅燈高壓區（子女宮）",
  s15: "你的一生章節（十年大限總覽）",
  s15a: "各宮位小限年份與疊宮引爆分析",
  s16: "今年的主線任務與心理濾鏡（流年・小限）",
  s17: "此生核心功課（靈魂使命）",
  s18: "未完成的必修課（業力議題）",
  s19: "三條立刻可做・三條長期累積・三條避開折損（短期・長期・避凶）",
  s20: "三盤疊加診斷（流年 × 大限 × 本命）",
  s21: "你往何處去（靈魂總結）",
};


/**
 * 組裝命書文件：命盤 + 內容 DB + Worker 命書 JSON → 正式 LifeBookDocument
 * - meta：補上 schema_version, generator_version, created_at，其餘來自參數
 * - sections：從 lifeBookJson.sections 轉為 LifeBookUserSection；有 contentDb 時以 contentDb.starPalaces 組 star_palace_quotes，否則保留 Worker 回傳的
 * - expert：若 lifeBookJson.expert 存在則直接掛上
 */
export function buildLifeBookDocument({
  chartJson,
  contentDb,
  lifeBookJson,
  meta = {},
}: BuildLifeBookDocumentParams): LifeBookDocument {
  const mainStars = getMainStarsFromChart(chartJson);
  const sections: Record<string, LifeBookUserSection> = {};
  const rawSections = lifeBookJson?.sections ?? {};
  const metaInput = (typeof meta === "object" && meta !== null ? meta : {}) as Partial<LifeBookMeta>;
  const metaFromJson = lifeBookJson?.meta && typeof lifeBookJson.meta === "object" ? lifeBookJson.meta : {};

  for (const sectionKey of SECTION_ORDER) {
    const raw = rawSections[sectionKey];
    const fallbackTitle = SECTION_TITLE_FALLBACK[sectionKey] ?? sectionKey;
    const section = normalizeSection(raw, sectionKey, fallbackTitle);

    if (contentDb) {
      const usedKeys = getUsedStarPalaceKeysForSection(sectionKey, mainStars);
      const quotes = pickStarPalaceQuotes(contentDb, usedKeys);
      if (Object.keys(quotes).length > 0) section.star_palace_quotes = quotes;
    }
    sections[sectionKey] = section;
  }

  const weight_analysis =
    lifeBookJson?.weight_analysis && typeof lifeBookJson.weight_analysis === "object"
      ? (lifeBookJson.weight_analysis as WeightAnalysis)
      : null;

  const metaOut: LifeBookMeta = {
    schema_version: metaInput.schema_version ?? LIFEBOOK_SCHEMA_VERSION,
    generator_version: metaInput.generator_version ?? LIFEBOOK_GENERATOR_VERSION,
    created_at: metaInput.created_at ?? new Date().toISOString(),
    id: metaInput.id,
    chart_id: metaInput.chart_id,
    locale: metaInput.locale ?? metaFromJson.locale,
    client_name: metaInput.client_name ?? metaFromJson.client_name,
    birth_info: metaInput.birth_info ?? metaFromJson.birth_info,
  };

  const doc: LifeBookDocument = {
    meta: metaOut,
    chart_json: chartJson && typeof chartJson === "object" ? chartJson : null,
    weight_analysis: weight_analysis ?? null,
    sections,
  };
  if (lifeBookJson?.expert != null) doc.expert = lifeBookJson.expert;
  return doc;
}
