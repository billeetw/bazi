/**
 * 根因診斷引擎：回答「你現在以為壞掉的是 B，真正漏的是 A」。
 * 不綁章節，輸出結構化 RootCauseFinding[]，供 s00／s03／12 宮取用。
 */

import type {
  DiagnosticEdge,
  PalaceSignal,
  RootCauseFinding,
  RootCauseType,
} from "./diagnosticTypes.js";
import { toPalaceCanonical } from "./canonicalKeys.js";

function normPalace(p: string): string {
  return toPalaceCanonical((p ?? "").trim());
}

/** R1 壓力外溢型：A宮 ji 飛入 B宮 */
function detectOverflow(edges: DiagnosticEdge[]): RootCauseFinding[] {
  const out: RootCauseFinding[] = [];
  const jiEdges = edges.filter(
    (e) => e.transformType === "ji" && e.fromPalace && e.toPalace && normPalace(e.fromPalace) !== normPalace(e.toPalace)
  );
  const seen = new Set<string>();
  for (const e of jiEdges) {
    const from = normPalace(e.fromPalace);
    const to = normPalace(e.toPalace);
    const key = from + "|" + to;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({
      id: "r1-overflow-" + from + "-" + to,
      type: "overflow",
      sourcePalace: from,
      symptomPalace: to,
      transformType: "ji",
      evidence: [`${from}化忌入${to}`],
      narrative: `你現在以為要處理的是${to}，但真正的破口其實在${from}。若${from}不先補，${to}只會反覆發作。`,
      advice: "先處理壓力源宮位，再處理症狀宮。",
    });
  }
  return out;
}

const SECURITY_PALACES = ["田宅宮", "財帛宮", "福德宮"];
const RELATION_PALACES = ["夫妻宮", "子女宮", "官祿宮", "僕役宮"];
const RELATION_PALACES_2 = ["夫妻宮", "僕役宮", "兄弟宮"];

/** R2 安全感轉譯型：source = 田宅/財帛/福德，symptom = 夫妻/子女/官祿/僕役，ji 流向 */
function detectTranslation(edges: DiagnosticEdge[]): RootCauseFinding[] {
  const out: RootCauseFinding[] = [];
  for (const e of edges) {
    if (e.transformType !== "ji") continue;
    const from = normPalace(e.fromPalace);
    const to = normPalace(e.toPalace);
    if (from === to) continue;
    const fromOk = SECURITY_PALACES.some((p) => from === p || from === p.replace(/宮$/, "") + "宮");
    const toOk = RELATION_PALACES.some((p) => to === p || to === p.replace(/宮$/, "") + "宮");
    if (!fromOk || !toOk) continue;
    out.push({
      id: "r2-translation-" + from + "-" + to,
      type: "translation",
      sourcePalace: from,
      symptomPalace: to,
      transformType: "ji",
      evidence: [`${from}化忌入${to}`],
      narrative: `你現在感受到的不是單純的${to}問題，而是${from}的不穩，被翻譯成了外在衝突。真正要補的不是表面關係，而是底層安全感。`,
      advice: "先穩住底層安全感與資源感，再處理關係與角色。",
    });
  }
  return out;
}

/** R3 過度補償型：同一 symptom 宮同時有 lu 與 ji，且某 source 對該宮有 ji */
function detectOvercompensation(
  edges: DiagnosticEdge[],
  palaceSignals: PalaceSignal[]
): RootCauseFinding[] {
  const out: RootCauseFinding[] = [];
  const symptomPalacesWithLuJi = new Set(
    palaceSignals
      .filter((ps) => {
        const in_ = ps.inTransforms;
        const out_ = ps.outTransforms;
        const hasLu = in_.includes("lu") || out_.includes("lu");
        const hasJi = in_.includes("ji") || out_.includes("ji");
        return hasLu && hasJi;
      })
      .map((ps) => normPalace(ps.palace))
  );
  for (const e of edges) {
    if (e.transformType !== "ji") continue;
    const from = normPalace(e.fromPalace);
    const to = normPalace(e.toPalace);
    if (from === to) continue;
    if (!symptomPalacesWithLuJi.has(to)) continue;
    out.push({
      id: "r3-overcomp-" + from + "-" + to,
      type: "overcompensation",
      sourcePalace: from,
      symptomPalace: to,
      transformType: "ji",
      evidence: [`${to}祿忌並見`, `${from}化忌入${to}`],
      narrative: `你表面上在加強${to}，其實是在補償${from}的不安。所以你越努力，越容易累。`,
      advice: "先處理源頭宮位的不安，再決定要在症狀宮加碼多少。",
    });
  }
  return out;
}

/** R4 關係代償型：source = 官祿/田宅/財帛/福德，symptom = 夫妻/僕役/兄弟，邊為 ji */
function detectRelationshipDisplacement(edges: DiagnosticEdge[]): RootCauseFinding[] {
  const out: RootCauseFinding[] = [];
  const sourceSet = new Set(["官祿宮", "田宅宮", "財帛宮", "福德宮"]);
  const symptomSet = new Set(["夫妻宮", "僕役宮", "兄弟宮"]);

  for (const e of edges) {
    if (e.transformType !== "ji") continue;
    const from = normPalace(e.fromPalace);
    const to = normPalace(e.toPalace);
    if (from === to) continue;
    if (!sourceSet.has(from)) continue;
    if (!symptomSet.has(to)) continue;
    out.push({
      id: "r4-rel-displace-" + from + "-" + to,
      type: "relationship_displacement",
      sourcePalace: from,
      symptomPalace: to,
      transformType: e.transformType === "ji" ? "ji" : undefined,
      evidence: [`${from}化忌入${to}`],
      narrative: `你現在以為是關係出了問題，其實是${from}的壓力先累積，最後在${to}被看見。所以先不要急著修補關係，先處理壓力源。`,
      advice: "先處理壓力源宮位，再修補關係。",
    });
  }
  return out;
}

/** 優先級：ji > quan+ji > lu+ji；source 為田宅/官祿/福德/財帛 優先級更高 */
function scoreRootCause(r: RootCauseFinding): number {
  let s = 0;
  if (r.transformType === "ji") s += 3;
  const highSource = ["田宅宮", "官祿宮", "福德宮", "財帛宮"].includes(r.sourcePalace);
  if (highSource) s += 2;
  if (r.type === "overflow") s += 1;
  if (r.type === "translation") s += 1;
  return s;
}

export function detectRootCauses(input: {
  edges: DiagnosticEdge[];
  palaceSignals: PalaceSignal[];
}): RootCauseFinding[] {
  const { edges, palaceSignals } = input;
  const all: RootCauseFinding[] = [];
  all.push(...detectOverflow(edges));
  all.push(...detectTranslation(edges));
  all.push(...detectOvercompensation(edges, palaceSignals));
  all.push(...detectRelationshipDisplacement(edges));

  all.sort((a, b) => scoreRootCause(b) - scoreRootCause(a));
  return all.slice(0, 3);
}
