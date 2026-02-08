/* ambient-sound.js
 * 環境音效模組 - 提供儀式感和神秘感的輕微音效
 * 導出到 window.UiComponents.AmbientSound
 */

(function () {
  "use strict";

  if (typeof window === "undefined") {
    throw new Error("ambient-sound.js requires browser environment");
  }

  let audioContext = null;
  let ambientGainNode = null;
  let isPlaying = false;

  /**
   * 初始化音頻上下文
   */
  function initAudioContext() {
    if (audioContext) return audioContext;

    try {
      const AudioCtx = AudioContext || webkitAudioContext;
      audioContext = new AudioCtx();
      ambientGainNode = audioContext.createGain();
      ambientGainNode.gain.value = 0.08; // 非常輕微的音量
      ambientGainNode.connect(audioContext.destination);
      return audioContext;
    } catch (err) {
      console.warn("[ambient-sound] 音頻上下文初始化失敗:", err);
      return null;
    }
  }

  /**
   * 生成環境音效（低頻嗡鳴 + 高頻閃爍）
   */
  function generateAmbientSound(duration = 0) {
    const ctx = initAudioContext();
    if (!ctx) return null;

    const sampleRate = ctx.sampleRate;
    const frameCount = duration > 0 ? duration * sampleRate : sampleRate * 2; // 預設 2 秒循環
    const buffer = ctx.createBuffer(1, frameCount, sampleRate);
    const data = buffer.getChannelData(0);

    // 生成神秘環境音效
    for (let i = 0; i < frameCount; i++) {
      const t = i / sampleRate;
      
      // 低頻基音（約 60Hz）- 持續的嗡鳴
      const lowFreq = Math.sin(2 * Math.PI * 60 * t) * 0.3;
      
      // 中頻和聲（約 120Hz, 180Hz）
      const midFreq1 = Math.sin(2 * Math.PI * 120 * t) * 0.15;
      const midFreq2 = Math.sin(2 * Math.PI * 180 * t) * 0.1;
      
      // 高頻閃爍（約 400Hz, 600Hz）- 偶爾出現
      const highFreq1 = Math.sin(2 * Math.PI * 400 * t) * Math.sin(Math.PI * t * 0.5) * 0.1;
      const highFreq2 = Math.sin(2 * Math.PI * 600 * t) * Math.sin(Math.PI * t * 0.3) * 0.08;
      
      // 包絡線（淡入淡出，避免突兀）
      const envelope = duration > 0 
        ? Math.sin(Math.PI * t / duration)
        : 1.0;
      
      // 混合所有頻率
      data[i] = (lowFreq + midFreq1 + midFreq2 + highFreq1 + highFreq2) * envelope * 0.12;
    }

    return buffer;
  }

  /**
   * 播放環境音效（循環）
   */
  function playAmbientSound() {
    if (isPlaying) return;
    
    const ctx = initAudioContext();
    if (!ctx) return;

    try {
      const buffer = generateAmbientSound(0); // 0 = 循環模式
      if (!buffer) return;

      function playLoop() {
        if (!isPlaying) return;
        
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(ambientGainNode);
        source.start(0);
        
        source.onended = function() {
          if (isPlaying) {
            playLoop(); // 循環播放
          }
        };
      }

      isPlaying = true;
      playLoop();
      console.log("[ambient-sound] 環境音效已啟動");
    } catch (err) {
      console.warn("[ambient-sound] 播放失敗:", err);
      isPlaying = false;
    }
  }

  /**
   * 停止環境音效
   */
  function stopAmbientSound() {
    isPlaying = false;
    console.log("[ambient-sound] 環境音效已停止");
  }

  /**
   * 播放流星音效（短暫的高頻閃爍）
   */
  function playMeteorSound() {
    const ctx = initAudioContext();
    if (!ctx) return;

    try {
      const duration = 0.4;
      const sampleRate = ctx.sampleRate;
      const frameCount = duration * sampleRate;
      const buffer = ctx.createBuffer(1, frameCount, sampleRate);
      const data = buffer.getChannelData(0);

      for (let i = 0; i < frameCount; i++) {
        const t = i / sampleRate;
        // 快速上升的高頻音效
        const freq = 400 + (t / duration) * 800; // 400Hz -> 1200Hz
        const wave = Math.sin(2 * Math.PI * freq * t);
        const envelope = Math.exp(-t * 5); // 快速衰減
        data[i] = wave * envelope * 0.15;
      }

      const source = ctx.createBufferSource();
      const gainNode = ctx.createGain();
      gainNode.gain.value = 0.1;
      source.buffer = buffer;
      source.connect(gainNode);
      gainNode.connect(ctx.destination);
      source.start(0);
    } catch (err) {
      console.warn("[ambient-sound] 流星音效播放失敗:", err);
    }
  }

  /**
   * 設置音量（0-1）
   */
  function setVolume(volume) {
    if (ambientGainNode) {
      ambientGainNode.gain.value = Math.max(0, Math.min(1, volume));
    }
  }

  // 導出到 window.UiComponents.AmbientSound
  if (!window.UiComponents) {
    window.UiComponents = {};
  }

  window.UiComponents.AmbientSound = {
    playAmbientSound,
    stopAmbientSound,
    playMeteorSound,
    setVolume,
  };

  // 背景音效已關閉（依需求可改回：在 DOMContentLoaded 後綁定 click/touchstart 呼叫 playAmbientSound）
})();
