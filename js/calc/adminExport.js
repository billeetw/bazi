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
      // 四化系統
      if (window.FourTransformations) {
        // 需要從計算流程中獲取，這裡先標記為需要計算
        results.fourTransformations = "需要從計算流程獲取";
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
