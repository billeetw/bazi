/* content-utils.js
 * Content dict lookup with locale fallback and debug-mode missing-key logging
 * Used by: palace-detail, strategic-panel, wuxing-meaning, data-renderer
 */
import { EN_TO_ZH, ZH_TO_EN } from "../../calc/star-registry-generated.js";
/** 由 scripts/sync-star-palaces.js 從 worker/content/content-zh-TW.json 同步，勿手動編輯 */
import STAR_PALACES_FALLBACK_ZH from "../../../data/star-palaces-zh-TW.json";

(function () {
  "use strict";

  if (typeof window === "undefined") return;

  /** en-US 星曜 key → 繁體（來自 star-registry） */
  var EN_STAR_TO_ZH = EN_TO_ZH;
  /** 繁體 → en-US key（來自 star-registry） */
  var ZH_STAR_TO_EN = ZH_TO_EN;

  function isDebugMode() {
    try {
      if (typeof window.location === "undefined") return false;
      if (/^localhost(:\d+)?$/i.test(window.location.hostname)) return true;
      return new URLSearchParams(window.location.search).get("debug") === "1";
    } catch (e) {
      return false;
    }
  }

  var _missingKeys = {};

  /**
   * Get content value from dbContent with fallback.
   * dbContent is already merged (requested locale + zh-TW) by ApiService.loadDbContent.
   * @param {Object} dbContent - Merged content from loadDbContent
   * @param {string} category - "palaces" | "stars" | "tenGods" | "wuxing"
   * @param {string} key - Lookup key (e.g. "命宮", "天梁")
   * @param {string} [defaultText] - Fallback when missing (e.g. i18n "no data" string)
   * @returns {string|null} Content value or defaultText or "(missing: category:key)" in debug mode
   */

  /** 本地 fallback 星曜解釋（與 content-zh-TW.json 同步，API 失敗時使用） */
  var STAR_FALLBACK_ZH = {
    "紫微": "核心本質：核心自我與統御力", "天機": "核心本質：智慧與變化節奏", "太陽": "核心本質：光芒與影響",
    "武曲": "核心本質：執行與成果", "天同": "核心本質：溫和與享受", "廉貞": "核心本質：情緒張力與轉化",
    "天府": "核心本質：資源承載", "太陰": "核心本質：內在感知", "貪狼": "核心本質：慾望與創造",
    "巨門": "核心本質：語言與分析", "天相": "核心本質：平衡與協調", "天梁": "核心本質：守護與道義",
    "七殺": "核心本質：突破與變革", "破軍": "核心本質：重建與開創",
    "左輔": "外在支持與人脈資源的象徵", "右弼": "內在修正與自我調節能力",
    "文昌": "理性思維與知識結構的象徵", "文曲": "感性智慧與審美能力的象徵",
    "祿存": "物質安全與資源累積的象徵", "天馬": "移動與變動能量的象徵",
    "天魁": "外在機會與權威助力的象徵", "天鉞": "內在貴人與直覺導航的象徵",
    "擎羊": "衝突與界線力量的象徵", "陀羅": "內耗與延遲循環的象徵",
    "火星": "爆發力與瞬間行動的象徵", "鈴星": "焦慮與警覺場的象徵",
    "地空": "空性與存在感波動的象徵", "地劫": "失去經驗與破滅記憶的象徵",
    "天刑": "內在道德壓力強，容易對自己過度苛責", "天虛": "容易感到空缺與懷疑，對意義與真實產生質疑",
    "破碎": "對不完整特別敏感，容易執著於修補缺口", "旬空": "階段性迷惘與方向感不明",
    "截空": "容易感受中斷與落差，渴望恢復連續性", "孤辰": "獨立傾向強，但內心渴望深層連結",
    "寡宿": "情感上容易疏離，對歸屬感敏感", "天哭": "對失落與過去情緒特別敏感",
    "天姚": "情感吸引力強，容易理想化關係", "三台": "社會可見度與名聲加分",
    "八座": "地位與形象穩定加持", "龍池": "才華容易被看見", "鳳閣": "氣質優雅，表達具文化感",
    "天才": "專業能力突出，技術突破力強", "天壽": "耐力與穩定度較高",
    "天巫": "直覺敏銳，感知力強", "咸池": "感官誘惑強，容易情緒分心",
    "劫殺": "競爭與壓力強，容易在關鍵時刻承受衝擊", "天空": "理想與現實落差感明顯",
    "解神": "遇事能找到化解方式", "陰煞": "情緒壓力容易內化",
    "天喜": "人際氣氛較佳，容易獲得支持", "天官": "規則意識強，重視制度與秩序",
    "天福": "生活福分穩定，較易得到庇護", "紅鸞": "情感機會明顯，吸引力提升",
    "蜚廉": "突發干擾較多，容易遇到變數", "台輔": "地位穩固，形象加分",
    "封誥": "名望提升，容易被認可", "天月": "情緒感受細膩，對氛圍敏感",
    "恩光": "容易獲得賞識與照顧", "天貴": "關鍵時刻有助力出現",
    "旬中": "階段性空轉，節奏略有延遲", "空亡": "成果感較弱，付出未必即時回收",
    "截路": "發展途中易遇阻斷", "月德": "善緣加持，危機中常有轉機",
    "天傷": "壓力容易轉為身心負擔", "天使": "責任感強，願意承擔他人事務",
    "天廚": "生活品質意識高，重視享受", "華蓋": "獨立氣質強，思想偏向自我世界",
    "天德": "行事正直，容易獲得信任", "龍德": "氣場穩定，關鍵時刻能穩住局面",
    "年解": "年度困局較易化解"
  };

  /** 英文 fallback（與 content-en.json 同步，EN 模式且 API 失敗時使用） */
  var STAR_FALLBACK_EN = {
    emperor: "Core Essence: Central Authority & Inner Sovereignty",
    advisor: "Core Essence: Adaptive Intelligence", sun: "Core Essence: Radiance & Influence",
    general: "Core Essence: Precision & Execution", fortunate: "Core Essence: Ease & Harmony",
    judge: "Core Essence: Emotional Intensity & Transformation", empress: "Core Essence: Resource Stewardship",
    moon: "Core Essence: Reflective Awareness", wolf: "Core Essence: Creative Desire",
    advocator: "Core Essence: Discernment & Expression", minister: "Core Essence: Diplomacy & Balance",
    sage: "Core Essence: Protection & Integrity", marshal: "Core Essence: Radical Initiative",
    rebel: "Core Essence: Structural Reset",
    officer: "Symbolizes external support and social leverage",
    helper: "Represents internal alignment and self-correction",
    scholar: "Symbolizes cognitive clarity and structured thinking",
    artist: "Represents aesthetic intelligence and emotional refinement",
    money: "Symbolizes material stability and resource retention",
    horse: "Represents movement and expansion energy",
    assistant: "Symbolizes external opportunity and authority support",
    aide: "Represents inner guidance and intuitive intelligence",
    driven: "Symbolizes sharp boundaries and confrontation",
    tangled: "Represents inertia and delay loops",
    impulsive: "Symbolizes explosive drive and urgency",
    spark: "Represents anxiety frequency and alertness",
    ideologue: "Symbolizes existential awareness and impermanence",
    fickle: "Represents loss imprint and collapse memory",
    serious: "Strong inner moral pressure, often self-critical to an extreme",
    frail: "Tends toward existential doubt and questioning meaning",
    broken: "Sensitive to fragmentation, driven to fix what feels incomplete",
    fancied: "Periods of uncertainty and unclear direction",
    interrupted: "Feels disruption sharply and seeks restored continuity",
    alone: "Strong independence paired with a longing for deep connection",
    lonely: "Emotionally detached at times, sensitive to belonging",
    upset: "Deeply sensitive to loss and unresolved emotions",
    social: "Strong romantic magnetism with a tendency to idealize",
    senior: "Enhances visibility and reputation",
    dignified: "Stabilizes status and public standing",
    talented: "Talent gains visibility",
    refined: "Refined presence and cultured expression",
    gifted: "Strong technical ability and breakthrough potential",
    ageless: "Greater endurance and life stability",
    psychic: "Heightened intuition and perceptive sensitivity",
    passionate: "Strong sensual pull that may distract emotionally",
    murder: "Intense competitive pressure, often facing sharp turning points",
    utopian: "A noticeable gap between ideals and reality",
    considery: "Strong ability to resolve crises and untangle problems",
    gloomy: "Tends to internalize emotional stress",
    cheerful: "Favors social harmony and supportive connections",
    solemn: "Strong awareness of structure, order, and hierarchy",
    lucky: "Brings a steady sense of protection and fortune",
    attractive: "Heightened romantic opportunities and attraction",
    instigated: "Sudden disruptions and unexpected variables",
    honorable: "Reinforces status and public credibility",
    awarded: "Elevates recognition and formal acknowledgment",
    sickly: "Emotionally sensitive and perceptive to subtle shifts",
    grateful: "Attracts appreciation and benefactor support",
    noble: "Timely support appears at critical moments",
    meditative: "Periodic stagnation or slowed momentum",
    bottomless: "Effort may not immediately translate into visible results",
    intercepted: "Progress may face abrupt interruption",
    peaceful: "Benevolent influence that softens adversity",
    wounded: "Stress may manifest as physical or emotional strain",
    heaven: "Strong sense of duty and service toward others",
    gourmet: "Appreciates comfort, taste, and refined living",
    religious: "Strongly independent, inward-oriented mindset",
    blessed: "Upright conduct that earns trust naturally",
    virtuous: "Stabilizing presence during critical transitions",
    nianjie: "Annual obstacles tend to resolve more smoothly"
  };

  function isEnContentLocale() {
    try {
      var i18n = (typeof window.inferI18nLocale === "function" ? window.inferI18nLocale() : null)
        || (window.I18n && typeof window.I18n.getLocale === "function" ? window.I18n.getLocale() : "")
        || "";
      var loc = (typeof window.inferContentLocale === "function" ? window.inferContentLocale(i18n) : null) || i18n || "";
      return String(loc).trim().toLowerCase().startsWith("en");
    } catch (e) { return false; }
  }

  /**
   * 取得「星曜在該宮位」的特定表現
   * @param {Object} dbContent - 來自 loadDbContent 的合併內容
   * @param {string} starName - 星曜名稱（如 紫微、火星）
   * @param {string} palaceName - 宮位名稱（如 命宮、官祿）
   * @param {string} [defaultText] - 無資料時的預設
   * @returns {string|null}
   */
  function getStarInPalaceContent(dbContent, starName, palaceName, defaultText) {
    var dict = dbContent && dbContent.starPalaces;
    if (!dict || typeof dict !== "object") dict = {};
    var key = starName + "_" + palaceName;
    var val = dict[key];
    if (val != null && String(val).trim() !== "") return val;
    val = STAR_PALACES_FALLBACK_ZH && STAR_PALACES_FALLBACK_ZH[key];
    if (val != null && String(val).trim() !== "") return val;
    return defaultText != null ? defaultText : null;
  }

  function getContentValue(dbContent, category, key, defaultText) {
    var dict = dbContent && dbContent[category];
    var useEn = isEnContentLocale();
    if (!dict || typeof dict !== "object") {
      if (category === "stars" && key) {
        if (useEn && STAR_FALLBACK_EN[key]) return STAR_FALLBACK_EN[key];
        if (useEn && ZH_STAR_TO_EN[key] && STAR_FALLBACK_EN[ZH_STAR_TO_EN[key]]) return STAR_FALLBACK_EN[ZH_STAR_TO_EN[key]];
        if (STAR_FALLBACK_ZH[key]) return STAR_FALLBACK_ZH[key];
        if (EN_STAR_TO_ZH[key] && STAR_FALLBACK_ZH[EN_STAR_TO_ZH[key]]) return STAR_FALLBACK_ZH[EN_STAR_TO_ZH[key]];
      }
      if (isDebugMode() && key) {
        var fullKey = category + ":" + key;
        if (!_missingKeys[fullKey]) {
          _missingKeys[fullKey] = true;
          if (window.console) window.console.log("[content] missing dict:", category, "key:", key);
        }
        return "(missing: " + fullKey + ")";
      }
      return defaultText != null ? defaultText : null;
    }
    var val = dict[key];
    if (val != null && val !== "") return val;
    if (category === "stars" && key) {
      var zhKey = EN_STAR_TO_ZH[key];
      var enKey = ZH_STAR_TO_EN[key];
      if (zhKey && dict[zhKey]) return dict[zhKey];
      if (enKey && dict[enKey]) return dict[enKey];
      if (useEn && STAR_FALLBACK_EN[key]) return STAR_FALLBACK_EN[key];
      if (useEn && enKey && STAR_FALLBACK_EN[enKey]) return STAR_FALLBACK_EN[enKey];
      if (STAR_FALLBACK_ZH[key]) return STAR_FALLBACK_ZH[key];
      if (zhKey && STAR_FALLBACK_ZH[zhKey]) return STAR_FALLBACK_ZH[zhKey];
    }
    if (isDebugMode() && key) {
      var fullKey = category + ":" + key;
      if (!_missingKeys[fullKey]) {
        _missingKeys[fullKey] = true;
        if (window.console) window.console.log("[content] missing key:", fullKey);
      }
      return "(missing: " + fullKey + ")";
    }
    return defaultText != null ? defaultText : null;
  }

  /**
   * Get wuxing element object { headline, content } with fallback.
   * @param {Object} dbContent
   * @param {string} elementKey - "木" | "火" | "土" | "金" | "水"
   * @param {Object} defaultItem - { headline, content }
   * @returns {Object} { headline, content }
   */
  function getWuxingItem(dbContent, elementKey, defaultItem) {
    var dict = dbContent && dbContent.wuxing;
    var item = dict && dict[elementKey];
    if (item && (item.headline || item.content)) {
      return {
        headline: item.headline || defaultItem?.headline || "",
        content: item.content || defaultItem?.content || "",
      };
    }
    if (isDebugMode()) {
      var fullKey = "wuxing:" + elementKey;
      if (!_missingKeys[fullKey]) {
        _missingKeys[fullKey] = true;
        if (window.console) window.console.log("[content] missing wuxing:", elementKey);
      }
    }
    return defaultItem || { headline: "", content: "" };
  }

  if (!window.UiUtils) window.UiUtils = {};
  window.UiUtils.ContentUtils = {
    getContentValue: getContentValue,
    getStarInPalaceContent: getStarInPalaceContent,
    getWuxingItem: getWuxingItem,
    isDebugMode: isDebugMode,
  };
})();
