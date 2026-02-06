/* calc/fourTransformations.js
 * 四化系統完整化模組
 * 實現本命、大限、流年、小限四層四化計算
 * 依賴: calc/constants.js, calc/helpers.js, calc/baziCore.js
 */

(function () {
  "use strict";

  // 檢查依賴
  if (typeof window === "undefined") {
    throw new Error("calc/fourTransformations.js requires browser environment (window object)");
  }
  if (!window.CalcConstants) {
    throw new Error("calc/fourTransformations.js requires calc/constants.js to be loaded first. Please ensure constants.js is loaded before fourTransformations.js.");
  }
  if (!window.CalcHelpers) {
    throw new Error("calc/fourTransformations.js requires calc/helpers.js to be loaded first. Please ensure helpers.js is loaded before fourTransformations.js.");
  }
  if (!window.BaziCore) {
    throw new Error("calc/fourTransformations.js requires calc/baziCore.js to be loaded first. Please ensure baziCore.js is loaded before fourTransformations.js.");
  }

  // 從 constants.js 解構需要的常數
  const {
    STEMS,
    BRANCH_ORDER,
    YIN_STEM_FROM_YEAR,
  } = window.CalcConstants;

  // 從 helpers.js 解構需要的函數
  const {
    getMutagenStars,
    getSiHuaWeights,
    getStarsForPalace: getStarsForPalaceHelper,
    toTraditionalStarName: toTraditionalStarNameHelper,
  } = window.CalcHelpers;

  // 從 baziCore.js 解構需要的函數
  const {
    getMinggongStem,
    getPalaceStem,
    getDecadalLimits,
    getMajorLuckDirection,
    getStartAgeFromWuxingju,
  } = window.BaziCore;

  // 包裝函數以處理依賴（用於 findStarPalace，需要在文件頂部定義）
  function getStarsForPalace(ziwei, palaceName) {
    if (getStarsForPalaceHelper) {
      return getStarsForPalaceHelper(ziwei, palaceName);
    }
    return [];
  }

  function toTraditionalStarName(star) {
    if (!star) return '';
    
    // 如果已經是字符串，直接轉換
    if (typeof star === 'string') {
      if (toTraditionalStarNameHelper) {
        return toTraditionalStarNameHelper(star);
      }
      // 如果沒有 helper，使用映射表
      const STAR_NAME_TRAD_MAP = window.CalcConstants?.STAR_NAME_TRAD_MAP || {};
      return STAR_NAME_TRAD_MAP[star] || star;
    }
    
    // 如果是對象，提取名稱
    if (typeof star === 'object') {
      const name = star.name || star.id || star;
      if (toTraditionalStarNameHelper) {
        return toTraditionalStarNameHelper(name);
      }
      const STAR_NAME_TRAD_MAP = window.CalcConstants?.STAR_NAME_TRAD_MAP || {};
      return STAR_NAME_TRAD_MAP[name] || name;
    }
    
    return String(star);
  }

  /**
   * 計算流年天干（基於當前年份）
   * @param {number} year 年份（如 2026）
   * @returns {string} 流年天干（甲、乙、丙...）
   */
  function computeLiunianStem(year) {
    // 天干循環：每10年一循環
    // 1984年是甲子年（天干索引0），以此為基準
    const BASE_YEAR = 1984;
    const BASE_STEM_INDEX = 0; // 甲
    
    const yearDiff = year - BASE_YEAR;
    const stemIndex = (BASE_STEM_INDEX + yearDiff) % 10;
    // 處理負數情況
    const finalIndex = stemIndex >= 0 ? stemIndex : stemIndex + 10;
    return STEMS[finalIndex];
  }

  /**
   * 計算流年地支（基於當前年份）
   * @param {number} year 年份（如 2026）
   * @returns {string} 流年地支（子、丑、寅...）
   */
  function computeLiunianBranch(year) {
    // 地支循環：每12年一循環
    // 1984年是甲子年（地支索引0），以此為基準
    const BASE_YEAR = 1984;
    const BASE_BRANCH_INDEX = 0; // 子
    
    const yearDiff = year - BASE_YEAR;
    const branchIndex = (BASE_BRANCH_INDEX + yearDiff) % 12;
    // 處理負數情況
    const finalIndex = branchIndex >= 0 ? branchIndex : branchIndex + 12;
    const BRANCHES = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];
    return BRANCHES[finalIndex];
  }

  /**
   * 計算流年宮位（基於流年地支與命宮地支的相對位置）
   * @param {string} liunianBranch 流年地支
   * @param {string} mingBranch 命宮地支
   * @returns {string} 流年宮位名稱（繁體）
   */
  function computeLiunianPalace(liunianBranch, mingBranch) {
    const PALACE_DEFAULT = window.CalcConstants.PALACE_DEFAULT || [
      "命宮", "兄弟", "夫妻", "子女", "財帛", "疾厄",
      "遷移", "僕役", "官祿", "田宅", "福德", "父母"
    ];
    
    // 計算流年地支相對於命宮地支的位置
    const mingIndex = BRANCH_ORDER[mingBranch] ?? 0;
    const liunianIndex = BRANCH_ORDER[liunianBranch] ?? 0;
    
    // 流年宮位 = 命宮 + (流年地支 - 命宮地支) 的相對位置
    const offset = (liunianIndex - mingIndex + 12) % 12;
    
    return PALACE_DEFAULT[offset] || "命宮";
  }

  /**
   * 計算當前大限的天干
   * @param {Object} bazi 八字資料
   * @param {Object} ziwei 紫微命盤資料
   * @param {number} age 當前年齡
   * @returns {string|null} 大限天干（甲、乙、丙...），如果無法計算則返回 null
   */
  function computeDalimitStem(bazi, ziwei, age) {
    if (!bazi || !ziwei) return null;
    
    const yearStem = (bazi?.display?.yG || "").toString().trim();
    if (!yearStem) return null;
    
    const mingBranch = ziwei?.core?.minggongBranch || "寅";
    const mingStem = getMinggongStem(mingBranch, yearStem);
    
    // 獲取五行局
    const wuxingju = ziwei?.core?.wuxingju || "金四局";
    const decadalLimits = getDecadalLimits(wuxingju);
    
    // 找出當前年齡所在的大限
    let currentLimitIndex = -1;
    for (let i = 0; i < decadalLimits.length; i++) {
      if (age >= decadalLimits[i].start && age <= decadalLimits[i].end) {
        currentLimitIndex = i;
        break;
      }
    }
    
    if (currentLimitIndex < 0) return null;
    
    // 大限天干 = 命宮天干 + 大限宮位索引
    const dalimitStem = getPalaceStem(mingStem, currentLimitIndex);
    return dalimitStem;
  }

  /**
   * 計算當前大限的宮位名稱
   * 根據「命宮陰陽 + 性別」決定方向：陽男陰女順行，陰男陽女逆行
   * @param {Object} ziwei 紫微命盤資料
   * @param {number} age 當前年齡
   * @param {Object} bazi 八字資料（可選，用於備用）
   * @param {string} gender 性別（"M"/"男" 或 "F"/"女"）
   * @returns {string|null} 大限宮位名稱（繁體），如果無法計算則返回 null
   */
  function computeDalimitPalace(ziwei, age, bazi, gender) {
    if (!ziwei) return null;
    
    const PALACE_DEFAULT = window.CalcConstants.PALACE_DEFAULT || [
      "命宮", "兄弟", "夫妻", "子女", "財帛", "疾厄",
      "遷移", "僕役", "官祿", "田宅", "福德", "父母"
    ];
    
    // 獲取命宮地支和索引
    const mingBranch = ziwei?.core?.minggongBranch || "寅";
    const mingPalaceIndex = 0; // 命宮在 PALACE_DEFAULT 中的索引固定為 0
    
    // 獲取五行局，計算大限起始年齡
    const wuxingju = ziwei?.core?.wuxingju || "金四局";
    const baseStartAge = getStartAgeFromWuxingju(wuxingju);
    const span = 10; // 每大限10年
    
    // 找出當前年齡所在的大限索引（k，從0開始）
    let k = -1;
    for (let i = 0; i < 12; i++) {
      const startAge = baseStartAge + i * span;
      const endAge = startAge + span - 1;
      if (age >= startAge && age <= endAge) {
        k = i;
        break;
      }
    }
    
    if (k < 0) return null;
    
    // 根據命宮陰陽和性別確定大限行進方向
    if (!gender) return null;
    
    const directionSign = getMajorLuckDirection(gender, mingBranch);
    
    // 計算大限宮位索引：從命宮開始，根據方向循環
    const N = 12;
    const palaceIndex = (mingPalaceIndex + directionSign * k + N * 10) % N;
    
    return PALACE_DEFAULT[palaceIndex] || "命宮";
  }

  /**
   * 計算本命四化（基於生年天干）
   * @param {string} yearStem 生年天干（甲、乙、丙...）
   * @returns {Object} { mutagenStars: { 祿, 權, 科, 忌 }, weights: { 星名: 分數 } }
   */
  function computeBenmingSiHua(yearStem) {
    if (!yearStem) {
      return { mutagenStars: {}, weights: {} };
    }
    
    const mutagenStars = getMutagenStars(yearStem);
    const weights = getSiHuaWeights(yearStem);
    
    return {
      stem: yearStem,
      mutagenStars,
      weights,
      type: 'benming'
    };
  }

  /**
   * 計算大限四化（基於大限天干）
   * @param {Object} bazi 八字資料
   * @param {Object} ziwei 紫微命盤資料
   * @param {number} age 當前年齡
   * @param {string} gender 性別（"M"/"男" 或 "F"/"女"）
   * @returns {Object} { stem, mutagenStars, weights, palace, type }
   */
  function computeDalimitSiHua(bazi, ziwei, age, gender) {
    const dalimitStem = computeDalimitStem(bazi, ziwei, age);
    const dalimitPalace = computeDalimitPalace(ziwei, age, bazi, gender);
    
    if (!dalimitStem) {
      return { stem: null, mutagenStars: {}, weights: {}, palace: null, type: 'dalimit' };
    }
    
    const mutagenStars = getMutagenStars(dalimitStem);
    const weights = getSiHuaWeights(dalimitStem);
    
    return {
      stem: dalimitStem,
      mutagenStars,
      weights,
      palace: dalimitPalace,
      type: 'dalimit'
    };
  }

  /**
   * 計算流年四化（基於流年天干）
   * @param {number} year 年份（如 2026）
   * @param {string} mingBranch 命宮地支（用於計算流年宮位）
   * @returns {Object} { stem, branch, mutagenStars, weights, palace, type }
   */
  function computeLiunianSiHua(year, mingBranch) {
    const liunianStem = computeLiunianStem(year);
    const liunianBranch = computeLiunianBranch(year);
    const liunianPalace = computeLiunianPalace(liunianBranch, mingBranch || "寅");
    
    const mutagenStars = getMutagenStars(liunianStem);
    const weights = getSiHuaWeights(liunianStem);
    
    return {
      stem: liunianStem,
      branch: liunianBranch,
      mutagenStars,
      weights,
      palace: liunianPalace,
      type: 'liunian'
    };
  }

  /**
   * 計算小限四化（基於小限天干，已有實現）
   * @param {Object} horoscope 小限資料（來自 getHoroscopeFromAge）
   * @returns {Object} { stem, mutagenStars, weights, palace, type }
   */
  function computeXiaoxianSiHua(horoscope) {
    if (!horoscope || !horoscope.yearlyStem) {
      return { stem: null, mutagenStars: {}, weights: {}, palace: null, type: 'xiaoxian' };
    }
    
    return {
      stem: horoscope.yearlyStem,
      mutagenStars: horoscope.mutagenStars || {},
      weights: getSiHuaWeights(horoscope.yearlyStem),
      palace: horoscope.activeLimitPalaceName || null,
      type: 'xiaoxian'
    };
  }

  /**
   * 計算完整的四化系統（本命、大限、流年、小限）
   * @param {Object} params 參數
   * @param {Object} params.bazi 八字資料
   * @param {Object} params.ziwei 紫微命盤資料
   * @param {Object} params.horoscope 小限資料（來自 getHoroscopeFromAge）
   * @param {number} params.age 當前年齡
   * @param {number} params.currentYear 當前年份（預設為當前系統年份）
   * @returns {Object} 完整的四化資料
   */
  function computeFourTransformations(params) {
    const {
      bazi,
      ziwei,
      horoscope,
      age,
      currentYear = new Date().getFullYear()
    } = params || {};

    const yearStem = (bazi?.display?.yG || "").toString().trim();
    const mingBranch = ziwei?.core?.minggongBranch || "寅";

    // 獲取性別（從 horoscope 或其他來源）
    const gender = params.gender || (horoscope?.gender) || null;
    
    // 計算各層四化
    const benming = computeBenmingSiHua(yearStem);
    const dalimit = computeDalimitSiHua(bazi, ziwei, age, gender);
    const liunian = computeLiunianSiHua(currentYear, mingBranch);
    const xiaoxian = computeXiaoxianSiHua(horoscope);

    // 合併所有四化權重（用於宮位評分）
    const combinedWeights = {};
    
    // 本命四化權重（基礎，權重1.0）
    Object.keys(benming.weights || {}).forEach(star => {
      combinedWeights[star] = (combinedWeights[star] || 0) + (benming.weights[star] || 0) * 1.0;
    });
    
    // 大限四化權重（權重0.8）
    Object.keys(dalimit.weights || {}).forEach(star => {
      combinedWeights[star] = (combinedWeights[star] || 0) + (dalimit.weights[star] || 0) * 0.8;
    });
    
    // 流年四化權重（權重0.6）
    Object.keys(liunian.weights || {}).forEach(star => {
      combinedWeights[star] = (combinedWeights[star] || 0) + (liunian.weights[star] || 0) * 0.6;
    });
    
    // 小限四化權重（權重0.4）
    Object.keys(xiaoxian.weights || {}).forEach(star => {
      combinedWeights[star] = (combinedWeights[star] || 0) + (xiaoxian.weights[star] || 0) * 0.4;
    });

    return {
      benming,
      dalimit,
      liunian,
      xiaoxian,
      combinedWeights,
      summary: {
        benmingStem: benming.stem,
        dalimitStem: dalimit.stem,
        dalimitPalace: dalimit.palace,
        liunianStem: liunian.stem,
        liunianBranch: liunian.branch,
        liunianPalace: liunian.palace,
        xiaoxianStem: xiaoxian.stem,
        xiaoxianPalace: xiaoxian.palace,
      }
    };
  }

  /**
   * 計算疊宮與引爆（Overlap & Resonance）
   * 當不同層級的四化落在同一個宮位時，會產生「共振」效應
   * 
   * 權重分配：
   * - 本命四化：1.0（基礎影響）
   * - 大限四化：1.5（這十年最有感）
   * - 流年四化：2.0（當下反應最直接）
   * - 小限四化：1.0（個人化年度影響）
   * 
   * 檢測規則：
   * - 若同一宮位內同時出現兩個以上的『化忌』，標記為 CRITICAL_RISK
   * - 若出現兩個以上『化祿』，標記為 MAX_OPPORTUNITY
   * 
   * @param {Object} fourTransformations 完整四化系統資料（來自 computeFourTransformations）
   * @param {Object} ziwei 紫微命盤資料（用於獲取宮位信息）
   * @returns {Object} 疊宮分析結果
   */
  function calculateOverlapTransformations(fourTransformations, ziwei) {
    if (!fourTransformations) {
      return {
        palaceMap: new Map(),
        criticalRisks: [],
        maxOpportunities: [],
        summary: {}
      };
    }

    const PALACE_DEFAULT = window.CalcConstants?.PALACE_DEFAULT || [
      "命宮", "兄弟", "夫妻", "子女", "財帛", "疾厄",
      "遷移", "僕役", "官祿", "田宅", "福德", "父母"
    ];

    // Data Store: 建立一個 Map，Key 是 12 宮位
    const palaceMap = new Map();
    
    // 初始化所有宮位
    PALACE_DEFAULT.forEach(palace => {
      palaceMap.set(palace, {
        palace: palace,
        transformations: {
          benming: null,  // { type: '祿'|'權'|'科'|'忌', star: '星名', weight: 1.0 }
          dalimit: null,  // { type: '祿'|'權'|'科'|'忌', star: '星名', weight: 1.5 }
          liunian: null,  // { type: '祿'|'權'|'科'|'忌', star: '星名', weight: 2.0 }
          xiaoxian: null // { type: '祿'|'權'|'科'|'忌', star: '星名', weight: 1.0 }
        },
        luCount: 0,      // 化祿數量
        quanCount: 0,    // 化權數量
        keCount: 0,      // 化科數量
        jiCount: 0,      // 化忌數量
        totalWeight: 0,  // 總權重
        riskLevel: 'normal', // 'normal' | 'warning' | 'critical'
        opportunityLevel: 'normal', // 'normal' | 'good' | 'max'
        resonance: []    // 共振描述
      });
    });

    // Inject Natal: 依生年天干注入本命四化，權重為 1.0
    const benming = fourTransformations.benming;
    let benmingInjected = 0;
    if (benming && benming.mutagenStars) {
      Object.keys(benming.mutagenStars).forEach(type => {
        const star = benming.mutagenStars[type];
        if (!star) return;
        
        const palace = findStarPalace(star, ziwei);
        if (palace && palaceMap.has(palace)) {
          const palaceData = palaceMap.get(palace);
          palaceData.transformations.benming = {
            type: type,
            star: star,
            weight: 1.0
          };
          updateCounts(palaceData, type, 1.0);
          benmingInjected++;
        } else {
          // 如果找不到星曜所在宮位，記錄警告（但不影響功能）
          console.warn(`[fourTransformations] 無法找到本命四化星曜 ${star} 的所在宮位`);
        }
      });
      console.log(`[fourTransformations] 本命四化注入完成: ${benmingInjected} 個星曜成功注入`);
    } else {
      console.warn(`[fourTransformations] 本命四化數據缺失:`, { benming, hasMutagenStars: !!benming?.mutagenStars });
    }

    // Inject Decadal: 依大限天干注入大限四化，權重為 1.5（這十年最有感）
    // 注意：大限四化應該注入到對應星曜所在的宮位，而不是大限宮位
    const dalimit = fourTransformations.dalimit;
    let dalimitInjected = 0;
    if (dalimit && dalimit.mutagenStars) {
      Object.keys(dalimit.mutagenStars).forEach(type => {
        const star = dalimit.mutagenStars[type];
        if (!star) return;
        
        // 查找星曜所在的宮位（與本命四化邏輯一致）
        const palace = findStarPalace(star, ziwei);
        if (palace && palaceMap.has(palace)) {
          const palaceData = palaceMap.get(palace);
          palaceData.transformations.dalimit = {
            type: type,
            star: star,
            weight: 1.5
          };
          updateCounts(palaceData, type, 1.5);
          dalimitInjected++;
        } else {
          // 如果找不到星曜所在宮位，記錄警告（但不影響功能）
          console.warn(`[fourTransformations] 無法找到大限四化星曜 ${star} 的所在宮位`);
        }
      });
      console.log(`[fourTransformations] 大限四化注入完成: ${dalimitInjected} 個星曜成功注入`);
    } else {
      console.warn(`[fourTransformations] 大限四化數據缺失:`, { dalimit, hasMutagenStars: !!dalimit?.mutagenStars });
    }

    // Inject Annual: 依流年天干注入流年四化，權重為 2.0（當下反應最直接）
    // 注意：流年四化應該注入到對應星曜所在的宮位，而不是流年宮位
    const liunian = fourTransformations.liunian;
    let liunianInjected = 0;
    if (liunian && liunian.mutagenStars) {
      Object.keys(liunian.mutagenStars).forEach(type => {
        const star = liunian.mutagenStars[type];
        if (!star) return;
        
        // 查找星曜所在的宮位（與本命四化邏輯一致）
        const palace = findStarPalace(star, ziwei);
        if (palace && palaceMap.has(palace)) {
          const palaceData = palaceMap.get(palace);
          palaceData.transformations.liunian = {
            type: type,
            star: star,
            weight: 2.0
          };
          updateCounts(palaceData, type, 2.0);
          liunianInjected++;
        } else {
          // 如果找不到星曜所在宮位，記錄警告（但不影響功能）
          console.warn(`[fourTransformations] 無法找到流年四化星曜 ${star} 的所在宮位`);
        }
      });
      console.log(`[fourTransformations] 流年四化注入完成: ${liunianInjected} 個星曜成功注入`);
    } else {
      console.warn(`[fourTransformations] 流年四化數據缺失:`, { liunian, hasMutagenStars: !!liunian?.mutagenStars });
    }

    // Inject Xiaoxian: 小限四化，權重為 1.0（個人化年度影響）
    // 注意：小限四化應該注入到對應星曜所在的宮位，而不是小限宮位
    const xiaoxian = fourTransformations.xiaoxian;
    let xiaoxianInjected = 0;
    if (xiaoxian && xiaoxian.mutagenStars) {
      Object.keys(xiaoxian.mutagenStars).forEach(type => {
        const star = xiaoxian.mutagenStars[type];
        if (!star) return;
        
        // 查找星曜所在的宮位（與本命四化邏輯一致）
        const palace = findStarPalace(star, ziwei);
        if (palace && palaceMap.has(palace)) {
          const palaceData = palaceMap.get(palace);
          palaceData.transformations.xiaoxian = {
            type: type,
            star: star,
            weight: 1.0
          };
          updateCounts(palaceData, type, 1.0);
          xiaoxianInjected++;
        } else {
          // 如果找不到星曜所在宮位，記錄警告（但不影響功能）
          console.warn(`[fourTransformations] 無法找到小限四化星曜 ${star} 的所在宮位`);
        }
      });
      console.log(`[fourTransformations] 小限四化注入完成: ${xiaoxianInjected} 個星曜成功注入`);
    } else {
      console.warn(`[fourTransformations] 小限四化數據缺失:`, { xiaoxian, hasMutagenStars: !!xiaoxian?.mutagenStars });
    }
    
    // 總結注入情況
    console.log(`[fourTransformations] 四化注入總結: 本命${benmingInjected} 大限${dalimitInjected} 流年${liunianInjected} 小限${xiaoxianInjected}`);

    // Detection: 檢測 CRITICAL_RISK、MAX_OPPORTUNITY 和 VOLATILE_AMBIVALENCE
    const criticalRisks = [];
    const maxOpportunities = [];
    const volatileAmbivalences = []; // 劇烈震盪/吉凶並見

    palaceMap.forEach((palaceData, palaceName) => {
      // 檢測化忌疊加（CRITICAL_RISK）
      const hasCriticalRisk = palaceData.jiCount >= 2;
      // 檢測化祿疊加（MAX_OPPORTUNITY）
      const hasMaxOpportunity = palaceData.luCount >= 2;
      
      // 優先檢測：同時有化忌疊加和化祿疊加 → VOLATILE_AMBIVALENCE（劇烈震盪）
      if (hasCriticalRisk && hasMaxOpportunity) {
        palaceData.riskLevel = 'critical';
        palaceData.opportunityLevel = 'max';
        palaceData.resonanceType = 'VOLATILE_AMBIVALENCE';
        
        volatileAmbivalences.push({
          palace: palaceName,
          jiCount: palaceData.jiCount,
          luCount: palaceData.luCount,
          transformations: palaceData.transformations,
          description: generateVolatileAmbivalenceDescription(palaceData, palaceName),
          note: "能量極端對沖。雖有巨大獲利空間，但伴隨系統性崩潰風險。建議：非專業操作者應以防守為主。",
          priority: 1 // 最高優先級
        });
      } else if (hasCriticalRisk) {
        // 只有化忌疊加（CRITICAL_RISK）
        palaceData.riskLevel = 'critical';
        criticalRisks.push({
          palace: palaceName,
          jiCount: palaceData.jiCount,
          transformations: palaceData.transformations,
          description: generateRiskDescription(palaceData, palaceName)
        });
      } else if (palaceData.jiCount === 1) {
        palaceData.riskLevel = 'warning';
      }

      // 檢測化祿疊加（MAX_OPPORTUNITY）- 只有在沒有 CRITICAL_RISK 時才標記
      if (hasMaxOpportunity && !hasCriticalRisk) {
        palaceData.opportunityLevel = 'max';
        maxOpportunities.push({
          palace: palaceName,
          luCount: palaceData.luCount,
          transformations: palaceData.transformations,
          description: generateOpportunityDescription(palaceData, palaceName)
        });
      } else if (palaceData.luCount === 1 && !hasCriticalRisk) {
        palaceData.opportunityLevel = 'good';
      }

      // 生成共振描述
      palaceData.resonance = generateResonanceDescription(palaceData, palaceName);
    });

    return {
      palaceMap: palaceMap,
      criticalRisks: criticalRisks,
      maxOpportunities: maxOpportunities,
      volatileAmbivalences: volatileAmbivalences, // 劇烈震盪/吉凶並見
      summary: {
        totalCriticalRisks: criticalRisks.length,
        totalMaxOpportunities: maxOpportunities.length,
        totalVolatileAmbivalences: volatileAmbivalences.length,
        riskPalaces: criticalRisks.map(r => r.palace),
        opportunityPalaces: maxOpportunities.map(o => o.palace),
        volatilePalaces: volatileAmbivalences.map(v => v.palace)
      }
    };
  }

  /**
   * 輔助函數：根據星曜名稱找到所在宮位
   * @param {string} starName 星曜名稱（繁體）
   * @param {Object} ziwei 紫微命盤資料
   * @returns {string|null} 宮位名稱（繁體），如果找不到則返回 null
   */
  function findStarPalace(starName, ziwei) {
    if (!ziwei || !starName) return null;
    
    const PALACE_DEFAULT = window.CalcConstants?.PALACE_DEFAULT || [
      "命宮", "兄弟", "夫妻", "子女", "財帛", "疾厄",
      "遷移", "僕役", "官祿", "田宅", "福德", "父母"
    ];

    // 標準化輸入的星曜名稱（轉換為繁體）
    const normalizedStarName = toTraditionalStarName(starName);

    // 遍歷所有宮位查找星曜
    for (const palace of PALACE_DEFAULT) {
      try {
        const stars = getStarsForPalace(ziwei, palace);
        if (!stars || !Array.isArray(stars)) continue;
        
        // 將命盤中的星曜轉換為標準化的繁體名稱
        const starNames = stars.map(s => {
          if (typeof s === 'string') {
            return toTraditionalStarName(s);
          } else if (s && typeof s === 'object') {
            // 如果是對象，嘗試獲取 name 屬性
            const name = s.name || s.id || s;
            return toTraditionalStarName(name);
          }
          return toTraditionalStarName(s);
        });
        
        // 直接匹配或通過映射表匹配
        if (starNames.includes(normalizedStarName)) {
          return palace;
        }
        
        // 反向查找：檢查映射表中是否有對應關係
        const STAR_NAME_TRAD_MAP = window.CalcConstants?.STAR_NAME_TRAD_MAP || {};
        for (const [key, value] of Object.entries(STAR_NAME_TRAD_MAP)) {
          if (value === normalizedStarName && starNames.includes(key)) {
            return palace;
          }
          if (key === normalizedStarName && starNames.includes(value)) {
            return palace;
          }
        }
      } catch (err) {
        console.warn(`[fourTransformations] 查找星曜 ${starName} 在 ${palace} 時出錯:`, err);
        continue;
      }
    }

    // 如果找不到，記錄詳細的調試信息
    console.warn(`[fourTransformations] 無法找到星曜 ${starName} (標準化: ${normalizedStarName}) 的所在宮位`);
    console.debug(`[fourTransformations] 調試：檢查所有宮位的星曜分布...`);
    for (const palace of PALACE_DEFAULT) {
      const stars = getStarsForPalace(ziwei, palace);
      if (stars && stars.length > 0) {
        const starNames = stars.map(s => {
          if (typeof s === 'string') return toTraditionalStarName(s);
          if (s && typeof s === 'object') return toTraditionalStarName(s.name || s.id || s);
          return toTraditionalStarName(s);
        });
        console.debug(`  ${palace}: ${starNames.join(', ')}`);
      }
    }

    return null;
  }

  /**
   * 輔助函數：更新宮位的四化計數
   * @param {Object} palaceData 宮位資料
   * @param {string} type 四化類型（'祿'|'權'|'科'|'忌'）
   * @param {number} weight 權重
   */
  function updateCounts(palaceData, type, weight) {
    switch (type) {
      case '祿':
        palaceData.luCount++;
        palaceData.totalWeight += weight;
        break;
      case '權':
        palaceData.quanCount++;
        palaceData.totalWeight += weight;
        break;
      case '科':
        palaceData.keCount++;
        palaceData.totalWeight += weight;
        break;
      case '忌':
        palaceData.jiCount++;
        palaceData.totalWeight -= weight; // 化忌是負面影響
        break;
    }
  }

  /**
   * 生成風險描述（用於 CRITICAL_RISK）
   * @param {Object} palaceData 宮位資料
   * @param {string} palaceName 宮位名稱
   * @returns {string} 風險描述
   */
  function generateRiskDescription(palaceData, palaceName) {
    const transformations = palaceData.transformations;
    const jiParts = [];
    const luParts = [];
    
    // 收集化忌
    if (transformations.benming && transformations.benming.type === '忌') {
      jiParts.push(`本命${transformations.benming.star}化忌`);
    }
    if (transformations.dalimit && transformations.dalimit.type === '忌') {
      jiParts.push(`大限${transformations.dalimit.star}化忌`);
    }
    if (transformations.liunian && transformations.liunian.type === '忌') {
      jiParts.push(`流年${transformations.liunian.star}化忌`);
    }
    if (transformations.xiaoxian && transformations.xiaoxian.type === '忌') {
      jiParts.push(`小限${transformations.xiaoxian.star}化忌`);
    }

    // 收集化禄（如果有，说明是混合情况）
    if (transformations.benming && transformations.benming.type === '祿') {
      luParts.push(`本命${transformations.benming.star}化祿`);
    }
    if (transformations.dalimit && transformations.dalimit.type === '祿') {
      luParts.push(`大限${transformations.dalimit.star}化祿`);
    }
    if (transformations.liunian && transformations.liunian.type === '祿') {
      luParts.push(`流年${transformations.liunian.star}化祿`);
    }
    if (transformations.xiaoxian && transformations.xiaoxian.type === '祿') {
      luParts.push(`小限${transformations.xiaoxian.star}化祿`);
    }

    let description = `${palaceName}宮：${jiParts.join(' + ')}`;
    
    // 如果有化禄叠加，说明是混合情况，但风险优先
    if (luParts.length > 0 && palaceData.luCount >= 2) {
      description += `（同時有${luParts.join(' + ')}，但化忌疊加風險更高）`;
    }
    
    description += ` → 超級地雷區（必須絕對避開）`;
    
    return description;
  }

  /**
   * 生成機會描述（用於 MAX_OPPORTUNITY）
   * @param {Object} palaceData 宮位資料
   * @param {string} palaceName 宮位名稱
   * @returns {string} 機會描述
   */
  function generateOpportunityDescription(palaceData, palaceName) {
    const transformations = palaceData.transformations;
    const parts = [];
    
    if (transformations.benming && transformations.benming.type === '祿') {
      parts.push(`本命${transformations.benming.star}化祿`);
    }
    if (transformations.dalimit && transformations.dalimit.type === '祿') {
      parts.push(`大限${transformations.dalimit.star}化祿`);
    }
    if (transformations.liunian && transformations.liunian.type === '祿') {
      parts.push(`流年${transformations.liunian.star}化祿`);
    }
    if (transformations.xiaoxian && transformations.xiaoxian.type === '祿') {
      parts.push(`小限${transformations.xiaoxian.star}化祿`);
    }

    return `${palaceName}宮：${parts.join(' + ')} → 大發財機會`;
  }

  /**
   * 生成劇烈震盪描述（用於 VOLATILE_AMBIVALENCE）
   * @param {Object} palaceData 宮位資料
   * @param {string} palaceName 宮位名稱
   * @returns {string} 劇烈震盪描述
   */
  function generateVolatileAmbivalenceDescription(palaceData, palaceName) {
    const transformations = palaceData.transformations;
    const jiParts = [];
    const luParts = [];
    
    // 收集化忌
    if (transformations.benming && transformations.benming.type === '忌') {
      jiParts.push(`本命${transformations.benming.star}化忌`);
    }
    if (transformations.dalimit && transformations.dalimit.type === '忌') {
      jiParts.push(`大限${transformations.dalimit.star}化忌`);
    }
    if (transformations.liunian && transformations.liunian.type === '忌') {
      jiParts.push(`流年${transformations.liunian.star}化忌`);
    }
    if (transformations.xiaoxian && transformations.xiaoxian.type === '忌') {
      jiParts.push(`小限${transformations.xiaoxian.star}化忌`);
    }

    // 收集化祿
    if (transformations.benming && transformations.benming.type === '祿') {
      luParts.push(`本命${transformations.benming.star}化祿`);
    }
    if (transformations.dalimit && transformations.dalimit.type === '祿') {
      luParts.push(`大限${transformations.dalimit.star}化祿`);
    }
    if (transformations.liunian && transformations.liunian.type === '祿') {
      luParts.push(`流年${transformations.liunian.star}化祿`);
    }
    if (transformations.xiaoxian && transformations.xiaoxian.type === '祿') {
      luParts.push(`小限${transformations.xiaoxian.star}化祿`);
    }

    return `${palaceName}宮：${jiParts.join(' + ')}（${palaceData.jiCount}重化忌） + ${luParts.join(' + ')}（${palaceData.luCount}重化祿） → 劇烈震盪/吉凶並見（成敗一線間）`;
  }

  /**
   * 生成共振描述（完整的疊宮分析）
   * @param {Object} palaceData 宮位資料
   * @param {string} palaceName 宮位名稱
   * @returns {Array<string>} 共振描述陣列
   */
  function generateResonanceDescription(palaceData, palaceName) {
    const descriptions = [];
    const transformations = palaceData.transformations;
    
    // 檢查是否有任何四化
    const hasAnyTransformation = Object.values(transformations).some(t => t !== null);
    if (!hasAnyTransformation) {
      return descriptions;
    }

    // 生成詳細的共振描述
    const parts = [];
    if (transformations.benming) {
      parts.push(`本命${transformations.benming.star}${transformations.benming.type === '祿' ? '化祿' : transformations.benming.type === '權' ? '化權' : transformations.benming.type === '科' ? '化科' : '化忌'}`);
    }
    if (transformations.dalimit) {
      parts.push(`大限${transformations.dalimit.star}${transformations.dalimit.type === '祿' ? '化祿' : transformations.dalimit.type === '權' ? '化權' : transformations.dalimit.type === '科' ? '化科' : '化忌'}`);
    }
    if (transformations.liunian) {
      parts.push(`流年${transformations.liunian.star}${transformations.liunian.type === '祿' ? '化祿' : transformations.liunian.type === '權' ? '化權' : transformations.liunian.type === '科' ? '化科' : '化忌'}`);
    }
    if (transformations.xiaoxian) {
      parts.push(`小限${transformations.xiaoxian.star}${transformations.xiaoxian.type === '祿' ? '化祿' : transformations.xiaoxian.type === '權' ? '化權' : transformations.xiaoxian.type === '科' ? '化科' : '化忌'}`);
    }

    if (parts.length > 0) {
      descriptions.push(`${palaceName}宮共振：${parts.join('、')}`);
    }

    return descriptions;
  }

  // ====== 導出 ======

  // 導出到 window.FourTransformations（如果 window 存在）
  if (typeof window !== "undefined") {
    window.FourTransformations = {
      computeLiunianStem,
      computeLiunianBranch,
      computeLiunianPalace,
      computeDalimitStem,
      computeDalimitPalace,
      computeBenmingSiHua,
      computeDalimitSiHua,
      computeLiunianSiHua,
      computeXiaoxianSiHua,
      computeFourTransformations,
      calculateOverlapTransformations,
    };
  } else if (typeof globalThis !== "undefined") {
    // 讓 Node / 測試環境也能引用
    globalThis.FourTransformations = {
      computeLiunianStem,
      computeLiunianBranch,
      computeLiunianPalace,
      computeDalimitStem,
      computeDalimitPalace,
      computeBenmingSiHua,
      computeDalimitSiHua,
      computeLiunianSiHua,
      computeXiaoxianSiHua,
      computeFourTransformations,
      calculateOverlapTransformations,
    };
  }
})();
