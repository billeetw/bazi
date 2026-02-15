/* data-renderer.js
 * 数据渲染服务模块
 * 导出到 window.UiServices.DataRenderer
 * 依赖: window.Calc, window.UiRenderHelpers, window.UiComponents
 */

(function () {
  "use strict";

  if (typeof window === "undefined") {
    throw new Error("window object not available");
  }

  /**
   * 渲染八字和五行数据
   * @param {Object} params - 参数对象
   * @param {Object} params.bazi - 八字数据
   * @param {Function} params.renderPillars - 渲染八字柱函数
   * @param {Function} params.renderBar - 渲染条形图函数
   * @param {Function} params.renderRadarChart - 渲染雷达图函数
   * @param {Function} params.renderFiveElementComment - 渲染五行注释函数
   */
  function renderBaziData(params) {
    const { bazi, renderPillars, renderBar, renderRadarChart, renderFiveElementComment } = params;

    if (!bazi) return;

    // 渲染八字柱
    if (renderPillars) {
      renderPillars(bazi);
    }

    // 计算五行板（如果可用）
    const surfaceBoard = typeof window.Calc?.getBoyanBoard === "function" 
      ? (() => { 
          try { 
            return window.Calc.getBoyanBoard(bazi.wuxing?.surface || {}, "surface"); 
          } catch (_) { 
            return null; 
          } 
        })() 
      : null;
    
    const strategicBoard = typeof window.Calc?.getBoyanBoard === "function" 
      ? (() => { 
          try { 
            return window.Calc.getBoyanBoard(bazi.wuxing?.strategic || {}, "strategic"); 
          } catch (_) { 
            return null; 
          } 
        })() 
      : null;

    // 渲染表面五行条形图和雷达图
    if (renderBar && renderRadarChart && renderFiveElementComment) {
      renderBar("surfaceWxBars", bazi.wuxing?.surface, 4, 
        surfaceBoard ? { strongest: surfaceBoard.strongest, weakest: surfaceBoard.weakest } : undefined);
      renderRadarChart("surfaceWxRadar", bazi.wuxing?.surface);
      renderFiveElementComment("surfaceWxComment", bazi.wuxing?.surface, "surface");

      // 渲染战略五行条形图和雷达图
      renderBar("strategicWxBars", bazi.wuxing?.strategic, bazi.wuxing?.maxStrategic || 1, 
        strategicBoard ? { strongest: strategicBoard.strongest, weakest: strategicBoard.weakest } : undefined);
      renderRadarChart("strategicWxRadar", bazi.wuxing?.strategic);
      renderFiveElementComment("strategicWxComment", bazi.wuxing?.strategic, "strategic");
    }

    // 渲染五行生剋診斷卡片（Normal Spec 五段式，標題與按鈕依 i18n）
    const flowCardEl = document.getElementById("wuxingFlowCard");
    if (flowCardEl) {
      function escapeHtml(s) {
        if (s == null) return "";
        return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
      }
      var wuxingFallback = { "wuxing.title": "五行生剋診斷", "wuxing.section1": "一、氣勢", "wuxing.section2": "二、相生優勢", "wuxing.section3": "三、相生瓶頸", "wuxing.section4": "四、最大制衡壓力", "wuxing.section5": "五、下一步我們能為你做什麼？", "wuxing.consultButton": "預約諮詢", "wuxing.noReport": "尚未取得生剋報告，請先完成計算；若問題持續，請檢查 WuxingFlowPipeline 設定。" };
      function wuxingT(k) {
        if (window.I18n && typeof window.I18n.t === "function") return window.I18n.t(k);
        return wuxingFallback[k] != null ? wuxingFallback[k] : k;
      }
      const wuxingTitle = wuxingT("wuxing.title");
      const section1 = wuxingT("wuxing.section1");
      const section2 = wuxingT("wuxing.section2");
      const section3 = wuxingT("wuxing.section3");
      const section4 = wuxingT("wuxing.section4");
      const section5 = wuxingT("wuxing.section5");
      const consultBtn = wuxingT("wuxing.consultButton");
      const noReport = wuxingT("wuxing.noReport");

      const report = bazi.wuxingFlowReport || window.wuxingFlowReport || null;
      if (!report) {
        flowCardEl.innerHTML = '<p class="text-slate-500 italic">' + escapeHtml(noReport) + '</p>';
      } else {
        const lines = [];
        lines.push('<h4 class="text-amber-200 font-semibold mb-2">' + escapeHtml(wuxingTitle) + '</h4>');
        if (report.momentumText) {
          lines.push('<p class="text-amber-300/90 font-medium">' + escapeHtml(section1) + '</p><p class="text-slate-200 pl-2 whitespace-pre-line">' + escapeHtml(report.momentumText) + '</p>');
        } else if (report.chief_complaint) {
          lines.push('<p class="text-amber-300/90 font-medium">' + escapeHtml(section1) + '</p><p class="text-slate-200 pl-2 whitespace-pre-line">' + escapeHtml(report.chief_complaint) + '</p>');
        }
        if (report.genPositiveText) {
          lines.push('<p class="text-amber-300/90 font-medium mt-2">' + escapeHtml(section2) + '</p><p class="text-slate-200 pl-2 whitespace-pre-line">' + escapeHtml(report.genPositiveText) + '</p>');
        }
        if (report.bottleneckText) {
          lines.push('<p class="text-amber-300/90 font-medium mt-2">' + escapeHtml(section3) + '</p><p class="text-slate-200 pl-2 whitespace-pre-line">' + escapeHtml(report.bottleneckText) + '</p>');
        } else if (Array.isArray(report.findings) && report.findings.length > 0) {
          lines.push('<p class="text-amber-300/90 font-medium mt-2">' + escapeHtml(section3) + '</p><ul class="text-slate-200 pl-2">' + report.findings.map(function (f) { return '<li class="list-disc ml-4">' + escapeHtml(f) + '</li>'; }).join("") + '</ul>');
        }
        if (report.controlText) {
          lines.push('<p class="text-amber-300/90 font-medium mt-2">' + escapeHtml(section4) + '</p><p class="text-slate-200 pl-2 whitespace-pre-line">' + escapeHtml(report.controlText) + '</p>');
        } else if (report.diagnosis) {
          lines.push('<p class="text-amber-300/90 font-medium mt-2">' + escapeHtml(section4) + '</p><p class="text-slate-200 pl-2">' + escapeHtml(report.diagnosis) + '</p>');
        }
        if (report.predictionText) {
          lines.push('<p class="text-amber-300/90 font-medium mt-2">' + escapeHtml(section5) + '</p><p class="text-slate-400 text-xs pl-2 whitespace-pre-line leading-relaxed">' + escapeHtml(report.predictionText) + '</p>');
        } else if (report.falsifiable_predictions) {
          lines.push('<p class="text-amber-300/90 font-medium mt-2">' + escapeHtml(section5) + '</p><p class="text-slate-400 text-xs pl-2 whitespace-pre-line">' + escapeHtml(report.falsifiable_predictions) + '</p>');
        }
        var siteUrl = (typeof window !== "undefined" && window.Config?.SITE_URL) ? window.Config.SITE_URL : "https://www.17gonplay.com";
        lines.push('<p class="mt-3 pl-2"><a href="' + siteUrl + '/consultation" target="_blank" rel="noopener noreferrer" class="inline-block px-4 py-2 rounded-lg bg-amber-500/90 text-slate-900 font-medium hover:bg-amber-400 transition">' + escapeHtml(consultBtn) + '</a></p>');
        flowCardEl.innerHTML = lines.join("");
      }
    }
  }

  /**
   * 渲染十神指令
   * @param {Object} params - 参数对象
   * @param {Object} params.bazi - 八字数据
   * @param {Object} params.dbContent - 数据库内容
   */
  function renderTenGodCommand(params) {
    const { bazi, dbContent } = params;
    if (!bazi) return;

    const dominant = (bazi.tenGod?.dominant || "").trim();
    var ContentUtils = window.UiUtils?.ContentUtils;
    var cmdRaw = ContentUtils && typeof ContentUtils.getContentValue === "function"
      ? ContentUtils.getContentValue(dbContent, "tenGods", dominant, null)
      : (dominant && dbContent?.tenGods?.[dominant] ? dbContent.tenGods[dominant] : null);
    if (cmdRaw && cmdRaw.startsWith("(missing:")) cmdRaw = null;
    const cmd = cmdRaw || "";
    const tenGodEl = document.getElementById("tenGodCommand");
    if (tenGodEl) {
      tenGodEl.textContent =
        cmd || `（資料庫尚未填入「${dominant || "—"}」的十神指令。你可以先在 ten_god_analysis 補上 2026 內容。）`;
    }
  }

  /**
   * 渲染紫微和流月数据（异步）
   * @param {Object} params - 参数对象
   * @param {Object} params.ziwei - 紫微数据
   * @param {Object} params.horoscope - 小限数据
   * @param {Object} params.bazi - 八字数据
   * @param {Object} params.ziweiScores - 紫微分数数据
   * @param {Function} params.renderZiwei - 渲染紫微函数
   * @param {Function} params.renderZiweiScores - 渲染紫微分数函数
   * @param {Function} params.renderLiuyue - 渲染流月函数
   * @param {Function} params.selectPalace - 选择宫位函数
   * @param {Function} params.computeAllPalaceScores - 计算所有宫位分数函数
   * @param {Function} params.updateAnnualTactics - 更新年度战术函数
   * @param {string} params.selectedPalace - 选中的宫位
   * @returns {Promise} 渲染完成的 Promise
   */
  function renderZiweiAndLiuyue(params) {
    const {
      ziwei,
      horoscope,
      bazi,
      ziweiScores,
      renderZiwei,
      renderZiweiScores,
      renderLiuyue,
      selectPalace,
      computeAllPalaceScores,
      updateAnnualTactics,
      selectedPalace,
      getCurrentAge, // 可選：用於獲取年齡
      gender, // 可選：性別（用於大限旋轉方向計算）
    } = params;

    if (!ziwei) {
      // 如果没有紫微数据，显示错误信息
      const palaceTitle = document.getElementById("palaceTitle");
      const palaceDetailBody = document.getElementById("palaceDetailBody");
      if (palaceTitle) palaceTitle.textContent = "紫微暫不可用";
      if (palaceDetailBody) {
        palaceDetailBody.innerHTML = `<div class="p-4 rounded-xl border border-white/10 bg-white/5 text-sm text-slate-300">
          後端 iztro 可能出錯（或打包問題）。請先確認 worker build/依賴，再重試。
        </div>`;
      }
      return Promise.resolve();
    }

    // 渲染紫微盘（傳遞 bazi 和 gender 以正確計算大限旋轉方向）
    if (renderZiwei) {
      renderZiwei(ziwei, horoscope, { bazi, gender });
    }

    // 计算并渲染紫微分数
    // 计算年龄（用于完整四化系统）
    let age = null;
    if (getCurrentAge && typeof getCurrentAge === 'function') {
      // 优先使用传入的 getCurrentAge 函数
      age = getCurrentAge();
    } else if (bazi && bazi.display && bazi.display.yG) {
      // 从八字数据推算年龄
      const yearStem = bazi.display.yG.toString().trim();
      // 尝试从年干中提取年份（如果格式是 "甲子2024" 这样的）
      const yearMatch = yearStem.match(/\d{4}/);
      if (yearMatch) {
        const birthYear = parseInt(yearMatch[0]);
        age = new Date().getFullYear() - birthYear;
      }
    }
    
    return computeAllPalaceScores(ziwei, horoscope, { bazi, age })
      .then(function (computedScores) {
        const scores = {
          palaceScores: computedScores,
          elementRatios: ziweiScores?.elementRatios || {},
        };
        window.ziweiScores = scores;
        
        if (renderZiweiScores) {
          renderZiweiScores(scores, horoscope, ziwei);
        }
        
        // 在紫微計算完成後再渲染流月
        if (renderLiuyue) {
          renderLiuyue(bazi);
        }
        
        // 更新年度戰術建議
        if (updateAnnualTactics) {
          updateAnnualTactics(bazi, horoscope, ziwei);
        }
      })
      .catch(function (err) {
        console.error("計算宮位分數失敗:", err);
        // Fallback：使用後端數據
        if (ziweiScores && ziweiScores.palaceScores) {
          console.warn("使用後端 API 數據作為 fallback");
          if (renderZiweiScores) {
            renderZiweiScores(ziweiScores, horoscope, ziwei);
          }
        } else {
          if (renderZiweiScores) {
            renderZiweiScores({ palaceScores: {}, elementRatios: ziweiScores?.elementRatios || {} }, horoscope, ziwei);
          }
        }
        
        // 即使計算失敗，也渲染流月
        if (renderLiuyue) {
          renderLiuyue(bazi);
        }
        
        // 更新年度戰術建議
        if (updateAnnualTactics) {
          updateAnnualTactics(bazi, horoscope, ziwei);
        }
      });
  }

  // 导出到 window.UiServices.DataRenderer
  if (!window.UiServices) {
    window.UiServices = {};
  }

  window.UiServices.DataRenderer = {
    renderBaziData,
    renderTenGodCommand,
    renderZiweiAndLiuyue,
  };
})();
