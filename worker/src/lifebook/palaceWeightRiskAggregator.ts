/**
 * 宮位級權重與風險聚合：依 base_weight + 亮度選出主敘事星（1–2 顆），其餘為 supportStars；
 * 依 Effective_Risk 公式算出 totalRisk 與 riskLevel（1～5），供 narrative engine 語氣切換。
 * 公式見 docs/lifebook-narrative-engine.md
 */

export interface StarMetadataRecord {
  name_zh: string;
  category: string;
  base_weight: number;
  base_risk: number;
}

export interface StarMetadataInput {
  starNameZhToId: Record<string, string>;
  stars: Record<string, StarMetadataRecord>;
}

export interface PalaceStarInput {
  name: string;
  strength?: string;
}

/** 亮度 → 分數（tie-breaker）。與文件一致。 */
const BRIGHTNESS_SCORE: Record<string, number> = {
  廟: 2,
  旺: 1.5,
  利: 1,
  得: 1,
  平: 0,
  陷: -1.5,
};

function getBrightnessScore(strength: string | undefined): number {
  if (!strength || typeof strength !== "string") return 0;
  const s = strength.trim();
  for (const [k, v] of Object.entries(BRIGHTNESS_SCORE)) {
    if (s.includes(k)) return v;
  }
  return 0;
}

/**
 * Effective_Risk(star, palace) = clamp(1, 5, base_risk(star) + palace_offset)
 * palace_offset = (starPalacesAuxRisk["星名_宮位"] - base_risk) when key exists, else 0.
 * 即：有宮位風險時用宮位值，無則用 base_risk。
 */
export function effectiveRisk(
  baseRisk: number,
  palaceRiskFromAux: number | undefined
): number {
  if (palaceRiskFromAux === undefined || palaceRiskFromAux === null) {
    return Math.max(1, Math.min(5, baseRisk));
  }
  const palaceOffset = palaceRiskFromAux - baseRisk;
  return Math.max(1, Math.min(5, Math.round(baseRisk + palaceOffset)));
}

export interface PalaceAggregatorResult {
  mainStars: PalaceStarInput[];
  supportStars: PalaceStarInput[];
  totalRisk: number;
  riskLevel: number;
}

/**
 * 宮位聚合：輸入該宮星曜列表、宮位 key、metadata、AuxRisk，輸出 mainStars（1–2）、supportStars、totalRisk、riskLevel。
 * mainStars 依 WeightScore = base_weight + (brightness_score * 2) 排序取前 1–2。
 * totalRisk = 各星 effective_risk 依 base_weight 加權平均，再 clamp 1–5；riskLevel = round(totalRisk)。
 */
export function aggregatePalaceWeightRisk(
  palaceStars: PalaceStarInput[],
  palaceKey: string,
  metadata: StarMetadataInput,
  auxRisk: Record<string, number> | undefined
): PalaceAggregatorResult {
  const palaceShort = palaceKey.replace(/宮$/, "") === "命" ? "命宮" : palaceKey.replace(/宮$/, "");
  const mapping = metadata.starNameZhToId;
  const starsMeta = metadata.stars;

  interface Scored {
    star: PalaceStarInput;
    starId: string;
    baseWeight: number;
    baseRisk: number;
    effectiveRisk: number;
    weightScore: number;
  }

  const scored: Scored[] = [];
  for (const star of palaceStars) {
    const starId = mapping[star.name];
    if (!starId || !starsMeta[starId]) continue;
    const rec = starsMeta[starId];
    const baseRisk = Math.max(1, Math.min(5, rec.base_risk));
    const palaceR = auxRisk?.[`${star.name}_${palaceShort}`];
    const effRisk = effectiveRisk(baseRisk, palaceR);
    const brightnessScore = getBrightnessScore(star.strength);
    const weightScore = rec.base_weight + brightnessScore * 2;
    scored.push({
      star,
      starId,
      baseWeight: rec.base_weight,
      baseRisk,
      effectiveRisk: effRisk,
      weightScore,
    });
  }

  scored.sort((a, b) => b.weightScore - a.weightScore);

  const mainStars = scored.slice(0, 2).map((s) => s.star);
  const supportStars = scored.slice(2).map((s) => s.star);

  let totalRisk: number;
  if (scored.length === 0) {
    totalRisk = 1;
  } else {
    const sumW = scored.reduce((acc, s) => acc + s.baseWeight, 0);
    const sumWR = scored.reduce((acc, s) => acc + s.effectiveRisk * s.baseWeight, 0);
    totalRisk = sumW > 0 ? sumWR / sumW : 1;
  }
  totalRisk = Math.max(1, Math.min(5, totalRisk));
  const riskLevel = Math.max(1, Math.min(5, Math.round(totalRisk)));

  return {
    mainStars,
    supportStars,
    totalRisk,
    riskLevel,
  };
}
