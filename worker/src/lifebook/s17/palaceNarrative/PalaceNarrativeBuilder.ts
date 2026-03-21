/**
 * 逐宮讀者敘事：由 PalaceRawInput 組出 PalaceNarrativeInput（權重分段、本命四化等）。
 * 目錄在 s17/ 下為歷史結構；勿與命書章節 s17「疊宮分析」混稱。
 */
import { resolveLeadMainStar } from "../../engines/palaceInference/leadMainStarResolver.js";
import { getPalaceSemantic, getStarSemantic } from "../../starSemanticDictionary.js";
import type { NormalizedChart } from "../../normalizedChart.js";
import { buildWeightedPalaceContext } from "../weights/parser.js";
import { DEFAULT_DRIVE_THRESHOLD } from "../weights/config.js";
import {
  palaceStructureToPalaceRawInput,
  type PalaceNarrativeInput,
  type PalaceNatalTransform,
  type PalaceRawInput,
  type PalaceNarrativeTone,
} from "./palaceNarrativeTypes.js";
import { buildTransformNarrative, sortTransformsForPalace } from "./transformNarrativeEngine.js";
import { defaultSanfangRelatedNote, getPalaceNarrativeCopy } from "./palaceNarrativeCopy.js";
import { getMingProfile } from "./mingProfiles.js";
import { getMiscPhenomenaLongMap } from "./palaceMiscPhenomena.js";
import { PALACE_SEGMENT_SCHEMA } from "./weightedPalaceSchemas.js";
import { getCareerProfile } from "./careerProfiles.js";
import {
  formatCareerForbiddenHuman,
  formatCareerPhenomenonHuman,
  formatCareerPitfallForbiddenOnly,
} from "./segmentHumanTone.js";
import { getWealthProfile } from "./wealthPalaceProfiles.js";
import { getTianZhaiProfile } from "./tianZhaiPalaceProfiles.js";
import { getTransformSemantic } from "../../narrativeFacade.js";
import { normalizeNarrativePunctuation } from "./narrativePunctuation.js";
import { buildReaderPremiumPayload } from "./palaceReaderPremium.js";
import {
  applyBehaviorAxisLayersToPalaceNarrative,
  anyBehaviorAxisFlagEnabled,
  type BehaviorAxisFeatureFlags,
} from "./behaviorAxisV1.js";

export { normalizeNarrativePunctuation } from "./narrativePunctuation.js";
export type { BehaviorAxisFeatureFlags } from "./behaviorAxisV1.js";

/** 選用：命宮地支、三個獨立 flag、窄開啟／全宮 */
export type BuildPalaceNarrativeInputOptions = {
  mingSoulBranch?: string;
  behaviorAxisFlags?: Partial<BehaviorAxisFeatureFlags>;
  /** 若 true，12 宮皆套用；若 false/undefined，僅四宮（命／福／財／夫） */
  behaviorAxisWideOpen?: boolean;
};

/** 12 宮皆組 reader premium（無宮內星可解時 buildReaderPremiumPayload 回 null，走一般段落） */
const READER_PREMIUM_PALACES = new Set([
  "命宮",
  "兄弟宮",
  "夫妻宮",
  "子女宮",
  "財帛宮",
  "疾厄宮",
  "遷移宮",
  "僕役宮",
  "官祿宮",
  "田宅宮",
  "福德宮",
  "父母宮",
]);

const MINOR_MODIFIER_MAP: Record<string, string> = {
  文昌: "你做決定時會偏向先整理資訊與規則，確認結構後再動。",
  台輔: "你重視把日常系統補齊，讓生活可被長期維持。",
};

function normalizeBrightness(v: "廟" | "旺" | "得" | "平" | "陷" | undefined): "廟" | "旺" | "利" | "平" | "陷" | undefined {
  if (v === "得") return "利";
  return v;
}

function toneFromRaw(raw: PalaceRawInput, leadStars: string[]): PalaceNarrativeTone {
  const b = raw.brightness ?? {};
  const leadBrightness = leadStars.map((s) => normalizeBrightness(b[s]));
  if (leadBrightness.some((x) => x === "陷")) return "risk";
  if (leadBrightness.some((x) => x === "廟" || x === "旺" || x === "利")) {
    const hasMinorRisk = raw.minorStars.some((s) => normalizeBrightness(b[s]) === "陷");
    return hasMinorRisk ? "neutral" : "positive";
  }
  return "neutral";
}

function buildRelatedPalacesNote(
  palace: string,
  relatedPalaces: string[] | undefined,
  fixedNote?: string
): string | undefined {
  if (fixedNote) return fixedNote;
  if (!relatedPalaces || relatedPalaces.length <= 1) return undefined;
  const others = relatedPalaces.filter((p) => p && p !== palace);
  if (!others.length) return undefined;
  return `這一宮會和${others.join("、")}互相牽動。`;
}

function resolveRelatedPalacesNote(
  palaceCanon: string,
  relatedPalaces: string[] | undefined,
  copyNote?: string
): string {
  if (copyNote) return copyNote;
  const fromRaw = buildRelatedPalacesNote(palaceCanon, relatedPalaces, undefined);
  if (fromRaw) return fromRaw;
  return defaultSanfangRelatedNote(palaceCanon);
}

/** 實際坐在本宮的星曜（主＋輔＋雜），用於篩選本命四化：只顯示「化星在本宮」的條目 */
function starsPhysicallyInPalace(raw: PalaceRawInput): Set<string> {
  return new Set(
    [...raw.mainStars, ...raw.minorStars, ...raw.miscStars].map((s) => (s ?? "").trim()).filter(Boolean)
  );
}

/**
 * 本命四化（讀者版）：**只**用 raw.natalTransforms（生年 mutagen，由 enrichPalaceRawWithBenmingMutagen 補齊）。
 * 不用宮干飛入／飛出邊，避免與「生年四化」語意混淆。
 * 只保留「化星有坐在本宮」的條目。
 */
function pickPalaceNatalTransforms(raw: PalaceRawInput): PalaceNatalTransform[] {
  const max = raw.palace === "命宮" ? 4 : 2;
  const inPalace = starsPhysicallyInPalace(raw);

  const pool: PalaceNatalTransform[] = [];
  const nt = raw.natalTransforms;
  if (nt) {
    if (nt.祿) pool.push({ star: nt.祿.trim(), transform: "祿", direction: "in" });
    if (nt.權) pool.push({ star: nt.權.trim(), transform: "權", direction: "in" });
    if (nt.科) pool.push({ star: nt.科.trim(), transform: "科", direction: "in" });
    if (nt.忌) pool.push({ star: nt.忌.trim(), transform: "忌", direction: "in" });
  }
  const byKey = new Map<string, PalaceNatalTransform>();
  for (const p of pool) {
    const k = `${p.star}_${p.transform}`;
    if (!byKey.has(k)) byKey.set(k, p);
  }
  const uniq = [...byKey.values()];
  const orderKeys = sortTransformsForPalace(uniq.map(({ star, transform }) => ({ star, transform }))).map(
    ({ star, transform }) => `${star}_${transform}`
  );
  const ordered: PalaceNatalTransform[] = [];
  for (const k of orderKeys) {
    const hit = byKey.get(k);
    if (hit) ordered.push(hit);
  }
  const filtered = ordered.filter((t) => inPalace.has(t.star));
  return filtered.slice(0, max);
}

/**
 * 本命四化敘事：與模組二同源——先走 getTransformSemantic（星×宮×四化矩陣 → 四化×宮 → 通用），
 * 皆無命中再用 buildTransformNarrative 模板句。
 */
function buildNatalTransformNarrativeLine(raw: PalaceRawInput, star: string, transform: "祿" | "權" | "科" | "忌"): string {
  const block = getTransformSemantic(transform, star, raw.palace);
  const meaning = block.meaning?.trim();
  if (meaning) {
    const advice = block.advice?.trim();
    if (advice && advice.length > 0 && !meaning.includes(advice)) {
      return `${meaning} ${advice}`;
    }
    return meaning;
  }
  return buildTransformNarrative({ star, transform, palace: raw.palace });
}

function buildNatalTransformItems(raw: PalaceRawInput) {
  return pickPalaceNatalTransforms(raw).map((t) => ({
    label: `${t.star}化${t.transform}`,
    narrative: buildNatalTransformNarrativeLine(raw, t.star, t.transform),
  }));
}

function buildCoreThemes(raw: PalaceRawInput, lead: string, coLeads: string[]): string[] {
  const ordered = [lead, ...coLeads].filter(Boolean).slice(0, 2);
  if (raw.palace === "命宮") {
    const has = (a: string, b: string) => ordered.includes(a) && ordered.includes(b);
    if (has("紫微", "天府")) return ["主軸感", "穩定結構", "長期佈局"];
    if (has("紫微", "七殺")) return ["主導感", "破局能力", "強烈自我驅動"];
    if (has("天機", "太陰")) return ["思考內化", "感受導向", "策略型人格"];
    if (has("廉貞", "貪狼")) return ["欲望驅動", "探索性強", "容易拉扯"];
    if (has("武曲", "天相")) return ["現實決策", "資源管理", "結構導向"];
  }
  if (raw.palace === "田宅宮" && ordered.includes("武曲") && ordered.includes("天相")) {
    return ["資源配置與長期回報", "秩序與結構的穩定性", "可持續的安全感"];
  }
  const fromStars = ordered
    .map((star) => getStarSemantic(star)?.themes?.[0])
    .filter((x): x is string => Boolean(x));
  const palaceTheme = getPalaceSemantic(raw.palace)?.short ?? getPalaceSemantic(raw.palace)?.core;
  return [...new Set([...fromStars, ...(palaceTheme ? [palaceTheme] : [])])].slice(0, 3);
}

type LayerKey = "core" | "decision" | "phenomenon" | "pitfall";

/**
 * 無主星：權重只用「輔／雜」位階，避免資料異常把星標成主星而放大 core。
 * 有主星時等於原 raw。
 */
function weightsRaw(raw: PalaceRawInput): PalaceRawInput {
  if (raw.mainStars.length === 0) return { ...raw, mainStars: [] };
  return raw;
}

function topWeightedStars(raw: PalaceRawInput, layer: LayerKey, max: number): string[] {
  const ctx = buildWeightedPalaceContext(raw);
  return ctx.stars
    .filter((s) => (s.finalScores[layer] ?? 0) >= DEFAULT_DRIVE_THRESHOLD)
    .sort((a, b) => (b.finalScores[layer] ?? 0) - (a.finalScores[layer] ?? 0))
    .slice(0, max)
    .map((s) => s.star);
}

/** 官祿決策段：主星最多 2 + 輔／雜最多 2，仍依權重門檻 */
function pickGuanluDecisionStars(raw: PalaceRawInput): string[] {
  const w = weightsRaw(raw);
  const ctx = buildWeightedPalaceContext(w);
  const t = DEFAULT_DRIVE_THRESHOLD;
  const dec = (x: (typeof ctx.stars)[0]) => x.finalScores.decision ?? 0;
  const mains = ctx.stars
    .filter((x) => x.starClass === "main" && dec(x) >= t)
    .sort((a, b) => dec(b) - dec(a))
    .slice(0, 2)
    .map((x) => x.star);
  const aux = ctx.stars
    .filter((x) => x.starClass !== "main" && dec(x) >= t)
    .sort((a, b) => dec(b) - dec(a))
    .slice(0, 2)
    .map((x) => x.star);
  let out = [...new Set([...mains, ...aux])].slice(0, 4);
  if (out.length === 0 && raw.mainStars.length) {
    out = raw.mainStars.filter(Boolean).slice(0, 2);
  }
  if (out.length === 0) {
    const pool = [...raw.miscStars, ...raw.minorStars, ...raw.mainStars].map((s) => (s ?? "").trim()).filter(Boolean);
    out = [...new Set(pool)].slice(0, 4);
  }
  return out;
}

/** 官祿現象段：先帶入輔／雜曜現場感，再補主星，上限 6 */
function pickGuanluPhenomenonStars(raw: PalaceRawInput, max: number): string[] {
  const w = weightsRaw(raw);
  const ctx = buildWeightedPalaceContext(w);
  const t = DEFAULT_DRIVE_THRESHOLD;
  const ph = (x: (typeof ctx.stars)[0]) => x.finalScores.phenomenon ?? 0;
  const passing = ctx.stars.filter((x) => ph(x) >= t).sort((a, b) => ph(b) - ph(a));
  const auxFirst = passing.filter((x) => x.starClass !== "main").slice(0, 3).map((x) => x.star);
  const mains = passing.filter((x) => x.starClass === "main").slice(0, 2).map((x) => x.star);
  let out = [...new Set([...auxFirst, ...mains])];
  if (out.length < 3) {
    for (const x of passing) {
      if (out.length >= max) break;
      if (!out.includes(x.star)) out.push(x.star);
    }
  }
  if (out.length === 0) {
    const pool = [...raw.miscStars, ...raw.minorStars, ...raw.mainStars].map((s) => (s ?? "").trim()).filter(Boolean);
    out = [...new Set(pool)].slice(0, max);
  }
  return out.slice(0, max);
}

function renderSegmentCore(palace: string, stars: string[]): string {
  const schema = PALACE_SEGMENT_SCHEMA[palace];
  if (!schema || stars.length === 0) return "";
  return `你的核心主軸是「${schema.coreFocus}」，目前由${stars.join("、")}共同定調。`;
}

/** 命宮權重摘要：用人格運作句，避免輸出架構文件式的 coreFocus 分類句 */
function renderMingStructuralSummary(coreStars: string[]): string {
  const parts: string[] = [];
  for (const s of coreStars.slice(0, 2)) {
    const p = getMingProfile(s);
    if (p?.core) parts.push(p.core);
  }
  if (parts.length === 0) return renderSegmentCore("命宮", coreStars);
  const join = parts.join(" ");
  return normalizeNarrativePunctuation(
    `${join}這條線，現在主要由${coreStars.join("、")}帶著你走。`
  );
}

function renderSegmentDecision(palace: string, star: string): string {
  if (palace === "命宮") {
    const mp = getMingProfile(star);
    if (mp?.decision) return mp.decision;
  }
  if (palace === "官祿宮") {
    const p = getCareerProfile(star);
    if (p) {
      const [a, b] = p.forbiddenDecisions;
      return `「${star}」較適合往「${p.careerFit}」累積舞台。${formatCareerForbiddenHuman(star, a, b)}`;
    }
  }
  if (palace === "財帛宮") {
    return caiDecisionLine(star);
  }
  if (palace === "田宅宮") {
    return tianZhaiDecisionLine(star);
  }
  const schema = PALACE_SEGMENT_SCHEMA[palace];
  const sem = getStarSemantic(star);
  const plain = sem?.plain ?? `${star}相關判斷`;
  if (!schema) return `做決策時，容易優先採用「${plain}」這條邏輯。`;
  return `做決策時，會把重心放在「${schema.decisionFocus}」；其中「${star}」讓你更傾向「${plain}」。`;
}

/** 嵌入句中片段時先去掉末尾句號，避免組句後出現「。。」 */
function stripTrailingSentencePunct(s: string): string {
  return (s ?? "").trim().replace(/[。．.]+$/u, "").trim();
}

function phenomenonStarClause(palace: string, star: string): string {
  if (palace === "官祿宮") return renderSegmentPhenomenon(palace, star);
  if (palace === "財帛宮") return caiPhenomenonLine(star);
  if (palace === "田宅宮") return tianZhaiPhenomenonBullet(star);
  const sem = getStarSemantic(star);
  const risk = stripTrailingSentencePunct(sem?.risk ?? "節奏波動與摩擦");
  return normalizeNarrativePunctuation(`「${star}」常表現在${risk}。`);
}

function pitfallStarClause(palace: string, star: string): string {
  if (palace === "官祿宮") return renderSegmentPitfall(palace, star);
  if (palace === "財帛宮") return caiPitfallLine(star);
  if (palace === "田宅宮") return tianZhaiPitfallBullet(star);
  const sem = getStarSemantic(star);
  const risk = stripTrailingSentencePunct(sem?.risk ?? "過度拉扯與反覆");
  return normalizeNarrativePunctuation(`「${star}」會放大${risk}。`);
}

/** 田宅「真實運作」分條：避免每顆星重複「實際居住與房產議題上…」 */
function tianZhaiPhenomenonBullet(star: string): string {
  const p = getTianZhaiProfile(star);
  if (p) return normalizeNarrativePunctuation(`「${star}」：${p.phenomenon}`);
  const sem = getStarSemantic(star);
  const risk = stripTrailingSentencePunct(sem?.risk ?? "居住節奏與壓力波動");
  return normalizeNarrativePunctuation(`「${star}」常表現在${risk}。`);
}

/** 田宅「坑」分條：總述已帶「重大買賣…」，此處刪重 */
function tianZhaiPitfallBullet(star: string): string {
  const p = getTianZhaiProfile(star);
  if (p) {
    let body = p.pitfall.trim();
    body = body.replace(/，重大買賣宜放慢核對產權與現金流。?$/, "。");
    body = body.replace(/重大買賣宜放慢核對產權與現金流。?$/, "");
    return normalizeNarrativePunctuation(`「${star}」：${body}`);
  }
  const sem = getStarSemantic(star);
  const risk = stripTrailingSentencePunct(sem?.risk ?? "根基與安全感拉扯");
  return normalizeNarrativePunctuation(`「${star}」易放大${risk}。`);
}

function composePhenomenaLines(palace: string, stars: string[]): string[] {
  if (stars.length === 0) return [];
  if (palace === "官祿宮") return stars.map((s) => normalizeNarrativePunctuation(renderSegmentPhenomenon(palace, s)));
  if (palace === "財帛宮") return stars.map((s) => normalizeNarrativePunctuation(caiPhenomenonLine(s)));
  if (palace === "田宅宮") {
    if (stars.length === 1) return [normalizeNarrativePunctuation(tianZhaiPhenomenonLine(stars[0]))];
    const intro = "在居住與房產議題上，各星曜的現場感如下：";
    return [intro, ...stars.map((s) => phenomenonStarClause(palace, s))];
  }
  const schema = PALACE_SEGMENT_SCHEMA[palace];
  if (!schema) return stars.map((s) => normalizeNarrativePunctuation(renderSegmentPhenomenon(palace, s)));
  if (stars.length === 1) return [normalizeNarrativePunctuation(renderSegmentPhenomenon(palace, stars[0]))];
  /* 與單星全句開頭用語一致，且只出現一次（分條只留「星 × risk」短句） */
  const intro = `日常運作中，重點會落在「${schema.phenomenonFocus}」。`;
  return [intro, ...stars.map((s) => phenomenonStarClause(palace, s))];
}

function composePitfallLines(palace: string, stars: string[]): string[] {
  if (stars.length === 0) return [];
  if (palace === "官祿宮") return stars.map((s) => normalizeNarrativePunctuation(renderSegmentPitfall(palace, s)));
  if (palace === "財帛宮") return stars.map((s) => normalizeNarrativePunctuation(caiPitfallLine(s)));
  if (palace === "命宮") {
    if (stars.length === 1) {
      const p = getMingProfile(stars[0]);
      const body = p?.pitfall?.trim();
      if (body) return [normalizeNarrativePunctuation(body)];
    }
    if (stars.length > 1) {
      const intro =
        "你最大的風險往往不是做錯判斷，而是心裡一不安，就先把自己的觸角收回——前景未必不行，只是你更不敢在沒站穩時伸手。";
      return [intro, ...stars.map((s) => pitfallStarClause(palace, s))];
    }
  }
  if (palace === "田宅宮") {
    if (stars.length === 1) return [normalizeNarrativePunctuation(tianZhaiPitfallLine(stars[0]))];
    const schema = PALACE_SEGMENT_SCHEMA[palace];
    const intro = schema
      ? `最常見的坑，是「${schema.pitfallFocus}」；重大買賣宜放慢核對產權與現金流。以下星曜特別容易踩雷：`
      : "田宅重大買賣宜放慢核對產權與現金流。以下星曜特別容易踩雷：";
    return [intro, ...stars.map((s) => pitfallStarClause(palace, s))];
  }
  const schema = PALACE_SEGMENT_SCHEMA[palace];
  if (!schema) return stars.map((s) => normalizeNarrativePunctuation(renderSegmentPitfall(palace, s)));
  if (stars.length === 1) return [normalizeNarrativePunctuation(renderSegmentPitfall(palace, stars[0]))];
  const intro = `最常見的坑，是「${schema.pitfallFocus}」。其中：`;
  return [intro, ...stars.map((s) => pitfallStarClause(palace, s))];
}

function renderSegmentPhenomenon(palace: string, star: string): string {
  if (palace === "官祿宮") {
    const p = getCareerProfile(star);
    if (p) {
      const semRisk = getStarSemantic(star)?.risk;
      return formatCareerPhenomenonHuman(star, p.riskAlert, semRisk);
    }
  }
  if (palace === "財帛宮") {
    return caiPhenomenonLine(star);
  }
  if (palace === "田宅宮") {
    return tianZhaiPhenomenonLine(star);
  }
  const schema = PALACE_SEGMENT_SCHEMA[palace];
  const sem = getStarSemantic(star);
  const risk = stripTrailingSentencePunct(sem?.risk ?? "節奏波動與摩擦");
  if (!schema) return `「${star}」常表現在${risk}。`;
  return `日常運作中，重點會落在「${schema.phenomenonFocus}」；「${star}」常表現在${risk}。`;
}

function renderSegmentPitfall(palace: string, star: string): string {
  if (palace === "官祿宮") {
    const p = getCareerProfile(star);
    if (p) {
      const [a, b] = p.forbiddenDecisions;
      return formatCareerPitfallForbiddenOnly(star, a, b);
    }
  }
  if (palace === "財帛宮") {
    return caiPitfallLine(star);
  }
  if (palace === "田宅宮") {
    return tianZhaiPitfallLine(star);
  }
  const schema = PALACE_SEGMENT_SCHEMA[palace];
  const sem = getStarSemantic(star);
  const risk = stripTrailingSentencePunct(sem?.risk ?? "過度拉扯與反覆");
  if (!schema) return `要留意「${star}」帶出的${risk}。`;
  return `最常見的坑，是「${schema.pitfallFocus}」；其中「${star}」會放大${risk}。`;
}

function tianZhaiDecisionLine(star: string): string {
  const p = getTianZhaiProfile(star);
  if (p) return p.decision;
  const sem = getStarSemantic(star);
  const plain = sem?.plain ?? `${star}相關議題`;
  return `在居所與資產根基上，會優先考量「${plain}」，再看長期安全與家庭節奏能否承接。`;
}

function tianZhaiPhenomenonLine(star: string): string {
  const p = getTianZhaiProfile(star);
  if (p) return normalizeNarrativePunctuation(p.phenomenon);
  const sem = getStarSemantic(star);
  const risk = stripTrailingSentencePunct(sem?.risk ?? "居住節奏與壓力波動");
  return normalizeNarrativePunctuation(`實際居住與房產議題上，「${star}」常表現在${risk}。`);
}

function tianZhaiPitfallLine(star: string): string {
  const p = getTianZhaiProfile(star);
  if (p) return normalizeNarrativePunctuation(p.pitfall);
  const sem = getStarSemantic(star);
  const risk = stripTrailingSentencePunct(sem?.risk ?? "根基與安全感拉扯");
  return normalizeNarrativePunctuation(`要特別防「${star}」帶出的${risk}，重大買賣宜放慢核對產權與現金流。`);
}

function caiDecisionLine(star: string): string {
  const w = getWealthProfile(star);
  if (w) return w.decision;
  const sem = getStarSemantic(star);
  const plain = sem?.plain ?? `${star}相關議題`;
  return `遇到金錢決策時，會優先走「${plain}」這條路，先看風險承受與現金流能否承接。`;
}

function caiPhenomenonLine(star: string): string {
  const w = getWealthProfile(star);
  if (w) return w.phenomenon;
  const sem = getStarSemantic(star);
  const risk = stripTrailingSentencePunct(sem?.risk ?? "資源進出波動");
  return `實際運作上，「${star}」常表現在${risk}，收入與支出節奏容易出現非線性波動。`;
}

function caiPitfallLine(star: string): string {
  const w = getWealthProfile(star);
  if (w) return w.pitfall;
  const sem = getStarSemantic(star);
  const risk = stripTrailingSentencePunct(sem?.risk ?? "決策摩擦與回報落差");
  return `要特別防「${star}」帶出的${risk}，避免在壓力下做過大部位或過急調整。`;
}

function buildWeightedNarrativeByLayers(raw: PalaceRawInput): {
  structuralSummary?: string;
  decisionPatterns?: string[];
  phenomena?: string[];
  pitfalls?: string[];
} | null {
  if (!raw.palace) return null;
  const schema = PALACE_SEGMENT_SCHEMA[raw.palace];
  if (!schema) return null;

  const w = weightsRaw(raw);
  const noMain = raw.mainStars.length === 0;
  const coreMax = noMain ? 3 : 2;
  const decisionMax = noMain ? 3 : 2;
  const phenomenonMax = 7;
  const pitfallMax = noMain ? 3 : 2;

  let coreStars = topWeightedStars(w, "core", coreMax);
  let decisionStars = topWeightedStars(w, "decision", decisionMax);
  /* phenomenon：雜曜／空劫／動星並陳時名額略放寬 */
  let phenomenonStars = topWeightedStars(w, "phenomenon", phenomenonMax);
  let pitfallStars = topWeightedStars(w, "pitfall", pitfallMax);

  if (raw.palace === "官祿宮") {
    coreStars = topWeightedStars(w, "core", coreMax);
    decisionStars = pickGuanluDecisionStars(raw);
    phenomenonStars = pickGuanluPhenomenonStars(raw, 6);
    pitfallStars = topWeightedStars(w, "pitfall", 3);
    if (pitfallStars.length === 0 && decisionStars.length > 0) {
      pitfallStars = [...new Set(decisionStars)].slice(0, 3);
    }
  }

  // 官祿宮：若權重表缺漏導致四層都選不到星，仍以本宮星曜啟用 careerProfiles／分段敘事（含無主星只剩輔／雜）
  if (
    raw.palace === "官祿宮" &&
    coreStars.length === 0 &&
    decisionStars.length === 0 &&
    phenomenonStars.length === 0 &&
    pitfallStars.length === 0
  ) {
    const pool = [...raw.mainStars, ...raw.minorStars, ...raw.miscStars].map((s) => (s ?? "").trim()).filter(Boolean);
    const uniq = [...new Set(pool)];
    if (uniq.length) {
      coreStars = uniq.slice(0, Math.min(2, uniq.length));
      decisionStars = uniq.slice(0, Math.min(4, uniq.length));
      phenomenonStars = uniq.slice(0, Math.min(6, uniq.length));
      pitfallStars = uniq.slice(0, Math.min(3, uniq.length));
    }
  }

  if (coreStars.length === 0 && decisionStars.length === 0 && phenomenonStars.length === 0 && pitfallStars.length === 0) {
    return null;
  }
  const structuralSummary =
    raw.palace === "命宮" ? renderMingStructuralSummary(coreStars) : renderSegmentCore(raw.palace, coreStars);
  return {
    structuralSummary,
    decisionPatterns: decisionStars.map((s) => renderSegmentDecision(raw.palace, s)),
    phenomena: composePhenomenaLines(raw.palace, phenomenonStars),
    pitfalls: composePitfallLines(raw.palace, pitfallStars),
  };
}

export function buildPalaceNarrativeInput(
  raw: PalaceRawInput,
  options?: BuildPalaceNarrativeInputOptions
): PalaceNarrativeInput {
  const copy = getPalaceNarrativeCopy(raw.palace);
  const resolved = resolveLeadMainStar(raw.mainStars.map((name) => ({ name })));
  const leadMainStar = resolved.leadMainStar ?? raw.mainStars[0];
  const coLeadMainStars = (resolved.coLeadMainStars ?? []).slice(0, 1);
  const leadStars = [leadMainStar, ...coLeadMainStars].filter(Boolean) as string[];

  const coreThemes = buildCoreThemes(raw, leadMainStar, coLeadMainStars);

  const modifiers: string[] = [
    ...raw.minorStars.map((star) => MINOR_MODIFIER_MAP[star]).filter((x): x is string => Boolean(x)),
  ];
  const minorInTrap = raw.minorStars.find(
    (s) => normalizeBrightness(raw.brightness?.[s]) === "陷"
  );
  if (minorInTrap === "文昌") {
    modifiers.push("在細節與規則上容易對自己太嚴格，壓力感會被放大。");
  }

  const miscLong = getMiscPhenomenaLongMap(raw.palace);
  const phenomena = raw.miscStars.map((star) => miscLong[star]).filter((x): x is string => Boolean(x));

  const tone = toneFromRaw(raw, leadStars);

  const decisionPatterns: string[] = copy
    ? [...copy.decisionPatterns]
    : raw.palace === "田宅宮"
      ? [
          "在家庭、房產與生活空間相關的事上，你通常會先看值不值得、能不能長期穩住。",
          "你做決定時會比較重視結構、安排與可控性，而不是只憑一時感覺。",
          "你希望生活是能被管理、被整理、被長期維持的。",
        ]
      : [
          "你會先評估資源與風險，再做選擇。",
          "你傾向用可持續的方式安排生活與責任。",
        ];

  const pitfalls: string[] = copy
    ? [...copy.pitfalls]
    : raw.palace === "田宅宮"
      ? [
          "容易把安全感做成控制感，愈想穩住一切，反而愈累。",
          "容易把生活過成管理專案，顧到效率與秩序，卻忽略了放鬆與感受。",
          "容易為了顧全整體穩定，而默默壓住自己的需求。",
        ]
      : [
          "容易把穩定誤當成不需要調整。",
          "容易為了顧全大局而忽略自己的感受。",
        ];

  const structuralSummary =
    copy?.structuralSummary ??
    (raw.palace === "田宅宮"
      ? "你在生活根基這一塊，會特別重視資源配置、秩序感與可長期維持的安全感。對你來說，家不只是住的地方，更像是一個需要被穩定經營、慢慢累積的基地。"
      : `你在${raw.palace}這一塊，會傾向以結構與可持續性作為判斷基準。`);

  const weightedOverride = buildWeightedNarrativeByLayers(raw);

  const baseReturn: PalaceNarrativeInput = {
    palace: raw.palace,
    coreThemes,
    modifiers,
    phenomena: weightedOverride?.phenomena ?? phenomena,
    tone,
    leadMainStar,
    coLeadMainStars,
    relatedPalacesNote: resolveRelatedPalacesNote(raw.palace, raw.relatedPalaces, copy?.relatedPalacesNote),
    decisionPatterns: weightedOverride?.decisionPatterns ?? decisionPatterns,
    pitfalls: weightedOverride?.pitfalls ?? pitfalls,
    structuralSummary: weightedOverride?.structuralSummary ?? structuralSummary,
    weightedMode: Boolean(weightedOverride),
    natalTransformItems: buildNatalTransformItems(raw),
  };

  if (READER_PREMIUM_PALACES.has(raw.palace)) {
    baseReturn.readerNarrativeIntensity = raw.readerNarrativeIntensity ?? "standard";
    const premium = buildReaderPremiumPayload(raw);
    if (premium) {
      baseReturn.readerPremium = premium;
      if (raw.palace === "命宮") baseReturn.mingNarrativePremium = premium;
    }
    if (raw.readerDisplayName?.trim()) baseReturn.readerDisplayName = raw.readerDisplayName.trim();
  }

  if (options?.mingSoulBranch && anyBehaviorAxisFlagEnabled(options.behaviorAxisFlags)) {
    const ax = applyBehaviorAxisLayersToPalaceNarrative({
      palace: raw.palace,
      mainStars: raw.mainStars,
      decisionPatterns: baseReturn.decisionPatterns,
      pitfalls: baseReturn.pitfalls,
      mingSoulBranch: options.mingSoulBranch,
      flags: options.behaviorAxisFlags ?? {},
      narrowPalacesOnly: !options.behaviorAxisWideOpen,
    });
    baseReturn.decisionPatterns = ax.decisionPatterns;
    baseReturn.pitfalls = ax.pitfalls;
    if (ax.behaviorLoopLine) baseReturn.behaviorLoopLine = ax.behaviorLoopLine;
    if (ax.behaviorAxis) baseReturn.behaviorAxis = ax.behaviorAxis;
    if (ax.behaviorAxisApplied) baseReturn.behaviorAxisApplied = ax.behaviorAxisApplied;
  }

  return baseReturn;
}

/**
 * 由 NormalizedChart 產出 12 宮 PalaceNarrativeInput[]（統一架構：宮位章節改吃 chart.palaces）。
 */
/** 與 LifeBookConfig 同欄位，避免 Builder 反向依賴 lifeBookPrompts */
export type BehaviorAxisLifeBookConfigSlice = {
  behaviorAxisV1?: boolean;
  behaviorAxisConflictV1?: boolean;
  behaviorAxisLoopV1?: boolean;
  behaviorAxisWideOpen?: boolean;
};

export function buildPalaceNarrativeInputsFromChart(
  chart: NormalizedChart,
  options?: { config?: BehaviorAxisLifeBookConfigSlice | null }
): PalaceNarrativeInput[] {
  const palaces = chart.palaces ?? [];
  const cfg = options?.config;
  const behaviorAxisFlags =
    cfg && (cfg.behaviorAxisV1 || cfg.behaviorAxisConflictV1 || cfg.behaviorAxisLoopV1)
      ? {
          behaviorAxisV1: Boolean(cfg.behaviorAxisV1),
          behaviorAxisConflictV1: Boolean(cfg.behaviorAxisConflictV1),
          behaviorAxisLoopV1: Boolean(cfg.behaviorAxisLoopV1),
        }
      : undefined;
  return palaces.map((p) =>
    buildPalaceNarrativeInput(palaceStructureToPalaceRawInput(p), {
      mingSoulBranch: chart.mingSoulBranch,
      behaviorAxisFlags,
      behaviorAxisWideOpen: cfg?.behaviorAxisWideOpen,
    })
  );
}

