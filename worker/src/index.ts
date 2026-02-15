/**
 * Cloudflare Worker: compute/all + content/2026
 * Replaces external 17gonplay-api.
 */
import { astro } from "iztro";
import { palaceNameToZhTW, FIXED_PALACES_ZH_TW } from "./palace-map.js";
import { toEnStarKey } from "./star-map.js";

import contentZhTw from "../content/content-zh-TW.json";
import contentEn from "../content/content-en.json";

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
    out[zhTWKey] = starNames;
  }

  return out;
}

export default {
  async fetch(req: Request): Promise<Response> {
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
      const content = localeUsed === "en" ? contentEn : contentZhTw;
      return json({ ok: true, requestedLocale, localeUsed, ...content });
    }

    // POST /compute/all
    if (req.method === "POST" && url.pathname === "/compute/all") {
      let body: Record<string, unknown>;
      try {
        body = (await req.json()) as Record<string, unknown>;
      } catch {
        return badRequest("Invalid JSON");
      }

      const { year, month, day, hour, minute, gender } = body ?? {};
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
          },
        },
      });
    }

    return json({ ok: false, error: "Not found" }, { status: 404 });
  },
};
