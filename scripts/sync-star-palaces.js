#!/usr/bin/env node
/**
 * 從 worker/content/content-zh-TW.json 抽出 starPalaces，
 * 寫入 data/star-palaces-zh-TW.json（前端 content-utils fallback 用）。
 * 單一來源：只維護 content-zh-TW.json，此 script 於 build 時同步。
 * Run: node scripts/sync-star-palaces.js
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const contentPath = path.join(__dirname, "../worker/content/content-zh-TW.json");
const outPath = path.join(__dirname, "../data/star-palaces-zh-TW.json");

function main() {
  let content;
  try {
    content = JSON.parse(fs.readFileSync(contentPath, "utf8"));
  } catch (e) {
    console.error("[sync-star-palaces] Failed to read or parse content:", contentPath, e.message);
    process.exit(1);
  }

  const starPalaces = content && content.starPalaces;
  if (!starPalaces || typeof starPalaces !== "object") {
    console.error("[sync-star-palaces] content-zh-TW.json has no starPalaces object");
    process.exit(1);
  }

  const keys = Object.keys(starPalaces);
  if (keys.length === 0) {
    console.error("[sync-star-palaces] starPalaces is empty");
    process.exit(1);
  }

  const outDir = path.dirname(outPath);
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  try {
    fs.writeFileSync(outPath, JSON.stringify(starPalaces, null, 2), "utf8");
  } catch (e) {
    console.error("[sync-star-palaces] Failed to write:", outPath, e.message);
    process.exit(1);
  }

  console.log("[sync-star-palaces] OK:", keys.length, "entries ->", outPath);
}

main();
