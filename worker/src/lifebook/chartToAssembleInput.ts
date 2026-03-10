/**
 * 從 chartJson + config 組出 AssembleInput，供 assembleRiskProfile 使用。
 */

import { FIXED_PALACES_ZH_TW } from "../palace-map.js";
import { BRANCH_RING } from "../palace-map.js";
import { toZhStarKey } from "../star-map.js";
import {
  PALACES,
  PALACE_NAME_ZH_TO_ID,
  TENGOD_NAME_ZH_TO_ID,
  STAR_NAME_ZH_TO_ID,
  WUXING_NAME_ZH_TO_ID,
  type PalaceId,
  type MainStarId,
  type TenGodId,
  type WuXingId,
  type TransformId,
} from "./schema.js";
import type { AssembleInput } from "./assembler.js";

/** ziwei 結構（與 index extractZiweiMainStars 對齊） */
interface ZiweiPalace {
  name?: string;
  majorStars?: Array<{ name?: string }>;
  minorStars?: Array<{ name?: string }>;
  adjectiveStars?: Array<{ name?: string }>;
}

/** 從 ziwei 解析出各宮主星，回傳 Record<PalaceId, MainStarId[]> */
function buildStarByPalaceFromZiwei(
  ziwei: unknown,
  lang: "zh-TW" | "zh-CN" | "en-US"
): Partial<Record<PalaceId, MainStarId[]>> {
  const out: Partial<Record<PalaceId, MainStarId[]>> = {};
  const a = ziwei as { earthlyBranchOfSoulPalace?: string; palaces?: ZiweiPalace[] };
  const palaces = a?.palaces ?? [];
  const soulBranch = (a?.earthlyBranchOfSoulPalace ?? "").trim();
  const mingIdx = BRANCH_RING.indexOf(soulBranch as (typeof BRANCH_RING)[number]);
  const soulIndex = mingIdx >= 0 ? mingIdx : 0;
  const keys = FIXED_PALACES_ZH_TW as readonly string[];

  for (let i = 0; i < palaces.length && i < 12; i++) {
    const palace = palaces[i];
    const palaceIndex = (soulIndex - i + 12) % 12;
    const zhTWKey = keys[palaceIndex];
    const palaceId = PALACE_NAME_ZH_TO_ID[zhTWKey];
    if (!palaceId) continue;

    const starIds: MainStarId[] = [];
    const addStars = (arr: Array<{ name?: string }> | undefined) => {
      if (!Array.isArray(arr)) return;
      for (const s of arr) {
        const raw = s?.name?.trim();
        if (!raw) continue;
        const zh = lang === "en-US" ? toZhStarKey(raw) || raw : raw;
        const id = STAR_NAME_ZH_TO_ID[zh] as MainStarId | undefined;
        if (id && !starIds.includes(id)) starIds.push(id);
      }
    };
    addStars(palace?.majorStars);
    addStars(palace?.minorStars);
    addStars(palace?.adjectiveStars);
    if (starIds.length > 0) out[palaceId] = starIds;
  }
  return out;
}

/** 從 config.tenGodByPalace（宮名/十神 中文）轉成 Record<PalaceId, TenGodId> */
function buildTenGodByPalace(
  tenGodByPalace: Record<string, string> | undefined
): Partial<Record<PalaceId, TenGodId>> {
  if (!tenGodByPalace || typeof tenGodByPalace !== "object") return {};
  const out: Partial<Record<PalaceId, TenGodId>> = {};
  const palaceIds = new Set(PALACES.map((p) => p.id));
  for (const [palaceKey, tenGodName] of Object.entries(tenGodByPalace)) {
    const withoutSuffix = palaceKey?.replace(/宮$/, "") || "";
    const tryKey = withoutSuffix === "命" ? "命宮" : withoutSuffix || palaceKey;
    let palaceId = (PALACE_NAME_ZH_TO_ID[palaceKey] ?? PALACE_NAME_ZH_TO_ID[tryKey]) as PalaceId | undefined;
    if (!palaceId && palaceIds.has(palaceKey as PalaceId)) palaceId = palaceKey as PalaceId;
    const tenGodId = TENGOD_NAME_ZH_TO_ID[tenGodName] as TenGodId | undefined;
    if (palaceId && tenGodId) out[palaceId] = tenGodId;
  }
  return out;
}

/**
 * 從 chartJson + config 組出 AssembleInput。
 * 若 chartJson.ziwei 無 starByPalace，則從 ziwei.palaces 解析。
 */
export function buildAssembleInput(
  chartJson: Record<string, unknown>,
  config: { tenGodByPalace?: Record<string, string> } | null | undefined,
  contentLocale: "zh-TW" | "zh-CN" | "en" = "zh-TW"
): AssembleInput {
  const lang = contentLocale === "en" ? "en-US" : contentLocale;
  const ziwei = chartJson?.ziwei;

  let starByPalace: Partial<Record<PalaceId, MainStarId[]>> = {};
  if (ziwei && typeof ziwei === "object") {
    const z = ziwei as Record<string, unknown>;
    const core = z.core as Record<string, unknown> | undefined;
    const basic = z.basic as Record<string, unknown> | undefined;
    let prebuilt = z.starByPalace ?? core?.starByPalace ?? basic?.starByPalace;
    if (prebuilt && typeof prebuilt === "object") {
      const raw = prebuilt as Record<string, unknown>;
      const keys = Object.keys(raw);
      const hasZhKey = keys.some((k) => k.length >= 2 && (k.includes("宮") || k === "命" || ["命宮", "兄弟", "夫妻", "子女", "財帛", "疾厄", "遷移", "僕役", "官祿", "田宅", "福德", "父母"].includes(k)));
      if (hasZhKey) {
        starByPalace = {};
        for (const [k, val] of Object.entries(raw)) {
          const withoutSuffix = k.replace(/宮$/, "");
          const normalized = withoutSuffix === "命" ? "命宮" : !k.endsWith("宮") && k !== "命" ? k + "宮" : k;
          const palaceId = (PALACE_NAME_ZH_TO_ID[k] ?? PALACE_NAME_ZH_TO_ID[normalized] ?? PALACE_NAME_ZH_TO_ID[withoutSuffix]) as PalaceId | undefined;
          if (palaceId && Array.isArray(val)) {
            const starIds = (val as unknown[]).map((s) => {
              const str = typeof s === "string" ? s.trim() : "";
              return (STAR_NAME_ZH_TO_ID[str] ?? str) as MainStarId;
            }).filter((id): id is MainStarId => !!id);
            if (starIds.length > 0) starByPalace[palaceId] = starIds;
          }
        }
      } else {
        starByPalace = prebuilt as Partial<Record<PalaceId, MainStarId[]>>;
      }
    }
    if (Object.keys(starByPalace).length === 0) {
      // 前端 compute 回傳格式：ziwei.mainStars = { "命宮": ["紫微","天府"], "財帛": ["武曲"], ... }
      const mainStars = z.mainStars as Record<string, string[] | unknown> | undefined;
      if (mainStars && typeof mainStars === "object" && !Array.isArray(mainStars)) {
        for (const [palaceKey, starList] of Object.entries(mainStars)) {
          if (!Array.isArray(starList) || starList.length === 0) continue;
          const withoutSuffix = palaceKey?.replace(/宮$/, "") || "";
          const withSuffix = withoutSuffix === "命" ? "命宮" : withoutSuffix + "宮";
          const palaceId = (PALACE_NAME_ZH_TO_ID[palaceKey] ?? PALACE_NAME_ZH_TO_ID[withSuffix] ?? PALACE_NAME_ZH_TO_ID[withoutSuffix]) as PalaceId | undefined;
          if (!palaceId) continue;
          const starIds = (starList as string[]).map((s) => {
            const str = typeof s === "string" ? s.trim() : "";
            return (STAR_NAME_ZH_TO_ID[str] ?? str) as MainStarId;
          }).filter((id): id is MainStarId => !!id && typeof id === "string");
          if (starIds.length > 0) starByPalace[palaceId] = starIds;
        }
      }
      if (Object.keys(starByPalace).length === 0) {
        const source: Record<string, unknown> =
          Array.isArray(z.palaces) ? (z as Record<string, unknown>)
          : Array.isArray(core?.palaces) ? (core as Record<string, unknown>)
          : Array.isArray(basic?.palaces) ? (basic as Record<string, unknown>)
          : (z as Record<string, unknown>);
        const ziweiForParse = source.earthlyBranchOfSoulPalace != null ? source : {
          ...source,
          earthlyBranchOfSoulPalace: core?.minggongBranch ?? core?.earthlyBranchOfSoulPalace ?? (z as Record<string, unknown>)?.earthlyBranchOfSoulPalace,
        };
        starByPalace = buildStarByPalaceFromZiwei(ziweiForParse, lang);
      }
    }
  }

  const tenGodByPalace =
    buildTenGodByPalace(
      (chartJson?.tenGodByPalace as Record<string, string> | undefined) ??
        config?.tenGodByPalace
    );

  const fiveElements = (chartJson?.fiveElements ?? chartJson?.wuxingData) as Record<string, unknown> | undefined;
  const rawStrength = (fiveElements?.strength as Record<string, string> | undefined) ?? {};
  const wuxingStrength: Partial<Record<WuXingId, "strong" | "weak">> = {};
  for (const [k, v] of Object.entries(rawStrength)) {
    if (v !== "strong" && v !== "weak") continue;
    const id = (WUXING_NAME_ZH_TO_ID[k] ?? k) as WuXingId;
    if (["wood", "fire", "earth", "metal", "water"].includes(id)) wuxingStrength[id] = v;
  }

  const TRANSFORM_ZH_TO_ID: Record<string, TransformId> = {
    化祿: "lu", 化權: "quan", 化科: "ke", 化忌: "ji",
    lu: "lu", quan: "quan", ke: "ke", ji: "ji",
  };
  const fourTransformations = (chartJson?.fourTransformations as Partial<Record<string, string>> | undefined) ?? {};
  const normalizedTransforms: Partial<Record<MainStarId, TransformId>> = {};
  for (const [k, v] of Object.entries(fourTransformations)) {
    const transformId = (typeof v === "string" && TRANSFORM_ZH_TO_ID[v]) || (v as TransformId);
    if (!transformId || !["lu", "quan", "ke", "ji"].includes(transformId)) continue;
    const starId = (STAR_NAME_ZH_TO_ID[k] ?? k) as MainStarId;
    normalizedTransforms[starId] = transformId as TransformId;
  }

  return {
    starByPalace,
    tenGodByPalace,
    wuxingStrength: Object.keys(wuxingStrength).length > 0 ? wuxingStrength : undefined,
    fourTransformations: Object.keys(normalizedTransforms).length > 0 ? normalizedTransforms : undefined,
  };
}
