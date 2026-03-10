/**
 * P2: 決定宮位「主導主星」與共主星。
 * 只回答：這一宮哪顆主星是這次推理的主要入口？不寫文案。
 * 第一版：只看 mainStars；不做亮度權重；無主星不硬猜。
 */

import type { StarInPalace } from "../../normalizedChart.js";

export type LeadMainStarResolutionMode = "single" | "dual" | "none";

export interface LeadMainStarResolution {
  leadMainStar?: string;
  coLeadMainStars?: string[];
  mode: LeadMainStarResolutionMode;
}

/**
 * Case A：0 顆主星 → mode "none"。
 * Case B：1 顆主星 → leadMainStar，coLeadMainStars: []，mode "single"。
 * Case C：2 顆主星 → leadMainStar 第一顆，coLeadMainStars: [第二顆]，mode "dual"。
 * 2+ 顆：coLeadMainStars 為其餘全部，推理時先以 leadMainStar 為主。
 */
export function resolveLeadMainStar(mainStars: StarInPalace[]): LeadMainStarResolution {
  if (!mainStars || mainStars.length === 0) {
    return { mode: "none" };
  }
  if (mainStars.length === 1) {
    return {
      leadMainStar: mainStars[0].name?.trim() ?? "",
      coLeadMainStars: [],
      mode: "single",
    };
  }
  const names = mainStars.map((s) => s.name?.trim()).filter(Boolean);
  return {
    leadMainStar: names[0],
    coLeadMainStars: names.slice(1),
    mode: "dual",
  };
}
