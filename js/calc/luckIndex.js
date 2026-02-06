/* calc/luckIndex.js
 * 好命指數（Luck Index）演算模組
 * 基於星曜廟旺利陷、吉煞星比例、主星組合評級計算好命指數（0-100分）
 * 依賴: calc/constants.js, calc/helpers.js
 */

(function () {
  "use strict";

  // 檢查依賴
  if (typeof window === "undefined" || !window.CalcConstants) {
    throw new Error("calc/luckIndex.js requires calc/constants.js to be loaded first");
  }
  if (typeof window === "undefined" || !window.CalcHelpers) {
    throw new Error("calc/luckIndex.js requires calc/helpers.js to be loaded first");
  }

  const { PALACE_DEFAULT } = window.CalcConstants;
  const {
    getStarsForPalace,
    toTraditionalStarName,
    getStarWeightConfig,
    getStarBrightness,
  } = window.CalcHelpers;

  /**
   * 亮度狀態權重映射（廟旺利陷加權）
   * Miao: 廟（最佳）→ 1.2
   * Wang: 旺（很好）→ 1.1
   * De: 得地（好）→ 1.0
   * Li: 利地（普通）→ 0.9
   * Ping: 平地（一般）→ 0.8
   * Bu: 不得地（差）→ 0.6
   * Xian: 陷地（最差）→ 0.4
   */
  const BRIGHTNESS_WEIGHTS = {
    "Miao": 1.2,
    "Wang": 1.1,
    "De": 1.0,
    "Li": 0.9,
    "Ping": 0.8,
    "Bu": 0.6,
    "Xian": 0.4
  };

  /**
   * 吉星列表（六吉星 + 其他吉星）
   */
  const AUSPICIOUS_STARS = [
    "左輔", "右弼", "天魁", "天鉞", "文昌", "文曲",
    "祿存", "天馬", "天德", "月德", "台輔", "封誥",
    "龍池", "鳳閣", "三台", "八座", "恩光"
  ];

  /**
   * 煞星列表（六煞星 + 其他煞星）
   */
  const INAUSPICIOUS_STARS = [
    "擎羊", "陀羅", "火星", "鈴星", "地空", "地劫",
    "天刑", "天姚", "陰煞", "蜚廉", "大耗", "病符"
  ];

  /**
   * 主星組合評級映射
   * 根據主星組合的好壞程度評分（0-100）
   */
  const MAIN_STAR_COMBO_RATINGS = {
    // 頂級組合（90-100分）
    "紫微天府": 95,
    "紫微天相": 92,
    "太陽太陰": 90,
    "武曲天府": 90,
    
    // 優秀組合（80-89分）
    "紫微": 88,
    "天府": 85,
    "太陽": 82,
    "太陰": 82,
    "武曲": 80,
    
    // 良好組合（70-79分）
    "天同": 75,
    "天梁": 75,
    "天機": 72,
    "天相": 70,
    
    // 一般組合（60-69分）
    "貪狼": 65,
    "巨門": 63,
    "廉貞": 60,
    
    // 較差組合（50-59分）
    "七殺": 55,
    "破軍": 50
  };

  /**
   * 計算星曜廟旺利陷加權分數
   * @param {Object} ziwei 紫微命盤資料
   * @param {Object} weightsData 權重資料
   * @returns {number} 亮度加權分數（0-100）
   */
  function computeBrightnessWeight(ziwei, weightsData) {
    if (!ziwei || !weightsData) return 50; // 預設值

    let totalWeight = 0;
    let starCount = 0;

    // 遍歷所有宮位
    PALACE_DEFAULT.forEach(palaceName => {
      const stars = getStarsForPalace(ziwei, palaceName);
      if (!stars || stars.length === 0) return;

      stars.forEach(star => {
        const starName = toTraditionalStarName(star);
        const config = getStarWeightConfig(starName, weightsData);
        
        // 只計算主星和輔星
        if (!config) return;
        const isMainStar = weightsData?.mainStars?.some(s => s.id === config.id);
        const isAssistant = weightsData?.assistantStars?.some(s => s.id === config.id);
        
        if (isMainStar || isAssistant) {
          const brightness = getStarBrightness(ziwei, starName, palaceName);
          const brightnessWeight = BRIGHTNESS_WEIGHTS[brightness] || 0.9;
          
          // 主星權重更高
          const starWeight = isMainStar ? brightnessWeight * 1.5 : brightnessWeight;
          totalWeight += starWeight;
          starCount++;
        }
      });
    });

    // 計算平均分數並轉換為 0-100 分
    if (starCount === 0) return 50;
    const avgWeight = totalWeight / starCount;
    // 將 0.4-1.2 範圍映射到 0-100
    const score = ((avgWeight - 0.4) / (1.2 - 0.4)) * 100;
    return Math.max(0, Math.min(100, score));
  }

  /**
   * 計算吉煞星比例
   * @param {Object} ziwei 紫微命盤資料
   * @returns {number} 吉煞星比例分數（0-100）
   */
  function computeAuspiciousRatio(ziwei) {
    if (!ziwei) return 50; // 預設值

    let auspiciousCount = 0;
    let inauspiciousCount = 0;

    // 遍歷所有宮位統計吉煞星
    PALACE_DEFAULT.forEach(palaceName => {
      const stars = getStarsForPalace(ziwei, palaceName);
      if (!stars || stars.length === 0) return;

      stars.forEach(star => {
        const starName = toTraditionalStarName(star);
        
        if (AUSPICIOUS_STARS.includes(starName)) {
          auspiciousCount++;
        } else if (INAUSPICIOUS_STARS.includes(starName)) {
          inauspiciousCount++;
        }
      });
    });

    // 計算比例
    const total = auspiciousCount + inauspiciousCount;
    if (total === 0) return 50; // 沒有吉煞星，返回中性分數

    const ratio = auspiciousCount / total;
    // 將比例轉換為 0-100 分
    // 如果全是吉星（ratio=1），得分100；如果全是煞星（ratio=0），得分0
    const score = ratio * 100;
    return Math.max(0, Math.min(100, score));
  }

  /**
   * 評估主星組合評級
   * @param {Object} ziwei 紫微命盤資料
   * @returns {number} 主星組合評級分數（0-100）
   */
  function evaluateMainStarCombination(ziwei) {
    if (!ziwei || !ziwei.mainStars) return 50; // 預設值

    // 獲取命宮的主星
    const mingStars = getStarsForPalace(ziwei, "命宮");
    if (!mingStars || mingStars.length === 0) return 50;

    const mainStarNames = mingStars
      .map(toTraditionalStarName)
      .filter(name => {
        // 檢查是否為主星（14主星）
        const mainStars = [
          "紫微", "天機", "太陽", "武曲", "天同", "廉貞",
          "天府", "太陰", "貪狼", "巨門", "天相", "天梁",
          "七殺", "破軍"
        ];
        return mainStars.includes(name);
      });

    if (mainStarNames.length === 0) return 50;

    // 查找組合評級
    let maxRating = 0;
    
    // 檢查雙星組合
    if (mainStarNames.length >= 2) {
      const combo = mainStarNames.slice(0, 2).sort().join("");
      if (MAIN_STAR_COMBO_RATINGS[combo]) {
        maxRating = Math.max(maxRating, MAIN_STAR_COMBO_RATINGS[combo]);
      }
    }

    // 檢查單星評級
    mainStarNames.forEach(starName => {
      if (MAIN_STAR_COMBO_RATINGS[starName]) {
        maxRating = Math.max(maxRating, MAIN_STAR_COMBO_RATINGS[starName]);
      }
    });

    // 如果沒有找到評級，使用預設值
    if (maxRating === 0) {
      // 根據主星數量給予基礎分數
      maxRating = mainStarNames.length >= 2 ? 70 : 60;
    }

    return maxRating;
  }

  /**
   * 計算好命指數（Luck Index）
   * 綜合星曜廟旺利陷加權、吉煞星比例、主星組合評級
   * 
   * @param {Object} ziwei 紫微命盤資料
   * @param {Object} weightsData 權重資料
   * @returns {Object} 好命指數資料
   */
  function computeLuckIndex(ziwei, weightsData) {
    if (!ziwei || !weightsData) {
      return {
        luckIndex: 50,
        brightnessScore: 50,
        auspiciousRatio: 50,
        mainStarCombo: 50,
        breakdown: {
          brightnessWeight: 0.4,
          auspiciousWeight: 0.3,
          comboWeight: 0.3
        }
      };
    }

    // 1. 計算星曜廟旺利陷加權（權重 40%）
    const brightnessScore = computeBrightnessWeight(ziwei, weightsData);

    // 2. 計算吉煞星比例（權重 30%）
    const auspiciousRatio = computeAuspiciousRatio(ziwei);

    // 3. 評估主星組合評級（權重 30%）
    const mainStarCombo = evaluateMainStarCombination(ziwei);

    // 4. 綜合計算（0-100分）
    const luckIndex = Math.round(
      brightnessScore * 0.4 + 
      auspiciousRatio * 0.3 + 
      mainStarCombo * 0.3
    );

    return {
      luckIndex: Math.max(0, Math.min(100, luckIndex)),
      brightnessScore: Math.round(brightnessScore),
      auspiciousRatio: Math.round(auspiciousRatio),
      mainStarCombo: Math.round(mainStarCombo),
      breakdown: {
        brightnessWeight: 0.4,
        auspiciousWeight: 0.3,
        comboWeight: 0.3
      },
      description: getLuckIndexDescription(luckIndex)
    };
  }

  /**
   * 獲取好命指數描述
   * @param {number} luckIndex 好命指數（0-100）
   * @returns {string} 描述文字
   */
  function getLuckIndexDescription(luckIndex) {
    if (luckIndex >= 90) {
      return "極佳：命盤配置優異，運勢強勁，適合積極進取。";
    } else if (luckIndex >= 80) {
      return "優秀：命盤配置良好，運勢順暢，適合穩健發展。";
    } else if (luckIndex >= 70) {
      return "良好：命盤配置尚可，運勢平穩，適合穩步前進。";
    } else if (luckIndex >= 60) {
      return "中等：命盤配置一般，運勢普通，需要努力經營。";
    } else if (luckIndex >= 50) {
      return "普通：命盤配置較弱，運勢起伏，需要謹慎規劃。";
    } else {
      return "較弱：命盤配置較差，運勢不佳，需要特別注意。";
    }
  }

  // ====== 導出 ======

  // 導出到 window.LuckIndex（如果 window 存在）
  if (typeof window !== "undefined") {
    window.LuckIndex = {
      computeLuckIndex,
      computeBrightnessWeight,
      computeAuspiciousRatio,
      evaluateMainStarCombination,
      getLuckIndexDescription,
    };
  } else if (typeof globalThis !== "undefined") {
    // 讓 Node / 測試環境也能引用
    globalThis.LuckIndex = {
      computeLuckIndex,
      computeBrightnessWeight,
      computeAuspiciousRatio,
      evaluateMainStarCombination,
      getLuckIndexDescription,
    };
  }
})();
