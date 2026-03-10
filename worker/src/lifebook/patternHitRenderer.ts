/**
 * Pattern Hits Renderer：將 patternHits 轉成不重複、可引用、有證據的命書文案塊。
 * 模組一：Top 3–5 條；宮位章節：與該宮相關 1–3 條，模組一已出現的 ruleId 用短版。
 */

import type { PatternHit } from "./s00PatternEngine.js";
import type { S00RuleId } from "./s00FourTransformRules.js";
import { getPhraseSet, pickTemplateIndex } from "./patternPhraseLibrary.js";
import {
  getPhraseSetByRuleType,
  mapRuleIdToRuleType,
  evidenceToRuleTypePlaceholders,
} from "./patternPhraseLibraryRuleTypes.js";
import { toPalaceCanonical } from "./canonicalKeys.js";
import { getStarSemanticPhrases, getStarThemesSentenceLead, getPalaceSemantic } from "./starSemanticDictionary.js";
import { findStarPalaceTransformMeaning } from "./starPalaceTransformMatrix.js";

export interface RenderOptions {
  /** 技術版可保留 ruleId/priority；AI 渲染版為 false */
  forTechnicalOutput?: boolean;
  /** 模組一已輸出的 ruleIds，宮位章節對這些只出短版 */
  moduleOneRuleIds?: Set<S00RuleId>;
}

/** 宮名正規化為「XX宮」以便比對（使用 canonical 單一入口） */
function normPalace(p: string): string {
  return toPalaceCanonical(p);
}

/** 從 PatternHit.evidence 推導涉及的宮位（用於 filter 宮位章節） */
export function getPalacesInvolved(hit: PatternHit): string[] {
  const out = new Set<string>();
  const ev = hit.evidence ?? {};
  const push = (v: string | number | string[] | undefined) => {
    if (v === undefined) return;
    if (Array.isArray(v)) v.forEach((x) => { const n = normPalace(String(x)); if (n) out.add(n); });
    else { const n = normPalace(String(v)); if (n) out.add(n); }
  };
  push(ev.palace);
  push(ev.toPalace);
  push(ev.fromPalace);
  push(ev.target);
  push(ev.palaces);
  if (ev.palaceA) push(ev.palaceA);
  if (ev.palaceB) push(ev.palaceB);
  return [...out];
}

/** 從 PatternHit.evidence 推導涉及的星曜 */
export function getStarsInvolved(hit: PatternHit): string[] {
  const out = new Set<string>();
  const ev = hit.evidence ?? {};
  const push = (v: string | number | string[] | undefined) => {
    if (v === undefined) return;
    if (Array.isArray(v)) v.forEach((x) => { const s = String(x).trim(); if (s) out.add(s); });
    else { const s = String(v).trim(); if (s) out.add(s); }
  };
  push(ev.star);
  push(ev.star1);
  push(ev.star2);
  return [...out];
}

function formatEvidenceValue(v: string | number | string[]): string {
  return Array.isArray(v) ? v.join("、") : String(v);
}

const PALACE_KEYS = new Set(["palace", "toPalace", "fromPalace", "palaceA", "palaceB"]);

/** 星×宮橋接句庫（優先於通用模板）；key: "星名|宮名" 如 "天梁|父母宮" */
export const STAR_PALACE_BRIDGE_TEMPLATES: Record<string, string> = {
  "天梁|父母宮":
    "天梁代表保護與責任，而父母宮對應權威與價值框架。當這兩者同時被引動時，你很容易在「該不該承擔」與「能不能放手」之間反覆思考。",
  "天梁|官祿宮":
    "天梁象徵責任與價值判斷，而官祿宮關乎角色與社會位置。當這兩者交會時，你往往會把工作視為一種責任或使命，而不只是單純的職位。",
  "紫微|官祿宮":
    "紫微代表主導與決策，而官祿宮對應事業角色與責任位置。當這兩者同時被點亮時，你往往會被推到需要做決定或承擔方向的位置。",
  "紫微|父母宮":
    "紫微象徵權威與中心角色，而父母宮對應規範與價值來源。當這兩者結合時，你對「誰有決定權」這件事會特別敏感。",
  "天機|子女宮":
    "天機代表思考與策略，而子女宮關乎創造與延伸成果。當這兩者同時被引動時，你往往會用很多想法與方法來優化自己的產出。",
  "天機|田宅宮":
    "天機象徵變化與思考，而田宅宮關乎生活根基與安全感。當這兩者交會時，你很少讓生活環境完全固定，而是會不斷調整與優化。",
  "破軍|遷移宮":
    "破軍代表變革與重新開始，而遷移宮對應外部環境與移動。當這兩者同時被引動時，你的人生很容易透過換環境或改變舞台而產生轉折。",
  "破軍|官祿宮":
    "破軍象徵突破與重建，而官祿宮關乎事業角色。當這兩者結合時，你的職涯往往不會走傳統直線，而是透過幾次重組與轉型前進。",
  "貪狼|僕役宮":
    "貪狼代表機會與社交，而僕役宮對應團隊與人脈系統。當這兩者同時被引動時，很多機會往往來自社交圈與合作關係。",
};

/** 依 evidence 的 star/star1/star2 注入語義 placeholder，供模板使用人話而非直書星名議題 */
function enrichEvidenceWithStarSemantics(ev: Record<string, unknown>): Record<string, string | number | string[]> {
  const out = { ...ev } as Record<string, string | number | string[]>;
  const starKeys = ["star", "star1", "star2"] as const;
  for (const key of starKeys) {
    const raw = ev[key];
    const starName = typeof raw === "string" ? raw : Array.isArray(raw) ? raw[0] : raw != null ? String(raw) : "";
    if (!starName?.trim()) continue;
    const { coreForQuote, themesPhrase, name } = getStarSemanticPhrases(starName);
    const suffix = key === "star" ? "" : key === "star1" ? "1" : "2";
    out[`starCore${suffix}`] = coreForQuote;
    out[`starThemes${suffix}`] = themesPhrase;
    out[`starThemesLead${suffix}`] = getStarThemesSentenceLead(starName);
    if (key === "star") out.star = name;
  }
  return out;
}

function fillPlaceholders(tpl: string, evidence: Record<string, string | number | string[]>): string {
  let out = tpl;
  for (const [k, v] of Object.entries(evidence)) {
    let val = formatEvidenceValue(v);
    if (PALACE_KEYS.has(k) && !val.trim()) val = "該宮";
    out = out.replace(new RegExp(`\\{${k}\\}`, "g"), val);
  }
  out = out.replace(/\{[^}]+\}/g, "").trim();
  return out;
}

/** 單條 hit 的證據一行（優先用 10 ruleType 句庫，否則用 ruleId 句庫） */
function renderEvidenceLine(hit: PatternHit, options: RenderOptions): string {
  const ev = hit.evidence ?? {};
  const ruleType = mapRuleIdToRuleType(hit.ruleId, ev as Record<string, unknown>);
  const ruleTypeSet = ruleType ? getPhraseSetByRuleType(ruleType) : undefined;
  if (ruleTypeSet && ruleTypeSet.evidenceTemplates.length > 0) {
    const idx = pickTemplateIndex(hit.ruleId, ruleTypeSet.evidenceTemplates.length);
    const tpl = ruleTypeSet.evidenceTemplates[idx] ?? ruleTypeSet.evidenceTemplates[0];
    const placeholders = evidenceToRuleTypePlaceholders(ev);
    const filled = fillPlaceholders(tpl, { ...placeholders, evidenceText: "" });
    if (filled) return filled.startsWith("證據：") ? filled : `證據：${filled}`;
  }
  const phraseSet = getPhraseSet(hit.ruleId as S00RuleId);
  const idx = pickTemplateIndex(hit.ruleId, phraseSet.evidenceTemplates.length);
  const tpl = phraseSet.evidenceTemplates[idx] ?? phraseSet.evidenceTemplates[0];
  const evidenceText = Object.entries(ev)
    .map(([k, v]) => (v !== undefined && v !== "" ? `${k}：${formatEvidenceValue(v)}` : ""))
    .filter(Boolean)
    .join("；");
  const filled = fillPlaceholders(tpl, { ...ev, evidenceText: evidenceText || "見上方四化" });
  return filled.startsWith("證據：") ? filled : `證據：${filled}`;
}

/** 單條 hit 完整三行：判讀 + 證據 + 行動（優先 10 ruleType 句庫，否則 ruleId 句庫；短版僅一句+證據） */
function renderOneHit(
  hit: PatternHit,
  shortVersion: boolean,
  options: RenderOptions
): { message: string; evidence: string; action: string; ruleId: string } {
  const ev = hit.evidence ?? {};
  const ruleType = mapRuleIdToRuleType(hit.ruleId, ev as Record<string, unknown>);
  const ruleTypeSet = ruleType ? getPhraseSetByRuleType(ruleType) : undefined;
  const placeholders = evidenceToRuleTypePlaceholders(ev);

  const enriched = enrichEvidenceWithStarSemantics(ev as Record<string, unknown>);
  const mergedPlaceholders = { ...placeholders, ...enriched } as Record<string, string | number | string[]>;

  let message = hit.message;
  let action = hit.action;
  const starForMatrix = [ev.star, ev.star1, ev.star2].map((v) => (v != null && typeof v === "string" ? v.trim() : "")).find(Boolean);
  const palaceForMatrix = [ev.palace, ev.toPalace, ev.fromPalace].map((v) => (v != null && typeof v === "string" ? String(v).trim() : "")).find(Boolean);
  const transformRaw = ev.transform != null ? String(ev.transform).trim() : "";
  const matrixMeaning = starForMatrix && palaceForMatrix && transformRaw
    ? findStarPalaceTransformMeaning(starForMatrix, palaceForMatrix, transformRaw)
    : null;
  if (!shortVersion) {
    if (matrixMeaning) {
      message = matrixMeaning;
    } else if (ruleTypeSet && ruleTypeSet.messageTemplates.length > 0) {
      const msgIdx = pickTemplateIndex(hit.ruleId, ruleTypeSet.messageTemplates.length);
      message = fillPlaceholders(ruleTypeSet.messageTemplates[msgIdx] ?? hit.message, mergedPlaceholders) || hit.message;
    } else {
      const phraseSet = getPhraseSet(hit.ruleId as S00RuleId);
      message = fillPlaceholders(phraseSet.messageTemplates[pickTemplateIndex(hit.ruleId, phraseSet.messageTemplates.length)] ?? hit.message, mergedPlaceholders) || hit.message;
    }
    if (ruleTypeSet && ruleTypeSet.actionTemplates.length > 0) {
      const actIdx = pickTemplateIndex(hit.ruleId + "_act", ruleTypeSet.actionTemplates.length);
      action = fillPlaceholders(ruleTypeSet.actionTemplates[actIdx] ?? hit.action, mergedPlaceholders) || hit.action;
    } else {
      const phraseSet = getPhraseSet(hit.ruleId as S00RuleId);
      action = fillPlaceholders(phraseSet.actionTemplates[pickTemplateIndex(hit.ruleId + "_act", phraseSet.actionTemplates.length)] ?? hit.action, mergedPlaceholders) || hit.action;
    }
  } else {
    message = "本宮也受此結構牽動。";
    action = "";
  }

  // 若未用矩陣語義且同時有星曜與宮位，插入一條星×宮橋接句（優先句庫，否則通用模板）
  const starName = starForMatrix ?? [ev.star, ev.star1, ev.star2].map((v) => (v != null && typeof v === "string" ? v.trim() : "")).find(Boolean);
  const palaceName = palaceForMatrix ?? [ev.palace, ev.toPalace, ev.fromPalace].map((v) => (v != null && typeof v === "string" ? String(v).trim() : "")).find(Boolean);
  if (starName && palaceName && !matrixMeaning) {
    const palaceCanon = normPalace(palaceName);
    const key = `${starName}|${palaceCanon}`;
    const keyAlt = palaceCanon ? `${starName}|${palaceCanon.replace(/宮$/, "")}` : key;
    const templateBridge =
      STAR_PALACE_BRIDGE_TEMPLATES[key] ??
      STAR_PALACE_BRIDGE_TEMPLATES[keyAlt] ??
      (() => {
        const { coreForQuote, name: starDisplay } = getStarSemanticPhrases(starName);
        const palSem = getPalaceSemantic(palaceName);
        const palaceCore = palSem?.core ?? "該領域";
        const combinedInterpretation = "往往代表該領域的資源與課題會同時被引動，值得留意取捨與節奏。";
        return `${starDisplay}代表「${coreForQuote}」，而它所牽動的${palaceName}，對應的是${palaceCore}。當這兩者在同一條四化結構中被同時點亮時，${combinedInterpretation}`;
      })();
    message = templateBridge + "\n" + message;
  }

  const evidence = renderEvidenceLine(hit, options);
  return {
    message,
    evidence,
    action,
    ruleId: hit.ruleId,
  };
}

/** 是否為空值或半句（與 有關、與  等），應跳過不輸出 */
function isInvalidOrEmptyPlaceholderLine(s: string): boolean {
  if (!s || !s.trim()) return true;
  if (/與\s*有關/.test(s)) return true;
  if (/與\s{2,}/.test(s)) return true;
  if (/會與\s*[。，]/.test(s)) return true;
  return false;
}

/** 模組一：Top 3–5 條，每條判讀+證據+行動，去重 ruleId；空 palace/evidence 不輸出 */
export function renderPatternHitsForModuleOne(
  hits: PatternHit[],
  maxItems: number = 5,
  options: RenderOptions = {}
): string {
  const forTech = options.forTechnicalOutput === true;
  const seen = new Set<S00RuleId>();
  const lines: string[] = [];
  for (const hit of hits) {
    if (lines.length >= maxItems * 5) break;
    if (seen.has(hit.ruleId as S00RuleId)) continue;
    const r = renderOneHit(hit, false, options);
    if (isInvalidOrEmptyPlaceholderLine(r.message)) continue;
    seen.add(hit.ruleId as S00RuleId);
    if (lines.length > 0) lines.push("");
    lines.push(r.message, r.evidence, r.action ? r.action : "");
    if (forTech) lines.push(`[${hit.ruleId}]`);
  }
  return lines.filter(Boolean).join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

/** 多宮連動類 ruleId（全盤關聯提示優先取這些） */
const MULTI_PALACE_RULE_IDS = new Set<S00RuleId>([
  "R11_JI_FROM_A_TO_B",
  "R15_LU_CONCENTRATED",
  "R16_JI_DISPERSED",
]);

/** 宮位章節：全盤關聯 = 多宮連動或涉及該宮與他宮 1–2 條；本宮四化 = 該宮相關 1–3 條（不重複）；模組一已出現則短版 */
export function renderPatternHitsForPalace(
  hits: PatternHit[],
  palaceKey: string,
  moduleOneRuleIds: Set<S00RuleId>,
  maxLink: number = 2,
  maxHints: number = 3,
  options: RenderOptions = {}
): { globalLinkBlock: string; siHuaHintsBlock: string } {
  const palaceIdToName = new Map<string, string>([
    ["ming", "命宮"], ["xiongdi", "兄弟宮"], ["fupo", "夫妻宮"], ["ziNv", "子女宮"],
    ["cai", "財帛宮"], ["jiE", "疾厄宮"], ["qianyi", "遷移宮"], ["puyi", "僕役宮"],
    ["guanglu", "官祿宮"], ["tianzhai", "田宅宮"], ["fude", "福德宮"], ["fumu", "父母宮"],
  ]);
  const palaceName = normPalace(palaceKey) || palaceIdToName.get(palaceKey) || palaceKey + "宮";
  const involvesPalace = (hit: PatternHit) => {
    const palaces = getPalacesInvolved(hit);
    return palaces.some((p) => p === palaceName || p.replace(/宮$/, "") === palaceName.replace(/宮$/, ""));
  };
  const isMultiPalace = (hit: PatternHit) => {
    const palaces = getPalacesInvolved(hit);
    return MULTI_PALACE_RULE_IDS.has(hit.ruleId as S00RuleId) || palaces.length >= 2;
  };
  const forTech = options.forTechnicalOutput === true;

  const linkCandidates = hits.filter((h) => involvesPalace(h) && isMultiPalace(h));
  const seenLink = new Set<S00RuleId>();
  const linkLines: string[] = [];
  for (const hit of linkCandidates) {
    if (linkLines.length >= maxLink * 4) break;
    if (seenLink.has(hit.ruleId as S00RuleId)) continue;
    seenLink.add(hit.ruleId as S00RuleId);
    const short = moduleOneRuleIds.has(hit.ruleId as S00RuleId);
    const r = renderOneHit(hit, short, options);
    linkLines.push(r.message, r.evidence, r.action ? r.action : "");
    if (forTech) linkLines.push(`[${hit.ruleId}]`);
  }
  const globalLinkBlock = linkLines.length > 0
    ? "【全盤關聯提示】\n\n" + linkLines.filter(Boolean).join("\n").replace(/\n{3,}/g, "\n\n").trim()
    : "";

  const hintCandidates = hits.filter((h) => involvesPalace(h) && !seenLink.has(h.ruleId as S00RuleId));
  const seenHint = new Set<S00RuleId>();
  const hintLines: string[] = [];
  for (const hit of hintCandidates) {
    if (hintLines.length >= maxHints * 4) break;
    if (seenHint.has(hit.ruleId as S00RuleId)) continue;
    seenHint.add(hit.ruleId as S00RuleId);
    const short = moduleOneRuleIds.has(hit.ruleId as S00RuleId);
    const r = renderOneHit(hit, short, options);
    hintLines.push(r.message, r.evidence, r.action ? r.action : "");
    if (forTech) hintLines.push(`[${hit.ruleId}]`);
  }
  const siHuaHintsBlock = hintLines.length > 0
    ? "【本宮四化提示】\n\n" + hintLines.filter(Boolean).join("\n").replace(/\n{3,}/g, "\n\n").trim()
    : "";

  return { globalLinkBlock, siHuaHintsBlock };
}

/** 取得模組一實際輸出的 ruleIds（供宮位章節短版用） */
export function getModuleOneRuleIds(hits: PatternHit[], maxItems: number = 5): Set<S00RuleId> {
  const set = new Set<S00RuleId>();
  for (const hit of hits) {
    if (set.size >= maxItems) break;
    set.add(hit.ruleId as S00RuleId);
  }
  return set;
}
