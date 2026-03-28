import { useEffect, useState } from "react";
import type { PalaceId } from "../themes/palaceVisualTheme";
import { PALACE_ID_ORDER } from "../themes/palaceVisualTheme";

const VALID = new Set<string>(PALACE_ID_ORDER);

export function parsePalaceIdFromHash(hash: string): PalaceId | null {
  const m = /^#palace-([a-z]+)$/.exec(hash);
  if (!m) return null;
  const id = m[1];
  return VALID.has(id) ? (id as PalaceId) : null;
}

/**
 * 讀取 `location.hash` 為 `#palace-{id}` 時的宮位 id（供 Home 全螢幕宮位閱讀層）。
 */
export function useHashPalaceId(): PalaceId | null {
  const [pid, setPid] = useState<PalaceId | null>(() =>
    typeof window !== "undefined" ? parsePalaceIdFromHash(window.location.hash) : null
  );

  useEffect(() => {
    const sync = () => setPid(parsePalaceIdFromHash(window.location.hash));
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);

  return pid;
}
