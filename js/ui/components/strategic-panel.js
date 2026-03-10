/* strategic-panel.js
 * 戰略面板組件 - 重構版
 * 實現命主/身主分離、五行可視化、十神戰略卡片、50/30/20 諮詢格式
 * 依賴: window.Calc, window.UiRenderHelpers, window.UiDomHelpers
 */

(function () {
  "use strict";

  if (typeof window === "undefined") {
    throw new Error("window object not available");
  }

  // 延遲檢查依賴
  function getDependencies() {
    if (!window.Calc) {
      throw new Error("strategic-panel.js requires window.Calc");
    }
    if (!window.UiRenderHelpers) {
      throw new Error("strategic-panel.js requires window.UiRenderHelpers");
    }
    if (!window.UiDomHelpers) {
      throw new Error("strategic-panel.js requires window.UiDomHelpers");
    }
    return {
      Calc: window.Calc,
      UiRenderHelpers: window.UiRenderHelpers,
      UiDomHelpers: window.UiDomHelpers,
    };
  }

  /**
   * 獲取命主和身主星曜
   * @param {Object} ziwei - 紫微數據
   * @param {Object} bazi - 八字數據（可選，用於獲取年支）
   */
  function getMasterStars(ziwei, bazi = null) {
    if (!ziwei) return { mingzhu: null, shengong: null };
    
    const core = ziwei.core || {};
    const basic = ziwei.basic || {};
    
    // 獲取命宮地支（用於計算命主）
    const mingBranch = core.minggongBranch || "寅";
    
    // 獲取年支（用於計算身主）- 優先使用傳入的 bazi，否則嘗試從多個來源獲取
    let yearBranch = "";
    if (bazi) {
      yearBranch = (bazi?.display?.yZ || bazi?.yearBranch || "").toString().trim();
    } else {
      // 嘗試從多個來源獲取
      const contract = window.contract || null;
      const contractBazi = contract?.bazi || null;
      yearBranch = (contractBazi?.display?.yZ || contractBazi?.yearBranch || "").toString().trim();
      
      // 如果還是沒有，嘗試從全局狀態獲取
      if (!yearBranch) {
        const globalBazi = window.BaziApp?.State?.getState("bazi") || window.bazi || null;
        yearBranch = (globalBazi?.display?.yZ || globalBazi?.yearBranch || "").toString().trim();
      }
    }
    
    // 標準化星名的輔助函數
    const stripStarLabel = (s) => String(s || "").replace(/^\d+\.?\s*/, "").trim();
    const toTraditionalStarName = window.CalcHelpers?.toTraditionalStarName || ((s) => s);
    
    // 嘗試從多個位置獲取命主
    let mingzhuRaw = basic.masterStar ?? core.mingzhu ?? core.命主 ?? "";
    let mingzhu = null;
    
    if (mingzhuRaw) {
      mingzhu = toTraditionalStarName(stripStarLabel(mingzhuRaw));
    } else if (window.CalcHelpers?.calculateMingzhu && mingBranch) {
      // 如果後端沒有提供，嘗試計算
      const calculated = window.CalcHelpers.calculateMingzhu(mingBranch);
      if (calculated) {
        mingzhu = toTraditionalStarName(calculated);
      }
    }
    
    // 嘗試從多個位置獲取身主
    let shengongRaw = basic.bodyStar ?? core.shengong ?? core.身主 ?? "";
    let shengong = null;
    
    if (shengongRaw) {
      shengong = toTraditionalStarName(stripStarLabel(shengongRaw));
    } else if (yearBranch && window.CalcHelpers?.calculateShengong) {
      // 如果後端沒有提供，嘗試計算
      const calculated = window.CalcHelpers.calculateShengong(yearBranch);
      if (calculated) {
        shengong = toTraditionalStarName(calculated);
      }
    }
    
    // 調試日誌
    if (!mingzhu || !shengong) {
      console.log("[strategic-panel.js] getMasterStars 調試:", {
        hasZiwei: !!ziwei,
        mingBranch,
        yearBranch,
        mingzhuRaw,
        shengongRaw,
        hasCalcHelpers: !!window.CalcHelpers,
        hasCalculateMingzhu: !!window.CalcHelpers?.calculateMingzhu,
        hasCalculateShengong: !!window.CalcHelpers?.calculateShengong,
        calculatedMingzhu: mingzhu,
        calculatedShengong: shengong,
      });
    }
    
    return { mingzhu, shengong };
  }

  /**
   * 從星曜完整解釋中擷取可讀摘要（供描述句使用，不直接顯示星名）
   * 格式範例：「核心本質：語言與分析\n成熟時洞察清晰；\n你的力量在精準溝通。」
   * @param {boolean} shortForm - 身主用：僅取前兩段，避免「用 XXX 的方式」過長
   */
  function getStarSummary(starName, dbContent, shortForm) {
    const ContentUtils = window.UiUtils?.ContentUtils;
    const raw = ContentUtils && typeof ContentUtils.getContentValue === "function"
      ? ContentUtils.getContentValue(dbContent, "stars", starName, null)
      : (dbContent?.stars?.[starName] || null);
    if (!raw || typeof raw !== "string" || raw.startsWith("(missing:")) {
      return getStarCoreValue(starName); // fallback
    }
    const parts = [];
    const coreMatch = raw.match(/核心本質[：:]\s*([^\n]+)/);
    if (coreMatch) parts.push(coreMatch[1].trim());
    const matureMatch = raw.match(/成熟時[是為]?([^；\n]+)/);
    if (matureMatch) parts.push(matureMatch[1].trim());
    const powerMatch = raw.match(/你的力量在([^。\n]+)/);
    const workMatch = raw.match(/你的功課是([^。\n]+)/);
    if (powerMatch) parts.push(powerMatch[1].trim() + "是你的力量");
    else if (workMatch) parts.push(workMatch[1].trim() + "是你的功課");
    if (parts.length === 0) return getStarCoreValue(starName);
    if (shortForm) return parts.slice(0, 2).join("、") || getStarCoreValue(starName);
    return parts.slice(0, 2).join("、") + (parts[2] ? "，" + parts[2] : "");
  }

  /**
   * 獲取星曜核心價值描述（fallback 用）
   */
  function getStarCoreValue(starName) {
    const coreValues = {
      "紫微": "權威與領導", "天機": "智慧與變通", "太陽": "光明與熱情",
      "武曲": "效率與執行", "天同": "和諧與享受", "廉貞": "複雜與多變",
      "天府": "穩定與包容", "太陰": "溫柔與內斂", "貪狼": "慾望與創造",
      "巨門": "溝通與分析", "天相": "協調與服務", "天梁": "穩重與保護",
      "七殺": "果斷與變革", "破軍": "破壞與重建",
    };
    return coreValues[starName] || "獨特個性";
  }

  /**
   * 解析五行數據為百分比
   */
  function parseFiveElementsData(wuxing) {
    if (!wuxing) return null;
    
    const elements = ["金", "木", "水", "火", "土"];
    const total = Object.values(wuxing).reduce((sum, val) => sum + (val || 0), 0);
    
    if (total === 0) return null;
    
    return elements.map(name => ({
      name,
      value: wuxing[name] || 0,
      percentage: total > 0 ? Math.round(((wuxing[name] || 0) / total) * 100) : 0,
    }));
  }

  /**
   * 提取年度主旋律（從十神文本的第一句或關鍵句）
   */
  function extractMainTheme(tenGodText, dominant) {
    if (!tenGodText) {
      // 根據十神類型返回默認主旋律
      const defaultThemes = {
        "正官": "從想做，到必須做。",
        "偏官": "從被動，到主動。",
        "正財": "從理想，到現實。",
        "偏財": "從穩定，到突破。",
        "正印": "從學習，到應用。",
        "偏印": "從傳統，到創新。",
        "食神": "從思考，到行動。",
        "傷官": "從規範，到自由。",
        "比肩": "從獨立，到合作。",
        "劫財": "從競爭，到共贏。",
      };
      return defaultThemes[dominant] || "從現在，到未來。";
    }
    
    // 嘗試提取第一句作為主旋律
    const firstSentence = tenGodText.split(/[。；\n]/)[0].trim();
    if (firstSentence && firstSentence.length > 5 && firstSentence.length < 30) {
      return `「${firstSentence}」`;
    }
    
    // 如果第一句不合適，使用默認值
    const defaultThemes = {
      "正官": "從想做，到必須做。",
      "偏官": "從被動，到主動。",
      "正財": "從理想，到現實。",
      "偏財": "從穩定，到突破。",
      "正印": "從學習，到應用。",
      "偏印": "從傳統，到創新。",
      "食神": "從思考，到行動。",
      "傷官": "從規範，到自由。",
      "比肩": "從獨立，到合作。",
      "劫財": "從競爭，到共贏。",
    };
    return defaultThemes[dominant] || "「從現在，到未來。」";
  }

  /**
   * 解析十神建議為行動和禁忌清單（改進版）
   */
  function parseTenGodAdvice(tenGodText) {
    if (!tenGodText) return { actions: [], prohibitions: [] };
    
    const actions = [];
    const prohibitions = [];
    
    // 改進的正則匹配，支持更多格式
    const actionPatterns = [
      /(?:應該|建議|可以|適合|要|需要|必須|應當|應當|宜).*?[。；\n]/g,
      /(?:建立|爭取|加強|提升|培養|發展|完善|優化|改善|增強).*?[。；\n]/g,
      /(?:制度化|邊界化|正式化|標準化|系統化).*?[。；\n]/g,
      // 匹配以動詞開頭的句子
      /^[^。；\n]*(?:做|執行|實行|進行|開展|推動|促進|實現).*?[。；\n]/gm,
    ];
    
    const prohibitionPatterns = [
      /(?:不要|避免|禁止|不適合|不宜|不應|不該|切忌|切勿).*?[。；\n]/g,
      /(?:避免|拒絕|不要|禁止|停止|取消|放棄).*?[。；\n]/g,
      // 匹配負面動詞
      /^[^。；\n]*(?:避免|拒絕|禁止|停止|取消|放棄|忽略|忽視).*?[。；\n]/gm,
    ];
    
    // 提取行動清單
    actionPatterns.forEach(pattern => {
      const matches = tenGodText.match(pattern);
      if (matches) {
        matches.forEach(match => {
          const cleaned = match.replace(/[。；\n]$/, "").trim();
          if (cleaned && cleaned.length > 3 && !actions.includes(cleaned)) {
            actions.push(cleaned);
          }
        });
      }
    });
    
    // 提取禁忌清單
    prohibitionPatterns.forEach(pattern => {
      const matches = tenGodText.match(pattern);
      if (matches) {
        matches.forEach(match => {
          const cleaned = match.replace(/[。；\n]$/, "").trim();
          if (cleaned && cleaned.length > 3 && !prohibitions.includes(cleaned)) {
            prohibitions.push(cleaned);
          }
        });
      }
    });
    
    // 如果沒有匹配到，嘗試按段落分割（每段作為一個行動點）
    if (actions.length === 0 && prohibitions.length === 0) {
      const paragraphs = tenGodText.split(/[。；\n]+/).filter(p => p.trim().length > 5);
      paragraphs.forEach(para => {
        const trimmed = para.trim();
        if (trimmed.length > 0 && trimmed.length < 100) {
          // 簡單判斷是行動還是禁忌
          if (/^(?:應該|建議|可以|適合|要|需要|必須|建立|爭取|加強|提升)/.test(trimmed)) {
            actions.push(trimmed);
          } else if (/^(?:不要|避免|禁止|不適合|不宜)/.test(trimmed)) {
            prohibitions.push(trimmed);
          } else {
            // 默認作為行動
            actions.push(trimmed);
          }
        }
      });
    }
    
    return { actions, prohibitions };
  }

  /**
   * 渲染戰略面板
   */
  function renderStrategicPanel(params) {
    console.log("[strategic-panel.js] renderStrategicPanel 開始執行");
    const t = (k, o) => (typeof window !== "undefined" && window.I18n && typeof window.I18n.t === "function") ? window.I18n.t(k, o) : k;
    const { bazi, dbContent, ziweiPalaceMetadata, liuyueData, ziwei: ziweiParam, bodyPalaceReport } = params;
    
    console.log("[strategic-panel.js] 參數檢查:", {
      hasBazi: !!bazi,
      hasDbContent: !!dbContent,
      hasZiweiPalaceMetadata: !!ziweiPalaceMetadata,
      hasLiuyueData: !!liuyueData,
      hasZiwei: !!ziweiParam,
    });
    
    const deps = getDependencies();
    
    const tacticalBox = document.getElementById("tacticalBox");
    if (!tacticalBox) {
      console.error("[strategic-panel.js] 找不到 tacticalBox 元素");
      return;
    }
    
    /** 命主/身主來源：優先 params.ziwei（contract.ziwei），其次 ziweiPalaceMetadata.ziwei */
    const ziwei = ziweiParam || ziweiPalaceMetadata?.ziwei || null;
    // 傳入 bazi 數據以便獲取年支計算身主
    const { mingzhu, shengong } = getMasterStars(ziwei, bazi);
    
    console.log("[strategic-panel.js] 命主/身主:", { 
      mingzhu, 
      shengong,
      hasZiwei: !!ziwei,
      hasBazi: !!bazi,
      yearBranch: bazi?.display?.yZ || bazi?.yearBranch || "未找到",
    });
    
    // 獲取十神主軸
    const dominant = (bazi?.tenGod?.dominant || "").trim();
    var ContentUtils = window.UiUtils?.ContentUtils;
    var tenGodRaw = ContentUtils && typeof ContentUtils.getContentValue === "function"
      ? ContentUtils.getContentValue(dbContent, "tenGods", dominant, null)
      : (dominant && dbContent?.tenGods?.[dominant] ? dbContent.tenGods[dominant] : null);
    if (tenGodRaw && tenGodRaw.startsWith("(missing:")) tenGodRaw = null;
    const tenGodText = tenGodRaw || "";
    
    console.log("[strategic-panel.js] 十神數據:", {
      dominant,
      hasTenGodText: !!tenGodText,
      tenGodTextLength: tenGodText?.length || 0,
    });
    
    // 解析五行數據
    const wuxingData = parseFiveElementsData(bazi?.wuxing?.strategic);
    console.log("[strategic-panel.js] 五行數據:", wuxingData);
    
    // 解析十神建議
    const { actions, prohibitions } = parseTenGodAdvice(tenGodText);
    console.log("[strategic-panel.js] 解析結果:", {
      actionsCount: actions.length,
      prohibitionsCount: prohibitions.length,
      actions: actions.slice(0, 3),
      prohibitions: prohibitions.slice(0, 3),
    });
    
    // 提取年度主旋律
    const mainTheme = extractMainTheme(tenGodText, dominant);
    
    // 構建 HTML
    let html = '<div class="space-y-6">';
    
    // Section A: 原廠設定與當前武裝 (The DNA)
    html += '<div class="space-y-4">';
      html += '<div class="text-xs font-semibold text-slate-200 mb-3">Section A: 原廠設定與當前武裝 (The DNA)</div>';
    
    // 命主
    if (mingzhu) {
      const mingzhuDesc = getStarSummary(mingzhu, dbContent);
      html += `
        <div class="p-4 md:p-4 rounded-xl border border-amber-400/40 bg-white/5">
          <div class="text-xs font-semibold text-slate-200 mb-2">${t("strategic.lifeGeneSection")}</div>
          <div class="text-xs font-bold text-amber-400 mb-2">${mingzhu}</div>
          <div class="text-[11px] text-slate-400 leading-relaxed">
            🎯 ${t("strategic.direct50")}<br>
            「你骨子裡追求的是 ${mingzhuDesc}。」
          </div>
        </div>
      `;
      // 命主已渲染（除錯可開 console.log）
    } else {
      const t = (k, o) => (typeof window !== "undefined" && window.I18n && typeof window.I18n.t === "function") ? window.I18n.t(k, o) : k;
      html += `
        <div class="p-4 rounded-xl border border-slate-400/20 bg-white/5 text-xs text-slate-500">
          ${t("strategic.lifeMasterUnavailable")}
        </div>
      `;
    }
    
    // 身主
    if (shengong) {
      const mingzhuDesc = mingzhu ? getStarSummary(mingzhu, dbContent) : "核心價值";
      const shengongDesc = getStarSummary(shengong, dbContent, true); // shortForm：用於「習慣用 XXX 的方式」
      html += `
        <div class="p-4 md:p-4 rounded-xl border border-blue-400/40 bg-white/5 mt-3">
          <div class="text-xs font-semibold text-slate-200 mb-2">${t("strategic.acquiredToolSection")}</div>
          <div class="text-xs font-bold text-blue-400 mb-2">${shengong}</div>
          <div class="text-[11px] text-slate-400 leading-relaxed">
            💭 ${t("strategic.inspire30")}<br>
            「雖然你靈魂追求 ${mingzhuDesc}，但你這幾年越來越習慣用 ${shengongDesc} 的方式來應對世界，這讓你感到更安全還是更疲累？」
          </div>
        </div>
      `;
      // 身主已渲染（除錯可開 console.log）
    } else {
      const t = (k, o) => (typeof window !== "undefined" && window.I18n && typeof window.I18n.t === "function") ? window.I18n.t(k, o) : k;
      html += `
        <div class="p-4 rounded-xl border border-slate-400/20 bg-white/5 mt-3 text-xs text-slate-500">
          ${t("strategic.bodyMasterUnavailable")}
        </div>
      `;
    }
    
    // 身宮在 XX 宮（輕量卡片：title + oneLiner + tip）
    if (bodyPalaceReport && bodyPalaceReport.behaviorUi) {
      const ui = bodyPalaceReport.behaviorUi;
      html += `
        <div class="mt-4 p-4 rounded-xl border border-violet-400/40 bg-white/5">
          <div class="text-xs font-semibold text-slate-200 mb-2">身宮在${bodyPalaceReport.bodyPalaceZh || "某宮"}</div>
          <div class="text-xs font-bold text-violet-400 mb-2">${ui.title || ""}</div>
          <div class="text-[11px] text-slate-400 leading-relaxed mb-2">${ui.oneLiner || ""}</div>
          <div class="text-[11px] text-amber-200/90">💡 ${ui.tip || ""}</div>
          ${bodyPalaceReport.doubleJiCopy ? `<div class="text-[11px] text-amber-300/90 mt-2">⚠️ ${bodyPalaceReport.doubleJiCopy.directive}</div>` : ""}
        </div>
      `;
    }
    
    html += '</div>';
    
    // Section B: 2026 能量天氣預報 (The Environment)
    if (wuxingData && wuxingData.length > 0) {
      html += '<div class="space-y-4 mt-6">';
      html += `<div class="text-xs font-semibold text-slate-200 mb-3">${t("strategic.sectionBTitle")}</div>`;
      
      // 五行進度條
      wuxingData.forEach(elem => {
        const isHigh = elem.percentage >= 30;
        const colorClass = isHigh ? "bg-red-500" : elem.percentage >= 20 ? "bg-yellow-500" : "bg-green-500";
        html += `
          <div class="space-y-2 md:space-y-1">
            <div class="flex justify-between text-xs">
              <span class="text-slate-300">${elem.name}能量</span>
              <span class="text-slate-400">${elem.percentage}%</span>
            </div>
            <div class="w-full h-3 md:h-2 bg-white/10 rounded-full overflow-hidden">
              <div class="h-full ${colorClass} transition-all duration-300" style="width: ${elem.percentage}%"></div>
            </div>
              ${isHigh ? `<div class="text-[11px] text-red-400">⚠️ ${t("strategic.systemOverloadWarning")}</div>` : ''}
          </div>
        `;
      });
      
      html += '</div>';
      console.log("[strategic-panel.js] Section B - 五行數據已渲染，共", wuxingData.length, "個元素");
    } else {
      console.warn("[strategic-panel.js] Section B - 五行數據缺失");
      const tB = (k) => (typeof window !== "undefined" && window.I18n && typeof window.I18n.t === "function") ? window.I18n.t(k) : k;
      html += `
        <div class="space-y-4 mt-6">
          <div class="text-xs font-semibold text-slate-200 mb-3">${t("strategic.sectionBTitle")}</div>
          <div class="p-4 rounded-xl border border-slate-400/20 bg-white/5 text-[11px] text-slate-500">
            ${tB("strategic.wuxingUnavailable")}
          </div>
        </div>
      `;
    }
    
    // Section C: 十神戰略 (The Strategy)
    if (dominant && tenGodText) {
      html += '<div class="space-y-4 mt-6">';
      html += `<div class="text-xs font-semibold text-slate-200 mb-3">${t("strategic.tenGodModeTitle", { name: dominant })}</div>`;
      
      html += `
        <div class="p-4 md:p-4 rounded-xl border border-emerald-400/40 bg-white/5">
          <div class="text-xs font-semibold text-slate-200 mb-2">${t("strategic.annualTheme")}</div>
          <div class="text-xs font-bold text-emerald-400 mb-4">${mainTheme}</div>
          
          ${actions.length > 0 ? `
            <div class="mb-4 md:mb-3">
              <div class="text-xs font-semibold text-green-400 mb-2">✅ ${t("strategic.actionChecklist")}</div>
              <ul class="text-[11px] text-slate-400 space-y-2 md:space-y-1 ml-4 leading-relaxed">
                ${actions.map(a => `<li>• ${a}</li>`).join('')}
              </ul>
            </div>
          ` : ''}
          
          ${prohibitions.length > 0 ? `
            <div class="mb-4 md:mb-3">
              <div class="text-xs font-semibold text-red-400 mb-2">❌ ${t("strategic.tabooChecklist")}</div>
              <ul class="text-[11px] text-slate-400 space-y-2 md:space-y-1 ml-4 leading-relaxed">
                ${prohibitions.map(p => `<li>• ${p}</li>`).join('')}
              </ul>
            </div>
          ` : ''}
          
          <div class="mt-4 pt-4 border-t border-white/10">
            <div class="text-xs font-semibold text-slate-200 mb-2">📝 ${t("strategic.capture20")}</div>
            <textarea 
              id="tenGodCapture20" 
              class="w-full p-3 md:p-3 rounded-lg bg-white/5 border border-white/10 text-xs text-slate-300 placeholder-slate-500 focus:outline-none focus:border-amber-400/50"
              rows="4"
              placeholder="${t("strategic.capturePlaceholder", { name: dominant })}"
            ></textarea>
            <div class="text-[11px] text-slate-500 mt-1" id="tenGodCaptureStatus"></div>
          </div>
        </div>
      `;
      
      html += '</div>';
      
      // 綁定自動保存
      setTimeout(() => {
        const textarea = document.getElementById("tenGodCapture20");
        const statusDiv = document.getElementById("tenGodCaptureStatus");
        if (textarea && statusDiv) {
          let saveTimeout;
          textarea.addEventListener("input", function() {
            clearTimeout(saveTimeout);
            const value = this.value.trim();
            if (value) {
              const chartId = bazi?.chartId || `chart_${Date.now()}`;
              const data = {
                chartId,
                tenGod: dominant,
                answer: value,
                timestamp: new Date().toISOString(),
              };
              try {
                localStorage.setItem(`tenGodCapture_${chartId}`, JSON.stringify(data));
                statusDiv.textContent = t("strategic.savedStatus");
                statusDiv.className = "text-[11px] text-green-400 mt-1";
                setTimeout(() => {
                  statusDiv.textContent = "";
                }, 2000);
              } catch (e) {
                console.warn("無法保存到 localStorage:", e);
              }
            }
          });
        }
      }, 100);
    }
    
    html += '</div>';
    
    // 如果沒有十神數據，顯示提示
    if (!dominant || !tenGodText) {
      const t = (k, o) => (typeof window !== "undefined" && window.I18n && typeof window.I18n.t === "function") ? window.I18n.t(k, o) : k;
      html += `
        <div class="space-y-4 mt-6">
          <div class="text-xs font-semibold text-slate-200 mb-3">${t("strategic.sectionCTitle")}</div>
          <div class="p-4 rounded-xl border border-slate-400/20 bg-white/5 text-[11px] text-slate-500">
            ${!dominant ? t("strategic.tenGodUnavailable") : t("strategic.tenGodDbMissing", { name: dominant })}
          </div>
        </div>
      `;
    }
    
    html += '</div>';
    
    console.log("[strategic-panel.js] HTML 構建完成，長度:", html.length);
    tacticalBox.innerHTML = html;
    console.log("[strategic-panel.js] renderStrategicPanel 執行完成");
  }

  // 導出
  if (typeof window !== "undefined") {
    if (!window.UiComponents) {
      window.UiComponents = {};
    }
    window.UiComponents.StrategicPanel = {
      renderStrategicPanel,
    };
  }
})();
