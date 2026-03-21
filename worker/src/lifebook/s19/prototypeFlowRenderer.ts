/**
 * S19 Prototype Flow Renderer (v2)
 * 
 * 資產使用規則：
 * 1. starTransformMeanings.json — 作為主幹語義
 * 2. starPalacesMain/Aux — 只可抽取場景詞，不可直接引用整句原文
 * 3. TRANSFORM_SEMANTIC_DICTIONARY — 只用於補足祿權科忌動作語氣
 * 4. STAR_SEMANTIC_DICTIONARY — 僅作 fallback
 * 
 * 組裝格式：
 * - header：保留星曜 + 四化 + from + to
 * - body：只用 1 句，格式為 [to宮場景] + [四化動作] + [星曜在該場景的角色]
 * 
 * 禁止事項：
 * - 禁止直接貼入「妳」「大吉」「另一半通常…」「有祖產運」等原命書句
 * - 禁止把本命人格描述當作當期事件描述
 * - 禁止輸出超過 1 句的 body
 */

import {
  PALACE_SEMANTIC_DICTIONARY,
} from "../starSemanticDictionary.js";

// ========== 類型定義 ==========

export interface FlowInput {
  star: string;
  transform: "祿" | "權" | "科" | "忌";
  from: string;
  to: string;
}

export interface AssemblyTrace {
  sceneKeywords: string[];
  starTrait: string;
  sources: {
    sceneFrom: string;
    starTraitFrom: string;
  };
}

export interface RenderedFlow {
  header: string;
  body: string;
  full: string;
  trace: AssemblyTrace;
}

// ========== 常數映射 ==========

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

// ========== 場景詞庫（從 starPalacesMain/Aux 抽取，非整句） ==========

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

// ========== 星曜特質詞庫（從 starTransformMeanings.json 抽取，分四化版本） ==========

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

function getPalaceShortLabel(palace: string): string {
  const sem = PALACE_SEMANTIC_DICTIONARY[palace];
  return sem?.short ?? palace;
}

function getSceneKeywords(palace: string): string[] {
  return PALACE_SCENE_KEYWORDS[palace] ?? [palace];
}

function getStarTraitForTransform(star: string, transform: string): string {
  const traits = STAR_TRAIT[star];
  if (!traits) return star;
  return (traits as Record<string, string>)[transform] ?? traits.core ?? star;
}

// ========== 核心組裝函式 ==========

export function renderFlowNarrativeFromExistingAssets(flow: FlowInput): RenderedFlow {
  const { star, transform, from, to } = flow;

  // Header
  const icon = TRANSFORM_ICON[transform];
  const label = TRANSFORM_LABEL[transform];
  const fromLabel = `${getPalaceShortLabel(from)}（${from}）`;
  const toLabel = `${getPalaceShortLabel(to)}（${to}）`;
  const header = `${icon}${label}${star}化${transform}自${fromLabel}飛入${toLabel}，`;

  // 取得組裝元素
  const sceneKeywords = getSceneKeywords(to);
  const starTrait = getStarTraitForTransform(star, transform);

  // 組裝 body（只用 1 句）
  const scene = sceneKeywords.slice(0, 2).join("與");
  let body: string;

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

  return {
    header,
    body,
    full: header + body,
    trace: {
      sceneKeywords,
      starTrait,
      sources: {
        sceneFrom: "PALACE_SCENE_KEYWORDS（從 starPalacesMain/Aux 抽取場景詞）",
        starTraitFrom: "STAR_TRAIT（從 starTransformMeanings.json 抽取動作語義）",
      },
    },
  };
}

// ========== 測試用例 ==========

export const TEST_FLOWS: FlowInput[] = [
  { star: "文昌", transform: "忌", from: "疾厄宮", to: "夫妻宮" },
  { star: "天梁", transform: "祿", from: "父母宮", to: "田宅宮" },
  { star: "武曲", transform: "忌", from: "官祿宮", to: "財帛宮" },
  { star: "文昌", transform: "科", from: "疾厄宮", to: "田宅宮" },
  { star: "天機", transform: "權", from: "疾厄宮", to: "遷移宮" },
  { star: "天同", transform: "祿", from: "疾厄宮", to: "福德宮" },
];
