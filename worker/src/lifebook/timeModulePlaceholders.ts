/**
 * Time module placeholder 輔助：今年在十年裡的角色、一句建議。
 * 從 lifeBookPrompts 拆出，僅做 extraction，不改邏輯。
 */

function normPalaceForRole(p: string): string {
  const s = (p ?? "").trim();
  return s.endsWith("宮") ? s : s + "宮";
}

/** 今年在十年裡的角色：開局年／推進年／修正年／壓力年／收成年／轉折年；與一句說明。 */
export function getYearRoleInDecadeAndWhy(opts: {
  decadalPalace: string;
  liunianMutagen?: Record<string, string>;
}): { role: string; why: string } {
  const decadal = normPalaceForRole(opts.decadalPalace);
  const ln = opts.liunianMutagen ?? {};
  const has = (t: string, alt?: string) => !!(ln[t] || (alt && ln[alt]));
  const ji = has("忌", "ji");
  const lu = has("祿", "lu");
  const ke = has("科", "ke");
  const quan = has("權", "quan");

  if (ji && !ke && !lu) return { role: "壓力年", why: "流年帶忌，壓力與修正點會比較明顯，適合穩住節奏、先守再攻。" };
  if (ke && ji) return { role: "修正年", why: "科忌並見，今年適合用方法與理解來化解卡點，而不是硬衝。" };
  if (ke && !ji) return { role: "修正年", why: "流年帶科，今年適合整理方法、建立口碑與節奏。" };
  if (lu && !ji) return { role: "收成年", why: "流年帶祿，今年在資源與機會上較有空間。" };
  if (quan) return { role: "推進年", why: "流年帶權，今年適合主動決策、扛起責任。" };
  return { role: "推進年", why: "今年在十年裡適合順著大限主題布局，依流年四化微調節奏。" };
}

/** 依「今年在十年裡的角色」給一句：今年真正要修的是什麼（命書口吻） */
export function getRoleTakeaway(role: string): string {
  switch (role) {
    case "壓力年": return "在壓力點上設好界線、先守再攻，不讓同一題反覆爆。";
    case "修正年": return "用方法與理解化解卡點，而不是硬衝或逃避。";
    case "收成年": return "把過去幾年累積的資源與機會收網，該結算的結算。";
    case "推進年": return "把十年主線往前推一步，該決策的決策、該扛的扛。";
    case "開局年": return "把新階段的資源與方向定錨，不貪多、先站穩。";
    case "轉折年": return "在轉折點上做出選擇，不隨波逐流、也不硬扛舊劇本。";
    default: return "把今年當成十年裡的一個節點，該收的收、該推的推。";
  }
}
