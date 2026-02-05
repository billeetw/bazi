/* sound-service.js
 * 音效服务模块
 * 导出到 window.UiServices.SoundService
 */

(function () {
  "use strict";

  if (typeof window === "undefined") {
    throw new Error("window object not available");
  }

  /**
   * 低沈合成器音效：模擬系統同步完成（Web Audio API）
   */
  function playSyncSound() {
    try {
      var Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      var ctx = new Ctx();
      var now = ctx.currentTime;
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(120, now);
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.25);
      osc.frequency.exponentialRampToValueAtTime(55, now + 0.6);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.02, now + 0.6);
      osc.start(now);
      osc.stop(now + 0.65);
    } catch (e) {
      // 静默失败，不干扰用户体验
    }
  }

  // 导出到 window.UiServices.SoundService
  if (!window.UiServices) {
    window.UiServices = {};
  }

  window.UiServices.SoundService = {
    playSyncSound,
  };
})();
