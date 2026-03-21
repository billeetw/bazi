/**
 * Layer 1：NormalizedChart 與相關型別（命術書引擎 Architecture Spec v1.1）
 * 所有 inference engine 只吃此結構；normalizeChart() 產出，不做命理判斷。
 */

/** 四化顯示／規則用：祿權科忌 */
export type TransformDisplay = "祿" | "權" | "科" | "忌";

/** 單條四化邊：from 宮 → to 宮，型別與星名；layer 區分本命／大限／流年 */
export interface TransformEdge {
  fromPalace: string;
  toPalace: string;
  transform: TransformDisplay;
  layer: "natal" | "decade" | "year";
  starName?: string;
}

/** 宮內單一星曜：名稱、亮度、本命四化、風險等級 */
export interface StarInPalace {
  name: string;
  brightness?: "廟" | "旺" | "利" | "平" | "陷" | "不";
  natalTransform?: TransformDisplay | null;
  riskLevel?: number;
}

/** 單一宮位結構：主星／輔星／煞星／雜曜 + 各層四化 In/Out（四化掛在宮位上） */
export interface PalaceStructure {
  palace: string;
  mainStars: StarInPalace[];
  assistantStars: StarInPalace[];
  shaStars: StarInPalace[];
  miscStars: StarInPalace[];
  leadMainStar?: string;
  coLeadMainStars?: string[];
  natalTransformsIn: TransformEdge[];
  natalTransformsOut: TransformEdge[];
  decadalTransformsIn: TransformEdge[];
  decadalTransformsOut: TransformEdge[];
  yearlyTransformsIn: TransformEdge[];
  yearlyTransformsOut: TransformEdge[];
}

/** 十年大限一筆（含該大限四化） */
export interface DecadalLimit {
  palace: string;
  startAge: number;
  endAge: number;
  stem?: string;
  mutagenStars?: Record<string, string>;
  /** 此大限四化邊，禁止用於流年 */
  transforms?: TransformEdge[];
  /** 模組二只讀此欄位；路線 B 權威邊（本期與 transforms 同源，未來改 worker 重建） */
  flows?: TransformEdge[];
  /** debug：四化來源標籤 */
  transformSource?: string;
}

/** 本命層：生年四化，來源為 birthYearStem */
export interface NatalScope {
  birthTransforms: TransformEdge[];
  /** 模組二只讀此欄位；路線 B 權威邊，與 birthTransforms 同源或 worker 重建 */
  flows?: TransformEdge[];
}

/** 當年流年範圍（流年命宮、流年四化分開，禁止用大限四化當流年） */
export interface YearScope {
  year?: number;
  nominalAge?: number;
  /** 流年命宮／流年地支落宮 */
  destinyPalace?: string;
  /** 流年四化邊，禁止 fallback 為大限四化 */
  transforms?: TransformEdge[];
  /** 模組二只讀此欄位；路線 B 權威邊 */
  flows?: TransformEdge[];
  /** debug：四化來源標籤 */
  transformSource?: string;
  palaceNames?: string[];
  mutagenStars?: Record<string, string>;
}

/** 身宮來源標記（spec 寫死優先順序，debug 用） */
export type BodyPalaceSource = "chart.shenGong" | "chart.bodyPalace" | "derived" | "missing";

/**
 * Layer 1 輸出：標準化命盤。
 * 時間層：natal、currentDecade、yearlyHoroscope（本命／大限／流年）。禁止 yearlyTransforms = decadalTransforms 作為 fallback。
 * palaceByBranch：地支→宮位唯一權威，由命宮地支建表一次，流年命宮等一律查表。
 */
export interface NormalizedChart {
  chartId: string;
  locale: string;
  nominalAge?: number;
  flowYear?: number;
  mingGong: string;
  shenGong?: string;
  shenGongSource?: BodyPalaceSource;
  lifeLord?: string;
  bodyLord?: string;
  /** 地支→宮位唯一權威（寅…丑 → 宮名）；流年命宮 = palaceByBranch[liunian.branch] */
  palaceByBranch?: Record<string, string>;
  /** 命宮地支（單字，如 寅）；供 Behavior Axis v1 等，與 `readZiweiSoulBranch` 同源 */
  mingSoulBranch?: string;
  /** 宮干飛化用：每宮宮干（命宮、兄弟宮… → 甲乙丙…） */
  palaceStemMap?: Record<string, string>;
  palaces: PalaceStructure[];
  natalTransforms: TransformEdge[];
  natal?: NatalScope;
  decadalLimits: DecadalLimit[];
  currentDecade?: DecadalLimit;
  yearlyHoroscope?: YearScope;
}

/** 宮名正規化：官祿/官祿宮 → 官祿宮，命 → 命宮 */
export const PALACE_SUFFIX = "宮";
const PALACE_ALIAS: Record<string, string> = {
  "命": "命宮",
  "兄弟": "兄弟宮",
  "夫妻": "夫妻宮",
  "子女": "子女宮",
  "財帛": "財帛宮",
  "疾厄": "疾厄宮",
  "遷移": "遷移宮",
  "僕役": "僕役宮",
  "交友": "僕役宮",
  "官祿": "官祿宮",
  "田宅": "田宅宮",
  "福德": "福德宮",
  "父母": "父母宮",
};

export function toPalaceCanonical(p: string): string {
  const t = (p || "").trim().replace(/\s/g, "");
  if (!t) return "";
  if (t.endsWith(PALACE_SUFFIX)) return t;
  return PALACE_ALIAS[t] ?? t + PALACE_SUFFIX;
}

/** 亮度正規化：得→利；接受中文廟旺利平陷不；iztro 常見英文鍵 miao/wang/li/xian/ping/de/bu */
export function toBrightnessCanonical(b: string | undefined): PalaceStructure["mainStars"][0]["brightness"] | undefined {
  if (b == null || b === "") return undefined;
  const s = (b as string).trim();
  if (s === "得") return "利";
  if (["廟", "旺", "利", "平", "陷", "不"].includes(s)) return s as StarInPalace["brightness"];
  const lower = s.toLowerCase();
  const iztro: Record<string, StarInPalace["brightness"]> = {
    miao: "廟",
    wang: "旺",
    li: "利",
    xian: "陷",
    ping: "平",
    de: "利", // 得 → 內部用利
    bu: "不",
  };
  const mapped = iztro[lower];
  if (mapped) return mapped;
  return undefined;
}

/** 四化正規化：lu/quan/ke/ji 或 祿/權/科/忌 → TransformDisplay */
export function toTransformDisplay(t: string | undefined): TransformDisplay | undefined {
  if (t == null || t === "") return undefined;
  const m: Record<string, TransformDisplay> = {
    lu: "祿", quan: "權", ke: "科", ji: "忌",
    祿: "祿", 權: "權", 科: "科", 忌: "忌",
  };
  return m[(t as string).trim()];
}
