/* calc/overlapAnalysis.js
 * 疊宮分析與評論生成模組
 * 依賴: calc/fourTransformations.js, calc/constants.js
 */

(function () {
  "use strict";

  // 檢查依賴
  if (typeof window === "undefined" || !window.FourTransformations) {
    throw new Error("calc/overlapAnalysis.js requires calc/fourTransformations.js to be loaded first");
  }
  if (typeof window === "undefined" || !window.CalcConstants) {
    throw new Error("calc/overlapAnalysis.js requires calc/constants.js to be loaded first");
  }

  const { calculateOverlapTransformations } = window.FourTransformations;
  const { PALACE_ONE_LINERS } = window.CalcConstants;

  /**
   * 生成疊宮評論（完整版）
   * 根據疊宮分析結果生成類似「雖然你天生財運好（本命祿），但這十年大限忌在財帛，且今年流年忌又疊上去，所以今年你絕對不能投資，否則會破產。」
   * 
   * @param {Object} overlapAnalysis 疊宮分析結果（來自 calculateOverlapTransformations）
   * @returns {Array<string>} 評論陣列
   */
  function generateOverlapComments(overlapAnalysis) {
    const comments = [];
    
    if (!overlapAnalysis || !overlapAnalysis.palaceMap) {
      return comments;
    }

    const { palaceMap, criticalRisks, maxOpportunities, volatileAmbivalences } = overlapAnalysis;

    // 宮位中文描述映射（用於生成更自然的評論）
    const PALACE_DESCRIPTIONS = {
      "命宮": "核心運勢",
      "兄弟": "兄弟關係",
      "夫妻": "感情婚姻",
      "子女": "子女運勢",
      "財帛": "財運",
      "疾厄": "健康",
      "遷移": "遷移運勢",
      "僕役": "人際關係",
      "官祿": "事業運勢",
      "田宅": "不動產",
      "福德": "精神層面",
      "父母": "父母關係"
    };

    // 0. 處理 VOLATILE_AMBIVALENCE（劇烈震盪/吉凶並見）- 最高優先級
    if (volatileAmbivalences && volatileAmbivalences.length > 0) {
      volatileAmbivalences.forEach(volatile => {
        const { palace, transformations, jiCount, luCount, note } = volatile;
        const palaceDesc = PALACE_DESCRIPTIONS[palace] || palace;
        
        // 構建評論：強調「成敗一線間」
        const jiParts = [];
        const luParts = [];
        
        if (transformations.benming) {
          if (transformations.benming.type === '忌') {
            jiParts.push(`本命${transformations.benming.star}化忌`);
          } else if (transformations.benming.type === '祿') {
            luParts.push(`本命${transformations.benming.star}化祿`);
          }
        }
        if (transformations.dalimit) {
          if (transformations.dalimit.type === '忌') {
            jiParts.push(`大限${transformations.dalimit.star}化忌`);
          } else if (transformations.dalimit.type === '祿') {
            luParts.push(`大限${transformations.dalimit.star}化祿`);
          }
        }
        if (transformations.liunian) {
          if (transformations.liunian.type === '忌') {
            jiParts.push(`流年${transformations.liunian.star}化忌`);
          } else if (transformations.liunian.type === '祿') {
            luParts.push(`流年${transformations.liunian.star}化祿`);
          }
        }
        if (transformations.xiaoxian) {
          if (transformations.xiaoxian.type === '忌') {
            jiParts.push(`小限${transformations.xiaoxian.star}化忌`);
          } else if (transformations.xiaoxian.type === '祿') {
            luParts.push(`小限${transformations.xiaoxian.star}化祿`);
          }
        }

        const comment = `${palace}宮處於「成敗一線間」：${jiParts.join('、')}（${jiCount}重化忌疊加）與${luParts.join('、')}（${luCount}重化祿疊加）同時出現。${note}`;
        comments.push(`⚡ ${palace}宮：${comment}`);
      });
    }

    // 1. 處理 CRITICAL_RISK（超級地雷區）- 優先級次高
    criticalRisks.forEach(risk => {
      const { palace, transformations, jiCount } = risk;
      const palaceDesc = PALACE_DESCRIPTIONS[palace] || palace;
      
      // 構建評論（按照用戶要求的格式）
      const positiveParts = []; // 先說好的（如果有）
      const negativeParts = []; // 再說壞的
      
      // 檢查是否有化祿（先說好的）
      if (transformations.benming && transformations.benming.type === '祿') {
        positiveParts.push(`你天生${palaceDesc}好（本命${transformations.benming.star}化祿）`);
      }
      if (transformations.dalimit && transformations.dalimit.type === '祿') {
        positiveParts.push(`這十年大限祿在${palace}`);
      }
      if (transformations.liunian && transformations.liunian.type === '祿') {
        positiveParts.push(`今年流年祿在${palace}`);
      }
      
      // 檢查化忌（再說壞的）
      if (transformations.benming && transformations.benming.type === '忌') {
        negativeParts.push(`本命${transformations.benming.star}化忌`);
      }
      if (transformations.dalimit && transformations.dalimit.type === '忌') {
        negativeParts.push(`這十年大限忌在${palace}`);
      }
      if (transformations.liunian && transformations.liunian.type === '忌') {
        negativeParts.push(`今年流年忌又疊上去`);
      }
      if (transformations.xiaoxian && transformations.xiaoxian.type === '忌') {
        negativeParts.push(`小限忌也在${palace}`);
      }

      // 生成警告評論（按照用戶要求的格式）
      let comment = '';
      if (negativeParts.length >= 2) {
        // 如果有好的部分，先說好的
        if (positiveParts.length > 0) {
          comment = `雖然${positiveParts.join('，')}，但${negativeParts.join('，')}。所以今年你絕對不能投資，否則會破產。`;
        } else {
          comment = `${negativeParts.join('，')}。${jiCount}重化忌疊加，這是命書中所謂的「大凶」，必須絕對避開。`;
        }
      } else if (negativeParts.length === 1) {
        if (positiveParts.length > 0) {
          comment = `雖然${positiveParts.join('，')}，但${negativeParts[0]}，需要特別注意。`;
        } else {
          comment = `${palace}宮風險：${negativeParts[0]}，需要特別注意。`;
        }
      }

      if (comment) {
        comments.push(`⚠️ ${palace}宮：${comment}`);
      }
    });

    // 2. 處理 MAX_OPPORTUNITY（大發財機會）
    maxOpportunities.forEach(opportunity => {
      const { palace, transformations, luCount } = opportunity;
      const palaceDesc = PALACE_DESCRIPTIONS[palace] || palace;
      
      // 構建評論
      const parts = [];
      
      if (transformations.benming && transformations.benming.type === '祿') {
        parts.push(`你天生${palaceDesc}好（本命${transformations.benming.star}化祿）`);
      }
      if (transformations.dalimit && transformations.dalimit.type === '祿') {
        parts.push(`這十年大限祿在${palace}`);
      }
      if (transformations.liunian && transformations.liunian.type === '祿') {
        parts.push(`今年流年祿又疊上去`);
      }
      if (transformations.xiaoxian && transformations.xiaoxian.type === '祿') {
        parts.push(`小限祿也在${palace}`);
      }

      // 生成機會評論
      let comment = '';
      if (parts.length >= 2) {
        comment = `${parts.join('，')}。${luCount}重化祿疊加，這是難得的「大發財機會」，建議積極把握。`;
      } else if (parts.length === 1) {
        comment = `${parts[0]}，可以適度投入。`;
      }

      if (comment) {
        comments.push(`✨ ${palace}宮：${comment}`);
      }
    });

    // 3. 處理混合情況（有吉有凶的宮位，但未達到 CRITICAL_RISK 或 MAX_OPPORTUNITY）
    palaceMap.forEach((palaceData, palaceName) => {
      const { transformations, luCount, jiCount, riskLevel, opportunityLevel } = palaceData;
      const palaceDesc = PALACE_DESCRIPTIONS[palaceName] || palaceName;
      
      // 跳過已經處理過的 CRITICAL_RISK 和 MAX_OPPORTUNITY（包括 mixed 情況）
      if (riskLevel === 'critical' || opportunityLevel === 'max' || opportunityLevel === 'mixed') {
        return;
      }
      
      // 如果同時有化祿和化忌（混合情況）
      if (luCount > 0 && jiCount > 0) {
        const positiveParts = [];
        const negativeParts = [];
        
        if (transformations.benming) {
          if (transformations.benming.type === '祿') {
            positiveParts.push(`本命${transformations.benming.star}化祿`);
          } else if (transformations.benming.type === '忌') {
            negativeParts.push(`本命${transformations.benming.star}化忌`);
          }
        }
        if (transformations.dalimit) {
          if (transformations.dalimit.type === '祿') {
            positiveParts.push(`大限${transformations.dalimit.star}化祿`);
          } else if (transformations.dalimit.type === '忌') {
            negativeParts.push(`大限${transformations.dalimit.star}化忌`);
          }
        }
        if (transformations.liunian) {
          if (transformations.liunian.type === '祿') {
            positiveParts.push(`流年${transformations.liunian.star}化祿`);
          } else if (transformations.liunian.type === '忌') {
            negativeParts.push(`流年${transformations.liunian.star}化忌`);
          }
        }
        if (transformations.xiaoxian) {
          if (transformations.xiaoxian.type === '祿') {
            positiveParts.push(`小限${transformations.xiaoxian.star}化祿`);
          } else if (transformations.xiaoxian.type === '忌') {
            negativeParts.push(`小限${transformations.xiaoxian.star}化忌`);
          }
        }

        // 生成混合評論（按照用戶要求的格式）
        if (positiveParts.length > 0 && negativeParts.length > 0) {
          const comment = `雖然${positiveParts.join('、')}，但${negativeParts.join('、')}。建議謹慎評估，避免過度擴張。`;
          comments.push(`⚖️ ${palaceName}宮：${comment}`);
        }
      }
    });

    return comments;
  }

  /**
   * 生成完整的疊宮分析報告
   * @param {Object} overlapAnalysis 疊宮分析結果
   * @returns {Object} 完整報告
   */
  function generateOverlapReport(overlapAnalysis) {
    if (!overlapAnalysis) {
      return {
        comments: [],
        summary: {},
        details: []
      };
    }

    const comments = generateOverlapComments(overlapAnalysis);
    const details = [];

    // 生成詳細資訊
    overlapAnalysis.palaceMap.forEach((palaceData, palaceName) => {
      if (palaceData.luCount > 0 || palaceData.jiCount > 0 || 
          palaceData.quanCount > 0 || palaceData.keCount > 0) {
        details.push({
          palace: palaceName,
          ...palaceData
        });
      }
    });

    return {
      comments: comments,
      summary: overlapAnalysis.summary || {},
      details: details,
      criticalRisks: overlapAnalysis.criticalRisks || [],
      maxOpportunities: overlapAnalysis.maxOpportunities || [],
      volatileAmbivalences: overlapAnalysis.volatileAmbivalences || []
    };
  }

  // ====== 導出 ======

  // 導出到 window.OverlapAnalysis（如果 window 存在）
  if (typeof window !== "undefined") {
    window.OverlapAnalysis = {
      generateOverlapComments,
      generateOverlapReport,
    };
  } else if (typeof globalThis !== "undefined") {
    // 讓 Node / 測試環境也能引用
    globalThis.OverlapAnalysis = {
      generateOverlapComments,
      generateOverlapReport,
    };
  }
})();
