/**
 * 命書生成 Prompt 邏輯（與 lifeBookEngine.js 同步）
 * 供 Worker POST /api/life-book/generate 使用
 */

const SECTION_ORDER = [
  "s01", "s02", "s03", "s04", "s05", "s06", "s07", "s08", "s09", "s10",
  "s11", "s12", "s13", "s14", "s15", "s16", "s17", "s18", "s19", "s20",
];

const SECTION_DESCRIPTIONS: Record<string, string> = {
  s01: "命主／身主／身宮：核心作業系統、顯意識與潛意識的定位。",
  s02: "命宮三方四正：性格基調、格局高度、人生主軸。",
  s03: "五行氣勢與四化：能量流動、生剋關係、生年四化對命盤的影響。",
  s04: "父母宮三方四正：與權威、規則、長輩的互動模式。",
  s05: "兄弟宮三方四正：手足、同儕、近親資源。",
  s06: "交友宮（僕役宮）三方四正：社交網絡、人際緣分、眾生相。",
  s07: "官祿宮三方四正：事業軌道、執行強度、成就結構。",
  s08: "財帛宮三方四正：金錢獲取、理財邏輯、資源流動。",
  s09: "田宅宮三方四正：資產根基、穩定堡壘、歸屬感。",
  s10: "福德宮三方四正：精神底蘊、內心平衡、價值觀。",
  s11: "疾厄宮三方四正：生理硬體、身心基石、健康議題。",
  s12: "遷移宮三方四正：外部接口、外界觀感、移動與發展。",
  s13: "夫妻宮三方四正：親密連結、合夥狀態、情感課題。",
  s14: "子女宮三方四正：產出效能、創造力、傳承。",
  s15: "十年大限分析：當前十年運限主題、宮位、四化影響。",
  s16: "2026 流年：小限疊宮飛星、年度節奏、關鍵宮位。",
  s17: "靈魂使命：此生為何而來、核心任務與方向。",
  s18: "人生主線任務：把使命落到行動、具體節奏與選擇。",
  s19: "業力與未完成課題：化忌與業力宮位、需面對的課題。",
  s20: "總結導航：全盤優化建議與避凶指引、下一步行動。",
};

export const SYSTEM_PROMPT = `你是一位資深命理諮詢顧問，同時具備心理洞察與戰略思維。

你的任務是根據使用者提供的命盤數據，撰寫一章「人生戰略命書」。

請遵守以下規則：

【語氣規範】
使用第二人稱（你）
口吻溫和、深度、引導式
可使用提問句，但不得審判
禁止宿命論語氣
禁止恐嚇式表述
不得使用絕對語氣（例如「必定」、「註定」）
強調節奏與選擇，而非命定

【結構規範】
每一章必須包含四個段落欄位：
structure_analysis：解釋命盤結構事實，必須包含三方四正分析，必須考慮對宮衝擊，必須考慮夾宮影響，必須結合五行強弱校正星曜亮度
behavior_pattern：說明心理與行為模式，解釋你為何會如此
blind_spots：說明潛在盲點與衝突，分析化忌或失衡處
strategic_advice：給出具體可行方向，不得抽象，必須可實踐

【輸出格式】
必須只輸出 JSON。
禁止額外說明文字。
格式必須為：
{
  "section_key": "",
  "title": "",
  "importance_level": "high | medium | low",
  "structure_analysis": "",
  "behavior_pattern": "",
  "blind_spots": "",
  "strategic_advice": ""
}
不得新增欄位。
不得省略欄位。`;

interface WeightAnalysis {
  importance_map?: Record<string, string>;
  top_focus_palaces?: string[];
  risk_palaces?: string[];
  stable_palaces?: string[];
}

export function buildSectionUserPrompt(
  sectionKey: string,
  chartJson: Record<string, unknown>,
  weightAnalysis: WeightAnalysis
): string {
  const importance = weightAnalysis?.importance_map?.[sectionKey] ?? "medium";
  const description = SECTION_DESCRIPTIONS[sectionKey] ?? sectionKey;

  const chartForPrompt = JSON.stringify(
    {
      ziwei: chartJson?.ziwei,
      bazi: chartJson?.bazi,
      overlapAnalysis: chartJson?.overlapAnalysis ?? chartJson?.overlap,
      fourTransformations: chartJson?.fourTransformations,
      fiveElements: chartJson?.fiveElements ?? chartJson?.wuxingData,
    },
    null,
    2
  );

  const weightForPrompt = JSON.stringify(
    {
      importance_map: weightAnalysis?.importance_map,
      top_focus_palaces: weightAnalysis?.top_focus_palaces,
      risk_palaces: weightAnalysis?.risk_palaces,
      stable_palaces: weightAnalysis?.stable_palaces,
    },
    null,
    2
  );

  return `請生成章節：${sectionKey}

本章重要度為：${importance}

篇幅要求：
high：1200–1600字
medium：800–1200字
low：500–800字

請依照重要度調整篇幅。

本章主題說明：
${description}

命盤數據如下：
${chartForPrompt}

權重摘要如下：
${weightForPrompt}

分析規則：
必須分析三方四正
必須考慮對宮與夾宮
必須結合五行強弱
必須結合生年四化
若有疊宮或引爆區，必須說明其心理與行為影響
若本章非核心章節，請保持精簡但完整

請開始生成。
只輸出 JSON。`;
}

export { SECTION_ORDER };
