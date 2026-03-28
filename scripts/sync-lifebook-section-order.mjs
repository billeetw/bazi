#!/usr/bin/env node
/**
 * 自 worker/data/lifebook-section-order.json 同步 SECTION_ORDER 到：
 * - expert-admin/index.html
 * - js/calc/lifeBookEngine.js
 *
 * 使用：專案根目錄執行 npm run sync:section-order
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const jsonPath = join(root, "worker", "data", "lifebook-section-order.json");

const { sectionOrder } = JSON.parse(readFileSync(jsonPath, "utf8"));
if (!Array.isArray(sectionOrder) || sectionOrder.length === 0) {
  console.error("Invalid lifebook-section-order.json: sectionOrder must be non-empty array");
  process.exit(1);
}

const expertLine = `    var SECTION_ORDER = [${sectionOrder.map((k) => `'${k}'`).join(",")}];`;
const engineBlock = `  const SECTION_ORDER = [\n    ${sectionOrder.map((k) => `"${k}"`).join(", ")},\n  ];`;

function replaceBetween(content, startMarker, endMarker, replacement) {
  const start = content.indexOf(startMarker);
  const end = content.indexOf(endMarker);
  if (start === -1 || end === -1 || end <= start) {
    throw new Error(`Markers not found or invalid: ${startMarker} / ${endMarker}`);
  }
  const before = content.slice(0, start + startMarker.length);
  const after = content.slice(end);
  return `${before}\n${replacement}\n${after}`;
}

const expertPath = join(root, "expert-admin", "index.html");
let expertHtml = readFileSync(expertPath, "utf8");
expertHtml = replaceBetween(
  expertHtml,
  "// LIFEBOOK_SECTION_ORDER_SYNC_START",
  "// LIFEBOOK_SECTION_ORDER_SYNC_END",
  expertLine
);
writeFileSync(expertPath, expertHtml, "utf8");
console.log("OK:", expertPath);

const enginePath = join(root, "js", "calc", "lifeBookEngine.js");
let engineJs = readFileSync(enginePath, "utf8");
engineJs = replaceBetween(
  engineJs,
  "// LIFEBOOK_SECTION_ORDER_SYNC_START",
  "// LIFEBOOK_SECTION_ORDER_SYNC_END",
  engineBlock
);
writeFileSync(enginePath, engineJs, "utf8");
console.log("OK:", enginePath);

console.log(`Synced ${sectionOrder.length} section keys from ${jsonPath}`);
