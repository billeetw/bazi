/**
 * 四化論斷 5 個 pattern detector（R01/R02_LU/R02_JI/R30/R03/R11）
 * 共同輸入：NormalizedSiHuaEvent[]；輸出：PatternHitV2[]（含 evidence 事件列表、severity、summary）
 */

import { toPalaceCanonical } from "./canonicalKeys.js";
import type {
  NormalizedSiHuaEvent,
  PatternHitV2,
  RuleIdV2,
  Severity,
} from "./s00UnifiedTypes.js";
import { LAYER_LABEL, TRANSFORM_LABEL } from "./s00UnifiedTypes.js";

const CORE_PALACES = new Set(["命宮", "官祿宮", "財帛宮", "夫妻宮"]);

function starKey(ev: NormalizedSiHuaEvent): string {
  return ev.starId ?? ev.starNameZh ?? "";
}

function severityOrder(t: string): number {
  return t === "ji" ? 4 : t === "quan" ? 3 : t === "ke" ? 2 : 1;
}

/** R01 同星疊：同一 star 在不同 layer ≥ 2；canonicalKey star:<starId> */
function detectR01(events: NormalizedSiHuaEvent[]): PatternHitV2[] {
  const byStar = new Map<string, NormalizedSiHuaEvent[]>();
  for (const e of events) {
    const k = starKey(e);
    if (!k) continue;
    const list = byStar.get(k) ?? [];
    list.push(e);
    byStar.set(k, list);
  }
  const hits: PatternHitV2[] = [];
  for (const [star, list] of byStar) {
    const layers = [...new Set(list.map((e) => e.layer))];
    if (layers.length < 2) continue;
    const severity: Severity = layers.length >= 3 ? "high" : "medium";
    const starName = list[0].starNameZh ?? list[0].starId ?? star;
    const summary =
      severity === "high"
        ? `這顆星（${starName}）是此局的核心主題。你的人生很多事件都會圍繞它展開。`
        : `這顆星（${starName}）在不同時間層級被重複點名，代表它會反覆成為你的決策焦點。`;
    hits.push({
      ruleId: "R01",
      title: "同星疊（靈魂主角）",
      severity,
      summary,
      evidence: list,
      payload: { starId: star, starNameZh: starName, layers, canonicalKey: `star:${star}` },
    });
  }
  hits.sort((a, b) => {
    const la = (a.evidence as NormalizedSiHuaEvent[]).length;
    const lb = (b.evidence as NormalizedSiHuaEvent[]).length;
    if (lb !== la) return lb - la;
    const maxA = Math.max(...(a.evidence as NormalizedSiHuaEvent[]).map((e) => severityOrder(e.transform)));
    const maxB = Math.max(...(b.evidence as NormalizedSiHuaEvent[]).map((e) => severityOrder(e.transform)));
    return maxB - maxA;
  });
  return hits;
}

/** R02_LU 同宮祿疊：同一 toPalace，transform=祿，跨 layer ≥ 2 */
function detectR02Lu(events: NormalizedSiHuaEvent[]): PatternHitV2[] {
  const lu = events.filter((e) => e.transform === "lu" && e.toPalace);
  const byPalace = new Map<string, NormalizedSiHuaEvent[]>();
  for (const e of lu) {
    const p = e.toPalace!;
    const list = byPalace.get(p) ?? [];
    list.push(e);
    byPalace.set(p, list);
  }
  const hits: PatternHitV2[] = [];
  for (const [palace, list] of byPalace) {
    const layers = [...new Set(list.map((e) => e.layer))];
    if (layers.length < 2) continue;
    const severity: Severity = layers.length >= 3 ? "high" : "medium";
    const summary =
      severity === "high"
        ? `這個宮位（${palace}）是命盤中的資源匯聚點。很多機會會在這裡出現。`
        : `這個領域（${palace}）容易出現資源與機會，適合長期經營。`;
    hits.push({
      ruleId: "R02_LU",
      title: "同宮祿疊",
      severity,
      summary,
      evidence: list,
      payload: { toPalace: palace, canonicalKey: `to:${palace}|t:祿` },
    });
  }
  return hits.sort((a, b) => (b.evidence.length - a.evidence.length));
}

/** R02_JI 同宮忌疊 */
function detectR02Ji(events: NormalizedSiHuaEvent[]): PatternHitV2[] {
  const ji = events.filter((e) => e.transform === "ji" && e.toPalace);
  const byPalace = new Map<string, NormalizedSiHuaEvent[]>();
  for (const e of ji) {
    const p = e.toPalace!;
    const list = byPalace.get(p) ?? [];
    list.push(e);
    byPalace.set(p, list);
  }
  const hits: PatternHitV2[] = [];
  for (const [palace, list] of byPalace) {
    const layers = [...new Set(list.map((e) => e.layer))];
    if (layers.length < 2) continue;
    hits.push({
      ruleId: "R02_JI",
      title: "同宮忌疊",
      severity: "high",
      summary: `這個宮位（${palace}）是命盤中的壓力集中點。很多困難會從這裡開始顯化。`,
      evidence: list,
      payload: { toPalace: palace, canonicalKey: `to:${palace}|t:忌` },
    });
  }
  return hits.sort((a, b) => (b.evidence.length - a.evidence.length));
}

/** R30 能量環：2 或 3 宮有向環；只取 fromPalace && toPalace 都存在的事件；宮位一律 canonical 以利去重 */
function detectR30(events: NormalizedSiHuaEvent[]): PatternHitV2[] {
  const rawEdges = events.filter((e) => e.fromPalace && e.toPalace) as Array<NormalizedSiHuaEvent & { fromPalace: string; toPalace: string }>;
  const edges = rawEdges.map((e) => ({
    ...e,
    fromPalace: toPalaceCanonical(e.fromPalace),
    toPalace: toPalaceCanonical(e.toPalace),
  }));
  const adj = new Map<string, Array<{ to: string; event: NormalizedSiHuaEvent }>>();
  for (const e of edges) {
    const from = e.fromPalace;
    const to = e.toPalace;
    const list = adj.get(from) ?? [];
    list.push({ to, event: e });
    adj.set(from, list);
  }
  const cycles: Array<{ nodes: string[]; events: NormalizedSiHuaEvent[] }> = [];
  const seen = new Set<string>();

  for (const e of edges) {
    const A = e.fromPalace;
    const B = e.toPalace;
    const key2 = [A, B].sort().join("-");
    if (seen.has(key2)) continue;
    const toA = adj.get(B);
    const back = toA?.find((x) => x.to === A);
    if (back) {
      seen.add(key2);
      const loopEvents = [e, back.event];
      const hasJi = loopEvents.some((x) => x.transform === "ji");
      const hasQuan = loopEvents.some((x) => x.transform === "quan");
      cycles.push({
        nodes: [A, B].sort(),
        events: loopEvents,
      });
    }
  }
  for (const e of edges) {
    const A = e.fromPalace;
    const B = e.toPalace;
    const toB = adj.get(B);
    const toC = toB?.find((x) => x.to !== A);
    if (!toC) continue;
    const C = toC.to;
    const toAFromC = adj.get(C)?.find((x) => x.to === A);
    if (toAFromC) {
      const key3 = [A, B, C].sort().join("-");
      if (seen.has(key3)) continue;
      seen.add(key3);
      cycles.push({
        nodes: [A, B, C].sort(),
        events: [e, toC.event, toAFromC.event],
      });
    }
  }

  const hits: PatternHitV2[] = [];
  for (const { nodes, events: loopEvents } of cycles) {
    const hasJi = loopEvents.some((x) => x.transform === "ji");
    const hasQuan = loopEvents.some((x) => x.transform === "quan");
    const severity: Severity = hasJi ? "high" : hasQuan ? "medium" : "low";
    const key = `loop:${nodes.join("-")}`;
    const summary =
      severity === "high"
        ? `這幾個宮位（${nodes.join("、")}）形成壓力循環。事情會在這幾個領域之間反覆發生。`
        : severity === "medium"
          ? `這幾個領域（${nodes.join("、")}）之間存在明顯的連動。`
          : `這幾個宮位（${nodes.join("、")}）之間有能量流動。`;
    hits.push({
      ruleId: "R30",
      title: "能量環",
      severity,
      summary,
      evidence: loopEvents,
      payload: { loopNodes: nodes, canonicalKey: key },
    });
  }
  return hits;
}

/** R03 同化疊：同一 transform 集中於某 toPalace，top1 計數 ≥2 且占該 transform 總數 ≥50% */
function detectR03(events: NormalizedSiHuaEvent[]): PatternHitV2[] {
  const byTransform = new Map<string, NormalizedSiHuaEvent[]>();
  for (const e of events) {
    if (!e.toPalace) continue;
    const list = byTransform.get(e.transform) ?? [];
    list.push(e);
    byTransform.set(e.transform, list);
  }
  const hits: PatternHitV2[] = [];
  for (const [transform, list] of byTransform) {
    const byPalace = new Map<string, NormalizedSiHuaEvent[]>();
    for (const e of list) {
      const p = e.toPalace!;
      const arr = byPalace.get(p) ?? [];
      arr.push(e);
      byPalace.set(p, arr);
    }
    const total = list.length;
    if (total < 2) continue;
    const sorted = [...byPalace.entries()].sort((a, b) => b[1].length - a[1].length);
    const [topPalace, topList] = sorted[0];
    if (topList.length < 2 || topList.length / total < 0.5) continue;
    const severity: Severity = total >= 3 ? "high" : "medium";
    const label = TRANSFORM_LABEL[transform as keyof typeof TRANSFORM_LABEL] ?? transform;
    const summary =
      severity === "high"
        ? `整體命盤出現明顯的${label}能量偏向，代表事件會以相似的形式重複出現。`
        : `某種能量（${label}）在此局中比較活躍，會影響你的決策傾向。`;
    hits.push({
      ruleId: "R03",
      title: "同化疊",
      severity,
      summary,
      evidence: topList,
      payload: { transform, topTo: topPalace, canonicalKey: `t:${transform}|topTo:${topPalace}` },
    });
  }
  return hits;
}

/** R11 忌從哪到哪：transform=忌 且 from/to 皆存在 */
function detectR11(events: NormalizedSiHuaEvent[]): PatternHitV2[] {
  const ji = events.filter((e) => e.transform === "ji" && e.fromPalace && e.toPalace) as Array<NormalizedSiHuaEvent & { fromPalace: string; toPalace: string }>;
  const hits: PatternHitV2[] = [];
  for (const e of ji) {
    const starName = e.starNameZh ?? e.starId ?? "";
    const from = e.fromPalace;
    const to = e.toPalace;
    const fromCore = CORE_PALACES.has(from);
    const toCore = CORE_PALACES.has(to);
    const severity: Severity = fromCore && toCore ? "high" : "medium";
    const summary =
      severity === "high"
        ? `你以為問題在 ${to}，但真正的源頭在 ${from}。`
        : `${from} 與 ${to} 之間存在壓力連動。`;
    hits.push({
      ruleId: "R11",
      title: "忌從哪到哪",
      severity,
      summary: starName ? `${starName}化忌：${from} → ${to}。${summary}` : summary,
      evidence: [e],
      payload: { fromPalace: from, toPalace: to, starId: e.starId, starNameZh: e.starNameZh, canonicalKey: `from:${from}|to:${to}|star:${starName || "_"}` },
    });
  }
  return hits;
}

/** 固定輸出順序 */
const RULE_ORDER: RuleIdV2[] = ["R01", "R02_LU", "R02_JI", "R30", "R03", "R11"];

function orderRank(ruleId: RuleIdV2): number {
  const i = RULE_ORDER.indexOf(ruleId);
  return i >= 0 ? i : 99;
}

/**
 * 執行全部 5 類 detector，回傳合併後的 PatternHitV2[]（未去重、未截斷主文數量）
 */
export function runAllDetectors(events: NormalizedSiHuaEvent[]): PatternHitV2[] {
  const all: PatternHitV2[] = [
    ...detectR01(events),
    ...detectR02Lu(events),
    ...detectR02Ji(events),
    ...detectR30(events),
    ...detectR03(events),
    ...detectR11(events),
  ];
  all.sort((a, b) => orderRank(a.ruleId) - orderRank(b.ruleId));
  return all;
}

/**
 * 依 canonicalKey 去重：同一 ruleId + 同一 payload.canonicalKey 只留一筆（保留第一筆，evidence 可合併）
 */
export function dedupeByCanonicalKey(hits: PatternHitV2[]): PatternHitV2[] {
  const seen = new Map<string, PatternHitV2>();
  for (const h of hits) {
    const key = (h.payload?.canonicalKey as string) ?? h.ruleId + "_" + JSON.stringify(h.payload);
    const full = `${h.ruleId}:${key}`;
    if (seen.has(full)) continue;
    seen.set(full, h);
  }
  return [...seen.values()].sort((a, b) => orderRank(a.ruleId) - orderRank(b.ruleId));
}

/**
 * 主文用：Top 1 R01、Top 1 R02（擇 severity 高）、最多 2 條 R11；無 [Rxx] 標籤
 */
export function renderMainNarrative(hits: PatternHitV2[]): string {
  const r01 = hits.filter((h) => h.ruleId === "R01");
  const r02 = hits.filter((h) => h.ruleId === "R02_LU" || h.ruleId === "R02_JI");
  const r11 = hits.filter((h) => h.ruleId === "R11");
  const lines: string[] = [];
  if (r01.length > 0) lines.push(r01[0].summary);
  if (r02.length > 0) {
    const bySev = (h: PatternHitV2) => (h.severity === "high" ? 2 : h.severity === "medium" ? 1 : 0);
    const top = r02.sort((a, b) => bySev(b) - bySev(a))[0];
    lines.push(top.summary);
  }
  for (let i = 0; i < Math.min(2, r11.length); i++) lines.push(r11[i].summary);
  return lines.join("\n\n");
}

/** 取得主文用 hits：Top1 R01、Top1 R02、Top2 R11（R03/R30 僅 debug） */
export function getMainNarrativeHits(hits: PatternHitV2[]): PatternHitV2[] {
  const r01 = hits.filter((h) => h.ruleId === "R01");
  const r02 = hits.filter((h) => h.ruleId === "R02_LU" || h.ruleId === "R02_JI");
  const r11 = hits.filter((h) => h.ruleId === "R11");
  const out: PatternHitV2[] = [];
  if (r01.length > 0) out.push(r01[0]);
  if (r02.length > 0) {
    const bySev = (h: PatternHitV2) => (h.severity === "high" ? 2 : h.severity === "medium" ? 1 : 0);
    out.push(r02.sort((a, b) => bySev(b) - bySev(a))[0]);
  }
  for (let i = 0; i < Math.min(2, r11.length); i++) out.push(r11[i]);
  return out;
}

/**
 * 全盤結構判讀：按宮位合併，同宮多 hit 合為一段，避免重複段落
 * 順序：R01（核心星）→ 按宮位 R02/R11 合併
 */
export function renderMainNarrativeMergedByPalace(hits: PatternHitV2[]): string {
  const main = getMainNarrativeHits(hits);
  if (main.length === 0) return "";

  const r01 = main.find((h) => h.ruleId === "R01");
  const palaceHits = main.filter((h) => h.ruleId === "R02_LU" || h.ruleId === "R02_JI" || h.ruleId === "R11");

  const byPalace = new Map<string, PatternHitV2[]>();
  for (const h of palaceHits) {
    const palace = (h.payload?.toPalace as string) ?? (h.payload?.fromPalace as string) ?? "";
    if (!palace) continue;
    const list = byPalace.get(palace) ?? [];
    list.push(h);
    byPalace.set(palace, list);
  }

  const lines: string[] = [];
  if (r01) lines.push(r01.summary);
  for (const [, list] of byPalace) {
    const merged = list.map((h) => h.summary).join(" ");
    lines.push(merged);
  }
  return lines.join("\n\n");
}

/**
 * 今年操作建議：最多 3 條，每條最多 2 句；用重點宮位與核心星曜填模板
 */
export function buildS00YearlyAdvice(hotStars: string[], hotPalaces: string[]): string {
  const star = hotStars.length > 0 ? hotStars[0] : "核心星曜";
  const palace = hotPalaces.length > 0 ? hotPalaces[0] : "重點宮位";
  const items: string[] = [
    `1. 重大決策先觀察${palace}\n資源、責任與風險是否在此集中。`,
    `2. 主動經營${star}議題\n合作、關係與協調越主動越有回報。`,
    "3. 建立可複利的累積\n客戶池、技能或資產都適合長期經營。",
  ].slice(0, 3);
  return items.join("\n\n");
}

/**
 * Debug 用：逐 hit 列出 ruleId + title + canonicalKey，再列 evidence（layer/transform/star/from→to）
 */
export function renderDebugEvidence(hits: PatternHitV2[], diagnostics: { missingFields: unknown[]; unresolvedPalaceKey: string[]; unresolvedStarName: string[]; emptyReason?: string }): string {
  const blocks: string[] = [];
  for (const h of hits) {
    const key = (h.payload?.canonicalKey as string) ?? "";
    blocks.push(`【${h.ruleId}】${h.title} | ${key}`);
    for (const e of h.evidence) {
      const layer = LAYER_LABEL[e.layer];
      const t = TRANSFORM_LABEL[e.transform];
      const star = e.starNameZh ?? e.starId ?? "";
      const from = e.fromPalace ?? "—";
      const to = e.toPalace ?? "—";
      blocks.push(`  證據：${layer} ${star}${t} ${from} → ${to}`);
    }
  }
  if (diagnostics.missingFields.length > 0) {
    blocks.push("【diagnostics.missingFields】");
    for (const m of diagnostics.missingFields) {
      const x = m as { eventIndex?: number; fields: string[] };
      blocks.push(`  eventIndex=${x.eventIndex ?? "?"} fields=${(x.fields ?? []).join(",")}`);
    }
  }
  if (diagnostics.unresolvedPalaceKey.length > 0) blocks.push("【diagnostics.unresolvedPalaceKey】 " + diagnostics.unresolvedPalaceKey.join(", "));
  if (diagnostics.unresolvedStarName.length > 0) blocks.push("【diagnostics.unresolvedStarName】 " + diagnostics.unresolvedStarName.join(", "));
  if (diagnostics.emptyReason) blocks.push("【emptyReason】 " + diagnostics.emptyReason);
  return blocks.join("\n");
}
