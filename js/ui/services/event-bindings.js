/* event-bindings.js
 * 事件绑定服务模块
 * 导出到 window.UiServices.EventBindings
 * 依赖: window.UiComponents, window.UiDomHelpers, window.Calc
 */

(function () {
  "use strict";

  if (typeof window === "undefined") {
    throw new Error("window object not available");
  }

  function t(key, fallback) {
    if (!window.I18n || typeof window.I18n.t !== "function") return fallback != null ? fallback : key;
    var s = window.I18n.t(key);
    return (s && s !== key) ? s : (fallback != null ? fallback : key);
  }

  /**
   * 绑定启动按钮事件
   * @param {Function} calculateFn - calculate 函数
   */
  function bindLaunchButton(calculateFn) {
    const btnLaunch = document.getElementById("btnLaunch");
    if (btnLaunch) {
      console.log("[event-bindings.js] 找到啟動按鈕，準備綁定事件");
      console.log("[event-bindings.js] calculateFn 類型:", typeof calculateFn);
      btnLaunch.addEventListener("click", async function(e) {
        e.preventDefault();
        e.stopPropagation();
        console.log("[event-bindings.js] 按鈕點擊事件觸發");

        // 先驗證：未選擇時辰時立即提示，不進入 Loading
        const vy = Number(document.getElementById("birthYear")?.value);
        const vm = Number(document.getElementById("birthMonth")?.value);
        const vd = Number(document.getElementById("birthDay")?.value);
        const timeMode = (document.getElementById("timeMode")?.value || "exact").trim();
        const vh = Number(document.getElementById("birthHour")?.value);
        const vmin = Number(document.getElementById("birthMinute")?.value);
        const shichen = (document.getElementById("birthShichen")?.value || "").trim();
        const shichenHalf = (document.getElementById("birthShichenHalf")?.value || "").trim();
        const CalculationFlow = window.UiServices?.CalculationFlow || {};
        const validation = CalculationFlow.validateInputs
          ? CalculationFlow.validateInputs({ vy, vm, vd, vh, vmin, timeMode, shichen, shichenHalf })
          : { isValid: true, errors: [] };
        if (!validation.isValid) {
          const msg = (validation.errors && validation.errors[0]) || validation.error || "請選擇時辰";
          const Toast = window.UiServices?.Toast;
          if (Toast?.show) Toast.show(msg, { type: "info" });
          else window.alert(msg);
          return;
        }

        // 禁用按鈕防止重複點擊
        btnLaunch.disabled = true;

        // 沉浸式 Loading（全畫面 + 輪播文案 3–5 秒）+ 計算
        const LaunchEffect = window.UiComponents?.LaunchEffect;
        const runCalc = (typeof LaunchEffect?.playImmersiveLoading === "function")
          ? LaunchEffect.playImmersiveLoading.bind(LaunchEffect, calculateFn)
          : function () { return Promise.resolve(calculateFn()); };

        try {
          await runCalc();
        } catch (err) {
          console.error("[event-bindings.js] 啟動引擎失敗:", err);
          const hint = document.getElementById("hint");
          const btn = document.getElementById("btnLaunch");
          if (btn) {
            btn.disabled = false;
            btn.textContent = t("ui.retry", "重試");
          }
          if (hint) {
            hint.textContent = t("ui.launchFailed", "啟動失敗") + "：" + (err.message || t("ui.unknownError", "未知錯誤"));
            hint.className = "text-center text-xs text-red-400 italic min-h-[1.2em]";
          }
          const Toast = window.UiServices?.Toast;
          const errMsg = err.message || t("ui.unknownError", "未知錯誤");
          if (Toast?.show) {
            Toast.show(errMsg, {
              type: "error",
              onRetry: function () {
                if (btn) btn.disabled = true;
                runCalc();
              },
              duration: 0,
            });
          }
        }
      });
      console.log("[event-bindings.js] 啟動按鈕事件已綁定");
    } else {
      console.error("[event-bindings.js] 找不到啟動按鈕 #btnLaunch");
    }
  }

  /**
   * 绑定五行雷达图和条形图的点击事件
   * @param {Function} openWuxingFn - 打开五行意义面板的函数
   */
  function bindWuxingClickEvents(openWuxingFn) {
    [
      "ziweiWxRadar",
      "surfaceWxRadar",
      "strategicWxRadar",
      "ziweiWxBars",
      "surfaceWxBars",
      "strategicWxBars",
    ].forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.style.cursor = "pointer";
      el.addEventListener("click", openWuxingFn);
    });
  }

  /** 綁定五行超載預警彈窗（點擊黃色三角形） */
  function bindOverloadAdviceModal() {
    const modal = document.getElementById("overloadModal");
    const backdrop = document.getElementById("overloadModalBackdrop");
    const body = document.getElementById("overloadModalBody");
    const closeBtn = document.getElementById("overloadModalClose");

    function show(adviceText) {
      if (!modal || !body) return;
      body.textContent = adviceText || "";
      modal.classList.remove("hidden");
      if (backdrop) backdrop.classList.remove("hidden");
    }
    function hide() {
      if (modal) modal.classList.add("hidden");
      if (backdrop) backdrop.classList.add("hidden");
    }

    document.addEventListener("click", function (e) {
      const btn = e.target.closest(".wx-overload-trigger");
      if (!btn) return;
      e.preventDefault();
      e.stopPropagation();
      const container = btn.closest("[data-overload-advice]");
      const advice = container?.dataset?.overloadAdvice || "";
      show(advice);
    });

    if (closeBtn) closeBtn.addEventListener("click", hide);
    if (backdrop) backdrop.addEventListener("click", hide);
  }

  /**
   * 绑定移动端底部面板关闭事件
   * @param {Function} closePalaceSheetFn - 关闭宫位面板函数
   */
  function bindMobileSheetCloseEvents(closePalaceSheetFn) {
    const closeBtn = document.getElementById("palaceSheetClose");
    const backdrop = document.getElementById("palaceSheetBackdrop");
    const palaceSheet = document.getElementById("palaceSheet");
    const mobilePalaceBody = document.getElementById("mobilePalaceBody");
    
    // 收合按钮点击事件
    if (closeBtn) {
      closeBtn.addEventListener("click", function(e) {
        e.stopPropagation();
        closePalaceSheetFn();
      });
    }
    
    // 背景遮罩点击事件
    if (backdrop) backdrop.addEventListener("click", closePalaceSheetFn);
    
    // 说明内容区域任意点击即可收回
    if (mobilePalaceBody) {
      mobilePalaceBody.addEventListener("click", function(e) {
        if (e.target.tagName === 'A' || e.target.tagName === 'BUTTON' || e.target.closest('a') || e.target.closest('button')) {
          return;
        }
        closePalaceSheetFn();
      });
    }
    
    // 整个 sheet 区域点击也可以关闭（除了按钮和链接）
    if (palaceSheet) {
      palaceSheet.addEventListener("click", function(e) {
        if (e.target.id === 'palaceSheetClose' || 
            e.target.closest('#palaceSheetClose') ||
            e.target.closest('.palace-sheet-header') ||
            e.target.tagName === 'A' || 
            e.target.tagName === 'BUTTON' ||
            e.target.closest('a') || 
            e.target.closest('button')) {
          return;
        }
        closePalaceSheetFn();
      });
    }
  }

  // 导出到 window.UiServices.EventBindings
  if (!window.UiServices) {
    window.UiServices = {};
  }

  window.UiServices.EventBindings = {
    bindLaunchButton,
    bindWuxingClickEvents,
    bindOverloadAdviceModal,
    bindMobileSheetCloseEvents,
  };
})();
