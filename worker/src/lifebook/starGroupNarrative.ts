/**
 * 星曜群性命書句庫：六類主導的 message / action
 * 僅在模組一使用；只輸出 Top 2 群，每群只講一次。
 * 另提供 rule-based 命宮三方四正節奏敘事：主型／次型／偏弱／shadow 句塊 + 四段固定輸出。
 */

import {
  calculateStarGroupStats,
  calculateStarGroupStatsWeighted,
  getTopTwoGroups,
  type StarGroupStats,
  type StarGroupTag,
} from "./starPersonalityMap.js";

/** 六類固定順序（用於 tie-handling：主型並列時依此序串接） */
const RHYTHM_CAT_ORDER: StarGroupTag[] = ["動星", "智星", "穩星", "權星", "財星", "情緒星"];

/** 主型／次型／偏弱／壓力提醒（shadow）句塊 */
export interface RhythmSentenceBlock {
  主型: string;
  次型: string;
  偏弱: string;
  shadow: string;
}

/** 命宮三方四正（命／財／官／遷）六類節奏句塊字典 */
export const RHYTHM_SENTENCE_BLOCKS: Record<StarGroupTag, RhythmSentenceBlock> = {
  動星: {
    主型: "先動起來才看清楚、用嘗試換回饋",
    次型: "需要行動驗證、比紙上談兵有效",
    偏弱: "容易卡在準備期，需刻意設「最小行動」",
    shadow: "行動力強時容易衝過頭，需留意節奏與風險。",
  },
  智星: {
    主型: "先想清楚框架、擅長拆解與比較",
    次型: "用思考做導航、能把複雜變清楚",
    偏弱: "容易用直覺硬衝，需補「檢核點」",
    shadow: "分析型強時容易想太多而拖延，需設停損點。",
  },
  穩星: {
    主型: "重視穩定、擅長長期累積與抗波動",
    次型: "能撐住節奏、把事情做完做深",
    偏弱: "容易三分鐘熱度，需補「節奏管理」",
    shadow: "重視穩定時容易抗拒變化，需保留彈性。",
  },
  權星: {
    主型: "習慣把事情拉回可控、擅長主導與定規則",
    次型: "關鍵時能出手定局、把混亂變秩序",
    偏弱: "容易被環境推著走，需補「界線／主導權」",
    shadow: "主導型強時容易包山包海，需學會放手。",
  },
  財星: {
    主型: "以成本效益做決策、重視資源配置與回收",
    次型: "會算帳、懂得用資源放大槓桿",
    偏弱: "容易忽略代價，需補「交換／風險清單」",
    shadow: "重視成本時容易錯失機會，需平衡風險與回收。",
  },
  情緒星: {
    主型: "以感受校準方向、擅長察覺關係溫度",
    次型: "會讀場、懂得用同理降低摩擦",
    偏弱: "容易忽略人心與氛圍，需補「情緒體感回收」",
    shadow: "感受型強時容易受氛圍影響，需保留界線。",
  },
};

/** 由計數推得：最高類、次高類、最低 1～2 類（依 RHYTHM_CAT_ORDER 排序） */
export function getDominantSecondaryWeak(stats: StarGroupStats): {
  dominantCats: StarGroupTag[];
  secondaryCats: StarGroupTag[];
  weakCats: StarGroupTag[];
} {
  const counts = RHYTHM_CAT_ORDER.map((tag) => ({ tag, count: stats[tag] ?? 0 }));
  const sorted = [...counts].sort((a, b) => b.count - a.count);
  const maxCount = sorted[0]?.count ?? 0;
  const secondCount = sorted.find((x) => x.count < maxCount)?.count ?? maxCount;
  const minCount = sorted[sorted.length - 1]?.count ?? 0;
  const dominantCats = RHYTHM_CAT_ORDER.filter((tag) => (stats[tag] ?? 0) === maxCount);
  const secondaryCats = RHYTHM_CAT_ORDER.filter(
    (tag) => (stats[tag] ?? 0) === secondCount && secondCount < maxCount
  );
  const weakCats = RHYTHM_CAT_ORDER.filter((tag) => (stats[tag] ?? 0) === minCount).slice(0, 2);
  return { dominantCats, secondaryCats, weakCats };
}

/** 產出固定四段文字：A 一句總結、B 運作方式、C 壓力提醒、D 操作建議（保證每段都有內容） */
export function buildRhythmNarrativeFourSegments(stats: StarGroupStats): {
  summary: string;
  operation: string;
  shadow: string;
  suggestion: string;
} {
  const { dominantCats, secondaryCats, weakCats } = getDominantSecondaryWeak(stats);
  const blocks = RHYTHM_SENTENCE_BLOCKS;

  const dominantOrdered = RHYTHM_CAT_ORDER.filter((t) => dominantCats.includes(t));
  const summary =
    dominantOrdered.length === 0
      ? "你的命宮三方四正星曜分布均衡，可依情境切換節奏。"
      : dominantOrdered.length === 1
        ? blocks[dominantOrdered[0]].主型
        : dominantOrdered.map((t) => blocks[t].主型).join("；");

  const primaryDominant = dominantOrdered[0];
  const primarySecondary = secondaryCats[0];
  const operation =
    primarySecondary != null
      ? `以${primaryDominant}為主（${blocks[primaryDominant].主型}），輔以${primarySecondary}（${blocks[primarySecondary].次型}）。`
      : `你的運作方式：${blocks[primaryDominant].主型}`;

  const shadow =
    primaryDominant != null
      ? blocks[primaryDominant].shadow
      : "節奏均衡時，留意在壓力下是否某一型會過度放大。";

  const weakParts = weakCats.map((t) => blocks[t].偏弱);
  const secondaryInSuggestion =
    secondaryCats.length > 1 && secondaryCats[1] != null
      ? `此外可善用${secondaryCats[1]}：${blocks[secondaryCats[1]].次型}。`
      : "";
  const suggestion =
    weakParts.length > 0
      ? `${weakParts.join("；")}。${secondaryInSuggestion}`.trim()
      : secondaryInSuggestion
        ? secondaryInSuggestion
        : "可依當下情境選擇先動、先想或先穩，再微調。";

  return { summary, operation, shadow, suggestion };
}

export interface StarGroupNarrativeSet {
  message: string[];
  action: string[];
}

const SIX_GROUP_NARRATIVES: Record<StarGroupTag, StarGroupNarrativeSet> = {
  動星: {
    message: [
      "你的命盤中動星比例較高，代表行動與變化是人生的重要節奏。",
      "你傾向在變動中尋找方向，而不是等待環境穩定。",
      "先小步嘗試、用行動換回饋，往往比等想透再動更符合你的節奏。",
    ],
    action: [
      "先小步嘗試，再逐步調整方向。",
      "讓行動成為探索，而不是一次就要找到答案。",
      "保持彈性，比追求完美計畫更重要。",
    ],
  },
  智星: {
    message: [
      "你的盤中智星比例明顯，思考與分析是重要的工具。",
      "很多事情你習慣先理解結構，再採取行動。",
      "你往往能看到問題背後的邏輯。",
    ],
    action: [
      "避免過度思考拖慢節奏。",
      "當理解足夠時，就開始行動。",
      "把想法轉成可實驗的小步驟。",
    ],
  },
  穩星: {
    message: [
      "你的命盤穩定型星曜較多，代表你重視長期累積。",
      "你更適合建立結構，而不是頻繁改變方向。",
      "很多成果來自長期投入。",
    ],
    action: [
      "建立穩定的節奏與系統。",
      "不要因短期波動而過度調整方向。",
      "長期策略往往比短期機會更重要。",
    ],
  },
  權星: {
    message: [
      "你的盤中權星比例明顯，代表你容易承擔責任。",
      "很多時候你會自然地成為決策者。",
      "你對掌控節奏有強烈的需求。",
    ],
    action: [
      "學會分配權力，而不是全部自己扛。",
      "建立清楚的決策框架。",
      "讓責任與資源同步增加。",
    ],
  },
  財星: {
    message: [
      "你的命盤財星比例偏高，代表資源與價值議題特別重要。",
      "你對價值與交換的感知通常很敏銳。",
      "很多選擇會與資源配置有關。",
    ],
    action: [
      "建立長期資源策略。",
      "避免只看短期收益。",
      "讓價值累積比單次收益更重要。",
    ],
  },
  情緒星: {
    message: [
      "你的盤中情緒型星曜較多，情感與感受對你影響很大。",
      "很多判斷會受到環境氛圍影響。",
      "你的直覺通常很敏銳。",
    ],
    action: [
      "在重要決策前給自己一段冷靜時間。",
      "讓情緒與理性一起參與判斷。",
      "學會分辨感受與事實。",
    ],
  },
};

export function getStarGroupNarrative(tag: StarGroupTag): StarGroupNarrativeSet {
  return SIX_GROUP_NARRATIVES[tag] ?? { message: [], action: [] };
}

/** Deterministic 輪替：依 tag 選 message/action 索引 */
export function pickNarrativeIndex(tag: string, length: number): number {
  if (length <= 0) return 0;
  let h = 0;
  for (let i = 0; i < tag.length; i++) h = ((h << 5) - h + tag.charCodeAt(i)) | 0;
  return ((h % length) + length) % length;
}

const GROUP_TAG_TO_STYLE: Record<string, string> = {
  動星: "行動型",
  智星: "思考型",
  穩星: "穩定型",
  權星: "責任型",
  財星: "資源型",
  情緒星: "感受型",
};

/**
 * 產出模組一【星曜能量節奏】區塊：命宮三方四正（命／財／官／遷）六類加權計分 + rule-based 四段敘事。
 * 取星：僅主星 14 + 輔星 8 白名單；主星每標籤 +2、輔星每標籤 +1；煞星／雜曜不計。
 * 保證任何組合都有文字描述。options.debug 為 true 時（僅開發模式）追加驗收用 debug 區塊。
 */
export function buildStarEnergyRhythmBlock(
  starNames: string[],
  patternPalace?: string,
  options?: { debug?: boolean }
): string {
  const { stats, debugDetail, ignored } = calculateStarGroupStatsWeighted(starNames);
  const fallbackStats: StarGroupStats = {
    動星: 0,
    智星: 0,
    穩星: 0,
    權星: 0,
    財星: 0,
    情緒星: 0,
    totalStars: 0,
  };
  const useStats = stats.totalStars > 0 ? stats : fallbackStats;
  const { summary, operation, shadow, suggestion } = buildRhythmNarrativeFourSegments(useStats);

  const numLine = `動星：${useStats.動星}　智星：${useStats.智星}　穩星：${useStats.穩星}　權星：${useStats.權星}　財星：${useStats.財星}　情緒星：${useStats.情緒星}`;
  const lines: string[] = [
    "【星曜能量節奏】",
    "",
    "你的命宮三方四正星曜節奏如下：",
    numLine,
    "",
    "A. 一句總結",
    summary,
    "",
    "B. 運作方式",
    operation,
    "",
    "C. 壓力提醒",
    shadow,
    "",
    "D. 操作建議",
    suggestion,
  ];
  if (patternPalace && stats.totalStars > 0) {
    const topTwo = getTopTwoGroups(useStats);
    const firstTag = topTwo[0]?.tag;
    if (firstTag) {
      const style = GROUP_TAG_TO_STYLE[firstTag] ?? firstTag;
      lines.push("", `今年四化點亮${patternPalace}，命盤偏${style}，很多機會來自實際行動與布局。`);
    }
  }
  if (options?.debug) {
    lines.push("", "---", "【開發模式】星曜節奏驗收");
    lines.push(`計入星曜（主星權重2、輔星權重1）：${debugDetail.map((d) => `${d.star}(${d.weight})`).join("、") || "無"}`);
    lines.push(`六類加權分：${numLine}，計入星數：${debugDetail.length}，總權重：${useStats.totalStars}`);
    if (ignored.length > 0) lines.push(`未計入（煞星／雜曜）：${ignored.join("、")}`);
    lines.push("驗收：不同命盤需有差異（或 Top1/Top2 差異），煞星／雜曜未計入。", "---");
  }
  return lines.filter(Boolean).join("\n").trimEnd();
}
