/* calc/constants.js
 * 紫微斗數計算相關的常數定義
 * 從 calc.js 中提取，用於模組化架構
 */
import {
  STAR_WUXING_MAP as REGISTRY_WUXING,
  EN_STAR_TO_ZH_FOR_WUXING as REGISTRY_EN_TO_ZH,
} from "./star-registry-generated.js";

(function () {
  "use strict";

  // ====== 宮位相關常數 ======
  
  /**
   * 預設「宮位順序」（從命宮開始逆行）
   * 只用來做三方四正等「宮位邏輯」，跟畫格子的位置分開
   */
  const PALACE_DEFAULT = [
    "命宮", "兄弟", "夫妻", "子女", "財帛", "疾厄",
    "遷移", "僕役", "官祿", "田宅", "福德", "父母",
  ];

  /**
   * 宮位簡繁對照（找星曜、找資料庫用）
   */
  const PALACE_KEY_MAP = {
    "兄弟": ["兄弟", "兄弟宮"],
    "命宮": ["命宮", "命宫"],
    "夫妻": ["夫妻", "夫妻宮"],
    "子女": ["子女", "子女宮"],
    "財帛": ["財帛", "财帛", "財帛宮", "财帛宫"],
    "疾厄": ["疾厄", "疾厄宮"],
    "遷移": ["遷移", "迁移", "遷移宮", "迁移宫"],
    "僕役": ["僕役", "仆役", "奴僕", "僕役宮", "仆役宫"],
    "官祿": ["官祿", "官禄", "官祿宮", "官禄宫"],
    "田宅": ["田宅", "田宅宮"],
    "福德": ["福德", "福德宮"],
    "父母": ["父母", "父母宮"],
  };

  /**
   * 宮位繁體名稱 → JSON 英文標識映射表
   */
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

  // ====== 盤面位置相關常數 ======
  
  /**
   * 12 宮盤面位置（4x4 外圈）— 這是「地支座標」
   * 索引：0:寅(左下), 1:卯, 2:辰, 3:巳(左上), 4:午, 5:未,
   *      6:申(右上), 7:酉, 8:戌, 9:亥(右下),10:子, 11:丑
   */
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

  /**
   * 固定的「地支環」，對應上面 gridAreas 的順序
   */
  const BRANCH_RING = ["寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥", "子", "丑"];

  // ====== 星曜相關常數 ======
  
  /**
   * 星曜簡→繁對照（單一來源）
   * 後端請使用同份 data/star-name-trad.json，避免重複維護。
   */
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

  /** 五行 map 用「繁體星名」（來自 star-registry） */
  const STAR_WUXING_MAP = REGISTRY_WUXING;

  /** en-US 星曜 key → 繁體（用於五行計算，當 mainStars 為 en 時轉換，來自 star-registry） */
  const EN_STAR_TO_ZH_FOR_WUXING = REGISTRY_EN_TO_ZH;

  /**
   * 星曜繁體名稱 → JSON ID 映射表
   */
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

  // ====== 時辰相關常數 ======
  
  /**
   * 時辰順序（子丑寅...）
   */
  const SHICHEN_ORDER = Object.freeze(["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"]);

  /**
   * 時辰區間（每個 2 小時）的起始小時
   * 子=23, 丑=1, 寅=3...（上半=起始那 1 小時、下半=下一個 1 小時）
   */
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

  /**
   * 保留舊版「中間值」對照（相容/除錯用）
   */
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

  // ====== 五行相關常數 ======
  
  /**
   * 五行順序（雷達圖與註解統一採用這個軸順序）
   */
  const FIVE_ELEMENTS_ORDER = ["金", "木", "水", "火", "土"];

  /**
   * 五行相生映射表
   */
  const SHENG_MAP = Object.freeze({
    "木": "火",
    "火": "土",
    "土": "金",
    "金": "水",
    "水": "木",
  });

  /**
   * 五行相剋映射表
   */
  const KE_MAP = Object.freeze({
    "木": "土",
    "火": "金",
    "土": "水",
    "金": "木",
    "水": "火",
  });

  /**
   * 五行強勢時的說明文字（表層：角色名望）
   */
  const STRONG_COMMENTS_SURFACE = Object.freeze({
    "木": "你會呈現出積極主動、願意擴展社交圈、給人成長感的形象。",
    "火": "你會呈現出熱情、快速反應、容易吸引注意的形象。",
    "土": "你會呈現出穩重、可靠、給人安全感的形象。",
    "金": "你會呈現出果斷、有原則、給人專業感的形象。",
    "水": "你會呈現出靈活、善於溝通、給人親和感的形象。",
  });

  /**
   * 五行弱勢時的說明文字（表層：角色名望）
   */
  const WEAK_COMMENTS_SURFACE = Object.freeze({
    "木": "你會出現較為內斂、不願主動連結、缺乏開展動力的狀態。",
    "火": "你會出現較為低調、反應較慢、缺乏存在感的狀態。",
    "土": "你會出現較為動盪、難以建立信任、缺乏承載力的狀態。",
    "金": "你會出現較為模糊、缺乏標準、難以建立界線的狀態。",
    "水": "你會出現較為封閉、資訊流通不順、缺乏溝通動力的狀態。",
  });

  /**
   * 五行強勢時的說明文字（實戰：核心戰力）
   */
  const STRONG_COMMENTS_STRATEGIC = Object.freeze({
    "木": "你會呈現出善於規劃、願意啟動、能夠展開多線任務的狀態。",
    "火": "你會呈現出快速推進、高執行力、能夠快速完成任務的狀態。",
    "土": "你會呈現出持久穩定、能夠累積成果、善於建立系統的狀態。",
    "金": "你會呈現出果斷決策、善於切割、能夠建立清晰流程的狀態。",
    "水": "你會呈現出深度思考、善於洞察、能夠處理複雜資訊的狀態。",
  });

  /**
   * 五行弱勢時的說明文字（實戰：核心戰力）
   */
  const WEAK_COMMENTS_STRATEGIC = Object.freeze({
    "木": "你會出現猶豫不決、難以啟動、缺乏策略思維的狀態。",
    "火": "你會出現行動力不足、難以推進、缺乏執行動能的狀態。",
    "土": "你會出現難以持續、缺乏根基、無法累積的狀態。",
    "金": "你會出現決策困難、界線模糊、缺乏執行標準的狀態。",
    "水": "你會出現思考枯竭、視野變窄、缺乏深度分析的狀態。",
  });

  /**
   * 五行強勢時的說明文字（向後兼容，預設為實戰）
   */
  const STRONG_COMMENTS = STRONG_COMMENTS_STRATEGIC;

  /**
   * 五行弱勢時的說明文字（向後兼容，預設為實戰）
   */
  const WEAK_COMMENTS = WEAK_COMMENTS_STRATEGIC;

  /**
   * 地支藏干（前端顯示用，也可用於實戰結構的解釋）
   */
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

  /**
   * 能量等級標籤：0(低頻) 1(平穩) 2(強健) 3(過旺)
   */
  const ENERGY_LABEL = Object.freeze({
    0: "低頻",
    1: "平穩",
    2: "強健",
    3: "過旺",
  });

  /**
   * 五行核心意義與診斷文字（表層：角色名望）
   */
  const ELEMENT_CORE_MEANING_SURFACE = Object.freeze({
    "木": { core: "外在成長模組", low01: "較為內斂、不願主動連結", level2: "積極主動、願意擴展社交圈", level3: "過度擴張、無法聚焦", remedy: "今年，你需要練習在成長與收斂之間找到平衡，讓每一次的連結都有明確的目的。" },
    "火": { core: "外在亮度模組", low01: "較為低調、反應較慢", level2: "熱情、快速反應、容易吸引注意", level3: "情緒化決策、過度消耗注意力", remedy: "今年，你需要練習控制輸出節奏，讓每一次的表達都更有份量。" },
    "土": { core: "外在穩定模組", low01: "較為動盪、難以建立信任", level2: "穩重、可靠、給人安全感", level3: "過於保守、缺乏彈性", remedy: "今年，你需要練習在穩定與創新之間找到平衡，讓你的可靠成為優勢而非限制。" },
    "金": { core: "外在界線模組", low01: "較為模糊、缺乏標準", level2: "果斷、有原則、給人專業感", level3: "過於苛刻、缺乏彈性", remedy: "今年，你需要練習在原則與人情之間找到平衡，讓你的界線成為保護而非阻礙。" },
    "水": { core: "外在溝通模組", low01: "較為封閉、資訊流通不順", level2: "靈活、善於溝通、給人親和感", level3: "過度變動、缺乏核心", remedy: "今年，你需要練習在流動與穩定之間找到平衡，讓你的溝通成為橋樑而非消耗。" },
  });

  /**
   * 五行核心意義與診斷文字（實戰：核心戰力）
   */
  const ELEMENT_CORE_MEANING_STRATEGIC = Object.freeze({
    "木": { core: "策略模組", low01: "猶豫不決、難以啟動", level2: "善於規劃、願意啟動、能夠展開多線任務", level3: "規劃過多、執行不足", remedy: "今年，你需要練習直接啟動，讓策略成為行動的指南而非拖延的藉口。" },
    "火": { core: "推進力模組", low01: "行動力不足、難以推進", level2: "快速推進、高執行力、能夠快速完成任務", level3: "過度消耗、後繼無力", remedy: "今年，你需要練習管理輸出節奏，讓每一次的推進都更有續航力。" },
    "土": { core: "耐力模組", low01: "難以持續、缺乏根基", level2: "持久穩定、能夠累積成果、善於建立系統", level3: "過於保守、缺乏突破", remedy: "今年，你需要練習在累積與創新之間找到平衡，讓你的穩定成為基礎而非限制。" },
    "金": { core: "決斷力模組", low01: "決策困難、界線模糊", level2: "果斷決策、善於切割、能夠建立清晰流程", level3: "過於苛刻、缺乏彈性", remedy: "今年，你需要練習在效率與人性之間找到平衡，讓你的決斷成為助力而非阻力。" },
    "水": { core: "洞察模組", low01: "思考枯竭、視野變窄", level2: "深度思考、善於洞察、能夠處理複雜資訊", level3: "過度思考、行動不足", remedy: "今年，你需要練習在思考與行動之間找到平衡，讓你的洞察成為決策的基礎而非拖延的理由。" },
  });

  /**
   * 五行核心意義與診斷文字（向後兼容，預設為實戰）
   */
  const ELEMENT_CORE_MEANING = ELEMENT_CORE_MEANING_STRATEGIC;

  /**
   * 全域相生（深度貼文風格）
   */
  const GENERATION_POST_STYLE = Object.freeze({
    "木->火": { headline: "策略引導行動。", text: "結構正在把潛能轉化為影響力。" },
    "火->土": { headline: "高強度輸出正在沉澱為穩定基礎。", text: "" },
    "土->金": { headline: "基礎結構正在提煉為決斷標準。", text: "" },
    "金->水": { headline: "紀律形成洞察。", text: "" },
    "水->木": { headline: "洞察轉化為新一輪啟動。", text: "" },
  });

  /**
   * 全域相剋（深度貼文風格）
   */
  const OVERCOMING_POST_STYLE = Object.freeze({
    "木->土": { headline: "擴張壓力正在動搖基礎。", text: "" },
    "土->水": { headline: "過度穩定限制流動。", text: "" },
    "水->火": { headline: "理性過度壓抑行動。", text: "" },
    "火->金": { headline: "衝動削弱決斷力。", text: "" },
    "金->木": { headline: "過嚴標準阻礙成長。", text: "" },
  });

  /**
   * 伯彥戰略看板相關常數
   */
  const ELEMENT_TYPE = { "木": "執行型", "火": "傳播型", "土": "整合型", "金": "決斷型", "水": "流動型" };
  
  /**
   * 伯彥戰略看板：最優路徑（表層：角色名望）
   */
  const POYEN_CONVERSION_ONE_SURFACE = {
    "木->火": "結構轉換建議：將木轉化為火。此為可累積之長期資產。",
    "火->土": "結構轉換建議：將火轉化為土。此為可累積之長期資產。",
    "土->金": "結構轉換建議：將土轉化為金。此為可累積之長期資產。",
    "金->水": "結構轉換建議：將金轉化為水。此為可累積之長期資產。",
    "水->木": "結構轉換建議：將水轉化為木。此為可累積之長期資產。",
  };

  /**
   * 伯彥戰略看板：最優路徑（實戰：核心戰力）
   */
  const POYEN_CONVERSION_ONE_STRATEGIC = {
    "木->火": "結構轉換建議：將木轉化為火。此為可累積之長期資產。",
    "火->土": "結構轉換建議：將火轉化為土。此為可累積之長期資產。",
    "土->金": "結構轉換建議：將土轉化為金。此為可累積之長期資產。",
    "金->水": "結構轉換建議：將金轉化為水。此為可累積之長期資產。",
    "水->木": "結構轉換建議：將水轉化為木。此為可累積之長期資產。",
  };

  /**
   * 伯彥戰略看板：系統風險（表層：角色名望）
   */
  const POYEN_RISK_ONE_SURFACE = {
    "木->土": "過度擴張（木）正在損害你的可靠形象與信任基礎（土）。",
    "土->水": "過於保守（土）正在限制你的溝通流動與資訊連結（水）。",
    "水->火": "過度變動（水）壓制你的表達熱情（火），讓你的影響力難以聚焦。",
    "火->金": "情緒化決策（火）正在燒毀你的專業界線與執行標準（金）。",
    "金->木": "過於苛刻（金）正在扼殺你的成長動能與人際連結（木）。",
  };

  /**
   * 伯彥戰略看板：系統風險（實戰：核心戰力）
   */
  const POYEN_RISK_ONE_STRATEGIC = {
    "木->土": "規劃過多（木）正在損害你的系統穩定與成果累積（土）。",
    "土->水": "過於保守（土）正在限制你的洞察流動與資訊處理（水）。",
    "水->火": "過度思考（水）壓制你的執行推進（火），讓你的行動力難以發揮。",
    "火->金": "過度消耗（火）正在燒毀你的決斷流程與執行標準（金）。",
    "金->木": "過於苛刻（金）正在扼殺你的策略展開與執行啟動（木）。",
  };

  /**
   * 伯彥戰略看板：助推建議（表層：角色名望）
   */
  const POYEN_PUSH_SURFACE = {
    "木": "優先補強【木】後，再擴張。",
    "火": "優先補強【火】後，再擴張。",
    "土": "優先補強【土】後，再擴張。",
    "金": "優先補強【金】後，再擴張。",
    "水": "優先補強【水】後，再擴張。",
  };

  /**
   * 伯彥戰略看板：助推建議（實戰：核心戰力）
   */
  const POYEN_PUSH_STRATEGIC = {
    "木": "優先補強【木】後，再擴張。",
    "火": "優先補強【火】後，再擴張。",
    "土": "優先補強【土】後，再擴張。",
    "金": "優先補強【金】後，再擴張。",
    "水": "優先補強【水】後，再擴張。",
  };

  /**
   * 伯彥戰略看板（向後兼容，預設為實戰）
   */
  const POYEN_CONVERSION_ONE = POYEN_CONVERSION_ONE_STRATEGIC;
  const POYEN_RISK_ONE = POYEN_RISK_ONE_STRATEGIC;
  const POYEN_PUSH = POYEN_PUSH_STRATEGIC;

  // ==============================
  // EN: Five-Phase / PoYen texts
  // ==============================
  const ELEMENT_TYPE_EN = { "木": "Execution-Type", "火": "Amplification-Type", "土": "Integration-Type", "金": "Decision-Type", "水": "Flow-Type" };
  const ELEMENT_TYPE_EN_FALLBACK = "Balanced-Type";
  const ENERGY_LABEL_EN = { 0: "Low", 1: "Stable", 2: "Strong", 3: "Overactive" };
  const RELATION_BADGE_EN = { "強弱": "Strong–Weak", "弱強": "Weak–Strong", "強強": "Strong–Strong", "弱弱": "Weak–Weak" };
  const ELEMENT_CORE_MEANING_SURFACE_EN = {
    "木": { core: "Outer Growth Module", low01: "More reserved; less willing to initiate connections", level2: "Proactive; willing to expand your social circle", level3: "Over-expanding; struggling to focus", remedy: "This year, practice balancing expansion with restraint—make every connection serve a clear purpose." },
    "火": { core: "Outer Visibility Module", low01: "Low-key; slower to respond", level2: "Warm, fast-reacting, naturally attracts attention", level3: "Emotion-led decisions; over-spending attention and energy", remedy: "This year, practice controlling your output rhythm—make each expression carry more weight." },
    "土": { core: "Outer Stability Module", low01: "More volatile; hard to build trust", level2: "Steady and reliable; gives others a sense of safety", level3: "Too conservative; lacks flexibility", remedy: "This year, practice balancing stability with innovation—let reliability be an advantage, not a limit." },
    "金": { core: "Outer Boundaries Module", low01: "Blurry standards; hard to hold a line", level2: "Decisive and principled; conveys professionalism", level3: "Too strict; lacks flexibility", remedy: "This year, practice balancing principles with human context—make boundaries protective, not obstructive." },
    "水": { core: "Outer Communication Module", low01: "Closed-off; information flow feels blocked", level2: "Flexible and communicative; approachable and friendly", level3: "Over-shifting; lacks a stable core", remedy: "This year, practice balancing flow with stability—let communication become a bridge, not a drain." },
  };
  const ELEMENT_CORE_MEANING_STRATEGIC_EN = {
    "木": { core: "Strategy Module", low01: "Hesitant; hard to initiate", level2: "Plans well, starts willingly, can run multiple threads", level3: "Over-planning; under-executing", remedy: "This year, practice starting directly—let strategy guide action, not justify delay." },
    "火": { core: "Momentum Module", low01: "Low drive; hard to push forward", level2: "Fast execution; high throughput; finishes tasks quickly", level3: "Over-consuming energy; fades after the burst", remedy: "This year, practice managing output rhythm—make each push more sustainable." },
    "土": { core: "Endurance Module", low01: "Hard to sustain; lacks foundation", level2: "Steady persistence; accumulates results; builds systems", level3: "Too conservative; lacks breakthroughs", remedy: "This year, practice balancing accumulation with innovation—make stability a base, not a ceiling." },
    "金": { core: "Decisiveness Module", low01: "Decision friction; blurry boundaries", level2: "Cuts cleanly; decides decisively; builds clear processes", level3: "Too harsh; lacks flexibility", remedy: "This year, practice balancing efficiency with humanity—let decisiveness help, not harden." },
    "水": { core: "Insight Module", low01: "Mental dryness; narrowed perspective", level2: "Thinks deeply; discerns well; handles complexity", level3: "Overthinking; underacting", remedy: "This year, practice balancing thought with action—make insight a base for decisions, not a reason to stall." },
  };
  const POYEN_CONVERSION_ONE_SURFACE_EN = {
    "木->火": "Structural conversion: transform Wood into Fire. This becomes a compounding long-term asset.",
    "火->土": "Structural conversion: transform Fire into Earth. This becomes a compounding long-term asset.",
    "土->金": "Structural conversion: transform Earth into Metal. This becomes a compounding long-term asset.",
    "金->水": "Structural conversion: transform Metal into Water. This becomes a compounding long-term asset.",
    "水->木": "Structural conversion: transform Water into Wood. This becomes a compounding long-term asset.",
  };
  const POYEN_CONVERSION_ONE_STRATEGIC_EN = {
    "木->火": "Structural conversion: transform Wood into Fire. This becomes a compounding long-term asset.",
    "火->土": "Structural conversion: transform Fire into Earth. This becomes a compounding long-term asset.",
    "土->金": "Structural conversion: transform Earth into Metal. This becomes a compounding long-term asset.",
    "金->水": "Structural conversion: transform Metal into Water. This becomes a compounding long-term asset.",
    "水->木": "Structural conversion: transform Water into Wood. This becomes a compounding long-term asset.",
  };
  const POYEN_RISK_ONE_SURFACE_EN = {
    "木->土": "Over-expansion (Wood) is damaging your reliability and trust foundation (Earth).",
    "土->水": "Over-conservatism (Earth) is limiting communication flow and information links (Water).",
    "水->火": "Over-shifting (Water) suppresses expressive heat (Fire), making influence hard to focus.",
    "火->金": "Emotion-led decisions (Fire) are burning down your professional boundaries and execution standards (Metal).",
    "金->木": "Over-strictness (Metal) is choking growth momentum and relationship expansion (Wood).",
  };
  const POYEN_RISK_ONE_STRATEGIC_EN = {
    "木->土": "Over-planning (Wood) is damaging system stability and result accumulation (Earth).",
    "土->水": "Over-conservatism (Earth) is limiting insight flow and information processing (Water).",
    "水->火": "Overthinking (Water) suppresses execution momentum (Fire), making action hard to land.",
    "火->金": "Over-consumption (Fire) is burning down your decision process and execution standards (Metal).",
    "金->木": "Over-strictness (Metal) is choking strategy expansion and initiation (Wood).",
  };
  const POYEN_PUSH_SURFACE_EN = {
    "木": "Reinforce Wood before expansion.",
    "火": "Reinforce Fire before expansion.",
    "土": "Reinforce Earth before expansion.",
    "金": "Reinforce Metal before expansion.",
    "水": "Reinforce Water before expansion.",
  };
  const POYEN_PUSH_STRATEGIC_EN = {
    "木": "Reinforce Wood before expansion.",
    "火": "Reinforce Fire before expansion.",
    "土": "Reinforce Earth before expansion.",
    "金": "Reinforce Metal before expansion.",
    "水": "Reinforce Water before expansion.",
  };
  const GENERATION_POST_STYLE_EN = {
    "木->火": { headline: "Strategy ignites execution.", text: "Potential is converting into visible impact." },
    "火->土": { headline: "High intensity output consolidates into stability.", text: "" },
    "土->金": { headline: "Foundation refines into decision precision.", text: "" },
    "金->水": { headline: "Discipline generates insight.", text: "" },
    "水->木": { headline: "Insight catalyzes renewed initiation.", text: "" },
  };
  const OVERCOMING_POST_STYLE_EN = {
    "木->土": { headline: "Expansion pressure destabilizes foundation.", text: "" },
    "土->水": { headline: "Excess stability restricts flow.", text: "" },
    "水->火": { headline: "Over-analysis suppresses execution.", text: "" },
    "火->金": { headline: "Impulse erodes decision discipline.", text: "" },
    "金->木": { headline: "Rigid standards inhibit growth.", text: "" },
  };
  const STRONG_COMMENTS_SURFACE_EN = {
    "木": "You come across as proactive and growth-oriented—willing to expand your circle.",
    "火": "You come across as warm, fast-reacting, and attention-attracting.",
    "土": "You come across as steady, reliable, and safe to trust.",
    "金": "You come across as decisive, principled, and professional.",
    "水": "You come across as flexible, communicative, and approachable.",
  };
  const WEAK_COMMENTS_SURFACE_EN = {
    "木": "You may appear reserved, less initiating, and lacking expansion drive.",
    "火": "You may appear low-key, slower to react, and less present.",
    "土": "You may appear unsettled, harder to trust, and lacking carrying capacity.",
    "金": "You may appear blurry on standards, struggling to hold boundaries.",
    "水": "You may appear closed-off, with blocked information flow and low communication drive.",
  };
  const STRONG_COMMENTS_STRATEGIC_EN = {
    "木": "You tend to plan well, initiate willingly, and run multiple threads effectively.",
    "火": "You tend to push fast, execute strongly, and finish tasks quickly.",
    "土": "You tend to sustain, accumulate results, and build systems.",
    "金": "You tend to decide cleanly, cut clearly, and establish workflows.",
    "水": "You tend to think deeply, see patterns, and handle complexity well.",
  };
  const WEAK_COMMENTS_STRATEGIC_EN = {
    "木": "You may hesitate, struggle to start, and lack strategic drive.",
    "火": "You may lack momentum, struggle to push, and have low execution fuel.",
    "土": "You may struggle to sustain, lack foundation, and fail to accumulate.",
    "金": "You may struggle to decide, have blurry boundaries, and lack execution standards.",
    "水": "You may feel mentally drained, narrow in vision, and lack deep analysis.",
  };

  // ====== 小限／四化相關常數 ======
  
  /**
   * 十天干順序
   */
  const STEMS = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"];
  
  /**
   * 地支順序映射（用於計算）
   */
  const BRANCH_ORDER = { "寅": 0, "卯": 1, "辰": 2, "巳": 3, "午": 4, "未": 5, "申": 6, "酉": 7, "戌": 8, "亥": 9, "子": 10, "丑": 11 };
  
  /**
   * 年干 → 寅宮天干（五虎遁）
   */
  const YIN_STEM_FROM_YEAR = { "甲": "丙", "乙": "戊", "丙": "庚", "丁": "壬", "戊": "甲", "己": "丙", "庚": "戊", "辛": "庚", "壬": "壬", "癸": "甲" };

  /**
   * 十天干與四化對應 + 權重（祿 3 / 權 2 / 科 1 / 忌 -3）
   * 供小限動態導覽與宮位強度聯動
   */
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

  // ====== 星等評分相關常數 ======
  
  /**
   * 戰略建議映射表（根據星等）
   * 符合 #深度貼文 框架：語氣冷靜、中性、具備系統思維與商務決策直覺
   * 蘊含溫和鼓勵性質，但保持不同級別的差異性
   */
  const STRATEGIC_ADVICE_BY_STARS = {
    5: "結構高度對齊。適合放大行動與承擔關鍵責任，把握窗口。",
    4: "動能穩定增強。可逐步擴張，但仍需保持節奏與邊界。",
    3: "結構穩定運行。維持現有策略，優化細節而非大幅擴張。",
    2: "關鍵節點待修正。優先補強薄弱環節，再考慮放大行動。",
    1: "結構基礎需重建。避免擴張，專注於修復與整合。"
  };

  /** EN: Decision Structure tone — strategic analytical, no fate/emotional language */
  const STRATEGIC_ADVICE_BY_STARS_EN = {
    5: "Structural alignment peak. Expand actions and take decisive responsibility while the window is open.",
    4: "Momentum strengthening. Scale gradually while maintaining rhythm and boundaries.",
    3: "Stable structural flow. Maintain current direction and refine rather than expand.",
    2: "Critical nodes require adjustment. Reinforce weak points before acceleration.",
    1: "Structural foundation requires reinforcement. Avoid expansion and focus on rebuilding core integrity."
  };

  // ====== 導出 ======
  
  // 導出到 window.CalcConstants（如果 window 存在）
  if (typeof window !== "undefined") {
    window.CalcConstants = {
      // 宮位相關
      PALACE_DEFAULT,
      PALACE_KEY_MAP,
      PALACE_NAME_TO_ID_MAP,
      PALACE_ONE_LINERS,
      
      // 盤面位置相關
      gridAreas,
      BRANCH_RING,
      
      // 星曜相關
      STAR_NAME_TRAD_MAP,
      STAR_WUXING_MAP,
      EN_STAR_TO_ZH_FOR_WUXING,
      STAR_NAME_TO_ID_MAP,
      
      // 時辰相關
      SHICHEN_ORDER,
      SHICHEN_START_HOUR,
      SHICHEN_TO_HOUR,
      
      // 五行相關
      FIVE_ELEMENTS_ORDER,
      SHENG_MAP,
      KE_MAP,
      STRONG_COMMENTS,
      WEAK_COMMENTS,
      STRONG_COMMENTS_SURFACE,
      STRONG_COMMENTS_STRATEGIC,
      WEAK_COMMENTS_SURFACE,
      WEAK_COMMENTS_STRATEGIC,
      CANGGAN_DATA,
      ENERGY_LABEL,
      ELEMENT_CORE_MEANING,
      ELEMENT_CORE_MEANING_SURFACE,
      ELEMENT_CORE_MEANING_STRATEGIC,
      GENERATION_POST_STYLE,
      OVERCOMING_POST_STYLE,
      ELEMENT_TYPE,
      POYEN_CONVERSION_ONE,
      POYEN_CONVERSION_ONE_SURFACE,
      POYEN_CONVERSION_ONE_STRATEGIC,
      POYEN_RISK_ONE,
      POYEN_RISK_ONE_SURFACE,
      POYEN_RISK_ONE_STRATEGIC,
      POYEN_PUSH,
      POYEN_PUSH_SURFACE,
      POYEN_PUSH_STRATEGIC,

      // EN variants
      ELEMENT_TYPE_EN,
      ELEMENT_TYPE_EN_FALLBACK,
      ENERGY_LABEL_EN,
      RELATION_BADGE_EN,
      ELEMENT_CORE_MEANING_SURFACE_EN,
      ELEMENT_CORE_MEANING_STRATEGIC_EN,
      POYEN_CONVERSION_ONE_SURFACE_EN,
      POYEN_CONVERSION_ONE_STRATEGIC_EN,
      POYEN_RISK_ONE_SURFACE_EN,
      POYEN_RISK_ONE_STRATEGIC_EN,
      POYEN_PUSH_SURFACE_EN,
      POYEN_PUSH_STRATEGIC_EN,
      GENERATION_POST_STYLE_EN,
      OVERCOMING_POST_STYLE_EN,
      STRONG_COMMENTS_SURFACE_EN,
      WEAK_COMMENTS_SURFACE_EN,
      STRONG_COMMENTS_STRATEGIC_EN,
      WEAK_COMMENTS_STRATEGIC_EN,
      
      // 小限／四化相關
      STEMS,
      BRANCH_ORDER,
      YIN_STEM_FROM_YEAR,
      SI_HUA_MAP,
      
      // 星等評分相關
      STRATEGIC_ADVICE_BY_STARS,
      STRATEGIC_ADVICE_BY_STARS_EN,
    };
  } else if (typeof globalThis !== "undefined") {
    // 讓 Node / 測試環境也能引用
    globalThis.CalcConstants = {
      PALACE_DEFAULT,
      PALACE_KEY_MAP,
      PALACE_NAME_TO_ID_MAP,
      PALACE_ONE_LINERS,
      gridAreas,
      BRANCH_RING,
      STAR_NAME_TRAD_MAP,
      STAR_WUXING_MAP,
      STAR_NAME_TO_ID_MAP,
      SHICHEN_ORDER,
      SHICHEN_START_HOUR,
      SHICHEN_TO_HOUR,
      FIVE_ELEMENTS_ORDER,
      SHENG_MAP,
      KE_MAP,
      STRONG_COMMENTS,
      WEAK_COMMENTS,
      STRONG_COMMENTS_SURFACE,
      STRONG_COMMENTS_STRATEGIC,
      WEAK_COMMENTS_SURFACE,
      WEAK_COMMENTS_STRATEGIC,
      CANGGAN_DATA,
      ENERGY_LABEL,
      ELEMENT_CORE_MEANING,
      ELEMENT_CORE_MEANING_SURFACE,
      ELEMENT_CORE_MEANING_STRATEGIC,
      GENERATION_POST_STYLE,
      OVERCOMING_POST_STYLE,
      ELEMENT_TYPE,
      POYEN_CONVERSION_ONE,
      POYEN_CONVERSION_ONE_SURFACE,
      POYEN_CONVERSION_ONE_STRATEGIC,
      POYEN_RISK_ONE,
      POYEN_RISK_ONE_SURFACE,
      POYEN_RISK_ONE_STRATEGIC,
      POYEN_PUSH,
      POYEN_PUSH_SURFACE,
      POYEN_PUSH_STRATEGIC,
      ELEMENT_TYPE_EN,
      ELEMENT_TYPE_EN_FALLBACK,
      ENERGY_LABEL_EN,
      RELATION_BADGE_EN,
      ELEMENT_CORE_MEANING_SURFACE_EN,
      ELEMENT_CORE_MEANING_STRATEGIC_EN,
      POYEN_CONVERSION_ONE_SURFACE_EN,
      POYEN_CONVERSION_ONE_STRATEGIC_EN,
      POYEN_RISK_ONE_SURFACE_EN,
      POYEN_RISK_ONE_STRATEGIC_EN,
      POYEN_PUSH_SURFACE_EN,
      POYEN_PUSH_STRATEGIC_EN,
      GENERATION_POST_STYLE_EN,
      OVERCOMING_POST_STYLE_EN,
      STRONG_COMMENTS_SURFACE_EN,
      WEAK_COMMENTS_SURFACE_EN,
      STRONG_COMMENTS_STRATEGIC_EN,
      WEAK_COMMENTS_STRATEGIC_EN,
      STEMS,
      BRANCH_ORDER,
      YIN_STEM_FROM_YEAR,
      SI_HUA_MAP,
      STRATEGIC_ADVICE_BY_STARS,
      STRATEGIC_ADVICE_BY_STARS_EN,
    };
  }
})();
