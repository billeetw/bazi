/**
 * Life Book Ontology: 生命宇宙說明書
 * 每個宮位、星曜、十神、五行、六識、神經迴路都有固定的 id、中文名、英文 key、類別。
 * Phase 1：只做 ID + 結構 + 短句（shortPhrase / shortDesc），長文案留 Phase 2。
 */

// ============ 宮位 ============

export type PalaceId =
  | "ming"      // 命宮
  | "xiongdi"   // 兄弟
  | "fupo"      // 夫妻
  | "ziNv"      // 子女
  | "cai"       // 財帛
  | "jiE"       // 疾厄
  | "qianyi"    // 遷移
  | "puyi"      // 僕役
  | "guanglu"   // 官祿
  | "tianzhai"  // 田宅
  | "fude"      // 福德
  | "fumu";    // 父母

export type LifeDomain =
  | "self"
  | "money"
  | "career"
  | "family"
  | "relationship"
  | "health"
  | "inner"
  | "movement";

export interface PalaceMeta {
  id: PalaceId;
  name: string;
  nameEn?: string;
  label: string;
  lifeDomain: LifeDomain;
}

/** 順序與 FIXED_PALACES_ZH_TW 一致：命宮→兄弟→…→父母 */
export const PALACES: PalaceMeta[] = [
  { id: "ming", name: "命宮", nameEn: "soul", label: "生命主線", lifeDomain: "self" },
  { id: "xiongdi", name: "兄弟", nameEn: "siblings", label: "手足與戰友", lifeDomain: "family" },
  { id: "fupo", name: "夫妻", nameEn: "spouse", label: "伴侶與合夥", lifeDomain: "relationship" },
  { id: "ziNv", name: "子女", nameEn: "children", label: "創造與傳承", lifeDomain: "family" },
  { id: "cai", name: "財帛", nameEn: "wealth", label: "金錢與資源", lifeDomain: "money" },
  { id: "jiE", name: "疾厄", nameEn: "health", label: "身體與壓力", lifeDomain: "health" },
  { id: "qianyi", name: "遷移", nameEn: "surface", label: "對外舞台", lifeDomain: "movement" },
  { id: "puyi", name: "僕役", nameEn: "friends", label: "人際與團隊", lifeDomain: "relationship" },
  { id: "guanglu", name: "官祿", nameEn: "career", label: "事業與成就", lifeDomain: "career" },
  { id: "tianzhai", name: "田宅", nameEn: "property", label: "根基與安全", lifeDomain: "money" },
  { id: "fude", name: "福德", nameEn: "spirit", label: "靈魂休息站", lifeDomain: "inner" },
  { id: "fumu", name: "父母", nameEn: "parents", label: "根源與權威", lifeDomain: "family" },
];

// ============ 十神 ============

export type TenGodId =
  | "biJian"    // 比肩
  | "jieCai"    // 劫財
  | "shiShen"   // 食神
  | "shangGuan" // 傷官
  | "pianCai"   // 偏財
  | "zhengCai"  // 正財
  | "qiSha"     // 七殺
  | "zhengGuan" // 正官
  | "pianYin"   // 偏印
  | "zhengYin"; // 正印

export type TenGodCategory = "self" | "resource" | "wealth" | "power" | "output";

export interface TenGodMeta {
  id: TenGodId;
  name: string;
  shortPhrase: string;
  category: TenGodCategory;
}

export const TENGODS: TenGodMeta[] = [
  { id: "biJian", name: "比肩", shortPhrase: "我要靠自己。", category: "self" },
  { id: "jieCai", name: "劫財", shortPhrase: "我在找資源，難免有競爭。", category: "self" },
  { id: "shiShen", name: "食神", shortPhrase: "我要舒服，我想把感受變成作品。", category: "output" },
  { id: "shangGuan", name: "傷官", shortPhrase: "我要突破，我不想被框住。", category: "output" },
  { id: "pianCai", name: "偏財", shortPhrase: "我要流動，我靠機會與人脈吃飯。", category: "wealth" },
  { id: "zhengCai", name: "正財", shortPhrase: "我要穩定，我靠制度與紀律累積。", category: "wealth" },
  { id: "qiSha", name: "七殺", shortPhrase: "我要挑戰，我願意冒險承擔壓力。", category: "power" },
  { id: "zhengGuan", name: "正官", shortPhrase: "我要秩序，我需要被看見與被認可。", category: "power" },
  { id: "pianYin", name: "偏印", shortPhrase: "我要變化，我靠直覺洞察世界。", category: "resource" },
  { id: "zhengYin", name: "正印", shortPhrase: "我要保護，我給也承擔。", category: "resource" },
];

// ============ 五行 ============

export type WuXingId = "wood" | "fire" | "earth" | "metal" | "water";

export interface WuXingMeta {
  id: WuXingId;
  name: string;
  organ: string;
  psyche: string;
}

export const WUXING: WuXingMeta[] = [
  { id: "wood", name: "木", organ: "肝／筋", psyche: "成長、方向、突破" },
  { id: "fire", name: "火", organ: "心／血脈", psyche: "熱情、表現、行動" },
  { id: "earth", name: "土", organ: "脾／肉", psyche: "穩定、承載、整合" },
  { id: "metal", name: "金", organ: "肺／皮毛", psyche: "收斂、紀律、界限" },
  { id: "water", name: "水", organ: "腎／骨", psyche: "流動、智慧、沉潛" },
];

// ============ 星曜（主星 14） ============

export type MainStarId =
  | "ziWei"     // 紫微
  | "tianJi"    // 天機
  | "taiYang"   // 太陽
  | "wuQu"      // 武曲
  | "tianTong"  // 天同
  | "lianZhen"  // 廉貞
  | "tianFu"    // 天府
  | "taiYin"    // 太陰
  | "tanLang"   // 貪狼
  | "juMen"     // 巨門
  | "tianXiang" // 天相
  | "tianLiang" // 天梁
  | "qiSha"     // 七殺（星）
  | "poJun";    // 破軍

export type StarKind = "main" | "aux";

export interface StarMeta {
  id: MainStarId;
  name: string;
  nameEn?: string;
  kind: StarKind;
  wuxing?: string;
}

/** 14 主星，順序與 star-registry.json 一致 */
export const STARS: StarMeta[] = [
  { id: "ziWei", name: "紫微", nameEn: "emperor", kind: "main", wuxing: "土" },
  { id: "tianJi", name: "天機", nameEn: "advisor", kind: "main", wuxing: "木" },
  { id: "taiYang", name: "太陽", nameEn: "sun", kind: "main", wuxing: "火" },
  { id: "wuQu", name: "武曲", nameEn: "general", kind: "main", wuxing: "金" },
  { id: "tianTong", name: "天同", nameEn: "fortunate", kind: "main", wuxing: "水" },
  { id: "lianZhen", name: "廉貞", nameEn: "judge", kind: "main", wuxing: "火" },
  { id: "tianFu", name: "天府", nameEn: "empress", kind: "main", wuxing: "土" },
  { id: "taiYin", name: "太陰", nameEn: "moon", kind: "main", wuxing: "水" },
  { id: "tanLang", name: "貪狼", nameEn: "wolf", kind: "main", wuxing: "木" },
  { id: "juMen", name: "巨門", nameEn: "advocator", kind: "main", wuxing: "水" },
  { id: "tianXiang", name: "天相", nameEn: "minister", kind: "main", wuxing: "水" },
  { id: "tianLiang", name: "天梁", nameEn: "sage", kind: "main", wuxing: "土" },
  { id: "qiSha", name: "七殺", nameEn: "marshal", kind: "main", wuxing: "金" },
  { id: "poJun", name: "破軍", nameEn: "rebel", kind: "main", wuxing: "水" },
];

// ============ 心智／六識 ============

export type ConsciousChannelId =
  | "yanShi"   // 眼
  | "erShi"    // 耳
  | "biShi"    // 鼻
  | "sheShi"   // 舌
  | "shenShi"  // 身
  | "yiShi";   // 意

export interface ConsciousMeta {
  id: ConsciousChannelId;
  name: string;
  theme: string;
}

export const CONSCIOUS_CHANNELS: ConsciousMeta[] = [
  { id: "yanShi", name: "眼識", theme: "視覺、形象、他人眼光" },
  { id: "erShi", name: "耳識", theme: "聽覺、外界聲音、回饋" },
  { id: "biShi", name: "鼻識", theme: "嗅覺、直覺、氛圍" },
  { id: "sheShi", name: "舌識", theme: "味覺、慾望、享樂" },
  { id: "shenShi", name: "身識", theme: "體感、安全感、邊界" },
  { id: "yiShi", name: "意識", theme: "自我定義、信念、執著" },
];

// ============ 神經迴路（預備） ============

export type NeuralLoopId =
  | "fight_flight"
  | "approval_loop"
  | "avoidance_loop"
  | "rumination_loop"
  | "control_loop"
  | "perfection_loop"
  | "victim_loop"
  | "comparison_loop"
  | "catastrophizing"
  | "saving_loop"
  | "numbing_loop"
  | "rationalization";

export interface NeuralLoopMeta {
  id: NeuralLoopId;
  name: string;
  shortDesc: string;
}

export const NEURAL_LOOPS: NeuralLoopMeta[] = [
  { id: "fight_flight", name: "戰或逃迴路", shortDesc: "壓力下立刻反擊或逃開。" },
  { id: "approval_loop", name: "渴望認同迴路", shortDesc: "透過滿足他人期待換取安全感。" },
  { id: "avoidance_loop", name: "防禦逃避迴路", shortDesc: "拖延或無視困難決策。" },
  { id: "rumination_loop", name: "反芻糾結迴路", shortDesc: "反覆重播過去錯誤，難以放下。" },
  { id: "control_loop", name: "過度掌控迴路", shortDesc: "將所有變因納入監控以抵禦不確定。" },
  { id: "perfection_loop", name: "完美主義迴路", shortDesc: "自我價值與零瑕疵掛鉤，無法結案。" },
  { id: "victim_loop", name: "受害者迴路", shortDesc: "歸咎環境或他人，尋求同情而非解決。" },
  { id: "comparison_loop", name: "社會比較迴路", shortDesc: "成就感建立在與他人比較的座標上。" },
  { id: "catastrophizing", name: "災難化迴路", shortDesc: "小徵兆推導出最糟結局，高度警覺。" },
  { id: "saving_loop", name: "拯救者迴路", shortDesc: "過度承擔他人問題以逃避自己的空虛。" },
  { id: "numbing_loop", name: "情感麻木迴路", shortDesc: "以進食、工作或感官刺激屏蔽痛感。" },
  { id: "rationalization", name: "過度合理化迴路", shortDesc: "用邏輯為情緒或錯誤辯護，阻斷自省。" },
];

// ============ 四化（供規則與 key 用） ============

export type TransformId = "lu" | "quan" | "ke" | "ji";

export const TRANSFORMS: TransformId[] = ["lu", "quan", "ke", "ji"];

// ============ 輔助：id ↔ 中文名 對照 ============

export const PALACE_ID_TO_NAME: Record<PalaceId, string> = Object.fromEntries(
  PALACES.map((p) => [p.id, p.name])
) as Record<PalaceId, string>;

export const TENGOD_ID_TO_NAME: Record<TenGodId, string> = Object.fromEntries(
  TENGODS.map((t) => [t.id, t.name])
) as Record<TenGodId, string>;

export const WUXING_ID_TO_NAME: Record<WuXingId, string> = Object.fromEntries(
  WUXING.map((w) => [w.id, w.name])
) as Record<WuXingId, string>;

export const STAR_ID_TO_NAME: Record<MainStarId, string> = Object.fromEntries(
  STARS.map((s) => [s.id, s.name])
) as Record<MainStarId, string>;

/** 星曜中文名（紫微、天府…）→ MainStarId，供 content key 對齊 */
export const STAR_NAME_ZH_TO_ID: Record<string, MainStarId> = Object.fromEntries(
  STARS.map((s) => [s.name, s.id])
) as Record<string, MainStarId>;

/** 中文宮位名（命宮、兄弟、夫妻…）→ PalaceId，供既有 content key 對齊 */
export const PALACE_NAME_ZH_TO_ID: Record<string, PalaceId> = Object.fromEntries(
  PALACES.map((p) => [p.name, p.id])
) as Record<string, PalaceId>;

/** 十神中文名 → TenGodId */
export const TENGOD_NAME_ZH_TO_ID: Record<string, TenGodId> = Object.fromEntries(
  TENGODS.map((t) => [t.name, t.id])
) as Record<string, TenGodId>;

/** 五行中文名（木火土金水）→ WuXingId */
export const WUXING_NAME_ZH_TO_ID: Record<string, WuXingId> = {
  木: "wood",
  火: "fire",
  土: "earth",
  金: "metal",
  水: "water",
};
