/**
 * iztro `horoscope(anchorDate, timeIndex)` 之 **timeIndex（0–11）** 與「本地 24h 鐘點」對照。
 * **全 repo 唯一真相**：Worker `compute/all`、`dailyFlow`、Viewer 流日 UI 皆須由此匯入，禁止複製公式。
 *
 * **對照表（左閉右開，本地 wall clock；DST 當日仍依轉換後之本地時、分 slot 映射）**
 * - **23:00–24:00** 與 **00:00–01:00** → **0（子）**
 * - **01:00–03:00** → **1（丑）**
 * - **03:00–05:00** → **2（寅）**
 * - **05:00–07:00** → **3（卯）**
 * - **07:00–09:00** → **4（辰）**
 * - **09:00–11:00** → **5（巳）**
 * - **11:00–13:00** → **6（午）**
 * - **13:00–15:00** → **7（未）**
 * - **15:00–17:00** → **8（申）**
 * - **17:00–19:00** → **9（酉）**
 * - **19:00–21:00** → **10（戌）**
 * - **21:00–23:00** → **11（亥）**
 *
 * 演算法與 `worker/src/index.ts` 原 `hourToTimeIndex` 一致：`h===23||h===0 → 0`，其餘 `floor((h+1)/2)`。
 * **映射表版本**：變更時必 bump，並同步 KV／文件。
 */
export const IZTRO_TIME_INDEX_MAPPING_VERSION = "1";

/** 索引 0–11 對應十二地支（子起） */
export const TIME_INDEX_BRANCH_NAMES_ZH = [
  "子",
  "丑",
  "寅",
  "卯",
  "辰",
  "巳",
  "午",
  "未",
  "申",
  "酉",
  "戌",
  "亥",
] as const;

/**
 * 本地小時（0–23）→ iztro timeIndex（0–11）。與 `iztro` 文檔之時辰區間一致。
 */
export function clockHourToTimeIndex(hour: number): number {
  const h = Number(hour);
  if (!Number.isFinite(h) || h < 0 || h > 23) return 0;
  if (h === 23 || h === 0) return 0;
  return Math.floor((h + 1) / 2);
}

/** 由 `Date` + IANA 時區讀取 wall-clock 小時（0–23，h23）再映射。DST 日亦使用轉換後之本地時。 */
export function timeIndexFromWallClockInTimeZone(instant: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour: "numeric",
    minute: "numeric",
    hourCycle: "h23",
  }).formatToParts(instant);
  const hour = Number(parts.find((p) => p.type === "hour")?.value ?? 0);
  return clockHourToTimeIndex(hour);
}
