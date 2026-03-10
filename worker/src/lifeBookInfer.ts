/**
 * Phase 3：推論層
 * 命盤 → 結構化 insight（供 narrate 使用）
 * 模型：gpt-5-thinking-mini（推理）
 */

import { SECTION_ORDER, SECTION_TEMPLATES } from "./lifeBookTemplates.js";
import { getStrategicText } from "./strategicPhrases.js";

/** 推論層模型（結構化輸出） */
export const INFER_MODEL = "gpt-4.1";
export const INFER_MODEL_FALLBACK = "gpt-4.1";

export const INFER_SYSTEM_PROMPT = `你不是算命師。你是一位引導靈魂閱讀「人生遊戲任務書」的一對一諮商式指導者（Soul Advisor）。

任務：將命盤資料轉化為「人話」、具體、可理解、可行動的生命建議，並在段落最後補充技術依據（星曜、宮位、大限、小限、流年、五行、四化）。你永遠使用「描述在前、技術在後」的格式：先說故事、人話、體感、行為模式，再補上命理知識。你永遠用溫暖、深度、諮商式的語氣。不得恐嚇、不得宿命論、不得絕對語氣。

通用要求：
- 綜合分析時同時考慮「本宮 → 對宮 → 夾宮」的結構，不用寫出此術語。
- 四化（祿權科忌）需結合宮位象意判斷方向（事件、心理、機會、壓力）。
- 五行可用來校正星曜亮度與慣性。
- 命主用「你」稱呼。
- 所有 insight 必須具備：core_insight、evidence、implications、suggestions。
- evidence 以人話與故事為先，技術名詞與依據放在該段末尾。

【特別資料結構：時間軸】
chart_json 中會包含：
1. decadalLimits：所有十年大限，每筆含 index, startAge, endAge, palace, stem, mutagenStars（祿權科忌）, weights, type: "dalimit"
2. yearlyHoroscope：當年小限，含 age, activeLimitPalaceName, yearlyStem, mutagenStars
3. liunian：當年流年四化，含 year, stem, branch, palace, mutagenStars, weights, type: "liunian"
三者共同構成時間軸（十年 → 每年 → 當年心理濾鏡）。

【章節通用格式】
每章 insight 輸出：{ "core_insight": "", "evidence": "", "implications": "", "suggestions": "" }

s01～s14：照現行邏輯，依命盤切片與權重產出四欄。
★ s15（十年大限）：使用 chart_json.decadalLimits。core_insight 總結整體人生節奏；evidence 依 index 整合每大限的 palace、stem、mutagenStars、weights，點出 2–3 個關鍵大限；implications 說明各階段思維與責任轉變；suggestions 用十年級距給策略（早年探索、中年建立、本限三件事、下限準備）。
★ s16（流年）：使用 yearlyHoroscope + liunian。core_insight 一句總結該年主軸；evidence 區分流年＝外在事件、小限＝心理濾鏡；implications 說明情緒與決策傾向；suggestions 列出 3–5 條當年策略（財務／工作／關係／身心），無流月可用上半年／下半年概述。
★ s20（三盤疊加）：使用當前大限、當年小限、當年流年、traffic_signals。core_insight 用紅綠燈語言；evidence 說明本命→大限→流年→小限疊加；implications 指出錯估風險與錯過機會；suggestions 綠燈 2–3 項、黃燈 2–3 項、紅燈 3–5 項具體建議。

若 user 提供【星曜宮位定義】，請依該星落該宮優先採用該定義描述，勿僅述星曜通用特質。
若 user 提供【命主・身主星曜定義】：命主、身主由命宮地支與年支推算，與命宮內主星無關；請在 s04 及相關章節分析其星曜特色（潛意識驅動力、後天行動模式）。`;

export interface SectionInsight {
  core_insight: string;
  evidence: string;
  implications: string;
  suggestions: string;
}

export type InferOutput = Record<string, SectionInsight>;

export function buildInferUserPrompt(
  chartJson: Record<string, unknown>,
  weightAnalysis: Record<string, unknown>,
  options?: {
    starPalaces?: Record<string, string>;
    masterStars?: { 命主?: { name: string; text: string }; 身主?: { name: string; text: string } };
    /** 身宮與命身關係片段（用於 s04 推論） */
    lifeBodyRelationSnippet?: string[];
    /** 輔星／煞星／雜曜 行動建議（用於戰略建議推論） */
    starPalacesAuxAction?: Record<string, string>;
    /** 輔星／煞星／雜曜 風險等級 1～5（高風險→保守防禦語氣） */
    starPalacesAuxRisk?: Record<string, number>;
  } | null
): string {
  const strategicLinks = (chartJson?.strategicLinks as Array<{ type?: string; key?: string; isLeak?: boolean; isCompound?: boolean }> | undefined) ?? [];
  const chartStr = JSON.stringify(
    {
      ziwei: chartJson?.ziwei,
      bazi: chartJson?.bazi,
      overlapAnalysis: chartJson?.overlapAnalysis ?? chartJson?.overlap,
      fourTransformations: chartJson?.fourTransformations,
      fiveElements: chartJson?.fiveElements ?? chartJson?.wuxingData,
      strategicLinks,
      decadalLimits: chartJson?.decadalLimits,
      yearlyHoroscope: chartJson?.yearlyHoroscope,
      liunian: chartJson?.liunian,
    },
    null,
    2
  );
  const weightStr = JSON.stringify(weightAnalysis, null, 2);
  const strategicText = getStrategicText(strategicLinks);
  const strategicBlock = strategicText ? "\n【戰略聯動文案（可納入推論）】\n" + strategicText : "";

  const starPalaces = options?.starPalaces && Object.keys(options.starPalaces).length > 0
    ? options.starPalaces
    : undefined;
  const starPalacesBlock = starPalaces
    ? "\n【星曜宮位評語（會直接顯示給當事人）】以下評語會由系統原樣輸出，你不需要在 evidence 中重複。\n" +
      Object.entries(starPalaces)
        .map(([k, v]) => `${k}: ${v}`)
        .join("\n") +
      "\n【重要】evidence 僅能針對上述評語做延伸說明（為何如此、如何體現），不得重寫或重複評語。"
    : "";

  const masterStars = options?.masterStars;
  const hasMasterStars = masterStars && (masterStars.命主 || masterStars.身主);
  const masterStarsBlock = hasMasterStars
    ? "\n【命主・身主星曜定義】命主與身主是依命宮地支、年支推算出的兩顆星，不是命宮內的主星；命宮可無主星或有其他星，勿混淆。以下為命主星與身主星的星曜說明：\n" +
      (masterStars.命主 ? `命主（${masterStars.命主.name}）：${masterStars.命主.text}\n` : "") +
      (masterStars.身主 ? `身主（${masterStars.身主.name}）：${masterStars.身主.text}\n` : "")
    : "";

  const lifeBodyLines = options?.lifeBodyRelationSnippet;
  const lifeBodyBlock = lifeBodyLines && lifeBodyLines.length > 0
    ? "\n【命身・身宮】以下用於 s04「你為這具身體準備了什麼？」等章節，請納入推論。\n" + lifeBodyLines.join("\n")
    : "";

  const auxAction = options?.starPalacesAuxAction;
  const auxActionBlock = auxAction && Object.keys(auxAction).length > 0
    ? "\n【星曜行動建議】以下為輔星／煞星／雜曜的可執行方針，請在推論中納入「戰略建議」方向。\n" +
      Object.entries(auxAction).map(([k, v]) => `${k}: ${v}`).join("\n")
    : "";

  const auxRisk = options?.starPalacesAuxRisk;
  const auxRiskBlock = auxRisk && Object.keys(auxRisk).length > 0
    ? "\n【星曜風險等級】以下為輔星／煞星在該宮的風險等級（1=低～5=高）。等級 4～5 時請採用保守防禦語氣、主動提醒當事人避險。\n" +
      Object.entries(auxRisk)
        .filter(([, v]) => typeof v === "number" && v >= 1 && v <= 5)
        .map(([k, v]) => `${k}=${v}`)
        .join("；")
    : "";

  const sectionList = SECTION_ORDER.map((key) => {
    const t = SECTION_TEMPLATES.find((x) => x.section_key === key);
    return `- ${key}: ${t?.title ?? key}`;
  }).join("\n");

  return `請分析以下命盤，為 22 個章節（s00～s21）各產出結構化 insight。

【章節列表】
${sectionList}

【命盤數據】
${chartStr}

【權重摘要】
${weightStr}
${strategicBlock}
${starPalacesBlock}
${masterStarsBlock}
${lifeBodyBlock}
${auxActionBlock}
${auxRiskBlock}

【輸出格式】必須只輸出 JSON，格式如下：
{
  "s00": { "core_insight": "", "evidence": "", "implications": "", "suggestions": "" },
  "s03": { ... },
  ...
  "s21": { ... }
}
（鍵名必須與【章節列表】完全一致：s00, s03, s04, s02, s10, s01, s05, s06, s07, s08, s09, s11, s12, s13, s14, s15, s15a, s16, s17, s18, s19, s20, s21）

每欄 80–200 字，精準提取命盤事實與推論。請開始。`;
}
