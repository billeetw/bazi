#!/usr/bin/env node
/**
 * Content JSON Validator
 * Validates worker/content lifebookSection, starPalacesAux/AuxAction/AuxRisk,
 * starMetadata (Phase 2), duplicate keys, and palace risk corpus.
 * Run: node scripts/validate-content-json.cjs
 */

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const CONTENT_DIR = path.join(ROOT, "worker", "content");

const SECTION_KEYS = [
  "s00", "s03", "s02", "s10", "s01", "s05", "s06", "s07", "s08", "s04", "s09",
  "s11", "s12", "s13", "s14", "s15", "s15a", "s16", "s17", "s18", "s19", "s20", "s21",
];

const PALACE_KEYS = [
  "命宮", "兄弟", "夫妻", "子女", "財帛", "疾厄", "遷移", "僕役", "官祿", "田宅", "福德", "父母",
];

const REQUIRED_SECTION_FIELDS = ["structure_analysis", "behavior_pattern", "blind_spots", "strategic_advice"];

const CONTENT_FILES_FOR_DUP_CHECK = [
  "lifebookSection-zh-TW.json",
  "starPalacesAux-zh-TW.json",
  "starMetadata.json",
  "palaceRiskCorpus-zh-TW.json",
  "narrativeCorpus-zh-TW.json",
];

function loadJson(filePath) {
  try {
    const raw = fs.readFileSync(filePath, "utf8");
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

/** Detect duplicate keys within the same object. Tracks depth via { } and records keys per depth. */
function detectDuplicateKeysInFile(filePath, errors) {
  if (!fs.existsSync(filePath)) return;
  const raw = fs.readFileSync(filePath, "utf8");
  const basename = path.basename(filePath);
  let depth = 0;
  const keysByDepth = [new Set()];
  const lineByDepthKey = [{}];
  let i = 0;
  const len = raw.length;
  let line = 1;
  while (i < len) {
    const rest = raw.slice(i);
    const skipSpace = /^\s*/.exec(rest);
    if (skipSpace[0].includes("\n")) line += (skipSpace[0].match(/\n/g) || []).length;
    i += skipSpace[0].length;
    if (i >= len) break;
    const c = raw[i];
    if (c === "{") {
      depth++;
      while (keysByDepth.length <= depth) {
        keysByDepth.push(new Set());
        lineByDepthKey.push({});
      }
      i++;
      continue;
    }
    if (c === "}") {
      depth--;
      i++;
      continue;
    }
    if (c === '"') {
      const keyEnd = raw.indexOf('"', i + 1);
      if (keyEnd === -1) break;
      let key = raw.slice(i + 1, keyEnd);
      let j = keyEnd + 1;
      while (j < len && /[\s:]/.test(raw[j])) { if (raw[j] === "\n") line++; j++; }
      if (j < len && raw[j] === ":") {
        if (keysByDepth[depth].has(key)) {
          errors.push(`Duplicate key "${key}" in ${basename} (line ${line}; also at line ${lineByDepthKey[depth][key]})`);
        } else {
          keysByDepth[depth].add(key);
          lineByDepthKey[depth][key] = line;
        }
      }
      i = keyEnd + 1;
      continue;
    }
    i++;
  }
}

function validateStarPalaceKey(key, errors) {
  if (typeof key !== "string" || !key.includes("_")) {
    errors.push(`Invalid star×palace key (expected "星名_宮位"): ${key}`);
    return;
  }
  const [, palace] = key.split("_");
  if (!palace || !PALACE_KEYS.includes(palace)) {
    errors.push(`Unknown palace in key "${key}" (palace: "${palace}"); allowed: ${PALACE_KEYS.join(", ")}`);
  }
}

function validateLifebookSection(errors) {
  const filePath = path.join(CONTENT_DIR, "lifebookSection-zh-TW.json");
  if (!fs.existsSync(filePath)) {
    errors.push(`Missing file: ${filePath}`);
    return;
  }
  const data = loadJson(filePath);
  if (!data || typeof data !== "object") {
    errors.push(`Invalid or empty JSON: ${filePath}`);
    return;
  }
  const keys = Object.keys(data);
  const missing = SECTION_KEYS.filter((k) => !keys.includes(k));
  const extra = keys.filter((k) => !SECTION_KEYS.includes(k));
  if (missing.length) errors.push(`lifebookSection: missing section keys: ${missing.join(", ")}`);
  if (extra.length) errors.push(`lifebookSection: unexpected section keys: ${extra.join(", ")}`);

  for (const sectionKey of SECTION_KEYS) {
    const section = data[sectionKey];
    if (!section) continue;
    for (const field of REQUIRED_SECTION_FIELDS) {
      if (!Object.prototype.hasOwnProperty.call(section, field)) {
        errors.push(`lifebookSection.${sectionKey}: missing field "${field}"`);
      }
    }
  }
}

function validateAuxTriple(errors) {
  const filePath = path.join(CONTENT_DIR, "starPalacesAux-zh-TW.json");
  if (!fs.existsSync(filePath)) {
    errors.push(`Missing file: ${filePath}`);
    return;
  }
  const data = loadJson(filePath);
  if (!data || typeof data !== "object") {
    errors.push(`Invalid or empty JSON: ${filePath}`);
    return;
  }

  const aux = data.starPalacesAux ?? data;
  const action = data.starPalacesAuxAction ?? {};
  const risk = data.starPalacesAuxRisk ?? {};

  const auxKeys = Object.keys(aux);
  const actionKeys = Object.keys(action);
  const riskKeys = Object.keys(risk);

  for (const key of auxKeys) validateStarPalaceKey(key, errors);
  for (const key of actionKeys) validateStarPalaceKey(key, errors);
  for (const key of riskKeys) validateStarPalaceKey(key, errors);

  const onlyInAction = actionKeys.filter((k) => !auxKeys.includes(k));
  const onlyInRisk = riskKeys.filter((k) => !auxKeys.includes(k));
  if (onlyInAction.length) {
    errors.push(`starPalacesAuxAction: keys not in Aux (orphans): ${onlyInAction.slice(0, 5).join(", ")}${onlyInAction.length > 5 ? ` ... +${onlyInAction.length - 5} more` : ""}`);
  }
  if (onlyInRisk.length) {
    errors.push(`starPalacesAuxRisk: keys not in Aux (orphans): ${onlyInRisk.slice(0, 5).join(", ")}${onlyInRisk.length > 5 ? ` ... +${onlyInRisk.length - 5} more` : ""}`);
  }

  for (const [k, v] of Object.entries(risk)) {
    if (typeof v !== "number" || v < 1 || v > 5) {
      errors.push(`starPalacesAuxRisk["${k}"]: value must be number 1–5, got ${typeof v} ${v}`);
    }
  }
}

function validateStarMetadata(errors) {
  const filePath = path.join(CONTENT_DIR, "starMetadata.json");
  if (!fs.existsSync(filePath)) {
    errors.push(`Missing file: ${filePath}`);
    return;
  }
  const data = loadJson(filePath);
  if (!data || typeof data !== "object") {
    errors.push(`Invalid or empty JSON: ${filePath}`);
    return;
  }
  const mapping = data.starNameZhToId;
  const stars = data.stars;
  if (!mapping || typeof mapping !== "object") {
    errors.push("starMetadata.json: missing or invalid starNameZhToId");
    return;
  }
  if (!stars || typeof stars !== "object") {
    errors.push("starMetadata.json: missing or invalid stars");
    return;
  }
  for (const [nameZh, starId] of Object.entries(mapping)) {
    if (!stars[starId]) {
      errors.push(`starMetadata: starNameZhToId["${nameZh}"] => "${starId}" but stars["${starId}"] is missing`);
      continue;
    }
    const rec = stars[starId];
    if (typeof rec.base_weight !== "number") {
      errors.push(`starMetadata.stars["${starId}"]: missing or invalid base_weight`);
    }
    if (typeof rec.base_risk !== "number" || rec.base_risk < 1 || rec.base_risk > 5) {
      errors.push(`starMetadata.stars["${starId}"]: base_risk must be number 1–5, got ${rec.base_risk}`);
    }
  }
  const auxPath = path.join(CONTENT_DIR, "starPalacesAux-zh-TW.json");
  if (fs.existsSync(auxPath)) {
    const auxData = loadJson(auxPath);
    const aux = auxData?.starPalacesAux ?? auxData;
    const risk = auxData?.starPalacesAuxRisk ?? {};
    if (aux && typeof aux === "object") {
      const starNames = new Set();
      for (const key of Object.keys(aux)) {
        if (key.includes("_")) starNames.add(key.split("_")[0]);
      }
      for (const key of Object.keys(risk)) {
        if (key.includes("_")) starNames.add(key.split("_")[0]);
      }
      for (const nameZh of starNames) {
        if (!mapping[nameZh]) {
          errors.push(`starMetadata: star "${nameZh}" appears in starPalacesAux/AuxRisk but is missing from starNameZhToId`);
        }
      }
    }
  }
}

function validatePalaceRiskCorpus(errors) {
  const filePath = path.join(CONTENT_DIR, "palaceRiskCorpus-zh-TW.json");
  if (!fs.existsSync(filePath)) {
    errors.push(`Missing file: ${filePath} (required for riskLevel ≥4 defensive copy)`);
    return;
  }
  const data = loadJson(filePath);
  if (!data || typeof data !== "object") {
    errors.push(`Invalid or empty JSON: ${filePath}`);
    return;
  }
  const advice = data.palaceActionAdvice;
  if (!advice || typeof advice !== "object") {
    errors.push("palaceRiskCorpus-zh-TW.json: missing or invalid palaceActionAdvice");
    return;
  }
  if (!advice.riskLevel_4 || !advice.riskLevel_5) {
    errors.push("palaceRiskCorpus: palaceActionAdvice must have riskLevel_4 and riskLevel_5 for defensive tone");
  }
}

function validateNarrativeCorpus(errors) {
  const filePath = path.join(CONTENT_DIR, "narrativeCorpus-zh-TW.json");
  if (!fs.existsSync(filePath)) {
    errors.push(`Missing file: ${filePath} (required for s00 narrative tone)`);
    return;
  }
  const data = loadJson(filePath);
  if (!data || typeof data !== "object") {
    errors.push(`Invalid or empty JSON: ${filePath}`);
    return;
  }
  if (!data.s00 || typeof data.s00 !== "object") {
    errors.push("narrativeCorpus-zh-TW.json: missing or invalid s00");
    return;
  }
  const ruleKeys = Object.keys(data.s00).filter((k) => k !== "description");
  if (ruleKeys.length === 0) {
    errors.push("narrativeCorpus: s00 must have at least one rule corpus (e.g. sameStarOverlap, samePalaceLuStack)");
    return;
  }
  const requiredArrays = ["openers", "explainers", "advisers"];
  for (const ruleKey of ruleKeys) {
    const rule = data.s00[ruleKey];
    if (!rule || typeof rule !== "object") {
      errors.push(`narrativeCorpus.s00["${ruleKey}"]: must be an object`);
      continue;
    }
    for (const key of requiredArrays) {
      const arr = rule[key];
      if (!Array.isArray(arr) || arr.length === 0) {
        errors.push(`narrativeCorpus.s00.${ruleKey}: ${key} must be a non-empty array`);
      }
    }
  }
}

function validateDuplicateKeys(errors) {
  for (const file of CONTENT_FILES_FOR_DUP_CHECK) {
    const filePath = path.join(CONTENT_DIR, file);
    detectDuplicateKeysInFile(filePath, errors);
  }
}

function main() {
  const errors = [];
  validateLifebookSection(errors);
  validateAuxTriple(errors);
  validateStarMetadata(errors);
  validatePalaceRiskCorpus(errors);
  validateNarrativeCorpus(errors);
  validateDuplicateKeys(errors);

  if (errors.length === 0) {
    console.log("validate-content-json: OK (lifebookSection + Aux + starMetadata + palaceRiskCorpus + narrativeCorpus + no duplicate keys)");
    process.exit(0);
  }
  console.error("validate-content-json: FAILED\n");
  errors.forEach((e) => console.error("  -", e));
  process.exit(1);
}

main();
