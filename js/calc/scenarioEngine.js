/**
 * scenarioEngine.js
 * 規則引擎：宮位五行 + 情境 + 爻位 + 狀態 拼接，不硬編碼 64 卦
 * YearContext 2026 方位規則
 */
(function (global) {
  "use strict";

  /** 卦宮五行 × 情境 → 關鍵詞（5×4，取代 64×3） */
  const WUXING_SCENARIO_MATRIX = {
    金: { career: "壓力與磨練", wealth: "審慎理財", love: "界線清晰", neutral: "受制與考驗" },
    木: { career: "才華外露", wealth: "消耗需節制", love: "成長與付出", neutral: "擴張與消耗" },
    水: { career: "競爭與博弈", wealth: "辛苦經營", love: "考驗信任", neutral: "流動與險阻" },
    火: { career: "擴張與名聲", wealth: "旺盛但需節制", love: "熱情與依附", neutral: "旺盛與消耗" },
    土: { career: "得助與穩定", wealth: "資源穩定", love: "包容與承載", neutral: "貴人與穩定" },
  };

  /** 爻位 × 情境 → 階段描述 */
  const LINE_POSITION_BY_SCENARIO = {
    career: ["基層起步期", "中階磨練期", "轉型關鍵期", "高層決策期", "頂峰守成期", "功成身退期"],
    wealth: ["初階累積", "穩健佈局", "擴張關鍵", "收成階段", "配置優化", "傳承規劃"],
    love: ["初識試探", "深入了解", "關係轉折", "承諾階段", "穩定經營", "圓滿或轉型"],
    neutral: ["初始階段", "發展階段", "轉折階段", "考驗階段", "頂峰階段", "收官階段"],
  };

  /** 卦宮五行 × 流年五行 → 加權描述 */
  const FLOW_YEAR_WUXING = {
    金: "火剋金，壓力與磨練並存，宜守不宜攻。",
    木: "木生火，才華雖能發揮但消耗較大，需注意收支平衡。",
    水: "水克火，雖能制衡但競爭激烈，辛苦經營可得。",
    火: "同氣比和，能量旺盛，利於擴張與名聲，但需防火氣過旺。",
    土: "火生土，受生得助，資源穩定，貴人提攜。",
  };

  /** 當位/正應 vs 不當位/不應 → 形容詞 */
  function getLineQuality(isCorrect, isResonance) {
    const positive = ["穩定", "得助", "正面", "順利"];
    const negative = ["磨合", "孤軍", "壓力", "需守"];
    const count = (isCorrect ? 1 : 0) + (isResonance ? 1 : 0);
    return count >= 1 ? positive : negative;
  }

  /**
   * ScenarioEngine：依規則拼接解釋
   * @param {Object} opts
   * @param {string} opts.hexagramName - 卦名
   * @param {string} opts.wuxing - 卦宮五行 金木水火土
   * @param {string} opts.scenario - career | wealth | love | neutral
   * @param {string} [opts.summary] - 卦辭摘要（可選，用於補充）
   * @param {string} [opts.character] - 卦性格（可選，fallback）
   */
  function buildGlobalInsight(opts) {
    const { hexagramName, wuxing, scenario, summary = "", character = "" } = opts;
    const ctxLabel = scenario === "neutral" ? "" : { career: "事業", wealth: "財運", love: "感情" }[scenario] || "";
    const keyword = (wuxing && WUXING_SCENARIO_MATRIX[wuxing] && scenario !== "neutral")
      ? WUXING_SCENARIO_MATRIX[wuxing][scenario] || character
      : character || hexagramName;
    const flowText = wuxing ? FLOW_YEAR_WUXING[wuxing] || "" : "";
    const prefix = ctxLabel ? "【" + ctxLabel + "】" : "";
    return `${prefix}${hexagramName}卦代表你問事當下的整體格局${ctxLabel ? "，轉譯為「" + keyword + "」" : "，大局指向「" + keyword + "」"}。${summary ? "卦辭：" + summary : ""}${flowText ? " 2026 丙午年火旺，" + flowText : ""}`;
  }

  /**
   * 動爻解釋：情境 + 爻位 + 位應狀態 + 爻辭
   */
  function buildLineInsight(opts) {
    const { scenario, lineIndex, isCorrect, isResonance, lineText, lineHint } = opts;
    const posKw = (LINE_POSITION_BY_SCENARIO[scenario] || LINE_POSITION_BY_SCENARIO.neutral)[lineIndex] || "此階段";
    const qualities = getLineQuality(isCorrect, isResonance);
    const qualityStr = qualities.join("、");
    const hintPart = (lineHint || "").split("：").slice(1).join("：").trim() || (lineHint || "").trim();
    const meaning = hintPart || lineText;
    const isPositive = qualities[0] === "穩定" || qualities[0] === "得助";
    const names = ["初", "二", "三", "四", "五", "上"];
    const insight = isPositive
      ? `${posKw}，位應${qualityStr}。爻辭「${lineText}」。轉譯：${meaning}`
      : `${posKw}，位應${qualityStr}。爻辭「${lineText}」。轉譯：${meaning} 宜守不宜進，避免衝動擴張。`;
    return { lineName: names[lineIndex] + "爻", insight };
  }

  /**
   * YearContext 2026 方位規則引擎
   * @param {number} year - 西元年
   * @param {string} scenario - career | wealth | love
   * @returns {{ dir: string, label: string, desc: string } | null}
   */
  function getDirectionRecommendation(year, scenario) {
    if (scenario === "neutral") return null;
    const RULES_2026 = {
      career: { dir: "西北方", label: "文昌位", desc: "四綠文曲星飛臨，適合在西北方放置綠色植物、書籍，有助考運、合約、創意工作。" },
      wealth: { dir: "正北方", label: "財位", desc: "一白貪狼星飛臨，若臥室或辦公桌在正北，可強化財氣；可擺放流水或金屬飾品。" },
      love: { dir: "西南方", label: "桃花位", desc: "九紫右弼星主姻緣，西南方宜保持整潔、可點綴紅色或粉色，營造溫暖氛圍。" },
    };
    if (year === 2026) return RULES_2026[scenario] || null;
    return RULES_2026[scenario] || null;
  }

  /**
   * 完整 generateInsight：相容 divinationInsight 介面，改用 ScenarioEngine 邏輯
   */
  function generateInsight(opts) {
    const { primaryIndex, primaryName, wuxing, context, changingLines = [], line384Data = [], summary = {} } = opts;
    const scenario = context || "career";
    const name = (primaryName || "").replace(/卦$/, "");

    const globalInsight = buildGlobalInsight({
      hexagramName: name,
      wuxing,
      scenario,
      summary: summary.summary,
      character: summary.character,
    });

    const names = ["初", "二", "三", "四", "五", "上"];
    const lineInsights = changingLines.map((idx) => {
      const ld = line384Data[idx];
      return buildLineInsight({
        scenario,
        lineIndex: idx,
        isCorrect: ld && ld.correct > 0,
        isResonance: ld && ld.resonance > 0,
        lineText: ld?.text || "",
        lineHint: ld?.hint || "",
      });
    });

    const space = getDirectionRecommendation(2026, scenario);
    const spaceGuide = space ? `${space.label}（${space.dir}）：${space.desc}` : "";

    return { globalInsight, lineInsights, spaceGuide };
  }

  const api = {
    buildGlobalInsight,
    buildLineInsight,
    getLineQuality,
    getDirectionRecommendation,
    generateInsight,
    WUXING_SCENARIO_MATRIX,
    LINE_POSITION_BY_SCENARIO,
    FLOW_YEAR_WUXING,
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  } else {
    global.ScenarioEngine = api;
  }
})(typeof window !== "undefined" ? window : globalThis);
