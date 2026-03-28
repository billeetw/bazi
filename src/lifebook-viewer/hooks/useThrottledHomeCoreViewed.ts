import { useEffect, useRef } from "react";

/**
 * `home_core_viewed` 節流：同一 `day_key` + 本地小時只送一次，避免 re-render 重複洗數據。
 * `onFire` 請以 `useCallback` 包最新 payload。
 */
export function useThrottledHomeCoreViewed(
  dayKey: string,
  enabled: boolean,
  onFire: () => void
): void {
  const lastTrackedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!enabled) return;
    const hour = new Date().getHours();
    const key = `${dayKey}-${hour}`;
    if (lastTrackedRef.current === key) return;
    lastTrackedRef.current = key;
    onFire();
  }, [dayKey, enabled, onFire]);
}
