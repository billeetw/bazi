/**
 * 穿透式診斷聚合器：從 edges + palaceSignals 產出 DiagnosticBundle。
 * 供 s00／s03／12 宮／模組二共用；不綁章節模板。
 */

import type {
  DiagnosticBundle,
  DiagnosticEdge,
  PalaceSignal,
  TransformType,
} from "./diagnosticTypes.js";
import { toPalaceCanonical } from "./canonicalKeys.js";
import { detectTensions } from "./tensionEngine.js";
import { detectRootCauses } from "./rootCauseEngine.js";
import { buildReframedNarrative } from "./reframingEngine.js";

const PALACE_IDS = [
  "命宮", "兄弟宮", "夫妻宮", "子女宮", "財帛宮", "疾厄宮",
  "遷移宮", "僕役宮", "官祿宮", "田宅宮", "福德宮", "父母宮",
];

function norm(p: string): string {
  return toPalaceCanonical((p ?? "").trim());
}

/**
 * 從 edges（及可選 starByPalace）組出 PalaceSignal[]。
 * 宮位以 canonical 名（含「宮」）為 key。
 */
export function buildPalaceSignalsFromEdges(
  edges: DiagnosticEdge[],
  options?: { starByPalace?: Record<string, string[]> }
): PalaceSignal[] {
  const inMap = new Map<string, Set<TransformType>>();
  const outMap = new Map<string, Set<TransformType>>();

  for (const p of PALACE_IDS) {
    inMap.set(p, new Set());
    outMap.set(p, new Set());
  }

  for (const e of edges) {
    const from = norm(e.fromPalace);
    const to = norm(e.toPalace);
    if (!from || !to) continue;
    if (!inMap.has(to)) inMap.set(to, new Set());
    if (!outMap.has(from)) outMap.set(from, new Set());
    inMap.get(to)!.add(e.transformType);
    outMap.get(from)!.add(e.transformType);
  }

  const starByPalace = options?.starByPalace ?? {};
  const signals: PalaceSignal[] = [];

  for (const palace of PALACE_IDS) {
    const inTransforms = [...(inMap.get(palace) ?? [])];
    const outTransforms = [...(outMap.get(palace) ?? [])];
    const mainStars: string[] = [];
    for (const [key, list] of Object.entries(starByPalace)) {
      const canon = norm(key);
      if (canon === palace && Array.isArray(list)) mainStars.push(...list);
    }
    signals.push({
      palace,
      inTransforms,
      outTransforms,
      hasMainStar: mainStars.length > 0,
      mainStars: mainStars.length > 0 ? mainStars : undefined,
    });
  }
  return signals;
}

/**
 * 從 edges + tensions + rootCauses 推導 reframe 用的 key 列表（如「官祿宮忌入夫妻宮」「財帛宮祿忌並見」）。
 */
function deriveReframeKeys(
  edges: DiagnosticEdge[],
  palaceSignals: PalaceSignal[]
): string[] {
  const keys: string[] = [];
  for (const e of edges) {
    const from = norm(e.fromPalace);
    const to = norm(e.toPalace);
    if (e.transformType === "ji" && from !== to) {
      keys.push(`${from.replace(/宮$/, "")}宮忌入${to.replace(/宮$/, "")}宮`);
    }
  }
  for (const ps of palaceSignals) {
    const p = norm(ps.palace);
    const short = p.replace(/宮$/, "");
    const in_ = ps.inTransforms;
    const out_ = ps.outTransforms;
    if (in_.includes("ji") || out_.includes("ji")) keys.push(`${short}宮忌`);
    if ((in_.includes("lu") || out_.includes("lu")) && (in_.includes("ji") || out_.includes("ji")))
      keys.push(`${short}宮祿忌並見`);
    if ((in_.includes("quan") || out_.includes("quan")) && (in_.includes("ji") || out_.includes("ji")))
      keys.push(`${short}宮權忌`);
    if (in_.includes("quan") || out_.includes("quan")) keys.push(`${short}宮權`);
  }
  return keys;
}

export interface DiagnosticInput {
  edges: DiagnosticEdge[];
  palaceSignals: PalaceSignal[];
  destinyStar?: string;
  bodyStar?: string;
  mingPalace?: string;
  bodyPalace?: string;
  starByPalace?: Record<string, string[]>;
}

/**
 * 產出完整診斷包：tensions、rootCauses、reframes。
 */
export function buildDiagnosticBundle(input: DiagnosticInput): DiagnosticBundle {
  const {
    edges,
    palaceSignals,
    destinyStar,
    bodyStar,
    mingPalace,
    bodyPalace,
  } = input;

  const tensions = detectTensions({
    edges,
    palaceSignals,
    destinyStar,
    bodyStar,
    mingPalace,
    bodyPalace,
  });

  const rootCauses = detectRootCauses({ edges, palaceSignals });

  const reframeKeys = deriveReframeKeys(edges, palaceSignals);
  const reframes = buildReframedNarrative(reframeKeys);

  return {
    tensions,
    rootCauses,
    reframes,
  };
}
