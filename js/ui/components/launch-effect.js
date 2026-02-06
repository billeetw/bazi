/* launch-effect.js
 * 啟動人生戰略引擎特效模組
 * 提供神秘感的光暈、粒子效果和輕微音效
 * 導出到 window.UiComponents.LaunchEffect
 */

(function () {
  "use strict";

  if (typeof window === "undefined") {
    throw new Error("launch-effect.js requires browser environment");
  }

  /**
   * 創建並播放啟動特效
   * @param {HTMLElement} button - 按鈕元素
   * @param {Function} onComplete - 特效完成後的回調
   */
  function playLaunchEffect(button, onComplete) {
    if (!button) {
      console.warn("[launch-effect] 按鈕元素不存在，跳過特效");
      if (onComplete) onComplete();
      return;
    }

    // 獲取按鈕位置和尺寸
    const rect = button.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    // 創建特效容器
    const effectContainer = document.createElement("div");
    effectContainer.id = "launch-effect-container";
    effectContainer.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      pointer-events: none;
      z-index: 9998;
      overflow: hidden;
    `;
    document.body.appendChild(effectContainer);

    // 播放音效（輕微的神秘音效）
    playMysteriousSound();

    // 階段1：光暈擴散（0-0.8s）
    const glowRing = document.createElement("div");
    glowRing.style.cssText = `
      position: absolute;
      left: ${centerX}px;
      top: ${centerY}px;
      width: 0;
      height: 0;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(255, 191, 0, 0.6) 0%, rgba(255, 191, 0, 0.3) 30%, rgba(255, 191, 0, 0.1) 50%, transparent 70%);
      transform: translate(-50%, -50%);
      pointer-events: none;
      animation: launch-glow-expand 0.8s ease-out forwards;
    `;
    effectContainer.appendChild(glowRing);

    // 階段2：粒子爆發（0.3s-1.2s）
    const particleCount = 12;
    for (let i = 0; i < particleCount; i++) {
      setTimeout(() => {
        const particle = document.createElement("div");
        const angle = (Math.PI * 2 * i) / particleCount;
        const distance = 80 + Math.random() * 40;
        const duration = 0.6 + Math.random() * 0.3;
        const delay = Math.random() * 0.2;

        particle.style.cssText = `
          position: absolute;
          left: ${centerX}px;
          top: ${centerY}px;
          width: 4px;
          height: 4px;
          border-radius: 50%;
          background: rgba(255, 191, 0, 0.8);
          box-shadow: 0 0 8px rgba(255, 191, 0, 0.6);
          transform: translate(-50%, -50%);
          pointer-events: none;
          animation: launch-particle-${i} ${duration}s ease-out ${delay}s forwards;
        `;

        // 動態創建 keyframes
        const style = document.createElement("style");
        style.textContent = `
          @keyframes launch-particle-${i} {
            0% {
              opacity: 1;
              transform: translate(-50%, -50%) translate(0, 0) scale(1);
            }
            100% {
              opacity: 0;
              transform: translate(-50%, -50%) translate(${Math.cos(angle) * distance}px, ${Math.sin(angle) * distance}px) scale(0.3);
            }
          }
        `;
        document.head.appendChild(style);

        effectContainer.appendChild(particle);

        // 清理動態樣式
        setTimeout(() => {
          if (style.parentNode) {
            style.parentNode.removeChild(style);
          }
        }, (duration + delay) * 1000 + 100);
      }, 300);
    }

    // 階段3：按鈕光暈脈衝（0-1.5s）
    const buttonGlow = document.createElement("div");
    buttonGlow.style.cssText = `
      position: absolute;
      left: ${rect.left}px;
      top: ${rect.top}px;
      width: ${rect.width}px;
      height: ${rect.height}px;
      border-radius: 1rem;
      background: rgba(255, 191, 0, 0.3);
      box-shadow: 0 0 40px rgba(255, 191, 0, 0.6), inset 0 0 20px rgba(255, 191, 0, 0.2);
      pointer-events: none;
      animation: launch-button-pulse 1.5s ease-out forwards;
    `;
    effectContainer.appendChild(buttonGlow);

    // 添加 CSS 動畫定義（如果尚未存在）
    if (!document.getElementById("launch-effect-styles")) {
      const styleSheet = document.createElement("style");
      styleSheet.id = "launch-effect-styles";
      styleSheet.textContent = `
        @keyframes launch-glow-expand {
          0% {
            width: 0;
            height: 0;
            opacity: 0.8;
          }
          50% {
            opacity: 0.6;
          }
          100% {
            width: 600px;
            height: 600px;
            opacity: 0;
          }
        }
        @keyframes launch-button-pulse {
          0% {
            opacity: 0.6;
            transform: scale(1);
          }
          50% {
            opacity: 0.4;
            transform: scale(1.05);
          }
          100% {
            opacity: 0;
            transform: scale(1.1);
          }
        }
      `;
      document.head.appendChild(styleSheet);
    }

    // 清理特效容器
    setTimeout(() => {
      if (effectContainer.parentNode) {
        effectContainer.parentNode.removeChild(effectContainer);
      }
      if (onComplete) onComplete();
    }, 1500);
  }

  /**
   * 播放神秘音效（使用 Web Audio API 生成輕微的合成音）
   */
  function playMysteriousSound() {
    try {
      // 檢查瀏覽器是否支持 Web Audio API
      if (typeof AudioContext === "undefined" && typeof webkitAudioContext === "undefined") {
        console.log("[launch-effect] 瀏覽器不支持 Web Audio API，跳過音效");
        return;
      }

      const AudioCtx = AudioContext || webkitAudioContext;
      const audioContext = new AudioCtx();
      
      // 創建一個輕微的神秘音效：低頻嗡鳴 + 高頻閃爍
      const duration = 0.8;
      const sampleRate = audioContext.sampleRate;
      const frameCount = duration * sampleRate;
      const buffer = audioContext.createBuffer(1, frameCount, sampleRate);
      const data = buffer.getChannelData(0);

      // 生成神秘音效：低頻基音 + 高頻諧波
      for (let i = 0; i < frameCount; i++) {
        const t = i / sampleRate;
        // 低頻嗡鳴（約 80Hz）
        const lowFreq = Math.sin(2 * Math.PI * 80 * t);
        // 高頻閃爍（約 400Hz，快速衰減）
        const highFreq = Math.sin(2 * Math.PI * 400 * t) * Math.exp(-t * 3);
        // 包絡線（淡入淡出）
        const envelope = Math.sin(Math.PI * t / duration);
        // 混合並降低音量（避免太響）
        data[i] = (lowFreq * 0.3 + highFreq * 0.2) * envelope * 0.15;
      }

      const source = audioContext.createBufferSource();
      source.buffer = buffer;
      source.connect(audioContext.destination);
      source.start(0);

      // 清理音頻上下文（延遲以確保播放完成）
      setTimeout(() => {
        audioContext.close().catch(() => {});
      }, duration * 1000 + 100);
    } catch (err) {
      console.warn("[launch-effect] 音效播放失敗:", err);
      // 靜默失敗，不影響主要功能
    }
  }

  // 導出到 window.UiComponents.LaunchEffect
  if (!window.UiComponents) {
    window.UiComponents = {};
  }

  window.UiComponents.LaunchEffect = {
    playLaunchEffect,
  };
})();
