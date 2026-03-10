/**
 * Phase 3：敘事層
 * 結構化 insight → 風格化文案
 * 模型：gpt-5-main 或 gpt-4o-mini（敘事）
 */

import { SECTION_TEMPLATES, type SectionTemplate } from "./lifeBookTemplates.js";
import type { SectionInsight } from "./lifeBookInfer.js";
import type { LifeBookConfig } from "./lifeBookPrompts.js";
import { EXPERT_PERSONA, GENERAL_RULES } from "./lifeBookPrompts.js";

export const NARRATE_MODEL = "gpt-4.1";

export function buildNarrateSystemPrompt(config?: LifeBookConfig | null): string {
  const persona = config?.persona?.trim() || EXPERT_PERSONA;
  const rules = config?.rules?.trim() || GENERAL_RULES;
  return `${persona}\n\n${rules}`;
}

export function buildNarrateUserPrompt(
  sectionKey: string,
  insight: SectionInsight,
  template: SectionTemplate,
  config?: LifeBookConfig | null
): string {
  const shishenPhrases =
    config?.shishen && Object.keys(config.shishen).length > 0
      ? Object.entries(config.shishen).map(([k, v]) => `${k}：${v}`)
      : [];

  return `【題號】${template.index}/22
【標題】${template.title}

【結構化 insight】（請轉化為風格化敘事，維持四段結構）
- core_insight → behavior_pattern（核心洞察）
- evidence → structure_analysis（綜合分析）
- implications → blind_spots（人生影響）
- suggestions → strategic_advice（行動建議）

${JSON.stringify(insight, null, 2)}

【該題重點】
${template.description}

【語氣】稱呼用「你」或當事人姓名。多用直述句、肯定句；省略「你的命盤中」等說法。詳細解釋。

【十神參考句庫】可適度融入
${shishenPhrases.join("\n")}

請將上述 insight 轉化為帶有溫度、直述肯定的敘事，輸出 JSON。
只輸出 JSON。`;
}
