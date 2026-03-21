/**
 * Narrative Facade：命書敘事資料的唯一入口（Narrative Data Governance）。
 * 僅整合既有敘事資料來源，回傳結構化語意物件；不在此層做命理推論、四化計算或飛化演算。
 * 依據：docs/lifebook-narrative-canonical-sources.md
 */

import {
  PALACE_SEMANTIC_DICTIONARY,
  STAR_SEMANTIC_DICTIONARY,
  getPalaceSemantic as getPalaceSemanticFromDict,
  getStarSemantic as getStarSemanticFromDict,
  getTransformSemantic as getTransformSemanticFromDict,
} from "./starSemanticDictionary.js";
import { getMingGongTransformMeaning } from "./mingGongTransformMatrix.js";
import { findStarPalaceTransformMeaning } from "./starPalaceTransformMatrix.js";
import {
  getTransformIntoPalaceMeaning,
  getDecadalPalaceTheme,
} from "./transformInterpretationEngine.js";
import { STAR_NAME_ZH_TO_ID } from "./schema.js";

// ---------------------------------------------------------------------------
// 型別：SemanticSource / SemanticMeta（canonical 對應）
// ---------------------------------------------------------------------------

export type SemanticSource =
  | "PALACE_SEMANTIC_DICTIONARY"
  | "palaceContexts"
  | "palaceThemes"
  | "decadalPalaceThemes"
  | "STAR_SEMANTIC_DICTIONARY"
  | "starBaseCore"
  | "starBaseMeaning"
  | "starPalacesMain"
  | "starPalacesAux"
  | "starPalacesAuxAction"
  | "starPalacesAuxRisk"
  | "starMetadata"
  | "mingGongTransformMatrix"
  | "STAR_PALACE_TRANSFORM_MATRIX"
  | "transformIntoPalaceMeanings";

export interface SemanticMeta {
  source: SemanticSource | null;
  fallbackUsed: boolean;
  missing: boolean;
}

function meta(
  source: SemanticSource | null,
  fallbackUsed: boolean,
  missing: boolean
): SemanticMeta {
  return { source, fallbackUsed, missing };
}

// ---------------------------------------------------------------------------
// 宮位語意 block
// ---------------------------------------------------------------------------

export interface PalaceSemanticBlock {
  palaceName: string;
  core: string | null;
  context: string | null;
  theme: string | null;
  decadalTheme?: string | null;
  decadalNarrative?: string | null;
  meta: {
    core: SemanticMeta;
    context: SemanticMeta;
    theme: SemanticMeta;
    decadal?: SemanticMeta;
  };
}

// ---------------------------------------------------------------------------
// 星曜語意 block
// ---------------------------------------------------------------------------

export interface StarSemanticBlock {
  starName: string;
  core: string | null;
  plain: string | null;
  themes: string[];
  risk: string | null;
  advice: string | null;
  meta: {
    primary: SemanticMeta;
    fallbacks: SemanticMeta[];
  };
}

// ---------------------------------------------------------------------------
// 星曜在宮位語意 block
// ---------------------------------------------------------------------------

export interface StarInPalaceSemanticBlock {
  starName: string;
  palaceName: string;
  baseMeaning: string | null;
  meaningInPalace: string | null;
  actionAdvice: string | null;
  riskLevel: string | number | null;
  riskText: string | null;
  meta: {
    meaningInPalace: SemanticMeta;
    actionAdvice: SemanticMeta;
    risk: SemanticMeta;
  };
}

// ---------------------------------------------------------------------------
// 四化語意 block
// ---------------------------------------------------------------------------

export interface TransformSemanticBlock {
  transform: "祿" | "權" | "科" | "忌";
  starName: string;
  palaceName?: string | null;
  meaning: string | null;
  tone: string | null;
  advice: string | null;
  meta: {
    primary: SemanticMeta;
    fallbacks: SemanticMeta[];
  };
}

// ---------------------------------------------------------------------------
// Content lookup：runtime 注入的語料（由 index 組裝後傳入）
// ---------------------------------------------------------------------------

export interface NarrativeContentLookup {
  palaceContexts?: Record<string, string>;
  palaceThemes?: Record<string, string>;
  starBaseCore?: Record<string, string>;
  starBaseMeaning?: Record<string, string>;
  starPalacesMain?: Record<string, string>;
  starPalacesAux?: Record<string, string>;
  starPalacesAuxAction?: Record<string, string>;
  starPalacesAuxRisk?: Record<string, string>;
  starMetadata?: {
    starNameZhToId?: Record<string, string>;
    stars?: Record<string, { name_zh: string; category: string; base_weight: number; base_risk: number }>;
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toPalaceCanon(palaceName: string): string {
  const s = (palaceName ?? "").trim();
  if (!s) return "";
  return s.endsWith("宮") ? s : s + "宮";
}

function toTransformKey(transform: string): "lu" | "quan" | "ke" | "ji" | "" {
  const x = (transform ?? "").trim().toLowerCase();
  if (x === "lu" || x === "祿") return "lu";
  if (x === "quan" || x === "權") return "quan";
  if (x === "ke" || x === "科") return "ke";
  if (x === "ji" || x === "忌") return "ji";
  return "";
}

function starPalaceKey(starName: string, palaceName: string): { full: string; short: string } {
  const star = (starName ?? "").trim();
  const pal = (palaceName ?? "").trim();
  const withSuffix = pal.endsWith("宮") ? pal : pal + "宮";
  const short = pal.replace(/宮$/, "") === "命" ? "命宮" : pal.replace(/宮$/, "");
  return { full: `${star}_${withSuffix}`, short: `${star}_${short}` };
}

// ---------------------------------------------------------------------------
// Facade 介面與實作
// ---------------------------------------------------------------------------

export interface NarrativeFacade {
  getPalaceSemantic(palaceName: string): PalaceSemanticBlock;
  getStarSemantic(starName: string): StarSemanticBlock;
  getStarInPalaceSemantic(starName: string, palaceName: string): StarInPalaceSemanticBlock;
  getTransformSemantic(
    transform: "祿" | "權" | "科" | "忌",
    starName: string,
    palaceName?: string
  ): TransformSemanticBlock;
}

/**
 * 建立 NarrativeFacade 實例。content 由 index 組裝後傳入；未傳時僅使用 inline 字典與矩陣。
 */
export function createNarrativeFacade(content?: NarrativeContentLookup): NarrativeFacade {
  const c = content ?? {};

  return {
    getPalaceSemantic(palaceName: string): PalaceSemanticBlock {
      const pal = toPalaceCanon(palaceName);
      const palaceNameNorm = pal || palaceName.trim() || "";

      // 1. PALACE_SEMANTIC_DICTIONARY
      const fromDict =
        getPalaceSemanticFromDict(palaceNameNorm) ?? PALACE_SEMANTIC_DICTIONARY[pal] ?? null;
      const core = fromDict?.core ?? null;
      const metaCore = fromDict
        ? meta("PALACE_SEMANTIC_DICTIONARY", false, false)
        : meta(null, false, true);

      // 2. palaceContexts
      const context =
        c.palaceContexts?.[pal] ??
        c.palaceContexts?.[palaceNameNorm] ??
        c.palaceContexts?.[pal.replace(/宮$/, "")] ??
        null;
      const metaContext = context
        ? meta("palaceContexts", false, false)
        : meta(null, false, true);

      // 3. palaceThemes
      const theme =
        c.palaceThemes?.[pal] ??
        c.palaceThemes?.[palaceNameNorm] ??
        c.palaceThemes?.[pal.replace(/宮$/, "")] ??
        null;
      const metaTheme = theme ? meta("palaceThemes", false, false) : meta(null, false, true);

      // 4. decadalPalaceThemes（若有需要）
      const decadal = pal ? getDecadalPalaceTheme(pal) : null;
      const decadalTheme = decadal?.theme ?? null;
      const decadalNarrative = decadal?.narrative ?? null;
      const metaDecadal = decadal
        ? meta("decadalPalaceThemes", false, false)
        : meta(null, false, true);

      return {
        palaceName: palaceNameNorm || palaceName,
        core,
        context,
        theme,
        decadalTheme,
        decadalNarrative,
        meta: {
          core: metaCore,
          context: metaContext,
          theme: metaTheme,
          decadal: metaDecadal,
        },
      };
    },

    getStarSemantic(starName: string): StarSemanticBlock {
      const name = (starName ?? "").trim();
      const fallbacks: SemanticMeta[] = [];

      // 1. STAR_SEMANTIC_DICTIONARY
      const fromDict = getStarSemanticFromDict(name) ?? STAR_SEMANTIC_DICTIONARY[name];
      if (fromDict) {
        return {
          starName: name || starName,
          core: fromDict.core,
          plain: fromDict.plain,
          themes: fromDict.themes ?? [],
          risk: fromDict.risk ?? null,
          advice: fromDict.advice ?? null,
          meta: {
            primary: meta("STAR_SEMANTIC_DICTIONARY", false, false),
            fallbacks: [],
          },
        };
      }

      // 2. starBaseCore (fallback)
      const starId = (STAR_NAME_ZH_TO_ID as Record<string, string>)[name];
      const baseFromCore = starId && c.starBaseCore?.[starId];
      if (baseFromCore) {
        fallbacks.push(meta("starBaseCore", true, false));
        return {
          starName: name || starName,
          core: null,
          plain: baseFromCore,
          themes: [],
          risk: null,
          advice: null,
          meta: {
            primary: meta("starBaseCore", true, false),
            fallbacks,
          },
        };
      }

      // 3. starBaseMeaning (fallback)
      const baseFromMeaning = c.starBaseMeaning?.[name];
      if (baseFromMeaning) {
        fallbacks.push(meta("starBaseMeaning", true, false));
        return {
          starName: name || starName,
          core: null,
          plain: baseFromMeaning,
          themes: [],
          risk: null,
          advice: null,
          meta: {
            primary: meta("starBaseMeaning", true, false),
            fallbacks,
          },
        };
      }

      return {
        starName: name || starName,
        core: null,
        plain: null,
        themes: [],
        risk: null,
        advice: null,
        meta: {
          primary: meta(null, false, true),
          fallbacks: [],
        },
      };
    },

    getStarInPalaceSemantic(starName: string, palaceName: string): StarInPalaceSemanticBlock {
      const name = (starName ?? "").trim();
      const pal = toPalaceCanon(palaceName);
      const { full, short } = starPalaceKey(name, palaceName);

      // baseMeaning：星曜本身基礎意義（來自星語意）
      const starSem = this.getStarSemantic(name);
      const baseMeaning = starSem.plain ?? starSem.core ?? null;

      // 1. starPalacesMain
      const main = c.starPalacesMain?.[full] ?? c.starPalacesMain?.[short] ?? null;
      // 2. starPalacesAux
      const aux = c.starPalacesAux?.[full] ?? c.starPalacesAux?.[short] ?? null;
      const meaningInPalace = main ?? aux;
      const metaMeaningInPalace = main
        ? meta("starPalacesMain", false, false)
        : aux
          ? meta("starPalacesAux", false, false)
          : meta(null, false, true);

      // 3. starPalacesAuxAction
      const actionAdvice =
        c.starPalacesAuxAction?.[full] ?? c.starPalacesAuxAction?.[short] ?? null;
      const metaActionAdvice = actionAdvice
        ? meta("starPalacesAuxAction", false, false)
        : meta(null, false, true);

      // 4. starPalacesAuxRisk
      let riskText = c.starPalacesAuxRisk?.[full] ?? c.starPalacesAuxRisk?.[short] ?? null;
      let riskLevel: string | number | null = null;

      // 5. starMetadata（只做 risk 補充，不作主語意）
      const starIdForMeta = (STAR_NAME_ZH_TO_ID as Record<string, string>)[name];
      if (c.starMetadata?.stars && starIdForMeta) {
        const starEntry = c.starMetadata.stars[starIdForMeta];
        if (starEntry?.base_risk != null) {
          riskLevel = starEntry.base_risk;
          if (!riskText) riskText = `base_risk: ${starEntry.base_risk}`;
        }
      }
      const metaRisk =
        riskText || riskLevel != null
          ? meta(
              riskText ? "starPalacesAuxRisk" : "starMetadata",
              !riskText && riskLevel != null,
              false
            )
          : meta(null, false, true);

      return {
        starName: name,
        palaceName: pal || palaceName,
        baseMeaning,
        meaningInPalace,
        actionAdvice,
        riskLevel,
        riskText,
        meta: {
          meaningInPalace: metaMeaningInPalace,
          actionAdvice: metaActionAdvice,
          risk: metaRisk,
        },
      };
    },

    getTransformSemantic(
      transform: "祿" | "權" | "科" | "忌",
      starName: string,
      palaceName?: string
    ): TransformSemanticBlock {
      const star = (starName ?? "").trim();
      const pal = palaceName ? toPalaceCanon(palaceName) : null;
      const tKey = toTransformKey(transform);
      const fallbacks: SemanticMeta[] = [];
      let meaning: string | null = null;
      let advice: string | null = null;
      let primarySource: SemanticSource | null = null;
      let primaryFallback = false;

      const isMingGong = pal === "命宮";

      if (isMingGong && star && tKey) {
        const fromMing = getMingGongTransformMeaning(star, tKey);
        if (fromMing) {
          meaning = fromMing;
          primarySource = "mingGongTransformMatrix";
        }
      }

      if (!meaning && star && pal && tKey) {
        const fromMatrix = findStarPalaceTransformMeaning(star, pal, transform);
        if (fromMatrix) {
          meaning = fromMatrix;
          if (!primarySource) {
            primarySource = "STAR_PALACE_TRANSFORM_MATRIX";
            primaryFallback = !!primarySource && isMingGong;
          }
        }
      }

      if (!meaning && tKey && pal) {
        const fromPalace = getTransformIntoPalaceMeaning(transform, pal);
        if (fromPalace) {
          meaning = fromPalace;
          fallbacks.push(meta("transformIntoPalaceMeanings", true, false));
          if (!primarySource) {
            primarySource = "transformIntoPalaceMeanings";
            primaryFallback = true;
          }
        }
      }

      if (!meaning) {
        const generic = getTransformSemanticFromDict(transform);
        if (generic) {
          meaning = generic.plain ?? generic.core ?? null;
          advice = generic.advice ?? null;
          fallbacks.push(meta("transformIntoPalaceMeanings", true, false));
          if (!primarySource) primaryFallback = true;
        }
      }

      return {
        transform,
        starName: star,
        palaceName: pal ?? undefined,
        meaning,
        tone: null,
        advice,
        meta: {
          primary: meta(primarySource, primaryFallback, !meaning && !advice),
          fallbacks,
        },
      };
    },
  };
}

// ---------------------------------------------------------------------------
// 相容舊呼叫：無 content 時使用 createNarrativeFacade() 的單次查詢
// ---------------------------------------------------------------------------

export function getPalaceSemantic(
  palaceName: string,
  content?: NarrativeContentLookup
): PalaceSemanticBlock {
  return createNarrativeFacade(content).getPalaceSemantic(palaceName);
}

export function getStarSemantic(
  starName: string,
  content?: NarrativeContentLookup
): StarSemanticBlock {
  return createNarrativeFacade(content).getStarSemantic(starName);
}

export function getStarInPalaceSemantic(
  starName: string,
  palaceName: string,
  content?: NarrativeContentLookup
): StarInPalaceSemanticBlock {
  return createNarrativeFacade(content).getStarInPalaceSemantic(starName, palaceName);
}

export function getTransformSemantic(
  transform: "祿" | "權" | "科" | "忌",
  starName: string,
  palaceName?: string,
  content?: NarrativeContentLookup
): TransformSemanticBlock {
  return createNarrativeFacade(content).getTransformSemantic(transform, starName, palaceName);
}
