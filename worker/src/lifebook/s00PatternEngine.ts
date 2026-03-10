/**
 * s00 四化判讀引擎：將三層四化 events 轉成規則命中與判讀文案
 */

import {
  S00_FOUR_TRANSFORM_RULES,
  type S00RuleDef,
  type S00RuleId,
} from "./s00FourTransformRules.js";

export type SiHuaLayer = "natal" | "decade" | "year";
export type SiHuaTransform = "lu" | "quan" | "ke" | "ji";

export interface SiHuaEvent {
  layer: SiHuaLayer;
  transform: SiHuaTransform;
  starName: string;
  fromPalace: string;
  toPalace: string;
}

export interface PatternHit {
  ruleId: S00RuleId;
  priority: number;
  evidence: Record<string, string | number | string[]>;
  message: string;
  action: string;
}

const LAYER_LABEL: Record<SiHuaLayer, string> = {
  natal: "本命",
  decade: "大限",
  year: "流年",
};
const TRANSFORM_LABEL: Record<SiHuaTransform, string> = {
  lu: "祿",
  quan: "權",
  ke: "科",
  ji: "忌",
};

function norm(p: string): string {
  if (!p) return "";
  const s = p.trim().replace(/宮$/, "");
  return s === "命" ? "命宮" : s ? s + "宮" : p;
}

function fillTemplate(tpl: string, evidence: Record<string, string | number | string[]>): string {
  let out = tpl;
  for (const [k, v] of Object.entries(evidence)) {
    const val = Array.isArray(v) ? v.join("、") : String(v);
    out = out.replace(new RegExp(`\\{${k}\\}`, "g"), val);
  }
  return out.replace(/\{[^}]+\}/g, "").trim();
}

type WhenFn = (events: SiHuaEvent[]) => { hit: boolean; evidence: Record<string, string | number | string[]> };

const RULE_WHEN: Partial<Record<S00RuleId, WhenFn>> = {
  R01_SAME_STAR_OVERLAP: (events) => {
    const byStar = new Map<string, SiHuaLayer[]>();
    for (const e of events) {
      const list = byStar.get(e.starName) ?? [];
      if (!list.includes(e.layer)) list.push(e.layer);
      byStar.set(e.starName, list);
    }
    const multi = [...byStar.entries()].filter(([, layers]) => layers.length >= 2);
    if (multi.length === 0) return { hit: false, evidence: {} };
    const [star, layers] = multi.sort((a, b) => b[1].length - a[1].length)[0];
    return {
      hit: true,
      evidence: { star, layers: layers.map((l) => LAYER_LABEL[l]) },
    };
  },

  R02_SAME_PALACE_OVERLAP: (events) => {
    const byTo = new Map<string, SiHuaLayer[]>();
    for (const e of events) {
      const key = norm(e.toPalace);
      if (!key) continue;
      const list = byTo.get(key) ?? [];
      if (!list.includes(e.layer)) list.push(e.layer);
      byTo.set(key, list);
    }
    const multi = [...byTo.entries()].filter(([, layers]) => layers.length >= 2);
    if (multi.length === 0) return { hit: false, evidence: {} };
    const [palace, layers] = multi.sort((a, b) => b[1].length - a[1].length)[0];
    return {
      hit: true,
      evidence: { palace, layers: layers.map((l) => LAYER_LABEL[l]) },
    };
  },

  R03_SAME_TRANSFORM_OVERLAP: (events) => {
    const byTransformPalace = new Map<string, SiHuaLayer[]>();
    for (const e of events) {
      const key = `${e.transform}|${norm(e.toPalace)}`;
      const list = byTransformPalace.get(key) ?? [];
      if (!list.includes(e.layer)) list.push(e.layer);
      byTransformPalace.set(key, list);
    }
    const multi = [...byTransformPalace.entries()].filter(([, layers]) => layers.length >= 2);
    if (multi.length === 0) return { hit: false, evidence: {} };
    const [key, layers] = multi.sort((a, b) => b[1].length - a[1].length)[0];
    const [, palace] = key.split("|");
    const transform = events.find((e) => `${e.transform}|${norm(e.toPalace)}` === key)?.transform ?? "lu";
    return {
      hit: true,
      evidence: {
        transform: TRANSFORM_LABEL[transform],
        palace,
        layers: layers.map((l) => LAYER_LABEL[l]),
      },
    };
  },

  R04_SAME_STAR_LU_JI: (events) => {
    const byStar = new Map<string, Set<SiHuaTransform>>();
    for (const e of events) {
      const set = byStar.get(e.starName) ?? new Set();
      set.add(e.transform);
      byStar.set(e.starName, set);
    }
    const star = [...byStar.entries()].find(([, set]) => set.has("lu") && set.has("ji"))?.[0];
    if (!star) return { hit: false, evidence: {} };
    return { hit: true, evidence: { star } };
  },

  R05_SAME_PALACE_LU_JI: (events) => {
    const byTo = new Map<string, Set<SiHuaTransform>>();
    for (const e of events) {
      const key = norm(e.toPalace);
      if (!key) continue;
      const set = byTo.get(key) ?? new Set();
      set.add(e.transform);
      byTo.set(key, set);
    }
    const palace = [...byTo.entries()].find(([, set]) => set.has("lu") && set.has("ji"))?.[0];
    if (!palace) return { hit: false, evidence: {} };
    return { hit: true, evidence: { palace } };
  },

  R06_QUAN_JI_SAME_POINT: (events) => {
    const byStar = new Map<string, Set<SiHuaTransform>>();
    const byTo = new Map<string, Set<SiHuaTransform>>();
    for (const e of events) {
      if (e.transform === "quan" || e.transform === "ji") {
        const setS = byStar.get(e.starName) ?? new Set();
        setS.add(e.transform);
        byStar.set(e.starName, setS);
        const to = norm(e.toPalace);
        if (to) {
          const setP = byTo.get(to) ?? new Set();
          setP.add(e.transform);
          byTo.set(to, setP);
        }
      }
    }
    const star = [...byStar.entries()].find(([, set]) => set.has("quan") && set.has("ji"))?.[0];
    const palace = [...byTo.entries()].find(([, set]) => set.has("quan") && set.has("ji"))?.[0];
    const target = star ?? palace ?? "";
    if (!target) return { hit: false, evidence: {} };
    return { hit: true, evidence: { target } };
  },

  R07_KE_JI_SAME_POINT: (events) => {
    const byStar = new Map<string, Set<SiHuaTransform>>();
    for (const e of events) {
      const set = byStar.get(e.starName) ?? new Set();
      set.add(e.transform);
      byStar.set(e.starName, set);
    }
    const byTo = new Map<string, Set<SiHuaTransform>>();
    for (const e of events) {
      const key = norm(e.toPalace);
      if (key) {
        const set = byTo.get(key) ?? new Set();
        set.add(e.transform);
        byTo.set(key, set);
      }
    }
    const star = [...byStar.entries()].find(([, set]) => set.has("ke") && set.has("ji"))?.[0];
    const palace = [...byTo.entries()].find(([, set]) => set.has("ke") && set.has("ji"))?.[0];
    const target = star ?? palace ?? "";
    if (!target) return { hit: false, evidence: {} };
    return { hit: true, evidence: { target } };
  },

  R08_DECADE_YEAR_SYNC: (events) => {
    const dec = events.filter((e) => e.layer === "decade");
    const year = events.filter((e) => e.layer === "year");
    if (dec.length === 0 || year.length === 0) return { hit: false, evidence: {} };
    const decSet = new Set(dec.map((e) => `${e.starName}|${e.transform}`));
    const yearSet = new Set(year.map((e) => `${e.starName}|${e.transform}`));
    const same = [...decSet].filter((k) => yearSet.has(k)).length;
    if (same < 3) return { hit: false, evidence: {} };
    return { hit: true, evidence: {} };
  },

  R09_DECADE_YEAR_SAME_JI: (events) => {
    const decJi = events.find((e) => e.layer === "decade" && e.transform === "ji");
    const yearJi = events.find((e) => e.layer === "year" && e.transform === "ji");
    if (!decJi || !yearJi) return { hit: false, evidence: {} };
    const sameStar = decJi.starName === yearJi.starName;
    const samePalace = norm(decJi.toPalace) === norm(yearJi.toPalace);
    if (!sameStar && !samePalace) return { hit: false, evidence: {} };
    return {
      hit: true,
      evidence: {
        star: decJi.starName,
        palace: norm(decJi.toPalace) || norm(yearJi.toPalace),
      },
    };
  },

  R10_DECADE_YEAR_SAME_LU: (events) => {
    const decLu = events.find((e) => e.layer === "decade" && e.transform === "lu");
    const yearLu = events.find((e) => e.layer === "year" && e.transform === "lu");
    if (!decLu || !yearLu) return { hit: false, evidence: {} };
    const sameStar = decLu.starName === yearLu.starName;
    const samePalace = norm(decLu.toPalace) === norm(yearLu.toPalace);
    if (!sameStar && !samePalace) return { hit: false, evidence: {} };
    return {
      hit: true,
      evidence: {
        star: decLu.starName,
        palace: norm(decLu.toPalace) || norm(yearLu.toPalace),
      },
    };
  },

  R11_JI_FROM_A_TO_B: (events) => {
    const ji = events.filter((e) => e.transform === "ji" && e.fromPalace && e.toPalace);
    if (ji.length === 0) return { hit: false, evidence: {} };
    const e = ji[0];
    return {
      hit: true,
      evidence: {
        star: e.starName,
        fromPalace: norm(e.fromPalace),
        toPalace: norm(e.toPalace),
      },
    };
  },

  R12_LU_INTO_PALACE: (events) => {
    const lu = events.find((e) => e.transform === "lu" && norm(e.toPalace));
    if (!lu) return { hit: false, evidence: {} };
    return { hit: true, evidence: { star: lu.starName, toPalace: norm(lu.toPalace) } };
  },

  R13_QUAN_INTO_PALACE: (events) => {
    const quan = events.find((e) => e.transform === "quan" && norm(e.toPalace));
    if (!quan) return { hit: false, evidence: {} };
    return { hit: true, evidence: { star: quan.starName, toPalace: norm(quan.toPalace) } };
  },

  R14_KE_INTO_PALACE: (events) => {
    const ke = events.find((e) => e.transform === "ke" && norm(e.toPalace));
    if (!ke) return { hit: false, evidence: {} };
    return { hit: true, evidence: { star: ke.starName, toPalace: norm(ke.toPalace) } };
  },

  R15_LU_CONCENTRATED: (events) => {
    const toPalaces = events.filter((e) => e.transform === "lu").map((e) => norm(e.toPalace)).filter(Boolean);
    const unique = [...new Set(toPalaces)];
    if (unique.length > 2 || unique.length === 0) return { hit: false, evidence: {} };
    return { hit: true, evidence: { palaces: unique } };
  },

  R16_JI_DISPERSED: (events) => {
    const toPalaces = events.filter((e) => e.transform === "ji").map((e) => norm(e.toPalace)).filter(Boolean);
    const unique = [...new Set(toPalaces)];
    if (unique.length < 4) return { hit: false, evidence: {} };
    return { hit: true, evidence: {} };
  },

  R17_QUAN_STRONG_KE_WEAK: (events) => {
    const hasQuan = events.some((e) => e.transform === "quan");
    const hasKe = events.some((e) => e.transform === "ke");
    if (!hasQuan || hasKe) return { hit: false, evidence: {} };
    return { hit: true, evidence: {} };
  },

  R18_KE_STRONG_QUAN_WEAK: (events) => {
    const hasKe = events.some((e) => e.transform === "ke");
    const hasQuan = events.some((e) => e.transform === "quan");
    if (!hasKe || hasQuan) return { hit: false, evidence: {} };
    return { hit: true, evidence: {} };
  },

  R19_ONLY_LU_JI: (events) => {
    const types = new Set(events.map((e) => e.transform));
    if (types.has("quan") || types.has("ke")) return { hit: false, evidence: {} };
    if (types.has("lu") && types.has("ji")) return { hit: true, evidence: {} };
    return { hit: false, evidence: {} };
  },

  R20_SAME_PALACE_SAME_TRANSFORM_STACK: (events) => {
    const byKey = new Map<string, number>();
    for (const e of events) {
      const key = `${norm(e.toPalace)}|${e.transform}`;
      byKey.set(key, (byKey.get(key) ?? 0) + 1);
    }
    const multi = [...byKey.entries()].filter(([, n]) => n >= 2);
    if (multi.length === 0) return { hit: false, evidence: {} };
    const [[key, count]] = multi.sort((a, b) => b[1] - a[1]);
    const [palace, transform] = key.split("|");
    const transformLabel = transform === "lu" ? "祿" : transform === "ji" ? "忌" : transform === "quan" ? "權" : "科";
    return {
      hit: true,
      evidence: { palace, transform: transformLabel, count },
    };
  },
};

const RULE_MAP = new Map(S00_FOUR_TRANSFORM_RULES.map((r) => [r.id, r]));

/**
 * 依規則庫與 when 函式，產出所有命中的 PatternHit（已依 priority 排序）
 */
export function evaluateFourTransformPatterns(events: SiHuaEvent[]): PatternHit[] {
  const hits: PatternHit[] = [];
  for (const rule of S00_FOUR_TRANSFORM_RULES) {
    const whenFn = RULE_WHEN[rule.id];
    if (!whenFn) continue;
    const { hit, evidence } = whenFn(events);
    if (!hit || Object.keys(evidence).length === 0) continue;
    const message = fillTemplate(rule.messageTemplate, evidence);
    const action = fillTemplate(rule.actionTemplate, evidence);
    if (!message) continue;
    hits.push({
      ruleId: rule.id,
      priority: rule.priority,
      evidence,
      message,
      action,
    });
  }
  hits.sort((a, b) => b.priority - a.priority);
  return hits;
}

/**
 * 從 PatternHit 產出 s00 判讀段落（去重：同句只留一次）
 */
export function formatPatternNarrative(hits: PatternHit[], maxItems = 8): string {
  const seen = new Set<string>();
  const lines: string[] = [];
  for (const h of hits) {
    if (lines.length >= maxItems) break;
    if (seen.has(h.message)) continue;
    seen.add(h.message);
    lines.push(h.message);
  }
  return lines.length > 0 ? lines.join("\n\n") : "";
}

/**
 * 從 PatternHit 產出今年建議（取 action 前 N 條，去重）
 */
export function formatPatternActions(hits: PatternHit[], maxItems = 3): string {
  const seen = new Set<string>();
  const lines: string[] = [];
  for (const h of hits) {
    if (lines.length >= maxItems) break;
    if (!h.action || seen.has(h.action)) continue;
    seen.add(h.action);
    lines.push(h.action);
  }
  return lines.length > 0 ? lines.map((a, i) => `${i + 1}. ${a}`).join("\n") : "";
}

/**
 * 模組一（s03）用：產出 Top N 條 PatternHit，每條含【命中規則】證據／判讀／操作
 */
export function formatPatternTopBlocksForModule1(hits: PatternHit[], maxItems = 5): string {
  const lines: string[] = [];
  for (let i = 0; i < Math.min(hits.length, maxItems); i++) {
    const h = hits[i];
    const evidenceLine =
      typeof h.evidence === "object" && h.evidence !== null
        ? Object.entries(h.evidence)
            .map(([k, v]) => {
              const val = Array.isArray(v) ? v.join("、") : String(v);
              return val ? `${k}：${val}` : "";
            })
            .filter(Boolean)
            .join("；") || "（見上方四化）"
        : "（見上方四化）";
    lines.push(
      `【命中規則】${h.ruleId}`,
      `證據：${evidenceLine}`,
      `判讀：${h.message}`,
      `操作：${h.action}`,
      ""
    );
  }
  return lines.filter(Boolean).join("\n").trimEnd();
}

/**
 * 從 events 彙整 hotStars（被多層命中的星）、hotPalaces（被多層命中的宮）
 */
export function getHotStarsAndPalaces(events: SiHuaEvent[]): {
  hotStars: string[];
  hotPalaces: string[];
} {
  const starLayers = new Map<string, number>();
  const palaceLayers = new Map<string, number>();
  for (const e of events) {
    starLayers.set(e.starName, (starLayers.get(e.starName) ?? 0) + 1);
    const to = norm(e.toPalace);
    if (to) palaceLayers.set(to, (palaceLayers.get(to) ?? 0) + 1);
  }
  const hotStars = [...starLayers.entries()]
    .filter(([, n]) => n >= 2)
    .sort((a, b) => b[1] - a[1])
    .map(([s]) => s);
  const hotPalaces = [...palaceLayers.entries()]
    .filter(([, n]) => n >= 2)
    .sort((a, b) => b[1] - a[1])
    .map(([p]) => p);
  return { hotStars, hotPalaces };
}
