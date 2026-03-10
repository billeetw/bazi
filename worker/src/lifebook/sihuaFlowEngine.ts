/**
 * 四化流向引擎（G1+G2）：Edge 物件化、計分、Top flows 文案。
 * 輸入：buildS00EventsFromChart 的 SiHuaEvent[]；每層每事件一條 edge，內部英文 transformType，輸出時轉中文。
 * Flow 句帶入宮位語義（plain），並依 transformType 選模板。
 */

import { toPalaceCanonical } from "./canonicalKeys.js";
import { getPalaceSemantic } from "./starSemanticDictionary.js";

export type SiHuaEdgeLayer = "natal" | "decade" | "year";
export type SiHuaEdgeTransform = "lu" | "quan" | "ke" | "ji";

export interface SiHuaEdge {
  fromPalace: string;
  toPalace: string;
  transformType: SiHuaEdgeTransform;
  layer: SiHuaEdgeLayer;
  starName: string;
}

/** 與 s00PatternEngine SiHuaEvent 相容的輸入（layer, transform, starName, fromPalace, toPalace） */
export interface SiHuaEventForFlow {
  layer: string;
  transform: string;
  starName: string;
  fromPalace: string;
  toPalace: string;
}

const LAYER_WEIGHT: Record<SiHuaEdgeLayer, number> = {
  natal: 3,
  decade: 2,
  year: 1,
};

const TRANSFORM_WEIGHT: Record<SiHuaEdgeTransform, number> = {
  ji: 3,
  quan: 2,
  ke: 1,
  lu: 1,
};

/** 四化流向句庫：依 transformType 選模板，並帶入宮位語義（fromCore / toCore） */
const PALACE_FLOW_TEMPLATES: Record<SiHuaEdgeTransform, string> = {
  ji: "{fromPalace}（{fromCore}）的壓力往往會先累積，最後在 {toPalace}（{toCore}）的事件或關係中被看見。",
  quan: "{fromPalace}（{fromCore}）的責任或角色，最後常會落到 {toPalace}（{toCore}）的關係或決策上。",
  ke: "{fromPalace}（{fromCore}）的修正與學習會落在 {toPalace}（{toCore}），用方法與系統解題最有效。",
  lu: "{fromPalace}（{fromCore}）所累積的資源或成果，往往會在 {toPalace}（{toCore}）的領域被真正放大。",
};

const MULTI_LAYER_SENTENCE =
  "這條路徑在不同時間層都被反覆點名，代表它不是一時事件，而是會持續出現的主題。";

const FALLBACK_BLOCK =
  "【四化流向摘要】\n（此盤未形成明顯的主導流向，請先以主戰場與四化疊加宮位為主。）";

function toEdgeLayer(l: string): SiHuaEdgeLayer {
  if (l === "natal" || l === "decade" || l === "year") return l;
  return "natal";
}

function toEdgeTransform(t: string): SiHuaEdgeTransform {
  if (t === "lu" || t === "quan" || t === "ke" || t === "ji") return t;
  return "lu";
}

/**
 * 由事件建 edges：每層每事件一條；from/to 正規化為 canonical 宮名。
 */
export function buildSihuaEdges(events: SiHuaEventForFlow[]): SiHuaEdge[] {
  const edges: SiHuaEdge[] = [];
  for (const e of events) {
    const from = toPalaceCanonical((e.fromPalace ?? "").trim());
    const to = toPalaceCanonical((e.toPalace ?? "").trim());
    if (!from || !to) continue;
    edges.push({
      fromPalace: from,
      toPalace: to,
      transformType: toEdgeTransform(e.transform ?? "lu"),
      layer: toEdgeLayer(e.layer ?? "natal"),
      starName: (e.starName ?? "").trim() || "星",
    });
  }
  return edges;
}

export function getEdgeScore(edge: SiHuaEdge): number {
  const lw = LAYER_WEIGHT[edge.layer] ?? 1;
  const tw = TRANSFORM_WEIGHT[edge.transformType] ?? 1;
  return lw * tw;
}

/** 同一路徑 key（from+to+transform）在多少個不同 layer 出現 */
function countLayersForKey(
  edges: SiHuaEdge[],
  from: string,
  to: string,
  transform: SiHuaEdgeTransform
): number {
  const layers = new Set(edges.filter((e) => e.fromPalace === from && e.toPalace === to && e.transformType === transform).map((e) => e.layer));
  return layers.size;
}

/**
 * 取分數最高的 n 條 edge（每條來自不同「路徑」或取最高分；去重路徑時保留該路徑最高分的一條）。
 * 回傳值含 score 與是否多層命中（該路徑在 >=2 層出現）。
 */
export function getTopFlows(
  edges: SiHuaEdge[],
  n: number
): Array<{ edge: SiHuaEdge; score: number; multiLayer: boolean }> {
  if (edges.length === 0) return [];
  const scored = edges.map((edge) => ({
    edge,
    score: getEdgeScore(edge),
  }));
  scored.sort((a, b) => b.score - a.score);

  const pathKey = (e: SiHuaEdge) => `${e.fromPalace}|${e.toPalace}|${e.transformType}`;
  const seen = new Set<string>();
  const result: Array<{ edge: SiHuaEdge; score: number; multiLayer: boolean }> = [];
  for (const { edge, score } of scored) {
    const key = pathKey(edge);
    if (seen.has(key)) continue;
    seen.add(key);
    const multiLayer = countLayersForKey(edges, edge.fromPalace, edge.toPalace, edge.transformType) >= 2;
    result.push({ edge, score, multiLayer });
    if (result.length >= n) break;
  }
  return result;
}

function fillFlowTemplate(edge: SiHuaEdge): string {
  const tpl = PALACE_FLOW_TEMPLATES[edge.transformType];
  const fromSem = getPalaceSemantic(edge.fromPalace);
  const toSem = getPalaceSemantic(edge.toPalace);
  const fromCore = fromSem?.short ?? fromSem?.core ?? edge.fromPalace;
  const toCore = toSem?.short ?? toSem?.core ?? edge.toPalace;
  return tpl
    .replace("{fromPalace}", edge.fromPalace)
    .replace("{toPalace}", edge.toPalace)
    .replace("{fromCore}", fromCore)
    .replace("{toCore}", toCore);
}

/**
 * 產出四化流向 block：Top 2~3 條 flow，多層命中時在最高分 flow 後補一句；不足 2 條則 fallback。
 */
export function buildTopFlowsBlock(events: SiHuaEventForFlow[]): string {
  const edges = buildSihuaEdges(events);
  const topFlows = getTopFlows(edges, 3);
  if (topFlows.length < 2) return FALLBACK_BLOCK;

  const lines: string[] = ["【四化流向】", ""];
  for (let i = 0; i < topFlows.length; i++) {
    const { edge, multiLayer } = topFlows[i];
    lines.push(fillFlowTemplate(edge));
    if (i === 0 && multiLayer) lines.push(MULTI_LAYER_SENTENCE);
    if (i < topFlows.length - 1) lines.push("");
  }
  return lines.join("\n");
}

// ---------- G3: Sink/Source（內部計算，不對外 block）----------

export interface SinkScores {
  inScoreByPalace: Record<string, number>;
  outScoreByPalace: Record<string, number>;
  topSinkPalaces: string[];
}

/**
 * 依 edgeScore 算每宮 inScore（被指向）、outScore（指向他宮）；Top 3 依 inScore 排序。
 */
export function computeSinkScores(edges: SiHuaEdge[]): SinkScores {
  const inScoreByPalace: Record<string, number> = {};
  const outScoreByPalace: Record<string, number> = {};
  for (const e of edges) {
    const score = getEdgeScore(e);
    inScoreByPalace[e.toPalace] = (inScoreByPalace[e.toPalace] ?? 0) + score;
    outScoreByPalace[e.fromPalace] = (outScoreByPalace[e.fromPalace] ?? 0) + score;
  }
  const sorted = Object.entries(inScoreByPalace)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([p]) => p);
  return { inScoreByPalace, outScoreByPalace, topSinkPalaces: sorted };
}

// ---------- G4: Loop（2～4 宮短環，僅 s03 輸出）----------

const LOOP_TEMPLATE_2 =
  "能量環：{path}。這條路徑代表議題容易在兩個領域之間反覆拉動，先在 {focusPalace} 建立節奏與界線，會比急著解決更有效。";
const LOOP_TEMPLATE_3PLUS =
  "能量環：{path}。這條路徑代表議題容易在幾個領域之間反覆流動，先在 {focusPalace} 建立節奏與界線，會比急著解決更有效。";
const LOOP_FALLBACK = "本盤未見明顯的短能量環，代表議題多半以單向推進為主，而非反覆繞回。";

function findCycles(edges: SiHuaEdge[]): Array<{ nodes: string[] }> {
  const adj = new Map<string, Array<{ to: string }>>();
  for (const e of edges) {
    const list = adj.get(e.fromPalace) ?? [];
    list.push({ to: e.toPalace });
    adj.set(e.fromPalace, list);
  }
  const cycles: Array<{ nodes: string[] }> = [];
  const seenKey = new Set<string>();

  for (const e of edges) {
    const A = e.fromPalace;
    const B = e.toPalace;
    const back = adj.get(B)?.find((x) => x.to === A);
    if (back) {
      const key2 = [A, B].sort().join("|");
      if (!seenKey.has(key2)) {
        seenKey.add(key2);
        cycles.push({ nodes: [A, B].sort() });
      }
    }
  }
  for (const e of edges) {
    const A = e.fromPalace;
    const B = e.toPalace;
    const toC = adj.get(B)?.find((x) => x.to !== A);
    if (!toC) continue;
    const C = toC.to;
    const toA = adj.get(C)?.find((x) => x.to === A);
    if (toA) {
      const key3 = [A, B, C].sort().join("|");
      if (!seenKey.has(key3)) {
        seenKey.add(key3);
        cycles.push({ nodes: [A, B, C].sort() });
      }
    }
  }
  for (const e of edges) {
    const A = e.fromPalace;
    const B = e.toPalace;
    const toC = adj.get(B)?.find((x) => x.to !== A);
    if (!toC) continue;
    const C = toC.to;
    const toD = adj.get(C)?.find((x) => x.to !== A && x.to !== B);
    if (!toD) continue;
    const D = toD.to;
    const toA = adj.get(D)?.find((x) => x.to === A);
    if (toA) {
      const key4 = [A, B, C, D].sort().join("|");
      if (!seenKey.has(key4)) {
        seenKey.add(key4);
        cycles.push({ nodes: [A, B, C, D].sort() });
      }
    }
  }
  return cycles;
}

/**
 * 產出能量環摘要：Top 1～2 條 loop，或 fallback。僅 s03 使用。
 */
export function buildLoopSummaryBlock(events: SiHuaEventForFlow[]): string {
  const edges = buildSihuaEdges(events);
  const cycles = findCycles(edges);
  if (cycles.length === 0) return LOOP_FALLBACK;
  const top2 = cycles.slice(0, 2);
  const lines = top2.map(({ nodes }) => {
    const path = nodes.join(" → ");
    const focusPalace = nodes[0] ?? "";
    const tpl = nodes.length === 2 ? LOOP_TEMPLATE_2 : LOOP_TEMPLATE_3PLUS;
    return tpl.replace("{path}", path).replace("{focusPalace}", focusPalace);
  });
  return lines.join("\n\n");
}

// ---------- G5: 多層衝突（內部計算，不對外 block）----------

const CONFLICT_MESSAGE =
  "不同時間層的重點落在不同宮位，代表你在長期慣性與當下課題之間容易出現拉扯。決策時不要只看眼前推力，也要回頭確認真正的壓力來源。";

export interface MultiLayerConflict {
  hasConflict: boolean;
  message: string;
  /** 衝突類型標記，供內部使用 */
  kinds: string[];
}

/**
 * 檢測三種多層衝突：1) 本命忌 vs 流年祿 不同宮 2) 本命忌 vs 流年權 不同宮 3) 本命祿 vs 大限忌 不同宮。
 */
export function detectMultiLayerConflict(events: SiHuaEventForFlow[]): MultiLayerConflict {
  const natalJi = events.find((e) => e.layer === "natal" && e.transform === "ji");
  const natalLu = events.find((e) => e.layer === "natal" && e.transform === "lu");
  const decadeJi = events.find((e) => e.layer === "decade" && e.transform === "ji");
  const yearLu = events.find((e) => e.layer === "year" && e.transform === "lu");
  const yearQuan = events.find((e) => e.layer === "year" && e.transform === "quan");
  const kinds: string[] = [];
  if (natalJi && yearLu) {
    const toNatal = toPalaceCanonical(natalJi.toPalace ?? "");
    const toYear = toPalaceCanonical(yearLu.toPalace ?? "");
    if (toNatal && toYear && toNatal !== toYear) kinds.push("本命忌_vs_流年祿");
  }
  if (natalJi && yearQuan) {
    const toNatal = toPalaceCanonical(natalJi.toPalace ?? "");
    const toYear = toPalaceCanonical(yearQuan.toPalace ?? "");
    if (toNatal && toYear && toNatal !== toYear) kinds.push("本命忌_vs_流年權");
  }
  if (natalLu && decadeJi) {
    const toNatal = toPalaceCanonical(natalLu.toPalace ?? "");
    const toDecade = toPalaceCanonical(decadeJi.toPalace ?? "");
    if (toNatal && toDecade && toNatal !== toDecade) kinds.push("本命祿_vs_大限忌");
  }
  return {
    hasConflict: kinds.length > 0,
    message: kinds.length > 0 ? CONFLICT_MESSAGE : "",
    kinds,
  };
}
