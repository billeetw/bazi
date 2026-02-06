/* calc/healthAnalysis.js
 * 五行健康預警系統
 * 基於五行強弱對應生理系統，生成健康預警和建議
 * 依賴: calc/constants.js, calc/helpers.js
 */

(function () {
  "use strict";

  // 檢查依賴
  if (typeof window === "undefined" || !window.CalcConstants) {
    throw new Error("calc/healthAnalysis.js requires calc/constants.js to be loaded first");
  }
  if (typeof window === "undefined" || !window.CalcHelpers) {
    throw new Error("calc/healthAnalysis.js requires calc/helpers.js to be loaded first");
  }

  const {
    getStrongestWeakest,
    toEnergyLevelsFromWx,
    clampEnergyLevel,
    pctFromWx,
  } = window.CalcHelpers;

  /**
   * 五行對應生理系統映射
   */
  const ELEMENT_HEALTH_MAP = {
    "木": {
      organs: ["肝", "膽"],
      systems: ["肝膽系統", "神經系統", "筋骨系統"],
      weakRisk: "肝膽功能偏弱，容易疲勞、情緒不穩、筋骨痠痛。建議：規律作息、適度運動、避免過度飲酒。",
      excessRisk: "木氣過旺，容易肝火上升、易怒、頭痛、高血壓。建議：保持情緒穩定、避免熬夜、適度疏肝理氣。",
      symptoms: {
        weak: ["疲勞", "情緒不穩", "筋骨痠痛", "視力模糊", "失眠"],
        excess: ["易怒", "頭痛", "高血壓", "眼睛乾澀", "口苦"]
      }
    },
    "火": {
      organs: ["心", "小腸"],
      systems: ["心血管系統", "循環系統", "小腸系統"],
      weakRisk: "心火不足，容易心悸、手腳冰冷、精神不振。建議：適度運動、保持溫暖、避免過度勞累。",
      excessRisk: "火氣過旺，容易心煩、失眠、口乾舌燥、高血壓。建議：保持心情平靜、多喝水、避免辛辣食物。",
      symptoms: {
        weak: ["心悸", "手腳冰冷", "精神不振", "胸悶", "易累"],
        excess: ["心煩", "失眠", "口乾舌燥", "高血壓", "面紅"]
      }
    },
    "土": {
      organs: ["脾", "胃"],
      systems: ["消化系統", "免疫系統", "肌肉系統"],
      weakRisk: "脾胃功能偏弱，容易消化不良、食慾不振、免疫力下降。建議：規律飲食、細嚼慢嚥、避免生冷食物。",
      excessRisk: "土氣過旺，容易腹脹、便秘、體重增加、代謝緩慢。建議：適度運動、多喝水、避免過度進食。",
      symptoms: {
        weak: ["消化不良", "食慾不振", "免疫力下降", "肌肉無力", "水腫"],
        excess: ["腹脹", "便秘", "體重增加", "代謝緩慢", "嗜睡"]
      }
    },
    "金": {
      organs: ["肺", "大腸"],
      systems: ["呼吸系統", "大腸系統", "皮膚系統"],
      weakRisk: "肺氣不足，容易感冒、氣喘、皮膚乾燥、便秘。建議：多呼吸新鮮空氣、適度運動、保持皮膚濕潤。",
      excessRisk: "金氣過旺，容易咳嗽、皮膚過敏、大腸功能失調。建議：避免過度乾燥環境、多喝水、保持腸道健康。",
      symptoms: {
        weak: ["感冒", "氣喘", "皮膚乾燥", "便秘", "聲音微弱"],
        excess: ["咳嗽", "皮膚過敏", "大腸功能失調", "口乾", "鼻塞"]
      }
    },
    "水": {
      organs: ["腎", "膀胱"],
      systems: ["泌尿系統", "生殖系統", "骨骼系統"],
      weakRisk: "腎氣不足，容易腰痠背痛、頻尿、記憶力下降、骨質疏鬆。建議：適度運動、保持充足睡眠、避免過度勞累。",
      excessRisk: "水氣過旺，容易水腫、頻尿、關節疼痛、代謝緩慢。建議：適度運動、控制水分攝取、避免過度飲水。",
      symptoms: {
        weak: ["腰痠背痛", "頻尿", "記憶力下降", "骨質疏鬆", "畏寒"],
        excess: ["水腫", "頻尿", "關節疼痛", "代謝緩慢", "頭暈"]
      }
    }
  };

  /**
   * 年齡風險加權係數
   * 根據年齡段增加健康風險
   */
  const AGE_RISK_MULTIPLIERS = {
    // 0-20歲：基礎風險
    0: 1.0,
    // 21-30歲：輕微增加
    21: 1.1,
    // 31-40歲：中等增加
    31: 1.2,
    // 41-50歲：明顯增加
    41: 1.4,
    // 51-60歲：顯著增加
    51: 1.6,
    // 61-70歲：高度增加
    61: 1.8,
    // 71歲以上：極高風險
    71: 2.0
  };

  /**
   * 流年五行加權（基於流年天干）
   * 不同年份會對特定五行產生影響
   */
  const YEAR_ELEMENT_WEIGHTS = {
    "甲": { "木": 1.2, "火": 0.9 }, // 木年，木氣增強，火氣稍弱
    "乙": { "木": 1.2, "火": 0.9 },
    "丙": { "火": 1.2, "土": 0.9 }, // 火年，火氣增強，土氣稍弱
    "丁": { "火": 1.2, "土": 0.9 },
    "戊": { "土": 1.2, "金": 0.9 }, // 土年，土氣增強，金氣稍弱
    "己": { "土": 1.2, "金": 0.9 },
    "庚": { "金": 1.2, "水": 0.9 }, // 金年，金氣增強，水氣稍弱
    "辛": { "金": 1.2, "水": 0.9 },
    "壬": { "水": 1.2, "木": 0.9 }, // 水年，水氣增強，木氣稍弱
    "癸": { "水": 1.2, "木": 0.9 }
  };

  /**
   * 流月五行加權（基於月份）
   * 不同月份對應不同五行
   */
  const MONTH_ELEMENT_WEIGHTS = {
    1: { "水": 1.1, "木": 0.95 },   // 1月（冬末）：水氣強，木氣弱
    2: { "木": 1.1, "火": 0.95 },   // 2月（初春）：木氣強，火氣弱
    3: { "木": 1.1, "火": 0.95 },   // 3月（春）：木氣強
    4: { "火": 1.1, "土": 0.95 },   // 4月（初夏）：火氣強
    5: { "火": 1.1, "土": 0.95 },   // 5月（夏）：火氣強
    6: { "土": 1.1, "金": 0.95 },   // 6月（長夏）：土氣強
    7: { "土": 1.1, "金": 0.95 },   // 7月（夏末）：土氣強
    8: { "金": 1.1, "水": 0.95 },   // 8月（初秋）：金氣強
    9: { "金": 1.1, "水": 0.95 },   // 9月（秋）：金氣強
    10: { "金": 1.1, "水": 0.95 },  // 10月（深秋）：金氣強
    11: { "水": 1.1, "木": 0.95 },   // 11月（初冬）：水氣強
    12: { "水": 1.1, "木": 0.95 }    // 12月（冬）：水氣強
  };

  /**
   * 獲取年齡風險加權係數
   * @param {number} age 年齡
   * @returns {number} 風險加權係數
   */
  function getAgeRiskMultiplier(age) {
    if (!age || age < 0) return 1.0;
    
    const ageKeys = Object.keys(AGE_RISK_MULTIPLIERS)
      .map(k => Number(k))
      .sort((a, b) => b - a); // 降序排列
    
    for (const key of ageKeys) {
      if (age >= key) {
        return AGE_RISK_MULTIPLIERS[key];
      }
    }
    
    return 1.0;
  }

  /**
   * 分析疾厄宮星曜四化影響
   * @param {Object} overlapAnalysis 疊宮分析結果
   * @param {Object} palaceMetadata 宮位元數據
   * @returns {Object} 疾厄宮四化影響分析
   */
  function analyzeJiePalaceTransformations(overlapAnalysis, palaceMetadata) {
    if (!overlapAnalysis || !overlapAnalysis.palaceMap) {
      return {
        hasCriticalRisk: false,
        hasMaxOpportunity: false,
        transformations: null,
        riskMultiplier: 1.0,
        notes: []
      };
    }

    const jiePalaceData = overlapAnalysis.palaceMap.get("疾厄");
    if (!jiePalaceData) {
      return {
        hasCriticalRisk: false,
        hasMaxOpportunity: false,
        transformations: null,
        riskMultiplier: 1.0,
        notes: []
      };
    }

    const notes = [];
    let riskMultiplier = 1.0;

    // 檢查化忌疊加（CRITICAL_RISK）
    if (jiePalaceData.jiCount >= 2) {
      riskMultiplier *= 1.5; // 疾厄宮化忌疊加，健康風險增加50%
      notes.push(`⚠️ 疾厄宮${jiePalaceData.jiCount}重化忌疊加，健康風險顯著增加`);
    } else if (jiePalaceData.jiCount === 1) {
      riskMultiplier *= 1.2; // 單一化忌，風險增加20%
      notes.push(`⚠️ 疾厄宮有化忌，需要特別注意健康`);
    }

    // 檢查化祿疊加（正面影響）
    if (jiePalaceData.luCount >= 2) {
      riskMultiplier *= 0.8; // 疾厄宮化祿疊加，健康風險降低20%
      notes.push(`✅ 疾厄宮${jiePalaceData.luCount}重化祿疊加，健康基礎良好`);
    } else if (jiePalaceData.luCount === 1) {
      riskMultiplier *= 0.9; // 單一化祿，風險降低10%
      notes.push(`✅ 疾厄宮有化祿，健康運勢較佳`);
    }

    // 檢查流年大小限是否在疾厄宮
    const transformations = jiePalaceData.transformations;
    const hasLiunian = transformations.liunian !== null;
    const hasXiaoxian = transformations.xiaoxian !== null;
    const hasDalimit = transformations.dalimit !== null;

    if (hasLiunian || hasXiaoxian || hasDalimit) {
      const activeLayers = [];
      if (hasDalimit) activeLayers.push("大限");
      if (hasLiunian) activeLayers.push("流年");
      if (hasXiaoxian) activeLayers.push("小限");
      notes.push(`📍 流年大小限在疾厄宮：${activeLayers.join("、")}，健康波動感會特別明顯`);
    }

    return {
      hasCriticalRisk: jiePalaceData.riskLevel === 'critical',
      hasMaxOpportunity: jiePalaceData.opportunityLevel === 'max',
      transformations: transformations,
      riskMultiplier: riskMultiplier,
      notes: notes,
      jiCount: jiePalaceData.jiCount,
      luCount: jiePalaceData.luCount
    };
  }

  /**
   * 分析五行健康狀態（增強版：加入年份月份加權、年齡風險、流年大小限、疾厄宮四化）
   * @param {Object} wuxingData 五行數據 { raw: {}, pct: {}, levels: {} }
   * @param {Object} options 選項
   * @param {Object} options.palaceScores 宮位分數（可選，用於結合疾厄宮分析）
   * @param {Object} options.palaceMetadata 宮位元數據（可選，用於獲取疾厄宮星曜）
   * @param {Object} options.overlapAnalysis 疊宮分析結果（可選，用於獲取疾厄宮四化）
   * @param {number} options.age 當前年齡（可選，用於年齡風險加權）
   * @param {number} options.currentYear 當前年份（可選，用於流年五行加權）
   * @param {number} options.currentMonth 當前月份（可選，用於流月五行加權）
   * @param {Object} options.fourTransformations 四化系統數據（可選，用於獲取流年天干）
   * @returns {Object} 健康分析結果
   */
  function analyzeElementHealth(wuxingData, options = {}) {
    // 向後兼容：如果第二個參數是 palaceScores 對象，轉換為 options
    let palaceScores = null;
    if (options && typeof options === 'object' && !options.palaceScores && !options.age) {
      // 可能是舊的調用方式：analyzeElementHealth(wuxingData, palaceScores)
      palaceScores = options;
      options = { palaceScores: palaceScores };
    } else {
      palaceScores = options.palaceScores || null;
    }

    const {
      palaceMetadata = null,
      overlapAnalysis = null,
      age = null,
      currentYear = new Date().getFullYear(),
      currentMonth = new Date().getMonth() + 1,
      fourTransformations = null
    } = options;
    if (!wuxingData || !wuxingData.raw) {
      return {
        warnings: [],
        recommendations: [],
        riskLevel: 'normal',
        summary: '五行數據不足，無法進行健康分析'
      };
    }

    const wx = wuxingData.raw;
    const { pct } = pctFromWx(wx);
    const { levels } = toEnergyLevelsFromWx(wx);
    const { strongest, weakest } = getStrongestWeakest(wx, ["木", "火", "土", "金", "水"]);

    // 1. 計算年齡風險加權
    const ageRiskMultiplier = age ? getAgeRiskMultiplier(age) : 1.0;

    // 2. 計算流年五行加權（基於流年天干）
    let yearElementMultipliers = {};
    if (fourTransformations && fourTransformations.liunian && fourTransformations.liunian.stem) {
      const liunianStem = fourTransformations.liunian.stem;
      yearElementMultipliers = YEAR_ELEMENT_WEIGHTS[liunianStem] || {};
    }

    // 3. 計算流月五行加權
    const monthElementMultipliers = MONTH_ELEMENT_WEIGHTS[currentMonth] || {};

    // 4. 分析疾厄宮星曜四化影響
    const jiePalaceAnalysis = analyzeJiePalaceTransformations(overlapAnalysis, palaceMetadata);
    const jieRiskMultiplier = jiePalaceAnalysis.riskMultiplier || 1.0;

    // 5. 分析五行相剋關係（最強 vs 最弱）
    const conflictAnalysis = analyzeElementConflict(strongest, weakest, yearElementMultipliers, monthElementMultipliers);
    const conflictRiskMultiplier = conflictAnalysis.riskMultiplier || 1.0;

    // 6. 綜合風險加權 = 年齡風險 × 疾厄宮四化風險 × 相剋風險
    const totalRiskMultiplier = ageRiskMultiplier * jieRiskMultiplier * conflictRiskMultiplier;

    const warnings = [];
    const recommendations = [];
    let riskLevel = 'normal'; // 'normal' | 'warning' | 'critical'

    // 分析每個五行的健康狀態（加入年份月份加權）
    ["木", "火", "土", "金", "水"].forEach(element => {
      let adjustedLevel = clampEnergyLevel(levels[element]);
      
      // 應用流年五行加權
      if (yearElementMultipliers[element]) {
        adjustedLevel = Math.max(0, Math.min(3, adjustedLevel + (yearElementMultipliers[element] > 1.0 ? 0.5 : -0.5)));
      }
      
      // 應用流月五行加權
      if (monthElementMultipliers[element]) {
        adjustedLevel = Math.max(0, Math.min(3, adjustedLevel + (monthElementMultipliers[element] > 1.0 ? 0.3 : -0.3)));
      }

      const healthInfo = ELEMENT_HEALTH_MAP[element];
      if (!healthInfo) return;

      // 計算調整後的風險等級（考慮年齡和疾厄宮四化）
      let effectiveSeverity = null;
      let riskMultiplier = totalRiskMultiplier;

      // 過弱（level 0-1）
      if (adjustedLevel <= 1) {
        const baseSeverity = adjustedLevel === 0 ? 'critical' : 'warning';
        
        // 應用年齡和疾厄宮風險加權
        if (riskMultiplier >= 1.5) {
          // 風險加權高，提升嚴重程度
          effectiveSeverity = baseSeverity === 'critical' ? 'critical' : 'warning';
          if (baseSeverity === 'warning' && riskMultiplier >= 2.0) {
            effectiveSeverity = 'critical'; // 高風險加權時，警告升級為嚴重
          }
        } else {
          effectiveSeverity = baseSeverity;
        }

        if (effectiveSeverity === 'critical') riskLevel = 'critical';
        else if (riskLevel === 'normal') riskLevel = 'warning';

        // 生成風險描述（加入年份月份和年齡資訊）
        let riskDescription = healthInfo.weakRisk;
        const yearMonthNote = [];
        if (yearElementMultipliers[element] && yearElementMultipliers[element] < 1.0) {
          yearMonthNote.push(`${currentYear}年（${fourTransformations?.liunian?.stem || ''}年）對${element}氣不利`);
        }
        if (monthElementMultipliers[element] && monthElementMultipliers[element] < 1.0) {
          yearMonthNote.push(`${currentMonth}月對${element}氣不利`);
        }
        if (age && ageRiskMultiplier > 1.0) {
          yearMonthNote.push(`年齡${age}歲，健康風險增加${Math.round((ageRiskMultiplier - 1) * 100)}%`);
        }
        if (yearMonthNote.length > 0) {
          riskDescription += ` 特別注意：${yearMonthNote.join('；')}。`;
        }

        warnings.push({
          element: element,
          level: adjustedLevel,
          originalLevel: clampEnergyLevel(levels[element]),
          severity: effectiveSeverity,
          type: 'weak',
          organs: healthInfo.organs,
          systems: healthInfo.systems,
          risk: riskDescription,
          symptoms: healthInfo.symptoms.weak,
          recommendation: `【${element}氣偏弱】${riskDescription}`,
          riskMultiplier: riskMultiplier,
          yearMonthNote: yearMonthNote.length > 0 ? yearMonthNote.join('；') : null
        });

        recommendations.push({
          element: element,
          priority: effectiveSeverity === 'critical' ? 'high' : 'medium',
          action: healthInfo.weakRisk.split('建議：')[1] || '',
          focus: healthInfo.organs.join('、'),
          urgency: riskMultiplier >= 1.5 ? 'urgent' : 'normal'
        });
      }

      // 過旺（level 3）
      if (adjustedLevel >= 3) {
        if (riskLevel === 'normal') riskLevel = 'warning';

        // 生成風險描述（加入年份月份資訊）
        let riskDescription = healthInfo.excessRisk;
        const yearMonthNote = [];
        if (yearElementMultipliers[element] && yearElementMultipliers[element] > 1.0) {
          yearMonthNote.push(`${currentYear}年（${fourTransformations?.liunian?.stem || ''}年）${element}氣特別旺盛`);
        }
        if (monthElementMultipliers[element] && monthElementMultipliers[element] > 1.0) {
          yearMonthNote.push(`${currentMonth}月${element}氣特別旺盛`);
        }
        if (yearMonthNote.length > 0) {
          riskDescription += ` 特別注意：${yearMonthNote.join('；')}。`;
        }

        warnings.push({
          element: element,
          level: adjustedLevel,
          originalLevel: clampEnergyLevel(levels[element]),
          severity: 'warning',
          type: 'excess',
          organs: healthInfo.organs,
          systems: healthInfo.systems,
          risk: riskDescription,
          symptoms: healthInfo.symptoms.excess,
          recommendation: `【${element}氣過旺】${riskDescription}`,
          riskMultiplier: riskMultiplier,
          yearMonthNote: yearMonthNote.length > 0 ? yearMonthNote.join('；') : null
        });

        recommendations.push({
          element: element,
          priority: 'medium',
          action: healthInfo.excessRisk.split('建議：')[1] || '',
          focus: healthInfo.organs.join('、'),
          urgency: 'normal'
        });
      }
    });

    // 結合疾厄宮分析（如果提供）
    let jiePalaceNote = null;
    const jiePalaceNotes = [];
    
    if (palaceScores && palaceScores["疾厄"]) {
      const jieScore = palaceScores["疾厄"];
      if (jieScore < 50) {
        jiePalaceNotes.push(`⚠️ 疾厄宮能量較弱（${jieScore.toFixed(1)}分），需要特別注意健康管理。`);
        if (riskLevel === 'normal') riskLevel = 'warning';
      } else if (jieScore >= 80) {
        jiePalaceNotes.push(`✅ 疾厄宮能量強健（${jieScore.toFixed(1)}分），整體健康基礎良好。`);
      }
    }

    // 加入疾厄宮四化分析備註
    if (jiePalaceAnalysis.notes && jiePalaceAnalysis.notes.length > 0) {
      jiePalaceNotes.push(...jiePalaceAnalysis.notes);
      
      // 如果疾厄宮有嚴重風險，提升整體風險等級
      if (jiePalaceAnalysis.hasCriticalRisk) {
        if (riskLevel === 'normal') riskLevel = 'warning';
        else if (riskLevel === 'warning') riskLevel = 'critical';
      }
    }

    jiePalaceNote = jiePalaceNotes.length > 0 ? jiePalaceNotes.join('\n') : null;

    // 生成摘要
    let summary = '';
    if (warnings.length === 0) {
      summary = '五行能量相對均衡，健康狀態良好。建議保持規律作息和適度運動。';
    } else {
      const criticalWarnings = warnings.filter(w => w.severity === 'critical');
      const warningCount = warnings.length;
      const criticalCount = criticalWarnings.length;

      if (criticalCount > 0) {
        summary = `⚠️ 發現 ${criticalCount} 個嚴重健康風險，${warningCount - criticalCount} 個一般警告。建議優先處理 ${criticalWarnings.map(w => w.element + '氣').join('、')} 相關問題。`;
      } else {
        summary = `⚠️ 發現 ${warningCount} 個健康警告。建議關注 ${warnings.map(w => w.element + '氣').join('、')} 相關系統。`;
      }
    }

    return {
      warnings: warnings,
      recommendations: recommendations,
      riskLevel: riskLevel,
      summary: summary,
      jiePalaceNote: jiePalaceNote,
      strongestElement: strongest,
      weakestElement: weakest,
      elementLevels: {
        "木": clampEnergyLevel(levels["木"]),
        "火": clampEnergyLevel(levels["火"]),
        "土": clampEnergyLevel(levels["土"]),
        "金": clampEnergyLevel(levels["金"]),
        "水": clampEnergyLevel(levels["水"])
      },
      // 新增：加權資訊
      multipliers: {
        ageRisk: ageRiskMultiplier,
        jiePalaceRisk: jieRiskMultiplier,
        conflictRisk: conflictRiskMultiplier,
        totalRisk: totalRiskMultiplier,
        yearElement: yearElementMultipliers,
        monthElement: monthElementMultipliers
      },
      jiePalaceAnalysis: jiePalaceAnalysis,
      conflictAnalysis: conflictAnalysis
    };
  }

  /**
   * 生成健康預警報告（完整版，增強版）
   * @param {Object} wuxingData 五行數據
   * @param {Object} options 選項
   * @param {Object} options.palaceScores 宮位分數（可選）
   * @param {Object} options.palaceMetadata 宮位元數據（可選）
   * @param {Object} options.overlapAnalysis 疊宮分析結果（可選）
   * @param {number} options.age 當前年齡（可選）
   * @param {number} options.currentYear 當前年份（可選）
   * @param {number} options.currentMonth 當前月份（可選）
   * @param {Object} options.fourTransformations 四化系統數據（可選）
   * @returns {Object} 健康預警報告
   */
  function generateHealthWarning(wuxingData, options = {}) {
    // 向後兼容：如果第二個參數是 palaceScores 對象，轉換為 options
    if (options && typeof options === 'object' && !options.palaceScores && !options.age && !options.overlapAnalysis) {
      // 可能是舊的調用方式：generateHealthWarning(wuxingData, palaceScores)
      options = { palaceScores: options };
    }
    
    const analysis = analyzeElementHealth(wuxingData, options);

    // 生成語義解釋
    const semanticInterpretation = interpretHealthWarning(analysis);

    // 生成詳細報告
    const report = {
      riskLevel: analysis.riskLevel,
      summary: analysis.summary,
      jiePalaceNote: analysis.jiePalaceNote,
      warnings: analysis.warnings,
      recommendations: analysis.recommendations,
      elementLevels: analysis.elementLevels,
      strongestElement: analysis.strongestElement,
      weakestElement: analysis.weakestElement,
      multipliers: analysis.multipliers || {},
      jiePalaceAnalysis: analysis.jiePalaceAnalysis || {},
      conflictAnalysis: analysis.conflictAnalysis || null,
      semanticInterpretation: semanticInterpretation,
      detailedReport: generateDetailedReport(analysis)
    };

    return report;
  }

  /**
   * 生成詳細報告文字
   * @param {Object} analysis 健康分析結果
   * @returns {string} 詳細報告文字
   */
  function generateDetailedReport(analysis) {
    const parts = [];

    // 摘要
    parts.push(analysis.summary);

    // 加權資訊（如果存在）
    if (analysis.multipliers) {
      const multiplierNotes = [];
      if (analysis.multipliers.ageRisk && analysis.multipliers.ageRisk > 1.0) {
        multiplierNotes.push(`年齡風險加權：${analysis.multipliers.ageRisk.toFixed(2)}x`);
      }
      if (analysis.multipliers.jiePalaceRisk && analysis.multipliers.jiePalaceRisk !== 1.0) {
        const riskType = analysis.multipliers.jiePalaceRisk > 1.0 ? '增加' : '降低';
        multiplierNotes.push(`疾厄宮四化風險加權：${analysis.multipliers.jiePalaceRisk.toFixed(2)}x（${riskType}）`);
      }
      if (multiplierNotes.length > 0) {
        parts.push(`\n【風險加權】${multiplierNotes.join('；')}`);
      }
    }

    // 語義解釋（如果存在）
    if (analysis.semanticInterpretation) {
      const sem = analysis.semanticInterpretation;
      parts.push(`\n【${sem.semanticLabel}】`);
      parts.push(sem.semanticDescription);
      parts.push(sem.strategicAdvice);
    }

    // 相剋分析（如果存在）
    if (analysis.conflictAnalysis && analysis.conflictAnalysis.hasConflict) {
      parts.push(`\n${analysis.conflictAnalysis.conflictDescription}`);
    }

    // 疾厄宮備註
    if (analysis.jiePalaceNote) {
      parts.push(`\n${analysis.jiePalaceNote}`);
    }

    // 嚴重警告
    const criticalWarnings = analysis.warnings.filter(w => w.severity === 'critical');
    if (criticalWarnings.length > 0) {
      parts.push('\n【嚴重健康風險】');
      criticalWarnings.forEach(w => {
        parts.push(`\n${w.recommendation}`);
        parts.push(`影響系統：${w.systems.join('、')}`);
        parts.push(`常見症狀：${w.symptoms.join('、')}`);
      });
    }

    // 一般警告
    const normalWarnings = analysis.warnings.filter(w => w.severity === 'warning');
    if (normalWarnings.length > 0) {
      parts.push('\n【健康警告】');
      normalWarnings.forEach(w => {
        parts.push(`\n${w.recommendation}`);
      });
    }

    // 建議
    if (analysis.recommendations.length > 0) {
      parts.push('\n【健康建議】');
      analysis.recommendations.forEach((rec, index) => {
        parts.push(`${index + 1}. 【${rec.element}氣】${rec.action}`);
      });
    }

    return parts.join('\n');
  }

  /**
   * 五行相剋映射表（從 constants.js 導入）
   * 木克土、火克金、土克水、金克木、水克火
   */
  const ELEMENT_CONFLICT_MAP = {
    "木": "土",
    "火": "金",
    "土": "水",
    "金": "木",
    "水": "火"
  };

  /**
   * 檢查五行相剋關係（最強 vs 最弱）
   * @param {string} strongestElement 最強五行
   * @param {string} weakestElement 最弱五行
   * @param {Object} yearElementMultipliers 流年五行加權
   * @param {Object} monthElementMultipliers 流月五行加權
   * @returns {Object} 相剋分析結果
   */
  function analyzeElementConflict(strongestElement, weakestElement, yearElementMultipliers = {}, monthElementMultipliers = {}) {
    if (!strongestElement || !weakestElement) {
      return {
        hasConflict: false,
        conflictType: null,
        conflictDescription: null,
        riskMultiplier: 1.0
      };
    }

    // 檢查最強五行是否克制最弱五行
    const conflictTarget = ELEMENT_CONFLICT_MAP[strongestElement];
    const hasDirectConflict = conflictTarget === weakestElement;

    // 檢查流年/流月是否加劇相剋
    const yearStrengthensStrongest = yearElementMultipliers[strongestElement] > 1.0;
    const monthStrengthensStrongest = monthElementMultipliers[strongestElement] > 1.0;
    const yearWeakensWeakest = yearElementMultipliers[weakestElement] < 1.0;
    const monthWeakensWeakest = monthElementMultipliers[weakestElement] < 1.0;

    const hasTimeConflict = (yearStrengthensStrongest || monthStrengthensStrongest) && 
                            (yearWeakensWeakest || monthWeakensWeakest);

    if (hasDirectConflict && hasTimeConflict) {
      // 嚴重相剋：最強五行克制最弱五行，且流年/流月加劇
      return {
        hasConflict: true,
        conflictType: 'critical',
        conflictDescription: `⚠️ 嚴重相剋：流年/流月${strongestElement}氣旺盛，而你的本命${weakestElement}氣偏弱，${strongestElement}會克制${weakestElement}，導致${weakestElement}氣相關系統（${ELEMENT_HEALTH_MAP[weakestElement]?.systems.join("、") || ""}）承受額外壓力。`,
        riskMultiplier: 1.5, // 相剋風險加權 50%
        strongestElement: strongestElement,
        weakestElement: weakestElement
      };
    } else if (hasDirectConflict) {
      // 一般相剋：最強五行克制最弱五行
      return {
        hasConflict: true,
        conflictType: 'warning',
        conflictDescription: `⚠️ 相剋提醒：你的本命${strongestElement}氣最強，而${weakestElement}氣最弱，${strongestElement}會克制${weakestElement}，建議特別關注${weakestElement}氣相關系統的健康。`,
        riskMultiplier: 1.2, // 相剋風險加權 20%
        strongestElement: strongestElement,
        weakestElement: weakestElement
      };
    }

    return {
      hasConflict: false,
      conflictType: null,
      conflictDescription: null,
      riskMultiplier: 1.0
    };
  }

  /**
   * 語義轉換：將健康預警數值轉換為戰略建議
   * @param {Object} healthWarning 健康預警數據
   * @returns {Object} 語義轉換結果
   */
  function interpretHealthWarning(healthWarning) {
    if (!healthWarning || !healthWarning.multipliers) {
      return {
        semanticLevel: 'normal',
        semanticLabel: '系統運轉正常',
        semanticDescription: '五行能量相對均衡，健康狀態良好。',
        strategicAdvice: '保持規律作息和適度運動即可。'
      };
    }

    const totalRisk = healthWarning.multipliers.totalRisk || 1.0;
    const conflictAnalysis = healthWarning.conflictAnalysis || null;

    let semanticLevel = 'normal';
    let semanticLabel = '系統運轉正常';
    let semanticDescription = '';
    let strategicAdvice = '';

    // 根據總風險加權判斷語義等級
    if (totalRisk > 1.8) {
      semanticLevel = 'critical';
      semanticLabel = '紅色警戒：系統高度超載';
      semanticDescription = `總風險加權達到 ${totalRisk.toFixed(2)}x，系統處於高度超載狀態。`;
      strategicAdvice = '⚠️ 必須立即採取行動：優先處理嚴重健康風險，避免過度勞累，建議尋求專業醫療建議。';
    } else if (totalRisk > 1.2) {
      semanticLevel = 'warning';
      semanticLabel = '黃色預警：能量過度損耗';
      semanticDescription = `總風險加權達到 ${totalRisk.toFixed(2)}x，能量正在過度損耗。`;
      strategicAdvice = '⚠️ 建議調整生活節奏：關注健康警告，適度休息，避免累積壓力。';
    } else {
      semanticLevel = 'normal';
      semanticLabel = '系統運轉正常';
      semanticDescription = `總風險加權為 ${totalRisk.toFixed(2)}x，系統運轉正常。`;
      strategicAdvice = '保持規律作息和適度運動即可。';
    }

    // 如果有相剋分析，加入相剋建議
    if (conflictAnalysis && conflictAnalysis.hasConflict) {
      strategicAdvice += `\n\n${conflictAnalysis.conflictDescription}`;
      if (conflictAnalysis.conflictType === 'critical') {
        strategicAdvice += '\n建議：優先補強被克制的五行，避免在相剋月份進行重大決策。';
      }
    }

    return {
      semanticLevel: semanticLevel,
      semanticLabel: semanticLabel,
      semanticDescription: semanticDescription,
      strategicAdvice: strategicAdvice,
      totalRisk: totalRisk,
      breakdown: {
        ageRisk: healthWarning.multipliers.ageRisk || 1.0,
        jiePalaceRisk: healthWarning.multipliers.jiePalaceRisk || 1.0,
        conflictRisk: conflictAnalysis ? conflictAnalysis.riskMultiplier : 1.0
      }
    };
  }

  /**
   * 生成月度健康風險數據（生命健康心電圖）
   * @param {Object} wuxingData 五行數據
   * @param {Object} options 選項
   * @param {number} options.currentYear 當前年份
   * @param {number} options.age 當前年齡
   * @param {Object} options.palaceScores 宮位分數（可選）
   * @param {Object} options.palaceMetadata 宮位元數據（可選）
   * @param {Object} options.overlapAnalysis 疊宮分析結果（可選）
   * @param {Object} options.fourTransformations 四化系統數據（可選）
   * @returns {Array} 月度健康風險數據（1-12月）
   */
  function generateMonthlyHealthRisk(wuxingData, options = {}) {
    const {
      currentYear = new Date().getFullYear(),
      age = null,
      palaceScores = null,
      palaceMetadata = null,
      overlapAnalysis = null,
      fourTransformations = null
    } = options;

    const monthlyData = [];

    // 計算每個月的健康風險
    for (let month = 1; month <= 12; month++) {
      // 為每個月生成健康分析
      const monthOptions = {
        ...options,
        currentMonth: month
      };

      const monthAnalysis = analyzeElementHealth(wuxingData, monthOptions);
      
      // 計算綜合風險分數（0-100，越高越危險）
      let riskScore = 0;
      
      // 基礎風險：基於警告數量
      const criticalCount = monthAnalysis.warnings.filter(w => w.severity === 'critical').length;
      const warningCount = monthAnalysis.warnings.filter(w => w.severity === 'warning').length;
      riskScore += criticalCount * 30; // 每個嚴重警告 +30分
      riskScore += warningCount * 15; // 每個一般警告 +15分

      // 風險加權影響
      const totalRiskMultiplier = monthAnalysis.multipliers?.totalRisk || 1.0;
      riskScore *= totalRiskMultiplier;

      // 相剋分析（如果存在）
      if (monthAnalysis.strongestElement && monthAnalysis.weakestElement) {
        const conflictAnalysis = analyzeElementConflict(
          monthAnalysis.strongestElement,
          monthAnalysis.weakestElement,
          monthAnalysis.multipliers?.yearElement || {},
          monthAnalysis.multipliers?.monthElement || {}
        );
        if (conflictAnalysis.hasConflict) {
          riskScore *= conflictAnalysis.riskMultiplier;
          monthAnalysis.conflictAnalysis = conflictAnalysis;
        }
      }

      // 限制風險分數範圍（0-100）
      riskScore = Math.min(100, Math.max(0, riskScore));

      // 判斷風險等級
      let riskLevel = 'normal';
      if (riskScore >= 60) {
        riskLevel = 'critical';
      } else if (riskScore >= 30) {
        riskLevel = 'warning';
      }

      monthlyData.push({
        month: month,
        monthName: `${month}月`,
        riskScore: Math.round(riskScore * 10) / 10, // 保留一位小數
        riskLevel: riskLevel,
        warnings: monthAnalysis.warnings.length,
        criticalWarnings: criticalCount,
        totalRiskMultiplier: Math.round(totalRiskMultiplier * 100) / 100,
        conflictAnalysis: monthAnalysis.conflictAnalysis || null,
        semanticInterpretation: interpretHealthWarning({
          ...monthAnalysis,
          multipliers: monthAnalysis.multipliers || {}
        })
      });
    }

    return monthlyData;
  }

  // ====== 導出 ======

  // 導出到 window.HealthAnalysis（如果 window 存在）
  if (typeof window !== "undefined") {
    window.HealthAnalysis = {
      analyzeElementHealth,
      generateHealthWarning,
      interpretHealthWarning,
      analyzeElementConflict,
      generateMonthlyHealthRisk,
      ELEMENT_HEALTH_MAP,
    };
  } else if (typeof globalThis !== "undefined") {
    globalThis.HealthAnalysis = {
      analyzeElementHealth,
      generateHealthWarning,
      interpretHealthWarning,
      analyzeElementConflict,
      generateMonthlyHealthRisk,
      ELEMENT_HEALTH_MAP,
    };
  }
})();
