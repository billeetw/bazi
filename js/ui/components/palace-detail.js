/* palace-detail.js
 * 宫位详解面板组件
 * 导出到 window.UiComponents.PalaceDetail
 * 依赖: window.Calc, window.UiRenderHelpers, window.UiDomHelpers, window.StrategyConfig
 */

(function () {
  "use strict";

  if (typeof window === "undefined") {
    throw new Error("window object not available");
  }

  // 延迟检查依赖
  if (!window.Calc) {
    console.warn("[palace-detail.js] window.Calc not found yet, will check at runtime");
  }
  if (!window.UiRenderHelpers) {
    console.warn("[palace-detail.js] window.UiRenderHelpers not found yet, will check at runtime");
  }
  if (!window.UiDomHelpers) {
    console.warn("[palace-detail.js] window.UiDomHelpers not found yet, will check at runtime");
  }

  function getCalcHelpers() {
    if (!window.Calc) {
      throw new Error("window.Calc not available");
    }
    return {
      computeRelatedPalaces: window.Calc.computeRelatedPalaces,
      getStarsForPalace: window.Calc.getStarsForPalace,
      toTraditionalStarName: window.Calc.toTraditionalStarName,
      getPalaceScoreWithWeights: window.Calc.getPalaceScoreWithWeights,
      getHoroscopeFromAge: window.Calc.getHoroscopeFromAge,
      PALACE_DEFAULT: window.Calc.PALACE_DEFAULT,
    };
  }

  function getRenderHelpers() {
    if (!window.UiRenderHelpers) {
      throw new Error("window.UiRenderHelpers not available");
    }
    if (!window.Calc) {
      throw new Error("window.Calc not available");
    }
    return {
      getSihuaForPalace: window.UiRenderHelpers.getSihuaForPalace,
      getMutagenBadgeHtml: window.UiRenderHelpers.getMutagenBadgeHtml,
      STAR_WUXING_MAP: window.Calc.STAR_WUXING_MAP || {},
    };
  }

  function getDomHelpers() {
    if (!window.UiDomHelpers) {
      throw new Error("window.UiDomHelpers not available");
    }
    return window.UiDomHelpers;
  }

  /**
   * 选择并显示宫位详情
   * @param {string} name - 宫位名称
   * @param {Object} options - 选项对象
   * @param {Object} options.ziwei - 紫微数据
   * @param {Object} options.bazi - 八字数据
   * @param {Object} options.horoscope - 小限数据（可选）
   * @param {Object} options.dbContent - 数据库内容
   * @param {Array} options.palaceRing - 宫位环数组（可选，默认使用 PALACE_DEFAULT）
   * @param {string} options.lastGender - 最后性别（可选）
   * @param {Function} options.getCurrentAge - 获取当前年龄的函数（可选）
   * @param {Function} options.onSelectedPalaceChange - 选中宫位改变回调（可选）
   */
  function selectPalace(name, options) {
    const {
      ziwei,
      bazi,
      horoscope: providedHoroscope,
      dbContent,
      palaceRing,
      lastGender,
      getCurrentAge,
      onSelectedPalaceChange,
    } = options || {};

    if (onSelectedPalaceChange) {
      onSelectedPalaceChange(name);
    }

    const { computeRelatedPalaces, getStarsForPalace, toTraditionalStarName, getPalaceScoreWithWeights, getHoroscopeFromAge, PALACE_DEFAULT } = getCalcHelpers();
    const { getSihuaForPalace, getMutagenBadgeHtml, STAR_WUXING_MAP } = getRenderHelpers();
    const { getCurrentAge: getCurrentAgeHelper } = getDomHelpers();

    const ring = palaceRing || PALACE_DEFAULT.slice();
    const { related } = computeRelatedPalaces(ring, name);
    const relatedNames = new Set(related);

    document.querySelectorAll(".zw-palace").forEach((el) => {
      const pName = el.getAttribute("data-palace-name") || "";
      el.classList.remove("is-active", "is-related");
      if (pName === name) el.classList.add("is-active");
      else if (relatedNames.has(pName)) el.classList.add("is-related");
    });

    const currentAge = getCurrentAge ? getCurrentAge() : (getCurrentAgeHelper ? getCurrentAgeHelper() : null);
    const horoscope = providedHoroscope || (ziwei && currentAge !== null && lastGender ? getHoroscopeFromAge(currentAge, lastGender, ziwei, bazi) : null);
    const mutagenStars = horoscope?.mutagenStars || {};

    const rawStars = ziwei ? getStarsForPalace(ziwei, name) : [];
    const stars = rawStars.map(toTraditionalStarName);

    const titleText = `2026 ${name} · 作戰面板`;
    const subText = "三方四正已標示：本宮＋對宮＋三合（共四宮）。";

    document.getElementById("palaceTitle").textContent = titleText;
    document.getElementById("palaceSub").textContent = subText;

    const palaceText = (dbContent?.palaces && dbContent.palaces[name]) ? dbContent.palaces[name] : "（資料庫尚未填入此宮位解釋）";

    const Strategy = typeof window.StrategyConfig !== "undefined" ? window.StrategyConfig : null;
    let strategyHtml = '<div id="palaceStrategyBlock" class="mb-4 text-sm md:text-xs text-slate-500">載入戰略金句…</div>';
    if (Strategy && window.ziweiScores?.palaceScores) {
      const baseScore = Number(window.ziweiScores.palaceScores[name]) || 0;
      const yearlyStem = horoscope?.yearlyStem ?? null;
      let displayScore = baseScore;
      if (name === (horoscope?.activeLimitPalaceName ?? null) && yearlyStem && ziwei) {
        const rawStars = getStarsForPalace(ziwei, name);
        const stars = rawStars.map(toTraditionalStarName);
        // 使用 async/await 處理異步調用
        getPalaceScoreWithWeights(baseScore, stars, yearlyStem, ziwei, name).then(function (score) {
          displayScore = score;
          const maxScore = Math.max(...Object.values(window.ziweiScores.palaceScores).map(Number), 0.01);
          const strength = Strategy.scoreToStrength(displayScore, maxScore);
          const sihuaList = getSihuaForPalace(ziwei, name, horoscope?.mutagenStars || {});
          return Strategy.getStrategyNoteFromAPI(name, strength, sihuaList);
        }).then(function (advice) {
          const block = document.getElementById("palaceStrategyBlock");
          if (!block) return;
          if (advice && advice !== "（暫無戰略提示）") {
            const escLocal = window.Utils?.escHtml || ((s) => {
              if (s == null) return "";
              return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
            });
            block.outerHTML = "<div class=\"p-4 md:p-4 rounded-xl border border-amber-400/30 bg-amber-500/10 mb-4\"><div class=\"text-xs md:text-[10px] text-amber-200 font-black tracking-widest uppercase mb-2\">戰略金句</div><div class=\"text-base md:text-sm text-amber-100/95 leading-relaxed\">" + escLocal(advice) + "</div></div>";
          } else {
            block.textContent = "";
          }
        }).catch(function () {
          const block = document.getElementById("palaceStrategyBlock");
          if (block) block.textContent = "";
        });
        return; // 異步處理中，提前返回
      }
      const maxScore = Math.max(...Object.values(window.ziweiScores.palaceScores).map(Number), 0.01);
      const strength = Strategy.scoreToStrength(displayScore, maxScore);
      const sihuaList = getSihuaForPalace(ziwei, name, horoscope?.mutagenStars || {});
      Strategy.getStrategyNoteFromAPI(name, strength, sihuaList).then(function (advice) {
        const block = document.getElementById("palaceStrategyBlock");
        if (!block) return;
        if (advice && advice !== "（暫無戰略提示）") {
          const esc = window.Utils?.escHtml || ((s) => {
            if (s == null) return "";
            return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
          });
          block.outerHTML = "<div class=\"p-4 md:p-4 rounded-xl border border-amber-400/30 bg-amber-500/10 mb-4\"><div class=\"text-xs md:text-[10px] text-amber-200 font-black tracking-widest uppercase mb-2\">戰略金句</div><div class=\"text-base md:text-sm text-amber-100/95 leading-relaxed\">" + esc(advice) + "</div></div>";
        } else {
          block.textContent = "";
        }
      }).catch(function () {
        const block = document.getElementById("palaceStrategyBlock");
        if (block) block.textContent = "";
      });
    } else {
      strategyHtml = "";
    }

    let starCards = "";
    if (stars.length) {
      starCards = stars
        .map((s) => {
          const wx = STAR_WUXING_MAP[s] || "";
          const explain = (dbContent?.stars && dbContent.stars[s]) ? dbContent.stars[s] : "（資料庫尚未填入此星曜解釋）";
          const badgeHtml = getMutagenBadgeHtml(s, mutagenStars);
          const titleDisplay = badgeHtml ? `【${s}】 ${badgeHtml}` : `【${s}】`;
          return `
            <div class="p-4 md:p-4 rounded-xl border border-white/10 bg-white/5">
              <div class="flex items-center justify-between gap-3">
                <div class="font-black text-xl ${wx ? "star-wx-" + wx : "text-slate-200"}">${titleDisplay}</div>
                <div class="text-xs md:text-[10px] text-slate-500">${wx ? "五行：" + wx : ""}</div>
              </div>
              <div class="text-xl text-slate-300 mt-2 leading-relaxed">${explain}</div>
            </div>
          `;
        })
        .join("");
    } else {
      starCards = `
        <div class="p-4 md:p-4 rounded-xl border border-white/10 bg-white/5">
          <div class="text-xl text-slate-300 font-black">空宮</div>
          <div class="text-xl text-slate-400 mt-2">空宮不等於沒有事件，重點是看三方四正與流月節奏如何引動。</div>
        </div>
      `;
    }

    const detailHtml = `
      ${strategyHtml}
      <div class="p-4 md:p-4 rounded-xl border border-amber-400/25 bg-amber-500/10">
        <div class="text-xl text-emerald-400 font-black mb-2">資料庫宮位解釋</div>
        <div class="text-xl text-slate-100 leading-relaxed">${palaceText}</div>
      </div>

      <div>
        <div class="text-xl text-emerald-400 font-black mb-3">星曜解釋（資料庫）</div>
        <div class="space-y-3 md:space-y-3">${starCards}</div>
      </div>
    `;

    const body = document.getElementById("palaceDetailBody");
    body.innerHTML = detailHtml;

    const mTitle = document.getElementById("mobilePalaceTitle");
    const mSub = document.getElementById("mobilePalaceSub");
    const mBody = document.getElementById("mobilePalaceBody");
    if (mTitle) mTitle.textContent = titleText;
    if (mSub) mSub.textContent = subText;
    if (mBody) mBody.innerHTML = detailHtml;
  }

  // 初始化 window.UiComponents
  if (!window.UiComponents) {
    window.UiComponents = {};
  }

  // 导出到 window.UiComponents.PalaceDetail
  window.UiComponents.PalaceDetail = {
    selectPalace,
  };
})();
