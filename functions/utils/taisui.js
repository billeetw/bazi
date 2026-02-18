/**
 * 太歲判斷邏輯（服務端用）
 * 依傳統地支關係推算：值、沖、刑、害、破、無
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
 */
export function getTaisuiStatus({ birthYear, year = 2026 }) {
  const flowBranch = yearToBranch(year);
  const flowStemBranch = yearToStem(year) + flowBranch;
  const userBranch = yearToBranch(birthYear);
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
