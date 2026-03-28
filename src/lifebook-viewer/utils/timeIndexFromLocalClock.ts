/**
 * 重新導出 **全 repo 唯一** 之 iztro timeIndex 映射（`shared/iztroTimeIndex.ts`）。
 * Viewer 請用 `timeIndexFromWallClockInTimeZone`／`clockHourToTimeIndex`，禁止複製區間邏輯。
 */
import {
  clockHourToTimeIndex,
  IZTRO_TIME_INDEX_MAPPING_VERSION,
  TIME_INDEX_BRANCH_NAMES_ZH,
  timeIndexFromWallClockInTimeZone,
} from "@shared/iztroTimeIndex";

export {
  clockHourToTimeIndex,
  IZTRO_TIME_INDEX_MAPPING_VERSION,
  TIME_INDEX_BRANCH_NAMES_ZH,
  timeIndexFromWallClockInTimeZone,
};

/** @deprecated 請優先使用 `clockHourToTimeIndex`；保留舊名以降低 diff */
export function timeIndexFromLocalClock(hour: number, _minute: number): number {
  void _minute;
  return clockHourToTimeIndex(hour);
}

export function timeIndexFromDateInTimeZone(d: Date, timeZone: string): number {
  return timeIndexFromWallClockInTimeZone(d, timeZone);
}
