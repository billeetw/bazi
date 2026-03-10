/**
 * 張力引擎：規則化找出「這張盤最有拉扯感的地方」。
 * 不綁章節，輸出結構化 TensionFinding[]，供 s00／s03／12 宮／模組二取用。
 */

import type {
  DiagnosticEdge,
  PalaceSignal,
  TensionFinding,
  TransformType,
} from "./diagnosticTypes.js";
import { toPalaceCanonical } from "./canonicalKeys.js";

const MOVING_STARS = ["天馬", "破軍", "七殺", "貪狼"];
const STABILIZING_STARS = ["武曲", "天府", "太陰", "天梁"];

/** 命主分類（與 destinyBodyDialogue 對齊） */
const DESTINY_STAR_TO_CATEGORY: Record<string, string> = {
  巨門: "思辨型", 文昌: "思辨型", 天機: "思辨型",
  貪狼: "感受型", 文曲: "感受型", 太陰: "感受型", 天同: "感受型",
  廉貞: "權力型", 紫微: "權力型", 七殺: "權力型",
  武曲: "實作型", 祿存: "實作型", 天府: "實作型", 天梁: "實作型", 天相: "實作型",
  破軍: "變動型", 太陽: "變動型",
};
/** 身主分類 */
const BODY_STAR_TO_CATEGORY: Record<string, string> = {
  火星: "爆發型", 鈴星: "爆發型", 七殺: "爆發型",
  武曲: "穩推型", 天府: "穩推型", 天梁: "穩推型",
  天同: "柔化型", 太陰: "柔化型", 文曲: "柔化型",
  破軍: "開創型", 貪狼: "開創型",
  天機: "策略型", 天相: "策略型", 文昌: "策略型", 巨門: "策略型",
};

/** 命主×身主張力標籤（思辨型+爆發型 → 想很多衝很快 等） */
const DESTINY_BODY_TENSION_LABEL: Record<string, Record<string, string>> = {
  思辨型: { 爆發型: "想很多衝很快" },
  實作型: { 爆發型: "想穩卻常被逼著突破" },
  變動型: { 穩推型: "想擴張卻習慣保守" },
  權力型: { 柔化型: "想主導但行動偏柔", 策略型: "想主導但行動偏柔" },
  感受型: { 爆發型: "想和諧但出手偏硬" },
};
function getDestinyBodyTensionLabel(destinyCat: string, bodyCat: string): string | null {
  const row = DESTINY_BODY_TENSION_LABEL[destinyCat];
  if (!row) return null;
  return row[bodyCat] ?? null;
}

/** 宮位語義類別（用於 T6 跨場域） */
const PALACE_DOMAINS: Record<string, string> = {
  命宮: "self",
  財帛宮: "resource",
  官祿宮: "career",
  夫妻宮: "relationship",
  田宅宮: "security",
  福德宮: "inner",
  疾厄宮: "health",
  子女宮: "creation",
  僕役宮: "network",
  父母宮: "authority",
  兄弟宮: "peer",
  遷移宮: "external",
};

function normPalace(p: string): string {
  return toPalaceCanonical((p ?? "").trim());
}

function getDomain(palace: string): string {
  const key = normPalace(palace);
  return PALACE_DOMAINS[key] ?? PALACE_DOMAINS[key.replace(/宮$/, "") + "宮"] ?? "";
}

/** 三方四正同主線：命—遷、財—官—福德、兄—僕—田、夫—子—父；同組視為同主線 */
const SANFANG_GROUPS: string[][] = [
  ["命宮", "遷移宮"],
  ["財帛宮", "官祿宮", "福德宮"],
  ["兄弟宮", "僕役宮", "田宅宮"],
  ["夫妻宮", "子女宮", "父母宮"],
];
function sameMainLine(p1: string, p2: string): boolean {
  const a = normPalace(p1);
  const b = normPalace(p2);
  if (a === b) return true;
  for (const group of SANFANG_GROUPS) {
    if (group.includes(a) && group.includes(b)) return true;
  }
  return false;
}

/** T1 同宮祿忌並見 */
function detectLuJiSamePalace(palaceSignals: PalaceSignal[]): TensionFinding[] {
  const out: TensionFinding[] = [];
  for (const ps of palaceSignals) {
    const hasLu = ps.inTransforms.includes("lu") || ps.outTransforms.includes("lu");
    const hasJi = ps.inTransforms.includes("ji") || ps.outTransforms.includes("ji");
    if (hasLu && hasJi) {
      out.push({
        id: "t1-luji-" + normPalace(ps.palace),
        label: "機會與壓力並存",
        severity: "medium",
        palaces: [normPalace(ps.palace)],
        evidence: [`${normPalace(ps.palace)}同時有化祿與化忌`],
        narrative: "這裡不是單純壞，而是「一邊得到、一邊承受」。",
        cost: "若只看到機會而忽略壓力，容易在最有感的地方反覆失衡。",
        advice: "先承認這裡同時有紅利與成本，再決定要加碼還是設停損。",
      });
    }
  }
  return out;
}

/** T2 同宮權忌並見 */
function detectQuanJiSamePalace(palaceSignals: PalaceSignal[]): TensionFinding[] {
  const out: TensionFinding[] = [];
  for (const ps of palaceSignals) {
    const hasQuan = ps.inTransforms.includes("quan") || ps.outTransforms.includes("quan");
    const hasJi = ps.inTransforms.includes("ji") || ps.outTransforms.includes("ji");
    if (hasQuan && hasJi) {
      out.push({
        id: "t2-quanji-" + normPalace(ps.palace),
        label: "責任過載",
        severity: "high",
        palaces: [normPalace(ps.palace)],
        evidence: [`${normPalace(ps.palace)}同時有化權與化忌`],
        narrative: "這裡不只是壓力點，也是責任點，很多事最後會落到你身上處理。",
        cost: "若長期硬撐，原本能累積的優勢會慢慢變成內耗。",
        advice: "先分配責任，再決定要不要加碼投入。",
      });
    }
  }
  return out;
}

/** T3 變動星 vs 收斂星同宮 */
function detectMovingVsStabilizing(palaceSignals: PalaceSignal[]): TensionFinding[] {
  const out: TensionFinding[] = [];
  for (const ps of palaceSignals) {
    const main = ps.mainStars ?? [];
    const hasMoving = main.some((s) => MOVING_STARS.includes(s));
    const hasStabilizing = main.some((s) => STABILIZING_STARS.includes(s));
    if (hasMoving && hasStabilizing) {
      out.push({
        id: "t3-move-stab-" + normPalace(ps.palace),
        label: "拉扯的靈魂",
        severity: "high",
        palaces: [normPalace(ps.palace)],
        stars: main,
        evidence: [`${normPalace(ps.palace)}同時有變動星與收斂星`],
        narrative: "一邊想往外衝，一邊又想守住根基。",
        cost: "容易在「該衝」與「該守」之間反覆擺盪，耗能。",
        advice: "先定一個主線（衝或守），讓另一邊當配角，不要同時當兩邊的主角。",
      });
    }
  }
  return out;
}

/** T4 命主 vs 身主節奏不一致 */
function detectDestinyBodyMismatch(
  destinyStar: string | undefined,
  bodyStar: string | undefined
): TensionFinding[] {
  if (!destinyStar?.trim() || !bodyStar?.trim()) return [];
  const dCat = DESTINY_STAR_TO_CATEGORY[destinyStar] ?? "實作型";
  const bCat = BODY_STAR_TO_CATEGORY[bodyStar] ?? "策略型";
  const label = getDestinyBodyTensionLabel(dCat, bCat);
  if (!label) return [];
  return [{
    id: "t4-destiny-body",
    label,
    severity: "medium",
    palaces: [],
    stars: [destinyStar, bodyStar],
    evidence: [`命主${destinyStar}（${dCat}）、身主${bodyStar}（${bCat}）`],
    narrative: "命主與身主的節奏不一致，內在渴望與外在行動方式常會打架。",
    cost: "容易在關鍵時刻猶豫或衝過頭。",
    advice: "用命主定方向，用身主帶動行動，練到兩者能同一套節奏。",
  }];
}

/** T5 命宮 vs 身宮錯位 */
function detectMingBodyPalaceMismatch(
  mingPalace: string | undefined,
  bodyPalace: string | undefined
): TensionFinding[] {
  if (!mingPalace?.trim() || !bodyPalace?.trim()) return [];
  const ming = normPalace(mingPalace);
  const body = normPalace(bodyPalace);
  if (ming === body) return [];
  const sameLine = sameMainLine(ming, body);
  return [{
    id: "t5-ming-body-palace",
    label: sameLine ? "想的與感受的不同步" : "人生重心錯位",
    severity: sameLine ? "medium" : "high",
    palaces: [ming, body],
    evidence: [`命宮${ming}、身宮${body}`],
    narrative: sameLine
      ? "想的與感受的在不同宮但同一主線，容易有不同步感。"
      : "人生體感會落在與自我定位不同的場域，容易覺得想的方向和真正有感的領域不太一樣。",
    cost: "在錯誤的場域拼命努力，或忽略真正敏感的地方。",
    advice: "認清身宮才是你真正敏感的地方，決策與資源可以多放一點在那裡。",
  }];
}

/** 語義差異大的 (sourceDomain -> symptomDomain) 視為高張力 */
const CROSS_DOMAIN_HIGH: Array<[string, string]> = [
  ["security", "relationship"],
  ["career", "relationship"],
  ["resource", "inner"],
  ["authority", "self"],
];

/** T6 A宮化忌入B宮且語義差異大 */
function detectCrossDomainJi(edges: DiagnosticEdge[]): TensionFinding[] {
  const out: TensionFinding[] = [];
  const jiEdges = edges.filter(
    (e) =>
      e.transformType === "ji" &&
      e.fromPalace &&
      e.toPalace &&
      normPalace(e.fromPalace) !== normPalace(e.toPalace)
  );
  const seen = new Set<string>();
  for (const e of jiEdges) {
    const from = normPalace(e.fromPalace);
    const to = normPalace(e.toPalace);
    const dFrom = getDomain(from);
    const dTo = getDomain(to);
    if (!dFrom || !dTo || dFrom === dTo) continue;
    const high = CROSS_DOMAIN_HIGH.some(([a, b]) => dFrom === a && dTo === b);
    if (!high) continue;
    const key = from + "|" + to;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({
      id: "t6-cross-" + from + "-" + to,
      label: "跨場域外溢",
      severity: "high",
      palaces: [from, to],
      evidence: [`${from}化忌入${to}`],
      narrative: "壓力從一個場域累積，最後在另一個場域被看見，容易誤以為問題在症狀宮。",
      cost: "若只處理症狀宮，源頭不補會反覆發作。",
      advice: "先處理壓力源宮位，再處理被波及的場域。",
    });
  }
  return out;
}

export function detectTensions(input: {
  edges: DiagnosticEdge[];
  palaceSignals: PalaceSignal[];
  destinyStar?: string;
  bodyStar?: string;
  mingPalace?: string;
  bodyPalace?: string;
}): TensionFinding[] {
  const {
    edges,
    palaceSignals,
    destinyStar,
    bodyStar,
    mingPalace,
    bodyPalace,
  } = input;

  const all: TensionFinding[] = [];
  all.push(...detectLuJiSamePalace(palaceSignals));
  all.push(...detectQuanJiSamePalace(palaceSignals));
  all.push(...detectMovingVsStabilizing(palaceSignals));
  all.push(...detectDestinyBodyMismatch(destinyStar, bodyStar));
  all.push(...detectMingBodyPalaceMismatch(mingPalace, bodyPalace));
  all.push(...detectCrossDomainJi(edges));

  const severityOrder = { high: 0, medium: 1, low: 2 };
  all.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
  return all;
}
