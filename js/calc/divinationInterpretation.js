/**
 * divinationInterpretation.js
 * 互卦（過程）與變卦（發展）的深度解釋
 * 賦予時間維度與因果邏輯
 */
(function (global) {
  "use strict";

  const WUXING_TRAIT = {
    金: "壓力、受制與磨練",
    木: "才華外露、洩氣與消耗",
    水: "博弈、競爭與求財辛苦",
    火: "旺盛、擴張與名聲",
    土: "得助、貴人與穩定",
  };

  /** 情境切換：事業／財運／感情的 character 覆寫（hexagramIndex -> context -> 關鍵詞） */
  const CONTEXT_CHARACTER = {
    63: { career: "守成轉型", wealth: "獲利配置", love: "感情穩定" },
    64: { career: "未竟之功", wealth: "見好就收", love: "耐心經營" },
    11: { career: "天地和諧", wealth: "小往大來", love: "關係順遂" },
    12: { career: "閉塞待時", wealth: "守財為上", love: "溝通為先" },
    35: { career: "晉升有得", wealth: "收益可期", love: "關係升溫" },
    15: { career: "謙遜則吉", wealth: "穩健理財", love: "以退為進" },
    61: { career: "合夥得吉", wealth: "誠信生財", love: "誠意相待" },
  };

  const CONTEXT_LABEL = { career: "事業", wealth: "財運", love: "感情", neutral: "" };

  let summariesData = null;
  let palaceData = null;

  function loadSummaries() {
    if (summariesData) return Promise.resolve(summariesData);
    return fetch("data/iching/hexagram-summaries.json")
      .then((r) => r.json())
      .then((d) => {
        summariesData = d;
        return d;
      });
  }

  function loadPalace() {
    if (palaceData) return Promise.resolve(palaceData);
    return fetch("data/iching/hexagram-palace.json")
      .then((r) => r.json())
      .then((d) => {
        palaceData = d;
        return d;
      });
  }

  function getSummary(hexagramIndex) {
    const s = summariesData?.summaries?.[String(hexagramIndex)];
    return s || { summary: "", character: "" };
  }

  function getWuxingTrait(wuxing) {
    return WUXING_TRAIT[wuxing] || "";
  }

  /**
   * 本卦大局解釋：現狀的整體格局與方向
   * @param {number} primaryIndex - 本卦 King Wen 序
   * @param {string} primaryName - 本卦名
   * @param {string} wuxing - 卦宮五行
   * @param {string} [context] - 情境：career | wealth | love
   */
  function getPrimaryInterpretation(primaryIndex, primaryName, wuxing, context) {
    const s = getSummary(primaryIndex);
    const trait = getWuxingTrait(wuxing);
    const ctxLabel = context && context !== "neutral" && CONTEXT_LABEL[context] ? CONTEXT_LABEL[context] : "";
    const override = context && context !== "neutral" && CONTEXT_CHARACTER[String(primaryIndex)] && CONTEXT_CHARACTER[String(primaryIndex)][context];
    const character = override || s.character;
    let text = "【" + (primaryName || "—") + "】代表你問事當下的整體格局。";
    if (ctxLabel) text = "【" + ctxLabel + "】" + text;
    if (s.summary) {
      text += "卦辭含義：" + s.summary;
    }
    if (character) {
      text += "大局指向「" + character + "」。";
    }
    if (trait && wuxing && !override) {
      text += "卦宮五行屬" + wuxing + "，需留意" + trait + "的影響。";
    }
    return text;
  }

  /**
   * 互卦解釋：隱藏的過程與內在轉向（第 3–4 月/年轉型期）
   * @param {number} mutualIndex - 互卦 King Wen 序
   * @param {string} mutualName - 互卦名（如「未濟」）
   * @param {string} wuxing - 互卦卦宮五行
   * @param {string} [context] - 情境：career | wealth | love
   * @param {string} [timePeriod] - 6months | 1year | 6years
   */
  function getMutualInterpretation(mutualIndex, mutualName, wuxing, context, timePeriod) {
    const s = getSummary(mutualIndex);
    const trait = getWuxingTrait(wuxing);
    const ctxLabel = context && context !== "neutral" && CONTEXT_LABEL[context] ? CONTEXT_LABEL[context] : "";
    const override = context && context !== "neutral" && CONTEXT_CHARACTER[String(mutualIndex)] && CONTEXT_CHARACTER[String(mutualIndex)][context];
    const periodStr = timePeriod === "stages" ? "「多變動」與「戒慎恐懼」階段" : (timePeriod === "6years" ? "第 3–4 年" : (timePeriod === "1year" ? "6月、8月" : "第 3–4 月"));
    let text = "【" + (mutualName || "—") + "】代表中間的轉折，是你從現狀走向結果的「內在邏輯」。";
    if (ctxLabel) text = "【" + ctxLabel + "】" + text;
    if (s.summary) {
      text += "卦辭含義為：" + s.summary;
    }
    if (override) {
      text += periodStr + "轉型期宜把握「" + override + "」。";
    } else {
      text += "這提醒你在" + periodStr + "的轉型期，需注意" + (trait ? trait + "的影響。" : "過程中的隱藏變數。");
    }
    return text;
  }

  /**
   * 變卦解釋：最終的趨向與結果（第 6 月/年後定調）
   * @param {number} transformedIndex - 變卦 King Wen 序
   * @param {string} transformedName - 變卦名（如「謙」）
   * @param {string} wuxing - 變卦卦宮五行
   * @param {string} [context] - 情境：career | wealth | love
   * @param {string} [timePeriod] - 6months | 1year | 6years
   */
  function getTransformedInterpretation(transformedIndex, transformedName, wuxing, context, timePeriod) {
    const s = getSummary(transformedIndex);
    const ctxLabel = context && context !== "neutral" && CONTEXT_LABEL[context] ? CONTEXT_LABEL[context] : "";
    const override = context && context !== "neutral" && CONTEXT_CHARACTER[String(transformedIndex)] && CONTEXT_CHARACTER[String(transformedIndex)][context];
    const character = override || s.character;
    const periodStr = timePeriod === "stages" ? null : (timePeriod === "6years" ? "第 6 年" : (timePeriod === "1year" ? "12月" : "第 6 月"));
    let text = "【" + (transformedName || "—") + "】代表最終的歸宿，是你所問之事的「終極指向」。";
    if (ctxLabel) text = "【" + ctxLabel + "】" + text;
    if (s.summary) {
      text += "卦辭含義為：" + s.summary;
    }
    if (character) {
      text += periodStr ? "這預示了事情在" + periodStr + "後的定調將是「" + character + "」。" : "這預示了事情的發展歸宿將是「" + character + "」。";
    }
    return text;
  }

  const api = {
    loadSummaries,
    loadPalace,
    getSummary,
    getPrimaryInterpretation,
    getMutualInterpretation,
    getTransformedInterpretation,
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  } else {
    global.DivinationInterpretation = api;
  }
})(typeof window !== "undefined" ? window : globalThis);
