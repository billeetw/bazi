/**
 * 時間模組（S17–S19）快照與當前 chart_json 是否一致：用決定性指紋比對。
 * 見 docs/lifebook-flow-month-data-source-inventory.md（Level 3）。
 */

function djb2Hex(input: string): string {
  let h = 5381;
  for (let i = 0; i < input.length; i++) {
    h = ((h << 5) + h + input.charCodeAt(i)) >>> 0;
  }
  return h.toString(16).padStart(8, "0");
}

function getZiweiObject(chart: Record<string, unknown>): Record<string, unknown> | undefined {
  const z = chart.ziwei;
  if (z && typeof z === "object") return z as Record<string, unknown>;
  const f = chart.features as Record<string, unknown> | undefined;
  const fz = f?.ziwei;
  if (fz && typeof fz === "object") return fz as Record<string, unknown>;
  return undefined;
}

/**
 * 僅納入會影響 overlay／S18／S19 的欄位；新增欄位時可擴充。
 */
export function buildTimeModuleChartFingerprint(chartJson: Record<string, unknown>): string {
  const z = getZiweiObject(chartJson);
  const monthly = (z?.monthlyHoroscope ?? z?.monthly) as Record<string, unknown> | undefined;
  const monthlySig =
    monthly && typeof monthly === "object"
      ? JSON.stringify({
          solarYear: monthly.solarYear,
          solarMonth: monthly.solarMonth,
          solarDay: monthly.solarDay,
          stem: monthly.stem,
          branch: monthly.branch,
          palace: monthly.palace,
        })
      : "";

  const yh = (chartJson.yearlyHoroscope ?? z?.yearlyHoroscope) as Record<string, unknown> | undefined;
  const yearlySig =
    yh && typeof yh === "object"
      ? JSON.stringify({
          year: yh.year,
          nominalAge: yh.nominalAge,
          age: yh.age,
        })
      : "";

  const ln = (chartJson.liunian ?? z?.liunian) as Record<string, unknown> | undefined;
  const liunianSig =
    ln && typeof ln === "object"
      ? JSON.stringify({
          stem: ln.stem,
          branch: ln.branch,
          palace: ln.palace,
        })
      : "";

  const decadal = chartJson.decadalLimits ?? z?.decadalLimits;
  let decadalSig = "";
  if (Array.isArray(decadal)) {
    decadalSig = JSON.stringify(
      decadal.map((row: Record<string, unknown>) => ({
        palace: row?.palace,
        startAge: row?.startAge,
        endAge: row?.endAge,
        stem: row?.stem,
      }))
    );
  }

  const birth = chartJson.birthInfo as Record<string, unknown> | undefined;
  const birthSig =
    birth && typeof birth === "object"
      ? JSON.stringify({
          year: birth.year,
          month: birth.month,
          day: birth.day,
          hour: birth.hour,
        })
      : "";

  const raw = [
    String(chartJson.chartId ?? ""),
    String(chartJson.flowMonthSolarDate ?? ""),
    String(chartJson.horoscopeAsOf ?? ""),
    birthSig,
    monthlySig,
    yearlySig,
    liunianSig,
    decadalSig,
  ].join("|");

  return djb2Hex(raw);
}

/**
 * 若快照無指紋（舊資料）→ 不視為過期。
 * 若有指紋且與當前 chart 不符 → 過期，應即場重算 S17–S19 區塊。
 */
export function isTimeModuleS17S19ReaderSnapshotStale(
  snap: { chartInputFingerprint?: string } | undefined,
  chartJson: Record<string, unknown> | undefined
): boolean {
  if (!snap || !chartJson) return false;
  const fp = snap.chartInputFingerprint;
  if (fp == null || fp === "") return false;
  return buildTimeModuleChartFingerprint(chartJson) !== fp;
}
