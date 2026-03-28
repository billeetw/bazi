import { describe, expect, it } from "vitest";
import { clockHourToTimeIndex } from "@shared/iztroTimeIndex";
import {
  timeIndexFromDateInTimeZone,
  timeIndexFromLocalClock,
  TIME_INDEX_BRANCH_NAMES_ZH,
} from "../src/lifebook-viewer/utils/timeIndexFromLocalClock";

describe("timeIndexFromLocalClock", () => {
  it("與 clockHourToTimeIndex 一致（唯一來源）", () => {
    for (let h = 0; h <= 23; h++) {
      expect(timeIndexFromLocalClock(h, 0)).toBe(clockHourToTimeIndex(h));
    }
  });

  it("子時含 23、0 點鐘", () => {
    expect(timeIndexFromLocalClock(23, 59)).toBe(0);
    expect(timeIndexFromLocalClock(0, 0)).toBe(0);
    expect(TIME_INDEX_BRANCH_NAMES_ZH[0]).toBe("子");
  });

  it("丑時 01–02", () => {
    expect(timeIndexFromLocalClock(1, 30)).toBe(1);
    expect(timeIndexFromLocalClock(2, 59)).toBe(1);
  });

  it("亥時 21–22", () => {
    expect(timeIndexFromLocalClock(21, 0)).toBe(11);
    expect(timeIndexFromLocalClock(22, 30)).toBe(11);
  });
});

describe("timeIndexFromDateInTimeZone", () => {
  it("23:30 in Asia/Taipei 為子時且仍屬該日曆日之時段語境", () => {
    const d = new Date("2026-03-28T15:30:00.000Z"); // 23:30 Taipei
    expect(timeIndexFromDateInTimeZone(d, "Asia/Taipei")).toBe(0);
  });
});
