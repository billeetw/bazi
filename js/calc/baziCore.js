/* calc/baziCore.js
 * 八字核心計算模組
 * 提供命宮、宮位、大限等核心計算函數
 * 依賴: calc/constants.js, calc/helpers.js
 */

(function () {
  "use strict";

  // 檢查依賴
  if (typeof window === "undefined") {
    throw new Error("calc/baziCore.js requires browser environment (window object)");
  }
  if (!window.CalcConstants) {
    throw new Error("calc/baziCore.js requires calc/constants.js to be loaded first. Please ensure constants.js is loaded before baziCore.js.");
  }
  if (!window.CalcHelpers) {
    throw new Error("calc/baziCore.js requires calc/helpers.js to be loaded first. Please ensure helpers.js is loaded before baziCore.js.");
  }

  // 從 constants.js 解構需要的常數（使用安全解構）
  const CalcConstants = window.CalcConstants;
  const STEMS = CalcConstants.STEMS;
  const BRANCH_ORDER = CalcConstants.BRANCH_ORDER;
  const BRANCH_RING = CalcConstants.BRANCH_RING;
  const PALACE_DEFAULT = CalcConstants.PALACE_DEFAULT;

  // 從 helpers.js 解構需要的函數（使用安全解構）
  const CalcHelpers = window.CalcHelpers;
  const resolveBirthTime = CalcHelpers.resolveBirthTime;

  /**
   * 獲取命宮天干
   * @param {string|Object} mingBranchOrBazi - 命宮地支或八字數據
   * @param {string} [yearStem] - 年干（如果第一個參數是地支）
   * @returns {string} 命宮天干
   */
  function getMinggongStem(mingBranchOrBazi, yearStem) {
    // 處理兩種調用方式
    if (typeof mingBranchOrBazi === 'object' && mingBranchOrBazi !== null) {
      // 舊方式：傳八字數據
      const bazi = mingBranchOrBazi;
      if (!bazi || !bazi.day) return null;
      return bazi.day.stem || null;
    } else {
      // 新方式：傳命宮地支和年干
      const mingBranch = mingBranchOrBazi;
      if (!mingBranch || !yearStem) return null;
      // 簡化計算：根據命宮地支和年干計算命宮天干
      const branchIndex = BRANCH_ORDER[mingBranch];
      const stemIndex = STEMS.indexOf(yearStem);
      if (branchIndex === undefined || stemIndex < 0) return null;
      const mingStemIndex = (stemIndex + branchIndex) % STEMS.length;
      return STEMS[mingStemIndex];
    }
  }

  /**
   * 獲取指定宮位的天干
   * @param {string|Object} mingStemOrBazi - 命宮天干或八字數據
   * @param {string|number} palaceNameOrIndex - 宮位名稱或索引
   * @returns {string} 宮位天干
   */
  function getPalaceStem(mingStemOrBazi, palaceNameOrIndex) {
    // 處理兩種調用方式
    if (typeof mingStemOrBazi === 'object' && mingStemOrBazi !== null) {
      // 舊方式：傳八字數據和宮位名稱
      const bazi = mingStemOrBazi;
      const palaceName = palaceNameOrIndex;
      if (!bazi || !palaceName) return null;
      const palaceIndex = PALACE_DEFAULT.indexOf(palaceName);
      if (palaceIndex < 0) return null;
      
      const dayStemIndex = STEMS.indexOf(bazi?.day?.stem || '');
      if (dayStemIndex < 0) return null;
      
      const stemIndex = (dayStemIndex + palaceIndex) % STEMS.length;
      return STEMS[stemIndex];
    } else {
      // 新方式：傳命宮天干和宮位索引
      const mingStem = mingStemOrBazi;
      const palaceIndex = typeof palaceNameOrIndex === 'number' 
        ? palaceNameOrIndex 
        : PALACE_DEFAULT.indexOf(palaceNameOrIndex);
      if (!mingStem || palaceIndex < 0) return null;
      
      const mingStemIndex = STEMS.indexOf(mingStem);
      if (mingStemIndex < 0) return null;
      
      const stemIndex = (mingStemIndex + palaceIndex) % STEMS.length;
      return STEMS[stemIndex];
    }
  }

  /**
   * 獲取大限列表
   * @param {string|Object} wuxingjuOrParams - 五行局字符串或參數對象
   * @param {string} [mingBranch] - 命宮地支（如果第一個參數是五行局）
   * @param {number} [mingPalaceIndex] - 命宮索引（如果第一個參數是五行局）
   * @param {string} [gender] - 性別（如果第一個參數是五行局）
   * @returns {Array} 大限列表
   */
  function getDecadalLimits(wuxingjuOrParams, mingBranch, mingPalaceIndex, gender) {
    // 處理參數：支持舊的調用方式（只傳五行局）和新的調用方式（傳參數對象）
    let params;
    let wuxingjuStr = "金四局";
    if (typeof wuxingjuOrParams === 'object' && wuxingjuOrParams !== null && !Array.isArray(wuxingjuOrParams)) {
      params = wuxingjuOrParams;
      wuxingjuStr = params.wuxingju || (params.core?.wuxingju) || wuxingjuStr;
    } else {
      wuxingjuStr = typeof wuxingjuOrParams === 'string' ? wuxingjuOrParams : wuxingjuStr;
      params = {
        mingBranch: mingBranch || "寅",
        mingPalaceIndex: mingPalaceIndex !== undefined ? mingPalaceIndex : 0,
        gender: gender || null,
      };
    }
    
    const { mingBranch: mb, mingPalaceIndex: mpi, gender: g } = params;
    const N = 12;
    const baseStartAge = getStartAgeFromWuxingju(wuxingjuStr);
    const span = 10;
    
    // 判斷命宮陰陽
    const yangBranches = ["寅", "午", "戌", "申", "子", "辰"];
    const yinBranches = ["巳", "酉", "丑", "亥", "卯", "未"];
    const branchYinYang = yangBranches.includes(mb) ? "yang" : 
                          yinBranches.includes(mb) ? "yin" : "yang";
    
    // 決定大限行進方向（陽男陰女順行，陰男陽女逆行）
    const isMale = g === "male" || g === "M" || g === "男";
    const directionSign = ((isMale && branchYinYang === "yang") || 
                          (!isMale && branchYinYang === "yin")) ? +1 : -1;
    
    const result = [];
    for (let k = 0; k < N; k++) {
      const startAge = baseStartAge + k * span;
      const endAge = startAge + span - 1;
      const palaceIndex = (mpi + directionSign * k + N * 10) % N;
      
      result.push({
        index: k,
        palaceIndex,
        startAge,
        endAge,
      });
    }
    
    return result;
  }

  /**
   * 獲取大限行進方向
   * @param {string} gender - 性別
   * @param {string} branchYinYang - 地支陰陽
   * @returns {number} +1 順行, -1 逆行
   */
  function getMajorLuckDirection(gender, branchYinYang) {
    const isMale = gender === "male" || gender === "M" || gender === "男";
    if ((isMale && branchYinYang === "yang") || (!isMale && branchYinYang === "yin")) {
      return +1; // 順行
    }
    return -1; // 逆行
  }

  /**
   * 從五行局獲取起始年齡
   * 水二局=2, 木三局=3, 金四局=4, 土五局=5, 火六局=6
   * @param {string|Object} wuxingju - 五行局字符串（如 "金四局"）或紫微數據
   * @returns {number} 起始年齡
   */
  function getStartAgeFromWuxingju(wuxingju) {
    if (typeof wuxingju === 'object' && wuxingju?.core?.wuxingju) {
      wuxingju = wuxingju.core.wuxingju;
    }
    const s = String(wuxingju || "");
    const m = s.match(/[水木金土火]([二三四五六])局/);
    if (m) {
      const map = { "二": 2, "三": 3, "四": 4, "五": 5, "六": 6 };
      return map[m[1]] ?? 2;
    }
    return 2;
  }

  /**
   * 根據年齡獲取年度索引
   * @param {number} age - 年齡
   * @param {string|Object} wuxingju - 五行局
   * @returns {number} 年度索引
   */
  function getYearlyIndexFromAge(age, wuxingju) {
    const startAge = getStartAgeFromWuxingju(wuxingju);
    return Math.floor((age - startAge) / 10);
  }

  /**
   * 根據年齡獲取小限資料
   * 小限：1歲在命宮，陽男陰女順行、陰男陽女逆行，每年一宮
   * @param {number} age - 年齡
   * @param {Object} ziwei - 紫微數據
   * @param {Object} bazi - 八字數據
   * @param {string} gender - 性別
   * @returns {Object|null} 小限資料
   */
  function getHoroscopeFromAge(age, ziwei, bazi, gender) {
    if (!ziwei || !bazi || age == null || !Number.isFinite(Number(age))) return null;
    
    const mingBranch = ziwei?.core?.minggongBranch || "寅";
    const wuxingju = ziwei?.core?.wuxingju || "金四局";
    const yearlyIndex = getYearlyIndexFromAge(Number(age), wuxingju);
    const palaceOrder = PALACE_DEFAULT;
    
    // 小限宮位：1歲在命宮，依性別與命宮陰陽順/逆行
    const yangBranches = ["寅", "午", "戌", "申", "子", "辰"];
    const yinBranches = ["巳", "酉", "丑", "亥", "卯", "未"];
    const branchYinYang = yangBranches.includes(mingBranch) ? "yang" : 
                          yinBranches.includes(mingBranch) ? "yin" : "yang";
    const isMale = gender === "male" || gender === "M" || gender === "男";
    const directionSign = ((isMale && branchYinYang === "yang") || 
                          (!isMale && branchYinYang === "yin")) ? 1 : -1;
    const minorLimitIndex = (directionSign * (Number(age) - 1) + 120) % 12;
    const activeLimitPalaceName = palaceOrder[minorLimitIndex] || null;
    
    // 小限天干（該宮位天干）與四化
    const yearStem = (bazi?.display?.yG || "").toString().trim();
    const mingStem = getMinggongStem(mingBranch, yearStem);
    const yearlyStem = mingStem ? getPalaceStem(mingStem, minorLimitIndex) : null;
    const getMutagenStarsFn = window.CalcHelpers?.getMutagenStars;
    const mutagenStars = yearlyStem && getMutagenStarsFn ? getMutagenStarsFn(yearlyStem) : {};
    
    return {
      age,
      yearlyIndex,
      activeLimitPalaceName,
      yearlyStem,
      mutagenStars,
      gender,
    };
  }

  // ====== 導出 ======

  if (!window.BaziCore) {
    window.BaziCore = {};
  }

  window.BaziCore = {
    getMinggongStem,
    getPalaceStem,
    getDecadalLimits,
    getMajorLuckDirection,
    getStartAgeFromWuxingju,
    getYearlyIndexFromAge,
    getHoroscopeFromAge,
  };
})();
