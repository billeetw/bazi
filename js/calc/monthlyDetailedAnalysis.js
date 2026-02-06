/* calc/monthlyDetailedAnalysis.js
 * 流月詳細解釋模組
 * 整合五行、紫微和大型事件分析，生成「適合做什麼、不適合做什麼」的詳細建議
 * 依賴: calc/constants.js, calc/helpers.js, calc/healthAnalysis.js, calc/fourTransformations.js
 */

(function () {
  "use strict";

  // 檢查依賴
  if (typeof window === "undefined" || !window.CalcConstants) {
    throw new Error("calc/monthlyDetailedAnalysis.js requires calc/constants.js to be loaded first");
  }
  if (typeof window === "undefined" || !window.CalcHelpers) {
    throw new Error("calc/monthlyDetailedAnalysis.js requires calc/helpers.js to be loaded first");
  }

  // 從 constants.js 解構需要的常數
  const {
    PALACE_DEFAULT,
  } = window.CalcConstants;

  // 大型事件類別定義
  const EVENT_CATEGORIES = {
    INVESTMENT: "投資理財",
    CAREER: "謀職事業",
    HEALTH: "健康養生",
    FAMILY: "家庭關係",
    EMOTION: "情緒管理",
    BUSINESS: "事業發展"
  };

  // 宮位與大型事件的對應關係
  const PALACE_EVENT_MAP = {
    "命宮": [EVENT_CATEGORIES.EMOTION, EVENT_CATEGORIES.CAREER],
    "兄弟": [EVENT_CATEGORIES.FAMILY, EVENT_CATEGORIES.EMOTION],
    "夫妻": [EVENT_CATEGORIES.FAMILY, EVENT_CATEGORIES.EMOTION],
    "子女": [EVENT_CATEGORIES.FAMILY, EVENT_CATEGORIES.HEALTH],
    "財帛": [EVENT_CATEGORIES.INVESTMENT, EVENT_CATEGORIES.BUSINESS],
    "疾厄": [EVENT_CATEGORIES.HEALTH],
    "遷移": [EVENT_CATEGORIES.CAREER, EVENT_CATEGORIES.BUSINESS],
    "僕役": [EVENT_CATEGORIES.CAREER, EVENT_CATEGORIES.BUSINESS],
    "官祿": [EVENT_CATEGORIES.CAREER, EVENT_CATEGORIES.BUSINESS],
    "田宅": [EVENT_CATEGORIES.INVESTMENT, EVENT_CATEGORIES.FAMILY],
    "福德": [EVENT_CATEGORIES.EMOTION, EVENT_CATEGORIES.HEALTH],
    "父母": [EVENT_CATEGORIES.FAMILY, EVENT_CATEGORIES.HEALTH]
  };

  // 五行與大型事件的對應關係
  const ELEMENT_EVENT_MAP = {
    "木": {
      suitable: [EVENT_CATEGORIES.CAREER, EVENT_CATEGORIES.BUSINESS, EVENT_CATEGORIES.INVESTMENT],
      unsuitable: [EVENT_CATEGORIES.HEALTH, EVENT_CATEGORIES.EMOTION]
    },
    "火": {
      suitable: [EVENT_CATEGORIES.CAREER, EVENT_CATEGORIES.BUSINESS],
      unsuitable: [EVENT_CATEGORIES.HEALTH, EVENT_CATEGORIES.EMOTION, EVENT_CATEGORIES.FAMILY]
    },
    "土": {
      suitable: [EVENT_CATEGORIES.INVESTMENT, EVENT_CATEGORIES.FAMILY],
      unsuitable: [EVENT_CATEGORIES.CAREER, EVENT_CATEGORIES.BUSINESS]
    },
    "金": {
      suitable: [EVENT_CATEGORIES.INVESTMENT, EVENT_CATEGORIES.CAREER],
      unsuitable: [EVENT_CATEGORIES.HEALTH, EVENT_CATEGORIES.EMOTION]
    },
    "水": {
      suitable: [EVENT_CATEGORIES.INVESTMENT, EVENT_CATEGORIES.EMOTION],
      unsuitable: [EVENT_CATEGORIES.CAREER, EVENT_CATEGORIES.BUSINESS, EVENT_CATEGORIES.HEALTH]
    }
  };

  // 事件類別的具體建議模板
  const EVENT_ADVICE_TEMPLATES = {
    [EVENT_CATEGORIES.INVESTMENT]: {
      suitable: {
        high: "適合進行重大投資決策，可考慮擴大投資規模或啟動新項目",
        medium: "適合穩健投資，可進行資產配置調整",
        low: "適合保守理財，以儲蓄和低風險產品為主"
      },
      unsuitable: {
        high: "不適合高風險投資，避免大額資金操作",
        medium: "不適合激進投資策略，建議觀望",
        low: "不適合任何投資活動，以保本為優先"
      }
    },
    [EVENT_CATEGORIES.CAREER]: {
      suitable: {
        high: "適合謀職轉職，可積極投遞履歷或啟動創業計畫",
        medium: "適合職場發展，可爭取晉升或轉換跑道",
        low: "適合穩定現職，以累積經驗為主"
      },
      unsuitable: {
        high: "不適合變動工作，避免衝動離職或轉職",
        medium: "不適合重大職場決策，建議維持現狀",
        low: "不適合任何職場變動，以穩定為優先"
      }
    },
    [EVENT_CATEGORIES.HEALTH]: {
      suitable: {
        high: "適合進行健康檢查和養生計畫，可啟動運動或飲食調整",
        medium: "適合維持健康習慣，注意作息規律",
        low: "適合休息調養，避免過度勞累"
      },
      unsuitable: {
        high: "不適合劇烈運動或過度勞累，需特別注意身體狀況",
        medium: "不適合高強度活動，建議適度休息",
        low: "不適合任何體力活動，以靜養為主"
      }
    },
    [EVENT_CATEGORIES.FAMILY]: {
      suitable: {
        high: "適合處理家庭事務，可進行重要家庭決策或聚會",
        medium: "適合家庭溝通，可安排家庭活動",
        low: "適合維持家庭和諧，以穩定關係為主"
      },
      unsuitable: {
        high: "不適合重大家庭決策，避免家庭衝突",
        medium: "不適合處理複雜家庭事務，建議延後",
        low: "不適合任何家庭變動，以維持現狀為優先"
      }
    },
    [EVENT_CATEGORIES.EMOTION]: {
      suitable: {
        high: "適合情緒表達和溝通，可進行心理諮詢或情緒管理",
        medium: "適合情緒調節，可進行放鬆活動",
        low: "適合情緒穩定，以內省為主"
      },
      unsuitable: {
        high: "不適合重大情緒決策，避免衝動行為",
        medium: "不適合處理複雜情緒問題，建議尋求支持",
        low: "不適合任何情緒波動，以平靜為優先"
      }
    },
    [EVENT_CATEGORIES.BUSINESS]: {
      suitable: {
        high: "適合事業擴展，可啟動新業務或擴大規模",
        medium: "適合事業發展，可進行業務調整或合作",
        low: "適合穩定經營，以維持現狀為主"
      },
      unsuitable: {
        high: "不適合重大業務決策，避免擴張或投資",
        medium: "不適合業務變動，建議保守經營",
        low: "不適合任何業務活動，以守成為優先"
      }
    }
  };

  /**
   * 生成流月詳細解釋
   * @param {Object} params 參數
   * @param {number} params.monthNum 月份編號（1-12）
   * @param {Object} params.monthData 流月數據（包含 riskScore, reasonTags 等）
   * @param {Object} params.ziweiPalaceMetadata 紫微宮位元數據
   * @param {Object} params.wuxingData 五行數據
   * @param {Object} params.overlapAnalysis 疊宮分析數據
   * @param {Object} params.fourTransformations 四化系統數據
   * @param {Object} params.monthlyHealthRisk 月度健康風險數據
   * @returns {Object} 詳細解釋結果
   */
  function generateMonthlyDetailedAnalysis(params) {
    const {
      monthNum,
      monthData,
      ziweiPalaceMetadata = null,
      wuxingData = null,
      overlapAnalysis = null,
      fourTransformations = null,
      monthlyHealthRisk = null
    } = params;

    if (!monthNum || monthNum < 1 || monthNum > 12) {
      return {
        error: "無效的月份編號"
      };
    }

    // 1. 獲取流月對應的紫微宮位
    const palaceMapping = [
      "命宮", "兄弟", "夫妻", "子女", "財帛", "疾厄",
      "遷移", "僕役", "官祿", "田宅", "福德", "父母"
    ];
    const currentPalace = palaceMapping[monthNum - 1];

    // 2. 獲取該宮位的元數據
    const palaceMetadata = ziweiPalaceMetadata?.[currentPalace] || null;
    const palaceInternalLevel = palaceMetadata?.internalLevel || 3;
    const palaceStars = palaceMetadata?.stars || null;

    // 3. 獲取該月的健康風險
    const monthHealthRisk = monthlyHealthRisk?.find(m => m.month === monthNum) || null;
    const healthRiskLevel = monthHealthRisk?.riskLevel || "normal";

    // 4. 獲取該月的五行狀態
    const monthElementWeights = getMonthElementWeights(monthNum);
    const strongestElement = getStrongestElement(wuxingData, monthElementWeights);
    const weakestElement = getWeakestElement(wuxingData, monthElementWeights);

    // 5. 獲取該宮位的四化情況
    const palaceTransformations = overlapAnalysis?.palaceMap?.get?.(currentPalace) || null;
    const hasCriticalRisk = palaceTransformations?.riskLevel === "critical";
    const hasMaxOpportunity = palaceTransformations?.opportunityLevel === "max";

    // 6. 計算能量等級（基於風險分數）
    const riskScore = Number(monthData?.riskScore) || 50;
    const energyLevel = calculateEnergyLevel(riskScore, palaceInternalLevel, hasCriticalRisk, hasMaxOpportunity);

    // 7. 生成適合和不適合的事件建議
    const suitableEvents = generateSuitableEvents({
      currentPalace,
      palaceInternalLevel,
      strongestElement,
      energyLevel,
      hasMaxOpportunity,
      healthRiskLevel
    });

    const unsuitableEvents = generateUnsuitableEvents({
      currentPalace,
      palaceInternalLevel,
      weakestElement,
      energyLevel,
      hasCriticalRisk,
      healthRiskLevel
    });

    // 8. 生成綜合建議
    const comprehensiveAdvice = generateComprehensiveAdvice({
      currentPalace,
      palaceStars,
      energyLevel,
      hasCriticalRisk,
      hasMaxOpportunity,
      healthRiskLevel,
      strongestElement,
      weakestElement
    });

    return {
      monthNum,
      monthName: `${monthNum}月`,
      palace: currentPalace,
      energyLevel,
      riskScore,
      healthRiskLevel,
      suitableEvents,
      unsuitableEvents,
      comprehensiveAdvice,
      palaceAnalysis: {
        internalLevel: palaceInternalLevel,
        stars: palaceStars,
        hasCriticalRisk,
        hasMaxOpportunity
      },
      elementAnalysis: {
        strongestElement,
        weakestElement,
        monthElementWeights
      }
    };
  }

  /**
   * 獲取月份的五行加權
   */
  function getMonthElementWeights(monthNum) {
    const MONTH_ELEMENT_WEIGHTS = {
      1: { "水": 1.1, "木": 0.95 },
      2: { "木": 1.1, "火": 0.95 },
      3: { "木": 1.1, "火": 0.95 },
      4: { "火": 1.1, "土": 0.95 },
      5: { "火": 1.1, "土": 0.95 },
      6: { "土": 1.1, "金": 0.95 },
      7: { "土": 1.1, "金": 0.95 },
      8: { "金": 1.1, "水": 0.95 },
      9: { "金": 1.1, "水": 0.95 },
      10: { "金": 1.1, "水": 0.95 },
      11: { "水": 1.1, "木": 0.95 },
      12: { "水": 1.1, "木": 0.95 }
    };
    return MONTH_ELEMENT_WEIGHTS[monthNum] || {};
  }

  /**
   * 獲取最強五行（考慮流月加權）
   */
  function getStrongestElement(wuxingData, monthElementWeights) {
    if (!wuxingData || !wuxingData.raw) return null;
    
    const elements = ["木", "火", "土", "金", "水"];
    let maxScore = -Infinity;
    let strongest = null;

    elements.forEach(element => {
      const baseScore = wuxingData.raw[element] || 0;
      const multiplier = monthElementWeights[element] || 1.0;
      const adjustedScore = baseScore * multiplier;
      
      if (adjustedScore > maxScore) {
        maxScore = adjustedScore;
        strongest = element;
      }
    });

    return strongest;
  }

  /**
   * 獲取最弱五行（考慮流月加權）
   */
  function getWeakestElement(wuxingData, monthElementWeights) {
    if (!wuxingData || !wuxingData.raw) return null;
    
    const elements = ["木", "火", "土", "金", "水"];
    let minScore = Infinity;
    let weakest = null;

    elements.forEach(element => {
      const baseScore = wuxingData.raw[element] || 0;
      const multiplier = monthElementWeights[element] || 1.0;
      const adjustedScore = baseScore * multiplier;
      
      if (adjustedScore < minScore) {
        minScore = adjustedScore;
        weakest = element;
      }
    });

    return weakest;
  }

  /**
   * 計算能量等級
   */
  function calculateEnergyLevel(riskScore, palaceInternalLevel, hasCriticalRisk, hasMaxOpportunity) {
    // 基礎能量：風險越低，能量越高
    let baseEnergy = 100 - riskScore;
    
    // 宮位等級調整（等級越高，能量加成越多）
    const palaceBoost = (palaceInternalLevel - 3) * 10;
    
    // 疊宮調整
    if (hasCriticalRisk) {
      baseEnergy -= 20; // 有化忌疊加，能量降低
    }
    if (hasMaxOpportunity) {
      baseEnergy += 20; // 有化祿疊加，能量提升
    }
    
    // 限制範圍
    baseEnergy = Math.max(0, Math.min(100, baseEnergy));
    
    // 轉換為等級（high/medium/low）
    if (baseEnergy >= 70) return "high";
    if (baseEnergy >= 40) return "medium";
    return "low";
  }

  /**
   * 生成適合的事件建議
   */
  function generateSuitableEvents(params) {
    const {
      currentPalace,
      palaceInternalLevel,
      strongestElement,
      energyLevel,
      hasMaxOpportunity,
      healthRiskLevel
    } = params;

    const events = [];
    
    // 基於宮位的事件
    const palaceEvents = PALACE_EVENT_MAP[currentPalace] || [];
    palaceEvents.forEach(eventCategory => {
      if (healthRiskLevel === "critical" && eventCategory === EVENT_CATEGORIES.HEALTH) {
        // 健康風險高時，不建議健康相關活動
        return;
      }
      
      const template = EVENT_ADVICE_TEMPLATES[eventCategory]?.suitable?.[energyLevel];
      if (template) {
        events.push({
          category: eventCategory,
          advice: template,
          reason: `流月在${currentPalace}，此宮位能量${palaceInternalLevel >= 4 ? "強" : "中等"}`
        });
      }
    });

    // 基於五行的事件
    if (strongestElement && ELEMENT_EVENT_MAP[strongestElement]) {
      const elementEvents = ELEMENT_EVENT_MAP[strongestElement].suitable || [];
      elementEvents.forEach(eventCategory => {
        // 避免重複
        if (events.find(e => e.category === eventCategory)) return;
        
        const template = EVENT_ADVICE_TEMPLATES[eventCategory]?.suitable?.[energyLevel];
        if (template) {
          events.push({
            category: eventCategory,
            advice: template,
            reason: `本月${strongestElement}氣旺盛，適合${eventCategory}相關活動`
          });
        }
      });
    }

    // 如果有化祿疊加，增加機會類事件
    if (hasMaxOpportunity) {
      [EVENT_CATEGORIES.INVESTMENT, EVENT_CATEGORIES.BUSINESS].forEach(eventCategory => {
        if (!events.find(e => e.category === eventCategory)) {
          const template = EVENT_ADVICE_TEMPLATES[eventCategory]?.suitable?.[energyLevel];
          if (template) {
            events.push({
              category: eventCategory,
              advice: template + "（本月有化祿疊加，機會難得）",
              reason: `${currentPalace}有化祿疊加，能量通道完全開啟`
            });
          }
        }
      });
    }

    return events;
  }

  /**
   * 生成不適合的事件建議
   */
  function generateUnsuitableEvents(params) {
    const {
      currentPalace,
      palaceInternalLevel,
      weakestElement,
      energyLevel,
      hasCriticalRisk,
      healthRiskLevel
    } = params;

    const events = [];
    
    // 基於宮位的事件（反向）
    const palaceEvents = PALACE_EVENT_MAP[currentPalace] || [];
    palaceEvents.forEach(eventCategory => {
      if (healthRiskLevel === "critical" && eventCategory === EVENT_CATEGORIES.HEALTH) {
        // 健康風險高時，特別不適合健康相關活動
        events.push({
          category: eventCategory,
          advice: EVENT_ADVICE_TEMPLATES[eventCategory]?.unsuitable?.[energyLevel] || "不適合任何健康相關活動",
          reason: `本月健康風險${healthRiskLevel === "critical" ? "極高" : "較高"}，需特別注意`
        });
        return;
      }
      
      // 如果宮位能量低，該宮位相關事件不適合
      if (palaceInternalLevel <= 2) {
        const template = EVENT_ADVICE_TEMPLATES[eventCategory]?.unsuitable?.[energyLevel];
        if (template) {
          events.push({
            category: eventCategory,
            advice: template,
            reason: `流月在${currentPalace}，此宮位能量較弱`
          });
        }
      }
    });

    // 基於五行的事件
    if (weakestElement && ELEMENT_EVENT_MAP[weakestElement]) {
      const elementEvents = ELEMENT_EVENT_MAP[weakestElement].unsuitable || [];
      elementEvents.forEach(eventCategory => {
        // 避免重複
        if (events.find(e => e.category === eventCategory)) return;
        
        const template = EVENT_ADVICE_TEMPLATES[eventCategory]?.unsuitable?.[energyLevel];
        if (template) {
          events.push({
            category: eventCategory,
            advice: template,
            reason: `本月${weakestElement}氣偏弱，不適合${eventCategory}相關活動`
          });
        }
      });
    }

    // 如果有化忌疊加，增加風險類事件
    if (hasCriticalRisk) {
      [EVENT_CATEGORIES.INVESTMENT, EVENT_CATEGORIES.BUSINESS].forEach(eventCategory => {
        if (!events.find(e => e.category === eventCategory)) {
          const template = EVENT_ADVICE_TEMPLATES[eventCategory]?.unsuitable?.[energyLevel];
          if (template) {
            events.push({
              category: eventCategory,
              advice: template + "（本月有化忌疊加，風險極高）",
              reason: `${currentPalace}有化忌疊加，需特別謹慎`
            });
          }
        }
      });
    }

    return events;
  }

  /**
   * 生成綜合建議
   */
  function generateComprehensiveAdvice(params) {
    const {
      currentPalace,
      palaceStars,
      energyLevel,
      hasCriticalRisk,
      hasMaxOpportunity,
      healthRiskLevel,
      strongestElement,
      weakestElement
    } = params;

    const advice = [];

    // 能量等級建議
    if (energyLevel === "high") {
      advice.push("本月能量通道完全開啟，適合執行重大決策和啟動重要計畫。");
    } else if (energyLevel === "medium") {
      advice.push("本月能量平穩，適合穩步推進計畫和維持現狀。");
    } else {
      advice.push("本月能量較低，建議以守成為主，避免重大變動。");
    }

    // 疊宮建議
    if (hasCriticalRisk) {
      advice.push(`⚠️ ${currentPalace}有化忌疊加，需特別注意相關領域的風險，避免重大決策。`);
    }
    if (hasMaxOpportunity) {
      advice.push(`💰 ${currentPalace}有化祿疊加，這是難得的機會，可把握時機推進相關計畫。`);
    }

    // 健康建議
    if (healthRiskLevel === "critical") {
      advice.push("⚠️ 本月健康風險極高，建議減少工作量，注意休息和飲食，必要時進行健康檢查。");
    } else if (healthRiskLevel === "warning") {
      advice.push("⚠️ 本月健康風險較高，建議適度調整作息，避免過度勞累。");
    }

    // 五行建議
    if (strongestElement && weakestElement) {
      advice.push(`本月${strongestElement}氣旺盛，${weakestElement}氣偏弱，建議加強${weakestElement}相關的調養和活動。`);
    }

    // 宮位星曜建議
    if (palaceStars && palaceStars.length > 0) {
      const mainStar = palaceStars[0];
      if (mainStar) {
        advice.push(`流月在${currentPalace}，主星為${mainStar}，此星曜的特質會在本月特別明顯。`);
      }
    }

    return advice.join(" ");
  }

  // ====== 導出 ======

  if (typeof window !== "undefined") {
    window.MonthlyDetailedAnalysis = {
      generateMonthlyDetailedAnalysis,
      EVENT_CATEGORIES,
      PALACE_EVENT_MAP,
      ELEMENT_EVENT_MAP
    };
  } else if (typeof globalThis !== "undefined") {
    globalThis.MonthlyDetailedAnalysis = {
      generateMonthlyDetailedAnalysis,
      EVENT_CATEGORIES,
      PALACE_EVENT_MAP,
      ELEMENT_EVENT_MAP
    };
  }
})();
