import type { LifeBookMeta } from "../types";

/** 產品四態（Phase 1 收斂） */
export type GateState = "open" | "partial" | "locked" | "teaser";

/**
 * Phase 1 產品矩陣（少數組合先跑通）：
 *
 * | gate    | previewMode | ctaVariant    |
 * | open    | full        | none          |
 * | partial | teaser      | soft-upgrade  |
 * | teaser  | teaser      | upgrade       |
 * | locked  | hidden      | upgrade-hard  |
 */
export type PreviewMode = "full" | "teaser" | "hidden";

export type CtaVariant =
  | "none"
  | "unlock"
  | "upgrade"
  | "details"
  /** 試讀／半開：溫和轉化 */
  | "soft-upgrade"
  /** 完整鎖：強轉化 */
  | "upgrade-hard";
export type ViewSignal = "alert" | "wealth" | "career" | "love";
export type ViewStatus = "high_pressure" | "opportunity" | "neutral";

export interface GateContract {
  gate: GateState;
  isLocked: boolean;
  lockReason?: string;
  previewMode: PreviewMode;
  ctaVariant: CtaVariant;
}

type LockedSectionMeta = {
  section_key?: string;
  is_locked?: boolean;
  lock_reason?: string;
};

function getLockedMeta(meta: LifeBookMeta | null | undefined): LockedSectionMeta[] {
  const raw = (meta as unknown as { locked_sections?: unknown })?.locked_sections;
  if (!Array.isArray(raw)) return [];
  return raw.filter((x): x is LockedSectionMeta => typeof x === "object" && x != null);
}

export function resolveGateContract(meta: LifeBookMeta | null | undefined, sectionKey: string): GateContract {
  const locked = getLockedMeta(meta).find((x) => x.section_key === sectionKey);
  if (locked?.is_locked === true) {
    return {
      gate: "locked",
      isLocked: true,
      lockReason: locked.lock_reason ?? "此章節需解鎖",
      previewMode: "hidden",
      ctaVariant: "upgrade-hard",
    };
  }

  const tier = String((meta as unknown as { plan_tier?: string })?.plan_tier ?? "");
  const available = (meta as unknown as { available_sections?: unknown[] })?.available_sections;
  if (tier === "pro") {
    return { gate: "open", isLocked: false, previewMode: "full", ctaVariant: "none" };
  }
  if (Array.isArray(available) && available.includes(sectionKey)) {
    return { gate: "partial", isLocked: false, previewMode: "teaser", ctaVariant: "soft-upgrade" };
  }
  return { gate: "teaser", isLocked: false, previewMode: "teaser", ctaVariant: "upgrade" };
}

