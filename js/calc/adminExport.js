/* calc/adminExport.js
 * 後台管理數據導出模組
 * 將所有計算結果整合為結構化數據，供後台管理界面使用
 * 不暴露在前端UI，僅供後台使用
 */

(function () {
  "use strict";

  /**
   * 導出所有計算結果為結構化數據
   * 供後台管理界面使用，用於判讀和命書輸出
   * 
   * @param {Object} options 選項
   * @param {string} options.chartId 圖表ID（可選）
   * @param {Object} options.birthInfo 出生資訊 { year, month, day, hour, minute, gender }
   * @returns {Object} 結構化計算結果數據
   */
  function exportCalculationResults(options = {}) {
    const { chartId, birthInfo } = options;

    // 收集所有計算結果
    const results = {
      chartId: chartId || null,
      birthInfo: birthInfo || null,
      timestamp: new Date().toISOString(),
      
      // 四化系統數據
      fourTransformations: null,
      
      // 疊宮分析數據
      overlapAnalysis: null,
      
      // 好命指數數據
      luckIndex: null,
      
      // 宮位分數和元數據
      palaceScores: null,
      palaceMetadata: null,
      
      // 五行數據
      fiveElements: null,
      
      // 流月數據
      liuyue: null,
      
      // 其他數據
      bazi: null,
      ziwei: null,
    };

    // 從全局狀態獲取數據
    if (typeof window !== "undefined") {
      // 四化系統（從計算流程存儲到 window.fourTransformations）
      if (window.fourTransformations) {
        results.fourTransformations = window.fourTransformations;
      }

      // 疊宮分析（原始數據）
      if (window.overlapAnalysis) {
        results.overlapAnalysis = window.overlapAnalysis;
      }
      
      // 疊宮報告（包含評論，如果存在）
      if (window.overlapReport) {
        results.overlapReport = window.overlapReport;
      }

      // 好命指數
      if (window.luckIndex) {
        results.luckIndex = window.luckIndex;
      }

      // 宮位分數和元數據
      if (window.ziweiPalaceMetadata) {
        results.palaceMetadata = window.ziweiPalaceMetadata;
      }

      // 五行數據（如果存在）
      if (window.wuxingData) {
        results.fiveElements = window.wuxingData;
      }

      // 五行健康預警（如果存在）
      if (window.healthWarning) {
        results.healthWarning = window.healthWarning;
      }

      // 月度健康風險數據（生命健康心電圖，如果存在）
      if (window.monthlyHealthRisk) {
        results.monthlyHealthRisk = window.monthlyHealthRisk;
      }

      // 流月數據（如果存在）
      if (window.liuyueData) {
        results.liuyue = window.liuyueData;
      }

      // AI Prompt（如果存在）
      if (window.aiPrompt) {
        results.aiPrompt = window.aiPrompt;
      }

      // 結構化數據（如果存在）
      if (window.structuredData) {
        results.structuredData = window.structuredData;
      }

      // 戰略標籤詳細數據（如果存在）
      if (window.AIPromptGenerator && window.structuredData) {
        try {
          const strategicTagsResult = window.AIPromptGenerator.generateStrategicTags(
            window.structuredData, 
            { includeDetails: true }
          );
          
          if (!Array.isArray(strategicTagsResult)) {
            results.strategicTags = {
              tags: strategicTagsResult.tags,
              details: strategicTagsResult.details,
              summary: strategicTagsResult.summary
            };
          }
        } catch (err) {
          console.warn('[adminExport] 戰略標籤生成失敗:', err);
        }
      }

      // 注意：已移除15題專家問卷，改為使用50/30/20諮詢劇本生成器

      // 經緯度校準數據（如果存在）
      if (window.geolocationData || window.GeolocationCalibration) {
        const geoData = window.geolocationData || 
          (window.GeolocationCalibration ? window.GeolocationCalibration.getGeolocationData() : null);
        
        if (geoData && geoData.longitude !== null && geoData.latitude !== null) {
          results.geolocation = {
            longitude: geoData.longitude,
            latitude: geoData.latitude,
            accuracy: geoData.accuracy,
            source: geoData.source,
            timestamp: geoData.timestamp || new Date().toISOString()
          };
        }
      }

      // 15宮位戰略導引腳本（如果存在）
      if (window.consultationScript) {
        results.consultationScript = window.consultationScript;
        
        // 包含記錄的回答
        try {
          const answers = JSON.parse(localStorage.getItem('consultationAnswers') || '{}');
          if (Object.keys(answers).length > 0) {
            results.consultationAnswers = answers;
            
            // 生成摘要
            if (window.ConsultationScriptEngine) {
              try {
                const summary = window.ConsultationScriptEngine.generateConsultationSummary(
                  window.consultationScript,
                  answers
                );
                results.consultationSummary = summary;
              } catch (err) {
                console.warn('[adminExport] 生成諮詢摘要失敗:', err);
              }
            }
          }
        } catch (err) {
          console.warn('[adminExport] 讀取諮詢回答失敗:', err);
        }
      } else if (window.ConsultationScriptEngine && results.ziwei && results.fourTransformations && results.overlapAnalysis) {
        // 嘗試生成諮詢腳本
        try {
          const script = window.ConsultationScriptEngine.generateConsultationScript({
            ziweiData: results.ziwei,
            overlapAnalysis: results.overlapAnalysis,
            fourTransformations: results.fourTransformations,
            currentYear: new Date().getFullYear()
          });
          results.consultationScript = script;
        } catch (err) {
          console.warn('[adminExport] 生成諮詢腳本失敗:', err);
        }
      }

      // 原始數據
      if (window.contract) {
        results.bazi = window.contract.bazi;
        results.ziwei = window.contract.ziwei;
      }

      // 命書時間軸：decadalLimits（12 段大限）、yearlyHoroscope（當年小限）、liunian（當年流年四化）
      if (results.ziwei && results.bazi && window.BaziCore && window.CalcConstants && window.CalcHelpers) {
        try {
          var ziwei = results.ziwei;
          var bazi = results.bazi;
          var wuxingju = ziwei.core && ziwei.core.wuxingju ? ziwei.core.wuxingju : "金四局";
          var mingBranch = ziwei.core && ziwei.core.minggongBranch ? ziwei.core.minggongBranch : "寅";
          var yearStem = (bazi.display && bazi.display.yG ? bazi.display.yG : "").toString().trim();
          var gender = (birthInfo && (birthInfo.gender === "F" || birthInfo.gender === "M" || birthInfo.gender === "女" || birthInfo.gender === "男")) ? birthInfo.gender : null;
          var mingStem = window.BaziCore.getMinggongStem(mingBranch, yearStem);
          var PALACE_DEFAULT = window.CalcConstants.PALACE_DEFAULT || ["命宮", "兄弟", "夫妻", "子女", "財帛", "疾厄", "遷移", "僕役", "官祿", "田宅", "福德", "父母"];

          var limits = window.BaziCore.getDecadalLimits({ wuxingju: wuxingju, mingBranch: mingBranch, mingPalaceIndex: 0, gender: gender });
          var decadalLimits = [];
          for (var i = 0; i < limits.length; i++) {
            var lim = limits[i];
            var stem = mingStem ? window.BaziCore.getPalaceStem(mingStem, lim.index) : null;
            var mutagenStars = stem && window.CalcHelpers.getMutagenStars ? window.CalcHelpers.getMutagenStars(stem) : {};
            var weights = stem && window.CalcHelpers.getSiHuaWeights ? window.CalcHelpers.getSiHuaWeights(stem) : {};
            decadalLimits.push({
              index: lim.index,
              palaceIndex: lim.palaceIndex,
              startAge: lim.startAge,
              endAge: lim.endAge,
              palace: PALACE_DEFAULT[lim.palaceIndex] || "",
              stem: stem,
              mutagenStars: mutagenStars,
              weights: weights,
              type: "dalimit"
            });
          }
          results.decadalLimits = decadalLimits;

          var birthYear = birthInfo && birthInfo.year != null ? Number(birthInfo.year) : null;
          var currentYear = new Date().getFullYear();
          var age = birthYear != null && !isNaN(birthYear) ? (currentYear - birthYear) : null;
          if (age != null && age >= 0 && age <= 120) {
            var horoscope = window.BaziCore.getHoroscopeFromAge(age, ziwei, bazi, gender);
            if (horoscope) {
              results.yearlyHoroscope = {
                age: horoscope.age,
                nominalAge: horoscope.age,
                year: birthYear != null ? birthYear + age : currentYear,
                yearlyStem: horoscope.yearlyStem,
                mutagenStars: horoscope.mutagenStars || {}
              };
            }
          }

          // 各宮位小限年份：依年齡 0～99 算出每年小限落宮，再依宮位彙整（供時間模組 s15a 顯示與決策時間軸）
          var palaceOrderShort = ["命", "兄弟", "夫妻", "子女", "財帛", "疾厄", "遷移", "僕役", "官祿", "田宅", "福德", "父母"];
          var toPalaceKey = function (p) {
            var s = (p || "").toString().trim();
            return s === "命宮" ? "命" : s.replace(/宮$/, "");
          };
          var palaceToYears = {};
          var maxAge = birthYear != null ? Math.min(99, 120 - (currentYear - birthYear)) : 99;
          for (var a = 0; a <= maxAge; a++) {
            var h = window.BaziCore.getHoroscopeFromAge(a, ziwei, bazi, gender);
            if (!h || !h.activeLimitPalaceName) continue;
            var key = toPalaceKey(h.activeLimitPalaceName);
            if (!palaceToYears[key]) palaceToYears[key] = [];
            var y = birthYear != null ? birthYear + a : null;
            palaceToYears[key].push({
              year: y,
              nominalAge: a,
              stem: h.yearlyStem || null
            });
          }
          var riskPalaces = new Set((results.overlapAnalysis && results.overlapAnalysis.criticalRisks || []).map(function (r) { return toPalaceKey(r.palace); }));
          var opportunityPalaces = new Set((results.overlapAnalysis && results.overlapAnalysis.maxOpportunities || []).map(function (o) { return toPalaceKey(o.palace); }));
          var volatilePalaces = new Set((results.overlapAnalysis && results.overlapAnalysis.volatileAmbivalences || []).map(function (v) { return toPalaceKey(v.palace); }));
          results.minorFortuneByPalace = palaceOrderShort.map(function (palaceKey) {
            var entries = (palaceToYears[palaceKey] || []).sort(function (a, b) { return (a.year || 0) - (b.year || 0); });
            var first = entries[0];
            var palaceName = palaceKey === "命" ? "命宮" : palaceKey + "宮";
            var note = "";
            if (riskPalaces.has(palaceKey)) note = "此宮為超級地雷區，該年宜保守";
            else if (volatilePalaces.has(palaceKey)) note = "吉凶並見，謹慎決策";
            else if (opportunityPalaces.has(palaceKey)) note = "機會區，可積極把握";
            return {
              palace: palaceName,
              year: first ? first.year : null,
              nominalAge: first ? first.nominalAge : null,
              stem: first ? first.stem : null,
              note: note || null
            };
          });

          var ft = results.fourTransformations;
          if (ft && ft.liunian) {
            results.liunian = {
              year: currentYear,
              stem: ft.liunian.stem,
              branch: ft.liunian.branch,
              palace: ft.liunian.palace,
              mutagenStars: ft.liunian.mutagenStars || {},
              weights: ft.liunian.weights || {},
              type: "liunian"
            };
          }
        } catch (err) {
          console.warn("[adminExport] 命書時間軸組裝失敗:", err);
        }
      }
    }

    return results;
  }

  /**
   * 將計算結果提交到後台API
   * @param {Object} results 計算結果數據
   * @param {string} adminUser 後台用戶名
   * @param {string} adminPass 後台密碼
   * @returns {Promise<Object>} API響應
   */
  /**
   * 將計算結果提交到後台API
   * 注意：認證信息不會被記錄或輸出到日誌
   * @param {Object} results 計算結果數據
   * @param {string} adminUser 後台用戶名（從環境變數或用戶輸入獲取）
   * @param {string} adminPass 後台密碼（從環境變數或用戶輸入獲取）
   * @returns {Promise<Object>} API響應
   */
  async function submitToAdminAPI(results, adminUser, adminPass) {
    if (!adminUser || !adminPass) {
      throw new Error('需要後台認證資訊');
    }

    // 認證信息僅用於請求頭，不會記錄到日誌或存儲
    const auth = btoa(`${adminUser}:${adminPass}`);
    
    try {
      console.log('📡 API REQUEST', '/api/admin/calculation-results', JSON.stringify(results, null, 2));
      const response = await fetch('/api/admin/calculation-results', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${auth}`
        },
        body: JSON.stringify(results)
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(error.error || `HTTP ${response.status}`);
      }

      return await response.json();
    } catch (err) {
      console.error('[adminExport] 提交到後台API失敗:', err);
      throw err;
    }
  }

  // ====== 導出 ======

  // 導出到 window.AdminExport（如果 window 存在）
  // 注意：這個模組不應該在前端UI中直接使用，僅供後台管理界面調用
  if (typeof window !== "undefined") {
    window.AdminExport = {
      exportCalculationResults,
      submitToAdminAPI,
    };
  } else if (typeof globalThis !== "undefined") {
    globalThis.AdminExport = {
      exportCalculationResults,
      submitToAdminAPI,
    };
  }
})();
