/**
 * 模組二疊宮 placeholder：單一來源契約
 * - findings.timeModuleOverlap：建置 findings 時寫入（chart 只讀一次）
 * - 無快照：getPlaceholderMapFromContext 明確走 buildTimeModuleOverlapSnapshotFromChartJson（僅 chart）
 * - 禁止：同段混用 findings + chart.overlap + 傳 findings 進 buildOverlapDetailBlocks
 */
import type { AssembleContentLookup } from "./assembler.js";
import type { TimeModuleOverlapSnapshot } from "./lifebookFindings.js";
import { buildOverlapDetailBlocks } from "./overlapDetailBlocks.js";

export function normPalaceForMatch(p: string): string {
  if (!p) return "";
  const s = (p || "").trim().replace(/宮$/, "");
  return s === "命" ? "命宮" : s || p;
}

export interface BuildTimeModuleOverlapSnapshotOpts {
  content?: AssembleContentLookup;
  config?: Record<string, unknown> | null;
  contentLocale?: "zh-TW" | "zh-CN" | "en";
}

/** 僅讀 chartJson（與 overlap / minorFortune 欄位）；不讀 LifebookFindings。 */
export function buildTimeModuleOverlapSnapshotFromChartJson(
  chartJson: Record<string, unknown>,
  opts?: BuildTimeModuleOverlapSnapshotOpts
): TimeModuleOverlapSnapshot {
  const overlap = (chartJson.overlapAnalysis ?? chartJson.overlap) as Record<string, unknown> | undefined;
  const minor = chartJson.minorFortuneByPalace as
    | Array<{ palace?: string; year?: number | null; nominalAge?: number | null; stem?: string | null; note?: string | null }>
    | undefined;

  let shockCount = 0;
  let mineCount = 0;
  let wealthCount = 0;
  const palaceToTag = new Map<string, "shock" | "mine" | "wealth">();

  const newItems = Array.isArray(overlap?.items) ? (overlap.items as Array<{ palaceKey?: string; palaceName?: string; tag?: string }>) : [];
  if (newItems.length > 0) {
    for (const it of newItems) {
      const tag = it.tag === "shock" || it.tag === "mine" || it.tag === "wealth" ? it.tag : null;
      if (!tag) continue;
      if (tag === "shock") shockCount++;
      else if (tag === "mine") mineCount++;
      else if (tag === "wealth") wealthCount++;
      const pNorm = normPalaceForMatch(it.palaceName ?? it.palaceKey ?? "");
      if (pNorm) palaceToTag.set(pNorm, tag);
    }
  } else {
    const risks = (overlap?.criticalRisks ?? []) as Array<{ palace?: string }>;
    const opps = (overlap?.maxOpportunities ?? []) as Array<{ palace?: string }>;
    const vol = (overlap?.volatileAmbivalences ?? []) as Array<{ palace?: string }>;
    shockCount = vol.length;
    mineCount = risks.length;
    wealthCount = opps.length;
    for (const r of risks) {
      const pNorm = normPalaceForMatch(r.palace ?? "");
      if (pNorm) palaceToTag.set(pNorm, "mine");
    }
    for (const o of opps) {
      const pNorm = normPalaceForMatch(o.palace ?? "");
      if (pNorm) palaceToTag.set(pNorm, "wealth");
    }
    for (const v of vol) {
      const pNorm = normPalaceForMatch(v.palace ?? "");
      if (pNorm) palaceToTag.set(pNorm, "shock");
    }
  }

  const palaceOverlapTags: Record<string, "shock" | "mine" | "wealth"> = {};
  for (const [k, v] of palaceToTag) palaceOverlapTags[k] = v;

  const detail = buildOverlapDetailBlocks(overlap, {
    chartJson,
    content: opts?.content,
    config: opts?.config ?? null,
    contentLocale: opts?.contentLocale ?? "zh-TW",
    minorFortuneByPalace: [],
  });

  const overlapSummary = `劇烈震盪/吉凶並見：${shockCount} 個宮位；超級地雷區：${mineCount} 個宮位；大發財機會：${wealthCount} 個宮位`;
  const keyYearsMineLead = "這一年真正危險的，不是表面事件，而是壓力已經累積到會從這個宮位爆出來。";
  const keyYearsWealthLead = "此年該宮有資源匯聚，見四化。";
  const keyYearsShockLead = "這一年吉凶並見、成敗一線間，關鍵在節奏與選擇，不在命好不好。";

  const volatileSection = detail.shockBlocks
    ? "⚡ 劇烈震盪/吉凶並見（成敗一線間）\n" + detail.shockBlocks
    : shockCount > 0
      ? "⚡ 劇烈震盪/吉凶並見\n"
      : "";
  const criticalRisksSection = detail.mineBlocks
    ? "⚠️ 超級地雷區（必須絕對避開）\n" + detail.mineBlocks
    : mineCount > 0
      ? "⚠️ 超級地雷區\n"
      : "";
  const opportunitiesSection = detail.wealthBlocks
    ? "✨ 大發財機會（建議積極把握）\n" + detail.wealthBlocks
    : wealthCount > 0
      ? "✨ 大發財機會\n"
      : "";

  const hasMinorFortuneRows = Array.isArray(minor) && minor.length > 0;
  const hasOverlapPayload =
    (Array.isArray(overlap?.items) && (overlap?.items?.length ?? 0) > 0) ||
    (Array.isArray(overlap?.criticalRisks) && (overlap?.criticalRisks?.length ?? 0) > 0) ||
    (Array.isArray(overlap?.maxOpportunities) && (overlap?.maxOpportunities?.length ?? 0) > 0) ||
    (Array.isArray(overlap?.volatileAmbivalences) && (overlap?.volatileAmbivalences?.length ?? 0) > 0);

  return {
    shockCount: String(shockCount),
    mineCount: String(mineCount),
    wealthCount: String(wealthCount),
    overlapSummary,
    shockBlocks: detail.shockBlocks,
    mineBlocks: detail.mineBlocks,
    wealthBlocks: detail.wealthBlocks,
    volatileSection,
    criticalRisksSection,
    opportunitiesSection,
    keyYearsMineLead,
    keyYearsWealthLead,
    keyYearsShockLead,
    hasMinorFortuneRows,
    hasOverlapPayload,
    palaceOverlapTags,
  };
}

/** 將疊宮快照寫入 map（key-level：僅補空字串 key，與 V2 並存）。 */
export function applyTimeModuleOverlapPlaceholdersToMap(
  map: Record<string, string>,
  sectionKey: string | undefined,
  src: TimeModuleOverlapSnapshot
): void {
  const isEmpty = (v: string | undefined) => v === undefined || (typeof v === "string" && !v.trim());
  if (sectionKey === "s15a") {
    if (isEmpty(map.overlapSummary)) map.overlapSummary = src.overlapSummary;
    if (isEmpty(map.shockCount)) map.shockCount = src.shockCount;
    if (isEmpty(map.mineCount)) map.mineCount = src.mineCount;
    if (isEmpty(map.wealthCount)) map.wealthCount = src.wealthCount;
    if (isEmpty(map.shockBlocks)) map.shockBlocks = src.shockBlocks;
    if (isEmpty(map.mineBlocks)) map.mineBlocks = src.mineBlocks;
    if (isEmpty(map.wealthBlocks)) map.wealthBlocks = src.wealthBlocks;
    if (isEmpty(map.keyYearsMineLead)) map.keyYearsMineLead = src.keyYearsMineLead;
    if (isEmpty(map.keyYearsWealthLead)) map.keyYearsWealthLead = src.keyYearsWealthLead;
    if (isEmpty(map.keyYearsShockLead)) map.keyYearsShockLead = src.keyYearsShockLead;
    if (isEmpty(map.volatileSection)) map.volatileSection = src.volatileSection;
    if (isEmpty(map.criticalRisksSection)) map.criticalRisksSection = src.criticalRisksSection;
    if (isEmpty(map.opportunitiesSection)) map.opportunitiesSection = src.opportunitiesSection;
  } else {
    if (isEmpty(map.shockCount)) map.shockCount = src.shockCount;
    if (isEmpty(map.mineCount)) map.mineCount = src.mineCount;
    if (isEmpty(map.wealthCount)) map.wealthCount = src.wealthCount;
    if (isEmpty(map.overlapSummary)) map.overlapSummary = src.overlapSummary;
    if (isEmpty(map.shockBlocks)) map.shockBlocks = src.shockBlocks;
    if (isEmpty(map.mineBlocks)) map.mineBlocks = src.mineBlocks;
    if (isEmpty(map.wealthBlocks)) map.wealthBlocks = src.wealthBlocks;
    if (isEmpty(map.keyYearsMineLead)) map.keyYearsMineLead = src.keyYearsMineLead;
    if (isEmpty(map.keyYearsWealthLead)) map.keyYearsWealthLead = src.keyYearsWealthLead;
    if (isEmpty(map.keyYearsShockLead)) map.keyYearsShockLead = src.keyYearsShockLead;
    if (isEmpty(map.volatileSection)) map.volatileSection = src.volatileSection;
    if (isEmpty(map.criticalRisksSection)) map.criticalRisksSection = src.criticalRisksSection;
    if (isEmpty(map.opportunitiesSection)) map.opportunitiesSection = src.opportunitiesSection;
  }
  if (sectionKey === "s17" || sectionKey === "s15") {
    map.overlapDataMissingNotice =
      src.hasMinorFortuneRows || src.hasOverlapPayload
        ? ""
        : "（疊宮資料尚未產出：請在專家後台先點「計算」並勾選「計算所有進階功能」，再重新生成此章。）";
  }
}

/** P2 inject：與 assembleS15 的 mineBlocks/wealthBlocks/shockBlocks（關鍵年）分源，只合併非碰撞欄位。 */
export function mergeInjectP2TimeModuleOverlapSnapshot(
  map: Record<string, string>,
  snap: TimeModuleOverlapSnapshot | undefined
): void {
  if (!snap) return;
  const keys = [
    "shockCount",
    "mineCount",
    "wealthCount",
    "overlapSummary",
    "volatileSection",
    "criticalRisksSection",
    "opportunitiesSection",
    "keyYearsMineLead",
    "keyYearsWealthLead",
    "keyYearsShockLead",
  ] as const;
  for (const k of keys) {
    const v = snap[k];
    if (typeof v === "string" && v.trim()) map[k] = v;
  }
}
