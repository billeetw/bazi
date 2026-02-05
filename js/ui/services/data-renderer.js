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
            return window.Calc.getBoyanBoard(bazi.wuxing?.surface || {}); 
          } catch (_) { 
            return null; 
          } 
        })() 
      : null;
    
    const strategicBoard = typeof window.Calc?.getBoyanBoard === "function" 
      ? (() => { 
          try { 
            return window.Calc.getBoyanBoard(bazi.wuxing?.strategic || {}); 
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
    const cmd = dominant && dbContent?.tenGods?.[dominant] ? dbContent.tenGods[dominant] : "";
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

    // 渲染紫微盘
    if (renderZiwei) {
      renderZiwei(ziwei, horoscope);
    }

    // 计算并渲染紫微分数
    return computeAllPalaceScores(ziwei, horoscope)
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
