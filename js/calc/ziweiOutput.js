/* calc/ziweiOutput.js
 * L9: 決策映射與語義輸出模組
 * 從 calc.js 中提取，用於模組化架構
 * 依賴 calc/constants.js
 */

(function () {
  "use strict";

  // 檢查依賴
  if (typeof window === "undefined" || !window.CalcConstants) {
    throw new Error("calc/ziweiOutput.js requires calc/constants.js to be loaded first");
  }

  // 從 constants.js 解構需要的常數
  const {
    PALACE_ONE_LINERS,
    STRATEGIC_ADVICE_BY_STARS,
  } = window.CalcConstants;

  // 從 window.Config 載入狀態標籤和顏色代碼（如果可用）
  const STATUS_LABELS = (typeof window !== "undefined" && window.Config?.STATUS_LABELS) || {
    5: "極佳",
    4: "強勁",
    3: "平穩",
    2: "穩健",
    1: "基礎"
  };

  const COLOR_CODES = (typeof window !== "undefined" && window.Config?.COLOR_CODES) || {
    5: "emerald",  // 極佳：翠綠色（4.5星）
    4: "green",    // 強勁：綠色（4.0星）
    3: "amber",    // 平穩：琥珀色（3.5星）
    2: "orange",   // 穩健：橙色（3.0星）
    1: "slate"     // 基礎：灰藍色（2.5星）
  };

  /**
   * 輔助函數：從 range 字串解析月份編號
   * 優先使用全局 Utils.parseMonthFromRange（如果可用）
   * @param {string} range 月份範圍字串（如 "1/1-1/31"）
   * @returns {number} 月份編號（1-12），解析失敗返回 0
   */
  function parseMonthFromRange(range) {
    // 優先使用全局工具函數
    if (typeof window !== "undefined" && window.Utils?.parseMonthFromRange) {
      return window.Utils.parseMonthFromRange(range);
    }
    // Fallback: 本地實現（向後兼容）
    if (!range) return 0;
    const s = String(range).trim();
    const m1 = s.match(/^(\d{1,2})[/.-]/);
    if (m1) return Math.min(12, Math.max(1, parseInt(m1[1], 10)));
    const m2 = s.match(/^0?(\d)\./);
    if (m2) return Math.min(12, Math.max(1, parseInt(m2[1], 10)));
    return 0;
  }

  /**
   * L9: 將最終得分轉化為內部等級（1-5），用於描述文字映射
   * 
   * 使用百分位數劃分，確保每個星等都有合理的分布：
   * - 5級：Top 20%（前20%）
   * - 4級：20%-40%
   * - 3級：40%-60%
   * - 2級：60%-80%
   * - 1級：Bottom 20%（后20%）
   * 
   * @param {number} finalScore 最終分數（0-100）
   * @param {Object} allScores 所有12宮位的分數物件 { "命宮": 85.5, ... }
   * @returns {number} 內部等級（1-5），用於映射描述文字
   */
  function mapScoreToInternalLevel(finalScore, allScores = null) {
    // 如果提供了所有分數，使用相對排名（百分位數）
    if (allScores && typeof allScores === 'object') {
      const scores = Object.values(allScores).map(s => Number(s) || 0).filter(s => s >= 0);
      if (scores.length >= 2) {
        // 排序分數（降序）
        const sortedScores = [...scores].sort((a, b) => b - a);
        
        // 計算當前分數的排名（計算有多少分數大於等於當前分數）
        // 使用 >= 而不是 >，確保相同分數得到相同排名
        const rank = sortedScores.filter(s => s >= finalScore).length - 1;
        const percentile = (rank / (scores.length - 1)) * 100; // 使用 (n-1) 避免 100% 的情況
        
        // 基於百分位數劃分（確保每個等級約佔 20%）
        if (percentile < 20) return 5;  // Top 20%
        if (percentile < 40) return 4;  // 20%-40%
        if (percentile < 60) return 3;  // 40%-60%
        if (percentile < 80) return 2;  // 60%-80%
        return 1;                       // Bottom 20%
      }
    }
    
    // Fallback: 使用絕對閾值（向後兼容）
    // 調整後的閾值，更符合實際分數分布
    if (finalScore >= 80) return 5;  // 極佳
    if (finalScore >= 65) return 4;  // 強勁
    if (finalScore >= 50) return 3;  // 平穩
    if (finalScore >= 35) return 2;  // 吃力
    return 1;                        // 審慎
  }

  /**
   * L9: 將內部等級轉化為顯示星等（2.5-4.5顆星，每級0.5顆星）
   * 
   * 為了讓大家更有幸福感，最低分從2.5顆星開始：
   * - 1級（Bottom 20%）→ 2.5星
   * - 2級（60%-80%）→ 3.0星
   * - 3級（40%-60%）→ 3.5星
   * - 4級（20%-40%）→ 4.0星
   * - 5級（Top 20%）→ 4.5星
   * 
   * @param {number} internalLevel 內部等級（1-5）
   * @returns {number} 顯示星等（2.5, 3.0, 3.5, 4.0, 4.5）
   */
  function mapInternalLevelToDisplayStars(internalLevel) {
    // 映射：1→2.5, 2→3.0, 3→3.5, 4→4.0, 5→4.5
    return 2.0 + (internalLevel * 0.5);
  }

  /**
   * L9: 將最終得分轉化為顯示星等（2.5-4.5顆星）
   * 
   * @param {number} finalScore 最終分數（0-100）
   * @param {Object} allScores 所有12宮位的分數物件 { "命宮": 85.5, ... }
   * @returns {number} 顯示星等（2.5, 3.0, 3.5, 4.0, 4.5）
   */
  function mapScoreToStarRating(finalScore, allScores = null) {
    const internalLevel = mapScoreToInternalLevel(finalScore, allScores);
    return mapInternalLevelToDisplayStars(internalLevel);
  }

  /**
   * 生成流月與紫微、五行關聯的一句話說明
   * 
   * @param {number} monthNum 月份編號（1-12）
   * @param {number} internalLevel 內部等級（1-5）
   * @param {Object} ziweiPalaceMetadata 紫微宮位元數據
   * @param {Object} wuxingData 五行數據
   * @returns {string} 一句話說明
   */
  function generateMonthlyCorrelationNote(monthNum, internalLevel, ziweiPalaceMetadata, wuxingData) {
    if (!monthNum || monthNum < 1 || monthNum > 12) {
      return "";
    }
    
    // 月份對應的紫微宮位（流月宮位映射）
    // 流月1月對應命宮，2月對應兄弟，以此類推（順時針）
    const palaceMapping = [
      "命宮", "兄弟", "夫妻", "子女", "財帛", "疾厄",
      "遷移", "僕役", "官祿", "田宅", "福德", "父母"
    ];
    const correspondingPalace = palaceMapping[monthNum - 1] || "";
    
    // 獲取對應宮位的紫微數據
    let palaceNote = "";
    if (ziweiPalaceMetadata && correspondingPalace && ziweiPalaceMetadata[correspondingPalace]) {
      const palaceData = ziweiPalaceMetadata[correspondingPalace];
      const palaceStars = palaceData.l9Output?.stars || 0;
      const palaceStatus = palaceData.l9Output?.statusLabel || "";
      
      // 根據星等差異生成說明
      const starDiff = palaceStars - (2.0 + internalLevel * 0.5);
      if (Math.abs(starDiff) < 0.3) {
        palaceNote = `與${correspondingPalace}能量同步`;
      } else if (starDiff > 0.5) {
        palaceNote = `${correspondingPalace}能量強於本月`;
      } else if (starDiff < -0.5) {
        palaceNote = `本月能量強於${correspondingPalace}`;
      } else {
        palaceNote = `對應${correspondingPalace}（${palaceStatus}）`;
      }
    } else if (correspondingPalace) {
      palaceNote = `對應${correspondingPalace}`;
    }
    
    // 獲取五行數據
    let wuxingNote = "";
    if (wuxingData && wuxingData.strategic) {
      const wuxing = wuxingData.strategic;
      const elements = ["wood", "fire", "earth", "metal", "water"];
      const elementNames = { wood: "木", fire: "火", earth: "土", metal: "金", water: "水" };
      
      // 找出最強和最弱的五行
      let maxScore = -1, maxElement = "";
      let minScore = 999, minElement = "";
      
      elements.forEach(elem => {
        const score = wuxing[elem] || 0;
        if (score > maxScore) {
          maxScore = score;
          maxElement = elementNames[elem];
        }
        if (score < minScore) {
          minScore = score;
          minElement = elementNames[elem];
        }
      });
      
      if (maxElement && minElement && maxElement !== minElement) {
        wuxingNote = `五行${maxElement}強、${minElement}弱`;
      }
    }
    
    // 組合說明
    const parts = [];
    if (palaceNote) parts.push(palaceNote);
    if (wuxingNote) parts.push(wuxingNote);
    
    if (parts.length > 0) {
      return parts.join("，");
    }
    
    // 如果沒有關聯數據，根據等級生成通用說明
    const levelNotes = {
      5: "能量通道完全開啟",
      4: "系統運轉順暢",
      3: "當前狀態平穩",
      2: "運作正常",
      1: "基礎穩固"
    };
    return levelNotes[internalLevel] || "";
  }

  /**
   * L9: 流月星等計算（與紫微對應）
   * 
   * 將流月的 riskScore（風險指數 0-100）轉換為能量指數，然後映射為星等
   * 邏輯：riskScore 越低（風險越低）→ energyScore 越高（能量越高）→ 星等越高
   * 
   * @param {number} riskScore 風險指數（0-100），越高表示風險越大
   * @param {Array} allMonths 所有12個月的流月數據陣列 [{ riskScore, ... }, ...]
   * @param {Object} ziweiPalaceMetadata 紫微宮位元數據（可選，用於關聯說明）
   * @param {Object} wuxingData 五行數據（可選，用於關聯說明）
   * @param {number} monthNum 月份編號（1-12），用於生成關聯說明
   * @returns {Object} { stars: 2.5-4.5, internalLevel: 1-5, statusLabel, colorCode, correlationNote }
   */
  function computeMonthlyStarRating(riskScore, allMonths = [], ziweiPalaceMetadata = null, wuxingData = null, monthNum = null) {
    // 1. 將風險指數轉換為能量指數（反向映射）
    // riskScore 0-100 → energyScore 100-0（風險越低，能量越高）
    const energyScore = 100 - Math.max(0, Math.min(100, Number(riskScore) || 0));
    
    // 2. 收集所有月份的能量指數，用於相對排名
    const allEnergyScores = {};
    if (Array.isArray(allMonths) && allMonths.length > 0) {
      allMonths.forEach((month, index) => {
        const monthRisk = Math.max(0, Math.min(100, Number(month.riskScore) || 0));
        const monthEnergy = 100 - monthRisk;
        // 使用月份編號作為 key（1-12）
        const monthNumKey = parseMonthFromRange(month.range) || (index + 1);
        allEnergyScores[monthNumKey] = monthEnergy;
      });
    }
    
    // 3. 使用相對排名計算內部等級（與紫微保持一致）
    const internalLevel = mapScoreToInternalLevel(energyScore, allEnergyScores);
    
    // 4. 轉換為顯示星等（2.5-4.5）
    const displayStars = mapInternalLevelToDisplayStars(internalLevel);
    
    // 5. 獲取狀態標籤和顏色代碼
    const statusLabel = STATUS_LABELS[internalLevel] || "平穩";
    const colorCode = COLOR_CODES[internalLevel] || "amber";
    
    // 6. 生成與紫微、五行關聯的一句話說明
    const correlationNote = generateMonthlyCorrelationNote(
      monthNum,
      internalLevel,
      ziweiPalaceMetadata,
      wuxingData
    );
    
    return {
      stars: displayStars,
      internalLevel: internalLevel,
      statusLabel: statusLabel,
      colorCode: colorCode,
      correlationNote: correlationNote,
      energyScore: energyScore, // 供參考
      riskScore: riskScore // 保留原始風險指數
    };
  }

  /**
   * L9: 決策映射與語義輸出
   * 將經過 L1-L7 處理的最終分數轉化為完整的語義輸出物件
   * 
   * @param {string} palaceName 宮位名稱（繁體）
   * @param {number} finalScore 最終分數（0-100）
   * @param {Object} metadata 元數據（包含 strategicAdvice, maxStarRating, isSubjectiveFocus, allScores 等）
   * @returns {Object} 完整的語義輸出物件
   */
  function finalizeStarRating(palaceName, finalScore, metadata = {}) {
    const { maxStarRating, strategicAdvice = [], isSubjectiveFocus = false, allScores = null } = metadata;
    
    // 1. 計算內部等級（1-5，用於描述文字映射）
    let internalLevel = mapScoreToInternalLevel(finalScore, allScores);
    
    // 2. 應用星等上限限制（由神煞觸發）
    // maxStarRating 可能是舊格式（1-5）或新格式（2.5-4.5）
    if (maxStarRating != null) {
      let maxInternalLevel = maxStarRating;
      
      // 如果是新格式（2.5-4.5），轉換為內部等級
      if (maxStarRating >= 2.5 && maxStarRating <= 4.5) {
        maxInternalLevel = Math.round((maxStarRating - 2.0) / 0.5);
      }
      // 如果是舊格式（1-5），直接使用
      else if (maxStarRating >= 1 && maxStarRating <= 5) {
        maxInternalLevel = maxStarRating;
      }
      
      // 應用上限
      if (internalLevel > maxInternalLevel) {
        internalLevel = maxInternalLevel;
      }
    }
    
    // 3. 計算顯示星等（2.5-4.5）
    let displayStars = mapInternalLevelToDisplayStars(internalLevel);
    
    // 如果 maxStarRating 是新格式（2.5-4.5），確保顯示星等不超過上限
    if (maxStarRating != null && maxStarRating >= 2.5 && maxStarRating <= 4.5) {
      if (displayStars > maxStarRating) {
        displayStars = maxStarRating;
      }
    }

    // 3. 獲取一句話宮位說明
    const oneLiner = PALACE_ONE_LINERS[palaceName] || palaceName;

    // 4. 獲取戰略建議（使用內部等級1-5來映射描述文字）
    let strategicText = STRATEGIC_ADVICE_BY_STARS[internalLevel] || STRATEGIC_ADVICE_BY_STARS[3];
    
    // 合併來自神煞的戰略建議
    const allStrategicAdvice = [...strategicAdvice];
    
    // L7 主觀頻率修正：若觸發了 L7 增益，在建議文字前加入提示
    if (isSubjectiveFocus) {
      allStrategicAdvice.unshift("此領域為你本年度的生命重心，波動感將會特別強烈。");
    }
    
    // 將神煞建議附加到戰略文字後
    if (allStrategicAdvice.length > 0) {
      strategicText += " " + allStrategicAdvice.join(" · ");
    }

    // 5. 獲取狀態標籤和顏色代碼（使用內部等級）
    const statusLabel = STATUS_LABELS[internalLevel] || "平穩";
    const colorCode = COLOR_CODES[internalLevel] || "amber";

    return {
      palaceName,
      oneLiner,
      stars: displayStars,  // 顯示星等（2.5-4.5）
      internalLevel: internalLevel,  // 內部等級（1-5），供參考
      statusLabel,
      strategicAdvice: strategicText,
      colorCode,
      // 保留原始數據供參考
      finalScore: Math.round(finalScore * 10) / 10,
      maxStarRating,
      isSubjectiveFocus
    };
  }

  /**
   * 流月八字戰略標籤生成器
   * 根據月份的天干地支生成戰略標籤（#深度貼文風格）
   * 
   * @param {number} month 月份（1-12）
   * @param {string} stem 天干（如 "庚"）
   * @param {string} branch 地支（如 "寅"）
   * @returns {string} 戰略標籤（如 "【剛毅開創】"）
   */
  function generateMonthStrategyTag(month, stem, branch) {
    // 天干戰略屬性映射
    const stemAttributes = {
      "甲": "剛毅開創", "乙": "柔韌適應", "丙": "熱情擴張", "丁": "細緻執行",
      "戊": "穩健累積", "己": "靈活整合", "庚": "剛毅開創", "辛": "精準優化",
      "壬": "流動擴展", "癸": "深度滲透"
    };

    // 地支戰略屬性映射
    const branchAttributes = {
      "子": "潛藏蓄力", "丑": "穩固基礎", "寅": "開創啟動", "卯": "柔韌成長",
      "辰": "整合擴張", "巳": "轉化突破", "午": "高峰執行", "未": "收穫整合",
      "申": "理性分析", "酉": "精煉優化", "戌": "穩固防禦", "亥": "深度沉潛"
    };

    const stemAttr = stemAttributes[stem] || "執行";
    const branchAttr = branchAttributes[branch] || "運轉";
    
    // 組合標籤（優先使用天干屬性，地支作為補充）
    return `【${stemAttr}】`;
  }

  // ====== 導出 ======

  // 導出到 window.CalcOutput（如果 window 存在）
  if (typeof window !== "undefined") {
    window.CalcOutput = {
      mapScoreToInternalLevel,
      mapInternalLevelToDisplayStars,
      mapScoreToStarRating,
      computeMonthlyStarRating,
      generateMonthlyCorrelationNote,
      finalizeStarRating,
      generateMonthStrategyTag,
      parseMonthFromRange, // 輔助函數，calc.js 也需要使用
    };
  } else if (typeof globalThis !== "undefined") {
    // 讓 Node / 測試環境也能引用
    globalThis.CalcOutput = {
      mapScoreToInternalLevel,
      mapInternalLevelToDisplayStars,
      mapScoreToStarRating,
      computeMonthlyStarRating,
      generateMonthlyCorrelationNote,
      finalizeStarRating,
      generateMonthStrategyTag,
      parseMonthFromRange,
    };
  }
})();
