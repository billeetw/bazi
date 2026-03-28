/**
 * SECTION_ORDER 與 lifebook-section-order.json 一致
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { SECTION_ORDER, SECTION_TEMPLATES } from "../src/lifeBookTemplates.js";
import lifebookSectionOrder from "../data/lifebook-section-order.json";

const __dirname = dirname(fileURLToPath(import.meta.url));
const workerRoot = join(__dirname, "..");

describe("lifebook-section-order.json（唯一來源）", () => {
  it("SECTION_ORDER 與 JSON sectionOrder 完全一致", () => {
    expect([...SECTION_ORDER]).toEqual(lifebookSectionOrder.sectionOrder);
  });

  it("SECTION_TEMPLATES 涵蓋 JSON 中每一個 section_key", () => {
    const keys = new Set(SECTION_TEMPLATES.map((t) => t.section_key));
    for (const k of lifebookSectionOrder.sectionOrder) {
      expect(keys.has(k), `missing SECTION_TEMPLATES for ${k}`).toBe(true);
    }
  });

  it("expert-admin 與 lifeBookEngine 同步區塊與 JSON 一致（請先 npm run sync:section-order）", () => {
    const expectedExpert = `var SECTION_ORDER = [${lifebookSectionOrder.sectionOrder.map((k) => `'${k}'`).join(",")}];`;
    const expertPath = join(workerRoot, "..", "expert-admin", "index.html");
    const expertHtml = readFileSync(expertPath, "utf8");
    expect(expertHtml).toContain(expectedExpert);

    for (const k of lifebookSectionOrder.sectionOrder) {
      expect(expertHtml).toContain(`'${k}'`);
    }

    const enginePath = join(workerRoot, "..", "js", "calc", "lifeBookEngine.js");
    const engineJs = readFileSync(enginePath, "utf8");
    const start = engineJs.indexOf("// LIFEBOOK_SECTION_ORDER_SYNC_START");
    const end = engineJs.indexOf("// LIFEBOOK_SECTION_ORDER_SYNC_END");
    expect(start).toBeGreaterThan(-1);
    expect(end).toBeGreaterThan(start);
    const block = engineJs.slice(start, end);
    for (const k of lifebookSectionOrder.sectionOrder) {
      expect(block).toContain(`"${k}"`);
    }
  });
});
