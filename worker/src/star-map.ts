/**
 * Star name: Chinese (zh-CN/zh-TW) -> en-US key.
 * Used when language is en-US to convert iztro Chinese star names to en keys.
 * When iztro language is en-US, it already returns en keys, so this is for fallback.
 * Based on docs/iztro-en-us-keys.md
 */
export const ZH_STAR_TO_EN: Record<string, string> = {
  // 14 major
  紫微: "emperor",
  天機: "advisor",
  天机: "advisor",
  太陽: "sun",
  太阳: "sun",
  武曲: "general",
  天同: "fortunate",
  廉貞: "judge",
  廉贞: "judge",
  天府: "empress",
  太陰: "moon",
  太阴: "moon",
  貪狼: "wolf",
  贪狼: "wolf",
  巨門: "advocator",
  巨门: "advocator",
  天相: "minister",
  天梁: "sage",
  七殺: "marshal",
  七杀: "marshal",
  破軍: "rebel",
  破军: "rebel",
  // assistant
  左輔: "officer",
  左辅: "officer",
  右弼: "helper",
  文昌: "scholar",
  文曲: "artist",
  祿存: "money",
  禄存: "money",
  天馬: "horse",
  天马: "horse",
  天魁: "assistant",
  天鉞: "aide",
  天钺: "aide",
  擎羊: "driven",
  陀羅: "tangled",
  陀罗: "tangled",
  火星: "impulsive",
  鈴星: "spark",
  铃星: "spark",
  地空: "ideologue",
  地劫: "fickle",
};

export function toEnStarKey(zhStarName: string, language: string): string {
  if (language === "en-US") {
    return ZH_STAR_TO_EN[zhStarName] ?? zhStarName;
  }
  return zhStarName;
}
