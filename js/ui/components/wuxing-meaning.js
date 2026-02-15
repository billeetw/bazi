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

  // 表層（角色名望）的默认描述
  const DEFAULT_WUXING_MEANINGS_SURFACE = {
    "木": { headline: "外在成長模組", content: "木能量代表你的外在成長模組，是你負責展現開展性與人際連結的能力。當這個能量偏強時，你會呈現出積極主動、願意擴展社交圈、給人成長感的形象；偏弱時，你會出現較為內斂、不願主動連結、缺乏開展動力的狀態。若能把這份能量運用在建立長期關係與學習網絡上，會大幅提升你的外在影響力與成長感。當你過度依賴這個能量時，容易陷入過度擴張、無法聚焦的狀態。今年，你需要練習在成長與收斂之間找到平衡，讓每一次的連結都有明確的目的。" },
    "火": { headline: "外在亮度模組", content: "火能量代表你的外在亮度模組，是你負責展現吸睛度與反應速度的能力。當這個能量偏強時，你會呈現出熱情、快速反應、容易吸引注意的形象；偏弱時，你會出現較為低調、反應較慢、缺乏存在感的狀態。若能把這份能量運用在關鍵時刻的表達與決策上，會大幅提升你的外在影響力與能見度。當你過度依賴這個能量時，容易陷入情緒化決策、過度消耗注意力的狀態。今年，你需要練習控制輸出節奏，讓每一次的表達都更有份量。" },
    "土": { headline: "外在穩定模組", content: "土能量代表你的外在穩定模組，是你負責展現可靠形象與持久力的能力。當這個能量偏強時，你會呈現出穩重、可靠、給人安全感的形象；偏弱時，你會出現較為動盪、難以建立信任、缺乏承載力的狀態。若能把這份能量運用在建立長期信用與系統化流程上，會大幅提升你的外在專業度與可靠感。當你過度依賴這個能量時，容易陷入過於保守、缺乏彈性的狀態。今年，你需要練習在穩定與創新之間找到平衡，讓你的可靠成為優勢而非限制。" },
    "金": { headline: "外在界線模組", content: "金能量代表你的外在界線模組，是你負責展現規則感與判斷力的能力。當這個能量偏強時，你會呈現出果斷、有原則、給人專業感的形象；偏弱時，你會出現較為模糊、缺乏標準、難以建立界線的狀態。若能把這份能量運用在建立清晰的合作規則與執行標準上，會大幅提升你的外在專業度與效率感。當你過度依賴這個能量時，容易陷入過於苛刻、缺乏彈性的狀態。今年，你需要練習在原則與人情之間找到平衡，讓你的界線成為保護而非阻礙。" },
    "水": { headline: "外在溝通模組", content: "水能量代表你的外在溝通模組，是你負責展現資訊流通與柔性魅力的能力。當這個能量偏強時，你會呈現出靈活、善於溝通、給人親和感的形象；偏弱時，你會出現較為封閉、資訊流通不順、缺乏溝通動力的狀態。若能把這份能量運用在建立有效的溝通管道與資訊網絡上，會大幅提升你的外在影響力與連結力。當你過度依賴這個能量時，容易陷入過度變動、缺乏核心的狀態。今年，你需要練習在流動與穩定之間找到平衡，讓你的溝通成為橋樑而非消耗。" },
  };

  // 實戰（核心戰力）的默认描述
  const DEFAULT_WUXING_MEANINGS_STRATEGIC = {
    "木": { headline: "策略模組", content: "木能量代表你的策略模組，是你負責展開能力與起始動作的內建系統。當這個能量偏強時，你會呈現出善於規劃、願意啟動、能夠展開多線任務的狀態；偏弱時，你會出現猶豫不決、難以啟動、缺乏策略思維的狀態。若能把這份能量運用在建立長期策略與啟動新專案上，會大幅提升你的執行效率與成長動能。當你過度依賴這個能量時，容易陷入規劃過多、執行不足的狀態。今年，你需要練習直接啟動，讓策略成為行動的指南而非拖延的藉口。" },
    "火": { headline: "推進力模組", content: "火能量代表你的推進力模組，是你負責執行動能與爆發力的內建系統。當這個能量偏強時，你會呈現出快速推進、高執行力、能夠快速完成任務的狀態；偏弱時，你會出現行動力不足、難以推進、缺乏執行動能的狀態。若能把這份能量運用在關鍵任務的推進與決策執行上，會大幅提升你的工作效率與成果產出。當你過度依賴這個能量時，容易陷入過度消耗、後繼無力的狀態。今年，你需要練習管理輸出節奏，讓每一次的推進都更有續航力。" },
    "土": { headline: "耐力模組", content: "土能量代表你的耐力模組，是你負責沉澱力與累積能力的內建系統。當這個能量偏強時，你會呈現出持久穩定、能夠累積成果、善於建立系統的狀態；偏弱時，你會出現難以持續、缺乏根基、無法累積的狀態。若能把這份能量運用在建立長期資產與穩定的工作流程上，會大幅提升你的成果累積與系統穩定性。當你過度依賴這個能量時，容易陷入過於保守、缺乏突破的狀態。今年，你需要練習在累積與創新之間找到平衡，讓你的穩定成為基礎而非限制。" },
    "金": { headline: "決斷力模組", content: "金能量代表你的決斷力模組，是你負責切割能力與邏輯紀律的內建系統。當這個能量偏強時，你會呈現出果斷決策、善於切割、能夠建立清晰流程的狀態；偏弱時，你會出現決策困難、界線模糊、缺乏執行標準的狀態。若能把這份能量運用在建立清晰的執行流程與決策標準上，會大幅提升你的執行效率與成果品質。當你過度依賴這個能量時，容易陷入過於苛刻、缺乏彈性的狀態。今年，你需要練習在效率與人性之間找到平衡，讓你的決斷成為助力而非阻力。" },
    "水": { headline: "洞察模組", content: "水能量代表你的洞察模組，是你負責感知與資料處理的內建系統。當這個能量偏強時，你會呈現出深度思考、善於洞察、能夠處理複雜資訊的狀態；偏弱時，你會出現思考枯竭、視野變窄、缺乏深度分析的狀態。若能把這份能量運用在深度思考與資訊整合上，會大幅提升你的決策品質與問題解決能力。當你過度依賴這個能量時，容易陷入過度思考、行動不足的狀態。今年，你需要練習在思考與行動之間找到平衡，讓你的洞察成為決策的基礎而非拖延的理由。" },
  };

  // 向後兼容：預設為實戰
  const DEFAULT_WUXING_MEANINGS = DEFAULT_WUXING_MEANINGS_STRATEGIC;

  /**
   * 渲染五行意义盒子
   * @param {Object} dbContent - 数据库内容（可选，如果提供则优先使用）
   * @param {string} kind - 類型："surface"（表層）或 "strategic"（實戰），預設為 "strategic"
   */
  function renderWuxingMeaningBox(dbContent, kind = "strategic") {
    const box = document.getElementById("wuxingMeaningBox");
    if (!box) return;
    box.innerHTML = "";
    
    // 根據 kind 選擇對應的默認描述
    const defaultMeanings = kind === "surface" ? DEFAULT_WUXING_MEANINGS_SURFACE : DEFAULT_WUXING_MEANINGS_STRATEGIC;
    var ContentUtils = window.UiUtils?.ContentUtils;
    var useHelper = ContentUtils && typeof ContentUtils.getWuxingItem === "function";

    ["木", "火", "土", "金", "水"].forEach((el) => {
      var item;
      if (useHelper) {
        item = ContentUtils.getWuxingItem(dbContent, el, defaultMeanings[el]);
      } else {
        var src = (dbContent?.wuxing && Object.keys(dbContent.wuxing).length) ? dbContent.wuxing : defaultMeanings;
        item = src[el] || defaultMeanings[el];
      }
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
