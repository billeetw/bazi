/**
 * 各宮章節：用 chartJson 生年四化（mutagenStars）補齊 PalaceRawInput.natalTransforms。
 * 僅供【本命四化】敘事：pickPalaceNatalTransforms 只讀此物件並篩「化星坐在本宮」，不用宮干飛入邊。
 */

import type { PalaceRawInput } from "./palaceNarrativeTypes.js";

function readMutagen(m: Record<string, string>, zh: string, en: string): string {
  const v = m[zh] ?? m[en];
  return typeof v === "string" ? v.trim() : "";
}

/** 將生年四化填入 raw.natalTransforms（全宮位共用） */
export function enrichPalaceRawWithBenmingMutagen(
  raw: PalaceRawInput,
  chartJson: Record<string, unknown> | undefined
): PalaceRawInput {
  if (!chartJson || typeof chartJson !== "object") return raw;

  const ft = chartJson.fourTransformations as { benming?: { mutagenStars?: Record<string, string> } } | undefined;
  const m = ft?.benming?.mutagenStars;
  if (!m || typeof m !== "object") return raw;

  const nt: NonNullable<PalaceRawInput["natalTransforms"]> = { ...raw.natalTransforms };

  const lu = readMutagen(m, "祿", "lu");
  const quan = readMutagen(m, "權", "quan");
  const ke = readMutagen(m, "科", "ke");
  const ji = readMutagen(m, "忌", "ji");

  if (lu) nt.祿 = lu;
  if (quan) nt.權 = quan;
  if (ke) nt.科 = ke;
  if (ji) nt.忌 = ji;

  const hasNt = nt.祿 || nt.權 || nt.科 || nt.忌;
  if (!hasNt) return raw;

  return { ...raw, natalTransforms: nt };
}

/** @deprecated 使用 enrichPalaceRawWithBenmingMutagen */
export const enrichMingPalaceRawWithBenming = enrichPalaceRawWithBenmingMutagen;
