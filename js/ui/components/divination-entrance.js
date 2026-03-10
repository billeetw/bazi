/**
 * 首頁占卦入口：卡片與導覽列皆為普通 <a href="divination.html">，不依賴 JS 即可跳轉。
 * 暫停 overlay/iframe 行為，避免 app.js 報錯時點擊完全沒反應。
 */

(function () {
  "use strict";

  // 卡片改為純連結導向，不綁 click 開 overlay，確保「點下去一定有反應」
  var card = document.getElementById("divinationEntranceCard");
  if (card && card.getAttribute("href")) {
    // 已有 href="divination.html?from=homepage"，無需改動，點擊即導向
    return;
  }

  // 若卡片沒有 href（不應發生），補上
  if (card && !card.getAttribute("href")) {
    card.setAttribute("href", "divination.html?from=homepage");
  }
})();
