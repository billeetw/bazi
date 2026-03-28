/**
 * Layer 4：LifebookFindings（命術書引擎 Architecture Spec v1.1）
 * 全書唯一真相來源。章節、模板、section assembler 一律只讀 LifebookFindings，不准直接讀 chart。
 */

import type { DiagnosticBundle } from "./diagnosticTypes.js";
import type { TimeModuleDecisionSnapshot } from "./timeModuleDecisionSnapshot.js";
import type { TimeModuleS17S19ReaderSnapshot } from "./timeModuleS17S19ReaderSnapshot.js";

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
  /** 定盤提問：命中時在【星曜組合】區塊第一句輸出此問句 */
  rectificationQuestion?: string;
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
 * 時間軸校對總覽之原子欄位（供模板 placeholder 替換；契約：僅由 Worker 產出 Findings 時寫入）。
 */
export interface TimeAxisSummary {
  birthSihuaLine: string;
  currentDecadalPalace: string;
  currentDecadeSihuaLine: string;
  flowYearMingPalace: string;
  flowYearSihuaLine: string;
  flowYearSihuaNote: string;
  /** 流年四化飛星：自X宮出、飛入Y宮（與四化飛星技術版同源） */
  flowYearSihuaFlyBlock?: string;
  /** 流年四化飛星解釋段：星+四化+路徑組句（星象徵、化X帶來、代表從A到B、因此…） */
  flowYearSihuaFlyExplanations?: string;
}

/**
 * 單筆四化落宮（本命／大限／流年）：供單宮 contextual filtering 使用。
 * 不得從字串反解析；僅由產出 Findings 的 pipeline 寫入。
 */
export interface SihuaPlacementItem {
  layer: "natal" | "decade" | "year";
  transform: "祿" | "權" | "科" | "忌";
  starName: string;
  targetPalace: string;
}

/**
 * 本命宮干飛化單筆（from→to）：供單宮 contextual filtering 使用。
 * 僅本命層；來源為 NormalizedChart.natal.flows。
 */
export interface NatalFlowItem {
  fromPalace: string;
  toPalace: string;
  starName?: string;
  transform: "祿" | "權" | "科" | "忌";
}

/**
 * Layer 4 定稿：全系統唯一 findings 結構。
 * Chart 只進 normalize 與 inference engine；章節、模板、輸出一律只讀 findings。
 * 命書正式版只准讀取 LifebookFindings；timelineSummary / sihuaPlacement / sihuaEnergy / natalFlows 為預先計算區塊。
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
  /** 時間軸校對總覽（生年／大限／流年四化來源）；預先計算，模板僅組裝。 */
  timelineSummary?: string;
  /** 本命／大限／流年四化落宮核心資料段；預先計算。 */
  sihuaPlacement?: string;
  /** 四化能量集中摘要；預先計算。 */
  sihuaEnergy?: string;
  /** 本命宮干飛化區塊（唯一來源 natal.flows）；預先計算。 */
  natalFlows?: string;
  /** 時間軸原子欄位（供既有 placeholder 如 birthSihuaLine 等）；預先計算。 */
  timeAxis?: TimeAxisSummary;
  /** 四化落宮結構化（本命／大限／流年各筆）；供單宮過濾，不得從字串反解析。 */
  sihuaPlacementItems?: SihuaPlacementItem[];
  /** 本命宮干飛化結構化（僅 natal.flows）；供單宮過濾。 */
  natalFlowItems?: NatalFlowItem[];
  /**
   * 模組二：疊宮／計數／區塊字串快照（建置 findings 時自 chart 只算一次）。
   * placeholder 層：有則只讀此欄位；無則明確 fallback 至 chart-only builder（禁止同段混讀 findings + overlap + chart）。
   */
  timeModuleOverlap?: TimeModuleOverlapSnapshot;
  /**
   * 模組二：決策矩陣產出（keyYearsDecisionTimeline、yearDecisionSummaryBlock）建置時只算一次；
   * 與 timeModuleOverlap.palaceOverlapTags 同源，placeholder 禁止再讀 overlap。
   */
  timeModuleDecision?: TimeModuleDecisionSnapshot;
  /**
   * 穿透式診斷包（buildPiercingDiagnosticBundle）：建置 findings 時只算一次；
   * placeholder 層有則只讀此欄位，無則 fallback chart-only builder。
   */
  piercingDiagnosticBundle?: DiagnosticBundle;
  /**
   * s17–s19 技術版／讀者版骨架欄位（palaceOverlayBlocks、s18SignalsBlocks、s19MonthlyBlocks）單次預算；
   * 與 getPlaceholderMapFromContext／inject P2 共用，禁止與現場 overlay 重算混讀。
   */
  timeModuleS17S19ReaderSnapshot?: TimeModuleS17S19ReaderSnapshot;
}

/** 模組二疊宮 placeholder 快照（與 getPlaceholderMapFromContext 之 shock/mine/wealth 區塊對齊） */
export interface TimeModuleOverlapSnapshot {
  shockCount: string;
  mineCount: string;
  wealthCount: string;
  overlapSummary: string;
  shockBlocks: string;
  mineBlocks: string;
  wealthBlocks: string;
  volatileSection: string;
  criticalRisksSection: string;
  opportunitiesSection: string;
  keyYearsMineLead: string;
  keyYearsWealthLead: string;
  keyYearsShockLead: string;
  /** 建置時 chart 是否含小限列（供 overlapDataMissingNotice） */
  hasMinorFortuneRows: boolean;
  /** 建置時 chart 是否含疊宮 payload */
  hasOverlapPayload: boolean;
  /** 小限時間軸／決策矩陣：正規化宮名 → 疊宮 tag（與 chart 路徑同源，只建置一次） */
  palaceOverlapTags: Record<string, "shock" | "mine" | "wealth">;
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
