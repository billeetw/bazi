import type {
  PalaceNarrativeInput as BasePalaceNarrativeInput,
  PalaceNarrativeTone,
} from "../../palaceNarrativeTypes.js";
import type { PalaceStructure, TransformDisplay, TransformEdge } from "../../normalizedChart.js";
import type { BehaviorAxis } from "./behaviorAxisV1.js";

export type { PalaceNarrativeTone };

/**
 * 由 NormalizedChart 單一宮位產出「逐宮讀者敘事」用的 PalaceRawInput（與命書章節 s17 疊宮章無涉）。
 * 統一架構：chart.palaces 可全數轉成 raw 再送 buildPalaceNarrativeInput。
 */
export function palaceStructureToPalaceRawInput(palace: PalaceStructure): PalaceRawInput {
  const toName = (s: { name?: string }): string => (s?.name ?? "").trim();
  const mainStars = (palace.mainStars ?? []).map(toName).filter(Boolean);
  const minorStars = (palace.assistantStars ?? []).map(toName).filter(Boolean);
  const miscStars = [
    ...(palace.shaStars ?? []).map(toName),
    ...(palace.miscStars ?? []).map(toName),
  ].filter(Boolean);
  const brightness: Record<string, "廟" | "旺" | "得" | "平" | "陷"> = {};
  const allStars = [
    ...(palace.mainStars ?? []),
    ...(palace.assistantStars ?? []),
    ...(palace.shaStars ?? []),
    ...(palace.miscStars ?? []),
  ];
  for (const s of allStars) {
    const name = toName(s);
    if (!name) continue;
    const b = (s as { brightness?: string }).brightness;
    if (b && b !== "不") {
      brightness[name] = (b === "利" ? "得" : b) as "廟" | "旺" | "得" | "平" | "陷";
    }
  }
  return {
    palace: palace.palace,
    mainStars,
    minorStars,
    miscStars,
    brightness: Object.keys(brightness).length > 0 ? brightness : undefined,
    natalTransformsIn: palace.natalTransformsIn?.length ? palace.natalTransformsIn : undefined,
    natalTransformsOut: palace.natalTransformsOut?.length ? palace.natalTransformsOut : undefined,
    relatedPalaces: undefined,
  };
}

/** 單宮本命四化（與 normalizeChart 宮位上的 In/Out 邊對齊） */
export type PalaceNatalTransform = {
  star: string;
  transform: TransformDisplay;
  direction: "in" | "out";
};

/** 命宮等讀者敘事強度（心理安全／敢講度） */
export type ReaderNarrativeIntensity = "soft" | "standard" | "direct";

export type ReaderTurn = {
  reframe: string;
  action?: string;
};

/** 命宮首屏加值：三档文案可並存，供 UI 切換 */
export type MingNarrativePremiumPayload = {
  provocativeQuestions: string[];
  headlines: Record<ReaderNarrativeIntensity, string>;
  mirrors: Record<ReaderNarrativeIntensity, string>;
  turns: Record<ReaderNarrativeIntensity, ReaderTurn>;
  /** 非命宮：可覆寫「真實運作／坑」條目（例：福德·天同巨門專屬句） */
  bodyOverrides?: {
    phenomenonLines?: string[];
    pitfallLines?: string[];
  };
};

/** 與命宮 premium 同形；多宮共用時請優先讀此欄，其次 mingNarrativePremium（命宮相容） */
export type ReaderPremiumPayload = MingNarrativePremiumPayload;

export type PalaceRawInput = {
  palace: string;
  mainStars: string[];
  minorStars: string[];
  miscStars: string[];
  /** 讀者敘事強度（預設 standard）；命宮 premium 與未來擴充共用 */
  readerNarrativeIntensity?: ReaderNarrativeIntensity;
  /** 命宮等：稱呼姓名，斷語前可加「OOO，」 */
  readerDisplayName?: string;
  brightness?: Record<string, "廟" | "旺" | "得" | "平" | "陷">;
  /** 落於此宮的四化邊（normalize：natalTransformsIn） */
  natalTransformsIn?: TransformEdge[];
  /** 自此宮飛出的四化邊（normalize：natalTransformsOut） */
  natalTransformsOut?: TransformEdge[];
  /** 舊版：此宮內星曜化祿／權／科／忌（無邊資料時使用） */
  natalTransforms?: {
    祿?: string;
    權?: string;
    科?: string;
    忌?: string;
  };
  relatedPalaces?: string[];
};

/** 本命四化：顯示標籤 + 敘事（逐宮讀者敘事 · 星曜結構解析） */
export type PalaceNatalTransformItem = {
  label: string;
  narrative: string;
};

export interface PalaceNarrativeInput extends BasePalaceNarrativeInput {
  decisionPatterns: string[];
  pitfalls: string[];
  structuralSummary: string;
  /** Behavior Axis v1：命宮地支語氣層（feature flag） */
  behaviorAxis?: BehaviorAxis;
  /** Loop 一句（與 H3/H4 分開呈現；flag：behaviorAxisLoopV1） */
  behaviorLoopLine?: string;
  /** 本次輸出是否套用各層（方便驗收／除錯） */
  behaviorAxisApplied?: { v1: boolean; conflictV1: boolean; loopV1: boolean };
  /** 權重驅動段落：renderer 不補通用 fallback */
  weightedMode?: boolean;
  /** 本命四化 v1：最多 2 條（優先 transformIn，其次 Out，再舊版 map） */
  natalTransformItems?: PalaceNatalTransformItem[];
  /** 與 raw.readerNarrativeIntensity 對齊，供渲染端使用 */
  readerNarrativeIntensity?: ReaderNarrativeIntensity;
  /** 命宮：斷語／問答／鏡像／力量收尾（他宮可先空） */
  mingNarrativePremium?: MingNarrativePremiumPayload;
  /** 12 宮皆可：與 ming 同層級 payload（canonical；無宮內星可解時 builder 不填） */
  readerPremium?: ReaderPremiumPayload;
  /** 與 raw.readerDisplayName 對齊 */
  readerDisplayName?: string;
}

