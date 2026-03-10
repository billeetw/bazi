/**
 * 節奏引擎 v2：命宮三方四正（命/財/官/遷）加權計分 + 四化加成 + 校準 + 四段式敘事。
 * 組裝階段只計算一次，產出 rhythmStats / rhythmNarrativeFull / rhythmNarrativeBrief 供各章節引用。
 */

import {
  MAIN_STAR_WHITELIST,
  AUX_STAR_WHITELIST,
  STAR_PERSONALITY_MAP,
  getTopTwoGroups,
  type StarGroupStats,
  type StarGroupTag,
} from "./starPersonalityMap.js";
import { PALACE_ID_TO_NAME } from "./schema.js";

/** 節奏僅用六類（不含將星、慾望星） */
export type RhythmSixTag = "動星" | "智星" | "穩星" | "權星" | "財星" | "情緒星";
const SIX_GROUPS: RhythmSixTag[] = ["動星", "智星", "穩星", "權星", "財星", "情緒星"];
const RHYTHM_CAT_ORDER: RhythmSixTag[] = ["動星", "智星", "穩星", "權星", "財星", "情緒星"];

/** 命宮三方四正：命、財帛、官祿、遷移 */
export const RHYTHM_FOUR_PALACE_IDS = ["ming", "cai", "guanglu", "qianyi"] as const;
export type RhythmPalaceId = (typeof RHYTHM_FOUR_PALACE_IDS)[number];

/** 四宮宮位名（用於四化落宮比對；含「宮」與不含兩種） */
function buildRhythmPalaceNames(): Set<string> {
  const map = PALACE_ID_TO_NAME as Record<string, string>;
  const set = new Set<string>();
  for (const id of RHYTHM_FOUR_PALACE_IDS) {
    const n = map[id] ?? id;
    set.add(n);
    if (!n.endsWith("宮")) set.add(n + "宮");
    else set.add(n.replace(/宮$/, ""));
  }
  return set;
}
const RHYTHM_PALACE_NAMES = buildRhythmPalaceNames();

/** 天魁、天鉞：權星降權（輔星權星從 1 改為 0.5） */
const QUICKUI_STARS = new Set(["天魁", "天鉞"]);

/** 情緒星標籤（太陰、天同）：情緒類加分額外 +0.5 主 / +0.25 輔 */
const EMOTION_TAG: StarGroupTag = "情緒星";

export interface SihuaRhythmInput {
  /** 任一層出現四化的星名（中文，已 normalize） */
  starNames: Set<string>;
  /** 四化落宮（toPalace）在命財官遷的宮名集合 */
  toPalaceNames: Set<string>;
}

export interface StarsByPalaceInput {
  [palaceId: string]: string[];
}

export interface RhythmScoreInput {
  starsByPalace: StarsByPalaceInput;
  sihua: SihuaRhythmInput;
  starIdToName: Record<string, string>;
}

/** 單星計分結果（debug） */
export interface StarScoreDetail {
  star: string;
  palaceId: string;
  palaceName: string;
  isMain: boolean;
  baseWeight: number;
  sihuaBonus: number;
  palaceBonus: number;
  emotionBonus: number;
  quikuiDiscount: number;
  tags: { tag: StarGroupTag; score: number }[];
}

export interface RhythmStats {
  scores: StarGroupStats;
  percents: Record<RhythmSixTag, number>;
  totalWeight: number;
  effectiveStarCount: number;
  Top1: RhythmSixTag[];
  Top2: RhythmSixTag[];
  weakest: RhythmSixTag[];
  confidence: "高" | "中" | "低";
}

export interface RhythmDebugInfo {
  source: "FOUR_PALACES" | "FALLBACK_WHOLE_CHART";
  fallbackReason?: string;
  palacesUsed: string[];
  perPalace: { palaceId: string; palaceName: string; main: string[]; aux: string[] }[];
  sihuaStarsHit: string[];
  sihuaPalacesHit: string[];
  starDetails: StarScoreDetail[];
  finalScores: Record<RhythmSixTag, number>;
  percents: Record<RhythmSixTag, number>;
  Top1: RhythmSixTag[];
  Top2: RhythmSixTag[];
  weakest: RhythmSixTag[];
  confidence: "高" | "中" | "低";
}

const PALACE_ID_TO_NAME_MAP = PALACE_ID_TO_NAME as Record<string, string>;
function normPalaceName(name: string): string {
  const s = (name ?? "").trim();
  if (PALACE_ID_TO_NAME_MAP[s]) return PALACE_ID_TO_NAME_MAP[s];
  const noSuffix = s.replace(/宮$/, "");
  if (noSuffix === "命") return "命宮";
  return noSuffix ? noSuffix + "宮" : "";
}

function normStarName(name: string, starIdToName: Record<string, string>): string {
  const n = (name ?? "").trim();
  const fromMap = starIdToName[n];
  return fromMap?.trim() || n;
}

/**
 * 從命盤組裝輸入取得四化節奏用資料：哪些星有四化、四化落宮是否在命財官遷
 */
export function extractSihuaRhythmInput(
  chartJson: Record<string, unknown>,
  starIdToName: Record<string, string>
): SihuaRhythmInput {
  const starNames = new Set<string>();
  const toPalaceNames = new Set<string>();
  const layers = chartJson.sihuaLayers as {
    benMing?: { transforms?: Array<{ starId: string; type?: string; toPalace?: string }> };
    daXianCurrent?: { transforms?: Array<{ starId: string; type?: string; toPalace?: string }> };
    liuNianCurrent?: { transforms?: Array<{ starId: string; type?: string; toPalace?: string }> };
  } | undefined;
  const layerKeys = ["benMing", "daXianCurrent", "liuNianCurrent"] as const;
  for (const key of layerKeys) {
    const arr = layers?.[key]?.transforms;
    if (!Array.isArray(arr)) continue;
    for (const t of arr) {
      const starName = normStarName(starIdToName[t.starId] ?? t.starId, starIdToName);
      if (starName) starNames.add(starName);
      const toRaw = t.toPalace ?? "";
      const toName = normPalaceName(toRaw || (starIdToName ? "" : ""));
      if (toName && RHYTHM_PALACE_NAMES.has(toName)) {
        toPalaceNames.add(toName);
        const noSuffix = toName.replace(/宮$/, "");
        if (noSuffix !== toName) toPalaceNames.add(noSuffix);
      }
    }
  }
  const ft = chartJson.fourTransformations as { benming?: { mutagenStars?: Record<string, string> }; decadal?: { mutagenStars?: Record<string, string> }; yearly?: { mutagenStars?: Record<string, string> } } | undefined;
  for (const layer of ["benming", "decadal", "yearly"] as const) {
    const mutagen = layer === "benming" ? ft?.benming?.mutagenStars : layer === "decadal" ? ft?.decadal?.mutagenStars : ft?.yearly?.mutagenStars;
    if (mutagen && typeof mutagen === "object") {
      for (const starName of Object.keys(mutagen)) {
        const n = normStarName(starName, starIdToName);
        if (n) starNames.add(n);
      }
    }
  }
  return { starNames, toPalaceNames };
}

/** 從 buildSiHuaLayers 等取得 toPalace；需在 lifeBookPrompts 側組好傳入，避免循環依賴 */
export function extractSihuaFromEvents(
  events: Array<{ starName: string; toPalace?: string }>,
  starIdToName: Record<string, string>
): SihuaRhythmInput {
  const starNames = new Set<string>();
  const toPalaceNames = new Set<string>();
  for (const e of events) {
    const n = normStarName(e.starName, starIdToName);
    if (n) starNames.add(n);
    const toName = normPalaceName(e.toPalace ?? "");
    if (toName && RHYTHM_PALACE_NAMES.has(toName)) {
      toPalaceNames.add(toName);
      const noSuffix = toName.replace(/宮$/, "");
      if (noSuffix !== toName) toPalaceNames.add(noSuffix);
    }
  }
  return { starNames, toPalaceNames };
}

/**
 * 節奏 v2 加權計分：主/輔基礎權重 + 四化星加成 + 四化落宮宮位加成 + 情緒強化 + 魁鉞權星降權
 */
export function calculateRhythmScoresV2(input: RhythmScoreInput): {
  stats: StarGroupStats;
  effectiveStarCount: number;
  starDetails: StarScoreDetail[];
} {
  const { starsByPalace, sihua, starIdToName } = input;
  const scores: StarGroupStats = {
    動星: 0,
    智星: 0,
    穩星: 0,
    權星: 0,
    財星: 0,
    情緒星: 0,
    totalStars: 0,
  };
  const starDetails: StarScoreDetail[] = [];
  let effectiveStarCount = 0;
  const palaceIdToName = PALACE_ID_TO_NAME as Record<string, string>;

  for (const palaceId of RHYTHM_FOUR_PALACE_IDS) {
    const starList = starsByPalace[palaceId] ?? [];
    const palaceName = palaceIdToName[palaceId] ?? palaceId;
    const palaceNameNoSuffix = palaceName.replace(/宮$/, "");
    const palaceBonus = (sihua.toPalaceNames.has(palaceName) || sihua.toPalaceNames.has(palaceNameNoSuffix)) ? 1 : 0;

    for (const raw of starList) {
      const name = normStarName(raw, starIdToName);
      if (!name) continue;
      const tags = (STAR_PERSONALITY_MAP[name] ?? []).filter((t): t is RhythmSixTag => SIX_GROUPS.includes(t as RhythmSixTag));
      const isMain = MAIN_STAR_WHITELIST.has(name);
      const isAux = AUX_STAR_WHITELIST.has(name);
      if (!isMain && !isAux) continue;
      effectiveStarCount++;

      const baseWeight = isMain ? 2 : 1;
      const sihuaBonus = sihua.starNames.has(name) ? 1 : 0;
      const starLevelWeight = baseWeight + sihuaBonus;
      const palaceAdd = palaceBonus ? (isMain ? 0.5 : 0.25) : 0;
      const emotionAdd = tags.includes(EMOTION_TAG) ? (isMain ? 0.5 : 0.25) : 0;
      const quikuiDiscount = (QUICKUI_STARS.has(name) && tags.includes("權星")) ? (isMain ? 0 : 0.5) : 0;

      const tagScores: { tag: RhythmSixTag; score: number }[] = [];
      for (const tag of tags) {
        let w = starLevelWeight + palaceAdd;
        if (tag === EMOTION_TAG) w += emotionAdd;
        if (tag === "權星" && QUICKUI_STARS.has(name)) w -= quikuiDiscount;
        const score = Math.max(0, w);
        tagScores.push({ tag, score });
        (scores as unknown as Record<string, number>)[tag] = ((scores as unknown as Record<string, number>)[tag] ?? 0) + score;
      }
      starDetails.push({
        star: name,
        palaceId,
        palaceName,
        isMain,
        baseWeight,
        sihuaBonus,
        palaceBonus: palaceAdd,
        emotionBonus: tags.includes(EMOTION_TAG) ? (isMain ? 0.5 : 0.25) : 0,
        quikuiDiscount: tagScores.some((t) => t.tag === "權星") && QUICKUI_STARS.has(name) ? 0.5 : 0,
        tags: tagScores,
      });
    }
  }

  const totalWeight = SIX_GROUPS.reduce((sum, tag) => sum + (scores[tag] ?? 0), 0);
  scores.totalStars = totalWeight || 0;
  return { stats: scores, effectiveStarCount, starDetails };
}

function getConfidence(
  effectiveStarCount: number,
  top1Score: number,
  top2Score: number
): "高" | "中" | "低" {
  if (effectiveStarCount < 4) return "低";
  const diff = top1Score - top2Score;
  if (diff <= 1) return "中";
  if (diff >= 3 && effectiveStarCount >= 6) return "高";
  return "中";
}

export function computeRhythmStats(
  stats: StarGroupStats,
  effectiveStarCount: number
): RhythmStats {
  const totalWeight = stats.totalStars || 1;
  const percents: Record<RhythmSixTag, number> = {} as Record<RhythmSixTag, number>;
  for (const tag of SIX_GROUPS) {
    percents[tag] = Math.round(((stats[tag] ?? 0) / totalWeight) * 100);
  }
  const topTwo = getTopTwoGroups(stats);
  const Top1 = RHYTHM_CAT_ORDER.filter((t) => (stats[t] ?? 0) === (topTwo[0]?.count ?? 0)) as RhythmSixTag[];
  const Top2 = (topTwo[1] != null
    ? RHYTHM_CAT_ORDER.filter((t) => (stats[t] ?? 0) === topTwo[1].count)
    : []) as RhythmSixTag[];
  const sorted = [...SIX_GROUPS].sort((a, b) => (stats[a] ?? 0) - (stats[b] ?? 0));
  const minScore = sorted.length ? (stats[sorted[0]] ?? 0) : 0;
  const weakest = sorted.filter((t) => (stats[t] ?? 0) === minScore).slice(0, 2) as RhythmSixTag[];
  const confidence = getConfidence(
    effectiveStarCount,
    topTwo[0]?.count ?? 0,
    topTwo[1]?.count ?? 0
  );
  return {
    scores: stats,
    percents,
    totalWeight,
    effectiveStarCount,
    Top1,
    Top2,
    weakest,
    confidence,
  };
}

/** 六類敘事句塊：primary(Top1)、secondary(Top2)、shadow、weak；interaction 為通用模板變數 */
const RHYTHM_NARRATION: Record<
  RhythmSixTag,
  { primary: string; secondary: string; shadow: string; weak: string; misuse?: string }
> = {
  動星: {
    primary: "先動起來才看清楚、用嘗試換回饋",
    secondary: "需要行動驗證、比紙上談兵有效",
    shadow: "行動力強時容易衝過頭，需留意節奏與風險。",
    weak: "容易卡在準備期，需刻意設「最小行動」",
    misuse: "若過度依賴行動而少思考，易重複試錯。",
  },
  智星: {
    primary: "先想清楚框架、擅長拆解與比較",
    secondary: "用思考做導航、能把複雜變清楚",
    shadow: "分析型強時容易想太多而拖延，需設停損點。",
    weak: "容易用直覺硬衝，需補「檢核點」",
    misuse: "若過度依賴分析而遲遲不行動，易錯失時機。",
  },
  穩星: {
    primary: "重視穩定、擅長長期累積與抗波動",
    secondary: "能撐住節奏、把事情做完做深",
    shadow: "重視穩定時容易抗拒變化，需保留彈性。",
    weak: "容易三分鐘熱度，需補「節奏管理」",
    misuse: "若過度求穩而不敢變通，易僵化。",
  },
  權星: {
    primary: "習慣把事情拉回可控、擅長主導與定規則",
    secondary: "關鍵時能出手定局、把混亂變秩序",
    shadow: "主導型強時容易包山包海，需學會放手。",
    weak: "容易被環境推著走，需補「界線／主導權」",
    misuse: "若過度主導而少傾聽，易造成對立。",
  },
  財星: {
    primary: "以成本效益做決策、重視資源配置與回收",
    secondary: "會算帳、懂得用資源放大槓桿",
    shadow: "重視成本時容易錯失機會，需平衡風險與回收。",
    weak: "容易忽略代價，需補「交換／風險清單」",
    misuse: "若過度精算而少投資自己，易短視。",
  },
  情緒星: {
    primary: "以感受校準方向、擅長察覺關係溫度",
    secondary: "會讀場、懂得用同理降低摩擦",
    shadow: "感受型強時容易受氛圍影響，需保留界線。",
    weak: "容易忽略人心與氛圍，需補「情緒體感回收」",
    misuse: "若過度依賴感受而忽略數據，易主觀。",
  },
};

const GROUP_STYLE: Record<RhythmSixTag, string> = {
  動星: "行動型",
  智星: "思考型",
  穩星: "穩定型",
  權星: "責任型",
  財星: "資源型",
  情緒星: "感受型",
};

/** 段1【主結論】段2【運作方式】段3【壓力偏誤】段4【可操作動作】 */
export function buildRhythmNarrativeFourSegmentsV2(r: RhythmStats): {
  segment1: string;
  segment2: string;
  segment3: string;
  segment4: string;
} {
  const top1Ordered = RHYTHM_CAT_ORDER.filter((t) => r.Top1.includes(t));
  const top2Ordered = RHYTHM_CAT_ORDER.filter((t) => r.Top2.includes(t));
  const primaryTop1 = top1Ordered[0];
  const primaryTop2 = top2Ordered[0];
  const secondTop2 = top2Ordered[1];
  const blocks = RHYTHM_NARRATION;

  const segment1 =
    top1Ordered.length === 0
      ? "你的命宮三方四正星曜分布均衡，可依情境切換節奏。"
      : top1Ordered.length === 1
        ? blocks[primaryTop1].primary
        : top1Ordered.map((t) => blocks[t].primary).join("；");

  const segment2 =
    primaryTop2 != null
      ? `你通常先以${primaryTop1}推進（${blocks[primaryTop1].primary}），再用${primaryTop2}校準（${blocks[primaryTop2].secondary}）；當壓力上來時，${blocks[primaryTop1].shadow}，因此建議留意節奏與取捨。`
      : `你的運作方式：${blocks[primaryTop1].primary}`;

  const top2Misuse = primaryTop2 ? (blocks[primaryTop2].misuse ?? "") : "";
  const segment3 =
    primaryTop1 != null
      ? (top2Misuse
          ? `當壓力上來時，${blocks[primaryTop1].shadow}；${primaryTop2}方面則可能${top2Misuse}。`
          : `當壓力上來時，${blocks[primaryTop1].shadow}。`)
      : "節奏均衡時，留意在壓力下是否某一型會過度放大。";

  const weakParts = r.weakest.map((t) => blocks[t].weak);
  const secondarySupplement = secondTop2 ? `此外可善用${secondTop2}：${blocks[secondTop2].secondary}。` : "";
  const segment4 =
    weakParts.length > 0
      ? `${weakParts.join("；")}。${secondarySupplement}`.trim()
      : secondarySupplement || "可依當下情境選擇先動、先想或先穩，再微調。";

  return { segment1, segment2, segment3, segment4 };
}

/** 一句引用（brief）：節奏提示：你偏{Top1}、並以{Top2}校準（置信度：高/中/低） */
export function buildRhythmBrief(r: RhythmStats): string {
  const t1 = r.Top1[0];
  const t2 = r.Top2[0];
  const style1 = t1 ? (GROUP_STYLE[t1] ?? t1) : "均衡";
  const style2 = t2 ? (GROUP_STYLE[t2] ?? t2) : "情境";
  return `節奏提示：你偏${style1}${t2 ? `、並以${style2}校準` : ""}（置信度：${r.confidence}）。`;
}

/** 完整輸出：數字+佔比+置信度+四段式文案 */
export function buildRhythmFull(
  r: RhythmStats,
  fourSegments: { segment1: string; segment2: string; segment3: string; segment4: string }
): string {
  const scoreLine = SIX_GROUPS.map((t) => `${t}：${r.scores[t] ?? 0}`).join("　");
  const pctLine = SIX_GROUPS.map((t) => `${t} ${r.percents[t] ?? 0}%`).join("　");
  const lines = [
    "你的命宮三方四正星曜節奏如下：",
    scoreLine,
    pctLine,
    `置信度：${r.confidence}`,
    "",
    "【主結論】",
    fourSegments.segment1,
    "",
    "【運作方式】",
    fourSegments.segment2,
    "",
    "【壓力偏誤】",
    fourSegments.segment3,
    "",
    "【可操作動作】",
    fourSegments.segment4,
  ];
  return lines.join("\n");
}

/** 組裝階段只計算一次：產出 rhythmStats / rhythmNarrativeFull / rhythmNarrativeBrief / debugInfo */
export function computeRhythmOnce(
  input: RhythmScoreInput,
  options: {
    fallbackStars?: string[];
    source: "FOUR_PALACES" | "FALLBACK_WHOLE_CHART";
    fallbackReason?: string;
    debug?: boolean;
  }
): {
  rhythmStats: RhythmStats;
  rhythmNarrativeFull: string;
  rhythmNarrativeBrief: string;
  debugInfo: RhythmDebugInfo;
} {
  const palaceIdToName = PALACE_ID_TO_NAME as Record<string, string>;
  const hasAnyStars = RHYTHM_FOUR_PALACE_IDS.some((id) => (input.starsByPalace[id] ?? []).length > 0);
  const starsByPalace = hasAnyStars
    ? input.starsByPalace
    : (() => {
        const fallback = options.fallbackStars ?? [];
        const byPalace: StarsByPalaceInput = {};
        for (const id of RHYTHM_FOUR_PALACE_IDS) byPalace[id] = [];
        if (fallback.length > 0) byPalace[RHYTHM_FOUR_PALACE_IDS[0]] = fallback.slice(0, 8);
        return byPalace;
      })();
  const actualSource = hasAnyStars ? options.source : "FALLBACK_WHOLE_CHART";
  const { stats, effectiveStarCount, starDetails } = calculateRhythmScoresV2({
    ...input,
    starsByPalace,
  });
  const rhythmStats = computeRhythmStats(stats, effectiveStarCount);
  const fourSegments = buildRhythmNarrativeFourSegmentsV2(rhythmStats);
  const rhythmNarrativeFull = buildRhythmFull(rhythmStats, fourSegments);
  const rhythmNarrativeBrief = buildRhythmBrief(rhythmStats);

  const perPalace = RHYTHM_FOUR_PALACE_IDS.map((id) => {
    const list = starsByPalace[id] ?? [];
    const main: string[] = [];
    const aux: string[] = [];
    for (const raw of list) {
      const n = normStarName(raw, input.starIdToName);
      if (MAIN_STAR_WHITELIST.has(n)) main.push(n);
      else if (AUX_STAR_WHITELIST.has(n)) aux.push(n);
    }
    return {
      palaceId: id,
      palaceName: palaceIdToName[id] ?? id,
      main,
      aux,
    };
  });

  const debugInfo: RhythmDebugInfo = {
    source: actualSource,
    fallbackReason: actualSource === "FALLBACK_WHOLE_CHART" ? options.fallbackReason : undefined,
    palacesUsed: RHYTHM_FOUR_PALACE_IDS.map((id) => palaceIdToName[id] ?? id),
    perPalace,
    sihuaStarsHit: [...input.sihua.starNames],
    sihuaPalacesHit: [...input.sihua.toPalaceNames],
    starDetails,
    finalScores: { 動星: rhythmStats.scores.動星, 智星: rhythmStats.scores.智星, 穩星: rhythmStats.scores.穩星, 權星: rhythmStats.scores.權星, 財星: rhythmStats.scores.財星, 情緒星: rhythmStats.scores.情緒星 },
    percents: { ...rhythmStats.percents },
    Top1: rhythmStats.Top1,
    Top2: rhythmStats.Top2,
    weakest: rhythmStats.weakest,
    confidence: rhythmStats.confidence,
  };

  return {
    rhythmStats,
    rhythmNarrativeFull,
    rhythmNarrativeBrief,
    debugInfo,
  };
}
