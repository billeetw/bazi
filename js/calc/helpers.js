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
    ENERGY_LABEL,
    ELEMENT_CORE_MEANING,
    GENERATION_POST_STYLE,
    OVERCOMING_POST_STYLE,
    ELEMENT_TYPE,
    BOYAN_CONVERSION_ONE,
    BOYAN_RISK_ONE,
    BOYAN_PUSH,
    SI_HUA_MAP,
  } = window.CalcConstants;

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
   * 將星曜名稱轉換為繁體
   * @param {string} name 星曜名稱
   * @returns {string} 繁體星曜名稱
   */
  function toTraditionalStarName(name) {
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
   * @returns {Object} { strongest, weakest, strongComment, weakComment, shengComment, keComment }
   */
  function generateFiveElementComment(wx) {
    const { strongest, weakest } = getStrongestWeakest(wx);

    const strongComment = STRONG_COMMENTS[strongest] || "";
    const weakComment = WEAK_COMMENTS[weakest] || "";

    const shengTo = SHENG_MAP[strongest] || "";
    const keTo = KE_MAP[strongest] || "";

    const shengComment = `你的【${strongest}】會自然生出【${shengTo}】，讓這個領域比較容易推動。`;
    const keComment = `你的【${strongest}】也會剋【${keTo}】 ，讓那個領域比較弱或比較難啟動。`;

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
   * @returns {string} 意義文字
   */
  function meaningText(el, level) {
    const m = ELEMENT_CORE_MEANING[el];
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
   * @returns {string} 關係標記（強弱/弱強/強強/弱弱）
   */
  function relationBadge(a, b) {
    const A = clampEnergyLevel(a) >= 2 ? "強" : "弱";
    const B = clampEnergyLevel(b) >= 2 ? "強" : "弱";
    return `${A}${B}`;
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

    const tag = (lv) => `[ ${ENERGY_LABEL[clampEnergyLevel(lv)]} ]`;
    const strongestTxt = `${strongest} ${tag(levels[strongest])}`;
    const weakestTxt = `${weakest} ${tag(levels[weakest])}`;

    let title = "";
    if (maxLv - minLv <= 1) title = `五行偏均衡：以${strongestTxt}帶動，${weakestTxt}需補位。`;
    else if (maxLv === 3 && minLv === 0) title = `能量兩極：${strongestTxt}過度主導，${weakestTxt}成瓶頸。`;
    else if (maxLv === 3) title = `存在過旺：${strongestTxt}主導節奏，注意失衡代價。`;
    else if (minLv === 0) title = `明顯短板：${weakestTxt}偏弱，易拖慢推進。`;
    else title = `分布不均：${strongestTxt}偏強、${weakestTxt}偏弱，先補短板再放大。`;

    // 相生：木→火→土→金→水→木。僅保留標籤化與最多 2 條亮點
    const genPairs = [["木", "火"], ["火", "土"], ["土", "金"], ["金", "水"], ["水", "木"]];
    const elementTagsLines = keys.map((k) => {
      const lv = clampEnergyLevel(levels[k]);
      const meaning = meaningText(k, levels[k]);
      return `【${k}】${tag(lv)} ${meaning}`;
    });

    const conversionHighlights = [];
    genPairs.forEach(([m, c]) => {
      const post = GENERATION_POST_STYLE[`${m}->${c}`];
      if (post && (energyBand(levels[m]) === "healthy" || energyBand(levels[m]) === "excess") && clampEnergyLevel(levels[c]) >= 1) {
        conversionHighlights.push(`${post.headline}：${post.text}`);
      }
    });
    const conversionTop2 = conversionHighlights.slice(0, 2);

    const genOrder = ["木", "火", "土", "金", "水"];
    const startIdx = genOrder.indexOf(strongest);
    const path = Array.from({ length: 5 }, (_, i) => genOrder[(startIdx + i) % 5]).join("→");
    const generation =
      `五行狀態：\n${elementTagsLines.join("\n")}\n\n` +
      `能量路徑（以最強為起點）：${path}\n\n` +
      (conversionTop2.length ? `相生亮點：\n- ${conversionTop2.join("\n- ")}` : "");

    // 相剋：精簡制衡描述，深度路徑警訊最多 2 條
    const kePairs = [["木", "土"], ["土", "水"], ["水", "火"], ["火", "金"], ["金", "木"]];
    const destructiveNotes = [];
    const constraintNotes = [];
    kePairs.forEach(([a, b]) => {
      const badge = relationBadge(levels[a], levels[b]);
      const post = OVERCOMING_POST_STYLE[`${a}->${b}`];
      if (badge === "強弱" && post) destructiveNotes.push(`${post.headline}：${post.text}`);
      else if (badge === "弱強" && post) constraintNotes.push(`${post.headline}：${post.text}`);
    });
    const destructiveTop2 = destructiveNotes.slice(0, 2);
    const constraintTop2 = constraintNotes.slice(0, 2);

    const overcoming =
      (destructiveTop2.length ? `深度路徑警訊：\n- ${destructiveTop2.join("\n- ")}` : "") +
      (destructiveTop2.length && constraintTop2.length ? "\n\n" : "") +
      (constraintTop2.length ? `制衡提醒：\n- ${constraintTop2.join("\n- ")}` : "");

    // 短板：精簡，無學術字眼
    const weaknessLines = [];
    weaknessLines.push(`短板【${weakest}】${tag(levels[weakest])}：${ELEMENT_CORE_MEANING[weakest].core}—${meaningText(weakest, levels[weakest])}`);

    const missing = keys.filter((k) => clampEnergyLevel(levels[k]) === 0);
    if (missing.length) {
      missing.forEach((k) => weaknessLines.push(`缺${k}：${ELEMENT_CORE_MEANING[k].remedy}`));
    }
    const weakness = weaknessLines.join("\n");

    // StrategistNote：李伯彥口吻，主場/雷區/權重/通關/人生遊戲/算力/提款區/高難度副本
    const strategistNote = buildStrategistNote({
      strongest, weakest, levels, title,
      conversionTop2, destructiveTop2, weakness,
      ELEMENT_CORE_MEANING, ENERGY_LABEL, clampEnergyLevel,
    });

    return { title, generation, overcoming, weakness, levels, strongest, weakest, strategistNote };
  }

  /**
   * 構建戰略筆記（李伯彥風格）
   * @param {Object} opts 選項物件
   * @returns {string} 戰略筆記文字
   */
  function buildStrategistNote(opts) {
    const { strongest, weakest, levels, conversionTop2, destructiveTop2, weakness, ELEMENT_CORE_MEANING, ENERGY_LABEL, clampEnergyLevel } = opts;
    const lines = [];
    const strongTag = ENERGY_LABEL[clampEnergyLevel(levels[strongest])];
    const weakTag = ENERGY_LABEL[clampEnergyLevel(levels[weakest])];
    lines.push(`你的主場在【${strongest}】${strongTag}，權重最高；雷區在【${weakest}】${weakTag}，容易變成人生遊戲裡的高難度副本。`);
    if (destructiveTop2.length) {
      lines.push(`系統 Bug：${destructiveTop2[0].split("：")[0]}—先止損再談通關。`);
    }
    if (conversionTop2.length) {
      lines.push(`提款區：${conversionTop2[0].split("：")[0]}，把算力投在這裡變現。`);
    }
    lines.push(`這局不是算命，是給你一張拿回主導權的說明書。接下來，把精力投向能提款的地方，避開雷區，穩穩通關。`);
    return lines.join("\n");
  }

  /**
   * 生成伯彥戰略看板
   * @param {Object} wx 五行數值物件
   * @returns {Object} { levels, strongest, weakest, wxRaw, 本局屬性, 戰略亮點, 系統風險, 伯彥助推 }
   */
  function getBoyanBoard(wx) {
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
    const M = ELEMENT_CORE_MEANING;

    const 本局屬性 =
      `🔥 本局屬性：${strongest}系主導（${ELEMENT_TYPE[strongest] || "均衡型"}）。${meaningText(strongest, levels[strongest])}，但${M[weakest]?.core || ""}支撐不足。`;

    const genPairs = [["木", "火"], ["火", "土"], ["土", "金"], ["金", "水"], ["水", "木"]];
    const genPair = genPairs.find(([m]) => m === strongest);
    const [m, c] = genPair || genPairs[0];
    const onePath = BOYAN_CONVERSION_ONE[`${m}->${c}`];
    const 戰略亮點 = onePath
      ? `🚀 最優路徑：${onePath}`
      : `🚀 最優路徑：將${M[m]?.core}（${m}）轉化為${M[c]?.core}（${c}），這才是你能拿走的資產。`;

    const kePairs = [["木", "土"], ["土", "水"], ["水", "火"], ["火", "金"], ["金", "木"]];
    let 系統風險 = "";
    for (const [a, b] of kePairs) {
      if (relationBadge(levels[a], levels[b]) !== "強弱") continue;
      const one = BOYAN_RISK_ONE[`${a}->${b}`];
      if (one) {
        系統風險 = `🚨 系統風險：${one}`;
        break;
      }
    }
    if (!系統風險) {
      系統風險 = `🚨 系統風險：${weakest}（${M[weakest]?.core}）偏弱，易拖慢整體。`;
    }

    const 伯彥助推 = BOYAN_PUSH[weakest] || `這一關，先把【${weakest}】補上再談放大。`;

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
    };
  }
})();
