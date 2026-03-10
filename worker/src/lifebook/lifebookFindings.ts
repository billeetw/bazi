/**
 * Layer 4：LifebookFindings（命術書引擎 Architecture Spec v1.1）
 * 全書唯一真相來源。章節、模板、section assembler 一律只讀 LifebookFindings，不准直接讀 chart。
 */

/** 主戰場：宮位 + 分數 + 理由 + 層級（施工圖 v1：score, reasons[], source） */
export interface MainBattlefield {
  palace: string;
  /** 施工圖 v1：選主戰場加權分數 */
  score?: number;
  /** 施工圖 v1：理由列表，例 ["小限落宮","多層化忌命中","官祿壓力外溢"] */
  reasons?: string[];
  /** 相容：單一理由字串（reasons.join） */
  reason?: string;
  label?: string;
  layer: "natal" | "decade" | "year";
  source?: "selector";
}

/** 壓力出口：宮位 + 敘事 + 分數（施工圖 v1：pattern?, score, source） */
export interface PressureOutlet {
  palace: string;
  /** 施工圖 v1：壓力型 pattern 描述 */
  pattern?: string;
  narrative: string;
  /** 施工圖 v1：選壓力出口加權分數 */
  score?: number;
  source?: "selector";
  /** 相容 */
  type?: string;
  bodySignals?: string[];
}

/** 壓力外溢：源宮 → 目標宮 + 規則診斷（CL3 spilloverEngine） */
export interface SpilloverFinding {
  ruleId: string;
  fromPalace: string;
  toPalace: string;
  transform?: "祿" | "權" | "科" | "忌";
  diagnosis: string;
  lifePattern: string;
  advice: string;
  shockLevel: number;
  axis?: string;
  source: "crossChartRule";
  /** 時間層（供 crossChartEngine 分桶） */
  layer?: "natal" | "decade" | "year" | "xiaoxian";
  /** 相容：等同 fromPalace */
  sourcePalace?: string;
  /** 相容：等同 toPalace */
  targetPalace?: string;
  /** 相容：diagnosis + lifePattern 合併句 */
  narrative?: string;
}

/** 三盤聯動：同主題多時間層疊加診斷（CL3 crossChartEngine） */
export interface CrossChartFinding {
  findingId: string;
  palace: string;
  natalLine?: string;
  decadalLine?: string;
  yearlyLine?: string;
  synthesis: string;
  advice?: string;
  shockLevel: number;
  source: "crossChart";
}

/** 年度訊號：紅綠燈（CL3 可補 signalId, description, shockLevel, source） */
export interface YearSignal {
  year: number;
  palace?: string;
  color: "red" | "green" | "yellow";
  label: string;
  advice: string;
  signalId?: string;
  description?: string;
  shockLevel?: number;
  source?: string;
}

/** 關鍵年份：地雷／機會／震盪（施工圖 v1：label, score） */
export interface KeyYearFinding {
  year: number;
  age?: number;
  palace: string;
  /** 施工圖 v1：mine | opportunity | shock */
  label?: "mine" | "opportunity" | "shock";
  narrative: string;
  advice?: string;
  score?: number;
  /** 相容 */
  signal?: "mine" | "wealth" | "shock";
}

/** 靈魂功課：主題 + 一句 + 來源（CL3 可補 lessonId, narrative, advice, palace） */
export interface LifeLessonFinding {
  theme: string;
  line: string;
  source: string;
  lessonId?: string;
  narrative?: string;
  advice?: string;
  palace?: string;
}

/** 行動建議：時間尺度 + 做／避／原因（施工圖 v1：label, narrative, source） */
export interface ActionItem {
  horizon: "now" | "1year" | "year" | "decade";
  /** 施工圖 v1：簡短標題 */
  label?: string;
  /** 施工圖 v1：完整敘事 */
  narrative?: string;
  source?: "actionBuilder";
  /** 相容：主要建議（narrative 或 do） */
  do: string;
  avoid?: string;
  why?: string;
}

/** 星曜組合：同宮兩星查 CCL3 star_combinations 產出（CL3 starCombinationEngine） */
export interface StarCombinationFinding {
  comboId: string;
  palace: string;
  stars: string[];
  patternType: string;
  patternName: string;
  psychology: string;
  lifePattern: string;
  shockLevel: number;
  bodySignals?: string[];
  narrativeHint?: string;
  source: "combination";
}

/** 四化×宮位×主星矩陣／fallback 產出（P2 palaceInference）；layer 供 crossChartEngine 分桶 */
export interface PalacePatternFinding {
  palace: string;
  mainStar?: string;
  transform: "祿" | "權" | "科" | "忌";
  patternName: string;
  patternType: "growth" | "pressure" | "power" | "correction";
  psychology: string;
  lifePattern: string;
  shockLevel: number;
  advice?: string;
  source: "matrix" | "fallback";
  patternId?: string;
  sensoryTags?: string[];
  /** 時間層（natal=本命, decade=大限, year=流年, xiaoxian=小限） */
  layer?: "natal" | "decade" | "year" | "xiaoxian";
}

/**
 * Layer 4 定稿：全系統唯一 findings 結構。
 * Chart 只進 normalize 與 inference engine；章節、模板、輸出一律只讀 findings。
 */
export interface LifebookFindings {
  mainBattlefields: MainBattlefield[];
  pressureOutlets: PressureOutlet[];
  spilloverFindings: SpilloverFinding[];
  crossChartFindings: CrossChartFinding[];
  yearSignals: YearSignal[];
  keyYears: KeyYearFinding[];
  lifeLessons: LifeLessonFinding[];
  actionItems: ActionItem[];
  starCombinations: StarCombinationFinding[];
  palacePatterns: PalacePatternFinding[];
}

export function createEmptyFindings(): LifebookFindings {
  return {
    mainBattlefields: [],
    pressureOutlets: [],
    spilloverFindings: [],
    crossChartFindings: [],
    yearSignals: [],
    keyYears: [],
    lifeLessons: [],
    actionItems: [],
    starCombinations: [],
    palacePatterns: [],
  };
}
