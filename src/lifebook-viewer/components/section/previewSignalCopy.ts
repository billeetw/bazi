import type { DisplaySignal } from "../../viewmodels/displaySignalTypes";

/**
 * Preview 卡主視覺：只取 `displaySignals[0]` 時的一行文案（與正式章節長文分離）。
 */
export function getPreviewSignalPrimaryLine(signal: DisplaySignal | undefined): string {
  if (!signal) return "◎ 目前狀態穩定";
  switch (signal.code) {
    case "health_warning":
      return "⚠️ 壓力或盲區正在放大";
    case "wealth_opportunity":
      return "💰 資源與機會正在聚集";
    case "career_push":
      return "🚀 行動與定位正在推進";
    case "career_pressure":
      return "⚠️ 邊界與控制壓力升高";
    case "relationship_tension":
      return "❤️ 關係互動影響決策";
    case "inner_drift":
      return "◎ 內在節奏微調中";
    default:
      return "◎ 目前狀態穩定";
  }
}
