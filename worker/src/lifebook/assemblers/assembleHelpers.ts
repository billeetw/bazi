/**
 * 章節 assembler 共用 helper：安全 join、關鍵年份渲染、安全取行。
 * 不做命理判斷，只做字串組裝。
 */

import type { KeyYearFinding } from "../lifebookFindings.js";

/** 安全 join 段落：過濾空值後用雙換行連接 */
export function joinParagraphs(parts: Array<string | undefined | null>): string {
  return parts
    .map((p) => (p ?? "").trim())
    .filter(Boolean)
    .join("\n\n");
}

/** 關鍵年份列表 → 單一區塊字串（宮位、年、歲、敘事、建議） */
export function renderKeyYears(items: KeyYearFinding[]): string {
  return items
    .map((item) => {
      const head = `${item.palace}（${item.year} 年${item.age != null ? `，${item.age} 歲` : ""}）`;
      return [head, item.narrative, item.advice].filter(Boolean).join("\n");
    })
    .join("\n\n");
}

/** 安全取一行：空則回 fallback */
export function safeLine(value?: string, fallback = ""): string {
  return (value ?? "").trim() || fallback;
}
