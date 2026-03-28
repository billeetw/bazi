/**
 * 命書章節順序與模組分組
 * 順序唯一來源：worker/data/lifebook-section-order.json（與 API worker 共用）。
 */
import lifebookSectionOrder from "../../worker/data/lifebook-section-order.json";
import type { PalaceId } from "./themes/palaceVisualTheme";

export const SECTION_ORDER = lifebookSectionOrder.sectionOrder as readonly string[];

/** 章節鍵（與 SECTION_ORDER 內容一致；型別寬鬆為 string 以利 JSON 單一來源） */
export type SectionKey = string;

/** 命盤與五行 iframe 嵌入的示範頁 URL（主站路由，可自行改為實際路徑） */
export const LIFEBOOK_DEMO_CHART_URL = "/ziwei/demo-lifebook";

/** 模組標題 → 該組 section_key 列表（s04 在 s02 前，與 worker SECTION_ORDER 一致） */
export const MODULE_MAP: Record<string, readonly string[]> = {
  "開場": ["s00"],
  "模組一：核心作業系統": ["s03", "s04", "s02", "s10", "s01"],
  "人生十二課題": ["s05", "s06", "s07", "s08", "s09", "s11", "s12", "s13", "s14"],
  "模組二：時間主線與功課": ["s15", "s15a", "s16", "s17", "s18", "s19", "s20", "s22", "s23"],
  "收束": ["s21"],
};

// ---------------------------------------------------------------------------
// 三層結構與導航狀態（十神 / 五行樣式、章節分組、狀態邏輯）
// ---------------------------------------------------------------------------

/** 十神視覺樣式（僅用於標籤與顏色，不包含演算法） */
export const TEN_GOD_THEMES: Record<
  string,
  { color: string; icon: string; description: string }
> = {
  偏財: { color: "#FAAD14", icon: "TrendUp", description: "非線性獲利與市場博弈" },
  正財: { color: "#FAAD14", icon: "Wallet", description: "穩定收入與現金流管理" },
  七殺: { color: "#FF4D4F", icon: "Alert", description: "高壓挑戰與突破現狀" },
  正官: { color: "#722ED1", icon: "Shield", description: "體制內責任與壓力" },
  傷官: { color: "#1890FF", icon: "Flash", description: "才華表達與挑戰規則" },
  食神: { color: "#52C41A", icon: "Smile", description: "穩定產出與生活享受" },
  正印: { color: "#52C41A", icon: "Book", description: "保護力、長輩與學習資源" },
  偏印: { color: "#52C41A", icon: "Sparkles", description: "靈感、直覺與非典型資源" },
  劫財: { color: "#8C8C8C", icon: "Users", description: "同儕競爭與資源分攤" },
  比肩: { color: "#8C8C8C", icon: "User", description: "自我堅持與平行關係" },
};

/** 五行樣式（能量條 / Tag 用） */
export const WUXING_STYLE: Record<
  string,
  { bg: string; text: string; border: string }
> = {
  木: { bg: "#E6F7ED", text: "#4CAF50", border: "#4CAF50" },
  火: { bg: "#FFF1F0", text: "#F44336", border: "#F44336" },
  土: { bg: "#FFFBE6", text: "#D4B106", border: "#D4B106" },
  金: { bg: "#F5F5F5", text: "#8C8C8C", border: "#BFBFBF" },
  水: { bg: "#E6F4FF", text: "#1677FF", border: "#1677FF" },
};

/** 章節分組（依 section_key，供導航／篩選用） */
export const SECTION_GROUPS: Record<
  string,
  { label: string; sections: string[] }
> = {
  CORE: {
    label: "生命核心",
    sections: ["s00", "s03", "s02", "s01"],
  },
  STAGE: {
    label: "外部舞台",
    sections: ["s08", "s10", "s12", "s09"],
  },
  RELATIONSHIP: {
    label: "關係連結",
    sections: ["s06", "s13", "s14", "s07", "s05"],
  },
  HIDDEN: {
    label: "隱形壓力",
    sections: ["s11", "s04", "s05"], // s04 命主・身主・身宮
  },
  TIME_AND_CLOSING: {
    label: "時間與收束",
    sections: ["s15", "s15a", "s16", "s17", "s18", "s19", "s20", "s22", "s23", "s21"],
  },
};

/** section_key → 主宮位（用於從 chart_json 取 tenGodByPalace / wuxingByPalace） */
export const SECTION_PALACE_MAP: Record<string, string | null> = {
  s00: null,
  s03: null,
  s01: "福德",
  s02: "命宮",
  s04: "命宮",
  s05: "父母",
  s06: "兄弟",
  s07: "僕役",
  s08: "官祿",
  s09: "田宅",
  s10: "財帛",
  s11: "疾厄",
  s12: "遷移",
  s13: "夫妻",
  s14: "子女",
  s15: null,
  s15a: null,
  s16: null,
  s17: null,
  s18: null,
  s19: null,
  s20: null,
  s22: null,
  s23: null,
  s21: null,
};

/**
 * section_key → `palace-theme-presets.json` 的 palaceId（僅十二宮課題章節有值）。
 * 供 SectionViewModel.palaceId 與 SectionPalaceTemplate 單一主題來源。
 */
export const SECTION_KEY_TO_PALACE_ID: Partial<Record<string, PalaceId>> = {
  s01: "fude",
  s02: "ming",
  s04: "ming",
  s05: "fumu",
  s06: "xiongdi",
  s07: "nuppu",
  s08: "guanlu",
  s09: "tianzhai",
  s10: "caibo",
  s11: "jie",
  s12: "qianyi",
  s13: "fuqi",
  s14: "zinv",
};

/** 是否為「宮位課題」章節（正文走 `SectionPalaceTemplate`，含 s02/s04 等映射至 palaceId 者）。 */
export function isSectionKeyPalaceShell(sectionKey: string): boolean {
  return Object.prototype.hasOwnProperty.call(SECTION_KEY_TO_PALACE_ID, sectionKey);
}

/**
 * 章節捲動錨點 id：宮位課題用 `#palace-{palaceId}`，其餘用 `section_key`。
 * 與 Step 1 Home CTA、`#palace-*`（overlay）／`?view=viewer#palace-*`（完整閱讀）對齊。
 */
export function getSectionDomAnchorId(sectionKey: string): string {
  const p = SECTION_KEY_TO_PALACE_ID[sectionKey];
  if (p) return `palace-${p}`;
  return sectionKey;
}

/**
 * 由 `palaceId` 反查第一個存在的章節 key（順序依 `SECTION_ORDER`；例如命宮可能為 s04 或 s02）。
 */
export function getSectionKeyForPalaceId(palaceId: PalaceId, sections: Record<string, unknown>): string | null {
  for (const key of SECTION_ORDER) {
    if (!sections[key]) continue;
    const p = SECTION_KEY_TO_PALACE_ID[key];
    if (p === palaceId) return key;
  }
  return null;
}

/**
 * 單宮按需生成（v1）：palace → `SECTION_ORDER` 中**第一個**對應的 section_key（一宮只生成一章）。
 * 例：命宮在順序中為 s04 早於 s02。
 */
export function getPrimarySectionKeyForPalaceId(palaceId: PalaceId): string | null {
  for (const key of SECTION_ORDER) {
    const p = SECTION_KEY_TO_PALACE_ID[key];
    if (p === palaceId) return key;
  }
  return null;
}

/**
 * Viewer「宮位模板預覽」區塊：十二宮課題章節（與 `SECTION_KEY_TO_PALACE_ID` 一致）。
 */
export const PALACE_TEMPLATE_PREVIEW_SECTION_KEYS = [
  "s02",
  "s08",
  "s10",
  "s13",
  "s11",
  "s12",
  "s01",
  "s09",
  "s05",
  "s06",
  "s07",
  "s14",
] as const;

/** URL / fixture 焦點用語（對應單一 section_key） */
export type PalacePreviewFocus =
  | "ming"
  | "guanlu"
  | "caibo"
  | "fuqi"
  | "jie"
  | "qianyi"
  | "fude"
  | "tianzhai"
  | "fumu"
  | "xiongdi"
  | "nuppu"
  | "zinv";

export const PREVIEW_FOCUS_TO_SECTION_KEY: Record<PalacePreviewFocus, string> = {
  ming: "s02",
  guanlu: "s08",
  caibo: "s10",
  fuqi: "s13",
  jie: "s11",
  qianyi: "s12",
  fude: "s01",
  tianzhai: "s09",
  fumu: "s05",
  xiongdi: "s06",
  nuppu: "s07",
  zinv: "s14",
};

export function sectionKeyToPreviewFocus(sectionKey: string): PalacePreviewFocus | null {
  const m: Record<string, PalacePreviewFocus> = {
    s02: "ming",
    s08: "guanlu",
    s10: "caibo",
    s13: "fuqi",
    s11: "jie",
    s12: "qianyi",
    s01: "fude",
    s09: "tianzhai",
    s05: "fumu",
    s06: "xiongdi",
    s07: "nuppu",
    s14: "zinv",
  };
  return m[sectionKey] ?? null;
}

/** 章節狀態（高壓 / 機會 / 中性） */
export type SectionStatus = "HIGH_PRESSURE" | "OPPORTUNITY" | "NEUTRAL";

export interface StarInfo {
  name: string;
  transform?: "祿" | "權" | "科" | "忌" | null;
}

export interface SectionTechContext {
  stars?: StarInfo[];
  tenGod?: string | null;
  wuxing?: string | null;
}

/** 依簡化規則計算章節狀態（不暴露完整演算法） */
export function getSectionStatus(ctx: SectionTechContext): SectionStatus {
  const stars = ctx.stars ?? [];
  const tenGod = ctx.tenGod ?? "";

  const hasJi = stars.some((s) => s.transform === "忌");
  const hasLu = stars.some((s) => s.transform === "祿");

  const isAggressiveTenGod = tenGod === "七殺" || tenGod === "劫財";
  const isWealthTenGod = tenGod === "偏財" || tenGod === "食神";

  if (hasJi && isAggressiveTenGod) return "HIGH_PRESSURE";
  if (hasLu && isWealthTenGod) return "OPPORTUNITY";
  return "NEUTRAL";
}

/** 依 section_key 與 chart_json 組出該章 techContext（供導航狀態與 SectionLayout 用） */
export function getTechContextForSection(
  sectionKey: string,
  chartJson: Record<string, unknown> | null | undefined
): SectionTechContext {
  const palace = SECTION_PALACE_MAP[sectionKey] ?? null;
  if (!palace || !chartJson) return {};
  const tenGodByPalace = chartJson.tenGodByPalace as Record<string, string> | undefined;
  const wuxingByPalace = chartJson.wuxingByPalace as Record<string, string> | undefined;
  const tenGod = tenGodByPalace?.[palace] ?? tenGodByPalace?.[palace + "宮"] ?? null;
  const wuxing = wuxingByPalace?.[palace] ?? wuxingByPalace?.[palace + "宮"] ?? null;
  return { stars: [], tenGod: tenGod ?? null, wuxing: wuxing ?? null };
}
