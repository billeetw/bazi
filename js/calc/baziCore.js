/* calc/baziCore.js
 * 八字核心计算模块
 * 从 calc.js 中提取，用于模块化架构
 * 依赖 calc/constants.js 和 calc/helpers.js
 */

(function () {
  "use strict";

  // 检查依赖
  if (typeof window === "undefined" || !window.CalcConstants) {
    throw new Error("calc/baziCore.js requires calc/constants.js to be loaded first");
  }
  if (typeof window === "undefined" || !window.CalcHelpers) {
    throw new Error("calc/baziCore.js requires calc/helpers.js to be loaded first");
  }

  // 从 constants.js 解构需要的常数
  const {
    PALACE_DEFAULT,
    STEMS,
    BRANCH_ORDER,
    YIN_STEM_FROM_YEAR,
  } = window.CalcConstants;

  // 从 helpers.js 解构需要的函数
  const {
    getMutagenStars,
  } = window.CalcHelpers;

  /**
   * 判斷年干是否為陽干
   * 陽干：甲、丙、戊、庚、壬
   * 陰干：乙、丁、己、辛、癸
   * @param {string} yearStem 年干（如 "甲"）
   * @returns {boolean} true 為陽干，false 為陰干
   */
  function isYangStem(yearStem) {
    const yangStems = ["甲", "丙", "戊", "庚", "壬"];
    return yangStems.includes(yearStem);
  }

  /**
   * 判斷地支是陰宮還是陽宮
   * 陽宮：寅、午、戌、申、子、辰
   * 陰宮：巳、酉、丑、亥、卯、未
   * @param {string} branch 地支（如 "寅"）
   * @returns {string} "yang" 為陽宮，"yin" 為陰宮
   */
  function getBranchYinYang(branch) {
    const yangBranches = ["寅", "午", "戌", "申", "子", "辰"];
    const yinBranches = ["巳", "酉", "丑", "亥", "卯", "未"];
    
    if (yangBranches.includes(branch)) return "yang";
    if (yinBranches.includes(branch)) return "yin";
    throw new Error("未知地支：" + branch);
  }

  /**
   * 判斷旋轉方向（用於小限）
   * 陽男陰女：順時針（順行）
   * 陰男陽女：逆時針（逆行）
   * @param {string} yearStem 年干（如 "甲"）
   * @param {string} gender 性別（"M"/"男" 或 "F"/"女"）
   * @returns {boolean} true 為順時針，false 為逆時針
   */
  function isClockwise(yearStem, gender) {
    const isYang = isYangStem(yearStem);
    const isMale = gender === "M" || gender === "男";
    // 陽男陰女：順時針
    // 陰男陽女：逆時針
    return (isYang && isMale) || (!isYang && !isMale);
  }

  /**
   * 決定大限行進方向（順行 = +1，逆行 = -1）
   * 規則：陽男陰女順行，陰男陽女逆行
   * @param {string} gender 性別（"M"/"男" 或 "F"/"女"）
   * @param {string} mingBranch 命宮地支（如 "丑"）
   * @returns {number} +1 為順行，-1 為逆行
   */
  function getMajorLuckDirection(gender, mingBranch) {
    const branchYinYang = getBranchYinYang(mingBranch);
    const isMale = gender === "M" || gender === "男";
    const isFemale = gender === "F" || gender === "女";
    
    // 陽男陰女順行，陰男陽女逆行
    if ((isMale && branchYinYang === "yang") ||
        (isFemale && branchYinYang === "yin")) {
      return +1; // 順行
    } else {
      return -1; // 逆行
    }
  }

  /**
   * 依年齡、性別與年干計算年支索引（0-11，對應子到亥）
   * 根據陽男陰女（順行）和陰男陽女（逆行）的規則
   * @param {number} age 年齡
   * @param {string} gender 性別（"M"/"男" 或 "F"/"女"）
   * @param {string} yearStem 年干（如 "甲"）
   * @returns {number} 年支索引（0-11）
   */
  function getYearlyIndexFromAge(age, gender, yearStem) {
    const a = Math.max(1, Number(age) || 1);
    const n = (a - 1) % 12;
    const clockwise = isClockwise(yearStem, gender);
    // 順時針：直接使用 n
    // 逆時針：使用 (12 - n) % 12
    return clockwise ? n : (12 - n) % 12;
  }

  /**
   * 命宮地支 + 年干 → 命宮天干（寅宮天干 + 地支序）
   * @param {string} mingBranch 命宮地支（如 "寅"）
   * @param {string} yearStem 年干（如 "甲"）
   * @returns {string} 命宮天干
   */
  function getMinggongStem(mingBranch, yearStem) {
    const yinStem = YIN_STEM_FROM_YEAR[yearStem] || "丙";
    const yinIdx = STEMS.indexOf(yinStem);
    const branchIdx = BRANCH_ORDER[mingBranch] ?? 0;
    return STEMS[(yinIdx + branchIdx) % 10];
  }

  /**
   * 命宮天干 + 宮位序 → 該宮天干
   * @param {string} mingStem 命宮天干（如 "甲"）
   * @param {number} palaceIndex 宮位索引（0-11）
   * @returns {string} 該宮天干
   */
  function getPalaceStem(mingStem, palaceIndex) {
    const idx = STEMS.indexOf(mingStem);
    return STEMS[(idx + (palaceIndex % 12)) % 10];
  }

  /**
   * 從五行局字串解析起運歲數（水二局→2, 木三局→3, 金四局→4, 土五局→5, 火六局→6）
   * @param {string} wuxingju 五行局字串（如 "水二局"）
   * @returns {number} 起運歲數（2-6）
   */
  function getStartAgeFromWuxingju(wuxingju) {
    const s = String(wuxingju || "");
    const n = s.match(/(\d)/);
    if (n) return Math.max(2, Math.min(6, Number(n[1])));
    const map = { "二": 2, "三": 3, "四": 4, "五": 5, "六": 6 };
    for (const [k, v] of Object.entries(map)) if (s.includes(k)) return v;
    return 4;
  }

  /**
   * 依五行局算出 12 宮大限年齡區間（每宮 10 年）
   * 回傳 [ { start, end }, ... ] 對應 命宮…父母
   * @param {string} wuxingju 五行局字串（如 "水二局"）
   * @returns {Array<{start: number, end: number}>} 大限年齡區間陣列
   */
  function getDecadalLimits(wuxingju) {
    const startAge = getStartAgeFromWuxingju(wuxingju);
    return PALACE_DEFAULT.map((_, i) => ({
      start: startAge + i * 10,
      end: startAge + i * 10 + 9,
    }));
  }

  /**
   * 依當前年齡、性別與命盤推算小限與四化（可與後端 iztro horoscope 並用）
   * 回傳 { yearlyIndex, yearlyStem, mutagenStars, activeLimitPalaceName }
   * @param {number} age 年齡
   * @param {string} gender 性別（"M"/"男" 或 "F"/"女"）
   * @param {Object} ziwei 紫微命盤資料
   * @param {Object} bazi 八字資料
   * @returns {Object} 小限資料 { yearlyIndex, yearlyStem, mutagenStars, activeLimitPalaceName }
   */
  function getHoroscopeFromAge(age, gender, ziwei, bazi) {
    const yearStem = (bazi?.display?.yG || "").toString().trim();
    const mingBranch = ziwei?.core?.minggongBranch || "寅";
    const mingStem = getMinggongStem(mingBranch, yearStem);
    // 修正：根據年干陰陽和性別計算旋轉方向
    const yearlyIndex = getYearlyIndexFromAge(age, gender, yearStem);
    const yearlyStem = getPalaceStem(mingStem, yearlyIndex);
    const mutagenStars = getMutagenStars(yearlyStem);
    const activeLimitPalaceName = PALACE_DEFAULT[yearlyIndex];
    return { yearlyIndex, yearlyStem, mutagenStars, activeLimitPalaceName };
  }

  // ====== 導出 ======

  // 導出到 window.BaziCore（如果 window 存在）
  if (typeof window !== "undefined") {
    window.BaziCore = {
      isYangStem,
      getBranchYinYang,
      isClockwise,
      getMajorLuckDirection,
      getYearlyIndexFromAge,
      getMinggongStem,
      getPalaceStem,
      getStartAgeFromWuxingju,
      getDecadalLimits,
      getHoroscopeFromAge,
    };
  } else if (typeof globalThis !== "undefined") {
    globalThis.BaziCore = {
      isYangStem,
      getBranchYinYang,
      isClockwise,
      getMajorLuckDirection,
      getYearlyIndexFromAge,
      getMinggongStem,
      getPalaceStem,
      getStartAgeFromWuxingju,
      getDecadalLimits,
      getHoroscopeFromAge,
    };
  }
})(); (typeof window !== "undefined") {
    window.BaziCore = {
      getYearlyIndexFromAge,
      getMinggongStem,
      getPalaceStem,
      getStartAgeFromWuxingju,
      getDecadalLimits,
      getHoroscopeFromAge,
      isYangStem,
      isClockwise,
    };
  } else if (typeof globalThis !== "undefined") {
    // 讓 Node / 測試環境也能引用
    globalThis.BaziCore = {
      getYearlyIndexFromAge,
      getMinggongStem,
      getPalaceStem,
      getStartAgeFromWuxingju,
      getDecadalLimits,
      getHoroscopeFromAge,
      isYangStem,
      isClockwise,
    };
  }
})();
