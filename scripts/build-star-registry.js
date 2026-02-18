#!/usr/bin/env node
/**
 * 從 data/star-registry.json 生成：
 * - js/calc/star-registry-generated.js（前端 ES module）
 * - worker/content/star-registry.json（Worker 用）
 * Run: node scripts/build-star-registry.js
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const registryPath = path.join(__dirname, "../data/star-registry.json");
const outPath = path.join(__dirname, "../js/calc/star-registry-generated.js");
const workerOutPath = path.join(__dirname, "../worker/content/star-registry.json");

const registry = JSON.parse(fs.readFileSync(registryPath, "utf8"));

const ZH_TO_EN = {};
const EN_TO_ZH = {};
const STAR_WUXING_MAP = {};
const EN_STAR_TO_ZH_FOR_WUXING = {};

for (const s of registry.stars) {
  const zh = s.zh;
  const en = s.en;
  ZH_TO_EN[zh] = en;
  if (s.zhVariants) {
    for (const v of s.zhVariants) ZH_TO_EN[v] = en;
  }
  EN_TO_ZH[en] = zh;
  if (s.wuxing) {
    STAR_WUXING_MAP[zh] = s.wuxing;
    EN_STAR_TO_ZH_FOR_WUXING[en] = zh;
  }
}

const js = `/* AUTO-GENERATED from data/star-registry.json - DO NOT EDIT */
/* Run: node scripts/build-star-registry.js */

export const ZH_TO_EN = ${JSON.stringify(ZH_TO_EN, null, 2)};
export const EN_TO_ZH = ${JSON.stringify(EN_TO_ZH, null, 2)};
export const STAR_WUXING_MAP = ${JSON.stringify(STAR_WUXING_MAP, null, 2)};
export const EN_STAR_TO_ZH_FOR_WUXING = ${JSON.stringify(EN_STAR_TO_ZH_FOR_WUXING, null, 2)};
`;

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, js, "utf8");
fs.mkdirSync(path.dirname(workerOutPath), { recursive: true });
fs.copyFileSync(registryPath, workerOutPath);
console.log("Built:", outPath, workerOutPath);
