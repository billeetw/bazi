/**
 * 紫微流日（dailyFlows）核心：iztro `horoscope(anchor, timeIndex).daily` + §八 分級降級。
 * DayContract 形狀與 `docs/lifebook-flow-day-feasibility-audit.md` Appendix A 對齊。
 */

import { astro } from "iztro";
import { buildPalaceByBranch } from "../palace-map.js";
import { getSolarYmdInTimeZone, parseOptionalYmdString } from "../flowMonthContext.js";
import { clockHourToTimeIndex } from "../../../shared/iztroTimeIndex.js";
import { surfaceLabelZh, type SurfaceLabelKey } from "../../../shared/dayContractSurface.js";

export type DayFlowFallbackReason = "daily_incomplete" | "no_destiny_palace" | "parse_failed" | "monthly_only";

export type DayContractV1 = {
  day_key: string;
  time_zone: string;
  time_index: number;
  palace: string | null;
  flows: unknown[];
  signals: string[];
  anchors: string[];
  /** 唯一驅動 UI 標題；文案必須等於 `surfaceLabelZh(surface_label_key)` */
  surface_label_key: SurfaceLabelKey;
  surface_label: string;
  is_fallback: boolean;
  fallback_tier?: "bazi_day" | "monthly";
  /** 降級時才填，便於 telemetry 與線上排錯 */
  fallback_reason?: DayFlowFallbackReason;
  missing?: string[];
};

type DailyLayer = {
  heavenlyStem?: string;
  earthlyBranch?: string;
  mutagen?: string[];
  stars?: unknown;
};

/** 將 `day_key`（該時區民曆日）對應到一個 UTC `Date`，使 `getSolarYmdInTimeZone(date, timeZone)` 回同一日。 */
export function anchorDateForDayKeyInTimeZone(dayKey: string, timeZone: string): Date {
  const parsed = parseOptionalYmdString(dayKey);
  if (!parsed) return new Date();
  const { y, m, d } = parsed;
  let t = Date.UTC(y, m - 1, d, 12, 0, 0);
  for (let i = 0; i < 48; i++) {
    const cur = getSolarYmdInTimeZone(new Date(t), timeZone);
    if (cur.y === y && cur.m === m && cur.d === d) return new Date(t);
    if (cur.y < y || (cur.y === y && cur.m < m) || (cur.y === y && cur.m === m && cur.d < d)) {
      t += 3600000;
    } else {
      t -= 3600000;
    }
  }
  return new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
}

function extractBirthSolar(chart: Record<string, unknown>): {
  dateStr: string;
  timeIndex: number;
  genderStr: "male" | "female";
} | null {
  const bi = chart.birthInfo as Record<string, unknown> | undefined;
  if (bi && typeof bi.year === "number" && typeof bi.month === "number" && typeof bi.day === "number") {
    const y = bi.year;
    const mo = bi.month;
    const d = bi.day;
    const h = typeof bi.hour === "number" ? bi.hour : 0;
    const dateStr = `${y}-${String(mo).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const timeIndex = clockHourToTimeIndex(h);
    const genderStr = String(chart.gender ?? bi.gender ?? "M").toUpperCase() === "F" ? "female" : "male";
    return { dateStr, timeIndex, genderStr };
  }
  const ziwei = chart.ziwei as Record<string, unknown> | undefined;
  const basic = ziwei?.basic as Record<string, unknown> | undefined;
  if (basic && typeof basic.year === "number" && typeof basic.month === "number" && typeof basic.day === "number") {
    const y = basic.year as number;
    const mo = basic.month as number;
    const d = basic.day as number;
    const h = typeof basic.hour === "number" ? basic.hour : 0;
    const dateStr = `${y}-${String(mo).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    return { dateStr, timeIndex: clockHourToTimeIndex(h), genderStr: "male" };
  }
  return null;
}

function dailyCompleteness(d: DailyLayer | undefined): { isComplete: boolean; missing?: string[] } {
  const missing: string[] = [];
  if (!d) return { isComplete: false, missing: ["daily"] };
  if (!d.heavenlyStem) missing.push("heavenlyStem");
  if (!d.earthlyBranch) missing.push("earthlyBranch");
  if (!Array.isArray(d.mutagen) || d.mutagen.length < 4) missing.push("mutagen");
  if (d.stars == null) missing.push("stars");
  return { isComplete: missing.length === 0, missing: missing.length ? missing : undefined };
}

function buildMutagenAnchors(daily: DailyLayer | undefined): string[] {
  if (!daily?.mutagen || !Array.isArray(daily.mutagen)) return [];
  return daily.mutagen.map((s, i) => `daily.mutagen[${i}]=${String(s)}`);
}

function surfacePair(key: SurfaceLabelKey): { surface_label_key: SurfaceLabelKey; surface_label: string } {
  return { surface_label_key: key, surface_label: surfaceLabelZh(key) };
}

/**
 * 接收命盤 chart、`day_key`、流日 `timeIndex`、IANA `time_zone`，產出 DayContract。
 * §八：daily 完整且能解流日命宮 → zwds_daily；否則降級八字日柱 → 再降級流月。
 */
export function buildDailyFlowResult(input: {
  chart_json: Record<string, unknown>;
  day_key: string;
  timeIndex: number;
  time_zone: string;
}): DayContractV1 {
  const { chart_json, day_key, timeIndex, time_zone } = input;

  const base: Omit<
    DayContractV1,
    | "palace"
    | "signals"
    | "anchors"
    | "surface_label_key"
    | "surface_label"
    | "is_fallback"
    | "fallback_tier"
    | "fallback_reason"
    | "missing"
  > = {
    day_key,
    time_zone,
    time_index: timeIndex,
    flows: [],
  };

  const birth = extractBirthSolar(chart_json);
  if (!birth) {
    return {
      ...base,
      palace: null,
      signals: ["無法自 chart 解析出生資料，無法推流日"],
      anchors: [],
      ...surfacePair("monthly"),
      is_fallback: true,
      fallback_tier: "monthly",
      fallback_reason: "parse_failed",
      missing: ["birthInfo"],
    };
  }

  const astrolabeZhTw = astro.astrolabeBySolarDate(birth.dateStr, birth.timeIndex, birth.genderStr, true, "zh-TW");
  const mingBranch = String(
    (astrolabeZhTw as { earthlyBranchOfSoulPalace?: string }).earthlyBranchOfSoulPalace ?? ""
  ).trim();
  const palaceByBranch = mingBranch ? buildPalaceByBranch(mingBranch) : undefined;

  const anchor = anchorDateForDayKeyInTimeZone(day_key, time_zone);
  const horoscope = (
    astrolabeZhTw as { horoscope?: (d?: Date, ti?: number) => unknown }
  ).horoscope?.(anchor, timeIndex) as {
    daily?: DailyLayer;
    monthly?: {
      heavenlyStem?: string;
      earthlyBranch?: string;
      palaceNames?: string[];
      mutagen?: string[];
    };
  } | undefined;

  const daily = horoscope?.daily;
  const dc = dailyCompleteness(daily);
  const dailyBranch = (daily?.earthlyBranch ?? "").trim();
  const flowPalace =
    dailyBranch && palaceByBranch && palaceByBranch[dailyBranch] ? palaceByBranch[dailyBranch] : null;

  if (dc.isComplete && flowPalace) {
    const signals = [`流日命宮：${flowPalace}`, `流日干支：${daily!.heavenlyStem ?? ""}${daily!.earthlyBranch ?? ""}`];
    const anchors = [
      `day_key=${day_key}`,
      `time_index=${timeIndex}`,
      `flow_palace=${flowPalace}`,
      ...buildMutagenAnchors(daily),
    ];
    return {
      ...base,
      palace: flowPalace,
      signals,
      anchors,
      ...surfacePair("zwds_daily"),
      is_fallback: false,
    };
  }

  const stem = (daily?.heavenlyStem ?? "").trim();
  const branch = (daily?.earthlyBranch ?? "").trim();

  /** Tier 1：八字日柱（流日命宮無法解或 daily 缺欄，但仍有干支） */
  if (stem && branch) {
    const reason: DayFlowFallbackReason =
      dc.isComplete && !flowPalace ? "no_destiny_palace" : "daily_incomplete";
    return {
      ...base,
      palace: flowPalace,
      signals: [`日柱：${stem}${branch}（流日資料不完整，僅供氣運參考）`],
      anchors: [`bazi_day_pillar=${stem}${branch}`, ...(dc.missing?.map((m) => `missing=${m}`) ?? [])],
      ...surfacePair("bazi_day"),
      is_fallback: true,
      fallback_tier: "bazi_day",
      fallback_reason: reason,
      missing: dc.missing,
    };
  }

  /** Tier 2：流月 */
  const mo = horoscope?.monthly;
  const moStem = (mo?.heavenlyStem ?? "").trim();
  const moBranch = (mo?.earthlyBranch ?? "").trim();
  const moPalace =
    moBranch && palaceByBranch && palaceByBranch[moBranch] ? palaceByBranch[moBranch] : null;
  const monthlyLine =
    moPalace && moStem && moBranch
      ? `流月參考：${moPalace}（${moStem}${moBranch}）`
      : moStem && moBranch
        ? `流月干支：${moStem}${moBranch}`
        : "流月資料不足，僅顯示背景提醒";

  return {
    ...base,
    palace: flowPalace ?? moPalace,
    signals: [monthlyLine],
    anchors: ["tier=monthly_fallback"],
    ...surfacePair("monthly"),
    is_fallback: true,
    fallback_tier: "monthly",
    fallback_reason: "monthly_only",
    missing: dc.missing,
  };
}

export function validateDayContractV1(
  v: unknown
): { ok: true; value: DayContractV1 } | { ok: false; errors: string[] } {
  const errors: string[] = [];
  if (!v || typeof v !== "object") {
    errors.push("not_an_object");
    return { ok: false, errors };
  }
  const o = v as Record<string, unknown>;
  if (typeof o.day_key !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(o.day_key)) errors.push("day_key");
  if (typeof o.time_zone !== "string" || !o.time_zone.trim()) errors.push("time_zone");
  if (typeof o.time_index !== "number" || o.time_index < 0 || o.time_index > 11) errors.push("time_index");
  if (o.palace != null && typeof o.palace !== "string") errors.push("palace");
  if (!Array.isArray(o.flows)) errors.push("flows");
  if (!Array.isArray(o.signals)) errors.push("signals");
  if (!Array.isArray(o.anchors)) errors.push("anchors");
  const sk = o.surface_label_key;
  if (sk !== "zwds_daily" && sk !== "bazi_day" && sk !== "monthly") errors.push("surface_label_key");
  if (typeof o.surface_label !== "string" || !o.surface_label.trim()) errors.push("surface_label");
  if (typeof o.is_fallback !== "boolean") errors.push("is_fallback");
  if (
    o.fallback_tier != null &&
    o.fallback_tier !== "bazi_day" &&
    o.fallback_tier !== "monthly"
  ) {
    errors.push("fallback_tier");
  }
  const fr = o.fallback_reason;
  if (
    fr != null &&
    fr !== "daily_incomplete" &&
    fr !== "no_destiny_palace" &&
    fr !== "parse_failed" &&
    fr !== "monthly_only"
  ) {
    errors.push("fallback_reason");
  }
  if (errors.length) return { ok: false, errors };
  const typed = o as unknown as DayContractV1;
  if (typed.surface_label !== surfaceLabelZh(typed.surface_label_key)) {
    errors.push("surface_label_must_match_surface_label_key");
    return { ok: false, errors };
  }
  return { ok: true, value: typed };
}
