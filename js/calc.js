/* calc.js
 * 負責所有「計算／資料邏輯」（bazi / ziwei / liuyue）
 * 不直接碰 DOM，不做事件綁定。
 *
 * 以 window.Calc 暴露給 ui.js 使用（避免引入打包工具）。
 */

(function () {
  "use strict";

  // ====== CONSTANTS / MAPS ======
  // 從 calc/constants.js 載入常數（階段2優化：模組化）
  if (typeof window === "undefined" || !window.CalcConstants) {
    throw new Error("calc.js requires calc/constants.js to be loaded first");
  }

  // 解構常數（使用本地變數名，保持向後兼容）
  const {
    PALACE_DEFAULT,
    PALACE_KEY_MAP,
    PALACE_NAME_TO_ID_MAP,
    PALACE_ONE_LINERS,
    gridAreas,
    BRANCH_RING,
    STAR_NAME_TRAD_MAP,
    STAR_WUXING_MAP,
    EN_STAR_TO_ZH_FOR_WUXING,
    STAR_NAME_TO_ID_MAP,
    SHICHEN_ORDER,
    SHICHEN_START_HOUR,
    SHICHEN_TO_HOUR,
    FIVE_ELEMENTS_ORDER,
    SHENG_MAP,
    KE_MAP,
    STRONG_COMMENTS,
    WEAK_COMMENTS,
    CANGGAN_DATA,
    ENERGY_LABEL,
    ELEMENT_CORE_MEANING,
    GENERATION_POST_STYLE,
    OVERCOMING_POST_STYLE,
    ELEMENT_TYPE,
    POYEN_CONVERSION_ONE,
    POYEN_RISK_ONE,
    POYEN_PUSH,
    STEMS,
    BRANCH_ORDER,
    YIN_STEM_FROM_YEAR,
    SI_HUA_MAP,
    STRATEGIC_ADVICE_BY_STARS,
  } = window.CalcConstants;

  // ====== PURE HELPERS ======
  // 從 calc/helpers.js 載入純函數（階段2優化：模組化）
  if (typeof window === "undefined" || !window.CalcHelpers) {
    throw new Error("calc.js requires calc/helpers.js to be loaded first");
  }

  // 解構純函數（使用本地變數名，保持向後兼容）
  const {
    pad2,
    toNumberOrZero,
    resolveBirthTime,
    toTraditionalStarName,
    getStarsForPalace,
    getStarBrightness,
    buildCompleteStarNameMap,
    getStarWeightConfig,
    pctFromWx,
    normalizeWxByMax,
    getStrongestWeakest,
    generateFiveElementComment,
    clampEnergyLevel,
    energyBand,
    meaningText,
    relationBadge,
    toEnergyLevelsFromWx,
    generateFiveElementDiagnosis,
    buildStrategistNote,
    getPoYenBoard,
    computeRelatedPalaces,
    getMutagenStars,
    getSiHuaWeights,
  } = window.CalcHelpers;

  // ====== 星曜權重系統（基於 ziweiWeights.json）======
  // 常數已從 calc/constants.js 載入

  // 權重資料緩存
  let ziweiWeightsCache = null;
  let ziweiWeightsLoadPromise = null;

  /**
   * 載入 ziweiWeights.json 權重資料（含錯誤處理與緩存）
   * @returns {Promise<Object>} 權重資料物件
   */
  function loadZiweiWeights() {
    if (ziweiWeightsCache) {
      return Promise.resolve(ziweiWeightsCache);
    }
    if (ziweiWeightsLoadPromise) {
      return ziweiWeightsLoadPromise;
    }
    ziweiWeightsLoadPromise = fetch("data/ziweiWeights.json")
      .then((resp) => {
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        return resp.json();
      })
      .then((data) => {
        ziweiWeightsCache = data;
        return data;
      })
      .catch((err) => {
        console.warn("無法載入 ziweiWeights.json，使用預設值:", err);
        // 返回空結構作為預設值
        ziweiWeightsCache = { mainStars: [], assistantStars: [], minorStars: [], deities: [] };
        return ziweiWeightsCache;
      });
    return ziweiWeightsLoadPromise;
  }

  // ====== 星曜權重系統（基於 ziweiWeights.json）======
  // 純函數已從 calc/helpers.js 載入

  // ====== Pipeline 架構：紫微評分六階段 ======
  // 從 calc/ziweiPipeline.js 載入 Pipeline 函數（階段2優化：模組化）
  if (typeof window === "undefined" || !window.CalcPipeline) {
    throw new Error("calc.js requires calc/ziweiPipeline.js to be loaded first");
  }

  // 解構 Pipeline 函數（使用本地變數名，保持向後兼容）
  const {
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
  } = window.CalcPipeline;

  // ====== 以下函數已移至 calc/ziweiPipeline.js ======
  // stageBaseScore, stageBrightness, stageResonance, stageElement, stageSiHua, stagePenalty
  // executePipeline, computeSinglePalaceScore, stageSubjectiveBoost, applySpatialAggregation, computeSinglePalaceBaseScore

  /**
   * 計算宮位基礎強度分數（重構版：基於 ziweiWeights.json + 三方四正加權 + 雜曜神煞整合）
   * 注意：此函數保留用於向後兼容，內部已使用新的 L4 架構
   * 
   * @param {Object} ziwei 紫微命盤資料
   * @param {string} palaceName 宮位名稱（繁體）
   * @param {Object} horoscope 小限資料（可選，用於 2026 預警機制）
   * @returns {Promise<Object>} { score: number, strategicAdvice: string[], maxStarRating: number|null }
   */
  async function computePalaceBaseScore(ziwei, palaceName, horoscope) {
    if (!ziwei || !ziwei.mainStars) {
      return { score: 0, strategicAdvice: [], maxStarRating: null };
    }

    // 載入權重資料
    const weightsData = await loadZiweiWeights();
    
    // 獲取當前年份（用於 2026 預警機制）
    const currentYear = new Date().getFullYear();
    const options = { horoscope, year: currentYear };

    // 1. 計算本宮基礎分數（包含雜曜和神煞）
    const selfResult = computeSinglePalaceScore(ziwei, palaceName, weightsData, options);

    // 2. 三方四正加權計算
    const { opposite, triads } = computeRelatedPalaces(PALACE_DEFAULT, palaceName);
    
    // 對宮分數（40% 權重）
    let oppositeResult = { score: 0, minorBoost: 0, strategicAdvice: [], maxStarRating: null, penaltyApplied: 0 };
    if (opposite && opposite !== palaceName) {
      oppositeResult = computeSinglePalaceScore(ziwei, opposite, weightsData, options);
    }

    // 三合宮位分數（各 20% 權重）
    let triad1Result = { score: 0, minorBoost: 0, strategicAdvice: [], maxStarRating: null, penaltyApplied: 0 };
    let triad2Result = { score: 0, minorBoost: 0, strategicAdvice: [], maxStarRating: null, penaltyApplied: 0 };
    if (triads && triads.length >= 2) {
      triad1Result = computeSinglePalaceScore(ziwei, triads[0], weightsData, options);
      triad2Result = computeSinglePalaceScore(ziwei, triads[1], weightsData, options);
    }

    // 綜合分數：FinalScore = Score_Self + (Score_Opposite * 0.4) + (Score_Triad1 * 0.2) + (Score_Triad2 * 0.2)
    // 注意：雜曜增壓只計入本宮，不計入三方四正
    const mainScore = selfResult.score + (oppositeResult.score * 0.4) + (triad1Result.score * 0.2) + (triad2Result.score * 0.2);
    const finalScore = mainScore + selfResult.minorBoost - selfResult.penaltyApplied;

    // 合併戰略建議（去重）
    const allStrategicAdvice = [
      ...selfResult.strategicAdvice,
      ...oppositeResult.strategicAdvice,
      ...triad1Result.strategicAdvice,
      ...triad2Result.strategicAdvice
    ];
    const uniqueStrategicAdvice = [...new Set(allStrategicAdvice)];

    // 確定最終的星等上限（取最嚴格的值）
    const allMaxStarRatings = [
      selfResult.maxStarRating,
      oppositeResult.maxStarRating,
      triad1Result.maxStarRating,
      triad2Result.maxStarRating
    ].filter(r => r != null);
    const finalMaxStarRating = allMaxStarRatings.length > 0 ? Math.min(...allMaxStarRatings) : null;

    // 標準化處理：將分數映射到 0-100 範圍
    // 理論最大值估算（考慮雜曜增壓上限 ±10）：
    // - 本宮：主星 10 * 1.5 亮度 * 1.2 共鳴 = 18，多主星 + 輔星 ≈ 25
    // - 對宮：25 * 0.4 = 10
    // - 三合：25 * 0.2 * 2 = 10
    // - 雜曜增壓：±10
    // - 總計：25 + 10 + 10 + 10 = 55（保守估計）
    const MAX_THEORETICAL_SCORE = 55;
    const normalizedScore = Math.max(0, Math.min(100, (finalScore / MAX_THEORETICAL_SCORE) * 100));

    return {
      score: Math.round(normalizedScore * 10) / 10,
      strategicAdvice: uniqueStrategicAdvice,
      maxStarRating: finalMaxStarRating
    };
  }

  /**
   * 宮位強度 + 小限四化權重加成（重構版：整合四化邏輯與雙祿交會）
   * @param {number} baseScore 基礎分數
   * @param {string[]} stars 該宮繁體星名陣列
   * @param {string} stem 小限天干
   * @param {Object} ziwei 紫微命盤資料（可選，用於雙祿交會計算）
   * @param {string} palaceName 宮位名稱（可選，用於雙祿交會計算）
   * @returns {Promise<number>} 加權後分數（0-100 標準化）
   */
  async function getPalaceScoreWithWeights(baseScore, stars, stem, ziwei, palaceName) {
    if (!Array.isArray(stars) || !stem) return baseScore;

    const weights = getSiHuaWeights(stem);
    let add = 0;
    let luCount = 0; // 化祿計數（用於雙祿交會）

    // 1. 計算四化增益與減損
    stars.forEach((starName) => {
      const weight = Number(weights[starName]) || 0;
      add += weight;
      
      // 統計化祿數量（化祿權重為 +3）
      if (weight === 3) {
        luCount++;
      }
      
      // 統計祿存（祿存本身也是祿）
      if (starName === "祿存") {
        luCount++;
      }
    });

    // 2. 雙祿交會：若本宮與三方四正同時出現多個祿存或化祿，額外給予 +2 的加成
    if (luCount >= 2 && ziwei && palaceName) {
      const { opposite, triads } = computeRelatedPalaces(PALACE_DEFAULT, palaceName);
      let relatedLuCount = luCount; // 本宮已統計的祿

      // 檢查對宮
      if (opposite && opposite !== palaceName) {
        const oppositeStars = getStarsForPalace(ziwei, opposite).map(toTraditionalStarName);
        const oppositeMutagen = getSiHuaWeights(stem);
        oppositeStars.forEach((starName) => {
          if (oppositeMutagen[starName] === 3 || starName === "祿存") {
            relatedLuCount++;
          }
        });
      }

      // 檢查三合宮位
      if (triads && triads.length >= 2) {
        triads.forEach((triadPalace) => {
          const triadStars = getStarsForPalace(ziwei, triadPalace).map(toTraditionalStarName);
          const triadMutagen = getSiHuaWeights(stem);
          triadStars.forEach((starName) => {
            if (triadMutagen[starName] === 3 || starName === "祿存") {
              relatedLuCount++;
            }
          });
        });
      }

      // 若三方四正範圍內有 2 個或以上的祿，給予 +2 加成
      if (relatedLuCount >= 2) {
        add += 2;
      }
    }

    // 3. 計算最終分數並標準化
    const finalScore = Math.max(0, (Number(baseScore) || 0) + add);
    
    // 標準化到 0-100 範圍（假設基礎分數已在 0-100 範圍內）
    const normalizedScore = Math.max(0, Math.min(100, finalScore));

    return Math.round(normalizedScore * 10) / 10;
  }

  // ====== L9: 決策映射與語義輸出 ======
  
  /**
   * 宮位一句話說明映射表（#深度貼文風格）
   * 為 12 宮位提供直覺描述，符合系統思維與商務決策直覺
   * 常數已從 calc/constants.js 載入
   */

  /**
   * 戰略建議映射表（根據星等）
   * 符合 #深度貼文 框架：語氣冷靜、中性、具備系統思維與商務決策直覺
   * 蘊含溫和鼓勵性質，但保持不同級別的差異性
   * 常數已從 calc/constants.js 載入
   */

  // ====== L9: 決策映射與語義輸出 ======
  // 從 calc/ziweiOutput.js 載入 L9 輸出函數（階段2優化：模組化）
  if (typeof window === "undefined" || !window.CalcOutput) {
    throw new Error("calc.js requires calc/ziweiOutput.js to be loaded first");
  }

  // 解構 L9 輸出函數（使用本地變數名，保持向後兼容）
  const {
    mapScoreToInternalLevel,
    mapInternalLevelToDisplayStars,
    mapScoreToStarRating,
    computeMonthlyStarRating,
    generateMonthlyCorrelationNote,
    finalizeStarRating,
    generateMonthStrategyTag,
    parseMonthFromRange, // 注意：此函數在 ziweiOutput.js 中定義，但 calc.js 中也需要使用
  } = window.CalcOutput;

  // ====== 以下函數已移至 calc/ziweiOutput.js ======
  // mapScoreToInternalLevel, mapInternalLevelToDisplayStars, mapScoreToStarRating
  // computeMonthlyStarRating, generateMonthlyCorrelationNote, finalizeStarRating, generateMonthStrategyTag

  /**
   * 計算所有 12 宮位的基礎分數（L4 + L7 + L9 架構重構版 + 完整四化系統）
   * 
   * 流程：
   * 1. 計算完整四化系統（本命、大限、流年、小限）
   * 2. 計算所有宮位的基礎分（L1-L3 + L8，不包含三方四正）
   * 3. 應用 L4 空間連動（三方四正聚合）
   * 4. 應用 L7 主觀頻率修正（小限宮位增益）
   * 5. 應用 L9 決策映射與語義輸出
   * 6. 返回包含完整語義輸出的結果
   * 
   * @param {Object} ziwei 紫微命盤資料
   * @param {Object} horoscope 小限資料（可選）
   * @param {Object} [options] 選項 { bazi, age, currentYear }
   * @param {Object} [options.bazi] 八字資料（用於計算本命和大限四化）
   * @param {number} [options.age] 當前年齡（用於計算大限四化）
   * @param {number} [options.currentYear] 當前年份（預設為系統年份）
   * @returns {Promise<Object>} 宮位分數物件 { "命宮": 85.5, "兄弟": 72.3, ... }
   * 同時將完整的 L9 語義輸出存儲到 window.ziweiPalaceMetadata
   */
  async function computeAllPalaceScores(ziwei, horoscope, options = {}) {
    if (!ziwei) return { scores: {}, elementRatios: {} };
    
    // 處理參數（向後兼容：如果第三個參數是對象，則作為 options）
    let bazi, age, currentYear;
    if (options && typeof options === 'object' && !options.bazi) {
      // 舊的調用方式：computeAllPalaceScores(ziwei, horoscope)
      // options 實際上是空的或未定義
      bazi = null;
      age = null;
      currentYear = new Date().getFullYear();
    } else {
      bazi = options?.bazi || null;
      age = options?.age || null;
      currentYear = options?.currentYear || new Date().getFullYear();
    }
    
    // 預先載入權重資料（避免重複載入）
    const weightsData = await loadZiweiWeights();
    
    // 計算完整四化系統（如果提供了必要的資料）
    let fourTransformations = null;
    let overlapAnalysis = null;
    
    if (window.FourTransformations && bazi && typeof age === 'number') {
      try {
        // 獲取性別（從 horoscope 或 options 中）
        const gender = horoscope?.gender || options?.gender || null;
        
        fourTransformations = window.FourTransformations.computeFourTransformations({
          bazi: bazi,
          ziwei: ziwei,
          horoscope: horoscope,
          age: age,
          currentYear: currentYear,
          gender: gender
        });
        // 若 API 有回傳 decadal/yearly，優先使用（iztro 計算較可靠）
        const apiDecadal = horoscope?.decadal;
        const apiYearly = horoscope?.yearly;
        if (apiDecadal && apiDecadal.palace && fourTransformations) {
          const dalimitMutagen = apiDecadal.mutagenStars && Object.keys(apiDecadal.mutagenStars).length
            ? apiDecadal.mutagenStars
            : (window.CalcHelpers?.getMutagenStars?.(apiDecadal.stem) || {});
          const dalimitWeights = window.CalcHelpers?.getSiHuaWeights?.(apiDecadal.stem) || {};
          fourTransformations.dalimit = {
            stem: apiDecadal.stem,
            mutagenStars: dalimitMutagen,
            weights: dalimitWeights,
            palace: apiDecadal.palace,
            type: 'dalimit'
          };
          if (fourTransformations.summary) fourTransformations.summary.dalimitPalace = apiDecadal.palace;
          if (fourTransformations.summary) fourTransformations.summary.dalimitStem = apiDecadal.stem;
          console.log('[calc.js] 大限已從 API horoscope 覆寫:', apiDecadal.palace);
        }
        if (apiYearly && apiYearly.palace && fourTransformations) {
          const liunianMutagen = apiYearly.mutagenStars && Object.keys(apiYearly.mutagenStars).length
            ? apiYearly.mutagenStars
            : (window.CalcHelpers?.getMutagenStars?.(apiYearly.stem) || {});
          const liunianWeights = window.CalcHelpers?.getSiHuaWeights?.(apiYearly.stem) || {};
          fourTransformations.liunian = {
            stem: apiYearly.stem,
            branch: apiYearly.branch,
            mutagenStars: liunianMutagen,
            weights: liunianWeights,
            palace: apiYearly.palace,
            type: 'liunian'
          };
          if (fourTransformations.summary) fourTransformations.summary.liunianPalace = apiYearly.palace;
          if (fourTransformations.summary) fourTransformations.summary.liunianStem = apiYearly.stem;
          if (fourTransformations.summary) fourTransformations.summary.liunianBranch = apiYearly.branch;
          console.log('[calc.js] 流年已從 API horoscope 覆寫:', apiYearly.palace);
        }
        console.log('[calc.js] 完整四化系統計算成功:', fourTransformations.summary);
        
        // 計算疊宮與引爆分析
        if (window.FourTransformations.calculateOverlapTransformations) {
          try {
            overlapAnalysis = window.FourTransformations.calculateOverlapTransformations(
              fourTransformations,
              ziwei
            );
            // 詳細的調試日誌
            const palaceMapEntries = overlapAnalysis.palaceMap instanceof Map 
              ? Array.from(overlapAnalysis.palaceMap.entries())
              : Object.entries(overlapAnalysis.palaceMap || {});
            
            console.log('[calc.js] 疊宮分析完成:', {
              criticalRisks: overlapAnalysis.criticalRisks?.length || 0,
              maxOpportunities: overlapAnalysis.maxOpportunities?.length || 0,
              volatileAmbivalences: overlapAnalysis.volatileAmbivalences?.length || 0,
              palaceMapSize: palaceMapEntries.length,
              summary: overlapAnalysis.summary
            });
            
            // 顯示每個宮位的四化統計（調試用）
            console.log('[calc.js] 各宮位四化統計:');
            palaceMapEntries.forEach(([palaceName, palaceData]) => {
              const total = (palaceData.luCount || 0) + (palaceData.quanCount || 0) + 
                           (palaceData.keCount || 0) + (palaceData.jiCount || 0);
              if (total > 0) {
                console.log(`  ${palaceName}: 祿${palaceData.luCount || 0} 權${palaceData.quanCount || 0} 科${palaceData.keCount || 0} 忌${palaceData.jiCount || 0}`);
              }
            });
            
            // 將原始疊宮分析數據存儲到全局狀態（包含所有原始數據）
            if (typeof window !== "undefined") {
              if (window.BaziApp?.State) {
                window.BaziApp.State.setState("overlapAnalysis", overlapAnalysis);
              }
              window.overlapAnalysis = overlapAnalysis;
              
              // 同時生成並存儲報告（包含評論）
              if (window.OverlapAnalysis && window.OverlapAnalysis.generateOverlapReport) {
                try {
                  const overlapReport = window.OverlapAnalysis.generateOverlapReport(overlapAnalysis);
                  console.log('[calc.js] 疊宮評論:', overlapReport.comments);
                  window.overlapReport = overlapReport; // 存儲報告到單獨的變數
                } catch (err) {
                  console.warn('[calc.js] 生成疊宮報告失敗:', err);
                }
              }
              // M7 戰略聯動：在現有結果上產出 StrategicLink[] 供命書依 key 抓文案
              if (window.StrategicLinkEngine && window.contract && window.contract.ziwei && overlapAnalysis && window.contract.bodyPalaceReport) {
                try {
                  const ctx = window.StrategicLinkEngine.buildStrategicContext(
                    window.contract.ziwei,
                    overlapAnalysis,
                    window.contract.bodyPalaceReport,
                    window.contract.userBehavior,
                    window.contract.luEvents
                  );
                  window.contract.strategicLinks = window.StrategicLinkEngine.buildStrategicLinks(ctx);
                  if (window.BaziApp?.State) {
                    window.BaziApp.State.setState("strategicLinks", window.contract.strategicLinks);
                  }
                } catch (err) {
                  console.warn('[calc.js] strategicLinks 計算失敗:', err);
                }
              }
            }
          } catch (err) {
            console.warn('[calc.js] 疊宮分析計算失敗:', err);
          }
        }
      } catch (err) {
        console.warn('[calc.js] 完整四化系統計算失敗，使用小限四化:', err);
      }
    }
    
    // 計算好命指數（Luck Index）
    let luckIndexData = null;
    if (window.LuckIndex && weightsData) {
      try {
        luckIndexData = window.LuckIndex.computeLuckIndex(ziwei, weightsData);
        console.log('[calc.js] 好命指數計算成功:', luckIndexData);
        
        // 將好命指數存儲到全局狀態
        if (typeof window !== "undefined") {
          if (window.BaziApp?.State) {
            window.BaziApp.State.setState("luckIndex", luckIndexData);
          }
          window.luckIndex = luckIndexData;
        }
      } catch (err) {
        console.warn('[calc.js] 好命指數計算失敗:', err);
      }
    }
    
    // 構建 options 物件（傳遞給 Pipeline）
    const pipelineOptions = { 
      horoscope, 
      year: currentYear,
      bazi: bazi,
      ziwei: ziwei,
      age: age,
      fourTransformations: fourTransformations
    };
    
    // 步驟 1: 計算所有 12 宮位的基礎分數（L1-L3 + L8，不包含 L4 三方四正）
    const baseScores = {};
    const metadata = {};
    
    // 並行計算所有宮位的基礎分數
    const promises = PALACE_DEFAULT.map(async (palace) => {
      const result = computeSinglePalaceBaseScore(ziwei, palace, weightsData, pipelineOptions);
      baseScores[palace] = result;
      metadata[palace] = {
        strategicAdvice: result.strategicAdvice || [],
        maxStarRating: result.maxStarRating,
        baseScore: result.score
      };
      return { palace, result };
    });
    
    await Promise.all(promises);
    
    // 步驟 2: 應用 L4 空間連動（三方四正聚合）
    const spatialAdjustedResults = applySpatialAggregation(baseScores, PALACE_DEFAULT);
    
    // 步驟 3: 應用 L7 主觀頻率修正（小限宮位增益）
    const xiaoXianPalace = horoscope?.activeLimitPalaceName || null;
    const subjectiveAdjustedResults = stageSubjectiveBoost(spatialAdjustedResults, xiaoXianPalace);
    
    // 步驟 4: 應用 L9 決策映射與語義輸出
    const scores = {};
    const finalMetadata = {};
    
    // 先收集所有最終分數，用於相對排名計算
    const allFinalScores = {};
    PALACE_DEFAULT.forEach((palace) => {
      const subjectiveResult = subjectiveAdjustedResults[palace];
      if (subjectiveResult) {
        const finalScore = subjectiveResult.subjectiveAdjustedScore || 
                          subjectiveResult.spatialAdjustedScore || 
                          subjectiveResult.score || 0;
        allFinalScores[palace] = finalScore;
      } else {
        allFinalScores[palace] = baseScores[palace]?.score || 0;
      }
    });
    
    // 使用相對排名計算星等
    PALACE_DEFAULT.forEach((palace) => {
      const subjectiveResult = subjectiveAdjustedResults[palace];
      if (subjectiveResult) {
        // 優先使用 subjectiveAdjustedScore（如果存在），否則使用 spatialAdjustedScore
        const finalScore = subjectiveResult.subjectiveAdjustedScore || 
                          subjectiveResult.spatialAdjustedScore || 
                          subjectiveResult.score || 0;
        
        // L9: 生成完整的語義輸出物件（傳入所有分數用於相對排名）
        const l9Output = finalizeStarRating(palace, finalScore, {
          maxStarRating: subjectiveResult.maxStarRating || metadata[palace].maxStarRating,
          strategicAdvice: metadata[palace].strategicAdvice || [],
          isSubjectiveFocus: subjectiveResult.isSubjectiveFocus || false,
          allScores: allFinalScores  // 傳入所有分數用於相對排名
        });
        
        scores[palace] = finalScore;
        
        // 更新元數據，包含 L4、L7 和 L9 的完整輸出
        finalMetadata[palace] = {
          ...metadata[palace],
          // L1-L3 + L8 基礎數據
          baseScore: subjectiveResult.baseScore || metadata[palace].baseScore,
          // L4 空間連動數據
          spatialAdjustedScore: subjectiveResult.spatialAdjustedScore || subjectiveResult.score,
          spatialDetails: subjectiveResult.spatialDetails,
          // L7 主觀頻率修正數據
          subjectiveAdjustedScore: subjectiveResult.subjectiveAdjustedScore || null,
          isSubjectiveFocus: subjectiveResult.isSubjectiveFocus || false,
          boostApplied: subjectiveResult.boostApplied || null,
          // L9 決策映射與語義輸出（完整物件）
          l9Output: l9Output
        };
      } else {
        const finalScore = baseScores[palace]?.score || 0;
        
        // L9: 生成完整的語義輸出物件（即使沒有 L4/L7 調整）
        const l9Output = finalizeStarRating(palace, finalScore, {
          maxStarRating: metadata[palace].maxStarRating,
          strategicAdvice: metadata[palace].strategicAdvice || [],
          isSubjectiveFocus: false,
          allScores: allFinalScores  // 傳入所有分數用於相對排名
        });
        
        scores[palace] = finalScore;
        finalMetadata[palace] = {
          ...metadata[palace],
          l9Output: l9Output
        };
      }
    });
    
    // 計算五行健康預警（Health Analysis）- 在宮位分數計算完成後
    let healthWarningData = null;
    if (window.HealthAnalysis && bazi && bazi.wuxing) {
      try {
        const wuxingData = {
          raw: bazi.wuxing.strategic || bazi.wuxing.raw || {},
          pct: null, // 會在函數內部計算
          levels: null // 會在函數內部計算
        };
        
        // 傳入完整選項（包含年份月份加權、年齡風險、流年大小限、疾厄宮四化）
        healthWarningData = window.HealthAnalysis.generateHealthWarning(wuxingData, {
          palaceScores: scores, // 宮位分數
          palaceMetadata: finalMetadata, // 宮位元數據（包含星曜資訊）
          overlapAnalysis: overlapAnalysis, // 疊宮分析（包含疾厄宮四化）
          age: age, // 當前年齡
          currentYear: currentYear, // 當前年份
          currentMonth: new Date().getMonth() + 1, // 當前月份
          fourTransformations: fourTransformations // 四化系統數據（用於獲取流年天干）
        });
        console.log('[calc.js] 五行健康預警計算成功（增強版）:', {
          riskLevel: healthWarningData.riskLevel,
          warningsCount: healthWarningData.warnings.length,
          ageRiskMultiplier: healthWarningData.multipliers?.ageRisk,
          jiePalaceRiskMultiplier: healthWarningData.multipliers?.jiePalaceRisk
        });
        
        // 生成月度健康風險數據（生命健康心電圖）
        let monthlyHealthRisk = null;
        if (window.HealthAnalysis && window.HealthAnalysis.generateMonthlyHealthRisk) {
          try {
            monthlyHealthRisk = window.HealthAnalysis.generateMonthlyHealthRisk(wuxingData, {
              palaceScores: scores,
              palaceMetadata: finalMetadata,
              overlapAnalysis: overlapAnalysis,
              age: age,
              currentYear: currentYear,
              currentMonth: new Date().getMonth() + 1,
              fourTransformations: fourTransformations
            });
            
            console.log('[calc.js] 月度健康風險數據生成成功，共', monthlyHealthRisk.length, '個月');
            
            // 將月度健康風險存儲到全局狀態
            if (typeof window !== "undefined") {
              if (window.BaziApp?.State) {
                window.BaziApp.State.setState("monthlyHealthRisk", monthlyHealthRisk);
              }
              window.monthlyHealthRisk = monthlyHealthRisk;
            }
          } catch (err) {
            console.warn('[calc.js] 月度健康風險數據生成失敗:', err);
          }
        }

        // 將健康預警存儲到全局狀態
        if (typeof window !== "undefined") {
          if (window.BaziApp?.State) {
            window.BaziApp.State.setState("healthWarning", healthWarningData);
          }
          window.healthWarning = healthWarningData;
        }
      } catch (err) {
        console.warn('[calc.js] 五行健康預警計算失敗:', err);
      }
    }
    
    // 將元數據存儲到全局狀態管理器（優先），或直接存到 window（向後兼容）
    if (typeof window !== "undefined") {
      if (window.BaziApp?.State) {
        window.BaziApp.State.setState("ziweiPalaceMetadata", finalMetadata);
      }
      // 向後兼容：也存到 window.ziweiPalaceMetadata
      window.ziweiPalaceMetadata = finalMetadata;
    }
    
    // 生成 AI Prompt（供後台管理界面使用）
    if (window.AIPromptGenerator) {
      try {
        const structuredData = window.AIPromptGenerator.collectStructuredData({
          currentYear: currentYear,
          age: age
        });
        
        // 補充四化系統數據（如果可用）
        if (fourTransformations) {
          structuredData.fourTransformations = fourTransformations;
          // 也存到全局狀態
          if (typeof window !== "undefined") {
            window.fourTransformations = fourTransformations;
          }
        }
        
        const aiPrompt = window.AIPromptGenerator.generateAIPrompt(structuredData, {
          targetLength: 1500,
          includeDetails: true
        });
        
        console.log('[calc.js] AI Prompt 生成成功，長度:', aiPrompt.length, '字元');
        
        // 將 AI Prompt 存儲到全局狀態
        if (typeof window !== "undefined") {
          if (window.BaziApp?.State) {
            window.BaziApp.State.setState("aiPrompt", aiPrompt);
            window.BaziApp.State.setState("structuredData", structuredData);
          }
          window.aiPrompt = aiPrompt;
          window.structuredData = structuredData;
        }
      } catch (err) {
        console.warn('[calc.js] AI Prompt 生成失敗:', err);
      }
    }
    
    // 計算紫微五行比例（從 12 宮星曜彙總，供前端五行條與雷達圖使用）
    const elementRatios = computeZiweiElementRatios(ziwei);

    // 向後兼容：回傳 { scores, elementRatios }，caller 可解構
    return { scores, elementRatios };
  }

  /**
   * 從紫微命盤計算五行比例（依 12 宮星曜的五行屬性彙總）
   * @param {Object} ziwei 紫微命盤資料
   * @returns {Object} { 木, 火, 土, 金, 水 } 各為 0–1 的比例
   */
  function computeZiweiElementRatios(ziwei) {
    const ratios = { 木: 0, 火: 0, 土: 0, 金: 0, 水: 0 };
    if (!ziwei || !getStarsForPalace) return ratios;
    let total = 0;
    PALACE_DEFAULT.forEach((palaceName) => {
      const rawStars = getStarsForPalace(ziwei, palaceName);
      const stars = rawStars.map(toTraditionalStarName);
      stars.forEach((s) => {
        const zhName = STAR_WUXING_MAP[s] ? s : (EN_STAR_TO_ZH_FOR_WUXING[s] || s);
        const wx = STAR_WUXING_MAP[zhName];
        if (wx && ratios.hasOwnProperty(wx)) {
          ratios[wx] += 1;
          total += 1;
        }
      });
    });
    if (total > 0) {
      ["木", "火", "土", "金", "水"].forEach((k) => (ratios[k] = ratios[k] / total));
    }
    return ratios;
  }

  /**
   * 2026 年農曆月份對應月支（正月寅、二月卯…十二月丑）
   */
  const LUNAR_MONTH_BRANCHES = ["寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥", "子", "丑"];

  /**
   * 當 bazi.liuyue2026 不存在時，依十神與五行生成 12 月 fallback 資料
   * @param {Object} bazi 八字資料
   * @returns {Object} { bounds: [...], redMonths: [...] }
   */
  function buildLiuyue2026Fallback(bazi) {
    const bounds = [];
    const dominant = (bazi?.tenGod?.dominant || "").trim();
    const wx = bazi?.wuxing?.strategic || bazi?.wuxing?.surface || {};
    const firePct = Number(wx["火"]) || 0;
    const total = Object.values(wx).reduce((s, v) => s + (Number(v) || 0), 0) || 1;
    const fireRatio = total > 0 ? firePct / total : 0.2;
    // 2026 丙午年：五虎遁 丙年起寅月=庚寅
    const year2026Stem = "丙";
    const yinStem = YIN_STEM_FROM_YEAR[year2026Stem] || "丙";
    const yinStemIdx = STEMS.indexOf(yinStem);
    // 2026 農曆月份對應國曆起迄（正月≈2/4-3/4，二月≈3/5-4/3…）
    const LUNAR_RANGES_2026 = ["01.04-02.04", "02.04-03.05", "03.05-04.04", "04.04-05.05", "05.05-06.02", "06.02-07.03", "07.03-08.02", "08.02-09.01", "09.01-09.30", "09.30-10.30", "10.30-11.28", "11.28-12.28"];
    for (let m = 1; m <= 12; m++) {
      const branch = LUNAR_MONTH_BRANCHES[m - 1];
      const stemIdx = (yinStemIdx + m - 1) % 10;
      const stem = STEMS[stemIdx < 0 ? stemIdx + 10 : stemIdx];
      const gz = stem + branch;
      const range = LUNAR_RANGES_2026[m - 1] || `${String(m).padStart(2, "0")}.04-${String(m + 1).padStart(2, "0")}.04`;
      let riskScore = 40 + Math.sin(m * 0.5) * 15 + (fireRatio > 0.3 ? 10 : 0);
      if (/官|殺|七殺|正官|偏官/.test(dominant)) riskScore += 5;
      riskScore = Math.max(20, Math.min(80, Math.round(riskScore)));
      const LiuyueStrategy = window.UiUtils?.LiuyueStrategy;
      const strategy = LiuyueStrategy && typeof LiuyueStrategy.getStrategy === "function"
        ? LiuyueStrategy.getStrategy(gz, dominant, riskScore)
        : (LiuyueStrategy?.FALLBACK_STRATEGY || "本月宜依個人命盤調整節奏。");
      bounds.push({
        range,
        riskScore,
        gz,
        ssStem: stem,
        ssBranch: branch,
        reasonTags: [],
        strategy,
      });
    }
    const redMonths = bounds.filter((b) => (Number(b.riskScore) || 0) >= 60).map((b) => parseMonthFromRange(b.range)).filter(Boolean);
    return { bounds, redMonths };
  }

  // ====== 八字核心計算 ======
  // 從 calc/baziCore.js 載入八字相關函數（階段2優化：模組化）
  if (typeof window === "undefined" || !window.BaziCore) {
    throw new Error("calc.js requires calc/baziCore.js to be loaded first");
  }

  // 解構八字核心函數（使用本地變數名，保持向後兼容）
  const {
    getYearlyIndexFromAge,
    getMinggongStem,
    getPalaceStem,
    getStartAgeFromWuxingju,
    getDecadalLimits,
    getHoroscopeFromAge,
    getMajorLuckDirection,
  } = window.BaziCore;

  // ====== 以下函數已移至 calc/baziCore.js ======
  // getYearlyIndexFromAge, getMinggongStem, getPalaceStem, getStartAgeFromWuxingju, getDecadalLimits, getHoroscopeFromAge

  // ====== 動態戰術建議 ======
  // 從 calc/tactics.js 載入戰術建議函數（階段2優化：模組化）
  if (typeof window === "undefined" || !window.CalcTactics) {
    throw new Error("calc.js requires calc/tactics.js to be loaded first");
  }

  // 解構戰術建議函數（使用本地變數名，保持向後兼容）
  const {
    computeDynamicTactics,
  } = window.CalcTactics;

  // ====== 以下函數已移至 calc/tactics.js ======
  // computeDynamicTactics

  /**
   * 依流年地支與命宮地支計算流年命宮（與 worker 寅起地支環一致）。
   * @param {string} yearlyBranch 流年地支（如「午」）
   * @param {string} mingBranch 命宮地支
   * @returns {string|null} 宮位名（如「疾厄宮」）或 null
   */
  function computeYearlyDestinyPalace(yearlyBranch, mingBranch) {
    const BRANCH_RING_INDEX = { 寅: 0, 卯: 1, 辰: 2, 巳: 3, 午: 4, 未: 5, 申: 6, 酉: 7, 戌: 8, 亥: 9, 子: 10, 丑: 11 };
    const PALACE_BY_OFFSET = ["命宮", "兄弟宮", "夫妻宮", "子女宮", "財帛宮", "疾厄宮", "遷移宮", "僕役宮", "官祿宮", "田宅宮", "福德宮", "父母宮"];
    const mingIdx = BRANCH_RING_INDEX[mingBranch];
    const yearlyIdx = BRANCH_RING_INDEX[yearlyBranch];
    if (mingIdx == null || mingIdx === undefined || yearlyIdx == null || yearlyIdx === undefined) return null;
    const offset = (mingIdx - yearlyIdx + 12) % 12;
    return PALACE_BY_OFFSET[offset] ?? null;
  }

  /**
   * 依「命宮地支」＋固定 PALACE_DEFAULT → 算出每一格要放哪個宮位（格子＝地支、內容＝宮位）
   * horoscope 可選：yearlyDestinyPalace 或 yearly.palace / yearlyBranch 用於標示「流年命宮」
   *
   * @param {Object} ziwei 紫微命盤資料
   * @param {Object} horoscope 流年／大限資料（可選，含 yearlyDestinyPalace 或 yearly.palace / yearlyBranch）
   * @param {Object} options 選項（可選，包含 bazi 和 gender 用於計算大限旋轉方向）
   * @returns {Array} 宮位槽位陣列
   */
  function buildSlotsFromZiwei(ziwei, horoscope, options = {}) {
    if (!ziwei) return [];

    // 若後端沒給或給了非 12 地支的值，就 fallback 到「寅」
    let mingBranch = ziwei?.core?.minggongBranch || "寅";
    const shenBranch = ziwei?.core?.shengongBranch || null;

    let mingIdx = BRANCH_RING.indexOf(mingBranch);
    if (mingIdx < 0) {
      mingIdx = 0;
      mingBranch = BRANCH_RING[0];
    }

    const palaceOrder = PALACE_DEFAULT;
    // 流年命宮：優先 API 回傳，否則依當年地支＋命宮地支推算（與 worker 一致）
    let yearlyDestinyPalace =
      horoscope?.yearlyDestinyPalace ??
      (horoscope?.yearly?.palace != null ? horoscope.yearly.palace : null) ??
      (horoscope?.yearlyBranch && mingBranch ? computeYearlyDestinyPalace(horoscope.yearlyBranch, mingBranch) : null);
    if (!yearlyDestinyPalace && mingBranch && (horoscope != null || options.targetYear != null)) {
      const y = options.targetYear != null ? options.targetYear : new Date().getFullYear();
      const BRANCHES_BY_YEAR = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];
      const yearlyBranch = BRANCHES_BY_YEAR[((y - 2020) % 12 + 12) % 12];
      yearlyDestinyPalace = computeYearlyDestinyPalace(yearlyBranch, mingBranch);
    }
    const activeLimitPalace = (window.CalcHelpers?.normalizePalaceName && yearlyDestinyPalace) ? window.CalcHelpers.normalizePalaceName(yearlyDestinyPalace) : yearlyDestinyPalace;
    
    // 獲取命宮索引（mingBranch 已在上面声明）
    const mingPalaceIndex = 0; // 命宮在 PALACE_DEFAULT 中的索引固定為 0
    
    // 計算大限年齡區間（基礎）
    const wuxingju = ziwei?.core?.wuxingju || "金四局";
    const baseStartAge = getStartAgeFromWuxingju(wuxingju);
    const span = 10; // 每大限10年
    
    // 根據命宮陰陽和性別確定大限旋轉方向
    const gender = options?.gender || null;
    // 初始化為陣列，每個索引對應一個宮位的大限年齡區間
    let decadalLimits = new Array(12).fill(null).map(() => ({ start: 0, end: 9 }));
    
    if (gender) {
      // 獲取大限行進方向（+1 順行，-1 逆行）；getMajorLuckDirection 需傳 branchYinYang（"yang"/"yin"），非地支
      const yangBranches = ["寅", "午", "戌", "申", "子", "辰"];
      const yinBranches = ["巳", "酉", "丑", "亥", "卯", "未"];
      const branchYinYang = yangBranches.includes(mingBranch) ? "yang" : (yinBranches.includes(mingBranch) ? "yin" : "yang");
      const directionSign = getMajorLuckDirection(gender, branchYinYang);
      
      // 為每個大限（k = 0..11）計算對應的宮位索引和年齡區間
      for (let k = 0; k < 12; k++) {
        const startAge = baseStartAge + k * span;
        const endAge = startAge + span - 1;
        
        // 計算大限宮位索引：從命宮開始，根據方向循環
        const N = 12;
        const palaceIndex = (mingPalaceIndex + directionSign * k + N * 10) % N;
        
        // 將年齡區間分配到對應的宮位
        decadalLimits[palaceIndex] = { start: startAge, end: endAge };
      }
    } else {
      // 如果沒有性別，預設順行（與多數陽男一致，避免大限年與局數錯位）
      const directionSign = 1; // 預設順行
      for (let k = 0; k < 12; k++) {
        const startAge = baseStartAge + k * span;
        const endAge = startAge + span - 1;
        const N = 12;
        const palaceIndex = (mingPalaceIndex + directionSign * k + N * 10) % N;
        decadalLimits[palaceIndex] = { start: startAge, end: endAge };
      }
    }

    return BRANCH_RING.map((branch, idx) => {
      const palaceIndex = (mingIdx - idx + 12) % 12;
      const palaceName = palaceOrder[palaceIndex];

      const rawStars = getStarsForPalace(ziwei, palaceName);
      const stars = rawStars.map(toTraditionalStarName);

      let palaceMainElement = "";
      if (stars.length) {
        palaceMainElement = STAR_WUXING_MAP[stars[0]] || "";
      }

      const isActiveLimit = activeLimitPalace != null && palaceName === activeLimitPalace;
      // 使用根據旋轉方向調整後的大限年齡區間
      const decadalLimit = decadalLimits[palaceIndex] || { start: 0, end: 9 };

      return {
        index: idx,
        branch,
        palaceName,
        stars,
        isMing: branch === mingBranch,
        isShen: shenBranch ? branch === shenBranch : false,
        mainElement: palaceMainElement,
        isActiveLimit,
        decadalLimit,
      };
    });
  }

  // ====== EXPOSE ======
  const Calc = Object.freeze({
    computeDynamicTactics,
    PALACE_DEFAULT,
    PALACE_KEY_MAP,
    gridAreas,
    BRANCH_RING,
    STAR_WUXING_MAP,
    CANGGAN_DATA,
    FIVE_ELEMENTS_ORDER,
    SHICHEN_ORDER,
    SHICHEN_TO_HOUR,
    SHICHEN_START_HOUR,

    pad2,
    resolveBirthTime,
    toTraditionalStarName,
    getStarsForPalace,
    pctFromWx,
    normalizeWxByMax,
    generateFiveElementComment,
    generateFiveElementDiagnosis,
    getPoYenBoard,
    toEnergyLevelsFromWx,
    computeRelatedPalaces,
    getHoroscopeFromAge,
    getMutagenStars,
    getSiHuaWeights,
    getPalaceScoreWithWeights,
    computePalaceBaseScore,
    computeAllPalaceScores,
    buildSlotsFromZiwei,
    computeDynamicTactics,
    // L9 導出
    finalizeStarRating,
    generateMonthStrategyTag,
    mapScoreToStarRating,
    mapScoreToInternalLevel,
    mapInternalLevelToDisplayStars,
    // 流月星等計算
    computeMonthlyStarRating,
    parseMonthFromRange,
    // 流月 fallback
    buildLiuyue2026Fallback,
    // 五行比例（供 fallback 使用）
    computeZiweiElementRatios,
  });

  if (typeof window !== "undefined") {
    window.Calc = Calc;
  } else if (typeof globalThis !== "undefined") {
    // 讓 Node / 測試環境也能引用（非必要，但更穩定）
    globalThis.Calc = Calc;
  }
})();

