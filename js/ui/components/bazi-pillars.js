/* bazi-pillars.js
 * 八字柱渲染组件
 * 导出到 window.UiComponents.BaziPillars
 * 依赖: window.Calc (CANGGAN_DATA)
 */

(function () {
  "use strict";

  if (typeof window === "undefined") {
    throw new Error("window object not available");
  }

  // 延迟检查依赖
  if (!window.Calc) {
    console.warn("[bazi-pillars.js] window.Calc not found yet, will check at runtime");
  }

  function getCalcHelpers() {
    if (!window.Calc) {
      throw new Error("window.Calc not available");
    }
    return {
      CANGGAN_DATA: window.Calc.CANGGAN_DATA,
    };
  }

  /**
   * 渲染八字柱（年、月、日、时）和藏干
   * @param {Object} bazi - 八字数据对象
   */
  function renderPillars(bazi) {
    const grid = document.getElementById("pillarsGrid");
    if (!grid) return;
    grid.innerHTML = "";

    const { CANGGAN_DATA } = getCalcHelpers();
    const disp = bazi?.display || {};
    const cols = [
      { label: "年", g: disp.yG, z: disp.yZ, dim: false },
      { label: "月", g: disp.mG, z: disp.mZ, dim: false },
      { label: "日", g: disp.dG, z: disp.dZ, dim: true },
      { label: "時", g: disp.hG, z: disp.hZ, dim: false },
    ];

    cols.forEach((c) => {
      grid.innerHTML += `
        <div class="p-3 rounded-xl border border-white/10 bg-white/5">
          <div class="text-[10px] text-slate-500 font-black tracking-widest">${c.label}</div>
          <div class="bazi-char ${c.dim ? "text-amber-400" : ""}">${c.g || "—"}</div>
          <div class="text-sm text-slate-300">${c.z || "—"}</div>
        </div>
      `;
    });

    const cgBox = document.getElementById("cangganGrid");
    if (!cgBox) return;
    cgBox.innerHTML = "";

    const branches = [
      { label: "年支", z: disp.yZ },
      { label: "月支", z: disp.mZ },
      { label: "日支", z: disp.dZ },
      { label: "時支", z: disp.hZ },
    ];

    branches.forEach((b) => {
      const cg = CANGGAN_DATA[b.z] || null;
      const rows = cg
        ? Object.entries(cg)
            .sort((a, bb) => (bb[1] || 0) - (a[1] || 0))
            .map(([stem, w]) => {
              const pct = Math.round((Number(w) || 0) * 100);
              return `<span class="inline-flex items-center gap-2 px-2 py-1 rounded-lg bg-black/30 border border-white/10 text-xs">
                <span class="font-black">${stem}</span><span class="text-slate-400">${pct}%</span>
              </span>`;
            })
            .join(" ")
        : `<span class="text-slate-500 italic text-xs">（無藏干資料）</span>`;

      cgBox.innerHTML += `
        <div class="p-3 rounded-xl border border-white/10 bg-white/5">
          <div class="text-xs text-slate-400 mb-2">${b.label}：<span class="font-black text-slate-200">${b.z || "—"}</span></div>
          <div class="flex flex-wrap gap-2">${rows}</div>
        </div>
      `;
    });
  }

  // 初始化 window.UiComponents
  if (!window.UiComponents) {
    window.UiComponents = {};
  }

  // 导出到 window.UiComponents.BaziPillars
  window.UiComponents.BaziPillars = {
    renderPillars,
  };
})();
