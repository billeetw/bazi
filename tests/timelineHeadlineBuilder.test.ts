import { describe, expect, it } from "vitest";
import {
  buildHeadlineFromDayContract,
  buildHeadlineWhenError,
  buildHeadlineWhenNoContract,
} from "../src/lifebook-viewer/viewmodels/timelineHeadlineBuilder";
import type { DayContractV1 } from "../src/lifebook-viewer/types/dayContract";

describe("timelineHeadlineBuilder (single copy source)", () => {
  it("uses first signal as headline when present", () => {
    const c = {
      palace: "命宮",
      signals: ["第一信號", "第二信號"],
      anchors: [],
      flows: [],
    } as unknown as DayContractV1;
    const { headline, description } = buildHeadlineFromDayContract(c);
    expect(headline).toBe("第一信號");
    expect(description).toContain("第二信號");
  });

  it("empty awaiting: calm system-running tone", () => {
    const { headline, description } = buildHeadlineWhenNoContract(null);
    expect(headline).toBe("正在觀測星象...");
    expect(description).toBe("請稍候片刻");
  });

  it("error: no raw message in UI copy", () => {
    const { headline, description } = buildHeadlineWhenError(null, "HTTP 500: database exploded");
    expect(headline).toBe("暫時無法對齊今日節奏");
    expect(description).toBe("請稍後再試，我們正在重新整理時間與命盤資料");
    expect(description).not.toContain("500");
  });
});
