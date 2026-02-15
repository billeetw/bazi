/**
 * Palace name normalization: map iztro output keys -> fixed zh-TW palace keys.
 * Per docs/iztro-en-us-keys.md
 */

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
