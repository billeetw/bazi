/* liuyue-month.js
 * 流月卡片渲染组件
 * 导出到 window.UiComponents.LiuyueMonth
 * 依赖: window.Calc, window.UiRenderHelpers, window.Utils
 */

(function () {
  "use strict";

  if (typeof window === "undefined") {
    throw new Error("window object not available");
  }

  // 延迟检查依赖
  if (!window.Calc) {
    console.warn("[liuyue-month.js] window.Calc not found yet, will check at runtime");
  }
  if (!window.UiRenderHelpers) {
    console.warn("[liuyue-month.js] window.UiRenderHelpers not found yet, will check at runtime");
  }

  // 从依赖模块获取函数
  function getRenderHelpers() {
    if (!window.UiRenderHelpers) {
      throw new Error("window.UiRenderHelpers not available");
    }
    return {
      renderStars: window.UiRenderHelpers.renderStars,
      getBorderColorClass: window.UiRenderHelpers.getBorderColorClass,
      getBgColorClass: window.UiRenderHelpers.getBgColorClass,
      getColorFromCode: window.UiRenderHelpers.getColorFromCode,
    };
  }

  function parseMonthFromRange(range) {
    // 優先使用全局工具函數
    if (window.Utils?.parseMonthFromRange) {
      return window.Utils.parseMonthFromRange(range);
    }
    // 其次使用 calc.js 中的函數
    if (window.Calc && window.Calc.parseMonthFromRange) {
      return window.Calc.parseMonthFromRange(range);
    }
    // Fallback: 本地實現（向後兼容）
    if (!range) return 0;
    const s = String(range).trim();
    const m1 = s.match(/^(\d{1,2})[/.-]/);
    if (m1) return Math.min(12, Math.max(1, parseInt(m1[1], 10)));
    const m2 = s.match(/^0?(\d)\./);
    if (m2) return Math.min(12, Math.max(1, parseInt(m2[1], 10)));
    return 0;
  }

  /** 副標：一句話當月重點（取 strategy 第一句或前段） */
  function getMonthSubtitle(b) {
    const s = (b.strategy || "").trim();
    if (!s) return "本月宜依個人命盤調整節奏。";
    const dot = s.indexOf("。");
    const period = s.indexOf(".");
    const end = dot >= 0 ? (period >= 0 ? Math.min(dot, period) : dot) : (period >= 0 ? period : s.length);
    const one = s.slice(0, end + 1).trim() || s.slice(0, 36);
    return one.length > 50 ? one.slice(0, 47) + "…" : one;
  }

  /** 渲染流月卡片列表 */
  function renderLiuyue(bazi) {
    const mGrid = document.getElementById("monthGrid");
    const consultCta = document.getElementById("liuyueConsultCta");
    if (!mGrid) return;

    const bounds = bazi?.liuyue2026?.bounds || [];
    mGrid.innerHTML = "";

    if (!bounds.length) {
      mGrid.innerHTML = `<div class="text-xs text-slate-400 italic">（暫無流月資料）</div>`;
      if (consultCta) consultCta.innerHTML = "";
      return;
    }

    // 使用全局工具函數（如果可用），否則使用本地實現
    const esc = window.Utils?.escHtml || ((s) => {
      if (s == null) return "";
      return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
    });

    const { renderStars, getBorderColorClass, getBgColorClass, getColorFromCode } = getRenderHelpers();

    // 2026年農曆月份對應的國曆日期範圍映射表
    // 格式：農曆月份 -> { solarStart: "M/D", solarEnd: "M/D" }
    const lunarToSolar2026 = {
      "01": { solarStart: "2/4", solarEnd: "3/4" },   // 農曆正月：國曆2/4-3/4
      "02": { solarStart: "3/5", solarEnd: "4/3" },   // 農曆二月：國曆3/5-4/3
      "03": { solarStart: "4/4", solarEnd: "5/4" },   // 農曆三月：國曆4/4-5/4
      "04": { solarStart: "5/5", solarEnd: "6/2" },   // 農曆四月：國曆5/5-6/2
      "05": { solarStart: "6/3", solarEnd: "7/2" },   // 農曆五月：國曆6/3-7/2
      "06": { solarStart: "7/3", solarEnd: "8/1" },   // 農曆六月：國曆7/3-8/1
      "07": { solarStart: "8/2", solarEnd: "8/31" },  // 農曆七月：國曆8/2-8/31
      "08": { solarStart: "9/1", solarEnd: "9/29" },  // 農曆八月：國曆9/1-9/29
      "09": { solarStart: "9/30", solarEnd: "10/29" }, // 農曆九月：國曆9/30-10/29
      "10": { solarStart: "10/30", solarEnd: "11/27" }, // 農曆十月：國曆10/30-11/27
      "11": { solarStart: "11/28", solarEnd: "12/27" }, // 農曆十一月：國曆11/28-12/27
      "12": { solarStart: "12/28", solarEnd: "1/25" },  // 農曆十二月：國曆12/28-1/25（跨年）
    };
    
    // 輔助函數：從農曆日期範圍獲取對應的國曆日期
    function getSolarFromLunarRange(lunarRange) {
      if (!lunarRange) return null;
      // 匹配格式：02.04-03.05 或 2.4-3.5
      const match = String(lunarRange).trim().match(/^(\d{1,2})\.(\d{1,2})[~-](\d{1,2})\.(\d{1,2})/);
      if (!match) return null;
      const lunarMonth = String(parseInt(match[1], 10)).padStart(2, "0");
      const mapping = lunarToSolar2026[lunarMonth];
      if (!mapping) return null;
      return {
        solarStart: mapping.solarStart,
        solarEnd: mapping.solarEnd,
        lunarMonth: parseInt(match[1], 10)
      };
    }
    
    // 解析並排序：按農曆月份排序（1-12月）
    const ordered = bounds.slice().sort((a, b) => {
      let ma = 0, mb = 0;
      
      // 判斷是國曆還是農曆
      const rangeA = String(a.range || "").trim();
      const rangeB = String(b.range || "").trim();
      
      if (rangeA.match(/^\d{1,2}\.\d{1,2}/)) {
        // 農曆格式（如 02.04-03.05）：按農曆月份排序
        const matchA = rangeA.match(/^(\d{1,2})\./);
        ma = matchA ? parseInt(matchA[1], 10) : 0;
      } else if (rangeA.match(/^\d{4}-\d{2}-\d{2}/)) {
        // 國曆 ISO 格式：按國曆月份排序
        ma = parseMonthFromRange(a.range) || 0;
      } else {
        ma = parseMonthFromRange(a.range) || 0;
      }
      
      if (rangeB.match(/^\d{1,2}\.\d{1,2}/)) {
        // 農曆格式：按農曆月份排序
        const matchB = rangeB.match(/^(\d{1,2})\./);
        mb = matchB ? parseInt(matchB[1], 10) : 0;
      } else if (rangeB.match(/^\d{4}-\d{2}-\d{2}/)) {
        // 國曆 ISO 格式：按國曆月份排序
        mb = parseMonthFromRange(b.range) || 0;
      } else {
        mb = parseMonthFromRange(b.range) || 0;
      }
      
      // 按月份排序（1-12）
      if (ma > 0 && mb > 0) {
        return ma - mb;
      }
      
      // 如果解析失敗，嘗試按 range 字串排序
      if (a.range && b.range) {
        return a.range.localeCompare(b.range);
      }
      
      return 0;
    });

    function collapseAll() {
      mGrid.querySelectorAll(".liuyue-expand").forEach((el) => {
        el.style.maxHeight = "0";
        el.setAttribute("aria-hidden", "true");
      });
      mGrid.querySelectorAll(".liuyue-card").forEach((c) => c.classList.remove("is-expanded"));
    }

    // 獲取紫微宮位元數據和五行數據（用於生成關聯說明）
    // 優先使用狀態管理器，否則使用直接訪問（向後兼容）
    const ziweiPalaceMetadata = (window.BaziApp?.State?.getState("ziweiPalaceMetadata")) || window.ziweiPalaceMetadata || null;
    const wuxingData = bazi?.wuxing || null;

    // 計算所有月份的星等（使用相對排名，與紫微對應）
    const monthlyStarRatings = {};
    if (window.Calc && window.Calc.computeMonthlyStarRating) {
      try {
        console.log("[renderLiuyue] 開始計算流月星等，月份數:", ordered.length);
        ordered.forEach((b, index) => {
          const monthNum = parseMonthFromRange(b.range);
          // 如果解析失敗，使用索引+1作為月份編號（fallback）
          const ratingKey = monthNum || (index + 1);
          
          try {
            const rating = window.Calc.computeMonthlyStarRating(
              Number(b.riskScore) || 0,
              ordered,
              ziweiPalaceMetadata,
              wuxingData,
              ratingKey  // 使用 ratingKey 而不是 monthNum
            );
            monthlyStarRatings[ratingKey] = rating;
            console.log(`[renderLiuyue] 月份 ${ratingKey} 評級計算成功:`, {
              stars: rating.stars,
              statusLabel: rating.statusLabel,
              colorCode: rating.colorCode,
              hasCorrelationNote: !!rating.correlationNote
            });
          } catch (err) {
            console.warn(`[renderLiuyue] 計算月份 ${ratingKey} 星等失敗:`, err);
          }
        });
        console.log("[renderLiuyue] 流月星等計算完成，共", Object.keys(monthlyStarRatings).length, "個月份");
      } catch (err) {
        console.error("[renderLiuyue] 計算流月星等失敗:", err);
      }
    } else {
      console.warn("[renderLiuyue] window.Calc.computeMonthlyStarRating 不可用");
    }

    // 調試：檢查月份數據
    console.log("[renderLiuyue] 總月份數:", ordered.length, "bounds:", bounds.length);
    console.log("[renderLiuyue] ziweiPalaceMetadata 可用:", !!ziweiPalaceMetadata);
    console.log("[renderLiuyue] 前5個月份 range:", ordered.slice(0, 5).map(b => b.range));
    console.log("[renderLiuyue] 所有月份 range 樣本:", ordered.map(b => b.range).join(", "));
    
    // 確保所有月份都被渲染（即使 monthNum 為 0）
    ordered.forEach((b, index) => {
      const monthNum = parseMonthFromRange(b.range);
      // 如果解析失敗，使用索引+1作為月份編號（fallback）
      const displayMonthNum = monthNum || (index + 1);
      
      // 移除"當月"判斷，避免錯誤（用戶要求：只顯示農曆1-12月，不做當月換算）
      const isCurrent = false; // 不再判斷當月
      
      // 獲取農曆對應的國曆日期信息
      let solarInfo = null;
      const rangeStr = String(b.range || "").trim();
      if (rangeStr.match(/^\d{1,2}\.\d{1,2}/)) {
        // 農曆格式：獲取對應的國曆日期
        solarInfo = getSolarFromLunarRange(b.range);
      }
      
      // 如果解析失敗，記錄警告（但繼續渲染）
      if (!monthNum && b.range && !solarInfo) {
        console.warn("[renderLiuyue] 無法解析月份:", b.range, "使用 fallback:", displayMonthNum);
      }
      const isRed = b.light === "RED";
      const risk = Math.max(0, Math.min(100, Number(b.riskScore) || 0));
      const subtitle = getMonthSubtitle(b);
      // 移除 badge，改用星等分级系统

      // 獲取流月星等（與紫微對應）
      // 使用統一的 key：如果 monthNum 解析成功就用 monthNum，否則用 displayMonthNum（索引+1）
      const ratingKey = monthNum || displayMonthNum;
      // 直接使用 ratingKey 查找（因為 monthlyStarRatings 就是用 ratingKey 作為 key 存儲的）
      const monthlyRating = monthlyStarRatings[ratingKey] || null;
      
      // 調試：如果找不到評級數據，記錄警告
      if (!monthlyRating && ordered.length > 0) {
        console.warn(`[renderLiuyue] 月份 ${displayMonthNum} (ratingKey: ${ratingKey}) 找不到評級數據`, {
          monthNum,
          displayMonthNum,
          ratingKey,
          availableKeys: Object.keys(monthlyStarRatings)
        });
      }
      
      const starsHtml = monthlyRating ? renderStars(monthlyRating.stars) : "";
      const statusLabel = monthlyRating ? monthlyRating.statusLabel : "";
      const colorCode = monthlyRating ? monthlyRating.colorCode : "amber";
      const correlationNote = monthlyRating ? monthlyRating.correlationNote : "";

      // 根據星等顏色設置卡片樣式
      const borderColorClass = getBorderColorClass(colorCode);
      const bgColorClass = getBgColorClass(colorCode);
      // 如果沒有星等數據，使用舊的風險指數顏色
      const barColorFromStars = monthlyRating ? getColorFromCode(colorCode) : (risk <= 35 ? "rgb(34, 197, 94)" : risk <= 65 ? "rgb(234, 179, 8)" : "rgb(239, 68, 68)");

      const wrap = document.createElement("div");
      wrap.className = "liuyue-month-wrap";

      const card = document.createElement("button");
      card.type = "button";
      card.className =
        `liuyue-card monthly-flow-card w-full text-left flex flex-col gap-1.5 p-3 rounded-xl border ${borderColorClass} transition ` +
        (isCurrent ? " is-current" : "") +
        ` hover:${bgColorClass}`;

      // 解析日期範圍，判斷是農曆還是國曆，並格式化顯示
      let dateLabel = "";
      let calendarType = "";
      let solarDateLabel = ""; // 國曆日期標籤（如果是農曆，顯示對應的國曆日期）
      
      if (b.range) {
        const rangeStr = String(b.range).trim();
        // 判斷格式：ISO 格式（2026-02-01~2026-02-28）是國曆
        if (rangeStr.match(/^\d{4}-\d{2}-\d{2}/)) {
          calendarType = "國曆";
          // 提取日期範圍
          const isoMatch = rangeStr.match(/(\d{4})-(\d{2})-(\d{2})[~-](\d{4})-(\d{2})-(\d{2})/);
          if (isoMatch) {
            const startMonth = parseInt(isoMatch[2], 10);
            const startDay = parseInt(isoMatch[3], 10);
            const endMonth = parseInt(isoMatch[5], 10);
            const endDay = parseInt(isoMatch[6], 10);
            if (startMonth === endMonth) {
              dateLabel = `${startMonth}/${startDay}-${endDay}`;
            } else {
              dateLabel = `${startMonth}/${startDay}-${endMonth}/${endDay}`;
            }
          }
        } else if (rangeStr.match(/^\d{1,2}\.\d{1,2}/)) {
          // 農曆格式（如 02.04-03.05）
          calendarType = "農曆";
          // 提取農曆日期範圍
          const lunarMatch = rangeStr.match(/(\d{1,2})\.(\d{1,2})[~-](\d{1,2})\.(\d{1,2})/);
          if (lunarMatch) {
            const startMonth = parseInt(lunarMatch[1], 10);
            const startDay = parseInt(lunarMatch[2], 10);
            const endMonth = parseInt(lunarMatch[3], 10);
            const endDay = parseInt(lunarMatch[4], 10);
            dateLabel = `${String(startMonth).padStart(2, "0")}.${String(startDay).padStart(2, "0")}-${String(endMonth).padStart(2, "0")}.${String(endDay).padStart(2, "0")}`;
            
            // 獲取對應的國曆日期（使用之前計算的 solarInfo）
            if (solarInfo) {
              solarDateLabel = `國曆 ${solarInfo.solarStart}-${solarInfo.solarEnd}`;
            }
          } else {
            dateLabel = rangeStr;
          }
        } else {
          // M/D 格式（如 2/4-3/5）可能是農曆，顯示原格式並標註
          calendarType = "農曆";
          // 嘗試提取日期範圍
          const lunarMatch = rangeStr.match(/(\d{1,2})\/(\d{1,2})[~-](\d{1,2})\/(\d{1,2})/);
          if (lunarMatch) {
            const startMonth = parseInt(lunarMatch[1], 10);
            const startDay = parseInt(lunarMatch[2], 10);
            const endMonth = parseInt(lunarMatch[3], 10);
            const endDay = parseInt(lunarMatch[4], 10);
            dateLabel = `${startMonth}/${startDay}-${endMonth}/${endDay}`;
            
            // 獲取對應的國曆日期（使用之前計算的 solarInfo）
            if (solarInfo) {
              solarDateLabel = `國曆 ${solarInfo.solarStart}-${solarInfo.solarEnd}`;
            }
          } else {
            dateLabel = rangeStr;
          }
        }
      }
      
      card.innerHTML = `
        <div class="flex items-center justify-between gap-2">
          <div class="min-w-0 flex-1">
            <div class="font-black text-sm text-slate-50">
              ${calendarType === "農曆" && solarInfo ? solarInfo.lunarMonth + "月" : (displayMonthNum ? displayMonthNum + "月" : "")} ${b.gz || ""}
              ${calendarType ? `<span class="text-[9px] text-slate-500 ml-1">（${calendarType}）</span>` : ""}
            </div>
            ${dateLabel ? `<div class="text-[9px] text-slate-500 mt-0.5">${calendarType === "農曆" ? "農曆 " : ""}${dateLabel}</div>` : ""}
            ${solarDateLabel ? `<div class="text-[9px] text-amber-400/80 mt-0.5">${solarDateLabel}</div>` : ""}
            ${starsHtml ? `<div class="flex items-center gap-1.5 mt-1">
              <span class="text-[10px] leading-none">${starsHtml}</span>
              ${statusLabel ? `<span class="text-[9px] text-slate-500">${esc(statusLabel)}</span>` : ""}
            </div>` : ""}
            ${correlationNote ? `<div class="text-[9px] text-slate-400 mt-0.5 italic">${esc(correlationNote)}</div>` : ""}
          </div>
        </div>
        <div class="liuyue-energy-bar mt-1.5" title="能量指數 ${monthlyRating ? Math.round(monthlyRating.energyScore) : risk}">
          <div class="liuyue-energy-fill" style="width:${monthlyRating ? monthlyRating.energyScore : risk}%; background:${barColorFromStars};"></div>
        </div>
      `;

      const expand = document.createElement("div");
      expand.className = "liuyue-expand";
      expand.style.maxHeight = "0";
      expand.setAttribute("aria-hidden", "true");

      const reasons = (b.reasonTags || []).join("．");
      expand.innerHTML = `
        <div class="p-3 mt-1 rounded-xl border border-amber-400/20 bg-black/30 text-[11px] leading-relaxed space-y-2">
          <div class="text-slate-400 uppercase tracking-wider">十神技術參數</div>
          <div class="text-slate-200">干 ${b.ssStem || "—"} ／ 支 ${b.ssBranch || "—"}${reasons ? " · " + reasons : ""}</div>
          <div class="text-amber-200/90 font-medium pt-1 border-t border-white/10">李伯彥老師助推建議</div>
          <div class="text-slate-100">${b.strategy || "（尚未撰寫戰術建議）"}</div>
        </div>
      `;

      card.addEventListener("click", (e) => {
        e.stopPropagation();
        const isExpanded = card.classList.contains("is-expanded");
        collapseAll();
        if (!isExpanded) {
          expand.style.maxHeight = expand.scrollHeight + "px";
          expand.setAttribute("aria-hidden", "false");
          card.classList.add("is-expanded");
          expand.scrollIntoView({ behavior: "smooth", block: "nearest" });
          const closeOnOut = (ev2) => {
            if (!wrap.contains(ev2.target)) {
              collapseAll();
              document.removeEventListener("click", closeOnOut);
            }
          };
          setTimeout(() => document.addEventListener("click", closeOnOut), 0);
        }
      });

      wrap.appendChild(card);
      wrap.appendChild(expand);
      mGrid.appendChild(wrap);
    });

    // 移除自動滾動到當月（已移除當月判斷）

    if (consultCta) {
      consultCta.innerHTML = `
        <a href="consultation.html" class="inline-flex items-center gap-1.5 text-[11px] text-amber-400/90 hover:text-amber-300 font-medium">
          📘 獲取更精細的 1:1 詳細攻略
        </a>
      `;
    }
  }

  // 初始化 window.UiComponents（如果不存在）
  if (!window.UiComponents) {
    window.UiComponents = {};
  }

  // 导出到 window.UiComponents.LiuyueMonth
  window.UiComponents.LiuyueMonth = {
    renderLiuyue,
    parseMonthFromRange,
    getMonthSubtitle,
  };
})();
