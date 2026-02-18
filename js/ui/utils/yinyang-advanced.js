/* yinyang-advanced.js
 * 能量結構分析：結構定位、年度主軸翻譯、交叉洞察
 * 導出到 window.UiUtils.YinyangAdvanced
 */

(function () {
  "use strict";

  /** 依陽比例分型（4 型） */
  const YINYANG_LIBRARY = {
    yangStrong: { label: "陽強型", baseText: "陽性能量主導，行動與推進力強。今年適合主動出擊，但要注意節奏控管，避免過度消耗。" },
    yangModerate: { label: "陽偏旺型", baseText: "陽略多於陰，整體節奏偏快。今年適合穩步推進，在擴張與收斂之間取得平衡。" },
    balanced: { label: "平衡型", baseText: "陰陽比例接近，結構穩定。今年適合鞏固既有成果，按既有節奏推進。" },
    yinStrong: { label: "陰強型", baseText: "陰性能量主導，思考與收斂較強。今年適合內部強化與策略布局，不宜外放擴張。" },
  };

  /** 十神一句翻譯（年度主軸） */
  const SHISHEN_LIBRARY = {
    比肩: "今年重點在自我定位與獨立承擔。",
    劫財: "今年重點在資源流動與配置。",
    食神: "今年重點在創意輸出與品牌建立。",
    傷官: "今年重點在挑戰體制與突破框架。",
    正財: "今年重點在穩定收入與資產累積。",
    偏財: "今年重點在靈活應變與機會篩選。",
    正官: "今年重點在責任承擔與制度建立。",
    七殺: "今年重點在壓力轉化與抗壓成長。",
    正印: "今年重點在學習進修與基礎強化。",
    偏印: "今年重點在策略思考與內在轉化。",
  };

  /** 10 十神 × 4 陰陽型 交叉句庫 */
  const CROSS_LIBRARY = {
    比肩: {
      yangStrong: "你本來就強勢，今年更容易單打獨鬥。最大的風險不是輸，而是把所有責任都扛在自己身上。",
      yangModerate: "你會傾向自己處理問題。今年關鍵不是證明能力，而是選擇合作對象。",
      balanced: "今年適合穩定自我定位。別急著擴張，先鞏固核心能力。",
      yinStrong: "你本來低調，今年會被推到前線。記得：獨立不等於孤立。",
    },
    劫財: {
      yangStrong: "你本來就衝，今年資源流動劇烈。別讓速度超過結構。",
      yangModerate: "機會變多，但消耗也增加。先守核心，再談擴張。",
      balanced: "今年重點在資源配置，而不是資源數量。",
      yinStrong: "你會對變動感到不安。今年要學會主動調整，而不是被動承受。",
    },
    食神: {
      yangStrong: "適合大量輸出與曝光。但若沒有節奏控管，會過度消耗。",
      yangModerate: "創意穩定發揮。重點在持續，而非爆發。",
      balanced: "輸出與內在同步。適合建立長期品牌或作品。",
      yinStrong: "創意在內部醞釀。今年更適合深度創作，而非快速曝光。",
    },
    傷官: {
      yangStrong: "你會想推翻舊規則。今年容易與權威正面衝突。",
      yangModerate: "改革慾望強，但要控制節奏。",
      balanced: "挑戰體制，但保持理性。",
      yinStrong: "內心有突破衝動。今年關鍵是策略，而非對抗。",
    },
    正財: {
      yangStrong: "賺錢機會明顯，但過度冒進會破壞穩定。",
      yangModerate: "適合穩定收入模式。重質不重量。",
      balanced: "財務節奏穩定。適合累積長期資產。",
      yinStrong: "今年適合保守經營，而非高風險投資。",
    },
    偏財: {
      yangStrong: "機會多、誘惑也多。別因興奮失去判斷。",
      yangModerate: "短期獲利空間存在，但要懂止盈。",
      balanced: "靈活應變會帶來機會。",
      yinStrong: "觀望有助避開風險。今年重點是篩選，而非衝刺。",
    },
    正官: {
      yangStrong: "責任加重，但你可能會抗拒規則。",
      yangModerate: "壓力可控。今年適合建立制度。",
      balanced: "穩定承擔責任，會帶來長期回報。",
      yinStrong: "規則壓力會放大。適合內部強化，而非對抗體制。",
    },
    七殺: {
      yangStrong: "壓力來得猛烈。別硬碰硬。",
      yangModerate: "挑戰存在，但可轉為突破。",
      balanced: "適度壓力會促進成長。",
      yinStrong: "被逼著成長。今年核心是抗壓能力。",
    },
    正印: {
      yangStrong: "你會想照顧別人，但別忽略自己。",
      yangModerate: "適合學習與進修。",
      balanced: "穩定修補基礎。",
      yinStrong: "今年是內在強化年，不宜外放擴張。",
    },
    偏印: {
      yangStrong: "想法爆發，但容易焦慮。",
      yangModerate: "策略調整頻繁。",
      balanced: "思考深入，適合研究。",
      yinStrong: "內在轉化期。先想清楚再行動。",
    },
  };

  /**
   * 依陽比例判定結構型
   * @param {number} yangRatio - 0-100
   * @returns {"yangStrong"|"yangModerate"|"balanced"|"yinStrong"}
   */
  function getStructureType(yangRatio) {
    const y = Number(yangRatio) || 50;
    if (y >= 62) return "yangStrong";
    if (y >= 52) return "yangModerate";
    if (y >= 42) return "balanced";
    return "yinStrong";
  }

  /**
   * 建立進階分析輸出
   * @param {number} yangRatio - 陽比例 0-100
   * @param {string} mainShishen - 十神主軸（比肩、劫財、食神、傷官、正財、偏財、正官、七殺、正印、偏印）
   * @returns {{ structureType, structureLabel, baseText, mainShishen, mainShishenText, crossInsight }}
   */
  function buildAdvancedAnalysis(yangRatio, mainShishen) {
    const structureType = getStructureType(yangRatio);
    const yinyang = YINYANG_LIBRARY[structureType];
    const shishen = String(mainShishen || "").trim() || "—";
    const cross = CROSS_LIBRARY[shishen];
    const mainShishenText = SHISHEN_LIBRARY[shishen] || "（十神數據暫不可用）";
    const crossInsight = cross && cross[structureType] ? cross[structureType] : "（交叉洞察暫不可用）";

    return {
      structureType,
      structureLabel: yinyang?.label || "—",
      baseText: yinyang?.baseText || "",
      mainShishen: shishen,
      mainShishenText,
      crossInsight,
    };
  }

  if (!window.UiUtils) window.UiUtils = {};
  window.UiUtils.YinyangAdvanced = {
    YINYANG_LIBRARY,
    SHISHEN_LIBRARY,
    CROSS_LIBRARY,
    getStructureType,
    buildAdvancedAnalysis,
  };
})();
