/**
 * 四化 pattern detectors：R01 同星疊、R02 同宮祿疊、R03 同宮忌疊、R11 飛宮導線、R30 能量環
 */

import { toPalaceCanonical } from "../lifebook/canonicalKeys.js";
import type { SiHuaEvent, PatternHit } from "./types.js";

/** R01 同星疊：同一 star 在不同 layer ≥ 2 */
export function detectR01(events: SiHuaEvent[]): PatternHit[] {
  const byStar = new Map<string, SiHuaEvent[]>();
  for (const e of events) {
    if (!e.star) continue;
    const list = byStar.get(e.star) ?? [];
    list.push(e);
    byStar.set(e.star, list);
  }
  const hits: PatternHit[] = [];
  for (const [star, list] of byStar) {
    const layers = [...new Set(list.map((x) => x.layer))];
    if (layers.length < 2) continue;
    const severity = layers.length >= 3 ? 3 : 2;
    hits.push({
      ruleId: "R01",
      severity,
      summary: `此星（${star}）為命盤核心槓桿，多個時間層級都指向它。`,
      evidence: list,
      payload: { star, layers, canonicalKey: `star:${star}` },
    });
  }
  hits.sort((a, b) => (b.evidence.length - a.evidence.length) || (b.severity - a.severity));
  return hits;
}

/** R02 同宮祿疊：同一 toPalace 收到 祿 ≥ 2（跨層） */
export function detectR02(events: SiHuaEvent[]): PatternHit[] {
  const lu = events.filter((e) => e.transform === "祿" && e.toPalace);
  const byPalace = new Map<string, SiHuaEvent[]>();
  for (const e of lu) {
    const p = toPalaceCanonical(e.toPalace);
    const list = byPalace.get(p) ?? [];
    list.push(e);
    byPalace.set(p, list);
  }
  const hits: PatternHit[] = [];
  for (const [palace, list] of byPalace) {
    const layers = [...new Set(list.map((x) => x.layer))];
    if (layers.length < 2) continue;
    const severity = layers.length >= 3 ? 3 : 2;
    hits.push({
      ruleId: "R02",
      severity,
      summary: `${palace}為資源集中宮位，多層祿星匯聚。`,
      evidence: list,
      payload: { toPalace: palace, transform: "祿", canonicalKey: `to:${palace}|t:祿` },
    });
  }
  return hits;
}

/** R03 同宮忌疊：同一 toPalace 收到 忌 ≥ 2 */
export function detectR03(events: SiHuaEvent[]): PatternHit[] {
  const ji = events.filter((e) => e.transform === "忌" && e.toPalace);
  const byPalace = new Map<string, SiHuaEvent[]>();
  for (const e of ji) {
    const p = toPalaceCanonical(e.toPalace);
    const list = byPalace.get(p) ?? [];
    list.push(e);
    byPalace.set(p, list);
  }
  const hits: PatternHit[] = [];
  for (const [palace, list] of byPalace) {
    const layers = [...new Set(list.map((x) => x.layer))];
    if (layers.length < 2) continue;
    const severity = layers.length >= 3 ? 3 : 2;
    hits.push({
      ruleId: "R03",
      severity,
      summary: `${palace}為壓力集中宮位，多層忌星匯聚。`,
      evidence: list,
      payload: { toPalace: palace, transform: "忌", canonicalKey: `to:${palace}|t:忌` },
    });
  }
  return hits;
}

/** R11 飛宮導線：每筆 from→to（忌優先，但支援祿權科忌） */
export function detectR11(events: SiHuaEvent[]): PatternHit[] {
  const hits: PatternHit[] = [];
  const order = { 忌: 4, 權: 3, 祿: 2, 科: 1 };
  const withFromTo = events.filter((e) => e.fromPalace && e.toPalace);
  for (const e of withFromTo) {
    const from = toPalaceCanonical(e.fromPalace);
    const to = toPalaceCanonical(e.toPalace);
    const star = e.star || "星";
    const severity = e.transform === "忌" ? 3 : e.transform === "權" ? 2 : 1;
    hits.push({
      ruleId: "R11",
      severity,
      summary: `${star}化${e.transform}：${from} → ${to}。壓力源頭在${from}，顯化在${to}。`,
      evidence: [e],
      payload: {
        fromPalace: from,
        toPalace: to,
        transform: e.transform,
        star: e.star,
        canonicalKey: `from:${from}|to:${to}|t:${e.transform}`,
      },
    });
  }
  hits.sort((a, b) => (order[(b.payload.transform as keyof typeof order) ?? "科"] - order[(a.payload.transform as keyof typeof order) ?? "科"]));
  return hits;
}

/** R30 能量環：2 或 3 宮有向環 */
export function detectR30(events: SiHuaEvent[]): PatternHit[] {
  const edges = events
    .filter((e) => e.fromPalace && e.toPalace)
    .map((e) => ({ from: toPalaceCanonical(e.fromPalace!), to: toPalaceCanonical(e.toPalace!), event: e }));
  const adj = new Map<string, Array<{ to: string; event: SiHuaEvent }>>();
  for (const { from, to, event } of edges) {
    const list = adj.get(from) ?? [];
    list.push({ to, event });
    adj.set(from, list);
  }

  const cycles: Array<{ nodes: string[]; events: SiHuaEvent[] }> = [];
  const visit = (start: string, path: string[], pathSet: Set<string>, evs: SiHuaEvent[], maxLen: number) => {
    if (path.length >= maxLen) return;
    const nextList = adj.get(start) ?? [];
    for (const { to, event } of nextList) {
      if (to === path[0] && path.length >= 2) {
        cycles.push({ nodes: [...path], events: [...evs, event] });
        return;
      }
      if (pathSet.has(to)) continue;
      pathSet.add(to);
      path.push(to);
      evs.push(event);
      visit(to, path, pathSet, evs, maxLen);
      path.pop();
      evs.pop();
      pathSet.delete(to);
    }
  };

  const allNodes = new Set<string>();
  for (const { from, to } of edges) {
    allNodes.add(from);
    allNodes.add(to);
  }
  for (const node of allNodes) {
    visit(node, [node], new Set([node]), [], 4);
  }

  const hits: PatternHit[] = [];
  const seen = new Set<string>();
  for (const { nodes, events: evs } of cycles) {
    const key = [...nodes].sort().join("→");
    if (seen.has(key)) continue;
    seen.add(key);
    hits.push({
      ruleId: "R30",
      severity: nodes.length >= 3 ? 3 : 2,
      summary: `能量環：${nodes.join(" → ")}，事件易在此循環。`,
      evidence: evs,
      payload: { loop: nodes, canonicalKey: `loop:${key}` },
    });
  }
  return hits;
}

const RULE_ORDER = ["R01", "R02", "R03", "R30", "R11"];
function orderRank(ruleId: string): number {
  const i = RULE_ORDER.indexOf(ruleId);
  return i >= 0 ? i : 99;
}

export function runAllDetectors(events: SiHuaEvent[]): PatternHit[] {
  const all: PatternHit[] = [
    ...detectR01(events),
    ...detectR02(events),
    ...detectR03(events),
    ...detectR30(events),
    ...detectR11(events),
  ];
  all.sort((a, b) => orderRank(a.ruleId) - orderRank(b.ruleId));
  return all;
}
