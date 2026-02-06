/* calculation-flow.js
 * 计算流程服务模块
 * 导出到 window.UiServices.CalculationFlow
 * 依赖: window.Calc, window.UiRenderHelpers, window.UiDomHelpers, window.UiComponents
 */

(function () {
  "use strict";

  if (typeof window === "undefined") {
    throw new Error("window object not available");
  }

  /**
   * 验证输入参数
   * @returns {Object} { isValid: boolean, errors: string[] }
   */
  function validateInputs(params) {
    const { vy, vm, vd, vh, vmin, timeMode, shichen, shichenHalf } = params;
    const errors = [];
    
    // 基本验证逻辑
    if (!vy || !vm || !vd) {
      errors.push("请填写完整的出生日期");
    }
    
    if (timeMode === "exact" && (vh === null || vh === undefined)) {
      errors.push("请填写出生时间");
    }
    
    if (timeMode === "shichen" && !shichen) {
      errors.push("请选择时辰");
    }
    
    return {
      isValid: errors.length === 0,
      errors: errors,
      // 向后兼容：也提供 error 属性
      error: errors.length > 0 ? errors[0] : null
    };
  }

  /**
   * 更新仪表板 UI
   */
  function updateDashboardUI() {
    // 显示仪表板，隐藏启动页面
    const dashboard = document.getElementById("dashboard");
    const launchPage = document.getElementById("launchPage");
    
    if (dashboard) dashboard.classList.remove("hidden");
    if (launchPage) launchPage.classList.add("hidden");
  }

  /**
   * 更新摘要信息
   */
  function updateSummary(params) {
    const { vy, vm, vd, gender, timeMode, resolved, bazi, pad2 } = params;
    
    // 更新摘要显示（如果需要）
    // 这里可以添加具体的摘要更新逻辑
  }

  /**
   * 渲染战术建议
   * 使用 StrategicPanel 组件渲染
   */
  function renderTactics(params) {
    const { bazi, dbContent, ziweiPalaceMetadata, liuyueData } = params;
    
    // 使用 StrategicPanel 组件
    if (window.UiComponents?.StrategicPanel?.renderStrategicPanel) {
      window.UiComponents.StrategicPanel.renderStrategicPanel({
        bazi,
        dbContent,
        ziweiPalaceMetadata,
        liuyueData,
      });
    } else {
      // Fallback: 使用旧的简单渲染方式
      const dominant = (bazi?.tenGod?.dominant || "").trim();
      const tenGodText = dominant && dbContent?.tenGods?.[dominant] 
        ? dbContent.tenGods[dominant] 
        : "";
      
      if (window.Calc?.computeDynamicTactics) {
        const tactics = window.Calc.computeDynamicTactics(
          bazi, 
          tenGodText, 
          ziweiPalaceMetadata, 
          liuyueData
        );
        
        const tacticalBox = document.getElementById("tacticalBox");
        if (tacticalBox && tactics.length > 0) {
          tacticalBox.innerHTML = tactics.map((x) => {
            const borderClass = x.tone === "emerald" ? "border-emerald-400/40" :
                               x.tone === "green" ? "border-green-400/40" :
                               x.tone === "red" ? "border-red-400/40" :
                               x.tone === "blue" ? "border-blue-400/40" :
                               x.tone === "slate" ? "border-slate-400/40" :
                               x.tone === "orange" ? "border-orange-400/40" :
                               "border-amber-400/40";
            return `<div class="p-4 rounded-xl border ${borderClass} bg-white/5 text-sm leading-relaxed">${x.text}</div>`;
          }).join("");
        }
      }
    }
  }

  // 導出
  if (typeof window !== "undefined") {
    if (!window.UiServices) {
      window.UiServices = {};
    }
    window.UiServices.CalculationFlow = {
      validateInputs,
      updateDashboardUI,
      updateSummary,
      renderTactics,
    };
  }
})();
