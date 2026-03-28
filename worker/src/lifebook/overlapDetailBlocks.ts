/**
 * 疊宮三組區塊（劇烈震盪／地雷／機會）— 目前為空殼，保留介面供模組二與未來恢復。
 * 契約：chart-only 路徑不得傳 findings，避免混源。
 */
import type { AssembleContentLookup } from "./assembler.js";
import type { LifebookFindings } from "./lifebookFindings.js";

export interface BuildOverlapDetailBlocksOpts {
  chartJson?: Record<string, unknown>;
  content?: AssembleContentLookup;
  config?: Record<string, unknown> | null;
  contentLocale?: "zh-TW" | "zh-CN" | "en";
  minorFortuneByPalace?: Array<{ palace?: string; year?: number | null; nominalAge?: number | null; stem?: string | null }>;
  /** 已棄用：疊宮區塊改為 chart-only 或 findings 快照單一路徑；勿傳入。 */
  findings?: LifebookFindings | null;
}

/** 從 overlay 產出三組疊宮區塊。疊宮清理：暫不讀舊 overlap 預算 transformations，恆回傳空；待 buildPalaceOverlay 接上後改為讀新資料。 */
export function buildOverlapDetailBlocks(
  _overlap: Record<string, unknown> | undefined,
  _opts?: BuildOverlapDetailBlocksOpts
): {
  shockBlocks: string;
  mineBlocks: string;
  wealthBlocks: string;
} {
  return { shockBlocks: "", mineBlocks: "", wealthBlocks: "" };
}
