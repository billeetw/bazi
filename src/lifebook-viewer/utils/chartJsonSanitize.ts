/**
 * 已廢止 client wire：`chart_json.sihuaLayers` 不驅動 Worker 正文。
 * Viewer 匯入／組裝文件時略過，避免誤存或誤傳。
 */
export function omitDeprecatedSihuaLayers(
  chart: Record<string, unknown> | null | undefined
): Record<string, unknown> | null | undefined {
  if (chart == null || typeof chart !== "object") return chart;
  if (!Object.prototype.hasOwnProperty.call(chart, "sihuaLayers")) return chart;
  const { sihuaLayers: _omit, ...rest } = chart;
  return rest;
}
