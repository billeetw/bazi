/**
 * Cloudflare Worker: compute/all + content/2026
 * Replaces external 17gonplay-api.
 * content/2026: 優先從 D1 ui_copy_texts 讀取，DB 無資料時用靜態 JSON fallback。
 */
import { astro } from "iztro";
import { clockHourToTimeIndex, timeIndexFromWallClockInTimeZone } from "../../shared/iztroTimeIndex.js";
import {
  resolveFlowMonthSolarYmd,
  flowMonthAnchorDateForHoroscope,
  buildFlowMonthSolarTermSpanZh,
  FLOW_MONTH_TIMEZONE,
} from "./flowMonthContext.js";
import { palaceNameToZhTW, FIXED_PALACES_ZH_TW, BRANCH_RING, buildPalaceByBranch, getFlowYearPalace } from "./palace-map.js";
import { getMutagenStarsFromStem } from "./sihua-stem-table.js";
import { toEnStarKey, toZhStarKey } from "./star-map.js";
import { buildContentFromRows, mergeContent, emptyDbContent, type DbContent } from "./content-from-d1.js";

import contentZhTw from "../content/content-zh-TW.json";
import tenGodPalacesByIdZhTw from "../content/tenGodPalacesById-zh-TW.json";
import neuralLoopsZhTw from "../content/neuralLoops-zh-TW.json";
import highPressureZhTw from "../content/highPressure-zh-TW.json";
import starBaseCoreZhTw from "../content/starBaseCore-zh-TW.json";
import starBaseShadowZhTw from "../content/starBaseShadow-zh-TW.json";
import wuxingEnergyZhTw from "../content/wuxingEnergy-zh-TW.json";
import consciousPalaceZhTw from "../content/consciousPalace-zh-TW.json";
import archetypeElementZhTw from "../content/archetypeElement-zh-TW.json";
import archetypeStarZhTw from "../content/archetypeStar-zh-TW.json";
import lifebookSectionZhTw from "../content/lifebookSection-zh-TW.json";
import lifeLordBodyLordZhTw from "../content/lifeLord-bodyLord-zh-TW.json";
import lifeBodyRelationZhTw from "../content/lifeBodyRelation-zh-TW.json";
import starPalacesMainZhTw from "../content/starPalacesMain-zh-TW.json";
import starPalacesAuxZhTw from "../content/starPalacesAux-zh-TW.json";
import starSanfangFamiliesZhTw from "../content/starSanfangFamilies-zh-TW.json";
import starMetadataJson from "../content/starMetadata.json";
import palaceRiskCorpusZhTw from "../content/palaceRiskCorpus-zh-TW.json";
import narrativeCorpusZhTw from "../content/narrativeCorpus-zh-TW.json";
import decisionMatrixJson from "../content/decisionMatrix.json";
import starBaseMeaningZhTw from "../content/starBaseMeaning-zh-TW.json";
import palaceContextsZhTw from "../content/palaceContexts-zh-TW.json";
import contentEn from "../content/content-en.json";
import starCombinationsTable from "../content/ccl3/star-combinations.json";
import crossChartRulesJson from "../content/ccl3/cross-chart-rules.json";
import palaceAxisLinksJson from "../content/ccl3/palace-axis-links.json";
import palaceMatrixJson from "../content/ccl3/patterns/palace-transform-star-matrix.json";
import mainStarHintsJson from "../content/ccl3/patterns/main-star-inference-hints.json";
import {
  getSystemPrompt,
  buildSectionUserPrompt,
  getDefaultConfig,
  getChartSlice,
  getSectionTechnicalBlocks,
  getPalaceSectionReaderOverrides,
  injectTimeModuleDataIntoSection,
  buildSihuaTimeBlocksFromChart,
  getSihuaPlacementItemsFromChart,
  buildPiercingDiagnosticBundle,
  validateModuleOneOutput,
  filterStablePalacesByDominant,
  dedupeParagraphsAcrossBlocks,
  normalizePunctuation,
  PALACE_SECTION_KEYS,
  SECTION_ORDER,
  MODEL_CONFIG,
  type LifeBookConfig,
} from "./lifeBookPrompts.js";
import {
  normalizeChart,
  createEmptyFindings,
  buildLifebookFindingsFromChartAndContent,
  hasTimelineErrors,
  buildTimeModuleS17S19ReaderSnapshot,
  canonicalizeChartJsonForLifebook,
  type LifebookContentLookup,
} from "./lifebook/index.js";
import { omitClientSihuaWireForCompute } from "./lifebook/sihuaLayersClientDiff.js";
import { reasonFromChart } from "./lifebook/v2/reason/reasonFromChart.js";
import type { LifebookFindingsV2 } from "./lifebook/v2/schema/findingsV2.js";
import { SECTION_TEMPLATES } from "./lifeBookTemplates.js";
import { INFER_SYSTEM_PROMPT, buildInferUserPrompt, type InferOutput, type SectionInsight } from "./lifeBookInfer.js";
import { NARRATE_MODEL, buildNarrateSystemPrompt, buildNarrateUserPrompt } from "./lifeBookNarrate.js";
import lifebookPlanMatrixJson from "../data/lifebook-plan-matrix.json";
import {
  buildLifebookGenerateFingerprint,
  lifebookDailyHoroscopeCacheKey,
  lifebookKvCacheKey,
  lifebookSectionCacheKey,
  lifebookSectionRateLimitKey,
  LIFEBOOK_SECTION_CACHE_TTL_SEC,
  LIFEBOOK_SECTION_RATE_LIMIT_SEC,
} from "./lifebook/lifebookGenerateFingerprint.js";
import { buildDailyFlowResult } from "./lifebook/dailyFlow.js";
import { resolveTimeContextFromBody, timeContextToJson } from "./lifebook/timeContext.js";

interface Env {
  CONSULT_DB?: D1Database;
  CACHE?: KVNamespace;
  OPENAI_API_KEY?: string;
  /** Beta 邀請碼清單，逗號分隔，例如: CODE1,CODE2 */
  LIFEBOOK_BETA_CODES?: string;
  /** 設為 "0" 或 "false" 可關閉命書邀請碼封測（預設開啟） */
  LIFEBOOK_REQUIRE_INVITE?: string;
  /** 設為 "1" 或 "true" 時：s18 完整 prompt、hydration／Phase5B-10 診斷 log（僅 dev） */
  LIFEBOOK_DEBUG?: string;
  /** 設為 "1" 或 "true" 時：命書僅走 technical；並停用 ask／infer／narrate 等 OpenAI 路由 */
  LIFEBOOK_DISABLE_AI?: string;
}

function isLifebookDebugEnv(env?: Env): boolean {
  return env?.LIFEBOOK_DEBUG === "1" || env?.LIFEBOOK_DEBUG === "true";
}

function isLifebookAiDisabled(env?: Env): boolean {
  return env?.LIFEBOOK_DISABLE_AI === "1" || env?.LIFEBOOK_DISABLE_AI === "true";
}

/** 命書章節：未指定 output_mode 時視為 AI 版；LIFEBOOK_DISABLE_AI 時強制 technical */
function resolveLifebookOutputMode(body: { output_mode?: "ai" | "technical" } | undefined, env?: Env): "ai" | "technical" {
  if (isLifebookAiDisabled(env)) return "technical";
  return body?.output_mode === "technical" ? "technical" : "ai";
}

type Lang = "zh-TW" | "zh-CN" | "en-US";
type Locale = "zh-TW" | "zh-CN" | "en";
type PlanTier = "free" | "pro";

interface PlanConfig {
  sections?: string[];
  optional_sections?: string[];
}
interface LifebookPlanMatrix {
  version: string;
  free: PlanConfig;
  pro: PlanConfig;
}

const LIFEBOOK_PLAN_MATRIX = lifebookPlanMatrixJson as LifebookPlanMatrix;

/** 整本 technical 生成結果 KV TTL（秒），與前端 localStorage 7 天對齊 */
const LIFEBOOK_GENERATE_KV_TTL_SEC = 7 * 24 * 60 * 60;

function toPlanTier(raw: unknown): PlanTier {
  const t = typeof raw === "string" ? raw.trim().toLowerCase() : "";
  return t === "pro" ? "pro" : "free";
}

/** 不提供內建預設碼；正式封測請用 wrangler secret 設定 LIFEBOOK_BETA_CODES */
const LIFEBOOK_BETA_BUILTIN_CODES: readonly string[] = [];

function parseBetaInviteCodes(env?: Env): Set<string> {
  const out = new Set<string>(LIFEBOOK_BETA_BUILTIN_CODES.map((c) => c.toUpperCase()));
  const raw = String(env?.LIFEBOOK_BETA_CODES || "");
  raw.split(",")
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean)
    .forEach((c) => out.add(c));
  return out;
}

function isValidBetaInviteCode(env: Env | undefined, codeRaw: unknown): boolean {
  const code = typeof codeRaw === "string" ? codeRaw.trim().toUpperCase() : "";
  if (!code) return false;
  const allow = parseBetaInviteCodes(env);
  return allow.has(code);
}

function isLifebookInviteRequired(env?: Env): boolean {
  const raw = String(env?.LIFEBOOK_REQUIRE_INVITE ?? "").trim().toLowerCase();
  if (raw === "0" || raw === "false") return false;
  return true;
}

function normalizePlanSectionList(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  const inOrder = new Set(SECTION_ORDER as readonly string[]);
  const seen = new Set<string>();
  const out: string[] = [];
  for (const key of input) {
    if (typeof key !== "string") continue;
    const k = key.trim();
    if (!k || !inOrder.has(k) || seen.has(k)) continue;
    seen.add(k);
    out.push(k);
  }
  return out;
}

function resolvePlanAccess(planTierRaw: unknown, unlockSectionsRaw: unknown, betaInviteCodeRaw?: unknown, env?: Env): {
  planTier: PlanTier;
  availableSections: string[];
  lockedSectionKeys: string[];
  matrixVersion: string;
} {
  const inOrder = SECTION_ORDER as readonly string[];
  const elevatedByInvite = isValidBetaInviteCode(env, betaInviteCodeRaw);
  const planTier = elevatedByInvite ? "pro" : toPlanTier(planTierRaw);
  const cfg = planTier === "pro" ? LIFEBOOK_PLAN_MATRIX.pro : LIFEBOOK_PLAN_MATRIX.free;
  const allowedBase = normalizePlanSectionList(cfg?.sections);
  const unlocked = normalizePlanSectionList(unlockSectionsRaw);
  const allowedSet = new Set<string>([...allowedBase, ...unlocked]);
  const availableSections = inOrder.filter((s) => allowedSet.has(s));
  const lockedSectionKeys = inOrder.filter((s) => !allowedSet.has(s));
  return {
    planTier,
    availableSections,
    lockedSectionKeys,
    matrixVersion: LIFEBOOK_PLAN_MATRIX.version || "unknown",
  };
}

function buildLockedSectionTeaser(sectionKey: string): {
  section_key: string;
  title: string;
  teaser: string;
} {
  const tpl = SECTION_TEMPLATES.find((t) => t.section_key === sectionKey);
  const title = tpl?.title ?? `[${sectionKey}]`;
  const teaser = tpl?.description?.trim() || `本章「${title}」屬於進階章節，升級後可查看完整內容。`;
  return { section_key: sectionKey, title, teaser };
}

function buildLockedSectionPayload(sectionKey: string): {
  section_key: string;
  is_locked: true;
  lock_reason: "requires_pro";
  teaser: { section_key: string; title: string; teaser: string };
} {
  return {
    section_key: sectionKey,
    is_locked: true,
    lock_reason: "requires_pro",
    teaser: buildLockedSectionTeaser(sectionKey),
  };
}

function buildInviteRequiredPayload(sectionKey: string): {
  section_key: string;
  is_locked: true;
  lock_reason: "requires_beta_invite";
  teaser: { section_key: string; title: string; teaser: string };
} {
  const teaser = buildLockedSectionTeaser(sectionKey);
  return {
    section_key: sectionKey,
    is_locked: true,
    lock_reason: "requires_beta_invite",
    teaser: {
      ...teaser,
      teaser: "命書功能目前為封測中；請先輸入有效邀請碼再查看內容。",
    },
  };
}

const CORS_HEADERS: Record<string, string> = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET,POST,OPTIONS",
  "access-control-allow-headers": "content-type,authorization,x-requested-with,accept,origin",
  "access-control-max-age": "86400",
};

/** 與 buildSiHuaLayers 同源：預設略過已廢止 client wire；diff／KEEP 時保留（見 sihuaLayersClientDiff）。 */
function sanitizeLifebookRequestChartJson(chart: Record<string, unknown> | undefined): Record<string, unknown> | undefined {
  if (!chart || typeof chart !== "object") return chart;
  return omitClientSihuaWireForCompute(chart);
}

/** 嘗試修復 JSON 字串值內的未轉義換行（模型常回傳實際換行導致 parse 失敗） */
function trySanitizeJsonString(jsonStr: string): string {
  const parts = jsonStr.split('"');
  for (let i = 1; i < parts.length; i += 2) {
    parts[i] = parts[i].replace(/\r\n/g, "\\n").replace(/\n/g, "\\n").replace(/\r/g, "\\n");
  }
  return parts.join('"');
}

/** monthlyHoroscope 完整性檢查：S19 與 debug 用。與 /compute/all、/compute/horoscope 輸出格式一致。 */
function monthlyHoroscopeCompleteness(m: {
  stem?: string | null;
  branch?: string | null;
  palace?: string | null;
  mutagenStars?: Record<string, string> | null;
  stars?: unknown;
}): { isComplete: boolean; missing?: string[] } {
  const missing: string[] = [];
  if (!m.stem) missing.push("stem");
  if (!m.branch) missing.push("branch");
  if (!m.palace) missing.push("palace");
  const requiredMutagen = ["祿", "權", "科", "忌"];
  if (!m.mutagenStars) missing.push("mutagenStars");
  else requiredMutagen.forEach((k) => { if (!m.mutagenStars![k]) missing.push(`mutagenStars.${k}`); });
  if (m.stars == null) missing.push("stars");
  return { isComplete: missing.length === 0, missing: missing.length ? missing : undefined };
}

function buildMutagenStarsFromHoroscopeMutagen(mutagen: string[] | undefined): Record<string, string> | undefined {
  const MUTAGEN_KEYS = ["祿", "權", "科", "忌"] as const;
  if (!Array.isArray(mutagen)) return undefined;
  const out: Record<string, string> = {};
  mutagen.forEach((star, i) => {
    if (typeof star === "string" && star && MUTAGEN_KEYS[i]) out[MUTAGEN_KEYS[i]] = star;
  });
  return Object.keys(out).length ? out : undefined;
}

/**
 * 流月：以「同一錨點」呼叫 horoscope(anchor)，與 S19 標題西曆月、節氣說明一致。
 * anchor 預設為 Asia/Taipei 當日；可由 body.flowMonthSolarDate / horoscopeAsOf 覆寫。
 */
function buildMonthlyHoroscopePayload(
  astrolabeZhTw: { horoscope?: (d?: Date, ti?: number) => unknown; earthlyBranchOfSoulPalace?: string },
  body: Record<string, unknown>
): Record<string, unknown> | undefined {
  const mingBranch = String(astrolabeZhTw.earthlyBranchOfSoulPalace ?? "").trim();
  const palaceByBranch = mingBranch ? buildPalaceByBranch(mingBranch) : undefined;
  if (!palaceByBranch) return undefined;

  const { y, m, d } = resolveFlowMonthSolarYmd(body, new Date());
  const anchor = flowMonthAnchorDateForHoroscope(y, m, d);
  const horoscopeForMonthly = astrolabeZhTw.horoscope?.(anchor) as {
    monthly?: { heavenlyStem?: string; earthlyBranch?: string; mutagen?: string[]; stars?: unknown };
  } | undefined;

  const monthlyBranch = (horoscopeForMonthly?.monthly?.earthlyBranch ?? "").trim() || null;
  const flowMonthPalace =
    monthlyBranch && palaceByBranch[monthlyBranch] ? palaceByBranch[monthlyBranch] : null;

  if (!horoscopeForMonthly?.monthly || !flowMonthPalace) return undefined;

  const stem = (horoscopeForMonthly.monthly.heavenlyStem ?? "").trim() || null;
  const span = buildFlowMonthSolarTermSpanZh(y, m, d);

  const monthlyHoroscopeRaw: Record<string, unknown> = {
    stem,
    branch: monthlyBranch,
    palace: flowMonthPalace,
    mutagenStars: buildMutagenStarsFromHoroscopeMutagen(horoscopeForMonthly.monthly.mutagen),
    stars: horoscopeForMonthly.monthly.stars ?? undefined,
    solarYear: y,
    solarMonth: m,
    solarDay: d,
    displayTimeZone: FLOW_MONTH_TIMEZONE,
  };
  if (span) monthlyHoroscopeRaw.solarTermSpan = span;

  return {
    ...monthlyHoroscopeRaw,
    ...monthlyHoroscopeCompleteness(monthlyHoroscopeRaw as Parameters<typeof monthlyHoroscopeCompleteness>[0]),
  };
}

/** 從 OpenAI 回傳內容擷取命書章節 JSON（支援 ```json ... ``` 或裸 {...}） */
function parseSectionJson(content: string): Record<string, unknown> | null {
  const raw = content.trim();
  const codeBlock = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  const toParse = codeBlock ? codeBlock[1].trim() : raw;
  const jsonMatch = toParse.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return null;
  const jsonStr = jsonMatch[0];
  try {
    return JSON.parse(jsonStr) as Record<string, unknown>;
  } catch {
    try {
      return JSON.parse(trySanitizeJsonString(jsonStr)) as Record<string, unknown>;
    } catch {
      return null;
    }
  }
}

/** 命書版用：移除 rule id、驗收訊息、資料不足／未提供提示（用於 structure_analysis 及其他欄位） */
function sanitizeForReader(text: string): string {
  if (!text || typeof text !== "string") return text;
  return text
    .split("\n")
    .filter(
      (line) =>
        !/^\[R\d+_.*\]$/.test(line.trim()) &&
        !/^（模組一驗收未通過：.*）$/.test(line.trim()) &&
        !line.includes("未知宮位") &&
        !line.includes("本題底層參數解析")
    )
    .join("\n")
    .replace(/\s*\[R\d+_[^\]]*\]/g, "")
    .replace(/（此欄位資料不足）|（此處無資料）/g, "")
    .replace(/（模組一驗收未通過[^）]*）/g, "")
    .replace(/\(未提供\)/g, "");
}

/** P2 contentLookup：CCL3 表與 chart 無關，可重複使用；組裝後由 Findings Orchestrator 只讀。 */
const P2_CONTENT = {
  ccl3: {
    starCombinationsTable,
    crossChartRules: (crossChartRulesJson as { items?: unknown[] }).items ?? [],
    palaceAxisLinks: (palaceAxisLinksJson as { items?: unknown[] }).items ?? [],
    palaceMatrixPatterns: (palaceMatrixJson as { patterns?: unknown[] }).patterns ?? [],
    mainStarHints: (mainStarHintsJson as { items?: unknown[] }).items ?? [],
  },
} as LifebookContentLookup;

/** Phase 2：時間模組與結構／轉化章（s15～s23、s21 收束）才組 P2 findings 與 inject；開場 s00／模組一 s03 等不走 P2。 */
const TIME_MODULE_SECTION_KEYS = ["s15", "s15a", "s16", "s17", "s18", "s19", "s20", "s22", "s23", "s21"] as const;

function emptyP2(): {
  findings: import("./lifebook/index.js").LifebookFindings | null;
  findingsV2: LifebookFindingsV2 | null;
  timeContext: { currentDecadePalace?: string; shenGong?: string; year?: number; nominalAge?: number };
  timelineValidationIssues?: import("./lifebook/index.js").TimelineValidationIssue[];
  normalizedChart?: import("./lifebook/normalizedChart.js").NormalizedChart;
} {
  return { findings: null, findingsV2: null, timeContext: {} };
}

/**
 * 與 generate-section／generate 同源：星曜引用、命主身主、身宮、小限摘要等，供 prompts / findings / piercing 一致。
 */
function buildEffectiveLifeBookConfigForChart(
  chartJson: Record<string, unknown>,
  content: DbContent,
  locale: Locale,
  options?: {
    lifeBookBase?: LifeBookConfig | null;
    minorFortuneSummary?: string;
    minorFortuneTriggers?: string;
  }
): LifeBookConfig {
  const usedKeys = getUsedStarPalaceKeys(chartJson?.ziwei, locale);
  const usedStarPalaces = buildEffectiveUsedStarPalaces(content.starPalacesMain, content.starPalaces, usedKeys, content.starPalacesAux);
  const usedAuxAction = filterUsedStarPalaces(content.starPalacesAuxAction, usedKeys);
  const usedAuxRisk = filterUsedStarPalacesAuxRisk(content.starPalacesAuxRisk, usedKeys);
  const masterStars = getMasterStarsFromZiwei(chartJson?.ziwei);
  const masterStarsWithDefs = getMasterStarsWithDefs(masterStars, content.stars, {
    lifeLordDecode: content.lifeLordDecode,
    bodyLordDecode: content.bodyLordDecode,
  });
  const bodyPalaceInfo = getBodyPalaceInfo(chartJson, content.bodyPalaceByHour);
  const lifeBodySnippet = getLifeBodyRelationSnippet(
    bodyPalaceInfo,
    content.lifeBodyRelation as Record<string, { tagline: string; interpretation: string; strategy_tone: string }> | undefined,
    masterStarsWithDefs
  );
  return {
    ...(options?.lifeBookBase ?? getDefaultConfig()),
    starPalaces: usedStarPalaces,
    starPalacesAuxAction: Object.keys(usedAuxAction).length > 0 ? usedAuxAction : undefined,
    starPalacesAuxRisk: Object.keys(usedAuxRisk).length > 0 ? usedAuxRisk : undefined,
    masterStars: masterStarsWithDefs,
    bodyPalaceInfo: bodyPalaceInfo,
    lifeBodyRelationSnippet: lifeBodySnippet.length > 0 ? lifeBodySnippet : undefined,
    minorFortuneSummary: typeof options?.minorFortuneSummary === "string" ? options.minorFortuneSummary : undefined,
    minorFortuneTriggers: typeof options?.minorFortuneTriggers === "string" ? options.minorFortuneTriggers : undefined,
    tenGodByPalace: (chartJson?.tenGodByPalace as Record<string, string> | undefined) ?? {},
    wuxingByPalace: (chartJson?.wuxingByPalace as Record<string, string> | undefined) ?? {},
  };
}

/** P2：只吃 chartJson + contentLookup，產出 LifebookFindings + timeContext + findingsV2；模組二只讀 findings。時間／四化區塊於此寫入 findings；V2 reasoner 產出併入 findingsV2。 */
function buildP2FindingsAndContext(
  chartJson: Record<string, unknown> | undefined,
  /** 與 buildSectionUserPrompt／inject 同源；缺省時 piercing 不帶命主身主等（chart-only）。 */
  config?: LifeBookConfig | null
): {
  findings: import("./lifebook/index.js").LifebookFindings | null;
  findingsV2: LifebookFindingsV2 | null;
  timeContext: { currentDecadePalace?: string; shenGong?: string; year?: number; nominalAge?: number };
  timelineValidationIssues?: import("./lifebook/index.js").TimelineValidationIssue[];
  /** 與 findings 同源 normalizeChart，供 12 宮新模板／S17 overlay 等重用 */
  normalizedChart?: import("./lifebook/normalizedChart.js").NormalizedChart;
} {
  if (!chartJson || typeof chartJson !== "object") return { findings: null, findingsV2: null, timeContext: {} };
  let normalizedChart: import("./lifebook/normalizedChart.js").NormalizedChart | undefined;
  try {
    normalizedChart = normalizeChart(chartJson);
  } catch (e) {
    console.warn("[buildP2FindingsAndContext] normalizeChart failed:", e);
  }
  const result = buildLifebookFindingsFromChartAndContent({ chartJson, content: P2_CONTENT });
  if (!result) {
    return { findings: null, findingsV2: null, timeContext: {}, normalizedChart };
  }
  result.findings.piercingDiagnosticBundle = buildPiercingDiagnosticBundle(chartJson, config ?? null);
  result.findings.timeModuleS17S19ReaderSnapshot = buildTimeModuleS17S19ReaderSnapshot({
    chartJson,
    normalizedChart: normalizedChart ?? undefined,
  });
  const sihuaTime = buildSihuaTimeBlocksFromChart(chartJson);
  result.findings.timelineSummary = sihuaTime.timelineSummary;
  result.findings.sihuaPlacement = sihuaTime.sihuaPlacement;
  result.findings.sihuaEnergy = sihuaTime.sihuaEnergy;
  result.findings.natalFlows = sihuaTime.natalFlows;
  result.findings.timeAxis = sihuaTime.timeAxis;
  result.findings.sihuaPlacementItems = getSihuaPlacementItemsFromChart(chartJson);
  if (result.timelineValidationIssues?.length && hasTimelineErrors(result.timelineValidationIssues)) {
    if (result.findings.timeAxis) result.findings.timeAxis.flowYearSihuaLine = "（時間軸驗證未通過，暫不顯示流年四化）";
  }
  if (!normalizedChart) {
    try {
      normalizedChart = normalizeChart(chartJson);
    } catch (e) {
      console.warn("[buildP2FindingsAndContext] normalizeChart retry failed:", e);
    }
  }
  const v2 = normalizedChart ? reasonFromChart(normalizedChart) : null;
  if (result.findings && v2) {
    result.findings.transformEdges = v2.transformEdges;
    result.findings.triggeredPaths = v2.triggeredPaths;
    result.findings.stackSignals = v2.stackSignals;
    result.findings.timeWindowScores = v2.timeWindowScores;
    result.findings.eventProbabilities = v2.eventProbabilities;
  }
  return {
    findings: result.findings,
    findingsV2: result.findings ? (result.findings as LifebookFindingsV2) : null,
    timeContext: result.timeContext,
    timelineValidationIssues: result.timelineValidationIssues,
    normalizedChart,
  };
}

/**
 * 回傳給前端的 `chart_json`：在 canonical 命盤上附上與 Worker 一致的 findings 子集，
 * 供 Viewer `chart_json.findings.natalFlowItems`（Timeline 決策任務等）與 ADR-0001 對齊。
 */
function chartJsonWithClientFindings(
  chart: Record<string, unknown>,
  findings: import("./lifebook/index.js").LifebookFindings | null
): Record<string, unknown> {
  return {
    ...chart,
    findings: {
      natalFlowItems: findings?.natalFlowItems ?? [],
    },
  };
}

/** G6：production 清洗 — structure_analysis 專用，等同 sanitizeForReader */
function sanitizeStructureAnalysis(text: string): string {
  return sanitizeForReader(text);
}

type LifeBookLocaleNarrate = "zh-TW" | "zh-CN" | "en";

/**
 * 12 宮讀者版：與 generate-section 同源套用 getPalaceSectionReaderOverrides。
 * infer→narrate 管線先前未帶此步驟，會一直顯示 AI 填的舊骨架（【這一宮正在發生什麼】）。
 */
async function applyPalaceReaderOverridesForSection(
  env: Env | undefined,
  sectionKey: string,
  chartJson: Record<string, unknown>,
  locale: LifeBookLocaleNarrate,
  four: { structure_analysis: string; behavior_pattern: string; blind_spots: string; strategic_advice: string },
  opts?: {
    /** 已與 prompts／inject 同源組好的設定（例如 generate-section） */
    effectiveLifeBookConfig?: LifeBookConfig;
    /** 僅 KV 快取人格等；與 chart+content 合併為 effective config（例如 narrate） */
    lifeBookCache?: LifeBookConfig | null;
  }
): Promise<{ structure_analysis: string; behavior_pattern: string; blind_spots: string; strategic_advice: string }> {
  if (!PALACE_SECTION_KEYS.has(sectionKey)) return four;
  const dbLocale = locale === "en" ? "en" : locale === "zh-CN" ? "zh-CN" : "zh-TW";
  const contentLocale: Locale = locale === "en" ? "en" : locale === "zh-CN" ? "zh-CN" : "zh-TW";
  const { content: lookup } = await getContentForLocale(env, dbLocale);
  const effectiveConfig =
    opts?.effectiveLifeBookConfig ??
    buildEffectiveLifeBookConfigForChart(chartJson, lookup as DbContent, contentLocale, {
      lifeBookBase: opts?.lifeBookCache ?? null,
    });
  const p2 = buildP2FindingsAndContext(chartJson, effectiveConfig);
  let findingsForPalace = p2.findings ?? createEmptyFindings();
  if (!findingsForPalace.natalFlowItems || findingsForPalace.natalFlowItems.length === 0) {
    let extractedFlows: unknown[] =
      (chartJson?.natal as { flows?: unknown[]; birthTransforms?: unknown[] } | undefined)?.flows ||
      (chartJson?.natal as { birthTransforms?: unknown[] } | undefined)?.birthTransforms ||
      (chartJson?.natalTransforms as unknown[] | undefined) ||
      [];
    if ((!extractedFlows || extractedFlows.length === 0) && typeof normalizeChart === "function") {
      try {
        const normalized = normalizeChart(chartJson);
        extractedFlows = (normalized?.natal as { flows?: unknown[] } | undefined)?.flows ?? [];
      } catch (err) {
        console.warn("[applyPalaceReaderOverridesForSection] normalizeChart flows", err);
      }
    }
    if (Array.isArray(extractedFlows) && extractedFlows.length > 0) {
      const validTransform = (t: string | undefined): "祿" | "權" | "科" | "忌" =>
        t === "祿" || t === "權" || t === "科" || t === "忌" ? t : "祿";
      findingsForPalace.natalFlowItems = extractedFlows
        .map((e: unknown) => {
          const x = e as { fromPalace?: string; toPalace?: string; starName?: string; transform?: string };
          return { fromPalace: x.fromPalace ?? "", toPalace: x.toPalace ?? "", starName: x.starName, transform: validTransform(x.transform) };
        })
        .filter((item) => Boolean(item.fromPalace && item.toPalace && item.transform)) as Array<{
        fromPalace: string;
        toPalace: string;
        starName?: string;
        transform: "祿" | "權" | "科" | "忌";
      }>;
    }
  }
  const overrides = getPalaceSectionReaderOverrides(
    sectionKey,
    chartJson,
    effectiveConfig,
    lookup as import("./lifebook/assembler.js").AssembleContentLookup,
    locale,
    findingsForPalace,
    p2.normalizedChart
  );
  if (!overrides?.resolvedStructureAnalysis || overrides.resolvedStructureAnalysis.trim() === "") {
    return four;
  }
  return {
    structure_analysis: sanitizeStructureAnalysis(overrides.resolvedStructureAnalysis),
    behavior_pattern: sanitizeForReader(overrides.behavior_pattern),
    blind_spots: sanitizeForReader(overrides.blind_spots),
    strategic_advice: sanitizeForReader(overrides.strategic_advice),
  };
}

/** 從已解析物件取出四欄位字串，缺的補空字串；若至少有一欄有內容則回傳可用 section */
function toSectionFourFields(
  parsed: Record<string, unknown>,
  sectionKey: string,
  sectionTitle: string
): { structure_analysis: string; behavior_pattern: string; blind_spots: string; strategic_advice: string } | null {
  const sa = typeof parsed.structure_analysis === "string" ? parsed.structure_analysis : "";
  const bp = typeof parsed.behavior_pattern === "string" ? parsed.behavior_pattern : "";
  const bl = typeof parsed.blind_spots === "string" ? parsed.blind_spots : "";
  const st = typeof parsed.strategic_advice === "string" ? parsed.strategic_advice : "";
  if (!sa && !bp && !bl && !st) return null;
  return {
    structure_analysis: sa || "(未提供)",
    behavior_pattern: bp || "(未提供)",
    blind_spots: bl || "(未提供)",
    strategic_advice: st || "(未提供)",
  };
}

function json(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: {
      "content-type": "application/json; charset=utf-8",
      ...CORS_HEADERS,
      ...(init.headers as Record<string, string>),
    },
  });
}

const LIFEBOOK_OPENAI_DEBUG_MAX_CONTENT = 2000;

/** Debug: 命書 → OpenAI 實際送出的 payload（含 strategicLinks / starPalaces 是否在 prompt 內） */
function logLifeBookOpenAIPayload(
  endpoint: string,
  opts: {
    model: string;
    messages: Array<{ role: string; content: string }>;
    chartJson?: Record<string, unknown> | null;
    contentOrDbContent?: { starPalaces?: Record<string, unknown> } | null;
  }
) {
  const chart = opts.chartJson ?? null;
  const strategicLinks = chart?.strategicLinks ?? null;
  const dbContent = (chart as Record<string, unknown>)?.dbContent as { starPalaces?: unknown } | undefined;
  const starPalaces =
    chart?.starPalaces ??
    dbContent?.starPalaces ??
    opts.contentOrDbContent?.starPalaces ??
    null;
  const truncate = (s: string, max: number) =>
    s.length <= max ? s : s.slice(0, max) + "…";
  const summary = {
    model: opts.model,
    messages: opts.messages.map((m) => ({
      role: m.role,
      contentLength: typeof m.content === "string" ? m.content.length : 0,
      contentPreview:
        typeof m.content === "string"
          ? truncate(m.content, 300)
          : "",
    })),
    chart_json_keys: chart ? Object.keys(chart) : null,
    strategicLinks:
      strategicLinks != null
        ? Array.isArray(strategicLinks)
          ? strategicLinks.length
          : strategicLinks
        : null,
    starPalaces_keys:
      starPalaces && typeof starPalaces === "object"
        ? Object.keys(starPalaces)
        : null,
  };
  console.log(
    "🧾 OPENAI REQUEST PAYLOAD [" + endpoint + "]",
    JSON.stringify(summary, null, 2)
  );
  const fullMessages = opts.messages.map((m) => ({
    role: m.role,
    content:
      typeof m.content === "string"
        ? truncate(m.content, LIFEBOOK_OPENAI_DEBUG_MAX_CONTENT)
        : m.content,
  }));
  console.log(
    "🧾 OPENAI REQUEST MESSAGES [" + endpoint + "]",
    JSON.stringify({ model: opts.model, messages: fullMessages }, null, 2)
  );
}

function corsPreflight() {
  return new Response(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}

function badRequest(message: string) {
  return json({ ok: false, error: message }, { status: 400 });
}

/**
 * Model-based options merge: gpt-3.x / gpt-4.x 傳 temperature；gpt-5.x 不傳（API 不接受）
 */
function getGenerationOptions(model: string, temperature: number): { model: string; temperature?: number } {
  const isLegacy = model.startsWith("gpt-3") || model.startsWith("gpt-4");
  return isLegacy ? { model, temperature } : { model };
}

function stableChartId(input: unknown): string {
  const s = JSON.stringify(input);
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return `c_${h.toString(16)}`;
}

/** 地支 → bodyPalaceByHour 的 key（時辰組） */
const HOUR_BRANCH_TO_GROUP: Record<string, string> = {
  子: "子午", 午: "子午", 丑: "丑未", 未: "丑未", 寅: "寅申", 申: "寅申",
  卯: "卯酉", 酉: "卯酉", 辰: "辰戌", 戌: "辰戌", 巳: "巳亥", 亥: "巳亥",
};

/** 從 chart 取得生時（0–23），優先 birthInfo.hour、ziwei.basic.hour、bazi 等。 */
function getBirthHourFromChart(chart: Record<string, unknown> | null | undefined): number | undefined {
  if (!chart || typeof chart !== "object") return undefined;
  const birthInfo = chart.birthInfo as Record<string, unknown> | undefined;
  if (birthInfo && typeof birthInfo.hour === "number" && Number.isFinite(birthInfo.hour))
    return birthInfo.hour;
  const ziwei = chart.ziwei as Record<string, unknown> | undefined;
  const basic = ziwei?.basic as Record<string, unknown> | undefined;
  if (basic && typeof basic.hour === "number" && Number.isFinite(basic.hour))
    return basic.hour;
  const bazi = chart.bazi as Record<string, unknown> | undefined;
  if (bazi && typeof bazi.hour === "number" && Number.isFinite(bazi.hour))
    return bazi.hour;
  if (typeof (chart as Record<string, unknown>).hour === "number")
    return (chart as Record<string, unknown>).hour as number;
  return undefined;
}

/** 依生時與 bodyPalaceByHour 取得身宮解讀；命宮固定為「命宮」。 */
function getBodyPalaceInfo(
  chart: Record<string, unknown> | null | undefined,
  bodyPalaceByHour: Record<string, { palace: string; tagline: string; interpretation: string }> | undefined
): { palace: string; tagline: string; interpretation: string } | undefined {
  if (!bodyPalaceByHour || typeof bodyPalaceByHour !== "object") return undefined;
  const hour = getBirthHourFromChart(chart);
  if (hour === undefined) return undefined;
  const timeIndex = clockHourToTimeIndex(hour);
  const branch = BRANCH_RING[timeIndex];
  const group = branch ? HOUR_BRANCH_TO_GROUP[branch] : undefined;
  if (!group || !bodyPalaceByHour[group]) return undefined;
  return bodyPalaceByHour[group];
}

/** 命宮名正規化為與 FIXED_PALACES 可比對（遷移宮→遷移、命宮→命宮）。 */
function normalizePalaceName(palace: string): string {
  const s = (palace || "").replace(/宮$/, "").trim();
  return s === "命" ? "命宮" : s || palace;
}

/** 組出命身關係與身宮的注意事項片段，供 s04 注入。 */
function getLifeBodyRelationSnippet(
  bodyPalaceInfo: { palace: string; tagline: string; interpretation: string } | undefined,
  lifeBodyRelation: Record<string, { tagline: string; interpretation: string; strategy_tone: string }> | undefined,
  masterStars: { 命主?: { name: string; text: string }; 身主?: { name: string; text: string } } | undefined
): string[] {
  const lines: string[] = [];
  if (bodyPalaceInfo?.interpretation) {
    lines.push("【身宮】" + bodyPalaceInfo.interpretation);
  }
  if (!lifeBodyRelation || typeof lifeBodyRelation !== "object") return lines;
  const bodyPalaceNorm = bodyPalaceInfo ? normalizePalaceName(bodyPalaceInfo.palace) : "";
  const isSamePalace = bodyPalaceNorm === "命宮";
  if (isSamePalace && lifeBodyRelation.lifeBodySamePalace) {
    const r = lifeBodyRelation.lifeBodySamePalace;
    if (r.interpretation) lines.push("【命身同宮】" + r.interpretation);
  } else if (!isSamePalace && bodyPalaceNorm && lifeBodyRelation.lifeBodyPivot) {
    const r = lifeBodyRelation.lifeBodyPivot;
    if (r.interpretation) lines.push("【命身錯位】" + r.interpretation);
  }
  if (masterStars?.命主 && masterStars?.身主 && lifeBodyRelation.lifeLordBodyLordDialogue) {
    const r = lifeBodyRelation.lifeLordBodyLordDialogue;
    if (r.interpretation) lines.push("【命主與身主的內外對話】" + r.interpretation);
  }
  return lines;
}

/**
 * Extract mainStars from iztro astrolabe.
 * iztro palaces[i] = 地支位置 i（寅=0, 卯=1, ...）。用「命宮地支→索引」與 FIXED_PALACES_ZH_TW 對應，
 * 不依賴 palace.name，避免 i18n/名稱錯位導致某一宮顯示上一宮星曜。
 */
function extractZiweiMainStars(astrolabe: unknown, language: Lang): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const p of FIXED_PALACES_ZH_TW) out[p] = [];

  const a = astrolabe as {
    earthlyBranchOfSoulPalace?: string;
    palaces?: Array<{
      name?: string;
      majorStars?: Array<{ name?: string }>;
      minorStars?: Array<{ name?: string }>;
      adjectiveStars?: Array<{ name?: string }>;
    }>;
  };

  const palaces = a?.palaces ?? [];
  const soulBranch = (a?.earthlyBranchOfSoulPalace ?? "").trim();
  const mingIdx = BRANCH_RING.indexOf(soulBranch as (typeof BRANCH_RING)[number]);
  const soulIndex = mingIdx >= 0 ? mingIdx : 0;

  const keys = FIXED_PALACES_ZH_TW as readonly string[];
  for (let i = 0; i < palaces.length && i < 12; i++) {
    const palace = palaces[i];
    const palaceIndex = (soulIndex - i + 12) % 12;
    const zhTWKey = keys[palaceIndex];

    const starNames: string[] = [];
    const addStars = (arr: Array<{ name?: string }> | undefined) => {
      if (!Array.isArray(arr)) return;
      for (const s of arr) {
        const n = s?.name;
        if (typeof n === "string" && n.trim()) {
          const name = language === "en-US" ? toEnStarKey(n.trim(), language) : n.trim();
          if (name && !starNames.includes(name)) starNames.push(name);
        }
      }
    };
    addStars(palace?.majorStars);
    addStars(palace?.minorStars);
    addStars(palace?.adjectiveStars);
    out[zhTWKey] = starNames;
  }

  return out;
}

/** 命書亮度區塊用：依 FIXED_ORDER（命宮、兄弟宮…）回傳 12 宮；每宮含 name + major/minor/adjective（含 brightness）。 */
function extractZiweiPalacesWithBrightness(astrolabe: unknown): Array<{
  name: string;
  majorStars: Array<{ name: string; brightness?: string }>;
  minorStars: Array<{ name: string; brightness?: string }>;
  adjectiveStars: Array<{ name: string; brightness?: string }>;
}> {
  const FIXED_ORDER_LEN = 12;
  const out: Array<{
    name: string;
    majorStars: Array<{ name: string; brightness?: string }>;
    minorStars: Array<{ name: string; brightness?: string }>;
    adjectiveStars: Array<{ name: string; brightness?: string }>;
  }> = [];
  for (let j = 0; j < FIXED_ORDER_LEN; j++) {
    const p = FIXED_PALACES_ZH_TW[j];
    out.push({
      name: p === "命宮" ? p : `${p}宮`,
      majorStars: [],
      minorStars: [],
      adjectiveStars: [],
    });
  }

  const a = astrolabe as {
    earthlyBranchOfSoulPalace?: string;
    palaces?: Array<{
      majorStars?: Array<{ name?: string; brightness?: string }>;
      minorStars?: Array<{ name?: string; brightness?: string }>;
      adjectiveStars?: Array<{ name?: string; brightness?: string }>;
    }>;
  };
  const palaces = a?.palaces ?? [];
  const soulBranch = (a?.earthlyBranchOfSoulPalace ?? "").trim();
  const mingIdx = BRANCH_RING.indexOf(soulBranch as (typeof BRANCH_RING)[number]);
  const soulIndex = mingIdx >= 0 ? mingIdx : 0;

  const toStar = (s: { name?: string; brightness?: string }): { name: string; brightness?: string } | null => {
    const name = (s?.name ?? "").trim();
    if (!name) return null;
    const brightness = typeof s?.brightness === "string" && s.brightness.trim() ? s.brightness.trim() : undefined;
    return { name, brightness };
  };

  for (let i = 0; i < palaces.length && i < FIXED_ORDER_LEN; i++) {
    const j = (soulIndex - i + FIXED_ORDER_LEN) % FIXED_ORDER_LEN;
    const palace = palaces[i];
    const majorStars = (palace?.majorStars ?? [])
      .map(toStar)
      .filter((x): x is { name: string; brightness?: string } => x != null);
    const minorStars = (palace?.minorStars ?? [])
      .map(toStar)
      .filter((x): x is { name: string; brightness?: string } => x != null);
    const adjectiveStars = (palace?.adjectiveStars ?? [])
      .map(toStar)
      .filter((x): x is { name: string; brightness?: string } => x != null);
    out[j] = { ...out[j], majorStars, minorStars, adjectiveStars };
  }
  return out;
}

/**
 * 從命盤 ziwei 解析出「星曜_宮位」key set，用於只送用得到的 starPalaces subset。
 * content 為 zh-TW/zh-CN 時 key 格式為「紫微_命宮」；en 時宮位仍為 zh（content-en 可能無 starPalaces）。
 * 支援前端 compute 回傳格式 ziwei.mainStars（宮名 -> 星名陣列）。
 */
function getUsedStarPalaceKeys(astrolabe: unknown, contentLocale: Locale): string[] {
  if (!astrolabe || typeof astrolabe !== "object") return [];
  const lang: Lang = contentLocale === "en" ? "en-US" : contentLocale === "zh-CN" ? "zh-CN" : "zh-TW";
  let palaceToStars = extractZiweiMainStars(astrolabe, lang);
  const hasAnyStars = Object.values(palaceToStars).some((arr) => Array.isArray(arr) && arr.length > 0);
  if (!hasAnyStars) {
    const z = astrolabe as Record<string, unknown>;
    const mainStars = z?.mainStars as Record<string, string[]> | undefined;
    if (mainStars && typeof mainStars === "object" && !Array.isArray(mainStars)) {
      palaceToStars = mainStars;
    }
  }
  const keys: string[] = [];
  for (const [palace, stars] of Object.entries(palaceToStars)) {
    if (!Array.isArray(stars)) continue;
    for (const star of stars) {
      if (!star || typeof star !== "string") continue;
      const starForKey = contentLocale === "zh-TW" || contentLocale === "zh-CN" ? (toZhStarKey(star) || star) : star;
      keys.push(`${starForKey}_${palace}`);
    }
  }
  return keys;
}

/** 依 key set 過濾出只含用得到的 starPalaces 條目。 */
function filterUsedStarPalaces(
  full: Record<string, string> | undefined | null,
  usedKeys: string[]
): Record<string, string> {
  if (!full || typeof full !== "object") return {};
  const set = new Set(usedKeys);
  const out: Record<string, string> = {};
  for (const k of set) {
    if (typeof full[k] === "string") out[k] = full[k];
  }
  return out;
}

/** 依 key set 過濾出只含用得到的 starPalacesAuxRisk 條目（風險等級 1～5）。 */
function filterUsedStarPalacesAuxRisk(
  full: Record<string, number> | undefined | null,
  usedKeys: string[]
): Record<string, number> {
  if (!full || typeof full !== "object") return {};
  const set = new Set(usedKeys);
  const out: Record<string, number> = {};
  for (const k of set) {
    const v = full[k];
    if (typeof v === "number" && Number.isFinite(v) && v >= 1 && v <= 5) out[k] = Math.round(v);
  }
  return out;
}

/** 合併 usedKeys 對應的 starPalaces：優先 starPalacesMain，否則 starPalaces，否則 starPalacesAux（輔星／煞星／雜曜 解釋）。 */
function buildEffectiveUsedStarPalaces(
  starPalacesMain: Record<string, string> | undefined | null,
  starPalaces: Record<string, string> | undefined | null,
  usedKeys: string[],
  starPalacesAux?: Record<string, string> | undefined | null
): Record<string, string> {
  const set = new Set(usedKeys);
  const out: Record<string, string> = {};
  for (const k of set) {
    const v =
      (starPalacesMain && typeof starPalacesMain[k] === "string" ? starPalacesMain[k] : null) ??
      (starPalaces && typeof starPalaces[k] === "string" ? starPalaces[k] : null) ??
      (starPalacesAux && typeof starPalacesAux[k] === "string" ? starPalacesAux[k] : null);
    if (v) out[k] = v;
  }
  return out;
}

/** 從 ziwei 取出命主、身主星名（正規化為 content 用繁體 key）。 */
function getMasterStarsFromZiwei(ziwei: unknown): { 命主?: string; 身主?: string } {
  if (!ziwei || typeof ziwei !== "object") return {};
  const z = ziwei as Record<string, unknown>;
  const basic = z?.basic as Record<string, unknown> | undefined;
  const core = z?.core as Record<string, unknown> | undefined;
  const rawSoul =
    (basic?.masterStar as string) ??
    (z?.soul as string) ??
    (core?.命主 as string) ??
    (core?.mingzhu as string) ??
    "";
  const rawBody =
    (basic?.bodyStar as string) ??
    (z?.body as string) ??
    (core?.身主 as string) ??
    (core?.shengong as string) ??
    "";
  const 命主 = rawSoul ? (toZhStarKey(rawSoul) || String(rawSoul).trim()) || undefined : undefined;
  const 身主 = rawBody ? (toZhStarKey(rawBody) || String(rawBody).trim()) || undefined : undefined;
  return { 命主: 命主 || undefined, 身主: 身主 || undefined };
}

/** 依命主/身主星名取說明：優先 lifeLordDecode/bodyLordDecode（靈魂解碼、工具箱解碼），否則 content.stars。回傳 { 命主: { name, text }, 身主: { name, text } } 供 prompt 使用。 */
function getMasterStarsWithDefs(
  masterStars: { 命主?: string; 身主?: string },
  starsContent: Record<string, string> | undefined | null,
  decodes?: { lifeLordDecode?: Record<string, string>; bodyLordDecode?: Record<string, string> } | null
): { 命主?: { name: string; text: string }; 身主?: { name: string; text: string } } {
  const out: { 命主?: { name: string; text: string }; 身主?: { name: string; text: string } } = {};
  const soulText =
    masterStars.命主 &&
    (decodes?.lifeLordDecode?.[masterStars.命主] ?? (starsContent && typeof starsContent[masterStars.命主] === "string" ? starsContent[masterStars.命主] : undefined));
  if (masterStars.命主 && soulText) out.命主 = { name: masterStars.命主, text: soulText };
  const bodyText =
    masterStars.身主 &&
    (decodes?.bodyLordDecode?.[masterStars.身主] ?? (starsContent && typeof starsContent[masterStars.身主] === "string" ? starsContent[masterStars.身主] : undefined));
  if (masterStars.身主 && bodyText) out.身主 = { name: masterStars.身主, text: bodyText };
  return out;
}

const CONTENT_CACHE_TTL = 3600; // 1 小時，content 更新頻率不高

/** 單一來源：KV → D1 → 靜態 JSON；所有用到 content 的 API 共用此層，改快取策略只動此處。 */
async function getContentForLocale(
  env: Env | undefined,
  locale: string
): Promise<{ content: DbContent; source: "kv" | "d1" | "static" }> {
  const dbLocale = ["en", "zh-CN", "zh-TW"].includes(locale) ? locale : "zh-TW";
  const cacheKey = `content:${dbLocale}:v2`;
  const staticContent: DbContent =
    dbLocale === "en"
      ? ({ ...(contentEn as unknown as DbContent), decisionMatrix: decisionMatrixJson as DbContent["decisionMatrix"] })
      : {
          ...(contentZhTw as DbContent),
          tenGodPalacesById: {
            ...((contentZhTw as Record<string, unknown>).tenGodPalacesById as Record<string, string> | undefined),
            ...(tenGodPalacesByIdZhTw as Record<string, string>),
          },
          neuralLoops: {
            ...((contentZhTw as Record<string, unknown>).neuralLoops as Record<string, string> | undefined),
            ...(neuralLoopsZhTw as Record<string, string>),
          },
          highPressure: {
            ...((contentZhTw as Record<string, unknown>).highPressure as Record<string, string> | undefined),
            ...(highPressureZhTw as Record<string, string>),
          },
          starBaseCore: {
            ...((contentZhTw as Record<string, unknown>).starBaseCore as Record<string, string> | undefined),
            ...(starBaseCoreZhTw as Record<string, string>),
          },
          starBaseShadow: {
            ...((contentZhTw as Record<string, unknown>).starBaseShadow as Record<string, string> | undefined),
            ...(starBaseShadowZhTw as Record<string, string>),
          },
          wuxingEnergy: {
            ...((contentZhTw as Record<string, unknown>).wuxingEnergy as Record<string, string> | undefined),
            ...(wuxingEnergyZhTw as Record<string, string>),
          },
          consciousPalace: {
            ...((contentZhTw as Record<string, unknown>).consciousPalace as Record<string, string> | undefined),
            ...(consciousPalaceZhTw as Record<string, string>),
          },
          archetypeElement: {
            ...((contentZhTw as Record<string, unknown>).archetypeElement as Record<string, { label: string; title: string; description: string }> | undefined),
            ...(archetypeElementZhTw as Record<string, { label: string; title: string; description: string }>),
          },
          archetypeStar: {
            ...((contentZhTw as Record<string, unknown>).archetypeStar as Record<string, { label: string; title: string; description: string }> | undefined),
            ...(archetypeStarZhTw as Record<string, { label: string; title: string; description: string }>),
          },
          lifebookSection: {
            ...((contentZhTw as Record<string, unknown>).lifebookSection as Record<string, { structure_analysis?: string; behavior_pattern?: string; blind_spots?: string; strategic_advice?: string }> | undefined),
            ...(lifebookSectionZhTw as Record<string, { structure_analysis?: string; behavior_pattern?: string; blind_spots?: string; strategic_advice?: string }>),
          },
          lifeLordDecode: (lifeLordBodyLordZhTw as Record<string, unknown>).lifeLordDecode as Record<string, string> | undefined,
          bodyLordDecode: (lifeLordBodyLordZhTw as Record<string, unknown>).bodyLordDecode as Record<string, string> | undefined,
          bodyPalaceByHour: (lifeLordBodyLordZhTw as Record<string, unknown>).bodyPalaceByHour as Record<string, { palace: string; tagline: string; interpretation: string }> | undefined,
          lifeBodyRelation: lifeBodyRelationZhTw as Record<string, { tagline: string; interpretation: string; strategy_tone: string }>,
          starLogicMain: (starPalacesMainZhTw as Record<string, unknown>).starLogicMain as Record<string, string> | undefined,
          starPalacesMain: (starPalacesMainZhTw as Record<string, unknown>).starPalacesMain as Record<string, string> | undefined,
          starPalacesAux: (starPalacesAuxZhTw as Record<string, unknown>).starPalacesAux as Record<string, string> | undefined,
          starPalacesAuxAction: (starPalacesAuxZhTw as Record<string, unknown>).starPalacesAuxAction as Record<string, string> | undefined,
          starPalacesAuxRisk: (starPalacesAuxZhTw as Record<string, unknown>).starPalacesAuxRisk as Record<string, number> | undefined,
          starBaseMeaning: (starBaseMeaningZhTw as Record<string, unknown>).starBaseMeaning as Record<string, string> | undefined,
          palaceContexts: (palaceContextsZhTw as Record<string, unknown>).palaceContexts as Record<string, string> | undefined,
          starSanfangFamilies: (starSanfangFamiliesZhTw as { starSanfangFamilies?: DbContent["starSanfangFamilies"] }).starSanfangFamilies,
          starMetadata: (starMetadataJson as Record<string, unknown>).stars
            ? { starNameZhToId: (starMetadataJson as Record<string, unknown>).starNameZhToId as Record<string, string>, stars: (starMetadataJson as Record<string, unknown>).stars as Record<string, { name_zh: string; category: string; base_weight: number; base_risk: number }> }
            : undefined,
          palaceRiskSummary: (palaceRiskCorpusZhTw as Record<string, unknown>).palaceRiskSummary as Record<string, string> | undefined,
          palaceActionAdvice: (palaceRiskCorpusZhTw as Record<string, unknown>).palaceActionAdvice as Record<string, string> | undefined,
          narrativeCorpus: (narrativeCorpusZhTw as Record<string, unknown>).s00
            ? { s00: (narrativeCorpusZhTw as Record<string, unknown>).s00 as Record<string, { openers: string[]; explainers: string[]; advisers: string[]; connectors?: string[] }> }
            : undefined,
          decisionMatrix: decisionMatrixJson as { palaceEventWeights: Record<string, Record<string, number>>; eventLabels: Record<string, string>; palaceThemes: Record<string, string> },
        };

  // 1. KV 優先
  const cached = await env?.CACHE?.get(cacheKey);
  if (cached) {
    try {
      const content = JSON.parse(cached) as DbContent;
      if (content && typeof content === "object") {
        console.log("[getContentForLocale] locale=%s source=kv", dbLocale);
        // Phase 5B-10：確認實際 render 用的 skeleton 來源（兄弟 s01、僕役 s09、官祿 s11）
        if (dbLocale === "zh-TW" && content.lifebookSection) {
          for (const sk of ["s01", "s09", "s11"] as const) {
            const sa = content.lifebookSection?.[sk]?.structure_analysis ?? "";
            const snippet = sa.slice(0, 180);
            const hasNew = snippet.includes("四化引動") && snippet.includes("宮干飛化");
            const hasOld = snippet.includes("動態引動與根因");
            console.log("[getContentForLocale Phase5B-10] source=kv sectionKey=%s hasNew=%s hasOld=%s snippet=%s", sk, hasNew, hasOld, JSON.stringify(snippet));
          }
        }
        return { content, source: "kv" };
      }
    } catch {
      // 快取損壞，往下打 D1
    }
  }

  // 2. D1
  const db = env?.CONSULT_DB;
  if (db) {
    try {
      const stmt = db.prepare(
        "SELECT copy_key, content FROM ui_copy_texts WHERE locale = ?"
      );
      const { results } = await stmt.bind(dbLocale).all();
      const rows = (results ?? []) as Array<{ copy_key: string; content: string }>;
      const content =
        rows.length > 0
          ? mergeContent(staticContent, buildContentFromRows(rows))
          : staticContent;
      const source = rows.length > 0 ? "d1" : "static";
      console.log(
        "[getContentForLocale] locale=%s source=%s starPalacesKeys=%s",
        dbLocale,
        source,
        Object.keys(content.starPalaces ?? {}).length
      );
      // Phase 5B-10：skeleton 診斷（s01/s09/s11）
      if (dbLocale === "zh-TW" && content.lifebookSection) {
        for (const sk of ["s01", "s09", "s11"] as const) {
          const sa = content.lifebookSection?.[sk]?.structure_analysis ?? "";
          const snippet = sa.slice(0, 180);
          const hasNew = snippet.includes("四化引動") && snippet.includes("宮干飛化");
          const hasOld = snippet.includes("動態引動與根因");
          console.log("[getContentForLocale Phase5B-10] source=%s sectionKey=%s hasNew=%s hasOld=%s snippet=%s", source, sk, hasNew, hasOld, JSON.stringify(snippet));
        }
      }
      if (source === "d1" && content.starPalaces) {
        const sample = "紫微_命宮";
        if (!(sample in content.starPalaces)) {
          console.warn("[getContentForLocale] missing sample key: %s", sample);
        }
      }
      await env?.CACHE?.put(cacheKey, JSON.stringify(content), {
        expirationTtl: CONTENT_CACHE_TTL,
      });
      return { content, source };
    } catch (e) {
      console.warn("[getContentForLocale] D1 failed, using static:", e);
    }
  }

  // 3. 靜態 fallback
  console.log("[getContentForLocale] locale=%s source=static (fallback)", dbLocale);
  if (dbLocale === "zh-TW" && staticContent.lifebookSection) {
    for (const sk of ["s01", "s09", "s11"] as const) {
      const sa = staticContent.lifebookSection?.[sk]?.structure_analysis ?? "";
      const snippet = sa.slice(0, 180);
      const hasNew = snippet.includes("四化引動") && snippet.includes("宮干飛化");
      const hasOld = snippet.includes("動態引動與根因");
      console.log("[getContentForLocale Phase5B-10] source=static sectionKey=%s hasNew=%s hasOld=%s snippet=%s", sk, hasNew, hasOld, JSON.stringify(snippet));
    }
  }
  const safeContent =
    staticContent &&
    typeof staticContent === "object" &&
    staticContent.palaces &&
    staticContent.stars &&
    staticContent.starPalaces
      ? staticContent
      : emptyDbContent();
  return { content: safeContent, source: "static" };
}

export default {
  async fetch(req: Request, env?: Env): Promise<Response> {
    try {
    if (req.method === "OPTIONS") return corsPreflight();

    const url = new URL(req.url);

    // GET / 健康檢查（本地測試用）
    if (req.method === "GET" && url.pathname === "/") {
      return json({
        ok: true,
        service: "bazi-api",
        message: "Worker running. Use POST /compute/all or GET /content/2026",
      });
    }

    // GET /content/2026?locale= （與未來所有用到 content 的 API 共用 getContentForLocale）
    if (req.method === "GET" && url.pathname === "/content/2026") {
      const requestedLocale = (url.searchParams.get("locale") ?? "zh-TW").trim();
      const localeUsed: Locale = requestedLocale === "en" ? "en" : "zh-TW";
      const dbLocale = ["en", "zh-CN", "zh-TW"].includes(requestedLocale)
        ? requestedLocale
        : localeUsed;
      const { content, source } = await getContentForLocale(env, dbLocale);
      return json({
        ok: true,
        requestedLocale,
        localeUsed,
        source,
        ...content,
      });
    }

    // POST /api/log-usage
    if (req.method === "POST" && url.pathname === "/api/log-usage") {
      let logBody: Record<string, unknown>;
      try {
        logBody = (await req.json()) as Record<string, unknown>;
      } catch {
        return badRequest("Invalid JSON");
      }
      const birth_year = typeof logBody?.birth_year === "number" ? logBody.birth_year : null;
      const gender = typeof logBody?.gender === "string" ? String(logBody.gender).trim().slice(0, 20) : "";
      const language = typeof logBody?.language === "string" ? String(logBody.language).trim().slice(0, 20) : "zh-TW";
      const session_id = typeof logBody?.session_id === "string" ? String(logBody.session_id).trim().slice(0, 64) : null;

      const country = req.headers.get("cf-ipcountry")?.trim().slice(0, 10) ?? null;
      const region = req.headers.get("cf-region")?.trim().slice(0, 50) ?? null;

      const id = crypto.randomUUID();
      const db = env?.CONSULT_DB;
      if (db) {
        try {
          await db
            .prepare(
              `INSERT INTO usage_logs (id, session_id, birth_year, gender, language, country, region)
               VALUES (?, ?, ?, ?, ?, ?, ?)`
            )
            .bind(id, session_id ?? null, birth_year ?? null, gender || null, language || "zh-TW", country ?? null, region ?? null)
            .run();
        } catch (e) {
          console.warn("[log-usage] D1 insert failed:", e);
        }
      }
      return json({ ok: true });
    }

    // POST /compute/all
    if (req.method === "POST" && url.pathname === "/compute/all") {
      let body: Record<string, unknown>;
      try {
        body = (await req.json()) as Record<string, unknown>;
      } catch {
        return badRequest("Invalid JSON");
      }

      const { year, month, day, hour, minute, gender, horoscopeYear } = body ?? {};
      const language: Lang = (body?.language ?? "zh-TW") as Lang;

      if (
        typeof year !== "number" ||
        typeof month !== "number" ||
        typeof day !== "number"
      ) {
        return badRequest("Missing or invalid year/month/day");
      }

      const h = typeof hour === "number" ? hour : 0;
      const m = typeof minute === "number" ? minute : 0;
      const genderStr = String(gender ?? "M").toUpperCase() === "F" ? "female" : "male";

      // iztro: astrolabeBySolarDate(solarDateStr, timeIndex, gender, fixLeap?, language?)
      const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const timeIndex = clockHourToTimeIndex(h);

      // Core (branch, wuxingju) always zh-TW: 術語固定用中文，不隨 language 西化
      const astrolabeZhTw = astro.astrolabeBySolarDate(
        dateStr,
        timeIndex,
        genderStr,
        true,
        "zh-TW"
      );

      // mainStars + basic 依 language 切換
      const astrolabe =
        language === "zh-TW"
          ? astrolabeZhTw
          : astro.astrolabeBySolarDate(dateStr, timeIndex, genderStr, true, language);

      const aZhTw = astrolabeZhTw as {
        earthlyBranchOfSoulPalace?: string;
        earthlyBranchOfBodyPalace?: string;
        fiveElementsClass?: string;
      };
      const a = astrolabe as { soul?: string; body?: string };

      const ziweiCore = {
        minggongBranch: String(aZhTw?.earthlyBranchOfSoulPalace ?? ""),
        shengongBranch: String(aZhTw?.earthlyBranchOfBodyPalace ?? ""),
        wuxingju: String(aZhTw?.fiveElementsClass ?? ""),
      };

      const ziweiBasic = {
        masterStar:
          language === "en-US"
            ? toEnStarKey(String(a?.soul ?? ""), language)
            : String(a?.soul ?? ""),
        bodyStar:
          language === "en-US"
            ? toEnStarKey(String(a?.body ?? ""), language)
            : String(a?.body ?? ""),
      };

      const mainStars = extractZiweiMainStars(astrolabe, language);

      // 小限（horoscope）：供專家系統算每年重點。iztro horoscope(targetDate?, timeIndexOfTarget?)
      const targetYear = typeof horoscopeYear === "number" && horoscopeYear >= 1900 && horoscopeYear <= 2100
        ? horoscopeYear
        : new Date().getFullYear();
      const targetDate = new Date(`${targetYear}-06-15`);
      const horoscope = (astrolabeZhTw as { horoscope?: (d?: Date, ti?: number) => unknown }).horoscope?.(targetDate, timeIndex) as {
        decadal?: { index: number; heavenlyStem?: string; earthlyBranch?: string; palaceNames?: string[]; mutagen?: string[] };
        age?: {
          index: number;
          heavenlyStem?: string;
          earthlyBranch?: string;
          palaceNames?: string[];
          mutagen?: string[];
          nominalAge?: number;
        };
        yearly?: { index: number; heavenlyStem?: string; earthlyBranch?: string; palaceNames?: string[]; mutagen?: string[] };
      } | undefined;
      const MUTAGEN_KEYS = ["祿", "權", "科", "忌"] as const;

      function buildMutagenStars(mutagen: string[] | undefined): Record<string, string> | null {
        const out: Record<string, string> = {};
        if (!Array.isArray(mutagen)) return null;
        mutagen.forEach((star, i) => {
          if (typeof star === "string" && star && MUTAGEN_KEYS[i]) out[MUTAGEN_KEYS[i]] = star;
        });
        return Object.keys(out).length ? out : null;
      }
      function palaceFromItem(item: { palaceNames?: string[]; index?: number } | undefined): string | null {
        if (!item?.palaceNames?.length) return null;
        const raw = item.palaceNames[0];
        return (raw && palaceNameToZhTW(raw)) ?? raw ?? null;
      }

      const ageData = horoscope?.age;
      // 流年命宮：僅查表 palaceByBranch[branch]，禁止再用 offset 公式
      const yearlyBranch = horoscope?.yearly?.earthlyBranch ?? null;
      const mingBranchForYearly = aZhTw?.earthlyBranchOfSoulPalace ?? "";
      const palaceByBranch = mingBranchForYearly ? buildPalaceByBranch(mingBranchForYearly) : undefined;
      const decadalBranch = horoscope?.decadal?.earthlyBranch ?? null;
      const decadalPalace = (decadalBranch && palaceByBranch?.[decadalBranch]) ? palaceByBranch[decadalBranch] : palaceFromItem(horoscope?.decadal);
      const yearlyPalace =
        (yearlyBranch && palaceByBranch && getFlowYearPalace(yearlyBranch, palaceByBranch))
        ?? palaceFromItem(horoscope?.yearly);

      // 流月：與「現在」同一錨點呼叫 horoscope(anchor)；命宮／四化／標題西曆月一致（見 buildMonthlyHoroscopePayload）
      const monthlyHoroscope = buildMonthlyHoroscopePayload(
        astrolabeZhTw as {
          horoscope?: (d?: Date, ti?: number) => unknown;
          earthlyBranchOfSoulPalace?: string;
        },
        body
      );

      // horoscopeByYear 改為延遲載入（點擊進階時再算），減少 CPU 避免 1102
      const horoscopeByYear: Record<number, { nominalAge: number | null; palace: string | null; stem: string | null }> = {};

      const ziweiHoroscope = ageData || horoscope?.decadal || horoscope?.yearly ? {
        year: targetYear,
        nominalAge: ageData?.nominalAge ?? null,
        yearlyStem: ageData?.heavenlyStem ?? null,
        yearlyBranch: ageData?.earthlyBranch ?? null,
        yearlyIndex: ageData?.index ?? null,
        mutagenStars: getMutagenStarsFromStem(ageData?.heavenlyStem ?? "") ?? buildMutagenStars(ageData?.mutagen),
        decadal: horoscope?.decadal ? {
          stem: horoscope.decadal.heavenlyStem ?? null,
          branch: horoscope.decadal.earthlyBranch ?? null,
          palace: decadalPalace,
          palaceIndex: horoscope.decadal.index,
          mutagenStars: getMutagenStarsFromStem(horoscope.decadal.heavenlyStem ?? "") ?? buildMutagenStars(horoscope.decadal.mutagen),
        } : null,
        yearly: horoscope?.yearly ? {
          stem: horoscope.yearly.heavenlyStem ?? null,
          branch: horoscope.yearly.earthlyBranch ?? null,
          palace: yearlyPalace,
          palaceIndex: horoscope.yearly.index,
          mutagenStars: getMutagenStarsFromStem(horoscope.yearly.heavenlyStem ?? "") ?? buildMutagenStars(horoscope.yearly.mutagen),
        } : null,
        horoscopeByYear,
      } : null;

      const chartId = stableChartId({ year, month, day, hour: h, minute: m, gender: genderStr, language });

      // 從 astrolabe 提取四柱，供前端五行/十神/藏干計算
      let yearly: [string, string] = ["", ""];
      let monthly: [string, string] = ["", ""];
      let daily: [string, string] = ["", ""];
      let hourly: [string, string] = ["", ""];
      const chineseDate = (astrolabeZhTw as { rawDates?: { chineseDate?: { yearly?: [string, string]; monthly?: [string, string]; daily?: [string, string]; hourly?: [string, string] } } })?.rawDates?.chineseDate;
      if (chineseDate?.yearly?.[0]) {
        yearly = chineseDate.yearly;
        monthly = chineseDate.monthly ?? ["", ""];
        daily = chineseDate.daily ?? ["", ""];
        hourly = chineseDate.hourly ?? ["", ""];
      } else {
        // Fallback: iztro rawDates 可能為空，改用 lunar-lite 直接計算
        try {
          const { getHeavenlyStemAndEarthlyBranchBySolarDate } = await import("lunar-lite");
          const fallback = getHeavenlyStemAndEarthlyBranchBySolarDate(dateStr, timeIndex);
          yearly = fallback.yearly ?? ["", ""];
          monthly = fallback.monthly ?? ["", ""];
          daily = fallback.daily ?? ["", ""];
          hourly = fallback.hourly ?? ["", ""];
        } catch (_) {
          console.warn("[bazi-api] lunar-lite fallback failed, bazi.display may be empty");
        }
      }
      const bazi = {
        display: {
          yG: yearly[0] ?? "",
          yZ: yearly[1] ?? "",
          mG: monthly[0] ?? "",
          mZ: monthly[1] ?? "",
          dG: daily[0] ?? "",
          dZ: daily[1] ?? "",
          hG: hourly[0] ?? "",
          hZ: hourly[1] ?? "",
        },
        year: { stem: yearly[0], branch: yearly[1] },
        month: { stem: monthly[0], branch: monthly[1] },
        day: { stem: daily[0], branch: daily[1] },
        hour: { stem: hourly[0], branch: hourly[1] },
      };

      const ziweiPalaces = extractZiweiPalacesWithBrightness(astrolabeZhTw);

      // 從 iztro 產出 12 步大限（每步含該步大限宮干 stem + 地支 branch），命書單一資料來源，避免與 BaziCore 順推宮干混用。
      // 大限宮位名必須依「命盤宮序」（命宮地支旋轉後的 地支→宮位）取 palaceByBranch[branch]，不可用 iztro 的 palaceNames（可能為固定人事宮序，會錯成夫妻宮等）。
      const wuxingjuStr = String(ziweiCore.wuxingju ?? "").trim() || "金四局";
      const baseStartMatch = wuxingjuStr.match(/[水木金土火]([二三四五六])局/);
      const WUXINGJU_BASE: Record<string, number> = { 二: 2, 三: 3, 四: 4, 五: 5, 六: 6 };
      const baseStartAge: number = baseStartMatch ? (WUXINGJU_BASE[baseStartMatch[1]] ?? 4) : 4;
      const birthYear = typeof year === "number" && !Number.isNaN(year) ? year : new Date().getFullYear();
      const mingBranch = String(ziweiCore.minggongBranch ?? "").trim();
      const decadalPalaceByBranch = mingBranch ? buildPalaceByBranch(mingBranch) : {};
      const decadalLimitsFromIztro: Array<{ palace?: string; startAge: number; endAge: number; stem?: string; branch?: string; mutagenStars?: Record<string, string> }> = [];
      for (let step = 0; step < 12; step++) {
        const midAge = baseStartAge + step * 10 + 5;
        const targetDate = new Date(birthYear + midAge, 5, 15);
        const hStep = (astrolabeZhTw as { horoscope?: (d?: Date, ti?: number) => unknown }).horoscope?.(targetDate, timeIndex) as {
          decadal?: { index: number; heavenlyStem?: string; earthlyBranch?: string; palaceNames?: string[]; mutagen?: string[] };
        } | undefined;
        const dec = hStep?.decadal;
        const branch = (dec?.earthlyBranch ?? "").trim() || undefined;
        const palaceFromBranch = branch && decadalPalaceByBranch[branch] ? decadalPalaceByBranch[branch] : null;
        const palaceNameFallback = dec?.palaceNames?.[0] ? (palaceNameToZhTW(dec.palaceNames[0]) ?? dec.palaceNames[0]) : null;
        const stem = (dec?.heavenlyStem ?? "").trim() || undefined;
        const mutagenStars = stem ? getMutagenStarsFromStem(stem) : undefined;
        decadalLimitsFromIztro.push({
          palace: (palaceFromBranch ?? palaceNameFallback) ?? undefined,
          startAge: baseStartAge + step * 10,
          endAge: baseStartAge + step * 10 + 9,
          stem,
          branch,
          mutagenStars: mutagenStars ?? undefined,
        });
      }
      // 診斷用：確認 54–63 歲（index 5，金四局）大限應為僕役／交友宮、甲辰
      console.log("[compute/all] features.ziwei.decadalLimits[5] (54–63歲) =", JSON.stringify(decadalLimitsFromIztro[5]));

      return json({
        ok: true,
        language,
        chartId,
        meta: {
          service: "bazi-api",
          version: "1.0.0", // 部署後可換成 Cloudflare Deploy Version ID
          requestedLanguage: language,
        },
        features: {
          version: "strategic_features_v1",
          bazi,
          ziwei: {
            core: ziweiCore,
            basic: ziweiBasic,
            mainStars,
            horoscope: ziweiHoroscope,
            monthlyHoroscope,
            palaces: ziweiPalaces,
            decadalLimits: decadalLimitsFromIztro,
          },
        },
      });
    }

    // POST /compute/horoscope：延遲載入大限／小限／流年（horoscopeByYear），降低 compute/all CPU
    if (req.method === "POST" && url.pathname === "/compute/horoscope") {
      let body: Record<string, unknown>;
      try {
        body = (await req.json()) as Record<string, unknown>;
      } catch {
        return badRequest("Invalid JSON");
      }
      const { year, month, day, hour, minute, gender, horoscopeYear } = body ?? {};
      if (typeof year !== "number" || typeof month !== "number" || typeof day !== "number") {
        return badRequest("Missing or invalid year/month/day");
      }
      const h = typeof hour === "number" ? hour : 0;
      const m = typeof minute === "number" ? minute : 0;
      const genderStr = String(gender ?? "M").toUpperCase() === "F" ? "female" : "male";
      const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const timeIndex = clockHourToTimeIndex(h);
      const targetYear = typeof horoscopeYear === "number" && horoscopeYear >= 1900 && horoscopeYear <= 2100
        ? horoscopeYear
        : new Date().getFullYear();

      const astrolabeZhTw = astro.astrolabeBySolarDate(dateStr, timeIndex, genderStr, true, "zh-TW");
      const horoscope = (astrolabeZhTw as { horoscope?: (d?: Date, ti?: number) => unknown }).horoscope?.(new Date(`${targetYear}-06-15`), timeIndex) as {
        decadal?: { index: number; heavenlyStem?: string; earthlyBranch?: string; palaceNames?: string[]; mutagen?: string[] };
        age?: { heavenlyStem?: string; earthlyBranch?: string; palaceNames?: string[]; mutagen?: string[]; nominalAge?: number; index?: number };
        yearly?: { index: number; heavenlyStem?: string; earthlyBranch?: string; palaceNames?: string[]; mutagen?: string[] };
      } | undefined;
      const MUTAGEN_KEYS = ["祿", "權", "科", "忌"] as const;
      function buildMutagenStars(mutagen: string[] | undefined): Record<string, string> | null {
        const out: Record<string, string> = {};
        if (!Array.isArray(mutagen)) return null;
        mutagen.forEach((star, i) => {
          if (typeof star === "string" && star && MUTAGEN_KEYS[i]) out[MUTAGEN_KEYS[i]] = star;
        });
        return Object.keys(out).length ? out : null;
      }
      function palaceFromItem(item: { palaceNames?: string[] } | undefined): string | null {
        if (!item?.palaceNames?.length) return null;
        const raw = item.palaceNames[0];
        return (raw && palaceNameToZhTW(raw)) ?? raw ?? null;
      }
      const ageData = horoscope?.age;
      const decadalPalace = palaceFromItem(horoscope?.decadal);
      const yearlyPalace = palaceFromItem(horoscope?.yearly);
      const startYear = Math.max(1900, targetYear - 6);
      const endYear = Math.min(2100, targetYear + 5);
      const horoscopeByYear: Record<number, { nominalAge: number | null; palace: string | null; stem: string | null }> = {};
      for (let y = startYear; y <= endYear; y++) {
        const hRes = (astrolabeZhTw as { horoscope?: (d?: Date, ti?: number) => unknown }).horoscope?.(new Date(`${y}-06-15`), timeIndex) as { age?: { nominalAge?: number; palaceNames?: string[]; heavenlyStem?: string } } | undefined;
        const a = hRes?.age;
        const palace = a?.palaceNames?.[0] ? (palaceNameToZhTW(a.palaceNames[0]) ?? a.palaceNames[0]) : null;
        horoscopeByYear[y] = { nominalAge: a?.nominalAge ?? null, palace, stem: a?.heavenlyStem ?? null };
      }
      const ziweiHoroscope = {
        year: targetYear,
        nominalAge: ageData?.nominalAge ?? null,
        yearlyStem: ageData?.heavenlyStem ?? null,
        yearlyBranch: ageData?.earthlyBranch ?? null,
        yearlyIndex: ageData?.index ?? null,
        mutagenStars: getMutagenStarsFromStem(ageData?.heavenlyStem ?? "") ?? buildMutagenStars(ageData?.mutagen),
        decadal: horoscope?.decadal ? { stem: horoscope.decadal.heavenlyStem ?? null, branch: horoscope.decadal.earthlyBranch ?? null, palace: decadalPalace, palaceIndex: horoscope.decadal.index, mutagenStars: getMutagenStarsFromStem(horoscope.decadal.heavenlyStem ?? "") ?? buildMutagenStars(horoscope.decadal.mutagen) } : null,
        yearly: horoscope?.yearly ? { stem: horoscope.yearly.heavenlyStem ?? null, branch: horoscope.yearly.earthlyBranch ?? null, palace: yearlyPalace, palaceIndex: horoscope.yearly.index, mutagenStars: getMutagenStarsFromStem(horoscope.yearly.heavenlyStem ?? "") ?? buildMutagenStars(horoscope.yearly.mutagen) } : null,
        horoscopeByYear,
      };

      // 流月：與 /compute/all 同一錨點與欄位（S19）
      const monthlyHoroscope = buildMonthlyHoroscopePayload(
        astrolabeZhTw as {
          horoscope?: (d?: Date, ti?: number) => unknown;
          earthlyBranchOfSoulPalace?: string;
        },
        body
      );

      return json({ ok: true, horoscope: ziweiHoroscope, monthlyHoroscope });
    }

    const LIFEBOOK_CONFIG_KEY = "lifebook:config";

    // GET /api/life-book/config（取得命書 prompt 設定，KV 或預設）
    if (req.method === "GET" && url.pathname === "/api/life-book/config") {
      const forceDefault = url.searchParams.get("default") === "1";
      if (!forceDefault) {
        const cached = await env?.CACHE?.get(LIFEBOOK_CONFIG_KEY);
        if (cached) {
          try {
            const parsed = JSON.parse(cached) as LifeBookConfig;
            return json({ ok: true, config: parsed });
          } catch {
            /* fallback to default */
          }
        }
      }
      return json({ ok: true, config: getDefaultConfig() });
    }

    // POST /api/life-book/config（儲存命書 prompt 設定）
    if (req.method === "POST" && url.pathname === "/api/life-book/config") {
      let body: LifeBookConfig;
      try {
        body = (await req.json()) as LifeBookConfig;
      } catch {
        return badRequest("Invalid JSON");
      }
      const config: LifeBookConfig = { ...getDefaultConfig() };
      if (body.persona !== undefined) config.persona = body.persona;
      if (body.rules !== undefined) config.rules = body.rules;
      if (body.templates !== undefined) config.templates = body.templates;
      if (body.shishen !== undefined) config.shishen = body.shishen;
      if (body.wuxing !== undefined) config.wuxing = body.wuxing;
      if (body.model !== undefined) config.model = body.model;
      try {
        await env?.CACHE?.put(LIFEBOOK_CONFIG_KEY, JSON.stringify(config));
      } catch (e) {
        console.error("[life-book] KV put failed:", e);
        return json({ ok: false, error: "儲存失敗" }, { status: 500 });
      }
      return json({ ok: true, config });
    }

    // POST /api/life-book/ask（自訂 prompt + 單題問答）
    if (req.method === "POST" && url.pathname === "/api/life-book/ask") {
      if (isLifebookAiDisabled(env)) {
        return json({ ok: false, error: "已停用 AI 功能（LIFEBOOK_DISABLE_AI）" }, { status: 403 });
      }
      const apiKey = env?.OPENAI_API_KEY;
      if (!apiKey) {
        return json({ ok: false, error: "OPENAI_API_KEY 未設定" }, { status: 500 });
      }
      let body: { prompt?: string; question?: string; chart_json?: unknown; weight_analysis?: unknown; model?: string; temperature?: number };
      try {
        body = (await req.json()) as typeof body;
      } catch {
        return badRequest("Invalid JSON");
      }
      const prompt = typeof body?.prompt === "string" ? body.prompt.trim() : "";
      const question = typeof body?.question === "string" ? body.question.trim() : "";
      if (!prompt) return badRequest("缺少 prompt");
      if (!question) return badRequest("缺少 question");

      let chartJson = sanitizeLifebookRequestChartJson(
        body?.chart_json && typeof body.chart_json === "object" ? (body.chart_json as Record<string, unknown>) : undefined
      );
      if (chartJson && typeof chartJson === "object") {
        chartJson = canonicalizeChartJsonForLifebook(chartJson) ?? chartJson;
      }
      const weightAnalysis = body?.weight_analysis as Record<string, unknown> | undefined;
      const askModel = typeof body?.model === "string" && body.model.trim() ? body.model.trim() : "gpt-4.1";
      const askTemp = typeof body?.temperature === "number" && Number.isFinite(body.temperature) ? body.temperature : 0.7;
      const askOptions = getGenerationOptions(askModel, askTemp);

      let userContent = `【問題】\n${question}`;
      if (chartJson && typeof chartJson === "object") {
        userContent += `\n\n【命盤數據】\n${JSON.stringify(chartJson, null, 2)}`;
      }
      if (weightAnalysis && typeof weightAnalysis === "object") {
        userContent += `\n\n【權重摘要】\n${JSON.stringify(weightAnalysis, null, 2)}`;
      }
      userContent += "\n\n請根據上述數據回答問題，使用第二人稱（你），精準、有洞察。";

      const askMessages = [
        { role: "system" as const, content: prompt },
        { role: "user" as const, content: userContent },
      ];
      logLifeBookOpenAIPayload("life-book/ask", {
        model: askModel,
        messages: askMessages,
        chartJson: chartJson ?? undefined,
      });

      const openaiResp = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          ...askOptions,
          messages: askMessages,
          max_completion_tokens: 2000,
        }),
      });

      if (!openaiResp.ok) {
        const errText = await openaiResp.text();
        return json({ ok: false, error: `API 失敗: ${errText.slice(0, 150)}` }, { status: 502 });
      }

      const openaiData = (await openaiResp.json()) as { choices?: Array<{ message?: { content?: string } }> };
      const answer = openaiData?.choices?.[0]?.message?.content ?? "";
      return json({ ok: true, answer });
    }

    // POST /api/life-book/beta/redeem（Beta 邀請碼驗證）
    if (req.method === "POST" && url.pathname === "/api/life-book/beta/redeem") {
      let body: { invite_code?: string };
      try {
        body = (await req.json()) as { invite_code?: string };
      } catch {
        return badRequest("Invalid JSON");
      }
      const inviteCode = typeof body?.invite_code === "string" ? body.invite_code.trim() : "";
      if (!inviteCode) return badRequest("缺少 invite_code");
      const valid = isValidBetaInviteCode(env, inviteCode);
      if (!valid) {
        return json({ ok: false, error: "邀請碼無效" }, { status: 400 });
      }
      return json({
        ok: true,
        plan_tier: "free",
        unlock_sections: [],
        redeemed_at: new Date().toISOString(),
      });
    }

    // POST /api/life-book/infer（Phase 3 推論層：命盤 → 結構化 insight）
    if (req.method === "POST" && url.pathname === "/api/life-book/infer") {
      if (isLifebookAiDisabled(env)) {
        return json({ ok: false, error: "已停用 AI 功能（LIFEBOOK_DISABLE_AI）" }, { status: 403 });
      }
      const apiKey = env?.OPENAI_API_KEY;
      if (!apiKey) {
        return json({ ok: false, error: "OPENAI_API_KEY 未設定" }, { status: 500 });
      }
      let body: { chart_json?: unknown; weight_analysis?: unknown; locale?: string; model?: string; temperature?: number };
      try {
        body = (await req.json()) as typeof body;
      } catch {
        return badRequest("Invalid JSON");
      }
      const chartJsonRaw = body?.chart_json as Record<string, unknown> | undefined;
      const weightAnalysis = body?.weight_analysis as Record<string, unknown> | undefined;
      if (!chartJsonRaw || typeof chartJsonRaw !== "object") return badRequest("缺少 chart_json");
      if (!weightAnalysis || typeof weightAnalysis !== "object") return badRequest("缺少 weight_analysis");

      const chartJson = sanitizeLifebookRequestChartJson(chartJsonRaw)!;
      const chartForInfer = canonicalizeChartJsonForLifebook(chartJson)!;

      const inferModel = typeof body?.model === "string" && body.model.trim() ? body.model.trim() : "gpt-4.1";
      const inferTemp = typeof body?.temperature === "number" && Number.isFinite(body.temperature) ? body.temperature : 0.3;
      const inferOptions = getGenerationOptions(inferModel, inferTemp);

      const rawLocale = String(body?.locale ?? chartForInfer?.language ?? chartForInfer?.astrolabeLanguage ?? "zh-TW");
      const lifeBookLocale: Locale = rawLocale === "en" || rawLocale === "en-US" ? "en" : rawLocale === "zh-CN" ? "zh-CN" : "zh-TW";
      const { content: localeContent } = await getContentForLocale(env, lifeBookLocale);
      const usedKeys = getUsedStarPalaceKeys(chartForInfer?.ziwei, lifeBookLocale);
      const usedStarPalaces = buildEffectiveUsedStarPalaces(localeContent?.starPalacesMain, localeContent?.starPalaces, usedKeys, localeContent?.starPalacesAux);
      const usedStarPalacesAuxAction = filterUsedStarPalaces(localeContent?.starPalacesAuxAction, usedKeys);
      const usedStarPalacesAuxRisk = filterUsedStarPalacesAuxRisk(localeContent?.starPalacesAuxRisk, usedKeys);
      const starPalacesTotal = typeof localeContent?.starPalaces === "object" ? Object.keys(localeContent.starPalaces).length : 0;
      console.log("[life-book/infer] starPalaces_total_count=%s starPalaces_used_count=%s", starPalacesTotal, Object.keys(usedStarPalaces).length);

      const masterStars = getMasterStarsFromZiwei(chartForInfer?.ziwei);
      const masterStarsWithDefs = getMasterStarsWithDefs(masterStars, localeContent?.stars, {
        lifeLordDecode: localeContent?.lifeLordDecode,
        bodyLordDecode: localeContent?.bodyLordDecode,
      });
      const inferBodyPalaceInfo = getBodyPalaceInfo(chartForInfer, localeContent?.bodyPalaceByHour);
      const inferLifeBodySnippet = getLifeBodyRelationSnippet(
        inferBodyPalaceInfo,
        localeContent?.lifeBodyRelation as Record<string, { tagline: string; interpretation: string; strategy_tone: string }> | undefined,
        masterStarsWithDefs
      );
      const filteredWeightForInfer = filterStablePalacesByDominant(
        weightAnalysis as { stable_palaces?: string[]; [k: string]: unknown },
        chartForInfer,
        chartForInfer?.tenGodByPalace ? { tenGodByPalace: chartForInfer.tenGodByPalace as Record<string, string> } : null
      );
      const userPrompt = buildInferUserPrompt(chartForInfer, filteredWeightForInfer, {
        starPalaces: usedStarPalaces,
        masterStars: masterStarsWithDefs,
        lifeBodyRelationSnippet: inferLifeBodySnippet.length > 0 ? inferLifeBodySnippet : undefined,
        starPalacesAuxAction: Object.keys(usedStarPalacesAuxAction).length > 0 ? usedStarPalacesAuxAction : undefined,
        starPalacesAuxRisk: Object.keys(usedStarPalacesAuxRisk).length > 0 ? usedStarPalacesAuxRisk : undefined,
      });

      const inferMessages = [
        { role: "system" as const, content: INFER_SYSTEM_PROMPT },
        { role: "user" as const, content: userPrompt },
      ];
      logLifeBookOpenAIPayload("life-book/infer", {
        model: inferModel,
        messages: inferMessages,
        chartJson: chartForInfer,
      });

      const openaiResp = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          ...inferOptions,
          messages: inferMessages,
          max_completion_tokens: 16000,
        }),
      });

      if (!openaiResp.ok) {
        const errText = await openaiResp.text();
        return json({ ok: false, error: `推論失敗: ${errText.slice(0, 150)}` }, { status: 502 });
      }

      const openaiData = (await openaiResp.json()) as { choices?: Array<{ message?: { content?: string } }> };
      const content = openaiData?.choices?.[0]?.message?.content ?? "";
      const jsonMatch = content.trim().match(/\{[\s\S]*\}/);
      let insight: InferOutput = {};
      if (jsonMatch) {
        try {
          insight = JSON.parse(jsonMatch[0]) as InferOutput;
        } catch {
          /* ignore */
        }
      }
      return json({ ok: true, insight });
    }

    // POST /api/life-book/narrate（Phase 3 敘事層：insight → 風格化文案）
    if (req.method === "POST" && url.pathname === "/api/life-book/narrate") {
      if (isLifebookAiDisabled(env)) {
        return json({ ok: false, error: "已停用 AI 功能（LIFEBOOK_DISABLE_AI）" }, { status: 403 });
      }
      const apiKey = env?.OPENAI_API_KEY;
      if (!apiKey) {
        return json({ ok: false, error: "OPENAI_API_KEY 未設定" }, { status: 500 });
      }
      let body: {
        section_key?: string;
        insight?: SectionInsight;
        model?: string;
        temperature?: number;
        /** infer→narrate 時一併傳入，12 宮才能套用讀者版 palace narrative（與 generate-section 一致） */
        chart_json?: unknown;
        locale?: string;
      };
      try {
        body = (await req.json()) as typeof body;
      } catch {
        return badRequest("Invalid JSON");
      }
      const sectionKey = typeof body?.section_key === "string" ? body.section_key : "";
      const insight = body?.insight as SectionInsight | undefined;
      if (!sectionKey || !(SECTION_ORDER as readonly string[]).includes(sectionKey)) {
        return badRequest("無效的 section_key");
      }
      if (!insight || typeof insight !== "object") return badRequest("缺少 insight");

      let lifeBookConfig: LifeBookConfig | null = null;
      const cached = await env?.CACHE?.get(LIFEBOOK_CONFIG_KEY);
      if (cached) {
        try {
          lifeBookConfig = JSON.parse(cached) as LifeBookConfig;
        } catch {
          /* ignore */
        }
      }

      const modelFromBody = typeof body?.model === "string" && body.model.trim() ? body.model.trim() : null;
      const effectiveModel = modelFromBody ?? lifeBookConfig?.model ?? NARRATE_MODEL;
      const narrateTemp = typeof body?.temperature === "number" && Number.isFinite(body.temperature) ? body.temperature : 0.7;
      const narrateOptions = getGenerationOptions(effectiveModel, narrateTemp);

      const template = SECTION_TEMPLATES.find((t) => t.section_key === sectionKey);
      if (!template) return badRequest("無效的 section_key");

      const systemPrompt = buildNarrateSystemPrompt(lifeBookConfig);
      const userPrompt = buildNarrateUserPrompt(sectionKey, insight, template, lifeBookConfig);

      const narrateMessages = [
        { role: "system" as const, content: systemPrompt },
        { role: "user" as const, content: userPrompt },
      ];
      logLifeBookOpenAIPayload("life-book/narrate", {
        model: effectiveModel,
        messages: narrateMessages,
        chartJson: null,
      });

      const openaiResp = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          ...narrateOptions,
          messages: narrateMessages,
          max_completion_tokens: 4000,
        }),
      });

      if (!openaiResp.ok) {
        const errText = await openaiResp.text();
        return json({ ok: false, error: `敘事失敗: ${errText.slice(0, 150)}` }, { status: 502 });
      }

      const openaiData = (await openaiResp.json()) as { choices?: Array<{ message?: { content?: string } }> };
      const content = openaiData?.choices?.[0]?.message?.content ?? "";
      let parsed: Record<string, unknown> | null = null;
      const jsonMatch = content.trim().match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          parsed = JSON.parse(jsonMatch[0]) as Record<string, unknown>;
        } catch {
          /* ignore */
        }
      }

      const hasFourFields =
        parsed &&
        typeof parsed.structure_analysis === "string" &&
        typeof parsed.behavior_pattern === "string" &&
        typeof parsed.blind_spots === "string" &&
        typeof parsed.strategic_advice === "string";

      if (hasFourFields && parsed) {
        let four = {
          structure_analysis: parsed.structure_analysis as string,
          behavior_pattern: parsed.behavior_pattern as string,
          blind_spots: parsed.blind_spots as string,
          strategic_advice: parsed.strategic_advice as string,
        };
        const narrateChartRaw = sanitizeLifebookRequestChartJson(
          body.chart_json && typeof body.chart_json === "object" ? (body.chart_json as Record<string, unknown>) : undefined
        );
        const narrateChart =
          narrateChartRaw && typeof narrateChartRaw === "object"
            ? canonicalizeChartJsonForLifebook(narrateChartRaw) ?? narrateChartRaw
            : narrateChartRaw;
        if (narrateChart && typeof narrateChart === "object" && PALACE_SECTION_KEYS.has(sectionKey)) {
          const locRaw = typeof body.locale === "string" ? body.locale : "zh-TW";
          const narrLocale: LifeBookLocaleNarrate =
            locRaw === "en" || locRaw === "en-US" ? "en" : locRaw === "zh-CN" ? "zh-CN" : "zh-TW";
          four = await applyPalaceReaderOverridesForSection(env, sectionKey, narrateChart, narrLocale, four, {
            lifeBookCache: lifeBookConfig,
          });
        } else if (PALACE_SECTION_KEYS.has(sectionKey) && (!narrateChart || typeof narrateChart !== "object")) {
          console.warn(
            "[life-book/narrate] 12宮 sectionKey=%s 未附 chart_json，無法套用讀者版敘事（請前端 infer→narrate 一併傳 chart_json）",
            sectionKey
          );
        }
        const section = {
          section_key: typeof parsed.section_key === "string" ? parsed.section_key : sectionKey,
          title: typeof parsed.title === "string" ? parsed.title : template.title,
          importance_level: (typeof parsed.importance_level === "string" && ["high", "medium", "low"].includes(parsed.importance_level)) ? parsed.importance_level : "medium",
          structure_analysis: four.structure_analysis,
          behavior_pattern: four.behavior_pattern,
          blind_spots: four.blind_spots,
          strategic_advice: four.strategic_advice,
        };
        return json({ ok: true, section });
      }

      return json({
        ok: true,
        section: {
          section_key: sectionKey,
          title: template.title,
          importance_level: "medium",
          structure_analysis: insight.evidence || "(敘事格式異常)",
          behavior_pattern: insight.core_insight || "",
          blind_spots: insight.implications || "",
          strategic_advice: insight.suggestions || "",
        },
      });
    }

    // POST /api/life-book/generate-section（單章，供前端逐次呼叫並顯示進度）
    if (req.method === "POST" && url.pathname === "/api/life-book/generate-section") {
      let body: {
        section_key?: string;
        chart_json?: unknown;
        weight_analysis?: unknown;
        model?: string;
        temperature?: number;
        locale?: string;
        plan_tier?: "free" | "pro";
        unlock_sections?: string[];
        beta_invite_code?: string;
        minor_fortune_summary?: string;
        minor_fortune_triggers?: string;
        /** "ai" = 呼叫 OpenAI 產出給用戶；"technical" = 不呼叫 API，回傳資料庫／命盤技術細節（自用） */
        output_mode?: "ai" | "technical";
        /** IANA，與 `clientNowISO` 一併用於導出 `day_key` 與 KV 鍵 */
        clientTimeZone?: string;
        /** ISO 8601，前端「現在」瞬時 */
        clientNowISO?: string;
      };
      try {
        body = (await req.json()) as typeof body;
      } catch {
        const tcInvalid = resolveTimeContextFromBody({});
        return json({ ok: false, error: "Invalid JSON", time_context: timeContextToJson(tcInvalid) }, { status: 400 });
      }

      const timeContext = resolveTimeContextFromBody(body);
      const withTc = (p: Record<string, unknown>) => ({ ...p, time_context: timeContextToJson(timeContext) });

      const effectiveOutputMode = resolveLifebookOutputMode(body, env);
      const wantsTechnicalOnly = effectiveOutputMode === "technical";
      const apiKey = env?.OPENAI_API_KEY;
      if (!wantsTechnicalOnly && !apiKey) {
        return json(withTc({ ok: false, error: "OPENAI_API_KEY 未設定" }), { status: 500 });
      }

      const sectionKey = typeof body?.section_key === "string" ? body.section_key : "";
      const chartJsonRawSection = body?.chart_json as Record<string, unknown> | undefined;
      const weightAnalysis = body?.weight_analysis as Record<string, unknown> | undefined;
      const modelFromBody = typeof body?.model === "string" && body.model.trim() ? body.model.trim() : null;

      if (!sectionKey || !(SECTION_ORDER as readonly string[]).includes(sectionKey)) {
        return json(withTc({ ok: false, error: "無效的 section_key" }), { status: 400 });
      }
      if (isLifebookInviteRequired(env) && !isValidBetaInviteCode(env, body?.beta_invite_code)) {
        const locked = buildInviteRequiredPayload(sectionKey);
        return json(
          withTc({
            ok: true,
            is_locked: true,
            lock_reason: locked.lock_reason,
            teaser: locked.teaser,
            invite_required: true,
            plan_tier: "free",
            plan_matrix_version: LIFEBOOK_PLAN_MATRIX.version || "unknown",
          })
        );
      }
      const planAccess = resolvePlanAccess(body?.plan_tier, body?.unlock_sections, body?.beta_invite_code, env);
      if (!planAccess.availableSections.includes(sectionKey)) {
        const locked = buildLockedSectionPayload(sectionKey);
        return json(
          withTc({
            ok: true,
            is_locked: true,
            lock_reason: locked.lock_reason,
            teaser: locked.teaser,
            plan_tier: planAccess.planTier,
            plan_matrix_version: planAccess.matrixVersion,
          })
        );
      }
      if (!chartJsonRawSection || typeof chartJsonRawSection !== "object") {
        return json(withTc({ ok: false, error: "缺少 chart_json" }), { status: 400 });
      }
      if (!weightAnalysis || typeof weightAnalysis !== "object") {
        return json(withTc({ ok: false, error: "缺少 weight_analysis" }), { status: 400 });
      }

      const inviteNormSec =
        typeof body?.beta_invite_code === "string" ? body.beta_invite_code.trim().toUpperCase() : "";
      const sectionFingerprint = buildLifebookGenerateFingerprint({
        chart_json: chartJsonRawSection as Record<string, unknown>,
        weight_analysis: weightAnalysis as Record<string, unknown>,
        plan_tier: toPlanTier(body?.plan_tier),
        unlock_sections: normalizePlanSectionList(body?.unlock_sections),
        output_mode: effectiveOutputMode,
        invite_fingerprint: inviteNormSec,
      });
      const sectionCacheKvKey = lifebookSectionCacheKey(sectionFingerprint, sectionKey, {
        timeZone: timeContext.timeZone,
        dayKey: timeContext.dayKey,
      });
      const sectionRateLimitKvKey = lifebookSectionRateLimitKey(sectionFingerprint);

      if (env?.CACHE) {
        try {
          const cachedSec = await env.CACHE.get(sectionCacheKvKey);
          if (cachedSec) {
            const parsed = JSON.parse(cachedSec) as Record<string, unknown>;
            if (parsed && typeof parsed === "object" && parsed.ok === true) {
              return json(withTc(parsed));
            }
          }
        } catch (e) {
          console.warn("[life-book/generate-section] KV section cache read failed", e);
        }
        try {
          const rl = await env.CACHE.get(sectionRateLimitKvKey);
          if (rl != null && rl !== "") {
            return json(withTc({ ok: false, error: "rate_limited", retry_after_sec: 5 }), { status: 429 });
          }
        } catch (e) {
          console.warn("[life-book/generate-section] rate limit read failed", e);
        }
      }

      const sectionCachePut = async (payload: Record<string, unknown>): Promise<Response> => {
        if (env?.CACHE && payload.ok === true) {
          try {
            await env.CACHE.put(sectionCacheKvKey, JSON.stringify(payload), {
              expirationTtl: LIFEBOOK_SECTION_CACHE_TTL_SEC,
            });
          } catch (e) {
            console.warn("[life-book/generate-section] KV section cache write failed", e);
          }
        }
        return json(withTc(payload));
      };

      try {
      if (env?.CACHE) {
        try {
          await env.CACHE.put(sectionRateLimitKvKey, "1", { expirationTtl: LIFEBOOK_SECTION_RATE_LIMIT_SEC });
        } catch (e) {
          console.warn("[life-book/generate-section] rate limit put failed", e);
        }
      }
      const chartJson = sanitizeLifebookRequestChartJson(chartJsonRawSection)!;
      const chartForSection = canonicalizeChartJsonForLifebook(chartJson)!;

      let lifeBookConfig: LifeBookConfig | null = null;
      const cached = await env?.CACHE?.get(LIFEBOOK_CONFIG_KEY);
      if (cached) {
        try {
          lifeBookConfig = JSON.parse(cached) as LifeBookConfig;
        } catch {
          /* use default */
        }
      }
      const effectiveModel = modelFromBody ?? lifeBookConfig?.model ?? "gpt-4.1";
      const sectionTemp = typeof body?.temperature === "number" && Number.isFinite(body.temperature) ? body.temperature : 0.7;
      const sectionOptions = getGenerationOptions(effectiveModel, sectionTemp);

      const sectionLocaleRaw = String(body?.locale ?? chartForSection?.language ?? chartForSection?.astrolabeLanguage ?? "zh-TW");
      const sectionLocale: Locale = sectionLocaleRaw === "en" || sectionLocaleRaw === "en-US" ? "en" : sectionLocaleRaw === "zh-CN" ? "zh-CN" : "zh-TW";
      const { content: sectionContent } = await getContentForLocale(env, sectionLocale);
      const sectionStarPalacesTotal = typeof sectionContent?.starPalaces === "object" ? Object.keys(sectionContent.starPalaces).length : 0;

      const sectionConfigWithStarPalaces = buildEffectiveLifeBookConfigForChart(chartForSection, sectionContent as DbContent, sectionLocale, {
        lifeBookBase: lifeBookConfig,
        minorFortuneSummary: typeof body?.minor_fortune_summary === "string" ? body.minor_fortune_summary : undefined,
        minorFortuneTriggers: typeof body?.minor_fortune_triggers === "string" ? body.minor_fortune_triggers : undefined,
      });
      console.log(
        "[life-book/generate-section] starPalaces_total_count=%s starPalaces_used_count=%s",
        sectionStarPalacesTotal,
        Object.keys(sectionConfigWithStarPalaces.starPalaces ?? {}).length
      );

      if (wantsTechnicalOnly) {
        const genSectionTemplate = SECTION_TEMPLATES.find((t) => t.section_key === sectionKey);
        const sectionTitle = genSectionTemplate?.title ?? `[${sectionKey}]`;
        const chartSlice = getChartSlice(chartForSection, genSectionTemplate?.slice_types ?? []);
        const p2 =
          TIME_MODULE_SECTION_KEYS.includes(sectionKey as (typeof TIME_MODULE_SECTION_KEYS)[number])
            ? buildP2FindingsAndContext(chartForSection ?? undefined, sectionConfigWithStarPalaces)
            : emptyP2();
        const blocks = getSectionTechnicalBlocks(
          sectionKey,
          chartForSection,
          sectionConfigWithStarPalaces,
          sectionContent as Parameters<typeof getSectionTechnicalBlocks>[3],
          sectionLocale === "zh-TW" ? "zh-TW" : sectionLocale === "zh-CN" ? "zh-CN" : "en",
          p2.findings ?? undefined,
          p2.findingsV2 ?? undefined
        );
        const technicalParts: string[] = [];
        const skipDebugBlocks = sectionKey === "s00" || sectionKey === "s03" || sectionKey === "s04";
        if (blocks.underlyingParamsText && !skipDebugBlocks) technicalParts.push("", blocks.underlyingParamsText);
        if (blocks.riskBlockText && !skipDebugBlocks) technicalParts.push("", blocks.riskBlockText);
        const resolved = blocks.resolvedSkeleton;
        if (resolved) {
          technicalParts.push("", resolved.structure_analysis);
        } else if (blocks.skeletonBlockText) {
          technicalParts.push("", blocks.skeletonBlockText);
        }
        let structureAnalysisFinal = sanitizeStructureAnalysis(technicalParts.join("\n"));
        if (["s15", "s15a", "s16", "s17", "s18", "s19", "s20", "s22", "s23", "s21"].includes(sectionKey)) {
          const injectOpts = {
            findings: p2.findings ?? undefined,
            timeContext: p2.timeContext,
            timelineValidationIssues: p2.timelineValidationIssues,
            findingsV2: p2.findingsV2 ?? undefined,
          };
          structureAnalysisFinal = injectTimeModuleDataIntoSection(
            sectionKey,
            structureAnalysisFinal,
            chartForSection ?? {},
            (sectionContent as Parameters<typeof injectTimeModuleDataIntoSection>[3]) ?? {},
            sectionConfigWithStarPalaces,
            sectionLocale === "zh-TW" ? "zh-TW" : sectionLocale === "zh-CN" ? "zh-CN" : "en",
            injectOpts
          );
        }
        /** 資料庫技術版（output_mode=technical）先前只吃技術骨架，未套用 12 宮讀者敘事；與 AI 版一致 */
        let technicalBp = resolved?.behavior_pattern ?? "";
        let technicalBl = resolved?.blind_spots ?? "";
        let technicalSt = resolved?.strategic_advice ?? "";
        if (PALACE_SECTION_KEYS.has(sectionKey)) {
          const locTech: LifeBookLocaleNarrate =
            sectionLocale === "en" ? "en" : sectionLocale === "zh-CN" ? "zh-CN" : "zh-TW";
          const mergedTech = await applyPalaceReaderOverridesForSection(
            env,
            sectionKey,
            chartForSection,
            locTech,
            {
              structure_analysis: structureAnalysisFinal,
              behavior_pattern: technicalBp,
              blind_spots: technicalBl,
              strategic_advice: technicalSt,
            },
            { effectiveLifeBookConfig: sectionConfigWithStarPalaces }
          );
          structureAnalysisFinal = mergedTech.structure_analysis;
          technicalBp = mergedTech.behavior_pattern;
          technicalBl = mergedTech.blind_spots;
          technicalSt = mergedTech.strategic_advice;
        }
        const technicalSection: Record<string, unknown> = {
          section_key: sectionKey,
          title: sectionTitle,
          importance_level: genSectionTemplate?.importance_level ?? "medium",
          structure_analysis: structureAnalysisFinal,
          behavior_pattern: technicalBp,
          blind_spots: technicalBl,
          strategic_advice: technicalSt,
          output_mode: "technical",
          technical: {
            chart_slice: chartSlice,
            star_palace_quotes:
              sectionConfigWithStarPalaces.starPalaces && Object.keys(sectionConfigWithStarPalaces.starPalaces).length > 0
                ? sectionConfigWithStarPalaces.starPalaces
                : undefined,
            underlying_params_text: blocks.underlyingParamsText,
            risk_block_text: blocks.riskBlockText,
            decadal_limits: chartForSection?.decadalLimits,
            yearly_horoscope: chartForSection?.yearlyHoroscope,
            liunian: chartForSection?.liunian,
            minor_fortune_by_palace: chartForSection?.minorFortuneByPalace,
            overlap_analysis: chartForSection?.overlapAnalysis,
            weight_analysis: weightAnalysis,
            wuxing_by_palace: chartForSection?.wuxingByPalace,
            ten_god_by_palace: chartForSection?.tenGodByPalace,
            ziwei: chartForSection?.ziwei,
            bazi: chartForSection?.bazi,
            five_elements: chartForSection?.fiveElements ?? chartForSection?.wuxingData,
            four_transformations: chartForSection?.fourTransformations,
          },
        };
        return await sectionCachePut({ ok: true, section: technicalSection, output_mode: "technical" });
      }

      const filteredWeightForSection = filterStablePalacesByDominant(
        weightAnalysis as { stable_palaces?: string[]; [k: string]: unknown },
        chartForSection,
        sectionConfigWithStarPalaces
      );
      const systemPrompt = getSystemPrompt(sectionConfigWithStarPalaces);
      const userPrompt = buildSectionUserPrompt(
        sectionKey,
        chartForSection,
        filteredWeightForSection as { importance_map?: Record<string, string>; top_focus_palaces?: string[]; risk_palaces?: string[]; stable_palaces?: string[] },
        sectionConfigWithStarPalaces,
        env,
        {
          neuralLoops: sectionContent?.neuralLoops,
          highPressure: sectionContent?.highPressure,
          consciousPalace: sectionContent?.consciousPalace,
          starBaseCore: sectionContent?.starBaseCore,
          starBaseShadow: sectionContent?.starBaseShadow,
          wuxingEnergy: sectionContent?.wuxingEnergy,
          starPalaces: sectionContent?.starPalaces,
          tenGodPalacesById: sectionContent?.tenGodPalacesById,
          archetypeElement: sectionContent?.archetypeElement,
          archetypeStar: sectionContent?.archetypeStar,
          lifebookSection: sectionContent?.lifebookSection,
        },
        sectionLocale === "zh-TW" ? "zh-TW" : sectionLocale === "zh-CN" ? "zh-CN" : "en"
      );

      const sectionMessages = [
        { role: "system" as const, content: systemPrompt },
        { role: "user" as const, content: userPrompt },
      ];

      const isLifebookDebug = env?.LIFEBOOK_DEBUG === "1" || env?.LIFEBOOK_DEBUG === "true";
      if (isLifebookDebug && sectionKey === "s18") {
        console.log("[life-book/generate-section] [LIFEBOOK_DEBUG] s18 full prompt (system length=%s, user length=%s)", systemPrompt.length, userPrompt.length);
        console.log("[life-book/generate-section] [LIFEBOOK_DEBUG] s18 SYSTEM PROMPT:\n---\n%s\n---", systemPrompt);
        console.log("[life-book/generate-section] [LIFEBOOK_DEBUG] s18 USER PROMPT:\n---\n%s\n---", userPrompt);
      }

      logLifeBookOpenAIPayload("life-book/generate-section", {
        model: effectiveModel,
        messages: sectionMessages,
        chartJson: chartForSection,
      });

      const openaiResp = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          ...sectionOptions,
          messages: sectionMessages,
          max_completion_tokens: 4000,
        }),
      });

      if (!openaiResp.ok) {
        const errText = await openaiResp.text();
        return json(withTc({ ok: false, error: `生成失敗: ${errText.slice(0, 150)}` }), { status: 502 });
      }

      const openaiData = (await openaiResp.json()) as { choices?: Array<{ message?: { content?: string } }> };
      const content = openaiData?.choices?.[0]?.message?.content ?? "";
      const parsed = parseSectionJson(content);

      const genSectionTemplate = SECTION_TEMPLATES.find((t) => t.section_key === sectionKey);
      const sectionTitle = genSectionTemplate?.title ?? `[${sectionKey}]`;

      const four = parsed ? toSectionFourFields(parsed, sectionKey, sectionTitle) : null;
      const hasFullFour =
        four &&
        four.structure_analysis !== "(未提供)" &&
        four.behavior_pattern !== "(未提供)" &&
        four.blind_spots !== "(未提供)" &&
        four.strategic_advice !== "(未提供)";

      if (parsed && four && (hasFullFour || four.structure_analysis || four.behavior_pattern || four.blind_spots || four.strategic_advice)) {
        const p2 =
          TIME_MODULE_SECTION_KEYS.includes(sectionKey as (typeof TIME_MODULE_SECTION_KEYS)[number]) ||
          PALACE_SECTION_KEYS.has(sectionKey)
            ? buildP2FindingsAndContext(chartForSection ?? undefined, sectionConfigWithStarPalaces)
            : emptyP2();
        let structureAnalysisOut = four.structure_analysis;
        let behaviorPatternOut = four.behavior_pattern;
        let blindSpotsOut = four.blind_spots;
        let strategicAdviceOut = four.strategic_advice;
        if (sectionKey === "s03") {
          const [sa, bp, bl, st] = dedupeParagraphsAcrossBlocks([
            structureAnalysisOut,
            behaviorPatternOut,
            blindSpotsOut,
            strategicAdviceOut,
          ]);
          structureAnalysisOut = normalizePunctuation(sa);
          behaviorPatternOut = normalizePunctuation(bp);
          blindSpotsOut = normalizePunctuation(bl);
          strategicAdviceOut = normalizePunctuation(st);
        } else {
          structureAnalysisOut = normalizePunctuation(structureAnalysisOut);
          behaviorPatternOut = normalizePunctuation(behaviorPatternOut);
          blindSpotsOut = normalizePunctuation(blindSpotsOut);
          strategicAdviceOut = normalizePunctuation(strategicAdviceOut);
        }
        if (["s15", "s15a", "s16", "s17", "s18", "s19", "s20", "s22", "s23", "s21"].includes(sectionKey)) {
          const injectOpts = {
            findings: p2.findings ?? undefined,
            timeContext: p2.timeContext,
            timelineValidationIssues: p2.timelineValidationIssues,
            findingsV2: p2.findingsV2 ?? undefined,
          };
          structureAnalysisOut = injectTimeModuleDataIntoSection(
            sectionKey,
            structureAnalysisOut,
            chartForSection ?? {},
            (sectionContent as Parameters<typeof injectTimeModuleDataIntoSection>[3]) ?? {},
            sectionConfigWithStarPalaces,
            sectionLocale === "zh-TW" ? "zh-TW" : sectionLocale === "zh-CN" ? "zh-CN" : "en",
            injectOpts
          );
        }
        let palaceResolvedStructure: string | undefined;
        if (PALACE_SECTION_KEYS.has(sectionKey)) {
          // 12 宮與 s00/s03/模組二同源：若 p2.findings 為 null（例如 buildLifebookFindingsFromChartAndContent 失敗），
          // 仍用 chart 水合出 natalFlowItems，讓【宮干飛化】有資料（與模組二 getFlowBlockForPalace(chart) 同源）
          let findingsForPalace = p2.findings ?? createEmptyFindings();
          if (!findingsForPalace.natalFlowItems || findingsForPalace.natalFlowItems.length === 0) {
            let extractedFlows: unknown[] =
              (chartForSection?.natal as { flows?: unknown[]; birthTransforms?: unknown[] } | undefined)?.flows ||
              (chartForSection?.natal as { birthTransforms?: unknown[] } | undefined)?.birthTransforms ||
              (chartForSection?.natalTransforms as unknown[] | undefined) ||
              [];
            if ((!extractedFlows || extractedFlows.length === 0) && typeof normalizeChart === "function") {
              try {
                const normalized = normalizeChart(chartForSection as Record<string, unknown>);
                extractedFlows = (normalized?.natal as { flows?: unknown[] } | undefined)?.flows ?? [];
              } catch (err) {
                console.warn("[Hydration Warning] normalizeChart 無法生成 natal flows", err);
              }
            }
            if (Array.isArray(extractedFlows) && extractedFlows.length > 0) {
              const validTransform = (t: string | undefined): "祿" | "權" | "科" | "忌" =>
                (t === "祿" || t === "權" || t === "科" || t === "忌" ? t : "祿");
              findingsForPalace.natalFlowItems = extractedFlows
                .map((e: unknown) => {
                  const x = e as { fromPalace?: string; toPalace?: string; starName?: string; transform?: string };
                  return { fromPalace: x.fromPalace ?? "", toPalace: x.toPalace ?? "", starName: x.starName, transform: validTransform(x.transform) };
                })
                .filter((item) => Boolean(item.fromPalace && item.toPalace && item.transform)) as Array<{ fromPalace: string; toPalace: string; starName?: string; transform: "祿" | "權" | "科" | "忌" }>;
            }
          }
          if (isLifebookDebugEnv(env)) {
            console.log("[Hydration Debug] sectionKey:", sectionKey);
            console.log("[Hydration Debug] natalFlowItems length:", findingsForPalace?.natalFlowItems?.length ?? 0);
            console.log("[Hydration Debug] natalFlowItems first:", JSON.stringify(findingsForPalace?.natalFlowItems?.[0] ?? null));
          }
          const overrides = getPalaceSectionReaderOverrides(
            sectionKey,
            chartForSection ?? {},
            sectionConfigWithStarPalaces,
            sectionContent as Parameters<typeof getPalaceSectionReaderOverrides>[3],
            sectionLocale === "zh-TW" ? "zh-TW" : sectionLocale === "zh-CN" ? "zh-CN" : "en",
            findingsForPalace,
            p2.normalizedChart
          );
          if (overrides) {
            if (overrides.resolvedStructureAnalysis != null && overrides.resolvedStructureAnalysis !== "") {
              structureAnalysisOut = overrides.resolvedStructureAnalysis;
              palaceResolvedStructure = overrides.resolvedStructureAnalysis;
            } else {
              const block = overrides.starBlockToAppend;
              const idx = structureAnalysisOut.indexOf("【星曜結構】");
              if (idx >= 0) {
                const after = structureAnalysisOut.slice(idx);
                const nextReminder = after.indexOf("【此宮提醒】");
                structureAnalysisOut = structureAnalysisOut.slice(0, idx) + block + (nextReminder >= 0 ? "\n\n" + after.slice(nextReminder) : "");
              } else {
                structureAnalysisOut = structureAnalysisOut + block;
              }
            }
            behaviorPatternOut = overrides.behavior_pattern;
            blindSpotsOut = overrides.blind_spots;
            strategicAdviceOut = overrides.strategic_advice;
          }
        }
        structureAnalysisOut = sanitizeStructureAnalysis(structureAnalysisOut);
        behaviorPatternOut = sanitizeForReader(behaviorPatternOut);
        blindSpotsOut = sanitizeForReader(blindSpotsOut);
        strategicAdviceOut = sanitizeForReader(strategicAdviceOut);
        // 12 宮最終防呆：強制使用 override 組裝的 structure_analysis，避免被 AI 或舊 merge 覆蓋
        if (PALACE_SECTION_KEYS.has(sectionKey) && palaceResolvedStructure != null && palaceResolvedStructure.length > 0) {
          structureAnalysisOut = palaceResolvedStructure;
        }
        // Phase 5B-10：最終送進 render 的 structure_analysis（兄弟 s01、僕役 s09、官祿 s11）
        if (isLifebookDebugEnv(env) && PALACE_SECTION_KEYS.has(sectionKey) && ["s01", "s09", "s11"].includes(sectionKey)) {
          const snippet = structureAnalysisOut.slice(0, 400);
          const hasNew = snippet.includes("四化引動") && snippet.includes("宮干飛化");
          const hasOld = snippet.includes("動態引動與根因");
          console.log("[life-book/generate-section Phase5B-10] sectionKey=%s finalHasNew=%s finalHasOld=%s structure_analysis(0..400)=%s", sectionKey, hasNew, hasOld, JSON.stringify(snippet));
        }
        const section: Record<string, unknown> = {
          section_key: typeof parsed.section_key === "string" ? parsed.section_key : sectionKey,
          title: typeof parsed.title === "string" ? parsed.title : sectionTitle,
          importance_level: (typeof parsed.importance_level === "string" && ["high", "medium", "low"].includes(parsed.importance_level)) ? parsed.importance_level : "medium",
          structure_analysis: structureAnalysisOut,
          behavior_pattern: behaviorPatternOut,
          blind_spots: blindSpotsOut,
          strategic_advice: strategicAdviceOut,
        };
        if (sectionConfigWithStarPalaces.starPalaces && Object.keys(sectionConfigWithStarPalaces.starPalaces).length > 0) {
          section.star_palace_quotes = sectionConfigWithStarPalaces.starPalaces;
        }
        return await sectionCachePut({ ok: true, section });
      }

      const rawFallback = content.trim().slice(0, 4000);
      let fallbackStructure = rawFallback
        ? `${rawFallback}${rawFallback.length >= 4000 ? "…" : ""}\n\n（原始回傳未符四欄位 JSON，建議重試該章取得正確格式。）`
        : "(AI 回傳格式異常，請重試該章)";
      if (["s15", "s15a", "s16", "s17", "s18", "s19", "s20", "s22", "s23", "s21"].includes(sectionKey)) {
        const p2 = buildP2FindingsAndContext(chartForSection ?? undefined, sectionConfigWithStarPalaces);
        const injectOpts = {
          findings: p2.findings ?? undefined,
          timeContext: p2.timeContext,
          timelineValidationIssues: p2.timelineValidationIssues,
          findingsV2: p2.findingsV2 ?? undefined,
        };
        fallbackStructure = injectTimeModuleDataIntoSection(
          sectionKey,
          fallbackStructure,
          chartForSection ?? {},
          (sectionContent as Parameters<typeof injectTimeModuleDataIntoSection>[3]) ?? {},
          sectionConfigWithStarPalaces,
          sectionLocale === "zh-TW" ? "zh-TW" : sectionLocale === "zh-CN" ? "zh-CN" : "en",
          injectOpts
        );
      }
      const fallbackSection: Record<string, unknown> = {
        section_key: sectionKey,
        title: sectionTitle,
        importance_level: "medium",
        structure_analysis: fallbackStructure,
        behavior_pattern: "",
        blind_spots: "",
        strategic_advice: "",
      };
      if (sectionConfigWithStarPalaces.starPalaces && Object.keys(sectionConfigWithStarPalaces.starPalaces).length > 0) {
        fallbackSection.star_palace_quotes = sectionConfigWithStarPalaces.starPalaces;
      }
      return await sectionCachePut({ ok: true, section: fallbackSection });
      } catch (sectionErr: unknown) {
        const msg = sectionErr instanceof Error ? sectionErr.message : String(sectionErr);
        console.error("[life-book/generate-section] unhandled:", sectionErr);
        return json(
          withTc({ ok: false, error: `命書章節處理失敗: ${msg.slice(0, 500)}` }),
          { status: 500 }
        );
      }
    }

    // POST /api/life-book/daily-flow（流日 DayContract：iztro horoscope.daily + §八 降級；KV 鍵見 lifebookDailyHoroscopeCacheKey）
    if (req.method === "POST" && url.pathname === "/api/life-book/daily-flow") {
      let body: {
        chart_json?: unknown;
        clientTimeZone?: string;
        clientNowISO?: string;
        skip_cache?: boolean;
        beta_invite_code?: string;
      };
      try {
        body = (await req.json()) as typeof body;
      } catch {
        const tcInvalid = resolveTimeContextFromBody({});
        return json({ ok: false, error: "Invalid JSON", time_context: timeContextToJson(tcInvalid) }, { status: 400 });
      }
      if (isLifebookInviteRequired(env) && !isValidBetaInviteCode(env, body?.beta_invite_code)) {
        return json({ ok: false, error: "invite_required" }, { status: 403 });
      }
      const timeContext = resolveTimeContextFromBody(body);
      const withTc = (p: Record<string, unknown>) => ({ ...p, time_context: timeContextToJson(timeContext) });

      const chartRaw = body.chart_json as Record<string, unknown> | undefined;
      const chartForDaily = sanitizeLifebookRequestChartJson(chartRaw);
      if (!chartForDaily || typeof chartForDaily !== "object") {
        return json(withTc({ ok: false, error: "缺少 chart_json" }), { status: 400 });
      }

      const instant = new Date(timeContext.clientNowISO);
      const timeIndex = timeIndexFromWallClockInTimeZone(instant, timeContext.timeZone);
      const dayKey = timeContext.dayKey;
      const fingerprint = stableChartId(chartForDaily);
      const cacheKey = lifebookDailyHoroscopeCacheKey(fingerprint, dayKey, timeContext.timeZone, timeIndex);

      if (env?.CACHE && !body.skip_cache) {
        try {
          const cached = await env.CACHE.get(cacheKey);
          if (cached) {
            const parsed = JSON.parse(cached) as Record<string, unknown>;
            if (parsed && typeof parsed === "object" && parsed.ok === true && parsed.day_contract) {
              return json(withTc(parsed));
            }
          }
        } catch (e) {
          console.warn("[life-book/daily-flow] KV cache read failed", e);
        }
      }

      let day_contract;
      try {
        day_contract = buildDailyFlowResult({
          chart_json: chartForDaily,
          day_key: dayKey,
          timeIndex,
          time_zone: timeContext.timeZone,
        });
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        console.error("[life-book/daily-flow] build failed", e);
        return json(withTc({ ok: false, error: `daily_flow_failed: ${msg.slice(0, 200)}` }), { status: 500 });
      }

      const payload = { ok: true as const, day_contract };
      if (env?.CACHE && !body.skip_cache) {
        try {
          await env.CACHE.put(cacheKey, JSON.stringify(payload), { expirationTtl: LIFEBOOK_SECTION_CACHE_TTL_SEC });
        } catch (e) {
          console.warn("[life-book/daily-flow] KV cache write failed", e);
        }
      }
      return json(withTc(payload));
    }

    // POST /api/life-book/chart-with-findings（分段生成後附 findings 至 chart_json）
    if (req.method === "POST" && url.pathname === "/api/life-book/chart-with-findings") {
      let body: { chart_json?: unknown; locale?: string; beta_invite_code?: string };
      try {
        body = (await req.json()) as typeof body;
      } catch {
        return badRequest("Invalid JSON");
      }
      if (isLifebookInviteRequired(env) && !isValidBetaInviteCode(env, body?.beta_invite_code)) {
        return json({ ok: false, error: "invite_required" }, { status: 403 });
      }
      const chartJsonRawCf = body?.chart_json as Record<string, unknown> | undefined;
      if (!chartJsonRawCf || typeof chartJsonRawCf !== "object") {
        return badRequest("缺少 chart_json");
      }
      const chartJsonCf = sanitizeLifebookRequestChartJson(chartJsonRawCf)!;
      const chartForFindings = canonicalizeChartJsonForLifebook(chartJsonCf, { emptyDecadalLimitsWhenNoIztro: true })!;
      const cfLocaleRaw = String(
        body?.locale ?? chartForFindings?.language ?? chartForFindings?.astrolabeLanguage ?? "zh-TW"
      );
      const cfLocale: Locale =
        cfLocaleRaw === "en" || cfLocaleRaw === "en-US" ? "en" : cfLocaleRaw === "zh-CN" ? "zh-CN" : "zh-TW";
      const { content: cfContent } = await getContentForLocale(env, cfLocale);
      const cfGenerateConfig = buildEffectiveLifeBookConfigForChart(chartForFindings, cfContent as DbContent, cfLocale, {
        lifeBookBase: null,
      });
      const p2Cf = buildP2FindingsAndContext(chartForFindings ?? undefined, cfGenerateConfig);
      const chartOut = chartJsonWithClientFindings(chartForFindings as Record<string, unknown>, p2Cf.findings);
      return json({ ok: true, chart_json: chartOut });
    }

    // POST /api/life-book/cache-fetch（讀取與整本 generate 同鍵的 KV 快取）
    if (req.method === "POST" && url.pathname === "/api/life-book/cache-fetch") {
      let body: { fingerprint?: string; beta_invite_code?: string };
      try {
        body = (await req.json()) as typeof body;
      } catch {
        return badRequest("Invalid JSON");
      }
      if (isLifebookInviteRequired(env) && !isValidBetaInviteCode(env, body?.beta_invite_code)) {
        return json({ ok: false, error: "invite_required" }, { status: 403 });
      }
      const fpFetch = typeof body?.fingerprint === "string" ? body.fingerprint.trim() : "";
      if (!fpFetch) {
        return badRequest("缺少 fingerprint");
      }
      if (!env?.CACHE) {
        return json({ ok: false, error: "cache_unavailable" }, { status: 503 });
      }
      try {
        const cachedFetch = await env.CACHE.get(lifebookKvCacheKey(fpFetch));
        if (!cachedFetch) {
          return json({ ok: false, error: "not_found" }, { status: 404 });
        }
        const parsedFetch = JSON.parse(cachedFetch) as Record<string, unknown>;
        return json(parsedFetch);
      } catch (e) {
        console.warn("[life-book/cache-fetch] failed", e);
        return json({ ok: false, error: "cache_read_failed" }, { status: 500 });
      }
    }

    // POST /api/life-book/cache-store（前端分段生成後寫入 KV，與整本 generate 同形）
    if (req.method === "POST" && url.pathname === "/api/life-book/cache-store") {
      let body: { fingerprint?: string; beta_invite_code?: string; payload?: unknown };
      try {
        body = (await req.json()) as typeof body;
      } catch {
        return badRequest("Invalid JSON");
      }
      if (isLifebookInviteRequired(env) && !isValidBetaInviteCode(env, body?.beta_invite_code)) {
        return json({ ok: false, error: "invite_required" }, { status: 403 });
      }
      const fpStore = typeof body?.fingerprint === "string" ? body.fingerprint.trim() : "";
      if (!fpStore) {
        return badRequest("缺少 fingerprint");
      }
      const storePayload = body?.payload;
      if (storePayload === undefined || typeof storePayload !== "object" || storePayload === null) {
        return badRequest("缺少 payload");
      }
      if (!env?.CACHE) {
        return json({ ok: false, error: "cache_unavailable" }, { status: 503 });
      }
      try {
        await env.CACHE.put(lifebookKvCacheKey(fpStore), JSON.stringify(storePayload), {
          expirationTtl: LIFEBOOK_GENERATE_KV_TTL_SEC,
        });
        return json({ ok: true });
      } catch (e) {
        console.warn("[life-book/cache-store] failed", e);
        return json({ ok: false, error: "cache_write_failed" }, { status: 500 });
      }
    }

    // POST /api/life-book/generate（保留：一次 20 章，可能逾時）
    if (req.method === "POST" && url.pathname === "/api/life-book/generate") {
      let body: {
        chart_json?: unknown;
        weight_analysis?: unknown;
        locale?: string;
        plan_tier?: "free" | "pro";
        unlock_sections?: string[];
        beta_invite_code?: string;
        minor_fortune_summary?: string;
        minor_fortune_triggers?: string;
        model?: string;
        temperature?: number;
        output_mode?: "ai" | "technical";
      };
      try {
        body = (await req.json()) as typeof body;
      } catch {
        return badRequest("Invalid JSON");
      }

      const chartJsonRawGen = body?.chart_json as Record<string, unknown> | undefined;
      const weightAnalysis = body?.weight_analysis as Record<string, unknown> | undefined;

      if (!chartJsonRawGen || typeof chartJsonRawGen !== "object") {
        return badRequest("缺少 chart_json");
      }
      if (!weightAnalysis || typeof weightAnalysis !== "object") {
        return badRequest("缺少 weight_analysis");
      }

      const effectiveOutputModeGen = resolveLifebookOutputMode(body, env);

      if (isLifebookInviteRequired(env) && !isValidBetaInviteCode(env, body?.beta_invite_code)) {
        const lockedByInvite = (SECTION_ORDER as readonly string[]).map((k) => buildInviteRequiredPayload(k));
        return json({
          ok: true,
          sections: {},
          invite_required: true,
          plan_tier: "free",
          plan_matrix_version: LIFEBOOK_PLAN_MATRIX.version || "unknown",
          available_sections: [],
          locked_sections: lockedByInvite,
        });
      }

      const inviteNormGen =
        typeof body?.beta_invite_code === "string" ? body.beta_invite_code.trim().toUpperCase() : "";
      const generateFp = buildLifebookGenerateFingerprint({
        chart_json: chartJsonRawGen as Record<string, unknown>,
        weight_analysis: weightAnalysis as Record<string, unknown>,
        plan_tier: toPlanTier(body?.plan_tier),
        unlock_sections: normalizePlanSectionList(body?.unlock_sections),
        output_mode: effectiveOutputModeGen,
        invite_fingerprint: inviteNormGen,
      });
      const generateCacheKey = lifebookKvCacheKey(generateFp);
      if (env?.CACHE && effectiveOutputModeGen === "technical") {
        try {
          const cachedFull = await env.CACHE.get(generateCacheKey);
          if (cachedFull) {
            const parsed = JSON.parse(cachedFull) as unknown;
            if (parsed && typeof parsed === "object" && (parsed as { ok?: unknown }).ok === true) {
              return json(parsed as Record<string, unknown>);
            }
          }
        } catch (e) {
          console.warn("[life-book/generate] KV cache read failed", e);
        }
      }

      const chartJson = sanitizeLifebookRequestChartJson(chartJsonRawGen)!;
      const chartForGenerate = canonicalizeChartJsonForLifebook(chartJson, {
        emptyDecadalLimitsWhenNoIztro: true,
      })!;
      const decadalLimitsForLifebook = (chartForGenerate.decadalLimits as unknown[] | undefined) ?? [];
      console.log(
        "[life-book/generate] chart_json.decadalLimits source =",
        Array.isArray(decadalLimitsForLifebook) && decadalLimitsForLifebook.length > 0 ? "iztro" : "none (empty)"
      );
      console.log("[life-book/generate] chart_json.decadalLimits[5] =", JSON.stringify(decadalLimitsForLifebook[5] ?? null));

      const apiKey = env?.OPENAI_API_KEY;
      if (effectiveOutputModeGen !== "technical" && !apiKey) {
        return json({ ok: false, error: "OPENAI_API_KEY 未設定" }, { status: 500 });
      }

      const generateModel = typeof body?.model === "string" && body.model.trim() ? body.model.trim() : "gpt-4.1";
      const generateTemp = typeof body?.temperature === "number" && Number.isFinite(body.temperature) ? body.temperature : 0.7;
      const generateOptions = getGenerationOptions(generateModel, generateTemp);

      const generateLocaleRaw = String(body?.locale ?? chartForGenerate?.language ?? chartForGenerate?.astrolabeLanguage ?? "zh-TW");
      const generateLocale: Locale = generateLocaleRaw === "en" || generateLocaleRaw === "en-US" ? "en" : generateLocaleRaw === "zh-CN" ? "zh-CN" : "zh-TW";
      const { content: generateContent } = await getContentForLocale(env, generateLocale);
      const generateStarPalacesTotal = typeof generateContent?.starPalaces === "object" ? Object.keys(generateContent.starPalaces).length : 0;
      const generateConfig = buildEffectiveLifeBookConfigForChart(chartForGenerate, generateContent as DbContent, generateLocale, {
        lifeBookBase: null,
        minorFortuneSummary: typeof body?.minor_fortune_summary === "string" ? body.minor_fortune_summary : undefined,
        minorFortuneTriggers: typeof body?.minor_fortune_triggers === "string" ? body.minor_fortune_triggers : undefined,
      });
      console.log(
        "[life-book/generate] starPalaces_total_count=%s starPalaces_used_count=%s",
        generateStarPalacesTotal,
        Object.keys(generateConfig.starPalaces ?? {}).length
      );
      const sections: Record<string, Record<string, unknown>> = {};
      const planAccess = resolvePlanAccess(body?.plan_tier, body?.unlock_sections, body?.beta_invite_code, env);
      const sectionOrder = [...planAccess.availableSections];
      const lockedSections = planAccess.lockedSectionKeys.map((k) => buildLockedSectionPayload(k));

      const localeForTechnical = generateLocale === "zh-TW" ? "zh-TW" : generateLocale === "zh-CN" ? "zh-CN" : "en";

      for (let i = 0; i < sectionOrder.length; i++) {
        const sectionKey = sectionOrder[i];
        if (effectiveOutputModeGen === "technical") {
          const genSectionTemplate = SECTION_TEMPLATES.find((t) => t.section_key === sectionKey);
          const sectionTitle = genSectionTemplate?.title ?? `[${sectionKey}]`;
          const chartSlice = getChartSlice(chartForGenerate, genSectionTemplate?.slice_types ?? []);
          const p2 =
            TIME_MODULE_SECTION_KEYS.includes(sectionKey as (typeof TIME_MODULE_SECTION_KEYS)[number])
              ? buildP2FindingsAndContext(chartForGenerate ?? undefined, generateConfig)
              : emptyP2();
          const blocks = getSectionTechnicalBlocks(sectionKey, chartForGenerate, generateConfig, generateContent as Parameters<typeof getSectionTechnicalBlocks>[3], localeForTechnical, p2.findings ?? undefined, p2.findingsV2 ?? undefined);
          const technicalParts: string[] = [];
          const skipDebugBlocks = sectionKey === "s00" || sectionKey === "s03" || sectionKey === "s04";
          if (blocks.underlyingParamsText && !skipDebugBlocks) technicalParts.push("", blocks.underlyingParamsText);
          if (blocks.riskBlockText && !skipDebugBlocks) technicalParts.push("", blocks.riskBlockText);
          const resolved = blocks.resolvedSkeleton;
          if (resolved) {
            technicalParts.push("", resolved.structure_analysis);
          } else if (blocks.skeletonBlockText) {
            technicalParts.push("", blocks.skeletonBlockText);
          }
          let structureAnalysisFinal = sanitizeStructureAnalysis(technicalParts.join("\n"));
          if (["s15", "s15a", "s16", "s17", "s18", "s19", "s20", "s22", "s23", "s21"].includes(sectionKey)) {
            const injectOpts = {
              findings: p2.findings ?? undefined,
              timeContext: p2.timeContext,
              timelineValidationIssues: p2.timelineValidationIssues,
              findingsV2: p2.findingsV2 ?? undefined,
            };
            structureAnalysisFinal = injectTimeModuleDataIntoSection(
              sectionKey,
              structureAnalysisFinal,
              chartForGenerate ?? {},
              (generateContent as Parameters<typeof injectTimeModuleDataIntoSection>[3]) ?? {},
              generateConfig,
              localeForTechnical,
              injectOpts
            );
          }
          sections[sectionKey] = {
            section_key: sectionKey,
            title: sectionTitle,
            importance_level: genSectionTemplate?.importance_level ?? "medium",
            structure_analysis: structureAnalysisFinal,
            behavior_pattern: resolved?.behavior_pattern ?? "",
            blind_spots: resolved?.blind_spots ?? "",
            strategic_advice: resolved?.strategic_advice ?? "",
            output_mode: "technical",
            technical: {
              chart_slice: chartSlice,
              star_palace_quotes:
                generateConfig.starPalaces && Object.keys(generateConfig.starPalaces).length > 0 ? generateConfig.starPalaces : undefined,
              underlying_params_text: blocks.underlyingParamsText,
              risk_block_text: blocks.riskBlockText,
              decadal_limits: chartForGenerate?.decadalLimits,
              yearly_horoscope: chartForGenerate?.yearlyHoroscope,
              liunian: chartForGenerate?.liunian,
              minor_fortune_by_palace: chartForGenerate?.minorFortuneByPalace,
              overlap_analysis: chartForGenerate?.overlapAnalysis,
              weight_analysis: weightAnalysis,
              wuxing_by_palace: chartForGenerate?.wuxingByPalace,
              ten_god_by_palace: chartForGenerate?.tenGodByPalace,
              ziwei: chartForGenerate?.ziwei,
              bazi: chartForGenerate?.bazi,
              five_elements: chartForGenerate?.fiveElements ?? chartForGenerate?.wuxingData,
              four_transformations: chartForGenerate?.fourTransformations,
            },
          };
          continue;
        }

        const filteredWeightForGenerate = filterStablePalacesByDominant(
          weightAnalysis as { stable_palaces?: string[]; [k: string]: unknown },
          chartForGenerate,
          generateConfig
        );
        const userPrompt = buildSectionUserPrompt(
          sectionKey,
          chartForGenerate,
          filteredWeightForGenerate as { importance_map?: Record<string, string>; top_focus_palaces?: string[]; risk_palaces?: string[]; stable_palaces?: string[] },
          generateConfig,
          env,
          {
            neuralLoops: generateContent?.neuralLoops,
            highPressure: generateContent?.highPressure,
            consciousPalace: generateContent?.consciousPalace,
            starBaseCore: generateContent?.starBaseCore,
            starBaseShadow: generateContent?.starBaseShadow,
            wuxingEnergy: generateContent?.wuxingEnergy,
            starPalaces: generateContent?.starPalaces,
            tenGodPalacesById: generateContent?.tenGodPalacesById,
            archetypeElement: generateContent?.archetypeElement,
            archetypeStar: generateContent?.archetypeStar,
            lifebookSection: generateContent?.lifebookSection,
          },
          generateLocale === "zh-TW" ? "zh-TW" : generateLocale === "zh-CN" ? "zh-CN" : "en"
        );

        const messages = [
          { role: "system" as const, content: getSystemPrompt(generateConfig) },
          { role: "user" as const, content: userPrompt },
        ];

        const isLifebookDebug = env?.LIFEBOOK_DEBUG === "1" || env?.LIFEBOOK_DEBUG === "true";
        if (isLifebookDebug && sectionKey === "s18") {
          const sysPrompt = getSystemPrompt(generateConfig);
          console.log("[life-book/generate] [LIFEBOOK_DEBUG] s18 full prompt (system length=%s, user length=%s)", sysPrompt.length, userPrompt.length);
          console.log("[life-book/generate] [LIFEBOOK_DEBUG] s18 SYSTEM PROMPT:\n---\n%s\n---", sysPrompt);
          console.log("[life-book/generate] [LIFEBOOK_DEBUG] s18 USER PROMPT:\n---\n%s\n---", userPrompt);
        }

        logLifeBookOpenAIPayload("life-book/generate", {
          model: generateModel,
          messages,
          chartJson: chartForGenerate,
        });

        const openaiBody = {
          ...generateOptions,
          messages,
          max_completion_tokens: 4000,
        };

        const openaiResp = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify(openaiBody),
        });

        if (!openaiResp.ok) {
          const errText = await openaiResp.text();
          console.error(`[life-book] OpenAI error for ${sectionKey}:`, errText);
          return json(
            {
              ok: false,
              error: `生成章節 ${sectionKey} 失敗`,
              detail: errText.slice(0, 200),
            },
            { status: 502 }
          );
        }

        const openaiData = (await openaiResp.json()) as {
          choices?: Array<{ message?: { content?: string } }>;
        };
        const content = openaiData?.choices?.[0]?.message?.content ?? "";
        const parsed = parseSectionJson(content);

        const batchTemplate = SECTION_TEMPLATES.find((t) => t.section_key === sectionKey);
        const batchTitle = batchTemplate?.title ?? `[${sectionKey}]`;

        const four = parsed ? toSectionFourFields(parsed, sectionKey, batchTitle) : null;
        const hasUsable = four && (four.structure_analysis !== "(未提供)" || four.behavior_pattern !== "(未提供)" || four.blind_spots !== "(未提供)" || four.strategic_advice !== "(未提供)");

        const p2 =
          TIME_MODULE_SECTION_KEYS.includes(sectionKey as (typeof TIME_MODULE_SECTION_KEYS)[number]) ||
          PALACE_SECTION_KEYS.has(sectionKey)
            ? buildP2FindingsAndContext(chartForGenerate ?? undefined, generateConfig)
            : emptyP2();
        const rawFallback = content.trim().slice(0, 4000);
        let structureAnalysisOut = hasUsable && four && parsed ? four.structure_analysis : (rawFallback
          ? `${rawFallback}${rawFallback.length >= 4000 ? "…" : ""}\n\n（原始回傳未符四欄位 JSON，建議重試該章。）`
          : "(AI 回傳格式異常，請重試)");
        if (["s15", "s15a", "s16", "s17", "s18", "s19", "s20", "s22", "s23", "s21"].includes(sectionKey)) {
          const injectOpts = {
            findings: p2.findings ?? undefined,
            timeContext: p2.timeContext,
            timelineValidationIssues: p2.timelineValidationIssues,
            findingsV2: p2.findingsV2 ?? undefined,
          };
          structureAnalysisOut = injectTimeModuleDataIntoSection(
            sectionKey,
            structureAnalysisOut,
            chartForGenerate ?? {},
            (generateContent as Parameters<typeof injectTimeModuleDataIntoSection>[3]) ?? {},
            generateConfig,
            localeForTechnical,
            injectOpts
          );
        }
        let behaviorPatternOut: string;
        let blindSpotsOut: string;
        let strategicAdviceOut: string;
        let batchPalaceResolved: string | undefined;
        if (PALACE_SECTION_KEYS.has(sectionKey)) {
          // 12 宮與 s00/s03/模組二同源：p2.findings 為 null 時仍用 chart 水合，讓【宮干飛化】有資料
          let findingsForPalace = p2.findings ?? createEmptyFindings();
          if (!findingsForPalace.natalFlowItems || findingsForPalace.natalFlowItems.length === 0) {
            let extractedFlows: unknown[] =
              (chartForGenerate?.natal as { flows?: unknown[]; birthTransforms?: unknown[] } | undefined)?.flows ||
              (chartForGenerate?.natal as { birthTransforms?: unknown[] } | undefined)?.birthTransforms ||
              (chartForGenerate?.natalTransforms as unknown[] | undefined) ||
              [];
            if ((!extractedFlows || extractedFlows.length === 0) && typeof normalizeChart === "function") {
              try {
                const normalized = normalizeChart(chartForGenerate as Record<string, unknown>);
                extractedFlows = (normalized?.natal as { flows?: unknown[] } | undefined)?.flows ?? [];
              } catch (err) {
                console.warn("[Hydration Warning] normalizeChart 無法生成 natal flows", err);
              }
            }
            if (Array.isArray(extractedFlows) && extractedFlows.length > 0) {
              const validTransform = (t: string | undefined): "祿" | "權" | "科" | "忌" =>
                (t === "祿" || t === "權" || t === "科" || t === "忌" ? t : "祿");
              findingsForPalace.natalFlowItems = extractedFlows
                .map((e: unknown) => {
                  const x = e as { fromPalace?: string; toPalace?: string; starName?: string; transform?: string };
                  return { fromPalace: x.fromPalace ?? "", toPalace: x.toPalace ?? "", starName: x.starName, transform: validTransform(x.transform) };
                })
                .filter((item) => Boolean(item.fromPalace && item.toPalace && item.transform)) as Array<{ fromPalace: string; toPalace: string; starName?: string; transform: "祿" | "權" | "科" | "忌" }>;
            }
          }
          if (isLifebookDebugEnv(env)) {
            console.log("[Hydration Debug] sectionKey:", sectionKey);
            console.log("[Hydration Debug] natalFlowItems length:", findingsForPalace?.natalFlowItems?.length ?? 0);
            console.log("[Hydration Debug] natalFlowItems first:", JSON.stringify(findingsForPalace?.natalFlowItems?.[0] ?? null));
          }
          const overrides = getPalaceSectionReaderOverrides(
            sectionKey,
            chartForGenerate ?? {},
            generateConfig,
            generateContent as Parameters<typeof getPalaceSectionReaderOverrides>[3],
            localeForTechnical,
            findingsForPalace,
            p2.normalizedChart
          );
          if (overrides) {
            if (overrides.resolvedStructureAnalysis != null && overrides.resolvedStructureAnalysis !== "") {
              structureAnalysisOut = overrides.resolvedStructureAnalysis;
              batchPalaceResolved = overrides.resolvedStructureAnalysis;
            } else if (!structureAnalysisOut.includes("【星曜結構】")) {
              structureAnalysisOut = structureAnalysisOut + overrides.starBlockToAppend;
            }
            behaviorPatternOut = overrides.behavior_pattern;
            blindSpotsOut = overrides.blind_spots;
            strategicAdviceOut = overrides.strategic_advice;
          } else {
            behaviorPatternOut = (hasUsable && four) ? sanitizeForReader(four.behavior_pattern) : "";
            blindSpotsOut = (hasUsable && four) ? sanitizeForReader(four.blind_spots) : "";
            strategicAdviceOut = (hasUsable && four) ? sanitizeForReader(four.strategic_advice) : "";
          }
        } else {
          behaviorPatternOut = (hasUsable && four) ? sanitizeForReader(four.behavior_pattern) : "";
          blindSpotsOut = (hasUsable && four) ? sanitizeForReader(four.blind_spots) : "";
          strategicAdviceOut = (hasUsable && four) ? sanitizeForReader(four.strategic_advice) : "";
        }
        structureAnalysisOut = sanitizeStructureAnalysis(structureAnalysisOut);
        if (hasUsable && four && sectionKey === "s03") {
          const [sa, bp, bl, st] = dedupeParagraphsAcrossBlocks([
            structureAnalysisOut,
            behaviorPatternOut,
            blindSpotsOut,
            strategicAdviceOut,
          ]);
          structureAnalysisOut = normalizePunctuation(sa);
          behaviorPatternOut = normalizePunctuation(bp);
          blindSpotsOut = normalizePunctuation(bl);
          strategicAdviceOut = normalizePunctuation(st);
        } else if (hasUsable && four) {
          structureAnalysisOut = normalizePunctuation(structureAnalysisOut);
          behaviorPatternOut = normalizePunctuation(behaviorPatternOut);
          blindSpotsOut = normalizePunctuation(blindSpotsOut);
          strategicAdviceOut = normalizePunctuation(strategicAdviceOut);
        }
        // 12 宮最終防呆（batch）：強制使用 override 組裝的 structure_analysis
        if (PALACE_SECTION_KEYS.has(sectionKey) && batchPalaceResolved != null && batchPalaceResolved.length > 0) {
          structureAnalysisOut = batchPalaceResolved;
        }
        // Phase 5B-10：batch 路徑最終 structure_analysis（s01/s09/s11）
        if (isLifebookDebugEnv(env) && PALACE_SECTION_KEYS.has(sectionKey) && ["s01", "s09", "s11"].includes(sectionKey)) {
          const snippet = structureAnalysisOut.slice(0, 400);
          const hasNew = snippet.includes("四化引動") && snippet.includes("宮干飛化");
          const hasOld = snippet.includes("動態引動與根因");
          console.log("[life-book/generate Phase5B-10] sectionKey=%s finalHasNew=%s finalHasOld=%s structure_analysis(0..400)=%s", sectionKey, hasNew, hasOld, JSON.stringify(snippet));
        }
        const sectionPayload: Record<string, unknown> = hasUsable && four && parsed
          ? {
              section_key: typeof parsed.section_key === "string" ? parsed.section_key : sectionKey,
              title: typeof parsed.title === "string" ? parsed.title : batchTitle,
              importance_level: (typeof parsed.importance_level === "string" && ["high", "medium", "low"].includes(parsed.importance_level)) ? parsed.importance_level : "medium",
              structure_analysis: structureAnalysisOut,
              behavior_pattern: behaviorPatternOut,
              blind_spots: blindSpotsOut,
              strategic_advice: strategicAdviceOut,
            }
          : {
              section_key: sectionKey,
              title: batchTitle,
              importance_level: "medium",
              structure_analysis: structureAnalysisOut,
              behavior_pattern: "",
              blind_spots: "",
              strategic_advice: "",
            };
        if (generateConfig.starPalaces && Object.keys(generateConfig.starPalaces).length > 0) {
          sectionPayload.star_palace_quotes = generateConfig.starPalaces;
        }
        sections[sectionKey] = sectionPayload;

        // 節流：每章完成後等待，避免 TPM (tokens/min) 在短時間內爆量觸發 rate limit
        if (i < sectionOrder.length - 1) {
          const delayMs = 2200;
          await new Promise((r) => setTimeout(r, delayMs));
        }
      }

      const p2Export = buildP2FindingsAndContext(chartForGenerate ?? undefined, generateConfig);
      const chart_json_response = chartJsonWithClientFindings(chartForGenerate as Record<string, unknown>, p2Export.findings);

      const responsePayload = {
        ok: true as const,
        sections,
        chart_json: chart_json_response,
        weight_analysis: weightAnalysis,
        plan_tier: planAccess.planTier,
        plan_matrix_version: planAccess.matrixVersion,
        available_sections: planAccess.availableSections,
        locked_sections: lockedSections,
      };

      if (env?.CACHE && effectiveOutputModeGen === "technical") {
        try {
          await env.CACHE.put(generateCacheKey, JSON.stringify(responsePayload), {
            expirationTtl: LIFEBOOK_GENERATE_KV_TTL_SEC,
          });
        } catch (e) {
          console.warn("[life-book/generate] KV cache put failed", e);
        }
      }

      return json(responsePayload);
    }

    return json({ ok: false, error: "Not found" }, { status: 404 });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error("[worker/fetch] unhandled:", err);
      return json(
        { ok: false, error: "Worker internal error", detail: message.slice(0, 500) },
        { status: 500 }
      );
    }
  },
};
