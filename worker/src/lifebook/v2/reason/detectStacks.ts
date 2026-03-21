/**
 * Lifebook V2：疊宮／相撞／會合信號偵測。
 * 輸入 TransformEdgeV2[]，產出 StackSignal[]。
 */

import type { TransformEdgeV2, TransformType } from "../schema/transformEdge.js";
import type { StackSignal, StackType } from "../schema/stackSignal.js";
import type { TriggeredPath } from "../schema/triggeredPath.js";
import { STACK_MULTIPLIER } from "../config/scoreWeights.js";

/** 宮名正規化（與 path 一致） */
function normPalace(p: string): string {
  const s = (p ?? "").trim();
  if (!s) return "";
  if (s.endsWith("宮")) return s;
  if (s === "命") return "命宮";
  return s + "宮";
}

/** 依 toPalace 分組（疊宮看「落宮」） */
function groupEdgesByToPalace(edges: TransformEdgeV2[]): Map<string, TransformEdgeV2[]> {
  const map = new Map<string, TransformEdgeV2[]>();
  for (const e of edges) {
    const p = normPalace(e.toPalace);
    if (!p) continue;
    const list = map.get(p) ?? [];
    list.push(e);
    map.set(p, list);
  }
  return map;
}

/** 依 fromPalace 分組（自化看「同宮」） */
function groupEdgesByFromPalace(edges: TransformEdgeV2[]): Map<string, TransformEdgeV2[]> {
  const map = new Map<string, TransformEdgeV2[]>();
  for (const e of edges) {
    const p = normPalace(e.fromPalace);
    if (!p) continue;
    const list = map.get(p) ?? [];
    list.push(e);
    map.set(p, list);
  }
  return map;
}

function uniqueStars(edges: TransformEdgeV2[]): string[] {
  const set = new Set<string>();
  for (const e of edges) {
    if (e.starName?.trim()) set.add(e.starName.trim());
  }
  return [...set];
}

function severityFromStackType(stackType: StackType): number {
  const m = STACK_MULTIPLIER[stackType] ?? 1;
  return Math.min(3, Math.max(1, Math.round(m)));
}

let stackIdCounter = 0;
function nextStackId(): string {
  return `stack_${++stackIdCounter}`;
}

/**
 * 僅用 edges 偵測：二疊、三疊、祿忌同宮、權忌同宮、自化忌/自化祿。
 * 可選傳入 triggeredPaths 以產出 path_cluster。
 */
export function detectStacks(
  edges: TransformEdgeV2[],
  triggeredPaths?: TriggeredPath[]
): StackSignal[] {
  stackIdCounter = 0;
  const out: StackSignal[] = [];
  const byToPalace = groupEdgesByToPalace(edges);

  // 自化：from === to
  const selfEdges = edges.filter((e) => e.isSelfTransform);
  for (const e of selfEdges) {
    const palace = normPalace(e.toPalace);
    if (!palace) continue;
    const theme = e.transform === "忌" ? "自化忌" : e.transform === "祿" ? "自化祿" : "自化";
    out.push({
      id: nextStackId(),
      palace,
      stackType: "self_transform_focus",
      layers: [e.layer],
      transforms: [e.transform],
      stars: uniqueStars([e]),
      severity: severityFromStackType("self_transform_focus"),
      theme,
      interpretationKey: `self_${e.transform}_${palace}`,
    });
  }

  for (const [palace, list] of byToPalace) {
    const layers = [...new Set(list.map((e) => e.layer))];
    const layerCount = layers.length;
    const transforms = [...new Set(list.map((e) => e.transform))];
    const hasLu = transforms.includes("祿");
    const hasJi = transforms.includes("忌");
    const hasQuan = transforms.includes("權");

    if (list.length >= 3 && layerCount >= 3) {
      out.push({
        id: nextStackId(),
        palace,
        stackType: "triple_stack",
        layers,
        transforms: transforms as TransformType[],
        stars: uniqueStars(list),
        severity: severityFromStackType("triple_stack"),
        theme: "三疊宮",
        interpretationKey: `triple_${palace}`,
      });
    } else if (list.length >= 2 && layerCount >= 2) {
      if (hasLu && hasJi) {
        out.push({
          id: nextStackId(),
          palace,
          stackType: "lu_ji_collision",
          layers,
          transforms: transforms as TransformType[],
          stars: uniqueStars(list),
          severity: severityFromStackType("lu_ji_collision"),
          theme: "祿忌同宮",
          interpretationKey: `lu_ji_${palace}`,
        });
      } else if (hasQuan && hasJi) {
        out.push({
          id: nextStackId(),
          palace,
          stackType: "quan_ji_collision",
          layers,
          transforms: transforms as TransformType[],
          stars: uniqueStars(list),
          severity: severityFromStackType("quan_ji_collision"),
          theme: "權忌同宮",
          interpretationKey: `quan_ji_${palace}`,
        });
      } else {
        out.push({
          id: nextStackId(),
          palace,
          stackType: "double_stack",
          layers,
          transforms: transforms as TransformType[],
          stars: uniqueStars(list),
          severity: severityFromStackType("double_stack"),
          theme: "二疊宮",
          interpretationKey: `double_${palace}`,
        });
      }
    }
  }

  // path_cluster：同一路徑多點觸發 → 該路徑觸及的多宮各記一筆或合併一筆（v1：每條 path 若 touchedPalaces.length >= 2 則產一筆，palace 取第一個）
  if (triggeredPaths?.length) {
    for (const tp of triggeredPaths) {
      if (tp.touchedPalaces.length < 2) continue;
      const palace = tp.touchedPalaces[0];
      out.push({
        id: nextStackId(),
        palace,
        stackType: "path_cluster",
        layers: tp.layers,
        transforms: tp.transforms,
        stars: [],
        severity: severityFromStackType("path_cluster"),
        theme: tp.summaryTag,
        interpretationKey: `path_cluster_${tp.pathId}`,
      });
    }
  }

  return out;
}
