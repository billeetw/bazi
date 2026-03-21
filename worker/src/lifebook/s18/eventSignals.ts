/**
 * S18 疊宮分析章節（v2）
 * 
 * 主結構：以「12宮（toPalace）」為唯一分類
 * 輸出條件：僅輸出「有本命、大限或流年四化飛入」的宮位
 * 
 * 三層權重：
 * - 本命（natal）× 0.8：結構底色，長期基底
 * - 大限（decade）× 1.0：十年主線
 * - 流年（year）× 1.2：當年事件
 * 
 * Score 公式：
 * - score = resource(祿) * 2.0 + structure(科) * 1.5 + power(權) * 0.8 - risk(忌) * 2.5
 * - 語義：現在是順還是卡
 * 
 * Energy 公式（不含本命）：
 * - energy = sum(decade + year flows weight)
 * - 語義：最近事情多不多、變動大不大
 * - 原因：本命是 DNA 靜態結構，不代表近期變動感
 * 
 * 流月：明確排除在 S18 外
 */

import type { GongGanFlow } from "../../gonggan-flows.js";
import type { PalaceOverlayEntry } from "../palaceOverlay.js";
import { getPalaceShortLabel, PALACE_SHORT_LABEL_MAP } from "./palaceShortLabels.js";
import { buildSiHuaLayers, type SiHuaLayer } from "../../lifeBookPrompts.js";

// ========== 常數 ==========

const NATAL_WEIGHT = 0.8;
const DECADAL_WEIGHT = 1.0;
const YEARLY_WEIGHT = 1.2;

// 層級標籤
const LAYER_LABEL: Record<string, string> = {
  natal: "[本]",
  decade: "[限]",
  year: "[年]",
};

const PALACE_ORDER: string[] = [
  "命宮", "兄弟宮", "夫妻宮", "子女宮", "財帛宮", "疾厄宮",
  "遷移宮", "僕役宮", "官祿宮", "田宅宮", "福德宮", "父母宮",
];

// ========== 類型定義 ==========

export type PatternId = 
  | "double_ji"      // 雙忌 / 重壓局
  | "lu_ji_mix"      // 祿忌交錯
  | "double_lu"      // 雙祿 / 資源局
  | "double_ke"      // 雙科 / 穩定局
  | "power_strong"   // 權強 / 主導局
  | "ke_ji_coexist"  // 科忌並存 / 修正壓力
  | "none";          // 無明顯結構

export interface PatternInfo {
  id: PatternId;
  icon: string;
  label: string;
  description: string;
  summary: string;  // 局的總結，S19 起點
}

export interface PalaceSignal {
  palace: string;
  flows: GongGanFlow[];
  resource: number;
  power: number;
  structure: number;
  risk: number;
  score: number;
  fortuneLevel: string;
  statusIcon: string;
  energyLevel: string;
  pattern: PatternInfo;  // 每宮必有 pattern（可能是 "none"）
}

export interface S18Signals {
  palaces: PalaceSignal[];
  keyPalaces: {
    strongestOpportunity: string[];
    strongestPressure: string[];
  };
  mainTheme: { palace: string; text: string };
  challenge: { palace: string; text: string };
}

// ========== 四化圖示與標籤 ==========

const TRANSFORM_ICON: Record<string, string> = {
  祿: "🟢",
  權: "🟠",
  科: "🔵",
  忌: "🔴",
};

const TRANSFORM_LABEL: Record<string, string> = {
  祿: "【祿｜增益】",
  權: "【權｜主導】",
  科: "【科｜修正】",
  忌: "【忌｜壓力】",
};

// ========== 場景詞庫（從 starPalacesMain/Aux 抽取） ==========

const PALACE_SCENE_KEYWORDS: Record<string, string[]> = {
  命宮: ["自我定位", "人生方向", "狀態", "選擇"],
  兄弟宮: ["同儕", "合作", "平行關係", "分工"],
  夫妻宮: ["關係", "溝通", "承諾", "親密關係", "一對一合作"],
  子女宮: ["創作", "延伸成果", "產出", "下一代"],
  財帛宮: ["金錢", "現金流", "資源運作", "實際收益", "回報"],
  疾厄宮: ["身心", "壓力", "負荷", "修復"],
  遷移宮: ["外部發展", "市場", "移動", "對外", "環境變動"],
  僕役宮: ["人際", "團隊", "客戶", "外部連動"],
  官祿宮: ["工作", "責任", "角色", "事業"],
  田宅宮: ["房產", "資產", "家庭基礎", "居住", "根基"],
  福德宮: ["情緒", "內在狀態", "心理感受", "精神能量"],
  父母宮: ["長輩", "制度", "支持系統", "權威"],
};

// ========== 星曜特質詞庫（從 starTransformMeanings.json 抽取） ==========

interface StarTraitMap {
  core: string;
  祿: string;
  權: string;
  科: string;
  忌: string;
}

const STAR_TRAIT: Record<string, StarTraitMap> = {
  文昌: {
    core: "溝通、規則與邏輯",
    祿: "文書、規範與結構帶來的資源",
    權: "規則與文件",
    科: "文件、規則與整理",
    忌: "關係中的溝通、承諾或規則",
  },
  文曲: {
    core: "表達、感受與細節",
    祿: "表達與審美帶來的資源",
    權: "表達節奏與關係氣氛",
    科: "細膩方法與感受",
    忌: "情緒、表達或細節期待",
  },
  天梁: {
    core: "保護、照顧與支持",
    祿: "來自長輩、家庭或保護型資源的支持",
    權: "保護與照顧責任",
    科: "經驗、判斷與道理",
    忌: "責任感或過度照顧",
  },
  武曲: {
    core: "金錢、資源與執行",
    祿: "資源管理與執行帶來的回報",
    權: "資源與結果",
    科: "制度與流程",
    忌: "金錢、回報與資源運作",
  },
  天機: {
    core: "思考、策略與判斷",
    祿: "策略與判斷帶來的機會",
    權: "策略判斷與方向調整",
    科: "方法與理解",
    忌: "想太多或變動太快",
  },
  天同: {
    core: "情緒、安全感與節奏",
    祿: "情緒與內在狀態這一塊，會比較容易得到支撐與緩衝",
    權: "情緒節奏與生活狀態",
    科: "調整節奏與照顧自己",
    忌: "情緒或安全感",
  },
  紫微: {
    core: "領導、決策與位置",
    祿: "整合能力與領導位置帶來的資源",
    權: "主導位置與決策",
    科: "專業形象與整合力",
    忌: "位置感或掌控議題",
  },
  太陽: {
    core: "責任、表現與輸出",
    祿: "表現與責任感帶來的回報",
    權: "主導與承擔",
    科: "專業形象與影響力",
    忌: "付出與責任",
  },
  太陰: {
    core: "感受、內在需求與安全",
    祿: "細膩觀察與穩定累積帶來的資源",
    權: "安全感與情緒節奏",
    科: "理解情緒與整理內在",
    忌: "內在感受或安全需求",
  },
  貪狼: {
    core: "機會、社交與擴張",
    祿: "魅力與人際流動帶來的資源",
    權: "擴張與抓住機會",
    科: "成熟使用魅力與社交",
    忌: "慾望或機會過多",
  },
  巨門: {
    core: "溝通、觀點與判斷",
    祿: "觀點與分析力帶來的資源",
    權: "觀點與判斷",
    科: "溝通與拆解問題",
    忌: "誤解、懷疑或溝通摩擦",
  },
  天府: {
    core: "穩定、累積與保存",
    祿: "穩定與承接帶來的資源",
    權: "穩定與守成",
    科: "累積與長期配置",
    忌: "過度保守",
  },
  天相: {
    core: "協調、平衡與規則",
    祿: "平衡與秩序帶來的資源",
    權: "協調與制度",
    科: "規則與配合",
    忌: "顧全大局或壓抑自己",
  },
  廉貞: {
    core: "界線、掌控與突破",
    祿: "突破與界線議題帶來的資源",
    權: "突破與改革",
    科: "成熟方法處理慾望與權力",
    忌: "權力或界線議題",
  },
  七殺: {
    core: "決斷、壓力處理與破局",
    祿: "果斷與重建帶來的資源",
    權: "決斷與破局",
    科: "方法處理壓力與重建",
    忌: "高壓或孤軍奮戰",
  },
  破軍: {
    core: "變動、重整與重新開始",
    祿: "改變與重整帶來的新機會",
    權: "變動與重組",
    科: "有方法地重組",
    忌: "變動或結構拆解",
  },
  左輔: {
    core: "支持、分工與穩定合作",
    祿: "支持系統與協助帶來的資源",
    權: "建立支持系統",
    科: "穩定度與團隊配合",
    忌: "支持系統或依賴感",
  },
  右弼: {
    core: "協作、互動與人際配合",
    祿: "人際與合作帶來的資源",
    權: "經營合作與人際",
    科: "協調力與配合",
    忌: "合作或人際期待",
  },
};

// ========== 工具函式 ==========

/** 取得 flow 的權重：natal=0.8, decade=1.0, year=1.2 */
function flowWeight(flow: GongGanFlow): number {
  if (flow.layer === "natal") return NATAL_WEIGHT;
  if (flow.layer === "decade") return DECADAL_WEIGHT;
  return YEARLY_WEIGHT;
}

/** 判斷 flow 是否為動態層（decade/year），用於 Energy 計算 */
function isDynamicLayer(flow: GongGanFlow): boolean {
  return flow.layer === "decade" || flow.layer === "year";
}

/** 取得 flow 的層級標籤 [本]/[限]/[年] */
function getLayerLabel(flow: GongGanFlow): string {
  return LAYER_LABEL[flow.layer] ?? "[?]";
}

function getSceneKeywords(palace: string): string[] {
  return PALACE_SCENE_KEYWORDS[palace] ?? [palace];
}

function getStarTraitForTransform(star: string, transform: string): string {
  const traits = STAR_TRAIT[star];
  if (!traits) return star;
  const transformKey = transform as keyof StarTraitMap;
  return traits[transformKey] ?? traits.core ?? star;
}

// ========== Score 計算 ==========

function computePalaceVectors(flows: GongGanFlow[]): { resource: number; power: number; structure: number; risk: number } {
  let resource = 0;
  let power = 0;
  let structure = 0;
  let risk = 0;

  for (const f of flows) {
    const w = flowWeight(f);
    switch (f.transform) {
      case "祿":
        resource += w;
        break;
      case "權":
        power += w;
        break;
      case "科":
        structure += w;
        break;
      case "忌":
        risk += w;
        break;
    }
  }

  return { resource, power, structure, risk };
}

function computeScore(vectors: { resource: number; power: number; structure: number; risk: number }): number {
  const { resource, power, structure, risk } = vectors;
  const raw = resource * 2.0 + structure * 1.5 + power * 0.8 - risk * 2.5;
  return Math.round(raw * 10) / 10;
}

// ========== 吉凶判斷 ==========

function getFortuneLevel(score: number): string {
  if (score >= 4.5) return "大吉";
  if (score >= 2.5) return "中吉";
  if (score >= 1) return "小吉";
  if (score > -1) return "平";
  if (score > -3) return "小凶";
  if (score > -5) return "中凶";
  return "大凶";
}

// ========== 狀態圖示 ==========

function getStatusIcon(vectors: { resource: number; power: number; structure: number; risk: number }, score: number): string {
  const { resource, power, structure, risk } = vectors;
  const hasPositive = resource > 0 || power > 0 || structure > 0;
  const hasNegative = risk > 0;

  if (hasPositive && hasNegative) return "⚖️";
  if (structure >= 2 && risk === 0) return "🔵";
  if (score >= 3) return "🚀";
  if (score <= -3) return "🛑";
  if (risk >= 2) return "🌊";
  return "🍵";
}

// ========== 動能判斷 ==========
// Energy 只計算 decade + year，不含 natal
// 語義：最近事情多不多、變動大不大
// 原因：本命是 DNA 靜態結構，不代表近期變動感

function getEnergyLevel(flows: GongGanFlow[]): string {
  const dynamicFlows = flows.filter(isDynamicLayer);
  const total = dynamicFlows.reduce((sum, f) => sum + flowWeight(f), 0);
  if (total >= 3) return "高";
  if (total >= 1.5) return "中";
  return "低";
}

// ========== Pattern Layer（組合判斷層） ==========
// 用來回答：「這一宮現在正在什麼局裡」
// 優先順序：雙忌 > 祿忌交錯 > 雙祿 > 雙科 > 權強 > 科忌並存 > 無明顯結構
// 每一宮都必須跑 pattern 判定，處理必須一致

function getPattern(vectors: { resource: number; power: number; structure: number; risk: number }): PatternInfo {
  const { resource, power, structure, risk } = vectors;

  // 1. 雙忌 / 重壓局（最高優先）
  if (risk >= 2) {
    return {
      id: "double_ji",
      icon: "🔴",
      label: "【雙忌｜壓力疊在一起】",
      description: "這代表壓力不是單點，而是會重複堆上來，容易讓事情卡住。",
      summary: "👉 這一塊的局是：壓力疊在一起，容易越拖越重。",
    };
  }

  // 2. 祿忌交錯 / 祿被忌壓
  // 備註：S19 會細分「本命祿 + 大限/流年忌」升級成「祿被忌壓」，S18 先統一歸在「祿忌交錯」
  if (resource >= 1 && risk >= 1) {
    return {
      id: "lu_ji_mix",
      icon: "⚖️",
      label: "【祿忌交錯｜機會與代價並存】",
      description: "這代表一邊有資源進來，一邊也伴隨壓力或消耗，關鍵在取捨與節奏。",
      summary: "👉 這一塊的局是：有機會，但同時也有代價。",
    };
  }

  // 3. 雙祿 / 資源局
  if (resource >= 2 && risk === 0) {
    return {
      id: "double_lu",
      icon: "🟢",
      label: "【雙祿｜資源到位】",
      description: "這代表資源、機會或助力比較集中，事情會比較有推進空間。",
      summary: "👉 這一塊的局是：資源正在靠攏，機會感比較明顯。",
    };
  }

  // 4. 雙科 / 穩定局
  if (structure >= 2 && risk === 0) {
    return {
      id: "double_ke",
      icon: "🔵",
      label: "【雙科｜結構穩定】",
      description: "這代表事情可以靠制度、流程、規則或整理慢慢穩住。",
      summary: "👉 這一塊的局是：結構在成形，越整理越穩。",
    };
  }

  // 5. 權強 / 主導局
  if (power >= 2 && risk === 0) {
    return {
      id: "power_strong",
      icon: "⚡",
      label: "【權強｜需要主動推動】",
      description: "這代表事情不會自己往前走，需要你主動介入、決定與推進。",
      summary: "👉 這一塊的局是：要你自己出手，事情才會動。",
    };
  }

  // 6. 科忌並存 / 修正壓力
  // 注意：必須放在「祿忌交錯」與「雙科/權強」之後，避免誤蓋
  if (structure >= 1 && risk >= 1) {
    return {
      id: "ke_ji_coexist",
      icon: "🛠️",
      label: "【科忌並存｜有壓力，但能修】",
      description: "這代表問題不是沒有，但還有空間靠規則、文件、流程或整理去修正。",
      summary: "👉 這一塊的局是：壓力存在，但正在被慢慢修正。",
    };
  }

  // 7. 無明顯結構（fallback）
  return {
    id: "none",
    icon: "",
    label: "",
    description: "",
    summary: "",
  };
}

// ========== 飛星格式（Prototype v2） ==========

export function formatFlowNarrative(flow: GongGanFlow): string {
  const star = flow.star?.trim() || "星";
  const transform = flow.transform as "祿" | "權" | "科" | "忌";
  const icon = TRANSFORM_ICON[transform] ?? "";
  const label = TRANSFORM_LABEL[transform] ?? "";
  const layerTag = getLayerLabel(flow);
  const fromPalace = flow.fromPalace;
  const toPalace = flow.toPalace;
  const isNatal = flow.layer === "natal";

  // 本命四化：使用「在X宮」格式（靜態結構，不是飛入）
  // 大限/流年：使用「自X宮飛入Y宮」格式（動態事件）
  let header: string;
  if (isNatal) {
    // 本命：[本]🔴【忌｜壓力】太陽化忌在官祿宮，
    header = `${layerTag}${icon}${label}${star}化${transform}在${toPalace}，`;
  } else if (fromPalace && fromPalace !== toPalace) {
    header = `${layerTag}${icon}${label}${star}化${transform}自${fromPalace}飛入${toPalace}，`;
  } else {
    header = `${layerTag}${icon}${label}${star}化${transform}飛入${toPalace}，`;
  }

  const sceneKeywords = getSceneKeywords(toPalace);
  const starTrait = getStarTraitForTransform(star, transform);
  const scene = sceneKeywords.slice(0, 2).join("與");

  // 本命四化的 body 使用不同語調（結構底色 vs 動態事件）
  let body: string;
  if (isNatal) {
    // 本命：描述先天結構特質
    switch (transform) {
      case "祿":
        body = `先天在${scene}這一塊容易有資源與機會。`;
        break;
      case "權":
        body = `先天在${scene}這一塊會想要主導與掌握。`;
        break;
      case "科":
        body = `先天在${scene}這一塊有穩定與修正的能力。`;
        break;
      case "忌":
        body = `先天在${scene}這一塊容易成為功課所在。`;
        break;
      default:
        body = `先天在${scene}這一塊會有特別的議題。`;
    }
  } else {
    // 大限/流年：描述動態事件
    switch (transform) {
      case "祿":
        if (starTrait.includes("這一塊")) {
          body = `這代表${starTrait}。`;
        } else {
          body = `這代表${starTrait}，會流入${scene}這一塊。`;
        }
        break;
      case "權":
        body = `這代表你會在${scene}上更需要主動做決定，重點在${starTrait}。`;
        break;
      case "科":
        body = `這代表${scene}這一塊，適合靠${starTrait}慢慢穩住。`;
        break;
      case "忌":
        body = `這代表${starTrait}容易卡住，壓力會直接落在${scene}上。`;
        break;
      default:
        body = `這代表${starTrait}相關的議題會特別明顯。`;
    }
  }

  return header + body;
}

// ========== 本命四化轉換 ==========

/** 從 SiHuaLayer 建構本命四化 flows */
function buildNatalFlows(benmingLayer: SiHuaLayer | undefined): GongGanFlow[] {
  if (!benmingLayer) return [];
  const flows: GongGanFlow[] = [];
  const transformMap: Array<{ key: keyof SiHuaLayer; transform: string }> = [
    { key: "lu", transform: "祿" },
    { key: "quan", transform: "權" },
    { key: "ke", transform: "科" },
    { key: "ji", transform: "忌" },
  ];
  for (const { key, transform } of transformMap) {
    const entry = benmingLayer[key];
    if (entry?.starName && entry?.palaceName) {
      flows.push({
        layer: "natal",
        star: entry.starName,
        transform,
        fromPalace: entry.palaceName,
        toPalace: entry.palaceName,
      });
    }
  }
  return flows;
}

// ========== 收集各宮飛星 ==========

function collectFlowsByPalace(
  overlay: PalaceOverlayEntry[],
  natalFlows: GongGanFlow[]
): Map<string, GongGanFlow[]> {
  const palaceFlows = new Map<string, GongGanFlow[]>();

  // 加入本命四化
  for (const f of natalFlows) {
    const toPalace = f.toPalace;
    if (!palaceFlows.has(toPalace)) {
      palaceFlows.set(toPalace, []);
    }
    palaceFlows.get(toPalace)!.push(f);
  }

  // 加入大限與流年四化
  for (const entry of overlay) {
    for (const f of [...entry.decadalIncoming, ...entry.yearlyIncoming]) {
      const toPalace = f.toPalace;
      if (!palaceFlows.has(toPalace)) {
        palaceFlows.set(toPalace, []);
      }
      const existing = palaceFlows.get(toPalace)!;
      const key = `${f.layer}-${f.star}-${f.transform}-${f.fromPalace}-${f.toPalace}`;
      if (!existing.some((e) => `${e.layer}-${e.star}-${e.transform}-${e.fromPalace}-${e.toPalace}` === key)) {
        existing.push(f);
      }
    }
  }

  return palaceFlows;
}

// ========== 建構單宮訊號 ==========

function buildPalaceSignal(palace: string, flows: GongGanFlow[]): PalaceSignal {
  const vectors = computePalaceVectors(flows);
  const score = computeScore(vectors);
  const fortuneLevel = getFortuneLevel(score);
  const statusIcon = getStatusIcon(vectors, score);
  const energyLevel = getEnergyLevel(flows);
  const pattern = getPattern(vectors);

  return {
    palace,
    flows,
    ...vectors,
    score,
    fortuneLevel,
    statusIcon,
    energyLevel,
    pattern,
  };
}

// ========== 關鍵宮位 ==========

function computeKeyPalaces(palaceSignals: PalaceSignal[]): { strongestOpportunity: string[]; strongestPressure: string[] } {
  const oppScores: [string, number][] = [];
  const pressureScores: [string, number][] = [];

  for (const ps of palaceSignals) {
    if (ps.score > 0) {
      oppScores.push([ps.palace, ps.score]);
    }
    if (ps.risk > 0) {
      pressureScores.push([ps.palace, ps.risk]);
    }
  }

  oppScores.sort((a, b) => b[1] - a[1]);
  pressureScores.sort((a, b) => b[1] - a[1]);

  return {
    strongestOpportunity: oppScores.slice(0, 3).map(([p]) => p),
    strongestPressure: pressureScores.slice(0, 3).map(([p]) => p),
  };
}

// ========== 主線與功課 ==========

function buildMainThemeAndChallenge(palaceSignals: PalaceSignal[]): { mainTheme: { palace: string; text: string }; challenge: { palace: string; text: string } } {
  let mainPalace = "";
  let mainScore = -Infinity;
  let challengePalace = "";
  let challengeRisk = -Infinity;

  for (const ps of palaceSignals) {
    if (ps.score > mainScore) {
      mainScore = ps.score;
      mainPalace = ps.palace;
    }
    if (ps.risk > challengeRisk) {
      challengeRisk = ps.risk;
      challengePalace = ps.palace;
    }
  }

  const mainShort = getPalaceShortLabel(mainPalace);
  const challengeShort = getPalaceShortLabel(challengePalace);

  const mainText = mainPalace
    ? `今年主線落在【${mainPalace}】。重點會放在${mainShort}如何推進與整合。`
    : "今年沒有特別明顯的主線宮位。";

  const challengeText = challengePalace && challengeRisk > 0
    ? `功課落在【${challengePalace}】。${challengeShort}這一塊容易累積壓力，需要留意如何調節。`
    : "";

  return {
    mainTheme: { palace: mainPalace, text: mainText },
    challenge: { palace: challengePalace, text: challengeText },
  };
}

// ========== 主入口 ==========

/**
 * 建構 S18 訊號：本命 + 大限 + 流年四化
 * @param overlay - 12 宮 overlay（含 decadalIncoming, yearlyIncoming；若來自 NormalizedChart 則含 natalIncoming）
 * @param chartJson - 可選，用於讀取本命四化（fourTransformations.benming）；若 overlay 來自 buildPalaceOverlayFromNormalizedChart 則可省略，改從 overlay 取 natalIncoming
 */
export function buildEventSignals(
  overlay: PalaceOverlayEntry[],
  chartJson?: Record<string, unknown>
): S18Signals {
  // 本命四化：優先 chartJson；若無則從 overlay 的 natalIncoming 彙總（overlay 來自 NormalizedChart 時）
  let natalFlows: GongGanFlow[] = [];
  if (chartJson) {
    const sihuaLayers = buildSiHuaLayers(chartJson);
    natalFlows = sihuaLayers?.benming ? buildNatalFlows(sihuaLayers.benming) : [];
  } else {
    natalFlows = (overlay ?? []).flatMap((e) => e.natalIncoming ?? []);
  }

  const palaceFlowsMap = collectFlowsByPalace(overlay, natalFlows);

  const palaceSignals: PalaceSignal[] = [];
  for (const palace of PALACE_ORDER) {
    const flows = palaceFlowsMap.get(palace);
    if (flows && flows.length > 0) {
      palaceSignals.push(buildPalaceSignal(palace, flows));
    }
  }

  const keyPalaces = computeKeyPalaces(palaceSignals);
  const { mainTheme, challenge } = buildMainThemeAndChallenge(palaceSignals);

  return {
    palaces: palaceSignals,
    keyPalaces,
    mainTheme,
    challenge,
  };
}

// ========== 輸出敘事 ==========

export function signalsToNarrative(signals: S18Signals): string {
  const lines: string[] = ["【疊宮事件訊號】", ""];

  for (const ps of signals.palaces) {
    const shortLabel = getPalaceShortLabel(ps.palace);
    lines.push(`【${ps.palace}｜${shortLabel}】`);
    lines.push(`運勢：${ps.fortuneLevel}`);
    lines.push(`狀態：${ps.statusIcon}`);
    lines.push(`動能：${ps.energyLevel}`);
    
    // Pattern Layer（組合判斷）：放在運勢/狀態/動能之後、飛星之前
    // 每宮都有 pattern，但 "none" 時不顯示
    if (ps.pattern.id !== "none") {
      lines.push("");
      lines.push(`${ps.pattern.icon}${ps.pattern.label}`);
      lines.push(ps.pattern.description);
      lines.push(ps.pattern.summary);  // 局的總結，S19 起點
    }
    
    lines.push("");
    lines.push("飛星：");
    for (const f of ps.flows) {
      lines.push("- " + formatFlowNarrative(f));
    }
    lines.push("");
  }

  lines.push("【關鍵宮位】");
  if (signals.keyPalaces.strongestOpportunity.length > 0) {
    lines.push("機會較強：" + signals.keyPalaces.strongestOpportunity.join("、"));
  }
  if (signals.keyPalaces.strongestPressure.length > 0) {
    lines.push("壓力較強：" + signals.keyPalaces.strongestPressure.join("、"));
  }
  lines.push("");

  lines.push("【今年主線與功課】");
  lines.push("主線：" + signals.mainTheme.text);
  if (signals.challenge.text) {
    lines.push("功課：" + signals.challenge.text);
  }
  lines.push("這一年更重要的，不是做得更多，而是把真正牽動局勢的地方看清楚。");

  return lines.join("\n").trim();
}

// ========== 相容舊介面 ==========

export type EventCategory = "finance" | "career" | "relationship" | "mindset" | "self";

export interface EventSignal {
  category: EventCategory;
  score: number;
  intensity: number;
  isConflicting: boolean;
  reasons: string[];
  palacesInvolved: string[];
  incomingFlows: GongGanFlow[];
  outgoingFlows: GongGanFlow[];
}

export interface EventSignals {
  finance: EventSignal;
  career: EventSignal;
  relationship: EventSignal;
  mindset: EventSignal;
  self: EventSignal;
  keyPalaces: {
    strongestOpportunity: string[];
    strongestPressure: string[];
  };
}

function createEmptyEventSignal(category: EventCategory): EventSignal {
  return {
    category,
    score: 0,
    intensity: 0,
    isConflicting: false,
    reasons: [],
    palacesInvolved: [],
    incomingFlows: [],
    outgoingFlows: [],
  };
}

export function buildEventSignalsLegacy(overlay: PalaceOverlayEntry[]): EventSignals {
  return {
    finance: createEmptyEventSignal("finance"),
    career: createEmptyEventSignal("career"),
    relationship: createEmptyEventSignal("relationship"),
    mindset: createEmptyEventSignal("mindset"),
    self: createEmptyEventSignal("self"),
    keyPalaces: {
      strongestOpportunity: [],
      strongestPressure: [],
    },
  };
}

/** Debug：印出 S18Signals 供驗收 */
export function debugEventSignals(signals: S18Signals): void {
  console.log("[S18] === S18Signals ===");
  for (const ps of signals.palaces) {
    console.log(`[S18] ${ps.palace}: score=${ps.score} fortune=${ps.fortuneLevel} status=${ps.statusIcon} energy=${ps.energyLevel}`);
    console.log(`[S18]   vectors: resource=${ps.resource} power=${ps.power} structure=${ps.structure} risk=${ps.risk}`);
    console.log(`[S18]   pattern: ${ps.pattern.id}`);
    console.log(`[S18]   flows: ${ps.flows.length}`);
  }
  console.log("[S18] keyPalaces.strongestOpportunity:", signals.keyPalaces.strongestOpportunity);
  console.log("[S18] keyPalaces.strongestPressure:", signals.keyPalaces.strongestPressure);
  console.log("[S18] === end ===");
}
