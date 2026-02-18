/**
 * 流月避雷卡：9:16 IG 比例分享圖
 * @param {Object} opts
 * @param {string} opts.monthLabel 如 "2026年3月"
 * @param {string} opts.gz 干支 如 "丁卯"
 * @param {number} opts.riskScore 危險指數 0-100
 * @param {string} opts.avoidPhrase 避雷語
 * @param {string} opts.boostPhrase 助推語
 * @returns {string} dataURL (image/png)
 */
(function () {
  "use strict";

  const W = 1080;
  const H = 1920; // 9:16
  const BG = "#0a0a16";
  const GOLD = "#fcd34d";
  const GOLD_DIM = "rgba(252, 211, 77, 0.6)";
  const WHITE = "#e2e8f0";
  const GRAY = "#94a3b8";
  const RED = "#ef4444";
  const AMBER = "#f59e0b";

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

  function generateLiuyueShareCard(opts) {
    const { monthLabel, gz, riskScore, avoidPhrase, boostPhrase } = opts;
    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, W, H);

    const pad = 60;
    const maxTextW = W - pad * 2;

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    ctx.fillStyle = GOLD_DIM;
    ctx.font = "24px 'Noto Serif TC', serif";
    ctx.fillText("一起出來玩", W / 2, 100);

    ctx.fillStyle = GOLD_DIM;
    ctx.font = "bold 40px 'Noto Serif TC', serif";
    ctx.fillText("📅 " + (monthLabel || "本月運勢"), W / 2, 200);

    ctx.fillStyle = GOLD;
    ctx.font = "bold 56px 'Noto Serif TC', serif";
    ctx.fillText(String(gz || ""), W / 2, 320);

    const risk = Math.max(0, Math.min(100, Number(riskScore) || 0));
    const riskColor = risk <= 35 ? "#22c55e" : risk <= 65 ? AMBER : RED;
    ctx.fillStyle = riskColor;
    ctx.font = "bold 36px 'Noto Serif TC', serif";
    ctx.fillText("危險指數 " + Math.round(risk), W / 2, 420);

    ctx.fillStyle = GRAY;
    ctx.font = "28px 'Noto Serif TC', serif";
    ctx.fillText("避雷", W / 2, 520);
    if (avoidPhrase) {
      ctx.fillStyle = WHITE;
      ctx.font = "32px 'Noto Serif TC', serif";
      const avoidLines = wrapText(ctx, avoidPhrase, maxTextW);
      avoidLines.slice(0, 3).forEach(function (line, i) {
        ctx.fillText(line, W / 2, 600 + i * 48);
      });
    }

    ctx.fillStyle = GRAY;
    ctx.font = "28px 'Noto Serif TC', serif";
    ctx.fillText("助推", W / 2, 780);
    if (boostPhrase) {
      ctx.fillStyle = WHITE;
      ctx.font = "32px 'Noto Serif TC', serif";
      const boostLines = wrapText(ctx, boostPhrase, maxTextW);
      boostLines.slice(0, 3).forEach(function (line, i) {
        ctx.fillText(line, W / 2, 860 + i * 48);
      });
    }

    ctx.fillStyle = GOLD_DIM;
    ctx.font = "24px 'Noto Serif TC', serif";
    ctx.fillText("一起出來玩 · 17gonplay.com", W / 2, H - 80);

    try {
      return canvas.toDataURL("image/png");
    } catch (e) {
      console.warn("[liuyue-share-card] toDataURL failed:", e);
      return null;
    }
  }

  window.UiUtils = window.UiUtils || {};
  window.UiUtils.LiuyueShareCard = { generateLiuyueShareCard };
})();
