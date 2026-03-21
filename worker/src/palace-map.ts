/**
 * Palace name normalization: map iztro output keys -> fixed zh-TW palace keys.
 * Per docs/iztro-en-us-keys.md
 */

/** 地支環順序（與前端 BRANCH_RING、gridAreas 一致）：寅=0, 卯=1, ..., 丑=11 */
export const BRANCH_RING = [
  "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥", "子", "丑",
] as const;

/** Fixed zh-TW palace keys (matches frontend PALACE_DEFAULT) */
export const FIXED_PALACES_ZH_TW = [
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

// Legacy export alias
export const ZH_TW_PALACE_KEYS = FIXED_PALACES_ZH_TW;

/** en-US palace key (iztro language en-US) -> zh-TW */
const EN_TO_ZH_TW: Record<string, string> = {
  soul: "命宮",
  siblings: "兄弟",
  spouse: "夫妻",
  children: "子女",
  wealth: "財帛",
  health: "疾厄",
  surface: "遷移",
  friends: "僕役",
  career: "官祿",
  property: "田宅",
  spirit: "福德",
  parents: "父母",
};

/** zh-CN / simplified -> zh-TW */
const ZH_CN_TO_ZH_TW: Record<string, string> = {
  "命宫": "命宮",
  "命宮": "命宮",
  "兄弟": "兄弟",
  "夫妻": "夫妻",
  "子女": "子女",
  "财帛": "財帛",
  "財帛": "財帛",
  "疾厄": "疾厄",
  "迁移": "遷移",
  "遷移": "遷移",
  "仆役": "僕役",
  "奴僕": "僕役",
  "交友": "僕役",
  "僕役": "僕役",
  "官禄": "官祿",
  "官祿": "官祿",
  "田宅": "田宅",
  "福德": "福德",
  "父母": "父母",
};

export function palaceNameToZhTW(raw: string | undefined | null): string | null {
  if (!raw || typeof raw !== "string") return null;
  const key = raw.trim();
  if (EN_TO_ZH_TW[key]) return EN_TO_ZH_TW[key];
  if (ZH_CN_TO_ZH_TW[key]) return ZH_CN_TO_ZH_TW[key];
  // Already zh-TW key
  if ((FIXED_PALACES_ZH_TW as readonly string[]).includes(key)) return key;
  return null;
}

/** 寅起地支環索引（與前端 BRANCH_RING 一致） */
const BRANCH_RING_INDEX: Record<string, number> = {
  寅: 0, 卯: 1, 辰: 2, 巳: 3, 午: 4, 未: 5, 申: 6, 酉: 7, 戌: 8, 亥: 9, 子: 10, 丑: 11,
};

/** 流年命宮依「命宮地支旋轉」：offset = (mingIndex - liunianIndex + 12) % 12，非 palaceOrder[branchIndex]。 */
const PALACE_BY_OFFSET = [
  "命宮", "兄弟宮", "夫妻宮", "子女宮", "財帛宮", "疾厄宮",
  "遷移宮", "僕役宮", "官祿宮", "田宅宮", "福德宮", "父母宮",
] as const;

/**
 * 依流年地支與命宮地支計算流年命宮（紫微斗數：以命宮地支旋轉）。
 * 驗證：1972-08-02 申時男、命宮亥、2026 丙午 → 疾厄宮。
 * 僅用於「建表」；流年命宮應改為 getFlowYearPalace(branch, chart.palaceByBranch) 查表。
 */
export function computeFlowYearPalaceFromBranch(yearlyBranch: string, mingBranch: string): string | null {
  const mingIndex = BRANCH_RING_INDEX[mingBranch ?? ""];
  const liunianIndex = BRANCH_RING_INDEX[yearlyBranch ?? ""];
  if (mingIndex == null || mingIndex === undefined || liunianIndex == null || liunianIndex === undefined) return null;
  const offset = (mingIndex - liunianIndex + 12) % 12;
  return PALACE_BY_OFFSET[offset] ?? null;
}

/**
 * 由命宮地支建出整張「地支 → 宮位」對應，為系統唯一權威。
 * 算法：寅起地支環 + 命宮旋轉；僅此處使用 offset 公式，其餘一律查表。
 */
export function buildPalaceByBranch(mingBranch: string): Record<string, string> {
  const out: Record<string, string> = {};
  const mingIndex = BRANCH_RING_INDEX[mingBranch ?? ""];
  if (mingIndex == null || mingIndex === undefined) return {};
  for (let i = 0; i < BRANCH_RING.length; i++) {
    const branch = BRANCH_RING[i];
    const offset = (mingIndex - i + 12) % 12;
    out[branch] = PALACE_BY_OFFSET[offset] ?? "";
  }
  return out;
}

/**
 * iztro `ziwei.palaces[i]` 為地支環（寅=0…丑=11）。命宮地支為 soulBranch 時，
 * 傳入命宮系統宮名（如「財帛」「疾厄」，可帶「宮」），回傳應讀取的陣列索引 i。
 * 與 worker `extractZiweiMainStars` / `mergeStarNamesFromZiweiPalaces` 之
 * `(soulIndex - i + 12) % 12` 對應一致。
 */
export function ziweiPalacesArrayIndexForNamedPalace(soulBranch: string, palaceNameZh: string): number | null {
  const soulIdx = BRANCH_RING.indexOf(soulBranch as (typeof BRANCH_RING)[number]);
  if (soulIdx < 0) return null;
  const base = palaceNameZh.replace(/宮$/, "").trim();
  const namedIdx = (FIXED_PALACES_ZH_TW as readonly string[]).indexOf(base);
  if (namedIdx < 0) return null;
  return (soulIdx - namedIdx + 12) % 12;
}

/**
 * 流年命宮：僅能查表，禁止再用 offset／palaceOrder[branchIndex]。
 */
export function getFlowYearPalace(branch: string, palaceByBranch: Record<string, string>): string | null {
  if (!branch || !palaceByBranch || typeof palaceByBranch !== "object") return null;
  const palace = palaceByBranch[branch];
  return palace && palace.trim() ? palace : null;
}
