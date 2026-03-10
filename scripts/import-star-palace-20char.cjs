#!/usr/bin/env node
/**
 * 從 data/star-palace-20char-zh-TW.json 產生：
 * 1. 可匯入 D1 ui_copy_texts 的 SQL（INSERT ... ON CONFLICT DO UPDATE）
 * 2. 或合併進 worker/content/content-zh-TW.json 的 starPalaces
 *
 * 用法：
 *   node scripts/import-star-palace-20char.cjs sql     # 輸出 SQL 到 stdout
 *   node scripts/import-star-palace-20char.cjs merge   # 合併進 content-zh-TW.json（會覆寫既有同 key）
 */

const fs = require("fs");
const path = require("path");

const DATA_PATH = path.join(__dirname, "../data/star-palace-20char-zh-TW.json");
const CONTENT_ZH_TW_PATH = path.join(__dirname, "../worker/content/content-zh-TW.json");
const LOCALE = "zh-TW";
const CATEGORY = "content";
const DESCRIPTION = "輔星×12宮 20字內特質";
const UPDATED_BY = "import-star-palace-20char";

function escapeSql(str) {
  if (typeof str !== "string") return "''";
  return "'" + str.replace(/'/g, "''") + "'";
}

function main() {
  const mode = process.argv[2] || "sql";
  const raw = fs.readFileSync(DATA_PATH, "utf8");
  const data = JSON.parse(raw);
  const starPalaces = data.starPalaces || data;
  if (typeof starPalaces !== "object") {
    console.error("Invalid format: need starPalaces object");
    process.exit(1);
  }

  const now = new Date().toISOString().slice(0, 19).replace("T", " ");

  if (mode === "sql") {
    console.log("-- 輔星×12宮 20字內特質，匯入 ui_copy_texts (locale=zh-TW)");
    console.log("-- 執行後請清除 KV 快取或等 TTL 使 content/2026 重新從 D1 讀取");
    console.log("");
    for (const [key, content] of Object.entries(starPalaces)) {
      const copyKey = "starPalace." + key;
      console.log(
        "INSERT INTO ui_copy_texts (copy_key, locale, content, category, description, updated_by, updated_at, created_at)"
      );
      console.log(
        `VALUES (${escapeSql(copyKey)}, ${escapeSql(LOCALE)}, ${escapeSql(content)}, ${escapeSql(CATEGORY)}, ${escapeSql(DESCRIPTION)}, ${escapeSql(UPDATED_BY)}, ${escapeSql(now)}, ${escapeSql(now)})`
      );
      console.log(
        "ON CONFLICT(copy_key, locale) DO UPDATE SET content=excluded.content, updated_at=excluded.updated_at;"
      );
      console.log("");
    }
    return;
  }

  if (mode === "merge") {
    const contentPath = CONTENT_ZH_TW_PATH;
    const content = JSON.parse(fs.readFileSync(contentPath, "utf8"));
    if (!content.starPalaces) content.starPalaces = {};
    let count = 0;
    for (const [key, text] of Object.entries(starPalaces)) {
      content.starPalaces[key] = text;
      count++;
    }
    fs.writeFileSync(contentPath, JSON.stringify(content, null, 2) + "\n", "utf8");
    console.log("Merged " + count + " starPalace entries into " + contentPath);
    return;
  }

  console.error("Usage: node scripts/import-star-palace-20char.cjs [sql|merge]");
  process.exit(1);
}

main();
