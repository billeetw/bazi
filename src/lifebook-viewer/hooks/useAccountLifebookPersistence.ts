import { useEffect, useRef, type Dispatch, type SetStateAction } from "react";
import type { LifeBookViewerState } from "../types";
import {
  fetchAccountLifebookDocument,
  isLikelyValidViewerState,
  readBaziJwt,
  saveAccountLifebookDocument,
} from "../utils/accountLifebookDocument";
import { mergeDocWithBetaSeed, tryLoadBetaSeedDocument } from "../utils/betaSeedDocument";

const DEBOUNCE_MS = 2000;

/**
 * 登入後：雲端命書與本地 seed 合併；狀態變更時 debounce 寫回 D1。
 */
export function useAccountLifebookPersistence(
  state: LifeBookViewerState,
  setState: Dispatch<SetStateAction<LifeBookViewerState>>,
  /** 例如 gate fixture 預覽：勿寫入使用者帳號 */
  disabled = false
): void {
  const lastSavedJson = useRef<string>("");
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** 登入／同頁授權完成後拉雲端覆蓋 */
  useEffect(() => {
    if (disabled) return undefined;
    const onAuth = (): void => {
      void (async () => {
        if (!readBaziJwt()) return;
        const remote = await fetchAccountLifebookDocument();
        if (!remote || !isLikelyValidViewerState(remote)) return;
        const seed = tryLoadBetaSeedDocument();
        const merged = mergeDocWithBetaSeed(remote, seed) ?? remote;
        setState({
          meta: merged.meta,
          sections: merged.sections,
          chart_json: merged.chart_json,
          weight_analysis: merged.weight_analysis,
        });
        lastSavedJson.current = JSON.stringify(merged);
      })();
    };

    if (typeof window === "undefined") return undefined;
    window.addEventListener("auth-state-changed", onAuth);
    return () => window.removeEventListener("auth-state-changed", onAuth);
  }, [setState, disabled]);

  useEffect(() => {
    if (disabled) return undefined;
    if (!readBaziJwt()) return undefined;
    const json = JSON.stringify(state);
    if (json === lastSavedJson.current) return undefined;

    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      void (async () => {
        const ok = await saveAccountLifebookDocument(state);
        if (ok) lastSavedJson.current = json;
      })();
    }, DEBOUNCE_MS);

    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [state, disabled]);
}
