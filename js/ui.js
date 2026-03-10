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
  // API_BASE 來自 api-service（其由 Config.API_BASE 初始化）
  const API_BASE = window.UiServices?.ApiService?.API_BASE || window.Config?.API_BASE || "https://bazi-api.billeetw.workers.dev";
  const REMOTE_API_BASE = window.Config?.REMOTE_API_BASE || "https://bazi-api.billeetw.workers.dev";

  async function fetchWithFallback(url, opts) {
    try {
      return await fetch(url, opts);
    } catch (e) {
      const isLocal = /^https?:\/\/localhost(:\d+)?\//.test(url) || /^https?:\/\/127\.0\.0\.1(:\d+)?\//.test(url);
      if (isLocal && (e?.name === "TypeError" || /fetch|network|refused/i.test(String(e)))) {
        const fallbackUrl = url.replace(/^https?:\/\/[^/]+/, REMOTE_API_BASE);
        console.warn("[ui.js] 本地 API 無法連線，改用遠端:", fallbackUrl);
        return fetch(fallbackUrl, opts);
      }
      throw e;
    }
  }

  // DEFAULT_WUXING_MEANINGS 已移至 wuxing-meaning.js 组件

  // ====== STATE ======
  let dbContent = { palaces: {}, stars: {}, tenGods: {}, wuxing: {} };
  let contract = null;
  let selectedPalace = "命宮";
  let lastBirthYear = null;
  let lastGender = null;

  // 宮位環（以命宮為起點的 12 宮順序）
  let PALACE_RING = PALACE_DEFAULT.slice();

  /** 取得當前年齡（虛歲）：一律由出生年月日推算，無預設值 */
  function getCurrentAge() {
    return getCurrentAgeHelper ? getCurrentAgeHelper(lastBirthYear) : null;
  }

  // animateValue, renderBar, toneClass 已移至工具模块

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
        // 與 detailPanel 隱藏斷點一致：md 以下 (768px) 用 Bottom Sheet，否則滾動至右側詳解
        if (window.innerWidth < 768) {
          openPalaceSheet();
        } else {
          const Scroll = window.UiServices?.Scroll;
          if (Scroll && typeof Scroll.scrollToSection === "function") {
            Scroll.scrollToSection("detailPanel", { behavior: "smooth", block: "nearest", allowOnMobile: false });
          } else {
            document.getElementById("detailPanel")?.scrollIntoView({ behavior: "smooth", block: "nearest" });
          }
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
        horoscope: (() => { const h = contract?.ziwei?.horoscope || getHoroscopeFromAge(getCurrentAge(), contract?.ziwei, contract?.bazi, lastGender); return h ? { ...h, activeLimitPalaceName: undefined } : null; })(),
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
    const Scroll = window.UiServices?.Scroll;
    if (Scroll && Scroll.isDesktop && Scroll.isDesktop()) {
      Scroll.scrollToSection("wuxingMeaningSection", { behavior: "smooth", block: "start", allowOnMobile: false });
    }
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
      // Fallback to direct fetch (with zh-TW merge when locale=en)
      try {
        const i18nLocale = (window.I18n && typeof window.I18n.getLocale === "function") ? window.I18n.getLocale() : "zh-TW";
        const locale =
          typeof mapToContentLocale === "function"
            ? mapToContentLocale(i18nLocale)
            : (i18nLocale === "en" ? "en" : i18nLocale === "zh-CN" ? "zh-CN" : "zh-TW");
        const r = await fetchWithFallback(`${API_BASE}/content/2026?locale=${encodeURIComponent(locale)}`, { method: "GET" });
        let j = await r.json();
        if (locale === "en" && j?.ok) {
          const r2 = await fetchWithFallback(`${API_BASE}/content/2026?locale=zh-TW`, { method: "GET" });
          const j2 = await r2.json();
          if (j2?.ok) {
            ["palaces", "stars", "tenGods", "wuxing"].forEach((k) => {
              if (j2[k] && typeof j2[k] === "object") {
                j[k] = Object.assign({}, j2[k], j[k] || {});
              }
            });
          }
        }
        if (j?.ok) dbContent = j;
      } catch (e) {
        console.warn("loadDbContent failed", e);
      }
    }
    renderWuxingMeaningBox(dbContent);
    var i18nLoc = (typeof window.inferI18nLocale === "function" ? window.inferI18nLocale() : null) || (window.I18n && typeof window.I18n.getLocale === "function" ? window.I18n.getLocale() : "zh-TW");
    var contentLoc = (typeof window.inferContentLocale === "function" ? window.inferContentLocale(i18nLoc) : null) || (i18nLoc === "en" ? "en" : i18nLoc === "zh-CN" ? "zh-CN" : "zh-TW");
    if (window.__debugOverlay && typeof window.__debugOverlay.update === "function") {
      window.__debugOverlay.update({ contentOk: !!dbContent, contentLocaleUsed: contentLoc });
    }
  }

  // syncNavChipActive, initDashboardContentTransition 已移至 navigation.js 服务模块
  const Navigation = window.UiServices?.Navigation || {};
  const syncNavChipActive = Navigation.syncNavChipActive || function() {
    const hash = (window.location.hash || "").trim();
    document.querySelectorAll(".nav-chip[href^=\"#\"]").forEach((a) => {
      const href = (a.getAttribute("href") || "").trim();
      if (href === hash) a.setAttribute("aria-current", "page");
      else a.removeAttribute("aria-current");
    });
  };
  const initDashboardContentTransition = Navigation.initDashboardContentTransition || function() {
    console.warn("[ui.js] Navigation service not available, using fallback");
  };

  /**
   * Show/hide chart language mismatch banner.
   * When UI locale is EN but chart was computed in Chinese, show banner prompting recalc.
   */
  function updateChartLangMismatchBanner() {
    const banner = document.getElementById("chartLangMismatchBanner");
    const textEl = document.getElementById("chartLangMismatchText");
    const btnEl = document.getElementById("chartLangMismatchRecalc");
    if (!banner || !textEl || !btnEl) return;

    const i18nLocale = (window.I18n && typeof window.I18n.getLocale === "function") ? window.I18n.getLocale() : "zh-TW";
    const chartLang = window.currentChartLanguage || "zh-TW";

    if (i18nLocale.startsWith("en") && chartLang !== "en-US") {
      banner.classList.remove("hidden");
      textEl.textContent = (window.I18n && typeof window.I18n.t === "function") ? window.I18n.t("chartLangMismatch.bannerEn") : "This chart is in Chinese. Recalculate to view English.";
      btnEl.textContent = (window.I18n && typeof window.I18n.t === "function") ? window.I18n.t("chartLangMismatch.recalcEn") : "Recalculate in English";
    } else {
      banner.classList.add("hidden");
    }
  }

  /** 儀式感：資料渲染完成後捲至頁面最上方，跨瀏覽器穩定 */
  function scheduleScrollToTop() {
    setTimeout(function () {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    }, 80);
  }

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

    const PLACEHOLDER_VAL = "__";
    if (!skipStartupSequence && typeof window.showStartupSequence === "function" && timeMode === "shichen" && shichen && shichen !== PLACEHOLDER_VAL) {
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
        btn.disabled = false;
        btn.textContent = original;
        if (hint) {
          hint.textContent = errorMsg;
          hint.className = "text-center text-xs text-red-400 italic min-h-[1.2em]";
        }
        return;
      }
      
      console.log("[ui.js] calculate: 驗證通過，開始解析時間");

      let hourForResolve = vh;
      let minForResolve = vmin;
      if (timeMode === "exact") {
        const hVal = (document.getElementById("birthHour")?.value || "").trim();
        const minVal = (document.getElementById("birthMinute")?.value || "").trim();
        if (hVal === PLACEHOLDER_VAL || hVal === "" || !Number.isFinite(vh)) hourForResolve = 12;
        if (minVal === PLACEHOLDER_VAL || minVal === "" || !Number.isFinite(vmin)) minForResolve = 0;
      }
      const resolved = resolveBirthTime({ mode: timeMode, hour: hourForResolve, minute: minForResolve, shichen, shichenHalf });
      console.log("[ui.js] calculate: 時間解析結果:", resolved);

      btn.disabled = true;
      btn.textContent = (window.I18n?.t("ui.calculating") || "計算中…");
      if (hint) {
        hint.textContent = (window.I18n?.t("ui.connecting") || "正在連線後端計算（八字＋紫微＋流月＋十神）…");
      }
      console.log("[ui.js] calculate: 按鈕狀態已更新為「計算中」");

      // 子時歸日（隔夜晚子時）：晚子(23:00–24:00) 歸次日，早子(00:00–01:00) 歸本日
      let apiYear = vy;
      let apiMonth = vm;
      let apiDay = vd;
      if (resolved.hour === 23) {
        const next = new Date(vy, vm - 1, vd + 1);
        apiYear = next.getFullYear();
        apiMonth = next.getMonth() + 1;
        apiDay = next.getDate();
        console.log("[ui.js] 晚子時歸次日:", vy + "/" + vm + "/" + vd, "→", apiYear + "/" + apiMonth + "/" + apiDay);
      }

      // 統一使用 ApiService（entry.js 已載入，無 fallback）
      const apiService = window.UiServices?.ApiService;
      if (!apiService || typeof apiService.computeAll !== "function") {
        throw new Error("ApiService 未載入，請重新整理頁面");
      }
      const payload = await apiService.computeAll({
        year: apiYear,
        month: apiMonth,
        day: apiDay,
        hour: resolved.hour,
        minute: resolved.minute,
        gender: gender || undefined,
      });

      console.log("compute/all payload:", payload);
      console.log("chartId from payload:", payload.chartId);

      // Store chart language for mismatch banner (EN mode + chart in Chinese)
      window.currentChartLanguage = payload.language || "zh-TW";
      if (window.__debugOverlay && typeof window.__debugOverlay.update === "function") {
        window.__debugOverlay.update({ payloadLanguage: payload.language || "zh-TW" });
      }

      contract = payload.features;
      if (!contract || contract.version !== "strategic_features_v1") {
        throw new Error("features 格式錯誤（不是 strategic_features_v1）");
      }
      // Worker 回傳的 astrolabe 語系，供轉繁邏輯判斷；無則預設 zh-CN（保守，照舊轉繁）
      contract.astrolabeLanguage = payload.language || "zh-CN";
      window.contract = contract;

      // 身宮在 12 宮報告（前端輕量卡片 + 命書 Pro 用）
      if (window.BodyPalaceEngine && contract.ziwei) {
        try {
          const bodyPalaceZh = window.BodyPalaceEngine.findShengongPalace(contract.ziwei) || "福德";
          contract.bodyPalaceReport = window.BodyPalaceEngine.computeBodyPalaceReport({
            lifePalace: "命宮",
            bodyPalace: bodyPalaceZh,
            doubleJi: null,
          });
        } catch (e) {
          console.warn("[ui.js] bodyPalaceReport 計算失敗", e);
        }
      }

      // M7 戰略聯動：先算 overlay / hidden_merge / body_move_hint（無 overlap 時 ji_clash 為空；有 overlap 時由 calc.js 覆寫）
      if (window.StrategicLinkEngine && contract.ziwei && contract.bodyPalaceReport) {
        try {
          const overlap = window.BaziApp?.State?.getState("overlapAnalysis") ?? window.overlapAnalysis ?? null;
          const ctx = window.StrategicLinkEngine.buildStrategicContext(
            contract.ziwei,
            overlap,
            contract.bodyPalaceReport,
            contract.userBehavior,
            contract.luEvents
          );
          contract.strategicLinks = window.StrategicLinkEngine.buildStrategicLinks(ctx);
        } catch (e) {
          console.warn("[ui.js] strategicLinks 計算失敗", e);
        }
      }

      lastBirthYear = vy;
      lastGender = gender;

      const chartId = payload.chartId || contract.chartId || null;
      const bazi = contract.bazi;
      const ziwei = contract.ziwei;

      if (!bazi) throw new Error("後端未回傳 bazi");

      // 使用統計：fire-and-forget 紀錄（年齡、性別、語言）
      try {
        const logPayload = {
          birth_year: vy,
          gender: (gender === "F" || String(gender).toLowerCase() === "female") ? "female" : "male",
          language: payload.language || (window.I18n?.getLocale?.() || "zh-TW"),
        };
        const urlLogUsage = `${API_BASE}/api/log-usage`;
        console.log("📡 API REQUEST", urlLogUsage, JSON.stringify(logPayload, null, 2));
        fetch(urlLogUsage, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(logPayload),
          keepalive: true,
        }).catch(() => {});
      } catch (_) {}

      // GA4 自訂事件：calculation_complete
      try {
        const gaId = window.Config?.GA_MEASUREMENT_ID;
        if (gaId && typeof window.gtag === "function") {
          const genderVal = (gender === "F" || String(gender).toLowerCase() === "female") ? "female" : "male";
          const lang = payload.language || (window.I18n?.getLocale?.() || "zh-TW");
          const yearRange = vy ? (vy >= 2000 ? "2000s" : vy >= 1990 ? "1990s" : vy >= 1980 ? "1980s" : "pre-1980") : "unknown";
          window.gtag("event", "calculation_complete", {
            birth_year_range: yearRange,
            gender: genderVal,
            language: lang,
          });
        }
      } catch (_) {}

      // 若後端未回傳 liuyue2026，使用前端 fallback 生成 12 月資料
      if (!bazi.liuyue2026 || !bazi.liuyue2026.bounds?.length) {
        const buildFallback = window.Calc?.buildLiuyue2026Fallback;
        if (buildFallback && typeof buildFallback === "function") {
          contract.bazi.liuyue2026 = buildFallback(bazi);
          console.log("[ui.js] 使用 fallback 生成流月 2026 資料");
        }
      }

      // ===== 五行生剋管線（四柱 → 向量 → 生剋報告） =====
      if (bazi) {
        let wuxingSet = false;
        if (window.WuxingFlowPipeline) {
          try {
            // 簡單快取 KB，避免每次重載
            if (!window.__wuxingFlowKB) {
              window.__wuxingFlowKB = await window.WuxingFlowPipeline.loadKB("/data/wuxing");
            }
            const kb = window.__wuxingFlowKB;
            const pillars = window.WuxingFlowPipeline.buildPillarsFromBazi(bazi);
            if (!pillars) {
              console.warn("[WuxingFlowPipeline] 無法從 bazi 組出 pillars，改用天干 fallback。當前 bazi:", bazi);
            }
            if (pillars) {
              const locale = (window.I18n && typeof window.I18n.getLocale === "function") ? window.I18n.getLocale() : "zh-TW";
              const out = window.WuxingFlowPipeline.runPipeline(pillars, kb, { stem_w: 1.0, branch_w: 1.0, locale });
              // 將報告掛到 contract.bazi 與全域，供戰略看板或其他模組使用
              contract.bazi.wuxingFlowReport = out.report;
              window.wuxingFlowReport = out.report;
              // 從管線結果填充 surface/strategic，供五行條與雷達圖顯示
              const toZh = { wood: "木", fire: "火", earth: "土", metal: "金", water: "水" };
              const vRaw = out.v_raw || {};
              const vSeason = out.v_season || {};
              contract.bazi.wuxing = contract.bazi.wuxing || {};
              contract.bazi.wuxing.surface = Object.fromEntries(Object.entries(toZh).map(([en, zh]) => [zh, Number(vRaw[en]) || 0]));
              contract.bazi.wuxing.strategic = Object.fromEntries(Object.entries(toZh).map(([en, zh]) => [zh, Number(vSeason[en]) || 0]));
              contract.bazi.wuxing.maxStrategic = Math.max(0.01, ...Object.values(contract.bazi.wuxing.strategic));
              // 計算十神主軸（日干 vs 月干，月令影響最大）
              const dayStem = (pillars.day && pillars.day.stem) || "";
              const monthStem = (pillars.month && pillars.month.stem) || "";
              if (dayStem && monthStem) {
                const tengod = (window.CalcHelpers && window.CalcHelpers.tenGodFromStems) ? window.CalcHelpers.tenGodFromStems(dayStem, monthStem) : null;
                if (tengod) {
                  contract.bazi.tenGod = contract.bazi.tenGod || {};
                  contract.bazi.tenGod.dominant = tengod;
                }
              }
              console.log("[WuxingFlowPipeline] report:", out.report);
              window.__wuxingFlowUsedFallback = false; // 診斷：Pipeline 成功
              wuxingSet = true;
            }
          } catch (e) {
            console.warn("[WuxingFlowPipeline] 執行失敗，改用天干 fallback：", e);
            delete window.__wuxingFlowKB; // 清除快取以便下次重試
          }
        }
        // Fallback：從 bazi.display 或 bazi.year/month/day/hour 天干計數，確保五行條至少有數值（loadKB 404 或 pillars null 時）
        if (!wuxingSet) {
          window.__wuxingFlowUsedFallback = true; // 正式站診斷：在 Console 打 __wuxingFlowUsedFallback 可檢查是否走 fallback
          const stemToElem = { "甲": "木", "乙": "木", "丙": "火", "丁": "火", "戊": "土", "己": "土", "庚": "金", "辛": "金", "壬": "水", "癸": "水" };
          const toZh = ["木", "火", "土", "金", "水"];
          const counts = { "木": 0, "火": 0, "土": 0, "金": 0, "水": 0 };
          let stems = [];
          const d = bazi.display;
          if (d && (d.yG || d.mG || d.dG)) {
            stems = [d.yG, d.mG, d.dG, d.hG].filter(Boolean);
          } else if (bazi.year || bazi.month || bazi.day) {
            stems = [bazi.year?.stem, bazi.month?.stem, bazi.day?.stem, bazi.hour?.stem].filter(Boolean);
          }
          stems.forEach(function (s) {
            const zh = stemToElem[s];
            if (zh) counts[zh]++;
          });
          const raw = counts;
          const maxCount = Math.max(0.01, ...Object.values(counts));
          contract.bazi.wuxing = contract.bazi.wuxing || {};
          contract.bazi.wuxing.surface = Object.fromEntries(toZh.map(function (zh) { return [zh, raw[zh] || 0]; }));
          contract.bazi.wuxing.strategic = Object.fromEntries(toZh.map(function (zh) { return [zh, maxCount > 0 ? (raw[zh] || 0) / maxCount : 0]; }));
          contract.bazi.wuxing.maxStrategic = 1; // strategic 為 0–1  normalized，renderBar 以 v/max 縮放
          // fallback 也計算十神（日干 vs 月干），供年度主軸與交叉洞察使用
          const dayStem = (d && d.dG) || bazi.day?.stem;
          const monthStem = (d && d.mG) || bazi.month?.stem;
          if (dayStem && monthStem && window.CalcHelpers?.tenGodFromStems) {
            const tengod = window.CalcHelpers.tenGodFromStems(dayStem, monthStem);
            if (tengod) {
              contract.bazi.tenGod = contract.bazi.tenGod || {};
              contract.bazi.tenGod.dominant = tengod;
            }
          }
        }
      }

      // 使用 API 服务模块获取宫位分数
      let ziweiScores = null;
      if (apiService) {
        ziweiScores = await apiService.getPalaceScores(chartId);
        if (ziweiScores) {
          window.ziweiScores = ziweiScores; // debug
          console.log("ziweiScores from API:", ziweiScores);
        }
      } else {
        // Fallback to direct fetch（bazi-api 未實作，跳過）
        if (chartId && window.Config?.SUPPORTS_CHARTS_SCORES) {
          try {
            const scoreResp = await fetchWithFallback(`${API_BASE}/charts/${encodeURIComponent(chartId)}/scores`, { method: "GET" });
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
      console.log("[ui.js] calculate: 準備更新 UI，進入系統");
      // 使用计算流程服务模块更新 UI
      if (CalculationFlow.updateDashboardUI) {
        console.log("[ui.js] calculate: 使用 CalculationFlow.updateDashboardUI");
        CalculationFlow.updateDashboardUI();
      } else {
        console.log("[ui.js] calculate: 使用 fallback UI 更新");
        // Fallback
        const sysEl = document.getElementById("system");
        if (sysEl) {
          sysEl.classList.remove("hidden");
          console.log("[ui.js] calculate: system 元素已顯示");
        }
        document.body.classList.add("dashboard-visible");
        const navEl = document.getElementById("workspaceNav");
        const inputEl = document.getElementById("inputCard");
        if (navEl) {
          navEl.classList.remove("hidden");
          console.log("[ui.js] calculate: workspaceNav 已顯示");
        }
        if (inputEl) {
          inputEl.classList.add("hidden");
          console.log("[ui.js] calculate: inputCard 已隱藏");
        }
      }
      console.log("[ui.js] calculate: UI 更新完成");

      syncNavChipActive();
      initDashboardContentTransition();

      // 手機章節折疊、桌機全部展開
      if (window.UiServices?.SectionCollapse?.initSectionCollapse) {
        window.UiServices.SectionCollapse.initSectionCollapse();
      }

      // Chart language mismatch banner (EN mode + chart in Chinese)
      updateChartLangMismatchBanner();
      
      // 綁定首頁按鈕
      if (Navigation.bindHomeButton) {
        Navigation.bindHomeButton();
      }

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
      
      // 渲染八字和五行数据（含道家宇宙區塊、五行一句話）
      if (DataRenderer.renderBaziData) {
        DataRenderer.renderBaziData({
          bazi,
          renderPillars,
          renderBar,
          renderRadarChart,
          renderFiveElementComment,
        });
      } else {
        // Fallback（含五行生剋卡片，確保上線後即使 DataRenderer 未載入也會更新）
        renderPillars(bazi);
        renderBar("surfaceWxBars", bazi.wuxing?.surface, 4);
        renderRadarChart("surfaceWxRadar", bazi.wuxing?.surface);
        renderFiveElementComment("surfaceWxComment", bazi.wuxing?.surface, "surface");
        renderBar("strategicWxBars", bazi.wuxing?.strategic, bazi.wuxing?.maxStrategic || 1);
        renderRadarChart("strategicWxRadar", bazi.wuxing?.strategic);
        renderFiveElementComment("strategicWxComment", bazi.wuxing?.strategic, "strategic");
        var flowCardEl = document.getElementById("wuxingFlowCard");
        if (flowCardEl) {
          var wuxingReport = bazi.wuxingFlowReport || window.wuxingFlowReport || null;
          var wxFb = { title: "五行生剋診斷", s1: "一、氣勢", s2: "二、相生優勢", s3: "三、相生瓶頸", s4: "四、最大制衡壓力", s5: "五、下一步我們能為你做什麼？", btn: "預約諮詢", noReport: "尚未取得生剋報告，請先完成計算；若問題持續，請檢查 WuxingFlowPipeline 設定。" };
          var wuxTitle = (window.I18n && typeof window.I18n.t === "function") ? window.I18n.t("wuxing.title") : wxFb.title;
          var ws1 = (window.I18n && typeof window.I18n.t === "function") ? window.I18n.t("wuxing.section1") : wxFb.s1;
          var ws2 = (window.I18n && typeof window.I18n.t === "function") ? window.I18n.t("wuxing.section2") : wxFb.s2;
          var ws3 = (window.I18n && typeof window.I18n.t === "function") ? window.I18n.t("wuxing.section3") : wxFb.s3;
          var ws4 = (window.I18n && typeof window.I18n.t === "function") ? window.I18n.t("wuxing.section4") : wxFb.s4;
          var ws5 = (window.I18n && typeof window.I18n.t === "function") ? window.I18n.t("wuxing.section5") : wxFb.s5;
          var wuxBtn = (window.I18n && typeof window.I18n.t === "function") ? window.I18n.t("wuxing.consultButton") : wxFb.btn;
          var wuxNoReport = (window.I18n && typeof window.I18n.t === "function") ? window.I18n.t("wuxing.noReport") : wxFb.noReport;
          if (!wuxingReport) {
            flowCardEl.innerHTML = "<p class=\"text-slate-500 italic\">" + wuxNoReport.replace(/</g, "&lt;").replace(/>/g, "&gt;") + "</p>";
          } else {
            function esc(s) { if (s == null) return ""; return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\"/g, "&quot;"); }
            var cardLines = [];
            cardLines.push("<h4 class=\"text-amber-200 font-semibold mb-2\">" + esc(wuxTitle) + "</h4>");
            if (wuxingReport.momentumText) cardLines.push("<p class=\"text-amber-300/90 font-medium\">" + esc(ws1) + "</p><p class=\"text-slate-200 pl-2 whitespace-pre-line\">" + esc(wuxingReport.momentumText) + "</p>");
            else if (wuxingReport.chief_complaint) cardLines.push("<p class=\"text-amber-300/90 font-medium\">" + esc(ws1) + "</p><p class=\"text-slate-200 pl-2 whitespace-pre-line\">" + esc(wuxingReport.chief_complaint) + "</p>");
            if (wuxingReport.genPositiveText) cardLines.push("<p class=\"text-amber-300/90 font-medium mt-2\">" + esc(ws2) + "</p><p class=\"text-slate-200 pl-2 whitespace-pre-line\">" + esc(wuxingReport.genPositiveText) + "</p>");
            if (wuxingReport.bottleneckText) cardLines.push("<p class=\"text-amber-300/90 font-medium mt-2\">" + esc(ws3) + "</p><p class=\"text-slate-200 pl-2 whitespace-pre-line\">" + esc(wuxingReport.bottleneckText) + "</p>");
            if (wuxingReport.controlText) cardLines.push("<p class=\"text-amber-300/90 font-medium mt-2\">" + esc(ws4) + "</p><p class=\"text-slate-200 pl-2 whitespace-pre-line\">" + esc(wuxingReport.controlText) + "</p>");
            if (wuxingReport.predictionText) cardLines.push("<p class=\"text-amber-300/90 font-medium mt-2\">" + esc(ws5) + "</p><p class=\"text-slate-400 text-xs pl-2 whitespace-pre-line leading-relaxed\">" + esc(wuxingReport.predictionText) + "</p>");
            else if (wuxingReport.falsifiable_predictions) cardLines.push("<p class=\"text-amber-300/90 font-medium mt-2\">" + esc(ws5) + "</p><p class=\"text-slate-400 text-xs pl-2 whitespace-pre-line\">" + esc(wuxingReport.falsifiable_predictions) + "</p>");
            cardLines.push("<p class=\"mt-3 pl-2\"><a href=\"" + (window.Config?.SITE_URL || "https://www.17gonplay.com") + "/consultation\" target=\"_blank\" rel=\"noopener noreferrer\" class=\"inline-block px-4 py-2 rounded-lg bg-amber-500/90 text-slate-900 font-medium hover:bg-amber-400 transition\">" + esc(wuxBtn) + "</a></p>");
            flowCardEl.innerHTML = cardLines.join("");
          }
        }
        // Fallback：能量結構分析區塊 + 五行一句話
        const yinYangBarEl = document.getElementById("yinYangBar");
        const yangLabelEl = document.getElementById("yinYangYangLabel");
        const yinLabelEl = document.getElementById("yinYangYinLabel");
        const structureLabelEl = document.getElementById("yinYangStructureLabel");
        const baseTextEl = document.getElementById("yinYangBaseText");
        const mainShishenEl = document.getElementById("yinYangMainShishen");
        const mainShishenTextEl = document.getElementById("yinYangMainShishenText");
        const crossInsightEl = document.getElementById("yinYangCrossInsight");
        const wuxingOneLinerEl = document.getElementById("wuxingOneLiner");
        const WuxingOneLiner = window.UiUtils?.WuxingOneLiner;
        const YinyangAdvanced = window.UiUtils?.YinyangAdvanced;
        const dominant = (bazi.tenGod?.dominant || "").trim() || "—";
        if (WuxingOneLiner && bazi.wuxing?.strategic) {
          const { yangPct, yinPct } = WuxingOneLiner.computeYinYangFromWuxing(bazi.wuxing.strategic);
          if (yinYangBarEl) yinYangBarEl.style.width = yangPct + "%";
          if (yangLabelEl) yangLabelEl.textContent = "陽比例：" + yangPct + "%";
          if (yinLabelEl) yinLabelEl.textContent = "陰比例：" + yinPct + "%";
          const oneLiner = WuxingOneLiner.generateWuxingOneLiner(bazi.wuxing.strategic);
          if (wuxingOneLinerEl) { wuxingOneLinerEl.textContent = oneLiner; wuxingOneLinerEl.classList.remove("hidden"); }
          if (YinyangAdvanced && YinyangAdvanced.buildAdvancedAnalysis) {
            const analysis = YinyangAdvanced.buildAdvancedAnalysis(yangPct, dominant);
            if (structureLabelEl) structureLabelEl.textContent = "結構定位：" + ((analysis.structureLabel || "").replace(/型+$/, "") || "—") + "型";
            if (baseTextEl) baseTextEl.textContent = analysis.baseText;
            if (mainShishenEl) mainShishenEl.textContent = analysis.mainShishen;
            if (mainShishenTextEl) mainShishenTextEl.textContent = analysis.mainShishenText;
            if (crossInsightEl) crossInsightEl.textContent = analysis.crossInsight;
          }
        }
      }

      // 渲染太歲狀態卡（傳 birth_date 與命盤日一致，含子時歸日）
      if (window.UiComponents?.TaisuiCard?.renderTaisuiCard) {
        const birthDate =
          Number.isFinite(apiYear) && Number.isFinite(apiMonth) && Number.isFinite(apiDay) && apiYear >= 1900 && apiYear <= 2100
            ? `${apiYear}-${String(apiMonth).padStart(2, "0")}-${String(apiDay).padStart(2, "0")}`
            : null;
        window.UiComponents.TaisuiCard.renderTaisuiCard(apiYear, 2026, { birth_date: birthDate });
      }

      // 渲染十神指令
      if (DataRenderer.renderTenGodCommand) {
        DataRenderer.renderTenGodCommand({ bazi, dbContent });
      } else {
        // Fallback
        const dominant = (bazi.tenGod?.dominant || "").trim();
        var ContentUtils = window.UiUtils?.ContentUtils;
        var cmdRaw = ContentUtils && typeof ContentUtils.getContentValue === "function"
          ? ContentUtils.getContentValue(dbContent, "tenGods", dominant, null)
          : (dominant && dbContent.tenGods?.[dominant] ? dbContent.tenGods[dominant] : null);
        if (cmdRaw && cmdRaw.startsWith("(missing:")) cmdRaw = null;
        const cmd = cmdRaw || "";
        const tenGodEl = document.getElementById("tenGodCommand");
        if (tenGodEl) {
          tenGodEl.textContent = cmd || `（資料庫尚未填入「${dominant || "—"}」的十神指令。你可以先在 ten_god_analysis 補上 2026 內容。）`;
        }
      }

      // 流年／四化（小限已移除，不再傳 activeLimitPalaceName）
      const rawHoroscope = ziwei?.horoscope || getHoroscopeFromAge(getCurrentAge(), ziwei, bazi, lastGender);
      const horoscope = rawHoroscope ? { ...rawHoroscope, activeLimitPalaceName: undefined } : null;

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
          var sysEl = document.getElementById("system");
          if (sysEl) sysEl.classList.remove("dashboard-skeleton");
          scheduleScrollToTop();
        }).catch(() => {
          var sysEl = document.getElementById("system");
          if (sysEl) sysEl.classList.remove("dashboard-skeleton");
          scheduleScrollToTop();
        });
      } else {
        // Fallback
        renderZiwei(ziwei, horoscope, { bazi, gender: lastGender });
        const age = getCurrentAge();
        computeAllPalaceScores(ziwei, horoscope, { bazi, age }).then(function (result) {
          const { scores: computedScores, elementRatios: computedRatios } = (result && typeof result === "object" && result.scores != null)
            ? result
            : { scores: result, elementRatios: {} };
          const scores = {
            palaceScores: computedScores,
            elementRatios: computedRatios || ziweiScores?.elementRatios || {},
          };
          window.ziweiScores = scores;
          renderZiweiScores(scores, horoscope, ziwei);
          renderLiuyue(bazi);
          updateAnnualTactics(bazi, horoscope, ziwei);
          if (ziwei) selectPalace("命宮");
          var sysEl = document.getElementById("system");
          if (sysEl) sysEl.classList.remove("dashboard-skeleton");
          scheduleScrollToTop();
        }).catch(function (err) {
          console.error("計算宮位分數失敗:", err);
          if (ziweiScores?.palaceScores) {
            renderZiweiScores(ziweiScores, horoscope, ziwei);
          }
          renderLiuyue(bazi);
          updateAnnualTactics(bazi, horoscope, ziwei);
          if (ziwei) selectPalace("命宮");
          var sysEl = document.getElementById("system");
          if (sysEl) sysEl.classList.remove("dashboard-skeleton");
          scheduleScrollToTop();
        });
      }

      // 初始戰術建議（傳入 ziwei 以顯示命主/身主、身宮在XX宮）
      if (CalculationFlow.renderTactics) {
        CalculationFlow.renderTactics({
          bazi,
          dbContent,
          ziweiPalaceMetadata: null,
          liuyueData: null,
          ziwei,
          bodyPalaceReport: contract?.bodyPalaceReport ?? null,
        });
      } else {
        // Fallback
        const dom = (bazi?.tenGod?.dominant || "").trim();
        var ContentUtils = window.UiUtils?.ContentUtils;
        var tenGodRaw = ContentUtils && typeof ContentUtils.getContentValue === "function"
          ? ContentUtils.getContentValue(dbContent, "tenGods", dom, null)
          : (dom && dbContent.tenGods?.[dom] ? dbContent.tenGods[dom] : null);
        if (tenGodRaw && tenGodRaw.startsWith("(missing:")) tenGodRaw = null;
        const tenGodText = tenGodRaw || "";
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
        
        // 使用計算流程服務渲染戰術建議（傳入 ziwei、bodyPalaceReport 以顯示命主/身主、身宮在XX宮）
        if (CalculationFlow.renderTactics) {
          const c = window.contract || null;
          CalculationFlow.renderTactics({
            bazi,
            dbContent,
            ziweiPalaceMetadata,
            liuyueData,
            ziwei,
            bodyPalaceReport: c?.bodyPalaceReport ?? null,
          });
        } else {
          // Fallback
          const dom = (bazi?.tenGod?.dominant || "").trim();
          var ContentUtils = window.UiUtils?.ContentUtils;
          var tenGodRaw = ContentUtils && typeof ContentUtils.getContentValue === "function"
            ? ContentUtils.getContentValue(dbContent, "tenGods", dom, null)
            : (dom && dbContent.tenGods?.[dom] ? dbContent.tenGods[dom] : null);
          if (tenGodRaw && tenGodRaw.startsWith("(missing:")) tenGodRaw = null;
          const tenGodText = tenGodRaw || "";
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

      // 移除計算後自動跳至 ws-summary，避免打斷使用者閱讀位置

      // 整合反馈系统到界面
      if (chartId && window.UiComponents?.FeedbackIntegration) {
        try {
          window.UiComponents.FeedbackIntegration.integrateFeedback(chartId, {
            showInSummary: true,
            showInNav: true,
            showInBottomNav: true,
            showPrompts: false,
            showDelayedPrompt: false,
          });
        } catch (err) {
          console.error("[ui.js] 反馈系统整合失败:", err);
          if (window.UiComponents?.FeedbackWidget) {
            window.UiComponents.FeedbackWidget.createFeedbackButton({ chartId });
          }
        }
      } else if (chartId && window.UiComponents?.FeedbackWidget) {
        try {
          window.UiComponents.FeedbackWidget.createFeedbackButton({ chartId });
        } catch (err) {
          console.error("[ui.js] Failed to create feedback button:", err);
        }
      }

      // 整合分享按鈕到導覽與底部導覽
      if (window.UiComponents?.ShareButtons) {
        try {
          window.UiComponents.ShareButtons.integrateShare({
            showInNav: true,
            showInBottomNav: true,
            showInSummary: true,
          });
        } catch (err) {
          console.error("[ui.js] 分享按鈕整合失敗:", err);
        }
      }
    } catch (e) {
      console.error(e);
      const msg = String(e?.message || e);
      const isNetworkError = /failed to fetch|network|load failed|connection refused|timeout/i.test(msg) || e?.name === "TypeError";
      const isServerBusy = /伺服器暫時忙碌|資源已滿|503|Worker exceeded resource limits/i.test(msg);
      const userMsg = isNetworkError
        ? "無法連線至伺服器，請檢查網路後再試。"
        : isServerBusy
          ? msg
          : "系統忙碌中或資料有誤，請稍後再試。\n\n詳細：" + msg;
      alert(userMsg);
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

  // ====== 不確定時辰？問卷 Modal ======
  const BirthTimeIdentifier = window.UiComponents?.BirthTimeIdentifier || {};
  const initIdentifyBirthTime = BirthTimeIdentifier.initIdentifyBirthTime || function() {
    console.warn("[ui.js] BirthTimeIdentifier component not available");
  };

  function saveFormForLocaleSwitch() {
    const y = document.getElementById("birthYear");
    const m = document.getElementById("birthMonth");
    const d = document.getElementById("birthDay");
    if (!y || !m || !d) return false;
    const vy = parseInt(y.value, 10);
    const vm = parseInt(m.value, 10);
    const vd = parseInt(d.value, 10);
    if (!vy || !vm || !vd) return false;
    const data = {
      year: vy, month: vm, day: vd,
      hour: parseInt(document.getElementById("birthHour")?.value || "0", 10),
      minute: parseInt(document.getElementById("birthMinute")?.value || "0", 10),
      gender: (document.getElementById("gender")?.value || "").trim(),
      timeMode: (document.getElementById("timeMode")?.value || "exact").trim(),
      shichen: (document.getElementById("birthShichen")?.value || "").trim(),
      shichenHalf: (document.getElementById("birthShichenHalf")?.value || "upper").trim(),
    };
    try {
      sessionStorage.setItem("localeSwitchFormData", JSON.stringify(data));
      return true;
    } catch (e) {
      return false;
    }
  }

  function restoreFormAfterLocaleSwitch() {
    try {
      const raw = sessionStorage.getItem("localeSwitchFormData");
      if (!raw) return;
      const data = JSON.parse(raw);
      if (!data.year || !data.month || !data.day) return;
      sessionStorage.removeItem("localeSwitchFormData");
      const setVal = (id, v) => {
        const el = document.getElementById(id);
        if (el) el.value = String(v ?? "");
      };
      setVal("birthYear", data.year);
      setVal("birthMonth", data.month);
      setVal("birthDay", data.day);
      setVal("birthHour", data.hour ?? 0);
      setVal("birthMinute", data.minute ?? 0);
      setVal("gender", data.gender || "M");
      setVal("timeMode", data.timeMode || "exact");
      setVal("birthShichen", data.shichen || "子");
      setVal("birthShichenHalf", data.shichenHalf || "upper");
      const tm = document.getElementById("timeMode");
      if (tm) tm.dispatchEvent(new Event("change", { bubbles: true }));
      setTimeout(() => {
        if (typeof window.reloadContentAndRecalc === "function") {
          window.reloadContentAndRecalc();
        } else if (typeof window.runCalculation === "function") {
          window.runCalculation();
        }
      }, 500);
    } catch (e) {
      if (window.console) window.console.warn("[ui.js] restoreFormAfterLocaleSwitch failed:", e);
    }
  }

  function bindLangSwitcher() {
    document.querySelectorAll(".lang-btn, .lang-btn-mobile").forEach((btn) => {
      const lang = btn.getAttribute("data-lang");
      if (!lang) return;
      btn.addEventListener("click", () => {
        saveFormForLocaleSwitch();
        if (window.I18n && typeof window.I18n.setLocale === "function") {
          window.I18n.setLocale(lang, { reload: true });
        }
      });
    });
  }

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
        hint.textContent = (window.I18n?.t("ui.loadErrorDetail") || "系統載入失敗，請刷新頁面重試（錯誤：calc.js 未載入）");
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
            hint.textContent = (window.I18n?.t("ui.loadError") || "系統載入失敗，請刷新頁面重試");
            hint.className = "text-center text-xs text-red-400 italic min-h-[1.2em]";
          }
          console.error("無法啟動：calc.js 未載入");
        });
      }
      return;
    }
    
    try {
      if (window.AuthService && typeof window.AuthService.init === "function") {
        window.AuthService.init();
      }
      if (window.I18n && typeof window.I18n.init === "function") {
        await window.I18n.init();
      }
      if (window.I18n && typeof window.I18n.applyToDom === "function") {
        window.I18n.applyToDom();
      }
      initSelectors();
      initIdentifyBirthTime();
      syncNavChipActive();
      restoreFormAfterLocaleSwitch();
      bindLangSwitcher();
      
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
          btn.textContent = (window.I18n?.t("ui.launchBtn") || "開啟 人生使用說明書");
        }
        if (hint) {
          hint.textContent = (window.I18n?.t("ui.launchFailed") || "啟動失敗") + "：" + (err.message || (window.I18n?.t("ui.unknownError") || "未知錯誤"));
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
      }
      if (EventBindings.bindOverloadAdviceModal) {
        EventBindings.bindOverloadAdviceModal();
      }
      if (!EventBindings.bindWuxingClickEvents) {
        // Fallback
        ["ziweiWxRadar", "surfaceWxRadar", "strategicWxRadar", "ziweiWxBars", "surfaceWxBars", "strategicWxBars"].forEach((id) => {
          const el = document.getElementById(id);
          if (el) {
            el.style.cursor = "pointer";
            el.addEventListener("click", openWuxingMeaningLikePalace);
          }
        });
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
          
          // 初始化紫微网格滑动切换（使用帶完整 options 的 selectPalace，與點擊宮位一致）
          const ziweiGrid = document.querySelector('.ziwei-grid, [id*="ziwei"]');
          if (ziweiGrid && typeof selectPalace === "function") {
            window.UiUtils.MobileHelpers.initPalaceGridSwipe(ziweiGrid, (direction, palaceName) => {
              selectPalace(palaceName);
            });
          }
        } catch (err) {
          console.warn("[ui.js] Mobile optimizations failed:", err);
        }
      }

      // 綁定首頁按鈕
      if (Navigation.bindHomeButton) {
        Navigation.bindHomeButton();
      }

      // Chart language mismatch recalc button
      const chartLangRecalcBtn = document.getElementById("chartLangMismatchRecalc");
      if (chartLangRecalcBtn && !chartLangRecalcBtn.dataset.bound) {
        chartLangRecalcBtn.dataset.bound = "1";
        chartLangRecalcBtn.addEventListener("click", function () {
          if (typeof window.runCalculation === "function") window.runCalculation();
        });
      }

      // 供「我的命盤」等外部呼叫：填入表單後觸發計算（等同點擊開啟按鈕）
      window.runCalculation = function () {
        var btn = document.getElementById("btnLaunch");
        if (btn) btn.click();
      };

      // 語系切換還原時使用：先用當前 locale 重載 content，再計算（確保星曜解釋等用對語系）
      window.reloadContentAndRecalc = function () {
        loadDbContent().then(function () {
          if (typeof window.runCalculation === "function") window.runCalculation();
        });
      };

      console.log("[ui.js] DOMContentLoaded 初始化完成");
    } catch (err) {
      console.error("[ui.js] DOMContentLoaded 初始化失敗:", err);
    }
  });
})();

