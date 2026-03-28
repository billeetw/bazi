import type { LifeBookUserSection, WeightAnalysis } from "../types";
import type { DisplaySignal } from "./displaySignalTypes";
import type { ViewSignal, ViewStatus } from "./contracts";

export interface SignalResolveInput {
  sectionKey: string;
  section: LifeBookUserSection;
  chartJson: Record<string, unknown> | null;
  weight: WeightAnalysis | null;
}

export type SignalLayerTrace = "findings" | "time-module" | "keyword-fallback";

export interface SignalResolveOutput {
  status: ViewStatus;
  signals: ViewSignal[];
  /** 與 `signals` 同源；畫面優先使用此陣列（語意碼 + 標籤） */
  displaySignals: DisplaySignal[];
  sourceTrace: {
    status: SignalLayerTrace;
    signals: SignalLayerTrace;
  };
}

function traceToDisplaySource(layer: SignalLayerTrace): DisplaySignal["source"] {
  if (layer === "keyword-fallback") return "keyword";
  return layer;
}

const VIEW_TO_CODE: Record<ViewSignal, DisplaySignal["code"]> = {
  alert: "health_warning",
  wealth: "wealth_opportunity",
  career: "career_push",
  love: "relationship_tension",
};

const CODE_LABEL: Record<DisplaySignal["code"], string> = {
  health_warning: "盲區風險",
  wealth_opportunity: "資源機運",
  career_push: "角色使命",
  career_pressure: "角色壓力",
  relationship_tension: "關係連結",
  inner_drift: "內在漂移",
};

/**
 * 將既有 ViewSignal[] 轉成 DisplaySignal[]（與 resolveSignals 分層來源對齊）。
 * 同一 code 只保留第一筆，順序維持與 viewSignals 一致。
 */
export function viewSignalsToDisplaySignals(
  viewSignals: ViewSignal[],
  signalsLayer: SignalLayerTrace
): DisplaySignal[] {
  const source = traceToDisplaySource(signalsLayer);
  const seen = new Set<DisplaySignal["code"]>();
  const out: DisplaySignal[] = [];
  for (const vs of viewSignals) {
    const code = VIEW_TO_CODE[vs];
    if (seen.has(code)) continue;
    seen.add(code);
    out.push({
      code,
      label: CODE_LABEL[code],
      severity: vs === "alert" ? "high" : "medium",
      source,
    });
  }
  return out;
}

function attachDisplay(s: Omit<SignalResolveOutput, "displaySignals">): SignalResolveOutput {
  return {
    ...s,
    displaySignals: viewSignalsToDisplaySignals(s.signals, s.sourceTrace.signals),
  };
}

function fromFindings(input: SignalResolveInput): SignalResolveOutput | null {
  const findings = (input.chartJson as { findings?: Record<string, unknown> } | null)?.findings;
  const bySection = (findings?.sectionSignals as Record<string, unknown> | undefined)?.[input.sectionKey];
  if (!bySection || typeof bySection !== "object") return null;
  const status = String((bySection as { status?: string }).status ?? "").toLowerCase();
  const s: ViewStatus = status === "high_pressure" || status === "opportunity" ? (status as ViewStatus) : "neutral";
  const sigRaw = (bySection as { signals?: unknown[] }).signals;
  const signals = Array.isArray(sigRaw)
    ? sigRaw.filter((x): x is ViewSignal => ["alert", "wealth", "career", "love"].includes(String(x)))
    : [];
  if (signals.length === 0) return null;
  return attachDisplay({
    status: s,
    signals,
    sourceTrace: { status: "findings", signals: "findings" },
  });
}

function fromTimeModule(input: SignalResolveInput): SignalResolveOutput | null {
  const y = (input.chartJson?.yearlyHoroscope as { year?: number } | undefined)?.year;
  const liunianPalace = String((input.chartJson?.liunian as { palace?: string } | undefined)?.palace ?? "");
  if (!y && !liunianPalace) return null;
  const riskPalaces = input.weight?.risk_palaces ?? [];
  const stablePalaces = input.weight?.stable_palaces ?? [];
  const signals: ViewSignal[] = [];
  if (riskPalaces.length > 0) signals.push("alert");
  if (stablePalaces.length > 0) signals.push("wealth");
  if (/官祿|事業|工作/.test(liunianPalace + input.section.title)) signals.push("career");
  if (/夫妻|關係|感情/.test(liunianPalace + input.section.title)) signals.push("love");
  const status: ViewStatus = riskPalaces.length > 0 ? "high_pressure" : stablePalaces.length > 0 ? "opportunity" : "neutral";
  return attachDisplay({
    status,
    signals: signals.length > 0 ? signals : ["career"],
    sourceTrace: { status: "time-module", signals: "time-module" },
  });
}

function fromKeywordFallback(input: SignalResolveInput): SignalResolveOutput {
  const t = `${input.section.title} ${input.section.structure_analysis} ${input.section.blind_spots}`;
  const signals: ViewSignal[] = [];
  if (/危|壓|忌|風險/.test(t)) signals.push("alert");
  if (/財|資源|收益|祿/.test(t)) signals.push("wealth");
  if (/官|職|事業|工作/.test(t)) signals.push("career");
  if (/夫妻|感情|關係|桃花/.test(t)) signals.push("love");
  const status: ViewStatus = signals.includes("alert") ? "high_pressure" : signals.includes("wealth") ? "opportunity" : "neutral";
  return attachDisplay({
    status,
    signals: signals.length > 0 ? signals : ["career"],
    sourceTrace: { status: "keyword-fallback", signals: "keyword-fallback" },
  });
}

/**
 * 優先序固定：findings > time-module > keyword fallback
 */
export function resolveSignals(input: SignalResolveInput): SignalResolveOutput {
  return fromFindings(input) ?? fromTimeModule(input) ?? fromKeywordFallback(input);
}

/** 純函式：與 {@link resolveSignals} 同源，只回傳呈現層訊號。 */
export function resolveDisplaySignals(input: SignalResolveInput): DisplaySignal[] {
  return resolveSignals(input).displaySignals;
}

