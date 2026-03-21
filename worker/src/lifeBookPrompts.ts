/**
 * 命書生成 Prompt（簡化版，GPT-4.1 友善）
 * system：短版人格 + 輸出格式
 * user：題號、標題、任務、命盤、宮位背景、注意事項、數據補充（時間軸置底）
 *
 * --- 命身四者聯動（用於 s04 與總論）---
 * 比喻：命宮＝船的型號、身宮＝船的航向、命主＝船長的心思、身主＝船上的燃料與引擎。
 * 若命書不把這四者的聯動講清楚，就只是在講星座，不是在講命。
 *
 * generateContext(profile) 核心邏輯（pseudo）：
 * 1. 判定基礎性格：妳的底色是 profile.main_star 的特質。
 * 2. 判定後天位移：若命宮===身宮 → 「初衷不改」；否則 → 35歲後靈魂位移到 body_palace。
 * 3. 注入工具箱能量：妳解決問題的絕招隱藏在 profile.body_lord 的特質中。
 * 實作見 index.ts getBodyPalaceInfo / getLifeBodyRelationSnippet，並在 s04 注入 lifeBodyRelationSnippet。
 */

import {
  SECTION_ORDER,
  SECTION_TEMPLATES,
  SHISHEN_PHRASES,
  WUXING_WEAK_PHRASES,
  type SliceType,
  type SectionTemplate,
} from "./lifeBookTemplates.js";
import { getStrategicText } from "./strategicPhrases.js";
import {
  assembleRiskProfile,
  resolveAssembleSnippets,
  buildAssembleInput,
  PALACE_NAME_ZH_TO_ID,
  PALACES,
  PALACE_ID_TO_NAME,
  WUXING_NAME_ZH_TO_ID,
  WUXING_ID_TO_NAME,
  TENGOD_ID_TO_NAME,
  STAR_NAME_ZH_TO_ID,
  STAR_ID_TO_NAME,
  type AssembleContentLookup,
  assembleTimeModuleFromFindings,
  hasTimelineErrors,
  type LifebookFindings,
  type SihuaPlacementItem,
  type TimelineValidationIssue,
  normalizeChart,
  createEmptyFindings,
} from "./lifebook/index.js";
import type { NormalizedChart } from "./lifebook/normalizedChart.js";
import type { LifebookFindingsV2 } from "./lifebook/v2/schema/findingsV2.js";
import { buildS15aPlaceholderMapFromV2 } from "./lifebook/v2/assembler/buildS15aMapFromV2.js";
import { buildS16PlaceholderMapFromV2 } from "./lifebook/v2/assembler/buildS16MapFromV2.js";
import { getFlowBlockForPalace, buildFlowDebugEntries, type FlowDebugEntry } from "./lifebook/transforms/buildTransformFlowLines.js";
import { buildPalaceByBranch, getFlowYearPalace } from "./palace-map.js";
import {
  buildTimeModuleDisplayFromChartJson,
  buildNatalGongganFlowBlock,
  type SihuaTimeBlocks,
} from "./lifebook/sihuaTimeBuilders.js";
import { getYearRoleInDecadeAndWhy, getRoleTakeaway } from "./lifebook/timeModulePlaceholders.js";
import { getSanfangFamilyForPalace } from "./utils/starSanfangFamilies.js";
import { buildDecadalSihuaFlows, buildPalaceStemMap, buildYearlySihuaFlows } from "./gonggan-flows.js";
import { getMutagenStarsFromStem } from "./sihua-stem-table.js";
import { getStarByPalaceFromChart } from "./lifebook/normalize/index.js";
import { buildPalaces, findZiweiPalaceSlotIndexForCanonical } from "./lifebook/normalize/normalizePalaces.js";
import { toPalaceCanonical } from "./lifebook/canonicalKeys.js";
import { buildPalaceOverlay, buildPalaceOverlayBlocks, buildPalaceOverlayFromNormalizedChart } from "./lifebook/palaceOverlay.js";
import { buildEventSignals, signalsToNarrative } from "./lifebook/s18/eventSignals.js";
import { buildPalaceNarrativeInput } from "./lifebook/s17/palaceNarrative/PalaceNarrativeBuilder.js";
import { renderPalaceNarrativeSample } from "./lifebook/s17/palaceNarrative/palaceNarrativeSampleRenderer.js";
import {
  palaceStructureToPalaceRawInput,
  type PalaceRawInput,
} from "./lifebook/s17/palaceNarrative/palaceNarrativeTypes.js";
import { enrichPalaceRawWithBenmingMutagen } from "./lifebook/s17/palaceNarrative/enrichPalaceBenmingMutagen.js";
import { buildS19MonthlyOutput, formatS19MonthlyOutputToCard } from "./lifebook/s19/index.js";
import { aggregatePalaceWeightRisk, type StarMetadataInput } from "./lifebook/palaceWeightRiskAggregator.js";
import {
  buildYearDecisionSummary,
  formatYearDecisionSummaryBlock,
  formatXiaoXianDecisionTimeline,
  evaluateFourTransformPatterns,
  formatPatternNarrative,
  formatPatternActions,
  getHotStarsAndPalaces,
  renderPatternHitsForModuleOne,
  renderPatternHitsForPalace,
  getModuleOneRuleIds,
  buildStarEnergyRhythmBlock,
  calculateStarGroupStats,
  calculateStarGroupStatsWeighted,
  getTopTwoGroups,
  computeRhythmOnce,
  buildRhythmNarrativeFourSegmentsV2,
  extractSihuaFromEvents,
  RHYTHM_FOUR_PALACE_IDS,
  type RhythmStats,
  MAIN_STAR_WHITELIST,
  AUX_STAR_WHITELIST,
  getStarGroupNarrative,
  hasGroup,
  buildS00YearlyAdvice,
  normalizeSiHuaEvents as normalizeSiHuaEventsLegacy,
  detectDominantPalaces,
  formatDominantPalacesBlock,
  detectLifeArchetype,
  formatLifeArchetypeBlock,
  type DecisionMatrixConfig,
  type XiaoXianYearItem,
  type SiHuaEvent,
  type PatternHit,
  buildTopFlowsBlock,
  computeSinkScores,
  buildLoopSummaryBlock,
  detectMultiLayerConflict,
  getPalaceSemantic,
  getStarSemantic,
  toPalaceCanonical,
  getDecadalPalaceTheme,
  getStarTransformMeaning,
  buildFlyStarExplanation,
} from "./lifebook/index.js";
import { buildDestinyBodyDialogue } from "./lifebook/destinyBodyDialogue.js";
import { buildBodyPalaceAlignmentNarrative } from "./lifebook/bodyPalaceAlignment.js";
import { buildS04StrategyIntegrated } from "./lifebook/s04StrategyIntegrated.js";
import { buildSihuaEdges, getEdgeScore } from "./lifebook/sihuaFlowEngine.js";
import type { DiagnosticEdge } from "./lifebook/diagnosticTypes.js";
import { buildDiagnosticBundle, buildPalaceSignalsFromEdges } from "./lifebook/diagnosticEngine.js";
import { buildPalaceStarNarrativeBlock, buildPalaceStarIntroBlock } from "./lifebook/starNarrativeForPalace.js";
import { createNarrativeFacade, type NarrativeContentLookup } from "./lifebook/narrativeFacade.js";
import {
  buildMingGongStarNarrative,
  buildMingGongAssistantNarrative as buildMingGongAssistantNarrativeFromAdapter,
  buildMingGongTransformNarrative,
} from "./lifebook/mingGongAdapters.js";
import {
  pickPalaceCoreDefinition,
  buildPalaceStarNarrative,
  buildPalaceAssistantNarrative,
  buildPalaceTransformNarrative,
  getPalaceSanfangInsight,
} from "./lifebook/palaceAdapters.js";
import { buildBrightnessNarrative } from "./lifebook/brightnessNarrative.js";
import {
  generateNarrative,
  buildDecisionAdviceFromHits,
} from "./engine/index.js";

/** 一律用 buildPalaceStarNarrative 產出 tension / mature，可對應星曜與宮位。 */

/** 句子級去重：依 \n\n 或 \n 切分，保留首次出現的句子，再合併 */
function dedupeSentences(text: string): string {
  if (!text || typeof text !== "string") return text;
  const parts = text.split(/\n\n+/).map((s) => s.trim()).filter(Boolean);
  const seen = new Set<string>();
  const out: string[] = [];
  for (const p of parts) {
    const norm = p.replace(/\s+/g, " ").trim();
    if (norm && !seen.has(norm)) {
      seen.add(norm);
      out.push(p);
    }
  }
  return out.join("\n\n");
}

/** 標點生成錯誤清洗：句庫拼接常見的錯誤標點 */
export function normalizePunctuation(text: string): string {
  if (!text || typeof text !== "string") return text;
  return text
    .replace(/。+/g, "。")
    .replace(/；。/g, "。")
    .replace(/。；/g, "。")
    .replace(/，+/g, "，")
    .trim();
}

/** 四欄（主結論／行為模式／盲點／策略建議）段落級去重：依序處理，已出現過的段落後續 block 不再輸出 */
export function dedupeParagraphsAcrossBlocks(blocks: [string, string, string, string]): [string, string, string, string] {
  const seen = new Set<string>();
  const out: [string, string, string, string] = ["", "", "", ""];
  for (let i = 0; i < 4; i++) {
    const block = blocks[i] ?? "";
    const paras = block.split(/\n\n+/).map((s) => s.trim()).filter(Boolean);
    const kept: string[] = [];
    for (const p of paras) {
      const norm = p.replace(/\s+/g, " ").trim();
      if (norm && !seen.has(norm)) {
        seen.add(norm);
        kept.push(p);
      }
    }
    out[i] = kept.join("\n\n");
  }
  return out;
}

/** 12 宮順序（與 PALACES 一致）：用於三方四正計算 */
const PALACE_RING_ZH = PALACES.map((p) => p.name);

/** 12 宮位章節（s02 命宮、s10 財帛…）：使用新骨架與宮位核心定義，缺資料時不輸出「此欄位資料不足」 */
export const PALACE_SECTION_KEYS = new Set<string>(["s02", "s01", "s05", "s06", "s07", "s08", "s09", "s10", "s11", "s12", "s13", "s14"]);

/** 14 主星（與 star-registry category: major 一致）：主線劇本、人格／行動／世界觀 */
const MAIN_STAR_NAMES = new Set<string>([
  "紫微", "天機", "太陽", "武曲", "天同", "廉貞", "天府", "太陰", "貪狼", "巨門", "天相", "天梁", "七殺", "破軍",
]);

/** 六煞星：壓力／推動／事件加速器（其餘 minor 為輔星：修補／補強／加成） */
const SHA_STAR_NAMES = new Set<string>(["擎羊", "陀羅", "火星", "鈴星", "地空", "地劫"]);

/** 依宮位名回傳三方四正宮位名（本宮＋三合兩宮＋對宮），頓號分隔 */
function getSanfangSizheng(palaceName: string): string {
  if (!palaceName || !PALACE_RING_ZH.length) return "";
  const key = palaceName.replace(/宮$/, "") === "命" ? "命宮" : palaceName;
  let idx = key === "命宮" ? 0 : PALACE_RING_ZH.findIndex((p) => p === key || (p !== "命宮" && p + "宮" === key));
  if (idx < 0) return "";
  const oppositeIdx = (idx + 6) % 12;
  const triad1Idx = (idx + 4) % 12;
  const triad2Idx = (idx + 8) % 12;
  const names = [PALACE_RING_ZH[idx], PALACE_RING_ZH[triad1Idx], PALACE_RING_ZH[triad2Idx], PALACE_RING_ZH[oppositeIdx]];
  return [...new Set(names)].join("、");
}

/** 宮位名 → 排序用索引（0～11），用於 s15a 疊宮區塊排序 */
function getPalaceSortIndex(palaceName: string): number {
  if (!palaceName || !PALACE_RING_ZH.length) return 99;
  const key = palaceName.replace(/宮$/, "") === "命" ? "命宮" : palaceName;
  const idx = key === "命宮" ? 0 : PALACE_RING_ZH.findIndex((p) => p === key || (p !== "命宮" && p + "宮" === key));
  return idx >= 0 ? idx : 99;
}

/** 宮位名 → 對宮名（命↔遷、兄弟↔僕役、夫妻↔官祿、子女↔田宅、財帛↔福德、疾厄↔父母） */
function getOppositePalaceName(palaceName: string): string {
  if (!palaceName || !PALACE_RING_ZH.length) return "";
  const key = palaceName.replace(/宮$/, "") === "命" ? "命宮" : palaceName;
  const idx = key === "命宮" ? 0 : PALACE_RING_ZH.findIndex((p) => p === key || (p !== "命宮" && p + "宮" === key));
  if (idx < 0) return "";
  const oppIdx = (idx + 6) % 12;
  const opp = PALACE_RING_ZH[oppIdx];
  return opp ? (opp.endsWith("宮") ? opp : opp === "命宮" ? "命宮" : opp + "宮") : "";
}

/** 四化流向單筆（可含 from/to 宮位：祿從何來、忌往哪裡） */
export interface FlowTransformationEntry {
  layerLabel: string;
  starName: string;
  typeLabel: string;
  type: string;
  fromPalaceKey?: string;
  fromPalaceName?: string;
  toPalaceKey?: string;
  toPalaceName?: string;
}

/** 四化飛星單筆：層級＋星名＋祿權科忌＋出／入宮，供 s15/s16/s15a 高階判讀 */
export type FourTransformLayer = "benming" | "decadal" | "yearly";

export interface FourTransformLine {
  layer: FourTransformLayer;
  layerLabel: string;
  starName: string;
  type: "lu" | "quan" | "ke" | "ji";
  typeLabel: string;
  fromPalaceKey?: string;
  fromPalaceName?: string;
  toPalaceKey?: string;
  toPalaceName?: string;
}

const LAYER_LABEL_TO_KEY: Record<string, FourTransformLayer> = {
  本命: "benming",
  大限: "decadal",
  流年: "yearly",
};

const TYPE_TO_KEY: Record<string, "lu" | "quan" | "ke" | "ji"> = {
  祿: "lu",
  權: "quan",
  科: "ke",
  忌: "ji",
};

/** 正規化宮位名以便比對（命宮、兄弟、財帛…） */
function normPalaceForMatch(p: string): string {
  if (!p) return "";
  const s = (p || "").trim().replace(/宮$/, "");
  return s === "命" ? "命宮" : s || p;
}

/** 將 FlowTransformationEntry 轉成 FourTransformLine */
function toFourTransformLine(t: FlowTransformationEntry): FourTransformLine {
  const layer = LAYER_LABEL_TO_KEY[t.layerLabel] ?? "benming";
  const typeKey = TYPE_TO_KEY[t.type] ?? (t.type === "忌" ? "ji" : t.type === "祿" ? "lu" : t.type === "權" ? "quan" : "ke");
  return {
    layer,
    layerLabel: t.layerLabel,
    starName: t.starName ?? "",
    type: typeKey,
    typeLabel: t.typeLabel ?? (t.type === "忌" ? "化忌" : t.type === "祿" ? "化祿" : t.type === "權" ? "化權" : "化科"),
    fromPalaceKey: t.fromPalaceKey,
    fromPalaceName: t.fromPalaceName,
    toPalaceKey: t.toPalaceKey,
    toPalaceName: t.toPalaceName,
  };
}

/** 流年四化飛星僅用公式產出；缺資料時回傳 []，不讀 overlap。 */
function getYearlyFourTransformLinesFromFormula(chartJson: Record<string, unknown> | undefined): FourTransformLine[] {
  if (!chartJson) return [];
  const display = buildTimeModuleDisplayFromChartJson(chartJson);
  const flowYearStem =
    (chartJson.yearlyHoroscope as { stem?: string } | undefined)?.stem
    ?? (chartJson.liunian as { stem?: string } | undefined)?.stem
    ?? ((chartJson.ziwei as Record<string, unknown>)?.yearlyHoroscope as { stem?: string } | undefined)?.stem;
  const flowYearPalace = (display.flowYearMingPalace ?? "").trim();
  const starsByPalace = getStarByPalaceFromChart(chartJson);
  if (!flowYearStem || !flowYearPalace || starsByPalace.size === 0) return [];
  const flows = buildYearlySihuaFlows({
    yearStem: flowYearStem.trim(),
    flowYearPalace,
    starsByPalace,
  });
  return flows.map((f) => ({
    layer: "yearly" as const,
    layerLabel: "流年",
    starName: f.star,
    type: (f.transform === "祿" ? "lu" : f.transform === "權" ? "quan" : f.transform === "科" ? "ke" : "ji") as "lu" | "quan" | "ke" | "ji",
    typeLabel: f.transform === "祿" ? "化祿" : f.transform === "權" ? "化權" : f.transform === "科" ? "化科" : "化忌",
    fromPalaceKey: f.fromPalace,
    fromPalaceName: f.fromPalace,
    toPalaceKey: f.toPalace,
    toPalaceName: f.toPalace,
  }));
}

/**
 * 命宮四化 narrative 優先順序：主星本身四化（fourTransformations.benming）→ 無。疊宮報廢：不再從 overlap 取飛星列表。
 */
function getMingGongTransformNarrativeByPriority(
  chartJson: Record<string, unknown> | undefined,
  leadMainStarName: string
): string {
  if (!chartJson) return "";
  let natalStarTransform: { starName: string; type: "lu" | "quan" | "ke" | "ji" } | null = null;
  const ft = chartJson.fourTransformations as { benming?: { mutagenStars?: Record<string, string> } } | undefined;
  const mutagen = ft?.benming?.mutagenStars;
  if (mutagen && leadMainStarName) {
    const typeMap: Array<{ key: string; type: "lu" | "quan" | "ke" | "ji" }> = [
      { key: "祿", type: "lu" },
      { key: "權", type: "quan" },
      { key: "科", type: "ke" },
      { key: "忌", type: "ji" },
    ];
    for (const { key, type } of typeMap) {
      if (mutagen[key] === leadMainStarName) {
        natalStarTransform = { starName: leadMainStarName, type };
        break;
      }
    }
  }
  const transformEvent = natalStarTransform;
  if (!transformEvent) return "";
  return buildMingGongTransformNarrative({ starName: transformEvent.starName, type: transformEvent.type });
}

/**
 * 任意宮位四化 narrative 優先順序：主星本身四化（fourTransformations.benming）→ 無。疊宮報廢：不再從 overlap 取飛星列表。
 */
function getPalaceTransformNarrativeByPriority(
  chartJson: Record<string, unknown> | undefined,
  palaceKey: string,
  leadMainStarName: string
): string {
  if (!chartJson) return "";
  let natalStarTransform: { starName: string; type: "lu" | "quan" | "ke" | "ji" } | null = null;
  const ft = chartJson.fourTransformations as { benming?: { mutagenStars?: Record<string, string> } } | undefined;
  const mutagen = ft?.benming?.mutagenStars;
  if (mutagen && leadMainStarName) {
    const typeMap: Array<{ key: string; type: "lu" | "quan" | "ke" | "ji" }> = [
      { key: "祿", type: "lu" },
      { key: "權", type: "quan" },
      { key: "科", type: "ke" },
      { key: "忌", type: "ji" },
    ];
    for (const { key, type } of typeMap) {
      if (mutagen[key] === leadMainStarName) {
        natalStarTransform = { starName: leadMainStarName, type };
        break;
      }
    }
  }
  const transformEvent = natalStarTransform;
  if (!transformEvent) return "";
  return buildPalaceTransformNarrative(
    { starName: transformEvent.starName, type: transformEvent.type },
    palaceKey
  );
}

/** 模組二技術版不得出現小限；overlap 若有 layerLabel 小限／minor 一律排除 */
const LAYER_LABEL_EXCLUDE_FOR_M2 = ["小限", "minor", "Minor", "小限 "];

/**
 * 將 FourTransformLine[] 轉成命書用的技術版 block 與摘要。模組二：排除小限層。
 */
export function buildFourTransformBlocksForPalace(lines: FourTransformLine[]): { techBlock: string; summary: string } {
  const filtered = lines.filter((t) => !LAYER_LABEL_EXCLUDE_FOR_M2.some((x) => t.layerLabel === x || (t.layerLabel && t.layerLabel.trim() === x)));
  const techLines: string[] = [];
  for (const t of filtered) {
    const from = t.fromPalaceName ?? t.fromPalaceKey ?? "";
    const to = t.toPalaceName ?? t.toPalaceKey ?? "";
    const fromShort = from ? (from.replace(/宮$/, "") === "命" ? "命宮" : from.replace(/宮$/, "")) : "";
    const toShort = to ? (to.replace(/宮$/, "") === "命" ? "命宮" : to.replace(/宮$/, "")) : "";
    if (fromShort && toShort) {
      techLines.push(`${t.layerLabel}：${t.starName}${t.typeLabel}，自${fromShort}宮出，飛入${toShort}宮`);
    } else {
      techLines.push(`${t.layerLabel}：${t.starName}${t.typeLabel}`);
    }
  }
  const techBlock = techLines.length > 0 ? techLines.map((l) => `- ${l}`).join("\n") : "（本宮無四化飛星資料）";

  const parts: string[] = [];
  for (const t of filtered) {
    parts.push(`${t.layerLabel}：${t.starName}${t.typeLabel}`);
  }
  const summary =
    parts.length > 0
      ? `在這十年／這一年，此宮受到以下幾股力量影響：\n${parts.map((p) => `- ${p}`).join("\n")}\n簡單說：可依祿入的宮位做布局、對忌入的宮位保持覺察。`
      : "（無四化飛星資料）";

  return { techBlock, summary };
}

/** 四化類型對應一句話解釋（供命書正文可讀摘要） */
const SIHUA_EFFECT_SHORT: Record<string, string> = {
  祿: "流動、機會、資源流入",
  權: "壓力／主導權／推進力",
  科: "整理／修復／調整",
  忌: "堵塞／情緒壓力／需要避免升級的衝突",
};

function toPalaceNameForSummary(p: string | undefined): string {
  if (!p || !p.trim()) return "";
  const s = (p || "").trim();
  return s.endsWith("宮") ? s : s === "命宮" || s === "命" ? "命宮" : s + "宮";
}

/** 從本命／大限／流年四化層推導「祿權科忌各落在哪些宮位」 */
function getSihuaPalaceListsFromLayers(chartJson: Record<string, unknown> | undefined): {
  luPalaces: string[];
  quanPalaces: string[];
  kePalaces: string[];
  jiPalaces: string[];
} {
  const lu: string[] = [];
  const quan: string[] = [];
  const ke: string[] = [];
  const ji: string[] = [];
  if (!chartJson) return { luPalaces: lu, quanPalaces: quan, kePalaces: ke, jiPalaces: ji };
  const layers = buildSiHuaLayers(chartJson);
  const push = (p: string | undefined, list: string[]) => {
    const name = toPalaceNameForSummary(p);
    if (name && name !== "落宮待核" && !list.includes(name)) list.push(name);
  };
  for (const layer of [layers.benming, layers.decadal, layers.yearly]) {
    if (!layer) continue;
    if (layer.lu) push(layer.lu.palaceName, lu);
    if (layer.quan) push(layer.quan.palaceName, quan);
    if (layer.ke) push(layer.ke.palaceName, ke);
    if (layer.ji) push(layer.ji.palaceName, ji);
  }
  return { luPalaces: lu, quanPalaces: quan, kePalaces: ke, jiPalaces: ji };
}

/** 分層列出本命／大限／流年各自的祿權科忌落宮，便於排查 */
function getSihuaByLayerLines(chartJson: Record<string, unknown> | undefined): string[] {
  if (!chartJson) return [];
  const layers = buildSiHuaLayers(chartJson);
  const lines: string[] = [];
  const layerOrder: Array<{ label: string; data: SiHuaLayer | null | undefined }> = [
    { label: "本命", data: layers.benming },
    { label: "大限", data: layers.decadal },
    { label: "流年", data: layers.yearly },
  ];
  for (const { label, data } of layerOrder) {
    if (!data) {
      lines.push(`- ${label}：無四化落宮資料`);
      continue;
    }
    const part = (s: SiHuaStar | null | undefined, key: string) => {
      if (!s) return `${key}→（無）`;
      const p = toPalaceNameForSummary(s.palaceName);
      return p && p !== "落宮待核" ? `${key}→${p}` : `${key}→${s.starName}（落宮待核）`;
    };
    const parts = [part(data.lu, "祿"), part(data.quan, "權"), part(data.ke, "科"), part(data.ji, "忌")];
    lines.push(`- ${label}：${parts.join("、")}`);
  }
  return lines;
}

/**
 * 從 chartJson 產出結構化四化落宮（本命／大限／流年），供 Findings.sihuaPlacementItems 與單宮過濾使用。
 * 不得從字串反解析；僅由產出 Findings 的 pipeline 呼叫。
 */
export function getSihuaPlacementItemsFromChart(
  chartJson: Record<string, unknown> | undefined
): SihuaPlacementItem[] {
  if (!chartJson) return [];
  const layers = buildSiHuaLayers(chartJson);
  const items: SihuaPlacementItem[] = [];
  const layerEntries: Array<{ key: keyof SiHuaLayers; layer: "natal" | "decade" | "year" }> = [
    { key: "benming", layer: "natal" },
    { key: "decadal", layer: "decade" },
    { key: "yearly", layer: "year" },
  ];
  for (const { key, layer } of layerEntries) {
    const data = layers[key];
    if (!data) continue;
    const stars: Array<{ t: "祿" | "權" | "科" | "忌"; s: SiHuaStar }> = [
      data.lu && { t: "祿", s: data.lu },
      data.quan && { t: "權", s: data.quan },
      data.ke && { t: "科", s: data.ke },
      data.ji && { t: "忌", s: data.ji },
    ].filter((x): x is { t: "祿" | "權" | "科" | "忌"; s: SiHuaStar } => Boolean(x));
    for (const { t, s } of stars) {
      const raw = String(s.palaceName ?? s.palaceKey ?? "").trim();
      if (!raw || raw.includes("待核") || raw.includes("未知")) continue;
      const targetPalace = toPalaceNameForSummary(s.palaceName ?? s.palaceKey);
      if (!targetPalace || targetPalace.includes("待核") || targetPalace.includes("未知")) continue;
      items.push({ layer, transform: t, starName: s.starName, targetPalace });
    }
  }
  return items;
}

/** 宮位顯示名：補上「宮」後綴（命→命宮、財帛→財帛宮） */
function toPalaceDisplayName(p: string | undefined): string {
  if (!p) return "";
  const s = (p || "").trim().replace(/宮$/, "");
  return s === "命" ? "命宮" : s ? s + "宮" : p;
}

const LAYER_LABEL: Record<"natal" | "decade" | "year", string> = {
  natal: "本命",
  decade: "大限",
  year: "流年",
};

const SIHUA_FLOW_EMPTY_MESSAGE = "（本宮目前無特殊四化能量引動，宜平穩發揮星曜本質。）";
/** 技術版：本命宮干飛化尚未驗證時顯示。 */
const FLOWS_NOT_VERIFIED_MESSAGE = "（本命宮干飛化尚未驗證，請先完成命盤計算。）";

/**
 * 單宮四化摘要（Phase 3B-1）：只讀 LifebookFindings，依 currentPalace 做 contextual filtering。
 * 禁止：normalizeChart、chartJson、現場重算四化／飛化。
 * 單宮區塊不得輸出全盤式四化清單（祿落在：官祿宮、兄弟宮…）；僅輸出與本宮直接相關的 transforms／natal flows。
 */
export function buildSihuaFlowSummary(args: {
  currentPalace: string;
  findings: LifebookFindings;
}): string {
  const { currentPalace, findings } = args;
  const palaceCanon = toPalaceDisplayName((currentPalace ?? "").trim()) || (currentPalace ?? "").trim();
  if (!palaceCanon) return SIHUA_FLOW_EMPTY_MESSAGE;

  const placementItems = findings.sihuaPlacementItems ?? [];
  const flowItems = findings.natalFlowItems ?? [];

  const relevantTransforms = placementItems.filter(
    (item) => toPalaceDisplayName(item.targetPalace) === palaceCanon || item.targetPalace === palaceCanon
  );
  const relevantFlows = flowItems.filter(
    (e) =>
      toPalaceDisplayName(e.fromPalace) === palaceCanon ||
      toPalaceDisplayName(e.toPalace) === palaceCanon ||
      e.fromPalace === palaceCanon ||
      e.toPalace === palaceCanon
  );

  if (relevantTransforms.length === 0 && relevantFlows.length === 0) {
    return SIHUA_FLOW_EMPTY_MESSAGE;
  }

  const lines: string[] = [];

  if (relevantTransforms.length > 0) {
    for (const item of relevantTransforms) {
      const layerLabel = LAYER_LABEL[item.layer];
      lines.push(`本宮受到${layerLabel}的${item.starName}化${item.transform}引動。`);
    }
  }

  if (relevantFlows.length > 0) {
    for (const e of relevantFlows) {
      const fromCanon = toPalaceDisplayName(e.fromPalace) || e.fromPalace;
      const toCanon = toPalaceDisplayName(e.toPalace) || e.toPalace;
      const star = e.starName ?? "星";
      if (fromCanon === palaceCanon && toCanon !== palaceCanon) {
        lines.push(`本宮宮干化出${star}化${e.transform}，飛入並牽動了【${toCanon}】。`);
      } else if (fromCanon !== palaceCanon && toCanon === palaceCanon) {
        lines.push(`來自【${fromCanon}】的${star}化${e.transform}飛入本宮，帶來直接影響。`);
      }
    }
  }

  const out = lines.length > 0 ? lines.join("\n") : SIHUA_FLOW_EMPTY_MESSAGE;

  // Phase 5B-8：natalFlowItems 命中驗證（子女宮、夫妻宮、父母宮、命宮）
  const DEBUG_PALACES = new Set(["子女宮", "夫妻宮", "父母宮", "命宮"]);
  if (typeof console !== "undefined" && console.log && DEBUG_PALACES.has(palaceCanon)) {
    const hasFlowData = flowItems.length > 0;
    const hasMatch = relevantFlows.length > 0 || relevantTransforms.length > 0;
    const hasOutput = lines.length > 0;
    let reasonEmpty: string;
    if (hasOutput) reasonEmpty = "—";
    else if (!hasFlowData && placementItems.length === 0) reasonEmpty = "Findings 寫入：natalFlowItems 與 sihuaPlacementItems 皆無資料";
    else if (hasFlowData && relevantFlows.length === 0 && relevantTransforms.length === 0) reasonEmpty = "宮名比對：有資料但無命中本宮（檢查 fromPalace/toPalace 與 palaceCanon 格式）";
    else reasonEmpty = "邏輯：有命中但未產出句子（請查 builder 條件）";

    console.log("[buildSihuaFlowSummary Phase5B-8]", {
      currentPalace,
      palaceCanon,
      "findings.natalFlowItems.length": flowItems.length,
      matchedNatalFlows: relevantFlows.length,
      matchedPlacements: relevantTransforms.length,
      finalBuiltLines: lines,
      outputIsEmpty: out === SIHUA_FLOW_EMPTY_MESSAGE,
      reasonEmpty,
      sampleFlows: flowItems.length ? flowItems.slice(0, 5).map((e) => ({ from: e.fromPalace, to: e.toPalace, star: e.starName, transform: e.transform })) : [],
    });
  }

  return out;
}

/** 12 宮三行敘事開場（寫死，不用通用模板）。key 為宮名（命宮、財帛宮、僕役宮…），比對時支援無「宮」尾。 */
const PALACE_CONTEXT_THREE_LINES: Record<string, string> = {
  命宮:
    "命宮掌管的是自我定位與人生方向，很多人生選擇表面上像是在回應外界，其實都與你怎麼理解自己有關。",
  財帛宮:
    "財帛宮掌管的是資源、收入與價值交換，很多表面上的事件像是在處理金錢與資源運作，其實都與你如何建立安全感與交換價值有關。",
  兄弟宮:
    "兄弟宮掌管的是同儕、手足與合作關係，很多表面上的事件像是在處理人際互動與合作競爭，其實都與你如何建立信任與界線有關。",
  夫妻宮:
    "夫妻宮掌管的是親密關係與長期伴侶，很多表面上的事件像是在處理感情與關係互動，其實都與你如何理解親密與承諾有關。",
  子女宮:
    "子女宮掌管的是創造力、投入與延續，很多表面上的事件像是在處理孩子、作品或興趣，其實都與你如何表達熱情與生命力有關。",
  疾厄宮:
    "疾厄宮掌管的是身心狀態與壓力承受，很多表面上的事件像是在處理健康與疲憊，其實都與你如何面對壓力與恢復能量有關。",
  遷移宮:
    "遷移宮掌管的是外在世界與行動範圍，很多表面上的事件像是在處理環境變動與機會，其實都與你如何面對未知與改變有關。",
  僕役宮:
    "奴僕宮掌管的是夥伴、同事與合作關係，很多表面上的事件像是在處理團隊與人際互動，其實都與你如何分配責任與建立合作有關。",
  官祿宮:
    "官祿宮掌管的是事業方向與社會角色，很多表面上的事件像是在處理工作與目標，其實都與你如何實現價值與承擔責任有關。",
  田宅宮:
    "田宅宮掌管的是家庭、根基與生活空間，很多表面上的事件像是在處理房子與家庭關係，其實都與你如何建立歸屬感與安全感有關。",
  福德宮:
    "福德宮掌管的是內在狀態與精神能量，很多表面上的事件像是在處理情緒與心情，其實都與你如何讓自己安定下來有關。",
  父母宮:
    "父母宮掌管的是權威、支持來源與價值框架，很多表面上的事件像是在處理長輩與制度，其實都與你如何理解責任與權威有關。",
};

/**
 * 【這一宮正在發生什麼】三行敘事型開場。依宮名回傳寫死文案，不再使用通用模板或 facade。
 */
export function buildPalaceContextThreeLines(
  palaceName: string,
  _content?: NarrativeContentLookup
): string {
  const raw = (palaceName ?? "").trim();
  if (!raw) return "";
  const canon = raw.replace(/宮$/, "") === "命" ? "命宮" : raw.endsWith("宮") ? raw : raw + "宮";
  return PALACE_CONTEXT_THREE_LINES[canon] ?? `${canon}反映你在這個領域的慣性與表現。`;
}

/** 12 宮【三方四正】區塊：本宮與三方四正宮位名 + 一句說明。不讀 chart，僅用宮名。 */
export function buildSanFangAnalysis(currentPalace: string): string {
  const raw = (currentPalace ?? "").trim();
  if (!raw) return "（此宮無法取得三方四正資訊。）";
  const canon = raw.replace(/宮$/, "") === "命" ? "命宮" : raw.endsWith("宮") ? raw : raw + "宮";
  const allFour = getSanfangSizheng(canon);
  if (!allFour) return "（此宮無法取得三方四正資訊。）";
  const parts = allFour.split("、").filter(Boolean);
  const others = parts.filter((p) => p !== canon);
  if (others.length === 0) return "（此宮無法取得三方四正資訊。）";
  const line1 = `${canon}與${others.join("、")}形成三方四正。`;
  const line2 = "這代表此宮與這些宮位的主題會相互牽動，可一併觀察。";
  return `${line1}\n\n${line2}`;
}

/** 12 宮【星曜組合】區塊：從 findings.starCombinations 篩選本宮，產出「X與Y同宮，代表…」。 */
export function buildStarCombinationAnalysis(
  palaceName: string,
  findings: LifebookFindings | undefined
): string {
  const norm = normPalaceForMatch(palaceName);
  if (!norm) return "（本宮目前無已定義的星曜組合。）";
  const combos = findings?.starCombinations ?? [];
  const forPalace = combos.filter((c) => normPalaceForMatch(c.palace) === norm);
  if (forPalace.length === 0) return "（本宮目前無已定義的星曜組合。）";
  const lines = forPalace.map((c) => {
    const stars = c.stars ?? [];
    const pair = stars.length >= 2 ? `${stars[0]}與${stars[1]}` : stars.join("與");
    const question = (c.rectificationQuestion ?? "").trim();
    const psych = (c.psychology ?? "").trim();
    const life = (c.lifePattern ?? "").trim();
    const hint = (c.narrativeHint ?? "").trim();
    if (!pair) return "";
    const parts: string[] = [];
    if (question) parts.push(question);
    let sentence = `${pair}同宮，代表${psych || "此組合在此宮有特殊意涵"}。`;
    if (life) sentence += ` ${life}`;
    if (hint) sentence += ` ${hint}`;
    parts.push(sentence.replace(/。\s*。/g, "。").trim());
    return parts.join("\n\n");
  });
  return lines.filter(Boolean).join("\n\n");
}

/**
 * 命宮試點專用：【動態引動與根因】只顯示「四化落宮」。
 * 僅使用 findings.sihuaPlacementItems，過濾 targetPalace === "命宮"；不包含宮干飛化、三方四正、全盤清單。
 */
export function buildMingGongSihuaPlacementOnly(findings: LifebookFindings): string {
  const placementItems = findings.sihuaPlacementItems ?? [];
  const mingGongCanon = "命宮";
  const relevant = placementItems.filter(
    (item) => toPalaceDisplayName(item.targetPalace) === mingGongCanon || item.targetPalace === mingGongCanon
  );
  if (relevant.length === 0) return SIHUA_FLOW_EMPTY_MESSAGE;
  const lines = relevant.map(
    (item) => `本宮受到${LAYER_LABEL[item.layer]}的${item.starName}化${item.transform}引動。`
  );
  return lines.join("\n");
}

const SIHUA_PLACEMENT_EMPTY_MESSAGE = "（此宮目前沒有明顯的四化落宮引動。）";
const SIHUA_FLOW_BLOCK_EMPTY_MESSAGE = "（此宮目前無特殊的宮干飛化牽動。）";

/**
 * Phase 5B-9：【四化引動】區塊。只負責四化落宮，從 findings.sihuaPlacementItems 過濾落宮為本宮的項目。
 * 比對使用去宮字正規化；輸出「本宮受到[層級]的[星曜]化[四化]引動。」，無則回傳固定 fallback。
 */
export function buildSihuaPlacementBlock(
  currentPalace: string,
  findings: LifebookFindings
): string {
  const isDebugPalace = currentPalace === "兄弟宮" || currentPalace === "夫妻宮" || currentPalace === "兄弟" || currentPalace === "夫妻";
  if (isDebugPalace && typeof console !== "undefined" && console.log) {
    console.log(`[結構檢查 - ${currentPalace}] placement length:`, findings?.sihuaPlacementItems?.length ?? 0);
    console.log(`[結構檢查 - ${currentPalace}] flow length:`, findings?.natalFlowItems?.length ?? 0);
    console.log(`[結構檢查 - ${currentPalace}] Placement 第1筆:`, JSON.stringify(findings?.sihuaPlacementItems?.[0] ?? null));
    console.log(`[結構檢查 - ${currentPalace}] Flow 第1筆:`, JSON.stringify(findings?.natalFlowItems?.[0] ?? null));
    console.log(`[結構檢查 - ${currentPalace}] Placement keys:`, Object.keys(findings?.sihuaPlacementItems?.[0] ?? {}));
    console.log(`[結構檢查 - ${currentPalace}] Flow keys:`, Object.keys(findings?.natalFlowItems?.[0] ?? {}));
  }
  const norm = normPalaceForMatch(currentPalace);
  if (!norm) return SIHUA_PLACEMENT_EMPTY_MESSAGE;
  const items = findings.sihuaPlacementItems ?? [];
  const relevant = items.filter(
    (item) => normPalaceForMatch(item.targetPalace) === norm
  );
  if (relevant.length === 0) return SIHUA_PLACEMENT_EMPTY_MESSAGE;
  const lines = relevant.map(
    (item) => `本宮受到${LAYER_LABEL[item.layer]}的${item.starName}化${item.transform}引動。`
  );
  return lines.join("\n");
}

/**
 * Phase 5B-9：【宮干飛化】區塊。只負責本命宮干飛化，從 findings.natalFlowItems 過濾飛入／飛出本宮。
 * 最多顯示 4 條，優先飛入再飛出；比對使用去宮字正規化。
 */
export function buildSihuaFlowBlock(
  currentPalace: string,
  findings: LifebookFindings
): string {
  const isDebugPalace = currentPalace === "兄弟宮" || currentPalace === "夫妻宮" || currentPalace === "兄弟" || currentPalace === "夫妻";
  if (isDebugPalace && typeof console !== "undefined" && console.log) {
    console.log(`[結構檢查 - ${currentPalace}] placement length:`, findings?.sihuaPlacementItems?.length ?? 0);
    console.log(`[結構檢查 - ${currentPalace}] flow length:`, findings?.natalFlowItems?.length ?? 0);
    console.log(`[結構檢查 - ${currentPalace}] Placement 第1筆:`, JSON.stringify(findings?.sihuaPlacementItems?.[0] ?? null));
    console.log(`[結構檢查 - ${currentPalace}] Flow 第1筆:`, JSON.stringify(findings?.natalFlowItems?.[0] ?? null));
    console.log(`[結構檢查 - ${currentPalace}] Placement keys:`, Object.keys(findings?.sihuaPlacementItems?.[0] ?? {}));
    console.log(`[結構檢查 - ${currentPalace}] Flow keys:`, Object.keys(findings?.natalFlowItems?.[0] ?? {}));
  }
  const norm = normPalaceForMatch(currentPalace);
  if (!norm) return SIHUA_FLOW_BLOCK_EMPTY_MESSAGE;
  const flowItems = findings.natalFlowItems ?? [];
  const matchedInFlows = flowItems.filter((e) => normPalaceForMatch(e.toPalace) === norm);
  const matchedOutFlows = flowItems.filter((e) => normPalaceForMatch(e.fromPalace) === norm);
  const lines: string[] = [];
  const maxTotal = 4;
  for (const e of matchedInFlows) {
    if (lines.length >= maxTotal) break;
    const fromDisplay = toPalaceDisplayName(e.fromPalace) || e.fromPalace;
    const star = e.starName ?? "星";
    lines.push(`來自【${fromDisplay}】的${star}化${e.transform}飛入本宮。`);
  }
  for (const e of matchedOutFlows) {
    if (lines.length >= maxTotal) break;
    const toDisplay = toPalaceDisplayName(e.toPalace) || e.toPalace;
    const star = e.starName ?? "星";
    lines.push(`本宮宮干化出${star}化${e.transform}，飛入【${toDisplay}】。`);
  }
  const finalReturnValue = lines.length > 0 ? lines.join("\n") : SIHUA_FLOW_BLOCK_EMPTY_MESSAGE;
  if (isDebugPalace && typeof console !== "undefined" && console.log) {
    console.log(`[FlowBlock Debug - ${currentPalace}] natalFlowItems.length:`, findings?.natalFlowItems?.length ?? 0);
    console.log(`[FlowBlock Debug - ${currentPalace}] matchedInFlows:`, JSON.stringify(matchedInFlows, null, 2));
    console.log(`[FlowBlock Debug - ${currentPalace}] matchedOutFlows:`, JSON.stringify(matchedOutFlows, null, 2));
    console.log(`[FlowBlock Debug - ${currentPalace}] builtLines:`, JSON.stringify(lines, null, 2));
    console.log(`[FlowBlock Debug - ${currentPalace}] finalReturn:`, finalReturnValue);
  }
  return finalReturnValue;
}

/** 技術版命書：四化來源說明（固定文案，不依 chartJson） */
export const SIHUA_TECH_NOTE =
  [
    "【技術備註：四化來源】",
    "",
    "本命四化：依命主生年天干排定各星曜之祿／權／科／忌。",
    "大限四化：依該十年大限之天干，對應大限命盤星曜排四化。",
    "流年四化：依當年天干（例如丙年），疊加在本命與大限結構上。",
    "",
    "命書正文只呈現「飛到哪裡、引動哪個宮位與主題」，演算法細節保留在專家系統與內部設定中。",
  ].join("\n");

/** 把 transformations 轉成「祿從哪宮出，入哪宮」的自然語句，多行字串。同宮同類型可合併；無 toPalace 則跳過。 */
export function getFlowTransformationsText(transformations: FlowTransformationEntry[]): string {
  if (!Array.isArray(transformations) || transformations.length === 0) return "";
  const valid = transformations.filter(
    (t) => t && (t.fromPalaceName || t.fromPalaceKey) && (t.toPalaceName || t.toPalaceKey)
  );
  if (valid.length === 0) return "";
  const ensureGong = (s: string | undefined) => {
    if (!s) return "";
    const t = (s || "").trim().replace(/宮$/, "");
    return t === "命" ? "命宮" : t ? t + "宮" : "";
  };
  const lines: string[] = [];
  const key = (t: FlowTransformationEntry) =>
    `${t.layerLabel}|${t.typeLabel}|${ensureGong(t.fromPalaceName || t.fromPalaceKey)}|${ensureGong(t.toPalaceName || t.toPalaceKey)}`;
  const byKey = new Map<string, string[]>();
  for (const t of valid) {
    const k = key(t);
    if (!byKey.has(k)) byKey.set(k, []);
    byKey.get(k)!.push(t.starName || "");
  }
  byKey.forEach((starNames, k) => {
    const [layerLabel, typeLabel, fromDisplay, toDisplay] = k.split("|");
    if (!toDisplay) return;
    const stars = starNames.filter(Boolean).join("、");
    if (!stars) return;
    const fromShort = (fromDisplay || "").replace(/宮$/, "") || fromDisplay;
    const toShort = (toDisplay || "").replace(/宮$/, "") || toDisplay;
    lines.push(`${layerLabel}${stars}${typeLabel}：從${fromShort}宮出，入${toShort}宮`);
  });
  return lines.join("\n");
}

/** 疊宮一筆：新格式（前端可產出）或由 Worker 從舊格式轉出；可含 s15a 專用擴充 */
interface OverlapItemForBlock {
  palaceName: string;
  tag: "shock" | "mine" | "wealth" | "normal";
  tagLabel: string;
  jiCount: number;
  luCount: number;
  transformations: FlowTransformationEntry[];
  year?: number | null;
  age?: number | null;
  natalStarsSummarySnippet?: string;
  feelingSnippet?: string;
  adviceSnippet?: string;
}

/** 依 tag 回傳泛用「感受」與「建議」句（Domain 未提供時使用） */
const TAG_FEELING_ADVICE: Record<"shock" | "mine" | "wealth", { feeling: string; advice: string }> = {
  shock: {
    feeling: "此年該宮位吉凶並見，心理上容易既期待又焦慮，決策時易受情緒波動影響。",
    advice: "建議以防守為主，重大決策分散時間點，避免單一押注；可善用祿的資源但不放大忌的壓力。",
  },
  mine: {
    feeling: "此年該宮位結構性壓力疊加，容易感到卡關、被迫或系統性錯誤訊號放大。",
    advice: "建議絕對避開重大賭注與擴張；該年以保守、修復、釐清界線為主，勿硬扛。",
  },
  wealth: {
    feeling: "此年該宮位祿權科集中，有高度放大既有實力的空間，心理上較易感到資源與機會。",
    advice: "建議積極把握、適度布局；可將既有優勢在此年放大，但仍需風控與分散。",
  },
};

/** 單一疊宮項：產出【宮名】+ 四化詳細文字（祿從何來、忌往哪裡）+ 化忌/化祿重數；若有 year/age/natal/feeling/advice 則加時間診斷三小段。
 * Phase 5B-2：有 findings 時本命宮干飛化只讀 findings.natalFlowItems；無 findings 時才用 chart。 */
function formatOverlapBlockItem(
  item: OverlapItemForBlock,
  chart?: NormalizedChart | null,
  findings?: LifebookFindings | null
): string {
  const flowText =
    findings != null
      ? (buildNatalFlowBlockFromFindings(findings, item.palaceName) || getFlowTransformationsText(item.transformations))
      : (chart ? getFlowBlockForPalace(chart, item.palaceName) : "") || getFlowTransformationsText(item.transformations);
  const fourDesc = flowText ? flowText : "（本宮無四化疊加）";
  const countLine = `化忌：${item.jiCount} 重 | 化祿：${item.luCount} 重`;
  const block = ["【" + item.palaceName + "】", fourDesc, countLine].join("\n");

  const hasFull = item.year != null || item.age != null || item.natalStarsSummarySnippet || item.feelingSnippet || item.adviceSnippet;
  if (hasFull) {
    const head =
      item.year != null || item.age != null
        ? `${item.palaceName}（${item.year ?? "—"} 年，${item.age != null ? `${item.age} 歲` : "—"}）`
        : item.palaceName;
    const natal = item.natalStarsSummarySnippet ?? "（此宮本命星曜見上方各宮章節）";
    const feeling = item.feelingSnippet ?? (item.tag !== "normal" ? TAG_FEELING_ADVICE[item.tag].feeling : "");
    const advice = item.adviceSnippet ?? (item.tag !== "normal" ? TAG_FEELING_ADVICE[item.tag].advice : "");
    return [
      head,
      "",
      "【結構】",
      `本命：${natal}`,
      "【四化流向】",
      fourDesc,
      `四化統計：化忌 ${item.jiCount} 重／化祿 ${item.luCount} 重`,
      "",
      "【怎麼感受】",
      feeling,
      "",
      "【建議操作】",
      advice,
    ]
      .filter(Boolean)
      .join("\n");
  }

  return block;
}

/** 宮位名 → 對應 section_key（用於依宮位取本命星曜摘要） */
function getSectionKeyForPalace(palaceName: string): string | undefined {
  if (!palaceName) return undefined;
  const key = palaceName.replace(/宮$/, "") === "命" ? "命宮" : palaceName;
  const t = SECTION_TEMPLATES.find((t) => {
    const focus = t.palace_focus?.[0];
    if (!focus) return false;
    return focus === key || focus === palaceName || (focus !== "命宮" && focus + "宮" === palaceName) || (key === "命宮" && focus === "命宮");
  });
  return t?.section_key;
}

export interface BuildOverlapDetailBlocksOpts {
  chartJson?: Record<string, unknown>;
  content?: AssembleContentLookup;
  config?: LifeBookConfig | null;
  contentLocale?: "zh-TW" | "zh-CN" | "en";
  minorFortuneByPalace?: Array<{ palace?: string; year?: number | null; nominalAge?: number | null; stem?: string | null }>;
  /** Phase 5B-2：有則本命宮干飛化只讀 findings.natalFlowItems，不讀 chart。 */
  findings?: LifebookFindings | null;
}

/** 從 overlay 產出三組疊宮區塊。疊宮清理：暫不讀舊 overlap 預算 transformations，恆回傳空；待 buildPalaceOverlay 接上後改為讀新資料。 */
function buildOverlapDetailBlocks(
  _overlap: Record<string, unknown> | undefined,
  _opts?: BuildOverlapDetailBlocksOpts
): {
  shockBlocks: string;
  mineBlocks: string;
  wealthBlocks: string;
} {
  return { shockBlocks: "", mineBlocks: "", wealthBlocks: "" };
}

export const MODEL_CONFIG = {
  default: "gpt-4.1",
  options: [
    "gpt-4.1",
    "gpt-4.1-turbo",
    "gpt-5.0",
    "gpt-5.1",
    "gpt-5.2",
    "gpt-4o-mini",
    "gpt-4o",
    "gpt-4-turbo",
    "gpt-4.1-mini",
    "gpt-5",
    "gpt-5-mini",
    "o1-mini",
    "o1",
    "o1-preview",
  ] as const,
};

/** 簡化版 system prompt（穩定、短、GPT-4.1 友善） */
export const NEW_SYSTEM_PROMPT = `你是諮商者（Soul Advisor）。
任務是把命盤資料轉換成生活語言、具體行動建議。
原則：
- 敘事在前，命理依據集中到最後一段。
- 幫使用者理解與提供建議做法。
- 分析請參考：星曜、十神（關係模式）、五行（能量順逆）。
- 維持四欄位輸出：①導入 ②行為模式 ③盲點 ④建議。

所有回覆皆以 JSON 輸出：
{
  "section_key": "",
  "title": "",
  "importance_level": "",
  "structure_analysis": "",
  "behavior_pattern": "",
  "blind_spots": "",
  "strategic_advice": ""
}`;

/** 相容舊 config 的完整 system（可從 KV 覆寫） */
export const EXPERT_PERSONA = NEW_SYSTEM_PROMPT;
export const GENERAL_RULES = "";

export interface LifeBookConfig {
  persona?: string;
  rules?: string;
  templates?: SectionTemplate[];
  shishen?: Record<string, string>;
  wuxing?: Record<string, string>;
  model?: string;
  starPalaces?: Record<string, string>;
  /** 輔星／煞星／雜曜 行動建議（key = 星名_宮名），供戰略建議欄位使用 */
  starPalacesAuxAction?: Record<string, string>;
  /** 輔星／煞星／雜曜 風險等級 1～5（高風險時採保守防禦語氣） */
  starPalacesAuxRisk?: Record<string, number>;
  masterStars?: { 命主?: { name: string; text: string }; 身主?: { name: string; text: string } };
  /** 身宮依生時解讀（s04 用） */
  bodyPalaceInfo?: { palace: string; tagline: string; interpretation: string };
  /** 命身同宮／錯位／內外對話 片段（s04 用） */
  lifeBodyRelationSnippet?: string[];
  minorFortuneSummary?: string;
  minorFortuneTriggers?: string;
  tenGodByPalace?: Record<string, string>;
  wuxingByPalace?: Record<string, string>;
  /** Behavior Axis v1：命宮地支語氣微偏移（H3/H4；分開驗收） */
  behaviorAxisV1?: boolean;
  /** 星曜 × 地支軸衝突一句（分開驗收） */
  behaviorAxisConflictV1?: boolean;
  /** H3×H4 循環一句（最易變重；建議最後開） */
  behaviorAxisLoopV1?: boolean;
  /** 若 true，12 宮皆套用；若 false/undefined，僅命／福／財／夫（窄開啟） */
  behaviorAxisWideOpen?: boolean;
}

export function getSystemPrompt(config?: LifeBookConfig | null): string {
  const persona = config?.persona?.trim() || NEW_SYSTEM_PROMPT;
  const rules = config?.rules?.trim() || "";
  return rules ? `${persona}\n\n${rules}` : persona;
}

export function getChartSlice(
  chartJson: Record<string, unknown>,
  sliceTypes: SliceType[]
): Record<string, unknown> {
  const slice: Record<string, unknown> = {};
  if (sliceTypes.includes("ziwei")) slice.ziwei = chartJson?.ziwei;
  if (sliceTypes.includes("bazi")) slice.bazi = chartJson?.bazi;
  if (sliceTypes.includes("overlap")) slice.overlapAnalysis = chartJson?.overlapAnalysis ?? chartJson?.overlap;
  if (sliceTypes.includes("sihua") || sliceTypes.includes("fourTransform")) slice.fourTransformations = chartJson?.fourTransformations;
  if (sliceTypes.includes("wuxing")) slice.fiveElements = chartJson?.fiveElements ?? chartJson?.wuxingData;
  return slice;
}

/** 缺資料時統一顯示，不做推論式兜底或自動補敘述 */
const MISSING_PLACEHOLDER = "（此欄位資料不足）";

/** s00 專用：缺四化／流年資料時顯示，避免「此欄位資料不足」 */
const S00_MISSING = "[此處資料缺失，可略過]";

/** 將骨架中的 {placeholder} 替換為實際資料庫內容；未解析到的改為指定字串（技術版用「此欄位資料不足」，送 GPT 用「此處資料缺失，可略過」） */
export function resolveSkeletonPlaceholders(
  text: string,
  map: Record<string, string>,
  options?: { missingReplacement?: string }
): string {
  if (!text || typeof text !== "string") return text;
  const MISSING = options?.missingReplacement ?? MISSING_PLACEHOLDER;
  return text.replace(/\{([^}]+)\}/g, (_, key) => {
    const k = key.trim();
    if (map[k] !== undefined && map[k] !== "") return map[k];
    return MISSING;
  });
}

/** 十神代碼 → 簡短行為說明（供 tenGodBehavior placeholder；缺則用 tenGodPalaceRole） */
const TEN_GOD_BEHAVIOR: Record<string, string> = {
  zhengCai: "以紀律、穩定累積資源",
  pianCai: "透過機會與靈活操作獲取資源",
  biJian: "透過與同儕並肩、合作獲得動能",
  jieCai: "在資源與競爭之間取得平衡",
  shiShen: "以創造與表達轉化感受",
  shangGuan: "以突破與才華爭取認可",
  zhengGuan: "以秩序與責任爭取認可",
  qiSha: "以挑戰與承擔壓力推進",
  zhengYin: "以保護與承擔給予支持",
  pianYin: "以直覺與洞察理解世界",
};

type DecadalLimitRow = { palace?: string; startAge?: number; endAge?: number; stem?: string; mutagenStars?: Record<string, string> };

/**
 * 依「當前年齡」從 decadalLimits 找出包含該年齡的那一步大限（當前大限），不是第一步。
 * 若無年齡或找不到區間，才 fallback 到 decadalLimits[0]。
 */
function getCurrentDecadalLimit(
  decadalLimits: DecadalLimitRow[] | undefined,
  currentAge: number | undefined
): DecadalLimitRow | null {
  if (!Array.isArray(decadalLimits) || decadalLimits.length === 0) return null;
  if (currentAge != null && !Number.isNaN(currentAge)) {
    const limit = decadalLimits.find(
      (lim) =>
        lim.startAge != null &&
        lim.endAge != null &&
        currentAge >= lim.startAge &&
        currentAge <= lim.endAge
    );
    if (limit) return limit;
  }
  return decadalLimits[0];
}

/** 從 chartJson 取當前大限／流年宮位名，供 decadal* / year* placeholder 用 */
function getDecadalAndYearPalaceKeys(chartJson: Record<string, unknown> | undefined): { decadalPalaceKey?: string; yearPalaceKey?: string } {
  const out: { decadalPalaceKey?: string; yearPalaceKey?: string } = {};
  const decadalLimits = chartJson?.decadalLimits as Array<{ palace?: string; palaceNames?: string[] }> | undefined;
  if (Array.isArray(decadalLimits) && decadalLimits.length > 0) {
    const first = decadalLimits[0];
    out.decadalPalaceKey = first?.palace ?? first?.palaceNames?.[0] ?? undefined;
  }
  const yearly = chartJson?.yearlyHoroscope as { palaceNames?: string[] } | undefined;
  if (yearly && typeof yearly === "object") {
    out.yearPalaceKey = (yearly as { palaceNames?: string[] }).palaceNames?.[0] ?? undefined;
  }
  return out;
}

/** 大限對沖宮位（用於判斷轉折年） */
const DECADAL_OPPOSITE: Record<string, string> = {
  命宮: "遷移宮", 遷移宮: "命宮", 兄弟宮: "僕役宮", 僕役宮: "兄弟宮",
  夫妻宮: "官祿宮", 官祿宮: "夫妻宮", 子女宮: "田宅宮", 田宅宮: "子女宮",
  財帛宮: "福德宮", 福德宮: "財帛宮", 疾厄宮: "父母宮", 父母宮: "疾厄宮",
};

const NATAL_SIHUA_KEYS = ["祿", "權", "科", "忌"] as const;
const NATAL_SIHUA_LABELS: Record<string, string> = { 祿: "化祿", 權: "化權", 科: "化科", 忌: "化忌" };

type MutagenStars = Record<string, string>;

// ============ 四化層級結構（祿／權／科／忌全套，供 s00／s03 使用） ============

/** 單一化星：星名＋落宮（從哪顆星 → 飛到／落在哪一宮） */
export type SiHuaStar = {
  starName: string;
  palaceKey: string;
  palaceName: string;
  transformType: "lu" | "quan" | "ke" | "ji";
};

/** 一層四化：祿／權／科／忌 各一顆（可為 null） */
export type SiHuaLayer = {
  lu?: SiHuaStar | null;
  quan?: SiHuaStar | null;
  ke?: SiHuaStar | null;
  ji?: SiHuaStar | null;
};

/** 本命／大限／流年 四化層級 */
export type SiHuaLayers = {
  benming?: SiHuaLayer;
  decadal?: SiHuaLayer;
  yearly?: SiHuaLayer;
};

const SIHUA_PLACEHOLDER_MISSING = "[此處資料缺失，可略過]";

/** 把某一層四化變成一行句子（天梁化祿、紫微化權、…） */
export function formatSiHuaLine(layer?: SiHuaLayer | null): string {
  if (!layer) return SIHUA_PLACEHOLDER_MISSING;
  const parts: string[] = [];
  if (layer.lu) parts.push(`${layer.lu.starName}化祿`);
  if (layer.quan) parts.push(`${layer.quan.starName}化權`);
  if (layer.ke) parts.push(`${layer.ke.starName}化科`);
  if (layer.ji) parts.push(`${layer.ji.starName}化忌`);
  return parts.length > 0 ? parts.join("、") : SIHUA_PLACEHOLDER_MISSING;
}

/** 由 mutagenStars（祿/權/科/忌→星名）＋ starByPalace 推導每顆化星的落宮（星所在宮位） */
function layerFromMutagen(
  mutagen: MutagenStars | undefined,
  starByPalace: Partial<Record<string, string[]>> | undefined,
  starIdToName: Record<string, string>,
  palaceIdToName: Record<string, string>
): SiHuaLayer | null {
  if (!mutagen || typeof mutagen !== "object") return null;
  const starToPalace: Record<string, string> = {};
  if (starByPalace && typeof starByPalace === "object") {
    for (const [pid, ids] of Object.entries(starByPalace)) {
      if (!Array.isArray(ids)) continue;
      for (const id of ids) {
        starToPalace[id] = pid;
      }
    }
  }
  const FALLBACK_PALACE = "落宮待核";
  const toStar = (key: "祿" | "權" | "科" | "忌", type: "lu" | "quan" | "ke" | "ji"): SiHuaStar | null => {
    const starName = mutagen[key];
    if (!starName || typeof starName !== "string") return null;
    const starId = (STAR_NAME_ZH_TO_ID as Record<string, string>)[starName];
    const pid = starId ? starToPalace[starId] : undefined;
    const raw = pid ? (palaceIdToName[pid] ?? pid) : "";
    if (raw?.trim()) {
      const palaceKey = raw.replace(/宮$/, "") === "命" ? "命宮" : raw.endsWith("宮") ? raw : raw + "宮";
      const palaceName = palaceKey.endsWith("宮") ? palaceKey : palaceKey + "宮";
      return { starName, palaceKey, palaceName, transformType: type };
    }
    return { starName, palaceKey: FALLBACK_PALACE, palaceName: FALLBACK_PALACE, transformType: type };
  };
  const lu = toStar("祿", "lu");
  const quan = toStar("權", "quan");
  const ke = toStar("科", "ke");
  const ji = toStar("忌", "ji");
  if (!lu && !quan && !ke && !ji) return null;
  return { lu: lu ?? null, quan: quan ?? null, ke: ke ?? null, ji: ji ?? null };
}

/** 從 chartJson 既有四化資料整理成本命／大限／流年／小限的 SiHuaLayers，供 s00／s03 共用 */
export function buildSiHuaLayers(chartJson: Record<string, unknown> | undefined): SiHuaLayers {
  const out: SiHuaLayers = {};
  if (!chartJson) return out;

  const layers = chartJson.sihuaLayers as SihuaLayers | undefined;
  const ft = chartJson.fourTransformations as {
    benming?: { mutagenStars?: MutagenStars };
    dalimit?: { mutagenStars?: MutagenStars };
    decadal?: { mutagenStars?: MutagenStars };
    liunian?: { mutagenStars?: MutagenStars };
    yearly?: { mutagenStars?: MutagenStars };
  } | undefined;
  const decadalLimits = chartJson.decadalLimits as Array<{ mutagenStars?: MutagenStars }> | undefined;
  const yearlyHoroscope = chartJson.yearlyHoroscope as { year?: number; mutagenStars?: MutagenStars } | undefined;
  const liunian = chartJson.liunian as { mutagenStars?: MutagenStars } | undefined;

  const starIdToName = STAR_ID_TO_DISPLAY_NAME as Record<string, string>;
  const palaceIdToName = PALACE_ID_TO_NAME as Record<string, string>;
  const assembleInput = buildAssembleInput(chartJson, undefined, "zh-TW");
  const starByPalace = assembleInput.starByPalace as Partial<Record<string, string[]>> | undefined;

  const toPalaceName = (id: string) => {
    const n = normPalaceIdToName(id);
    return n.endsWith("宮") ? n : n + "宮";
  };
  const toPalaceKey = (id: string) => normPalaceIdToName(id);

  if (layers?.benMing?.transforms?.length) {
    const t = layers.benMing.transforms;
    const byType: SiHuaLayer = { lu: null, quan: null, ke: null, ji: null };
    for (const x of t) {
      const starName = starIdToName[x.starId] ?? x.starId;
      const palaceKey = toPalaceKey(x.toPalace);
      const palaceName = toPalaceName(x.toPalace);
      const s: SiHuaStar = { starName, palaceKey, palaceName, transformType: x.type };
      if (x.type === "lu") byType.lu = s;
      else if (x.type === "quan") byType.quan = s;
      else if (x.type === "ke") byType.ke = s;
      else if (x.type === "ji") byType.ji = s;
    }
    out.benming = byType;
  } else {
    const benmingLayer = layerFromMutagen(ft?.benming?.mutagenStars, starByPalace, starIdToName, palaceIdToName);
    out.benming = benmingLayer ?? undefined;
  }

  if (layers?.daXianCurrent?.transforms?.length) {
    const t = layers.daXianCurrent.transforms;
    const byType: SiHuaLayer = { lu: null, quan: null, ke: null, ji: null };
    for (const x of t) {
      const starName = starIdToName[x.starId] ?? x.starId;
      const palaceKey = toPalaceKey(x.toPalace);
      const palaceName = toPalaceName(x.toPalace);
      const s: SiHuaStar = { starName, palaceKey, palaceName, transformType: x.type };
      if (x.type === "lu") byType.lu = s;
      else if (x.type === "quan") byType.quan = s;
      else if (x.type === "ke") byType.ke = s;
      else if (x.type === "ji") byType.ji = s;
    }
    out.decadal = byType;
  } else {
    const decadal = ft?.dalimit?.mutagenStars ?? ft?.decadal?.mutagenStars ?? decadalLimits?.[0]?.mutagenStars;
    const decadalLayer = layerFromMutagen(decadal, starByPalace, starIdToName, palaceIdToName);
    out.decadal = decadalLayer ?? undefined;
  }

  if (layers?.liuNianCurrent?.transforms?.length) {
    const t = layers.liuNianCurrent.transforms;
    const byType: SiHuaLayer = { lu: null, quan: null, ke: null, ji: null };
    for (const x of t) {
      const starName = starIdToName[x.starId] ?? x.starId;
      const palaceKey = toPalaceKey(x.toPalace);
      const palaceName = toPalaceName(x.toPalace);
      const s: SiHuaStar = { starName, palaceKey, palaceName, transformType: x.type };
      if (x.type === "lu") byType.lu = s;
      else if (x.type === "quan") byType.quan = s;
      else if (x.type === "ke") byType.ke = s;
      else if (x.type === "ji") byType.ji = s;
    }
    out.yearly = byType;
  } else {
    const yearly = ft?.liunian?.mutagenStars ?? ft?.yearly?.mutagenStars ?? yearlyHoroscope?.mutagenStars ?? liunian?.mutagenStars;
    const yearlyLayer = layerFromMutagen(yearly, starByPalace, starIdToName, palaceIdToName);
    out.yearly = yearlyLayer ?? undefined;
  }

  return out;
}

/** s00 判讀引擎用：從 chartJson 產出三層四化事件陣列（layer, transform, starName, fromPalace, toPalace） */
export function buildS00EventsFromChart(chartJson: Record<string, unknown> | undefined): SiHuaEvent[] {
  const events: SiHuaEvent[] = [];
  if (!chartJson) return events;

  type TransformItem = { starId: string; type: string; fromPalace?: string; toPalace?: string };
  const layers = chartJson.sihuaLayers as {
    benMing?: { transforms?: TransformItem[] };
    daXianCurrent?: { transforms?: TransformItem[] };
    liuNianCurrent?: { transforms?: TransformItem[] };
  } | undefined;
  const layerMap = [
    ["benMing", "natal" as const],
    ["daXianCurrent", "decade" as const],
    ["liuNianCurrent", "year" as const],
  ] as const;

  if (layers?.benMing?.transforms?.length || layers?.daXianCurrent?.transforms?.length || layers?.liuNianCurrent?.transforms?.length) {
    for (const [key, layer] of layerMap) {
      const arr = key === "benMing" ? layers?.benMing?.transforms : key === "daXianCurrent" ? layers?.daXianCurrent?.transforms : layers?.liuNianCurrent?.transforms;
      if (!Array.isArray(arr)) continue;
      for (const t of arr) {
        const starName = (STAR_ID_TO_DISPLAY_NAME as Record<string, string>)[t.starId] ?? t.starId;
        const fromPalace = normPalaceIdToName(t.fromPalace ?? "");
        const toPalace = normPalaceIdToName(t.toPalace ?? "");
        const transform = (t.type === "lu" || t.type === "quan" || t.type === "ke" || t.type === "ji") ? t.type : "lu";
        events.push({
          layer,
          transform,
          starName,
          fromPalace: fromPalace || (toPalace ? getOppositePalaceName(toPalace) : ""),
          toPalace: toPalace || (fromPalace ? getOppositePalaceName(fromPalace) : ""),
        });
      }
    }
    return events;
  }

  const sihuaLayers = buildSiHuaLayers(chartJson);
  const layerKeys = [
    ["benming", "natal" as const],
    ["decadal", "decade" as const],
    ["yearly", "year" as const],
  ] as const;
  for (const [key, layer] of layerKeys) {
    const L = sihuaLayers[key];
    if (!L) continue;
    const types = [["lu", L.lu], ["quan", L.quan], ["ke", L.ke], ["ji", L.ji]] as const;
    for (const [transform, star] of types) {
      if (!star?.starName) continue;
      const fromPalace = star.palaceName ?? star.palaceKey ?? "";
      const toPalace = fromPalace ? getOppositePalaceName(fromPalace) : "";
      events.push({
        layer,
        transform,
        starName: star.starName,
        fromPalace,
        toPalace,
      });
    }
  }
  return events;
}

/** 從 chartJson + config 產出穿透式診斷包（供 s00／s03 共用）。 */
function buildPiercingDiagnosticBundle(
  chartJson: Record<string, unknown> | undefined,
  config: LifeBookConfig | null | undefined
) {
  const empty = { tensions: [], rootCauses: [], reframes: [] };
  if (!chartJson) return empty;
  const events = buildS00EventsFromChart(chartJson);
  const sihuaEdges = buildSihuaEdges(events);
  const diagnosticEdges: DiagnosticEdge[] = sihuaEdges.map((e) => ({
    fromPalace: e.fromPalace,
    toPalace: e.toPalace,
    transformType: e.transformType,
    layer: e.layer === "natal" ? "birth" : e.layer === "decade" ? "decade" : e.layer === "year" ? "year" : "birth",
    starName: e.starName,
    edgeScore: getEdgeScore(e),
  }));
  const starByPalace: Record<string, string[]> = {};
  const ziwei = chartJson.ziwei as Record<string, unknown> | undefined;
  const mainStars = ziwei?.mainStars as Record<string, string[]> | undefined;
  if (mainStars && typeof mainStars === "object") {
    for (const [k, v] of Object.entries(mainStars)) {
      const key = k.endsWith("宮") ? k : k === "命" ? "命宮" : k + "宮";
      if (Array.isArray(v)) starByPalace[key] = v;
    }
  }
  const palaceSignals = buildPalaceSignalsFromEdges(diagnosticEdges, { starByPalace });
  const destinyStar = config?.masterStars?.命主?.name;
  const bodyStar = config?.masterStars?.身主?.name;
  const mingPalace = config?.bodyPalaceInfo ? "命宮" : "命宮";
  const bodyPalace = config?.bodyPalaceInfo?.palace;
  return buildDiagnosticBundle({
    edges: diagnosticEdges,
    palaceSignals,
    destinyStar,
    bodyStar,
    mingPalace,
    bodyPalace,
  });
}

/** 若前端／domain 提供 chart_json.sihuaLayers，則採用此結構；否則 Worker 由 fourTransformations / overlapAnalysis 推導 */
export interface SiHuaLayerTransform {
  starId: string;
  type: "lu" | "quan" | "ke" | "ji";
  fromPalace: string;
  toPalace: string;
}

export interface SihuaLayers {
  benMing?: { yearStem?: string; transforms: SiHuaLayerTransform[] };
  daXianCurrent?: { decadeRange?: [number, number]; stem?: string; transforms: SiHuaLayerTransform[] };
  liuNianCurrent?: { year?: number; stem?: string; transforms: SiHuaLayerTransform[] };
}

/** 星曜 id → 中文名（14 主星 + 常用輔星，供 sihuaLayers.starId 顯示） */
const STAR_ID_TO_DISPLAY_NAME: Record<string, string> = {
  ...(STAR_ID_TO_NAME as Record<string, string>),
  zuoFu: "左輔", youBi: "右弼", wenChang: "文昌", wenQu: "文曲", luCun: "祿存", tianMa: "天馬",
  tianKui: "天魁", tianYue: "天鉞", qingYang: "擎羊", tuoLuo: "陀羅", huoXing: "火星", lingXing: "鈴星",
  diKong: "地空", diJie: "地劫",
};

/** 宮位 id（多種寫法）→ 標準宮名（命宮、財帛…） */
function normPalaceIdToName(id: string): string {
  if (!id) return "";
  const lower = id.replace(/宮$/, "").toLowerCase();
  const map: Record<string, string> = {
    ming: "命宮", xiongdi: "兄弟", xiongDi: "兄弟", fupo: "夫妻", fuPo: "夫妻", ziNv: "子女", zinv: "子女",
    cai: "財帛", jiE: "疾厄", jie: "疾厄", qianyi: "遷移", qianYi: "遷移", puyi: "僕役", puYi: "僕役",
    guanglu: "官祿", guanLu: "官祿", tianzhai: "田宅", tianZhai: "田宅", fude: "福德", fuDe: "福德",
    fumu: "父母", fuMu: "父母",
  };
  return map[lower] ?? (PALACE_ID_TO_NAME as Record<string, string>)[id] ?? (id.endsWith("宮") ? id : id + "宮");
}

function formatMutagenBlock(m: MutagenStars | undefined): string {
  if (!m || typeof m !== "object") return S00_MISSING;
  const parts = (["祿", "權", "科", "忌"] as const)
    .map((k) => (m[k] ? `${m[k]}${NATAL_SIHUA_LABELS[k]}` : null))
    .filter(Boolean);
  return parts.length > 0 ? parts.join("、") : S00_MISSING;
}

function oneLineSummary(layer: "本命" | "大限" | "流年", m: MutagenStars | undefined): string {
  if (!m || typeof m !== "object") return S00_MISSING;
  if (layer === "本命") return "本命四化決定你與生俱來的資源與壓力點。";
  if (layer === "大限") return "大限四化是這十年最敏感的主題與考驗。";
  return "流年四化是今年最直接的外在推力與內在張力。";
}

/** s00 專用：從 chartJson 組裝本命／大限／流年四化人格區塊與祿／忌單行。 */
export function buildFourTransformPersonality(chartJson: Record<string, unknown> | undefined): {
  benmingFourTransformBlocks: string;
  benmingFourTransformSummary: string;
  decadalFourTransformBlocks: string;
  decadalFourTransformSummary: string;
  yearlyFourTransformBlocks: string;
  yearlyFourTransformSummary: string;
  benmingLuLine: string;
  benmingJiLine: string;
  decadalLuLine: string;
  decadalJiLine: string;
  yearlyLuLine: string;
  yearlyJiLine: string;
} {
  const empty = (blocks: string, summary: string, lu: string, ji: string) => ({
    benmingFourTransformBlocks: blocks,
    benmingFourTransformSummary: summary,
    decadalFourTransformBlocks: blocks,
    decadalFourTransformSummary: summary,
    yearlyFourTransformBlocks: blocks,
    yearlyFourTransformSummary: summary,
    benmingLuLine: lu,
    benmingJiLine: ji,
    decadalLuLine: lu,
    decadalJiLine: ji,
    yearlyLuLine: lu,
    yearlyJiLine: ji,
  });
  if (!chartJson) return empty(S00_MISSING, S00_MISSING, S00_MISSING, S00_MISSING);

  const ft = chartJson.fourTransformations as {
    benming?: { mutagenStars?: MutagenStars };
    dalimit?: { mutagenStars?: MutagenStars };
    decadal?: { mutagenStars?: MutagenStars };
    liunian?: { mutagenStars?: MutagenStars };
    yearly?: { mutagenStars?: MutagenStars };
  } | undefined;

  const benming = ft?.benming?.mutagenStars;

  const decadalLimits = chartJson.decadalLimits as Array<{ startAge?: number; endAge?: number; mutagenStars?: MutagenStars }> | undefined;
  const decadal = ft?.dalimit?.mutagenStars ?? ft?.decadal?.mutagenStars ?? (Array.isArray(decadalLimits) && decadalLimits[0] ? decadalLimits[0].mutagenStars : undefined);

  const yearlyHoroscope = chartJson.yearlyHoroscope as { year?: number; mutagenStars?: MutagenStars } | undefined;
  const liunian = chartJson.liunian as { mutagenStars?: MutagenStars } | undefined;
  const yearly = ft?.liunian?.mutagenStars ?? ft?.yearly?.mutagenStars ?? yearlyHoroscope?.mutagenStars ?? liunian?.mutagenStars;

  const luJi = (m: MutagenStars | undefined, prefix: string) => ({
    lu: m?.祿 ? `${prefix}化祿：${m.祿}` : S00_MISSING,
    ji: m?.忌 ? `${prefix}化忌：${m.忌}` : S00_MISSING,
  });

  const b = luJi(benming, "本命");
  const d = luJi(decadal, "大限");
  const y = luJi(yearly, "流年");

  return {
    benmingFourTransformBlocks: formatMutagenBlock(benming),
    benmingFourTransformSummary: oneLineSummary("本命", benming),
    decadalFourTransformBlocks: formatMutagenBlock(decadal),
    decadalFourTransformSummary: oneLineSummary("大限", decadal),
    yearlyFourTransformBlocks: formatMutagenBlock(yearly),
    yearlyFourTransformSummary: oneLineSummary("流年", yearly),
    benmingLuLine: b.lu,
    benmingJiLine: b.ji,
    decadalLuLine: d.lu,
    decadalJiLine: d.ji,
    yearlyLuLine: y.lu,
    yearlyJiLine: y.ji,
  };
}

export interface SiHuaContext {
  benMingSiHuaList: string;
  daXianSiHuaList: string;
  liuNianSiHuaList: string;
  benMingLuStars: string;
  benMingJiStars: string;
  daXianLuStars: string;
  daXianJiStars: string;
  liuNianLuStars: string;
  liuNianJiStars: string;
  perPalaceFlow: Record<string, string>;
  sihuaGlobalSummary: string;
}

const SIHUA_MISSING = "（無四化資料）";

/** 從 sihuaLayers.transforms 組「星名化祿、星名化權…」列表與祿／忌星名 */
function fromLayerTransforms(transforms: SiHuaLayerTransform[]): { list: string; luStars: string; jiStars: string } {
  const typeLabel: Record<string, string> = { lu: "化祿", quan: "化權", ke: "化科", ji: "化忌" };
  const parts: string[] = [];
  let luStars = "";
  let jiStars = "";
  for (const t of transforms) {
    const name = STAR_ID_TO_DISPLAY_NAME[t.starId] ?? t.starId;
    parts.push(`${name}${typeLabel[t.type] ?? "化忌"}`);
    if (t.type === "lu") luStars = luStars ? `${luStars}、${name}` : name;
    if (t.type === "ji") jiStars = jiStars ? `${jiStars}、${name}` : name;
  }
  return { list: parts.length > 0 ? parts.join("、") : SIHUA_MISSING, luStars: luStars || SIHUA_MISSING, jiStars: jiStars || SIHUA_MISSING };
}

/** 從 mutagenStars（祿／權／科／忌 → 星名）組列表與祿／忌星名 */
function fromMutagen(m: MutagenStars | undefined): { list: string; luStars: string; jiStars: string } {
  if (!m || typeof m !== "object") return { list: SIHUA_MISSING, luStars: SIHUA_MISSING, jiStars: SIHUA_MISSING };
  const parts = (["祿", "權", "科", "忌"] as const)
    .map((k) => (m[k] ? `${m[k]}${NATAL_SIHUA_LABELS[k]}` : null))
    .filter(Boolean) as string[];
  return {
    list: parts.length > 0 ? parts.join("、") : SIHUA_MISSING,
    luStars: m.祿 ?? SIHUA_MISSING,
    jiStars: m.忌 ?? SIHUA_MISSING,
  };
}

/**
 * 四化高階 context：供 s00／s03／12 宮 placeholder 使用。
 * 若 chartJson.sihuaLayers 存在則優先使用；否則由 fourTransformations + overlapAnalysis 推導。
 * Phase 5B-5：12 宮迴圈優先使用傳入的 findings，僅無傳入時才 fallback createEmptyFindings()。
 */
export function buildSiHuaContext(
  chartJson: Record<string, unknown> | undefined,
  passedInFindings?: LifebookFindings
): SiHuaContext {
  const emptyPalaceFlow: Record<string, string> = {};
  const palaceNames = PALACES.map((p) => p.name);
  for (const n of palaceNames) emptyPalaceFlow[n] = "（此宮暫無四化飛星摘要）";

  const defaultCtx: SiHuaContext = {
    benMingSiHuaList: SIHUA_MISSING,
    daXianSiHuaList: SIHUA_MISSING,
    liuNianSiHuaList: SIHUA_MISSING,
    benMingLuStars: SIHUA_MISSING,
    benMingJiStars: SIHUA_MISSING,
    daXianLuStars: SIHUA_MISSING,
    daXianJiStars: SIHUA_MISSING,
    liuNianLuStars: SIHUA_MISSING,
    liuNianJiStars: SIHUA_MISSING,
    perPalaceFlow: emptyPalaceFlow,
    sihuaGlobalSummary: "今年四化的重點依命盤實際飛星而定，可參照各宮「四化流向」段落。",
  };

  if (!chartJson) return defaultCtx;

  const layers = chartJson.sihuaLayers as SihuaLayers | undefined;
  const ft = chartJson.fourTransformations as {
    benming?: { mutagenStars?: MutagenStars };
    dalimit?: { mutagenStars?: MutagenStars };
    decadal?: { mutagenStars?: MutagenStars };
    liunian?: { mutagenStars?: MutagenStars };
    yearly?: { mutagenStars?: MutagenStars };
  } | undefined;
  const decadalLimits = chartJson.decadalLimits as Array<{ mutagenStars?: MutagenStars }> | undefined;
  const yearlyHoroscope = chartJson.yearlyHoroscope as { mutagenStars?: MutagenStars } | undefined;
  const liunian = chartJson.liunian as { mutagenStars?: MutagenStars } | undefined;

  let benMingList: string, benMingLu: string, benMingJi: string;
  let daXianList: string, daXianLu: string, daXianJi: string;
  let liuNianList: string, liuNianLu: string, liuNianJi: string;

  if (layers?.benMing?.transforms?.length) {
    const b = fromLayerTransforms(layers.benMing.transforms);
    benMingList = b.list;
    benMingLu = b.luStars;
    benMingJi = b.jiStars;
  } else {
    const b = fromMutagen(ft?.benming?.mutagenStars);
    benMingList = b.list;
    benMingLu = b.luStars;
    benMingJi = b.jiStars;
  }

  if (layers?.daXianCurrent?.transforms?.length) {
    const d = fromLayerTransforms(layers.daXianCurrent.transforms);
    daXianList = d.list;
    daXianLu = d.luStars;
    daXianJi = d.jiStars;
  } else {
    const decadal = ft?.dalimit?.mutagenStars ?? ft?.decadal?.mutagenStars ?? decadalLimits?.[0]?.mutagenStars;
    const d = fromMutagen(decadal);
    daXianList = d.list;
    daXianLu = d.luStars;
    daXianJi = d.jiStars;
  }

  if (layers?.liuNianCurrent?.transforms?.length) {
    const y = fromLayerTransforms(layers.liuNianCurrent.transforms);
    liuNianList = y.list;
    liuNianLu = y.luStars;
    liuNianJi = y.jiStars;
  } else {
    const yearly = ft?.liunian?.mutagenStars ?? ft?.yearly?.mutagenStars ?? yearlyHoroscope?.mutagenStars ?? liunian?.mutagenStars;
    const y = fromMutagen(yearly);
    liuNianList = y.list;
    liuNianLu = y.luStars;
    liuNianJi = y.jiStars;
  }

  const perPalaceFlow: Record<string, string> = { ...emptyPalaceFlow };
  if (layers?.benMing?.transforms?.length || layers?.daXianCurrent?.transforms?.length || layers?.liuNianCurrent?.transforms?.length) {
    const allTrans: Array<{ layer: string; starName: string; type: string; fromPalace: string; toPalace: string }> = [];
    for (const [layerKey, label] of [["benMing", "本命"], ["daXianCurrent", "大限"], ["liuNianCurrent", "流年"]] as const) {
      const arr = layers?.[layerKey]?.transforms;
      if (!Array.isArray(arr)) continue;
      for (const t of arr) {
        const starName = STAR_ID_TO_DISPLAY_NAME[t.starId] ?? t.starId;
        const fromName = normPalaceIdToName(t.fromPalace);
        const toName = normPalaceIdToName(t.toPalace);
        const typeLabel = t.type === "lu" ? "化祿" : t.type === "quan" ? "化權" : t.type === "ke" ? "化科" : "化忌";
        allTrans.push({ layer: label, starName, type: typeLabel, fromPalace: fromName, toPalace: toName });
      }
    }
    for (const palaceName of palaceNames) {
      const into = allTrans.filter((t) => t.toPalace === palaceName || t.toPalace.replace(/宮$/, "") === palaceName.replace(/宮$/, ""));
      const out = allTrans.filter((t) => t.fromPalace === palaceName || t.fromPalace.replace(/宮$/, "") === palaceName.replace(/宮$/, ""));
      const lines: string[] = [];
      for (const t of into) lines.push(`${t.layer}${t.starName}${t.type}自${t.fromPalace}飛入${palaceName}`);
      for (const t of out) lines.push(`${t.layer}${t.starName}${t.type}自${palaceName}飛出至${t.toPalace}`);
      perPalaceFlow[palaceName] = lines.length > 0 ? lines.join("；") + "。" : "（此宮暫無四化飛星摘要）";
    }
  } else {
    const currentFindings = passedInFindings ?? createEmptyFindings();
    for (const p of palaceNames) {
      const key = p.replace(/宮$/, "") === "命" ? "命宮" : p.replace(/宮$/, "");
      const summary = buildSihuaFlowSummary({ currentPalace: key, findings: currentFindings });
      perPalaceFlow[p] = summary || "（此宮暫無四化飛星摘要）";
    }
  }

  const sihuaGlobalSummary = defaultCtx.sihuaGlobalSummary;

  return {
    benMingSiHuaList: benMingList,
    daXianSiHuaList: daXianList,
    liuNianSiHuaList: liuNianList,
    benMingLuStars: benMingLu,
    benMingJiStars: benMingJi,
    daXianLuStars: daXianLu,
    daXianJiStars: daXianJi,
    liuNianLuStars: liuNianLu,
    liuNianJiStars: liuNianJi,
    perPalaceFlow,
    sihuaGlobalSummary,
  };
}

/** s03 專用：整盤結構 context（命宮三方四正、夫妻/官祿三方、星曜群性、四化、強弱宮） */
export interface S03Context {
  mingMain: string;
  mingTrio: string;
  mingTrioSummary: string;
  relationshipTrio: string;
  careerTrio: string;
  starEnergySummary: string;
  sihuaPersonality: string;
  sihuaMapping: string;
  strongPalace: string;
  weakPalace: string;
  mingQuadSummary: string;
  caiQuadSummary: string;
  guanQuadSummary: string;
  qianQuadSummary: string;
  starClusterBehaviorSummary: string;
}

const S03_MISSING = "（此處無資料）";

/** 命宮三方四正（主線）：命、官、財、田。PALACES 索引 0,8,4,9 */
const MING_TRIO_INDICES = [0, 8, 4, 9];
/** 夫妻宮三方四正：夫妻、遷移、福德、官祿。索引 2,6,10,8 */
const RELATIONSHIP_TRIO_INDICES = [2, 6, 10, 8];
/** 官祿宮三方四正：官祿、命宮、財帛、夫妻。索引 8,0,4,2 */
const CAREER_TRIO_INDICES = [8, 0, 4, 2];

function formatPalaceStars(starByPalace: Partial<Record<string, string[]>>, palaceId: string, starIdToName: Record<string, string>): string {
  const starIds = starByPalace[palaceId];
  if (!Array.isArray(starIds) || starIds.length === 0) return "（無主星）";
  const names = starIds.map((id) => starIdToName[id] ?? id).filter(Boolean);
  return names.join("、");
}

/**
 * s03 專用：從 chartJson 組裝整盤結構（命宮/夫妻/官祿三方、星曜群性、本命四化、強弱宮）。
 */
export function buildS03GlobalContext(
  chartJson: Record<string, unknown>,
  config: { tenGodByPalace?: Record<string, string> } | null | undefined,
  contentLocale: "zh-TW" | "zh-CN" | "en" = "zh-TW"
): S03Context {
  const empty = (): S03Context => ({
    mingMain: S03_MISSING,
    mingTrio: S03_MISSING,
    mingTrioSummary: S03_MISSING,
    relationshipTrio: S03_MISSING,
    careerTrio: S03_MISSING,
    starEnergySummary: S03_MISSING,
    sihuaPersonality: S03_MISSING,
    sihuaMapping: S03_MISSING,
    strongPalace: S03_MISSING,
    weakPalace: S03_MISSING,
    mingQuadSummary: S03_MISSING,
    caiQuadSummary: S03_MISSING,
    guanQuadSummary: S03_MISSING,
    qianQuadSummary: S03_MISSING,
    starClusterBehaviorSummary: S03_MISSING,
  });

  const assembleInput = buildAssembleInput(chartJson, config, contentLocale === "en" ? "en" : contentLocale === "zh-CN" ? "zh-CN" : "zh-TW");
  const starByPalace = assembleInput.starByPalace as Partial<Record<string, string[]>> | undefined;
  const starIdToName = STAR_ID_TO_NAME as Record<string, string>;
  const palaceIdToName = PALACE_ID_TO_NAME as Record<string, string>;

  if (!starByPalace || typeof starByPalace !== "object") return empty();

  const palaceOrder = PALACES.map((p) => p.id);

  const mingStars = starByPalace.ming ?? starByPalace["命宮" as string];
  const mingMain =
    Array.isArray(mingStars) && mingStars.length > 0
      ? mingStars.map((id) => starIdToName[id] ?? id).join("＋")
      : S03_MISSING;

  const trioLines = (indices: number[]) =>
    indices
      .map((i) => {
        const pid = palaceOrder[i];
        const name = palaceIdToName[pid] ?? pid;
        const stars = formatPalaceStars(starByPalace, pid, starIdToName);
        return `${name}：${stars}`;
      })
      .join("\n");

  const mingTrio = trioLines(MING_TRIO_INDICES);
  const relationshipTrio = trioLines(RELATIONSHIP_TRIO_INDICES);
  const careerTrio = trioLines(CAREER_TRIO_INDICES);

  const toStarNames = (ids: string[] | undefined): string[] =>
    (ids ?? []).map((id) => starIdToName[id] ?? id).filter(Boolean);
  const mingNames = toStarNames(starByPalace.ming ?? starByPalace["命宮" as string]);
  const guanNames = toStarNames(starByPalace.guanglu ?? starByPalace["官祿" as string]);
  const has動星 = (names: string[]) => hasGroup(names, "動星");
  const has穩星 = (names: string[]) => hasGroup(names, "穩星");

  let mingTrioSummary = S03_MISSING;
  if (has動星(mingNames) || has動星(guanNames)) mingTrioSummary = "整體走實幹、衝撞型結構，行動力強。";
  else if (has穩星(mingNames) || has穩星(guanNames)) mingTrioSummary = "偏穩定、管理／架構型人生，重視秩序與累積。";
  else mingTrioSummary = "命盤結構均衡，主線依星曜組合而定。";

  const oneQuadSummary = (palaceId: string, tone: string): string => {
    const stars = formatPalaceStars(starByPalace, palaceId, starIdToName);
    if (stars === "（無主星）") return tone;
    return `${stars}，${tone}`;
  };
  const mingQuadSummary = oneQuadSummary("ming", has動星(mingNames) ? "行動主導" : has穩星(mingNames) ? "主星集中、重架構" : "主線依星曜而定");
  const caiIds = (starByPalace.cai ?? starByPalace["財帛" as string]) ?? [];
  const caiQuadSummary = oneQuadSummary("cai", caiIds.length > 0 ? "財星與資源配置影響賺錢方式" : "由星曜組合決定資源觀");
  const guanQuadSummary = oneQuadSummary("guanglu", has動星(guanNames) ? "實幹、衝撞型舞台" : has穩星(guanNames) ? "穩定、管理型發揮" : "事業依星曜而定");
  const qianIds = (starByPalace.qianyi ?? starByPalace["遷移" as string]) ?? [];
  const qianQuadSummary = oneQuadSummary("qianyi", qianIds.length > 0 ? "對外形象與環境互動明顯" : "遷移宮由星曜主導");

  const allStarNames: string[] = [];
  for (const pid of Object.keys(starByPalace)) {
    const ids = starByPalace[pid] ?? [];
    for (const id of ids) allStarNames.push(starIdToName[id] ?? id);
  }
  const stats = calculateStarGroupStats(allStarNames);
  const topTwo = getTopTwoGroups(stats);
  let starEnergySummary = S03_MISSING;
  let starClusterBehaviorSummary = S03_MISSING;
  if (stats.totalStars > 0) {
    const parts = [
      `動星 ${stats.動星}、智星 ${stats.智星}、穩星 ${stats.穩星}、權星 ${stats.權星}、財星 ${stats.財星}、情緒星 ${stats.情緒星}`,
    ];
    if (topTwo.length > 0) parts.push(`其中${topTwo[0].tag}比例最高。`);
    starEnergySummary = parts.join("；");
    if (topTwo.length > 0) {
      const set = getStarGroupNarrative(topTwo[0].tag);
      starClusterBehaviorSummary = set.message[0] ?? S03_MISSING;
    } else {
      starClusterBehaviorSummary = "星曜分布均衡，你在四宮之間依情境切換節奏。";
    }
  }

  const ft = chartJson.fourTransformations as { benming?: { mutagenStars?: MutagenStars } } | undefined;
  const benming = ft?.benming?.mutagenStars;

  const sihuaMappingLines: string[] = [];
  const typeToLabel = (t: string) => (t === "lu" ? "祿" : t === "quan" ? "權" : t === "ke" ? "科" : "忌");
  const layers = chartJson.sihuaLayers as { benMing?: { transforms?: Array<{ starId: string; type: string; toPalace?: string }> } } | undefined;
  if (layers?.benMing?.transforms?.length) {
    for (const t of layers.benMing.transforms) {
      const toPalaceRaw = t.toPalace ?? "";
      const palaceName = toPalaceRaw ? (normPalaceIdToName(toPalaceRaw).endsWith("宮") ? normPalaceIdToName(toPalaceRaw) : normPalaceIdToName(toPalaceRaw) + "宮") : "";
      if (!palaceName) continue;
      const starName = (STAR_ID_TO_DISPLAY_NAME as Record<string, string>)[t.starId] ?? t.starId;
      sihuaMappingLines.push(`${starName}化${typeToLabel(t.type)} → ${palaceName}`);
    }
  } else {
    const siHuaLayers = buildSiHuaLayers(chartJson);
    const benmingLayer = siHuaLayers.benming;
    if (benmingLayer) {
      const entries: Array<[typeof benmingLayer.lu, string]> = [
        [benmingLayer.lu, "祿"],
        [benmingLayer.quan, "權"],
        [benmingLayer.ke, "科"],
        [benmingLayer.ji, "忌"],
      ];
      for (const [star, label] of entries) {
        if (!star?.starName) continue;
        const fromPalace = star.palaceName ?? star.palaceKey ?? "";
        if (!fromPalace || fromPalace.includes("未知")) continue;
        const toPalace = getOppositePalaceName(fromPalace);
        if (!toPalace) continue;
        const palaceName = toPalace.endsWith("宮") ? toPalace : toPalace + "宮";
        sihuaMappingLines.push(`${star.starName}化${label} → ${palaceName}`);
      }
    }
  }
  const sihuaMapping = sihuaMappingLines.length > 0 ? sihuaMappingLines.join("\n") : S03_MISSING;

  let sihuaPersonality = S03_MISSING;
  if (benming && typeof benming === "object") {
    const parts: string[] = [];
    if (benming.祿) parts.push(`${benming.祿}化祿 → 自然往該星風格追求資源`);
    if (benming.權) parts.push(`${benming.權}化權 → 在該星象徵領域想掌控`);
    if (benming.科) parts.push(`${benming.科}化科 → 在該領域追求體面／專業`);
    if (benming.忌) parts.push(`${benming.忌}化忌 → 容易在該星象徵議題上卡關`);
    if (parts.length > 0) sihuaPersonality = parts.join("；");
  }

  let strongPalace = S03_MISSING;
  let weakPalace = S03_MISSING;
  const weightAnalysis = chartJson.weight_analysis as { top_focus_palaces?: string[]; risk_palaces?: string[] } | undefined;
  if (weightAnalysis?.top_focus_palaces?.[0]) {
    const p = weightAnalysis.top_focus_palaces[0];
    strongPalace = `${p}：吉星或主星集中，資源與機會較易在此宮。`;
  } else {
    let maxCount = 0;
    let maxId = "";
    for (const [pid, ids] of Object.entries(starByPalace)) {
      const c = Array.isArray(ids) ? ids.length : 0;
      if (c > maxCount) {
        maxCount = c;
        maxId = pid;
      }
    }
    if (maxId) strongPalace = `${palaceIdToName[maxId] ?? maxId}：主星集中，是你較有發揮的宮位。`;
  }
  if (weightAnalysis?.risk_palaces?.[0]) {
    const p = weightAnalysis.risk_palaces[0];
    weakPalace = `${p}：星曜較弱或煞星偏多，需刻意調整。`;
  } else {
    let minCount = Infinity;
    let minId = "";
    for (const pid of palaceOrder) {
      const c = (starByPalace[pid] && Array.isArray(starByPalace[pid]) ? starByPalace[pid].length : 0) as number;
      if (c < minCount) {
        minCount = c;
        minId = pid;
      }
    }
    if (minId) weakPalace = `${palaceIdToName[minId] ?? minId}：主星較少或無主星，是你較需補強的區域。`;
  }

  return {
    mingMain,
    mingTrio,
    mingTrioSummary,
    relationshipTrio,
    careerTrio,
    starEnergySummary,
    sihuaPersonality,
    sihuaMapping,
    strongPalace,
    weakPalace,
    mingQuadSummary,
    caiQuadSummary,
    guanQuadSummary,
    qianQuadSummary,
    starClusterBehaviorSummary,
  };
}

export function getS03PlaceholderMap(ctx: S03Context): Record<string, string> {
  return {
    mingMain: ctx.mingMain,
    mingTrio: ctx.mingTrio,
    mingTrioSummary: ctx.mingTrioSummary,
    relationshipTrio: ctx.relationshipTrio,
    careerTrio: ctx.careerTrio,
    starEnergySummary: ctx.starEnergySummary,
    sihuaPersonality: ctx.sihuaPersonality,
    sihuaMapping: ctx.sihuaMapping,
    strongPalace: ctx.strongPalace,
    weakPalace: ctx.weakPalace,
    mingQuadSummary: ctx.mingQuadSummary,
    caiQuadSummary: ctx.caiQuadSummary,
    guanQuadSummary: ctx.guanQuadSummary,
    qianQuadSummary: ctx.qianQuadSummary,
    starClusterBehaviorSummary: ctx.starClusterBehaviorSummary,
  };
}

/** 模組一（s03）全盤結構資料包：不依賴單一宮位，禁止命宮詳解 */
export interface WholeChartContext {
  palaceStrengthSummary: string;
  starGroupStats: { 動星: number; 智星: number; 穩星: number; 權星: number; 財星: number; 情緒星: number; totalStars: number };
  siHuaEvents: SiHuaEvent[];
  siHuaPatterns: PatternHit[];
  hotStars: string[];
  hotPalaces: string[];
  wholeChartMainlineBlock: string;
  starGroupStatsBlock: string;
  siHuaPatternTopBlocks: string;
  /** 節奏 v2：僅組裝時計算一次；s03 用 full、其他章用 brief */
  rhythmNarrativeFull: string;
  rhythmNarrativeBrief: string;
  /** G2：四化流向 Top 2~3 條或 fallback（僅 s03 使用） */
  sihuaTopFlowsBlock: string;
  /** G3：內部計算，Top 3 sink 宮位（依 inScore） */
  sihuaSinkScores?: { topSinkPalaces: string[] };
  /** G4：能量環摘要，僅 s03 使用 */
  loopSummaryBlock: string;
  /** G5：內部計算，多層衝突檢測結果 */
  sihuaConflict?: { hasConflict: boolean; message: string };
  /** 主戰場 Top 3（與權重摘要一致：不可標為相對穩定的宮位由此判斷） */
  dominantPalaces: Array<{ palace: string; score: number; tags: string[]; evidence: unknown[] }>;
  /** 節奏 v2 完整統計（s03 行為／盲點／策略用摘要句） */
  rhythmStats?: RhythmStats;
}

const RESOURCE_PALACES = new Set(["財帛宮", "財帛", "田宅宮", "田宅", "福德宮", "福德"]);
const RELATION_PALACES = new Set(["夫妻宮", "夫妻", "僕役宮", "僕役", "兄弟宮", "兄弟"]);
const CAREER_PALACES = new Set(["官祿宮", "官祿", "遷移宮", "遷移"]);
const INNER_PALACES = new Set(["命宮", "命", "疾厄宮", "疾厄", "父母宮", "父母", "子女宮", "子女"]);

function normPalaceForTheme(p: string): string {
  const s = (p || "").trim().replace(/宮$/, "");
  return s === "命" ? "命宮" : s ? s + "宮" : "";
}

/**
 * 模組一專用：收集全盤統計＋三層四化 events＋PatternHit，產出三段 block（主線劇本／星曜群性／四化慣性）。
 * 不依賴 palaceKey，禁止出現「宮位：命宮」「此宮表現」。
 * 四化慣性與 s00【全盤結構重點】共用同一渲染（10 ruleType 句型），由 forTechnicalOutput 控制是否顯示 ruleId。
 */
export function buildWholeChartContext(
  chartJson: Record<string, unknown>,
  config: { tenGodByPalace?: Record<string, string> } | null | undefined,
  contentLocale: "zh-TW" | "zh-CN" | "en" = "zh-TW",
  opts?: { forTechnicalOutput?: boolean }
): WholeChartContext {
  const locale = contentLocale === "en" ? "en" : contentLocale === "zh-CN" ? "zh-CN" : "zh-TW";
  const assembleInput = buildAssembleInput(chartJson, config, locale);
  const starByPalace = assembleInput.starByPalace as Partial<Record<string, string[]>> | undefined;
  const starIdToName = STAR_ID_TO_NAME as Record<string, string>;

  let totalMain = 0;
  let totalSha = 0;
  let totalAssistant = 0;
  const perPalaceCounts: Array<{ palace: string; main: number; sha: number; assistant: number }> = [];
  const allStarNames: string[] = [];
  /** 星曜能量節奏僅計「命宮三方四正」四宮（命、財帛、官祿、遷移），使分布隨命盤而異；全盤計數會因 14 主星+8 輔星固定而人人相同 */
  const MING_QUAD_PALACE_IDS = new Set<string>(["ming", "cai", "guanglu", "qianyi"]);
  const allStarNamesForRhythm: string[] = [];
  if (starByPalace && typeof starByPalace === "object") {
    const palaceOrder = PALACES.map((p) => p.id);
    const palaceIdToName = PALACE_ID_TO_NAME as Record<string, string>;
    for (const pid of palaceOrder) {
      const ids = starByPalace[pid] ?? [];
      let main = 0;
      let sha = 0;
      let ast = 0;
      const isMingQuad = MING_QUAD_PALACE_IDS.has(pid);
      for (const id of ids) {
        const name = starIdToName[id] ?? id;
        if (MAIN_STAR_NAMES.has(name)) {
          main++;
          totalMain++;
          allStarNames.push(name);
          if (isMingQuad) allStarNamesForRhythm.push(name);
        } else if (SHA_STAR_NAMES.has(name)) {
          sha++;
          totalSha++;
        } else {
          ast++;
          totalAssistant++;
          allStarNames.push(name);
          if (isMingQuad) allStarNamesForRhythm.push(name);
        }
      }
      perPalaceCounts.push({
        palace: palaceIdToName[pid] ?? pid,
        main,
        sha,
        assistant: ast,
      });
    }
  }

  const palaceStrengthSummary =
    perPalaceCounts.length > 0
      ? `全盤主星 ${totalMain} 顆、煞星 ${totalSha} 顆、輔星 ${totalAssistant} 顆；各宮分布已彙整。`
      : "（無星曜資料）";

  const siHuaEvents = buildS00EventsFromChart(chartJson);
  const { events: eventsForDominant } = normalizeSiHuaEventsLegacy(
    siHuaEvents as Parameters<typeof normalizeSiHuaEventsLegacy>[0]
  );
  const dominantPalaces = detectDominantPalaces({
    chartJson,
    config: config ?? null,
    events: eventsForDominant,
  });
  const siHuaPatterns = evaluateFourTransformPatterns(siHuaEvents);
  const { hotStars, hotPalaces } = getHotStarsAndPalaces(siHuaEvents);

  const topResource: string[] = [];
  const topRelation: string[] = [];
  const topCareer: string[] = [];
  const topInner: string[] = [];
  for (const p of hotPalaces) {
    const n = normPalaceForTheme(p);
    const key = n.replace(/宮$/, "");
    if (RESOURCE_PALACES.has(n) || RESOURCE_PALACES.has(key)) topResource.push(n || p);
    else if (RELATION_PALACES.has(n) || RELATION_PALACES.has(key)) topRelation.push(n || p);
    else if (CAREER_PALACES.has(n) || CAREER_PALACES.has(key)) topCareer.push(n || p);
    else if (INNER_PALACES.has(n) || INNER_PALACES.has(key)) topInner.push(n || p);
  }
  const evidence = "四化多層命中";
  const mainlineParts: string[] = [];
  if (topResource.length > 0) mainlineParts.push(`資源集中宮位：${[...new Set(topResource)].join("、")}（因：${evidence}）`);
  if (topRelation.length > 0) mainlineParts.push(`關係相關宮位：${[...new Set(topRelation)].join("、")}（因：${evidence}）`);
  if (topCareer.length > 0) mainlineParts.push(`事業相關宮位：${[...new Set(topCareer)].join("、")}（因：${evidence}）`);
  if (topInner.length > 0) mainlineParts.push(`內在相關宮位：${[...new Set(topInner)].join("、")}（因：${evidence}）`);
  const wholeChartMainlineBlock =
    mainlineParts.length > 0
      ? ["【全盤結構重點】", "", mainlineParts.join("\n")].join("\n")
      : "【全盤結構重點】\n\n（依四化與星群，見各宮章節。）";

  const firstHitPalace =
    siHuaPatterns.length > 0 && siHuaPatterns[0].evidence
      ? (siHuaPatterns[0].evidence.toPalace ?? siHuaPatterns[0].evidence.palace ?? "")
      : "";
  const patternPalace = typeof firstHitPalace === "string" ? firstHitPalace : Array.isArray(firstHitPalace) ? firstHitPalace[0] : "";
  const starsForRhythm = allStarNamesForRhythm.length > 0 ? allStarNamesForRhythm : allStarNames;

  const starsByPalaceRhythm: Record<string, string[]> = {};
  for (const pid of RHYTHM_FOUR_PALACE_IDS) {
    const ids = starByPalace?.[pid] ?? [];
    const names = (ids as string[])
      .map((id) => (starIdToName[id] ?? id) as string)
      .filter((n) => MAIN_STAR_WHITELIST.has(n) || AUX_STAR_WHITELIST.has(n));
    starsByPalaceRhythm[pid] = names;
  }
  const sihua = extractSihuaFromEvents(
    siHuaEvents.map((e) => ({ starName: e.starName, toPalace: e.toPalace })),
    starIdToName
  );
  const rhythmResult = computeRhythmOnce(
    { starsByPalace: starsByPalaceRhythm, sihua, starIdToName },
    {
      fallbackStars: starsForRhythm,
      source: starsForRhythm.length > 0 ? "FOUR_PALACES" : "FALLBACK_WHOLE_CHART",
      fallbackReason: starsForRhythm.length === 0 ? "四宮無主輔星" : undefined,
      debug: opts?.forTechnicalOutput,
    }
  );
  let starGroupStatsBlock = rhythmResult.rhythmNarrativeFull;
  if (opts?.forTechnicalOutput && rhythmResult.debugInfo) {
    const d = rhythmResult.debugInfo;
    const sixCats = ["動星", "智星", "穩星", "權星", "財星", "情緒星"] as const;
    starGroupStatsBlock +=
      "\n\n---\n【開發模式】節奏驗收\n" +
      `宮位：${d.palacesUsed.join("、")}\n` +
      `四宮主/輔星：${d.perPalace.map((p) => `${p.palaceName} 主星=${p.main.join("、") || "無"} 輔星=${p.aux.join("、") || "無"}`).join("；")}\n` +
      `source=${d.source}${d.fallbackReason ? `（${d.fallbackReason}）` : ""}\n` +
      `四化星加成：${d.sihuaStarsHit.join("、") || "無"}\n` +
      `四化落宮加成：${d.sihuaPalacesHit.join("、") || "無"}\n` +
      `六類分數：${sixCats.map((t) => `${t}=${d.finalScores[t] ?? 0}`).join(" ")}\n` +
      `佔比：${sixCats.map((t) => `${t}=${d.percents[t] ?? 0}%`).join(" ")}\n` +
      `Top1=${(d.Top1 ?? []).join("、")} Top2=${(d.Top2 ?? []).join("、")} weakest=${(d.weakest ?? []).join("、")} 置信度=${d.confidence}\n---`;
  }
  const starGroupStats = rhythmResult.rhythmStats.scores;

  const rhythmStats = rhythmResult.rhythmStats;

  const siHuaPatternTopBlocks =
    siHuaPatterns.length > 0
      ? ["【四化慣性】", "", renderPatternHitsForModuleOne(siHuaPatterns, 3, { forTechnicalOutput: opts?.forTechnicalOutput })].join("\n")
      : "【四化慣性】\n\n（無四化規則命中，見 s00 四化人格。）";

  const sihuaTopFlowsBlock = buildTopFlowsBlock(siHuaEvents);
  const sihuaEdges = buildSihuaEdges(siHuaEvents);
  const sinkScores = computeSinkScores(sihuaEdges);
  const loopSummaryBlock = buildLoopSummaryBlock(siHuaEvents);
  const conflict = detectMultiLayerConflict(siHuaEvents);

  return {
    palaceStrengthSummary,
    starGroupStats,
    siHuaEvents,
    siHuaPatterns,
    hotStars,
    hotPalaces,
    wholeChartMainlineBlock,
    starGroupStatsBlock,
    siHuaPatternTopBlocks,
    rhythmNarrativeFull: rhythmResult.rhythmNarrativeFull,
    rhythmNarrativeBrief: rhythmResult.rhythmNarrativeBrief,
    sihuaTopFlowsBlock,
    sihuaSinkScores: { topSinkPalaces: sinkScores.topSinkPalaces },
    loopSummaryBlock,
    sihuaConflict: conflict.hasConflict ? { hasConflict: true, message: conflict.message } : undefined,
    dominantPalaces,
    rhythmStats,
  };
}

/** 模組一驗收：不得含「宮位：命宮」「此宮表現」；星曜群性須含數字 */
export function validateModuleOneOutput(structureAnalysis: string): { ok: boolean; reason?: string } {
  if (!structureAnalysis || typeof structureAnalysis !== "string") return { ok: true };
  if (structureAnalysis.includes("宮位：命宮") || structureAnalysis.includes("此宮表現"))
    return { ok: false, reason: "模組一不得包含「宮位：命宮」或「此宮表現」" };
  const starBlockMatch = structureAnalysis.match(/【星曜(?:群性|能量節奏)】[\s\S]*?(?=【|$)/);
  const starBlock = starBlockMatch ? starBlockMatch[0] : "";
  if (starBlock && !/\d+/.test(starBlock)) return { ok: false, reason: "星曜能量節奏／群性段落須含數字統計" };
  return { ok: true };
}

/** 從 chartJson 取得該星在本命四化中的標註（若有）；無則回傳空字串。Phase 5B-2：優先改用 getNatalSihuaForStarFromFindings。 */
function getNatalSihuaForStar(starName: string, chartJson: Record<string, unknown> | undefined): string {
  if (!starName || !chartJson) return "";
  const ft = chartJson.fourTransformations as { benming?: { mutagenStars?: Record<string, string> } } | undefined;
  const mutagen = ft?.benming?.mutagenStars;
  if (!mutagen || typeof mutagen !== "object") return "";
  for (const k of NATAL_SIHUA_KEYS) {
    if (mutagen[k] === starName) return NATAL_SIHUA_LABELS[k] ?? `化${k}`;
  }
  return "";
}

/** Phase 5B-2：從 Findings 取得該星在本命四化中的標註（只讀 sihuaPlacementItems，layer === "natal"）。 */
function getNatalSihuaForStarFromFindings(starName: string, findings: LifebookFindings): string {
  if (!starName || !findings?.sihuaPlacementItems?.length) return "";
  const natal = findings.sihuaPlacementItems.filter((item) => item.layer === "natal");
  const hit = natal.find((item) => item.starName === starName);
  return hit ? (NATAL_SIHUA_LABELS[hit.transform] ?? `化${hit.transform}`) : "";
}

/** Phase 5B-2：從 findings.natalFlowItems 產出單宮本命宮干飛化區塊（與 getFlowBlockForPalace 輸出等價）。 */
function buildNatalFlowBlockFromFindings(findings: LifebookFindings, palaceNameOrKey: string): string {
  const items = findings.natalFlowItems ?? [];
  if (!items.length) return "";
  const palaceCanon = toPalaceDisplayName((palaceNameOrKey ?? "").trim()) || (palaceNameOrKey ?? "").trim();
  if (!palaceCanon) return "";
  const relevant = items.filter(
    (e) =>
      toPalaceDisplayName(e.fromPalace) === palaceCanon ||
      toPalaceDisplayName(e.toPalace) === palaceCanon ||
      e.fromPalace === palaceCanon ||
      e.toPalace === palaceCanon
  );
  if (!relevant.length) return "";
  return relevant
    .map((e) => {
      const star = e.starName ?? "星";
      return `本命${star}化${e.transform}：從${e.fromPalace}出，入${e.toPalace}`;
    })
    .join("\n");
}

/** Phase 5B-2：從 findings.natalFlowItems 產出 FLOW_DEBUG 結構（與 buildFlowDebugEntries 輸出等價）。 */
function buildFlowDebugEntriesFromFindings(findings: LifebookFindings): FlowDebugEntry[] {
  const items = findings.natalFlowItems ?? [];
  return items.map((e) => ({
    layer: "natal" as const,
    star: e.starName ?? "星",
    star_palace: e.fromPalace,
    fromPalace: e.fromPalace,
    toPalace: e.toPalace,
    transform: e.transform,
  }));
}

/** 星曜亮度／地勢：廟旺利陷（常見為廟、旺、利、陷四種，亦有派別用平、得、不） */
const BRIGHTNESS_TO_ZH: Record<string, string> = {
  miao: "廟", wang: "旺", li: "利", xian: "陷",
  ping: "平", de: "得", bu: "不",
};

/** 從 chartJson 嘗試取得該宮主星的亮度／廟旺利陷（若有）；無則回傳 undefined。支援廟、旺、利、陷、平、得、不。 */
function getPalaceStarStrength(chartJson: Record<string, unknown> | undefined, palaceId: string): string | undefined {
  const ziwei = chartJson?.ziwei as { palaces?: Array<{ majorStars?: Array<{ brightness?: string; strength?: string }> }> } | undefined;
  const palaces = ziwei?.palaces;
  if (!Array.isArray(palaces)) return undefined;
  const palaceNameZh = (PALACE_ID_TO_NAME as Record<string, string>)[palaceId];
  if (!palaceNameZh) return undefined;
  const withSuffix = palaceNameZh.endsWith("宮") ? palaceNameZh : `${palaceNameZh}宮`;
  const arrIdx = findZiweiPalaceSlotIndexForCanonical(chartJson, withSuffix);
  const p = arrIdx != null && arrIdx < palaces.length ? palaces[arrIdx] : undefined;
  if (!p) return undefined;
  const star = p?.majorStars?.[0];
  const raw = star?.brightness ?? star?.strength;
  if (typeof raw !== "string") return undefined;
  const key = raw.trim().toLowerCase();
  return BRIGHTNESS_TO_ZH[key] ?? raw;
}

/** 從 chartJson.ziwei 嘗試取得該宮「每顆星」的亮度（若有）；key 為星名或 starId。無則回傳空物件。 */
function getPalaceStarsStrengthMap(
  chartJson: Record<string, unknown> | undefined,
  palaceId: string
): Record<string, string> {
  const out: Record<string, string> = {};
  const ziwei = chartJson?.ziwei as {
    palaces?: Array<{
      majorStars?: Array<{ name?: string; id?: string; brightness?: string; strength?: string }>;
      minorStars?: Array<{ name?: string; id?: string; brightness?: string; strength?: string }>;
      adjectiveStars?: Array<{ name?: string; id?: string; brightness?: string; strength?: string }>;
    }>;
  } | undefined;
  const palaces = ziwei?.palaces;
  if (!Array.isArray(palaces)) return out;
  const palaceNameZh = (PALACE_ID_TO_NAME as Record<string, string>)[palaceId];
  if (!palaceNameZh) return out;
  const withSuffix = palaceNameZh.endsWith("宮") ? palaceNameZh : `${palaceNameZh}宮`;
  const arrIdx = findZiweiPalaceSlotIndexForCanonical(chartJson, withSuffix);
  const p = arrIdx != null && arrIdx < palaces.length ? palaces[arrIdx] : undefined;
  if (!p) return out;
  const collect = (arr: Array<{ name?: string; id?: string; brightness?: string; strength?: string }> | undefined) => {
    if (!Array.isArray(arr)) return;
    for (const star of arr) {
      const raw = star?.brightness ?? star?.strength;
      if (typeof raw !== "string" || !raw.trim()) continue;
      const key = raw.trim().toLowerCase();
      const zh = BRIGHTNESS_TO_ZH[key] ?? raw;
      const name = (star?.name ?? star?.id ?? "").trim();
      if (name) out[name] = zh;
    }
  };
  collect(p?.majorStars);
  collect(p?.minorStars);
  collect(p?.adjectiveStars);
  return out;
}

/** S17 讀者宮位敘事：starByPalace 無亮度時，自 ziwei.palaces 合併每顆星的 brightness／strength（含 iztro miao/wang） */
function mergeZiweiBrightnessIntoPalaceRaw(
  raw: PalaceRawInput,
  chartJson: Record<string, unknown>,
  palaceCanon: string
): PalaceRawInput {
  const canon = (palaceCanon ?? "").trim();
  if (!canon) return raw;
  const withSuffix = canon.endsWith("宮") ? canon : `${canon}宮`;
  const palaceId =
    (PALACE_NAME_ZH_TO_ID as Record<string, string>)[withSuffix] ??
    (PALACE_NAME_ZH_TO_ID as Record<string, string>)[canon.replace(/宮$/, "")];
  if (!palaceId) return raw;
  const fromChart = getPalaceStarsStrengthMap(chartJson, palaceId);
  if (Object.keys(fromChart).length === 0) return raw;
  type B = "廟" | "旺" | "得" | "平" | "陷";
  const merged: Record<string, B> = { ...(raw.brightness as Record<string, B> | undefined) };
  for (const [k, v] of Object.entries(fromChart)) {
    if (v === "不" || !v?.trim()) continue;
    const zh = (v === "利" ? "得" : v) as B | "不";
    if (zh === "不") continue;
    merged[k] = zh as B;
  }
  return Object.keys(merged).length > 0 ? { ...raw, brightness: merged } : raw;
}

// ============ 純紫微＋五行：共用宮位 context（GPT 版與技術版同一套底層） ============

export interface PalaceStarInfo {
  code: string;
  name: string;
  strength?: string;
  meaningInPalace?: string;
  baseMeaning?: string;
  /** 輔星／煞星／雜曜專用：該星在該宮的「行動建議」（可執行方針） */
  actionAdvice?: string;
}

export interface PalaceContext {
  palaceKey: string;
  palaceName: string;
  stars: PalaceStarInfo[];
  loopSnippet?: string;
  hpSnippet?: string;
}

/** 全盤章節（無單一宮位）：不顯示宮位、不填 palace placeholder。s20 例外，綁夫妻宮。 */
const GLOBAL_SECTION_KEYS_NO_PALACE = new Set<string>(["s15", "s15a", "s16", "s17", "s18", "s19", "s21"]);

/** sectionKey → 該題使用的宮位 key（命宮、財帛…）。s15/s16/s17-s19/s21 為全盤章節回傳 undefined；s20 回傳夫妻；s04 不綁宮位。 */
function getPalaceKeyForSection(sectionKey: string): string | undefined {
  if (sectionKey === "s04") return undefined;
  if (GLOBAL_SECTION_KEYS_NO_PALACE.has(sectionKey)) return undefined;
  const template = SECTION_TEMPLATES.find((t) => t.section_key === sectionKey);
  const focus = template?.palace_focus?.[0];
  if (focus) return focus === "命宮" ? "命宮" : focus.replace(/宮$/, "") === "命" ? "命宮" : focus;
  if (["s00", "s02", "s03"].includes(sectionKey)) return "命宮";
  return undefined;
}

/**
 * 共用宮位 context：星曜、亮度（廟旺利陷）、迴路、高壓（無十神／五行／心識）。不分 GPT／技術版，都從這裡拿資料。
 * 短期內不使用任何原型（archetype）欄位。
 */
export function buildPalaceContext(
  sectionKey: string,
  chartJson: Record<string, unknown>,
  config: LifeBookConfig | null | undefined,
  content: AssembleContentLookup,
  contentLocale: "zh-TW" | "zh-CN" | "en" = "zh-TW"
): PalaceContext | null {
  let palaceKey = getPalaceKeyForSection(sectionKey);
  // s15/s16 已改為不綁單宮（大限導讀／流年小限），不再用 decadal/year 宮位灌入星曜
  // 宮位 key 與 PALACE_NAME_ZH_TO_ID 對齊（命宮保留，其餘用「財帛」不含宮）
  if (palaceKey && palaceKey !== "命宮" && palaceKey.endsWith("宮")) {
    palaceKey = palaceKey.slice(0, -1);
  }
  const tryPalaceId = (key: string) =>
    (PALACE_NAME_ZH_TO_ID as Record<string, string>)[key] ?? (PALACE_NAME_ZH_TO_ID as Record<string, string>)[key.replace(/宮$/, "") === "命" ? "命宮" : key.replace(/宮$/, "")];
  const palaceId = palaceKey ? tryPalaceId(palaceKey) : undefined;
  if (!palaceId) return null;

  const assembleInput = buildAssembleInput(chartJson, config ?? undefined, contentLocale);
  const riskProfile = assembleRiskProfile(assembleInput);
  const { loopSnippets, highPressureSnippets } = resolveAssembleSnippets(riskProfile, content);

  const palaceNameRaw = (PALACE_ID_TO_NAME as Record<string, string>)[palaceId] ?? palaceKey ?? "";
  const palaceName = palaceNameRaw.endsWith("宮") ? palaceNameRaw : palaceNameRaw + "宮";

  const starIds = (assembleInput.starByPalace as Partial<Record<string, unknown>> | undefined)?.[palaceId] ?? [];
  const strengthFirst = getPalaceStarStrength(chartJson, palaceId);
  const strengthByStar = getPalaceStarsStrengthMap(chartJson, palaceId);

  const contentStars = (content as Record<string, unknown>).stars as Record<string, string> | undefined;
  const stars: PalaceStarInfo[] = (Array.isArray(starIds) ? starIds : []).map((starId, i) => {
    const code = String(starId);
    const name = (STAR_ID_TO_NAME as Record<string, string>)[starId] ?? code;
    const starPalaceKey = `${name}_${palaceName}`;
    const palaceShort = palaceName.replace(/宮$/, "") === "命" ? "命宮" : palaceName.replace(/宮$/, "");
    const starPalaceKeyShort = `${name}_${palaceShort}`;
    const meaningInPalace =
      content.starPalacesMain?.[starPalaceKey] ??
      content.starPalacesMain?.[starPalaceKeyShort] ??
      content.starPalaces?.[starPalaceKey] ??
      content.starPalaces?.[starPalaceKeyShort] ??
      content.starPalacesAux?.[starPalaceKey] ??
      content.starPalacesAux?.[starPalaceKeyShort] ??
      undefined;
    const actionAdvice =
      content.starPalacesAuxAction?.[starPalaceKey] ??
      content.starPalacesAuxAction?.[starPalaceKeyShort] ??
      undefined;
    const baseMeaning =
      content.starBaseCore?.[starId] ??
      (content as { starBaseMeaning?: Record<string, string> }).starBaseMeaning?.[name] ??
      (contentStars && typeof contentStars[name] === "string" ? contentStars[name] : undefined);
    const strength = strengthByStar[name] ?? strengthByStar[code] ?? (i === 0 ? strengthFirst : undefined);
    return {
      code,
      name,
      strength,
      meaningInPalace,
      baseMeaning,
      actionAdvice,
    };
  });

  const loopSnippet = loopSnippets.length > 0 ? loopSnippets.join("\n") : undefined;
  const hpSnippet = highPressureSnippets.length > 0 ? highPressureSnippets.join("\n") : undefined;

  return {
    palaceKey: palaceId,
    palaceName,
    stars,
    loopSnippet,
    hpSnippet,
  };
}

/** 四化引擎 debug 陣列 → 命書技術區塊用字串（ruleId、evidenceCount、causalityMatch、diagnostics） */
function formatS00DebugFromEngine(
  debug: Array<{ ruleId: string; evidenceCount: number; causalityMatch?: boolean; payload?: Record<string, unknown> }>,
  diagnostics?: { missingFields: unknown[]; unresolvedPalaceKey: string[]; unresolvedStarName: string[]; emptyReason?: string }
): string {
  const blocks: string[] = [];
  for (const d of debug) {
    const key = (d.payload?.canonicalKey as string) ?? "";
    const cm = d.causalityMatch !== undefined ? ` causalityMatch=${d.causalityMatch}` : "";
    blocks.push(`【${d.ruleId}】 evidenceCount=${d.evidenceCount}${cm} | ${key}`);
  }
  if (diagnostics) {
    if (diagnostics.missingFields.length > 0) {
      blocks.push("【diagnostics.missingFields】");
      for (const m of diagnostics.missingFields) {
        const x = m as { eventIndex?: number; fields: string[] };
        blocks.push(`  eventIndex=${x.eventIndex ?? "?"} fields=${(x.fields ?? []).join(",")}`);
      }
    }
    if (diagnostics.unresolvedPalaceKey.length > 0) blocks.push("【diagnostics.unresolvedPalaceKey】 " + diagnostics.unresolvedPalaceKey.join(", "));
    if (diagnostics.unresolvedStarName.length > 0) blocks.push("【diagnostics.unresolvedStarName】 " + diagnostics.unresolvedStarName.join(", "));
    if (diagnostics.emptyReason) blocks.push("【emptyReason】 " + diagnostics.emptyReason);
  }
  return blocks.join("\n");
}

/** 從 PalaceContext 組出給骨架用的 placeholder map（星曜、亮度廟旺利陷、四化、三方四正、迴路、高壓，無十神／五行／心識）；s15a 需傳 content/config/contentLocale 以產出每宮本命摘要與感受／建議。forTechnicalOutput=true 時才附加「（風險N）」等引擎數據，AI/讀者版不顯示。 */
export function getPlaceholderMapFromContext(
  ctx: PalaceContext | null,
  opts?: {
    chartJson?: Record<string, unknown>;
    sectionKey?: string;
    content?: AssembleContentLookup;
    config?: LifeBookConfig | null;
    contentLocale?: "zh-TW" | "zh-CN" | "en";
    /** 僅技術／專家版為 true；AI 渲染版與讀者版為 false/undefined，不顯示風險等級等引擎數據 */
    forTechnicalOutput?: boolean;
    /** 為 true 或未傳時不輸出具體四化流向（驗證通過後傳 false） */
    flowsNotVerified?: boolean;
    /** P2：單宮四化摘要只讀 findings（sihuaPlacementItems / natalFlowItems） */
    findings?: LifebookFindings;
    /** V2 Batch 1：s15a 優先讀 stackSignals / timeWindowScores / eventProbabilities */
    findingsV2?: LifebookFindingsV2;
    /** 統一架構：若提供則 S17/S18/S19 用 buildPalaceOverlayFromNormalizedChart，否則 fallback buildPalaceOverlay(chartJson) */
    normalizedChart?: NormalizedChart;
  }
): Record<string, string> {
  const map: Record<string, string> = {};
  let s15aV2Usable = false;
  let s16V2Usable = false;
  const forTechnical = opts?.forTechnicalOutput === true;
  // 全盤章節（s15/s16/s17-s19/s21）無宮位：不顯示宮位，palace 相關 placeholder 填空字串
  if (!ctx && opts?.sectionKey && GLOBAL_SECTION_KEYS_NO_PALACE.has(opts.sectionKey)) {
    map.palace = "";
    map.palaceName = "";
  }
  // 命書已全面移除五行、心識、十神；若舊版模板仍含這些 placeholder，一律替換為空字串，避免出現「（此欄位資料不足）」。
  map.wuxingEnergyLabel = "";
  map.wuxingEnergyShadow = "";
  map.sixSense = "";
  map.tenGod = "";
  map.tenGodBehavior = "";
  if (opts?.chartJson) {
    const sihuaContext = buildSiHuaContext(opts.chartJson, opts.findings);
    map.benMingSiHuaList = sihuaContext.benMingSiHuaList;
    map.daXianSiHuaList = sihuaContext.daXianSiHuaList;
    map.liuNianSiHuaList = sihuaContext.liuNianSiHuaList;
    map.benMingLuStars = sihuaContext.benMingLuStars;
    map.benMingJiStars = sihuaContext.benMingJiStars;
    map.daXianLuStars = sihuaContext.daXianLuStars;
    map.daXianJiStars = sihuaContext.daXianJiStars;
    map.liuNianLuStars = sihuaContext.liuNianLuStars;
    map.liuNianJiStars = sihuaContext.liuNianJiStars;
    map.sihuaGlobalSummary = sihuaContext.sihuaGlobalSummary;
    if (ctx?.palaceName) {
      const p = ctx.palaceName;
      map.sihuaFlowForPalace = sihuaContext.perPalaceFlow[p] ?? sihuaContext.perPalaceFlow[p.replace(/宮$/, "")] ?? sihuaContext.perPalaceFlow[p.replace(/宮$/, "") + "宮"] ?? "（此宮暫無四化飛星摘要）";
    }
  }
  if (ctx) {
    const isPalaceSection = opts?.sectionKey != null && PALACE_SECTION_KEYS.has(opts.sectionKey);
    const emptyFallback = isPalaceSection || !forTechnical ? "" : MISSING_PLACEHOLDER;
    const palaceShort = ctx.palaceName.replace(/宮$/, "") === "命" ? "命宮" : ctx.palaceName.replace(/宮$/, "");
    const auxRisk = forTechnical ? opts?.content?.starPalacesAuxRisk : undefined;
    const getRiskSuffix = (starName: string): string => {
      if (!auxRisk || typeof auxRisk !== "object") return "";
      const r = auxRisk[`${starName}_${palaceShort}`] ?? auxRisk[`${starName}_${ctx.palaceName}`];
      return typeof r === "number" && r >= 1 && r <= 5 ? `（風險${r}）` : "";
    };

    map.palace = ctx.palaceName;
    map.palaceName = ctx.palaceName;
    map.loopSnippet = ctx.loopSnippet ?? "";
    map.loopSnippets = ctx.loopSnippet ?? "";
    map.hpSnippet = ctx.hpSnippet ?? "";
    map.highPressureSnippets = ctx.hpSnippet ?? "";
    const chartJson = opts?.chartJson;
    const findingsForSihua = opts?.findings ?? createEmptyFindings();
    // Phase 5B-2：12 宮正文四化／飛化只讀 Findings；無 findings 時保留 chart 相容路徑。
    const getNatalSihua =
      opts?.findings != null
        ? (starName: string) => getNatalSihuaForStarFromFindings(starName, findingsForSihua)
        : chartJson
          ? (starName: string) => getNatalSihuaForStar(starName, chartJson)
          : () => "";
    const narrativeContent = opts?.content as NarrativeContentLookup | undefined;
    map.palaceStarsOnlySnippet =
      ctx.stars.length > 0 && isPalaceSection
        ? buildPalaceStarNarrativeBlock(
            { palaceName: ctx.palaceName, stars: ctx.stars },
            { getNatalSihua, content: narrativeContent }
          )
        : ctx.stars.length > 0
          ? (() => {
              const pureStarLines = ctx.stars.map((s) => {
                const natalSihua =
                  opts?.findings != null
                    ? getNatalSihuaForStarFromFindings(s.name, findingsForSihua)
                    : chartJson
                      ? getNatalSihuaForStar(s.name, chartJson)
                      : "";
                const base = (s.baseMeaning ?? "").trim();
                const inPalace = (s.meaningInPalace ?? "").trim();
                const action = (s.actionAdvice ?? "").trim();
                const blocks = [
                  [s.name, s.strength ? `（${s.strength}）` : "", natalSihua].filter(Boolean).join(" "),
                  base,
                  inPalace ? `【此宮表現】\n${inPalace}` : "",
                  action ? `【行動建議】\n${action}` : "",
                ].filter(Boolean);
                return blocks.join("\n\n");
              });
              return pureStarLines.join("\n\n---\n\n");
            })()
          : emptyFallback;
    // 星曜＋亮度（廟旺利陷）列表（無十神）；有風險等級時在星名後標注
    const starLines = ctx.stars.map((s) => {
      const riskSuffix = getRiskSuffix(s.name);
      const nameWithRisk = riskSuffix ? `${s.name}${riskSuffix}` : s.name;
      const parts = [nameWithRisk];
      if (s.strength) parts.push(`亮度：${s.strength}`);
      const desc = (s.meaningInPalace ?? s.baseMeaning ?? "").trim() || (isPalaceSection || !forTechnical ? "" : MISSING_PLACEHOLDER);
      const line = desc ? `- ${parts.join("，")}：${desc}` : `- ${parts.join("，")}`;
      return s.actionAdvice ? `${line}\n  【行動建議】${s.actionAdvice}` : line;
    });
    map.palaceAllStarsSnippet = starLines.length > 0 ? starLines.join("\n") : emptyFallback;
    map.palaceStarStructureSnippet =
      ctx.stars.length > 0
        ? ctx.stars.map((s) => {
            const riskSuffix = getRiskSuffix(s.name);
            const nameWithRisk = riskSuffix ? `${s.name}${riskSuffix}` : s.name;
            return `${nameWithRisk}${s.strength ? `（${s.strength}）` : ""}${s.meaningInPalace ? "：" + s.meaningInPalace.split(/[。\n]/)[0] : ""}`;
          }).join("；")
        : emptyFallback;
    map.sanfangSizheng = getSanfangSizheng(ctx.palaceName);
    map.sanFangSiZhengPalaces = map.sanfangSizheng;
    map.palacePureStarsBlock = map.palaceStarsOnlySnippet;
    map.palaceStarDetailBlock = map.palaceStarsOnlySnippet;
    map.palaceStarTenGodBlock = map.palaceAllStarsSnippet;
    // 本宮四化摘要（只讀 Findings；有傳 findings 時不得以 createEmptyFindings() 覆蓋）
    map.sihuaFlowSummary = buildSihuaFlowSummary({
      currentPalace: ctx.palaceName ?? "",
      findings: opts?.findings ?? createEmptyFindings(),
    });
    map.fourTransformationsFlowBlock = map.sihuaFlowSummary;

    // 12 宮共通區塊：palaceOverview / 【星曜介紹】= palaceCoreTraits（逐一列出星曜介紹）/ 【星曜在本宮表現】= palaceStarBehavior / palaceSanFangAnalysis / palaceStarCombinationAnalysis / palaceAdvice
    if (isPalaceSection && ctx) {
      const palaceName = ctx.palaceName ?? "";
      map.palaceContextBlock = buildPalaceContextThreeLines(palaceName, opts?.content as NarrativeContentLookup | undefined) || "此宮反映你在這個領域的慣性與表現。";
      map.palaceStarNarrativeBlock = (map.palaceStarsOnlySnippet ?? "").trim() || "（本宮星曜說明見上方列表。）";
      map.palaceOverview = map.palaceContextBlock;
      map.palaceCoreTraits = buildPalaceStarIntroBlock(
        { palaceName: ctx.palaceName ?? "", stars: ctx.stars },
        { content: opts?.content as NarrativeContentLookup | undefined }
      ) || "（本宮無星曜資料。）";
      map.palaceStarBehavior = (map.palaceStarsOnlySnippet ?? "").trim() || "（本宮星曜說明見上方列表。）";
      map.palaceSanFangAnalysis = buildSanFangAnalysis(palaceName);
      map.palaceStarCombinationAnalysis = buildStarCombinationAnalysis(palaceName, opts?.findings);
      const facadeForPalace = createNarrativeFacade(opts?.content as NarrativeContentLookup | undefined);
      const mainStarsForAdvice = ctx.stars.filter((s) => MAIN_STAR_NAMES.has(s.name)).slice(0, 2);
      const adviceParts: string[] = [];
      for (const star of mainStarsForAdvice) {
        const starSem = facadeForPalace.getStarSemantic(star.name);
        const inPalaceBlock = facadeForPalace.getStarInPalaceSemantic(star.name, palaceName);
        const risk = (starSem.risk ?? "").trim();
        const advice = (starSem.advice ?? "").trim();
        const actionAdvice = (inPalaceBlock.actionAdvice ?? "").trim();
        if (risk) adviceParts.push(risk);
        if (advice) adviceParts.push(advice);
        if (actionAdvice) adviceParts.push(actionAdvice);
      }
      const joined = adviceParts.filter(Boolean).join("。").replace(/。+/g, "。").trim();
      const adviceText = joined.replace(/^\u3002+|\u3002+$/g, "");
      map.palaceAdviceBlock =
        adviceText.length > 0 ? adviceText + "\u3002" : "可對照本宮星曜特質與四化引動，留意節奏與界線。";
      map.palaceAdvice = map.palaceAdviceBlock;
    }

    // 命宮試點：保留 mingGong* 以相容舊引用（s02 已改為使用 palace*）
    const isMingGong = (ctx.palaceName ?? "").replace(/宮$/, "") === "命" || ctx.palaceName === "命宮";
    if (isMingGong) {
      const facade = createNarrativeFacade(opts?.content as NarrativeContentLookup | undefined);
      const palaceBlock = facade.getPalaceSemantic("命宮");
      const core = (palaceBlock.core ?? "").trim();
      const context = (palaceBlock.context ?? "").trim();
      const theme = (palaceBlock.theme ?? "").trim();
      const parts: string[] = [];
      if (core) parts.push(`命宮掌管的是${core}。`);
      const contextOverlapsCore =
        context &&
        core &&
        (core.includes(context) ||
          context.includes(core) ||
          ["個性", "人生方向", "自我定位", "定位"].some((kw) => core.includes(kw) && context.includes(kw)));
      if (theme && theme !== core) parts.push(theme);
      if (context && !contextOverlapsCore) parts.push(`在你的「${context}」中，這一宮最能反映你的慣性與方向感。`);
      map.mingGongContext = parts.length > 0 ? parts.join(" ") : "命宮反映你的自我定位與人生方向。";
      map.mingGongStarNarrative = (map.palaceStarsOnlySnippet ?? "").trim() || "（本宮星曜說明見上方列表。）";
      map.mingGongSihuaSummary = buildMingGongSihuaPlacementOnly(opts?.findings ?? createEmptyFindings());
      const mainStarsForAdvice = ctx.stars.filter((s) => MAIN_STAR_NAMES.has(s.name)).slice(0, 2);
      const adviceParts: string[] = [];
      for (const star of mainStarsForAdvice) {
        const starSem = facade.getStarSemantic(star.name);
        const inPalace = facade.getStarInPalaceSemantic(star.name, "命宮");
        const risk = (starSem.risk ?? "").trim();
        const advice = (starSem.advice ?? "").trim();
        const actionAdvice = (inPalace.actionAdvice ?? "").trim();
        if (risk) adviceParts.push(risk);
        if (advice) adviceParts.push(advice);
        if (actionAdvice) adviceParts.push(actionAdvice);
      }
      const joined = adviceParts.filter(Boolean).join("。").replace(/。+/g, "。").trim();
      const adviceText = joined.replace(/^\u3002+|\u3002+$/g, ""); // 去掉首尾全形句號
      map.mingGongAdvice =
        adviceText.length > 0 ? adviceText + "\u3002" : "可對照本宮星曜特質與四化引動，留意節奏與界線。";
    }

    // 12 宮 4 區塊骨架：不再輸出【本宮四化提示】與證據塊，一律留空避免幽靈區塊殘留
    if (isPalaceSection) {
      map.palaceGlobalLinkHints = "";
      map.palaceSiHuaHints = "";
    }

    // 12 宮專用：宮位核心定義、主星星系區塊（有資料才一段）、主星／輔星／煞星摘要、亮度區塊、Phase 2 風險與主敘事
    if (isPalaceSection && opts?.sectionKey) {
      const template = SECTION_TEMPLATES.find((t) => t.section_key === opts.sectionKey);
      map.palaceCoreMeaning = template?.description ?? "";
      map.palaceCoreDefinition =
        (ctx.palaceName && map.palaceCoreMeaning)
          ? `${ctx.palaceName} 掌管你的 ${map.palaceCoreMeaning}。這一宮反映你在這個領域「最自然的慣性」與「成熟後的力量」。`
          : "";
      let mainStars = ctx.stars.filter((s) => MAIN_STAR_NAMES.has(s.name));
      const shaStars = ctx.stars.filter((s) => SHA_STAR_NAMES.has(s.name));
      const assistantStars = ctx.stars.filter((s) => !MAIN_STAR_NAMES.has(s.name) && !SHA_STAR_NAMES.has(s.name));
      const starLabel = (s: { name: string; strength?: string }) => {
        const r = getRiskSuffix(s.name);
        return s.name + (r ? r : "") + (s.strength ? `（${s.strength}）` : "");
      };
      const content = opts?.content;
      const metadata = content?.starMetadata as StarMetadataInput | undefined;
      const auxRisk = content?.starPalacesAuxRisk;
      if (metadata?.starNameZhToId && metadata?.stars && ctx.stars.length > 0) {
        const result = aggregatePalaceWeightRisk(
          ctx.stars.map((s) => ({ name: s.name, strength: s.strength })),
          ctx.palaceName,
          metadata,
          auxRisk
        );
        const riskKey = `riskLevel_${result.riskLevel}` as const;
        map.palaceRiskSummary = content?.palaceRiskSummary?.[riskKey] ?? "";
        map.palaceActionAdvice = content?.palaceActionAdvice?.[riskKey] ?? "";
        const sum = (map.palaceRiskSummary ?? "").trim();
        const adv = (map.palaceActionAdvice ?? "").trim();
        map.palaceRiskReminderBlock = sum && adv ? "\n\n【此宮提醒】\n\n" + sum + "\n\n" + adv : "";
        map.palaceRiskLevel = String(result.riskLevel);
        if (result.mainStars.length > 0) {
          map.palaceMainStarSummary = result.mainStars.map((s) => starLabel(s)).join("、");
          const leadName = result.mainStars[0].name;
          mainStars = [...mainStars].sort((a, b) => {
            if (a.name === leadName) return -1;
            if (b.name === leadName) return 1;
            const aIdx = result.mainStars.findIndex((m) => m.name === a.name);
            const bIdx = result.mainStars.findIndex((m) => m.name === b.name);
            if (aIdx >= 0 && bIdx < 0) return -1;
            if (aIdx < 0 && bIdx >= 0) return 1;
            return aIdx - bIdx;
          });
        }
      } else {
        map.palaceRiskSummary = "";
        map.palaceActionAdvice = "";
        map.palaceRiskReminderBlock = "";
        map.palaceRiskLevel = "";
        map.palaceMainStarSummary = "";
      }
      map.mainStarsSummary =
        mainStars.length > 0
          ? mainStars.map((s) => starLabel(s)).join("、") + " — 主線劇本（人格／行動／世界觀）"
          : "無";
      map.assistantStarsSummary =
        assistantStars.length > 0
          ? assistantStars.map((s) => starLabel(s)).join("、") + " — 修補／補強／加成"
          : "無";
      map.shaStarsSummary =
        shaStars.length > 0
          ? shaStars.map((s) => starLabel(s)).join("、") + " — 壓力／推動／事件加速器"
          : "無";
      const starsWithStrength = ctx.stars.filter((s) => s.strength && String(s.strength).trim());
      map.brightnessBlock =
        starsWithStrength.length > 0
          ? starsWithStrength.map((s) => `${s.name}${getRiskSuffix(s.name)}（${s.strength}）`).join("\n")
          : "";
      map.brightnessBlockOptional = map.brightnessBlock;
      const brightnessExplanation =
        opts?.sectionKey === "s02" && map.brightnessBlock.length > 0
          ? "\n\n亮度說明：廟旺＝成熟型、得位；利平＝中性型；陷＝不成熟型，需後天修正。亮度高的星成為優勢，低的星形成本宮盲區。"
          : "";
      map.brightnessSectionOptional =
        map.brightnessBlock.length > 0
          ? "【亮度（廟旺利平陷）】\n\n" + map.brightnessBlock + brightnessExplanation
          : "";
      map.pureStarListBlock = map.palaceStarsOnlySnippet;
      map.palaceStarStructureBlock = map.palaceStarsOnlySnippet;
      map.fourTransformSummaryForPalace = map.sihuaFlowSummary ?? "";

      // 敘事型模板用：有主星則主星定調；無主星則以首星為主要能量來源，絕不輸出「此宮無主星資料」
      const leadStars = mainStars.slice(0, 2);
      const firstStar = ctx.stars[0];
      if (mainStars.length > 0) {
        map.mainStarsLeadBlock =
          leadStars.length === 1
            ? "本宮由 " + starLabel(leadStars[0]) + " 定調。"
            : "本宮由 " + leadStars.map((s) => starLabel(s)).join("、") + " 定調。";
      } else if (firstStar) {
        map.mainStarsLeadBlock = `此宮沒有主星，但「${firstStar.name}」仍會成為主要能量來源。`;
      } else {
        map.mainStarsLeadBlock = "";
      }
      if (assistantStars.length > 0 && shaStars.length > 0) {
        map.assistantStarsNarrative = "輔星帶來修補與加成，煞星則推動或加壓，共同形成此宮的慣性。";
      } else if (assistantStars.length > 0) {
        map.assistantStarsNarrative = "輔星在此宮帶來修補與加成，有助穩定發揮。";
      } else if (shaStars.length > 0) {
        map.assistantStarsNarrative = "煞星在此宮帶來推動或壓力，可轉化為行動力。";
      } else {
        map.assistantStarsNarrative = "此宮由主星與四化主導，輔煞影響較小。";
      }
      const rawSihua = map.sihuaFlowSummary ?? "";
      map.sihuaNarrativeBlock =
        !rawSihua || rawSihua.includes("暫無") || rawSihua.includes("皆無明顯")
          ? "此宮雖未被本命四化直接點亮，但仍會透過三方四正與大限、流年被牽動。可對照全盤主戰場與能量流向一起理解。"
          : rawSihua;

      // 十二宮共用：主星亮度敘事（廟/旺/利/平/陷）
      if (isPalaceSection && mainStars.length > 0) {
        const lead = mainStars[0];
        const palaceSeed =
          (ctx?.palaceName ?? "").length + (lead?.name ?? "").length + (map.assistantStarsSummary ?? "").length;
        map.mainStarsBrightnessNarrative = buildBrightnessNarrative(
          lead?.name ?? "",
          lead?.strength ?? null,
          palaceSeed + 1
        );
      } else if (isPalaceSection) {
        map.mainStarsBrightnessNarrative = "";
      }

      // 十二宮解盤式敘事（宮位通用 placeholder）：宮位核心、主星四段、輔煞整合、三方四正、四化觸發
      map.palaceStarOpening = "";
      map.palaceStarStrength = "";
      map.palaceStarTension = "";
      map.palaceStarMature = "";
      map.palaceStarNarrative = "";
      map.palaceTransformNarrative = "";
      map.palaceSanfangInsight = "";
      map.palaceChartClue = "";
      const palaceKeyForNarrative = getPalaceKeyForSection(opts?.sectionKey ?? "");
      if (isPalaceSection && palaceKeyForNarrative) {
        const leadStar = mainStars[0] ?? ctx.stars[0];
        const leadMainStarName = leadStar?.name ?? "";
        const seed =
          (ctx?.palaceName ?? "").length + leadMainStarName.length + (map.assistantStarsSummary ?? "").length;
        const contentRecord = opts?.content as Record<string, unknown> | undefined;
        const starBaseCore = contentRecord?.starBaseCore as Record<string, string> | undefined;
        const starPalacesMain = contentRecord?.starPalacesMain as Record<string, string> | undefined;
        const starPalacesAux = contentRecord?.starPalacesAux as Record<string, string> | undefined;
        map.palaceCoreDefinition = pickPalaceCoreDefinition(palaceKeyForNarrative, seed);
        map.assistantStarsNarrative = buildPalaceAssistantNarrative(
          assistantStars.map((s) => s.name),
          shaStars.map((s) => s.name)
        );
        const palaceStarOpts = { starBaseCore, starPalacesMain, starPalacesAux };
        if (!leadMainStarName) {
          const palaceName = ctx?.palaceName ?? palaceKeyForNarrative + "宮";
          map.palaceStarOpening = `${palaceName}描述的是你在這個領域最自然的節奏與反應方式。`;
          map.palaceStarStrength = "";
          map.palaceStarTension = "";
          map.palaceStarMature = "";
        } else {
          map.palaceStarOpening = buildPalaceStarNarrative(leadMainStarName, palaceKeyForNarrative, "opening", palaceStarOpts);
          map.palaceStarStrength = buildPalaceStarNarrative(leadMainStarName, palaceKeyForNarrative, "strength", palaceStarOpts);
          map.palaceStarTension = buildPalaceStarNarrative(leadMainStarName, palaceKeyForNarrative, "tension", palaceStarOpts);
          map.palaceStarMature = buildPalaceStarNarrative(leadMainStarName, palaceKeyForNarrative, "mature", palaceStarOpts);
        }
        map.palaceStarNarrative = map.palaceStarOpening;
        map.palaceSanfangInsight = getPalaceSanfangInsight(
          palaceKeyForNarrative,
          leadMainStarName,
          seed + 2,
          opts?.content,
          opts?.chartJson ?? undefined
        );
        map.palaceTransformNarrative = getPalaceTransformNarrativeByPriority(
          opts.chartJson ?? undefined,
          palaceKeyForNarrative,
          leadMainStarName
        );
        if (palaceKeyForNarrative === "命宮" && !(map.palaceTransformNarrative ?? "").trim()) {
          map.palaceTransformNarrative = (map.sihuaNarrativeBlock ?? "").trim()
            || "此宮雖未被本命四化直接點亮，但仍會透過三方四正與大限、流年被牽動。可對照全盤主戰場與能量流向一起理解。";
        }
        if (mainStars.length > 0) {
          map.palaceChartClue = "主星定調此宮，並受三方與四化牽動。";
        } else if (ctx.stars.length > 0) {
          map.palaceChartClue = "此宮無主星，以首星為主要能量來源。";
        } else {
          map.palaceChartClue = "此宮重點來自四化流向與宮位互動。";
        }
      }
    }

    // 命宮／財帛／官祿專用：主星星系 placeholder（s02、s10、s08）；主星星系整段（無資料時為空，模板可省略整塊）
    const palaceKeyForSection = getPalaceKeyForSection(opts?.sectionKey ?? "");
    map.mainStarSystemBlock = "";
    if (
      palaceKeyForSection &&
      opts?.chartJson &&
      opts?.content?.starSanfangFamilies &&
      ["s10", "s08"].includes(opts?.sectionKey ?? "")
    ) {
      const sanfang = getSanfangFamilyForPalace(palaceKeyForSection, opts.chartJson, opts.content);
      if (sanfang) {
        map.sanfangMainStarName = sanfang.mainStarName;
        map.sanfangFamilyLabel = sanfang.familyLabel;
        if (palaceKeyForSection === "命宮" && sanfang.mingPattern) {
          map.sanfangFamilySummary = sanfang.mingPattern;
        } else if (palaceKeyForSection === "財帛" && sanfang.caiPattern) {
          map.sanfangFamilySummary = sanfang.caiPattern;
        } else if (palaceKeyForSection === "官祿" && sanfang.guanPattern) {
          map.sanfangFamilySummary = sanfang.guanPattern;
        } else if (sanfang.roleSummary) {
          map.sanfangFamilySummary = sanfang.roleSummary;
        }
        const companions =
          (sanfang as { coreStars?: string[] }).coreStars?.length
            ? (sanfang as { coreStars?: string[] }).coreStars!.join("、")
            : "相關主星";
        map.mainStarSystemBlock =
          "【主星星系視角】\n\n" +
          `你屬於「${map.sanfangFamilyLabel}」，由 ${map.sanfangMainStarName} 帶頭，三方多會帶 ${companions}。\n這種組合代表：${map.sanfangFamilySummary ?? ""}`.trim();
      }
    }
    if (isPalaceSection) {
      map.palaceOpeningBlock =
        (map.palaceCoreDefinition ?? "") + (map.mainStarSystemBlock ? "\n\n" + map.mainStarSystemBlock : "");
    }
  }
  if (opts?.sectionKey === "s03" && opts?.chartJson) {
    const locale = opts.contentLocale === "en" ? "en" : opts.contentLocale === "zh-CN" ? "zh-CN" : "zh-TW";
    const s03Ctx = buildS03GlobalContext(opts.chartJson, opts.config ?? null, locale);
    const s03Map = getS03PlaceholderMap(s03Ctx);
    for (const [k, v] of Object.entries(s03Map)) map[k] = v;
    const wholeCtx = buildWholeChartContext(opts.chartJson, opts.config ?? null, locale, { forTechnicalOutput: forTechnical });
    map.wholeChartMainlineBlock = wholeCtx.wholeChartMainlineBlock;
    map.starGroupStatsBlock = wholeCtx.rhythmNarrativeFull;
    map.siHuaPatternTopBlocks = wholeCtx.siHuaPatternTopBlocks;
    map.sihuaTopFlowsBlock = wholeCtx.sihuaTopFlowsBlock;
    map.loopSummaryBlock = wholeCtx.loopSummaryBlock;
    const stats = wholeCtx.starGroupStats;
    const rhythmStats = wholeCtx.rhythmStats;
    if (rhythmStats) {
      const four = buildRhythmNarrativeFourSegmentsV2(rhythmStats);
      const opening = "星曜分布顯示你的行動節奏與思考方式。";
      map.starClusterBehaviorSummary = [opening, four.segment1, four.segment2, four.segment3, four.segment4].join("\n\n");
      map.starEnergySummary = four.segment1;
      map.rhythmOperationMode = four.segment2;
      map.rhythmShadow = four.segment3;
      map.rhythmActionSuggestion = four.segment4;
    } else {
      const six = ["動星", "智星", "穩星", "權星", "財星", "情緒星"] as const;
      map.starEnergySummary = six.map((k) => `${k} ${(stats as Record<string, number>)[k] ?? 0}`).join("、");
    }
    const dominant = wholeCtx.dominantPalaces ?? [];
    const strongD = dominant.find((d) => d.tags.includes("祿疊") && !d.tags.includes("忌疊")) ?? dominant[0];
    const weakD = dominant.find((d) => d.tags.includes("忌疊")) ?? dominant[dominant.length - 1];
    const samePalace = strongD && weakD && toPalaceCanonical(strongD.palace) === toPalaceCanonical(weakD.palace);
    if (samePalace && strongD) {
      const palSem = getPalaceSemantic(strongD.palace);
      const core = palSem?.core ? `（${palSem.core}）` : "";
      map.strongPalace = `高槓桿但高敏感宮位：${strongD.palace}${core}。做得好會很強，失衡時也最容易出問題。`;
      map.weakPalace = "這個領域同時是你的強項與敏感點：做得好會非常突出，但失衡時也最容易出現壓力，因此需要特別留意節奏與界線。";
    } else {
      if (strongD) {
        const palSem = getPalaceSemantic(strongD.palace);
        const core = palSem?.core ? `（${palSem.core}）` : "";
        map.strongPalace = `${strongD.palace}${core}：吉星或主星集中，資源與機會較易在此宮。`;
      }
      if (weakD) {
        const palSem = getPalaceSemantic(weakD.palace);
        const core = palSem?.core ? `（${palSem.core}）` : "";
        map.weakPalace = `${weakD.palace}${core}：星曜較弱或煞星偏多，需刻意調整。`;
      }
    }
    const sihuaLayers = buildSiHuaLayers(opts.chartJson);
    const bm = sihuaLayers.benming;
    map.benmingSiHuaLine = formatSiHuaLine(bm);
    if (bm?.lu) {
      map.benmingLuStar = bm.lu.starName;
      map.benmingLuPalace = bm.lu.palaceName;
    }
    if (bm?.quan) {
      map.benmingQuanStar = bm.quan.starName;
      map.benmingQuanPalace = bm.quan.palaceName;
    }
    if (bm?.ke) {
      map.benmingKeStar = bm.ke.starName;
      map.benmingKePalace = bm.ke.palaceName;
    }
    if (bm?.ji) {
      map.benmingJiStar = bm.ji.starName;
      map.benmingJiPalace = bm.ji.palaceName;
    }
    const piercingS03 = buildPiercingDiagnosticBundle(opts.chartJson, opts.config ?? null);
    const t03 = piercingS03.tensions[0];
    const rc03 = piercingS03.rootCauses[0];
    const partsS03: string[] = [];
    if (t03) partsS03.push(t03.narrative);
    if (rc03) partsS03.push(rc03.narrative);
    const adviceS03 = rc03?.advice ?? t03?.advice ?? "";
    if (adviceS03) partsS03.push(adviceS03);
    map.s03PiercingDiagnosisBlock = partsS03.length > 0 ? partsS03.join("\n\n") : "";
  }
  if (opts?.sectionKey === "s00" && opts?.chartJson) {
    const localeS00 = opts.contentLocale === "en" ? "en" : opts.contentLocale === "zh-CN" ? "zh-CN" : "zh-TW";
    const wholeCtxS00 = buildWholeChartContext(opts.chartJson, opts.config ?? null, localeS00, { forTechnicalOutput: false });
    map.starGroupStatsBlock = wholeCtxS00.rhythmNarrativeBrief;
    const decadalLimits = opts.chartJson.decadalLimits as Array<{ startAge?: number; endAge?: number }> | undefined;
    const firstLimit = Array.isArray(decadalLimits) && decadalLimits.length > 0 ? decadalLimits[0] : null;
    const yearlyHoroscope = opts.chartJson.yearlyHoroscope as { year?: number } | undefined;
    map["flowYear.startAge"] = firstLimit?.startAge != null ? String(firstLimit.startAge) : S00_MISSING;
    map["flowYear.endAge"] = firstLimit?.endAge != null ? String(firstLimit.endAge) : S00_MISSING;
    map["flowYear.year"] = yearlyHoroscope?.year != null ? String(yearlyHoroscope.year) : S00_MISSING;
    map.decadalRangeText =
      firstLimit?.startAge != null && firstLimit?.endAge != null
        ? `${firstLimit.startAge}～${firstLimit.endAge}歲`
        : SIHUA_PLACEHOLDER_MISSING;
    map.flowYear = map["flowYear.year"] ?? S00_MISSING;

    const sihuaLayers = buildSiHuaLayers(opts.chartJson);
    map.benmingSiHuaLine = formatSiHuaLine(sihuaLayers.benming);
    map.decadalSiHuaLine = formatSiHuaLine(sihuaLayers.decadal);
    map.yearlySiHuaLine = formatSiHuaLine(sihuaLayers.yearly);

    const bm = sihuaLayers.benming;
    if (bm?.lu) {
      map.benmingLuStar = bm.lu.starName;
      map.benmingLuPalace = bm.lu.palaceName;
    }
    if (bm?.quan) {
      map.benmingQuanStar = bm.quan.starName;
      map.benmingQuanPalace = bm.quan.palaceName;
    }
    if (bm?.ke) {
      map.benmingKeStar = bm.ke.starName;
      map.benmingKePalace = bm.ke.palaceName;
    }
    if (bm?.ji) {
      map.benmingJiStar = bm.ji.starName;
      map.benmingJiPalace = bm.ji.palaceName;
    }

    const dl = sihuaLayers.decadal;
    if (dl?.lu) {
      map.decadalLuStar = dl.lu.starName;
      map.decadalLuPalace = dl.lu.palaceName;
    }
    if (dl?.quan) {
      map.decadalQuanStar = dl.quan.starName;
      map.decadalQuanPalace = dl.quan.palaceName;
    }
    if (dl?.ke) {
      map.decadalKeStar = dl.ke.starName;
      map.decadalKePalace = dl.ke.palaceName;
    }
    if (dl?.ji) {
      map.decadalJiStar = dl.ji.starName;
      map.decadalJiPalace = dl.ji.palaceName;
    }

    const yl = sihuaLayers.yearly;
    if (yl?.lu) {
      map.yearlyLuStar = yl.lu.starName;
      map.yearlyLuPalace = yl.lu.palaceName;
    }
    if (yl?.quan) {
      map.yearlyQuanStar = yl.quan.starName;
      map.yearlyQuanPalace = yl.quan.palaceName;
    }
    if (yl?.ke) {
      map.yearlyKeStar = yl.ke.starName;
      map.yearlyKePalace = yl.ke.palaceName;
    }
    if (yl?.ji) {
      map.yearlyJiStar = yl.ji.starName;
      map.yearlyJiPalace = yl.ji.palaceName;
    }

    const s00Events = buildS00EventsFromChart(opts.chartJson);
    const s00Hits = evaluateFourTransformPatterns(s00Events);
    const { hotStars, hotPalaces } = getHotStarsAndPalaces(s00Events);
    const piercingS00 = buildPiercingDiagnosticBundle(opts.chartJson, opts.config ?? null);
    const rc = piercingS00.rootCauses[0];
    const t0 = piercingS00.tensions[0];
    const linesS00: string[] = [];
    if (rc) {
      linesS00.push(rc.narrative);
      if (rc.advice) linesS00.push(rc.advice);
    } else if (t0) {
      linesS00.push(t0.narrative);
      if (t0.advice) linesS00.push(t0.advice);
    }
    const clueParts: string[] = [];
    if (rc) clueParts.push(`${rc.sourcePalace.replace(/宮$/, "")}忌入${rc.symptomPalace.replace(/宮$/, "")}`);
    if (t0 && t0.palaces?.length) clueParts.push(t0.palaces.map((p) => p.replace(/宮$/, "") + "為高壓宮").join("，"));
    map.s00PiercingDiagnosisBlock =
      linesS00.length > 0
        ? linesS00.slice(0, 4).join("\n\n") + (clueParts.length > 0 ? "\n\n命盤線索：" + clueParts.join("，") + "。" : "")
        : "";
    const narrative = formatPatternNarrative(s00Hits, 8);
    const actions = formatPatternActions(s00Hits, 3);
    map.s00PatternNarrative = narrative;
    map.s00PatternActions = actions;
    map.s00HotStars = hotStars.length > 0 ? hotStars.join("、") : "";
    map.s00HotPalaces = hotPalaces.length > 0 ? hotPalaces.join("、") : "";
    map.s00HotSummary =
      hotStars.length > 0 || hotPalaces.length > 0
        ? `本局重點星曜（多層命中）：${map.s00HotStars || "—"}；重點宮位（多層命中）：${map.s00HotPalaces || "—"}`
        : "";
    map.s00PatternBlock =
      narrative || actions
        ? ["【四化判讀】", narrative, "【今年建議】", actions].filter(Boolean).join("\n\n")
        : "";
    map.s00GlobalHighlights =
      s00Hits.length > 0
        ? ["【全盤結構重點】", "", renderPatternHitsForModuleOne(s00Hits, 5, { forTechnicalOutput: false })].join("\n")
        : "";
    map.s00NarrativeBlocks =
      s00Hits.length > 0
        ? renderPatternHitsForModuleOne(s00Hits, 5, { forTechnicalOutput: false })
        : "（本局四化重點見上方總表與下方判讀。）";

    if (opts.chartJson != null) {
      try {
        const rawEvents = buildS00EventsFromChart(opts.chartJson);
        const narrativeResult = generateNarrative(rawEvents);
        map.s00MainNarrative =
          narrativeResult.mainText || "（本局四化結構見下方技術區塊。）";
        map.s00DebugEvidence = formatS00DebugFromEngine(narrativeResult.debug, narrativeResult.diagnostics);
        const adviceFromEngine = buildDecisionAdviceFromHits(narrativeResult.mergedHits);
        const rawYearly =
          adviceFromEngine.length > 0
            ? adviceFromEngine.join("\n\n")
            : buildS00YearlyAdvice(
                map.s00HotStars ? map.s00HotStars.split("、").filter(Boolean) : [],
                map.s00HotPalaces ? map.s00HotPalaces.split("、").filter(Boolean) : []
              );
        map.s00YearlyAdvice = dedupeSentences(rawYearly);
        const { events: eventsForDominant } = normalizeSiHuaEventsLegacy(
          rawEvents as Parameters<typeof normalizeSiHuaEventsLegacy>[0]
        );
        const dominant = detectDominantPalaces({
          chartJson: opts.chartJson,
          config: opts.config ?? null,
          events: eventsForDominant,
        });
        map.s00DominantPalaces = formatDominantPalacesBlock(dominant);
        const archetype = detectLifeArchetype({
          dominantPalaces: dominant,
          hotPalaces,
          starGroupStats: wholeCtxS00.starGroupStats,
        });
        map.lifeArchetypeBlock = formatLifeArchetypeBlock(archetype);
      } catch (_err) {
        map.s00MainNarrative = "（本局四化結構見下方技術區塊。）";
        map.s00DebugEvidence = "";
        map.s00DominantPalaces = "";
        map.lifeArchetypeBlock = "";
        map.s00YearlyAdvice = buildS00YearlyAdvice([], []);
      }
    } else {
      map.s00MainNarrative = "（本局四化結構見下方技術區塊。）";
      map.s00DebugEvidence = "";
      map.s00DominantPalaces = "";
      map.lifeArchetypeBlock = "";
      map.s00YearlyAdvice = buildS00YearlyAdvice([], []);
    }
  }
  if (opts?.sectionKey === "s04" && opts?.config) {
    const cfg = opts.config;
    const ms = cfg.masterStars;
    const bp = cfg.bodyPalaceInfo;
    const rel = cfg.lifeBodyRelationSnippet;
    map.lifeLordName = ms?.命主?.name ?? "";
    map.lifeLordText = ms?.命主?.text ?? "";
    map.bodyLordName = ms?.身主?.name ?? "";
    map.bodyLordText = ms?.身主?.text ?? "";
    map.bodyPalaceName = bp?.palace ?? "";
    map.bodyPalaceTagline = bp?.tagline ?? "";
    map.bodyPalaceInterpretation = bp?.interpretation ?? "";
    map.lifeBodyRelationBlock = Array.isArray(rel) && rel.length > 0 ? rel.join("\n\n") : "";
    const seed = typeof opts?.chartJson?.yearlyHoroscope === "object" && opts.chartJson.yearlyHoroscope != null
      ? (opts.chartJson.yearlyHoroscope as { year?: number }).year ?? 0
      : 0;
    const destinyName = ms?.命主?.name ?? "";
    const bodyName = ms?.身主?.name ?? "";
    const bodyPalaceKey = bp?.palace ?? "";
    const destinySem = destinyName ? getStarSemantic(destinyName) : null;
    const bodySem = bodyName ? getStarSemantic(bodyName) : null;
    const bodyPalSem = bodyPalaceKey ? getPalaceSemantic(bodyPalaceKey) : null;
    map.destinyStarCore = destinySem ? `${destinyName}代表${destinySem.core}。` : "";
    map.bodyStarCore = bodySem ? `${bodyName}代表${bodySem.core}。` : "";
    map.bodyPalaceCore = bodyPalSem ? `${bodyPalaceKey?.endsWith("宮") ? bodyPalaceKey : bodyPalaceKey + "宮"}掌管${bodyPalSem.core}。` : "";
    map.bodyPalaceTension = "";
    const core = (map.bodyPalaceCore ?? "").trim();
    const tension = (map.bodyPalaceTension ?? "").trim();
    map.bodyPalaceFocusBlock = core && tension ? `${core}\n\n${tension}` : core || tension || "";
    map.destinyBodyDialogue = destinyName && bodyName ? buildDestinyBodyDialogue(destinyName, bodyName) : "";
    map.bodyPalaceAlignmentNarrative = bodyPalaceKey ? buildBodyPalaceAlignmentNarrative("命宮", bodyPalaceKey, seed) : "";
    map.s04StrategyBlock = (destinyName && bodyName && bodyPalaceKey)
      ? buildS04StrategyIntegrated(destinyName, bodyName, bodyPalaceKey)
      : "你真正要練的，是讓命主的方向感、身主的行動方式與身宮的體感場域彼此配合，而不是彼此拉扯。";
  }
  /**
   * Time module section key 清單（本檔多處使用，僅整理註解，TODO: 日後可考慮抽成常數或共用以減少不一致）：
   * - TIME_MODULE_SECTION_KEYS（本區塊）：全部時間模組但「不含 s15a」；用於大限／十年主線／decadalFourTransform 等。
   * - timeModuleKeys（getPlaceholderMapFromContext 下方）：全部時間模組「含 s15a」；用於 s15a/s16 V2、overlap、minor 表、keyYears。
   * - timeModuleYearKeys（同函式更下方）：全部時間模組「不含 s15a」；用於 flowYear、liunian、yearlyFourTransform、yearRoleInDecade（year logic）。
   * - TIME_MODULE_KEYS（getSectionTechnicalBlocks）：僅 s15,s15a,s16,s17；供 technical blocks 的 underlyingParams 與 skeleton missing 判定。
   * - timeModuleKeys（injectTimeModuleDataIntoSection）：同 getPlaceholderMapFromContext 的 timeModuleKeys，全部時間模組含 s15a。
   */
  const TIME_MODULE_SECTION_KEYS = ["s15", "s16", "s17", "s18", "s19", "s20", "s21"] as const;
  if (TIME_MODULE_SECTION_KEYS.includes(opts?.sectionKey as typeof TIME_MODULE_SECTION_KEYS[number]) && opts?.chartJson) {
    const decadalLimits = (opts.chartJson.decadalLimits ?? (opts.chartJson.ziwei as Record<string, unknown>)?.decadalLimits) as Array<{ palace?: string; startAge?: number; endAge?: number; stem?: string; mutagenStars?: Record<string, string> }> | undefined;
    if (Array.isArray(decadalLimits) && decadalLimits.length > 0) {
      const lines = decadalLimits.map((lim, i) => {
        const palace = lim.palace ?? `第${i + 1}大限`;
        const age = lim.startAge != null && lim.endAge != null ? `${lim.startAge}～${lim.endAge}歲` : "";
        const stem = lim.stem ?? "";
        const sihua = lim.mutagenStars && typeof lim.mutagenStars === "object"
          ? Object.entries(lim.mutagenStars)
            .filter(([, v]) => v)
            .map(([k, v]) => `${v}化${k}`)
            .join("、") || ""
          : "";
        return `大限${i + 1}（大限命宮：${palace}）${age}${stem ? `，天干${stem}` : ""}${sihua ? `；四化：${sihua}` : ""}`.trim();
      });
      map.decadalLimitsList = lines.join("\n");
    } else {
      map.decadalLimitsList = "";
    }
    // 【十年主線能量】大限四化 + 本命四化對大限的觸發（僅 s15 顯示）
    const ft = (opts.chartJson.fourTransformations ?? (opts.chartJson.ziwei as Record<string, unknown>)?.fourTransformations) as { benming?: { mutagenStars?: Record<string, string> }; decadal?: { mutagenStars?: Record<string, string> } } | undefined;
    const benmingSihua = ft?.benming?.mutagenStars && typeof ft.benming.mutagenStars === "object"
      ? Object.entries(ft.benming.mutagenStars)
        .filter(([, v]) => v)
        .map(([k, v]) => `${v}化${k}`)
        .join("、") || ""
      : "";
    const yearlyForAge = (opts.chartJson.yearlyHoroscope ?? (opts.chartJson.ziwei as Record<string, unknown>)?.yearlyHoroscope) as { nominalAge?: number; age?: number; year?: number } | undefined;
    const currentAge =
      yearlyForAge?.nominalAge != null ? Number(yearlyForAge.nominalAge)
      : yearlyForAge?.age != null ? Number(yearlyForAge.age)
      : undefined;
    const currentLimit = getCurrentDecadalLimit(decadalLimits, currentAge);
    const firstLimit = currentLimit;
    // 大限四化單一真值：優先 decadalLimits[當前].mutagenStars，缺則用 fourTransformations.decadal（禁止用 liunian）
    const decadalMutagenForDisplay = firstLimit?.mutagenStars && typeof firstLimit.mutagenStars === "object"
      ? firstLimit.mutagenStars
      : (ft?.decadal?.mutagenStars && typeof ft.decadal.mutagenStars === "object" ? ft.decadal.mutagenStars : undefined);
    const dalimitSihua = decadalMutagenForDisplay
      ? Object.entries(decadalMutagenForDisplay)
          .filter(([, v]) => v)
          .map(([k, v]) => `${v}化${k}`)
          .join("、") || ""
      : "";
    map.decadalMainLineEnergy =
      "【十年主線能量】\n" +
      (dalimitSihua ? `大限主星四化：${dalimitSihua}\n` : "") +
      (benmingSihua ? `本命四化對大限的觸發：${benmingSihua}\n` : "") +
      "因為十年變動會重新活化某些本命結構。";
    // 當前大限聚焦（模組二：依「當前年齡」取包含該年齡的那步大限，不是第一步）
    const currentPalaceName = firstLimit?.palace ?? "";
    const currentPalaceCanon = !currentPalaceName ? "" : currentPalaceName.endsWith("宮") ? currentPalaceName : currentPalaceName + "宮";
    const currentPalaceShort = currentPalaceName.replace(/宮$/, "") === "命" ? "命宮" : currentPalaceName.replace(/宮$/, "");
    // 模組二四項基礎（大限命宮／四化、流年命宮／四化）只允許由 buildTimeModuleDisplayFromChartJson 寫入，此處不寫入，避免與流年／本命混用
    const M2_BASE_KEYS_ONLY_FROM_TIMEDISPLAY = ["s15", "s15a", "s16", "s17", "s18", "s19", "s20", "s21"];
    if (!M2_BASE_KEYS_ONLY_FROM_TIMEDISPLAY.includes(opts?.sectionKey ?? "")) {
      map.currentDecadalPalace = currentPalaceName || "（當前大限）";
      map.currentDecadalSihuaLine = dalimitSihua || benmingSihua || "";
    }
    const decadalThemeEntry = getDecadalPalaceTheme(currentPalaceCanon || currentPalaceName);
    map.currentDecadalTheme = (decadalThemeEntry?.theme ?? "這十年的主線場景") as string;
    // S17/S18/S19：統一架構 — 有 normalizedChart 用 buildPalaceOverlayFromNormalizedChart，否則 fallback buildPalaceOverlay(chartJson)
    const needOverlay = opts?.sectionKey === "s17" || opts?.sectionKey === "s18" || opts?.sectionKey === "s19";
    if (needOverlay) {
      const flowYear = yearlyForAge?.year ?? (opts?.chartJson?.yearlyHoroscope as { year?: number } | undefined)?.year;
      const overlay = opts?.normalizedChart
        ? buildPalaceOverlayFromNormalizedChart(opts.normalizedChart)
        : opts?.chartJson
          ? buildPalaceOverlay(opts.chartJson, { currentAge, flowYear })
          : [];
      const useAdapter = !!opts?.normalizedChart;
      if (overlay.length > 0) {
        if (opts?.sectionKey === "s17") {
          map.palaceOverlayBlocks = buildPalaceOverlayBlocks(overlay);
        }
        if (opts?.sectionKey === "s18") {
          const signals = buildEventSignals(overlay, useAdapter ? undefined : opts?.chartJson);
          map.s18SignalsBlocks = signalsToNarrative(signals);
        }
        if (opts?.sectionKey === "s19" && opts?.chartJson) {
          const s18Signals = buildEventSignals(overlay, useAdapter ? undefined : opts.chartJson);
          const s19Output = buildS19MonthlyOutput({ chartJson: opts.chartJson, s18Signals });
          map.s19MonthlyBlocks = formatS19MonthlyOutputToCard(s19Output);
        }
      }
    }
    // 第 1 段核心功課：命書敘事＝結論（十年主題）→ 原因（四化底色收束）→ 真正要學的（至少 3 句）
    const themeLabel = decadalThemeEntry?.theme ?? "這十年的主線";
    const homeworkSentences: string[] = [];
    homeworkSentences.push(`大限在${map.currentDecadalPalace ?? "當前大限"}，主題：${themeLabel}。`);
    const mutagenStars = (firstLimit?.mutagenStars && typeof firstLimit.mutagenStars === "object" ? firstLimit.mutagenStars : null) ?? (ft?.decadal?.mutagenStars && typeof ft?.decadal.mutagenStars === "object" ? ft.decadal.mutagenStars : {});
    const transformPairs: Array<{ label: string; key: string }> = [
      { label: "祿", key: "lu" }, { label: "權", key: "quan" }, { label: "科", key: "ke" }, { label: "忌", key: "ji" },
    ];
    const sihuaLines: string[] = [];
    let hasJi = false;
    for (const { label, key } of transformPairs) {
      const star = mutagenStars[label] ?? mutagenStars[key];
      if (!star) continue;
      const meaning = getStarTransformMeaning(star, key);
      if (meaning) sihuaLines.push(meaning);
      if (key === "ji") hasJi = true;
    }
    if (sihuaLines.length > 0) {
      homeworkSentences.push(sihuaLines.length === 1 ? sihuaLines[0] : `大限四化：${sihuaLines.join(" ")}`);
    }
    if (hasJi) {
      homeworkSentences.push("忌星所在宮位宜先穩住、設停損再推。");
    } else if (sihuaLines.length > 0) {
      homeworkSentences.push("四化飛入的宮位見下方，可依宮位與星曜對應策略。");
    } else {
      homeworkSentences.push("四化飛入的宮位見下方。");
    }
    map.currentDecadalHomework = homeworkSentences.join(" ") as string;
    map.decadalMainLineEnergyHumanized =
      decadalThemeEntry?.narrative
        ? `${decadalThemeEntry.narrative} 四化飛入的宮位見下方。`
        : (dalimitSihua || benmingSihua)
          ? "這十年主線由大限宮位與四化牽動；四化飛入的宮位見下方。"
          : "這十年由大限宮位定調；四化飛入的宮位見下方。";
    // 大限四化飛星（s15）：用「該步大限的宮干」(firstLimit.stem) 推十干四化，再飛入本命星所在宮。不可用本命盤該宮宮干。
    const decadalPalaceForFormula = firstLimit?.palace ? toPalaceCanonical(String(firstLimit.palace).trim()) : "";
    const decadalStemFromLimit = (firstLimit as { stem?: string } | undefined)?.stem?.trim() || "";
    // 診斷用：確認命書生成時實際拿到的 currentLimit.stem（54–63 歲應為 甲，若為 丙 表示上游仍用 BaziCore）
    if (opts?.sectionKey === "s15" && (decadalLimits?.length ?? 0) > 0) {
      console.log("[life-book/s15] decadalLimits[5] =", JSON.stringify(decadalLimits[5]));
      console.log("[life-book/s15] firstLimit (current) =", JSON.stringify(firstLimit));
      console.log("[life-book/s15] decadalStemFromLimit =", decadalStemFromLimit || "(empty)");
    }
    const palaceStemMap = buildPalaceStemMap(opts.chartJson);
    const starsByPalace = getStarByPalaceFromChart(opts.chartJson);
    const formulaDecadalFlows = decadalPalaceForFormula && (decadalStemFromLimit || Object.keys(palaceStemMap).length > 0) && starsByPalace.size > 0
      ? buildDecadalSihuaFlows({
          palaceStemMap,
          starsByPalace,
          decadalPalace: decadalPalaceForFormula,
          decadalStem: decadalStemFromLimit || undefined,
        })
      : [];
    const decadalLines: FourTransformLine[] = formulaDecadalFlows.length > 0
      ? formulaDecadalFlows.map((f) => ({
          layer: "decadal" as const,
          layerLabel: "大限",
          starName: f.star,
          type: (f.transform === "祿" ? "lu" : f.transform === "權" ? "quan" : f.transform === "科" ? "ke" : "ji") as "lu" | "quan" | "ke" | "ji",
          typeLabel: f.transform === "祿" ? "化祿" : f.transform === "權" ? "化權" : f.transform === "科" ? "化科" : "化忌",
          fromPalaceKey: f.fromPalace,
          fromPalaceName: f.fromPalace,
          toPalaceKey: f.toPalace,
          toPalaceName: f.toPalace,
        }))
      : [];
    const decadalBlocks = buildFourTransformBlocksForPalace(decadalLines);
    map.decadalFourTransformBlocks = decadalBlocks.techBlock === "（本宮無四化飛星資料）" ? "" : decadalBlocks.techBlock;
    map.decadalFourTransformSummary = decadalBlocks.summary === "（無四化飛星資料）" ? "" : decadalBlocks.summary;
    const decadalExplanations = decadalLines
      .map((l) =>
        buildFlyStarExplanation(
          l.starName,
          l.type,
          l.fromPalaceName ?? l.fromPalaceKey ?? "",
          l.toPalaceName ?? l.toPalaceKey ?? ""
        )
      )
      .filter(Boolean);
    map.decadalFourTransformExplanations = decadalExplanations.length ? decadalExplanations.join("\n\n") : "";
    if (opts?.sectionKey === "s15" || opts?.sectionKey === "s18") {
      const override = (opts.chartJson.recurringHomeworkNarrativeOverride ?? opts.chartJson.lifebookNarrativeOverrides?.recurringHomeworkNarrative) as string | undefined;
      if (override && typeof override === "string" && override.trim()) {
        map.recurringHomeworkNarrative = override.trim();
      } else {
        const bundle = buildPiercingDiagnosticBundle(opts.chartJson, opts.config ?? null);
        const reframes = bundle.reframes ?? [];
        const rootCauses = bundle.rootCauses ?? [];
        const tensions = bundle.tensions ?? [];
        const conclusion = (reframes[0]?.narrative ?? rootCauses[0]?.narrative ?? tensions[0]?.narrative ?? "").trim();
        const rc = rootCauses[0];
        const surfaceDeep =
          rc?.symptomPalace && rc?.sourcePalace
            ? `壓力路徑：${rc.sourcePalace} → ${rc.symptomPalace}。`
            : "四化反覆引動的宮位見上方結構。";
      map.recurringHomeworkNarrative =
        (conclusion ? conclusion + " " : "四化反覆引動的宮位與星曜見上方結構。") + surfaceDeep;
      }
    }
    if (opts?.sectionKey === "s15") {
      map.keyYearsIntro = "不是每一年都一樣重要，以下標出這段時間裡的地雷區、機會區與震盪區，供你安排節奏。";
      if (!map.keyYearsMineLead) map.keyYearsMineLead = "這一年真正危險的，不是表面事件，而是壓力已經累積到會從這個宮位爆出來。";
      if (!map.keyYearsWealthLead) map.keyYearsWealthLead = "此年該宮有資源匯聚，見四化。";
      if (!map.keyYearsShockLead) map.keyYearsShockLead = "這一年吉凶並見、成敗一線間，關鍵在節奏與選擇，不在命好不好。";
    }
  }
  const timeModuleKeys = ["s15a", "s15", "s16", "s17", "s18", "s19", "s20", "s21"];
  if (timeModuleKeys.includes(opts?.sectionKey ?? "") && opts?.chartJson) {
    if (opts?.sectionKey === "s15a") {
      const v2Result = buildS15aPlaceholderMapFromV2(opts.findingsV2);
      if (v2Result.usable) {
        for (const [k, v] of Object.entries(v2Result.map)) map[k] = v;
        s15aV2Usable = true;
      }
    }
    if (opts?.sectionKey === "s16") {
      const v2Result = buildS16PlaceholderMapFromV2(opts.findingsV2);
      if (v2Result.usable) {
        for (const [k, v] of Object.entries(v2Result.map)) map[k] = v;
        s16V2Usable = true;
      }
    }

    const minor = opts.chartJson.minorFortuneByPalace as Array<{ palace?: string; year?: number | null; nominalAge?: number | null; stem?: string | null; note?: string | null }> | undefined;
    const overlap = (opts.chartJson.overlapAnalysis ?? opts.chartJson.overlap) as Record<string, unknown> | undefined;

    let shockCount = 0;
    let mineCount = 0;
    let wealthCount = 0;
    const palaceToTag = new Map<string, "shock" | "mine" | "wealth">();
    // P0.6：永遠計算 overlap 計數與 palaceToTag，供 s15a key-level fallback 與 s15／其他 section 使用。
    const newItems = Array.isArray(overlap?.items) ? (overlap.items as Array<{ palaceKey?: string; palaceName?: string; tag?: string }>) : [];
    if (newItems.length > 0) {
      for (const it of newItems) {
        const tag = it.tag === "shock" || it.tag === "mine" || it.tag === "wealth" ? it.tag : null;
        if (!tag) continue;
        if (tag === "shock") shockCount++;
        else if (tag === "mine") mineCount++;
        else if (tag === "wealth") wealthCount++;
        const pNorm = normPalaceForMatch(it.palaceName ?? it.palaceKey ?? "");
        if (pNorm) palaceToTag.set(pNorm, tag);
      }
    } else {
      const risks = (overlap?.criticalRisks ?? []) as Array<{ palace?: string }>;
      const opps = (overlap?.maxOpportunities ?? []) as Array<{ palace?: string }>;
      const vol = (overlap?.volatileAmbivalences ?? []) as Array<{ palace?: string }>;
      shockCount = vol.length;
      mineCount = risks.length;
      wealthCount = opps.length;
      for (const r of risks) {
        const pNorm = normPalaceForMatch(r.palace ?? "");
        if (pNorm) palaceToTag.set(pNorm, "mine");
      }
      for (const o of opps) {
        const pNorm = normPalaceForMatch(o.palace ?? "");
        if (pNorm) palaceToTag.set(pNorm, "wealth");
      }
      for (const v of vol) {
        const pNorm = normPalaceForMatch(v.palace ?? "");
        if (pNorm) palaceToTag.set(pNorm, "shock");
      }
    }

    const tagSuffix = (p: string) => {
      const norm = normPalaceForMatch(p);
      const tag = palaceToTag.get(norm);
      if (tag === "mine") return " ⚠️ 超級地雷區";
      if (tag === "shock") return " ⚡ 劇烈震盪";
      if (tag === "wealth") return " ✨ 機會區";
      return "";
    };

    const tableRows =
      Array.isArray(minor) && minor.length > 0
        ? minor
            .map((m) => {
              const p = m.palace ?? "";
              const y = m.year != null ? String(m.year) : "";
              const age = m.nominalAge != null ? `${m.nominalAge}歲` : "";
              const stem = m.stem ?? "";
              const note = m.note ? ` ${m.note}` : "";
              return `${p} ${y}(${age} ${stem})${note}`;
            })
            .join("\n")
        : "";
    // M2-Truth Step 3：模組二正文與四化技術版不得出現小限；附錄/關鍵年份可保留。
    const timeModuleKeysForNoMinor = ["s15", "s15a", "s16", "s17", "s18", "s19", "s20", "s21"];
    map.minorFortuneTable = timeModuleKeysForNoMinor.includes(opts?.sectionKey ?? "") ? "" : tableRows;

    const timelineRows =
      Array.isArray(minor) && minor.length > 0
        ? minor
            .map((m) => {
              const p = m.palace ?? "";
              const y = m.year != null ? `${m.year} 年` : "";
              const age = m.nominalAge != null ? `${m.nominalAge} 歲` : "";
              const stem = m.stem ? `，${m.stem} 年` : "";
              const suffix = tagSuffix(p);
              return `${p}：${y}（${age}${stem}）${suffix}`;
            })
            .join("\n")
        : "";
    map.minorFortuneTimelineTable = timeModuleKeysForNoMinor.includes(opts?.sectionKey ?? "") ? "" : timelineRows;

    // P0.6：s15a 改為 key-level fallback（V2 有值不覆寫，缺 key 才用 overlap 補）；其餘 section 維持整段寫入。
    const isEmpty = (v: string | undefined) => v === undefined || (typeof v === "string" && !v.trim());
    if (opts?.sectionKey === "s15a") {
      const detail = buildOverlapDetailBlocks(overlap, {
        chartJson: opts.chartJson,
        content: opts.content,
        config: opts.config,
        contentLocale: opts.contentLocale ?? "zh-TW",
        minorFortuneByPalace: [], // M2-Truth Step 3：模組二四化技術版不輸出小限
        findings: opts.findings ?? undefined,
      });
      if (isEmpty(map.overlapSummary)) map.overlapSummary = `劇烈震盪/吉凶並見：${shockCount} 個宮位；超級地雷區：${mineCount} 個宮位；大發財機會：${wealthCount} 個宮位`;
      if (isEmpty(map.shockCount)) map.shockCount = String(shockCount);
      if (isEmpty(map.mineCount)) map.mineCount = String(mineCount);
      if (isEmpty(map.wealthCount)) map.wealthCount = String(wealthCount);
      if (isEmpty(map.shockBlocks)) map.shockBlocks = detail.shockBlocks;
      if (isEmpty(map.mineBlocks)) map.mineBlocks = detail.mineBlocks;
      if (isEmpty(map.wealthBlocks)) map.wealthBlocks = detail.wealthBlocks;
      if (isEmpty(map.keyYearsMineLead)) map.keyYearsMineLead = "這一年真正危險的，不是表面事件，而是壓力已經累積到會從這個宮位爆出來。";
      if (isEmpty(map.keyYearsWealthLead)) map.keyYearsWealthLead = "此年該宮有資源匯聚，見四化。";
      if (isEmpty(map.keyYearsShockLead)) map.keyYearsShockLead = "這一年吉凶並見、成敗一線間，關鍵在節奏與選擇，不在命好不好。";
      if (isEmpty(map.volatileSection)) map.volatileSection = detail.shockBlocks ? "⚡ 劇烈震盪/吉凶並見（成敗一線間）\n" + detail.shockBlocks : (shockCount > 0 ? "⚡ 劇烈震盪/吉凶並見\n" : "");
      if (isEmpty(map.criticalRisksSection)) map.criticalRisksSection = detail.mineBlocks ? "⚠️ 超級地雷區（必須絕對避開）\n" + detail.mineBlocks : (mineCount > 0 ? "⚠️ 超級地雷區\n" : "");
      if (isEmpty(map.opportunitiesSection)) map.opportunitiesSection = detail.wealthBlocks ? "✨ 大發財機會（建議積極把握）\n" + detail.wealthBlocks : (wealthCount > 0 ? "✨ 大發財機會\n" : "");
    } else {
      // M2-Truth Step 6：禁止 fallback 覆寫已存在的 key（含 V2 寫入的 placeholder）
      const isEmpty = (v: string | undefined) => v === undefined || (typeof v === "string" && !v.trim());
      if (isEmpty(map.shockCount)) map.shockCount = String(shockCount);
      if (isEmpty(map.mineCount)) map.mineCount = String(mineCount);
      if (isEmpty(map.wealthCount)) map.wealthCount = String(wealthCount);
      if (isEmpty(map.overlapSummary)) map.overlapSummary = `劇烈震盪/吉凶並見：${shockCount} 個宮位；超級地雷區：${mineCount} 個宮位；大發財機會：${wealthCount} 個宮位`;
      const detail = buildOverlapDetailBlocks(overlap, {
        chartJson: opts.chartJson,
        content: opts.content,
        config: opts.config,
        contentLocale: opts.contentLocale ?? "zh-TW",
        minorFortuneByPalace: [], // 疊宮清理：不再讓 minorFortune 參與疊宮主邏輯
        findings: opts.findings ?? undefined,
      });
      if (isEmpty(map.shockBlocks)) map.shockBlocks = detail.shockBlocks;
      if (isEmpty(map.mineBlocks)) map.mineBlocks = detail.mineBlocks;
      if (isEmpty(map.wealthBlocks)) map.wealthBlocks = detail.wealthBlocks;
      if (isEmpty(map.keyYearsMineLead)) map.keyYearsMineLead = "這一年真正危險的，不是表面事件，而是壓力已經累積到會從這個宮位爆出來。";
      if (isEmpty(map.keyYearsWealthLead)) map.keyYearsWealthLead = "此年該宮有資源匯聚，見四化。";
      if (isEmpty(map.keyYearsShockLead)) map.keyYearsShockLead = "這一年吉凶並見、成敗一線間，關鍵在節奏與選擇，不在命好不好。";
      if (isEmpty(map.volatileSection)) map.volatileSection = detail.shockBlocks ? "⚡ 劇烈震盪/吉凶並見（成敗一線間）\n" + detail.shockBlocks : (shockCount > 0 ? "⚡ 劇烈震盪/吉凶並見\n" : "");
      if (isEmpty(map.criticalRisksSection)) map.criticalRisksSection = detail.mineBlocks ? "⚠️ 超級地雷區（必須絕對避開）\n" + detail.mineBlocks : (mineCount > 0 ? "⚠️ 超級地雷區\n" : "");
      if (isEmpty(map.opportunitiesSection)) map.opportunitiesSection = detail.wealthBlocks ? "✨ 大發財機會（建議積極把握）\n" + detail.wealthBlocks : (wealthCount > 0 ? "✨ 大發財機會\n" : "");
    }
    if (opts?.sectionKey === "s17" || opts?.sectionKey === "s15") {
      const hasMinor = Array.isArray(minor) && minor.length > 0;
      const hasOverlap = (Array.isArray(overlap?.items) && (overlap?.items?.length ?? 0) > 0) ||
        (Array.isArray(overlap?.criticalRisks) && (overlap?.criticalRisks?.length ?? 0) > 0) ||
        (Array.isArray(overlap?.maxOpportunities) && (overlap?.maxOpportunities?.length ?? 0) > 0) ||
        (Array.isArray(overlap?.volatileAmbivalences) && (overlap?.volatileAmbivalences?.length ?? 0) > 0);
      map.overlapDataMissingNotice = (hasMinor || hasOverlap) ? "" : "（疊宮資料尚未產出：請在專家後台先點「計算」並勾選「計算所有進階功能」，再重新生成此章。）";
    }
    const decisionMatrix = (opts?.content as { decisionMatrix?: DecisionMatrixConfig } | undefined)?.decisionMatrix;
    if (decisionMatrix && Array.isArray(minor) && minor.length > 0) {
      const tagToRisk = (tag: "shock" | "mine" | "wealth" | undefined): 1 | 2 | 3 | 4 | 5 => {
        if (tag === "mine") return 5;
        if (tag === "shock") return 4;
        if (tag === "wealth") return 2;
        return 3;
      };
      const items: XiaoXianYearItem[] = minor.map((m) => {
        const p = m.palace ?? "";
        const tag = palaceToTag.get(normPalaceForMatch(p));
        return {
          year: m.year ?? undefined,
          nominalAge: m.nominalAge ?? undefined,
          palace: p,
          riskLevel: tagToRisk(tag),
          tag: tag ?? undefined,
        };
      });
      const summaries = items.map((it) => buildYearDecisionSummary(it, decisionMatrix));
      map.keyYearsDecisionTimeline = formatXiaoXianDecisionTimeline(summaries);
    } else {
      map.keyYearsDecisionTimeline = "";
    }
  }
  const timeModuleYearKeys = ["s15", "s16", "s17", "s18", "s19", "s20", "s21"];
  if (timeModuleYearKeys.includes(opts?.sectionKey ?? "") && opts?.chartJson) {
    const yearly = (opts.chartJson.yearlyHoroscope ?? (opts.chartJson.ziwei as Record<string, unknown>)?.yearlyHoroscope) as { year?: number; palaceNames?: string[]; mutagenStars?: Record<string, string> } | undefined;
    if (yearly && typeof yearly === "object" && yearly.year != null) map.flowYear = String(yearly.year);
    // P0.4：時間軸與流年宮位／四化一律來自 buildTimeModuleDisplayFromChartJson，不 fallback 到大限；s17～s21 也需 flowYearMingPalace 等，故先統一寫入。
    const timeDisplay = buildTimeModuleDisplayFromChartJson(opts.chartJson);
    map.birthSihuaLine = timeDisplay.birthSihuaLine;
    map.currentDecadalPalace = timeDisplay.currentDecadalPalace;
    map.currentDecadeSihuaLine = timeDisplay.currentDecadeSihuaLine;
    map.flowYearMingPalace = timeDisplay.flowYearMingPalace;
    map.flowYearSihuaLine = timeDisplay.flowYearSihuaLine;
    let liunianMutagen: Record<string, string> | undefined;
    if (opts?.sectionKey === "s16" || opts?.sectionKey === "s15") {
      const ft16 = opts.chartJson.fourTransformations as { liunian?: { mutagenStars?: Record<string, string> } } | undefined;
      liunianMutagen = (opts.chartJson.liunian as { mutagenStars?: Record<string, string> } | undefined)?.mutagenStars ?? ft16?.liunian?.mutagenStars;
      const fmt = (m: Record<string, string> | undefined) =>
        m && typeof m === "object"
          ? Object.entries(m)
              .filter(([, v]) => v)
              .map(([k, v]) => `${v}化${k}`)
              .join("、") || ""
          : "";
      const liunianStr = fmt(liunianMutagen); // 疊宮清理：僅用 liunian/fourTransformations.liunian，不從 overlap 補
      map.flowYearSihua = "【今年的四化】\n" + (liunianStr ? `流年四化：${liunianStr}\n` : "") + "這是命盤最靈敏的區域。";
      if (opts?.sectionKey === "s16") {
        // S16：流年四化飛星僅由公式產出，不依賴 overlap；資料不足則不輸出
        const flowYearStem =
          (yearly as { stem?: string })?.stem
          ?? (opts.chartJson.liunian as { stem?: string })?.stem
          ?? ((opts.chartJson.ziwei as Record<string, unknown>)?.yearlyHoroscope as { stem?: string } | undefined)?.stem;
        const flowYearPalace = (map.flowYearMingPalace ?? "").trim();
        const starsByPalace = getStarByPalaceFromChart(opts.chartJson);
        if (flowYearStem && flowYearPalace && starsByPalace.size > 0) {
          const formulaFlows = buildYearlySihuaFlows({
            yearStem: flowYearStem.trim(),
            flowYearPalace,
            starsByPalace,
          });
          console.log("[life-book/s16] flowYearStem =", flowYearStem);
          console.log("[life-book/s16] flowYearPalace =", flowYearPalace);
          const mutagenStars = getMutagenStarsFromStem(flowYearStem);
          console.log("[life-book/s16] 四化星名 =", JSON.stringify(mutagenStars));
          formulaFlows.forEach((f, i) =>
            console.log("[life-book/s16] flow[" + i + "] fromPalace =", f.fromPalace, "toPalace =", f.toPalace)
          );
          const yearlyLines: FourTransformLine[] = formulaFlows.map((f) => ({
            layer: "yearly" as const,
            layerLabel: "流年",
            starName: f.star,
            type: (f.transform === "祿" ? "lu" : f.transform === "權" ? "quan" : f.transform === "科" ? "ke" : "ji") as "lu" | "quan" | "ke" | "ji",
            typeLabel: f.transform === "祿" ? "化祿" : f.transform === "權" ? "化權" : f.transform === "科" ? "化科" : "化忌",
            fromPalaceKey: f.fromPalace,
            fromPalaceName: f.fromPalace,
            toPalaceKey: f.toPalace,
            toPalaceName: f.toPalace,
          }));
          const yearlyBlocks = buildFourTransformBlocksForPalace(yearlyLines);
          map.yearlyFourTransformBlocks = yearlyBlocks.techBlock === "（本宮無四化飛星資料）" ? "" : yearlyBlocks.techBlock;
          map.yearlyFourTransformSummary = yearlyBlocks.summary === "（無四化飛星資料）" ? "" : yearlyBlocks.summary;
          map.yearlyFourTransformExplanations = yearlyLines
            .map((l) =>
              buildFlyStarExplanation(
                l.starName,
                l.type,
                l.fromPalaceName ?? l.fromPalaceKey ?? "",
                l.toPalaceName ?? l.toPalaceKey ?? ""
              )
            )
            .filter(Boolean)
            .join("\n\n");
        } else {
          // 無公式資料時不覆寫，保留 V2 已寫入的 yearlyFourTransformBlocks（若有）
          if (!s16V2Usable) {
            map.yearlyFourTransformBlocks = "";
            map.yearlyFourTransformSummary = "";
            map.yearlyFourTransformExplanations = "";
          }
        }
      } else if (!(opts?.sectionKey === "s16" && s16V2Usable)) {
        map.yearlyFourTransformBlocks = "";
        map.yearlyFourTransformSummary = "";
        map.yearlyFourTransformExplanations = "";
      }
      const decisionMatrix = (opts?.content as { decisionMatrix?: DecisionMatrixConfig } | undefined)?.decisionMatrix;
      if (decisionMatrix && yearly?.year != null) {
        const overlap = (opts.chartJson.overlapAnalysis ?? opts.chartJson.overlap) as Record<string, unknown> | undefined;
        const palaceToTag = new Map<string, "shock" | "mine" | "wealth">();
        const newItems = Array.isArray(overlap?.items) ? (overlap.items as Array<{ palaceKey?: string; palaceName?: string; tag?: string }>) : [];
        if (newItems.length > 0) {
          for (const it of newItems) {
            const tag = it.tag === "shock" || it.tag === "mine" || it.tag === "wealth" ? it.tag : null;
            if (!tag) continue;
            const pNorm = normPalaceForMatch(it.palaceName ?? it.palaceKey ?? "");
            if (pNorm) palaceToTag.set(pNorm, tag);
          }
        } else {
          const risks = (overlap?.criticalRisks ?? []) as Array<{ palace?: string }>;
          const opps = (overlap?.maxOpportunities ?? []) as Array<{ palace?: string }>;
          const vol = (overlap?.volatileAmbivalences ?? []) as Array<{ palace?: string }>;
          for (const r of risks) {
            const pNorm = normPalaceForMatch(r.palace ?? "");
            if (pNorm) palaceToTag.set(pNorm, "mine");
          }
          for (const o of opps) {
            const pNorm = normPalaceForMatch(o.palace ?? "");
            if (pNorm) palaceToTag.set(pNorm, "wealth");
          }
          for (const v of vol) {
            const pNorm = normPalaceForMatch(v.palace ?? "");
            if (pNorm) palaceToTag.set(pNorm, "shock");
          }
        }
        const palace = map.flowYearMingPalace ?? yearly?.palaceNames?.[0] ?? "";
        const tag = palace ? palaceToTag.get(normPalaceForMatch(palace)) : undefined;
        const tagToRisk = (t: "shock" | "mine" | "wealth" | undefined): 1 | 2 | 3 | 4 | 5 => {
          if (t === "mine") return 5;
          if (t === "shock") return 4;
          if (t === "wealth") return 2;
          return 3;
        };
        const currentYearItem: XiaoXianYearItem = {
          year: yearly.year,
          nominalAge: undefined,
          palace,
          riskLevel: tagToRisk(tag),
          tag: tag ?? undefined,
        };
        const summary = buildYearDecisionSummary(currentYearItem, decisionMatrix);
        if (!(opts?.sectionKey === "s16" && s16V2Usable)) {
          map.yearDecisionSummaryBlock = formatYearDecisionSummaryBlock(summary);
        }
      } else {
        if (!(opts?.sectionKey === "s16" && s16V2Usable)) map.yearDecisionSummaryBlock = "";
      }
    } else {
      const ft16 = opts.chartJson.fourTransformations as { liunian?: { mutagenStars?: Record<string, string> } } | undefined;
      liunianMutagen = (opts.chartJson.liunian as { mutagenStars?: Record<string, string> } | undefined)?.mutagenStars ?? ft16?.liunian?.mutagenStars;
    }
    if (["s15", "s16", "s17", "s18", "s19", "s20", "s21"].includes(opts?.sectionKey ?? "")) {
      const decadalPalace = map.currentDecadalPalace ?? "";
      const roleResult = getYearRoleInDecadeAndWhy({
        decadalPalace,
        liunianMutagen: liunianMutagen as Record<string, string> | undefined,
      });
      map.yearRoleInDecade = roleResult.role;
      map.yearRoleWhyShort = roleResult.why;
      map.yearOneLineAdvice = getRoleTakeaway(roleResult.role);
      if (opts?.sectionKey === "s16") {
        const parts = [
          map.flowYearMingPalace ? `今年流年命宮在${map.flowYearMingPalace}` : "",
          map.flowYearSihuaLine ? `四化：${map.flowYearSihuaLine}` : "",
          map.yearOneLineAdvice ?? "",
        ].filter(Boolean);
        map.currentYearHomework = parts.join("。") || "今年流年命宮與四化已如上述，可依祿入宮位布局、對忌入宮位保持覺察。";
      }
      const decadalTheme = map.currentDecadalTheme ?? "這十年的主線";
      map.yearRoleWhy =
        `這十年主線在「${decadalTheme}」，今年流年讓${roleResult.role}的感特別明顯。` +
        `所以今年真正要修的是：${getRoleTakeaway(roleResult.role)}`;
      map.yearRoleFilterTheme = "今年最有感的，是流年所帶來的議題。";
      const yearBlock = (map.yearDecisionSummaryBlock ?? "").trim();
      const nowBlock = yearBlock || "從今天起，先做一件對齊今年主線的小事，少做一件消耗自己的事。";
      const yearAdjust = "一年內，把力氣集中在與今年主線最相關的一兩個領域，其他先放著。";
      const decadeRemember = `這十年都要記住：大限在${map.currentDecadalPalace ?? "當前大限"}，四化見上方。`;
      map.actionNowLayers =
        "【立刻可做】\n" + nowBlock +
        "\n\n【一年內調整】\n" + yearAdjust +
        "\n\n【這十年都要記住】\n" + decadeRemember;
      map.closingNarrative =
        "大限與今年流年四化見上方；可依宮位與飛星 from→to 對應策略。";
    }
  }
  if (["s18", "s19", "s20", "s21"].includes(opts?.sectionKey ?? "") && opts?.chartJson) {
    const bundle = buildPiercingDiagnosticBundle(opts.chartJson, opts.config ?? null);
    const rootCauses = bundle.rootCauses ?? [];
    const rc = rootCauses[0];
    const decadalPalace = map.currentDecadalPalace ?? "當前大限";
    const decadalTheme = map.currentDecadalTheme ?? "這十年的主線";
    const recurring = (map.recurringHomeworkNarrative ?? "").trim();
    if (opts?.sectionKey === "s18") {
      if (rc?.sourcePalace && rc?.symptomPalace) {
        map.blindSpotsDecadalNarrative = `壓力路徑：${rc.sourcePalace} → ${rc.symptomPalace}。建議先檢視${rc.sourcePalace}再處理${rc.symptomPalace}。`;
      } else {
        map.blindSpotsDecadalNarrative = recurring
          ? recurring
          : "四化飛入的宮位見上方；壓力來源可對照飛星 from→to。";
      }
    }
    if (opts?.sectionKey === "s19") {
      const actionNow = (map.actionNowLayers ?? "").split(/\n\n/);
      const nowLine = actionNow.find((s) => s.includes("立刻可做"));
      const yearLine = actionNow.find((s) => s.includes("一年內"));
      const decadeLine = actionNow.find((s) => s.includes("這十年都要記住"));
      map.s19ActionNow = nowLine ? nowLine.replace(/【立刻可做】\n?/, "").trim() : "";
      map.s19LongTerm = yearLine ? yearLine.replace(/【一年內調整】\n?/, "").trim() : "";
      map.s19Avoid = decadeLine ? decadeLine.replace(/【這十年都要記住】\n?/, "").trim() : (decadalPalace ? `大限在${decadalPalace}，四化見上方。` : "");
    }
    if (opts?.sectionKey === "s20") {
      map.s20BenmingLine = "本命夫妻宮與命宮主星、四化見上方結構。";
      map.s20DecadalLine = `大限主題：${decadalTheme}。四化飛入的宮位見上方。`;
      const flowPalace = map.flowYearMingPalace ?? "";
      if (rc?.sourcePalace && rc?.symptomPalace) {
        const srcShort = rc.sourcePalace.replace(/宮$/, "");
        const symShort = rc.symptomPalace.replace(/宮$/, "");
        map.s20YearLine = flowPalace ? `今年：${flowPalace}。壓力路徑：${srcShort} → ${symShort}。` : `壓力路徑：${srcShort} → ${symShort}。`;
      } else {
        map.s20YearLine = flowPalace ? `今年：${flowPalace}。四化見上方。` : "四化見上方。";
      }
    }
    if (opts?.sectionKey === "s21") {
      map.s21LifelongLesson = recurring ? recurring : "四化反覆引動的宮位見上方結構。";
      map.s21NowSee = decadalPalace
        ? `大限在${decadalPalace}；今年角色：${map.yearRoleInDecade ?? "見上方"}。四化與飛星見上方。`
        : `今年角色：${map.yearRoleInDecade ?? "見上方"}。四化見上方。`;
    }
  }
  return map;
}

/** 技術版：依 PalaceContext 列出此宮星曜與四化。Phase 5B-2：有 findings 時只讀 findings.natalFlowItems／sihuaPlacementItems，不讀 chart。 */
export function buildTechDebugForPalace(
  ctx: PalaceContext | null,
  opts?: {
    chartJson?: Record<string, unknown>;
    findings?: LifebookFindings;
    starPalacesAuxRisk?: Record<string, number>;
    compact?: boolean;
    flowsNotVerified?: boolean;
    /** 僅在除錯／技術模式為 true 時輸出【FLOW_DEBUG】；正式命書不顯示。 */
    includeFlowDebug?: boolean;
  }
): string {
  const compact = opts?.compact === true;
  const lines: string[] = [];
  lines.push("【本題底層參數解析】");
  if (ctx) {
    lines.push(`宮位：${ctx.palaceName}`);
    const auxRisk = opts?.starPalacesAuxRisk;
    const palaceShort = ctx.palaceName.replace(/宮$/, "") === "命" ? "命宮" : ctx.palaceName.replace(/宮$/, "");
    const getRiskSuffix = (starName: string): string => {
      if (!auxRisk || typeof auxRisk !== "object") return "";
      const r = auxRisk[`${starName}_${palaceShort}`] ?? auxRisk[`${starName}_${ctx.palaceName}`];
      return typeof r === "number" && r >= 1 && r <= 5 ? `（風險${r}）` : "";
    };
    const findingsForSihua = opts?.findings ?? createEmptyFindings();
    const getNatalSihua =
      opts?.findings != null
        ? (starName: string) => getNatalSihuaForStarFromFindings(starName, findingsForSihua)
        : opts?.chartJson
          ? (starName: string) => getNatalSihuaForStar(starName, opts.chartJson)
          : () => "";
    if (ctx.stars.length > 0) {
      if (compact) {
        const starList = ctx.stars
          .map((s) => {
            const r = getRiskSuffix(s.name);
            const name = r ? `${s.name}${r}` : s.name;
            return s.strength ? `${name}（${s.strength}）` : name;
          })
          .join("、");
        lines.push("本宮星曜：" + starList);
      } else {
        lines.push("星曜詳解（星曜說明與此宮表現）：");
        for (const s of ctx.stars) {
          const riskSuffix = getRiskSuffix(s.name);
          const nameWithRisk = riskSuffix ? `${s.name}${riskSuffix}` : s.name;
          const natalSihua = getNatalSihua(s.name);
          const head = [nameWithRisk, s.strength ? `（${s.strength}）` : "", natalSihua].filter(Boolean).join(" ");
          const base = (s.baseMeaning ?? "").trim();
          const inPalace = (s.meaningInPalace ?? "").trim();
          lines.push(head);
          if (base) lines.push(base);
          if (inPalace) lines.push("【此宮表現】", inPalace);
          if (!base && !inPalace) lines.push("（此宮尚無專屬說明，可參照上方星曜通用解釋）");
          lines.push("");
        }
      }
    } else {
      lines.push(compact ? "本宮星曜：無" : "星曜詳解：" + MISSING_PLACEHOLDER);
    }
    if (ctx.loopSnippet) lines.push(`迴路提示：${ctx.loopSnippet}`);
    if (ctx.hpSnippet) lines.push(`高壓情境：${ctx.hpSnippet}`);
  } else {
    lines.push("（此宮暫無星曜與四化資料）");
  }
  const chartJson = opts?.chartJson;
  const hasFindings = opts?.findings != null;
  if ((chartJson || hasFindings) && ctx) {
    if (compact) {
      // 四化與飛化詳見骨架區塊，此處不再輸出幽靈導覽句
    } else {
      const flowsNotVerified = opts?.flowsNotVerified === true;
      if (flowsNotVerified) {
        lines.push("");
        lines.push("【本命宮干飛化（本宮）】");
        lines.push("");
        lines.push(FLOWS_NOT_VERIFIED_MESSAGE);
      } else if (hasFindings) {
        const flowBlock = buildNatalFlowBlockFromFindings(opts!.findings!, ctx.palaceName ?? "");
        lines.push("");
        lines.push("【本命宮干飛化（本宮）】");
        lines.push(flowBlock ? flowBlock : "（本宮無本命宮干飛化資訊）");
        if (opts?.includeFlowDebug === true) {
          const flowDebug = buildFlowDebugEntriesFromFindings(opts!.findings!);
          if (flowDebug.length > 0) {
            lines.push("");
            lines.push("【FLOW_DEBUG】");
            for (const e of flowDebug) {
              lines.push(`layer: ${e.layer} | star: ${e.star} | star_palace: ${e.star_palace} | from: ${e.fromPalace} | to: ${e.toPalace} | transform: ${e.transform}`);
            }
          }
        }
      } else if (chartJson) {
        const chart = normalizeChart(chartJson);
        const flowBlock = getFlowBlockForPalace(chart, ctx.palaceName ?? "");
        lines.push("");
        lines.push("【本命宮干飛化（本宮）】");
        lines.push(flowBlock ? flowBlock : "（本宮無本命宮干飛化資訊）");
        if (opts?.includeFlowDebug === true) {
          const flowDebug = buildFlowDebugEntries(chart);
          if (flowDebug.length > 0) {
            lines.push("");
            lines.push("【FLOW_DEBUG】");
            for (const e of flowDebug) {
              lines.push(`layer: ${e.layer} | star: ${e.star} | star_palace: ${e.star_palace} | from: ${e.fromPalace} | to: ${e.toPalace} | transform: ${e.transform}`);
            }
          }
        }
      }
    }
  }
  return lines.join("\n");
}

/**
 * 僅組裝本題底層參數／高壓／骨架區塊文字，不呼叫 AI。供 output_mode === "technical" 時回傳技術版 section。
 * 底層資料來自 buildPalaceContext（星曜、亮度廟旺利陷、迴路、高壓、四化），無原型欄位。
 * 傳入 findings 時單宮四化摘要只讀 findings，不覆蓋為 createEmptyFindings()。
 */
export function getSectionTechnicalBlocks(
  sectionKey: string,
  chartJson: Record<string, unknown>,
  config: LifeBookConfig | null | undefined,
  content: AssembleContentLookup | undefined,
  contentLocale: "zh-TW" | "zh-CN" | "en",
  findings?: LifebookFindings,
  findingsV2?: LifebookFindingsV2
): {
  underlyingParamsText?: string;
  riskBlockText?: string;
  skeletonBlockText?: string;
  resolvedSkeleton?: { structure_analysis: string; behavior_pattern: string; blind_spots: string; strategic_advice: string };
  placeholderMap?: Record<string, string>;
} {
  if (!content) return {};
  // s04 + 12 宮產出技術區塊與 skeleton；時間模組（s15～s21）也產出 skeleton（模板＋placeholder），否則技術版只會輸出標題、內容全空。
  const isCoreSection = sectionKey === "s04" || PALACE_SECTION_KEYS.has(sectionKey);
  const TIME_MODULE_SKELETON_KEYS = ["s15", "s15a", "s16", "s17", "s18", "s19", "s20", "s21"] as const;
  if (!isCoreSection && !TIME_MODULE_SKELETON_KEYS.includes(sectionKey as (typeof TIME_MODULE_SKELETON_KEYS)[number])) return {};

  const templates = config?.templates?.length ? config.templates : SECTION_TEMPLATES;
  const template = templates.find((t) => t.section_key === sectionKey);
  if (!template) return {};

  const ctx = buildPalaceContext(sectionKey, chartJson, config, content, contentLocale ?? "zh-TW");

  const assembleInput = buildAssembleInput(chartJson, config, contentLocale ?? "zh-TW");
  const riskProfile = assembleRiskProfile(assembleInput);
  const { loopSnippets, highPressureSnippets } = resolveAssembleSnippets(riskProfile, content);
  const riskBlockText =
    loopSnippets.length > 0 || highPressureSnippets.length > 0
      ? [
          "【命盤高壓模式與慣性迴路（系統計算）】",
          "【神經迴路】",
          ...loopSnippets.map((s) => `- ${s}`),
          "",
          "【高壓情境】",
          ...highPressureSnippets.map((s) => `- ${s}`),
        ].join("\n")
      : undefined;

  const skipDebugForSection = sectionKey === "s00" || sectionKey === "s03";
  const placeholderMap = getPlaceholderMapFromContext(ctx, {
    chartJson,
    sectionKey,
    content,
    config,
    contentLocale: contentLocale ?? "zh-TW",
    forTechnicalOutput: !skipDebugForSection,
    findings,
    findingsV2: findingsV2 ?? undefined,
  });

  const TIME_MODULE_KEYS = ["s15", "s15a", "s16", "s17", "s18", "s19", "s20", "s21"] as const;
  let underlyingParamsTextFinal: string;
  if (TIME_MODULE_KEYS.includes(sectionKey as (typeof TIME_MODULE_KEYS)[number])) {
    underlyingParamsTextFinal = "";
  } else if (sectionKey === "s00") {
    underlyingParamsTextFinal = "";
  } else if (sectionKey === "s03") {
    underlyingParamsTextFinal = "";
  } else if (sectionKey === "s04") {
    // s04 正文只來自 lifebookSection-zh-TW.json 的 structure_analysis，不再混入舊版命主/身主/身宮/命身關係摘要
    underlyingParamsTextFinal = "";
  } else {
    const isPalaceSection = ["s01", "s02", "s05", "s06", "s07", "s08", "s09", "s10", "s11", "s12", "s13", "s14"].includes(sectionKey);
    underlyingParamsTextFinal = buildTechDebugForPalace(ctx, {
      chartJson,
      findings,
      starPalacesAuxRisk: (content as { starPalacesAuxRisk?: Record<string, number> } | undefined)?.starPalacesAuxRisk,
      compact: isPalaceSection,
    });
  }
  // 財帛／官祿：技術版可選顯示主星星系（s02 命宮不解出主星星系／星系重點）
  if (["s10", "s08"].includes(sectionKey) && placeholderMap?.sanfangFamilyLabel) {
    underlyingParamsTextFinal +=
      "\n\n主星星系：" +
      placeholderMap.sanfangFamilyLabel +
      "（主星：" +
      (placeholderMap.sanfangMainStarName ?? "") +
      "）";
    if (placeholderMap.sanfangFamilySummary) {
      underlyingParamsTextFinal += "\n星系重點：" + placeholderMap.sanfangFamilySummary;
    }
  }
  // 原意：s15/s16/s15a 技術版要附加【四化飛星技術版】；先前條件寫反導致不可達，改為依 section 判斷。
  if (sectionKey === "s15" || sectionKey === "s16" || sectionKey === "s15a") {
    let fourTech = "";
    if (sectionKey === "s15" && placeholderMap.decadalFourTransformBlocks) {
      fourTech = placeholderMap.decadalFourTransformBlocks;
    } else if (sectionKey === "s16" && placeholderMap.yearlyFourTransformBlocks) {
      fourTech = placeholderMap.yearlyFourTransformBlocks;
    } else if (sectionKey === "s15a") {
      const parts: string[] = [];
      if (placeholderMap.shockBlocks) parts.push("⚡ 劇烈震盪／吉凶並見\n" + placeholderMap.shockBlocks);
      if (placeholderMap.mineBlocks) parts.push("⚠️ 超級地雷區\n" + placeholderMap.mineBlocks);
      if (placeholderMap.wealthBlocks) parts.push("✨ 大發財機會\n" + placeholderMap.wealthBlocks);
      fourTech = parts.join("\n\n");
    }
    if (fourTech) {
      underlyingParamsTextFinal += "\n\n【四化飛星技術版】\n" + fourTech;
      if (sectionKey === "s15" && placeholderMap.decadalFourTransformExplanations) {
        underlyingParamsTextFinal += "\n\n" + placeholderMap.decadalFourTransformExplanations;
      }
      if (sectionKey === "s16" && placeholderMap.yearlyFourTransformExplanations) {
        underlyingParamsTextFinal += "\n\n" + placeholderMap.yearlyFourTransformExplanations;
      }
    }
  }

  let sectionSkeleton = content?.lifebookSection?.[sectionKey];
  // S16：不輸出【今年流年四化飛星】與【今年主線與功課】，避免與【四化飛星技術版】重複；無論 content 來自靜態 JSON 或 D1/KV 皆強制為空
  if (sectionKey === "s16" && sectionSkeleton) {
    sectionSkeleton = { ...sectionSkeleton, structure_analysis: "" };
  }
  // S17：疊宮分析一律用 buildPalaceOverlay 結果展示，不受 D1/KV 或快取舊文案覆蓋
  if (sectionKey === "s17") {
    sectionSkeleton = { ...(sectionSkeleton || {}), structure_analysis: "{palaceOverlayBlocks}" };
  }
  if (sectionKey === "s18") {
    sectionSkeleton = { ...(sectionSkeleton || {}), structure_analysis: "{s18SignalsBlocks}" };
  }
  if (sectionKey === "s19") {
    sectionSkeleton = { ...(sectionSkeleton || {}), structure_analysis: "{s19MonthlyBlocks}" };
  }
  let skeletonBlockText: string | undefined;
  let resolvedSkeleton: { structure_analysis: string; behavior_pattern: string; blind_spots: string; strategic_advice: string } | undefined;

  if (sectionSkeleton && (sectionSkeleton.structure_analysis ?? sectionSkeleton.behavior_pattern ?? sectionSkeleton.blind_spots ?? sectionSkeleton.strategic_advice)) {
    const lines: string[] = ["【本章節骨架】"];
    if (sectionSkeleton.structure_analysis) lines.push("structure_analysis：", sectionSkeleton.structure_analysis);
    if (sectionSkeleton.behavior_pattern) lines.push("behavior_pattern：", sectionSkeleton.behavior_pattern);
    if (sectionSkeleton.blind_spots) lines.push("blind_spots：", sectionSkeleton.blind_spots);
    if (sectionSkeleton.strategic_advice) lines.push("strategic_advice：", sectionSkeleton.strategic_advice);
    skeletonBlockText = lines.join("\n");

    const missingForSection =
      PALACE_SECTION_KEYS.has(sectionKey) || TIME_MODULE_KEYS.includes(sectionKey)
        ? ""
        : sectionKey === "s00"
          ? "[此處資料缺失，可略過]"
          : MISSING_PLACEHOLDER;
    let resolved: { structure_analysis: string; behavior_pattern: string; blind_spots: string; strategic_advice: string } = {
      structure_analysis: resolveSkeletonPlaceholders(sectionSkeleton.structure_analysis ?? "", placeholderMap, { missingReplacement: missingForSection }),
      behavior_pattern: resolveSkeletonPlaceholders(sectionSkeleton.behavior_pattern ?? "", placeholderMap, { missingReplacement: missingForSection }),
      blind_spots: resolveSkeletonPlaceholders(sectionSkeleton.blind_spots ?? "", placeholderMap, { missingReplacement: missingForSection }),
      strategic_advice: resolveSkeletonPlaceholders(sectionSkeleton.strategic_advice ?? "", placeholderMap, { missingReplacement: missingForSection }),
    };
    if (sectionKey === "s03") {
      const [sa, bp, bl, st] = dedupeParagraphsAcrossBlocks([
        resolved.structure_analysis,
        resolved.behavior_pattern,
        resolved.blind_spots,
        resolved.strategic_advice,
      ]);
      resolved = {
        structure_analysis: normalizePunctuation(sa),
        behavior_pattern: normalizePunctuation(bp),
        blind_spots: normalizePunctuation(bl),
        strategic_advice: normalizePunctuation(st),
      };
    } else {
      resolved = {
        structure_analysis: normalizePunctuation(resolved.structure_analysis),
        behavior_pattern: normalizePunctuation(resolved.behavior_pattern),
        blind_spots: normalizePunctuation(resolved.blind_spots),
        strategic_advice: normalizePunctuation(resolved.strategic_advice),
      };
    }
    const stripForbidden = (s: string) =>
      s.replace(/（此欄位資料不足）|（此處無資料）/g, "").replace(/\s*\[R\d+_[^\]]*\]/g, "").replace(/（模組一驗收未通過[^）]*）/g, "");
    if (PALACE_SECTION_KEYS.has(sectionKey)) {
      resolved = {
        structure_analysis: stripForbidden(resolved.structure_analysis),
        behavior_pattern: stripForbidden(resolved.behavior_pattern),
        blind_spots: stripForbidden(resolved.blind_spots),
        strategic_advice: stripForbidden(resolved.strategic_advice),
      };
    }
    resolvedSkeleton = resolved;
  }

  return { underlyingParamsText: underlyingParamsTextFinal, riskBlockText, skeletonBlockText, resolvedSkeleton, placeholderMap };
}

/**
 * 命書讀者版：取得 12 宮應追加的【星曜結構】區塊與 behavior_pattern／blind_spots／strategic_advice 的模板解析結果。
 * 用於 AI 回傳後強制補上星曜說明、並以當前模板覆寫三欄，避免讀者看到缺塊或舊版長句。
 */
/**
 * 傳入 findings 時單宮四化摘要只讀 findings；禁止以 createEmptyFindings() 覆蓋真實 findings。
 */
export function getPalaceSectionReaderOverrides(
  sectionKey: string,
  chartJson: Record<string, unknown>,
  config: LifeBookConfig | null | undefined,
  content: AssembleContentLookup | undefined,
  contentLocale: "zh-TW" | "zh-CN" | "en",
  findings?: LifebookFindings,
  /** 統一架構：若已 normalize 過可傳入，避免重複計算；缺則內部 normalizeChart(chartJson) */
  normalizedChart?: NormalizedChart
): { starBlockToAppend: string; behavior_pattern: string; blind_spots: string; strategic_advice: string; resolvedStructureAnalysis?: string } | null {
  if (!PALACE_SECTION_KEYS.has(sectionKey) || !content) return null;

  /**
   * 讀者敘事必須只依 sectionKey→宮位 + chart 組出，不可依賴 buildPalaceContext。
   * 否則 assemble 異常時 ctx===null 會整段 return null，generate-section 就留下 AI 填的舊骨架（【這一宮正在發生什麼】）。
   */
  const palaceKeyFromSection = getPalaceKeyForSection(sectionKey);
  const targetPalace = palaceKeyFromSection ? toPalaceCanonical(palaceKeyFromSection) : "";

  let norm = normalizedChart;
  if (!norm && chartJson && typeof chartJson === "object") {
    try {
      norm = normalizeChart(chartJson);
    } catch (e) {
      console.warn("[getPalaceSectionReaderOverrides] normalizeChart failed:", e);
      norm = undefined;
    }
  }

  let readerPalaceNarrative: string | undefined;
  if (targetPalace && chartJson && typeof chartJson === "object") {
    let ps = norm?.palaces?.find((p) => toPalaceCanonical(p.palace) === targetPalace);
    if (!ps) {
      try {
        ps = buildPalaces(chartJson).find((p) => toPalaceCanonical(p.palace) === targetPalace);
      } catch (e) {
        console.warn("[getPalaceSectionReaderOverrides] buildPalaces fallback failed:", e);
      }
    }
    if (ps) {
      let raw = palaceStructureToPalaceRawInput(ps);
      raw = enrichPalaceRawWithBenmingMutagen(raw, chartJson);
      raw = mergeZiweiBrightnessIntoPalaceRaw(raw, chartJson, targetPalace);
      const narrativeInput = buildPalaceNarrativeInput(raw, {
        mingSoulBranch: norm?.mingSoulBranch,
        behaviorAxisFlags: {
          behaviorAxisV1: config?.behaviorAxisV1,
          behaviorAxisConflictV1: config?.behaviorAxisConflictV1,
          behaviorAxisLoopV1: config?.behaviorAxisLoopV1,
        },
        behaviorAxisWideOpen: config?.behaviorAxisWideOpen,
      });
      readerPalaceNarrative = renderPalaceNarrativeSample(narrativeInput, { raw }).trim();
    } else {
      console.warn(
        "[getPalaceSectionReaderOverrides] no PalaceStructure for sectionKey=%s targetPalace=%s (norm.palaces=%s)",
        sectionKey,
        targetPalace,
        norm?.palaces?.length ?? 0
      );
    }
  }

  const ctx = buildPalaceContext(sectionKey, chartJson, config, content, contentLocale ?? "zh-TW");
  if (!ctx) {
    if (readerPalaceNarrative) {
      console.warn(
        "[getPalaceSectionReaderOverrides] buildPalaceContext=null but reader narrative ok sectionKey=%s — 回傳敘事，三欄為空",
        sectionKey
      );
      return {
        starBlockToAppend: "",
        behavior_pattern: "",
        blind_spots: "",
        strategic_advice: "",
        resolvedStructureAnalysis: readerPalaceNarrative,
      };
    }
    return null;
  }

  const placeholderMap = getPlaceholderMapFromContext(ctx, {
    chartJson,
    sectionKey,
    content,
    config,
    contentLocale: contentLocale ?? "zh-TW",
    forTechnicalOutput: false,
    findings,
    normalizedChart,
  });
  const sectionSkeleton = (content as { lifebookSection?: Record<string, { structure_analysis?: string; behavior_pattern?: string; blind_spots?: string; strategic_advice?: string }> }).lifebookSection?.[sectionKey];
  // Phase 5B-10：確認 reader 路徑用的 skeleton 是新版還是舊版
  if (["s01", "s09", "s11"].includes(sectionKey)) {
    const sa = sectionSkeleton?.structure_analysis ?? "";
    const hasNew = sa.includes("四化引動") && sa.includes("宮干飛化");
    const hasOld = sa.includes("動態引動與根因");
    console.log("[getPalaceSectionReaderOverrides Phase5B-10] sectionKey=%s skeletonHasNew=%s skeletonHasOld=%s structure_analysis(0..200)=%s", sectionKey, hasNew, hasOld, JSON.stringify(sa.slice(0, 200)));
  }
  const snippet = (placeholderMap.palaceStarsOnlySnippet ?? "").trim();
  const clue = (placeholderMap.palaceChartClue ?? "").trim();
  const isPalaceFourBlock = PALACE_SECTION_KEYS.has(sectionKey);
  const starBlockToAppend = isPalaceFourBlock
    ? ""
    : "\n\n【星曜結構】\n\n以下說明本宮星曜的基本性質，以及它們在此宮位中的表現。\n\n" +
      (snippet || "（本宮星曜說明見上方「本宮星曜」列表。）") +
      (clue ? "\n\n命盤線索：" + clue : "");
  const empty = "";
  const bp = sectionSkeleton?.behavior_pattern != null ? resolveSkeletonPlaceholders(sectionSkeleton.behavior_pattern, placeholderMap, { missingReplacement: empty }) : empty;
  const bl = sectionSkeleton?.blind_spots != null ? resolveSkeletonPlaceholders(sectionSkeleton.blind_spots, placeholderMap, { missingReplacement: empty }) : empty;
  const st = sectionSkeleton?.strategic_advice != null ? resolveSkeletonPlaceholders(sectionSkeleton.strategic_advice, placeholderMap, { missingReplacement: empty }) : empty;

  const resolvedStructureAnalysis =
    readerPalaceNarrative ??
    (sectionSkeleton?.structure_analysis != null
      ? resolveSkeletonPlaceholders(sectionSkeleton.structure_analysis, placeholderMap, { missingReplacement: empty })
      : undefined);
  return { starBlockToAppend, behavior_pattern: bp, blind_spots: bl, strategic_advice: st, resolvedStructureAnalysis };
}

/** ② 四化落宮（核心資料段）：M2-Truth 僅讀 chartJson.fourTransformations；本命／大限／流年各一組，格式「星名化X落在Y宮，」；不得為空。 */
function buildSihuaFallByPalaceBlock(chartJson: Record<string, unknown> | undefined): string {
  if (!chartJson) return "（尚無四化落宮資料）";
  const ft = chartJson.fourTransformations as Record<string, { mutagenStars?: Record<string, string> }> | undefined;
  const layers = buildSiHuaLayers(chartJson); // buildSiHuaLayers 已以 fourTransformations 為主
  const lines: string[] = [];
  const layerOrder: Array<{ label: string; data: SiHuaLayer | null | undefined }> = [
    { label: "本命", data: layers.benming },
    { label: "大限", data: layers.decadal },
    { label: "流年", data: layers.yearly },
  ];
  for (const { label, data } of layerOrder) {
    lines.push(`${label}：`);
    if (!data) {
      lines.push("（無四化落宮資料）");
      lines.push("");
      continue;
    }
    const part = (s: SiHuaStar | null | undefined, transform: "祿" | "權" | "科" | "忌") => {
      if (!s) return null;
      const palace = toPalaceDisplayName(s.palaceName ?? s.palaceKey);
      if (!palace || palace === "落宮待核") return null;
      return `${s.starName}化${transform}落在${palace}，`;
    };
    const parts = [part(data.lu, "祿"), part(data.quan, "權"), part(data.ke, "科"), part(data.ji, "忌")].filter(Boolean) as string[];
    lines.push(parts.length > 0 ? parts.join("\n") : "（無四化落宮資料）");
    lines.push("");
  }
  const out = lines.join("\n").trimEnd();
  return out || (ft ? "（四化落宮見上方本命／大限／流年區塊）" : "（尚無四化落宮資料）");
}

/** ③ 四化能量集中（摘要）：M2-Truth 僅讀 chartJson.fourTransformations；祿／權／科／忌 各一列；不得為空。 */
function buildSihuaEnergyFocusBlock(chartJson: Record<string, unknown> | undefined): string {
  if (!chartJson) return "（尚無四化能量集中資料）";
  const { luPalaces, quanPalaces, kePalaces, jiPalaces } = getSihuaPalaceListsFromLayers(chartJson);
  const lines: string[] = [];
  if (luPalaces.length > 0) lines.push(`祿主要落在：${luPalaces.join("、")}`);
  if (quanPalaces.length > 0) lines.push(`權主要落在：${quanPalaces.join("、")}`);
  if (kePalaces.length > 0) lines.push(`科主要落在：${kePalaces.join("、")}`);
  if (jiPalaces.length > 0) lines.push(`忌主要落在：${jiPalaces.join("、")}`);
  const out = lines.join("\n\n");
  return out || "（尚無四化能量集中資料）";
}

/**
 * 從 chartJson 產出時間軸與四化區塊（契約：命理運算集中於此，僅 Worker 產出 Findings 時呼叫）。
 * 命書組裝層只讀 LifebookFindings，不得再呼叫此函式做正式版產出。
 */
export function buildSihuaTimeBlocksFromChart(chartJson: Record<string, unknown> | undefined): SihuaTimeBlocks {
  const empty = {
    timelineSummary: "",
    sihuaPlacement: "",
    sihuaEnergy: "",
    natalFlows: "",
    timeAxis: {
      birthSihuaLine: "",
      currentDecadalPalace: "（當前大限）",
      currentDecadeSihuaLine: "",
      flowYearMingPalace: "",
      flowYearSihuaLine: "",
      flowYearSihuaNote: "",
      flowYearSihuaFlyBlock: "",
      flowYearSihuaFlyExplanations: "",
    },
  };
  if (!chartJson || typeof chartJson !== "object") return empty;
  const display = buildTimeModuleDisplayFromChartJson(chartJson);
  const sameSihua = display.currentDecadeSihuaLine && display.flowYearSihuaLine &&
    display.currentDecadeSihuaLine === display.flowYearSihuaLine && !display.flowYearSihuaLine.startsWith("（無");
  const flowYearSihuaNote = sameSihua ? "（大限與流年同天干，四化相同）" : "";
  const yearlyLines = getYearlyFourTransformLinesFromFormula(chartJson);
  const flowYearSihuaFlyBlock = buildFourTransformBlocksForPalace(yearlyLines).techBlock;
  const flowYearSihuaFlyExplanations = yearlyLines
    .map((l) =>
      buildFlyStarExplanation(
        l.starName,
        l.type,
        l.fromPalaceName ?? l.fromPalaceKey ?? "",
        l.toPalaceName ?? l.toPalaceKey ?? ""
      )
    )
    .filter(Boolean)
    .join("\n\n");
  const timeAxis = {
    birthSihuaLine: display.birthSihuaLine,
    currentDecadalPalace: display.currentDecadalPalace,
    currentDecadeSihuaLine: display.currentDecadeSihuaLine,
    flowYearMingPalace: display.flowYearMingPalace,
    flowYearSihuaLine: display.flowYearSihuaLine,
    flowYearSihuaNote,
    flowYearSihuaFlyBlock: flowYearSihuaFlyBlock === "（本宮無四化飛星資料）" ? "" : flowYearSihuaFlyBlock,
    flowYearSihuaFlyExplanations: flowYearSihuaFlyExplanations || "",
  };
  const timelineSummary = [
    "生年四化：",
    timeAxis.birthSihuaLine,
    "",
    "目前大限：",
    `宮位：${timeAxis.currentDecadalPalace}`,
    `四化：${timeAxis.currentDecadeSihuaLine}`,
    "",
    "目前流年：",
    `命宮：${timeAxis.flowYearMingPalace}`,
    `四化：${timeAxis.flowYearSihuaLine}`,
    timeAxis.flowYearSihuaNote,
  ].filter(Boolean).join("\n");
  return {
    timelineSummary,
    sihuaPlacement: buildSihuaFallByPalaceBlock(chartJson),
    sihuaEnergy: buildSihuaEnergyFocusBlock(chartJson),
    natalFlows: buildNatalGongganFlowBlock(chartJson),
    timeAxis,
  };
}

/** P2 選項：提供 findings 時模組二只讀 findings，不讀 chartJson。若有 timelineValidationIssues 且含 error 則禁止輸出錯誤四化文案。 */
export interface InjectTimeModuleOptions {
  findings?: LifebookFindings;
  timeContext?: { currentDecadePalace?: string; shenGong?: string; year?: number; nominalAge?: number };
  timelineValidationIssues?: TimelineValidationIssue[];
  /** V2 reason 產出；傳入後 s15a/s16 會合併 overlapSummary、timeWindowScoresSummary、yearEventProbabilitiesSummary 等 placeholder。 */
  findingsV2?: LifebookFindingsV2 | null;
}

/** 模組二（s15/s15a/s16/s17/s18/s19/s20/s21）：用 chartJson 與 content 或 P2 findings 產出 placeholder map，注入 structure_analysis。P2 時傳入 options.findings 則只讀 findings；流年宮位／四化仍由 chartJson 組裝並與小限分開。 */
export function injectTimeModuleDataIntoSection(
  sectionKey: string,
  structureAnalysis: string,
  chartJson: Record<string, unknown>,
  content: AssembleContentLookup & { decisionMatrix?: DecisionMatrixConfig },
  config: LifeBookConfig | null,
  contentLocale: "zh-TW" | "zh-CN" | "en",
  options?: InjectTimeModuleOptions
): string {
  if (!structureAnalysis || typeof structureAnalysis !== "string") return structureAnalysis;
  const timeModuleKeys = ["s15", "s15a", "s16", "s17", "s18", "s19", "s20", "s21"];
  if (!timeModuleKeys.includes(sectionKey)) return structureAnalysis;
  let map: Record<string, string>;
  if (options?.findings && (options.findings.timeAxis != null || options.findings.sihuaPlacement != null)) {
    // 契約：命書正式版只讀 LifebookFindings；builder 不計算命理，僅組裝。
    map = assembleTimeModuleFromFindings(options.findings, options.timeContext ?? {}) as Record<string, string>;
    const axis = options.findings.timeAxis;
    if (axis) {
      map.birthSihuaLine = axis.birthSihuaLine;
      map.currentDecadalPalace = axis.currentDecadalPalace;
      map.currentDecadeSihuaLine = axis.currentDecadeSihuaLine;
      map.flowYearMingPalace = axis.flowYearMingPalace;
      map.flowYearSihuaLine = options.timelineValidationIssues && hasTimelineErrors(options.timelineValidationIssues)
        ? "（時間軸驗證未通過，暫不顯示流年四化）" : axis.flowYearSihuaLine;
      map.flowYearSihuaNote = axis.flowYearSihuaNote;
      map.flowYearSihuaFlyBlock = axis.flowYearSihuaFlyBlock ?? "";
      map.flowYearSihuaFlyExplanations = axis.flowYearSihuaFlyExplanations ?? "";
    }
    map.sihuaFallByPalaceBlock = options.findings.sihuaPlacement ?? "";
    map.sihuaEnergyFocusBlock = options.findings.sihuaEnergy ?? "";
    map.natalGongganFlowBlock = options.findings.natalFlows ?? "";
    // P0.2：合併 V2 placeholder（overlapSummary、timeWindowScoresSummary、yearEventProbabilitiesSummary 等），讓 template 新欄位有值。
    if (options.findingsV2) {
      if (sectionKey === "s15a") {
        const v2Result = buildS15aPlaceholderMapFromV2(options.findingsV2);
        if (v2Result.usable) for (const [k, v] of Object.entries(v2Result.map)) map[k] = v;
      }
      if (sectionKey === "s16") {
        const v2Result = buildS16PlaceholderMapFromV2(options.findingsV2);
        if (v2Result.usable) for (const [k, v] of Object.entries(v2Result.map)) map[k] = v;
      }
    }
    // P0.4：P2 路徑下 s20YearLine 可能來自 assembleS20 的 fallback「流年命宮」，改為使用 timeAxis.flowYearMingPalace。
    if (sectionKey === "s20" && map.flowYearMingPalace && map.s20YearLine?.includes("流年命宮")) {
      map.s20YearLine = map.s20YearLine.replace(/流年命宮/g, map.flowYearMingPalace);
    }
    return resolveSkeletonPlaceholders(structureAnalysis, map, { missingReplacement: "" });
  }

  // 相容層：無 findings 或無 timeAxis 時，仍從 chartJson 計算（僅供非正式／除錯路徑）。若有 findingsV2 則一併傳入，讓 s15a/s16 顯示 V2 欄位。
  const display = buildTimeModuleDisplayFromChartJson(chartJson);
  const sameSihua = display.currentDecadeSihuaLine && display.flowYearSihuaLine && display.currentDecadeSihuaLine === display.flowYearSihuaLine && !display.flowYearSihuaLine.startsWith("（無");
  const flowYearSihuaNote = sameSihua ? "（大限與流年同天干，四化相同）" : "";
  map = getPlaceholderMapFromContext(null, { chartJson, sectionKey, content, config, contentLocale, findingsV2: options?.findingsV2 ?? undefined });
  map.birthSihuaLine = display.birthSihuaLine;
  map.currentDecadeSihuaLine = display.currentDecadeSihuaLine;
  map.flowYearMingPalace = display.flowYearMingPalace;
  map.flowYearSihuaLine = display.flowYearSihuaLine;
  map.flowYearSihuaNote = flowYearSihuaNote;
  map.currentDecadalPalace = display.currentDecadalPalace;
  const yearlyFlyLines = getYearlyFourTransformLinesFromFormula(chartJson);
  const flowYearFlyTech = buildFourTransformBlocksForPalace(yearlyFlyLines).techBlock;
  map.flowYearSihuaFlyBlock = flowYearFlyTech === "（本宮無四化飛星資料）" ? "" : flowYearFlyTech;
  map.flowYearSihuaFlyExplanations = yearlyFlyLines
    .map((l) =>
      buildFlyStarExplanation(
        l.starName,
        l.type,
        l.fromPalaceName ?? l.fromPalaceKey ?? "",
        l.toPalaceName ?? l.toPalaceKey ?? ""
      )
    )
    .filter(Boolean)
    .join("\n\n");
  map.sihuaFallByPalaceBlock = buildSihuaFallByPalaceBlock(chartJson);
  map.sihuaEnergyFocusBlock = buildSihuaEnergyFocusBlock(chartJson);
  map.natalGongganFlowBlock = buildNatalGongganFlowBlock(chartJson);
  return resolveSkeletonPlaceholders(structureAnalysis, map, { missingReplacement: "" });
}

const WUXING_KEY_MAP: Record<string, string> = {
  木: "木", 火: "火", 土: "土", 金: "金", 水: "水",
  wood: "木", fire: "火", earth: "土", metal: "金", water: "水",
};

function getWuxingWeakLine(
  chartJson: Record<string, unknown>,
  wuxingPhrases: Record<string, string> = WUXING_WEAK_PHRASES
): string | null {
  const fiveElements = (chartJson?.fiveElements ?? chartJson?.wuxingData) as Record<string, unknown> | undefined;
  if (!fiveElements || typeof fiveElements !== "object") return null;
  const raw = fiveElements?.raw as Record<string, number> | undefined;
  if (!raw || typeof raw !== "object") return null;
  let minVal = Infinity;
  let weakestZh = "";
  for (const [key, zh] of Object.entries(WUXING_KEY_MAP)) {
    const v = Number(raw[key]);
    if (!Number.isNaN(v) && v < minVal) {
      minVal = v;
      weakestZh = zh;
    }
  }
  if (!weakestZh || !wuxingPhrases[weakestZh]) return null;
  return `五行弱項（${weakestZh}）：${wuxingPhrases[weakestZh]}`;
}

export interface WeightAnalysis {
  importance_map?: Record<string, string>;
  top_focus_palaces?: string[];
  risk_palaces?: string[];
  stable_palaces?: string[];
  traffic_signals?: Record<string, "red" | "yellow" | "green">;
}

/**
 * 依主戰場過濾「相對穩定宮位」並合併「優先關注宮位」：
 * - 相對穩定：若某宮含忌疊、祿疊+忌疊、權疊+主星集中，或已列入 dominantPalaces，則不可列入。
 * - 優先關注宮位：優先取 dominantPalaces 宮名 → hotPalaces（未重複）→ weight 其他焦點（未重複）。
 */
export function filterStablePalacesByDominant(
  weightAnalysis: WeightAnalysis,
  chartJson: Record<string, unknown>,
  config?: { tenGodByPalace?: Record<string, string> } | null
): WeightAnalysis {
  const events = buildS00EventsFromChart(chartJson);
  const normalizerInput = events as (Parameters<typeof normalizeSiHuaEventsLegacy>)[0];
  const { events: normalized } = normalizeSiHuaEventsLegacy(normalizerInput);
  const dominant = detectDominantPalaces({ chartJson, config: config ?? null, events: normalized });
  const { hotStars, hotPalaces } = getHotStarsAndPalaces(events);

  const dominantCanon = new Set(dominant.map((d) => toPalaceCanonical(d.palace)));
  const stable = weightAnalysis?.stable_palaces ?? [];
  const filteredStable =
    stable.length === 0
      ? stable
      : stable.filter((p) => {
          const canon = toPalaceCanonical(String(p));
          return canon && !dominantCanon.has(canon);
        });

  const mergedFocus: string[] = [];
  const seen = new Set<string>();
  for (const d of dominant) {
    const c = toPalaceCanonical(d.palace);
    if (c && !seen.has(c)) {
      seen.add(c);
      mergedFocus.push(d.palace);
    }
  }
  for (const p of hotPalaces) {
    const c = toPalaceCanonical(p);
    if (c && !seen.has(c)) {
      seen.add(c);
      mergedFocus.push(p);
    }
  }
  const weightFocus = weightAnalysis?.top_focus_palaces ?? [];
  for (const p of weightFocus) {
    const c = toPalaceCanonical(String(p));
    if (c && !seen.has(c)) {
      seen.add(c);
      mergedFocus.push(p);
    }
  }

  return {
    ...weightAnalysis,
    stable_palaces: filteredStable,
    top_focus_palaces: mergedFocus.length > 0 ? mergedFocus : weightAnalysis?.top_focus_palaces,
  };
}

function formatPalaceDisplayName(key: string): string {
  return key.endsWith("宮") ? key : key + "宮";
}

function buildS20TrafficSummary(weightAnalysis: WeightAnalysis): string | null {
  const signals = weightAnalysis?.traffic_signals;
  if (!signals || typeof signals !== "object" || Object.keys(signals).length === 0) return null;
  const green: string[] = [];
  const yellow: string[] = [];
  const red: string[] = [];
  for (const [palace, color] of Object.entries(signals)) {
    const display = formatPalaceDisplayName(palace);
    if (color === "green") green.push(display);
    else if (color === "yellow") yellow.push(display);
    else if (color === "red") red.push(display);
  }
  return [
    "【三盤紅綠燈】",
    "綠燈：" + (green.length ? green.join("、") : "—"),
    "黃燈：" + (yellow.length ? yellow.join("、") : "—"),
    "紅燈：" + (red.length ? red.join("、") : "—"),
  ].join("\n");
}

export type LifeBookDebugEnv = { LIFEBOOK_DEBUG?: string } | null | undefined;

export function buildSectionUserPrompt(
  sectionKey: string,
  chartJson: Record<string, unknown>,
  weightAnalysis: WeightAnalysis,
  config?: LifeBookConfig | null,
  _debugEnv?: LifeBookDebugEnv,
  content?: AssembleContentLookup,
  contentLocale?: "zh-TW" | "zh-CN" | "en"
): string {
  const templates = config?.templates?.length ? config.templates : SECTION_TEMPLATES;
  const template = templates.find((t) => t.section_key === sectionKey);
  if (!template) throw new Error(`Unknown section_key: ${sectionKey}`);

  const wuxingPhrases = config?.wuxing && Object.keys(config.wuxing).length > 0 ? config.wuxing : WUXING_WEAK_PHRASES;
  const importance = weightAnalysis?.importance_map?.[sectionKey] ?? template.importance_level ?? "medium";
  const chartSlice = getChartSlice(chartJson, template.slice_types);
  const chartStr = JSON.stringify(chartSlice);

  const strategicLinks = (chartJson?.strategicLinks as Array<{ type?: string; key?: string }> | undefined) ?? [];
  const strategicText = getStrategicText(strategicLinks);

  const palaceKey = template.palace_focus?.[0];
  const isPalaceSection = palaceKey && !["s00", "s03"].includes(sectionKey);
  let palaceBlock = "";
  if (isPalaceSection) {
    palaceBlock = "\n【宮位背景】\n宮位：" + palaceKey;
  }

  const rawStarPalaces = config?.starPalaces && Object.keys(config.starPalaces).length > 0 ? config.starPalaces : undefined;
  const starPalaces =
    rawStarPalaces && template.palace_focus?.length
      ? Object.fromEntries(
          Object.entries(rawStarPalaces).filter(([k]) =>
            template.palace_focus!.some((p) => k.endsWith("_" + p))
          )
        )
      : rawStarPalaces;

  const notes: string[] = [];
  if (starPalaces && Object.keys(starPalaces).length > 0) {
    notes.push("星曜評語（以下會直接顯示給當事人，請延伸說明、勿重複原句）：\n" + Object.entries(starPalaces).map(([k, v]) => `- ${k}: ${v}`).join("\n"));
  }
  if (config?.masterStars && (config.masterStars.命主 || config.masterStars.身主)) {
    const ms = config.masterStars;
    const parts: string[] = [];
    if (ms.命主) parts.push(`命主（${ms.命主.name}）：${ms.命主.text}`);
    if (ms.身主) parts.push(`身主（${ms.身主.name}）：${ms.身主.text}`);
    notes.push("命主・身主（依命宮地支與年支推算，非命宮內主星）：" + parts.join("；"));
  }
  if (sectionKey === "s04" && config?.lifeBodyRelationSnippet && config.lifeBodyRelationSnippet.length > 0) {
    notes.push("命身・身宮（請融入本章敘事）：\n" + config.lifeBodyRelationSnippet.join("\n"));
  }
  if (config?.starPalacesAuxAction && Object.keys(config.starPalacesAuxAction).length > 0) {
    notes.push(
      "【星曜行動建議】以下為輔星／煞星／雜曜在該宮的可執行方針，請納入本章「戰略建議」、轉成具體做法，勿只重複原句：\n" +
        Object.entries(config.starPalacesAuxAction)
          .map(([k, v]) => `- ${k}: ${v}`)
          .join("\n")
    );
  }
  if (config?.starPalacesAuxRisk && Object.keys(config.starPalacesAuxRisk).length > 0) {
    const riskEntries = Object.entries(config.starPalacesAuxRisk)
      .filter(([, v]) => Number.isFinite(v) && (v as number) >= 1 && (v as number) <= 5)
      .map(([k, v]) => `${k}=${v}`);
    if (riskEntries.length > 0) {
      notes.push(
        "【星曜風險等級】以下為輔星／煞星在該宮的風險等級（1=低～5=高）。等級 4～5 時請採用保守防禦語氣、主動提醒當事人避險：\n" +
          riskEntries.join("；")
      );
    }
  }
  if (template.needs_wuxing_weak) {
    const wuxLine = getWuxingWeakLine(chartJson, wuxingPhrases);
    if (wuxLine) notes.push(wuxLine);
  }
  if (Array.isArray(chartJson?.minorFortuneByPalace) && chartJson.minorFortuneByPalace.length > 0) {
    notes.push("可引用「各宮位小限年份與注意事項」中的年份與注意事項。");
  }
  if (strategicLinks.length > 0 && strategicText) {
    notes.push("可引用戰略聯動的因果方向：" + strategicText.slice(0, 200));
  }

  const weightStr = JSON.stringify({
    importance_map: weightAnalysis?.importance_map,
    top_focus_palaces: weightAnalysis?.top_focus_palaces,
    risk_palaces: weightAnalysis?.risk_palaces,
    stable_palaces: weightAnalysis?.stable_palaces,
  });

  const parts: string[] = [
    `【題號】${template.index}/22`,
    `【標題】${template.title}`,
    "",
    "【任務】",
    template.description + " 請依此題重點，寫出四欄內容：導入、行為模式、盲點、建議。",
    "",
    "【命盤資料】",
    chartStr,
  ];

  if (palaceBlock) parts.push(palaceBlock);

  if (notes.length > 0) {
    parts.push("", "【注意事項】");
    parts.push(...notes);
  }

  parts.push("", "【數據補充（必要時引用即可）】");
  parts.push(weightStr);

  if (Array.isArray(chartJson?.minorFortuneByPalace) && chartJson.minorFortuneByPalace.length > 0) {
    parts.push("", "各宮位小限年份與注意事項：", JSON.stringify(chartJson.minorFortuneByPalace, null, 2));
  }

  if (sectionKey === "s15") {
    if (chartJson?.decadalLimits != null) {
      parts.push("", "大限（decadalLimits）：", JSON.stringify(chartJson.decadalLimits, null, 2));
    }
    if (config?.minorFortuneSummary?.trim()) {
      parts.push("", "【小限疊宮統計摘要】", config.minorFortuneSummary.trim());
    }
    if (config?.minorFortuneTriggers?.trim()) {
      parts.push("", "【各宮位疊宮與引爆說明】", config.minorFortuneTriggers.trim());
    }
  }
  if (sectionKey === "s16" && (chartJson?.yearlyHoroscope != null || chartJson?.liunian != null)) {
    parts.push("", "當年小限 + 流年四化：", JSON.stringify({ yearlyHoroscope: chartJson.yearlyHoroscope, liunian: chartJson.liunian }, null, 2));
  }
  if (sectionKey === "s20") {
    const overlapBlock: Record<string, unknown> = {};
    if (chartJson?.decadalLimits != null) overlapBlock.decadalLimits = chartJson.decadalLimits;
    if (chartJson?.yearlyHoroscope != null) overlapBlock.yearlyHoroscope = chartJson.yearlyHoroscope;
    if (chartJson?.liunian != null) overlapBlock.liunian = chartJson.liunian;
    if (Object.keys(overlapBlock).length > 0) {
      parts.push("", "當前大限／當年小限／當年流年：", JSON.stringify(overlapBlock, null, 2));
    }
    const trafficSummary = buildS20TrafficSummary(weightAnalysis ?? {});
    if (trafficSummary) parts.push("", trafficSummary);
  }

  const sectionSkeleton = content?.lifebookSection?.[sectionKey];
  const hasAssembleContent =
    content &&
    (content.neuralLoops ||
      content.highPressure ||
      content.consciousPalace ||
      content.starBaseCore ||
      content.starPalaces ||
      content.wuxingEnergy ||
      sectionSkeleton);

  if (hasAssembleContent) {
    const assembleInput = buildAssembleInput(chartJson, config, contentLocale ?? "zh-TW");
    const riskProfile = assembleRiskProfile(assembleInput);
    const { loopSnippets, highPressureSnippets } = resolveAssembleSnippets(riskProfile, content!);

    const skipRiskBlockForSection = sectionKey === "s00" || sectionKey === "s03";
    if (loopSnippets.length > 0 || highPressureSnippets.length > 0) {
      if (!skipRiskBlockForSection) {
        const riskBlock = [
          "",
          "【命盤高壓模式與慣性迴路（系統計算）】",
          "以下內容請你在分析本題時作為心理底層節奏的參考，不必逐句重複：",
          "",
          "【神經迴路】",
          ...loopSnippets.map((s) => `- ${s}`),
          "",
          "【高壓情境】",
          ...highPressureSnippets.map((s) => `- ${s}`),
        ].join("\n");
        parts.push(riskBlock);
      }
    }

    if (sectionSkeleton && (sectionSkeleton.structure_analysis ?? sectionSkeleton.behavior_pattern ?? sectionSkeleton.blind_spots ?? sectionSkeleton.strategic_advice)) {
      const ctx = buildPalaceContext(sectionKey, chartJson, config ?? null, content!, contentLocale ?? "zh-TW");
      const placeholderMap = getPlaceholderMapFromContext(ctx, {
        chartJson,
        sectionKey,
        content,
        config,
        contentLocale: contentLocale ?? "zh-TW",
        forTechnicalOutput: false,
      });
      const gptMissing = "[此處資料缺失，可略過]";
      const resolved = {
        structure_analysis: resolveSkeletonPlaceholders(sectionSkeleton.structure_analysis ?? "", placeholderMap, { missingReplacement: gptMissing }),
        behavior_pattern: resolveSkeletonPlaceholders(sectionSkeleton.behavior_pattern ?? "", placeholderMap, { missingReplacement: gptMissing }),
        blind_spots: resolveSkeletonPlaceholders(sectionSkeleton.blind_spots ?? "", placeholderMap, { missingReplacement: gptMissing }),
        strategic_advice: resolveSkeletonPlaceholders(sectionSkeleton.strategic_advice ?? "", placeholderMap, { missingReplacement: gptMissing }),
      };
      const skeletonLines: string[] = [
        "",
        "【本章節骨架（已代入星曜、亮度廟旺利陷、四化、迴路等，請依此潤飾產出 JSON）】",
        "以下為本題四欄粗稿，系統已將宮位星曜、亮度（廟旺利陷）、四化流向、迴路與高壓代入；請依此潤飾、產出最終 JSON。勿加入五行、心識、十神相關描述。",
        "若骨架中出現「[此處資料缺失，可略過]」，表示該欄位無命盤資料，請略過該句或簡短帶過，不要硬寫。",
        "",
        "structure_analysis：",
        resolved.structure_analysis,
        "",
        "behavior_pattern：",
        resolved.behavior_pattern,
        "",
        "blind_spots：",
        resolved.blind_spots,
        "",
        "strategic_advice：",
        resolved.strategic_advice,
      ];
      parts.push(skeletonLines.join("\n"));
    }
  }

  parts.push("", "請開始生成。只輸出 JSON。");
  return parts.join("\n");
}

export function getDefaultConfig(): LifeBookConfig {
  return {
    persona: NEW_SYSTEM_PROMPT,
    rules: "",
    templates: [...SECTION_TEMPLATES],
    shishen: { ...SHISHEN_PHRASES },
    wuxing: { ...WUXING_WEAK_PHRASES },
    model: MODEL_CONFIG.default,
    behaviorAxisV1: false,
    behaviorAxisConflictV1: false,
    behaviorAxisLoopV1: false,
    behaviorAxisWideOpen: false,
  };
}

export { SECTION_ORDER };
export type { SihuaTimeBlocks } from "./lifebook/sihuaTimeBuilders.js";