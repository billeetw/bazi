/**
 * buildLifeBookDocument 煙霧測試
 * 目的：改 chartJson / contentDb / LifeBookDocument 結構時，避免組裝器靜默壞掉
 */
import { describe, it, expect } from "vitest";
import { buildLifeBookDocument } from "../src/lifebook-viewer/utils/lifebook-assembler";
import { LIFEBOOK_SCHEMA_VERSION, LIFEBOOK_GENERATOR_VERSION } from "../js/lifebook-version.js";

describe("buildLifeBookDocument", () => {
  it("fills meta.schema_version and meta.generator_version from constants", () => {
    const doc = buildLifeBookDocument({
      chartJson: null,
      lifeBookJson: { sections: {} },
      meta: { client_name: "測試", birth_info: "1990-01-01" },
    });
    expect(doc.meta.schema_version).toBe(LIFEBOOK_SCHEMA_VERSION);
    expect(doc.meta.generator_version).toBe(LIFEBOOK_GENERATOR_VERSION);
  });

  it("produces sections for all SECTION_ORDER keys", () => {
    const doc = buildLifeBookDocument({
      chartJson: null,
      lifeBookJson: {
        sections: {
          s02: { title: "命宮綜合分析", strategic_advice: "建議一" },
        },
      },
      meta: { client_name: "測試", birth_info: "1990-01-01" },
    });
    expect(doc.sections).toBeDefined();
    expect(typeof doc.sections).toBe("object");
    expect(doc.sections.s02).toBeDefined();
    expect(doc.sections.s02?.title).toBe("命宮綜合分析");
    expect(doc.sections.s02?.strategic_advice).toBe("建議一");
    expect(doc.sections.s03).toBeDefined();
    expect(doc.sections.s03?.section_key).toBe("s03");
  });

  it("passes through expert when provided", () => {
    const expertBlock = {
      infer_insight: { s02: "insight" },
      per_section: { s02: { core_insight: "x", evidence: [], implications: [], suggestions: [] } },
    };
    const doc = buildLifeBookDocument({
      chartJson: null,
      lifeBookJson: { sections: {}, expert: expertBlock },
      meta: { client_name: "測試", birth_info: "1990-01-01" },
    });
    expect(doc.expert).toBeDefined();
    expect(doc.expert?.infer_insight?.s02).toBe("insight");
    expect(doc.expert?.per_section?.s02?.core_insight).toBe("x");
  });

  it("fills star_palace_quotes from contentDb when chart has mainStars", () => {
    const doc = buildLifeBookDocument({
      chartJson: {
        ziwei: {
          mainStars: {
            命宮: ["紫微", "天府"],
            福德: ["天同"],
          },
        },
      } as unknown as Record<string, unknown>,
      contentDb: {
        starPalaces: {
          紫微_命宮: "紫微在命宮的評語",
          天同_福德: "天同福德的評語",
        },
      },
      lifeBookJson: {
        sections: { s01: { title: "福德" }, s02: { title: "命宮" } },
      },
      meta: { client_name: "測試", birth_info: "1990-01-01" },
    });
    expect(doc.sections.s01?.star_palace_quotes).toBeDefined();
    expect(doc.sections.s01?.star_palace_quotes?.["天同_福德"]).toBe("天同福德的評語");
    expect(doc.sections.s02?.star_palace_quotes?.["紫微_命宮"]).toBe("紫微在命宮的評語");
  });
});
