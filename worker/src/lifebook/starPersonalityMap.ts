/**
 * 星曜群性分類資料庫與統計引擎
 * 分類：動星、智星、穩星、權星、財星、情緒星（一顆星可屬多類）
 * 供模組一【星曜能量節奏】產出：統計 → 判讀 → 命書句型
 */

export type StarGroupTag =
  | "動星"
  | "智星"
  | "穩星"
  | "權星"
  | "財星"
  | "情緒星"
  | "將星"
  | "慾望星";

/** 星名（中文）→ 所屬群性標籤，多標籤全部計入統計 */
export const STAR_PERSONALITY_MAP: Record<string, StarGroupTag[]> = {
  // 主星 14
  "七殺": ["動星", "將星"],
  "破軍": ["動星", "將星"],
  "貪狼": ["動星", "慾望星"],
  "天機": ["智星"],
  "巨門": ["智星"],
  "天梁": ["智星"],
  "武曲": ["穩星", "財星"],
  "天府": ["穩星", "財星"],
  "天相": ["穩星"],
  "紫微": ["權星"],
  "廉貞": ["權星", "動星"],
  "太陽": ["權星"],
  "太陰": ["情緒星", "財星"],
  "天同": ["情緒星"],
  // 輔星（常用於命書）
  "文昌": ["智星"],
  "文曲": ["智星"],
  "左輔": ["穩星"],
  "右弼": ["穩星"],
  "天魁": ["權星"],
  "天鉞": ["權星"],
  "祿存": ["財星"],
  "天馬": ["動星"],
};

const SIX_GROUPS: StarGroupTag[] = ["動星", "智星", "穩星", "權星", "財星", "情緒星"];

/** 14 主星白名單（權重 2） */
export const MAIN_STAR_WHITELIST = new Set<string>([
  "紫微", "天機", "太陽", "武曲", "天同", "廉貞", "天府", "太陰", "貪狼", "巨門", "天相", "天梁", "七殺", "破軍",
]);

/** 輔星白名單（權重 1，至少含 STAR_PERSONALITY_MAP 會用到者） */
export const AUX_STAR_WHITELIST = new Set<string>([
  "左輔", "右弼", "文昌", "文曲", "天魁", "天鉞", "祿存", "天馬",
]);

/** 是否為計分用星（主星或輔星白名單內）；煞星／雜曜一律不計 */
export function isScoredStar(starName: string): boolean {
  const n = starName?.trim() ?? "";
  return MAIN_STAR_WHITELIST.has(n) || AUX_STAR_WHITELIST.has(n);
}

export interface StarGroupStats {
  動星: number;
  智星: number;
  穩星: number;
  權星: number;
  財星: number;
  情緒星: number;
  totalStars: number;
}

/** 檢查一組星名中是否含有某群性標籤（用於命宮/官祿等單宮判斷） */
export function hasGroup(starNames: string[], tag: StarGroupTag): boolean {
  return starNames.some((name) => STAR_PERSONALITY_MAP[name?.trim()]?.includes(tag));
}

/**
 * 輸入星曜名稱列表，輸出六類計數（多標籤全加，一星可多類）
 * @deprecated 命宮三方四正節奏請改用 calculateStarGroupStatsWeighted
 */
export function calculateStarGroupStats(starNames: string[]): StarGroupStats {
  const counts: StarGroupStats = {
    動星: 0,
    智星: 0,
    穩星: 0,
    權星: 0,
    財星: 0,
    情緒星: 0,
    totalStars: starNames.length,
  };
  for (const name of starNames) {
    const tags = STAR_PERSONALITY_MAP[name?.trim()] ?? [];
    for (const tag of tags) {
      if (SIX_GROUPS.includes(tag) && tag in counts) {
        (counts as Record<string, number>)[tag]++;
      }
    }
  }
  return counts;
}

/**
 * 加權計分：僅計主星（權重 2）與輔星白名單（權重 1），煞星／雜曜忽略。
 * 主星命中人格標籤：每標籤 +2；輔星命中：每標籤 +1。
 * 回傳六類加權分與 totalStars（計入的星數，僅主+輔）。
 */
export function calculateStarGroupStatsWeighted(starNames: string[]): {
  stats: StarGroupStats;
  debugDetail: { star: string; weight: number; tags: StarGroupTag[] }[];
  ignored: string[];
} {
  const scores: StarGroupStats = {
    動星: 0,
    智星: 0,
    穩星: 0,
    權星: 0,
    財星: 0,
    情緒星: 0,
    totalStars: 0,
  };
  const debugDetail: { star: string; weight: number; tags: StarGroupTag[] }[] = [];
  const ignored: string[] = [];
  for (const name of starNames) {
    const n = (name ?? "").trim();
    if (!n) continue;
    const tags = (STAR_PERSONALITY_MAP[n] ?? []).filter((t) => SIX_GROUPS.includes(t));
    const weight = MAIN_STAR_WHITELIST.has(n) ? 2 : AUX_STAR_WHITELIST.has(n) ? 1 : 0;
    if (weight === 0) {
      if (tags.length > 0 || n.length >= 2) ignored.push(n);
      continue;
    }
    scores.totalStars += 1;
    debugDetail.push({ star: n, weight, tags: [...tags] });
    for (const tag of tags) {
      if (tag in scores) (scores as Record<string, number>)[tag] += weight;
    }
  }
  const totalWeight = SIX_GROUPS.reduce((sum, tag) => sum + ((scores as Record<string, number>)[tag] ?? 0), 0);
  scores.totalStars = totalWeight || scores.totalStars;
  return { stats: scores, debugDetail, ignored };
}

/** 判讀：主導 >30%、次要 20–30%、均衡 皆<25%、極端 >45%、缺乏 <10% */
export type GroupInterpretation =
  | "主導"
  | "次要"
  | "均衡"
  | "極端"
  | "缺乏";

export function getGroupPercentage(count: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((count / total) * 100);
}

export function interpretGroupShare(percentage: number): GroupInterpretation | null {
  if (percentage > 45) return "極端";
  if (percentage > 30) return "主導";
  if (percentage >= 20) return "次要";
  if (percentage < 10 && percentage >= 0) return "缺乏";
  return null; // 10–19 不特別標
}

/** 判讀用分母：以主星數（totalStars）為準，某類 >30% 即主導 */
function pctOfTotalStars(count: number, totalStars: number): number {
  if (totalStars <= 0) return 0;
  return Math.round((count / totalStars) * 100);
}

/**
 * 回傳各群占比（以 totalStars 為分母）與判讀（主導/次要/極端/缺乏）
 */
export function getGroupPercentages(stats: StarGroupStats): Record<StarGroupTag, { count: number; pct: number; interpretation: GroupInterpretation | null }> {
  const totalStars = stats.totalStars;
  const out = {} as Record<StarGroupTag, { count: number; pct: number; interpretation: GroupInterpretation | null }>;
  for (const tag of SIX_GROUPS) {
    const count = (stats as Record<string, number>)[tag] ?? 0;
    const pct = pctOfTotalStars(count, totalStars);
    out[tag] = { count, pct, interpretation: interpretGroupShare(pct) };
  }
  return out;
}

/**
 * 取 Top 2 群（依 count 降序），僅回傳有計數的群；用於模組一只輸出前兩群。
 * pct 以 totalStars 為分母（與判讀規則一致）。
 */
export function getTopTwoGroups(stats: StarGroupStats): Array<{ tag: StarGroupTag; count: number; pct: number; interpretation: GroupInterpretation | null }> {
  const totalStars = stats.totalStars;
  const list: Array<{ tag: StarGroupTag; count: number; pct: number; interpretation: GroupInterpretation | null }> = [];
  for (const tag of SIX_GROUPS) {
    const count = (stats as Record<string, number>)[tag] ?? 0;
    if (count <= 0) continue;
    const pct = pctOfTotalStars(count, totalStars);
    list.push({ tag, count, pct, interpretation: interpretGroupShare(pct) });
  }
  list.sort((a, b) => b.count - a.count);
  return list.slice(0, 2);
}
