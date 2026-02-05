/* wuxing-meaning.js
 * 五行意义盒子组件
 * 导出到 window.UiComponents.WuxingMeaning
 * 依赖: 无（纯渲染组件）
 */

(function () {
  "use strict";

  if (typeof window === "undefined") {
    throw new Error("window object not available");
  }

  const DEFAULT_WUXING_MEANINGS = {
    "木": { headline: "成長與規劃", content: "木代表生長、延展、規劃、學習與人際連結。木旺多主主動、願意推進；木弱常需補策略與長期布局。" },
    "火": { headline: "能見度與動能", content: "火代表表達、曝光、熱情、推動與決策速度。火旺易衝過頭、情緒決策；火弱則行動與自信不足。" },
    "土": { headline: "承接與系統", content: "土代表穩定、容器、流程、規範與持久力。土旺易沉重保守；土弱則難落地、缺乏承載。" },
    "金": { headline: "結構與界線", content: "金代表規則、切割、效率、標準與風險控制。金旺容易苛刻、壓迫；金弱則界線鬆散、執行標準不穩。" },
    "水": { headline: "流動與洞察", content: "水代表資訊、資源流動、洞察與適應。水旺常多想多變；水弱則視野變窄、資源調度不順。" },
  };

  /**
   * 渲染五行意义盒子
   * @param {Object} dbContent - 数据库内容（可选，如果提供则优先使用）
   */
  function renderWuxingMeaningBox(dbContent) {
    const box = document.getElementById("wuxingMeaningBox");
    if (!box) return;
    box.innerHTML = "";
    const src = (dbContent?.wuxing && Object.keys(dbContent.wuxing).length) ? dbContent.wuxing : DEFAULT_WUXING_MEANINGS;

    ["木", "火", "土", "金", "水"].forEach((el) => {
      const item = src[el] || DEFAULT_WUXING_MEANINGS[el];
      box.innerHTML += `
        <div class="p-3 rounded-xl border border-white/10 bg-white/5">
          <div class="flex items-center justify-between">
            <div class="font-black text-slate-100">${el}</div>
            <div class="text-[10px] text-slate-400">${item?.headline || ""}</div>
          </div>
          <div class="text-xs text-slate-300 mt-2 leading-relaxed">${item?.content || ""}</div>
        </div>
      `;
    });
  }

  // 初始化 window.UiComponents
  if (!window.UiComponents) {
    window.UiComponents = {};
  }

  // 导出到 window.UiComponents.WuxingMeaning
  window.UiComponents.WuxingMeaning = {
    renderWuxingMeaningBox,
  };
})();
