/* calc/insightEngine.js
 * 50/30/20 諮詢劇本生成器
 * 透過比對「本命天賦 (Nature)」與「意識武裝 (Nurture)」的差異，生成具備心理穿透力的諮詢建議
 * 依賴: calc/constants.js, calc/helpers.js, calc/fourTransformations.js
 */

(function () {
  "use strict";

  // 檢查依賴
  if (typeof window === "undefined" || !window.CalcConstants) {
    throw new Error("calc/insightEngine.js requires calc/constants.js to be loaded first");
  }
  if (typeof window === "undefined" || !window.CalcHelpers) {
    throw new Error("calc/insightEngine.js requires calc/helpers.js to be loaded first");
  }

  const { FIVE_ELEMENTS_ORDER } = window.CalcConstants;

  /**
   * Nature Vector Interface
   * 從命盤提取的本命天賦向量（五行屬性）
   */
  function createNatureVector(ziweiData, wuxingData) {
    if (!wuxingData || !wuxingData.raw) {
      return {
        木: 0, 火: 0, 土: 0, 金: 0, 水: 0,
        source: 'ziwei',
        description: '本命天賦（命盤五行屬性）'
      };
    }

    const wx = wuxingData.raw;
    const total = (wx.wood || 0) + (wx.fire || 0) + (wx.earth || 0) + (wx.metal || 0) + (wx.water || 0);
    
    if (total === 0) {
      return {
        木: 0, 火: 0, 土: 0, 金: 0, 水: 0,
        source: 'ziwei',
        description: '本命天賦（命盤五行屬性）'
      };
    }

    return {
      木: ((wx.wood || 0) / total * 100).toFixed(1),
      火: ((wx.fire || 0) / total * 100).toFixed(1),
      土: ((wx.earth || 0) / total * 100).toFixed(1),
      金: ((wx.metal || 0) / total * 100).toFixed(1),
      水: ((wx.water || 0) / total * 100).toFixed(1),
      source: 'ziwei',
      description: '本命天賦（命盤五行屬性）'
    };
  }

  /**
   * Nurture Vector Interface
   * 從命盤提取的現狀向量（五行屬性）
   * 注意：由於不使用問卷，這裡使用命盤數據作為 Nurture（實際上是相同的）
   * 偏差分析將基於其他因素（如四化、疊宮等）來生成問題
   */
  function createNurtureVector(questionnaireAnswers, wuxingData) {
    // 如果不使用問卷，使用命盤數據（但可以根據四化、疊宮等調整）
    if (!questionnaireAnswers || Object.keys(questionnaireAnswers).length === 0) {
      // 使用命盤數據，但可以根據四化情況微調
      if (wuxingData && wuxingData.raw) {
        const wx = wuxingData.raw;
        const total = (wx.wood || 0) + (wx.fire || 0) + (wx.earth || 0) + (wx.metal || 0) + (wx.water || 0);
        
        if (total > 0) {
          return {
            木: ((wx.wood || 0) / total * 100).toFixed(1),
            火: ((wx.fire || 0) / total * 100).toFixed(1),
            土: ((wx.earth || 0) / total * 100).toFixed(1),
            金: ((wx.metal || 0) / total * 100).toFixed(1),
            水: ((wx.water || 0) / total * 100).toFixed(1),
            source: 'ziwei_adjusted',
            description: '意識武裝（基於命盤，可根據四化調整）'
          };
        }
      }
      
      return {
        木: 0, 火: 0, 土: 0, 金: 0, 水: 0,
        source: 'default',
        description: '意識武裝（預設值）'
      };
    }

    // 15題問卷選項映射到五行屬性
    const QUESTIONNAIRE_WEIGHT_MAP = {
      // Q1-Q5: 心理原型 (Psychology)
      eq1: { A: { 金: 20 }, B: { 水: 20 }, C: { 火: 20 }, D: { 土: 20 } },
      eq2: { A: { 木: 20 }, B: { 火: 20 }, C: { 土: 20 }, D: { 金: 20 } },
      eq3: { A: { 水: 20 }, B: { 木: 20 }, C: { 火: 20 }, D: { 土: 20 } },
      eq4: { A: { 金: 20 }, B: { 水: 20 }, C: { 木: 20 }, D: { 火: 20 } },
      eq5: { A: { 土: 20 }, B: { 金: 20 }, C: { 水: 20 }, D: { 木: 20 } },
      
      // Q6-Q10: 行為偏好 (Behavior)
      eq6: { A: { 金: 20 }, B: { 水: 20 }, C: { 木: 20 }, D: { 火: 20 } },
      eq7: { A: { 火: 20 }, B: { 土: 20 }, C: { 金: 20 }, D: { 水: 20 } },
      eq8: { A: { 木: 20 }, B: { 火: 20 }, C: { 土: 20 }, D: { 金: 20 } },
      eq9: { A: { 水: 20 }, B: { 木: 20 }, C: { 火: 20 }, D: { 土: 20 } },
      eq10: { A: { 金: 20 }, B: { 水: 20 }, C: { 木: 20 }, D: { 火: 20 } },
      
      // Q11-Q15: 抗壓機制 (Resilience)
      eq11: { A: { 土: 20 }, B: { 金: 20 }, C: { 水: 20 }, D: { 木: 20 } },
      eq12: { A: { 火: 20 }, B: { 土: 20 }, C: { 金: 20 }, D: { 水: 20 } },
      eq13: { A: { 木: 20 }, B: { 火: 20 }, C: { 土: 20 }, D: { 金: 20 } },
      eq14: { A: { 水: 20 }, B: { 木: 20 }, C: { 火: 20 }, D: { 土: 20 } },
      eq15: { A: { 金: 20 }, B: { 水: 20 }, C: { 木: 20 }, D: { 火: 20 } }
    };

    const nurture = { 木: 0, 火: 0, 土: 0, 金: 0, 水: 0 };
    let totalWeight = 0;

    // 計算每個選項的五行權重
    Object.keys(questionnaireAnswers).forEach(qId => {
      const answer = questionnaireAnswers[qId];
      const weightMap = QUESTIONNAIRE_WEIGHT_MAP[qId];
      
      if (weightMap && answer && weightMap[answer]) {
        const weights = weightMap[answer];
        Object.keys(weights).forEach(element => {
          nurture[element] = (nurture[element] || 0) + weights[element];
          totalWeight += weights[element];
        });
      }
    });

    // 正規化為百分比
    if (totalWeight > 0) {
      Object.keys(nurture).forEach(element => {
        nurture[element] = ((nurture[element] / totalWeight) * 100).toFixed(1);
      });
    }

    return {
      ...nurture,
      source: 'questionnaire',
      description: '意識武裝（問卷回答）',
      totalAnswered: Object.keys(questionnaireAnswers).length
    };
  }

  /**
   * 計算偏差值 (Deviation)
   * D = Nature - Nurture
   */
  function calculateDeviation(natureVector, nurtureVector) {
    const deviation = {};
    let maxDeviation = 0;
    let maxDeviationElement = null;
    let totalDeviation = 0;

    FIVE_ELEMENTS_ORDER.forEach(element => {
      const nature = parseFloat(natureVector[element] || 0);
      const nurture = parseFloat(nurtureVector[element] || 0);
      const diff = nature - nurture;
      
      deviation[element] = {
        nature: nature,
        nurture: nurture,
        deviation: diff,
        absDeviation: Math.abs(diff)
      };

      totalDeviation += Math.abs(diff);
      
      if (Math.abs(diff) > maxDeviation) {
        maxDeviation = Math.abs(diff);
        maxDeviationElement = element;
      }
    });

    return {
      deviation,
      maxDeviation,
      maxDeviationElement,
      totalDeviation: (totalDeviation / FIVE_ELEMENTS_ORDER.length).toFixed(2),
      isHighDeviation: maxDeviation > 30, // 偏差超過30%視為高偏差
      description: maxDeviationElement 
        ? `${maxDeviationElement}屬性偏差最大（${maxDeviation.toFixed(1)}%）`
        : '偏差較小'
    };
  }

  /**
   * 生成多個50% Hook問題（精準直擊）
   * 基於「命盤四化忌」的恐懼點
   * 返回5個問題
   */
  function generateHookQuestions(fourTransformations, overlapAnalysis) {
    if (!fourTransformations || !overlapAnalysis) {
      return [{
        type: 'hook',
        weight: 50,
        content: '你對外界表現出的完美主義，其實是為了掩飾對「資源匱乏」的恐懼，對嗎？',
        palace: null,
        reasoning: '無法獲取四化數據'
      }];
    }

    const questions = [];
    const palaceMap = overlapAnalysis.palaceMap;
    const mapEntries = palaceMap instanceof Map ? Array.from(palaceMap.entries()) : Object.entries(palaceMap || {});

    // 1. 優先查找劇烈震盪/吉凶並見的宮位
    const volatileAmbivalences = overlapAnalysis.volatileAmbivalences || [];
    volatileAmbivalences.forEach((volatile, index) => {
      if (index < 2) { // 最多2個
        const palaceDesc = getPalaceDescription(volatile.palace);
        questions.push({
          type: 'hook',
          weight: 50,
          content: `你對外界表現出的完美主義，其實是為了掩飾對「${palaceDesc}」的恐懼，對嗎？${volatile.palace}宮同時有${volatile.jiCount}重化忌和${volatile.luCount}重化祿，你既渴望成功又害怕失敗。`,
          palace: volatile.palace,
          reasoning: `劇烈震盪：${volatile.palace}宮`
        });
      }
    });

    // 2. 查找超級地雷區
    const criticalRisks = overlapAnalysis.criticalRisks || [];
    criticalRisks.forEach((risk, index) => {
      if (questions.length < 3 && index < 2) {
        const palaceDesc = getPalaceDescription(risk.palace);
        questions.push({
          type: 'hook',
          weight: 50,
          content: `你表面追求專業，但內心對「${palaceDesc}」的恐懼才是你焦慮的根源，對嗎？${risk.jiCount}重化忌疊加，這是你的核心恐懼點。`,
          palace: risk.palace,
          reasoning: `超級地雷區：${risk.palace}宮`
        });
      }
    });

    // 3. 查找本命化忌
    const benming = fourTransformations.benming;
    if (benming && benming.mutagenStars && benming.mutagenStars.忌 && questions.length < 4) {
      const star = benming.mutagenStars.忌;
      questions.push({
        type: 'hook',
        weight: 50,
        content: `你對外界表現出的完美主義，其實是為了掩飾本命「${star}化忌」帶來的恐懼，對嗎？`,
        palace: null,
        reasoning: `本命${star}化忌`
      });
    }

    // 4. 查找大限化忌
    const dalimit = fourTransformations.dalimit;
    if (dalimit && dalimit.mutagenStars && dalimit.mutagenStars.忌 && questions.length < 5) {
      const star = dalimit.mutagenStars.忌;
      const palaceDesc = dalimit.palace ? getPalaceDescription(dalimit.palace) : '大限';
      questions.push({
        type: 'hook',
        weight: 50,
        content: `這十年大限「${palaceDesc}」的${star}化忌，是否讓你對資源的掌控感到不安？`,
        palace: dalimit.palace,
        reasoning: `大限${star}化忌`
      });
    }

    // 5. 查找流年化忌
    const liunian = fourTransformations.liunian;
    if (liunian && liunian.mutagenStars && liunian.mutagenStars.忌 && questions.length < 5) {
      const star = liunian.mutagenStars.忌;
      const palaceDesc = liunian.palace ? getPalaceDescription(liunian.palace) : '流年';
      questions.push({
        type: 'hook',
        weight: 50,
        content: `今年流年「${palaceDesc}」的${star}化忌，是否讓你對未來的變動感到焦慮？`,
        palace: liunian.palace,
        reasoning: `流年${star}化忌`
      });
    }

    // 6. 補充通用問題（如果不足5個）
    const genericHooks = [
      '你對外界表現出的完美主義，其實是為了掩飾對「資源匱乏」的恐懼，對嗎？',
      '你表面追求專業，但內心對「失敗」的恐懼才是你焦慮的根源，對嗎？',
      '你努力維持的「穩定」，是否其實是在逃避內心的不安全感？',
      '你對「控制」的執著，是否源於對「失控」的深層恐懼？',
      '你表現出的「自信」，是否其實是在掩飾內心的「自我懷疑」？'
    ];

    while (questions.length < 5) {
      const genericIndex = questions.length;
      if (genericIndex < genericHooks.length) {
        questions.push({
          type: 'hook',
          weight: 50,
          content: genericHooks[genericIndex],
          palace: null,
          reasoning: '通用問題'
        });
      } else {
        break;
      }
    }

    return questions.slice(0, 5); // 確保只返回5個
  }

  /**
   * 生成多個30% Reflection問題（啟發思考）
   * 基於「天賦與現狀的偏差值 (D)」
   * 返回3個問題
   */
  function generateReflectionQuestions(deviationAnalysis) {
    const questions = [];

    if (!deviationAnalysis || !deviationAnalysis.maxDeviationElement) {
      questions.push({
        type: 'reflection',
        weight: 30,
        content: '系統顯示你本質非常感性，但你現在全靠邏輯支撐。你覺得是什麼時候，你決定不再相信你的直覺？',
        reasoning: '偏差數據不足'
      });
      questions.push({
        type: 'reflection',
        weight: 30,
        content: '你目前處於高度社會化的巔峰，但這種過度的精準，是否讓你感到疲憊？',
        reasoning: '通用問題'
      });
      questions.push({
        type: 'reflection',
        weight: 30,
        content: '你的本命與現狀高度一致，這代表你已經完全適應了社會的期待，但這種適應，是否讓你失去了真實的自己？',
        reasoning: '通用問題'
      });
      return questions.slice(0, 3);
    }

    const { maxDeviationElement, deviation, isHighDeviation } = deviationAnalysis;
    const elementDev = deviation[maxDeviationElement];
    const nature = elementDev.nature;
    const nurture = elementDev.nurture;
    const diff = elementDev.deviation;

    // 五行屬性描述
    const ELEMENT_DESCRIPTIONS = {
      木: { high: '熱情、開創、仁慈', low: '冷靜、邏輯、壓抑', question: '直覺' },
      火: { high: '熱情、衝動、創造力', low: '冷靜、理性、控制', question: '熱情' },
      土: { high: '穩定、包容、務實', low: '變動、不安、理想化', question: '穩定' },
      金: { high: '冷靜、邏輯、精準', low: '感性、直覺、混亂', question: '邏輯' },
      水: { high: '流動、適應、智慧', low: '固執、僵化、缺乏彈性', question: '流動性' }
    };

    const desc = ELEMENT_DESCRIPTIONS[maxDeviationElement] || { high: '', low: '', question: '' };

    if (isHighDeviation) {
      if (diff > 0) {
        // Nature > Nurture: 命盤屬性高，但現狀顯示低（壓抑）
        questions.push({
          type: 'reflection',
          weight: 30,
          content: `系統顯示你本質非常${desc.high}，但你現在全靠${desc.low}支撐。你覺得是什麼時候，你決定不再相信你的${desc.question}？`,
          reasoning: `高偏差：${maxDeviationElement}屬性偏差${diff.toFixed(1)}%（本命${nature}% vs 現狀${nurture}%）`
        });
        questions.push({
          type: 'reflection',
          weight: 30,
          content: `你的本命${maxDeviationElement}屬性高達${nature}%，但你的現狀顯示只有${nurture}%，這種巨大的落差，是否代表你在逃避什麼？`,
          reasoning: `高偏差：${maxDeviationElement}屬性`
        });
      } else {
        // Nature < Nurture: 命盤屬性低，但現狀顯示高（過度補償）
        questions.push({
          type: 'reflection',
          weight: 30,
          content: `你現在的${desc.high}，是否是一種過度的補償？你的本命${maxDeviationElement}屬性只有${nature}%，但你的現狀顯示高達${nurture}%，這種過度的表現，是否讓你感到疲憊？`,
          reasoning: `高偏差：${maxDeviationElement}屬性偏差${Math.abs(diff).toFixed(1)}%（本命${nature}% vs 現狀${nurture}%）`
        });
        questions.push({
          type: 'reflection',
          weight: 30,
          content: `你表現出的${desc.high}，是否其實是在掩飾內心的${desc.low}？`,
          reasoning: `高偏差：過度補償`
        });
      }
    } else {
      // 低偏差：高度社會化
      questions.push({
        type: 'reflection',
        weight: 30,
        content: '你目前處於高度社會化的巔峰，但這種過度的精準，是否讓你感到疲憊？',
        reasoning: `低偏差：偏差值${deviationAnalysis.totalDeviation}%，高度社會化`
      });
      questions.push({
        type: 'reflection',
        weight: 30,
        content: '你的本命與現狀高度一致，這代表你已經完全適應了社會的期待，但這種適應，是否讓你失去了真實的自己？',
        reasoning: '低偏差：高度社會化'
      });
    }

    // 補充通用問題
    questions.push({
      type: 'reflection',
      weight: 30,
      content: '你覺得現在的自己，和「真正的自己」之間，差距有多大？',
      reasoning: '通用問題'
    });

    return questions.slice(0, 3); // 確保只返回3個
  }

  /**
   * 生成多個20% Capture問題（數據採集）
   * 基於「流年受衝擊宮位」的開放性提問
   * 返回2個問題
   */
  function generateCaptureQuestions(overlapAnalysis, fourTransformations, currentYear = 2026) {
    if (!overlapAnalysis || !fourTransformations) {
      return {
        type: 'capture',
        weight: 20,
        content: '關於你最近面臨的那個懸而未決的決定，現況如何？',
        palace: null,
        reasoning: '無法獲取疊宮數據'
      };
    }

    // 優先查找流年受衝擊的宮位
    const liunian = fourTransformations.liunian;
    const criticalRisks = overlapAnalysis.criticalRisks || [];
    const volatileAmbivalences = overlapAnalysis.volatileAmbivalences || [];

    // 查找流年化忌的宮位
    if (liunian && liunian.mutagenStars && liunian.mutagenStars.忌) {
      const star = liunian.mutagenStars.忌;
      const palaceDesc = getPalaceDescription(liunian.palace || '流年');
      
      return {
        type: 'capture',
        weight: 20,
        content: `關於${palaceDesc}的那個懸而未決的決定，現況如何？${currentYear}年流年${star}化忌在${liunian.palace || '流年'}，這個領域是否讓你感到壓力？`,
        palace: liunian.palace,
        reasoning: `流年${star}化忌在${liunian.palace}`
      };
    }

    // 查找疊忌的宮位
    if (volatileAmbivalences.length > 0) {
      const volatile = volatileAmbivalences[0];
      const palaceDesc = getPalaceDescription(volatile.palace);
      
      return {
        type: 'capture',
        weight: 20,
        content: `關於${palaceDesc}的那個懸而未決的決定，現況如何？這個領域同時有化忌和化祿疊加，你現在處於「成敗一線間」的關鍵時刻，能否告訴我你的真實想法？`,
        palace: volatile.palace,
        reasoning: `劇烈震盪：${volatile.palace}宮`
      };
    }

    if (criticalRisks.length > 0) {
      const risk = criticalRisks[0];
      const palaceDesc = getPalaceDescription(risk.palace);
      
      return {
        type: 'capture',
        weight: 20,
        content: `關於${palaceDesc}的那個懸而未決的決定，現況如何？這個領域有${risk.jiCount}重化忌疊加，是你目前最需要關注的領域。`,
        palace: risk.palace,
        reasoning: `超級地雷區：${risk.palace}宮`
      };
    }

    return {
      type: 'capture',
      weight: 20,
      content: '關於你最近面臨的那個懸而未決的決定，現況如何？',
      palace: null,
      reasoning: '未檢測到明顯受衝擊宮位'
    };
  }

  /**
   * 宮位描述映射
   */
  function getPalaceDescription(palaceName) {
    const PALACE_DESCRIPTIONS = {
      "命宮": "核心運勢",
      "兄弟": "兄弟關係",
      "夫妻": "感情婚姻",
      "子女": "子女運勢",
      "財帛": "財務資源",
      "疾厄": "健康狀態",
      "遷移": "遷移運勢",
      "僕役": "人際關係",
      "官祿": "事業發展",
      "田宅": "不動產",
      "福德": "精神層面",
      "父母": "父母關係"
    };
    return PALACE_DESCRIPTIONS[palaceName] || palaceName;
  }

  /**
   * 生成完整的諮詢劇本
   * @param {Object} options 選項
   * @param {Object} options.ziweiData 紫微命盤數據
   * @param {Object} options.wuxingData 五行數據
   * @param {Object} options.questionnaireAnswers 15題問卷答案
   * @param {Object} options.fourTransformations 四化系統數據
   * @param {Object} options.overlapAnalysis 疊宮分析數據
   * @param {number} options.currentYear 當前年份
   * @returns {Object} 完整的諮詢劇本
   */
  function generateConsultationScript(options = {}) {
    const {
      ziweiData,
      wuxingData,
      questionnaireAnswers,
      fourTransformations,
      overlapAnalysis,
      currentYear = new Date().getFullYear()
    } = options;

    // 1. 建立 Nature Vector
    const natureVector = createNatureVector(ziweiData, wuxingData);

    // 2. 建立 Nurture Vector（不使用問卷，基於命盤數據）
    const nurtureVector = createNurtureVector(questionnaireAnswers, wuxingData);

    // 3. 計算偏差值
    const deviationAnalysis = calculateDeviation(natureVector, nurtureVector);

    // 4. 生成10個諮詢問題（5個Hook + 3個Reflection + 2個Capture）
    const hookQuestions = generateHookQuestions(fourTransformations, overlapAnalysis);
    const reflectionQuestions = generateReflectionQuestions(deviationAnalysis);
    const captureQuestions = generateCaptureQuestions(overlapAnalysis, fourTransformations, currentYear);

    return {
      natureVector,
      nurtureVector,
      deviationAnalysis,
      questions: {
        hook: hookQuestions,      // 5個問題
        reflection: reflectionQuestions,  // 3個問題
        capture: captureQuestions  // 2個問題
      },
      summary: {
        totalDeviation: deviationAnalysis.totalDeviation,
        maxDeviationElement: deviationAnalysis.maxDeviationElement,
        isHighDeviation: deviationAnalysis.isHighDeviation,
        totalQuestions: hookQuestions.length + reflectionQuestions.length + captureQuestions.length
      },
      timestamp: new Date().toISOString()
    };
  }

  // ====== 導出 ======

  if (typeof window !== "undefined") {
    window.InsightEngine = {
      generateConsultationScript,
      createNatureVector,
      createNurtureVector,
      calculateDeviation,
      generateHookQuestions,
      generateReflectionQuestions,
      generateCaptureQuestions
    };
  } else if (typeof globalThis !== "undefined") {
    globalThis.InsightEngine = {
      generateConsultationScript,
      createNatureVector,
      createNurtureVector,
      calculateDeviation,
      generateHookQuestions,
      generateReflectionQuestions,
      generateCaptureQuestions
    };
  }
})();
