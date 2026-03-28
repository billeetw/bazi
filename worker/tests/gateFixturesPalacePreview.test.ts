/**
 * Gate fixture 多宮預覽驗收（十二宮）
 * — buildGateFixtureState、URL 焦點解析、與 SECTION_KEY_TO_PALACE_ID 對齊。
 */
import { describe, it, expect } from "vitest";
import {
  buildGateFixtureState,
  parseGateFixtureFocusFromParams,
  parseGateFixtureFromSearch,
} from "../../src/lifebook-viewer/testing/gateFixtures";
import {
  PALACE_TEMPLATE_PREVIEW_SECTION_KEYS,
  PREVIEW_FOCUS_TO_SECTION_KEY,
  SECTION_KEY_TO_PALACE_ID,
  type PalacePreviewFocus,
} from "../../src/lifebook-viewer/constants";

const TWELVE_KEYS = [
  "s02",
  "s08",
  "s10",
  "s13",
  "s11",
  "s12",
  "s01",
  "s09",
  "s05",
  "s06",
  "s07",
  "s14",
] as const;

const ALL_FOCUS: PalacePreviewFocus[] = [
  "ming",
  "guanlu",
  "caibo",
  "fuqi",
  "jie",
  "qianyi",
  "fude",
  "tianzhai",
  "fumu",
  "xiongdi",
  "nuppu",
  "zinv",
];

describe("buildGateFixtureState（十二宮最小章節）", () => {
  it("四組 fixture 皆含十二個 section_key 且標題正確", () => {
    for (const id of ["open", "partial", "teaser", "locked"] as const) {
      const state = buildGateFixtureState(id, "ming");
      const keys = Object.keys(state.sections ?? {}).sort();
      expect(keys).toEqual([...TWELVE_KEYS].sort());
      expect(state.sections?.s05?.title).toBe("父母宮綜合分析");
      expect(state.sections?.s06?.title).toBe("兄弟宮綜合分析");
      expect(state.sections?.s07?.title).toBe("僕役宮綜合分析");
      expect(state.sections?.s14?.title).toBe("子女宮綜合分析");
    }
  });

  it("partial：available_sections 僅為焦點 section_key", () => {
    for (const focus of ALL_FOCUS) {
      const key = PREVIEW_FOCUS_TO_SECTION_KEY[focus];
      const meta = buildGateFixtureState("partial", focus).meta as {
        plan_tier?: string;
        available_sections?: string[];
      };
      expect(meta.plan_tier).toBe("free");
      expect(meta.available_sections).toEqual([key]);
    }
  });

  it("locked：locked_sections[0].section_key 為焦點", () => {
    for (const focus of ALL_FOCUS) {
      const key = PREVIEW_FOCUS_TO_SECTION_KEY[focus];
      const meta = buildGateFixtureState("locked", focus).meta as {
        locked_sections?: { section_key?: string }[];
      };
      expect(meta.locked_sections?.[0]?.section_key).toBe(key);
    }
  });
});

describe("parseGateFixtureFocusFromParams（十二宮別名）", () => {
  const cases: { query: string; expected: PalacePreviewFocus | null }[] = [
    { query: "palace=ming", expected: "ming" },
    { query: "palace=s02", expected: "ming" },
    { query: "palace=guanlu", expected: "guanlu" },
    { query: "section=s08", expected: "guanlu" },
    { query: "focus=caibo", expected: "caibo" },
    { query: "palace=s10", expected: "caibo" },
    { query: "palace=fuqi", expected: "fuqi" },
    { query: "palace=s13", expected: "fuqi" },
    { query: "palace=jie", expected: "jie" },
    { query: "palace=s11", expected: "jie" },
    { query: "palace=qianyi", expected: "qianyi" },
    { query: "palace=s12", expected: "qianyi" },
    { query: "palace=fude", expected: "fude" },
    { query: "palace=s01", expected: "fude" },
    { query: "palace=tianzhai", expected: "tianzhai" },
    { query: "palace=s09", expected: "tianzhai" },
    { query: "palace=fumu", expected: "fumu" },
    { query: "palace=s05", expected: "fumu" },
    { query: "palace=xiongdi", expected: "xiongdi" },
    { query: "palace=s06", expected: "xiongdi" },
    { query: "palace=nuppu", expected: "nuppu" },
    { query: "palace=s07", expected: "nuppu" },
    { query: "palace=zinv", expected: "zinv" },
    { query: "palace=s14", expected: "zinv" },
    { query: "palace=not-a-palace", expected: null },
    { query: "", expected: null },
  ];

  for (const { query, expected } of cases) {
    it(`?${query} → ${expected ?? "null"}`, () => {
      const params = new URLSearchParams(query);
      expect(parseGateFixtureFocusFromParams(params)).toBe(expected);
    });
  }

  it("中文宮名可解析", () => {
    expect(parseGateFixtureFocusFromParams(new URLSearchParams("palace=財帛宮"))).toBe("caibo");
    expect(parseGateFixtureFocusFromParams(new URLSearchParams("palace=夫妻宮"))).toBe("fuqi");
    expect(parseGateFixtureFocusFromParams(new URLSearchParams("palace=疾厄宮"))).toBe("jie");
    expect(parseGateFixtureFocusFromParams(new URLSearchParams("palace=命宮"))).toBe("ming");
    expect(parseGateFixtureFocusFromParams(new URLSearchParams("palace=官祿宮"))).toBe("guanlu");
    expect(parseGateFixtureFocusFromParams(new URLSearchParams("palace=遷移宮"))).toBe("qianyi");
    expect(parseGateFixtureFocusFromParams(new URLSearchParams("palace=福德宮"))).toBe("fude");
    expect(parseGateFixtureFocusFromParams(new URLSearchParams("palace=田宅宮"))).toBe("tianzhai");
    expect(parseGateFixtureFocusFromParams(new URLSearchParams("palace=父母宮"))).toBe("fumu");
    expect(parseGateFixtureFocusFromParams(new URLSearchParams("palace=兄弟宮"))).toBe("xiongdi");
    expect(parseGateFixtureFocusFromParams(new URLSearchParams("palace=僕役宮"))).toBe("nuppu");
    expect(parseGateFixtureFocusFromParams(new URLSearchParams("palace=子女宮"))).toBe("zinv");
  });
});

describe("parseGateFixtureFromSearch", () => {
  it("fixture + 焦點（預設 ming）", () => {
    expect(parseGateFixtureFromSearch("?fixture=partial")).toEqual({ id: "partial", focus: "ming" });
  });

  it("fixture + palace=caibo", () => {
    expect(parseGateFixtureFromSearch("?fixture=locked&palace=caibo")).toEqual({
      id: "locked",
      focus: "caibo",
    });
  });

  it("fixture + palace=fude", () => {
    expect(parseGateFixtureFromSearch("?fixture=partial&palace=fude")).toEqual({
      id: "partial",
      focus: "fude",
    });
  });

  it("fixture + palace=zinv", () => {
    expect(parseGateFixtureFromSearch("?fixture=partial&palace=zinv")).toEqual({
      id: "partial",
      focus: "zinv",
    });
  });
});

describe("PALACE_TEMPLATE_PREVIEW_SECTION_KEYS 與 palaceId 對齊（捲動錨點）", () => {
  it("預覽鍵與 constants 陣列一致", () => {
    expect([...PALACE_TEMPLATE_PREVIEW_SECTION_KEYS]).toEqual([...TWELVE_KEYS]);
  });

  it("每個焦點對應 SECTION_KEY_TO_PALACE_ID（非 undefined）", () => {
    for (const focus of ALL_FOCUS) {
      const sk = PREVIEW_FOCUS_TO_SECTION_KEY[focus];
      expect(SECTION_KEY_TO_PALACE_ID[sk]).toBeDefined();
    }
  });
});
