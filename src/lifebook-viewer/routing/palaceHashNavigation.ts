import type { PalaceId } from "../themes/palaceVisualTheme";
import { parsePalaceIdFromHash } from "../hooks/useHashPalaceId";

/** `history.pushState` 標記：由「十二宮／焦點卡」開啟 overlay 時寫入，供「返回首頁」與上一頁行為一致 */
export const LIFEBOOK_PALACE_HISTORY_KEY = "lifebookPalace" as const;

/**
 * 若 `href` 為 `#palace-{id}`：攔截預設導航並改為 `pushHomePalaceHash`（與矩陣／決策卡一致）。
 * 回傳是否已處理（true = 呼叫端應 `preventDefault`）。
 */
export function tryOpenPalaceOverlayFromHashHref(href: string): boolean {
  if (typeof href !== "string" || !href.startsWith("#palace-")) return false;
  const pid = parsePalaceIdFromHash(href);
  if (!pid) return false;
  pushHomePalaceHash(pid);
  return true;
}

/**
 * 開啟降生藍圖上的 `#palace-*` overlay，並**新增一筆 history**，避免上一頁直接跳回主站命盤。
 * （僅設 `location.hash` 時，部分情境會覆寫當前條目，導致 [命盤, 命書#宮位] 僅兩層。）
 */
export function pushHomePalaceHash(palaceId: PalaceId): void {
  if (typeof window === "undefined") return;
  const base = `${window.location.pathname}${window.location.search}`;
  const h = `#palace-${palaceId}`;
  window.history.pushState({ [LIFEBOOK_PALACE_HISTORY_KEY]: true }, "", base + h);
  window.dispatchEvent(new HashChangeEvent("hashchange"));
}

/**
 * 關閉 overlay：若為 `pushHomePalaceHash` 開啟則 `history.back()`，否則 `replaceState` 清 hash。
 */
export function tryCloseHomePalaceOverlay(): void {
  if (typeof window === "undefined") return;
  try {
    const st = window.history.state as Record<string, unknown> | null;
    if (st && st[LIFEBOOK_PALACE_HISTORY_KEY] === true) {
      window.history.back();
      return;
    }
  } catch {
    /* ignore */
  }
  const base = `${window.location.pathname}${window.location.search}`;
  window.history.replaceState(null, "", base);
  window.dispatchEvent(new HashChangeEvent("hashchange"));
}
