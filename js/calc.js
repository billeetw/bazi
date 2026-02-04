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
  // 能量等級：0(微弱) 1(平穩) 2(強健) 3(過旺)
  const ENERGY_LABEL = Object.freeze({
    0: "微弱",
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
    if (lv <= 1) return `Level 0-1（低能量）：${m.low01}`;
    if (lv === 2) return `Level 2（強健）：${m.level2}`;
    return `Level 3（過旺）：${m.level3}`;
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
    const { strongest, weakest } = getStrongestWeakest(wx, ["木", "火", "土", "金", "水"]);
    const { levels } = toEnergyLevelsFromWx(wx);
    const keys = ["木", "火", "土", "金", "水"];

    const levelsArr = keys.map((k) => clampEnergyLevel(levels[k]));
    const maxLv = Math.max(...levelsArr);
    const minLv = Math.min(...levelsArr);

    const strongestTxt = `${strongest}（${ENERGY_LABEL[clampEnergyLevel(levels[strongest])]}）`;
    const weakestTxt = `${weakest}（${ENERGY_LABEL[clampEnergyLevel(levels[weakest])]}）`;

    let title = "";
    if (maxLv - minLv <= 1) title = `五行能量整體偏均衡：以${strongestTxt}帶動、${weakestTxt}需補位。`;
    else if (maxLv === 3 && minLv === 0) title = `能量呈兩極：${strongestTxt}過度主導，${weakestTxt}成為瓶頸。`;
    else if (maxLv === 3) title = `存在過旺能量：${strongestTxt}主導節奏，需注意失衡帶來的代價。`;
    else if (minLv === 0) title = `存在明顯短板：${weakestTxt}偏弱，容易拖慢整體推進。`;
    else title = `能量分布不均：${strongestTxt}偏強、${weakestTxt}偏弱，建議先補短板再談放大優勢。`;

    // 相生母子：木→火→土→金→水→木（固定）
    const genPairs = [["木", "火"], ["火", "土"], ["土", "金"], ["金", "水"], ["水", "木"]];
    const elementMeaningLines = keys.map((k) => `- 【${k}｜${ELEMENT_CORE_MEANING[k].core}】${meaningText(k, levels[k])}`);

    const motherChildLines = [];
    const conversionHighlights = [];
    genPairs.forEach(([m, c]) => {
      const badge = relationBadge(levels[m], levels[c]);
      const post = GENERATION_POST_STYLE[`${m}->${c}`];

      if (post && (energyBand(levels[m]) === "healthy" || energyBand(levels[m]) === "excess") && clampEnergyLevel(levels[c]) >= 1) {
        conversionHighlights.push(`【${m}生${c}｜${post.headline}】${post.text}`);
      }
      if (badge === "強弱") motherChildLines.push(`【母強子弱】${m}（${ENERGY_LABEL[clampEnergyLevel(levels[m])]}）生${c}（${ENERGY_LABEL[clampEnergyLevel(levels[c])]}）：母能量堆積，但轉化/落地到子端不足。`);
      else if (badge === "弱強") motherChildLines.push(`【母弱子強】${m}（${ENERGY_LABEL[clampEnergyLevel(levels[m])]}）生${c}（${ENERGY_LABEL[clampEnergyLevel(levels[c])]}）：子端耗能快，母端供給跟不上，容易出現「燒乾／透支」。`);
      else if (badge === "弱弱") motherChildLines.push(`【母弱子弱】${m}（${ENERGY_LABEL[clampEnergyLevel(levels[m])]}）→${c}（${ENERGY_LABEL[clampEnergyLevel(levels[c])]}）：相生鏈條偏弱，推進會斷續，宜先補母端再談擴張。`);
    });

    const generation =
      `元素核心意涵（對照你的能量等級）：\n${elementMeaningLines.join("\n")}\n\n` +
      `母子互動（相生轉化）：\n- ${motherChildLines.join("\n- ")}` +
      (conversionHighlights.length ? `\n\n相生亮點（能量轉化路徑）：\n- ${conversionHighlights.join("\n- ")}` : "");

    // 相剋：木剋土、土剋水、水剋火、火剋金、金剋木（固定）
    const kePairs = [["木", "土"], ["土", "水"], ["水", "火"], ["火", "金"], ["金", "木"]];
    const overcomeLines = [];
    const destructiveNotes = [];
    const constraintNotes = [];

    kePairs.forEach(([a, b]) => {
      const badge = relationBadge(levels[a], levels[b]);
      const post = OVERCOMING_POST_STYLE[`${a}->${b}`];
      if (badge === "強弱") {
        overcomeLines.push(`【毀滅性破壞】${a}（${ENERGY_LABEL[clampEnergyLevel(levels[a])] }）壓制${b}（${ENERGY_LABEL[clampEnergyLevel(levels[b])] }）：屬於「強剋弱」，建議先止損，避免越補越被剋。`);
        if (post) destructiveNotes.push(`【${a}剋${b}｜${post.headline}】${post.text}`);
      } else if (badge === "弱強") {
        overcomeLines.push(`【制衡不足】${a}（${ENERGY_LABEL[clampEnergyLevel(levels[a])] }）壓不住${b}（${ENERGY_LABEL[clampEnergyLevel(levels[b])] }）：需要補上規則/節奏，讓強項可被管理。`);
        if (post) constraintNotes.push(`【${a}剋${b}｜${post.headline}】${post.text}`);
      } else if (badge === "強強") {
        overcomeLines.push(`【合理約束】${a}（${ENERGY_LABEL[clampEnergyLevel(levels[a])] }）剋${b}（${ENERGY_LABEL[clampEnergyLevel(levels[b])] }）：屬於「強強對抗」，多半是健康的制衡，能防止走偏。`);
      }
    });

    const overcoming =
      `相剋制衡（判斷是合理約束或破壞）：\n- ${overcomeLines.join("\n- ")}` +
      (destructiveNotes.length ? `\n\n深度路徑警訊（強剋弱時最明顯）：\n- ${destructiveNotes.join("\n- ")}` : "") +
      (constraintNotes.length ? `\n\n深度路徑提醒（制衡不足時容易出現）：\n- ${constraintNotes.join("\n- ")}` : "");

    // 短板：以 weakest 為主 + 缺項(=0)補救
    const weaknessLines = [];
    weaknessLines.push(`短板是【${weakest}｜${ELEMENT_CORE_MEANING[weakest].core}】：${meaningText(weakest, levels[weakest])}。`);
    weaknessLines.push(`目前等級：${ENERGY_LABEL[clampEnergyLevel(levels[weakest])]}。`);

    const missing = keys.filter((k) => clampEnergyLevel(levels[k]) === 0);
    if (missing.length) {
      weaknessLines.push("");
      weaknessLines.push("補救建議（分數=0 自動觸發，可適度調整）：");
      missing.forEach((k) => weaknessLines.push(`- 缺${k}：${ELEMENT_CORE_MEANING[k].remedy}`));
    }

    const weakness = weaknessLines.join("\n");

    return { title, generation, overcoming, weakness, levels, strongest, weakest };
  }

  // 三方四正：本宮 + 對宮( +6 ) + 三合( +4, +8 )
  function computeRelatedPalaces(palaceRing, palaceName) {
    const ring = Array.isArray(palaceRing) && palaceRing.length === 12 ? palaceRing : PALACE_DEFAULT;
    const idx = ring.indexOf(palaceName);
    if (idx < 0) return { active: palaceName, related: [] };
    const relatedIdx = new Set([idx, (idx + 6) % 12, (idx + 4) % 12, (idx + 8) % 12]);
    const related = Array.from(relatedIdx).map((i) => ring[i]);
    return { active: palaceName, related };
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

  /** 宮位強度 + 小限四化權重加成（僅小限宮位使用；stars 為該宮繁體星名陣列） */
  function getPalaceScoreWithWeights(baseScore, stars, stem) {
    if (!Array.isArray(stars) || !stem) return baseScore;
    const weights = getSiHuaWeights(stem);
    let add = 0;
    stars.forEach((s) => { add += Number(weights[s]) || 0; });
    return Math.max(0, (Number(baseScore) || 0) + add);
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
    toEnergyLevelsFromWx,
    computeRelatedPalaces,
    getHoroscopeFromAge,
    getMutagenStars,
    getSiHuaWeights,
    getPalaceScoreWithWeights,
    buildSlotsFromZiwei,
    computeDynamicTactics,
  });

  if (typeof window !== "undefined") {
    window.Calc = Calc;
  } else if (typeof globalThis !== "undefined") {
    // 讓 Node / 測試環境也能引用（非必要，但更穩定）
    globalThis.Calc = Calc;
  }
})();

