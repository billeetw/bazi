/**
 * P2: 矩陣未命中時，依主星語義 hints 組 fallback PalacePatternFinding。
 * 只解釋「飛入該宮」的四化 × 主星，不寫飛出／對宮／ compound。
 */

import type { TransformDisplay } from "../../normalizedChart.js";
import type { PalacePatternFinding } from "../../lifebookFindings.js";

export interface MainStarInferenceHint {
  star: string;
  growthMode: string;
  powerMode: string;
  correctionMode: string;
  stressMode: string;
}

function buildLuFallback(
  palace: string,
  mainStar: string,
  hint: MainStarInferenceHint | undefined
): Omit<PalacePatternFinding, "palace" | "mainStar" | "transform" | "source"> {
  const growthMode = hint?.growthMode ?? "此星特質";
  return {
    patternName: `${palace}資源放大型主線`,
    patternType: "growth",
    psychology: `當資源與機會落到${palace}，而此宮由${mainStar}主導時，你會傾向用${growthMode}的方式去放大這個領域。`,
    lifePattern: `${palace}會成為較容易帶來資源、成果或可見成長的場域。`,
    shockLevel: 1,
  };
}

function buildQuanFallback(
  palace: string,
  mainStar: string,
  _hint: MainStarInferenceHint | undefined
): Omit<PalacePatternFinding, "palace" | "mainStar" | "transform" | "source"> {
  return {
    patternName: `${palace}主導承擔型課題`,
    patternType: "power",
    psychology: `當主導與承擔落到${palace}，而此宮由${mainStar}主導時，你會更想掌控、定義或扛起這個領域的節奏。`,
    lifePattern: `${palace}會變成需要表態、負責與拿主意的地方。`,
    shockLevel: 1,
  };
}

function buildKeFallback(
  palace: string,
  mainStar: string,
  _hint: MainStarInferenceHint | undefined
): Omit<PalacePatternFinding, "palace" | "mainStar" | "transform" | "source"> {
  return {
    patternName: `${palace}修正理解型課題`,
    patternType: "correction",
    psychology: `當修正與理解落到${palace}，而此宮由${mainStar}主導時，這個領域會成為你需要重新理解、整理方法與建立秩序的地方。`,
    lifePattern: `${palace}不是單純出事，而是需要被重新看懂與重新安排。`,
    shockLevel: 1,
  };
}

function buildJiFallback(
  palace: string,
  mainStar: string,
  hint: MainStarInferenceHint | undefined
): Omit<PalacePatternFinding, "palace" | "mainStar" | "transform" | "source"> {
  const stressMode = hint?.stressMode ?? "此星壓力模式";
  return {
    patternName: `${palace}壓力顯影型課題`,
    patternType: "pressure",
    psychology: `當壓力與卡點落到${palace}，而此宮由${mainStar}主導時，你會特別用${stressMode}的方式感受到這個領域的拉扯。`,
    lifePattern: `${palace}容易變成這段時間最容易卡住、最需要修正的地方。`,
    shockLevel: 2,
  };
}

export function buildFallbackPatternFinding(opts: {
  palace: string;
  mainStar: string;
  transform: TransformDisplay;
  hint?: MainStarInferenceHint;
}): PalacePatternFinding {
  const { palace, mainStar, transform, hint } = opts;
  const partial =
    transform === "祿"
      ? buildLuFallback(palace, mainStar, hint)
      : transform === "權"
        ? buildQuanFallback(palace, mainStar, hint)
        : transform === "科"
          ? buildKeFallback(palace, mainStar, hint)
          : buildJiFallback(palace, mainStar, hint);
  return {
    palace,
    mainStar,
    transform,
    patternName: partial.patternName,
    patternType: partial.patternType,
    psychology: partial.psychology,
    lifePattern: partial.lifePattern,
    shockLevel: partial.shockLevel,
    source: "fallback",
  };
}
