/**
 * Cloudflare Worker: compute/all + content/2026
 * Replaces external 17gonplay-api.
 * content/2026: 優先從 D1 ui_copy_texts 讀取，DB 無資料時用靜態 JSON fallback。
 */
import { astro } from "iztro";
import { palaceNameToZhTW, FIXED_PALACES_ZH_TW } from "./palace-map.js";
import { toEnStarKey } from "./star-map.js";
import { buildContentFromRows, mergeContent, type DbContent } from "./content-from-d1.js";

import contentZhTw from "../content/content-zh-TW.json";
import contentEn from "../content/content-en.json";
import { SYSTEM_PROMPT, buildSectionUserPrompt, SECTION_ORDER } from "./life-book-prompts";

interface Env {
  CONSULT_DB?: D1Database;
  CACHE?: KVNamespace;
  OPENAI_API_KEY?: string;
}

type Lang = "zh-TW" | "zh-CN" | "en-US";
type Locale = "zh-TW" | "zh-CN" | "en";

const CORS_HEADERS: Record<string, string> = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET,POST,OPTIONS",
  "access-control-allow-headers": "content-type,authorization",
  "access-control-max-age": "86400",
};

function json(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: {
      "content-type": "application/json; charset=utf-8",
      ...CORS_HEADERS,
      ...(init.headers as Record<string, string>),
    },
  });
}

function corsPreflight() {
  return new Response(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}

function badRequest(message: string) {
  return json({ ok: false, error: message }, { status: 400 });
}

function stableChartId(input: unknown): string {
  const s = JSON.stringify(input);
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return `c_${h.toString(16)}`;
}

/**
 * hour (0-23) -> iztro timeIndex (0-11)
 * 子=0 (23,0), 丑=1 (1,2), 寅=2 (3,4), ... 亥=11 (21,22)
 */
function hourToTimeIndex(hour: number): number {
  const h = Number(hour);
  if (!Number.isFinite(h) || h < 0 || h > 23) return 0;
  if (h === 23 || h === 0) return 0;
  return Math.floor((h + 1) / 2);
}

/**
 * Extract mainStars from iztro astrolabe.
 * iztro structure: astrolabe.palaces[] with { name, majorStars[], minorStars[] }
 * Each star is { name: string } (FunctionalStar).
 */
function extractZiweiMainStars(astrolabe: unknown, language: Lang): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const p of FIXED_PALACES_ZH_TW) out[p] = [];

  const a = astrolabe as {
    palaces?: Array<{
      name?: string;
      majorStars?: Array<{ name?: string }>;
      minorStars?: Array<{ name?: string }>;
      adjectiveStars?: Array<{ name?: string }>;
    }>;
  };

  const palaces = a?.palaces ?? [];
  for (const palace of palaces) {
    const rawPalaceName = palace?.name ?? "";
    const zhTWKey = palaceNameToZhTW(rawPalaceName);
    if (!zhTWKey || !(FIXED_PALACES_ZH_TW as readonly string[]).includes(zhTWKey)) continue;

    const starNames: string[] = [];
    const addStars = (arr: Array<{ name?: string }> | undefined) => {
      if (!Array.isArray(arr)) return;
      for (const s of arr) {
        const n = s?.name;
        if (typeof n === "string" && n.trim()) {
          const name = language === "en-US" ? toEnStarKey(n.trim(), language) : n.trim();
          if (name && !starNames.includes(name)) starNames.push(name);
        }
      }
    };
    addStars(palace?.majorStars);
    addStars(palace?.minorStars);
    addStars(palace?.adjectiveStars);
    out[zhTWKey] = starNames;
  }

  return out;
}

export default {
  async fetch(req: Request, env?: Env): Promise<Response> {
    if (req.method === "OPTIONS") return corsPreflight();

    const url = new URL(req.url);

    // GET / 健康檢查（本地測試用）
    if (req.method === "GET" && url.pathname === "/") {
      return json({
        ok: true,
        service: "bazi-api",
        message: "Worker running. Use POST /compute/all or GET /content/2026",
      });
    }

    // GET /content/2026?locale=
    if (req.method === "GET" && url.pathname === "/content/2026") {
      const requestedLocale = (url.searchParams.get("locale") ?? "zh-TW").trim() as Locale;
      const localeUsed: Locale = requestedLocale === "en" ? "en" : "zh-TW";
      const dbLocale = ["en", "zh-CN", "zh-TW"].includes(requestedLocale)
        ? requestedLocale
        : localeUsed;
      const cacheKey = `content:${dbLocale}`;
      const CACHE_TTL = 3600; // 1 小時

      // 1. KV 快取優先
      const cached = await env?.CACHE?.get(cacheKey);
      if (cached) {
        try {
          const parsed = JSON.parse(cached) as Record<string, unknown>;
          return json({ ...parsed, source: "kv" });
        } catch {
          // 快取損壞時 fallback 到 D1
        }
      }

      const staticContent = (localeUsed === "en" ? contentEn : contentZhTw) as DbContent;
      const db = env?.CONSULT_DB;

      if (db) {
        try {
          const stmt = db.prepare(
            "SELECT copy_key, content FROM ui_copy_texts WHERE locale = ?"
          );
          const { results } = await stmt.bind(dbLocale).all();
          const rows = (results ?? []) as Array<{ copy_key: string; content: string }>;
          const result = rows.length > 0
            ? { ok: true, requestedLocale, localeUsed, source: "d1", ...mergeContent(staticContent, buildContentFromRows(rows)) }
            : { ok: true, requestedLocale, localeUsed, source: "static", ...staticContent };
          await env?.CACHE?.put(cacheKey, JSON.stringify(result), { expirationTtl: CACHE_TTL });
          return json(result);
        } catch (e) {
          console.warn("[content/2026] D1 query failed, using static:", e);
        }
      }

      return json({ ok: true, requestedLocale, localeUsed, source: "static", ...staticContent });
    }

    // POST /api/log-usage
    if (req.method === "POST" && url.pathname === "/api/log-usage") {
      let logBody: Record<string, unknown>;
      try {
        logBody = (await req.json()) as Record<string, unknown>;
      } catch {
        return badRequest("Invalid JSON");
      }
      const birth_year = typeof logBody?.birth_year === "number" ? logBody.birth_year : null;
      const gender = typeof logBody?.gender === "string" ? String(logBody.gender).trim().slice(0, 20) : "";
      const language = typeof logBody?.language === "string" ? String(logBody.language).trim().slice(0, 20) : "zh-TW";
      const session_id = typeof logBody?.session_id === "string" ? String(logBody.session_id).trim().slice(0, 64) : null;

      const country = req.headers.get("cf-ipcountry")?.trim().slice(0, 10) ?? null;
      const region = req.headers.get("cf-region")?.trim().slice(0, 50) ?? null;

      const id = crypto.randomUUID();
      const db = env?.CONSULT_DB;
      if (db) {
        try {
          await db
            .prepare(
              `INSERT INTO usage_logs (id, session_id, birth_year, gender, language, country, region)
               VALUES (?, ?, ?, ?, ?, ?, ?)`
            )
            .bind(id, session_id ?? null, birth_year ?? null, gender || null, language || "zh-TW", country ?? null, region ?? null)
            .run();
        } catch (e) {
          console.warn("[log-usage] D1 insert failed:", e);
        }
      }
      return json({ ok: true });
    }

    // POST /compute/all
    if (req.method === "POST" && url.pathname === "/compute/all") {
      let body: Record<string, unknown>;
      try {
        body = (await req.json()) as Record<string, unknown>;
      } catch {
        return badRequest("Invalid JSON");
      }

      const { year, month, day, hour, minute, gender, horoscopeYear } = body ?? {};
      const language: Lang = (body?.language ?? "zh-TW") as Lang;

      if (
        typeof year !== "number" ||
        typeof month !== "number" ||
        typeof day !== "number"
      ) {
        return badRequest("Missing or invalid year/month/day");
      }

      const h = typeof hour === "number" ? hour : 0;
      const m = typeof minute === "number" ? minute : 0;
      const genderStr = String(gender ?? "M").toUpperCase() === "F" ? "female" : "male";

      // iztro: astrolabeBySolarDate(solarDateStr, timeIndex, gender, fixLeap?, language?)
      const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const timeIndex = hourToTimeIndex(h);

      // Core (branch, wuxingju) always zh-TW: 術語固定用中文，不隨 language 西化
      const astrolabeZhTw = astro.astrolabeBySolarDate(
        dateStr,
        timeIndex,
        genderStr,
        true,
        "zh-TW"
      );

      // mainStars + basic 依 language 切換
      const astrolabe =
        language === "zh-TW"
          ? astrolabeZhTw
          : astro.astrolabeBySolarDate(dateStr, timeIndex, genderStr, true, language);

      const aZhTw = astrolabeZhTw as {
        earthlyBranchOfSoulPalace?: string;
        earthlyBranchOfBodyPalace?: string;
        fiveElementsClass?: string;
      };
      const a = astrolabe as { soul?: string; body?: string };

      const ziweiCore = {
        minggongBranch: String(aZhTw?.earthlyBranchOfSoulPalace ?? ""),
        shengongBranch: String(aZhTw?.earthlyBranchOfBodyPalace ?? ""),
        wuxingju: String(aZhTw?.fiveElementsClass ?? ""),
      };

      const ziweiBasic = {
        masterStar:
          language === "en-US"
            ? toEnStarKey(String(a?.soul ?? ""), language)
            : String(a?.soul ?? ""),
        bodyStar:
          language === "en-US"
            ? toEnStarKey(String(a?.body ?? ""), language)
            : String(a?.body ?? ""),
      };

      const mainStars = extractZiweiMainStars(astrolabe, language);

      // 小限（horoscope）：供專家系統算每年重點。iztro horoscope(targetDate?, timeIndexOfTarget?)
      const targetYear = typeof horoscopeYear === "number" && horoscopeYear >= 1900 && horoscopeYear <= 2100
        ? horoscopeYear
        : new Date().getFullYear();
      const targetDate = new Date(`${targetYear}-06-15`);
      const horoscope = (astrolabeZhTw as { horoscope?: (d?: Date, ti?: number) => unknown }).horoscope?.(targetDate, timeIndex) as {
        decadal?: { index: number; heavenlyStem?: string; earthlyBranch?: string; palaceNames?: string[]; mutagen?: string[] };
        age?: {
          index: number;
          heavenlyStem?: string;
          earthlyBranch?: string;
          palaceNames?: string[];
          mutagen?: string[];
          nominalAge?: number;
        };
        yearly?: { index: number; heavenlyStem?: string; earthlyBranch?: string; palaceNames?: string[]; mutagen?: string[] };
      } | undefined;
      const MUTAGEN_KEYS = ["祿", "權", "科", "忌"] as const;

      function buildMutagenStars(mutagen: string[] | undefined): Record<string, string> | null {
        const out: Record<string, string> = {};
        if (!Array.isArray(mutagen)) return null;
        mutagen.forEach((star, i) => {
          if (typeof star === "string" && star && MUTAGEN_KEYS[i]) out[MUTAGEN_KEYS[i]] = star;
        });
        return Object.keys(out).length ? out : null;
      }
      // iztro getPalaceNames(fromIndex) 回傳從該索引起算的 12 宮，故 [0] 為小限／大限／流年所在宮
      function palaceFromItem(item: { palaceNames?: string[]; index?: number } | undefined): string | null {
        if (!item?.palaceNames?.length) return null;
        const raw = item.palaceNames[0];
        return (raw && palaceNameToZhTW(raw)) ?? raw ?? null;
      }

      const ageData = horoscope?.age;
      const activeLimitPalaceName = palaceFromItem(ageData);
      const decadalPalace = palaceFromItem(horoscope?.decadal);
      const yearlyPalace = palaceFromItem(horoscope?.yearly);

      // horoscopeByYear 改為延遲載入（點擊進階時再算），減少 CPU 避免 1102
      const horoscopeByYear: Record<number, { nominalAge: number | null; palace: string | null; stem: string | null }> = {};

      const ziweiHoroscope = ageData || horoscope?.decadal || horoscope?.yearly ? {
        year: targetYear,
        nominalAge: ageData?.nominalAge ?? null,
        yearlyStem: ageData?.heavenlyStem ?? null,
        yearlyBranch: ageData?.earthlyBranch ?? null,
        yearlyIndex: ageData?.index ?? null,
        activeLimitPalaceName,
        mutagenStars: buildMutagenStars(ageData?.mutagen),
        decadal: horoscope?.decadal ? {
          stem: horoscope.decadal.heavenlyStem ?? null,
          branch: horoscope.decadal.earthlyBranch ?? null,
          palace: decadalPalace,
          palaceIndex: horoscope.decadal.index,
          mutagenStars: buildMutagenStars(horoscope.decadal.mutagen),
        } : null,
        yearly: horoscope?.yearly ? {
          stem: horoscope.yearly.heavenlyStem ?? null,
          branch: horoscope.yearly.earthlyBranch ?? null,
          palace: yearlyPalace,
          palaceIndex: horoscope.yearly.index,
          mutagenStars: buildMutagenStars(horoscope.yearly.mutagen),
        } : null,
        horoscopeByYear,
      } : null;

      const chartId = stableChartId({ year, month, day, hour: h, minute: m, gender: genderStr, language });

      // 從 astrolabe 提取四柱，供前端五行/十神/藏干計算
      let yearly: [string, string] = ["", ""];
      let monthly: [string, string] = ["", ""];
      let daily: [string, string] = ["", ""];
      let hourly: [string, string] = ["", ""];
      const chineseDate = (astrolabeZhTw as { rawDates?: { chineseDate?: { yearly?: [string, string]; monthly?: [string, string]; daily?: [string, string]; hourly?: [string, string] } } })?.rawDates?.chineseDate;
      if (chineseDate?.yearly?.[0]) {
        yearly = chineseDate.yearly;
        monthly = chineseDate.monthly ?? ["", ""];
        daily = chineseDate.daily ?? ["", ""];
        hourly = chineseDate.hourly ?? ["", ""];
      } else {
        // Fallback: iztro rawDates 可能為空，改用 lunar-lite 直接計算
        try {
          const { getHeavenlyStemAndEarthlyBranchBySolarDate } = await import("lunar-lite");
          const fallback = getHeavenlyStemAndEarthlyBranchBySolarDate(dateStr, timeIndex);
          yearly = fallback.yearly ?? ["", ""];
          monthly = fallback.monthly ?? ["", ""];
          daily = fallback.daily ?? ["", ""];
          hourly = fallback.hourly ?? ["", ""];
        } catch (_) {
          console.warn("[bazi-api] lunar-lite fallback failed, bazi.display may be empty");
        }
      }
      const bazi = {
        display: {
          yG: yearly[0] ?? "",
          yZ: yearly[1] ?? "",
          mG: monthly[0] ?? "",
          mZ: monthly[1] ?? "",
          dG: daily[0] ?? "",
          dZ: daily[1] ?? "",
          hG: hourly[0] ?? "",
          hZ: hourly[1] ?? "",
        },
        year: { stem: yearly[0], branch: yearly[1] },
        month: { stem: monthly[0], branch: monthly[1] },
        day: { stem: daily[0], branch: daily[1] },
        hour: { stem: hourly[0], branch: hourly[1] },
      };

      return json({
        ok: true,
        language,
        chartId,
        meta: {
          service: "bazi-api",
          version: "1.0.0", // 部署後可換成 Cloudflare Deploy Version ID
          requestedLanguage: language,
        },
        features: {
          version: "strategic_features_v1",
          bazi,
          ziwei: {
            core: ziweiCore,
            basic: ziweiBasic,
            mainStars,
            horoscope: ziweiHoroscope,
          },
        },
      });
    }

    // POST /compute/horoscope：延遲載入大限／小限／流年（horoscopeByYear），降低 compute/all CPU
    if (req.method === "POST" && url.pathname === "/compute/horoscope") {
      let body: Record<string, unknown>;
      try {
        body = (await req.json()) as Record<string, unknown>;
      } catch {
        return badRequest("Invalid JSON");
      }
      const { year, month, day, hour, minute, gender, horoscopeYear } = body ?? {};
      if (typeof year !== "number" || typeof month !== "number" || typeof day !== "number") {
        return badRequest("Missing or invalid year/month/day");
      }
      const h = typeof hour === "number" ? hour : 0;
      const m = typeof minute === "number" ? minute : 0;
      const genderStr = String(gender ?? "M").toUpperCase() === "F" ? "female" : "male";
      const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const timeIndex = hourToTimeIndex(h);
      const targetYear = typeof horoscopeYear === "number" && horoscopeYear >= 1900 && horoscopeYear <= 2100
        ? horoscopeYear
        : new Date().getFullYear();

      const astrolabeZhTw = astro.astrolabeBySolarDate(dateStr, timeIndex, genderStr, true, "zh-TW");
      const horoscope = (astrolabeZhTw as { horoscope?: (d?: Date, ti?: number) => unknown }).horoscope?.(new Date(`${targetYear}-06-15`), timeIndex) as {
        decadal?: { index: number; heavenlyStem?: string; earthlyBranch?: string; palaceNames?: string[]; mutagen?: string[] };
        age?: { heavenlyStem?: string; earthlyBranch?: string; palaceNames?: string[]; mutagen?: string[]; nominalAge?: number; index?: number };
        yearly?: { index: number; heavenlyStem?: string; earthlyBranch?: string; palaceNames?: string[]; mutagen?: string[] };
      } | undefined;
      const MUTAGEN_KEYS = ["祿", "權", "科", "忌"] as const;
      function buildMutagenStars(mutagen: string[] | undefined): Record<string, string> | null {
        const out: Record<string, string> = {};
        if (!Array.isArray(mutagen)) return null;
        mutagen.forEach((star, i) => {
          if (typeof star === "string" && star && MUTAGEN_KEYS[i]) out[MUTAGEN_KEYS[i]] = star;
        });
        return Object.keys(out).length ? out : null;
      }
      function palaceFromItem(item: { palaceNames?: string[] } | undefined): string | null {
        if (!item?.palaceNames?.length) return null;
        const raw = item.palaceNames[0];
        return (raw && palaceNameToZhTW(raw)) ?? raw ?? null;
      }
      const ageData = horoscope?.age;
      const activeLimitPalaceName = palaceFromItem(ageData);
      const decadalPalace = palaceFromItem(horoscope?.decadal);
      const yearlyPalace = palaceFromItem(horoscope?.yearly);
      const startYear = Math.max(1900, targetYear - 6);
      const endYear = Math.min(2100, targetYear + 5);
      const horoscopeByYear: Record<number, { nominalAge: number | null; palace: string | null; stem: string | null }> = {};
      for (let y = startYear; y <= endYear; y++) {
        const hRes = (astrolabeZhTw as { horoscope?: (d?: Date, ti?: number) => unknown }).horoscope?.(new Date(`${y}-06-15`), timeIndex) as { age?: { nominalAge?: number; palaceNames?: string[]; heavenlyStem?: string } } | undefined;
        const a = hRes?.age;
        const palace = a?.palaceNames?.[0] ? (palaceNameToZhTW(a.palaceNames[0]) ?? a.palaceNames[0]) : null;
        horoscopeByYear[y] = { nominalAge: a?.nominalAge ?? null, palace, stem: a?.heavenlyStem ?? null };
      }
      const ziweiHoroscope = {
        year: targetYear,
        nominalAge: ageData?.nominalAge ?? null,
        yearlyStem: ageData?.heavenlyStem ?? null,
        yearlyBranch: ageData?.earthlyBranch ?? null,
        yearlyIndex: ageData?.index ?? null,
        activeLimitPalaceName,
        mutagenStars: buildMutagenStars(ageData?.mutagen),
        decadal: horoscope?.decadal ? { stem: horoscope.decadal.heavenlyStem ?? null, branch: horoscope.decadal.earthlyBranch ?? null, palace: decadalPalace, palaceIndex: horoscope.decadal.index, mutagenStars: buildMutagenStars(horoscope.decadal.mutagen) } : null,
        yearly: horoscope?.yearly ? { stem: horoscope.yearly.heavenlyStem ?? null, branch: horoscope.yearly.earthlyBranch ?? null, palace: yearlyPalace, palaceIndex: horoscope.yearly.index, mutagenStars: buildMutagenStars(horoscope.yearly.mutagen) } : null,
        horoscopeByYear,
      };
      return json({ ok: true, horoscope: ziweiHoroscope });
    }

    // POST /api/life-book/generate-section（單章，供前端逐次呼叫並顯示進度）
    if (req.method === "POST" && url.pathname === "/api/life-book/generate-section") {
      const apiKey = env?.OPENAI_API_KEY;
      if (!apiKey) {
        return json({ ok: false, error: "OPENAI_API_KEY 未設定" }, { status: 500 });
      }

      let body: { section_key?: string; chart_json?: unknown; weight_analysis?: unknown };
      try {
        body = (await req.json()) as typeof body;
      } catch {
        return badRequest("Invalid JSON");
      }

      const sectionKey = typeof body?.section_key === "string" ? body.section_key : "";
      const chartJson = body?.chart_json as Record<string, unknown> | undefined;
      const weightAnalysis = body?.weight_analysis as Record<string, unknown> | undefined;

      if (!sectionKey || !(SECTION_ORDER as string[]).includes(sectionKey)) {
        return badRequest("無效的 section_key");
      }
      if (!chartJson || typeof chartJson !== "object") return badRequest("缺少 chart_json");
      if (!weightAnalysis || typeof weightAnalysis !== "object") return badRequest("缺少 weight_analysis");

      const userPrompt = buildSectionUserPrompt(
        sectionKey,
        chartJson,
        weightAnalysis as { importance_map?: Record<string, string>; top_focus_palaces?: string[]; risk_palaces?: string[]; stable_palaces?: string[] }
      );

      const openaiResp = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system" as const, content: SYSTEM_PROMPT },
            { role: "user" as const, content: userPrompt },
          ],
          temperature: 0.7,
          max_tokens: 4000,
        }),
      });

      if (!openaiResp.ok) {
        const errText = await openaiResp.text();
        return json({ ok: false, error: `生成失敗: ${errText.slice(0, 150)}` }, { status: 502 });
      }

      const openaiData = (await openaiResp.json()) as { choices?: Array<{ message?: { content?: string } }> };
      const content = openaiData?.choices?.[0]?.message?.content ?? "";
      let parsed: Record<string, unknown> | null = null;
      const jsonMatch = content.trim().match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          parsed = JSON.parse(jsonMatch[0]) as Record<string, unknown>;
        } catch {
          /* ignore */
        }
      }

      const valid =
        parsed &&
        typeof parsed.section_key === "string" &&
        typeof parsed.structure_analysis === "string" &&
        typeof parsed.behavior_pattern === "string" &&
        typeof parsed.blind_spots === "string" &&
        typeof parsed.strategic_advice === "string";

      if (valid && parsed) {
        return json({ ok: true, section: parsed });
      }

      return json({
        ok: true,
        section: {
          section_key: sectionKey,
          title: `[${sectionKey}]`,
          importance_level: "medium",
          structure_analysis: "(AI 回傳格式異常)",
          behavior_pattern: "",
          blind_spots: "",
          strategic_advice: "",
        },
      });
    }

    // POST /api/life-book/generate（保留：一次 20 章，可能逾時）
    if (req.method === "POST" && url.pathname === "/api/life-book/generate") {
      const apiKey = env?.OPENAI_API_KEY;
      if (!apiKey) {
        return json(
          { ok: false, error: "OPENAI_API_KEY 未設定" },
          { status: 500 }
        );
      }

      let body: { chart_json?: unknown; weight_analysis?: unknown };
      try {
        body = (await req.json()) as typeof body;
      } catch {
        return badRequest("Invalid JSON");
      }

      const chartJson = body?.chart_json as Record<string, unknown> | undefined;
      const weightAnalysis = body?.weight_analysis as Record<string, unknown> | undefined;

      if (!chartJson || typeof chartJson !== "object") {
        return badRequest("缺少 chart_json");
      }
      if (!weightAnalysis || typeof weightAnalysis !== "object") {
        return badRequest("缺少 weight_analysis");
      }

      const sections: Record<string, Record<string, unknown>> = {};
      const sectionOrder = SECTION_ORDER as string[];

      for (let i = 0; i < sectionOrder.length; i++) {
        const sectionKey = sectionOrder[i];
        const userPrompt = buildSectionUserPrompt(
          sectionKey,
          chartJson,
          weightAnalysis as { importance_map?: Record<string, string>; top_focus_palaces?: string[]; risk_palaces?: string[]; stable_palaces?: string[] }
        );

        const messages = [
          { role: "system" as const, content: SYSTEM_PROMPT },
          { role: "user" as const, content: userPrompt },
        ];

        const openaiBody = {
          model: "gpt-4o-mini",
          messages,
          temperature: 0.7,
          max_tokens: 4000,
        };

        const openaiResp = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify(openaiBody),
        });

        if (!openaiResp.ok) {
          const errText = await openaiResp.text();
          console.error(`[life-book] OpenAI error for ${sectionKey}:`, errText);
          return json(
            {
              ok: false,
              error: `生成章節 ${sectionKey} 失敗`,
              detail: errText.slice(0, 200),
            },
            { status: 502 }
          );
        }

        const openaiData = (await openaiResp.json()) as {
          choices?: Array<{ message?: { content?: string } }>;
        };
        const content = openaiData?.choices?.[0]?.message?.content ?? "";

        // 解析 JSON
        let parsed: Record<string, unknown> | null = null;
        const jsonMatch = content.trim().match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            parsed = JSON.parse(jsonMatch[0]) as Record<string, unknown>;
          } catch {
            /* ignore */
          }
        }

        const valid =
          parsed &&
          typeof parsed.section_key === "string" &&
          typeof parsed.title === "string" &&
          typeof parsed.structure_analysis === "string" &&
          typeof parsed.behavior_pattern === "string" &&
          typeof parsed.blind_spots === "string" &&
          typeof parsed.strategic_advice === "string";

        if (valid && parsed) {
          sections[sectionKey] = parsed;
        } else {
          sections[sectionKey] = {
            section_key: sectionKey,
            title: `[${sectionKey}] 解析失敗`,
            importance_level: "medium",
            structure_analysis: "(AI 回傳格式異常，請重試)",
            behavior_pattern: "",
            blind_spots: "",
            strategic_advice: "",
          };
        }
      }

      return json({ ok: true, sections });
    }

    return json({ ok: false, error: "Not found" }, { status: 404 });
  },
};
