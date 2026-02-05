/* wuxing-panel.js
 * 五行面板控制组件
 * 导出到 window.UiComponents.WuxingPanel
 * 依赖: window.UiDomHelpers (setMobileSheetContent, openPalaceSheet, flashPeek)
 */

(function () {
  "use strict";

  if (typeof window === "undefined") {
    throw new Error("window object not available");
  }

  /**
   * 打开五行意义面板（类似宫位面板）
   */
  function openWuxingMeaningLikePalace() {
    const meaningBox = document.getElementById("wuxingMeaningBox");
    const meaningSection = document.getElementById("wuxingMeaningSection");

    if (!window.UiDomHelpers) {
      console.warn("[wuxing-panel.js] window.UiDomHelpers not available");
      return;
    }

    const { setMobileSheetContent, openPalaceSheet, flashPeek } = window.UiDomHelpers;

    if (window.innerWidth < 1280) {
      // 移动端：使用底部面板
      setMobileSheetContent({
        title: "金木水火土 · 基本意義",
        sub: "點五行雷達圖展開（內容優先來自資料庫：wuxing_meanings）",
        bodyHtml: meaningBox ? meaningBox.innerHTML : `<div class="text-slate-500 italic">（五行解釋暫不可用）</div>`,
      });
      openPalaceSheet();
    } else {
      // 桌面端：滚动到对应区域并闪烁提示
      meaningSection?.scrollIntoView({ behavior: "smooth", block: "start" });
      flashPeek(meaningSection);
    }
  }

  // 导出到 window.UiComponents.WuxingPanel
  if (!window.UiComponents) {
    window.UiComponents = {};
  }

  window.UiComponents.WuxingPanel = {
    openWuxingMeaningLikePalace,
  };
})();
