/**
 * 光明燈年度圖片：Canvas 生成 PNG（1080×1350，適合分享）
 * @param {Object} opts
 * @param {number} opts.year
 * @param {string} opts.flowStemBranch 如 丙午
 * @param {string} opts.zodiac 如 鼠
 * @param {string} opts.guardianPhrase
 * @returns {string} dataURL (image/png)
 */
(function () {
  "use strict";

  const W = 1080;
  const H = 1350;
  const BG = "#0a0a16";
  const GOLD = "#fcd34d";
  const GOLD_DIM = "rgba(252, 211, 77, 0.6)";
  const WHITE = "#e2e8f0";
  const GRAY = "#94a3b8";

  function wrapText(ctx, text, maxWidth) {
    const lines = [];
    const chars = text.split("");
    let line = "";
    for (let i = 0; i < chars.length; i++) {
      const test = line + chars[i];
      const m = ctx.measureText(test);
      if (m.width > maxWidth && line) {
        lines.push(line);
        line = chars[i];
      } else {
        line = test;
      }
    }
    if (line) lines.push(line);
    return lines;
  }

  function generateLampImage(opts) {
    const { year, flowStemBranch, zodiac, guardianPhrase } = opts;
    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, W, H);

    const pad = 80;
    const maxTextW = W - pad * 2;

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    ctx.fillStyle = GOLD_DIM;
    ctx.font = "26px 'Noto Serif TC', serif";
    ctx.fillText("一起出來玩", W / 2, 80);

    ctx.fillStyle = GOLD_DIM;
    ctx.font = "bold 48px 'Noto Serif TC', serif";
    ctx.fillText(String(year) + " " + (flowStemBranch || ""), W / 2, 180);

    ctx.fillStyle = GOLD;
    ctx.font = "bold 72px 'Noto Serif TC', serif";
    ctx.fillText("🏮 光明燈已點亮", W / 2, 320);

    ctx.fillStyle = GRAY;
    ctx.font = "32px 'Noto Serif TC', serif";
    ctx.fillText("生肖 " + (zodiac ? zodiac : ""), W / 2, 420);

    if (guardianPhrase) {
      ctx.fillStyle = WHITE;
      ctx.font = "36px 'Noto Serif TC', serif";
      const lines = wrapText(ctx, guardianPhrase, maxTextW);
      const lineH = 52;
      const startY = 560;
      lines.forEach(function (line, i) {
        ctx.fillText(line, W / 2, startY + i * lineH);
      });
    }

    ctx.fillStyle = GOLD_DIM;
    ctx.font = "28px 'Noto Serif TC', serif";
    ctx.fillText("一起出來玩 · 17gonplay.com", W / 2, H - 100);

    try {
      return canvas.toDataURL("image/png");
    } catch (e) {
      console.warn("[lamp-image] toDataURL failed:", e);
      return null;
    }
  }

  window.UiUtils = window.UiUtils || {};
  window.UiUtils.LampImage = { generateLampImage };
})();
