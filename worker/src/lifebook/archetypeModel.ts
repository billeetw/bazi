/**
 * 人生 Archetype：整張命盤在「玩哪一種遊戲」。
 * 條件依 dominantPalaces、starGroupStats、keyStars、sihuaPatterns 等簡化判斷。
 * 輸出建議放在命盤焦點之後，如【人生主題】。
 */

export interface LifeArchetype {
  id: string;
  name: string;
  description: string;
}

export const LIFE_ARCHETYPES: LifeArchetype[] = [
  {
    id: "builder",
    name: "建設型人生",
    description:
      "你的人生重點在於建立穩定的資源與結構，例如資產、事業、能力或長期成果。很多事情不會立刻見效，但只要累積夠久，往往能形成穩固的基礎。",
  },
  {
    id: "relationship",
    name: "關係型人生",
    description:
      "你的人生很多轉折都來自關係，例如合作、伴侶、人脈或社交圈。理解人與人之間的互動方式，往往是打開局面的關鍵。",
  },
  {
    id: "explorer",
    name: "探索型人生",
    description:
      "你的人生很少走固定軌道，而是透過嘗試、改變與探索逐漸找到方向。很多成長都來自新的環境與經驗。",
  },
  {
    id: "healer",
    name: "修復型人生",
    description:
      "人生的課題往往與修正、療癒或重建有關。很多事情一開始可能比較辛苦，但也因此培養出理解與同理的能力。",
  },
  {
    id: "creator",
    name: "創造型人生",
    description:
      "你的人生很多成就來自創造與產出，例如想法、作品、計畫或新的方法。你的優勢在於把抽象的想法變成具體成果。",
  },
  {
    id: "leader",
    name: "領導型人生",
    description:
      "你很容易被推到需要做決定的位置。別人往往會期待你提出方向或承擔責任。",
  },
  {
    id: "wisdom",
    name: "理解型人生",
    description:
      "你的人生優勢在於理解與分析。很多困難的問題，你能透過觀察與思考找到更好的方法。",
  },
  {
    id: "transformer",
    name: "轉型型人生",
    description:
      "人生往往不是線性成長，而是透過幾次重要轉折重新開始。每一次轉變，都會讓你更接近真正的方向。",
  },
  {
    id: "stabilizer",
    name: "穩定型人生",
    description:
      "你的人生節奏比較穩定，很多事情是透過持續累積慢慢成形。長期規劃比短期爆發更適合你。",
  },
  {
    id: "influencer",
    name: "影響型人生",
    description:
      "你的存在容易影響周圍的人。不論是在工作、團隊或關係中，你的想法往往會被放大。",
  },
  {
    id: "integrator",
    name: "整合型人生",
    description:
      "你的人生不會只圍繞單一領域，而是需要在不同角色之間取得平衡。很多能力來自整合不同經驗。",
  },
  {
    id: "awareness",
    name: "覺察型人生",
    description:
      "你對內在感受與情緒變化非常敏感。理解自己與理解世界，往往是你人生的重要課題。",
  },
];

export interface ArchetypeDetectionInput {
  dominantPalaces: Array<{ palace: string; tags: string[] }>;
  starGroupStats?: Record<string, number>;
  hotPalaces?: string[];
  sihuaPatterns?: unknown[];
}

function palaceListIncludes(
  dominant: Array<{ palace: string }>,
  hot: string[] | undefined,
  ...names: string[]
): boolean {
  const canon = (p: string) => (p && !p.endsWith("宮") ? p + "宮" : p);
  const set = new Set(names.flatMap((n) => [n, canon(n), n.replace(/宮$/, "")]));
  for (const d of dominant) {
    const c = canon(d.palace);
    if (set.has(d.palace) || set.has(c) || set.has(c.replace(/宮$/, ""))) return true;
  }
  for (const p of hot ?? []) {
    const c = canon(p);
    if (set.has(p) || set.has(c)) return true;
  }
  return false;
}

/**
 * 依主戰場、熱宮、節奏等簡化判斷，回傳最符合的人生 Archetype。
 */
export function detectLifeArchetype(input: ArchetypeDetectionInput): LifeArchetype {
  const { dominantPalaces, hotPalaces, starGroupStats } = input;
  const palaceNames = dominantPalaces.map((d) => d.palace);
  const hasCai = palaceListIncludes(dominantPalaces, hotPalaces, "財帛", "財帛宮");
  const hasTianzhai = palaceListIncludes(dominantPalaces, hotPalaces, "田宅", "田宅宮");
  const hasGuanlu = palaceListIncludes(dominantPalaces, hotPalaces, "官祿", "官祿宮");
  const hasFufu = palaceListIncludes(dominantPalaces, hotPalaces, "夫妻", "夫妻宮");
  const hasPuyi = palaceListIncludes(dominantPalaces, hotPalaces, "僕役", "僕役宮");
  const hasQianyi = palaceListIncludes(dominantPalaces, hotPalaces, "遷移", "遷移宮");
  const hasFude = palaceListIncludes(dominantPalaces, hotPalaces, "福德", "福德宮");
  const hasZinv = palaceListIncludes(dominantPalaces, hotPalaces, "子女", "子女宮");
  const hasJie = palaceListIncludes(dominantPalaces, hotPalaces, "疾厄", "疾厄宮");
  const jiCount = dominantPalaces.filter((d) => d.tags.includes("忌疊")).length;
  const steady = (starGroupStats?.穩星 ?? 0) + (starGroupStats?.財星 ?? 0);
  const total = Object.values(starGroupStats ?? {}).reduce((a, b) => a + (typeof b === "number" ? b : 0), 0);
  const steadyRatio = total > 0 ? steady / total : 0;

  if ((hasCai || hasTianzhai || hasGuanlu) && (hasCai || hasTianzhai)) return LIFE_ARCHETYPES[0];
  if (hasFufu || hasPuyi) return LIFE_ARCHETYPES[1];
  if (hasQianyi) return LIFE_ARCHETYPES[2];
  if (jiCount >= 2 && (hasFude || hasJie || hasZinv)) return LIFE_ARCHETYPES[3];
  if (hasZinv) return LIFE_ARCHETYPES[4];
  if (hasGuanlu) return LIFE_ARCHETYPES[5];
  if ((starGroupStats?.智星 ?? 0) >= 2) return LIFE_ARCHETYPES[6];
  if (hasQianyi && jiCount >= 1) return LIFE_ARCHETYPES[7];
  if (steadyRatio >= 0.35 && jiCount === 0) return LIFE_ARCHETYPES[8];
  if (hasGuanlu && hasPuyi) return LIFE_ARCHETYPES[9];
  if (total > 0 && Object.keys(starGroupStats ?? {}).filter((k) => (starGroupStats ?? {})[k] > 0).length >= 5)
    return LIFE_ARCHETYPES[10];
  if (hasFude) return LIFE_ARCHETYPES[11];
  return LIFE_ARCHETYPES[10];
}

/** 產出【人生主題】區塊文案，供 s00 命盤焦點之後插入 */
export function formatLifeArchetypeBlock(archetype: LifeArchetype): string {
  return `【人生主題】\n\n人生主題：${archetype.name}\n\n${archetype.description}`;
}
