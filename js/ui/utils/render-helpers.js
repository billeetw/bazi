/* render-helpers.js
 * 渲染辅助函数
 * 导出到 window.UiRenderHelpers
 * 依赖: window.Calc, window.UiDomHelpers
 */

(function () {
  "use strict";

  if (typeof window === "undefined") {
    throw new Error("window object not available");
  }

  // 延迟检查依赖，避免在模块加载前报错
  if (!window.Calc) {
    console.warn("[render-helpers.js] window.Calc not found yet, will check at runtime");
  }
  if (!window.UiDomHelpers) {
    console.warn("[render-helpers.js] window.UiDomHelpers not found yet, will check at runtime");
  }

  // 从 window.Calc 获取依赖函数（运行时获取）
  function getCalcHelpers() {
    if (!window.Calc) {
      throw new Error("window.Calc not available");
    }
    return {
      getStarsForPalace: window.Calc.getStarsForPalace,
      toTraditionalStarName: window.Calc.toTraditionalStarName,
      normalizeWxByMax: window.Calc.normalizeWxByMax,
      FIVE_ELEMENTS_ORDER: window.Calc.FIVE_ELEMENTS_ORDER,
      generateFiveElementComment: window.Calc.generateFiveElementComment,
    };
  }

  function getDomHelpers() {
    if (!window.UiDomHelpers) {
      throw new Error("window.UiDomHelpers not available");
    }
    return window.UiDomHelpers;
  }

  /** 取得該宮位觸發的四化列表（祿/權/科/忌）。mutagenStars = { 祿: "廉貞", 權: "破軍", ... } */
  function getSihuaForPalace(ziwei, palaceName, mutagenStars) {
    if (!ziwei || !palaceName || !mutagenStars || typeof mutagenStars !== "object") return [];
    const { getStarsForPalace, toTraditionalStarName } = getCalcHelpers();
    const rawStars = getStarsForPalace(ziwei, palaceName);
    const stars = rawStars.map(toTraditionalStarName);
    const out = [];
    ["祿", "權", "科", "忌"].forEach((hua) => {
      const star = mutagenStars[hua];
      if (star && stars.includes(star)) out.push(hua);
    });
    return out;
  }

  /** 橫向五行能量條，可標記 [最強] [最弱]；數值使用 AnimatedNumber 緩動 */
  function renderBar(targetId, data, max, opts) {
    const box = document.getElementById(targetId);
    if (!box) return;
    const { animateValue } = getDomHelpers();
    const t = (k) => (window.I18n && typeof window.I18n.t === "function") ? window.I18n.t(k) : k;
    const zhToKey = { "木": "wuxing.wood", "火": "wuxing.fire", "土": "wuxing.earth", "金": "wuxing.metal", "水": "wuxing.water" };
    const keys = ["木", "火", "土", "金", "水"];
    const values = keys.map((e) => Number(data?.[e] || 0));
    const dataMax = Math.max(0, ...values);
    const dataMin = Math.min(...values);
    /** 若全為 0 或無差異，不顯示 [最強]/[最弱] 標籤 */
    const hasVariation = dataMax > 0 && dataMax !== dataMin;
    const strongest = hasVariation ? (opts?.strongest ?? null) : null;
    const weakest = hasVariation ? (opts?.weakest ?? null) : null;
    const strongestLabel = t("wuxing.strongest");
    const weakestLabel = t("wuxing.weakest");
    box.innerHTML = "";
    keys.forEach((e) => {
      const v = Number(data?.[e] || 0);
      const w = max ? Math.max(3, (v / max) * 100) : 0;
      const tag = e === strongest ? ` <span class="text-amber-400 text-[10px] font-black">[ ${strongestLabel} ]</span>` : e === weakest ? ` <span class="text-slate-400 text-[10px] font-black">[ ${weakestLabel} ]</span>` : "";
      const label = t(zhToKey[e]) || e;
      box.innerHTML += `
        <div class="mb-1 wx-row">
          <div class="flex justify-between text-xs text-slate-300">
            <span class="font-bold">${label}${tag}</span>
            <span class="font-mono wx-value" data-value="${v}">0</span>
          </div>
          <div class="h-2 bg-white/10 rounded overflow-hidden">
            <div class="h-full wuxing-${e} wx-bar-inner" style="width:${w}%"></div>
          </div>
        </div>
      `;
    });
    box.querySelectorAll(".wx-value").forEach((span, i) => {
      const v = Number(data?.[["木", "火", "土", "金", "水"][i]] || 0);
      animateValue(span, v, { duration: 400, decimals: 1 });
    });
  }

  function toneClass(tone) {
    if (tone === "red") return "border-red-400/60 bg-red-500/10 text-red-100";
    if (tone === "blue") return "border-blue-400/60 bg-blue-500/10 text-blue-100";
    if (tone === "green") return "border-emerald-400/60 bg-emerald-500/10 text-emerald-100";
    if (tone === "slate") return "border-slate-400/40 bg-white/5 text-slate-100";
    return "border-amber-400/60 bg-amber-500/10 text-amber-100";
  }

  /** 手機適配：每段不超過 20 字、增加間距，易讀 */
  function wrapForMobile(text, maxCharsPerLine) {
    if (!text) return "";
    const max = maxCharsPerLine || 20;
    const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
    const segments = String(text).split("\n").map((s) => s.trim()).filter(Boolean);
    const out = [];
    segments.forEach((seg) => {
      if (!isMobile || seg.length <= max) {
        out.push(seg);
        return;
      }
      for (let i = 0; i < seg.length; i += max) {
        out.push(seg.slice(i, i + max));
      }
    });
    return out;
  }

  // ====== Radar Chart (SVG) ======
  function renderRadarChart(containerId, wx) {
    const box = document.getElementById(containerId);
    if (!box) return;

    const { normalizeWxByMax, FIVE_ELEMENTS_ORDER } = getCalcHelpers();
    const { order, raw, normalized } = normalizeWxByMax(wx, FIVE_ELEMENTS_ORDER);

    const size = 220;
    const cx = size / 2;
    const cy = size / 2;
    const r = 78;

    const startAngle = -Math.PI / 2; // 由上方開始
    const step = (Math.PI * 2) / order.length;

    function polar(angle, radius) {
      return { x: cx + Math.cos(angle) * radius, y: cy + Math.sin(angle) * radius };
    }

    function pointsForLevel(levelPct) {
      return order
        .map((_, i) => {
          const a = startAngle + step * i;
          const p = polar(a, (r * levelPct) / 100);
          return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
        })
        .join(" ");
    }

    const gridLevels = [20, 40, 60, 80, 100];
    const gridPolys = gridLevels
      .map((lvl) => `<polygon points="${pointsForLevel(lvl)}" fill="none" stroke="rgba(148,163,184,0.18)" stroke-width="1"/>`)
      .join("");

    const axisLines = order
      .map((_, i) => {
        const a = startAngle + step * i;
        const p = polar(a, r);
        return `<line x1="${cx}" y1="${cy}" x2="${p.x.toFixed(1)}" y2="${p.y.toFixed(1)}" stroke="rgba(148,163,184,0.18)" stroke-width="1" />`;
      })
      .join("");

    const dataPoints = order
      .map((k, i) => {
        const a = startAngle + step * i;
        const pct = Math.max(0, Math.min(100, Number(normalized[k] || 0)));
        const p = polar(a, (r * pct) / 100);
        return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
      })
      .join(" ");

    const zhToKey = { "木": "wuxing.wood", "火": "wuxing.fire", "土": "wuxing.earth", "金": "wuxing.metal", "水": "wuxing.water" };
    const t = (key) => (window.I18n && typeof window.I18n.t === "function") ? window.I18n.t(key) : key;
    const labels = order
      .map((k, i) => {
        const a = startAngle + step * i;
        const p = polar(a, r + 18);
        const v = Number(raw[k] || 0);
        const label = t(zhToKey[k]) || k;
        return `
          <text x="${p.x.toFixed(1)}" y="${p.y.toFixed(1)}"
                fill="rgba(226,232,240,0.92)" font-size="11" font-weight="800"
                text-anchor="middle" dominant-baseline="middle">
            ${label}
          </text>
          <text x="${p.x.toFixed(1)}" y="${(p.y + 12).toFixed(1)}"
                fill="rgba(148,163,184,0.9)" font-size="10"
                text-anchor="middle" dominant-baseline="middle">
            ${Number.isFinite(v) ? v.toFixed(1) : "0.0"}
          </text>
        `;
      })
      .join("");

    box.innerHTML = `
      <svg viewBox="0 0 ${size} ${size}" width="100%" height="100%" preserveAspectRatio="xMidYMid meet" role="img" aria-label="五行雷達圖">
        ${gridPolys}
        ${axisLines}
        <polygon points="${dataPoints}"
                 fill="rgba(251,191,36,0.12)"
                 stroke="rgba(251,191,36,0.75)"
                 stroke-width="2" />
        ${labels}
      </svg>
    `;
  }

  /** 伯彥戰略看板：一橫條（標 [最強][最弱]）+ 本局屬性 / 戰略亮點 / 系統風險 / 伯彥助推，總字數 ≤150 */
  function renderFiveElementComment(containerId, wx, kind = "strategic") {
    const el = document.getElementById(containerId);
    if (!el) return;

    const { generateFiveElementComment } = getCalcHelpers();

    const t = (k) => (window.I18n && typeof window.I18n.t === "function") ? window.I18n.t(k) : k;
    const fallbackTpl = t("wuxing.fallbackStrongWeak") || "本局五行：最強【{{s}}】、最弱【{{w}}】。";

    if (typeof window.Calc?.getBoyanBoard !== "function") {
      const c = generateFiveElementComment(wx || {}, kind);
      const label = fallbackTpl.replace("{{s}}", c.strongest).replace("{{w}}", c.weakest);
      el.innerHTML = `<div class="text-slate-100">${label}</div><div class="text-slate-300 mt-1">${c.strongComment} ${c.weakComment}</div>`;
      return;
    }

    let board;
    try {
      board = window.Calc.getBoyanBoard(wx || {}, kind);
    } catch (err) {
      console.warn("getBoyanBoard error:", err);
      const c = generateFiveElementComment(wx || {}, kind);
      const label = fallbackTpl.replace("{{s}}", c.strongest).replace("{{w}}", c.weakest);
      el.innerHTML = `<div class="text-slate-100">${label}</div><div class="text-slate-300 mt-1">${c.strongComment} ${c.weakComment}</div>`;
      return;
    }

    function escapeHtml(s) {
      return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
    }

    el.innerHTML = `
      <div class="boyan-board text-[11px] text-slate-200 space-y-2 leading-relaxed">
        <div class="boyan-attr">${escapeHtml(board.本局屬性 || "")}</div>
        <div class="boyan-highlight">${escapeHtml(board.戰略亮點 || "")}</div>
        <div class="boyan-risk">${escapeHtml(board.系統風險 || "")}</div>
        <div class="boyan-push text-amber-200/95 font-semibold">${escapeHtml(board.伯彥助推 || "")}</div>
      </div>
    `;
  }

  /** 根據星等顏色代碼獲取對應的 RGB 顏色（用於能量條） */
  function getColorFromCode(colorCode) {
    // 優先使用全局配置
    if (window.Config?.getRgbColor) {
      return window.Config.getRgbColor(colorCode);
    }
    // Fallback: 本地實現（向後兼容）
    const colorMap = {
      "emerald": "rgb(16, 185, 129)",  // 翠綠色（4.5星）
      "green": "rgb(34, 197, 94)",     // 綠色（4.0星）
      "amber": "rgb(251, 191, 36)",    // 琥珀色（3.5星）
      "orange": "rgb(249, 115, 22)",   // 橙色（3.0星）
      "slate": "rgb(100, 116, 139)"    // 灰藍色（2.5星）
    };
    return colorMap[colorCode] || "rgb(251, 191, 36)"; // 預設琥珀色
  }

  /** 根據星等獲取對應的邊框顏色類（用於卡片邊框） */
  function getBorderColorClass(colorCode) {
    // 優先使用全局配置
    if (window.Config?.getBorderColorClass) {
      return window.Config.getBorderColorClass(colorCode);
    }
    // Fallback: 本地實現（向後兼容）
    const borderMap = {
      "emerald": "border-emerald-400/40",
      "green": "border-green-400/40",
      "amber": "border-amber-400/40",
      "orange": "border-orange-400/40",
      "slate": "border-slate-400/40"
    };
    return borderMap[colorCode] || "border-amber-400/40";
  }

  /** 根據星等獲取對應的背景顏色類（用於卡片背景） */
  function getBgColorClass(colorCode) {
    // 優先使用全局配置
    if (window.Config?.getBgColorClass) {
      return window.Config.getBgColorClass(colorCode);
    }
    // Fallback: 本地實現（向後兼容）
    const bgMap = {
      "emerald": "bg-emerald-500/10",
      "green": "bg-green-500/10",
      "amber": "bg-amber-500/10",
      "orange": "bg-orange-500/10",
      "slate": "bg-slate-500/10"
    };
    return bgMap[colorCode] || "bg-amber-500/10";
  }

  /** 根據星等獲取對應的文字顏色類（用於標籤） */
  function getTextColorClass(colorCode) {
    // 優先使用全局配置
    if (window.Config?.getTextColorClass) {
      return window.Config.getTextColorClass(colorCode);
    }
    // Fallback: 本地實現（向後兼容）
    const textMap = {
      "emerald": "text-emerald-300",
      "green": "text-green-300",
      "amber": "text-amber-300",
      "orange": "text-orange-300",
      "slate": "text-slate-300"
    };
    return textMap[colorCode] || "text-amber-300";
  }

  /** 根據分數百分比計算星級（1-5 顆星，區間更細緻） */
  function getStarRating(pct) {
    if (pct >= 90) return 5;
    if (pct >= 70) return 4;
    if (pct >= 50) return 3;
    if (pct >= 30) return 2;
    return 1;
  }

  /** 渲染星級 HTML（支持半顆星顯示：2.5, 3.0, 3.5, 4.0, 4.5） */
  function renderStars(count) {
    // 確保 count 在 2.5-4.5 範圍內
    const clampedCount = Math.max(2.5, Math.min(4.5, count));
    
    // 計算整數部分和小數部分
    const fullStars = Math.floor(clampedCount);
    const hasHalfStar = (clampedCount % 1) >= 0.5;
    
    return Array.from({ length: 5 }, (_, i) => {
      // 前 fullStars 顆星：完全填充
      if (i < fullStars) {
        return `<span class="text-amber-400 opacity-100">★</span>`;
      }
      // 如果有半顆星且是下一顆：使用 CSS 顯示半顆星
      if (i === fullStars && hasHalfStar) {
        // 使用相對定位和 clip-path 來顯示半顆星
        return `<span class="text-amber-400 opacity-100 inline-block relative" style="width: 0.6em; overflow: hidden;"><span style="clip-path: inset(0 50% 0 0); display: inline-block;">★</span></span>`;
      }
      // 其餘：空星
      return `<span class="text-amber-400 opacity-20">★</span>`;
    }).join("");
  }

  /** 四化 Badge 的 HTML（祿紅/權橙/科綠/忌灰），無則回傳空字串 */
  function getMutagenBadgeHtml(starName, mutagenStars) {
    if (!mutagenStars || typeof mutagenStars !== "object") return "";
    const badge = [];
    if (mutagenStars["祿"] === starName) badge.push('<span class="zw-badge zw-badge-lu">祿</span>');
    if (mutagenStars["權"] === starName) badge.push('<span class="zw-badge zw-badge-quan">權</span>');
    if (mutagenStars["科"] === starName) badge.push('<span class="zw-badge zw-badge-ke">科</span>');
    if (mutagenStars["忌"] === starName) badge.push('<span class="zw-badge zw-badge-ji">忌</span>');
    return badge.join("");
  }

  /** 星名 + 四化 Badge（用於宮格內一行顯示） */
  function starWithBadgeHtml(starName, mutagenStars) {
    const badge = getMutagenBadgeHtml(starName, mutagenStars);
    return badge ? starName + " " + badge : starName;
  }

  // 導出到 window.UiRenderHelpers
  window.UiRenderHelpers = {
    getSihuaForPalace,
    renderBar,
    toneClass,
    wrapForMobile,
    renderRadarChart,
    renderFiveElementComment,
    getColorFromCode,
    getBorderColorClass,
    getBgColorClass,
    getTextColorClass,
    getStarRating,
    renderStars,
    getMutagenBadgeHtml,
    starWithBadgeHtml,
  };
})();
