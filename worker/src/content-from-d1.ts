/**
 * Build dbContent from ui_copy_texts rows.
 * copy_key format: palace.{key} | star.{key} | starPalace.{星名}_{宮名} | star.base.{starId}.mature | tenGod.{key} | tenGodPalace.{十神}_{宮名} | tengod.palace.{tenGodId}.{palaceId} | neural.loop.{loopId} | hp.{category}.{slug} | wuxing.{key}
 * - palace.命宮 -> palaces["命宮"]
 * - star.紫微 / star.emperor -> stars["紫微"] / stars["emperor"]
 * - star.base.{starId}.core / .shadow / .mature -> starBaseCore / starBaseShadow / starBaseMature[starId]
 * - starPalace.紫微_命宮 -> starPalaces["紫微_命宮"]（星曜在該宮位的特定表現）
 * - starPalaceAux.文昌_財帛 -> starPalacesAux["文昌_財帛"]（輔星／煞星／雜曜在該宮的解釋）
 * - starPalaceAuxAction.文昌_財帛 -> starPalacesAuxAction["文昌_財帛"]（同上 key，行動建議）
 * - starPalaceAuxRisk.文昌_命宮 -> starPalacesAuxRisk["文昌_命宮"]（同上 key，風險等級 1～5）
 * - tenGod.比肩 -> tenGods["比肩"]
 * - tenGodPalace.比肩_命宮 -> tenGodPalaces["比肩_命宮"]（十神在該宮位的特質，宮名同 starPalace：命宮、兄弟、夫妻…父母）
 * - wuxing.木 -> wuxing["木"] (content: JSON {headline, content})
 * - wuxing.energy.{wuxingId}.strong | .weak -> wuxingEnergy["wood.strong"] 等
 * - conscious.palace.{palaceId} -> consciousPalace[palaceId]
 * - archetype.element.{wuxingId} -> archetypeElement[wuxingId]（JSON: label, title, description）
 * - archetype.star.{starId} -> archetypeStar[starId]（JSON: label, title, description）
 * - lifebookSection.{sectionKey} -> lifebookSection[sectionKey]（content = JSON 四欄）
 * - lifebookSection.{sectionKey}.{field} -> 單欄字串（structure_analysis | behavior_pattern | blind_spots | strategic_advice）
 * - wuxingPalace.木_命宮 -> wuxingPalaces["木_命宮"]（五行在該宮位的特質＋補X，宮名同 starPalace）
 */
export interface DbContent {
  palaces: Record<string, string>;
  stars: Record<string, string>;
  /** 主星本能層：starId -> 文案（80–120 字） */
  starBaseCore?: Record<string, string>;
  /** 主星陰影／失衡：starId -> 文案（30–80 字） */
  starBaseShadow?: Record<string, string>;
  /** 主星成熟段：starId -> 文案（key 同 ontology MainStarId：ziWei, tianJi, ...） */
  starBaseMature?: Record<string, string>;
  starPalaces: Record<string, string>;
  tenGods: Record<string, string>;
  tenGodPalaces: Record<string, string>;
  /** 十神×宮位（ontology id）：key = tenGodId.palaceId，如 biJian.ming */
  tenGodPalacesById?: Record<string, string>;
  /** 神經迴路描述：key = loopId（fight_flight, approval_loop, ...） */
  neuralLoops?: Record<string, string>;
  /** 高壓警示 Snippet：key = hp.self.authority_anxiety 等（Phase 3 Risk Rules 對應） */
  highPressure?: Record<string, string>;
  /** 五行強／弱：key = wuxingId.strong | wuxingId.weak，如 wood.strong、water.weak */
  wuxingEnergy?: Record<string, string>;
  /** 每宮心智／六識說明：key = palaceId（ming, fumu, fude, …） */
  consciousPalace?: Record<string, string>;
  /** 五行原型（英雄／戰士／看守者／裁判者／神秘者）：key = wuxingId（wood, fire, …） */
  archetypeElement?: Record<string, { label: string; title: string; description: string }>;
  /** 星曜原型（王者／智者…）：key = starId（ziWei, tianJi, …） */
  archetypeStar?: Record<string, { label: string; title: string; description: string }>;
  /** 22 章節骨架（四欄）：key = sectionKey（s02, s08, …），可作粗稿塞進 prompt 讓 5.2 潤飾＋填入底層參數 */
  lifebookSection?: Record<
    string,
    { structure_analysis?: string; behavior_pattern?: string; blind_spots?: string; strategic_advice?: string }
  >;
  wuxing: Record<string, { headline: string; content: string }>;
  wuxingPalaces: Record<string, string>;
  /** 命主靈魂解碼：星名 → 文案（依命宮地支對應之命主星） */
  lifeLordDecode?: Record<string, string>;
  /** 身主工具箱解碼：星名 → 文案（依生年地支對應之身主星） */
  bodyLordDecode?: Record<string, string>;
  /** 身宮依時辰：時辰組 key（子午、卯酉…）→ { palace, tagline, interpretation } */
  bodyPalaceByHour?: Record<string, { palace: string; tagline: string; interpretation: string }>;
  /** 命身關係：命身同宮／錯位／內外對話 斷語與戰略語氣 */
  lifeBodyRelation?: Record<string, { tagline: string; interpretation: string; strategy_tone: string }>;
  /** 14 主星底層邏輯：星名 → 一句話 */
  starLogicMain?: Record<string, string>;
  /** 14 主星×12 宮顧問口吻戰略解析（優先於 starPalaces） */
  starPalacesMain?: Record<string, string>;
  /** 輔星／煞星／雜曜×宮位：key = 「星名_宮名」，value = 該星在該宮的「解釋」（資源取得方式／風險行為） */
  starPalacesAux?: Record<string, string>;
  /** 同上 key，value = 「行動建議」（可執行方針，供戰略建議欄位使用） */
  starPalacesAuxAction?: Record<string, string>;
  /** 同上 key，value = 風險等級 1～5（1=低，5=高；高風險時 AI 採保守防禦語氣） */
  starPalacesAuxRisk?: Record<string, number>;
  /** 主星三方星系：星名 → 星系標籤與命/財/官 pattern（與 AssembleContentLookup.starSanfangFamilies 同構） */
  starSanfangFamilies?: Record<
    string,
    { familyLabel: string; coreStars?: string[]; roleSummary?: string; mingPattern?: string; caiPattern?: string; guanPattern?: string }
  >;
  /** Phase 2：星曜權重與基礎風險（starNameZhToId + stars），供宮位 aggregator 使用 */
  starMetadata?: { starNameZhToId: Record<string, string>; stars: Record<string, { name_zh: string; category: string; base_weight: number; base_risk: number }> };
  /** Phase 2：riskLevel 對應的風險總結句（key = riskLevel_1 … riskLevel_5） */
  palaceRiskSummary?: Record<string, string>;
  /** Phase 2：riskLevel 對應的行動建議句（key = riskLevel_1 … riskLevel_5） */
  palaceActionAdvice?: Record<string, string>;
  /** 時間模組決策矩陣：宮位×決策事件權重、eventLabels、palaceThemes（用於 s16/s15a 決策建議） */
  decisionMatrix?: {
    palaceEventWeights: Record<string, Record<string, number>>;
    eventLabels: Record<string, string>;
    palaceThemes: Record<string, string>;
  };
  /** 命理師語氣句型庫：s00 等 section → ruleKey → openers/explainers/advisers（narrativeCorpus-zh-TW.json） */
  narrativeCorpus?: Record<
    string,
    Record<string, { openers: string[]; explainers: string[]; advisers: string[]; connectors?: string[] }>
  >;
}

export function buildContentFromRows(
  rows: Array<{ copy_key: string; content: string }>
): DbContent {
  const out: DbContent = {
    palaces: {},
    stars: {},
    starPalaces: {},
    tenGods: {},
    tenGodPalaces: {},
    wuxing: {},
    wuxingPalaces: {},
  };

  for (const row of rows) {
    const { copy_key, content } = row;
    if (!copy_key || content == null) continue;

    const dot = copy_key.indexOf(".");
    if (dot <= 0) continue;

    const prefix = copy_key.slice(0, dot);
    const key = copy_key.slice(dot + 1);

    if (prefix === "palace") {
      out.palaces[key] = String(content);
    } else if (prefix === "star") {
      if (key.startsWith("base.")) {
        const parts = key.split(".");
        const starId = parts[1];
        const segment = parts[2];
        if (starId && segment) {
          if (segment === "core") {
            if (!out.starBaseCore) out.starBaseCore = {};
            out.starBaseCore[starId] = String(content);
          } else if (segment === "shadow") {
            if (!out.starBaseShadow) out.starBaseShadow = {};
            out.starBaseShadow[starId] = String(content);
          } else if (segment === "mature") {
            if (!out.starBaseMature) out.starBaseMature = {};
            out.starBaseMature[starId] = String(content);
          }
        }
      } else {
        out.stars[key] = String(content);
      }
    } else if (prefix === "starPalace") {
      out.starPalaces[key] = String(content);
    } else if (prefix === "starPalaceAux") {
      if (!out.starPalacesAux) out.starPalacesAux = {};
      out.starPalacesAux[key] = String(content);
    } else if (prefix === "starPalaceAuxAction") {
      if (!out.starPalacesAuxAction) out.starPalacesAuxAction = {};
      out.starPalacesAuxAction[key] = String(content);
    } else if (prefix === "starPalaceAuxRisk") {
      if (!out.starPalacesAuxRisk) out.starPalacesAuxRisk = {};
      const n = Number(content);
      if (Number.isFinite(n) && n >= 1 && n <= 5) out.starPalacesAuxRisk[key] = Math.round(n);
    } else if (prefix === "tengod") {
      if (key.startsWith("palace.")) {
        const subKey = key.slice(7);
        if (subKey && subKey.includes(".")) {
          if (!out.tenGodPalacesById) out.tenGodPalacesById = {};
          out.tenGodPalacesById[subKey] = String(content);
        }
      }
    } else if (prefix === "tenGod") {
      out.tenGods[key] = String(content);
    } else if (prefix === "tenGodPalace") {
      out.tenGodPalaces[key] = String(content);
    } else if (prefix === "neural") {
      if (key.startsWith("loop.")) {
        const loopId = key.slice(5);
        if (loopId) {
          if (!out.neuralLoops) out.neuralLoops = {};
          out.neuralLoops[loopId] = String(content);
        }
      }
    } else if (prefix === "hp") {
      const fullKey = "hp." + key;
      if (!out.highPressure) out.highPressure = {};
      out.highPressure[fullKey] = String(content);
    } else if (prefix === "conscious" && key.startsWith("palace.")) {
      const palaceId = key.slice(7);
      if (palaceId) {
        if (!out.consciousPalace) out.consciousPalace = {};
        out.consciousPalace[palaceId] = String(content);
      }
    } else if (prefix === "wuxing") {
      if (key.startsWith("energy.")) {
        const sub = key.slice(7);
        if (sub && (sub.endsWith(".strong") || sub.endsWith(".weak"))) {
          if (!out.wuxingEnergy) out.wuxingEnergy = {};
          out.wuxingEnergy[sub] = String(content);
        }
      } else {
        try {
          const parsed = JSON.parse(content) as { headline?: string; content?: string };
          out.wuxing[key] = {
            headline: String(parsed?.headline ?? ""),
            content: String(parsed?.content ?? ""),
          };
        } catch {
          out.wuxing[key] = { headline: "", content: String(content) };
        }
      }
    } else if (prefix === "archetype") {
      try {
        const parsed = JSON.parse(content) as { label?: string; title?: string; description?: string };
        const entry = {
          label: String(parsed?.label ?? ""),
          title: String(parsed?.title ?? ""),
          description: String(parsed?.description ?? ""),
        };
        if (key.startsWith("element.")) {
          const wuxingId = key.slice(8);
          if (wuxingId) {
            if (!out.archetypeElement) out.archetypeElement = {};
            out.archetypeElement[wuxingId] = entry;
          }
        } else if (key.startsWith("star.")) {
          const starId = key.slice(5);
          if (starId) {
            if (!out.archetypeStar) out.archetypeStar = {};
            out.archetypeStar[starId] = entry;
          }
        }
      } catch {
        /* skip invalid JSON */
      }
    } else if (prefix === "lifebookSection") {
      const dot2 = key.indexOf(".", 0);
      if (dot2 < 0) {
        try {
          const parsed = JSON.parse(content) as {
            structure_analysis?: string;
            behavior_pattern?: string;
            blind_spots?: string;
            strategic_advice?: string;
          };
          if (!out.lifebookSection) out.lifebookSection = {};
          out.lifebookSection[key] = {
            structure_analysis: String(parsed?.structure_analysis ?? ""),
            behavior_pattern: String(parsed?.behavior_pattern ?? ""),
            blind_spots: String(parsed?.blind_spots ?? ""),
            strategic_advice: String(parsed?.strategic_advice ?? ""),
          };
        } catch {
          /* skip invalid JSON */
        }
      } else {
        const sectionKey = key.slice(0, dot2);
        const field = key.slice(dot2 + 1) as "structure_analysis" | "behavior_pattern" | "blind_spots" | "strategic_advice";
        if (
          sectionKey &&
          ["structure_analysis", "behavior_pattern", "blind_spots", "strategic_advice"].includes(field)
        ) {
          if (!out.lifebookSection) out.lifebookSection = {};
          if (!out.lifebookSection[sectionKey]) out.lifebookSection[sectionKey] = {};
          out.lifebookSection[sectionKey][field] = String(content);
        }
      }
    } else if (prefix === "wuxingPalace") {
      out.wuxingPalaces[key] = String(content);
    }
  }

  return out;
}

function mergeLifebookSections(
  base: DbContent["lifebookSection"],
  overlay: DbContent["lifebookSection"]
): DbContent["lifebookSection"] {
  const merged = { ...(base || {}) };
  for (const [sectionKey, overlaySection] of Object.entries(overlay || {})) {
    merged[sectionKey] = {
      ...(merged[sectionKey] || {}),
      ...overlaySection,
    };
  }
  return Object.keys(merged).length > 0 ? merged : undefined;
}

export function mergeContent(
  base: DbContent,
  overlay: DbContent
): DbContent {
  return {
    palaces: { ...base.palaces, ...overlay.palaces },
    stars: { ...base.stars, ...overlay.stars },
    starBaseCore: { ...(base.starBaseCore || {}), ...(overlay.starBaseCore || {}) },
    starBaseShadow: { ...(base.starBaseShadow || {}), ...(overlay.starBaseShadow || {}) },
    starBaseMature: { ...(base.starBaseMature || {}), ...(overlay.starBaseMature || {}) },
    starPalaces: { ...(base.starPalaces || {}), ...(overlay.starPalaces || {}) },
    starPalacesAux: { ...(base.starPalacesAux || {}), ...(overlay.starPalacesAux || {}) },
    starPalacesAuxAction: { ...(base.starPalacesAuxAction || {}), ...(overlay.starPalacesAuxAction || {}) },
    starPalacesAuxRisk: { ...(base.starPalacesAuxRisk || {}), ...(overlay.starPalacesAuxRisk || {}) },
    tenGods: { ...base.tenGods, ...overlay.tenGods },
    tenGodPalaces: { ...(base.tenGodPalaces || {}), ...(overlay.tenGodPalaces || {}) },
    tenGodPalacesById: { ...(base.tenGodPalacesById || {}), ...(overlay.tenGodPalacesById || {}) },
    neuralLoops: { ...(base.neuralLoops || {}), ...(overlay.neuralLoops || {}) },
    highPressure: { ...(base.highPressure || {}), ...(overlay.highPressure || {}) },
    wuxingEnergy: { ...(base.wuxingEnergy || {}), ...(overlay.wuxingEnergy || {}) },
    consciousPalace: { ...(base.consciousPalace || {}), ...(overlay.consciousPalace || {}) },
    archetypeElement: { ...(base.archetypeElement || {}), ...(overlay.archetypeElement || {}) },
    archetypeStar: { ...(base.archetypeStar || {}), ...(overlay.archetypeStar || {}) },
    /** 骨架以 static（base）為準，覆蓋 D1，確保命書骨架永遠用程式內建版 */
    lifebookSection: mergeLifebookSections(overlay.lifebookSection, base.lifebookSection),
    wuxing: { ...base.wuxing, ...overlay.wuxing },
    wuxingPalaces: { ...(base.wuxingPalaces || {}), ...(overlay.wuxingPalaces || {}) },
    narrativeCorpus: base.narrativeCorpus ?? overlay.narrativeCorpus,
  };
}

/** 回傳空結構，避免 D1/靜態都失敗時 API 500；所有用到 content 的 API 可依賴「至少有此結構」。 */
export function emptyDbContent(): DbContent {
  return {
    palaces: {},
    stars: {},
    starPalaces: {},
    tenGods: {},
    tenGodPalaces: {},
    wuxing: {},
    wuxingPalaces: {},
  };
}
