/* launch-effect.js
 * 啟動人生戰略引擎特效模組
 * 提供全畫面 Loading（旋轉文案）與按鈕光暈
 * 導出到 window.UiComponents.LaunchEffect
 */

(function () {
  "use strict";

  if (typeof window === "undefined") {
    throw new Error("launch-effect.js requires browser environment");
  }

  function t(key, fallback) {
    if (window.I18n && typeof window.I18n.t === "function") {
      var s = window.I18n.t(key);
      return (s && s !== key) ? s : (fallback != null ? fallback : key);
    }
    return fallback != null ? fallback : key;
  }

  /**
   * 全畫面 Loading：深色背景、中央 spinner、輪播文案
   * @returns {{ promise: Promise<void>, remove: Function }} promise 最少 3 秒後 resolve；remove 移除 overlay
   */
  function playFullScreenLoading() {
    var locale = (window.I18n && typeof window.I18n.getLocale === "function") ? (window.I18n.getLocale() || "") : "";
    var phrases = locale.toLowerCase().startsWith("en")
      ? [t("home.loadingPhraseSingle", "17gonplay is analyzing your cosmic data...")]
      : [
          t("home.loadingPhrase1", "正在載入你的角色屬性…"),
          t("home.loadingPhrase2", "計算人生主線任務…"),
          t("home.loadingPhrase3", "整理你的潛能與志願…"),
        ];
    var minDuration = 3500;
    var phraseInterval = 1100;

    var overlay = document.createElement("div");
    overlay.id = "launch-loading-overlay";
    overlay.style.cssText = "position:fixed;inset:0;background:rgba(10,10,22,0.97);z-index:9999;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:24px;";

    var spinner = document.createElement("div");
    spinner.style.cssText = "width:48px;height:48px;border:4px solid rgba(255,191,0,0.2);border-top-color:rgba(255,191,0,0.9);border-radius:50%;animation:launch-spin 0.8s linear infinite;";
    overlay.appendChild(spinner);

    var phraseEl = document.createElement("p");
    phraseEl.className = "text-amber-300/90 text-sm md:text-base font-medium text-center px-6 transition-opacity duration-200";
    phraseEl.textContent = phrases[0];
    overlay.appendChild(phraseEl);

    if (!document.getElementById("launch-loading-styles")) {
      var style = document.createElement("style");
      style.id = "launch-loading-styles";
      style.textContent = "@keyframes launch-spin{to{transform:rotate(360deg)}}";
      document.head.appendChild(style);
    }

    document.body.appendChild(overlay);

    var idx = 0;
    var phraseTimer = setInterval(function () {
      idx = (idx + 1) % phrases.length;
      phraseEl.style.opacity = "0";
      setTimeout(function () {
        phraseEl.textContent = phrases[idx];
        phraseEl.style.opacity = "1";
      }, 180);
    }, phraseInterval);

    function remove() {
      clearInterval(phraseTimer);
      if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
    }

    var promise = new Promise(function (resolve) {
      setTimeout(function () {
        resolve();
      }, minDuration);
    });

    return { promise: promise, remove: remove };
  }

  /**
   * 創建並播放啟動特效（按鈕光暈 + 粒子，向後兼容）
   * @param {HTMLElement} button - 按鈕元素
   * @param {Function} onComplete - 特效完成後的回調
   */
  function playLaunchEffect(button, onComplete) {
    if (!button) {
      if (onComplete) onComplete();
      return;
    }

    var rect = button.getBoundingClientRect();
    var centerX = rect.left + rect.width / 2;
    var centerY = rect.top + rect.height / 2;

    var effectContainer = document.createElement("div");
    effectContainer.id = "launch-effect-container";
    effectContainer.style.cssText = "position:fixed;top:0;left:0;width:100vw;height:100vh;pointer-events:none;z-index:9998;overflow:hidden;";
    document.body.appendChild(effectContainer);

    var glowRing = document.createElement("div");
    glowRing.style.cssText = "position:absolute;left:" + centerX + "px;top:" + centerY + "px;width:0;height:0;border-radius:50%;background:radial-gradient(circle,rgba(255,191,0,0.6) 0%,rgba(255,191,0,0.3) 30%,transparent 70%);transform:translate(-50%,-50%);animation:launch-glow-expand 0.8s ease-out forwards;";
    effectContainer.appendChild(glowRing);

    if (!document.getElementById("launch-effect-styles")) {
      var styleSheet = document.createElement("style");
      styleSheet.id = "launch-effect-styles";
      styleSheet.textContent = "@keyframes launch-glow-expand{0%{width:0;height:0;opacity:0.8}100%{width:600px;height:600px;opacity:0}}@keyframes launch-button-pulse{0%{opacity:0.6}100%{opacity:0}}";
      document.head.appendChild(styleSheet);
    }

    setTimeout(function () {
      if (effectContainer.parentNode) effectContainer.parentNode.removeChild(effectContainer);
      if (onComplete) onComplete();
    }, 800);
  }

  /**
   * 播放沉浸式 Loading（全畫面 + 輪播文案），並在最小延遲與 calculateFn 都完成後結束
   * @param {Function} calculateFn - async 計算函數
   * @returns {Promise<void>}
   */
  function playImmersiveLoading(calculateFn) {
    var loader = playFullScreenLoading();
    var calcPromise = Promise.resolve(calculateFn());
    return Promise.all([loader.promise, calcPromise])
      .then(function () {
        loader.remove();
      })
      .catch(function (err) {
        loader.remove();
        throw err;
      });
  }

  if (!window.UiComponents) {
    window.UiComponents = {};
  }

  window.UiComponents.LaunchEffect = {
    playLaunchEffect,
    playFullScreenLoading,
    playImmersiveLoading,
  };
})();
