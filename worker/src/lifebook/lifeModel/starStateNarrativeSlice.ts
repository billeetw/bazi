/**
 * 依既有 SoT（星×宮稿、語義字典、CCL3 心理／壓力／功課、化忌句、亮度）組出 S22/S23 可用敘事欄位。
 * 盤點與欄位契約：docs/lifebook-star-state-sources-sot.md
 */

import type { PalaceStructure } from "../normalizedChart.js";
import { toPalaceCanonical } from "../normalizedChart.js";
import { getStarSemantic } from "../starSemanticDictionary.js";
import { STAR_NAME_ZH_TO_ID } from "../schema.js";
import type { PalaceScoreResult } from "./types.js";

import starPalacesMainPack from "../../../content/starPalacesMain-zh-TW.json";
import starPalacesAuxPack from "../../../content/starPalacesAux-zh-TW.json";
import starBaseCoreZhTw from "../../../content/starBaseCore-zh-TW.json";
import starBaseShadowZhTw from "../../../content/starBaseShadow-zh-TW.json";
import starTransformMeaningsData from "../../../content/starTransformMeanings.json";
import starPsychologyJson from "../../../content/ccl3/star-psychology.json";
import starStressJson from "../../../content/ccl3/star-stress-patterns.json";
import starLifeLessonsJson from "../../../content/ccl3/star-life-lessons.json";

const STAR_PALACES_MAIN =
  (starPalacesMainPack as { starPalacesMain?: Record<string, string> }).starPalacesMain ?? {};
const STAR_LOGIC_MAIN =
  (starPalacesMainPack as { starLogicMain?: Record<string, string> }).starLogicMain ?? {};
const STAR_PALACES_AUX =
  (starPalacesAuxPack as { starPalacesAux?: Record<string, string> }).starPalacesAux ?? {};
const STAR_BASE_CORE = starBaseCoreZhTw as Record<string, string>;
const STAR_BASE_SHADOW = starBaseShadowZhTw as Record<string, string>;
const TRANSFORM_MEANINGS = starTransformMeaningsData as Record<string, { text?: string }>;

type PsychRow = {
  star: string;
  egoCore?: string;
  shadow?: string;
  defenseMechanism?: string;
  growthLesson?: string;
};
type StressRow = {
  star: string;
  patternName?: string;
  innerState?: string;
  outerState?: string;
};
type LessonRow = { star: string; lesson?: string; shadowPattern?: string };

const PSYCH_BY_STAR = new Map<string, PsychRow>();
for (const it of (starPsychologyJson as { items?: PsychRow[] }).items ?? []) {
  if (it?.star) PSYCH_BY_STAR.set(it.star.trim(), it);
}
const STRESS_BY_STAR = new Map<string, StressRow>();
for (const it of (starStressJson as { items?: StressRow[] }).items ?? []) {
  if (it?.star) STRESS_BY_STAR.set(it.star.trim(), it);
}
const LESSON_BY_STAR = new Map<string, LessonRow>();
for (const it of (starLifeLessonsJson as { items?: LessonRow[] }).items ?? []) {
  if (it?.star) LESSON_BY_STAR.set(it.star.trim(), it);
}

export type StarStateNarrativeTone = "穩定敘事" | "提醒敘事" | "高壓敘事" | "中性";

export interface StarStateNarrativeSlice {
  corePattern: string;
  underStress: string;
  blindSpot: string;
  tone: StarStateNarrativeTone;
  punchline: string;
  /** 除錯／對稿：每欄採用的來源 id */
  provenance: {
    corePattern?: string;
    underStress?: string;
    blindSpot?: string;
    punchline?: string;
    tone?: string;
  };
}

function firstSentence(text: string): string {
  const t = (text ?? "").trim();
  if (!t) return "";
  const m = t.match(/^[^。！？]+[。！？]?/);
  return (m ? m[0] : t.split(/[，；]/)[0] ?? t).trim();
}

function toPalaceDisplayName(palaceCanon: string): string {
  const s = (palaceCanon ?? "").trim();
  if (!s) return "此宮";
  return s.endsWith("宮") ? s : `${s}宮`;
}

/** 與 palaceAdapters 一致：多 key 查 starPalacesMain／Aux */
function resolveMeaningInPalace(
  starName: string,
  palaceCanon: string,
  main: Record<string, string>,
  aux: Record<string, string>
): { text: string; key: string; source: "starPalacesMain" | "starPalacesAux" } | null {
  const name = starName.trim();
  if (!name) return null;
  const palaceName = toPalaceDisplayName(palaceCanon);
  const palaceShort = palaceCanon.replace(/宮$/, "").replace(/^宮$/, "");
  const shortForPalace = palaceShort === "命" ? "命宮" : palaceShort;

  const tryKeys = [
    `${name}_${palaceName}`,
    `${name}_${shortForPalace}`,
    `${name}_${palaceCanon}`,
  ];
  for (const k of tryKeys) {
    const t = main[k]?.trim();
    if (t) return { text: t, key: k, source: "starPalacesMain" };
  }
  for (const k of tryKeys) {
    const t = aux[k]?.trim();
    if (t) return { text: t, key: k, source: "starPalacesAux" };
  }
  return null;
}

function hasJiIntoPalace(p: PalaceStructure): boolean {
  const canon = toPalaceCanonical(p.palace);
  return (p.natalTransformsIn ?? []).some(
    (e) =>
      e.layer === "natal" &&
      e.transform === "忌" &&
      toPalaceCanonical(e.toPalace) === canon
  );
}

/** 僅在「有忌訊號」時呼叫：本命坐忌或忌飛入本宮，並對應 starTransformMeanings 的星鍵 */
function jiTransformTextForPalace(p: PalaceStructure): { text: string; key: string } | null {
  const lead = p.mainStars?.[0];
  const leadName = lead?.name?.trim();
  if (lead?.natalTransform === "忌" && leadName) {
    const key = `${leadName}_ji`;
    const text = TRANSFORM_MEANINGS[key]?.text?.trim();
    if (text) return { text, key };
  }
  const canon = toPalaceCanonical(p.palace);
  for (const e of p.natalTransformsIn ?? []) {
    if (e.layer !== "natal" || e.transform !== "忌") continue;
    if (toPalaceCanonical(e.toPalace) !== canon) continue;
    const star = e.starName?.trim();
    if (!star) continue;
    const key = `${star}_ji`;
    const text = TRANSFORM_MEANINGS[key]?.text?.trim();
    if (text) return { text, key };
  }
  return null;
}

function leadStarHasNatalJi(p: PalaceStructure): boolean {
  const m0 = p.mainStars?.[0];
  return m0?.natalTransform === "忌";
}

const BRIGHTNESS_WEAK: Set<string> = new Set(["陷", "不"]);

export function buildStarStateNarrativeSlice(
  palace: PalaceStructure,
  scoreResult: PalaceScoreResult
): StarStateNarrativeSlice {
  const prov: StarStateNarrativeSlice["provenance"] = {};
  const lead = palace.mainStars?.[0];
  const leadName = lead?.name?.trim() ?? "";
  const palaceCanon = palace.palace?.trim() || "命宮";
  const starId = leadName ? (STAR_NAME_ZH_TO_ID as Record<string, string>)[leadName] : "";
  const shaCount = palace.shaStars?.length ?? 0;
  const jiInto = hasJiIntoPalace(palace);
  const leadJi = leadStarHasNatalJi(palace);
  const brightness = lead?.brightness?.trim();
  const weakPalace = scoreResult.isEmptyPalace || scoreResult.score <= 2;
  const strongPalace = scoreResult.score >= 4;

  /* —— corePattern —— */
  let corePattern = "";
  if (leadName) {
    const mp = resolveMeaningInPalace(leadName, palaceCanon, STAR_PALACES_MAIN, STAR_PALACES_AUX);
    if (mp) {
      corePattern = firstSentence(mp.text) || mp.text.slice(0, 80);
      prov.corePattern = `${mp.source}:${mp.key}`;
    }
  }
  if (!corePattern && leadName) {
    const logic = STAR_LOGIC_MAIN[leadName]?.trim();
    if (logic) {
      corePattern = firstSentence(logic) || logic;
      prov.corePattern = `starLogicMain:${leadName}`;
    }
  }
  if (!corePattern && leadName) {
    const sem = getStarSemantic(leadName);
    if (sem) {
      corePattern = sem.plain || sem.core;
      prov.corePattern = "starSemanticDictionary:plain|core";
    }
  }
  if (!corePattern && starId && STAR_BASE_CORE[starId]?.trim()) {
    corePattern = firstSentence(STAR_BASE_CORE[starId]) || STAR_BASE_CORE[starId];
    prov.corePattern = `starBaseCore:${starId}`;
  }
  if (!corePattern) {
    corePattern = scoreResult.isEmptyPalace
      ? "此宮無主星坐守，表現常受對宮與三方四正牽動。"
      : "此宮能量較難單一星曜定調，宜合參整體結構。";
    prov.corePattern = "fallback:empty_or_unknown";
  }

  /* —— blindSpot —— */
  let blindSpot = "";
  const psych = leadName ? PSYCH_BY_STAR.get(leadName) : undefined;
  if (psych?.shadow?.trim()) {
    blindSpot = psych.shadow.trim();
    prov.blindSpot = "star-psychology:shadow";
  } else if (leadName) {
    const les = LESSON_BY_STAR.get(leadName);
    if (les?.shadowPattern?.trim()) {
      blindSpot = les.shadowPattern.trim();
      prov.blindSpot = "star-life-lessons:shadowPattern";
    }
  }
  if (!blindSpot && starId && STAR_BASE_SHADOW[starId]?.trim()) {
    blindSpot = firstSentence(STAR_BASE_SHADOW[starId]) || STAR_BASE_SHADOW[starId];
    prov.blindSpot = `starBaseShadow:${starId}`;
  }
  if (!blindSpot && leadName) {
    const sem = getStarSemantic(leadName);
    if (sem?.risk?.trim()) {
      blindSpot = firstSentence(sem.risk) || sem.risk;
      prov.blindSpot = "starSemanticDictionary:risk";
    }
  }
  if (!blindSpot) {
    blindSpot = "慣性模式在壓力下才會浮上檯面，宜觀察重複卡點而非單次事件。";
    prov.blindSpot = "fallback:generic";
  }

  /* —— underStress —— */
  const stressParts: string[] = [];
  const stressProv: string[] = [];
  if (leadName) {
    const sr = STRESS_BY_STAR.get(leadName);
    if (sr?.innerState || sr?.outerState) {
      const chunk = [sr.innerState, sr.outerState].filter(Boolean).join("；");
      stressParts.push(chunk);
      stressProv.push(`star-stress-patterns:${leadName}`);
    }
  }
  for (const sha of palace.shaStars ?? []) {
    const n = sha.name?.trim();
    if (!n) continue;
    const sr = STRESS_BY_STAR.get(n);
    if (sr?.innerState || sr?.patternName) {
      stressParts.push(sr.outerState ? `${n}：${sr.innerState}（外顯：${sr.outerState}）` : `${n}：${sr.innerState}`);
      stressProv.push(`star-stress-patterns:${n}`);
      break;
    }
  }
  const jiPack = jiTransformTextForPalace(palace);
  if ((jiInto || leadJi) && jiPack) {
    stressParts.push(firstSentence(jiPack.text) || jiPack.text);
    stressProv.push(`starTransformMeanings:${jiPack.key}`);
  } else if (jiInto || leadJi) {
    stressProv.push("transform:ji_signal_no_text");
  }
  if (stressParts.length === 0 && leadName) {
    const sem = getStarSemantic(leadName);
    if (sem?.risk?.trim()) {
      stressParts.push(`壓力下容易出現：${firstSentence(sem.risk)}`);
      stressProv.push("starSemanticDictionary:risk");
    }
  }
  let underStress = stressParts.filter(Boolean).join(" ");
  if (!underStress.trim()) {
    underStress = "壓力升高時，此宮議題容易被放大；宜預留緩衝與停損點。";
    prov.underStress = "fallback:generic";
  } else {
    prov.underStress = stressProv.join(" | ");
  }

  /* —— punchline —— */
  let punchline = "";
  if (leadName) {
    const les = LESSON_BY_STAR.get(leadName);
    if (les?.lesson?.trim()) {
      punchline = les.lesson.trim();
      prov.punchline = "star-life-lessons:lesson";
    }
  }
  if (!punchline && psych?.growthLesson?.trim()) {
    punchline = psych.growthLesson.trim();
    prov.punchline = "star-psychology:growthLesson";
  }
  if (!punchline && jiPack && (jiInto || leadJi)) {
    punchline = firstSentence(jiPack.text) || jiPack.text.slice(0, 60);
    prov.punchline = `starTransformMeanings:${jiPack.key}`;
  }
  if (!punchline && leadName) {
    const sem = getStarSemantic(leadName);
    if (sem?.advice?.trim()) {
      punchline = firstSentence(sem.advice) || sem.advice;
      prov.punchline = "starSemanticDictionary:advice";
    }
  }
  if (!punchline) {
    punchline = "先辨識自己的節奏，再決定要不要加碼。";
    prov.punchline = "fallback:generic";
  }

  /* —— tone —— */
  const brightnessStressed = brightness ? BRIGHTNESS_WEAK.has(brightness) : false;
  let tone: StarStateNarrativeTone = "中性";
  if (weakPalace && (shaCount >= 2 || jiInto || leadJi || brightnessStressed)) {
    tone = "高壓敘事";
  } else if (weakPalace) {
    tone = "提醒敘事";
  } else if (strongPalace && shaCount === 0 && !jiInto && !leadJi) {
    tone = "穩定敘事";
  }
  prov.tone = `rule:weak=${weakPalace},sha=${shaCount},ji=${jiInto || leadJi},bright=${brightness ?? "?"}`;

  return {
    corePattern,
    underStress,
    blindSpot,
    tone,
    punchline,
    provenance: prov,
  };
}
