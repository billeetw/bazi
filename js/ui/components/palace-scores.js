/* palace-scores.js
 * 宫位强度渲染组件
 * 导出到 window.UiComponents.PalaceScores
 * 依赖: window.Calc, window.UiRenderHelpers, window.UiDomHelpers, window.StrategyConfig
 */

(function () {
  "use strict";

  if (typeof window === "undefined") {
    throw new Error("window object not available");
  }

  // 延迟检查依赖
  if (!window.Calc) {
    console.warn("[palace-scores.js] window.Calc not found yet, will check at runtime");
  }
  if (!window.UiRenderHelpers) {
    console.warn("[palace-scores.js] window.UiRenderHelpers not found yet, will check at runtime");
  }
  if (!window.UiDomHelpers) {
    console.warn("[palace-scores.js] window.UiDomHelpers not found yet, will check at runtime");
  }

  function getCalcHelpers() {
    if (!window.Calc) {
      throw new Error("window.Calc not available");
    }
    return {
      getStarsForPalace: window.Calc.getStarsForPalace,
      toTraditionalStarName: window.Calc.toTraditionalStarName,
      getPalaceScoreWithWeights: window.Calc.getPalaceScoreWithWeights,
      // PALACE_DESCRIPTIONS 需要从 ui.js 的全局作用域获取（因为它是常量定义）
    };
  }

  function getRenderHelpers() {
    if (!window.UiRenderHelpers) {
      throw new Error("window.UiRenderHelpers not available");
    }
    return {
      getSihuaForPalace: window.UiRenderHelpers.getSihuaForPalace,
      renderStars: window.UiRenderHelpers.renderStars,
      getStarRating: window.UiRenderHelpers.getStarRating,
      getTextColorClass: window.UiRenderHelpers.getTextColorClass,
      getColorFromCode: window.UiRenderHelpers.getColorFromCode,
      renderBar: window.UiRenderHelpers.renderBar,
      renderRadarChart: window.UiRenderHelpers.renderRadarChart,
      renderFiveElementComment: window.UiRenderHelpers.renderFiveElementComment,
    };
  }

  function getDomHelpers() {
    if (!window.UiDomHelpers) {
      throw new Error("window.UiDomHelpers not available");
    }
    return window.UiDomHelpers;
  }

  /**
   * 渲染紫微宫位强度分数
   * @param {Object} scores - 分数对象 { palaceScores: {}, elementRatios: {} }
   * @param {Object} horoscope - 小限数据
   * @param {Object} ziwei - 紫微数据
   * @param {Function} onPalaceClick - 宫位点击回调函数
   */
  async function renderZiweiScores(scores, horoscope, ziwei, onPalaceClick) {
    const palaceBox = document.getElementById("ziweiPalaceScores");
    const wuxingBox = document.getElementById("ziweiWuxingScores");

    if (!palaceBox || !wuxingBox) {
      console.warn("ziwei score boxes not found in DOM");
      return;
    }

    const { getStarsForPalace, toTraditionalStarName, getPalaceScoreWithWeights, PALACE_DESCRIPTIONS } = getCalcHelpers();
    const { getSihuaForPalace, renderStars, getStarRating, getTextColorClass, getColorFromCode, renderBar, renderRadarChart, renderFiveElementComment } = getRenderHelpers();
    const { closePalaceSheet, openPalaceSheet } = getDomHelpers();

    const baseEntries = Object.entries(scores?.palaceScores || {});
    if (!baseEntries.length) {
      palaceBox.innerHTML = `<div class="text-xs text-slate-400">（尚未計算宮位權重）</div>`;
    } else {
      const activeLimitPalaceName = horoscope?.activeLimitPalaceName ?? null;
      const yearlyStem = horoscope?.yearlyStem ?? null;
      const mutagenStars = horoscope?.mutagenStars || {};

      // 由於 getPalaceScoreWithWeights 是異步的，需要先收集所有 Promise
      const rowPromises = baseEntries.map(async ([name, val]) => {
        const baseScore = Number(val) || 0;
        let displayScore = baseScore;
        if (activeLimitPalaceName != null && name === activeLimitPalaceName && yearlyStem && ziwei) {
          const rawStars = getStarsForPalace(ziwei, name);
          const stars = rawStars.map(toTraditionalStarName);
          displayScore = await getPalaceScoreWithWeights(baseScore, stars, yearlyStem, ziwei, name);
        }
        
        // 獲取該宮位的元數據（戰略建議、星等上限、L7 主觀頻率修正）
        // 優先使用狀態管理器，否則使用直接訪問（向後兼容）
        const palaceMetadata = (window.BaziApp?.State?.getState("ziweiPalaceMetadata")) || window.ziweiPalaceMetadata || {};
        const metadata = palaceMetadata[name] || {};
        const maxStarRating = metadata.maxStarRating || null;
        const strategicAdvice = metadata.strategicAdvice || [];
        const isSubjectiveFocus = metadata.isSubjectiveFocus || false;
        
        return { 
          name, 
          baseScore, 
          displayScore, 
          isActiveLimit: name === activeLimitPalaceName,
          maxStarRating,
          strategicAdvice,
          isSubjectiveFocus
        };
      });
      
      // 等待所有 Promise 完成
      const rows = await Promise.all(rowPromises);

      const sorted = rows.sort((a, b) => b.displayScore - a.displayScore);
      const maxScore = Math.max(...sorted.map((r) => r.displayScore), 0.01);
      const Strategy = typeof window.StrategyConfig !== "undefined" ? window.StrategyConfig : null;

      let notes = [];
      if (Strategy) {
        notes = await Promise.all(sorted.map((r) => {
          const strength = Strategy.scoreToStrength(r.displayScore, maxScore);
          const sihuaList = getSihuaForPalace(ziwei, r.name, mutagenStars);
          return Strategy.getStrategyNoteFromAPI(r.name, strength, sihuaList);
        }));
      }

      const esc = window.Utils?.escHtml || ((s) => {
        if (s == null) return "";
        return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
      });
      palaceBox.innerHTML = sorted
        .map((r, i) => {
          // 優先使用 L9 輸出（如果存在）
          // 優先使用狀態管理器，否則使用直接訪問（向後兼容）
          const palaceMetadata = (window.BaziApp?.State?.getState("ziweiPalaceMetadata")) || window.ziweiPalaceMetadata || {};
          const l9Output = palaceMetadata[r.name]?.l9Output;
          
          if (l9Output) {
            // 使用 L9 完整語義輸出
            const starCount = l9Output.stars; // 已經是 2.5-4.5 格式
            const starsHtml = renderStars(starCount);
            const oneLiner = l9Output.oneLiner;
            const strategicAdvice = l9Output.strategicAdvice;
            const statusLabel = l9Output.statusLabel;
            const colorCode = l9Output.colorCode;
            
            // 根據顏色代碼設置樣式（使用統一的五級顏色系統）
            // 優先使用全局配置函數
            const getTextColorClassLocal = window.Config?.getTextColorClass || getTextColorClass;
            const getRgbColorLocal = window.Config?.getRgbColor || getColorFromCode;
            
            // 文字顏色：小限命宮使用琥珀色，否則根據 colorCode 使用對應顏色
            const labelClass = r.isActiveLimit ? "text-amber-200" : getTextColorClassLocal(colorCode);
            const labelSuffix = r.isActiveLimit ? " · 小限命宮" : "";
            
            // 能量條顏色：使用統一的 RGB 顏色映射
            const barColor = getRgbColorLocal(colorCode);
            const barClass = ""; // 不再使用 class，改用 inline style
            
            const pct = maxScore ? (r.displayScore / maxScore) * 100 : 0;
            
            return `
              <div class="py-3 border-b border-white/5 cursor-pointer hover:bg-white/5 rounded-lg px-2 -mx-2 transition-colors palace-score-row" data-palace-name="${esc(r.name)}" role="button" tabindex="0">
                <div class="flex items-center justify-between gap-2 text-xs mb-1">
                  <div class="flex items-center gap-1.5">
                    <span class="${labelClass} font-bold">${r.name}${labelSuffix}</span>
                    <span class="text-[10px] leading-none">${starsHtml}</span>
                    ${l9Output.maxStarRating != null && Math.abs(starCount - (2.0 + l9Output.maxStarRating * 0.5)) < 0.1 ? `<span class="text-[9px] text-slate-500 italic">（上限${starCount}星）</span>` : ""}
                    <span class="text-[9px] text-slate-500">${esc(statusLabel)}</span>
                  </div>
                </div>
                <div class="text-[11px] text-slate-400 leading-relaxed mb-2">${esc(oneLiner)}</div>
                <div class="h-2 bg-white/10 rounded overflow-hidden mb-1">
                  <div class="h-full rounded transition-all duration-300" style="width:${pct}%; background:${barColor};"></div>
                </div>
                <div class="text-[11px] text-amber-200/95 mt-1 leading-snug strategy-advice">${esc(strategicAdvice)}</div>
              </div>
            `;
          } else {
            // Fallback: 使用舊的邏輯（向後兼容）
            const pct = maxScore ? (r.displayScore / maxScore) * 100 : 0;
            let starCount = getStarRating(pct);
            
            // 應用星等上限限制（由神煞觸發）
            if (r.maxStarRating != null && starCount > r.maxStarRating) {
              starCount = r.maxStarRating;
            }
            
            const starsHtml = renderStars(starCount);
            const advice = notes[i] && notes[i] !== "（暫無戰略提示）" ? esc(notes[i]) : "";
            const labelClass = r.isActiveLimit ? "text-amber-200" : "text-slate-300";
            const labelSuffix = r.isActiveLimit ? " · 小限命宮" : "";
            const barClass = r.isActiveLimit ? "bg-amber-400" : "bg-amber-500/70";
            
            // 根據強度等級（1-4）選擇對應的說明文字
            const strength = Strategy ? Strategy.scoreToStrength(r.displayScore, maxScore) : (pct >= 85 ? 4 : pct >= 55 ? 3 : pct >= 25 ? 2 : 1);
            // PALACE_DESCRIPTIONS 在 ui.js 中定义，通过 window 访问
            const PALACE_DESCRIPTIONS = window.PALACE_DESCRIPTIONS || {};
            const descriptionMap = PALACE_DESCRIPTIONS[r.name];
            const description = descriptionMap && descriptionMap[strength] ? descriptionMap[strength] : (descriptionMap ? descriptionMap[3] : "");
            
            // 合併戰略建議（來自神煞的 strategicAdvice）
            const allStrategicAdvice = [...r.strategicAdvice];
            
            // L7 主觀頻率修正：若觸發了 L7 增益，在建議文字前加入提示
            if (r.isSubjectiveFocus) {
              allStrategicAdvice.unshift("此領域為你本年度的生命重心，波動感將會特別強烈。");
            }
            
            if (advice) allStrategicAdvice.push(advice);
            const uniqueAdvice = [...new Set(allStrategicAdvice)];
            const adviceHtml = uniqueAdvice.length > 0 
              ? `<div class="text-[11px] text-amber-200/95 mt-1 leading-snug strategy-advice">${uniqueAdvice.map(a => esc(a)).join(" · ")}</div>`
              : "";
            
            return `
              <div class="py-3 border-b border-white/5 cursor-pointer hover:bg-white/5 rounded-lg px-2 -mx-2 transition-colors palace-score-row" data-palace-name="${esc(r.name)}" role="button" tabindex="0">
                <div class="flex items-center justify-between gap-2 text-xs mb-1">
                  <div class="flex items-center gap-1.5">
                    <span class="${labelClass} font-bold">${r.name}${labelSuffix}</span>
                    <span class="text-[10px] leading-none">${starsHtml}</span>
                    ${r.maxStarRating != null && Math.abs(starCount - (2.0 + r.maxStarRating * 0.5)) < 0.1 ? `<span class="text-[9px] text-slate-500 italic">（上限${starCount}星）</span>` : ""}
                  </div>
                </div>
                ${description ? `<div class="text-[11px] text-slate-400 leading-relaxed mb-2">${esc(description)}</div>` : ""}
                <div class="h-2 bg-white/10 rounded overflow-hidden mb-1">
                  <div class="h-full ${barClass} rounded transition-all duration-300" style="width:${pct}%"></div>
                </div>
                ${adviceHtml}
              </div>
            `;
          }
        })
        .join("");

      if (!palaceBox.hasAttribute("data-palace-click-bound")) {
        palaceBox.setAttribute("data-palace-click-bound", "1");
        // 使用狀態管理器追蹤當前選中的宮位（優先），或直接使用 window（向後兼容）
        if (window.BaziApp?.State) {
          window.BaziApp.State.setState("currentSelectedPalace", null);
        } else {
          window.currentSelectedPalace = null;
        }
        
        palaceBox.addEventListener("click", function (e) {
          var row = e.target.closest("[data-palace-name]");
          if (!row) return;
          var name = row.getAttribute("data-palace-name");
          if (!name) return;
          
          // 如果點擊的是同一個宮位，則收合（toggle）
          if (window.innerWidth < 1280) {
            const sheet = document.getElementById("palaceSheet");
            const isCurrentlyOpen = sheet && sheet.classList.contains("open");
            // 優先使用狀態管理器獲取當前選中的宮位
            const currentPalace = window.BaziApp?.State?.getState("currentSelectedPalace") || window.currentSelectedPalace;
            const isSamePalace = currentPalace === name;
            
            if (isSamePalace && isCurrentlyOpen) {
              // 點擊相同宮位且已展開，則收合
              closePalaceSheet();
              if (window.BaziApp?.State) {
                window.BaziApp.State.setState("currentSelectedPalace", null);
              } else {
                window.currentSelectedPalace = null;
              }
              return;
            }
          }
          
          // 否則展開新宮位
          if (onPalaceClick) {
            onPalaceClick(name);
          }
          if (window.BaziApp?.State) {
            window.BaziApp.State.setState("currentSelectedPalace", name);
          } else {
            window.currentSelectedPalace = name;
          }
          
          if (window.innerWidth < 1280) {
            openPalaceSheet();
          } else {
            document.getElementById("detailPanel")?.scrollIntoView({ behavior: "smooth", block: "start" });
          }
        });
        palaceBox.addEventListener("keydown", function (e) {
          if (e.key !== "Enter" && e.key !== " ") return;
          var row = e.target.closest("[data-palace-name]");
          if (!row) return;
          e.preventDefault();
          var name = row.getAttribute("data-palace-name");
          if (!name) return;
          
          // 如果按鍵觸發的是同一個宮位，則收合（toggle）
          if (window.innerWidth < 1280) {
            const sheet = document.getElementById("palaceSheet");
            const isCurrentlyOpen = sheet && sheet.classList.contains("open");
            // 優先使用狀態管理器獲取當前選中的宮位
            const currentPalace = window.BaziApp?.State?.getState("currentSelectedPalace") || window.currentSelectedPalace;
            const isSamePalace = currentPalace === name;
            
            if (isSamePalace && isCurrentlyOpen) {
              // 按鍵觸發相同宮位且已展開，則收合
              closePalaceSheet();
              if (window.BaziApp?.State) {
                window.BaziApp.State.setState("currentSelectedPalace", null);
              } else {
                window.currentSelectedPalace = null;
              }
              return;
            }
          }
          
          // 否則展開新宮位
          if (onPalaceClick) {
            onPalaceClick(name);
          }
          if (window.BaziApp?.State) {
            window.BaziApp.State.setState("currentSelectedPalace", name);
          } else {
            window.currentSelectedPalace = name;
          }
          
          if (window.innerWidth < 1280) {
            openPalaceSheet();
          } else {
            document.getElementById("detailPanel")?.scrollIntoView({ behavior: "smooth", block: "start" });
          }
        });
      }
    }

    const ratios = scores?.elementRatios || {};
    console.log("[renderZiweiScores] elementRatios =", ratios);

    const wxForBar = {
      木: (Number(ratios["木"]) || 0) * 100,
      火: (Number(ratios["火"]) || 0) * 100,
      土: (Number(ratios["土"]) || 0) * 100,
      金: (Number(ratios["金"]) || 0) * 100,
      水: (Number(ratios["水"]) || 0) * 100,
    };

    renderBar("ziweiWxBars", wxForBar, 100);
    renderRadarChart("ziweiWxRadar", wxForBar);
    renderFiveElementComment("ziweiWxComment", wxForBar, "ziwei");
  }

  // 初始化 window.UiComponents
  if (!window.UiComponents) {
    window.UiComponents = {};
  }

  // 导出到 window.UiComponents.PalaceScores
  window.UiComponents.PalaceScores = {
    renderZiweiScores,
  };
})();
