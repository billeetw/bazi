/* calc/aiPromptGenerator.js
 * AI Prompt 模板生成模組
 * 整合所有計算結果生成高品質的 AI Prompt，供後台管理界面使用
 * 用於判讀和命書輸出（未來收費服務）
 * 依賴: calc/constants.js, calc/helpers.js
 */

(function () {
  "use strict";

  // 檢查依賴
  if (typeof window === "undefined" || !window.CalcConstants) {
    throw new Error("calc/aiPromptGenerator.js requires calc/constants.js to be loaded first");
  }

  const { PALACE_ONE_LINERS } = window.CalcConstants;

  /**
   * 戰略標籤分類映射
   */
  const STRATEGIC_TAG_CATEGORIES = {
    LUCK: 'luck',           // 好命指數相關
    PALACE: 'palace',       // 宮位優勢相關
    ELEMENT: 'element',     // 五行能量相關
    OVERLAP: 'overlap',     // 疊宮分析相關
    HEALTH: 'health',       // 健康預警相關
    TRANSFORMATION: 'transformation', // 四化系統相關
    QUESTIONNAIRE: 'questionnaire',   // 專家問卷相關
    LOCATION: 'location'    // 地理位置相關
  };

  /**
   * 生成戰略標籤（增強版：整合所有數據源）
   * @param {Object} structuredData 結構化數據
   * @param {Object} options 選項
   * @param {boolean} options.includeDetails 是否包含詳細描述（預設false）
   * @param {number} options.maxTags 最大標籤數量（預設20）
   * @returns {Object|Array<string>} 如果 includeDetails=true 返回詳細對象，否則返回標籤陣列
   */
  function generateStrategicTags(structuredData, options = {}) {
    const {
      includeDetails = false,
      maxTags = 20
    } = options;

    const tags = [];
    const tagDetails = []; // 詳細標籤信息

    // 1. 基於好命指數
    if (structuredData.luckIndex) {
      const luckIndex = structuredData.luckIndex.luckIndex || 0;
      let tag = null;
      let description = null;
      
      if (luckIndex >= 90) {
        tag = "#極佳命盤";
        description = "好命指數達到90分以上，命盤配置極佳，具有強大的先天優勢";
      } else if (luckIndex >= 80) {
        tag = "#優秀命盤";
        description = "好命指數達到80-89分，命盤配置優秀，具備良好的發展潛力";
      } else if (luckIndex >= 70) {
        tag = "#良好命盤";
        description = "好命指數達到70-79分，命盤配置良好，有穩定的發展基礎";
      } else if (luckIndex < 60) {
        tag = "#需要努力";
        description = "好命指數低於60分，需要通過後天努力來補強命盤配置";
      }
      
      if (tag) {
        tags.push(tag);
        if (includeDetails) {
          tagDetails.push({
            tag: tag,
            category: STRATEGIC_TAG_CATEGORIES.LUCK,
            priority: luckIndex >= 80 ? 'high' : 'medium',
            description: description,
            score: luckIndex
          });
        }
      }
    }

    // 2. 基於最強宮位
    if (structuredData.topPalaces && structuredData.topPalaces.length > 0) {
      structuredData.topPalaces.slice(0, 3).forEach((palace, index) => {
        const palaceDesc = PALACE_ONE_LINERS[palace] || palace;
        const tag = `#${palaceDesc}優勢`;
        tags.push(tag);
        
        if (includeDetails) {
          const palaceScore = structuredData.palaceScores?.[palace] || 0;
          tagDetails.push({
            tag: tag,
            category: STRATEGIC_TAG_CATEGORIES.PALACE,
            priority: index === 0 ? 'high' : 'medium',
            description: `${palace}宮能量強勁（${palaceScore.toFixed(1)}分），是命主的優勢領域`,
            palace: palace,
            score: palaceScore,
            rank: index + 1
          });
        }
      });
    }

    // 3. 基於五行狀態
    if (structuredData.fiveElements) {
      const strongest = structuredData.fiveElements.strongestElement;
      const weakest = structuredData.fiveElements.weakestElement;
      
      if (strongest) {
        const tag = `#${strongest}氣主導`;
        tags.push(tag);
        if (includeDetails) {
          tagDetails.push({
            tag: tag,
            category: STRATEGIC_TAG_CATEGORIES.ELEMENT,
            priority: 'high',
            description: `${strongest}氣能量最強，是命主的性格底色和行為模式主導元素`,
            element: strongest,
            type: 'strongest'
          });
        }
      }
      
      if (weakest) {
        const tag = `#${weakest}氣需補強`;
        tags.push(tag);
        if (includeDetails) {
          tagDetails.push({
            tag: tag,
            category: STRATEGIC_TAG_CATEGORIES.ELEMENT,
            priority: 'medium',
            description: `${weakest}氣能量偏弱，需要特別關注和補強`,
            element: weakest,
            type: 'weakest'
          });
        }
      }
    }

    // 4. 基於疊宮分析
    if (structuredData.overlapAnalysis) {
      const { criticalRisks, maxOpportunities, volatileAmbivalences } = structuredData.overlapAnalysis;
      
      // 優先處理劇烈震盪（最高優先級）
      if (volatileAmbivalences && volatileAmbivalences.length > 0) {
        volatileAmbivalences.forEach(volatile => {
          const tag = `#${volatile.palace}宮劇烈震盪`;
          tags.push(tag);
          if (includeDetails) {
            tagDetails.push({
              tag: tag,
              category: STRATEGIC_TAG_CATEGORIES.OVERLAP,
              priority: 'critical',
              description: `${volatile.palace}宮出現${volatile.jiCount}重化忌疊加與${volatile.luCount}重化祿疊加，能量極端對沖，成敗一線間`,
              palace: volatile.palace,
              resonanceType: 'VOLATILE_AMBIVALENCE',
              jiCount: volatile.jiCount,
              luCount: volatile.luCount,
              note: volatile.note
            });
          }
        });
      }
      
      if (criticalRisks && criticalRisks.length > 0) {
        criticalRisks.forEach(risk => {
          const tag = `#${risk.palace}宮地雷區`;
          tags.push(tag);
          if (includeDetails) {
            tagDetails.push({
              tag: tag,
              category: STRATEGIC_TAG_CATEGORIES.OVERLAP,
              priority: 'critical',
              description: `${risk.palace}宮出現${risk.jiCount}重化忌疊加，是超級地雷區，必須絕對避開`,
              palace: risk.palace,
              riskLevel: 'critical',
              jiCount: risk.jiCount
            });
          }
        });
      }
      
      if (maxOpportunities && maxOpportunities.length > 0) {
        maxOpportunities.forEach(opp => {
          const tag = `#${opp.palace}宮大機會`;
          tags.push(tag);
          if (includeDetails) {
            tagDetails.push({
              tag: tag,
              category: STRATEGIC_TAG_CATEGORIES.OVERLAP,
              priority: 'high',
              description: `${opp.palace}宮出現${opp.luCount}重化祿疊加，是大發財機會，建議積極把握`,
              palace: opp.palace,
              opportunityLevel: 'max',
              luCount: opp.luCount
            });
          }
        });
      }
    }

    // 5. 基於健康預警（包含語義解釋）
    if (structuredData.healthWarning) {
      const semanticInterpretation = structuredData.healthWarning.semanticInterpretation;
      
      if (semanticInterpretation) {
        if (semanticInterpretation.semanticLevel === 'critical') {
          const tag = "#紅色警戒";
          tags.push(tag);
          if (includeDetails) {
            tagDetails.push({
              tag: tag,
              category: STRATEGIC_TAG_CATEGORIES.HEALTH,
              priority: 'critical',
              description: semanticInterpretation.semanticDescription,
              riskLevel: 'critical',
              totalRisk: semanticInterpretation.totalRisk
            });
          }
        } else if (semanticInterpretation.semanticLevel === 'warning') {
          const tag = "#黃色預警";
          tags.push(tag);
          if (includeDetails) {
            tagDetails.push({
              tag: tag,
              category: STRATEGIC_TAG_CATEGORIES.HEALTH,
              priority: 'medium',
              description: semanticInterpretation.semanticDescription,
              riskLevel: 'warning',
              totalRisk: semanticInterpretation.totalRisk
            });
          }
        }
      } else {
        const riskLevel = structuredData.healthWarning.riskLevel;
        if (riskLevel === 'critical') {
          const tag = "#健康高風險";
          tags.push(tag);
          if (includeDetails) {
            tagDetails.push({
              tag: tag,
              category: STRATEGIC_TAG_CATEGORIES.HEALTH,
              priority: 'critical',
              description: "健康風險等級為嚴重，需要立即採取行動",
              riskLevel: 'critical'
            });
          }
        } else if (riskLevel === 'warning') {
          const tag = "#健康需注意";
          tags.push(tag);
          if (includeDetails) {
            tagDetails.push({
              tag: tag,
              category: STRATEGIC_TAG_CATEGORIES.HEALTH,
              priority: 'medium',
              description: "健康風險等級為警告，需要適度關注",
              riskLevel: 'warning'
            });
          }
        }
      }
    }

    // 6. 基於四化系統
    if (structuredData.fourTransformations) {
      const { benming, dalimit, liunian } = structuredData.fourTransformations;
      
      // 本命四化特徵
      if (benming && benming.mutagenStars) {
        if (benming.mutagenStars.祿) {
          const tag = `#本命${benming.mutagenStars.祿}化祿`;
          tags.push(tag);
          if (includeDetails) {
            tagDetails.push({
              tag: tag,
              category: STRATEGIC_TAG_CATEGORIES.TRANSFORMATION,
              priority: 'high',
              description: `本命${benming.mutagenStars.祿}化祿，天生具備財運和機會`,
              transformation: '祿',
              star: benming.mutagenStars.祿,
              level: 'benming'
            });
          }
        }
        if (benming.mutagenStars.忌) {
          const tag = `#本命${benming.mutagenStars.忌}化忌`;
          tags.push(tag);
          if (includeDetails) {
            tagDetails.push({
              tag: tag,
              category: STRATEGIC_TAG_CATEGORIES.TRANSFORMATION,
              priority: 'medium',
              description: `本命${benming.mutagenStars.忌}化忌，需要注意壓力和挑戰`,
              transformation: '忌',
              star: benming.mutagenStars.忌,
              level: 'benming'
            });
          }
        }
      }

      // 大限四化特徵
      if (dalimit && dalimit.palace) {
        const tag = `#大限在${dalimit.palace}`;
        tags.push(tag);
        if (includeDetails) {
          tagDetails.push({
            tag: tag,
            category: STRATEGIC_TAG_CATEGORIES.TRANSFORMATION,
            priority: 'high',
            description: `當前大限在${dalimit.palace}，這十年最有感的領域`,
            palace: dalimit.palace,
            level: 'dalimit'
          });
        }
      }

      // 流年四化特徵
      if (liunian && liunian.palace) {
        const tag = `#流年在${liunian.palace}`;
        tags.push(tag);
        if (includeDetails) {
          tagDetails.push({
            tag: tag,
            category: STRATEGIC_TAG_CATEGORIES.TRANSFORMATION,
            priority: 'medium',
            description: `當前流年在${liunian.palace}，當下反應最直接的領域`,
            palace: liunian.palace,
            level: 'liunian'
          });
        }
      }
    }

    // 7. 基於專家問卷（新增）
    if (structuredData.expertQuestionnaire && structuredData.expertQuestionnaire.answers) {
      const answers = structuredData.expertQuestionnaire.answers;
      const categoryCounts = {
        psychology: 0,
        behavior: 0,
        resilience: 0
      };

      // 統計各類別答案
      Object.values(answers).forEach(answer => {
        if (answer.category && categoryCounts.hasOwnProperty(answer.category)) {
          categoryCounts[answer.category]++;
        }
      });

      // 根據問卷結果生成標籤
      if (categoryCounts.psychology >= 3) {
        const tag = "#心理原型明確";
        tags.push(tag);
        if (includeDetails) {
          tagDetails.push({
            tag: tag,
            category: STRATEGIC_TAG_CATEGORIES.QUESTIONNAIRE,
            priority: 'medium',
            description: "專家問卷顯示心理原型特質明確，可以進行深度個性化分析",
            questionnaireCategory: 'psychology',
            count: categoryCounts.psychology
          });
        }
      }

      if (categoryCounts.behavior >= 3) {
        const tag = "#行為偏好清晰";
        tags.push(tag);
        if (includeDetails) {
          tagDetails.push({
            tag: tag,
            category: STRATEGIC_TAG_CATEGORIES.QUESTIONNAIRE,
            priority: 'medium',
            description: "專家問卷顯示行為偏好清晰，可以進行精準的行為模式分析",
            questionnaireCategory: 'behavior',
            count: categoryCounts.behavior
          });
        }
      }

      if (categoryCounts.resilience >= 3) {
        const tag = "#抗壓機制完整";
        tags.push(tag);
        if (includeDetails) {
          tagDetails.push({
            tag: tag,
            category: STRATEGIC_TAG_CATEGORIES.QUESTIONNAIRE,
            priority: 'medium',
            description: "專家問卷顯示抗壓機制完整，可以進行全面的壓力管理分析",
            questionnaireCategory: 'resilience',
            count: categoryCounts.resilience
          });
        }
      }
    }

    // 8. 基於地理位置（新增）
    if (structuredData.geolocation && structuredData.geolocation.longitude && structuredData.geolocation.latitude) {
      const lon = structuredData.geolocation.longitude;
      const lat = structuredData.geolocation.latitude;
      
      // 判斷地理位置特徵（簡化版，可擴展）
      if (lat >= 20 && lat <= 30 && lon >= 100 && lon <= 130) {
        const tag = "#東亞地區";
        tags.push(tag);
        if (includeDetails) {
          tagDetails.push({
            tag: tag,
            category: STRATEGIC_TAG_CATEGORIES.LOCATION,
            priority: 'low',
            description: "出生地點位於東亞地區，可進行地區文化特徵分析",
            longitude: lon,
            latitude: lat,
            region: 'East Asia'
          });
        }
      }
    }

    // 限制標籤數量
    const finalTags = tags.slice(0, maxTags);
    const finalTagDetails = tagDetails.slice(0, maxTags);

    // 按優先級排序（如果包含詳細信息）
    if (includeDetails) {
      const priorityOrder = { 'critical': 0, 'high': 1, 'medium': 2, 'low': 3 };
      finalTagDetails.sort((a, b) => {
        const aPriority = priorityOrder[a.priority] || 3;
        const bPriority = priorityOrder[b.priority] || 3;
        return aPriority - bPriority;
      });
      
      return {
        tags: finalTags,
        details: finalTagDetails,
        summary: {
          totalTags: finalTags.length,
          categories: {
            luck: finalTagDetails.filter(t => t.category === STRATEGIC_TAG_CATEGORIES.LUCK).length,
            palace: finalTagDetails.filter(t => t.category === STRATEGIC_TAG_CATEGORIES.PALACE).length,
            element: finalTagDetails.filter(t => t.category === STRATEGIC_TAG_CATEGORIES.ELEMENT).length,
            overlap: finalTagDetails.filter(t => t.category === STRATEGIC_TAG_CATEGORIES.OVERLAP).length,
            health: finalTagDetails.filter(t => t.category === STRATEGIC_TAG_CATEGORIES.HEALTH).length,
            transformation: finalTagDetails.filter(t => t.category === STRATEGIC_TAG_CATEGORIES.TRANSFORMATION).length,
            questionnaire: finalTagDetails.filter(t => t.category === STRATEGIC_TAG_CATEGORIES.QUESTIONNAIRE).length,
            location: finalTagDetails.filter(t => t.category === STRATEGIC_TAG_CATEGORIES.LOCATION).length
          }
        }
      };
    }

    return finalTags;
  }

  /**
   * 生成核心數據摘要
   * @param {Object} structuredData 結構化數據
   * @returns {string} 核心數據摘要文字
   */
  function generateCoreDataSummary(structuredData) {
    const parts = [];

    // 好命指數
    if (structuredData.luckIndex) {
      const luckIndex = structuredData.luckIndex.luckIndex || 0;
      const description = structuredData.luckIndex.description || '';
      parts.push(`- 好命指數：${luckIndex}/100（${description}）`);
    }

    // 最強宮位
    if (structuredData.topPalaces && structuredData.topPalaces.length > 0) {
      const topPalaces = structuredData.topPalaces.slice(0, 3).join("、");
      parts.push(`- 最強宮位：${topPalaces}`);
    }

    // 五行狀態
    if (structuredData.fiveElements) {
      const strongest = structuredData.fiveElements.strongestElement;
      const weakest = structuredData.fiveElements.weakestElement;
      if (strongest && weakest) {
        parts.push(`- 五行狀態：${strongest}氣最強，${weakest}氣需補強`);
      }
    }

    // 疊宮分析摘要
    if (structuredData.overlapAnalysis) {
      const { summary } = structuredData.overlapAnalysis;
      if (summary) {
        if (summary.totalCriticalRisks > 0) {
          parts.push(`- 超級地雷區：${summary.riskPalaces.join("、")}（${summary.totalCriticalRisks}處）`);
        }
        if (summary.totalMaxOpportunities > 0) {
          parts.push(`- 大發財機會：${summary.opportunityPalaces.join("、")}（${summary.totalMaxOpportunities}處）`);
        }
      }
    }

    // 健康預警摘要（包含語義解釋）
    if (structuredData.healthWarning) {
      const riskLevel = structuredData.healthWarning.riskLevel;
      const semanticInterpretation = structuredData.healthWarning.semanticInterpretation;
      
      if (semanticInterpretation) {
        parts.push(`- 健康狀態：${semanticInterpretation.semanticLabel}`);
      } else if (riskLevel !== 'normal') {
        parts.push(`- 健康預警：${riskLevel === 'critical' ? '嚴重風險' : '一般警告'}`);
      }
    }

    return parts.join('\n');
  }

  /**
   * 生成四化系統詳細說明
   * @param {Object} structuredData 結構化數據
   * @returns {string} 四化系統說明文字
   */
  function generateFourTransformationsDetail(structuredData) {
    if (!structuredData.fourTransformations) {
      return "四化系統數據不足";
    }

    const { benming, dalimit, liunian, xiaoxian } = structuredData.fourTransformations;
    const parts = [];

    parts.push("## 四化系統分析\n");

    // 本命四化
    if (benming && benming.mutagenStars) {
      const sihua = [];
      if (benming.mutagenStars.祿) sihua.push(`${benming.mutagenStars.祿}化祿`);
      if (benming.mutagenStars.權) sihua.push(`${benming.mutagenStars.權}化權`);
      if (benming.mutagenStars.科) sihua.push(`${benming.mutagenStars.科}化科`);
      if (benming.mutagenStars.忌) sihua.push(`${benming.mutagenStars.忌}化忌`);
      if (sihua.length > 0) {
        parts.push(`- **本命四化**（生年${benming.stem}）：${sihua.join("、")}`);
      }
    }

    // 大限四化
    if (dalimit && dalimit.palace) {
      const sihua = [];
      if (dalimit.mutagenStars) {
        if (dalimit.mutagenStars.祿) sihua.push(`${dalimit.mutagenStars.祿}化祿`);
        if (dalimit.mutagenStars.權) sihua.push(`${dalimit.mutagenStars.權}化權`);
        if (dalimit.mutagenStars.科) sihua.push(`${dalimit.mutagenStars.科}化科`);
        if (dalimit.mutagenStars.忌) sihua.push(`${dalimit.mutagenStars.忌}化忌`);
      }
      if (sihua.length > 0) {
        parts.push(`- **大限四化**（${dalimit.palace}，${dalimit.stem}）：${sihua.join("、")} - 這十年最有感`);
      }
    }

    // 流年四化
    if (liunian && liunian.palace) {
      const sihua = [];
      if (liunian.mutagenStars) {
        if (liunian.mutagenStars.祿) sihua.push(`${liunian.mutagenStars.祿}化祿`);
        if (liunian.mutagenStars.權) sihua.push(`${liunian.mutagenStars.權}化權`);
        if (liunian.mutagenStars.科) sihua.push(`${liunian.mutagenStars.科}化科`);
        if (liunian.mutagenStars.忌) sihua.push(`${liunian.mutagenStars.忌}化忌`);
      }
      if (sihua.length > 0) {
        parts.push(`- **流年四化**（${liunian.palace}，${liunian.stem}${liunian.branch}）：${sihua.join("、")} - 當下反應最直接`);
      }
    }

    // 小限四化
    if (xiaoxian && xiaoxian.palace) {
      const sihua = [];
      if (xiaoxian.mutagenStars) {
        if (xiaoxian.mutagenStars.祿) sihua.push(`${xiaoxian.mutagenStars.祿}化祿`);
        if (xiaoxian.mutagenStars.權) sihua.push(`${xiaoxian.mutagenStars.權}化權`);
        if (xiaoxian.mutagenStars.科) sihua.push(`${xiaoxian.mutagenStars.科}化科`);
        if (xiaoxian.mutagenStars.忌) sihua.push(`${xiaoxian.mutagenStars.忌}化忌`);
      }
      if (sihua.length > 0) {
        parts.push(`- **小限四化**（${xiaoxian.palace}，${xiaoxian.stem}）：${sihua.join("、")}`);
      }
    }

    return parts.join('\n');
  }

  /**
   * 生成疊宮分析詳細說明
   * @param {Object} structuredData 結構化數據
   * @returns {string} 疊宮分析說明文字
   */
  function generateOverlapAnalysisDetail(structuredData) {
    if (!structuredData.overlapAnalysis) {
      return "";
    }

    const { criticalRisks, maxOpportunities, comments } = structuredData.overlapAnalysis;
    const parts = [];

    parts.push("## 疊宮與引爆分析\n");

    // 劇烈震盪/吉凶並見（最高優先級）
    const volatileAmbivalences = structuredData.overlapAnalysis?.volatileAmbivalences || [];
    if (volatileAmbivalences.length > 0) {
      parts.push("### ⚡ 劇烈震盪/吉凶並見（成敗一線間）");
      volatileAmbivalences.forEach(volatile => {
        parts.push(`- **${volatile.palace}宮**：${volatile.description}`);
        parts.push(`  - **戰略註解**：${volatile.note}`);
        parts.push(`  - **AI 指引**：此宮位處於「成敗一線間」，需提醒客戶：先求生存，再求壯大。雖有巨大獲利空間，但伴隨系統性崩潰風險。非專業操作者應以防守為主。`);
      });
      parts.push("");
    }

    // 超級地雷區
    if (criticalRisks && criticalRisks.length > 0) {
      parts.push("### ⚠️ 超級地雷區（必須絕對避開）");
      criticalRisks.forEach(risk => {
        parts.push(`- **${risk.palace}宮**：${risk.description}`);
      });
      parts.push("");
    }

    // 大發財機會
    if (maxOpportunities && maxOpportunities.length > 0) {
      parts.push("### ✨ 大發財機會（建議積極把握）");
      maxOpportunities.forEach(opp => {
        parts.push(`- **${opp.palace}宮**：${opp.description}`);
      });
      parts.push("");
    }

    // 疊宮評論
    if (comments && comments.length > 0) {
      parts.push("### 📊 疊宮評論");
      comments.forEach(comment => {
        parts.push(`- ${comment}`);
      });
    }

    return parts.join('\n');
  }

  /**
   * 生成健康預警詳細說明
   * @param {Object} structuredData 結構化數據
   * @returns {string} 健康預警說明文字
   */
  function generateHealthWarningDetail(structuredData) {
    if (!structuredData.healthWarning) {
      return "";
    }

    const { warnings, recommendations, riskLevel, jiePalaceNote } = structuredData.healthWarning;
    const parts = [];

    if (riskLevel !== 'normal') {
      parts.push("## 五行健康預警\n");

      // 疾厄宮備註
      if (jiePalaceNote) {
        parts.push(jiePalaceNote);
        parts.push("");
      }

      // 嚴重警告
      const criticalWarnings = warnings.filter(w => w.severity === 'critical');
      if (criticalWarnings.length > 0) {
        parts.push("### 🚨 嚴重健康風險");
        criticalWarnings.forEach(w => {
          parts.push(`- **${w.element}氣偏弱**：${w.risk}`);
          parts.push(`  - 影響系統：${w.systems.join("、")}`);
          parts.push(`  - 常見症狀：${w.symptoms.join("、")}`);
        });
        parts.push("");
      }

      // 一般警告
      const normalWarnings = warnings.filter(w => w.severity === 'warning');
      if (normalWarnings.length > 0) {
        parts.push("### ⚠️ 健康警告");
        normalWarnings.forEach(w => {
          parts.push(`- **${w.element}氣${w.type === 'weak' ? '偏弱' : '過旺'}**：${w.risk}`);
        });
        parts.push("");
      }

      // 健康建議
      if (recommendations && recommendations.length > 0) {
        parts.push("### 💡 健康建議");
        recommendations.forEach((rec, index) => {
          const urgency = rec.urgency === 'urgent' ? '【緊急】' : '';
          parts.push(`${index + 1}. ${urgency}【${rec.element}氣】${rec.action}`);
        });
      }
    }

    return parts.join('\n');
  }

  /**
   * 生成完整 AI Prompt（#深度貼文風格）
   * @param {Object} structuredData 結構化數據
   * @param {Object} options 選項
   * @param {string} options.targetLength 目標字數（預設1500字）
   * @param {boolean} options.includeDetails 是否包含詳細數據（預設true）
   * @returns {string} 完整的 AI Prompt
   */
  function generateAIPrompt(structuredData, options = {}) {
    const {
      targetLength = 1500,
      includeDetails = true
    } = options;

    const prompt = [];

    // 標題
    prompt.push("# 命書生成 Prompt\n");
    prompt.push(`**目標字數**：${targetLength}字\n`);
    prompt.push(`**風格**：#深度貼文風格（語氣冷靜、中性、具備系統思維與商務決策直覺）\n`);

    // 命主特徵標籤（增強版：包含詳細描述）
    const strategicTagsResult = generateStrategicTags(structuredData, { includeDetails: true });
    const strategicTags = Array.isArray(strategicTagsResult) ? strategicTagsResult : strategicTagsResult.tags;
    
    if (strategicTags.length > 0) {
      prompt.push("## 命主特徵標籤\n");
      prompt.push(strategicTags.join(" "));
      prompt.push("\n");
      
      // 如果有詳細信息，添加標籤分類摘要
      if (!Array.isArray(strategicTagsResult) && strategicTagsResult.summary) {
        const summary = strategicTagsResult.summary;
        const categoryNames = {
          luck: '好命指數',
          palace: '宮位優勢',
          element: '五行能量',
          overlap: '疊宮分析',
          health: '健康預警',
          transformation: '四化系統',
          questionnaire: '專家問卷',
          location: '地理位置'
        };
        
        const activeCategories = Object.entries(summary.categories)
          .filter(([key, count]) => count > 0)
          .map(([key, count]) => `${categoryNames[key] || key}(${count})`)
          .join('、');
        
        if (activeCategories) {
          prompt.push(`**標籤分類**：${activeCategories}\n`);
        }
      }
      prompt.push("\n");
    }

    // 核心數據
    prompt.push("## 核心數據\n");
    prompt.push(generateCoreDataSummary(structuredData));
    prompt.push("\n");

    // 詳細數據（如果啟用）
    if (includeDetails) {
      // 四化系統詳細說明
      const fourTransformationsDetail = generateFourTransformationsDetail(structuredData);
      if (fourTransformationsDetail) {
        prompt.push(fourTransformationsDetail);
        prompt.push("\n");
      }

      // 疊宮分析詳細說明
      const overlapDetail = generateOverlapAnalysisDetail(structuredData);
      if (overlapDetail) {
        prompt.push(overlapDetail);
        prompt.push("\n");
      }

      // 健康預警詳細說明
      const healthDetail = generateHealthWarningDetail(structuredData);
      if (healthDetail) {
        prompt.push(healthDetail);
        prompt.push("\n");
      }
    }

    // 深度分析要求
    prompt.push("## 深度分析要求\n");
    prompt.push("請以「#深度貼文」風格撰寫命書，重點分析：\n");
    prompt.push("\n");
    prompt.push("### 1. 命主核心特質與優勢領域\n");
    prompt.push("- 基於好命指數和最強宮位，分析命主的核心優勢\n");
    prompt.push("- 說明命主在哪些領域具有天然優勢，適合優先投入資源\n");
    prompt.push("- 結合五行狀態，分析命主的性格底色與行為模式\n");
    prompt.push("\n");

    prompt.push("### 2. 十年大限導航建議\n");
    if (structuredData.fourTransformations && structuredData.fourTransformations.dalimit) {
      const dalimit = structuredData.fourTransformations.dalimit;
      prompt.push(`- 當前大限在**${dalimit.palace}**（${dalimit.stem}），這十年最有感的領域\n`);
      if (dalimit.mutagenStars) {
        const sihua = [];
        if (dalimit.mutagenStars.祿) sihua.push(`${dalimit.mutagenStars.祿}化祿`);
        if (dalimit.mutagenStars.權) sihua.push(`${dalimit.mutagenStars.權}化權`);
        if (dalimit.mutagenStars.科) sihua.push(`${dalimit.mutagenStars.科}化科`);
        if (dalimit.mutagenStars.忌) sihua.push(`${dalimit.mutagenStars.忌}化忌`);
        if (sihua.length > 0) {
          prompt.push(`- 大限四化：${sihua.join("、")}，影響這十年的運勢走向\n`);
        }
      }
    }
    prompt.push("- 提供具體的大限導航建議，包括資源投入重點和風險規避策略\n");
    prompt.push("\n");

    prompt.push("### 3. 流年關鍵風險與機會\n");
    const currentYear = structuredData.currentYear || new Date().getFullYear();
    prompt.push(`- **${currentYear}年**流年分析：\n`);
    if (structuredData.fourTransformations && structuredData.fourTransformations.liunian) {
      const liunian = structuredData.fourTransformations.liunian;
      prompt.push(`  - 流年在**${liunian.palace}**（${liunian.stem}${liunian.branch}），當下反應最直接的領域\n`);
      if (liunian.mutagenStars) {
        const sihua = [];
        if (liunian.mutagenStars.祿) sihua.push(`${liunian.mutagenStars.祿}化祿`);
        if (liunian.mutagenStars.權) sihua.push(`${liunian.mutagenStars.權}化權`);
        if (liunian.mutagenStars.科) sihua.push(`${liunian.mutagenStars.科}化科`);
        if (liunian.mutagenStars.忌) sihua.push(`${liunian.mutagenStars.忌}化忌`);
        if (sihua.length > 0) {
          prompt.push(`  - 流年四化：${sihua.join("、")}\n`);
        }
      }
    }
    
    // 疊宮分析中的關鍵風險和機會
    if (structuredData.overlapAnalysis) {
      const { criticalRisks, maxOpportunities, volatileAmbivalences } = structuredData.overlapAnalysis;
      
      // 優先顯示劇烈震盪（最高優先級）
      if (volatileAmbivalences && volatileAmbivalences.length > 0) {
        prompt.push(`  - ⚡ **劇烈震盪/吉凶並見（成敗一線間）**：${volatileAmbivalences.map(v => v.palace).join("、")}，能量極端對沖，需特別謹慎\n`);
      }
      
      if (criticalRisks && criticalRisks.length > 0) {
        prompt.push(`  - ⚠️ **超級地雷區**：${criticalRisks.map(r => r.palace).join("、")}，必須絕對避開\n`);
      }
      if (maxOpportunities && maxOpportunities.length > 0) {
        prompt.push(`  - ✨ **大發財機會**：${maxOpportunities.map(o => o.palace).join("、")}，建議積極把握\n`);
      }
    }
    prompt.push("\n");

    prompt.push("### 4. 健康管理建議\n");
    if (structuredData.healthWarning) {
      const semanticInterpretation = structuredData.healthWarning.semanticInterpretation;
      
      if (semanticInterpretation) {
        prompt.push(`- **${semanticInterpretation.semanticLabel}**：${semanticInterpretation.semanticDescription}\n`);
        prompt.push(`- **戰略建議**：${semanticInterpretation.strategicAdvice}\n`);
      } else if (structuredData.healthWarning.riskLevel !== 'normal') {
        prompt.push("- 基於五行健康預警，提供個人化的健康管理建議\n");
        if (structuredData.healthWarning.warnings && structuredData.healthWarning.warnings.length > 0) {
          const criticalWarnings = structuredData.healthWarning.warnings.filter(w => w.severity === 'critical');
          if (criticalWarnings.length > 0) {
            prompt.push(`- **嚴重健康風險**：${criticalWarnings.map(w => w.element + '氣').join("、")}相關系統需要特別注意\n`);
          }
        }
      } else {
        prompt.push("- 五行能量相對均衡，建議保持規律作息和適度運動\n");
      }
      
      // 月度健康風險心電圖（如果存在）
      if (structuredData.monthlyHealthRisk && structuredData.monthlyHealthRisk.length > 0) {
        const criticalMonths = structuredData.monthlyHealthRisk.filter(m => m.riskLevel === 'critical');
        const warningMonths = structuredData.monthlyHealthRisk.filter(m => m.riskLevel === 'warning');
        
        if (criticalMonths.length > 0) {
          prompt.push(`- **高風險月份**：${criticalMonths.map(m => m.monthName).join("、")}，風險分數超過60分，建議特別注意健康管理\n`);
        }
        if (warningMonths.length > 0) {
          prompt.push(`- **需注意月份**：${warningMonths.map(m => m.monthName).join("、")}，風險分數在30-60分之間，建議適度調整生活節奏\n`);
        }
      }
    } else {
      prompt.push("- 五行能量相對均衡，建議保持規律作息和適度運動\n");
    }
    prompt.push("\n");

    prompt.push("### 5. 戰略行動建議\n");
    prompt.push("- 基於命盤分析，提供具體的戰略行動建議\n");
    prompt.push("- 說明在哪些領域應該「全速推進」，哪些領域應該「聚焦優化」\n");
    prompt.push("- 結合流月數據，提供時機選擇建議\n");
    prompt.push("\n");

    // 寫作要求
    prompt.push("## 寫作要求\n");
    prompt.push("1. **語氣**：冷靜、中性、具備系統思維與商務決策直覺\n");
    prompt.push("2. **風格**：#深度貼文風格，蘊含溫和鼓勵性質\n");
    prompt.push("3. **結構**：邏輯清晰，層次分明，重點突出\n");
    prompt.push("4. **內容**：基於數據分析，避免空泛描述，提供具體可行的建議\n");
    prompt.push("5. **字數**：約1500字，確保內容充實且易讀\n");
    prompt.push("\n");

    // 結尾
    prompt.push("---\n");
    prompt.push("**請開始撰寫命書**\n");

    return prompt.join('');
  }

  /**
   * 從全局狀態收集結構化數據
   * @param {Object} options 選項
   * @param {number} options.currentYear 當前年份
   * @param {number} options.age 當前年齡
   * @returns {Object} 結構化數據
   */
  function collectStructuredData(options = {}) {
    const {
      currentYear = new Date().getFullYear(),
      age = null
    } = options;

    const structuredData = {
      currentYear: currentYear,
      age: age,
      
      // 好命指數
      luckIndex: null,
      
      // 宮位分數和元數據
      palaceScores: null,
      palaceMetadata: null,
      topPalaces: [],
      
      // 四化系統
      fourTransformations: null,
      
      // 疊宮分析
      overlapAnalysis: null,
      
      // 五行數據
      fiveElements: null,
      
      // 健康預警
      healthWarning: null,
      
      // 流月數據
      liuyue: null,
      
      // 月度健康風險數據（生命健康心電圖）
      monthlyHealthRisk: null
    };

    // 從全局狀態收集數據
    if (typeof window !== "undefined") {
      // 好命指數
      if (window.luckIndex) {
        structuredData.luckIndex = window.luckIndex;
      }

      // 宮位分數和元數據
      if (window.ziweiPalaceMetadata) {
        structuredData.palaceMetadata = window.ziweiPalaceMetadata;
        
        // 計算最強宮位（前3名）
        const palaceEntries = Object.entries(window.ziweiPalaceMetadata)
          .filter(([name, data]) => data && typeof data === 'object' && data.l9Output)
          .map(([name, data]) => ({
            name,
            score: data.l9Output?.stars || 0,
            internalLevel: data.l9Output?.internalLevel || 3
          }))
          .sort((a, b) => b.score - a.score);
        
        structuredData.topPalaces = palaceEntries.slice(0, 3).map(p => p.name);
        
        // 構建宮位分數對象
        const scores = {};
        palaceEntries.forEach(p => {
          scores[p.name] = p.score;
        });
        structuredData.palaceScores = scores;
      }

      // 四化系統（需要從計算流程中獲取，這裡先標記）
      // 實際使用時應該從 computeAllPalaceScores 的返回值或全局狀態獲取
      if (window.fourTransformations) {
        structuredData.fourTransformations = window.fourTransformations;
      }

      // 疊宮分析
      if (window.overlapAnalysis) {
        structuredData.overlapAnalysis = window.overlapAnalysis;
      }

      // 五行數據
      if (window.wuxingData) {
        structuredData.fiveElements = window.wuxingData;
      } else if (window.contract && window.contract.bazi && window.contract.bazi.wuxing) {
        // 從 contract 獲取五行數據
        const wx = window.contract.bazi.wuxing.strategic || window.contract.bazi.wuxing.raw || {};
        if (window.CalcHelpers) {
          const { getStrongestWeakest } = window.CalcHelpers;
          const { strongest, weakest } = getStrongestWeakest(wx, ["木", "火", "土", "金", "水"]);
          structuredData.fiveElements = {
            strongestElement: strongest,
            weakestElement: weakest,
            raw: wx
          };
        }
      }

      // 健康預警
      if (window.healthWarning) {
        structuredData.healthWarning = window.healthWarning;
      }

      // 流月數據
      if (window.liuyueData) {
        structuredData.liuyue = window.liuyueData;
      }

      // 月度健康風險數據（生命健康心電圖）
      if (window.monthlyHealthRisk) {
        structuredData.monthlyHealthRisk = window.monthlyHealthRisk;
      }

      // 經緯度校準數據（如果存在）
      if (window.geolocationData || window.GeolocationCalibration) {
        const geoData = window.geolocationData || 
          (window.GeolocationCalibration ? window.GeolocationCalibration.getGeolocationData() : null);
        
        if (geoData && geoData.longitude !== null && geoData.latitude !== null) {
          structuredData.geolocation = {
            longitude: geoData.longitude,
            latitude: geoData.latitude,
            accuracy: geoData.accuracy,
            source: geoData.source,
            timestamp: geoData.timestamp
          };
        }
      }

      // 15題專家問卷數據（如果存在）
      if (window.expertQuestionnaire || window.ExpertQuestionnaire) {
        const questionnaireData = window.expertQuestionnaire || 
          (window.ExpertQuestionnaire ? window.ExpertQuestionnaire.getAnswers() : null);
        
        if (questionnaireData && Object.keys(questionnaireData).length > 0) {
          const summary = window.ExpertQuestionnaire ? window.ExpertQuestionnaire.getSummary() : null;
          structuredData.expertQuestionnaire = {
            answers: questionnaireData,
            summary: summary || {
              totalAnswered: Object.keys(questionnaireData).length,
              totalQuestions: 15,
              completionRate: (Object.keys(questionnaireData).length / 15) * 100
            }
          };
        }
      }
    }

    return structuredData;
  }

  // ====== 導出 ======

  /**
   * 生成戰略標籤詳細報告
   * @param {Object} structuredData 結構化數據
   * @returns {string} 戰略標籤詳細報告文字
   */
  function generateStrategicTagsReport(structuredData) {
    const result = generateStrategicTags(structuredData, { includeDetails: true });
    
    if (Array.isArray(result)) {
      return result.join(' ');
    }

    const parts = [];
    parts.push(`## 戰略標籤詳細報告\n`);
    parts.push(`**總標籤數**：${result.summary.totalTags}\n`);
    parts.push(`**標籤分類**：\n`);
    
    const categoryNames = {
      luck: '好命指數',
      palace: '宮位優勢',
      element: '五行能量',
      overlap: '疊宮分析',
      health: '健康預警',
      transformation: '四化系統',
      questionnaire: '專家問卷',
      location: '地理位置'
    };

    Object.entries(result.summary.categories).forEach(([key, count]) => {
      if (count > 0) {
        parts.push(`- ${categoryNames[key] || key}：${count}個\n`);
      }
    });

    parts.push(`\n### 標籤詳情\n`);
    result.details.forEach((detail, index) => {
      const priorityEmoji = {
        'critical': '🚨',
        'high': '⭐',
        'medium': '📌',
        'low': '📍'
      };
      parts.push(`${index + 1}. ${priorityEmoji[detail.priority] || '•'} **${detail.tag}**\n`);
      parts.push(`   - 分類：${categoryNames[detail.category] || detail.category}\n`);
      parts.push(`   - 優先級：${detail.priority}\n`);
      parts.push(`   - 說明：${detail.description}\n`);
      if (detail.score !== undefined) {
        parts.push(`   - 分數：${detail.score}\n`);
      }
      parts.push(`\n`);
    });

    return parts.join('');
  }

  // 導出到 window.AIPromptGenerator（如果 window 存在）
  if (typeof window !== "undefined") {
    window.AIPromptGenerator = {
      generateAIPrompt,
      generateStrategicTags,
      generateStrategicTagsReport,
      generateCoreDataSummary,
      generateFourTransformationsDetail,
      generateOverlapAnalysisDetail,
      generateHealthWarningDetail,
      collectStructuredData,
      STRATEGIC_TAG_CATEGORIES,
    };
  } else if (typeof globalThis !== "undefined") {
    globalThis.AIPromptGenerator = {
      generateAIPrompt,
      generateStrategicTags,
      generateStrategicTagsReport,
      generateCoreDataSummary,
      generateFourTransformationsDetail,
      generateOverlapAnalysisDetail,
      generateHealthWarningDetail,
      collectStructuredData,
      STRATEGIC_TAG_CATEGORIES,
    };
  }
})();
