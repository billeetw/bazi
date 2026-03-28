import { SECTION_KEY_TO_PALACE_ID, SECTION_ORDER, SECTION_PALACE_MAP } from "../../constants";
import type { PalaceId } from "../../themes/palaceVisualTheme";
import type { LifeBookUserSection, LifeBookViewerState } from "../../types";
import type { CtaVariant, GateContract, PreviewMode, ViewSignal, ViewStatus } from "../../viewmodels/contracts";
import { resolveGateContract } from "../../viewmodels/contracts";
import type { DisplaySignal } from "../../viewmodels/displaySignalTypes";
import { resolveSignals, type SignalResolveOutput } from "../../viewmodels/signalResolver";

export interface SectionRelatedTimeline {
  year?: number;
  focusMonth?: string;
  nodeId?: string;
}

export interface SectionFateProjectionNode {
  year: number;
  badge?: string;
  description: string;
  isActive?: boolean;
}

export interface SectionFateProjection {
  heading: string;
  nodes: SectionFateProjectionNode[];
}

export interface SectionPremiumTeaser {
  label: string;
  body: string;
  veilTitle: string;
  veilDescription: string;
  ctaLabel: string;
}

export interface SectionResonanceCalibration {
  kind: "balanced" | "caution" | "overburn";
  icon: string;
  badge: string;
  message: string;
}

export interface SectionResonanceCard {
  id: "daily" | "weekly" | "monthly";
  tagEn: string;
  tagZh: string;
  quote: string;
  alert?: boolean;
}

export interface SectionResonanceTrigger {
  id: string;
  label: string;
  scrollTargetId: string;
}

export interface SectionResonance {
  calibration: SectionResonanceCalibration;
  cards: SectionResonanceCard[];
  triggers: SectionResonanceTrigger[];
  archivesHeading: string;
}

export interface SectionStarItem {
  id: string;
  name: string;
  displayName: string;
  brightness?: string;
  isMain: boolean;
  glyph: string;
  intro: string;
  palaceExpression: string;
}

export interface SectionNarrativeBlocks {
  structure: string;
  behavior: string;
  blindSpots: string;
  strategicAdvice: string;
}

export interface SectionPalaceLink {
  sectionKey: string;
  label: string;
  reason: string;
}

/**
 * 宮位章節 ViewModel（Phase 1 骨架）
 *
 * - **骨架**：sectionKey、title、subtitle、palaceId（→ theme）、summary
 * - **狀態**：status、signals、primaryWarnings、recommendAction、whyItMatters
 * - **Gate**：gate、lockReason、previewMode、ctaVariant（isLocked 由 gate 衍生）
 * - **連動**：relatedTimeline（時間層）、relatedPalaceLinks（三方四正）
 * - **除錯**：sourceTrace（正式 UI 可不顯示）
 *
 * 殼層標題／副標若與 preset 並存：SectionPalaceTemplate 以 `palace-theme-presets` 的 displayNameZh／subtitleZh 為視覺主標，vm.title 仍可作 SEO／列印後備。
 */
export interface SectionViewModel {
  sectionKey: string;
  /** 對應 `palace-theme-presets.json` 的 palaceId，單一主題來源 */
  palaceId?: PalaceId;
  title: string;
  subtitle: string;
  gate: GateContract["gate"];
  lockReason?: string;
  status: ViewStatus;
  signals: ViewSignal[];
  /** 與 `signals` 同源；模板與新 UI 優先使用 */
  displaySignals: DisplaySignal[];
  summary: string;
  whyItMatters: string;
  recommendAction: string;
  primaryWarnings: string[];
  inertiaNarrative: string;
  /** 連回時間層（D. 連動） */
  relatedTimeline: SectionRelatedTimeline;
  fateProjection: SectionFateProjection;
  premiumTeaser: SectionPremiumTeaser | null;
  resonance: SectionResonance;
  /** 星曜可視化資料：支援點擊展開詳細 */
  stars: SectionStarItem[];
  /** 保留命書原有長文，避免只剩摘要 */
  preservedNarratives: SectionNarrativeBlocks;
  /** 三方四正／宮位連動（D. 連動；名稱同 spec 的 relatedPalaces） */
  relatedPalaceLinks: SectionPalaceLink[];
  ctaVariant: CtaVariant;
  sourceTrace: {
    status: "findings" | "time-module" | "keyword-fallback";
    signals: "findings" | "time-module" | "keyword-fallback";
    gate: "plan-access";
    summary: "section-raw";
  };
  previewMode: PreviewMode;
  isLocked: boolean;
}

function firstSentence(text: string | undefined, fallback: string): string {
  const t = String(text ?? "").trim();
  if (!t) return fallback;
  const cut = t.split(/[。！？\n]/).find((x) => x.trim().length > 0);
  return (cut ?? t).trim();
}

function splitWarnings(text: string | undefined): string[] {
  return String(text ?? "")
    .split(/[。\n]/)
    .map((x) => x.trim())
    .filter(Boolean)
    .slice(0, 3);
}

function clipText(s: string, max: number): string {
  const t = s.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

function secondChunk(text: string | undefined): string {
  const t = String(text ?? "").trim();
  if (!t) return "";
  const parts = t.split(/[。！？\n]/).map((x) => x.trim()).filter(Boolean);
  return parts.length > 1 ? parts[1] : parts[0] ?? "";
}

function normalizePalaceName(name: string): string {
  const t = name.trim();
  if (!t) return "";
  return t.endsWith("宮") ? t : `${t}宮`;
}

function parseStarName(raw: string): { name: string; displayName: string; brightness?: string } {
  const m = raw.trim().match(/^(.+?)[（(]([^）)]+)[）)]$/);
  if (!m) return { name: raw.trim(), displayName: raw.trim() };
  return {
    name: m[1].trim(),
    displayName: raw.trim(),
    brightness: m[2].trim(),
  };
}

function starGlyph(name: string): string {
  if (/紫微|天府|太陽|太陰/.test(name)) return "✦";
  if (/武曲|廉貞|七殺|破軍/.test(name)) return "◆";
  if (/文昌|文曲|天鉞|天魁|恩光|天貴/.test(name)) return "◇";
  if (/紅鸞|天喜/.test(name)) return "♥";
  return "◈";
}

function starFallbackIntro(name: string, brightness?: string): string {
  const b = brightness ? `（${brightness}）` : "";
  return `${name}${b} 代表你的內在驅動與決策偏好，會在關鍵時刻放大。`;
}

function buildPremiumTeaser(gate: GateContract, section: LifeBookUserSection): SectionPremiumTeaser {
  const deep = secondChunk(section.structure_analysis) || secondChunk(section.behavior_pattern);
  const lock = gate.lockReason?.trim();
  const bodyParts = [lock, deep].filter(Boolean);
  const body =
    bodyParts.length > 0
      ? clipText(bodyParts.join(" "), 220)
      : "此處記載更深層的宮位連動與流年序列。解鎖後可讀取完整宿命藍圖與對照敘事。";

  const lockedVeil = gate.isLocked || gate.gate === "locked";
  return {
    label: "業力羈絆 ✧ KARMIC BONDS",
    body,
    veilTitle: lockedVeil ? "高維度靈魂封印" : "宿命藍圖試讀",
    veilDescription: lockedVeil
      ? "此命運矩陣受大天使結界守護\n需提升靈魂權限，以讀取完整的宿命藍圖"
      : "目前為試讀模式。\n升級後可讀取完整深度矩陣與時序對照。",
    ctaLabel: premiumTeaserCtaLabel(gate.ctaVariant),
  };
}

function premiumTeaserCtaLabel(cta: CtaVariant): string {
  if (cta === "none" || cta === "details") return "了解解鎖方式";
  if (cta === "unlock") return "喚醒高階權限";
  if (cta === "upgrade-hard") return "喚醒高階權限";
  if (cta === "soft-upgrade") return "升級可讀範圍";
  if (cta === "upgrade") return "升級完整命書";
  return "了解解鎖方式";
}

function buildFateProjectionNodes(
  sectionKey: string,
  section: LifeBookUserSection,
  state: LifeBookViewerState,
  relatedYear?: number
): SectionFateProjectionNode[] {
  const chart = state.chart_json as Record<string, unknown> | null | undefined;
  const y1 = Number((chart?.yearlyHoroscope as { year?: unknown } | undefined)?.year);
  const y2 = Number((chart?.liunian as { year?: unknown } | undefined)?.year);
  const fromChart = Number.isFinite(y1) ? y1 : y2;
  const yRaw = relatedYear ?? fromChart;
  let year = Number.isFinite(yRaw) && yRaw > 1900 ? Math.floor(yRaw) : undefined;
  const currentY = new Date().getFullYear();
  const palace = String(section.title || "本宮").replace(/宮$/, "");
  const desc =
    sectionKey === "s02" || sectionKey === "s04"
      ? "命宮引動，能量匯聚於此。"
      : `${palace}宮引動，能量與流年交會於此。`;

  if (year == null && (sectionKey === "s02" || sectionKey === "s04")) {
    year = currentY;
  }
  if (year == null) return [];

  return [
    {
      year,
      description: desc,
      isActive: year === currentY,
      badge: year === currentY ? "當下" : undefined,
    },
  ];
}

function getMonthlyHoroscopeFromChart(chart: Record<string, unknown> | null | undefined): Record<string, unknown> | undefined {
  if (!chart) return undefined;
  const features = chart.features as Record<string, unknown> | undefined;
  const fz = features?.ziwei as Record<string, unknown> | undefined;
  const z = chart.ziwei as Record<string, unknown> | undefined;
  const raw =
    (z?.monthlyHoroscope as Record<string, unknown> | undefined) ??
    (z?.monthly as Record<string, unknown> | undefined) ??
    (fz?.monthlyHoroscope as Record<string, unknown> | undefined) ??
    (chart.monthlyHoroscope as Record<string, unknown> | undefined);
  return raw && typeof raw === "object" ? raw : undefined;
}

function pickFlowDayPillar(chart: Record<string, unknown> | null | undefined): string | null {
  if (!chart) return null;
  const z = chart.ziwei as Record<string, unknown> | undefined;
  const day = z?.day as { stem?: string; branch?: string } | undefined;
  if (day?.stem && day?.branch) return `${String(day.stem)}${String(day.branch)}`;
  const anchors = chart.anchors as { day?: { stem?: string; branch?: string } } | undefined;
  if (anchors?.day?.stem && anchors?.day?.branch) return `${String(anchors.day.stem)}${String(anchors.day.branch)}`;
  return null;
}

function riskPalaceHitsFlowPalace(flowPalace: string, riskPalaces: string[]): boolean {
  const fp = flowPalace.replace(/宮$/, "").trim();
  if (!fp) return false;
  return riskPalaces.some((r) => {
    const rp = String(r).replace(/宮$/, "").trim();
    return rp === fp || flowPalace.includes(rp);
  });
}

function flowMonthOnNativePalace(flowPalace: string, sectionKey: string): boolean {
  const canon = SECTION_PALACE_MAP[sectionKey];
  if (!canon) return false;
  const fp = flowPalace.replace(/宮$/, "").trim();
  return fp === canon;
}

function monthlyMutagenHasJi(m: Record<string, unknown>): boolean {
  const mut = m.mutagenStars as Record<string, unknown> | undefined;
  if (!mut) return false;
  return Object.entries(mut).some(([k, v]) => /忌/.test(k) || (typeof v === "string" && /忌/.test(v)));
}

function buildCalibration(signal: SignalResolveOutput, section: LifeBookUserSection): SectionResonanceCalibration {
  if (signal.status === "high_pressure" || signal.signals.includes("alert")) {
    return {
      kind: "overburn",
      icon: "🔥",
      badge: "CURRENT_STATE",
      message: firstSentence(section.blind_spots, "你現在不是沒能力，是能量不足還在硬撐。"),
    };
  }
  if (signal.status === "opportunity") {
    return {
      kind: "caution",
      icon: "✦",
      badge: "CURRENT_STATE",
      message: firstSentence(section.structure_analysis, "磁場有利推進，仍要留補給線與休息緩衝。"),
    };
  }
  return {
    kind: "balanced",
    icon: "◎",
    badge: "CURRENT_STATE",
    message: firstSentence(section.behavior_pattern, "節奏可調校—不必急著用爆發力證明價值。"),
  };
}

function buildResonanceTriggers(sectionKey: string): SectionResonanceTrigger[] {
  return [
    { id: `${sectionKey}-tr1`, label: "我最近一直想硬撐", scrollTargetId: `${sectionKey}-directive` },
    { id: `${sectionKey}-tr2`, label: "我不知道要不要做決定", scrollTargetId: `${sectionKey}-inertia` },
    { id: `${sectionKey}-tr3`, label: "我最近感到非常焦慮", scrollTargetId: `${sectionKey}-base` },
  ];
}

function buildSectionResonance(
  sectionKey: string,
  section: LifeBookUserSection,
  state: LifeBookViewerState,
  signal: SignalResolveOutput
): SectionResonance {
  const chart = state.chart_json as Record<string, unknown> | null | undefined;
  const monthly = getMonthlyHoroscopeFromChart(chart);
  const riskPalaces = state.weight_analysis?.risk_palaces ?? [];
  const dayPillar = pickFlowDayPillar(chart);

  const dailyQuote = (() => {
    if (dayPillar) {
      return `今日流日干支為「${dayPillar}」。${firstSentence(section.strategic_advice, "先穩住節奏，不急著對外證明。")}`;
    }
    if (monthly?.solarYear != null && monthly?.solarMonth != null && monthly?.solarDay != null) {
      const y = monthly.solarYear;
      const mo = monthly.solarMonth;
      const d = monthly.solarDay;
      return `流月錨點為 ${y}-${String(mo).padStart(2, "0")}-${String(d).padStart(2, "0")}。${firstSentence(section.behavior_pattern, "今日宜收斂火力，把力氣留給關鍵任務。")}`;
    }
    return firstSentence(section.strategic_advice, "今天適合先穩住節奏，不適合急著向外界證明自己。");
  })();

  const weeklyQuote =
    secondChunk(section.strategic_advice) ||
    secondChunk(section.behavior_pattern) ||
    "本週先顧睡眠與邊界，不要拿意志力去填補他人的漏洞。";

  const monthlyCard = (() => {
    if (!monthly) {
      const s19 = state.sections?.s19;
      const hint = s19 ? firstSentence(s19.structure_analysis, "") : "";
      if (hint && hint.length > 8) {
        return { quote: hint, alert: riskPalaces.length > 0 || signal.status === "high_pressure" };
      }
      return { quote: "流月資料待命盤與時間錨點更新後，會與本命宮位對齊顯示。", alert: false };
    }
    const palace = String(monthly.palace ?? "");
    const stem = String(monthly.stem ?? "");
    const branch = String(monthly.branch ?? "");
    const span = String(monthly.solarTermSpan ?? "").trim();
    let quote = `本月流月宮位在「${palace}」（${stem}${branch}）`;
    if (span) quote += `，${span}`;
    if (flowMonthOnNativePalace(palace, sectionKey)) {
      quote += `。流月疊上本命宮位「${palace}」，節奏變動感受會被放大，宜先校準身心再出手。`;
    } else {
      const shortTitle = section.title.replace(/綜合分析|分析/g, "").trim() || "本章";
      quote += `。可觀察此宮如何牽動「${shortTitle}」相關主題。`;
    }
    const alert =
      signal.status === "high_pressure" ||
      riskPalaceHitsFlowPalace(palace, riskPalaces) ||
      monthlyMutagenHasJi(monthly);
    return { quote, alert };
  })();

  return {
    calibration: buildCalibration(signal, section),
    cards: [
      { id: "daily", tagEn: "DAILY_WHISPER", tagZh: "今日提醒", quote: dailyQuote },
      { id: "weekly", tagEn: "WEEKLY_ANCHOR", tagZh: "本週指令", quote: weeklyQuote },
      {
        id: "monthly",
        tagEn: "MONTHLY_DRIFT",
        tagZh: "流月／偏移警報",
        quote: monthlyCard.quote,
        alert: monthlyCard.alert,
      },
    ],
    triggers: buildResonanceTriggers(sectionKey),
    archivesHeading: "CORE_ARCHIVES",
  };
}

function buildStarsForSection(sectionKey: string, section: LifeBookUserSection, state: LifeBookViewerState): SectionStarItem[] {
  const palace = normalizePalaceName(SECTION_PALACE_MAP[sectionKey] ?? "");
  if (!palace) return [];
  const z = (state.chart_json?.ziwei as Record<string, unknown> | undefined) ?? {};
  const mainStars = (z.mainStars as Record<string, unknown> | undefined) ?? (z.starByPalace as Record<string, unknown> | undefined) ?? {};
  const rawList = (mainStars[palace] as unknown[] | undefined) ?? (mainStars[palace.replace(/宮$/, "")] as unknown[] | undefined) ?? [];
  const names = rawList.filter((x): x is string => typeof x === "string" && x.trim().length > 0);

  const quotes = section.star_palace_quotes ?? {};
  const quoteEntries = Object.entries(quotes);

  return names.slice(0, 12).map((raw, idx) => {
    const parsed = parseStarName(raw);
    const matchingQuote = quoteEntries.find(([k]) => k.includes(parsed.name) && k.includes(palace));
    return {
      id: `${sectionKey}-star-${idx}`,
      name: parsed.name,
      displayName: parsed.displayName,
      brightness: parsed.brightness,
      isMain: idx === 0,
      glyph: starGlyph(parsed.name),
      intro: matchingQuote?.[1] ?? starFallbackIntro(parsed.name, parsed.brightness),
      palaceExpression: `在${palace}，${parsed.name}會直接影響你如何看待自己與關係中的界線。`,
    };
  });
}

function buildPreservedNarratives(section: LifeBookUserSection): SectionNarrativeBlocks {
  return {
    structure: String(section.structure_analysis ?? "").trim(),
    behavior: String(section.behavior_pattern ?? "").trim(),
    blindSpots: String(section.blind_spots ?? "").trim(),
    strategicAdvice: String(section.strategic_advice ?? "").trim(),
  };
}

function buildRelatedPalaceLinks(sectionKey: string): SectionPalaceLink[] {
  if (sectionKey === "s02" || sectionKey === "s04") {
    return [
      { sectionKey: "s10", label: "財帛宮", reason: "影響你怎麼賺錢與配置資源" },
      { sectionKey: "s08", label: "官祿宮", reason: "影響你怎麼做事與站位" },
      { sectionKey: "s12", label: "遷移宮", reason: "影響你在外部舞台的發展方式" },
    ];
  }
  return [];
}

function buildOneSectionVm(sectionKey: string, section: LifeBookUserSection, state: LifeBookViewerState): SectionViewModel {
  const gate = resolveGateContract(state.meta, sectionKey);
  const signal = resolveSignals({
    sectionKey,
    section,
    chartJson: state.chart_json ?? null,
    weight: state.weight_analysis ?? null,
  });
  const year = (state.chart_json?.yearlyHoroscope as { year?: number } | undefined)?.year;
  const monthly = (state.chart_json?.ziwei as { monthlyHoroscope?: { solarMonth?: number; month?: number } } | undefined)?.monthlyHoroscope;
  const focusMonthNum = monthly?.solarMonth ?? monthly?.month;
  const focusMonth = focusMonthNum != null ? `${String(focusMonthNum).padStart(2, "0")}月` : undefined;
  const sealed = gate.previewMode !== "full" || gate.isLocked;
  const primaryWarnings = splitWarnings(section.blind_spots);

  return {
    sectionKey,
    palaceId: SECTION_KEY_TO_PALACE_ID[sectionKey],
    title: section.title,
    subtitle: firstSentence(section.behavior_pattern, "核心敘事"),
    gate: gate.gate,
    lockReason: gate.lockReason,
    status: signal.status,
    signals: signal.signals,
    displaySignals: signal.displaySignals,
    summary: firstSentence(section.structure_analysis, "尚待補充"),
    whyItMatters: firstSentence(section.behavior_pattern, "此章節影響你的關鍵決策與節奏。"),
    recommendAction: firstSentence(section.strategic_advice, "先建立可持續的行動節奏。"),
    primaryWarnings,
    inertiaNarrative:
      primaryWarnings.length > 0
        ? primaryWarnings.join("；")
        : firstSentence(section.blind_spots, firstSentence(section.behavior_pattern, "慣性模式將隨流月校準而更加具體。")),
    relatedTimeline: {
      year,
      focusMonth,
      nodeId: year != null ? `y${year}` : undefined,
    },
    fateProjection: {
      heading: "FATE_PROJECTION",
      nodes: buildFateProjectionNodes(sectionKey, section, state, year),
    },
    premiumTeaser: sealed ? buildPremiumTeaser(gate, section) : null,
    resonance: buildSectionResonance(sectionKey, section, state, signal),
    stars: buildStarsForSection(sectionKey, section, state),
    preservedNarratives: buildPreservedNarratives(section),
    relatedPalaceLinks: buildRelatedPalaceLinks(sectionKey),
    ctaVariant: gate.ctaVariant,
    sourceTrace: {
      status: signal.sourceTrace.status,
      signals: signal.sourceTrace.signals,
      gate: "plan-access",
      summary: "section-raw",
    },
    previewMode: gate.previewMode,
    isLocked: gate.isLocked,
  };
}

export function buildSectionViewModels(state: LifeBookViewerState): SectionViewModel[] {
  const sections = state.sections ?? {};
  const keys = SECTION_ORDER.filter((k) => sections[k] != null);
  const fallback = Object.keys(sections).filter((k) => !keys.includes(k));
  return [...keys, ...fallback].map((key) => buildOneSectionVm(key, sections[key], state));
}

export function pickSectionViewModel(vms: SectionViewModel[], sectionKey: string): SectionViewModel | undefined {
  return vms.find((x) => x.sectionKey === sectionKey);
}
