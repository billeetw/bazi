/**
 * divinationWuxing.js
 * 卦宮五行 × 流年五行：2026 丙午年解釋邏輯
 * 同氣(比和)、被生(相生)、被克(相克)、生出(洩氣)、克出(耗損)
 */
(function (global) {
  "use strict";

  const FLOW_2026 = { stem: "丙", branch: "午", wuxing: "火" };

  const RELATION_MAP = {
    "同氣": {
      name: "同氣（比和）",
      summary: "旺盛運勢如日中天，利於擴張、名聲。但需防火氣過旺導致衝動。",
    },
    "被生": {
      name: "被生（相生）",
      summary: "火生土，代表外部資源充足、長輩提攜，適合執行規劃、買房或學習。",
    },
    "被克": {
      name: "被克（相克）",
      summary: "火克金，壓力巨大、筋骨或肺部不適，求財辛苦，宜守不宜進。",
    },
    "生出": {
      name: "生出（洩氣）",
      summary: "木生火，才華雖能發揮但身心俱疲。利於內容創作，但要注意入不敷出。",
    },
    "克出": {
      name: "克出（耗損）",
      summary: "水克火，雖能控制局面但競爭激烈。代表「財氣」但需辛苦經營。",
    },
  };

  /** 五行生剋：主體(卦宮) vs 環境(流年) */
  function getRelation(guagongWuxing, flowWuxing) {
    const sheng = { water: "wood", wood: "fire", fire: "earth", earth: "metal", metal: "water" };
    const ke = { water: "fire", fire: "metal", metal: "wood", wood: "earth", earth: "water" };
    const wuxingEn = { 金: "metal", 木: "wood", 水: "water", 火: "fire", 土: "earth" };
    const g = wuxingEn[guagongWuxing];
    const f = wuxingEn[flowWuxing];
    if (!g || !f) return null;
    if (g === f) return "同氣";
    if (sheng[f] === g) return "被生";
    if (ke[f] === g) return "被克";
    if (sheng[g] === f) return "生出";
    if (ke[g] === f) return "克出";
    return null;
  }

  function getFlowYearAdvice(guagongWuxing, flowYear) {
    const flowWuxing = flowYear?.wuxing || "火";
    const rel = getRelation(guagongWuxing, flowWuxing);
    return rel ? RELATION_MAP[rel] : null;
  }

  /** 2026 丙午年方位規則 */
  const DIRECTIONS_2026 = {
    wealth: { dir: "正北方", desc: "一白貪狼星（財星）飛臨，若問財且臥室/辦公桌在正北，可加權吉。", label: "財位" },
    "wen chang": { dir: "西北方", desc: "四綠文曲星。考運、合約、創意相關，可於西北方放置綠色植物或書籍。", label: "文昌位" },
    sha: { dir: "東北方", desc: "五黃大煞。宜靜不宜動，若卦象不佳且動爻在東北，需提醒風險。", label: "煞位" },
  };

  const api = {
    FLOW_2026,
    getRelation,
    getFlowYearAdvice,
    DIRECTIONS_2026,
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  } else {
    global.DivinationWuxing = api;
  }
})(typeof window !== "undefined" ? window : globalThis);
