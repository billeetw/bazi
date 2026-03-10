/**
 * 載入 engine 資料庫（靜態 import 供 bundler 打包）
 */

import { star_consultation_dictionary } from "../../data/star_consultation_dictionary.js";
import type { PalaceCausalityRow, TransformZh } from "./types.js";

// 靜態 import JSON（需 tsconfig resolveJsonModule；路徑相對於本檔）
import palaceTransformData from "../../data/palace_transform_dictionary.zh-TW.json";
import palaceCausalityData from "../../data/palace_causality_matrix.zh-TW.json";
import palaceConsultationData from "../../data/palace_consultation_dictionary.zh-TW.json";
import starTransformData from "../../data/star_transform_dictionary.zh-TW.json";

export { star_consultation_dictionary };

export type PalaceTransformRow = { palace: string; transform: string; meaning: string; advice: string };
export type StarTransformRow = { star: string; transform: string; meaning: string; counsel: string; do: string; dont: string };
export type PalaceConsultationRow = { palace: string; domain: string[]; description: string };

const _palaceTransform = palaceTransformData as PalaceTransformRow[];
const _palaceCausality = palaceCausalityData as PalaceCausalityRow[];
const _palaceConsultation = palaceConsultationData as PalaceConsultationRow[];
const _starTransform = starTransformData as StarTransformRow[];

export function getPalaceTransformDictionary(): PalaceTransformRow[] {
  return _palaceTransform;
}

export function getPalaceCausalityMatrix(): PalaceCausalityRow[] {
  return _palaceCausality;
}

export function getPalaceConsultationDictionary(): PalaceConsultationRow[] {
  return _palaceConsultation;
}

export function getStarTransformDictionary(): StarTransformRow[] {
  return _starTransform;
}

/** 查因果矩陣；(from, to, transform) 命中回傳該筆 */
export function lookupCausality(
  matrix: PalaceCausalityRow[],
  from: string,
  to: string,
  transform: TransformZh
): PalaceCausalityRow | undefined {
  return matrix.find(
    (r) => r.fromPalace === from && r.toPalace === to && r.transform === transform
  );
}
