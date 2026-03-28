import type { SectionViewModel } from "./sectionViewModel";
import { getSectionDomAnchorId } from "../../constants";
import { resolvePalacePreset } from "../../themes/palaceThemePresets";
import type { PalaceId } from "../../themes/palaceVisualTheme";
import type { DisplaySignal } from "../../viewmodels/displaySignalTypes";
import { getPreviewSignalPrimaryLine } from "./previewSignalCopy";
import styles from "./PalacePreviewCard.module.css";

function clipOneLine(text: string, max: number): string {
  const t = text.trim().replace(/\s+/g, " ");
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

function signalTone(signal: DisplaySignal | undefined): "warn" | "ok" | "neutral" {
  if (!signal) return "neutral";
  if (signal.code === "health_warning" || signal.code === "career_pressure") return "warn";
  if (signal.code === "wealth_opportunity" || signal.code === "career_push") return "ok";
  return "neutral";
}

function gatePillLabel(gate: SectionViewModel["gate"]): string {
  switch (gate) {
    case "open":
      return "GATE · 完整";
    case "partial":
      return "GATE · 試讀";
    case "teaser":
      return "GATE · 預覽";
    case "locked":
      return "GATE · 鎖定";
    default:
      return "";
  }
}

export interface PalacePreviewCardProps {
  vm: SectionViewModel;
  onPremiumUnlock?: () => void;
  className?: string;
}

/**
 * 預覽卡：只負責「要不要點進去」，不承載正文（無 whisper／anchor／長文／卡內捲動）。
 */
export function PalacePreviewCard({ vm, onPremiumUnlock, className = "" }: PalacePreviewCardProps) {
  const effectivePalaceId = (vm.palaceId ?? "ming") as PalaceId;
  const { palaceId: resolvedId, row: preset } = resolvePalacePreset(effectivePalaceId);
  const primary = vm.displaySignals?.[0];
  const signalLine = getPreviewSignalPrimaryLine(primary);
  const stateSummary = clipOneLine(vm.summary || "—", 96);

  const handleCta = () => {
    if (vm.isLocked) {
      onPremiumUnlock?.();
      return;
    }
    document.getElementById(getSectionDomAnchorId(vm.sectionKey))?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const ctaLabel = vm.isLocked ? "解鎖查看 →" : "查看此宮 →";

  return (
    <div
      className={`${styles.card} ${className}`}
      data-palace-root="true"
      data-palace={resolvedId}
      data-status={vm.status}
      data-preview-card="true"
      aria-label={`${preset.displayNameZh} 預覽`}
    >
      <div className={styles.orbWrap} aria-hidden>
        <div className="blue-star" />
      </div>

      <h3 className={styles.title}>{preset.displayNameZh}</h3>
      <p className={styles.subtitle}>{preset.subtitleZh}</p>

      <div className={styles.divider} aria-hidden />

      <p className={styles.stateLine} title={vm.summary}>
        {stateSummary}
      </p>

      <div className={styles.spacer} aria-hidden />

      <div className={styles.signalBadge} data-tone={signalTone(primary)}>
        {signalLine}
      </div>
      <div className={styles.gatePill}>{gatePillLabel(vm.gate)}</div>

      <button type="button" className={`${styles.cta} ${vm.isLocked ? styles.ctaLocked : ""}`} onClick={handleCta}>
        {ctaLabel}
      </button>
    </div>
  );
}
