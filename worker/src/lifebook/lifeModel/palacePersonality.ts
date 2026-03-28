/**
 * 命盤人格層：單宮主星＋強弱 → 行為傾向標籤（敘事用，非算命斷語）
 */

import type { PalaceStructure } from "../normalizedChart.js";
import type { PalaceScoreResult } from "./types.js";

export type PalacePersonalityStyle = "conservative" | "controlling" | "impulsive" | "anxious" | "strategic";

const STYLE_ZH: Record<PalacePersonalityStyle, string> = {
  conservative: "保守型",
  controlling: "控制型",
  impulsive: "衝動型",
  anxious: "焦慮型",
  strategic: "策略型",
};

function starToBaseStyle(starName: string): PalacePersonalityStyle {
  if (/廉貞|武曲/.test(starName)) return "controlling";
  if (/天府|天同|天梁/.test(starName)) return "conservative";
  if (/紫微|天相|太陰/.test(starName)) return "strategic";
  if (/天機|巨門/.test(starName)) return "anxious";
  if (/七殺|破軍|貪狼|太陽/.test(starName)) return "impulsive";
  return "strategic";
}

function palaceBucket(palace: string): "財" | "情" | "業" | "家" | "心" | "外" | "泛" {
  if (/財帛/.test(palace)) return "財";
  if (/福德/.test(palace)) return "心";
  if (/官祿/.test(palace)) return "業";
  if (/夫妻/.test(palace)) return "情";
  if (/子女|田宅/.test(palace)) return "家";
  if (/遷移/.test(palace)) return "外";
  return "泛";
}

function buildPattern(
  style: PalacePersonalityStyle,
  weak: boolean,
  strong: boolean,
  palace: string,
  leadStar: string
): string {
  const bucket = palaceBucket(palace);
  const starHint = leadStar ? `（主星${leadStar}）` : "";

  if (!leadStar && weak) {
    return `這個宮位主星較少${starHint}，很多事要靠自己想辦法應對，力氣容易散在多線並行上。`;
  }

  if (style === "controlling" && weak && bucket === "財") {
    return `你在錢上其實很想掌控，但又缺穩定打底，容易出現「想管，但管不住」。`;
  }
  if (style === "controlling" && weak) {
    return `你對這個領域很想握緊主導權，但底氣不足時，會變成「越想控越慌」。`;
  }
  if (style === "controlling" && strong) {
    return `你習慣把節奏握在手裡；好處是能盯緊，壞處是偶爾太緊、忘了留餘裕。`;
  }

  if (style === "impulsive" && weak) {
    return `容易先衝再做，能量較低時，會變成「做得多、得的少；動很快、收很慢」，長此以往事後補洞很累。`;
  }
  if (style === "impulsive" && strong) {
    return `你靠行動突圍，但要小心把「衝刺」當成唯一模式，忽略續航。`;
  }

  if (style === "anxious" && weak) {
    return `你心裡常先預演風險，底子薄時會放大擔心，變成想很多卻難落地。`;
  }
  if (style === "anxious" && strong) {
    return `你敏銳、能察覺細節；要留意別讓腦內劇本拖住出手時機。`;
  }

  if (style === "conservative" && weak) {
    return `你其實想穩，但現實面還沒形成「可複製的穩」，所以會反覆試、反覆縮。`;
  }
  if (style === "conservative" && strong) {
    return `你偏穩、重安全感；下一步是讓穩定也能帶一點突破，而不是只守成。`;
  }

  /* strategic */
  if (weak) {
    return `你習慣想策略，但盤面支撐還薄時，容易停在「想清楚了再說」，行動被延後。`;
  }
  return `你會佈局、也會算步；記得留一點空間給意外，才不會計畫綁死自己。`;
}

/**
 * 單宮人格標籤與一句行為素描（供 S22／S23 敘事插入）。
 */
export function getPalacePersonality(
  palace: PalaceStructure,
  scoreResult: PalaceScoreResult
): { style: PalacePersonalityStyle; styleLabel: string; pattern: string } {
  const main0 = palace.mainStars?.[0]?.name?.trim() ?? "";
  const main1 = palace.mainStars?.[1]?.name?.trim();
  const lead = main0 || main1 || "";
  const style = lead ? starToBaseStyle(lead) : "strategic";
  const weak = scoreResult.score <= 2 || scoreResult.isEmptyPalace;
  const strong = scoreResult.score >= 4;
  const pattern = buildPattern(style, weak, strong, palace.palace, lead);
  return {
    style,
    styleLabel: STYLE_ZH[style],
    pattern,
  };
}
