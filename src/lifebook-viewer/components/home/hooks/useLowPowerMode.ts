import { useEffect, useState } from "react";

/**
 * 低功耗／弱機偵測：為根節點加上 .lb-low-power，收斂 backdrop-filter、SVG filter、動畫。
 */
export function useLowPowerMode(): boolean {
  const [low, setLow] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
    const nav = navigator as Navigator & {
      deviceMemory?: number;
      connection?: { saveData?: boolean; effectiveType?: string };
    };

    function compute(): boolean {
      try {
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return true;
      } catch {
        /* ignore */
      }
      if (nav.connection?.saveData === true) return true;
      const et = nav.connection?.effectiveType;
      if (et === "slow-2g" || et === "2g") return true;
      if (typeof nav.deviceMemory === "number" && nav.deviceMemory <= 4) return true;
      return false;
    }

    setLow(compute());

    const mqMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setLow(compute());

    /** Safari 14 前 MediaQueryList 僅有 addListener，無 addEventListener */
    let offMq: (() => void) | undefined;
    try {
      if (typeof mqMotion.addEventListener === "function") {
        mqMotion.addEventListener("change", onChange);
        offMq = () => mqMotion.removeEventListener("change", onChange);
      } else {
        mqMotion.addListener(onChange);
        offMq = () => mqMotion.removeListener(onChange);
      }
    } catch {
      offMq = undefined;
    }

    const conn = nav.connection;
    let offConn: (() => void) | undefined;
    if (conn && typeof conn.addEventListener === "function") {
      try {
        conn.addEventListener("change", onChange);
        offConn = () => {
          if (typeof conn.removeEventListener === "function") {
            conn.removeEventListener("change", onChange);
          }
        };
      } catch {
        offConn = undefined;
      }
    }

    return () => {
      try {
        offMq?.();
      } catch {
        /* ignore */
      }
      try {
        offConn?.();
      } catch {
        /* ignore */
      }
    };
    } catch (e) {
      console.warn("[useLowPowerMode] init failed", e);
    }
  }, []);

  return low;
}
