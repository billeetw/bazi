/**
 * 範例：nominalAge=55 時正規化結果與 validator 檢查。
 * 執行方式：npx tsx worker/src/lifebook/validators/validateTimelineConsistency.example.ts
 *
 * 期望：大限宮位 = 僕役宮（需 chartJson.decadalLimits 含 55 歲落在僕役宮）、流年四化 ≠ 大限四化。
 */

import { normalizeChart } from "../normalize/index.js";
import { validateTimelineConsistency, hasTimelineErrors } from "./validateTimelineConsistency.js";

const exampleChartJson: Record<string, unknown> = {
  chartId: "example-55",
  locale: "zh-TW",
  yearlyHoroscope: { year: 2026, nominalAge: 55 },
  liunian: { palace: "遷移宮", branch: "午" },
  decadalLimits: [
    { palace: "命宮", startAge: 0, endAge: 5 },
    { palace: "僕役宮", startAge: 54, endAge: 63 },
  ],
  overlapAnalysis: { items: [] },
  ziwei: {},
};

function runExample() {
  const chart = normalizeChart(exampleChartJson);
  const issues = validateTimelineConsistency(chart);

  console.log("=== nominalAge=55 正規化與驗證 ===\n");
  console.log("大限宮位:", chart.currentDecade?.palace ?? "(無)");
  console.log("流年命宮:", chart.yearlyHoroscope?.destinyPalace ?? "(無)");
  console.log("流年四化與大限四化是否同一引用（禁止）:", chart.yearlyHoroscope?.transforms === chart.currentDecade?.transforms);
  console.log("");
  console.log("Validator issues:", issues.length ? issues : "無");
  console.log("是否有 error:", hasTimelineErrors(issues));
}

runExample();
