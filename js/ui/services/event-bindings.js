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
        
        // 禁用按鈕防止重複點擊
        btnLaunch.disabled = true;
        
        // 播放啟動特效
        const LaunchEffect = window.UiComponents?.LaunchEffect;
        if (LaunchEffect && typeof LaunchEffect.playLaunchEffect === "function") {
          console.log("[event-bindings.js] 播放啟動特效");
          LaunchEffect.playLaunchEffect(btnLaunch, async function() {
            // 特效完成後執行計算
            try {
              console.log("[event-bindings.js] 調用 calculateFn");
              await calculateFn(); // 使用 await 確保異步錯誤被捕獲
              console.log("[event-bindings.js] calculateFn 執行完成");
            } catch (err) {
              console.error("[event-bindings.js] 啟動引擎失敗:", err);
              console.error("[event-bindings.js] 錯誤堆棧:", err.stack);
              const hint = document.getElementById("hint");
              const btn = document.getElementById("btnLaunch");
              if (btn) {
                btn.disabled = false;
                btn.textContent = "開啟 人生使用說明書";
              }
              if (hint) {
                hint.textContent = "啟動失敗：" + (err.message || "未知錯誤");
                hint.className = "text-center text-xs text-red-400 italic min-h-[1.2em]";
              }
            }
          });
        } else {
          // 如果特效模組不可用，直接執行計算
          console.warn("[event-bindings.js] LaunchEffect 模組不可用，跳過特效");
          try {
            console.log("[event-bindings.js] 調用 calculateFn");
            await calculateFn();
            console.log("[event-bindings.js] calculateFn 執行完成");
          } catch (err) {
            console.error("[event-bindings.js] 啟動引擎失敗:", err);
            console.error("[event-bindings.js] 錯誤堆棧:", err.stack);
            const hint = document.getElementById("hint");
            const btn = document.getElementById("btnLaunch");
            if (btn) {
              btn.disabled = false;
              btn.textContent = "開啟 人生使用說明書";
            }
            if (hint) {
              hint.textContent = "啟動失敗：" + (err.message || "未知錯誤");
              hint.className = "text-center text-xs text-red-400 italic min-h-[1.2em]";
            }
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

  /**
   * 绑定年龄滑块事件
   * @param {Object} params - 参数对象
   * @param {Object} params.contract - 合约数据
   * @param {Function} params.getCurrentAge - 获取当前年龄函数
   * @param {string} params.lastGender - 最后性别
   * @param {Function} params.renderZiwei - 渲染紫微函数
   * @param {Function} params.renderZiweiScores - 渲染紫微分数函数
   * @param {Function} params.selectPalace - 选择宫位函数
   * @param {Function} params.computeAllPalaceScores - 计算所有宫位分数函数
   * @param {Function} params.getHoroscopeFromAge - 从年龄获取小限函数
   * @param {Function} params.syncAgeSliderDisplay - 同步年龄滑块显示函数
   */
  function bindAgeSlider(params) {
    const {
      contract,
      getCurrentAge,
      lastGender,
      renderZiwei,
      renderZiweiScores,
      selectPalace,
      computeAllPalaceScores,
      getHoroscopeFromAge,
      syncAgeSliderDisplay,
    } = params;

    const currentAgeSlider = document.getElementById("currentAgeSlider");
    if (currentAgeSlider) {
      currentAgeSlider.addEventListener("input", () => {
        const age = Math.max(1, Math.min(120, Number(currentAgeSlider.value) || 38));
        syncAgeSliderDisplay(age);
        if (!contract?.ziwei) return;
        const bazi = contract.bazi;
        const horoscope = contract.ziwei.horoscope || getHoroscopeFromAge(age, lastGender, contract.ziwei, bazi);
        renderZiwei(contract.ziwei, horoscope);
        // 使用新算法重新計算宮位強度（年齡變化會影響小限四化）
        // 傳遞 bazi 和 age 以啟用完整四化系統
        computeAllPalaceScores(contract.ziwei, horoscope, { bazi: contract.bazi, age }).then(function (computedScores) {
          const scores = {
            palaceScores: computedScores,
            elementRatios: window.ziweiScores?.elementRatios || {},
          };
          window.ziweiScores = scores;
          renderZiweiScores(scores, horoscope, contract.ziwei);
          selectPalace(params.selectedPalace || "命宮");
        }).catch(function (err) {
          console.error("重新計算宮位分數失敗:", err);
          // Fallback：使用現有數據
          if (window.ziweiScores?.palaceScores) {
            renderZiweiScores(window.ziweiScores, horoscope, contract.ziwei);
          }
          selectPalace(params.selectedPalace || "命宮");
        });
      });
    }
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
    bindAgeSlider,
    bindMobileSheetCloseEvents,
  };
})();
