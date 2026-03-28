/**
 * 單宮結構分 getPalaceScore（S22/S23 共用，v1）
 * 依 docs/lifebook-s22-s23-spec.md §3、§6
 */

import type { PalaceStructure, StarInPalace, TransformEdge } from "../normalizedChart.js";
import { toPalaceCanonical } from "../normalizedChart.js";
import type { PalaceScoreResult, PalaceScoreVersion } from "./types.js";

const ASSIST_PER_STAR = 0.25;
const ASSIST_CAP = 1.5;
const SHA_PER_STAR = 0.3;
const SHA_CAP = 1.5;
const MAIN_CAP = 2;
/** 空宮策略 A：baseMain 取 0.5–1.0 區間中值 */
const EMPTY_BASE_MAIN = 0.75;

function brightnessPoints(b: StarInPalace["brightness"] | undefined): number {
  switch (b) {
    case "廟":
      return 1.0;
    case "旺":
      return 0.85;
    case "利":
      return 0.7;
    case "平":
      return 0.5;
    case "陷":
      return 0.25;
    case "不":
      return 0.45;
    default:
      return 0.55;
  }
}

function sumMainStarBase(mainStars: StarInPalace[]): number {
  if (mainStars.length === 0) return EMPTY_BASE_MAIN;
  let sum = 0;
  for (const s of mainStars) {
    sum += brightnessPoints(s.brightness);
  }
  return Math.min(sum, MAIN_CAP);
}

function bonusAssistants(assistantStars: StarInPalace[]): number {
  const v = assistantStars.length * ASSIST_PER_STAR;
  return Math.min(v, ASSIST_CAP);
}

function penaltySha(shaStars: StarInPalace[]): number {
  const v = shaStars.length * SHA_PER_STAR;
  return Math.min(v, SHA_CAP);
}

function mutagenNudgeForPalace(palace: PalaceStructure): number {
  const canon = toPalaceCanonical(palace.palace);
  const ins = (palace.natalTransformsIn ?? []).filter(
    (e: TransformEdge) => e.layer === "natal" && toPalaceCanonical(e.toPalace) === canon
  );
  let ji = false;
  let luQuanKe = 0;
  for (const e of ins) {
    if (e.transform === "忌") ji = true;
    if (e.transform === "祿" || e.transform === "權" || e.transform === "科") luQuanKe += 0.25;
  }
  let nudge = 0;
  if (ji) nudge -= 0.5;
  nudge += Math.min(luQuanKe, 0.5);
  return nudge;
}

/**
 * 計算單宮結構分（本命靜態）。
 * @param palace normalize 後的單一宮位
 * @param version 僅支援 "v1"
 */
export function getPalaceScore(
  palace: PalaceStructure,
  version: PalaceScoreVersion = "v1"
): PalaceScoreResult {
  if (version !== "v1") {
    throw new Error(`getPalaceScore: unsupported version ${String(version)}`);
  }

  const isEmptyPalace = (palace.mainStars?.length ?? 0) === 0;
  const baseMain = sumMainStarBase(palace.mainStars ?? []);
  const bonus = bonusAssistants(palace.assistantStars ?? []);
  const pen = penaltySha(palace.shaStars ?? []);
  const mut = mutagenNudgeForPalace(palace);

  const raw = baseMain + bonus - pen + mut;
  const rounded = Math.round(raw);
  const score = Math.min(5, Math.max(1, rounded));

  return {
    score,
    raw,
    scoreVersion: "v1",
    isEmptyPalace,
  };
}
