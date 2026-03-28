import { useId } from "react";
import type { DisplaySignal } from "../../viewmodels/displaySignalTypes";
import type { SectionResonanceCalibration, SectionViewModel } from "./sectionViewModel";
import styles from "./SectionPalaceTemplate.module.css";
import { LIFELINE_FAMILIES, resolvePalacePreset, type PalaceLifelinePaths } from "../../themes/palaceThemePresets";
import type { PalaceId } from "../../themes/palaceVisualTheme";
import { getSectionDomAnchorId } from "../../constants";
/** 殼層 CSS 由 lifebook-viewer.html 以 link 載入 /palace-templates/*.css（勿在此 import，以免被當成 ES module 而 MIME 錯誤）。 */

export interface SectionPalaceTemplateProps {
  /**
   * 覆寫 VM 內的 palaceId（少用）。預設使用 `vm.palaceId`（由 SECTION_KEY_TO_PALACE_ID 填）。
   */
  palaceId?: string;
  vm: SectionViewModel;
  className?: string;
  onPremiumUnlock?: () => void;
  /** Reserved for star modal / navigation — not wired yet. */
  onOpenStar?: (starKey: string) => void;
  onNavigatePalace?: (nextPalaceId: string) => void;
}

function signalLabel(s: SectionViewModel["signals"][number]): string {
  if (s === "alert") return "盲區風險";
  if (s === "wealth") return "資源機運";
  if (s === "career") return "角色使命";
  return "關係連結";
}

function signalClass(s: SectionViewModel["signals"][number]): string {
  return s === "alert" ? styles.runeWarn : styles.runeGood;
}

/** 與 {@link resolveDisplaySignals} 產出對齊；高風險語意走 warn 樣式 */
function displaySignalClass(d: DisplaySignal): string {
  if (d.code === "health_warning" || d.code === "career_pressure") return styles.runeWarn;
  return styles.runeGood;
}

function calibrationModifier(kind: SectionResonanceCalibration["kind"]): string {
  if (kind === "overburn") return styles.calOverburn;
  if (kind === "caution") return styles.calCaution;
  return styles.calBalanced;
}

function scrollToId(id: string): void {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function PalaceLifelines({ palaceKey, paths }: { palaceKey: PalaceId; paths: PalaceLifelinePaths }) {
  const reactId = useId().replace(/:/g, "");
  const gradientId = `pmso-trunk-${palaceKey}-${reactId}`;
  const filterId = `pmso-glow-${palaceKey}-${reactId}`;

  return (
    <svg viewBox="0 0 520 980" preserveAspectRatio="none" aria-hidden>
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor="rgba(12, 38, 50, 0)" />
          <stop offset="20%" stopColor="var(--palace-gradient-mid)" />
          <stop offset="60%" stopColor="var(--palace-gradient-gold)" />
          <stop offset="100%" stopColor="rgba(212, 175, 55, 0)" />
        </linearGradient>
        <filter id={filterId} x="-50%" y="-20%" width="200%" height="140%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>
      <path
        className="trunk-body-yang"
        d={paths.yangTrunk}
        style={{ stroke: `url(#${gradientId})`, filter: `url(#${filterId})` }}
      />
      <path
        className="energy-flow-yang"
        d={paths.yangFlow}
        style={{ filter: `url(#${filterId})` }}
      />
      <path className="trunk-body-yin" d={paths.yinTrunk} />
      <path className="energy-flow-yin" d={paths.yinFlow} />
    </svg>
  );
}

export function SectionPalaceTemplate({
  palaceId,
  vm,
  className = "",
  onPremiumUnlock,
  onOpenStar,
  onNavigatePalace,
}: SectionPalaceTemplateProps) {
  void onOpenStar;
  void onNavigatePalace;

  const showDebug = import.meta.env.DEV;
  const showTimeline = vm.fateProjection.nodes.length > 0;
  const veilActive = vm.premiumTeaser != null;
  const { resonance } = vm;

  const effectivePalaceId = palaceId ?? vm.palaceId ?? "ming";
  const { palaceId: resolvedId, row: preset } = resolvePalacePreset(effectivePalaceId);
  const lifelinePaths = LIFELINE_FAMILIES[preset.lifelineFamily];

  return (
    <article
      className={`${styles.card} ${className}`}
      data-palace-root="true"
      data-palace={resolvedId}
      aria-label={preset.displayNameZh}
    >
      <div className={styles.lifelineLayer}>
        <div className="app-life-lines">
          <PalaceLifelines palaceKey={resolvedId} paths={lifelinePaths} />
        </div>
      </div>

      <div className={styles.abyssWomb} aria-hidden>
        <div className={styles.wombBreath} />
        <div className={`${styles.dust} ${styles.d1}`} />
        <div className={`${styles.dust} ${styles.d2}`} />
      </div>

      <div className={styles.content}>
        <header className={styles.genesisHeader}>
          <div className="blue-star" aria-hidden />
          <span className="palace-hint-symbol" aria-hidden>
            {preset.symbolGlyph}
          </span>
          <h1 className="palace-name">{preset.displayNameZh}</h1>
          <p className="subcopy">{preset.subtitleZh}</p>
          <div className={styles.signalsGroup}>
            {vm.displaySignals.length > 0
              ? vm.displaySignals.map((d, i) => (
                  <span key={`${d.code}-${i}`} className={`${styles.rune} ${displaySignalClass(d)}`}>
                    {d.label}
                  </span>
                ))
              : vm.signals.map((s) => (
                  <span key={s} className={`${styles.rune} ${signalClass(s)}`}>
                    {signalLabel(s)}
                  </span>
                ))}
          </div>
        </header>

        {vm.stars.length > 0 ? (
          <section className={styles.starSection} aria-label="本宮星曜">
            <div className={styles.sectionDivider}>
              <span>STAR_ATLAS</span>
            </div>
            <div className={styles.starGrid}>
              {vm.stars.map((star) => (
                <details key={star.id} className={styles.starCard}>
                  <summary className={styles.starSummary}>
                    <span className={styles.starGlyph}>{star.glyph}</span>
                    <span className={styles.starName}>{star.displayName}</span>
                    {star.isMain ? <span className={styles.starMainTag}>主定調</span> : null}
                  </summary>
                  <div className={styles.starDetail}>
                    <p>{star.intro}</p>
                    <p>{star.palaceExpression}</p>
                  </div>
                </details>
              ))}
            </div>
          </section>
        ) : null}

        <section className={styles.resonanceDashboard} aria-label="靈魂共振儀">
          <div className={`${styles.calibrationState} ${calibrationModifier(resonance.calibration.kind)}`} role="status">
            <span className={styles.calIcon} aria-hidden>
              {resonance.calibration.icon}
            </span>
            <div className={styles.calText}>
              <span className={styles.calBadge}>{resonance.calibration.badge}</span>
              {resonance.calibration.message}
            </div>
          </div>

          <div className={styles.dynamicCards}>
            {resonance.cards.map((c) => (
              <div key={c.id} className={`${styles.dCard} ${c.alert ? styles.dCardAlert : ""}`}>
                <div className={styles.dTag}>
                  {c.tagEn} // {c.tagZh}
                </div>
                <p className={styles.dQuote}>{c.quote}</p>
              </div>
            ))}
          </div>

          <div className={styles.situationalTriggers}>
            {resonance.triggers.map((t) => (
              <button key={t.id} type="button" className={styles.sTrigger} onClick={() => scrollToId(t.scrollTargetId)}>
                {t.label}
              </button>
            ))}
          </div>
        </section>

        <section className={styles.angelWhisper} aria-label="摘要">
          <p>{vm.summary}</p>
        </section>

        <div className={`${styles.sectionDivider} ${styles.archivesMargin}`}>
          <span>{resonance.archivesHeading}</span>
        </div>

        <section className={styles.sacredSlate} aria-label="核心解讀">
          <div className={styles.sBlock} id={`${vm.sectionKey}-base`}>
            <div className={styles.sLabel}>靈魂底色 ✧ BASE_TRAITS</div>
            <div className={styles.sText}>{vm.whyItMatters}</div>
          </div>

          <div className={`${styles.sBlock} ${vm.primaryWarnings.length > 0 ? styles.shadow : ""}`} id={`${vm.sectionKey}-inertia`}>
            <div className={styles.sLabel}>慣性盲點 ✧ THE_INERTIA</div>
            <div className={styles.sText}>{vm.inertiaNarrative}</div>
          </div>

          <div className={`${styles.sBlock} ${styles.directive}`} id={`${vm.sectionKey}-directive`}>
            <div className={styles.sLabel}>降世指引 ✧ DIRECTIVE</div>
            <div className={styles.sText}>{vm.recommendAction}</div>
          </div>
        </section>

        <section className={styles.preservedSection} aria-label="原始命書評語">
          <div className={styles.sectionDivider}>
            <span>SOURCE_NOTES</span>
          </div>
          <details className={styles.longNotes}>
            <summary>查看完整命書評語（保留原文）</summary>
            <div className={styles.longNotesBody}>
              <p>
                <strong>核心結構：</strong>
                {vm.preservedNarratives.structure}
              </p>
              <p>
                <strong>決策傾向：</strong>
                {vm.preservedNarratives.behavior}
              </p>
              <p>
                <strong>盲點提醒：</strong>
                {vm.preservedNarratives.blindSpots}
              </p>
              <p>
                <strong>策略建議：</strong>
                {vm.preservedNarratives.strategicAdvice}
              </p>
            </div>
          </details>
        </section>

        {vm.relatedPalaceLinks.length > 0 ? (
          <section className={styles.linkSection} aria-label="三方四正牽動">
            <div className={styles.sectionDivider}>
              <span>THREE_FANG_FOUR_ZHENG</span>
            </div>
            <div className={styles.linkGrid}>
              {vm.relatedPalaceLinks.map((link) => (
                <a key={link.sectionKey} href={`#${getSectionDomAnchorId(link.sectionKey)}`} className={styles.linkChip}>
                  <span className={styles.linkLabel}>{link.label}</span>
                  <span className={styles.linkReason}>{link.reason}</span>
                </a>
              ))}
            </div>
          </section>
        ) : null}

        {showTimeline ? (
          <section className={styles.timelineSection} aria-label="命運投射">
            <div className={styles.sectionDivider}>
              <span>{vm.fateProjection.heading}</span>
            </div>
            <div className={styles.tThread} aria-hidden />
            {vm.fateProjection.nodes.map((n) => (
              <div key={`${vm.sectionKey}-${n.year}`} className={`${styles.tNode} ${n.isActive ? styles.tNodeActive : ""}`}>
                <div className={styles.tPoint} aria-hidden />
                <div className={styles.tYear}>
                  <span>{n.year}</span>
                  {n.badge ? <span className={`${styles.rune} ${styles.runeNow}`}>{n.badge}</span> : null}
                </div>
                <div className={styles.tDesc}>{n.description}</div>
              </div>
            ))}
          </section>
        ) : null}

        {veilActive && vm.premiumTeaser ? (
          <div className={styles.sealedDomain} aria-label="進階內容試讀">
            <div className={styles.sealedContent}>
              <div className={styles.sBlock}>
                <div className={`${styles.sLabel} ${styles.karmicLabel}`}>{vm.premiumTeaser.label}</div>
                <div className={styles.sText}>{vm.premiumTeaser.body}</div>
              </div>
            </div>
            <div className={styles.veilOverlay}>
              <div className={styles.veilIcon} aria-hidden>
                ✧
              </div>
              <h3 className={styles.veilTitle}>{vm.premiumTeaser.veilTitle}</h3>
              <p className={styles.veilDesc}>{vm.premiumTeaser.veilDescription}</p>
              <button type="button" className={styles.btnUnlock} onClick={() => onPremiumUnlock?.()} aria-label={vm.premiumTeaser.ctaLabel}>
                {vm.premiumTeaser.ctaLabel}
              </button>
            </div>
          </div>
        ) : null}
      </div>

      {showDebug ? (
        <div className={styles.debugHud}>
          [SYS.TRACE] {vm.sectionKey}
          <br />
          PALACE_PRESET: {resolvedId} ({preset.lifelineFamily})
          <br />
          STAR_COUNT: {vm.stars.length}
          <br />
          RES_CALIB: {resonance.calibration.kind}
          <br />
          SIGNALS_SRC: {vm.sourceTrace.signals}
          <br />
          DISPLAY_CODES: {vm.displaySignals.map((d) => d.code).join(",") || "—"}
          <br />
          STATUS_SRC: {vm.sourceTrace.status}
          <br />
          TIMELINE: {showTimeline ? "RENDERED" : "SKIPPED"}
          <br />
          GATE: {vm.gate.toUpperCase()}
          {vm.isLocked ? ` (${String(vm.lockReason ?? "LOCKED").slice(0, 24)})` : ""}
          <br />
          VEIL: {veilActive ? "ACTIVE" : "OFF"}
        </div>
      ) : null}
    </article>
  );
}
