/**
 * 分段敘事人性化語氣：穩定「偽隨機」（同命盤同星同段同結果），避免固定套語。
 * 可作為逐宮權重敘事（分層段落）共同範本。
 */

export function stablePickIndex(seed: string, modulo: number): number {
  let h = 2166136261;
  const s = seed || "∅";
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return modulo > 0 ? Math.abs(h) % modulo : 0;
}

/** 決策段：提醒「不要做什麼」的開場（官祿 careerProfiles 等可用） */
const CAREER_FORBIDDEN_LEADS = [
  "要留意別變成",
  "特別小心不要陷入",
  "壓力大時容易不小心就",
  "可以提醒自己避免",
] as const;

/** 坑段：承接風險句的開場 */
const CAREER_RISK_LEADS = [
  "真要當心的是",
  "節奏一亂就容易",
  "這條線上尤其要小心",
  "別忽略這個訊號",
] as const;

function stripTrailPeriod(s: string): string {
  const t = (s ?? "").trim();
  return t.endsWith("。") || t.endsWith(".") ? t.slice(0, -1).trim() : t;
}

export function formatCareerForbiddenHuman(star: string, a: string, b: string): string {
  const lead = CAREER_FORBIDDEN_LEADS[stablePickIndex(`${star}|forbid`, CAREER_FORBIDDEN_LEADS.length)];
  return `${lead}「${stripTrailPeriod(a)}」或「${stripTrailPeriod(b)}」的決策慣性。`;
}

export function formatCareerRiskHuman(star: string, riskAlert: string): string {
  const lead = CAREER_RISK_LEADS[stablePickIndex(`${star}|risk`, CAREER_RISK_LEADS.length)];
  const body = (riskAlert ?? "").trim();
  if (!body) return "";
  return `${lead}：${body}`;
}

/**
 * 現象段：不重複 careerFit，只把風險／現場感說成「工作場景裡實際長怎樣」。
 */
export function formatCareerPhenomenonHuman(star: string, riskAlert: string, starSemanticRisk?: string): string {
  const fromProfile = (riskAlert ?? "").trim();
  const fromSem = (starSemanticRisk ?? "").trim();
  const body = stripTrailPeriod(fromProfile || fromSem || "節奏與期待容易不同步");
  const templates = [
    () => `工作上，「${star}」常把場面表現成：${body}。`,
    () => `「${star}」在實務節奏裡，容易讓你：${body}。`,
    () => `旁人常感覺到「${star}」帶來的影響是：${body}。`,
    () => `日常扛專案時，「${star}」往往讓你：${body}。`,
  ];
  return templates[stablePickIndex(`${star}|ph`, templates.length)]();
}

/** 坑段：只打「兩個禁忌疊加」，不再重複 riskAlert（已在現象段用過） */
export function formatCareerPitfallForbiddenOnly(star: string, a: string, b: string): string {
  const leads = [
    `「${star}」最傷局勢的，常是同時踩中`,
    `別讓「${star}」一路堆成`,
    `「${star}」一翻車，多半是`,
  ] as const;
  const lead = leads[stablePickIndex(`${star}|pf`, leads.length)];
  return `${lead}「${stripTrailPeriod(a)}」又「${stripTrailPeriod(b)}」這兩種情況。`;
}
