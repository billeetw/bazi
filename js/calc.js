/* calc.js
 * 負責所有「計算／資料邏輯」（bazi / ziwei / liuyue）
 * 不直接碰 DOM，不做事件綁定。
 *
 * 以 window.Calc 暴露給 ui.js 使用（避免引入打包工具）。
 */

(function () {
  "use strict";

  // ====== CONSTANTS / MAPS ======
  // 預設「宮位順序」（從命宮開始逆行）：只用來做三方四正等「宮位邏輯」，跟畫格子的位置分開
  const PALACE_DEFAULT = [
    "命宮", "兄弟", "夫妻", "子女", "財帛", "疾厄",
    "遷移", "僕役", "官祿", "田宅", "福德", "父母",
  ];

  // 宮位簡繁對照（找星曜、找資料庫用）
  const PALACE_KEY_MAP = {
    "兄弟": ["兄弟", "兄弟宮"],
    "命宮": ["命宮", "命宫"],
    "夫妻": ["夫妻", "夫妻宮"],
    "子女": ["子女", "子女宮"],
    "財帛": ["財帛", "财帛", "財帛宮", "财帛宫"],
    "疾厄": ["疾厄", "疾厄宮"],
    "遷移": ["遷移", "迁移", "遷移宮", "迁移宫"],
    "僕役": ["僕役", "仆役", "僕役宮", "仆役宫"],
    "官祿": ["官祿", "官禄", "官祿宮", "官禄宫"],
    "田宅": ["田宅", "田宅宮"],
    "福德": ["福德", "福德宮"],
    "父母": ["父母", "父母宮"],
  };

  // 12 宮盤面位置（4x4 外圈）— 這是「地支座標」
  // 索引：0:寅(左下), 1:卯, 2:辰, 3:巳(左上), 4:午, 5:未,
  //      6:申(右上), 7:酉, 8:戌, 9:亥(右下),10:子, 11:丑
  const gridAreas = [
    "4/1/5/2", // 0: 寅 (左下)
    "3/1/4/2", // 1: 卯
    "2/1/3/2", // 2: 辰
    "1/1/2/2", // 3: 巳 (左上)
    "1/2/2/3", // 4: 午
    "1/3/2/4", // 5: 未
    "1/4/2/5", // 6: 申 (右上)
    "2/4/3/5", // 7: 酉
    "3/4/4/5", // 8: 戌
    "4/4/5/5", // 9: 亥 (右下)
    "4/3/5/4", // 10: 子
    "4/2/5/3", // 11: 丑
  ];

  // 固定的「地支環」，對應上面 gridAreas 的順序
  const BRANCH_RING = ["寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥", "子", "丑"];

  // 星曜簡→繁對照（單一來源）。後端請使用同份 data/star-name-trad.json，避免重複維護。
  const STAR_NAME_TRAD_MAP = {
    // 14 主星
    "紫微": "紫微", "紫薇": "紫微",
    "天机": "天機", "天機": "天機",
    "太阳": "太陽", "太陽": "太陽",
    "太阴": "太陰", "太陰": "太陰",
    "武曲": "武曲",
    "天同": "天同",
    "廉贞": "廉貞", "廉貞": "廉貞",
    "天府": "天府",
    "贪狼": "貪狼", "貪狼": "貪狼",
    "巨门": "巨門", "巨門": "巨門",
    "天相": "天相",
    "天梁": "天梁",
    "七杀": "七殺", "七殺": "七殺",
    "破军": "破軍", "破軍": "破軍",

    // 六吉星
    "左辅": "左輔", "左輔": "左輔",
    "右弼": "右弼",
    "文昌": "文昌",
    "文曲": "文曲",
    "天魁": "天魁",
    "天钺": "天鉞", "天鉞": "天鉞",

    // 六煞星
    "擎羊": "擎羊",
    "陀罗": "陀羅", "陀羅": "陀羅",
    "火星": "火星",
    "铃星": "鈴星", "鈴星": "鈴星",
    "地劫": "地劫",
    "地空": "地空",

    // 重要輔星
    "禄存": "祿存", "祿存": "祿存",
    "天马": "天馬", "天馬": "天馬",
    "天伤": "天傷", "天傷": "天傷",
    "天使": "天使",
    "天才": "天才",
    "天寿": "天壽", "天壽": "天壽",
    "天官": "天官",
    "天福": "天福",
    "天巫": "天巫",
    "天喜": "天喜",
    "天姚": "天姚",
    "紅鸞": "紅鸞", "红鸾": "紅鸞",
    "天刑": "天刑",
    "解神": "解神",

    // 雜曜與神煞
    "天厨": "天廚", "天廚": "天廚",
    "截路": "截路",
    "孤辰": "孤辰",
    "寡宿": "寡宿",
    "空亡": "空亡",
    "破碎": "破碎",
    "天贵": "天貴", "天貴": "天貴",
    "华盖": "華蓋", "華蓋": "華蓋",
    "天哭": "天哭",
    "天虚": "天虛", "天虛": "天虛",
    "天德": "天德",
    "月德": "月德",
    "旬空": "旬空",
    "台辅": "台輔", "台輔": "台輔",
    "封诰": "封誥", "封誥": "封誥",
    "龙池": "龍池", "龍池": "龍池",
    "凤阁": "鳳閣", "鳳閣": "鳳閣",
    "年解": "年解",
    "咸池": "咸池",
    "三台": "三台",
    "八座": "八座",
    "恩光": "恩光",
    "蜚廉": "蜚廉",
    "阴煞": "陰煞", "陰煞": "陰煞",
    "天月": "天月",

    // 博士十二神
    "博士": "博士",
    "力士": "力士",
    "青龍": "青龍", "青龙": "青龍",
    "小耗": "小耗",
    "將軍": "將軍", "将军": "將軍",
    "奏書": "奏書", "奏书": "奏書",
    "喜神": "喜神",
    "病符": "病符",
    "大耗": "大耗",
    "伏兵": "伏兵",
    "官府": "官府",

    // 類別型星曜
    "甲級主星": "甲級主星",
    "六吉星": "六吉星",
    "六煞星": "六煞星",
    "南斗、北斗星": "南斗、北斗星",
    "中天星": "中天星",
    "輔助星": "輔助星",
    "祿存與天馬": "祿存與天馬",
  };

  // 五行 map 用「繁體星名」
  const STAR_WUXING_MAP = {
    "紫微": "土", "天機": "木", "太陽": "火", "武曲": "金", "天同": "水",
    "廉貞": "火", "天府": "土", "太陰": "水", "貪狼": "木", "巨門": "水",
    "天相": "水", "天梁": "土", "七殺": "金", "破軍": "水",
  };

  // 地支藏干（前端顯示用，也可用於實戰結構的解釋）
  const CANGGAN_DATA = {
    "子": { "癸": 1.0 },
    "丑": { "己": 0.6, "癸": 0.3, "辛": 0.1 },
    "寅": { "甲": 0.6, "丙": 0.3, "戊": 0.1 },
    "卯": { "乙": 1.0 },
    "辰": { "戊": 0.6, "乙": 0.3, "癸": 0.1 },
    "巳": { "丙": 0.6, "庚": 0.3, "戊": 0.1 },
    "午": { "丁": 0.7, "己": 0.3 },
    "未": { "己": 0.6, "丁": 0.3, "乙": 0.1 },
    "申": { "庚": 0.6, "壬": 0.3, "戊": 0.1 },
    "酉": { "辛": 1.0 },
    "戌": { "戊": 0.6, "辛": 0.3, "丁": 0.1 },
    "亥": { "壬": 0.7, "甲": 0.3 },
  };

  // ====== PURE HELPERS ======
  function pad2(n) {
    return String(n).padStart(2, "0");
  }

  // ====== 時辰（子丑寅...）→ hour/minute（純換算） ======
  const SHICHEN_ORDER = Object.freeze(["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"]);

  // 時辰區間（每個 2 小時）的起始小時：子=23, 丑=1, 寅=3...（上半=起始那 1 小時、下半=下一個 1 小時）
  const SHICHEN_START_HOUR = Object.freeze({
    "子": 23,
    "丑": 1,
    "寅": 3,
    "卯": 5,
    "辰": 7,
    "巳": 9,
    "午": 11,
    "未": 13,
    "申": 15,
    "酉": 17,
    "戌": 19,
    "亥": 21,
  });

  // 保留舊版「中間值」對照（相容/除錯用）
  const SHICHEN_TO_HOUR = Object.freeze({
    "子": 0,   // 23-01 → 00
    "丑": 2,   // 01-03 → 02
    "寅": 4,   // 03-05 → 04
    "卯": 6,   // 05-07 → 06
    "辰": 8,   // 07-09 → 08
    "巳": 10,  // 09-11 → 10
    "午": 12,  // 11-13 → 12
    "未": 14,  // 13-15 → 14
    "申": 16,  // 15-17 → 16
    "酉": 18,  // 17-19 → 18
    "戌": 20,  // 19-21 → 20
    "亥": 22,  // 21-23 → 22
  });

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

  function toTraditionalStarName(name) {
    return STAR_NAME_TRAD_MAP[name] || name;
  }

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

  function pctFromWx(wx) {
    const total = Object.values(wx || {}).reduce((s, v) => s + (Number(v) || 0), 0) || 1;
    const pct = {};
    ["木", "火", "土", "金", "水"].forEach((k) => (pct[k] = (Number(wx?.[k] || 0) / total)));
    return { total, pct };
  }

  // ====== 五行：強弱 + 生剋一句話（純計算） ======
  // 雷達圖與註解統一採用這個軸順序（依需求：金、木、水、火、土）
  const FIVE_ELEMENTS_ORDER = ["金", "木", "水", "火", "土"];

  const SHENG_MAP = Object.freeze({
    "木": "火",
    "火": "土",
    "土": "金",
    "金": "水",
    "水": "木",
  });

  const KE_MAP = Object.freeze({
    "木": "土",
    "火": "金",
    "土": "水",
    "金": "木",
    "水": "火",
  });

  const STRONG_COMMENTS = Object.freeze({
    "木": "你的成長動能強，遇到事情會偏向突破與展開。",
    "火": "你的行動與表達能量旺盛，節奏偏快。",
    "土": "你有很強的穩定力，關鍵時刻通常靠沉住氣撐局面。",
    "金": "你的判斷力與界線感強，能快速切割與做決定。",
    "水": "你吸收資訊快，感受敏銳，是直覺與觀察型。",
  });

  const WEAK_COMMENTS = Object.freeze({
    "木": "成長與規劃動能較低，事情太慢容易讓你失去耐心。",
    "火": "外放能量較弱，不喜歡被逼著表達或站 spotlight。",
    "土": "承載力有限，長期壓力會讓你容易疲乏。",
    "金": "界線較弱，不喜衝突，容易委屈自己。",
    "水": "資訊流偏弱，容易因『不知道 enough』而焦慮。",
  });

  function toNumberOrZero(v) {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  }

  function normalizeWxByMax(wx, order = FIVE_ELEMENTS_ORDER) {
    const raw = {};
    order.forEach((k) => (raw[k] = toNumberOrZero(wx?.[k])));
    const max = Math.max(0, ...order.map((k) => raw[k]));
    const normalized = {};
    order.forEach((k) => (normalized[k] = max > 0 ? (raw[k] / max) * 100 : 0));
    return { order, raw, max, normalized };
  }

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

  // ====== 五行：能量等級診斷（0-3） ======
  // 能量等級標籤：0(低頻) 1(平穩) 2(強健) 3(過旺)
  const ENERGY_LABEL = Object.freeze({
    0: "低頻",
    1: "平穩",
    2: "強健",
    3: "過旺",
  });

  const ELEMENT_CORE_MEANING = Object.freeze({
    "木": { core: "執行、生長", low01: "猶豫不決、停滯", level2: "條理分明、穩定成長", level3: "盲目擴張、焦慮", remedy: "缺乏「動手做」的勇氣，你需要的是直接啟動，而不是持續規劃。" },
    "火": { core: "傳播、名聲", low01: "默默無聞、冷淡", level2: "熱情、影響力強", level3: "虛火上升、易碎", remedy: "你的好只有你自己知道，缺乏「傳播力」將讓你陷入孤軍奮戰。" },
    "土": { core: "信用、整合", low01: "缺乏根基、動盪", level2: "穩重、資源豐厚", level3: "頑固死板、阻礙", remedy: "所有的成就都像在沙灘上蓋房子，你需要的是「資產化」與「穩定性」。" },
    "金": { core: "決斷、規則", low01: "界線模糊、軟弱", level2: "效率、紀律、果斷", level3: "冷酷無情、偏激", remedy: "你太好說話了，缺乏「拒絕力」是你目前能量耗損的核心原因。" },
    "水": { core: "智慧、流動", low01: "思考枯竭、封閉", level2: "洞察力、靈活應變", level3: "憂慮多思、漂浮", remedy: "正在用體力對抗智力，缺乏「深度思考」會讓你陷入低效率的勤奮。" },
  });

  // 全域相生（深度貼文風格）
  const GENERATION_POST_STYLE = Object.freeze({
    "木->火": { headline: "策略引燃市場", text: "你的執行力（木）正精準轉化為市場名聲（火），品牌能量正處於上升期。" },
    "火->土": { headline: "流量沉澱資產", text: "目前的高關注度（火）應迅速轉化為品牌信用與基礎建設（土），避免熱度流失。" },
    "土->金": { headline: "資源轉化效率", text: "厚實的根基（土）是為了萃取更高效率的 SOP 與規則（金），讓組織自動運轉。" },
    "金->水": { headline: "決斷催生智慧", text: "你的紀律與邊界（金）正在為深度的思考與策略（水）提供乾淨的環境。" },
    "水->木": { headline: "智謀驅動執行", text: "充沛的智慧（水）正高效轉化為具體的執行管道（木），這是最強的變現路徑。" },
  });

  // 全域相剋（深度貼文風格）
  const OVERCOMING_POST_STYLE = Object.freeze({
    "木->土": { headline: "擴張動搖根基", text: "過度的擴張慾望（木）正在損害你的信用與穩定性（土），請注意步調。" },
    "土->水": { headline: "體制限制創意", text: "僵化的制度或過度追求穩健（土），正在扼殺你原本靈活的智慧流動（水）。" },
    "水->火": { headline: "理性壓制熱情", text: "絕對的冷靜理性（水）雖然能避險，但也可能讓你的事業缺乏感性紅利（火）。" },
    "火->金": { headline: "情緒破壞規則", text: "突發的情緒衝動或追求曝光（火），正在挑戰你辛苦建立的決斷邊界（金）。" },
    "金->木": { headline: "規則扼殺執行", text: "嚴苛的管理與自我設限（金），正在剪除你應有的執行活力與成長空間（木）。" },
  });

  function clampEnergyLevel(v) {
    const n = Number(v);
    if (!Number.isFinite(n)) return 0;
    const i = Math.round(n);
    if (i <= 0) return 0;
    if (i === 1) return 1;
    if (i === 2) return 2;
    return 3;
  }

  function energyBand(level) {
    const x = clampEnergyLevel(level);
    if (x <= 1) return "low";
    if (x === 2) return "healthy";
    return "excess";
  }

  function meaningText(el, level) {
    const m = ELEMENT_CORE_MEANING[el];
    const lv = clampEnergyLevel(level);
    if (!m) return "";
    if (lv <= 1) return m.low01;
    if (lv === 2) return m.level2;
    return m.level3;
  }

  function relationBadge(a, b) {
    const A = clampEnergyLevel(a) >= 2 ? "強" : "弱";
    const B = clampEnergyLevel(b) >= 2 ? "強" : "弱";
    return `${A}${B}`; // 強弱/弱強/強強/弱弱
  }

  // 把任意五行數值映射成 0-3：以該組數值 max 為基準分桶
  // 0: ≤25% max, 1: ≤50%, 2: ≤75%, 3: >75%
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

  function generateFiveElementDiagnosis(wx) {
    // 正規化：若 API 回傳英文鍵 (wood/fire/earth/metal/water)，轉成中文
    const EN_TO_ZH = { wood: "木", fire: "火", earth: "土", metal: "金", water: "水" };
    const keysZh = ["木", "火", "土", "金", "水"];
    const wxUse = {};
    keysZh.forEach((k) => {
      const enKey = Object.keys(EN_TO_ZH).find((en) => EN_TO_ZH[en] === k);
      wxUse[k] = toNumberOrZero(wx?.[k]) || (wx && enKey ? toNumberOrZero(wx[enKey]) : 0);
    });

    const { strongest, weakest } = getStrongestWeakest(wxUse, ["木", "火", "土", "金", "水"]);
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

  /** 伯彥戰略看板：精簡四行 + 一橫條，總字數 ≤150，無 Level/母子/深度路徑字眼 */
  const ELEMENT_TYPE = { "木": "執行型", "火": "傳播型", "土": "整合型", "金": "決斷型", "水": "流動型" };
  const BOYAN_CONVERSION_ONE = {
    "木->火": "將執行力（木）轉成能見度（火），這才是你能拿走的資產。",
    "火->土": "將高關注度（火）沉澱為品牌信用（土），這才是你能拿走的資產。",
    "土->金": "將根基（土）萃成規則與效率（金），這才是你能拿走的資產。",
    "金->水": "將決斷與邊界（金）催生深度思考（水），這才是你能拿走的資產。",
    "水->木": "將智慧（水）轉成具體執行（木），這才是你能拿走的資產。",
  };
  const BOYAN_RISK_ONE = {
    "木->土": "擴張慾望（木）正在損害信用與穩定（土）。",
    "土->水": "體制與穩健（土）正在限制智慧流動（水）。",
    "水->火": "理性（水）壓制熱情（火），事業缺乏感性紅利。",
    "火->金": "情緒衝動（火）正在燒毀決斷邊界（金）。你太好說話了，這會讓你能量耗損。",
    "金->木": "規則與自我設限（金）正在扼殺執行活力（木）。",
  };
  const BOYAN_PUSH = {
    "木": "別再只規劃不行動。這一關，你要練的是「動手做」。",
    "火": "別再默默做事。這一關，你要練的是「傳播力」。",
    "土": "別在沙灘上蓋房子。這一關，你要練的是「資產化」。",
    "金": "別再為了討好而妥協。這一關，你要練的是「拒絕力」。",
    "水": "別用體力對抗智力。這一關，你要練的是「深度思考」。",
  };

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

  // 三方四正：本宮 + 對宮( +6 ) + 三合( +4, +8 )
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

  // ====== 星曜權重系統（基於 ziweiWeights.json）======
  // 星曜繁體名稱 → JSON ID 映射表
  const STAR_NAME_TO_ID_MAP = {
    // 14 主星
    "紫微": "ZiWei",
    "天府": "TianFu",
    "太陽": "TaiYang",
    "武曲": "WuQu",
    "廉貞": "LianZhen",
    "天梁": "TianLiang",
    "七殺": "QiSha",
    "天相": "TianXiang",
    "天機": "TianJi",
    "巨門": "JuMen",
    "貪狼": "TanLang",
    "太陰": "TaiYin",
    "天同": "TianTong",
    "破軍": "PoJun",
    // 輔星
    "左輔": "ZuoFu",
    "右弼": "YouBi",
    "文昌": "WenChang",
    "文曲": "WenQu",
    "天魁": "TianKui",
    "天鉞": "TianYue",
    "祿存": "LuCun",
    "天馬": "TianMa",
    "擎羊": "QingYang",
    "陀羅": "TuoLuo",
    "火星": "HuoXing",
    "鈴星": "LingXing",
    "地劫": "DiJie",
    "地空": "DiKong",
  };

  // 宮位繁體名稱 → JSON 英文標識映射表
  const PALACE_NAME_TO_ID_MAP = {
    "命宮": "Self",
    "兄弟": "Siblings",
    "夫妻": "Spouse",
    "子女": "Children",
    "財帛": "Wealth",
    "疾厄": "Health",
    "遷移": "Travel",
    "僕役": "Friends",
    "官祿": "Career",
    "田宅": "Property",
    "福德": "Karma",
    "父母": "Parents",
  };

  // 權重資料緩存
  let ziweiWeightsCache = null;
  let ziweiWeightsLoadPromise = null;

  /**
   * 載入 ziweiWeights.json 權重資料（含錯誤處理與緩存）
   * @returns {Promise<Object>} 權重資料物件
   */
  function loadZiweiWeights() {
    if (ziweiWeightsCache) {
      return Promise.resolve(ziweiWeightsCache);
    }
    if (ziweiWeightsLoadPromise) {
      return ziweiWeightsLoadPromise;
    }
    ziweiWeightsLoadPromise = fetch("data/ziweiWeights.json")
      .then((resp) => {
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        return resp.json();
      })
      .then((data) => {
        ziweiWeightsCache = data;
        return data;
      })
      .catch((err) => {
        console.warn("無法載入 ziweiWeights.json，使用預設值:", err);
        // 返回空結構作為預設值
        ziweiWeightsCache = { mainStars: [], assistantStars: [], minorStars: [], deities: [] };
        return ziweiWeightsCache;
      });
    return ziweiWeightsLoadPromise;
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
   * @param {Object} weightsData 權重資料（可選，若未提供則從緩存載入）
   * @returns {Object|null} 星曜權重配置物件，包含 baseScore, brightnessMultiplier, resonanceMap, strategicTag 等
   */
  function getStarWeightConfig(starName, weightsData) {
    if (!starName) return null;
    
    const data = weightsData || ziweiWeightsCache;
    if (!data) {
      // 如果沒有權重資料，嘗試使用基本映射表
      const starId = STAR_NAME_TO_ID_MAP[starName];
      if (!starId) return null;
      return null; // 需要權重資料才能返回配置
    }

    // 構建完整的映射表
    const completeMap = buildCompleteStarNameMap(data);
    const starId = completeMap[starName];
    if (!starId) return null;

    // 按優先級查找：主星 → 輔星 → 雜曜 → 神煞
    const mainStar = data.mainStars?.find((s) => s.id === starId);
    if (mainStar) return mainStar;

    const assistantStar = data.assistantStars?.find((s) => s.id === starId);
    if (assistantStar) return assistantStar;

    const minorStar = data.minorStars?.find((s) => s.id === starId);
    if (minorStar) return minorStar;

    const deity = data.deities?.find((s) => s.id === starId);
    if (deity) return deity;

    return null;
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

  // ====== 小限／四化（依年齡、性別與命宮天干推算，與 iztro horoscope 對齊用）======
  const STEMS = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"];
  const BRANCH_ORDER = { "寅": 0, "卯": 1, "辰": 2, "巳": 3, "午": 4, "未": 5, "申": 6, "酉": 7, "戌": 8, "亥": 9, "子": 10, "丑": 11 };
  // 年干 → 寅宮天干（五虎遁）
  const YIN_STEM_FROM_YEAR = { "甲": "丙", "乙": "戊", "丙": "庚", "丁": "壬", "戊": "甲", "己": "丙", "庚": "戊", "辛": "庚", "壬": "壬", "癸": "甲" };

  /** 十天干與四化對應 + 權重（祿 3 / 權 2 / 科 1 / 忌 -3），供小限動態導覽與宮位強度聯動 */
  const SI_HUA_MAP = {
    "甲": { "廉貞": "祿", "破軍": "權", "武曲": "科", "太陽": "忌", weights: { "廉貞": 3, "破軍": 2, "武曲": 1, "太陽": -3 } },
    "乙": { "天機": "祿", "天梁": "權", "紫微": "科", "太陰": "忌", weights: { "天機": 3, "天梁": 2, "紫微": 1, "太陰": -3 } },
    "丙": { "天同": "祿", "天機": "權", "文昌": "科", "廉貞": "忌", weights: { "天同": 3, "天機": 2, "文昌": 1, "廉貞": -3 } },
    "丁": { "太陰": "祿", "天同": "權", "天機": "科", "巨門": "忌", weights: { "太陰": 3, "天同": 2, "天機": 1, "巨門": -3 } },
    "戊": { "貪狼": "祿", "太陰": "權", "右弼": "科", "天機": "忌", weights: { "貪狼": 3, "太陰": 2, "右弼": 1, "天機": -3 } },
    "己": { "武曲": "祿", "貪狼": "權", "天梁": "科", "文曲": "忌", weights: { "武曲": 3, "貪狼": 2, "天梁": 1, "文曲": -3 } },
    "庚": { "太陽": "祿", "武曲": "權", "太陰": "科", "天同": "忌", weights: { "太陽": 3, "武曲": 2, "太陰": 1, "天同": -3 } },
    "辛": { "巨門": "祿", "太陽": "權", "文曲": "科", "文昌": "忌", weights: { "巨門": 3, "太陽": 2, "文曲": 1, "文昌": -3 } },
    "壬": { "天梁": "祿", "紫微": "權", "左輔": "科", "武曲": "忌", weights: { "天梁": 3, "紫微": 2, "左輔": 1, "武曲": -3 } },
    "癸": { "破軍": "祿", "巨門": "權", "太陰": "科", "貪狼": "忌", weights: { "破軍": 3, "巨門": 2, "太陰": 1, "貪狼": -3 } },
  };

  /** 小限宮位天干 → 四化星曜 { 祿, 權, 科, 忌 }（由 SI_HUA_MAP 反推，供 Badge 用） */
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

  /** 小限天干 → 四化權重 { 星名: 分數 } */
  function getSiHuaWeights(stem) {
    const row = SI_HUA_MAP[stem];
    return (row && row.weights) ? row.weights : {};
  }

  // ====== Pipeline 架構：紫微評分六階段 ======
  
  /**
   * Stage 1: Base Score（基礎分數）
   * 計算星曜的基礎權重分數
   * @param {Object} context 評分上下文
   * @param {Object} weightsData 權重資料
   * @returns {Object} 更新後的上下文
   */
  function stageBaseScore(context, weightsData) {
    const { stars } = context;
    
    stars.forEach(starCtx => {
      const { config } = starCtx;
      if (!config) {
        // 預設值處理
        starCtx.baseScore = starCtx.category === 'main' ? 5 : 1;
        starCtx.correctionFactor = 1.0;
        return;
      }
      
      // 基礎分數 = baseScore
      starCtx.baseScore = config.baseScore || 0;
      starCtx.correctionFactor = 1.0; // 初始修正係數
    });

    // 計算主星和輔星的總基礎分數
    context.baseScore = stars
      .filter(s => s.category === 'main' || s.category === 'assistant')
      .reduce((sum, s) => sum + s.baseScore, 0);

    return context;
  }

  /**
   * Stage 2: Brightness Multiplier（亮度乘數）
   * 根據星曜亮度狀態應用乘數
   * @param {Object} context 評分上下文
   * @param {Object} ziwei 紫微命盤資料
   * @param {string} palaceName 宮位名稱
   * @returns {Object} 更新後的上下文
   */
  function stageBrightness(context, ziwei, palaceName) {
    const { stars } = context;
    
    stars.forEach(starCtx => {
      const { name, config } = starCtx;
      if (!config) return;

      // 獲取亮度狀態
      starCtx.brightness = getStarBrightness(ziwei, name, palaceName);
      
      // 應用亮度乘數
      const brightnessMultiplier = config.brightnessMultiplier?.[starCtx.brightness] || 1.0;
      starCtx.correctionFactor *= brightnessMultiplier;
      
      // 更新基礎分數（應用亮度）
      starCtx.baseScore *= brightnessMultiplier;
    });

    // 重新計算主星和輔星的總分數
    context.baseScore = stars
      .filter(s => s.category === 'main' || s.category === 'assistant')
      .reduce((sum, s) => sum + s.baseScore, 0);

    return context;
  }

  /**
   * Stage 3: Resonance Map（宮位共鳴係數）
   * 根據星曜與宮位的共鳴度應用係數
   * @param {Object} context 評分上下文
   * @returns {Object} 更新後的上下文
   */
  function stageResonance(context) {
    const { stars, palaceId } = context;
    
    stars.forEach(starCtx => {
      const { config } = starCtx;
      if (!config) return;

      // 應用共鳴係數
      const resonance = config.resonanceMap?.[palaceId] || 1.0;
      starCtx.correctionFactor *= resonance;
      
      // 更新基礎分數（應用共鳴）
      starCtx.baseScore *= resonance;
    });

    // 重新計算主星和輔星的總分數
    context.baseScore = stars
      .filter(s => s.category === 'main' || s.category === 'assistant')
      .reduce((sum, s) => sum + s.baseScore, 0);

    return context;
  }

  /**
   * Stage 4: Element Boost（五行增益）
   * 根據五行相生相剋應用增益（預留擴展）
   * @param {Object} context 評分上下文
   * @param {Object} ziwei 紫微命盤資料
   * @returns {Object} 更新後的上下文
   */
  function stageElement(context, ziwei) {
    // 目前暫不實現五行增益，預留擴展接口
    // 未來可以根據宮位五行、星曜五行等計算增益係數
    return context;
  }

  /**
   * Stage 5: SiHua Transformation（四化增益與減損）
   * 處理化祿、化權、化科、化忌的權重調整
   * @param {Object} context 評分上下文
   * @param {Object} horoscope 小限資料
   * @param {string} palaceName 宮位名稱
   * @returns {Object} 更新後的上下文
   */
  function stageSiHua(context, horoscope, palaceName) {
    const { stars } = context;
    
    if (!horoscope || !horoscope.mutagenStars) {
      return context;
    }

    const mutagenStars = horoscope.mutagenStars;
    const sihuaWeights = { "祿": 3, "權": 2, "科": 1, "忌": -3 };
    
    // 檢查該宮位的四化星曜
    const starsInPalace = stars.map(s => s.name);
    let sihuaBoost = 0;
    let luCount = 0; // 祿存或化祿的數量（用於雙祿交會）

    ["祿", "權", "科", "忌"].forEach(hua => {
      const starName = mutagenStars[hua];
      if (starName && starsInPalace.includes(starName)) {
        sihuaBoost += sihuaWeights[hua];
        if (hua === "祿") luCount++;
      }
    });

    // 檢查祿存（如果存在）
    if (starsInPalace.includes("祿存")) {
      luCount++;
    }

    // 雙祿交會：若本宮與三方四正同時出現多個祿存或化祿，額外 +2
    // 注意：這個邏輯需要在 computePalaceBaseScore 層級處理（因為需要三方四正資訊）
    // 這裡先記錄到 metadata，後續在 finalizeStarRating 中處理
    if (luCount >= 2) {
      context.metadata = context.metadata || {};
      context.metadata.doubleLuBoost = 2;
      sihuaBoost += 2;
    }

    // 應用四化增益到修正係數
    // 注意：四化增益是絕對值，不是乘數，所以直接加到 baseScore
    context.baseScore += sihuaBoost;
    context.metadata = context.metadata || {};
    context.metadata.sihuaBoost = sihuaBoost;

    return context;
  }

  /**
   * Stage 6: Penalty & Special Rules（懲罰與特殊規則）
   * 處理神煞的特殊機制：penaltyTrigger, maxStarRating, strategicAdvice, 2026預警
   * @param {Object} context 評分上下文
   * @param {Object} weightsData 權重資料
   * @param {Object} options 選項 { horoscope, year }
   * @returns {Object} 更新後的上下文
   */
  function stagePenalty(context, weightsData, options = {}) {
    const { stars, palaceId, palaceName } = context;
    const { horoscope, year } = options;

    // 計算雜曜增壓（限制在 ±10）
    let minorBoost = 0;
    stars
      .filter(s => s.category === 'minor' || s.category === 'deity')
      .forEach(starCtx => {
        const score = starCtx.baseScore * starCtx.correctionFactor;
        minorBoost += score;
      });
    context.minorBoost = Math.max(-10, Math.min(10, minorBoost));

    // 處理神煞的特殊機制
    stars
      .filter(s => s.category === 'deity')
      .forEach(starCtx => {
        const { name, config } = starCtx;
        if (!config) return;

        // 1. penaltyTrigger（特定宮位額外懲罰）
        if (config.penaltyTrigger?.palaces?.includes(palaceId)) {
          const penalty = config.penaltyTrigger.penalty || 0;
          context.penaltyApplied = (context.penaltyApplied || 0) + penalty;
        }

        // 2. maxStarRating（星等上限鎖定）
        if (config.penaltyTrigger?.maxStarRating) {
          const trigger = config.penaltyTrigger;
          if (!trigger.palaces || trigger.palaces.includes(palaceId)) {
            const currentMax = context.maxStarRating;
            const newMax = trigger.maxStarRating;
            if (currentMax === null || newMax < currentMax) {
              context.maxStarRating = newMax;
            }
          }
        }

        // 3. strategicAdvice（戰略建議）
        if (config.strategicTag) {
          context.strategicAdvice = context.strategicAdvice || [];
          context.strategicAdvice.push(config.strategicTag);
        }

        // 4. 2026 預警機制：廉貞化忌 + 行政類神煞
        if (horoscope && year === 2026) {
          const mutagenStars = horoscope.mutagenStars || {};
          const isLianZhenJi = mutagenStars.忌 === "廉貞";
          const isAdministrativeDeity = config.strategicTag === "行政風險" || 
                                       config.id === "GuanFu" || 
                                       config.id === "ZhiBei";
          
          if (isLianZhenJi && isAdministrativeDeity && stars.some(s => s.name === "廉貞")) {
            const starScore = starCtx.baseScore * starCtx.correctionFactor;
            context.penaltyApplied = (context.penaltyApplied || 0) + Math.abs(starScore) * 2;
          }
        }

        // 5. 官符 + 化忌的星等降級
        if (config.penaltyTrigger?.withTransformation === "忌") {
          const mutagenStars = horoscope?.mutagenStars || {};
          const hasJi = stars.some(s => {
            const jiStar = mutagenStars.忌;
            return jiStar && s.name === jiStar;
          });
          if (hasJi && config.penaltyTrigger.starRatingReduction) {
            const currentMax = context.maxStarRating;
            if (currentMax === null || currentMax > 4) {
              context.maxStarRating = 4;
            }
          }
        }
      });

    return context;
  }

  /**
   * 執行完整的評分 Pipeline
   * @param {Object} ziwei 紫微命盤資料
   * @param {string} palaceName 宮位名稱（繁體）
   * @param {Object} weightsData 權重資料
   * @param {Object} options 選項 { horoscope, year }
   * @returns {Object} 評分上下文
   */
  function executePipeline(ziwei, palaceName, weightsData, options = {}) {
    const { horoscope, year } = options;
    
    // 獲取宮位星曜
    const stars = getStarsForPalace(ziwei, palaceName)
      .map(toTraditionalStarName)
      .map(starName => {
        const config = getStarWeightConfig(starName, weightsData);
        const isMainStar = config && config.baseScore >= 6 && 
                          weightsData?.mainStars?.some(s => s.id === config.id);
        const isAssistant = weightsData?.assistantStars?.some(s => s.id === config?.id);
        const isMinor = weightsData?.minorStars?.some(s => s.id === config?.id);
        const isDeity = weightsData?.deities?.some(s => s.id === config?.id);
        
        let category = 'minor';
        if (isMainStar) category = 'main';
        else if (isAssistant) category = 'assistant';
        else if (isDeity) category = 'deity';

        return {
          name: starName,
          config: config,
          category: category,
          brightness: null,
          baseScore: 0,
          correctionFactor: 1.0
        };
      });

    const palaceId = PALACE_NAME_TO_ID_MAP[palaceName] || "Self";
    
    // 初始化上下文
    let context = {
      palaceName,
      palaceId,
      stars,
      baseScore: 0,
      minorBoost: 0,
      correctionFactor: 1.0,
      strategicAdvice: [],
      maxStarRating: null,
      penaltyApplied: 0,
      metadata: {}
    };

    // 空宮處理：若當前宮位無主星，獲取對宮的主星與輔星資料
    const hasMainStar = stars.some(s => s.category === 'main');
    if (!hasMainStar) {
      const { opposite } = computeRelatedPalaces(PALACE_DEFAULT, palaceName);
      if (opposite && opposite !== palaceName) {
        const oppositeStars = getStarsForPalace(ziwei, opposite)
          .map(toTraditionalStarName)
          .map(starName => {
            const config = getStarWeightConfig(starName, weightsData);
            const isMainStar = config && config.baseScore >= 6 && 
                              weightsData?.mainStars?.some(s => s.id === config.id);
            const isAssistant = weightsData?.assistantStars?.some(s => s.id === config?.id);
            
            if (isMainStar || isAssistant) {
              return {
                name: starName,
                config: config,
                category: isMainStar ? 'main' : 'assistant',
                brightness: null,
                baseScore: 0,
                correctionFactor: 1.0
              };
            }
            return null;
          })
          .filter(s => s !== null);

        // 為對宮星曜創建臨時上下文並執行前三個階段
        let oppositeContext = {
          palaceName: opposite,
          palaceId: PALACE_NAME_TO_ID_MAP[opposite] || "Self",
          stars: oppositeStars,
          baseScore: 0,
          minorBoost: 0,
          correctionFactor: 1.0,
          strategicAdvice: [],
          maxStarRating: null,
          penaltyApplied: 0,
          metadata: {}
        };

        oppositeContext = stageBaseScore(oppositeContext, weightsData);
        oppositeContext = stageBrightness(oppositeContext, ziwei, opposite);
        oppositeContext = stageResonance(oppositeContext);

        // 對宮分數以 70% 計入當前宮位
        context.baseScore += oppositeContext.baseScore * 0.7;
      }
    }

    // 執行 Pipeline 六個階段
    context = stageBaseScore(context, weightsData);
    context = stageBrightness(context, ziwei, palaceName);
    context = stageResonance(context);
    context = stageElement(context, ziwei);
    context = stageSiHua(context, horoscope, palaceName);
    context = stagePenalty(context, weightsData, { horoscope, year });

    return context;
  }

  /**
   * 計算單一宮位的基礎星曜評分（Pipeline 重構版：使用六階段 Pipeline 架構）
   * @param {Object} ziwei 紫微命盤資料
   * @param {string} palaceName 宮位名稱（繁體）
   * @param {Object} weightsData 權重資料（可選）
   * @param {Object} options 選項 { horoscope, year } 用於神煞特殊機制
   * @returns {Object} { score: number, minorBoost: number, strategicAdvice: string[], maxStarRating: number|null, penaltyApplied: number }
   */
  function computeSinglePalaceScore(ziwei, palaceName, weightsData, options = {}) {
    // 使用 Pipeline 架構進行評分
    if (!ziwei || !ziwei.mainStars) {
      return { score: 0, minorBoost: 0, strategicAdvice: [], maxStarRating: null, penaltyApplied: 0 };
    }
    
    const stars = getStarsForPalace(ziwei, palaceName).map(toTraditionalStarName);
    if (!stars.length) {
      return { score: 0, minorBoost: 0, strategicAdvice: [], maxStarRating: null, penaltyApplied: 0 };
    }

    // 執行 Pipeline
    const context = executePipeline(ziwei, palaceName, weightsData, options);

    // 轉換為舊格式（向後兼容）
    const totalScore = context.baseScore + context.minorBoost - (context.penaltyApplied || 0);

    return {
      score: Math.max(0, totalScore),
      minorBoost: context.minorBoost || 0,
      strategicAdvice: context.strategicAdvice || [],
      maxStarRating: context.maxStarRating,
      penaltyApplied: context.penaltyApplied || 0
    };
  }

  /**
   * L7: 主觀頻率修正（Subjective Boost）
   * 根據使用者的個人資料，判斷當前計算的宮位是否與其該年度的「小限宮位」重疊
   * 模擬「個人化體感區分度」：小限宮位會產生更強烈的波動感
   * 
   * @param {Object} spatialScores 經過 L4 空間聚合後的分數物件
   * @param {string} xiaoXianPalace 小限宮位名稱（繁體，如 "官祿"）
   * @returns {Object} 包含 subjectiveAdjustedScore 和 isSubjectiveFocus 的結果物件
   */
  function stageSubjectiveBoost(spatialScores, xiaoXianPalace) {
    if (!spatialScores || typeof spatialScores !== 'object' || !xiaoXianPalace) {
      return spatialScores || {};
    }

    const subjectiveAdjustedScores = {};
    const SUBJECTIVE_BOOST_COEFFICIENT = 1.5; // 增益係數 α = 1.5

    // 遍歷所有宮位，檢查是否為小限宮位
    Object.keys(spatialScores).forEach((palaceName) => {
      const spatialData = spatialScores[palaceName];
      if (!spatialData) {
        subjectiveAdjustedScores[palaceName] = spatialData;
        return;
      }

      // 判定邏輯：IF currentPalace.id == user.xiaoXianPalace
      const isSubjectiveFocus = palaceName === xiaoXianPalace;
      
      if (isSubjectiveFocus) {
        // 該宮位的 finalScore 乘以 1.5 倍（增益係數 α = 1.5）
        const originalScore = spatialData.spatialAdjustedScore || spatialData.score || 0;
        const boostedScore = originalScore * SUBJECTIVE_BOOST_COEFFICIENT;
        
        // 確保分數不超過 100（因為已經標準化過）
        const cappedScore = Math.min(100, boostedScore);

        subjectiveAdjustedScores[palaceName] = {
          ...spatialData,
          spatialAdjustedScore: Math.round(cappedScore * 10) / 10,
          subjectiveAdjustedScore: Math.round(cappedScore * 10) / 10,
          isSubjectiveFocus: true,
          // 保留原始分數供參考
          originalSpatialScore: originalScore,
          boostApplied: SUBJECTIVE_BOOST_COEFFICIENT
        };
      } else {
        // ELSE 保持原分數
        subjectiveAdjustedScores[palaceName] = {
          ...spatialData,
          isSubjectiveFocus: false
        };
      }
    });

    return subjectiveAdjustedScores;
  }

  /**
   * L4: 空間連動（三方四正聚合）
   * 在計算完所有 12 宮位的基礎分後，統一應用三方四正加權
   * 模擬「資源協作與環境牽制」的空間效應
   * 
   * @param {Object} baseScores 所有宮位的基礎分數物件 { "命宮": { score, ... }, ... }
   * @param {Array<string>} palaceOrder 宮位順序陣列（預設為 PALACE_DEFAULT）
   * @returns {Object} 包含 spatialAdjustedScore 的結果物件
   */
  function applySpatialAggregation(baseScores, palaceOrder = PALACE_DEFAULT) {
    if (!baseScores || typeof baseScores !== 'object') {
      return {};
    }

    const spatialAdjustedScores = {};
    
    // 遍歷 12 宮位，每個宮位的最終能效分需包含其「三方四正」的能量
    palaceOrder.forEach((palaceName, index) => {
      const baseData = baseScores[palaceName];
      if (!baseData || typeof baseData.score !== 'number') {
        spatialAdjustedScores[palaceName] = {
          ...baseData,
          spatialAdjustedScore: 0
        };
        return;
      }

      // 計算三方四正的索引位置
      const oppositeIdx = (index + 6) % 12;  // 對宮：索引位 + 6
      const triad1Idx = (index + 4) % 12;     // 三合位 1：索引位 + 4
      const triad2Idx = (index + 8) % 12;     // 三合位 2：索引位 + 8

      // 獲取相關宮位的基礎分數
      const oppositePalace = palaceOrder[oppositeIdx];
      const triad1Palace = palaceOrder[triad1Idx];
      const triad2Palace = palaceOrder[triad2Idx];

      const selfScore = baseData.score || 0;
      const oppositeScore = baseScores[oppositePalace]?.score || 0;
      const triad1Score = baseScores[triad1Palace]?.score || 0;
      const triad2Score = baseScores[triad2Palace]?.score || 0;

      // 權重比例設定：
      // 本宮 (Self)：100% (權重 1.0)
      // 對宮 (Opposite)：40% (權重 0.4)
      // 三合位 1 (Triad 1)：20% (權重 0.2)
      // 三合位 2 (Triad 2)：20% (權重 0.2)
      const spatialScore = (selfScore * 1.0) + 
                          (oppositeScore * 0.4) + 
                          (triad1Score * 0.2) + 
                          (triad2Score * 0.2);

      // 空間聚合後的標準化處理：
      // 基礎分未標準化，是原始分數（通常在 5-30 範圍內）
      // 加權後的理論最大值估算：
      // - 單宮最高約 30 分（主星 15 + 輔星 10 + 雜曜 5）
      // - 對宮 30 * 0.4 = 12
      // - 三合各 30 * 0.2 = 6，兩個共 12
      // - 總計：30 + 12 + 12 = 54
      // 但考慮實際情況，優秀宮位加權後分數通常在 20-40 範圍內
      // 使用 40 作為標準化基準，讓分數分布更合理，避免過度壓縮
      const MAX_THEORETICAL_SPATIAL_SCORE = 40;
      const normalizedScore = Math.max(0, Math.min(100, (spatialScore / MAX_THEORETICAL_SPATIAL_SCORE) * 100));

      spatialAdjustedScores[palaceName] = {
        ...baseData,
        spatialAdjustedScore: Math.round(normalizedScore * 10) / 10,
        // 保留原始基礎分數供參考
        baseScore: selfScore,
        // 三方四正分數詳情（用於調試和顯示）
        spatialDetails: {
          self: selfScore,
          opposite: { palace: oppositePalace, score: oppositeScore, weight: 0.4 },
          triad1: { palace: triad1Palace, score: triad1Score, weight: 0.2 },
          triad2: { palace: triad2Palace, score: triad2Score, weight: 0.2 }
        }
      };
    });

    return spatialAdjustedScores;
  }

  /**
   * 計算單一宮位的基礎分數（L1-L3 + L8，不包含 L4 三方四正）
   * 這是空間聚合前的基礎計算
   * 
   * @param {Object} ziwei 紫微命盤資料
   * @param {string} palaceName 宮位名稱（繁體）
   * @param {Object} weightsData 權重資料
   * @param {Object} options 選項 { horoscope, year }
   * @returns {Object} { score: number, strategicAdvice: string[], maxStarRating: number|null, ... }
   */
  function computeSinglePalaceBaseScore(ziwei, palaceName, weightsData, options = {}) {
    // 使用 Pipeline 計算單宮基礎分數（L1-L3 + L8）
    const result = computeSinglePalaceScore(ziwei, palaceName, weightsData, options);
    
    // 不在此階段標準化，保留原始分數
    // 標準化將在 L4 空間聚合後統一處理
    // 這樣可以保持分數的相對關係，避免過早壓縮
    return {
      score: Math.max(0, result.score), // 只確保非負數，不標準化
      strategicAdvice: result.strategicAdvice || [],
      maxStarRating: result.maxStarRating,
      minorBoost: result.minorBoost || 0,
      penaltyApplied: result.penaltyApplied || 0
    };
  }

  /**
   * 計算宮位基礎強度分數（重構版：基於 ziweiWeights.json + 三方四正加權 + 雜曜神煞整合）
   * 注意：此函數保留用於向後兼容，內部已使用新的 L4 架構
   * 
   * @param {Object} ziwei 紫微命盤資料
   * @param {string} palaceName 宮位名稱（繁體）
   * @param {Object} horoscope 小限資料（可選，用於 2026 預警機制）
   * @returns {Promise<Object>} { score: number, strategicAdvice: string[], maxStarRating: number|null }
   */
  async function computePalaceBaseScore(ziwei, palaceName, horoscope) {
    if (!ziwei || !ziwei.mainStars) {
      return { score: 0, strategicAdvice: [], maxStarRating: null };
    }

    // 載入權重資料
    const weightsData = await loadZiweiWeights();
    
    // 獲取當前年份（用於 2026 預警機制）
    const currentYear = new Date().getFullYear();
    const options = { horoscope, year: currentYear };

    // 1. 計算本宮基礎分數（包含雜曜和神煞）
    const selfResult = computeSinglePalaceScore(ziwei, palaceName, weightsData, options);

    // 2. 三方四正加權計算
    const { opposite, triads } = computeRelatedPalaces(PALACE_DEFAULT, palaceName);
    
    // 對宮分數（40% 權重）
    let oppositeResult = { score: 0, minorBoost: 0, strategicAdvice: [], maxStarRating: null, penaltyApplied: 0 };
    if (opposite && opposite !== palaceName) {
      oppositeResult = computeSinglePalaceScore(ziwei, opposite, weightsData, options);
    }

    // 三合宮位分數（各 20% 權重）
    let triad1Result = { score: 0, minorBoost: 0, strategicAdvice: [], maxStarRating: null, penaltyApplied: 0 };
    let triad2Result = { score: 0, minorBoost: 0, strategicAdvice: [], maxStarRating: null, penaltyApplied: 0 };
    if (triads && triads.length >= 2) {
      triad1Result = computeSinglePalaceScore(ziwei, triads[0], weightsData, options);
      triad2Result = computeSinglePalaceScore(ziwei, triads[1], weightsData, options);
    }

    // 綜合分數：FinalScore = Score_Self + (Score_Opposite * 0.4) + (Score_Triad1 * 0.2) + (Score_Triad2 * 0.2)
    // 注意：雜曜增壓只計入本宮，不計入三方四正
    const mainScore = selfResult.score + (oppositeResult.score * 0.4) + (triad1Result.score * 0.2) + (triad2Result.score * 0.2);
    const finalScore = mainScore + selfResult.minorBoost - selfResult.penaltyApplied;

    // 合併戰略建議（去重）
    const allStrategicAdvice = [
      ...selfResult.strategicAdvice,
      ...oppositeResult.strategicAdvice,
      ...triad1Result.strategicAdvice,
      ...triad2Result.strategicAdvice
    ];
    const uniqueStrategicAdvice = [...new Set(allStrategicAdvice)];

    // 確定最終的星等上限（取最嚴格的值）
    const allMaxStarRatings = [
      selfResult.maxStarRating,
      oppositeResult.maxStarRating,
      triad1Result.maxStarRating,
      triad2Result.maxStarRating
    ].filter(r => r != null);
    const finalMaxStarRating = allMaxStarRatings.length > 0 ? Math.min(...allMaxStarRatings) : null;

    // 標準化處理：將分數映射到 0-100 範圍
    // 理論最大值估算（考慮雜曜增壓上限 ±10）：
    // - 本宮：主星 10 * 1.5 亮度 * 1.2 共鳴 = 18，多主星 + 輔星 ≈ 25
    // - 對宮：25 * 0.4 = 10
    // - 三合：25 * 0.2 * 2 = 10
    // - 雜曜增壓：±10
    // - 總計：25 + 10 + 10 + 10 = 55（保守估計）
    const MAX_THEORETICAL_SCORE = 55;
    const normalizedScore = Math.max(0, Math.min(100, (finalScore / MAX_THEORETICAL_SCORE) * 100));

    return {
      score: Math.round(normalizedScore * 10) / 10,
      strategicAdvice: uniqueStrategicAdvice,
      maxStarRating: finalMaxStarRating
    };
  }

  /**
   * 宮位強度 + 小限四化權重加成（重構版：整合四化邏輯與雙祿交會）
   * @param {number} baseScore 基礎分數
   * @param {string[]} stars 該宮繁體星名陣列
   * @param {string} stem 小限天干
   * @param {Object} ziwei 紫微命盤資料（可選，用於雙祿交會計算）
   * @param {string} palaceName 宮位名稱（可選，用於雙祿交會計算）
   * @returns {Promise<number>} 加權後分數（0-100 標準化）
   */
  async function getPalaceScoreWithWeights(baseScore, stars, stem, ziwei, palaceName) {
    if (!Array.isArray(stars) || !stem) return baseScore;

    const weights = getSiHuaWeights(stem);
    let add = 0;
    let luCount = 0; // 化祿計數（用於雙祿交會）

    // 1. 計算四化增益與減損
    stars.forEach((starName) => {
      const weight = Number(weights[starName]) || 0;
      add += weight;
      
      // 統計化祿數量（化祿權重為 +3）
      if (weight === 3) {
        luCount++;
      }
      
      // 統計祿存（祿存本身也是祿）
      if (starName === "祿存") {
        luCount++;
      }
    });

    // 2. 雙祿交會：若本宮與三方四正同時出現多個祿存或化祿，額外給予 +2 的加成
    if (luCount >= 2 && ziwei && palaceName) {
      const { opposite, triads } = computeRelatedPalaces(PALACE_DEFAULT, palaceName);
      let relatedLuCount = luCount; // 本宮已統計的祿

      // 檢查對宮
      if (opposite && opposite !== palaceName) {
        const oppositeStars = getStarsForPalace(ziwei, opposite).map(toTraditionalStarName);
        const oppositeMutagen = getSiHuaWeights(stem);
        oppositeStars.forEach((starName) => {
          if (oppositeMutagen[starName] === 3 || starName === "祿存") {
            relatedLuCount++;
          }
        });
      }

      // 檢查三合宮位
      if (triads && triads.length >= 2) {
        triads.forEach((triadPalace) => {
          const triadStars = getStarsForPalace(ziwei, triadPalace).map(toTraditionalStarName);
          const triadMutagen = getSiHuaWeights(stem);
          triadStars.forEach((starName) => {
            if (triadMutagen[starName] === 3 || starName === "祿存") {
              relatedLuCount++;
            }
          });
        });
      }

      // 若三方四正範圍內有 2 個或以上的祿，給予 +2 加成
      if (relatedLuCount >= 2) {
        add += 2;
      }
    }

    // 3. 計算最終分數並標準化
    const finalScore = Math.max(0, (Number(baseScore) || 0) + add);
    
    // 標準化到 0-100 範圍（假設基礎分數已在 0-100 範圍內）
    const normalizedScore = Math.max(0, Math.min(100, finalScore));

    return Math.round(normalizedScore * 10) / 10;
  }

  // ====== L9: 決策映射與語義輸出 ======
  
  /**
   * 宮位一句話說明映射表（#深度貼文風格）
   * 為 12 宮位提供直覺描述，符合系統思維與商務決策直覺
   */
  const PALACE_ONE_LINERS = {
    "命宮": "你的核心作業系統",
    "兄弟": "你的戰友與近親資源",
    "夫妻": "你的親密連結與合夥狀態",
    "子女": "你的產出效能與創造力",
    "財帛": "你的金錢獲取與理財邏輯",
    "疾厄": "你的生理硬體與身心基石",
    "遷移": "你的外部接口與外界觀感",
    "僕役": "你的社交網絡與眾生緣分",
    "官祿": "你的事業軌道與執行強度",
    "田宅": "你的資產根基與穩定堡壘",
    "福德": "你的精神底蘊與內心平衡",
    "父母": "你的規則約束與權威互動"
  };

  /**
   * 戰略建議映射表（根據星等）
   * 符合 #深度貼文 框架：語氣冷靜、中性、具備系統思維與商務決策直覺
   * 蘊含溫和鼓勵性質，但保持不同級別的差異性
   */
  const STRATEGIC_ADVICE_BY_STARS = {
    5: "全速推進。能量通道完全開啟，適合執行高槓桿計畫，把握優勢時機。",
    4: "穩健擴張。系統運轉順暢，可適度增加資源投入與執行強度，持續優化流程。",
    3: "維持節奏。當前狀態平穩，建議保持現有策略，在穩定中尋找微調機會。",
    2: "聚焦優化。系統運作正常，建議優先處理核心任務，逐步建立更穩健的運作模式。",
    1: "穩步調整。系統基礎穩固，建議從關鍵環節開始優化，為後續發展打好基礎。"
  };

  /**
   * 狀態標籤映射表（根據星等）
   * 調整為更溫和、鼓勵性的標籤
   */
  // 使用全局配置（如果可用），否則使用本地定義（向後兼容）
  const STATUS_LABELS = (typeof window !== "undefined" && window.Config?.STATUS_LABELS) || {
    5: "極佳",
    4: "強勁",
    3: "平穩",
    2: "穩健",
    1: "基礎"
  };

  /**
   * 顏色代碼映射表（根據星等）
   * 五級分級對應五種顏色，更精確地反映能量狀態
   */
  const COLOR_CODES = (typeof window !== "undefined" && window.Config?.COLOR_CODES) || {
    5: "emerald",  // 極佳：翠綠色（4.5星）
    4: "green",    // 強勁：綠色（4.0星）
    3: "amber",    // 平穩：琥珀色（3.5星）
    2: "orange",   // 穩健：橙色（3.0星）
    1: "slate"     // 基礎：灰藍色（2.5星）
  };

  /**
   * L9: 將最終得分轉化為內部等級（1-5），用於描述文字映射
   * 
   * 使用百分位數劃分，確保每個星等都有合理的分布：
   * - 5級：Top 20%（前20%）
   * - 4級：20%-40%
   * - 3級：40%-60%
   * - 2級：60%-80%
   * - 1級：Bottom 20%（后20%）
   * 
   * @param {number} finalScore 最終分數（0-100）
   * @param {Object} allScores 所有12宮位的分數物件 { "命宮": 85.5, ... }
   * @returns {number} 內部等級（1-5），用於映射描述文字
   */
  function mapScoreToInternalLevel(finalScore, allScores = null) {
    // 如果提供了所有分數，使用相對排名（百分位數）
    if (allScores && typeof allScores === 'object') {
      const scores = Object.values(allScores).map(s => Number(s) || 0).filter(s => s >= 0);
      if (scores.length >= 2) {
        // 排序分數（降序）
        const sortedScores = [...scores].sort((a, b) => b - a);
        
        // 計算當前分數的排名（計算有多少分數大於等於當前分數）
        // 使用 >= 而不是 >，確保相同分數得到相同排名
        const rank = sortedScores.filter(s => s >= finalScore).length - 1;
        const percentile = (rank / (scores.length - 1)) * 100; // 使用 (n-1) 避免 100% 的情況
        
        // 基於百分位數劃分（確保每個等級約佔 20%）
        if (percentile < 20) return 5;  // Top 20%
        if (percentile < 40) return 4;  // 20%-40%
        if (percentile < 60) return 3;  // 40%-60%
        if (percentile < 80) return 2;  // 60%-80%
        return 1;                       // Bottom 20%
      }
    }
    
    // Fallback: 使用絕對閾值（向後兼容）
    // 調整後的閾值，更符合實際分數分布
    if (finalScore >= 80) return 5;  // 極佳
    if (finalScore >= 65) return 4;  // 強勁
    if (finalScore >= 50) return 3;  // 平穩
    if (finalScore >= 35) return 2;  // 吃力
    return 1;                        // 審慎
  }

  /**
   * L9: 將內部等級轉化為顯示星等（2.5-4.5顆星，每級0.5顆星）
   * 
   * 為了讓大家更有幸福感，最低分從2.5顆星開始：
   * - 1級（Bottom 20%）→ 2.5星
   * - 2級（60%-80%）→ 3.0星
   * - 3級（40%-60%）→ 3.5星
   * - 4級（20%-40%）→ 4.0星
   * - 5級（Top 20%）→ 4.5星
   * 
   * @param {number} internalLevel 內部等級（1-5）
   * @returns {number} 顯示星等（2.5, 3.0, 3.5, 4.0, 4.5）
   */
  function mapInternalLevelToDisplayStars(internalLevel) {
    // 映射：1→2.5, 2→3.0, 3→3.5, 4→4.0, 5→4.5
    return 2.0 + (internalLevel * 0.5);
  }

  /**
   * L9: 將最終得分轉化為顯示星等（2.5-4.5顆星）
   * 
   * @param {number} finalScore 最終分數（0-100）
   * @param {Object} allScores 所有12宮位的分數物件 { "命宮": 85.5, ... }
   * @returns {number} 顯示星等（2.5, 3.0, 3.5, 4.0, 4.5）
   */
  function mapScoreToStarRating(finalScore, allScores = null) {
    const internalLevel = mapScoreToInternalLevel(finalScore, allScores);
    return mapInternalLevelToDisplayStars(internalLevel);
  }

  /**
   * L9: 流月星等計算（與紫微對應）
   * 
   * 將流月的 riskScore（風險指數 0-100）轉換為能量指數，然後映射為星等
   * 邏輯：riskScore 越低（風險越低）→ energyScore 越高（能量越高）→ 星等越高
   * 
   * @param {number} riskScore 風險指數（0-100），越高表示風險越大
   * @param {Array} allMonths 所有12個月的流月數據陣列 [{ riskScore, ... }, ...]
   * @param {Object} ziweiPalaceMetadata 紫微宮位元數據（可選，用於關聯說明）
   * @param {Object} wuxingData 五行數據（可選，用於關聯說明）
   * @param {number} monthNum 月份編號（1-12），用於生成關聯說明
   * @returns {Object} { stars: 2.5-4.5, internalLevel: 1-5, statusLabel, colorCode, correlationNote }
   */
  function computeMonthlyStarRating(riskScore, allMonths = [], ziweiPalaceMetadata = null, wuxingData = null, monthNum = null) {
    // 1. 將風險指數轉換為能量指數（反向映射）
    // riskScore 0-100 → energyScore 100-0（風險越低，能量越高）
    const energyScore = 100 - Math.max(0, Math.min(100, Number(riskScore) || 0));
    
    // 2. 收集所有月份的能量指數，用於相對排名
    const allEnergyScores = {};
    if (Array.isArray(allMonths) && allMonths.length > 0) {
      allMonths.forEach((month, index) => {
        const monthRisk = Math.max(0, Math.min(100, Number(month.riskScore) || 0));
        const monthEnergy = 100 - monthRisk;
        // 使用月份編號作為 key（1-12）
        const monthNumKey = parseMonthFromRange(month.range) || (index + 1);
        allEnergyScores[monthNumKey] = monthEnergy;
      });
    }
    
    // 3. 使用相對排名計算內部等級（與紫微保持一致）
    const internalLevel = mapScoreToInternalLevel(energyScore, allEnergyScores);
    
    // 4. 轉換為顯示星等（2.5-4.5）
    const displayStars = mapInternalLevelToDisplayStars(internalLevel);
    
    // 5. 獲取狀態標籤和顏色代碼
    const statusLabel = STATUS_LABELS[internalLevel] || "平穩";
    const colorCode = COLOR_CODES[internalLevel] || "amber";
    
    // 6. 生成與紫微、五行關聯的一句話說明
    const correlationNote = generateMonthlyCorrelationNote(
      monthNum,
      internalLevel,
      ziweiPalaceMetadata,
      wuxingData
    );
    
    return {
      stars: displayStars,
      internalLevel: internalLevel,
      statusLabel: statusLabel,
      colorCode: colorCode,
      correlationNote: correlationNote,
      energyScore: energyScore, // 供參考
      riskScore: riskScore // 保留原始風險指數
    };
  }

  /**
   * 生成流月與紫微、五行關聯的一句話說明
   * 
   * @param {number} monthNum 月份編號（1-12）
   * @param {number} internalLevel 內部等級（1-5）
   * @param {Object} ziweiPalaceMetadata 紫微宮位元數據
   * @param {Object} wuxingData 五行數據
   * @returns {string} 一句話說明
   */
  function generateMonthlyCorrelationNote(monthNum, internalLevel, ziweiPalaceMetadata, wuxingData) {
    if (!monthNum || monthNum < 1 || monthNum > 12) {
      return "";
    }
    
    // 月份對應的紫微宮位（流月宮位映射）
    // 流月1月對應命宮，2月對應兄弟，以此類推（順時針）
    const palaceMapping = [
      "命宮", "兄弟", "夫妻", "子女", "財帛", "疾厄",
      "遷移", "僕役", "官祿", "田宅", "福德", "父母"
    ];
    const correspondingPalace = palaceMapping[monthNum - 1] || "";
    
    // 獲取對應宮位的紫微數據
    let palaceNote = "";
    if (ziweiPalaceMetadata && correspondingPalace && ziweiPalaceMetadata[correspondingPalace]) {
      const palaceData = ziweiPalaceMetadata[correspondingPalace];
      const palaceStars = palaceData.l9Output?.stars || 0;
      const palaceStatus = palaceData.l9Output?.statusLabel || "";
      
      // 根據星等差異生成說明
      const starDiff = palaceStars - (2.0 + internalLevel * 0.5);
      if (Math.abs(starDiff) < 0.3) {
        palaceNote = `與${correspondingPalace}能量同步`;
      } else if (starDiff > 0.5) {
        palaceNote = `${correspondingPalace}能量強於本月`;
      } else if (starDiff < -0.5) {
        palaceNote = `本月能量強於${correspondingPalace}`;
      } else {
        palaceNote = `對應${correspondingPalace}（${palaceStatus}）`;
      }
    } else if (correspondingPalace) {
      palaceNote = `對應${correspondingPalace}`;
    }
    
    // 獲取五行數據
    let wuxingNote = "";
    if (wuxingData && wuxingData.strategic) {
      const wuxing = wuxingData.strategic;
      const elements = ["wood", "fire", "earth", "metal", "water"];
      const elementNames = { wood: "木", fire: "火", earth: "土", metal: "金", water: "水" };
      
      // 找出最強和最弱的五行
      let maxScore = -1, maxElement = "";
      let minScore = 999, minElement = "";
      
      elements.forEach(elem => {
        const score = wuxing[elem] || 0;
        if (score > maxScore) {
          maxScore = score;
          maxElement = elementNames[elem];
        }
        if (score < minScore) {
          minScore = score;
          minElement = elementNames[elem];
        }
      });
      
      if (maxElement && minElement && maxElement !== minElement) {
        wuxingNote = `五行${maxElement}強、${minElement}弱`;
      }
    }
    
    // 組合說明
    const parts = [];
    if (palaceNote) parts.push(palaceNote);
    if (wuxingNote) parts.push(wuxingNote);
    
    if (parts.length > 0) {
      return parts.join("，");
    }
    
    // 如果沒有關聯數據，根據等級生成通用說明
    const levelNotes = {
      5: "能量通道完全開啟",
      4: "系統運轉順暢",
      3: "當前狀態平穩",
      2: "運作正常",
      1: "基礎穩固"
    };
    return levelNotes[internalLevel] || "";
  }

  /**
   * 輔助函數：從 range 字串解析月份編號
   * 優先使用全局 Utils.parseMonthFromRange（如果可用）
   * @param {string} range 月份範圍字串（如 "1/1-1/31"）
   * @returns {number} 月份編號（1-12），解析失敗返回 0
   */
  function parseMonthFromRange(range) {
    // 優先使用全局工具函數
    if (typeof window !== "undefined" && window.Utils?.parseMonthFromRange) {
      return window.Utils.parseMonthFromRange(range);
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

  /**
   * L9: 決策映射與語義輸出
   * 將經過 L1-L7 處理的最終分數轉化為完整的語義輸出物件
   * 
   * @param {string} palaceName 宮位名稱（繁體）
   * @param {number} finalScore 最終分數（0-100）
   * @param {Object} metadata 元數據（包含 strategicAdvice, maxStarRating, isSubjectiveFocus, allScores 等）
   * @returns {Object} 完整的語義輸出物件
   */
  function finalizeStarRating(palaceName, finalScore, metadata = {}) {
    const { maxStarRating, strategicAdvice = [], isSubjectiveFocus = false, allScores = null } = metadata;
    
    // 1. 計算內部等級（1-5，用於描述文字映射）
    let internalLevel = mapScoreToInternalLevel(finalScore, allScores);
    
    // 2. 應用星等上限限制（由神煞觸發）
    // maxStarRating 可能是舊格式（1-5）或新格式（2.5-4.5）
    if (maxStarRating != null) {
      let maxInternalLevel = maxStarRating;
      
      // 如果是新格式（2.5-4.5），轉換為內部等級
      if (maxStarRating >= 2.5 && maxStarRating <= 4.5) {
        maxInternalLevel = Math.round((maxStarRating - 2.0) / 0.5);
      }
      // 如果是舊格式（1-5），直接使用
      else if (maxStarRating >= 1 && maxStarRating <= 5) {
        maxInternalLevel = maxStarRating;
      }
      
      // 應用上限
      if (internalLevel > maxInternalLevel) {
        internalLevel = maxInternalLevel;
      }
    }
    
    // 3. 計算顯示星等（2.5-4.5）
    let displayStars = mapInternalLevelToDisplayStars(internalLevel);
    
    // 如果 maxStarRating 是新格式（2.5-4.5），確保顯示星等不超過上限
    if (maxStarRating != null && maxStarRating >= 2.5 && maxStarRating <= 4.5) {
      if (displayStars > maxStarRating) {
        displayStars = maxStarRating;
      }
    }

    // 3. 獲取一句話宮位說明
    const oneLiner = PALACE_ONE_LINERS[palaceName] || palaceName;

    // 4. 獲取戰略建議（使用內部等級1-5來映射描述文字）
    let strategicText = STRATEGIC_ADVICE_BY_STARS[internalLevel] || STRATEGIC_ADVICE_BY_STARS[3];
    
    // 合併來自神煞的戰略建議
    const allStrategicAdvice = [...strategicAdvice];
    
    // L7 主觀頻率修正：若觸發了 L7 增益，在建議文字前加入提示
    if (isSubjectiveFocus) {
      allStrategicAdvice.unshift("此領域為你本年度的生命重心，波動感將會特別強烈。");
    }
    
    // 將神煞建議附加到戰略文字後
    if (allStrategicAdvice.length > 0) {
      strategicText += " " + allStrategicAdvice.join(" · ");
    }

    // 5. 獲取狀態標籤和顏色代碼（使用內部等級）
    const statusLabel = STATUS_LABELS[internalLevel] || "平穩";
    const colorCode = COLOR_CODES[internalLevel] || "yellow";

    return {
      palaceName,
      oneLiner,
      stars: displayStars,  // 顯示星等（2.5-4.5）
      internalLevel: internalLevel,  // 內部等級（1-5），供參考
      statusLabel,
      strategicAdvice: strategicText,
      colorCode,
      // 保留原始數據供參考
      finalScore: Math.round(finalScore * 10) / 10,
      maxStarRating,
      isSubjectiveFocus
    };
  }

  /**
   * 流月八字戰略標籤生成器
   * 根據月份的天干地支生成戰略標籤（#深度貼文風格）
   * 
   * @param {number} month 月份（1-12）
   * @param {string} stem 天干（如 "庚"）
   * @param {string} branch 地支（如 "寅"）
   * @returns {string} 戰略標籤（如 "【剛毅開創】"）
   */
  function generateMonthStrategyTag(month, stem, branch) {
    // 天干戰略屬性映射
    const stemAttributes = {
      "甲": "剛毅開創", "乙": "柔韌適應", "丙": "熱情擴張", "丁": "細緻執行",
      "戊": "穩健累積", "己": "靈活整合", "庚": "剛毅開創", "辛": "精準優化",
      "壬": "流動擴展", "癸": "深度滲透"
    };

    // 地支戰略屬性映射
    const branchAttributes = {
      "子": "潛藏蓄力", "丑": "穩固基礎", "寅": "開創啟動", "卯": "柔韌成長",
      "辰": "整合擴張", "巳": "轉化突破", "午": "高峰執行", "未": "收穫整合",
      "申": "理性分析", "酉": "精煉優化", "戌": "穩固防禦", "亥": "深度沉潛"
    };

    const stemAttr = stemAttributes[stem] || "執行";
    const branchAttr = branchAttributes[branch] || "運轉";
    
    // 組合標籤（優先使用天干屬性，地支作為補充）
    return `【${stemAttr}】`;
  }

  /**
   * 計算所有 12 宮位的基礎分數（L4 + L7 + L9 架構重構版）
   * 
   * 流程：
   * 1. 計算所有宮位的基礎分（L1-L3 + L8，不包含三方四正）
   * 2. 應用 L4 空間連動（三方四正聚合）
   * 3. 應用 L7 主觀頻率修正（小限宮位增益）
   * 4. 應用 L9 決策映射與語義輸出
   * 5. 返回包含完整語義輸出的結果
   * 
   * @param {Object} ziwei 紫微命盤資料
   * @param {Object} horoscope 小限資料（可選）
   * @returns {Promise<Object>} 宮位分數物件 { "命宮": 85.5, "兄弟": 72.3, ... }
   * 同時將完整的 L9 語義輸出存儲到 window.ziweiPalaceMetadata
   */
  async function computeAllPalaceScores(ziwei, horoscope) {
    if (!ziwei) return {};
    
    // 預先載入權重資料（避免重複載入）
    const weightsData = await loadZiweiWeights();
    
    // 獲取當前年份（用於 2026 預警機制）
    const currentYear = new Date().getFullYear();
    const options = { horoscope, year: currentYear };
    
    // 步驟 1: 計算所有 12 宮位的基礎分數（L1-L3 + L8，不包含 L4 三方四正）
    const baseScores = {};
    const metadata = {};
    
    // 並行計算所有宮位的基礎分數
    const promises = PALACE_DEFAULT.map(async (palace) => {
      const result = computeSinglePalaceBaseScore(ziwei, palace, weightsData, options);
      baseScores[palace] = result;
      metadata[palace] = {
        strategicAdvice: result.strategicAdvice || [],
        maxStarRating: result.maxStarRating,
        baseScore: result.score
      };
      return { palace, result };
    });
    
    await Promise.all(promises);
    
    // 步驟 2: 應用 L4 空間連動（三方四正聚合）
    const spatialAdjustedResults = applySpatialAggregation(baseScores, PALACE_DEFAULT);
    
    // 步驟 3: 應用 L7 主觀頻率修正（小限宮位增益）
    const xiaoXianPalace = horoscope?.activeLimitPalaceName || null;
    const subjectiveAdjustedResults = stageSubjectiveBoost(spatialAdjustedResults, xiaoXianPalace);
    
    // 步驟 4: 應用 L9 決策映射與語義輸出
    const scores = {};
    const finalMetadata = {};
    
    // 先收集所有最終分數，用於相對排名計算
    const allFinalScores = {};
    PALACE_DEFAULT.forEach((palace) => {
      const subjectiveResult = subjectiveAdjustedResults[palace];
      if (subjectiveResult) {
        const finalScore = subjectiveResult.subjectiveAdjustedScore || 
                          subjectiveResult.spatialAdjustedScore || 
                          subjectiveResult.score || 0;
        allFinalScores[palace] = finalScore;
      } else {
        allFinalScores[palace] = baseScores[palace]?.score || 0;
      }
    });
    
    // 使用相對排名計算星等
    PALACE_DEFAULT.forEach((palace) => {
      const subjectiveResult = subjectiveAdjustedResults[palace];
      if (subjectiveResult) {
        // 優先使用 subjectiveAdjustedScore（如果存在），否則使用 spatialAdjustedScore
        const finalScore = subjectiveResult.subjectiveAdjustedScore || 
                          subjectiveResult.spatialAdjustedScore || 
                          subjectiveResult.score || 0;
        
        // L9: 生成完整的語義輸出物件（傳入所有分數用於相對排名）
        const l9Output = finalizeStarRating(palace, finalScore, {
          maxStarRating: subjectiveResult.maxStarRating || metadata[palace].maxStarRating,
          strategicAdvice: metadata[palace].strategicAdvice || [],
          isSubjectiveFocus: subjectiveResult.isSubjectiveFocus || false,
          allScores: allFinalScores  // 傳入所有分數用於相對排名
        });
        
        scores[palace] = finalScore;
        
        // 更新元數據，包含 L4、L7 和 L9 的完整輸出
        finalMetadata[palace] = {
          ...metadata[palace],
          // L1-L3 + L8 基礎數據
          baseScore: subjectiveResult.baseScore || metadata[palace].baseScore,
          // L4 空間連動數據
          spatialAdjustedScore: subjectiveResult.spatialAdjustedScore || subjectiveResult.score,
          spatialDetails: subjectiveResult.spatialDetails,
          // L7 主觀頻率修正數據
          subjectiveAdjustedScore: subjectiveResult.subjectiveAdjustedScore || null,
          isSubjectiveFocus: subjectiveResult.isSubjectiveFocus || false,
          boostApplied: subjectiveResult.boostApplied || null,
          // L9 決策映射與語義輸出（完整物件）
          l9Output: l9Output
        };
      } else {
        const finalScore = baseScores[palace]?.score || 0;
        
        // L9: 生成完整的語義輸出物件（即使沒有 L4/L7 調整）
        const l9Output = finalizeStarRating(palace, finalScore, {
          maxStarRating: metadata[palace].maxStarRating,
          strategicAdvice: metadata[palace].strategicAdvice || [],
          isSubjectiveFocus: false,
          allScores: allFinalScores  // 傳入所有分數用於相對排名
        });
        
        scores[palace] = finalScore;
        finalMetadata[palace] = {
          ...metadata[palace],
          l9Output: l9Output
        };
      }
    });
    
    // 將元數據存儲到全局狀態管理器（優先），或直接存到 window（向後兼容）
    if (typeof window !== "undefined") {
      if (window.BaziApp?.State) {
        window.BaziApp.State.setState("ziweiPalaceMetadata", finalMetadata);
      }
      // 向後兼容：也存到 window.ziweiPalaceMetadata
      window.ziweiPalaceMetadata = finalMetadata;
    }
    
    return scores;
  }

  /** 依年齡、性別得小限所在宮位索引（0=命宮…11=父母）。男順女逆，1 歲起命宮。 */
  function getYearlyIndexFromAge(age, gender) {
    const a = Math.max(1, Number(age) || 1);
    const n = (a - 1) % 12;
    if (gender === "F" || gender === "女") return (12 - n) % 12;
    return n;
  }

  /** 命宮地支 + 年干 → 命宮天干（寅宮天干 + 地支序） */
  function getMinggongStem(mingBranch, yearStem) {
    const yinStem = YIN_STEM_FROM_YEAR[yearStem] || "丙";
    const yinIdx = STEMS.indexOf(yinStem);
    const branchIdx = BRANCH_ORDER[mingBranch] ?? 0;
    return STEMS[(yinIdx + branchIdx) % 10];
  }

  /** 命宮天干 + 宮位序 → 該宮天干 */
  function getPalaceStem(mingStem, palaceIndex) {
    const idx = STEMS.indexOf(mingStem);
    return STEMS[(idx + (palaceIndex % 12)) % 10];
  }

  /** 從五行局字串解析起運歲數（水二局→2, 木三局→3, 金四局→4, 土五局→5, 火六局→6） */
  function getStartAgeFromWuxingju(wuxingju) {
    const s = String(wuxingju || "");
    const n = s.match(/(\d)/);
    if (n) return Math.max(2, Math.min(6, Number(n[1])));
    const map = { "二": 2, "三": 3, "四": 4, "五": 5, "六": 6 };
    for (const [k, v] of Object.entries(map)) if (s.includes(k)) return v;
    return 4;
  }

  /** 依五行局算出 12 宮大限年齡區間（每宮 10 年）。回傳 [ { start, end }, ... ] 對應 命宮…父母 */
  function getDecadalLimits(wuxingju) {
    const startAge = getStartAgeFromWuxingju(wuxingju);
    return PALACE_DEFAULT.map((_, i) => ({
      start: startAge + i * 10,
      end: startAge + i * 10 + 9,
    }));
  }

  /**
   * 依當前年齡、性別與命盤推算小限與四化（可與後端 iztro horoscope 並用）。
   * 回傳 { yearlyIndex, yearlyStem, mutagenStars, activeLimitPalaceName }。
   */
  function getHoroscopeFromAge(age, gender, ziwei, bazi) {
    const yearStem = (bazi?.display?.yG || "").toString().trim();
    const mingBranch = ziwei?.core?.minggongBranch || "寅";
    const mingStem = getMinggongStem(mingBranch, yearStem);
    const yearlyIndex = getYearlyIndexFromAge(age, gender);
    const yearlyStem = getPalaceStem(mingStem, yearlyIndex);
    const mutagenStars = getMutagenStars(yearlyStem);
    const activeLimitPalaceName = PALACE_DEFAULT[yearlyIndex];
    return { yearlyIndex, yearlyStem, mutagenStars, activeLimitPalaceName };
  }

  // 依「命宮地支」＋固定 PALACE_DEFAULT → 算出每一格要放哪個宮位（格子＝地支、內容＝宮位）
  // horoscope 可選：{ yearlyIndex, activeLimitPalaceName } 或後端回傳之 horoscope，用於 isActiveLimit
  function buildSlotsFromZiwei(ziwei, horoscope) {
    if (!ziwei) return [];

    // 若後端沒給或給了非 12 地支的值，就 fallback 到「寅」
    let mingBranch = ziwei?.core?.minggongBranch || "寅";
    const shenBranch = ziwei?.core?.shengongBranch || null;

    let mingIdx = BRANCH_RING.indexOf(mingBranch);
    if (mingIdx < 0) {
      mingIdx = 0;
      mingBranch = BRANCH_RING[0];
    }

    const palaceOrder = PALACE_DEFAULT;
    const activeLimitPalace = horoscope?.activeLimitPalaceName ?? (horoscope != null && Number.isInteger(horoscope.yearlyIndex) ? palaceOrder[horoscope.yearlyIndex] : null);
    const decadalLimits = getDecadalLimits(ziwei?.core?.wuxingju);

    return BRANCH_RING.map((branch, idx) => {
      const palaceIndex = (mingIdx - idx + 12) % 12;
      const palaceName = palaceOrder[palaceIndex];

      const rawStars = getStarsForPalace(ziwei, palaceName);
      const stars = rawStars.map(toTraditionalStarName);

      let palaceMainElement = "";
      if (stars.length) {
        palaceMainElement = STAR_WUXING_MAP[stars[0]] || "";
      }

      const isActiveLimit = activeLimitPalace != null && palaceName === activeLimitPalace;
      const decadalLimit = decadalLimits[palaceIndex] || { start: 0, end: 9 };

      return {
        index: idx,
        branch,
        palaceName,
        stars,
        isMing: branch === mingBranch,
        isShen: shenBranch ? branch === shenBranch : false,
        mainElement: palaceMainElement,
        isActiveLimit,
        decadalLimit,
      };
    });
  }

  // 動態戰術提示：保持「計算」本體；十神解釋文字由 UI 傳入（避免 calc.js 依賴 dbContent）
  function computeDynamicTactics(bazi, tenGodText) {
    const out = [];
    const dominant = (bazi?.tenGod?.dominant || "").trim();
    const wx = bazi?.wuxing?.strategic || null;
    if (!wx) return out;

    const { pct } = pctFromWx(wx);

    if (pct["火"] >= 0.35) out.push({ tone: "red", text: "🔥 火佔比偏高：今年做重大決策建議「冷卻 48 小時」，先寫下風險清單再拍板。" });
    if (pct["水"] <= 0.10) out.push({ tone: "blue", text: "💧 水佔比偏低：需要刻意補充資訊與資源流動（跨界交流、建立資料庫、做現金流緩衝）。" });
    if (pct["金"] >= 0.35) out.push({ tone: "slate", text: "⚔️ 金佔比偏高：執行標準強，但易讓合作壓力上升。建議用流程取代情緒，先對齊規格再要求速度。" });
    if (pct["土"] >= 0.40) out.push({ tone: "amber", text: "⛰️ 土佔比偏高：承載力強但節奏易鈍。建議把大目標拆成週節點，用儀表板推進而不是靠意志力。" });
    if (pct["木"] >= 0.35) out.push({ tone: "green", text: "🌲 木佔比偏高：擴張與規劃很強，但注意戰線過多。建議做『剪枝』：砍掉 20% 不必要任務，成果會更大。" });

    if (dominant && tenGodText) {
      out.push({ tone: "amber", text: `🧭 十神主軸（${dominant}）：${tenGodText}` });
    } else if (dominant) {
      out.push({ tone: "amber", text: `🧭 十神主軸（${dominant}）：今年用「流程化、規則化」方式推進，壓力月先守規則再談突破。` });
    }

    return out;
  }

  // ====== EXPOSE ======
  const Calc = Object.freeze({
    PALACE_DEFAULT,
    PALACE_KEY_MAP,
    gridAreas,
    BRANCH_RING,
    STAR_WUXING_MAP,
    CANGGAN_DATA,
    FIVE_ELEMENTS_ORDER,
    SHICHEN_ORDER,
    SHICHEN_TO_HOUR,
    SHICHEN_START_HOUR,

    pad2,
    resolveBirthTime,
    toTraditionalStarName,
    getStarsForPalace,
    pctFromWx,
    normalizeWxByMax,
    generateFiveElementComment,
    generateFiveElementDiagnosis,
    getBoyanBoard,
    toEnergyLevelsFromWx,
    computeRelatedPalaces,
    getHoroscopeFromAge,
    getMutagenStars,
    getSiHuaWeights,
    getPalaceScoreWithWeights,
    computePalaceBaseScore,
    computeAllPalaceScores,
    buildSlotsFromZiwei,
    computeDynamicTactics,
    // L9 導出
    finalizeStarRating,
    generateMonthStrategyTag,
    mapScoreToStarRating,
    mapScoreToInternalLevel,
    mapInternalLevelToDisplayStars,
    // 流月星等計算
    computeMonthlyStarRating,
    parseMonthFromRange,
  });

  if (typeof window !== "undefined") {
    window.Calc = Calc;
  } else if (typeof globalThis !== "undefined") {
    // 讓 Node / 測試環境也能引用（非必要，但更穩定）
    globalThis.Calc = Calc;
  }
})();

