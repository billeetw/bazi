/* ui.js
 * 負責 DOM 綁定與 UI 狀態（bottom sheet / scroll / click 宮位）
 * 依賴 calc.js（window.Calc）。
 */

(function () {
  "use strict";

  // 延遲檢查依賴，避免在模組載入前報錯
  // 實際檢查會在 DOMContentLoaded 時進行
  if (typeof window === "undefined") {
    throw new Error("window object not available");
  }
  
  // 延遲解構 window.Calc，避免在模組載入前報錯
  // 如果 calc.js 未載入，在 DOMContentLoaded 時再檢查
  if (!window.Calc) {
    console.error("[ui.js] window.Calc not found! Make sure calc.js is loaded before ui.js");
    // 提供臨時的空對象以避免立即報錯，實際檢查會在 DOMContentLoaded 時進行
    window.Calc = window.Calc || {};
  }

  const {
    PALACE_DEFAULT,
    STAR_WUXING_MAP,
    FIVE_ELEMENTS_ORDER,
    SHICHEN_ORDER,
    pad2,
    resolveBirthTime,
    toTraditionalStarName,
    getStarsForPalace,
    buildSlotsFromZiwei,
    computeRelatedPalaces,
    normalizeWxByMax,
    generateFiveElementComment,
    computeDynamicTactics,
    getHoroscopeFromAge,
    getMutagenStars,
    getPalaceScoreWithWeights,
    computeAllPalaceScores,
  } = window.Calc;

  // 导入 UI 工具函数
  if (!window.UiDomHelpers) {
    console.error("[ui.js] window.UiDomHelpers not found! Make sure dom-helpers.js is loaded before ui.js");
  }
  if (!window.UiRenderHelpers) {
    console.error("[ui.js] window.UiRenderHelpers not found! Make sure render-helpers.js is loaded before ui.js");
  }
  
  const {
    animateValue,
    getCurrentAge: getCurrentAgeHelper,
    syncAgeSliderDisplay,
    flashPeek,
    openPalaceSheet,
    closePalaceSheet,
    setMobileSheetContent,
  } = window.UiDomHelpers || {};

  const {
    getSihuaForPalace,
    renderBar,
    toneClass,
    wrapForMobile,
    renderRadarChart,
    renderFiveElementComment,
    getColorFromCode,
    getBorderColorClass,
    getBgColorClass,
    getTextColorClass,
    getStarRating,
    renderStars,
    getMutagenBadgeHtml,
    starWithBadgeHtml,
  } = window.UiRenderHelpers || {};

  // ====== CONFIG ======
  // API_BASE 已移至 api-service.js
  const API_BASE = window.UiServices?.ApiService?.API_BASE || "https://17gonplay-api.billeetw.workers.dev";

  // DEFAULT_WUXING_MEANINGS 已移至 wuxing-meaning.js 组件

  // ====== STATE ======
  let dbContent = { palaces: {}, stars: {}, tenGods: {}, wuxing: {} };
  let contract = null;
  let selectedPalace = "命宮";
  let lastBirthYear = null;
  let lastGender = null;

  // 宮位環（以命宮為起點的 12 宮順序）
  let PALACE_RING = PALACE_DEFAULT.slice();

  /** 取得當前年齡（虛歲）：從 #currentAgeSlider 或依出生年推算 */
  function getCurrentAge() {
    return getCurrentAgeHelper ? getCurrentAgeHelper(lastBirthYear) : 38;
  }

  // animateValue, syncAgeSliderDisplay, renderBar, toneClass 已移至工具模块

  // renderWuxingMeaningBox 已移至 wuxing-meaning.js 组件

  // renderRadarChart, wrapForMobile, renderFiveElementComment 已移至 render-helpers.js
  // renderPillars 已移至 bazi-pillars.js 组件

  // getMonthStrategyTag 已移至 strategy-tags.js 工具模块
  const StrategyTags = window.UiUtils?.StrategyTags || {};
  const getMonthStrategyTag = StrategyTags.getMonthStrategyTag || function(b) {
    const risk = Number(b.riskScore) || 0;
    const isHigh = risk >= 55 || b.light === "RED";
    const reasons = (b.reasonTags || []).join("");
    const hasCai = /財|才|偏財|正財/.test(reasons);
    const hasGuanSha = /官|殺|七殺|正官|偏官/.test(reasons);
    if (isHigh && (hasGuanSha || risk >= 70)) return "🚨 壓力監測";
    if (!isHigh && hasCai) return "💰 資源收割";
    if (!isHigh) return "🟢 穩進";
    return "🟡 節奏調整";
  };

  // parseMonthFromRange, getMonthSubtitle 已移至 liuyue-month.js 组件

  // getColorFromCode, getBorderColorClass, getBgColorClass, getTextColorClass 已移至 render-helpers.js

  // 导入 UI 组件
  // 流月组件
  const renderLiuyueFromComponent = window.UiComponents?.LiuyueMonth?.renderLiuyue;
  
  // 为了向后兼容，保留 renderLiuyue 函数签名
  function renderLiuyue(bazi) {
    if (renderLiuyueFromComponent) {
      return renderLiuyueFromComponent(bazi);
    } else {
      console.warn("[ui.js] renderLiuyue not available from LiuyueMonth component, using fallback");
      // Fallback: 显示错误信息
      const mGrid = document.getElementById("monthGrid");
      if (mGrid) {
        mGrid.innerHTML = `<div class="text-xs text-slate-400 italic">流月组件未加载，请刷新页面重试</div>`;
      }
    }
  }

  // 五行意义组件
  const renderWuxingMeaningBoxFromComponent = window.UiComponents?.WuxingMeaning?.renderWuxingMeaningBox;
  function renderWuxingMeaningBox(dbContent) {
    if (renderWuxingMeaningBoxFromComponent) {
      return renderWuxingMeaningBoxFromComponent(dbContent);
    } else {
      console.warn("[ui.js] renderWuxingMeaningBox not available from WuxingMeaning component");
    }
  }

  // 八字柱组件
  const renderPillarsFromComponent = window.UiComponents?.BaziPillars?.renderPillars;
  function renderPillars(bazi) {
    if (renderPillarsFromComponent) {
      return renderPillarsFromComponent(bazi);
    } else {
      console.warn("[ui.js] renderPillars not available from BaziPillars component");
    }
  }

  // 紫微盘组件
  const renderZiweiFromComponent = window.UiComponents?.ZiweiGrid?.renderZiwei;
  function renderZiwei(ziwei, horoscope, options = {}) {
    if (renderZiweiFromComponent) {
      // 传递宫位点击回调和选项（包含 bazi 和 gender 用于大限旋转方向计算）
      return renderZiweiFromComponent(ziwei, horoscope, (palaceName) => {
        selectPalace(palaceName);
        if (window.innerWidth < 1280) {
          openPalaceSheet();
        } else {
          document.getElementById("detailPanel")?.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, options);
    } else {
      console.warn("[ui.js] renderZiwei not available from ZiweiGrid component");
    }
  }

  // 宫位强度组件
  const renderZiweiScoresFromComponent = window.UiComponents?.PalaceScores?.renderZiweiScores;
  async function renderZiweiScores(scores, horoscope, ziwei) {
    if (renderZiweiScoresFromComponent) {
      return renderZiweiScoresFromComponent(scores, horoscope, ziwei, (palaceName) => {
        selectPalace(palaceName);
      });
    } else {
      console.warn("[ui.js] renderZiweiScores not available from PalaceScores component");
    }
  }

  // 宫位详情组件
  const selectPalaceFromComponent = window.UiComponents?.PalaceDetail?.selectPalace;
  function selectPalace(name) {
    if (selectPalaceFromComponent) {
      selectedPalace = name;
      return selectPalaceFromComponent(name, {
        ziwei: contract?.ziwei,
        bazi: contract?.bazi,
        horoscope: contract?.ziwei?.horoscope || getHoroscopeFromAge(getCurrentAge(), lastGender, contract?.ziwei, contract?.bazi),
        dbContent,
        palaceRing: PALACE_RING,
        lastGender,
        getCurrentAge: getCurrentAge,
        onSelectedPalaceChange: (name) => {
          selectedPalace = name;
        },
      });
    } else {
      console.warn("[ui.js] selectPalace not available from PalaceDetail component");
    }
  }

  // ====== Mobile Bottom Sheet 控制 ======
  // openPalaceSheet, closePalaceSheet, setMobileSheetContent, flashPeek 已移至 dom-helpers.js

  // openWuxingMeaningLikePalace 已移至 wuxing-panel.js 组件
  const WuxingPanel = window.UiComponents?.WuxingPanel || {};
  const openWuxingMeaningLikePalace = WuxingPanel.openWuxingMeaningLikePalace || function() {
    console.warn("[ui.js] WuxingPanel component not available, using fallback");
    const meaningSection = document.getElementById("wuxingMeaningSection");
    meaningSection?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // getMutagenBadgeHtml, starWithBadgeHtml 已移至 render-helpers.js

  // ====== RENDER: ZIWEI GRID ======
  // renderZiwei 已移至 ziwei-grid.js 组件

  // ====== Palace Detail (DB-driven) ======
  // selectPalace 已移至 palace-detail.js 组件

  // ====== Load DB Content ======
  async function loadDbContent() {
    const apiService = window.UiServices?.ApiService;
    if (apiService) {
      const result = await apiService.loadDbContent((content) => {
        dbContent = content;
      });
      if (result) dbContent = result;
    } else {
      // Fallback to direct fetch
      try {
        const r = await fetch(`${API_BASE}/content/2026`, { method: "GET" });
        const j = await r.json();
        if (j?.ok) dbContent = j;
      } catch (e) {
        console.warn("loadDbContent failed", e);
      }
    }
    renderWuxingMeaningBox(dbContent);
  }

  // syncNavChipActive, initDashboardContentTransition 已移至 navigation.js 服务模块
  const Navigation = window.UiServices?.Navigation || {};
  const syncNavChipActive = Navigation.syncNavChipActive || function() {
    const hash = (window.location.hash || "").trim() || "#ws-ziwei";
    document.querySelectorAll(".nav-chip[href^=\"#\"]").forEach((a) => {
      const href = (a.getAttribute("href") || "").trim();
      if (href === hash) a.setAttribute("aria-current", "page");
      else a.removeAttribute("aria-current");
    });
  };
  const initDashboardContentTransition = Navigation.initDashboardContentTransition || function() {
    console.warn("[ui.js] Navigation service not available, using fallback");
  };

  // ====== Calculate ======
  async function calculate(skipStartupSequence) {
    console.log("[ui.js] calculate 函數開始執行, skipStartupSequence:", skipStartupSequence);
    
    const btn = document.getElementById("btnLaunch");
    const hint = document.getElementById("hint");
    
    if (!btn) {
      console.error("[ui.js] calculate: 找不到啟動按鈕 #btnLaunch");
      return;
    }
    if (!hint) {
      console.warn("[ui.js] calculate: 找不到提示元素 #hint");
    }
    
    const original = btn.textContent;
    console.log("[ui.js] calculate: 按鈕原始文本:", original);

    const vy = Number(document.getElementById("birthYear").value);
    const vm = Number(document.getElementById("birthMonth").value);
    const vd = Number(document.getElementById("birthDay").value);
    const gender = (document.getElementById("gender")?.value || "").trim(); // "M" | "F"
    const timeMode = (document.getElementById("timeMode")?.value || "exact").trim(); // "exact" | "shichen"
    const vh = Number(document.getElementById("birthHour")?.value);
    const vmin = Number(document.getElementById("birthMinute")?.value);
    const shichen = (document.getElementById("birthShichen")?.value || "").trim();
    const shichenHalf = (document.getElementById("birthShichenHalf")?.value || "").trim(); // "upper" | "lower"
    
    console.log("[ui.js] calculate: 輸入參數:", { vy, vm, vd, gender, timeMode, vh, vmin, shichen, shichenHalf });

    if (!skipStartupSequence && typeof window.showStartupSequence === "function" && timeMode === "shichen" && shichen) {
      console.log("[ui.js] calculate: 顯示啟動動畫");
      window.showStartupSequence({
        branchLabel: shichen + "時",
        personaLine: CEREMONY_PERSONALITY_KEYS[shichen] || CEREMONY_PERSONALITY_KEYS["子"],
        enableSound: false, // 音效已移除，保留由下往上的進場動畫
        onFinished: function () { calculate(true); },
      });
      return;
    }

    try {
      console.log("[ui.js] calculate: 開始驗證輸入");
      // 使用计算流程服务模块验证输入
      const CalculationFlow = window.UiServices?.CalculationFlow || {};
      console.log("[ui.js] calculate: CalculationFlow 可用:", !!CalculationFlow.validateInputs);
      
      const validation = CalculationFlow.validateInputs 
        ? CalculationFlow.validateInputs({ vy, vm, vd, vh, vmin, timeMode, shichen, shichenHalf })
        : { isValid: true, errors: [] };
      
      console.log("[ui.js] calculate: 驗證結果:", validation);
      
      if (!validation.isValid) {
        const errorMsg = (validation.errors && Array.isArray(validation.errors) && validation.errors.length > 0) 
          ? validation.errors[0] 
          : (validation.error || "輸入驗證失敗");
        console.error("[ui.js] calculate: 驗證失敗:", errorMsg);
        if (hint) {
          hint.textContent = errorMsg;
          hint.className = "text-center text-xs text-red-400 italic min-h-[1.2em]";
        }
        throw new Error(errorMsg);
      }
      
      console.log("[ui.js] calculate: 驗證通過，開始解析時間");

      const resolved = resolveBirthTime({ mode: timeMode, hour: vh, minute: vmin, shichen, shichenHalf });
      console.log("[ui.js] calculate: 時間解析結果:", resolved);

      btn.disabled = true;
      btn.textContent = "計算中…";
      if (hint) {
        hint.textContent = "正在連線後端計算（八字＋紫微＋流月＋十神）…";
      }
      console.log("[ui.js] calculate: 按鈕狀態已更新為「計算中」");

      // 使用 API 服务模块
      const apiService = window.UiServices?.ApiService;
      console.log("[ui.js] calculate: ApiService 可用:", !!apiService);
      console.log("[ui.js] calculate: API_BASE:", API_BASE);
      
      let payload;
      if (apiService) {
        console.log("[ui.js] calculate: 使用 ApiService.computeAll");
        payload = await apiService.computeAll({
          year: vy,
          month: vm,
          day: vd,
          hour: resolved.hour,
          minute: resolved.minute,
          gender: gender || undefined,
        });
        console.log("[ui.js] calculate: ApiService.computeAll 完成");
      } else {
        console.log("[ui.js] calculate: 使用 fallback fetch");
        // Fallback to direct fetch
        const baseBody = { year: vy, month: vm, day: vd, hour: resolved.hour, minute: resolved.minute };
        const bodyWithGender = gender ? { ...baseBody, gender } : baseBody;
        const apiUrl = `${API_BASE}/compute/all`;
        console.log("[ui.js] calculate: 發送 API 請求到:", apiUrl);
        console.log("[ui.js] calculate: 請求體:", bodyWithGender);
        
        const resp = await fetch(apiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(bodyWithGender),
        });
        
        console.log("[ui.js] calculate: API 響應狀態:", resp.status, resp.statusText);
        
        if (!resp.ok) {
          const t = await resp.text().catch(() => "");
          console.error("[ui.js] calculate: API 錯誤響應:", t);
          throw new Error(`API HTTP ${resp.status} ${t}`.trim());
        }
        payload = await resp.json();
        console.log("[ui.js] calculate: API 響應數據:", payload);
        if (!payload?.ok) throw new Error(payload?.error || "API error");
      }

      console.log("compute/all payload:", payload);
      console.log("chartId from payload:", payload.chartId);

      contract = payload.features;
      if (!contract || contract.version !== "strategic_features_v1") {
        throw new Error("features 格式錯誤（不是 strategic_features_v1）");
      }

      lastBirthYear = vy;
      lastGender = gender;
      syncAgeSliderDisplay(Math.max(1, new Date().getFullYear() - vy));

      const chartId = payload.chartId || contract.chartId || null;
      const bazi = contract.bazi;
      const ziwei = contract.ziwei;

      if (!bazi) throw new Error("後端未回傳 bazi");

      // 使用 API 服务模块获取宫位分数
      let ziweiScores = null;
      if (apiService) {
        ziweiScores = await apiService.getPalaceScores(chartId);
        if (ziweiScores) {
          window.ziweiScores = ziweiScores; // debug
          console.log("ziweiScores from API:", ziweiScores);
        }
      } else {
        // Fallback to direct fetch
        if (chartId) {
          try {
            const scoreResp = await fetch(`${API_BASE}/charts/${encodeURIComponent(chartId)}/scores`, { method: "GET" });
            if (scoreResp.ok) {
              ziweiScores = await scoreResp.json();
              window.ziweiScores = ziweiScores; // debug
              console.log("ziweiScores from API:", ziweiScores);
            } else {
              console.warn("scores API HTTP", scoreResp.status, await scoreResp.text().catch(() => ""));
            }
          } catch (err) {
            console.warn("scores API error:", err);
          }
        } else {
          console.warn("No chartId in payload, scores API 無法呼叫");
        }
      }

      // 宮位環：維持固定的「命、兄、夫、子…」順序，不再用後端覆蓋
      PALACE_RING = PALACE_DEFAULT.slice();

      // ===== 進入系統 UI =====
      // 使用计算流程服务模块更新 UI
      if (CalculationFlow.updateDashboardUI) {
        CalculationFlow.updateDashboardUI();
      } else {
        // Fallback
        const sysEl = document.getElementById("system");
        if (sysEl) sysEl.classList.remove("hidden");
        document.body.classList.add("dashboard-visible");
        const navEl = document.getElementById("workspaceNav");
        const navCta = document.getElementById("navCta");
        const inputEl = document.getElementById("inputCard");
        if (navEl) navEl.classList.remove("hidden");
        if (navCta) navCta.classList.remove("hidden");
        if (inputEl) inputEl.classList.add("hidden");
      }

      syncNavChipActive();
      initDashboardContentTransition();

      // 更新摘要信息
      if (CalculationFlow.updateSummary) {
        CalculationFlow.updateSummary({ vy, vm, vd, gender, timeMode, resolved, bazi, pad2 });
      } else {
        // Fallback
        const summaryBirthEl = document.getElementById("summaryBirth");
        const summaryDMEl = document.getElementById("summaryDM");
        const summaryDominantEl = document.getElementById("summaryDominant");
        const summaryRedMonthsEl = document.getElementById("summaryRedMonths");
        if (summaryBirthEl) {
          const genderText = gender === "M" ? "男" : gender === "F" ? "女" : "";
          const timeText = timeMode === "shichen"
            ? `時辰：${resolved.shichen}${resolved.shichenHalf === "lower" ? "下" : "上"}（約 ${pad2(resolved.hour)}:${pad2(resolved.minute)}）`
            : `${pad2(resolved.hour)}:${pad2(resolved.minute)}`;
          summaryBirthEl.textContent = `${vy}/${pad2(vm)}/${pad2(vd)} · ${timeText}（公曆）` + (genderText ? ` · ${genderText}` : "");
        }
        if (summaryDMEl) summaryDMEl.textContent = bazi.dmElement || "—";
        if (summaryDominantEl) summaryDominantEl.textContent = (bazi.tenGod?.dominant || "—").trim() || "—";
        if (summaryRedMonthsEl) {
          const reds = bazi.liuyue2026?.redMonths || [];
          summaryRedMonthsEl.textContent = reds.length ? reds.join("、") : "偏少（可穩推）";
        }
      }

      // 使用数据渲染服务模块
      const DataRenderer = window.UiServices?.DataRenderer || {};
      
      // 渲染八字和五行数据
      if (DataRenderer.renderBaziData) {
        DataRenderer.renderBaziData({
          bazi,
          renderPillars,
          renderBar,
          renderRadarChart,
          renderFiveElementComment,
        });
      } else {
        // Fallback
        renderPillars(bazi);
        renderBar("surfaceWxBars", bazi.wuxing?.surface, 4);
        renderRadarChart("surfaceWxRadar", bazi.wuxing?.surface);
        renderFiveElementComment("surfaceWxComment", bazi.wuxing?.surface, "surface");
        renderBar("strategicWxBars", bazi.wuxing?.strategic, bazi.wuxing?.maxStrategic || 1);
        renderRadarChart("strategicWxRadar", bazi.wuxing?.strategic);
        renderFiveElementComment("strategicWxComment", bazi.wuxing?.strategic, "strategic");
      }

      // 渲染十神指令
      if (DataRenderer.renderTenGodCommand) {
        DataRenderer.renderTenGodCommand({ bazi, dbContent });
      } else {
        // Fallback
        const dominant = (bazi.tenGod?.dominant || "").trim();
        const cmd = dominant && dbContent.tenGods?.[dominant] ? dbContent.tenGods[dominant] : "";
        const tenGodEl = document.getElementById("tenGodCommand");
        if (tenGodEl) {
          tenGodEl.textContent = cmd || `（資料庫尚未填入「${dominant || "—"}」的十神指令。你可以先在 ten_god_analysis 補上 2026 內容。）`;
        }
      }

      // 小限／四化（可與後端 iztro horoscope 並用）
      const horoscope = ziwei?.horoscope || getHoroscopeFromAge(getCurrentAge(), lastGender, ziwei, bazi);

      // 渲染紫微和流月数据（异步）
      if (DataRenderer.renderZiweiAndLiuyue) {
        DataRenderer.renderZiweiAndLiuyue({
          ziwei,
          horoscope,
          bazi,
          ziweiScores,
          renderZiwei,
          renderZiweiScores,
          renderLiuyue,
          selectPalace,
          computeAllPalaceScores,
          updateAnnualTactics,
          selectedPalace: "命宮",
          getCurrentAge, // 传递 getCurrentAge 函数以获取年龄
          gender: lastGender, // 传递性别以计算大限旋转方向
        }).then(() => {
          // 默认选择命宫
          if (ziwei) {
            selectPalace("命宮");
          }
        });
      } else {
        // Fallback
        renderZiwei(ziwei, horoscope, { bazi, gender: lastGender });
        const age = getCurrentAge();
        computeAllPalaceScores(ziwei, horoscope, { bazi, age }).then(function (computedScores) {
          const scores = {
            palaceScores: computedScores,
            elementRatios: ziweiScores?.elementRatios || {},
          };
          window.ziweiScores = scores;
          renderZiweiScores(scores, horoscope, ziwei);
          renderLiuyue(bazi);
          updateAnnualTactics(bazi, horoscope, ziwei);
          if (ziwei) selectPalace("命宮");
        }).catch(function (err) {
          console.error("計算宮位分數失敗:", err);
          if (ziweiScores?.palaceScores) {
            renderZiweiScores(ziweiScores, horoscope, ziwei);
          }
          renderLiuyue(bazi);
          updateAnnualTactics(bazi, horoscope, ziwei);
          if (ziwei) selectPalace("命宮");
        });
      }

      // 初始戰術建議（僅基於五行和十神，不依賴紫微數據）
      if (CalculationFlow.renderTactics) {
        CalculationFlow.renderTactics({ bazi, dbContent, ziweiPalaceMetadata: null, liuyueData: null });
      } else {
        // Fallback
        const tenGodText = dominant && dbContent.tenGods?.[dominant] ? dbContent.tenGods[dominant] : "";
        const initialTactics = window.Calc?.computeDynamicTactics 
          ? window.Calc.computeDynamicTactics(bazi, tenGodText, null, null)
          : [];
        const tacticalBox = document.getElementById("tacticalBox");
        if (tacticalBox && initialTactics.length > 0) {
          tacticalBox.innerHTML = initialTactics.map((x) => {
            const borderClass = x.tone === "emerald" ? "border-emerald-400/40" :
                               x.tone === "green" ? "border-green-400/40" :
                               x.tone === "red" ? "border-red-400/40" :
                               x.tone === "blue" ? "border-blue-400/40" :
                               x.tone === "slate" ? "border-slate-400/40" :
                               x.tone === "orange" ? "border-orange-400/40" :
                               "border-amber-400/40";
            return `<div class="p-4 rounded-xl border ${borderClass} bg-white/5 text-sm leading-relaxed">${x.text}</div>`;
          }).join("");
        }
      }

      // 更新年度戰術建議的輔助函數（在紫微和流月數據都準備好後調用）
      function updateAnnualTactics(bazi, horoscope, ziwei) {
        // 獲取紫微宮位元數據和流月數據
        const ziweiPalaceMetadata = (window.BaziApp?.State?.getState("ziweiPalaceMetadata")) || window.ziweiPalaceMetadata || null;
        const liuyueData = bazi?.liuyue2026 || null;
        
        // 使用计算流程服务模块渲染战术建议
        if (CalculationFlow.renderTactics) {
          CalculationFlow.renderTactics({ bazi, dbContent, ziweiPalaceMetadata, liuyueData });
        } else {
          // Fallback
          const tenGodText = (bazi?.tenGod?.dominant || "").trim() && dbContent.tenGods?.[bazi.tenGod.dominant] 
            ? dbContent.tenGods[bazi.tenGod.dominant] 
            : "";
          if (window.Calc?.computeDynamicTactics) {
            const tactics = window.Calc.computeDynamicTactics(bazi, tenGodText, ziweiPalaceMetadata, liuyueData);
            const tacticalBox = document.getElementById("tacticalBox");
            if (tacticalBox) {
              tacticalBox.innerHTML = tactics.length
                ? tactics.map((x) => {
                    const borderClass = x.tone === "emerald" ? "border-emerald-400/40" :
                                       x.tone === "green" ? "border-green-400/40" :
                                       x.tone === "red" ? "border-red-400/40" :
                                       x.tone === "blue" ? "border-blue-400/40" :
                                       x.tone === "slate" ? "border-slate-400/40" :
                                       x.tone === "orange" ? "border-orange-400/40" :
                                       "border-amber-400/40";
                    return `<div class="p-4 rounded-xl border ${borderClass} bg-white/5 text-sm leading-relaxed">${x.text}</div>`;
                  }).join("")
                : `<div class="text-sm text-slate-400 italic">（戰術提示暫不可用）</div>`;
            }
          }
        }
      }

      // 默认选择命宫（在数据渲染完成后）
      // 注意：这个逻辑现在在 DataRenderer.renderZiweiAndLiuyue 的 Promise 回调中处理
      // 如果使用 fallback，则在这里处理
      if (!DataRenderer.renderZiweiAndLiuyue && ziwei) {
        // Fallback 情况下，selectPalace 会在 Promise 回调中调用
      }

      document.getElementById("ws-summary")?.scrollIntoView({ behavior: "smooth", block: "start" });

      // 整合反馈系统到界面
      if (chartId && window.UiComponents?.FeedbackIntegration) {
        try {
          // 使用整合模块，自动添加到多个位置
          window.UiComponents.FeedbackIntegration.integrateFeedback(chartId, {
            showInSummary: true,      // 在摘要区域添加反馈链接
            showInNav: true,          // 在导航栏添加反馈链接
            showInBottomNav: true,    // 在移动端底部导航添加
            showPrompts: false,       // 不在各个section添加提示（可选）
            showDelayedPrompt: false, // 不显示延迟提示（可选）
          });
          console.log("[ui.js] 反馈系统整合成功");
        } catch (err) {
          console.error("[ui.js] 反馈系统整合失败:", err);
          // Fallback: 只创建浮动按钮
          if (window.UiComponents?.FeedbackWidget) {
            window.UiComponents.FeedbackWidget.createFeedbackButton({ chartId });
          }
        }
      } else if (chartId && window.UiComponents?.FeedbackWidget) {
        // Fallback: 只创建浮动按钮
        try {
          window.UiComponents.FeedbackWidget.createFeedbackButton({ chartId });
          console.log("[ui.js] 反馈按钮创建成功（仅浮动按钮）");
        } catch (err) {
          console.error("[ui.js] Failed to create feedback button:", err);
        }
      }
    } catch (e) {
      console.error(e);
      alert("系統忙碌中或資料有誤，請稍後再試。\n\n詳細：" + (e?.message || e));
    } finally {
      btn.disabled = false;
      btn.textContent = original;
      hint.textContent = "";
    }
  }

  // getStarRating, renderStars 已移至 render-helpers.js
  // renderZiweiScores 已移至 palace-scores.js 组件（上面的包装函数已处理）

  /** 12 宮位說明文字（依強度等級 1-4 變化）- 保留供 palace-scores.js 组件使用 */
  window.PALACE_DESCRIPTIONS = window.PALACE_DESCRIPTIONS || {
    "命宮": {
      1: "你的核心作業系統較弱：需要更多時間建立生命基調與格調。",
      2: "你的核心作業系統穩定：能維持基本的生命基調與格調。",
      3: "你的核心作業系統強：能有效決定一生生命的總體基調與格調。",
      4: "你的核心作業系統極強：能主導一生生命的總體基調與格調。",
    },
    "兄弟": {
      1: "你的戰友與近親資源較少：團隊作戰能力與人脈支援有限。",
      2: "你的戰友與近親資源穩定：有基本的團隊作戰能力與人脈支援。",
      3: "你的戰友與近親資源強：代表團隊作戰能力與最直接的人脈支援。",
      4: "你的戰友與近親資源極強：團隊作戰能力與人脈支援是你的核心優勢。",
    },
    "夫妻": {
      1: "你的親密連結與合夥狀態較弱：與伴侶或長期夥伴的磨合頻率較高。",
      2: "你的親密連結與合夥狀態穩定：能維持基本的伴侶或夥伴關係。",
      3: "你的親密連結與合夥狀態強：反映與伴侶或長期夥伴的良好磨合。",
      4: "你的親密連結與合夥狀態極強：與伴侶或長期夥伴的磨合非常順暢。",
    },
    "子女": {
      1: "你的產出效能與創造力較弱：新計畫、後代或才華的生命力表現有限。",
      2: "你的產出效能與創造力穩定：能維持基本的新計畫與創造力表現。",
      3: "你的產出效能與創造力強：衡量新計畫、後代或才華的生命力表現。",
      4: "你的產出效能與創造力極強：新計畫、後代或才華的生命力表現突出。",
    },
    "財帛": {
      1: "你的金錢獲取與理財邏輯較弱：物質能量流進與留出的路徑不順。",
      2: "你的金錢獲取與理財邏輯穩定：能維持基本的物質能量流動。",
      3: "你的金錢獲取與理財邏輯強：描述物質能量如何流進與留出的路徑。",
      4: "你的金錢獲取與理財邏輯極強：物質能量流進與留出的路徑非常順暢。",
    },
    "疾厄": {
      1: "你的生理硬體與身心基石較弱：維持系統運轉的體力上限與健康底層有限。",
      2: "你的生理硬體與身心基石穩定：能維持基本的體力與健康水平。",
      3: "你的生理硬體與身心基石強：代表維持系統運轉的體力上限與健康底層。",
      4: "你的生理硬體與身心基石極強：體力上限與健康底層是你的核心優勢。",
    },
    "遷移": {
      1: "你的外部接口與外界觀感較弱：向外擴張的空間與社會形象定位有限。",
      2: "你的外部接口與外界觀感穩定：能維持基本的外部形象與擴張能力。",
      3: "你的外部接口與外界觀感強：定義你向外擴張的空間與社會形象定位。",
      4: "你的外部接口與外界觀感極強：向外擴張的空間與社會形象定位非常突出。",
    },
    "僕役": {
      1: "你的社交網絡與眾生緣分較弱：廣大群眾或一般人脈帶來的助力有限。",
      2: "你的社交網絡與眾生緣分穩定：能維持基本的人脈網絡與社交關係。",
      3: "你的社交網絡與眾生緣分強：評估廣大群眾或一般人脈帶來的雜訊與助力。",
      4: "你的社交網絡與眾生緣分極強：廣大群眾或一般人脈帶來的助力是你的優勢。",
    },
    "官祿": {
      1: "你的事業軌道與執行強度較弱：在職場上的衝刺能力與實戰成效有限。",
      2: "你的事業軌道與執行強度穩定：能維持基本的事業表現與執行力。",
      3: "你的事業軌道與執行強度強：決定你在職場上的衝刺能力與實戰成效。",
      4: "你的事業軌道與執行強度極強：在職場上的衝刺能力與實戰成效突出。",
    },
    "田宅": {
      1: "你的資產根基與穩定堡壘較弱：家庭、不動產及防禦陣地有限。",
      2: "你的資產根基與穩定堡壘穩定：能維持基本的家庭與資產基礎。",
      3: "你的資產根基與穩定堡壘強：象徵家庭、不動產及你最後的防禦陣地。",
      4: "你的資產根基與穩定堡壘極強：家庭、不動產及防禦陣地是你的核心優勢。",
    },
    "福德": {
      1: "你的精神底蘊與內心平衡較弱：精神韌性、抗壓性與無形運氣有限。",
      2: "你的精神底蘊與內心平衡穩定：能維持基本的精神狀態與抗壓性。",
      3: "你的精神底蘊與內心平衡強：影響你的精神韌性、抗壓性與無形運氣。",
      4: "你的精神底蘊與內心平衡極強：精神韌性、抗壓性與無形運氣是你的優勢。",
    },
    "父母": {
      1: "你的規則約束與權威互動較弱：與體制、長輩及法規的磨合關係不順。",
      2: "你的規則約束與權威互動穩定：能維持基本的體制與權威關係。",
      3: "你的規則約束與權威互動強：反映你與體制、長輩及法規的良好磨合。",
      4: "你的規則約束與權威互動極強：與體制、長輩及法規的磨合非常順暢。",
    },
  };

  // ====== INIT SELECTORS ======
  // initSelectors 已移至 form-init.js 服务模块
  const FormInit = window.UiServices?.FormInit || {};
  const initSelectors = FormInit.initSelectors || function() {
    console.warn("[ui.js] FormInit service not available, using fallback");
    // Fallback: 基本初始化（简化版）
    const y = document.getElementById("birthYear");
    const m = document.getElementById("birthMonth");
    const d = document.getElementById("birthDay");
    if (y && m && d) {
      const nowY = new Date().getFullYear();
      for (let i = nowY; i >= 1940; i--) y.add(new Option(i + " 年", i));
      for (let i = 1; i <= 12; i++) m.add(new Option(i + " 月", i));
      const days = new Date(1990, 1, 0).getDate();
      for (let i = 1; i <= days; i++) d.add(new Option(i + " 日", i));
    }
  };

  // CEREMONY_PERSONALITY_KEYS 已移至 ceremony-constants.js 常量模块
  const Ceremony = window.UiConstants?.Ceremony || {};
  const CEREMONY_PERSONALITY_KEYS = Ceremony.CEREMONY_PERSONALITY_KEYS || {
    "子": "在世界安靜下來的瞬間，你能看見別人忽略的真相；這份深邃的洞察，讓你在人群中永遠不會被混淆。",
    "丑": "在壓力逼近的瞬間，你反而能站得更穩、扛得更久；這份沈穩的韌性，讓你在人群中永遠不會被混淆。",
    "寅": "在一切還沒開始的瞬間，你已經踏上荒野；這份開拓的爆發力，讓你在人群中永遠不會被混淆。",
    "卯": "在情緒開始流動的瞬間，你讓人安心敞開；這份優雅的共感，讓你在人群中永遠不會被混淆。",
    "辰": "在混亂剛要發生的瞬間，你看見更高的全局；這份遼闊的視野，讓你在人群中永遠不會被混淆。",
    "巳": "在變化降臨的瞬間，你能立刻切換生存模式；這份極致的靈活，讓你在人群中永遠不會被混淆。",
    "午": "在所有目光聚來的瞬間，你自然站在光線中心；這份天生的光芒，讓你在人群中永遠不會被混淆。",
    "未": "在資源開始累積的瞬間，你默默讓荒蕪成形；這份安定的力量，讓你在人群中永遠不會被混淆。",
    "申": "在任務變得複雜的瞬間，你能將所有邏輯重排；這份理性的精準，讓你在人群中永遠不會被混淆。",
    "酉": "在細節浮現的瞬間，你一眼就能找到缺口；這份銳利的品味，讓你在人群中永遠不會被混淆。",
    "戌": "在界線被踩到的瞬間，你明確守護自己的立場；這份堅定的原則，讓你在人群中永遠不會被混淆。",
    "亥": "在靈感閃過的瞬間，你將碎片拼湊成整體；這份超然的直覺，讓你在人群中永遠不會被混淆。",
  };

  // playSyncSound 已移至 sound-service.js 服务模块
  const SoundService = window.UiServices?.SoundService || {};
  const playSyncSound = SoundService.playSyncSound || function() {
    // Fallback: 静默失败
  };

  // ====== 不確定時辰？問卷 Modal（一題一題顯示 + 進度條）======
  // initIdentifyBirthTime 已移至 birth-time-identifier.js 组件
  const BirthTimeIdentifier = window.UiComponents?.BirthTimeIdentifier || {};
  const initIdentifyBirthTime = BirthTimeIdentifier.initIdentifyBirthTime || function() {
    console.warn("[ui.js] BirthTimeIdentifier component not available");
  };
  // ====== BOOT ======
  document.addEventListener("DOMContentLoaded", async () => {
    // 檢查必要依賴
    if (!window.Calc) {
      console.error("[ui.js] window.Calc not found! Make sure calc.js is loaded before ui.js");
      console.error("[ui.js] 檢查依賴狀態:", {
        Calc: !!window.Calc,
        CalcConstants: !!window.CalcConstants,
        CalcHelpers: !!window.CalcHelpers,
        UiServices: !!window.UiServices,
        EventBindings: !!window.UiServices?.EventBindings
      });
      const hint = document.getElementById("hint");
      if (hint) {
        hint.textContent = "系統載入失敗，請刷新頁面重試（錯誤：calc.js 未載入）";
        hint.className = "text-center text-xs text-red-400 italic min-h-[1.2em]";
      }
      // 即使 Calc 未載入，也嘗試綁定按鈕事件（使用 fallback）
      const btnLaunch = document.getElementById("btnLaunch");
      if (btnLaunch) {
        btnLaunch.addEventListener("click", function(e) {
          e.preventDefault();
          e.stopPropagation();
          const hint = document.getElementById("hint");
          if (hint) {
            hint.textContent = "系統載入失敗，請刷新頁面重試";
            hint.className = "text-center text-xs text-red-400 italic min-h-[1.2em]";
          }
          console.error("無法啟動：calc.js 未載入");
        });
      }
      return;
    }
    
    try {
      initSelectors();
      initIdentifyBirthTime();
      syncNavChipActive();
      
      // 使用事件绑定服务模块
      const EventBindings = window.UiServices?.EventBindings || {};
      
      // 綁定啟動按鈕事件
      const btnLaunch = document.getElementById("btnLaunch");
      if (!btnLaunch) {
        console.error("[ui.js] 找不到啟動按鈕 #btnLaunch");
      } else {
        if (EventBindings.bindLaunchButton) {
          console.log("[ui.js] 使用 EventBindings 綁定啟動按鈕");
          EventBindings.bindLaunchButton(calculate);
        } else {
          // Fallback
          console.log("[ui.js] 使用 fallback 方式綁定啟動按鈕");
          btnLaunch.addEventListener("click", function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log("[ui.js] 啟動按鈕被點擊");
            try {
              calculate();
      } catch (err) {
        console.error("[ui.js] calculate: 啟動引擎失敗:", err);
        console.error("[ui.js] calculate: 錯誤堆棧:", err.stack);
        const btn = document.getElementById("btnLaunch");
        const hint = document.getElementById("hint");
        if (btn) {
          btn.disabled = false;
          btn.textContent = "啟動 · 人生戰略引擎";
        }
        if (hint) {
          hint.textContent = "啟動失敗：" + (err.message || "未知錯誤");
          hint.className = "text-center text-xs text-red-400 italic min-h-[1.2em]";
        }
      }
          });
          console.log("[ui.js] 啟動按鈕事件已綁定（fallback）");
        }
      }
      
      await loadDbContent();

      // 绑定五行雷达图和条形图点击事件
      if (EventBindings.bindWuxingClickEvents) {
        EventBindings.bindWuxingClickEvents(openWuxingMeaningLikePalace);
      } else {
        // Fallback
        ["ziweiWxRadar", "surfaceWxRadar", "strategicWxRadar", "ziweiWxBars", "surfaceWxBars", "strategicWxBars"].forEach((id) => {
          const el = document.getElementById(id);
          if (el) {
            el.style.cursor = "pointer";
            el.addEventListener("click", openWuxingMeaningLikePalace);
          }
        });
      }

      // 绑定年龄滑块事件
      if (EventBindings.bindAgeSlider) {
        EventBindings.bindAgeSlider({
          contract,
          getCurrentAge,
          lastGender,
          renderZiwei,
          renderZiweiScores,
          selectPalace,
          computeAllPalaceScores,
          getHoroscopeFromAge,
          syncAgeSliderDisplay,
          selectedPalace,
        });
      } else {
        // Fallback
        const currentAgeSlider = document.getElementById("currentAgeSlider");
        if (currentAgeSlider) {
          currentAgeSlider.addEventListener("input", () => {
            const age = Math.max(1, Math.min(120, Number(currentAgeSlider.value) || 38));
            syncAgeSliderDisplay(age);
            if (!contract?.ziwei) return;
            const bazi = contract.bazi;
            const horoscope = contract.ziwei.horoscope || getHoroscopeFromAge(age, lastGender, contract.ziwei, bazi);
            renderZiwei(contract.ziwei, horoscope, { bazi, gender: lastGender });
            // 傳遞 bazi 和 age 以啟用完整四化系統
            computeAllPalaceScores(contract.ziwei, horoscope, { bazi: contract.bazi, age }).then(function (computedScores) {
              const scores = {
                palaceScores: computedScores,
                elementRatios: window.ziweiScores?.elementRatios || {},
              };
              window.ziweiScores = scores;
              renderZiweiScores(scores, horoscope, contract.ziwei);
              selectPalace(selectedPalace);
            }).catch(function (err) {
              console.error("重新計算宮位分數失敗:", err);
              if (window.ziweiScores?.palaceScores) {
                renderZiweiScores(window.ziweiScores, horoscope, contract.ziwei);
              }
              selectPalace(selectedPalace);
            });
          });
        }
      }

      // 绑定移动端底部面板关闭事件
      if (EventBindings.bindMobileSheetCloseEvents) {
        EventBindings.bindMobileSheetCloseEvents(closePalaceSheet);
      } else {
        // Fallback
        const closeBtn = document.getElementById("palaceSheetClose");
        const backdrop = document.getElementById("palaceSheetBackdrop");
        if (closeBtn) closeBtn.addEventListener("click", function(e) { e.stopPropagation(); closePalaceSheet(); });
        if (backdrop) backdrop.addEventListener("click", closePalaceSheet);
      }

      // 应用移动端优化
      if (window.UiUtils?.MobileHelpers) {
        try {
          window.UiUtils.MobileHelpers.applyMobileOptimizations();
          
          // 初始化紫微网格滑动切换
          const ziweiGrid = document.querySelector('.ziwei-grid, [id*="ziwei"]');
          if (ziweiGrid && window.UiComponents?.PalaceDetail?.selectPalace) {
            window.UiUtils.MobileHelpers.initPalaceGridSwipe(ziweiGrid, (direction, palaceName) => {
              window.UiComponents.PalaceDetail.selectPalace(palaceName);
            });
          }
        } catch (err) {
          console.warn("[ui.js] Mobile optimizations failed:", err);
        }
      }

      console.log("[ui.js] DOMContentLoaded 初始化完成");
    } catch (err) {
      console.error("[ui.js] DOMContentLoaded 初始化失敗:", err);
    }
  });
})();

