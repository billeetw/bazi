/* calc/ziweiPipeline.js
 * 紫微斗數評分 Pipeline 模組
 * 從 calc.js 中提取，用於模組化架構
 * 依賴 calc/constants.js 和 calc/helpers.js
 */

(function () {
  "use strict";

  // 檢查依賴
  if (typeof window === "undefined" || !window.CalcConstants) {
    throw new Error("calc/ziweiPipeline.js requires calc/constants.js to be loaded first");
  }
  if (typeof window === "undefined" || !window.CalcHelpers) {
    throw new Error("calc/ziweiPipeline.js requires calc/helpers.js to be loaded first");
  }

  // 從 constants.js 解構需要的常數
  const {
    PALACE_DEFAULT,
    PALACE_NAME_TO_ID_MAP,
  } = window.CalcConstants;

  // 從 helpers.js 解構需要的純函數
  const {
    getStarsForPalace,
    toTraditionalStarName,
    getStarWeightConfig,
    getStarBrightness,
    computeRelatedPalaces,
  } = window.CalcHelpers;

  // ====== Pipeline 架構：紫微評分六階段 ======
  
  /**
   * Stage 1: Base Score（基礎分數）
   * 計算星曜的基礎權重分數
   * @param {Object} context 評分上下文
   * @param {Object} weightsData 權重資料
   * @returns {Object} 更新後的上下文
   */
  function stageBaseScore(context, weightsData) {
    const { stars } = context;
    
    stars.forEach(starCtx => {
      const { config } = starCtx;
      if (!config) {
        // 預設值處理
        starCtx.baseScore = starCtx.category === 'main' ? 5 : 1;
        starCtx.correctionFactor = 1.0;
        return;
      }
      
      // 基礎分數 = baseScore
      starCtx.baseScore = config.baseScore || 0;
      starCtx.correctionFactor = 1.0; // 初始修正係數
    });

    // 計算主星和輔星的總基礎分數
    context.baseScore = stars
      .filter(s => s.category === 'main' || s.category === 'assistant')
      .reduce((sum, s) => sum + s.baseScore, 0);

    return context;
  }

  /**
   * Stage 2: Brightness Multiplier（亮度乘數）
   * 根據星曜亮度狀態應用乘數
   * @param {Object} context 評分上下文
   * @param {Object} ziwei 紫微命盤資料
   * @param {string} palaceName 宮位名稱
   * @returns {Object} 更新後的上下文
   */
  function stageBrightness(context, ziwei, palaceName) {
    const { stars } = context;
    
    stars.forEach(starCtx => {
      const { name, config } = starCtx;
      if (!config) return;

      // 獲取亮度狀態
      starCtx.brightness = getStarBrightness(ziwei, name, palaceName);
      
      // 應用亮度乘數
      const brightnessMultiplier = config.brightnessMultiplier?.[starCtx.brightness] || 1.0;
      starCtx.correctionFactor *= brightnessMultiplier;
      
      // 更新基礎分數（應用亮度）
      starCtx.baseScore *= brightnessMultiplier;
    });

    // 重新計算主星和輔星的總分數
    context.baseScore = stars
      .filter(s => s.category === 'main' || s.category === 'assistant')
      .reduce((sum, s) => sum + s.baseScore, 0);

    return context;
  }

  /**
   * Stage 3: Resonance Map（宮位共鳴係數）
   * 根據星曜與宮位的共鳴度應用係數
   * @param {Object} context 評分上下文
   * @returns {Object} 更新後的上下文
   */
  function stageResonance(context) {
    const { stars, palaceId } = context;
    
    stars.forEach(starCtx => {
      const { config } = starCtx;
      if (!config) return;

      // 應用共鳴係數
      const resonance = config.resonanceMap?.[palaceId] || 1.0;
      starCtx.correctionFactor *= resonance;
      
      // 更新基礎分數（應用共鳴）
      starCtx.baseScore *= resonance;
    });

    // 重新計算主星和輔星的總分數
    context.baseScore = stars
      .filter(s => s.category === 'main' || s.category === 'assistant')
      .reduce((sum, s) => sum + s.baseScore, 0);

    return context;
  }

  /**
   * Stage 4: Element Boost（五行增益）
   * 根據五行相生相剋應用增益（預留擴展）
   * @param {Object} context 評分上下文
   * @param {Object} ziwei 紫微命盤資料
   * @returns {Object} 更新後的上下文
   */
  function stageElement(context, ziwei) {
    // 目前暫不實現五行增益，預留擴展接口
    // 未來可以根據宮位五行、星曜五行等計算增益係數
    return context;
  }

  /**
   * Stage 5: SiHua Transformation（四化增益與減損）
   * 處理化祿、化權、化科、化忌的權重調整
   * @param {Object} context 評分上下文
   * @param {Object} horoscope 小限資料
   * @param {string} palaceName 宮位名稱
   * @returns {Object} 更新後的上下文
   */
  function stageSiHua(context, horoscope, palaceName) {
    const { stars } = context;
    
    if (!horoscope || !horoscope.mutagenStars) {
      return context;
    }

    const mutagenStars = horoscope.mutagenStars;
    const sihuaWeights = { "祿": 3, "權": 2, "科": 1, "忌": -3 };
    
    // 檢查該宮位的四化星曜
    const starsInPalace = stars.map(s => s.name);
    let sihuaBoost = 0;
    let luCount = 0; // 祿存或化祿的數量（用於雙祿交會）

    ["祿", "權", "科", "忌"].forEach(hua => {
      const starName = mutagenStars[hua];
      if (starName && starsInPalace.includes(starName)) {
        sihuaBoost += sihuaWeights[hua];
        if (hua === "祿") luCount++;
      }
    });

    // 檢查祿存（如果存在）
    if (starsInPalace.includes("祿存")) {
      luCount++;
    }

    // 雙祿交會：若本宮與三方四正同時出現多個祿存或化祿，額外 +2
    // 注意：這個邏輯需要在 computePalaceBaseScore 層級處理（因為需要三方四正資訊）
    // 這裡先記錄到 metadata，後續在 finalizeStarRating 中處理
    if (luCount >= 2) {
      context.metadata = context.metadata || {};
      context.metadata.doubleLuBoost = 2;
      sihuaBoost += 2;
    }

    // 應用四化增益到修正係數
    // 注意：四化增益是絕對值，不是乘數，所以直接加到 baseScore
    context.baseScore += sihuaBoost;
    context.metadata = context.metadata || {};
    context.metadata.sihuaBoost = sihuaBoost;

    return context;
  }

  /**
   * Stage 6: Penalty & Special Rules（懲罰與特殊規則）
   * 處理神煞的特殊機制：penaltyTrigger, maxStarRating, strategicAdvice, 2026預警
   * @param {Object} context 評分上下文
   * @param {Object} weightsData 權重資料
   * @param {Object} options 選項 { horoscope, year }
   * @returns {Object} 更新後的上下文
   */
  function stagePenalty(context, weightsData, options = {}) {
    const { stars, palaceId, palaceName } = context;
    const { horoscope, year } = options;

    // 計算雜曜增壓（限制在 ±10）
    let minorBoost = 0;
    stars
      .filter(s => s.category === 'minor' || s.category === 'deity')
      .forEach(starCtx => {
        const score = starCtx.baseScore * starCtx.correctionFactor;
        minorBoost += score;
      });
    context.minorBoost = Math.max(-10, Math.min(10, minorBoost));

    // 處理神煞的特殊機制
    stars
      .filter(s => s.category === 'deity')
      .forEach(starCtx => {
        const { name, config } = starCtx;
        if (!config) return;

        // 1. penaltyTrigger（特定宮位額外懲罰）
        if (config.penaltyTrigger?.palaces?.includes(palaceId)) {
          const penalty = config.penaltyTrigger.penalty || 0;
          context.penaltyApplied = (context.penaltyApplied || 0) + penalty;
        }

        // 2. maxStarRating（星等上限鎖定）
        if (config.penaltyTrigger?.maxStarRating) {
          const trigger = config.penaltyTrigger;
          if (!trigger.palaces || trigger.palaces.includes(palaceId)) {
            const currentMax = context.maxStarRating;
            const newMax = trigger.maxStarRating;
            if (currentMax === null || newMax < currentMax) {
              context.maxStarRating = newMax;
            }
          }
        }

        // 3. strategicAdvice（戰略建議）
        if (config.strategicTag) {
          context.strategicAdvice = context.strategicAdvice || [];
          context.strategicAdvice.push(config.strategicTag);
        }

        // 4. 2026 預警機制：廉貞化忌 + 行政類神煞
        if (horoscope && year === 2026) {
          const mutagenStars = horoscope.mutagenStars || {};
          const isLianZhenJi = mutagenStars.忌 === "廉貞";
          const isAdministrativeDeity = config.strategicTag === "行政風險" || 
                                       config.id === "GuanFu" || 
                                       config.id === "ZhiBei";
          
          if (isLianZhenJi && isAdministrativeDeity && stars.some(s => s.name === "廉貞")) {
            const starScore = starCtx.baseScore * starCtx.correctionFactor;
            context.penaltyApplied = (context.penaltyApplied || 0) + Math.abs(starScore) * 2;
          }
        }

        // 5. 官符 + 化忌的星等降級
        if (config.penaltyTrigger?.withTransformation === "忌") {
          const mutagenStars = horoscope?.mutagenStars || {};
          const hasJi = stars.some(s => {
            const jiStar = mutagenStars.忌;
            return jiStar && s.name === jiStar;
          });
          if (hasJi && config.penaltyTrigger.starRatingReduction) {
            const currentMax = context.maxStarRating;
            if (currentMax === null || currentMax > 4) {
              context.maxStarRating = 4;
            }
          }
        }
      });

    return context;
  }

  /**
   * 執行完整的評分 Pipeline
   * @param {Object} ziwei 紫微命盤資料
   * @param {string} palaceName 宮位名稱（繁體）
   * @param {Object} weightsData 權重資料
   * @param {Object} options 選項 { horoscope, year }
   * @returns {Object} 評分上下文
   */
  function executePipeline(ziwei, palaceName, weightsData, options = {}) {
    const { horoscope, year } = options;
    
    // 獲取宮位星曜
    const stars = getStarsForPalace(ziwei, palaceName)
      .map(toTraditionalStarName)
      .map(starName => {
        const config = getStarWeightConfig(starName, weightsData);
        const isMainStar = config && config.baseScore >= 6 && 
                          weightsData?.mainStars?.some(s => s.id === config.id);
        const isAssistant = weightsData?.assistantStars?.some(s => s.id === config?.id);
        const isMinor = weightsData?.minorStars?.some(s => s.id === config?.id);
        const isDeity = weightsData?.deities?.some(s => s.id === config?.id);
        
        let category = 'minor';
        if (isMainStar) category = 'main';
        else if (isAssistant) category = 'assistant';
        else if (isDeity) category = 'deity';

        return {
          name: starName,
          config: config,
          category: category,
          brightness: null,
          baseScore: 0,
          correctionFactor: 1.0
        };
      });

    const palaceId = PALACE_NAME_TO_ID_MAP[palaceName] || "Self";
    
    // 初始化上下文
    let context = {
      palaceName,
      palaceId,
      stars,
      baseScore: 0,
      minorBoost: 0,
      correctionFactor: 1.0,
      strategicAdvice: [],
      maxStarRating: null,
      penaltyApplied: 0,
      metadata: {}
    };

    // 空宮處理：若當前宮位無主星，獲取對宮的主星與輔星資料
    const hasMainStar = stars.some(s => s.category === 'main');
    if (!hasMainStar) {
      const { opposite } = computeRelatedPalaces(PALACE_DEFAULT, palaceName);
      if (opposite && opposite !== palaceName) {
        const oppositeStars = getStarsForPalace(ziwei, opposite)
          .map(toTraditionalStarName)
          .map(starName => {
            const config = getStarWeightConfig(starName, weightsData);
            const isMainStar = config && config.baseScore >= 6 && 
                              weightsData?.mainStars?.some(s => s.id === config.id);
            const isAssistant = weightsData?.assistantStars?.some(s => s.id === config?.id);
            
            if (isMainStar || isAssistant) {
              return {
                name: starName,
                config: config,
                category: isMainStar ? 'main' : 'assistant',
                brightness: null,
                baseScore: 0,
                correctionFactor: 1.0
              };
            }
            return null;
          })
          .filter(s => s !== null);

        // 為對宮星曜創建臨時上下文並執行前三個階段
        let oppositeContext = {
          palaceName: opposite,
          palaceId: PALACE_NAME_TO_ID_MAP[opposite] || "Self",
          stars: oppositeStars,
          baseScore: 0,
          minorBoost: 0,
          correctionFactor: 1.0,
          strategicAdvice: [],
          maxStarRating: null,
          penaltyApplied: 0,
          metadata: {}
        };

        oppositeContext = stageBaseScore(oppositeContext, weightsData);
        oppositeContext = stageBrightness(oppositeContext, ziwei, opposite);
        oppositeContext = stageResonance(oppositeContext);

        // 對宮分數以 70% 計入當前宮位
        context.baseScore += oppositeContext.baseScore * 0.7;
      }
    }

    // 執行 Pipeline 六個階段
    context = stageBaseScore(context, weightsData);
    context = stageBrightness(context, ziwei, palaceName);
    context = stageResonance(context);
    context = stageElement(context, ziwei);
    context = stageSiHua(context, horoscope, palaceName);
    context = stagePenalty(context, weightsData, { horoscope, year });

    return context;
  }

  /**
   * 計算單一宮位的基礎星曜評分（Pipeline 重構版：使用六階段 Pipeline 架構）
   * @param {Object} ziwei 紫微命盤資料
   * @param {string} palaceName 宮位名稱（繁體）
   * @param {Object} weightsData 權重資料（可選）
   * @param {Object} options 選項 { horoscope, year } 用於神煞特殊機制
   * @returns {Object} { score: number, minorBoost: number, strategicAdvice: string[], maxStarRating: number|null, penaltyApplied: number }
   */
  function computeSinglePalaceScore(ziwei, palaceName, weightsData, options = {}) {
    // 使用 Pipeline 架構進行評分
    if (!ziwei || !ziwei.mainStars) {
      return { score: 0, minorBoost: 0, strategicAdvice: [], maxStarRating: null, penaltyApplied: 0 };
    }
    
    const stars = getStarsForPalace(ziwei, palaceName).map(toTraditionalStarName);
    if (!stars.length) {
      return { score: 0, minorBoost: 0, strategicAdvice: [], maxStarRating: null, penaltyApplied: 0 };
    }

    // 執行 Pipeline
    const context = executePipeline(ziwei, palaceName, weightsData, options);

    // 轉換為舊格式（向後兼容）
    const totalScore = context.baseScore + context.minorBoost - (context.penaltyApplied || 0);

    return {
      score: Math.max(0, totalScore),
      minorBoost: context.minorBoost || 0,
      strategicAdvice: context.strategicAdvice || [],
      maxStarRating: context.maxStarRating,
      penaltyApplied: context.penaltyApplied || 0
    };
  }

  /**
   * L7: 主觀頻率修正（Subjective Boost）
   * 根據使用者的個人資料，判斷當前計算的宮位是否與其該年度的「小限宮位」重疊
   * 模擬「個人化體感區分度」：小限宮位會產生更強烈的波動感
   * 
   * @param {Object} spatialScores 經過 L4 空間聚合後的分數物件
   * @param {string} xiaoXianPalace 小限宮位名稱（繁體，如 "官祿"）
   * @returns {Object} 包含 subjectiveAdjustedScore 和 isSubjectiveFocus 的結果物件
   */
  function stageSubjectiveBoost(spatialScores, xiaoXianPalace) {
    if (!spatialScores || typeof spatialScores !== 'object' || !xiaoXianPalace) {
      return spatialScores || {};
    }

    const subjectiveAdjustedScores = {};
    const SUBJECTIVE_BOOST_COEFFICIENT = 1.5; // 增益係數 α = 1.5

    // 遍歷所有宮位，檢查是否為小限宮位
    Object.keys(spatialScores).forEach((palaceName) => {
      const spatialData = spatialScores[palaceName];
      if (!spatialData) {
        subjectiveAdjustedScores[palaceName] = spatialData;
        return;
      }

      // 判定邏輯：IF currentPalace.id == user.xiaoXianPalace
      const isSubjectiveFocus = palaceName === xiaoXianPalace;
      
      if (isSubjectiveFocus) {
        // 該宮位的 finalScore 乘以 1.5 倍（增益係數 α = 1.5）
        const originalScore = spatialData.spatialAdjustedScore || spatialData.score || 0;
        const boostedScore = originalScore * SUBJECTIVE_BOOST_COEFFICIENT;
        
        // 確保分數不超過 100（因為已經標準化過）
        const cappedScore = Math.min(100, boostedScore);

        subjectiveAdjustedScores[palaceName] = {
          ...spatialData,
          spatialAdjustedScore: Math.round(cappedScore * 10) / 10,
          subjectiveAdjustedScore: Math.round(cappedScore * 10) / 10,
          isSubjectiveFocus: true,
          // 保留原始分數供參考
          originalSpatialScore: originalScore,
          boostApplied: SUBJECTIVE_BOOST_COEFFICIENT
        };
      } else {
        // ELSE 保持原分數
        subjectiveAdjustedScores[palaceName] = {
          ...spatialData,
          isSubjectiveFocus: false
        };
      }
    });

    return subjectiveAdjustedScores;
  }

  /**
   * L4: 空間連動（三方四正聚合）
   * 在計算完所有 12 宮位的基礎分後，統一應用三方四正加權
   * 模擬「資源協作與環境牽制」的空間效應
   * 
   * @param {Object} baseScores 所有宮位的基礎分數物件 { "命宮": { score, ... }, ... }
   * @param {Array<string>} palaceOrder 宮位順序陣列（預設為 PALACE_DEFAULT）
   * @returns {Object} 包含 spatialAdjustedScore 的結果物件
   */
  function applySpatialAggregation(baseScores, palaceOrder = PALACE_DEFAULT) {
    if (!baseScores || typeof baseScores !== 'object') {
      return {};
    }

    const spatialAdjustedScores = {};
    
    // 遍歷 12 宮位，每個宮位的最終能效分需包含其「三方四正」的能量
    palaceOrder.forEach((palaceName, index) => {
      const baseData = baseScores[palaceName];
      if (!baseData || typeof baseData.score !== 'number') {
        spatialAdjustedScores[palaceName] = {
          ...baseData,
          spatialAdjustedScore: 0
        };
        return;
      }

      // 計算三方四正的索引位置
      const oppositeIdx = (index + 6) % 12;  // 對宮：索引位 + 6
      const triad1Idx = (index + 4) % 12;     // 三合位 1：索引位 + 4
      const triad2Idx = (index + 8) % 12;     // 三合位 2：索引位 + 8

      // 獲取相關宮位的基礎分數
      const oppositePalace = palaceOrder[oppositeIdx];
      const triad1Palace = palaceOrder[triad1Idx];
      const triad2Palace = palaceOrder[triad2Idx];

      const selfScore = baseData.score || 0;
      const oppositeScore = baseScores[oppositePalace]?.score || 0;
      const triad1Score = baseScores[triad1Palace]?.score || 0;
      const triad2Score = baseScores[triad2Palace]?.score || 0;

      // 權重比例設定：
      // 本宮 (Self)：100% (權重 1.0)
      // 對宮 (Opposite)：40% (權重 0.4)
      // 三合位 1 (Triad 1)：20% (權重 0.2)
      // 三合位 2 (Triad 2)：20% (權重 0.2)
      const spatialScore = (selfScore * 1.0) + 
                          (oppositeScore * 0.4) + 
                          (triad1Score * 0.2) + 
                          (triad2Score * 0.2);

      // 空間聚合後的標準化處理：
      // 基礎分未標準化，是原始分數（通常在 5-30 範圍內）
      // 加權後的理論最大值估算：
      // - 單宮最高約 30 分（主星 15 + 輔星 10 + 雜曜 5）
      // - 對宮 30 * 0.4 = 12
      // - 三合各 30 * 0.2 = 6，兩個共 12
      // - 總計：30 + 12 + 12 = 54
      // 但考慮實際情況，優秀宮位加權後分數通常在 20-40 範圍內
      // 使用 40 作為標準化基準，讓分數分布更合理，避免過度壓縮
      const MAX_THEORETICAL_SPATIAL_SCORE = 40;
      const normalizedScore = Math.max(0, Math.min(100, (spatialScore / MAX_THEORETICAL_SPATIAL_SCORE) * 100));

      spatialAdjustedScores[palaceName] = {
        ...baseData,
        spatialAdjustedScore: Math.round(normalizedScore * 10) / 10,
        // 保留原始基礎分數供參考
        baseScore: selfScore,
        // 三方四正分數詳情（用於調試和顯示）
        spatialDetails: {
          self: selfScore,
          opposite: { palace: oppositePalace, score: oppositeScore, weight: 0.4 },
          triad1: { palace: triad1Palace, score: triad1Score, weight: 0.2 },
          triad2: { palace: triad2Palace, score: triad2Score, weight: 0.2 }
        }
      };
    });

    return spatialAdjustedScores;
  }

  /**
   * 計算單一宮位的基礎分數（L1-L3 + L8，不包含 L4 三方四正）
   * 這是空間聚合前的基礎計算
   * 
   * @param {Object} ziwei 紫微命盤資料
   * @param {string} palaceName 宮位名稱（繁體）
   * @param {Object} weightsData 權重資料
   * @param {Object} options 選項 { horoscope, year }
   * @returns {Object} { score: number, strategicAdvice: string[], maxStarRating: number|null, ... }
   */
  function computeSinglePalaceBaseScore(ziwei, palaceName, weightsData, options = {}) {
    // 使用 Pipeline 計算單宮基礎分數（L1-L3 + L8）
    const result = computeSinglePalaceScore(ziwei, palaceName, weightsData, options);
    
    // 不在此階段標準化，保留原始分數
    // 標準化將在 L4 空間聚合後統一處理
    // 這樣可以保持分數的相對關係，避免過早壓縮
    return {
      score: Math.max(0, result.score), // 只確保非負數，不標準化
      minorBoost: result.minorBoost,
      strategicAdvice: result.strategicAdvice,
      maxStarRating: result.maxStarRating,
      penaltyApplied: result.penaltyApplied
    };
  }

  // ====== 導出 ======

  // 導出到 window.CalcPipeline（如果 window 存在）
  if (typeof window !== "undefined") {
    window.CalcPipeline = {
      // Pipeline 階段
      stageBaseScore,
      stageBrightness,
      stageResonance,
      stageElement,
      stageSiHua,
      stagePenalty,
      
      // Pipeline 執行
      executePipeline,
      computeSinglePalaceScore,
      computeSinglePalaceBaseScore,
      
      // L4 和 L7
      applySpatialAggregation,
      stageSubjectiveBoost,
    };
  } else if (typeof globalThis !== "undefined") {
    // 讓 Node / 測試環境也能引用
    globalThis.CalcPipeline = {
      stageBaseScore,
      stageBrightness,
      stageResonance,
      stageElement,
      stageSiHua,
      stagePenalty,
      executePipeline,
      computeSinglePalaceScore,
      computeSinglePalaceBaseScore,
      applySpatialAggregation,
      stageSubjectiveBoost,
    };
  }
})();
