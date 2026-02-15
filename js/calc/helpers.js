/* calc/helpers.js
 * 紫微斗數計算相關的純函數輔助模組
 * 從 calc.js 中提取，用於模組化架構
 * 依賴 calc/constants.js
 */

(function () {
  "use strict";

  // 檢查依賴
  if (typeof window === "undefined" || !window.CalcConstants) {
    throw new Error("calc/helpers.js requires calc/constants.js to be loaded first");
  }

  // 從 constants.js 解構需要的常數
  const {
    PALACE_DEFAULT,
    PALACE_KEY_MAP,
    STAR_NAME_TRAD_MAP,
    STAR_NAME_TO_ID_MAP,
    SHICHEN_ORDER,
    SHICHEN_START_HOUR,
    FIVE_ELEMENTS_ORDER,
    SHENG_MAP,
    KE_MAP,
    STRONG_COMMENTS,
    WEAK_COMMENTS,
    STRONG_COMMENTS_SURFACE,
    STRONG_COMMENTS_STRATEGIC,
    WEAK_COMMENTS_SURFACE,
    WEAK_COMMENTS_STRATEGIC,
    ENERGY_LABEL,
    ELEMENT_CORE_MEANING,
    ELEMENT_CORE_MEANING_SURFACE,
    ELEMENT_CORE_MEANING_STRATEGIC,
    GENERATION_POST_STYLE,
    OVERCOMING_POST_STYLE,
    ELEMENT_TYPE,
    BOYAN_CONVERSION_ONE,
    BOYAN_CONVERSION_ONE_SURFACE,
    BOYAN_CONVERSION_ONE_STRATEGIC,
    BOYAN_RISK_ONE,
    BOYAN_RISK_ONE_SURFACE,
    BOYAN_RISK_ONE_STRATEGIC,
    BOYAN_PUSH,
    BOYAN_PUSH_SURFACE,
    BOYAN_PUSH_STRATEGIC,
    SI_HUA_MAP,
    ELEMENT_TYPE_EN,
    ELEMENT_TYPE_EN_FALLBACK,
    ENERGY_LABEL_EN,
    RELATION_BADGE_EN,
    ELEMENT_CORE_MEANING_SURFACE_EN,
    ELEMENT_CORE_MEANING_STRATEGIC_EN,
    BOYAN_CONVERSION_ONE_SURFACE_EN,
    BOYAN_CONVERSION_ONE_STRATEGIC_EN,
    BOYAN_RISK_ONE_SURFACE_EN,
    BOYAN_RISK_ONE_STRATEGIC_EN,
    BOYAN_PUSH_SURFACE_EN,
    BOYAN_PUSH_STRATEGIC_EN,
    GENERATION_POST_STYLE_EN,
    OVERCOMING_POST_STYLE_EN,
    STRONG_COMMENTS_SURFACE_EN,
    WEAK_COMMENTS_SURFACE_EN,
    STRONG_COMMENTS_STRATEGIC_EN,
    WEAK_COMMENTS_STRATEGIC_EN,
  } = window.CalcConstants;

  function isEnLocale() {
    const loc = (typeof window !== "undefined" && window.I18n && typeof window.I18n.getLocale === "function")
      ? window.I18n.getLocale()
      : "";
    return String(loc).trim().toLowerCase().startsWith("en");
  }

  // ====== 基礎工具函數 ======

  /**
   * 將數字補零到兩位數
   * @param {number} n 數字
   * @returns {string} 補零後的字符串
   */
  function pad2(n) {
    return String(n).padStart(2, "0");
  }

  /**
   * 將值轉換為數字，失敗返回 0
   * @param {*} v 任意值
   * @returns {number} 數字或 0
   */
  function toNumberOrZero(v) {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  }

  // ====== 時辰相關函數 ======

  /**
   * 解析出生時間（時辰或精確時間）
   * @param {Object} params 參數物件
   * @param {string} params.mode 模式："shichen" 或 "exact"
   * @param {number} params.hour 小時（exact 模式）
   * @param {number} params.minute 分鐘（exact 模式）
   * @param {string} params.shichen 時辰（shichen 模式）
   * @param {string} params.shichenHalf 時辰上下半："upper" 或 "lower"
   * @returns {Object} 解析結果
   */
  function resolveBirthTime({ mode, hour, minute, shichen, shichenHalf }) {
    if (mode === "shichen") {
      const s = SHICHEN_START_HOUR[shichen];
      const half = shichenHalf === "lower" ? "lower" : "upper";
      const h = (Number.isFinite(s) ? s : 23) + (half === "lower" ? 1 : 0);
      return {
        hour: ((Number.isFinite(h) ? h : 0) + 24) % 24,
        minute: 30,
        source: "shichen",
        shichen: SHICHEN_ORDER.includes(shichen) ? shichen : "子",
        shichenHalf: half,
      };
    }

    const hh = Number(hour);
    const mm = Number(minute);
    return {
      hour: Number.isFinite(hh) ? hh : 0,
      minute: Number.isFinite(mm) ? mm : 0,
      source: "exact",
      shichen: null,
      shichenHalf: null,
    };
  }

  // ====== 星曜相關函數 ======

  /**
   * 將星曜名稱轉換為繁體（條件式）
   * - 若 astrolabeLanguage 為 zh-TW 或 en-US：不轉換，直接回傳
   * - 若為 zh-CN 或未設定：套用 STAR_NAME_TRAD_MAP（簡→繁，Worker 未改前 fallback）
   * @param {string} name 星曜名稱
   * @returns {string} 顯示用星曜名稱
   */
  function toTraditionalStarName(name) {
    if (name == null || typeof name !== "string") return name;
    const lang =
      typeof window !== "undefined" && window.contract && window.contract.astrolabeLanguage
        ? String(window.contract.astrolabeLanguage).trim()
        : "zh-CN";
    if (lang === "zh-TW" || lang === "en-US") return name;
    return STAR_NAME_TRAD_MAP[name] || name;
  }

  /**
   * 獲取指定宮位的所有星曜
   * @param {Object} ziwei 紫微命盤資料
   * @param {string} palaceName 宮位名稱
   * @returns {Array<string>} 星曜名稱陣列
   */
  function getStarsForPalace(ziwei, palaceName) {
    if (!ziwei || !ziwei.mainStars) return [];
    const keys = PALACE_KEY_MAP[palaceName] || [palaceName];
    const all = [];
    keys.forEach((k) => {
      const list = ziwei.mainStars[k];
      if (Array.isArray(list)) list.forEach((s) => all.push(s));
    });
    return all;
  }

  /**
   * 獲取星曜亮度狀態（暫時使用預設值 "Li" 1.0，未來可從 ziwei 資料中提取）
   * @param {Object} ziwei 紫微命盤資料
   * @param {string} starName 星曜名稱
   * @param {string} palaceName 宮位名稱
   * @returns {string} 亮度狀態：Miao, Wang, De, Li, Ping, Bu, Xian
   */
  function getStarBrightness(ziwei, starName, palaceName) {
    // TODO: 未來可根據星曜在命盤中的位置計算實際亮度
    // 目前使用預設值 "Li"（利地，乘數 1.0）
    return "Li";
  }

  /**
   * 動態構建完整的星曜名稱到 ID 映射表（包含雜曜和神煞）
   * @param {Object} weightsData 權重資料
   * @returns {Object} 完整的映射表 { "星名": "ID" }
   */
  function buildCompleteStarNameMap(weightsData) {
    if (!weightsData) return STAR_NAME_TO_ID_MAP;
    const map = { ...STAR_NAME_TO_ID_MAP };
    
    // 從雜曜構建映射
    if (weightsData.minorStars) {
      weightsData.minorStars.forEach((star) => {
        if (star.name && star.id) {
          map[star.name] = star.id;
        }
      });
    }
    
    // 從神煞構建映射
    if (weightsData.deities) {
      weightsData.deities.forEach((deity) => {
        if (deity.name && deity.id) {
          map[deity.name] = deity.id;
        }
      });
    }
    
    return map;
  }

  /**
   * 根據星曜繁體名稱獲取權重配置（支持主星、輔星、雜曜、神煞）
   * @param {string} starName 星曜繁體名稱
   * @param {Object} weightsData 權重資料（必須提供）
   * @returns {Object|null} 星曜權重配置物件，包含 baseScore, brightnessMultiplier, resonanceMap, strategicTag 等
   */
  function getStarWeightConfig(starName, weightsData) {
    if (!starName || !weightsData) return null;
    
    // 構建完整的映射表
    const completeMap = buildCompleteStarNameMap(weightsData);
    const starId = completeMap[starName];
    if (!starId) return null;

    // 按優先級查找：主星 → 輔星 → 雜曜 → 神煞
    const mainStar = weightsData.mainStars?.find((s) => s.id === starId);
    if (mainStar) return mainStar;

    const assistantStar = weightsData.assistantStars?.find((s) => s.id === starId);
    if (assistantStar) return assistantStar;

    const minorStar = weightsData.minorStars?.find((s) => s.id === starId);
    if (minorStar) return minorStar;

    const deity = weightsData.deities?.find((s) => s.id === starId);
    if (deity) return deity;

    return null;
  }

  // ====== 五行相關函數 ======

  /**
   * 計算五行百分比
   * @param {Object} wx 五行數值物件
   * @returns {Object} { total, pct }
   */
  function pctFromWx(wx) {
    const total = Object.values(wx || {}).reduce((s, v) => s + (Number(v) || 0), 0) || 1;
    const pct = {};
    ["木", "火", "土", "金", "水"].forEach((k) => (pct[k] = (Number(wx?.[k] || 0) / total)));
    return { total, pct };
  }

  /**
   * 將五行數值按最大值歸一化
   * @param {Object} wx 五行數值物件
   * @param {Array<string>} order 五行順序（預設 FIVE_ELEMENTS_ORDER）
   * @returns {Object} { order, raw, max, normalized }
   */
  function normalizeWxByMax(wx, order = FIVE_ELEMENTS_ORDER) {
    const raw = {};
    order.forEach((k) => (raw[k] = toNumberOrZero(wx?.[k])));
    const max = Math.max(0, ...order.map((k) => raw[k]));
    const normalized = {};
    order.forEach((k) => (normalized[k] = max > 0 ? (raw[k] / max) * 100 : 0));
    return { order, raw, max, normalized };
  }

  /**
   * 獲取五行最強和最弱
   * @param {Object} wx 五行數值物件
   * @param {Array<string>} order 五行順序（預設 FIVE_ELEMENTS_ORDER）
   * @returns {Object} { strongest, weakest, max, min }
   */
  function getStrongestWeakest(wx, order = FIVE_ELEMENTS_ORDER) {
    let strongest = order[0];
    let weakest = order[0];
    let max = -Infinity;
    let min = Infinity;
    order.forEach((k) => {
      const v = toNumberOrZero(wx?.[k]);
      if (v > max) {
        max = v;
        strongest = k;
      }
      if (v < min) {
        min = v;
        weakest = k;
      }
    });
    return { strongest, weakest, max, min };
  }

  /**
   * 生成五行強弱與生剋註解
   * @param {Object} wx 五行數值物件
   * @param {string} kind 類型："surface"（表層）或 "strategic"（實戰），預設為 "strategic"
   * @returns {Object} { strongest, weakest, strongComment, weakComment, shengComment, keComment }
   */
  function generateFiveElementComment(wx, kind = "strategic") {
    const { strongest, weakest } = getStrongestWeakest(wx);

    const isSurface = kind === "surface";
    const en = isEnLocale();
    const STRONG_CMTS = en ? (isSurface ? STRONG_COMMENTS_SURFACE_EN : STRONG_COMMENTS_STRATEGIC_EN) : (isSurface ? STRONG_COMMENTS_SURFACE : STRONG_COMMENTS_STRATEGIC);
    const WEAK_CMTS = en ? (isSurface ? WEAK_COMMENTS_SURFACE_EN : WEAK_COMMENTS_STRATEGIC_EN) : (isSurface ? WEAK_COMMENTS_SURFACE : WEAK_COMMENTS_STRATEGIC);

    const strongComment = STRONG_CMTS[strongest] || "";
    const weakComment = WEAK_CMTS[weakest] || "";

    const shengTo = SHENG_MAP[strongest] || "";
    const keTo = KE_MAP[strongest] || "";

    const shengComment = en
      ? `Your [${strongest}] naturally generates [${shengTo}], making that domain easier to move forward.`
      : `你的【${strongest}】會自然生出【${shengTo}】，讓這個領域比較容易推動。`;
    const keComment = en
      ? `Your [${strongest}] also overcomes [${keTo}], making that domain weaker or harder to start.`
      : `你的【${strongest}】也會剋【${keTo}】 ，讓那個領域比較弱或比較難啟動。`;

    return {
      strongest,
      weakest,
      strongComment,
      weakComment,
      shengComment,
      keComment,
    };
  }

  // ====== 五行能量等級相關函數 ======

  /**
   * 將能量等級限制在 0-3 範圍內
   * @param {number} v 能量等級值
   * @returns {number} 限制後的等級（0, 1, 2, 或 3）
   */
  function clampEnergyLevel(v) {
    const n = Number(v);
    if (!Number.isFinite(n)) return 0;
    const i = Math.round(n);
    if (i <= 0) return 0;
    if (i === 1) return 1;
    if (i === 2) return 2;
    return 3;
  }

  /**
   * 獲取能量帶標籤
   * @param {number} level 能量等級
   * @returns {string} "low", "healthy", 或 "excess"
   */
  function energyBand(level) {
    const x = clampEnergyLevel(level);
    if (x <= 1) return "low";
    if (x === 2) return "healthy";
    return "excess";
  }

  /**
   * 獲取五行元素的意義文字
   * @param {string} el 五行元素（木、火、土、金、水）
   * @param {number} level 能量等級
   * @param {string} kind 類型："surface"（表層）或 "strategic"（實戰），預設為 "strategic"
   * @returns {string} 意義文字
   */
  function meaningText(el, level, kind = "strategic") {
    const isSurface = kind === "surface";
    const M = isEnLocale()
      ? (isSurface ? ELEMENT_CORE_MEANING_SURFACE_EN : ELEMENT_CORE_MEANING_STRATEGIC_EN)
      : (isSurface ? ELEMENT_CORE_MEANING_SURFACE : ELEMENT_CORE_MEANING_STRATEGIC);
    const m = M && M[el];
    const lv = clampEnergyLevel(level);
    if (!m) return "";
    if (lv <= 1) return m.low01;
    if (lv === 2) return m.level2;
    return m.level3;
  }

  /**
   * 獲取兩個五行元素的關係標記
   * @param {number} a 第一個元素的能量等級
   * @param {number} b 第二個元素的能量等級
   * @returns {string} 關係標記（強弱/弱強/強強/弱弱 或 EN 版）
   */
  function relationBadge(a, b) {
    const A = clampEnergyLevel(a) >= 2 ? "強" : "弱";
    const B = clampEnergyLevel(b) >= 2 ? "強" : "弱";
    const key = `${A}${B}`; // 強弱/弱強/強強/弱弱

    const en = isEnLocale && isEnLocale();
    if (en && RELATION_BADGE_EN) {
      // Prefer mapping if exists
      if (RELATION_BADGE_EN[key]) return RELATION_BADGE_EN[key];

      // Fallback to a consistent EN output instead of returning Chinese key
      // (prevents mixed-language if mapping is incomplete)
      const fallback = {
        "強弱": "Strong–Weak",
        "弱強": "Weak–Strong",
        "強強": "Strong–Strong",
        "弱弱": "Weak–Weak",
      };
      if (fallback[key]) return fallback[key];
    }

    return key;
  }

  /**
   * 將五行數值映射成 0-3 能量等級
   * 0: ≤25% max, 1: ≤50%, 2: ≤75%, 3: >75%
   * @param {Object} wx 五行數值物件
   * @returns {Object} { levels: { 木, 火, 土, 金, 水 }, raw, max }
   */
  function toEnergyLevelsFromWx(wx) {
    const raw = {
      "木": toNumberOrZero(wx?.["木"]),
      "火": toNumberOrZero(wx?.["火"]),
      "土": toNumberOrZero(wx?.["土"]),
      "金": toNumberOrZero(wx?.["金"]),
      "水": toNumberOrZero(wx?.["水"]),
    };
    const max = Math.max(0, raw["木"], raw["火"], raw["土"], raw["金"], raw["水"]);
    const levelOf = (v) => {
      if (max <= 0) return 0;
      const r = v / max;
      if (r <= 0.25) return 0;
      if (r <= 0.5) return 1;
      if (r <= 0.75) return 2;
      return 3;
    };
    return {
      levels: {
        "木": levelOf(raw["木"]),
        "火": levelOf(raw["火"]),
        "土": levelOf(raw["土"]),
        "金": levelOf(raw["金"]),
        "水": levelOf(raw["水"]),
      },
      raw,
      max,
    };
  }

  /**
   * 生成五行診斷報告
   * @param {Object} wx 五行數值物件
   * @returns {Object} { title, generation, overcoming, weakness, levels, strongest, weakest, strategistNote }
   */
  function generateFiveElementDiagnosis(wx) {
    // 正規化：若 API 回傳英文鍵 (wood/fire/earth/metal/water)，轉成中文
    const EN_TO_ZH = { wood: "木", fire: "火", earth: "土", metal: "金", water: "水" };
    const keysZh = ["木", "火", "土", "金", "水"];
    const wxUse = {};
    keysZh.forEach((k) => {
      const enKey = Object.keys(EN_TO_ZH).find((en) => EN_TO_ZH[en] === k);
      wxUse[k] = toNumberOrZero(wx?.[k]) || (wx && enKey ? toNumberOrZero(wx[enKey]) : 0);
    });

    const { strongest, weakest } = getStrongestWeakest(wxUse, keysZh);
    const { levels } = toEnergyLevelsFromWx(wxUse);
    const keys = ["木", "火", "土", "金", "水"];

    const levelsArr = keys.map((k) => clampEnergyLevel(levels[k]));
    const maxLv = Math.max(...levelsArr);
    const minLv = Math.min(...levelsArr);

    const en = isEnLocale();
    const ENERGY_DICT = en ? ENERGY_LABEL_EN : ENERGY_LABEL;
    const tag = (lv) => `[ ${ENERGY_DICT[clampEnergyLevel(lv)]} ]`;
    const strongestTxt = `${strongest} ${tag(levels[strongest])}`;
    const weakestTxt = `${weakest} ${tag(levels[weakest])}`;

    const titleTpls = en
      ? ["Balanced distribution: let ${s} lead while reinforcing ${w}.", "Polarized energy: ${s} over-dominates; ${w} becomes the bottleneck.", "Overactive signal: ${s} drives the rhythm—watch the cost of imbalance.", "Clear weakness: ${w} is underpowered and may slow momentum.", "Uneven distribution: ${s} strong, ${w} weak—patch the weak spot before scaling."]
      : ["五行偏均衡：以${s}帶動，${w}需補位。", "能量兩極：${s}過度主導，${w}成瓶頸。", "存在過旺：${s}主導節奏，注意失衡代價。", "明顯短板：${w}偏弱，易拖慢推進。", "分布不均：${s}偏強、${w}偏弱，先補短板再放大。"];
    let title = "";
    if (maxLv - minLv <= 1) title = titleTpls[0].replace("${s}", strongestTxt).replace("${w}", weakestTxt);
    else if (maxLv === 3 && minLv === 0) title = titleTpls[1].replace("${s}", strongestTxt).replace("${w}", weakestTxt);
    else if (maxLv === 3) title = titleTpls[2].replace("${s}", strongestTxt).replace("${w}", weakestTxt);
    else if (minLv === 0) title = titleTpls[3].replace("${s}", strongestTxt).replace("${w}", weakestTxt);
    else title = titleTpls[4].replace("${s}", strongestTxt).replace("${w}", weakestTxt);

    const genPairs = [["木", "火"], ["火", "土"], ["土", "金"], ["金", "水"], ["水", "木"]];
    const GEN_STYLE = en ? GENERATION_POST_STYLE_EN : GENERATION_POST_STYLE;
    const elementTagsLines = keys.map((k) => {
      const lv = clampEnergyLevel(levels[k]);
      const meaning = meaningText(k, levels[k], "strategic");
      return `【${k}】${tag(lv)} ${meaning}`;
    });

    const sep = en ? ": " : "：";
    const conversionHighlights = [];
    genPairs.forEach(([m, c]) => {
      const post = GEN_STYLE[`${m}->${c}`];
      if (post && (energyBand(levels[m]) === "healthy" || energyBand(levels[m]) === "excess") && clampEnergyLevel(levels[c]) >= 1) {
        conversionHighlights.push(`${post.headline}${sep}${post.text}`);
      }
    });
    const conversionTop2 = conversionHighlights.slice(0, 2);

    const genOrder = ["木", "火", "土", "金", "水"];
    const startIdx = genOrder.indexOf(strongest);
    const path = Array.from({ length: 5 }, (_, i) => genOrder[(startIdx + i) % 5]).join("→");
    const genLabel = en ? "Five-Phase Status:" : "五行狀態：";
    const pathLabel = en ? "Energy Path (starting from the strongest):" : "能量路徑（以最強為起點）：";
    const highlightLabel = en ? "Generation Highlights:" : "相生亮點：";
    const generation =
      `${genLabel}\n${elementTagsLines.join("\n")}\n\n` +
      `${pathLabel} ${path}\n\n` +
      (conversionTop2.length ? `${highlightLabel}\n- ${conversionTop2.join("\n- ")}` : "");

    const kePairs = [["木", "土"], ["土", "水"], ["水", "火"], ["火", "金"], ["金", "木"]];
    const OVERCOME_STYLE = en ? OVERCOMING_POST_STYLE_EN : OVERCOMING_POST_STYLE;
    const strongWeakVal = en ? "Strong–Weak" : "強弱";
    const weakStrongVal = en ? "Weak–Strong" : "弱強";
    const destructiveNotes = [];
    const constraintNotes = [];
    kePairs.forEach(([a, b]) => {
      const badge = relationBadge(levels[a], levels[b]);
      const post = OVERCOME_STYLE[`${a}->${b}`];
      if (badge === strongWeakVal && post) destructiveNotes.push(`${post.headline}${sep}${post.text}`);
      else if (badge === weakStrongVal && post) constraintNotes.push(`${post.headline}${sep}${post.text}`);
    });
    const destructiveTop2 = destructiveNotes.slice(0, 2);
    const constraintTop2 = constraintNotes.slice(0, 2);

    const warnLabel = en ? "Deep-path Warnings:" : "深度路徑警訊：";
    const balanceLabel = en ? "Balancing Reminder:" : "制衡提醒：";
    const overcoming =
      (destructiveTop2.length ? `${warnLabel}\n- ${destructiveTop2.join("\n- ")}` : "") +
      (destructiveTop2.length && constraintTop2.length ? "\n\n" : "") +
      (constraintTop2.length ? `${balanceLabel}\n- ${constraintTop2.join("\n- ")}` : "");

    const ELEM_MEANING = en ? ELEMENT_CORE_MEANING_STRATEGIC_EN : ELEMENT_CORE_MEANING;
    const weakLabel = en ? "Weak spot" : "短板";
    const lackLabel = en ? "Lacking" : "缺";
    const weaknessLines = [];
    weaknessLines.push(`${weakLabel} [${weakest}] ${tag(levels[weakest])}: ${ELEM_MEANING[weakest].core}—${meaningText(weakest, levels[weakest], "strategic")}`);

    const missing = keys.filter((k) => clampEnergyLevel(levels[k]) === 0);
    if (missing.length) {
      missing.forEach((k) => weaknessLines.push(`${lackLabel} ${k}: ${ELEM_MEANING[k].remedy}`));
    }
    const weakness = weaknessLines.join("\n");

    const strategistNote = buildStrategistNote({
      strongest, weakest, levels, title,
      conversionTop2, destructiveTop2, weakness,
      ELEMENT_CORE_MEANING: ELEM_MEANING, ENERGY_LABEL: ENERGY_DICT, clampEnergyLevel,
      en,
    });

    return { title, generation, overcoming, weakness, levels, strongest, weakest, strategistNote };
  }

  /**
   * 構建戰略筆記（李伯彥風格）
   * @param {Object} opts 選項物件
   * @returns {string} 戰略筆記文字
   */
  function buildStrategistNote(opts) {
    const { strongest, weakest, levels, conversionTop2, destructiveTop2, ELEMENT_CORE_MEANING, ENERGY_LABEL, clampEnergyLevel, en } = opts;
    const lines = [];
    const strongTag = ENERGY_LABEL[clampEnergyLevel(levels[strongest])];
    const weakTag = ENERGY_LABEL[clampEnergyLevel(levels[weakest])];
    const sep = en ? ":" : "：";
    if (en) {
      lines.push(`Your home ground is [${strongest}] ${strongTag}—highest weight. Your danger zone is [${weakest}] ${weakTag}, which can turn into a high-difficulty dungeon in your life game.`);
      if (destructiveTop2.length) {
        const part = destructiveTop2[0].split(/:|：/)[0];
        lines.push(`System Bug: ${part} — stop the bleeding first, then optimize.`);
      }
      if (conversionTop2.length) {
        const part = conversionTop2[0].split(/:|：/)[0];
        lines.push(`Cash-out Zone: ${part} — invest your compute here to convert into outcomes.`);
      }
      lines.push(`This isn't fortune-telling. It's a manual to regain control. Next, put energy into the cash-out zone, avoid the danger zone, and clear the run steadily.`);
    } else {
      lines.push(`你的主場在【${strongest}】${strongTag}，權重最高；雷區在【${weakest}】${weakTag}，容易變成人生遊戲裡的高難度副本。`);
      if (destructiveTop2.length) {
        lines.push(`系統 Bug：${destructiveTop2[0].split("：")[0]}—先止損再談通關。`);
      }
      if (conversionTop2.length) {
        lines.push(`提款區：${conversionTop2[0].split("：")[0]}，把算力投在這裡變現。`);
      }
      lines.push(`這局不是算命，是給你一張拿回主導權的說明書。接下來，把精力投向能提款的地方，避開雷區，穩穩通關。`);
    }
    return lines.join("\n");
  }

  /**
   * 生成伯彥戰略看板
   * @param {Object} wx 五行數值物件
   * @param {string} kind 類型："surface"（表層）或 "strategic"（實戰），預設為 "strategic"
   * @returns {Object} { levels, strongest, weakest, wxRaw, 本局屬性, 戰略亮點, 系統風險, 伯彥助推 }
   */
  function getBoyanBoard(wx, kind = "strategic") {
    const EN_TO_ZH = { wood: "木", fire: "火", earth: "土", metal: "金", water: "水" };
    const keysZh = ["木", "火", "土", "金", "水"];
    const wxUse = {};
    keysZh.forEach((k) => {
      const enKey = Object.keys(EN_TO_ZH).find((en) => EN_TO_ZH[en] === k);
      wxUse[k] = toNumberOrZero(wx?.[k]) || (wx && enKey ? toNumberOrZero(wx[enKey]) : 0);
    });
    const { strongest, weakest } = getStrongestWeakest(wxUse, keysZh);
    const { levels } = toEnergyLevelsFromWx(wxUse);
    const strongLv = clampEnergyLevel(levels[strongest]);
    const weakLv = clampEnergyLevel(levels[weakest]);
    
    const isSurface = kind === "surface";
    const en = isEnLocale();
    if (typeof window !== "undefined" && window.UiUtils?.ContentUtils?.isDebugMode?.()) {
      try { console.log("[Boyan] dict:", en ? "en" : "zh"); } catch (e) {}
    }
    const M = en ? (isSurface ? ELEMENT_CORE_MEANING_SURFACE_EN : ELEMENT_CORE_MEANING_STRATEGIC_EN) : (isSurface ? ELEMENT_CORE_MEANING_SURFACE : ELEMENT_CORE_MEANING_STRATEGIC);
    const CONVERSION = en ? (isSurface ? BOYAN_CONVERSION_ONE_SURFACE_EN : BOYAN_CONVERSION_ONE_STRATEGIC_EN) : (isSurface ? BOYAN_CONVERSION_ONE_SURFACE : BOYAN_CONVERSION_ONE_STRATEGIC);
    const RISK = en ? (isSurface ? BOYAN_RISK_ONE_SURFACE_EN : BOYAN_RISK_ONE_STRATEGIC_EN) : (isSurface ? BOYAN_RISK_ONE_SURFACE : BOYAN_RISK_ONE_STRATEGIC);
    const PUSH = en ? (isSurface ? BOYAN_PUSH_SURFACE_EN : BOYAN_PUSH_STRATEGIC_EN) : (isSurface ? BOYAN_PUSH_SURFACE : BOYAN_PUSH_STRATEGIC);
    const ELEMENT_TYPE_DICT = en ? ELEMENT_TYPE_EN : ELEMENT_TYPE;
    const ELEMENT_TYPE_FALLBACK = en ? ELEMENT_TYPE_EN_FALLBACK : "均衡型";

    const 本局屬性 = en
      ? `🔥 Core Profile: ${strongest}-dominant (${ELEMENT_TYPE_DICT[strongest] || ELEMENT_TYPE_FALLBACK}). ${meaningText(strongest, levels[strongest], kind)}, but your ${M[weakest]?.core || ""} support is insufficient.`
      : `🔥 本局屬性：${strongest}系主導（${ELEMENT_TYPE_DICT[strongest] || ELEMENT_TYPE_FALLBACK}）。${meaningText(strongest, levels[strongest], kind)}，但${M[weakest]?.core || ""}支撐不足。`;

    const genPairs = [["木", "火"], ["火", "土"], ["土", "金"], ["金", "水"], ["水", "木"]];
    const genPair = genPairs.find(([m]) => m === strongest);
    const [m, c] = genPair || genPairs[0];
    const onePath = CONVERSION[`${m}->${c}`];
    const 戰略亮點 = onePath
      ? (en ? `🚀 Best Path: ${onePath}` : `🚀 最優路徑：${onePath}`)
      : (en ? `🚀 Best Path: Convert ${M[m]?.core || ""} (${m}) into ${M[c]?.core || ""} (${c})—that's the asset you can actually take with you.` : `🚀 最優路徑：將${M[m]?.core}（${m}）轉化為${M[c]?.core}（${c}），這才是你能拿走的資產。`);

    const kePairs = [["木", "土"], ["土", "水"], ["水", "火"], ["火", "金"], ["金", "木"]];
    const strongWeakVal = en ? "Strong–Weak" : "強弱";
    let 系統風險 = "";
    for (const [a, b] of kePairs) {
      const badge = relationBadge(levels[a], levels[b]);
      if (badge !== strongWeakVal) continue;
      const one = RISK[`${a}->${b}`];
      if (one) {
        系統風險 = en ? `🚨 System Risk: ${one}` : `🚨 系統風險：${one}`;
        break;
      }
    }
    if (!系統風險) {
      系統風險 = en ? `🚨 System Risk: ${weakest} (${M[weakest]?.core || ""}) is weak and may slow the whole system down.` : `🚨 系統風險：${weakest}（${M[weakest]?.core}）偏弱，易拖慢整體。`;
    }

    const 伯彥助推 = PUSH[weakest] || (en ? `This stage: patch ${weakest} first—then talk about scaling.` : `這一關，先把【${weakest}】補上再談放大。`);

    return { levels, strongest, weakest, wxRaw: wxUse, 本局屬性, 戰略亮點, 系統風險, 伯彥助推 };
  }

  // ====== 宮位相關函數 ======

  /**
   * 計算三方四正相關宮位
   * @param {Array<string>} palaceRing 宮位環（12 宮順序）
   * @param {string} palaceName 目標宮位名稱
   * @returns {Object} { active, related, opposite, triads }
   */
  function computeRelatedPalaces(palaceRing, palaceName) {
    const ring = Array.isArray(palaceRing) && palaceRing.length === 12 ? palaceRing : PALACE_DEFAULT;
    const idx = ring.indexOf(palaceName);
    if (idx < 0) return { active: palaceName, related: [], opposite: null, triads: [] };
    const oppositeIdx = (idx + 6) % 12;
    const triad1Idx = (idx + 4) % 12;
    const triad2Idx = (idx + 8) % 12;
    const relatedIdx = new Set([idx, oppositeIdx, triad1Idx, triad2Idx]);
    const related = Array.from(relatedIdx).map((i) => ring[i]);
    return { 
      active: palaceName, 
      related,
      opposite: ring[oppositeIdx],
      triads: [ring[triad1Idx], ring[triad2Idx]]
    };
  }

  // ====== 四化相關函數 ======

  /**
   * 獲取小限宮位天干對應的四化星曜
   * @param {string} stem 天干（甲、乙、丙...）
   * @returns {Object} { 祿, 權, 科, 忌 } 對應的星曜名稱
   */
  function getMutagenStars(stem) {
    const row = SI_HUA_MAP[stem];
    if (!row || !row.weights) return {};
    const out = {};
    Object.keys(row.weights).forEach((star) => {
      const type = row[star];
      if (type) out[type] = star;
    });
    return out;
  }

  /**
   * 獲取小限天干對應的四化權重
   * @param {string} stem 天干（甲、乙、丙...）
   * @returns {Object} { 星名: 分數 } 權重物件
   */
  function getSiHuaWeights(stem) {
    const row = SI_HUA_MAP[stem];
    return (row && row.weights) ? row.weights : {};
  }

  /**
   * 計算命主（根據命宮地支）
   * 命主對應關係：
   * - 子：貪狼
   * - 丑、亥：巨門
   * - 寅、戌：祿存
   * - 卯、酉：文曲
   * - 巳、未：武曲
   * - 辰、申：廉貞
   * - 午：破軍
   * @param {string} mingBranch 命宮地支（如 "寅"）
   * @returns {string} 命主星曜名稱（繁體）
   */
  function calculateMingzhu(mingBranch) {
    if (!mingBranch) return "";
    
    const MINGZHU_MAP = {
      "子": "貪狼",
      "丑": "巨門",
      "寅": "祿存",
      "卯": "文曲",
      "辰": "廉貞",
      "巳": "武曲",
      "午": "破軍",
      "未": "武曲",
      "申": "廉貞",
      "酉": "文曲",
      "戌": "祿存",
      "亥": "巨門"
    };
    
    return MINGZHU_MAP[mingBranch] || "";
  }

  /**
   * 計算身主（根據出生年地支）
   * 身主對應關係：
   * - 子、午：火星
   * - 丑、未：天相
   * - 寅、申：天梁
   * - 卯、酉：天同
   * - 巳、亥：天機
   * - 辰、戌：文昌
   * @param {string} yearBranch 出生年地支（如 "子"）
   * @returns {string} 身主星曜名稱（繁體）
   */
  function calculateShengong(yearBranch) {
    if (!yearBranch) return "";
    
    const SHENGONG_MAP = {
      "子": "火星",
      "丑": "天相",
      "寅": "天梁",
      "卯": "天同",
      "辰": "文昌",
      "巳": "天機",
      "午": "火星",
      "未": "天相",
      "申": "天梁",
      "酉": "天同",
      "戌": "文昌",
      "亥": "天機"
    };
    
    return SHENGONG_MAP[yearBranch] || "";
  }

  /**
   * 從日干與他干計算十神
   * @param {string} dayStem 日干（如 "甲"）
   * @param {string} otherStem 他干（如 "丙"）
   * @returns {string|null} 十神名稱（比肩、劫財、食神、傷官、偏財、正財、七殺、正官、偏印、正印）
   */
  function tenGodFromStems(dayStem, otherStem) {
    if (!dayStem || !otherStem) return null;
    const STEMS = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"];
    const ELEM = { 甲: "木", 乙: "木", 丙: "火", 丁: "火", 戊: "土", 己: "土", 庚: "金", 辛: "金", 壬: "水", 癸: "水" };
    const YANG = { 甲: 1, 丙: 1, 戊: 1, 庚: 1, 壬: 1, 乙: 0, 丁: 0, 己: 0, 辛: 0, 癸: 0 };
    const SHENG = { 木: "火", 火: "土", 土: "金", 金: "水", 水: "木" };
    const KE = { 木: "土", 火: "金", 土: "水", 金: "木", 水: "火" };
    const dE = ELEM[dayStem]; const oE = ELEM[otherStem];
    const dY = YANG[dayStem]; const oY = YANG[otherStem];
    if (!dE || !oE) return null;
    const same = dE === oE;
    const shengWo = SHENG[oE] === dE;
    const woSheng = SHENG[dE] === oE;
    const keWo = KE[oE] === dE;
    const woKe = KE[dE] === oE;
    const sameGender = dY === oY;
    if (same) return sameGender ? "比肩" : "劫財";
    if (shengWo) return sameGender ? "偏印" : "正印";
    if (woSheng) return sameGender ? "食神" : "傷官";
    if (woKe) return sameGender ? "偏財" : "正財";
    if (keWo) return sameGender ? "七殺" : "正官";
    return null;
  }

  // ====== 導出 ======

  // 導出到 window.CalcHelpers（如果 window 存在）
  if (typeof window !== "undefined") {
    window.CalcHelpers = {
      // 基礎工具
      pad2,
      toNumberOrZero,
      
      // 時辰相關
      resolveBirthTime,
      
      // 星曜相關
      toTraditionalStarName,
      getStarsForPalace,
      getStarBrightness,
      buildCompleteStarNameMap,
      getStarWeightConfig,
      
      // 五行相關
      pctFromWx,
      normalizeWxByMax,
      getStrongestWeakest,
      generateFiveElementComment,
      
      // 五行能量等級
      clampEnergyLevel,
      energyBand,
      meaningText,
      relationBadge,
      toEnergyLevelsFromWx,
      generateFiveElementDiagnosis,
      buildStrategistNote,
      getBoyanBoard,
      
      // 宮位相關
      computeRelatedPalaces,
      
      // 四化相關
      getMutagenStars,
      getSiHuaWeights,
      
      // 命主/身主計算
      calculateMingzhu,
      calculateShengong,
      tenGodFromStems,
    };
  } else if (typeof globalThis !== "undefined") {
    // 讓 Node / 測試環境也能引用
    globalThis.CalcHelpers = {
      pad2,
      toNumberOrZero,
      resolveBirthTime,
      toTraditionalStarName,
      getStarsForPalace,
      getStarBrightness,
      buildCompleteStarNameMap,
      getStarWeightConfig,
      pctFromWx,
      normalizeWxByMax,
      getStrongestWeakest,
      generateFiveElementComment,
      clampEnergyLevel,
      energyBand,
      meaningText,
      relationBadge,
      toEnergyLevelsFromWx,
      generateFiveElementDiagnosis,
      buildStrategistNote,
      getBoyanBoard,
      computeRelatedPalaces,
      getMutagenStars,
      getSiHuaWeights,
      calculateMingzhu,
      calculateShengong,
      tenGodFromStems,
    };
  }
})();
