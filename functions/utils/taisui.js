/**
 * 太歲判斷邏輯（服務端用）
 * 依傳統地支關係推算：值、沖、刑、害、破、無
 * 生肖／userBranch 依農曆年計算（LNY 表）。
 */

const BRANCHES = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];
const ZODIACS = ["鼠", "牛", "虎", "兔", "龍", "蛇", "馬", "羊", "猴", "雞", "狗", "豬"];

const ZODIAC_TO_BRANCH = Object.fromEntries(ZODIACS.map((z, i) => [z, BRANCHES[i]]));
const BRANCH_TO_ZODIAC = Object.fromEntries(BRANCHES.map((b, i) => [b, ZODIACS[i]]));

const LIU_CHONG = new Set(["子午", "丑未", "寅申", "卯酉", "辰戌", "巳亥"]);
const LIU_HAI = new Set(["子未", "丑午", "寅巳", "卯辰", "申亥", "酉戌"]);
const LIU_PO = new Set(["子酉", "丑辰", "寅亥", "卯午", "申巳", "未戌"]);
const SAN_XING = [
  new Set(["寅", "巳", "申"]),
  new Set(["丑", "戌", "未"]),
  new Set(["子", "卯"]),
];
const ZI_XING = new Set(["辰", "午", "酉", "亥"]);

/** Lunar New Year (Taiwan): [month, day] of first day of lunar year */
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

function getLunarYearFromDate(gregYear, gregMonth, gregDay) {
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

function yearToBranch(year) {
  const y = Number(year);
  if (isNaN(y)) return "子";
  const idx = ((y - 1984) % 12 + 12) % 12;
  return BRANCHES[idx];
}

function yearToStem(year) {
  const STEMS = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"];
  const y = Number(year);
  if (isNaN(y)) return "甲";
  const idx = ((y - 1984) % 10 + 10) % 10;
  return STEMS[idx];
}

function normPair(a, b) {
  const order = { 子: 0, 丑: 1, 寅: 2, 卯: 3, 辰: 4, 巳: 5, 午: 6, 未: 7, 申: 8, 酉: 9, 戌: 10, 亥: 11 };
  const oa = order[a] ?? 0;
  const ob = order[b] ?? 0;
  return oa <= ob ? a + b : b + a;
}

function bothInSameSanXing(userBranch, flowBranch) {
  if (userBranch === flowBranch) return ZI_XING.has(userBranch);
  return SAN_XING.some((s) => s.has(userBranch) && s.has(flowBranch));
}

function getTaisuiType(userBranch, flowBranch) {
  const u = userBranch || "子";
  const f = flowBranch || "子";

  if (u === f) return { type: "值", label: "值太歲", relation: `${u}${f}同值` };

  const pair = normPair(u, f);
  if (LIU_CHONG.has(pair)) return { type: "沖", label: "沖太歲", relation: `${u}${f}相沖` };
  if (bothInSameSanXing(u, f)) return { type: "刑", label: "刑太歲", relation: `${u}${f}相刑` };
  if (LIU_HAI.has(pair)) return { type: "害", label: "害太歲", relation: `${u}${f}相害` };
  if (LIU_PO.has(pair)) return { type: "破", label: "破太歲", relation: `${u}${f}相破` };

  return { type: "無", label: "無", relation: "" };
}

const GUARDIAN_PHRASES = {
  值: "今年是你的主題之年，願你穩住節奏，把重要的事做深做實。",
  沖: "變動會帶來新位置，願你主動調整，走出更適合自己的路。",
  刑: "願你放過過度苛責，溫柔整理內在秩序，心定則事順。",
  害: "人際需多留白與溝通，願你遠離誤會，靠近真正的支持。",
  破: "資源要守、步伐要穩，願你避開衝動決策，慢慢累積福氣。",
  無: "今年氣場平穩，願你把握日常，把好運變成習慣。",
};

/**
 * 取得太歲狀態（供 API 使用）
 * 生肖／userBranch 依農曆年計算：若有 birthDate 或 (birthMonth, birthDay)，會先換算農曆年。
 */
export function getTaisuiStatus({ birthYear, birthMonth, birthDay, birthDate, year = 2026 }) {
  const flowBranch = yearToBranch(year);
  const flowStemBranch = yearToStem(year) + flowBranch;
  let lunarBirthYear = null;
  if (birthDate && /^\d{4}-\d{2}-\d{2}$/.test(String(birthDate).trim())) {
    const parts = birthDate.trim().split("-").map(Number);
    lunarBirthYear = getLunarYearFromDate(parts[0], parts[1], parts[2]);
  } else if (
    Number.isFinite(Number(birthYear)) &&
    Number.isFinite(Number(birthMonth)) &&
    Number.isFinite(Number(birthDay))
  ) {
    lunarBirthYear = getLunarYearFromDate(Number(birthYear), Number(birthMonth), Number(birthDay));
  }
  const effectiveBirthYear = lunarBirthYear != null ? lunarBirthYear : Number(birthYear);
  const userBranch = yearToBranch(Number.isFinite(effectiveBirthYear) ? effectiveBirthYear : 1984);
  const zodiac = BRANCH_TO_ZODIAC[userBranch] || "";
  const { type, label, relation } = getTaisuiType(userBranch, flowBranch);

  return {
    year,
    flowBranch,
    flowStemBranch,
    userBranch,
    zodiac,
    type,
    label,
    relation,
    explain: GUARDIAN_PHRASES[type] || GUARDIAN_PHRASES.無,
    cta: {
      requiresLogin: true,
      text: "登入即可點光明燈（動畫）並獲得守護語、年度圖片與勳章",
    },
  };
}

/**
 * 取得守護語（供點燈 API 使用）
 */
export function getGuardianPhrase(type) {
  return GUARDIAN_PHRASES[type] || GUARDIAN_PHRASES.無;
}

export { yearToBranch, yearToStem, getTaisuiType, BRANCH_TO_ZODIAC };
