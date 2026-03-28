import type { GateContract } from "../viewmodels/contracts";

export type ViewerTopBannerKind = "locked" | "teaser" | "none";

/**
 * 完整閱讀頁頂部：locked（阻擋）與 teaser/partial（試讀提示）文案分離。
 * open 不回傳橫幅。
 */
export function describeViewerTopBanner(
  gate: GateContract | null,
  options?: { lockReason?: string }
): { kind: ViewerTopBannerKind; title: string; body: string } {
  if (!gate) return { kind: "none", title: "", body: "" };
  if (gate.gate === "locked" && gate.isLocked) {
    return {
      kind: "locked",
      title: "此章節尚未解鎖",
      body: options?.lockReason ?? gate.lockReason ?? "升級方案後可閱讀完整內容。",
    };
  }
  if (gate.gate === "teaser" || gate.gate === "partial") {
    return {
      kind: "teaser",
      title: gate.gate === "partial" ? "試讀模式（已開部分章節）" : "試讀模式",
      body:
        gate.gate === "partial"
          ? "你可先閱讀已開放章節的摘要與結構；完整敘事與行動建議可於章內升級解鎖。"
          : "目前為試讀：可先掌握摘要與脈絡，完整正文依方案解鎖。",
    };
  }
  return { kind: "none", title: "", body: "" };
}
