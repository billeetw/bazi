/**
 * 星×宮×四化語義矩陣：高頻、易誤解、對人生敘事影響大的組合，優先輸出 meaning。
 * 匹配方式：match(star, palace, transform) → 若命中優先輸出 meaning，否則回歸一般 rule 句。
 */

export type TransformType = "祿" | "權" | "科" | "忌";

export interface StarPalaceTransformMeaning {
  star: string;
  palace: string;
  transform: TransformType;
  meaning: string;
}

export const STAR_PALACE_TRANSFORM_MATRIX: StarPalaceTransformMeaning[] = [
  { star: "武曲", palace: "財帛宮", transform: "祿", meaning: "你的資源與收入往往來自紀律、效率與長期累積，而不是短期運氣。" },
  { star: "武曲", palace: "財帛宮", transform: "忌", meaning: "金錢壓力容易變成心理壓力，你會不自覺把自我價值與成果綁在一起。" },
  { star: "武曲", palace: "田宅宮", transform: "祿", meaning: "穩定感很大一部分來自實際資產、生活基礎或可長期累積的資源。" },
  { star: "武曲", palace: "田宅宮", transform: "忌", meaning: "安全感常與現實壓力綁在一起，例如房子、責任或長期負擔。" },
  { star: "廉貞", palace: "夫妻宮", transform: "祿", meaning: "親密關係往往帶來資源與機會，你很容易因為關係而打開新的局面。" },
  { star: "廉貞", palace: "夫妻宮", transform: "忌", meaning: "關係中的權力、界線與期待容易變成壓力來源。" },
  { star: "廉貞", palace: "官祿宮", transform: "祿", meaning: "工作中的權力與主導權會為你帶來機會與舞台。" },
  { star: "廉貞", palace: "官祿宮", transform: "忌", meaning: "職場壓力往往來自角色衝突或權責不清。" },
  { star: "天同", palace: "福德宮", transform: "祿", meaning: "你的內在世界其實很容易找到安穩與舒適，只要節奏對了，很多事情都能慢慢好轉。" },
  { star: "天同", palace: "福德宮", transform: "忌", meaning: "當壓力來時，你很容易想躲回舒適區，這會拖慢問題的解決。" },
  { star: "天同", palace: "夫妻宮", transform: "祿", meaning: "關係中的溫度與陪伴，是你重要的能量來源。" },
  { star: "天同", palace: "夫妻宮", transform: "忌", meaning: "若關係節奏失衡，你容易在依賴與失望之間來回擺盪。" },
  { star: "巨門", palace: "夫妻宮", transform: "祿", meaning: "很多關係的機會其實來自溝通、合作與觀點交換。" },
  { star: "巨門", palace: "夫妻宮", transform: "忌", meaning: "關係中的摩擦多半不是事件本身，而是理解差異。" },
  { star: "巨門", palace: "福德宮", transform: "忌", meaning: "你的內心世界常處於思考與自我對話之中，很難完全停止分析。" },
  { star: "天機", palace: "官祿宮", transform: "祿", meaning: "工作上的優勢來自思考速度與策略能力。" },
  { star: "天機", palace: "官祿宮", transform: "忌", meaning: "想得太多有時會拖慢決策速度。" },
  { star: "天機", palace: "子女宮", transform: "祿", meaning: "你的創造與產出往往來自想法與方法，而不是單純努力。" },
  { star: "太陰", palace: "福德宮", transform: "祿", meaning: "你的內在其實很需要安靜與情緒穩定的空間。" },
  { star: "太陰", palace: "福德宮", transform: "忌", meaning: "情緒容易受到環境氛圍影響。" },
  { star: "太陰", palace: "田宅宮", transform: "祿", meaning: "家庭與生活空間會是你重要的能量來源。" },
  { star: "紫微", palace: "官祿宮", transform: "祿", meaning: "你很容易被推到需要做決策或承擔方向的位置。" },
  { star: "紫微", palace: "官祿宮", transform: "權", meaning: "你在職場中往往會成為別人依賴的中心。" },
  { star: "紫微", palace: "父母宮", transform: "權", meaning: "你對權威與規則的敏感度很高。" },
  { star: "破軍", palace: "官祿宮", transform: "權", meaning: "你的職涯不太會走直線，而是透過幾次重大轉型前進。" },
  { star: "破軍", palace: "遷移宮", transform: "權", meaning: "人生的轉折往往來自換環境或舞台。" },
  { star: "貪狼", palace: "僕役宮", transform: "祿", meaning: "很多機會其實來自社交圈與合作關係。" },
  { star: "貪狼", palace: "僕役宮", transform: "忌", meaning: "人際圈若界線不清，容易帶來額外壓力。" },
  { star: "天梁", palace: "官祿宮", transform: "祿", meaning: "你很容易把工作視為一種責任或使命。" },
  { star: "天梁", palace: "父母宮", transform: "祿", meaning: "你對家庭或價值體系有很強的責任感。" },
];

const toPalaceCanon = (p: string): string => (p && !p.endsWith("宮") ? p + "宮" : p || "");

function toTransformType(transform: string): TransformType | "" {
  const x = (transform ?? "").trim();
  if (x === "lu" || x === "祿") return "祿";
  if (x === "quan" || x === "權") return "權";
  if (x === "ke" || x === "科") return "科";
  if (x === "ji" || x === "忌") return "忌";
  return "";
}

/**
 * 若命中矩陣則回傳 meaning，否則回傳 null（沿用一般 rule 句）。
 */
export function findStarPalaceTransformMeaning(
  star: string,
  palace: string,
  transform: string
): string | null {
  const s = (star ?? "").trim();
  const pal = toPalaceCanon((palace ?? "").trim());
  const t = toTransformType(transform);
  if (!s || !pal || !t) return null;
  const hit = STAR_PALACE_TRANSFORM_MATRIX.find(
    (row) => row.star === s && (row.palace === pal || row.palace === (palace ?? "").trim()) && row.transform === t
  );
  return hit?.meaning ?? null;
}
