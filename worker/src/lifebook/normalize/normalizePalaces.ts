/**
 * P2: 從 chartJson.ziwei 產出 PalaceStructure[]。
 * 宮位一律 canonical 為 X宮；星曜分類為主星／輔星／煞星／雜曜。
 */

import { BRANCH_RING, FIXED_PALACES_ZH_TW, palaceNameToZhTW } from "../../palace-map.js";
import { toPalaceCanonical } from "../canonicalKeys.js";
import { toBrightnessCanonical } from "../normalizedChart.js";
import type { PalaceStructure, StarInPalace, TransformEdge } from "../normalizedChart.js";
import { PALACES } from "../schema.js";
import { STAR_ID_TO_NAME } from "../schema.js";

const CANONICAL_PALACE_ORDER = PALACES.map((p) => toPalaceCanonical(p.name));

/** 14 主星中文名 */
const MAIN_STAR_NAMES = new Set(
  (Object.values(STAR_ID_TO_NAME) as string[]).filter(Boolean)
);

/** 輔星／文星／財星／貴人 */
const ASSISTANT_NAMES = new Set([
  "文昌", "文曲", "左輔", "右弼", "祿存", "天魁", "天鉞", "天馬", "天姚", "咸池",
]);

/** 煞星 */
const SHA_NAMES = new Set([
  "擎羊", "陀羅", "火星", "鈴星", "地空", "地劫", "天刑", "天傷",
]);

function toStarInPalace(name: string, brightness?: string, natalTransform?: string | null): StarInPalace {
  const b = toBrightnessCanonical(brightness);
  return {
    name: name.trim(),
    brightness: b,
    natalTransform: natalTransform as StarInPalace["natalTransform"] ?? undefined,
  };
}

function classifyStars(starNames: string[]): { main: StarInPalace[]; assistant: StarInPalace[]; sha: StarInPalace[]; misc: StarInPalace[] } {
  const main: StarInPalace[] = [];
  const assistant: StarInPalace[] = [];
  const sha: StarInPalace[] = [];
  const misc: StarInPalace[] = [];
  for (const n of starNames) {
    const s = (n ?? "").trim();
    if (!s) continue;
    const star = toStarInPalace(s);
    if (MAIN_STAR_NAMES.has(s)) main.push(star);
    else if (ASSISTANT_NAMES.has(s)) assistant.push(star);
    else if (SHA_NAMES.has(s)) sha.push(star);
    else misc.push(star);
  }
  return { main, assistant, sha, misc };
}

/**
 * 命宮地支：與前端 `buildSlotsFromZiwei` / 網格一致，**優先** `ziwei.core.minggongBranch`，
 * 再退回 `earthlyBranchOfSoulPalace`。若順序相反，盤面旋轉會整張錯宮（如命宮顯示成財帛星組）。
 */
export function readZiweiSoulBranch(chartJson: Record<string, unknown> | undefined): string {
  if (!chartJson?.ziwei || typeof chartJson.ziwei !== "object") return "";
  const z = chartJson.ziwei as Record<string, unknown>;
  const core = z.core as Record<string, unknown> | undefined;
  return String(
    core?.minggongBranch ??
      (z as { earthlyBranchOfSoulPalace?: string }).earthlyBranchOfSoulPalace ??
      (core as { earthlyBranchOfSoulPalace?: string })?.earthlyBranchOfSoulPalace ??
      ""
  ).trim();
}

type RawPalaceCell = {
  /** iztro 每格已翻好的宮名（zh-TW 如「命宮」「財帛」；en 如 soul） */
  name?: string;
  majorStars?: Array<{ name?: string }>;
  minorStars?: Array<{ name?: string }>;
  adjectiveStars?: Array<{ name?: string }>;
};

function isCanonicalFixedOrderPalaces(
  chartJson: Record<string, unknown> | undefined,
  rawPalaces: RawPalaceCell[] | undefined
): boolean {
  if (!Array.isArray(rawPalaces) || rawPalaces.length < 12) return false;
  if (rawPalaces.some((p) => typeof p?.name === "string" && p.name.trim())) return false;
  // compute/all 轉出的 palaces（固定宮序）通常同時帶有 mainStars（命宮/兄弟宮...）map
  const z = chartJson?.ziwei as Record<string, unknown> | undefined;
  const mainStars = z?.mainStars as Record<string, unknown> | undefined;
  if (!mainStars || typeof mainStars !== "object" || Array.isArray(mainStars)) return false;
  return FIXED_PALACES_ZH_TW.some((k) => Array.isArray(mainStars[k]) || Array.isArray(mainStars[`${k}宮`]));
}

/**
 * 由單一 `palaces[i]` 格對應到本系統 canonical 宮名（命宮、財帛宮…）。
 * 優先使用 iztro 輸出之 `name`（最可靠）；缺名時才用「命宮地支＋寅起地支行索引」旋轉。
 */
function resolvePalaceCanonForSlot(
  palace: RawPalaceCell | undefined,
  slotIndex: number,
  soulBranch: string,
  options?: { forceCanonicalFixedOrder?: boolean }
): string | null {
  if (options?.forceCanonicalFixedOrder) {
    return toPalaceCanonical(FIXED_PALACES_ZH_TW[slotIndex]) || null;
  }
  const rawName = typeof palace?.name === "string" ? palace.name.trim() : "";
  if (rawName) {
    const normalized = palaceNameToZhTW(rawName) ?? rawName;
    const canon = toPalaceCanonical(normalized);
    return canon || null;
  }
  const mingIdx = BRANCH_RING.indexOf(soulBranch as (typeof BRANCH_RING)[number]);
  if (mingIdx < 0) return null;
  const palaceIndex = (mingIdx - slotIndex + 12) % 12;
  return toPalaceCanonical(FIXED_PALACES_ZH_TW[palaceIndex]) || null;
}

/** 依 chart 中 iztro palaces 陣列，找 canonical 宮名對應的陣列索引（供亮度表等讀對格）。 */
export function findZiweiPalaceSlotIndexForCanonical(
  chartJson: Record<string, unknown> | undefined,
  palaceCanon: string
): number | null {
  if (!chartJson?.ziwei || typeof chartJson.ziwei !== "object") return null;
  const z = chartJson.ziwei as Record<string, unknown>;
  const rawPalaces = getRawZiweiPalaces(z);
  if (!Array.isArray(rawPalaces)) return null;
  const target = (palaceCanon ?? "").trim();
  if (!target) return null;
  const forceCanonicalFixedOrder = isCanonicalFixedOrderPalaces(chartJson, rawPalaces);
  const soulBranch = readZiweiSoulBranch(chartJson);
  for (let i = 0; i < rawPalaces.length && i < 12; i++) {
    const canon = resolvePalaceCanonForSlot(rawPalaces[i], i, soulBranch, { forceCanonicalFixedOrder });
    if (canon === target) return i;
  }
  return null;
}

function getRawZiweiPalaces(z: Record<string, unknown> | undefined): RawPalaceCell[] | undefined {
  if (!z || typeof z !== "object") return undefined;
  const core = z.core as Record<string, unknown> | undefined;
  const basic = z.basic as Record<string, unknown> | undefined;
  const raw = (
    Array.isArray(z.palaces) ? z.palaces : Array.isArray(core?.palaces) ? core?.palaces : basic?.palaces
  ) as RawPalaceCell[] | undefined;
  return Array.isArray(raw) && raw.length > 0 ? raw : undefined;
}

function collectStarNamesFromPalaceCell(palace: RawPalaceCell | undefined): string[] {
  const names: string[] = [];
  const add = (arr: Array<{ name?: string }> | undefined) => {
    if (!Array.isArray(arr)) return;
    for (const s of arr) {
      const n = (s?.name ?? "").trim();
      if (n && !names.includes(n)) names.push(n);
    }
  };
  add(palace?.majorStars);
  add(palace?.minorStars);
  add(palace?.adjectiveStars);
  return names;
}

/**
 * 若 iztro 已給滿 12 格 `palaces`（地支順序：寅起與 astro.js 一致），**只依盤面** 建星表：
 * - 每格有 `name` 時以宮名為準（與 iztro 一致，不受額外地支欄位衝突影響）。
 * - 無 `name` 時須有有效命宮地支，用旋轉對應十二宮。
 * 不再與可能錯誤的 `starByPalace` 聯集，避免錯星黏在錯宮。
 */
function buildAuthoritativeStarMapFromZiweiPalaces(chartJson: Record<string, unknown>): Map<string, string[]> | null {
  const z = chartJson.ziwei as Record<string, unknown>;
  if (!z || typeof z !== "object") return null;
  const rawPalaces = getRawZiweiPalaces(z);
  if (!Array.isArray(rawPalaces) || rawPalaces.length < 12) return null;

  const soulBranch = readZiweiSoulBranch(chartJson);
  const forceCanonicalFixedOrder = isCanonicalFixedOrderPalaces(chartJson, rawPalaces);
  const map = new Map<string, string[]>();
  for (let i = 0; i < 12; i++) {
    const palace = rawPalaces[i];
    const palaceCanon = resolvePalaceCanonForSlot(palace, i, soulBranch, { forceCanonicalFixedOrder });
    if (!palaceCanon) return null;
    const names = collectStarNamesFromPalaceCell(palace);
    const existing = map.get(palaceCanon);
    if (existing) {
      const merged = [...existing];
      for (const n of names) {
        if (!merged.includes(n)) merged.push(n);
      }
      map.set(palaceCanon, merged);
    } else {
      map.set(palaceCanon, names);
    }
  }
  return map;
}

/**
 * 自 iztro 盤面 `ziwei.palaces`（含 adjectiveStars）合併星名到 map，與 extractZiweiMainStars 索引一致。
 * 解決：僅有 starByPalace 且未含雜曜時，財帛等宮漏掉三台、八座等問題。
 */
function mergeStarNamesFromZiweiPalaces(chartJson: Record<string, unknown>, map: Map<string, string[]>): void {
  const z = chartJson.ziwei as Record<string, unknown> | undefined;
  const rawPalaces = getRawZiweiPalaces(z);
  if (!Array.isArray(rawPalaces) || rawPalaces.length === 0) return;

  const soulBranch = readZiweiSoulBranch(chartJson);
  const forceCanonicalFixedOrder = isCanonicalFixedOrderPalaces(chartJson, rawPalaces);

  for (let i = 0; i < rawPalaces.length && i < 12; i++) {
    const palace = rawPalaces[i];
    const palaceCanon = resolvePalaceCanonForSlot(palace, i, soulBranch, { forceCanonicalFixedOrder });
    if (!palaceCanon) continue;

    const names = collectStarNamesFromPalaceCell(palace);
    if (names.length === 0) continue;
    const existing = map.get(palaceCanon) ?? [];
    const merged = [...existing];
    for (const n of names) {
      if (!merged.includes(n)) merged.push(n);
    }
    map.set(palaceCanon, merged);
  }
}

/** 從 chartJson 取出宮位→星曜對應（中文宮名或 id 皆可）。 */
export function getStarByPalaceFromChart(chartJson: Record<string, unknown> | undefined): Map<string, string[]> {
  if (!chartJson?.ziwei || typeof chartJson.ziwei !== "object") return new Map<string, string[]>();
  const authoritative = buildAuthoritativeStarMapFromZiweiPalaces(chartJson);
  if (authoritative) return authoritative;

  const map = new Map<string, string[]>();
  const z = chartJson.ziwei as Record<string, unknown>;
  const core = z.core as Record<string, unknown> | undefined;
  const basic = z.basic as Record<string, unknown> | undefined;
  let starByPalace = z.starByPalace ?? core?.starByPalace ?? basic?.starByPalace;
  if (starByPalace && typeof starByPalace === "object" && !Array.isArray(starByPalace)) {
    const raw = starByPalace as Record<string, unknown>;
    for (const [key, val] of Object.entries(raw)) {
      const palaceCanon = toPalaceCanonical(key);
      if (!palaceCanon) continue;
      const list = Array.isArray(val) ? (val as unknown[]).map((s) => typeof s === "string" ? s.trim() : String(s)).filter(Boolean) : [];
      if (list.length > 0) map.set(palaceCanon, list);
    }
  }
  const mainStars = z.mainStars as Record<string, string[] | unknown> | undefined;
  if (mainStars && typeof mainStars === "object" && map.size === 0) {
    for (const [key, val] of Object.entries(mainStars)) {
      const palaceCanon = toPalaceCanonical(key);
      if (!palaceCanon) continue;
      const list = Array.isArray(val) ? (val as string[]).map((s) => (s ?? "").trim()).filter(Boolean) : [];
      if (list.length > 0) map.set(palaceCanon, list);
    }
  }

  mergeStarNamesFromZiweiPalaces(chartJson, map);
  return map;
}

function emptyTransforms(): TransformEdge[] {
  return [];
}

/**
 * 產出 12 宮 PalaceStructure[]，順序依 CANONICAL_PALACE_ORDER。
 * 每宮的 transformsIn/Out 由 normalizeChart 事後填入。
 */
export function buildPalaces(
  chartJson: Record<string, unknown> | undefined,
  _options?: { natalTransformsByPalace?: Map<string, { in: TransformEdge[]; out: TransformEdge[] }> }
): PalaceStructure[] {
  const starByPalace = getStarByPalaceFromChart(chartJson);
  return CANONICAL_PALACE_ORDER.map((palace) => {
    const names = starByPalace.get(palace) ?? [];
    const { main, assistant, sha, misc } = classifyStars(names);
    return {
      palace,
      mainStars: main,
      assistantStars: assistant,
      shaStars: sha,
      miscStars: misc,
      natalTransformsIn: emptyTransforms(),
      natalTransformsOut: emptyTransforms(),
      decadalTransformsIn: emptyTransforms(),
      decadalTransformsOut: emptyTransforms(),
      yearlyTransformsIn: emptyTransforms(),
      yearlyTransformsOut: emptyTransforms(),
    };
  });
}
