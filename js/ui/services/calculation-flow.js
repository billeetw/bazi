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
   * @param {Object} params - 输入参数
   * @returns {Object} 验证后的参数和错误信息
   */
  function validateInputs(params) {
    const { vy, vm, vd, vh, vmin, timeMode, shichen, shichenHalf } = params;
    const errors = [];

    if (![vy, vm, vd].every((n) => Number.isFinite(n))) {
      errors.push("請先選完整出生年／月／日。若不確定時辰，可點「不確定出生時間？點我推算時辰」。");
    }

    if (timeMode !== "exact" && timeMode !== "shichen") {
      errors.push("時間模式錯誤，請重新選擇");
    }

    if (timeMode === "exact") {
      if (![vh, vmin].every((n) => Number.isFinite(n))) {
        errors.push("請先選完整出生時間（時、分）");
      }
    } else {
      if (!shichen) {
        errors.push("請先選時辰，或不確定時間可點「不確定出生時間？點我推算時辰」");
      }
      if (shichenHalf !== "upper" && shichenHalf !== "lower") {
        errors.push("請先選上半/下半時辰");
      }
    }

    return { isValid: errors.length === 0, errors };
  }

  /**
   * 更新 UI 状态（显示/隐藏 dashboard）
   */
  function updateDashboardUI() {
    const sysEl = document.getElementById("system");
    const navEl = document.getElementById("workspaceNav");
    const navCta = document.getElementById("navCta");
    const inputEl = document.getElementById("inputCard");

    if (sysEl) {
      sysEl.classList.remove("hidden");
      document.body.classList.add("dashboard-visible");
      if (!sysEl.hasAttribute("data-dashboard-entered")) {
        sysEl.setAttribute("data-dashboard-entered", "1");
        sysEl.classList.add("dashboard-enter");
        const delayStep = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 0.06;
        sysEl.querySelectorAll(".dashboard-card").forEach((card, i) => {
          card.style.animationDelay = `${i * delayStep}s`;
        });
      }
    }
    if (navEl) navEl.classList.remove("hidden");
    if (navCta) navCta.classList.remove("hidden");
    if (inputEl) inputEl.classList.add("hidden");
  }

  /**
   * 更新摘要信息
   * @param {Object} params - 参数对象
   */
  function updateSummary(params) {
    const { vy, vm, vd, gender, timeMode, resolved, bazi, pad2 } = params;

    const summaryBirthEl = document.getElementById("summaryBirth");
    const summaryDMEl = document.getElementById("summaryDM");
    const summaryDominantEl = document.getElementById("summaryDominant");
    const summaryRedMonthsEl = document.getElementById("summaryRedMonths");

    if (summaryBirthEl) {
      const genderText = gender === "M" ? "男" : gender === "F" ? "女" : "";
      const timeText =
        timeMode === "shichen"
          ? `時辰：${resolved.shichen}${resolved.shichenHalf === "lower" ? "下" : "上"}（約 ${pad2(resolved.hour)}:${pad2(resolved.minute)}）`
          : `${pad2(resolved.hour)}:${pad2(resolved.minute)}`;

      summaryBirthEl.textContent =
        `${vy}/${pad2(vm)}/${pad2(vd)} · ${timeText}（公曆）` + (genderText ? ` · ${genderText}` : "");
    }
    if (summaryDMEl) summaryDMEl.textContent = bazi.dmElement || "—";
    if (summaryDominantEl) summaryDominantEl.textContent = (bazi.tenGod?.dominant || "—").trim() || "—";
    if (summaryRedMonthsEl) {
      const reds = bazi.liuyue2026?.redMonths || [];
      summaryRedMonthsEl.textContent = reds.length ? reds.join("、") : "偏少（可穩推）";
    }
  }

  /**
   * 渲染战术建议
   * @param {Object} params - 参数对象
   */
  function renderTactics(params) {
    const { bazi, dbContent, ziweiPalaceMetadata, liuyueData } = params;
    const dominant = (bazi?.tenGod?.dominant || "").trim();
    const tenGodText = dominant && dbContent?.tenGods?.[dominant] ? dbContent.tenGods[dominant] : "";

    if (!window.Calc?.computeDynamicTactics) return;

    const tactics = window.Calc.computeDynamicTactics(bazi, tenGodText, ziweiPalaceMetadata, liuyueData);
    const tacticalBox = document.getElementById("tacticalBox");
    if (tacticalBox) {
      tacticalBox.innerHTML = tactics.length
        ? tactics.map((x) => {
            const borderClass = x.tone === "emerald" ? "border-emerald-400/40" :
                               x.tone === "green" ? "border-green-400/40" :
                               x.tone === "red" ? "border-red-400/40" :
                               x.tone === "blue" ? "border-blue-400/40" :
                               x.tone === "slate" ? "border-slate-400/40" :
                               x.tone === "orange" ? "border-orange-400/40" :
                               "border-amber-400/40";
            return `<div class="p-4 rounded-xl border ${borderClass} bg-white/5 text-sm leading-relaxed">${x.text}</div>`;
          }).join("")
        : `<div class="text-sm text-slate-400 italic">（戰術提示暫不可用）</div>`;
    }
  }

  // 导出到 window.UiServices.CalculationFlow
  if (!window.UiServices) {
    window.UiServices = {};
  }

  window.UiServices.CalculationFlow = {
    validateInputs,
    updateDashboardUI,
    updateSummary,
    renderTactics,
  };
})();
