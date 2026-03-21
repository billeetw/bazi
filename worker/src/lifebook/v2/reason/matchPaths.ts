/**
 * Lifebook V2：路徑辨識。
 * 將 TransformEdgeV2[] 投影到 PATH_LIBRARY，產出 TriggeredPath[]。
 */

import type { TransformEdgeV2, TransformType } from "../schema/transformEdge.js";
import type { TriggeredPath, PathPolarity } from "../schema/triggeredPath.js";
import { PATH_LIBRARY } from "../config/pathLibrary.js";
import { TRANSFORM_SCORE, LAYER_WEIGHT } from "../config/scoreWeights.js";

/** 宮名正規化：與 path 定義一致（有「宮」則保留，無則補上，命→命宮） */
function normPalace(p: string): string {
  const s = (p ?? "").trim();
  if (!s) return "";
  if (s.endsWith("宮")) return s;
  if (s === "命") return "命宮";
  return s + "宮";
}

/** 邊 (from, to) 是否為 path 上相鄰宮位的一步 */
function edgeMatchesPathSegment(
  from: string,
  to: string,
  palaces: string[]
): boolean {
  const fromN = normPalace(from);
  const toN = normPalace(to);
  for (let i = 0; i < palaces.length - 1; i++) {
    if (normPalace(palaces[i]) === fromN && normPalace(palaces[i + 1]) === toN)
      return true;
  }
  return false;
}

/** 依 score 決定 polarity */
function scoreToPolarity(score: number): PathPolarity {
  if (score > 0) return "positive";
  if (score < 0) return "negative";
  return "mixed";
}

/** 單一路徑的 summaryTag（v1 簡化：用 path name + 觸及宮數） */
function toSummaryTag(pathName: string, touchedPalaces: string[], polarity: PathPolarity): string {
  const n = touchedPalaces.length;
  if (n === 0) return pathName;
  const pLabel = polarity === "positive" ? "吉" : polarity === "negative" ? "壓" : "混";
  return `${pathName}（${n}宮${pLabel}）`;
}

/**
 * 輸入：統一邊列表。
 * 輸出：每條 path 若至少有一條邊命中，則產出一筆 TriggeredPath。
 */
export function matchPaths(edges: TransformEdgeV2[]): TriggeredPath[] {
  const result: TriggeredPath[] = [];
  const edgeById = new Map(edges.map((e) => [e.id, e]));

  for (const path of PATH_LIBRARY) {
    const matchedEdges: string[] = [];
    const touchedSet = new Set<string>();
    const layersSet = new Set<TriggeredPath["layers"][0]>();
    const transformsSet = new Set<TransformType>();
    let score = 0;

    for (const e of edges) {
      if (!edgeMatchesPathSegment(e.fromPalace, e.toPalace, path.palaces))
        continue;
      matchedEdges.push(e.id);
      touchedSet.add(normPalace(e.fromPalace));
      touchedSet.add(normPalace(e.toPalace));
      layersSet.add(e.layer);
      transformsSet.add(e.transform);

      const base = TRANSFORM_SCORE[e.transform] ?? 0;
      const layerW = LAYER_WEIGHT[e.layer] ?? 1;
      score += base * layerW * (path.scoringProfile.pathMultiplier ?? 1);
    }

    if (matchedEdges.length === 0) continue;

    const touchedPalaces = path.palaces.filter((p) => touchedSet.has(normPalace(p)));
    const layers = [...layersSet];
    const transforms = [...transformsSet];
    const polarity = scoreToPolarity(score);
    const summaryTag = toSummaryTag(path.name, touchedPalaces, polarity);

    result.push({
      pathId: path.id,
      matchedEdges,
      touchedPalaces,
      layers,
      transforms,
      score,
      polarity,
      summaryTag,
    });
  }

  return result;
}
