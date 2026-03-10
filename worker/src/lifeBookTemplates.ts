/**
 * 命書模板（簡化版）
 * 22 題：一欄描述 + slice_types + palace_focus，無長篇指引
 */

export const SECTION_ORDER = [
  "s00", "s03", "s04", "s02", "s10", "s01", "s05", "s06", "s07", "s08", "s09",
  "s11", "s12", "s13", "s14", "s15", "s15a", "s16", "s17", "s18", "s19", "s20", "s21",
] as const;

export type SliceType = "ziwei" | "bazi" | "overlap" | "sihua" | "wuxing" | "fourTransform";

export type PalaceName =
  | "命宮" | "兄弟" | "夫妻" | "子女" | "財帛" | "疾厄" | "遷移" | "僕役" | "官祿" | "田宅" | "福德" | "父母";

export interface SectionTemplate {
  section_key: string;
  index: number;
  title: string;
  /** 一欄描述，供【任務】使用 */
  description: string;
  slice_types: SliceType[];
  palace_focus?: PalaceName[];
  needs_wuxing_weak?: boolean;
  /** 預設權重，可被 weight_analysis 覆寫 */
  importance_level?: "high" | "medium" | "low";
}

export const SECTION_TEMPLATES: SectionTemplate[] = [
  { section_key: "s00", index: 0, title: "這一局，你為什麼要來？（靈魂行前簡報）", description: "整本命書開場：四化人格＋這一局的主題、人生遊戲任務書總覽。", slice_types: ["ziwei", "overlap", "wuxing", "fourTransform"], importance_level: "high" },
  { section_key: "s03", index: 1, title: "你的命盤結構（主線劇本 × 星曜群性 × 四化慣性）", description: "說明你整張命盤的基本結構：命宮三方四正、關係與事業主線、星曜群性的調性，與本命四化牽動的宮位與慣性。", slice_types: ["ziwei", "sihua"], needs_wuxing_weak: false },
  { section_key: "s04", index: 2, title: "你為這具身體準備了什麼？（命主・身主・身宮）", description: "顯意識與潛意識、身宮轉向、中年後內在驅動。", slice_types: ["ziwei", "overlap", "sihua"], palace_focus: [] },
  { section_key: "s02", index: 3, title: "你是帶著什麼狀態上場？（命宮）", description: "命宮主軸、人格慣性、格局高度與對宮提醒。", slice_types: ["ziwei", "overlap", "sihua"], palace_focus: ["命宮"] },
  { section_key: "s10", index: 4, title: "賺錢方式與財務節奏（財帛宮）", description: "賺錢方式、財務習慣、正偏財與財務風險。", slice_types: ["ziwei", "overlap", "sihua"], palace_focus: ["財帛"], importance_level: "high" },
  { section_key: "s01", index: 5, title: "你的心靈休息站（福德宮）", description: "精神世界、私下真實樣貌與晚年質地。", slice_types: ["ziwei", "overlap"], palace_focus: ["福德"] },
  { section_key: "s05", index: 6, title: "學習看自己的鏡子（父母宮）", description: "原生家庭、父母對你的劇本、權威議題。", slice_types: ["ziwei", "overlap", "sihua"], palace_focus: ["父母"] },
  { section_key: "s06", index: 7, title: "互相成就課題（兄弟宮）", description: "手足、人際、戰友結構與私庫（財庫）狀況。", slice_types: ["ziwei", "overlap", "sihua"], palace_focus: ["兄弟"] },
  { section_key: "s07", index: 8, title: "服務他人、團隊默契（僕役宮）", description: "社交磁場、吸引的人、團隊合作運勢。", slice_types: ["ziwei", "overlap", "sihua"], palace_focus: ["僕役"] },
  { section_key: "s08", index: 9, title: "事業、成就、工作舞台（官祿宮）", description: "此題聚焦你的工作狀態、外界期待、成就節奏。", slice_types: ["ziwei", "overlap", "sihua"], palace_focus: ["官祿"], importance_level: "high" },
  { section_key: "s09", index: 10, title: "生活根基與安全基地（田宅宮）", description: "資產、房產、土地緣與穩定度。", slice_types: ["ziwei", "overlap", "sihua"], palace_focus: ["田宅"] },
  { section_key: "s11", index: 11, title: "健康與壓力出口（疾厄宮）", description: "健康體質、五行弱點與中晚年風險。", slice_types: ["ziwei", "overlap", "wuxing"], needs_wuxing_weak: true, palace_focus: ["疾厄"] },
  { section_key: "s12", index: 12, title: "對外舞台與社會運勢（遷移宮）", description: "異地發展、外界磁場與社交面具。", slice_types: ["ziwei", "overlap", "sihua"], palace_focus: ["遷移"] },
  { section_key: "s13", index: 13, title: "重要調整區（夫妻宮）", description: "婚姻結構、伴侶特質與離合訊號。", slice_types: ["ziwei", "overlap", "sihua"], palace_focus: ["夫妻"] },
  { section_key: "s14", index: 14, title: "紅燈高壓區（子女宮）", description: "子女緣分、創造力與投資合作運。", slice_types: ["ziwei", "overlap", "sihua"], palace_focus: ["子女"] },
  { section_key: "s15", index: 15, title: "十年節奏（大限）", description: "大限宮位、大限主星、本命四化 → 十年主題、十年策略。", slice_types: ["ziwei", "overlap", "sihua"], palace_focus: [], importance_level: "high" },
  { section_key: "s15a", index: 16, title: "人生時間軸", description: "關鍵年份、疊宮分析、風險等級 → 每年適合／不適合的決策建議（決策事件類型）。", slice_types: ["ziwei", "overlap", "sihua"], palace_focus: [] },
  { section_key: "s16", index: 17, title: "今年的主線任務與心理濾鏡（流年）", description: "流年命宮、流年四化、決策建議（今年適合／不建議大動作）。", slice_types: ["ziwei", "overlap", "sihua"], palace_focus: [], importance_level: "high" },
  { section_key: "s17", index: 18, title: "十年 × 年度交叉分析", description: "大限宮位 × 流年宮位 → 今年在十年劇本中的角色。", slice_types: ["ziwei", "overlap", "wuxing"], palace_focus: [] },
  { section_key: "s18", index: 19, title: "主要盲點", description: "全盤：未完成的必修課、業力議題、痛點與重複循環。", slice_types: ["ziwei", "overlap", "sihua"], palace_focus: [] },
  { section_key: "s19", index: 20, title: "行動策略", description: "全盤：三條立刻可做・三條長期累積・三條避開折損。", slice_types: ["ziwei", "overlap", "wuxing", "sihua"], palace_focus: [] },
  { section_key: "s20", index: 21, title: "三盤疊加診斷（流年 × 大限 × 本命）", description: "原命＋大運＋流年的事件與心態重疊；本章以夫妻宮為關係場範例。", slice_types: ["ziwei", "overlap", "wuxing", "sihua"], palace_focus: ["夫妻"], importance_level: "high" },
  { section_key: "s21", index: 22, title: "你往何處去（靈魂總結）", description: "整本命書收束，方向與安心感。", slice_types: ["ziwei", "overlap"], palace_focus: [], importance_level: "high" },
];

/** 十神一句（必要時可注入） */
export const SHISHEN_PHRASES: Record<string, string> = {
  比肩: "我要靠自己。",
  劫財: "我正在找資源，會出現競爭或破耗。",
  食神: "我要舒服，我想把感受變成作品。",
  傷官: "我要突破，我不想被框住。",
  偏財: "我要流動，我靠機會與人脈吃飯。",
  正財: "我要穩定，我靠制度與紀律累積。",
  七殺: "我要挑戰，我願意冒險承擔壓力。",
  正官: "我要秩序，我需要被看見與被認可。",
  偏印: "我要變化，我靠直覺洞察世界。",
  正印: "我要保護，我給也承擔。",
};

/** 五行弱項建議（必要時可注入） */
export const WUXING_WEAK_PHRASES: Record<string, string> = {
  金: "邏輯、規則、界線容易鬆動。補金＝把標準寫下來。",
  木: "方向感與決定力容易搖擺。補木＝先做小目標。",
  水: "資訊吸收慢、情緒反應直。補水＝每天 10 分鐘放空。",
  火: "行動慢、動能不足。補火＝從先熱身開始。",
  土: "承載力與安全感不穩。補土＝固定生活節奏。",
};
