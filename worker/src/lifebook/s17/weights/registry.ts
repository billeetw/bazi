import type { StarBaseProfile } from "./types.js";
import { buildCompleteStarPalaceWeightsMap } from "./starPalaceWeightsFull.js";

/**
 * 句庫 + 權重：十四主星為十二宮完整表；輔曜／煞曜／雜曜由使用者原表 + 補齊宮位。
 * 另含「事業宮」鍵與「官祿宮」同值，供舊資料或手動查表相容。
 */
export const STAR_BASE_PROFILE: Record<string, StarBaseProfile> = {
  紫微: { tags: ["主導", "權威", "體面"] },
  天機: { tags: ["思考", "策略", "變動"] },
  太陽: { tags: ["外向", "公眾", "行動"] },
  武曲: { tags: ["資源", "成果", "執行"] },
  天同: { tags: ["和緩", "享受", "福氣"] },
  廉貞: { tags: ["控制", "界線", "拉扯"] },
  天府: { tags: ["穩重", "守成", "財庫"] },
  太陰: { tags: ["細膩", "守財", "內在"] },
  貪狼: { tags: ["慾望", "人際", "偏財"] },
  巨門: { tags: ["口才", "辯證", "是非"] },
  天相: { tags: ["平衡", "秩序", "協調"] },
  天梁: { tags: ["老成", "庇護", "規範"] },
  七殺: { tags: ["破局", "速度", "高壓"] },
  破軍: { tags: ["改革", "重啟", "高波動"] },
};

export const STAR_PALACE_WEIGHTS = buildCompleteStarPalaceWeightsMap();
