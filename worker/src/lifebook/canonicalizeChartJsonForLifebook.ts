/**
 * 命書／P2 前置：將 chart_json 收斂成 normalize、palaceOverlay、S19 共用的形狀。
 * 見 docs/lifebook-flow-month-data-source-inventory.md（Level 2）。
 *
 * 呼叫時機：在 sanitizeLifebookRequestChartJson 之後、normalizeChart / buildP2FindingsAndContext 之前。
 */

export type CanonicalizeLifebookChartOptions = {
  /**
   * true：無 iztro 大限表時，根與 ziwei.decadalLimits 一律為 []（life-book/generate 全書生成）。
   * false（預設）：可保留根上既有 decadalLimits（life-book/generate-section、infer 等）。
   */
  emptyDecadalLimitsWhenNoIztro?: boolean;
};

function isNonEmptyDecadalArray(x: unknown): x is unknown[] {
  return Array.isArray(x) && x.length > 0;
}

/**
 * 淺拷貝頂層 + 必要欄位升級／別名，不 deep clone 整張盤。
 */
export function canonicalizeChartJsonForLifebook(
  chart: Record<string, unknown> | undefined,
  opts?: CanonicalizeLifebookChartOptions
): Record<string, unknown> | undefined {
  if (!chart || typeof chart !== "object") return chart;

  const out: Record<string, unknown> = { ...chart };
  const features =
    out.features && typeof out.features === "object" ? (out.features as Record<string, unknown>) : undefined;
  const featuresZiwei = features?.ziwei && typeof features.ziwei === "object"
    ? (features.ziwei as Record<string, unknown>)
    : undefined;

  // 1) features → 根節點（與舊 index 行為一致）
  if (!out.ziwei && featuresZiwei) {
    out.ziwei = featuresZiwei;
  }
  if (!out.bazi && features?.bazi) {
    out.bazi = features.bazi;
  }

  const ziweiObj = out.ziwei && typeof out.ziwei === "object" ? (out.ziwei as Record<string, unknown>) : undefined;

  // 2) 流月別名：monthly → monthlyHoroscope（僅在缺正式欄位時）
  if (ziweiObj && ziweiObj.monthlyHoroscope == null && ziweiObj.monthly != null && typeof ziweiObj.monthly === "object") {
    ziweiObj.monthlyHoroscope = { ...(ziweiObj.monthly as Record<string, unknown>) };
  }

  // 3) 流年上下文：根缺則從 ziwei 升到根（normalize 只讀根）
  if (!out.yearlyHoroscope && ziweiObj?.yearlyHoroscope != null && typeof ziweiObj.yearlyHoroscope === "object") {
    out.yearlyHoroscope = ziweiObj.yearlyHoroscope;
  }
  if (!out.liunian && ziweiObj?.liunian != null && typeof ziweiObj.liunian === "object") {
    out.liunian = ziweiObj.liunian;
  }

  // 4) 大限：優先 iztro（features.ziwei 或 ziwei），再依選項決定是否保留根或清空
  const fromFeaturesDecadal = featuresZiwei?.decadalLimits;
  const fromZiweiDecadal = ziweiObj?.decadalLimits;
  const iztroDecadal = isNonEmptyDecadalArray(fromFeaturesDecadal)
    ? fromFeaturesDecadal
    : isNonEmptyDecadalArray(fromZiweiDecadal)
      ? fromZiweiDecadal
      : null;

  const fromRootDecadal = out.decadalLimits;
  let assignDecadal = false;
  let finalDecadal: unknown[] = [];

  if (iztroDecadal) {
    finalDecadal = iztroDecadal;
    assignDecadal = true;
  } else if (opts?.emptyDecadalLimitsWhenNoIztro) {
    finalDecadal = [];
    assignDecadal = true;
  } else if (isNonEmptyDecadalArray(fromRootDecadal)) {
    finalDecadal = fromRootDecadal as unknown[];
    assignDecadal = true;
  }

  // 與舊 generate-section 一致：無 iztro、根也無表時不覆寫（維持 undefined／原狀）
  if (assignDecadal) {
    out.decadalLimits = finalDecadal;
    if (ziweiObj) {
      ziweiObj.decadalLimits = finalDecadal;
    }
  }

  return out;
}
