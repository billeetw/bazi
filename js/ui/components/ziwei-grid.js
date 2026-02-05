/* ziwei-grid.js
 * 紫微盘渲染组件
 * 导出到 window.UiComponents.ZiweiGrid
 * 依赖: window.Calc, window.UiRenderHelpers, window.UiDomHelpers
 */

(function () {
  "use strict";

  if (typeof window === "undefined") {
    throw new Error("window object not available");
  }

  // 延迟检查依赖
  if (!window.Calc) {
    console.warn("[ziwei-grid.js] window.Calc not found yet, will check at runtime");
  }
  if (!window.UiRenderHelpers) {
    console.warn("[ziwei-grid.js] window.UiRenderHelpers not found yet, will check at runtime");
  }
  if (!window.UiDomHelpers) {
    console.warn("[ziwei-grid.js] window.UiDomHelpers not found yet, will check at runtime");
  }

  function getCalcHelpers() {
    if (!window.Calc) {
      throw new Error("window.Calc not available");
    }
    return {
      buildSlotsFromZiwei: window.Calc.buildSlotsFromZiwei,
      toTraditionalStarName: window.Calc.toTraditionalStarName,
      getMutagenStars: window.Calc.getMutagenStars,
      gridAreas: window.Calc.gridAreas,
      STAR_WUXING_MAP: window.Calc.STAR_WUXING_MAP,
    };
  }

  function getRenderHelpers() {
    if (!window.UiRenderHelpers) {
      throw new Error("window.UiRenderHelpers not available");
    }
    return {
      starWithBadgeHtml: window.UiRenderHelpers.starWithBadgeHtml,
    };
  }

  function getDomHelpers() {
    if (!window.UiDomHelpers) {
      throw new Error("window.UiDomHelpers not available");
    }
    return window.UiDomHelpers;
  }

  /**
   * 渲染紫微盘
   * @param {Object} ziwei - 紫微数据
   * @param {Object} horoscope - 小限数据
   * @param {Function} onPalaceClick - 宫位点击回调函数（可选）
   */
  function renderZiwei(ziwei, horoscope, onPalaceClick) {
    const container = document.getElementById("ziweiGrid");
    const hint = document.getElementById("ziweiHint");
    if (!container) return;

    container.innerHTML = "";
    if (!ziwei) {
      container.innerHTML = `
        <div class="col-span-4 flex items-center justify-center text-xs text-slate-500 text-center">
          紫微資料暫不可用（後端 iztro 出錯或未回傳）。請稍後重試。
        </div>`;
      if (hint) hint.textContent = "";
      return;
    }

    const { buildSlotsFromZiwei, gridAreas, getMutagenStars, toTraditionalStarName, STAR_WUXING_MAP } = getCalcHelpers();
    const { starWithBadgeHtml } = getRenderHelpers();

    const slots = buildSlotsFromZiwei(ziwei, horoscope);
    const mutagenStars = horoscope?.mutagenStars || {};

    slots.forEach((slot) => {
      const isKey = ["命宮", "官祿", "財帛"].includes(slot.palaceName);
      const glowClass = slot.mainElement ? `palace-glow-${slot.mainElement}` : "";
      const activeLimitClass = slot.isActiveLimit ? " is-active-limit" : "";

      const starsHtml = slot.stars.length
        ? slot.stars
            .map((s) => {
              const wx = STAR_WUXING_MAP[s] || "";
              const withBadge = starWithBadgeHtml(s, mutagenStars);
              return `<span class="${wx ? "star-wx-" + wx : ""}">${withBadge}</span>`;
            })
            .join("<br>")
        : `<span class="text-slate-600 text-xs italic font-normal">空宮</span>`;

      let title = slot.palaceName + " " + slot.branch;
      if (slot.isMing && slot.isShen) title += "（命身同宮）";
      else if (slot.isMing) title += "（命）";
      else if (slot.isShen) title += "（身）";
      if (slot.isActiveLimit) title += " · 小限命宮";

      const el = document.createElement("div");
      el.className = `zw-palace ${isKey ? "zw-palace-key" : ""} ${glowClass}${activeLimitClass}`;
      el.style.gridArea = gridAreas[slot.index];
      el.setAttribute("data-palace-name", slot.palaceName);

      const dl = slot.decadalLimit || {};
      const decadalText = (dl.start != null && dl.end != null) ? `大限 ${dl.start}–${dl.end}` : "";

      el.innerHTML = `
        <div class="text-[13px] font-black text-slate-300 leading-snug mb-1">
          ${title}
        </div>
        <div class="text-[11px] text-slate-500 mb-1">
          ${decadalText}
        </div>
        <div class="text-[13px] font-black leading-snug tracking-wide">
          ${starsHtml}
        </div>
      `;

      el.addEventListener("click", () => {
        if (onPalaceClick) {
          onPalaceClick(slot.palaceName);
        }
      });

      container.appendChild(el);
    });

    // 中央 core：命主、身主（繁體）。iztro 放在 basic.masterStar / basic.bodyStar，後端可能放在 core
    const center = document.createElement("div");
    center.className = "zw-center-block";
    const core = ziwei.core || {};
    const basic = ziwei.basic || {};
    
    // 获取 bazi 数据（需要通过回调或参数传入）
    // 这里暂时使用全局变量作为 fallback（向后兼容）
    const contract = window.contract || null;
    const bazi = contract?.bazi || null;
    const yearStem = (bazi?.display?.yG || "").toString().trim();
    const birthMutagen = yearStem ? (getMutagenStars(yearStem) || {}) : {};
    const stripStarLabel = (s) => String(s || "").replace(/^\d+\.?\s*/, "").trim();
    const mingzhuRaw = basic.masterStar ?? core.mingzhu ?? core.命主 ?? core.minggong ?? "";
    const shengongRaw = basic.bodyStar ?? core.shengong ?? core.身主 ?? "";
    const mingzhu = toTraditionalStarName(stripStarLabel(mingzhuRaw));
    const shengong = toTraditionalStarName(stripStarLabel(shengongRaw));
    const siHuaText =
      birthMutagen.祿 && birthMutagen.權 && birthMutagen.科 && birthMutagen.忌
        ? `${birthMutagen.祿}化祿 · ${birthMutagen.權}化權 · ${birthMutagen.科}化科 · ${birthMutagen.忌}化忌`
        : "—";
    center.innerHTML = `
      <div class="text-[10px] tracking-[0.18em] text-slate-500 font-black">DESTINY CORE</div>
      <div class="text-amber-400 font-black text-xl tracking-wide mt-2">${mingzhu || "—"}</div>
      <div class="text-slate-300 text-[11px] mt-1">身主：${shengong || "—"}</div>
      <div class="text-[10px] text-slate-500 mt-2 font-black">生年四化</div>
      <div class="text-slate-300 text-[10px] leading-tight mt-0.5">${siHuaText}</div>
      <div class="text-[11px] text-slate-400 mt-2">五行局：${core.wuxingju || "—"}</div>
      <div class="text-[10px] text-slate-500 mt-1">命宮支：${core.minggongBranch || "—"} ｜ 身宮支：${core.shengongBranch || "—"}</div>
    `;
    container.appendChild(center);

    if (hint) {
      hint.innerHTML = "提示：命宮位置會依命宮地支旋轉排盤；三方四正＝本宮＋對宮＋三合兩宮（點宮位自動標示）。";
    }
  }

  // 初始化 window.UiComponents
  if (!window.UiComponents) {
    window.UiComponents = {};
  }

  // 导出到 window.UiComponents.ZiweiGrid
  window.UiComponents.ZiweiGrid = {
    renderZiwei,
  };
})();
