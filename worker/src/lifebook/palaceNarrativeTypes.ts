/**
 * 逐宮讀者敘事：統一輸入型別（命盤資料 → 單宮讀者正文）。
 * 供各宮位章節寫作模板與 pipeline 共用；**命書章節 `s17` 疊宮章**為另一套用語。
 * 依據：docs/lifebook-palace-data-and-narrative-audit.md
 */

/** 宮位敘事語調：正面 / 中性 / 風險偏多 */
export type PalaceNarrativeTone = "positive" | "neutral" | "risk";

/**
 * 單一宮位的敘事輸入（資料層 → 寫作模板）。
 * 由主星定調、輔星修飾、雜曜現象、廟旺陷與四化綜合成。
 */
export interface PalaceNarrativeInput {
  /** 宮位名稱（canonical，如 命宮、財帛宮） */
  palace: string;
  /** 核心主題（來自主星 core/themes，最多 2 顆主星，1～3 條） */
  coreThemes: string[];
  /** 修飾語（輔星、亮度、本命四化對該宮的影響） */
  modifiers: string[];
  /** 現象關鍵詞（雜曜、煞星轉成的現象：變動、空感、卡關、壓力、獨處等） */
  phenomena: string[];
  /** 語調：正面 / 中性 / 風險 */
  tone: PalaceNarrativeTone;
  /** 可選：主星名（leadMainStar），用於模板指名 */
  leadMainStar?: string;
  /** 可選：共主星（第二顆主星） */
  coLeadMainStars?: string[];
  /** 可選：三方四正相關宮位或軸線描述，用於「與他宮牽動」 */
  relatedPalacesNote?: string;
}
