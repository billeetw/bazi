/**
 * Lifebook V2：從 NormalizedChart 產出統一三層 TransformEdgeV2[]。
 * 整合：生年四化、大限四化、流年四化、宮干飛化。
 */

import type { NormalizedChart, TransformEdge as LegacyEdge } from "../../normalizedChart.js";
import type { TransformEdgeV2, SourceType, TimeLayer, TransformType } from "../schema/transformEdge.js";
import { createEdgeId, isSelfTransform } from "../schema/transformEdge.js";

function toTransformType(t: string | undefined): TransformType {
  const s = (t ?? "").trim();
  if (s === "祿" || s === "權" || s === "科" || s === "忌") return s as TransformType;
  return "忌";
}

/**
 * 將既有 TransformEdge[] 轉成 V2 邊，並附上來源類型與可選時間區間。
 */
function legacyToV2(
  edges: LegacyEdge[],
  sourceType: SourceType,
  options: {
    decadeRange?: { start: number; end: number };
    flowYear?: number;
    palaceStemMap?: Record<string, string>;
    layer: TimeLayer;
  }
): TransformEdgeV2[] {
  const out: TransformEdgeV2[] = [];
  let index = 0;
  for (const e of edges) {
    const from = e.fromPalace ?? "";
    const to = e.toPalace ?? "";
    if (!from || !to) continue;
    const transform = toTransformType(e.transform);
    const self = isSelfTransform(from, to);
    const id = createEdgeId(
      options.layer,
      from,
      to,
      transform,
      e.starName ?? "",
      index++
    );
    const v2: TransformEdgeV2 = {
      id,
      layer: options.layer,
      sourceType,
      fromPalace: from,
      toPalace: to,
      transform,
      starName: (e.starName ?? "").trim() || "星",
      isSelfTransform: self,
    };
    if (options.decadeRange) v2.decadeRange = options.decadeRange;
    if (options.flowYear != null) v2.flowYear = options.flowYear;
    if (sourceType === "宮干飛化" && options.palaceStemMap?.[from])
      v2.palaceStem = options.palaceStemMap[from];
    out.push(v2);
  }
  return out;
}

/**
 * 從 NormalizedChart 建出 V2 統一邊（三層 + 宮干飛化）。
 */
export function buildTransformEdges(chart: NormalizedChart): TransformEdgeV2[] {
  const out: TransformEdgeV2[] = [];
  const palaceStemMap = chart.palaceStemMap ?? {};

  // 生年四化
  const birth = chart.natal?.birthTransforms ?? chart.natalTransforms ?? [];
  out.push(
    ...legacyToV2(birth, "生年四化", { layer: "natal", palaceStemMap })
  );

  // 宮干飛化（本命）
  const natalFlows = chart.natal?.flows ?? [];
  out.push(
    ...legacyToV2(natalFlows, "宮干飛化", {
      layer: "natal",
      palaceStemMap,
    })
  );

  // 大限四化
  const decade = chart.currentDecade;
  if (decade?.transforms?.length) {
    const range = {
      start: decade.startAge ?? 0,
      end: decade.endAge ?? 0,
    };
    out.push(
      ...legacyToV2(decade.transforms, "大限四化", {
        layer: "decade",
        decadeRange: range,
        palaceStemMap,
      })
    );
  }

  // 流年四化
  const yearScope = chart.yearlyHoroscope;
  if (yearScope?.transforms?.length) {
    const flowYear = chart.flowYear ?? yearScope.year;
    out.push(
      ...legacyToV2(yearScope.transforms, "流年四化", {
        layer: "year",
        flowYear: flowYear ?? undefined,
        palaceStemMap,
      })
    );
  }

  return out;
}
