/* api-service.js
 * API 服务模块
 * 导出到 window.UiServices.ApiService
 * 依赖: window.Calc
 */

(function () {
  "use strict";

  if (typeof window === "undefined") {
    throw new Error("window object not available");
  }

  const API_BASE = window.Config?.API_BASE ?? "https://bazi-api.billeetw.workers.dev";
  const REMOTE_API_BASE = window.Config?.REMOTE_API_BASE ?? "https://bazi-api.billeetw.workers.dev";
  const LOCAL_WORKER_API_BASE = window.Config?.LOCAL_WORKER_API_BASE ?? "http://127.0.0.1:8787";

  /**
   * 本地請求失敗時（ERR_CONNECTION_REFUSED）改用遠端 API
   */
  async function fetchWithFallback(url, opts) {
    const isLocal = /^https?:\/\/localhost(:\d+)?\//.test(url) || /^https?:\/\/127\.0\.0\.1(:\d+)?\//.test(url);
    const runningOnLocalhost =
      typeof window !== "undefined" &&
      /^localhost$|^127\.0\.0\.1$/.test(window.location.hostname || "");
    try {
      return await fetch(url, opts);
    } catch (e) {
      if (isLocal && (e?.name === "TypeError" || /fetch|network|refused/i.test(String(e)))) {
        const fallbackUrl = url.replace(/^https?:\/\/[^/]+/, REMOTE_API_BASE);
        console.warn("[ApiService] 本地 API 無法連線，改用遠端:", fallbackUrl);
        return fetch(fallbackUrl, opts);
      }
      if (!isLocal && runningOnLocalhost && (e?.name === "TypeError" || /fetch|network|refused/i.test(String(e)))) {
        const fallbackUrl = url.replace(/^https?:\/\/[^/]+/, LOCAL_WORKER_API_BASE);
        console.warn("[ApiService] 遠端 API 無法連線，改用本地 Worker:", fallbackUrl);
        return fetch(fallbackUrl, opts);
      }
      throw e;
    }
  }

  /**
   * Merge content: primary locale takes precedence, zh-TW fills missing keys
   */
  function mergeContent(primary, fallback) {
    if (!primary || !primary.ok) return fallback || primary;
    if (!fallback || !fallback.ok) return primary;
    var merged = Object.assign({}, primary);
    ["palaces", "stars", "starPalaces", "tenGods", "wuxing"].forEach(function (k) {
      if (fallback[k] && typeof fallback[k] === "object") {
        merged[k] = Object.assign({}, fallback[k], primary[k] || {});
      }
    });
    return merged;
  }

  /**
   * 加载数据库内容。当 locale=en 时，以 zh-TW 为 fallback 填补缺失 key。
   * @param {Function} onSuccess - 成功回调，接收 dbContent
   */
  async function loadDbContent(onSuccess) {
    try {
      var i18nLocale = (typeof inferI18nLocale === "function") ? inferI18nLocale() : "zh-TW";
      var locale = (typeof inferContentLocale === "function") ? inferContentLocale(i18nLocale) : (i18nLocale === "en" ? "en" : i18nLocale === "zh-CN" ? "zh-CN" : "zh-TW");
      const urlContent = `${API_BASE}/content/2026?locale=${encodeURIComponent(locale)}`;
      console.log("📡 API REQUEST", urlContent, JSON.stringify({ locale }, null, 2));
      var r = await fetchWithFallback(urlContent, {
        method: "GET",
      });
      var j = await r.json();
      // Fallback to zh-TW for en and zh-CN (requested locale first, zh-TW fills missing keys)
      if ((locale === "en" || locale === "zh-CN") && j?.ok) {
        const urlContentZhTw = `${API_BASE}/content/2026?locale=zh-TW`;
        console.log("📡 API REQUEST", urlContentZhTw, JSON.stringify({ locale: "zh-TW" }, null, 2));
        var r2 = await fetchWithFallback(urlContentZhTw, { method: "GET" });
        var j2 = await r2.json();
        j = mergeContent(j, j2);
      }
      if (j?.ok) {
        if (onSuccess) onSuccess(j);
        return j;
      }
      return null;
    } catch (e) {
      console.warn("loadDbContent failed", e);
      return null;
    }
  }

  /**
   * 计算所有数据（八字+紫微+流月+十神）
   * @param {Object} params - 计算参数
   * @param {number} params.year - 出生年
   * @param {number} params.month - 出生月
   * @param {number} params.day - 出生日
   * @param {number} params.hour - 出生时
   * @param {number} params.minute - 出生分
   * @param {string} [params.gender] - 性别 "M" | "F"
   * @returns {Promise<Object>} API 响应数据
   */
  async function computeAll(params) {
    const { year, month, day, hour, minute, gender } = params;
    var i18nLocale = (typeof inferI18nLocale === "function") ? inferI18nLocale() : "zh-TW";
    const language = (typeof inferComputeLanguage === "function") ? inferComputeLanguage(i18nLocale) : (i18nLocale === "en" ? "en-US" : i18nLocale === "zh-CN" ? "zh-CN" : "zh-TW");
    const baseBody = { year, month, day, hour, minute, language };
    const bodyWithGender = gender ? { ...baseBody, gender } : baseBody;

    const urlComputeAll = `${API_BASE}/compute/all`;
    console.log("📡 API REQUEST", urlComputeAll, JSON.stringify(bodyWithGender, null, 2));
    let resp = await fetchWithFallback(urlComputeAll, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(bodyWithGender),
    });

    if (!resp.ok) {
      const t = await resp.text().catch(() => "");
      // 若後端不支援 gender 欄位，做一次降級重試（避免整個系統卡死）
      if (gender && resp.status === 400 && /gender|sex/i.test(t)) {
        console.log("📡 API REQUEST", `${API_BASE}/compute/all`, "(retry without gender)", JSON.stringify(baseBody, null, 2));
        resp = await fetchWithFallback(`${API_BASE}/compute/all`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(baseBody),
        });
      } else {
        const msg = resp.status === 503 || /Worker exceeded resource limits|1102/i.test(t)
          ? "伺服器暫時忙碌（資源已滿），請稍後再試。"
          : `API HTTP ${resp.status} ${t}`.trim();
        throw new Error(msg);
      }
    }

    if (!resp.ok) {
      const t2 = await resp.text().catch(() => "");
      const msg = resp.status === 503 || /Worker exceeded resource limits|1102/i.test(t2)
        ? "伺服器暫時忙碌（資源已滿），請稍後再試。"
        : `API HTTP ${resp.status} ${t2}`.trim();
      throw new Error(msg);
    }

    const payload = await resp.json();
    if (!payload?.ok) {
      throw new Error(payload?.error || "API error");
    }

    return payload;
  }

  /**
   * 延遲載入大限／小限／流年（horoscopeByYear），降低 compute/all CPU
   * @param {Object} params - 同 computeAll
   * @param {number} [params.horoscopeYear] - 目標年份，預設當年
   * @returns {Promise<{ horoscope: Object }>}
   */
  async function fetchHoroscope(params) {
    const { year, month, day, hour, minute, gender, horoscopeYear } = params;
    const body = { year, month, day, hour: hour ?? 0, minute: minute ?? 0, gender, horoscopeYear: horoscopeYear ?? new Date().getFullYear() };
    const urlHoroscope = `${API_BASE}/compute/horoscope`;
    console.log("📡 API REQUEST", urlHoroscope, JSON.stringify(body, null, 2));
    const resp = await fetchWithFallback(urlHoroscope, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!resp.ok) {
      const t = await resp.text().catch(() => "");
      const msg = resp.status === 503 || /Worker exceeded resource limits|1102/i.test(t)
        ? "伺服器暫時忙碌（資源已滿），請稍後再試。"
        : `API HTTP ${resp.status} ${t}`.trim();
      throw new Error(msg);
    }
    const data = await resp.json();
    if (!data?.ok || !data?.horoscope) throw new Error(data?.error || "horoscope 載入失敗");
    return data;
  }

  /**
   * 获取宫位分数
   * @param {string} chartId - 图表ID
   * @returns {Promise<Object|null>} 宫位分数数据
   */
  async function getPalaceScores(chartId) {
    if (!chartId || !(window.Config?.SUPPORTS_CHARTS_SCORES)) {
      return null;
    }

    try {
      const urlScores = `${API_BASE}/charts/${encodeURIComponent(chartId)}/scores`;
      console.log("📡 API REQUEST", urlScores, JSON.stringify({ chartId }, null, 2));
      const scoreResp = await fetchWithFallback(urlScores, {
        method: "GET",
      });
      if (scoreResp.ok) {
        const scores = await scoreResp.json();
        return scores;
      } else {
        console.warn("scores API HTTP", scoreResp.status, await scoreResp.text().catch(() => ""));
        return null;
      }
    } catch (err) {
      console.warn("scores API error:", err);
      return null;
    }
  }

  /**
   * 获取策略笔记
   * @param {string} chartId - 图表ID
   * @param {string} palaceName - 宫位名称
   * @returns {Promise<Object|null>} 策略笔记数据
   */
  async function getStrategyNote(chartId, palaceName) {
    if (!chartId || !palaceName) return null;

    try {
      const urlStrategy = `${API_BASE}/charts/${encodeURIComponent(chartId)}/strategy/${encodeURIComponent(palaceName)}`;
      console.log("📡 API REQUEST", urlStrategy, JSON.stringify({ chartId, palaceName }, null, 2));
      const resp = await fetchWithFallback(urlStrategy, { method: "GET" });
      if (resp.ok) {
        return await resp.json();
      }
      return null;
    } catch (e) {
      console.warn("getStrategyNote failed", e);
      return null;
    }
  }

  function getLifebookPlanPayload() {
    try {
      if (typeof window.getLifebookPlanPayload === "function") {
        return window.getLifebookPlanPayload();
      }
    } catch (_) {}
    let planTier = "free";
    let unlockSections = [];
    try {
      const s = localStorage.getItem("lifebook_v2_tier");
      if (s === "pro") planTier = "pro";
    } catch (_) {}
    try {
      const raw = localStorage.getItem("lifebook_v2_unlock_sections");
      const parsed = raw ? JSON.parse(raw) : [];
      if (Array.isArray(parsed)) unlockSections = parsed.filter((x) => typeof x === "string");
    } catch (_) {}
    let betaInviteCode = "";
    try {
      betaInviteCode = String(localStorage.getItem("lifebook_v2_beta_invite_code") || "").trim();
    } catch (_) {}
    return { plan_tier: planTier, unlock_sections: unlockSections, beta_invite_code: betaInviteCode || undefined };
  }

  async function redeemLifeBookBetaInvite(inviteCode) {
    const body = { invite_code: String(inviteCode || "").trim() };
    const url = `${API_BASE}/api/life-book/beta/redeem`;
    console.log("📡 API REQUEST", url, JSON.stringify({ invite_code: body.invite_code ? "***" : "" }, null, 2));
    const resp = await fetchWithFallback(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await resp.json().catch(() => ({}));
    if (!resp.ok || !data?.ok) {
      throw new Error(data?.error || `API HTTP ${resp.status}`);
    }
    return data;
  }

  async function generateLifeBook(params) {
    const plan = getLifebookPlanPayload();
    const body = Object.assign({}, params || {}, plan);
    const url = `${API_BASE}/api/life-book/generate`;
    console.log("📡 API REQUEST", url, JSON.stringify(body, null, 2));
    const resp = await fetchWithFallback(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await resp.json().catch(() => ({}));
    if (!resp.ok) {
      throw new Error(data?.error || `API HTTP ${resp.status}`);
    }
    return data;
  }

  function getClientTimeContextFields() {
    var tz = "UTC";
    try {
      if (typeof Intl !== "undefined" && Intl.DateTimeFormat) {
        tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
      }
    } catch (e) {
      /* ignore */
    }
    return { clientTimeZone: tz, clientNowISO: new Date().toISOString() };
  }

  async function generateLifeBookSection(params) {
    const plan = getLifebookPlanPayload();
    const body = Object.assign({}, params || {}, plan, getClientTimeContextFields());
    const url = `${API_BASE}/api/life-book/generate-section`;
    console.log("📡 API REQUEST", url, JSON.stringify(body, null, 2));
    const resp = await fetchWithFallback(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await resp.json().catch(() => ({}));
    if (!resp.ok) {
      var err = new Error(data?.error || `API HTTP ${resp.status}`);
      err.status = resp.status;
      if (data && typeof data === "object" && data.time_context) {
        err.time_context = data.time_context;
      }
      throw err;
    }
    return data;
  }

  // 导出到 window.UiServices.ApiService
  if (!window.UiServices) {
    window.UiServices = {};
  }

  window.UiServices.ApiService = {
    API_BASE,
    loadDbContent,
    computeAll,
    fetchHoroscope,
    getPalaceScores,
    getStrategyNote,
    generateLifeBook,
    generateLifeBookSection,
    redeemLifeBookBetaInvite,
    getLifebookPlanPayload,
  };
})();
