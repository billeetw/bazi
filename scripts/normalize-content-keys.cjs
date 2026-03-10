#!/usr/bin/env node
/**
 * Normalize content JSON keys to convention:
 * - starPalacesAux key palace part: 兄弟宮→兄弟, 財帛宮→財帛, ... (命宮 unchanged)
 * Usage: node scripts/normalize-content-keys.cjs [--dry-run] [--write]
 *   --dry-run (default): print changes only
 *   --write: apply changes and run validator
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const ROOT = path.resolve(__dirname, "..");
const CONTENT_DIR = path.join(ROOT, "worker", "content");

const PALACE_NORMALIZE = {
  兄弟宮: "兄弟",
  夫妻宮: "夫妻",
  子女宮: "子女",
  財帛宮: "財帛",
  疾厄宮: "疾厄",
  遷移宮: "遷移",
  僕役宮: "僕役",
  官祿宮: "官祿",
  田宅宮: "田宅",
  福德宮: "福德",
  父母宮: "父母",
};
// 命宮 stays 命宮

function normalizePalaceInKey(key) {
  if (typeof key !== "string" || !key.includes("_")) return key;
  const [star, palace] = key.split("_");
  if (!palace) return key;
  const normalized = PALACE_NORMALIZE[palace] ?? (palace === "命宮" ? "命宮" : palace.replace(/宮$/, "") === "命" ? "命宮" : palace.endsWith("宮") ? palace.slice(0, -1) : palace);
  if (normalized === palace) return key;
  return `${star}_${normalized}`;
}

function normalizeRecord(rec) {
  if (!rec || typeof rec !== "object") return { changed: false, next: rec };
  const next = {};
  let changed = false;
  for (const [k, v] of Object.entries(rec)) {
    const nk = normalizePalaceInKey(k);
    if (nk !== k) changed = true;
    next[nk] = v;
  }
  return { changed, next };
}

function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run") || !args.includes("--write");

  const filePath = path.join(CONTENT_DIR, "starPalacesAux-zh-TW.json");
  if (!fs.existsSync(filePath)) {
    console.error("Missing:", filePath);
    process.exit(1);
  }
  const raw = fs.readFileSync(filePath, "utf8");
  const data = JSON.parse(raw);

  const aux = data.starPalacesAux ?? data;
  const action = data.starPalacesAuxAction ?? {};
  const risk = data.starPalacesAuxRisk ?? {};
  const r1 = normalizeRecord(aux);
  const r2 = normalizeRecord(action);
  const r3 = normalizeRecord(risk);

  if (!r1.changed && !r2.changed && !r3.changed) {
    console.log("normalize-content-keys: no keys to normalize.");
    process.exit(0);
  }

  if (r1.changed) console.log("starPalacesAux: keys to normalize", Object.keys(aux).filter((k) => normalizePalaceInKey(k) !== k).length);
  if (r2.changed) console.log("starPalacesAuxAction: keys to normalize", Object.keys(action).filter((k) => normalizePalaceInKey(k) !== k).length);
  if (r3.changed) console.log("starPalacesAuxRisk: keys to normalize", Object.keys(risk).filter((k) => normalizePalaceInKey(k) !== k).length);

  if (dryRun) {
    console.log("Run with --write to apply and run validator.");
    process.exit(0);
  }

  const out = { ...data };
  out.starPalacesAux = r1.next;
  out.starPalacesAuxAction = r2.next;
  out.starPalacesAuxRisk = r3.next;
  fs.writeFileSync(filePath, JSON.stringify(out, null, 2) + "\n", "utf8");
  console.log("Wrote", filePath);
  execSync("npm run validate-content", { cwd: ROOT, stdio: "inherit" });
}

main();
