/**
 * 太歲判斷邏輯：值、沖、刑、害、破、無
 * 依傳統地支關係推算
 */

const BRANCHES = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];
const ZODIACS = ["鼠", "牛", "虎", "兔", "龍", "蛇", "馬", "羊", "猴", "雞", "狗", "豬"];

/** 生肖 → 地支 */
const ZODIAC_TO_BRANCH = Object.fromEntries(ZODIACS.map((z, i) => [z, BRANCHES[i]]));
/** 地支 → 生肖 */
const BRANCH_TO_ZODIAC = Object.fromEntries(BRANCHES.map((b, i) => [b, ZODIACS[i]]));

/** 六沖 */
const LIU_CHONG = new Set(["子午", "丑未", "寅申", "卯酉", "辰戌", "巳亥"]);
/** 六害 */
const LIU_HAI = new Set(["子未", "丑午", "寅巳", "卯辰", "申亥", "酉戌"]);
/** 六破 */
const LIU_PO = new Set(["子酉", "丑辰", "寅亥", "卯午", "申巳", "未戌"]);
/** 三刑（含子卯、寅巳申、丑戌未） */
const SAN_XING = [
  new Set(["寅", "巳", "申"]),
  new Set(["丑", "戌", "未"]),
  new Set(["子", "卯"]),
];
/** 自刑 */
const ZI_XING = new Set(["辰", "午", "酉", "亥"]);

/**
 * Lunar New Year (Taiwan): Gregorian [month, day] of first day of lunar year.
 * Used to convert Gregorian birth date → lunar year for zodiac.
 */
const LNY_BY_YEAR = {
  1924: [2, 5], 1930: [1, 30], 1940: [2, 8], 1950: [2, 17], 1960: [1, 28],
  1970: [2, 6], 1980: [2, 16], 1988: [2, 17], 1989: [2, 6], 1990: [1, 26],
  1991: [2, 15], 1992: [2, 4], 1993: [1, 23], 1994: [2, 10], 1995: [1, 31],
  1996: [2, 19], 1997: [2, 7], 1998: [1, 28], 1999: [2, 16], 2000: [2, 5],
  2001: [1, 24], 2002: [2, 12], 2003: [2, 1], 2004: [1, 22], 2005: [2, 9],
  2006: [1, 29], 2007: [2, 18], 2008: [2, 7], 2009: [1, 26], 2010: [2, 14],
  2011: [2, 3], 2012: [1, 23], 2013: [2, 10], 2014: [1, 31], 2015: [2, 19],
  2016: [2, 8], 2017: [1, 28], 2018: [2, 16], 2019: [2, 5], 2020: [1, 25],
  2021: [2, 12], 2022: [2, 1], 2023: [1, 22], 2024: [2, 10], 2025: [1, 29],
  2026: [2, 17], 2027: [2, 6], 2028: [1, 26], 2029: [2, 13], 2030: [2, 3],
};

function getLNYForYear(gregYear) {
  const y = Number(gregYear);
  if (LNY_BY_YEAR[y]) return LNY_BY_YEAR[y];
  if (y < 1924 || y > 2030) return null;
  for (let i = y; i >= 1924; i--) {
    if (LNY_BY_YEAR[i]) return LNY_BY_YEAR[i];
  }
  return null;
}

/**
 * Gregorian (year, month, day) → lunar year number (for zodiac/stem-branch).
 * Uses Lunar New Year table (Taiwan). If date is before LNY, lunar year = gregYear - 1.
 * @param {number} gregYear
 * @param {number} gregMonth
 * @param {number} gregDay
 * @returns {number|null} lunar year or null if unknown
 */
export function getLunarYearFromDate(gregYear, gregMonth, gregDay) {
  const y = Number(gregYear);
  const m = Number(gregMonth);
  const d = Number(gregDay);
  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) return null;
  const lny = getLNYForYear(y);
  if (!lny) {
    if (m === 1) return y - 1;
    if (m >= 3) return y;
    return d < 15 ? y - 1 : y;
  }
  const [lnyMonth, lnyDay] = lny;
  if (m < lnyMonth || (m === lnyMonth && d < lnyDay)) return y - 1;
  return y;
}

/**
 * 出生年（西曆）→ 地支（1984 甲子年起算）
 * 僅適用於「已確定為農曆年」的年份；若只有西曆生日請用 getLunarYearFromDate + yearToBranch。
 * @param {number} year 農曆年（或西曆年，若呼叫端已做 LNY 轉換）
 * @returns {string}
 */
export function yearToBranch(year) {
  const y = Number(year);
  if (isNaN(y)) return "子";
  const idx = ((y - 1984) % 12 + 12) % 12;
  return BRANCHES[idx];
}

/**
 * 地支 → 生肖
 * @param {string} branch
 * @returns {string}
 */
export function branchToZodiac(branch) {
  return BRANCH_TO_ZODIAC[branch] || "";
}

/**
 * 生肖 → 地支
 * @param {string} zodiac
 * @returns {string}
 */
export function zodiacToBranch(zodiac) {
  return ZODIAC_TO_BRANCH[zodiac] || "";
}

/**
 * 正規化地支對（小→大，用於查表）
 */
function normPair(a, b) {
  const order = { 子: 0, 丑: 1, 寅: 2, 卯: 3, 辰: 4, 巳: 5, 午: 6, 未: 7, 申: 8, 酉: 9, 戌: 10, 亥: 11 };
  const oa = order[a] ?? 0;
  const ob = order[b] ?? 0;
  return oa <= ob ? a + b : b + a;
}

/**
 * 檢查是否在三刑集合中
 */
function inSanXing(branch) {
  return SAN_XING.some((s) => s.has(branch));
}

/**
 * 檢查 userBranch 與 flowBranch 是否同在三刑
 */
function bothInSameSanXing(userBranch, flowBranch) {
  if (userBranch === flowBranch) return ZI_XING.has(userBranch);
  return SAN_XING.some((s) => s.has(userBranch) && s.has(flowBranch));
}

/**
 * 取得太歲類型（優先序：值 > 沖 > 刑 > 害 > 破 > 無）
 * @param {string} userBranch 使用者地支
 * @param {string} flowBranch 流年地支
 * @returns {{ type: string; label: string; relation: string }}
 */
export function getTaisuiType(userBranch, flowBranch) {
  const u = userBranch || "子";
  const f = flowBranch || "子";

  if (u === f) {
    return { type: "值", label: "值太歲", relation: `${u}${f}同值` };
  }

  const pair = normPair(u, f);
  if (LIU_CHONG.has(pair)) {
    return { type: "沖", label: "沖太歲", relation: `${u}${f}相沖` };
  }
  if (bothInSameSanXing(u, f)) {
    return { type: "刑", label: "刑太歲", relation: `${u}${f}相刑` };
  }
  if (LIU_HAI.has(pair)) {
    return { type: "害", label: "害太歲", relation: `${u}${f}相害` };
  }
  if (LIU_PO.has(pair)) {
    return { type: "破", label: "破太歲", relation: `${u}${f}相破` };
  }

  return { type: "無", label: "無", relation: "" };
}

/**
 * 流年天干（1984 甲子年起算）
 */
export function yearToStem(year) {
  const STEMS = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"];
  const y = Number(year);
  if (isNaN(y)) return "甲";
  const idx = ((y - 1984) % 10 + 10) % 10;
  return STEMS[idx];
}

/**
 * 流年天干地支（如 2026 → 丙午）
 */
export function yearToStemBranch(year) {
  return yearToStem(year) + yearToBranch(year);
}

/**
 * 取得太歲狀態完整物件（供 API 使用）
 * 生肖／userBranch 依農曆年計算：若有 birthDate 或 (birthMonth, birthDay)，會先換算農曆年再取地支。
 * @param {Object} opts
 * @param {number} opts.birthYear 西曆出生年
 * @param {number} [opts.birthMonth] 西曆出生月（與 birthDay 一起提供時，用 LNY 換算農曆年）
 * @param {number} [opts.birthDay] 西曆出生日
 * @param {string} [opts.birthDate] 西曆生日 YYYY-MM-DD（可取代 birthYear + birthMonth + birthDay）
 * @param {number} opts.year 流年（西曆）
 * @returns {Object}
 */
export function getTaisuiStatus({ birthYear, birthMonth, birthDay, birthDate, year = 2026 }) {
  const flowBranch = yearToBranch(year);
  const flowStemBranch = yearToStemBranch(year);
  let lunarBirthYear = null;
  if (birthDate && /^\d{4}-\d{2}-\d{2}$/.test(String(birthDate).trim())) {
    const [y, m, d] = birthDate.trim().split("-").map(Number);
    lunarBirthYear = getLunarYearFromDate(y, m, d);
  } else if (
    Number.isFinite(Number(birthYear)) &&
    Number.isFinite(Number(birthMonth)) &&
    Number.isFinite(Number(birthDay))
  ) {
    lunarBirthYear = getLunarYearFromDate(Number(birthYear), Number(birthMonth), Number(birthDay));
  }
  const effectiveBirthYear = lunarBirthYear != null ? lunarBirthYear : Number(birthYear);
  const userBranch = yearToBranch(isNaN(effectiveBirthYear) ? 1984 : effectiveBirthYear);
  const zodiac = branchToZodiac(userBranch);
  const { type, label, relation } = getTaisuiType(userBranch, flowBranch);

  const EXPLAIN = {
    值: "今年是你的主題之年，願你穩住節奏，把重要的事做深做實。",
    沖: "子午相沖，代表變動增加，宜主動規劃與調整。",
    刑: "相刑代表內在課題浮現，願你溫柔整理秩序，心定則事順。",
    害: "相害提醒人際需多留白與溝通，願你遠離誤會，靠近真正的支持。",
    破: "相破提醒資源要守、步伐要穩，願你避開衝動決策，慢慢累積福氣。",
    無: "今年氣場平穩，願你把握日常，把好運變成習慣。",
  };

  return {
    year,
    flowBranch,
    flowStemBranch,
    userBranch,
    zodiac,
    type,
    label,
    relation,
    explain: EXPLAIN[type] || EXPLAIN.無,
    cta: {
      requiresLogin: true,
      text: "登入即可點光明燈（動畫）並獲得守護語、年度圖片與勳章",
    },
  };
}

export { ZODIAC_TO_BRANCH, BRANCH_TO_ZODIAC, BRANCHES, ZODIACS };
