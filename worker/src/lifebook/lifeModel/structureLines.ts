/**
 * S22 結構線：對宮格局／平衡（無轉化率）
 * 短敘事 + 命中句 + punchline + 命盤人格一句；同義詞用 seed 輪替避免重複。
 */

import type { NormalizedChart, PalaceStructure } from "../normalizedChart.js";
import { toPalaceCanonical } from "../normalizedChart.js";
import { getPalaceScore } from "./palaceScore.js";
import type { PalaceScoreResult } from "./types.js";
import type { StructureBalanceType, StructureLine, StructureLineId } from "./types.js";
import { getPalacePersonality } from "./palacePersonality.js";
import { pickSynonym } from "./narrativeSynonyms.js";

const LINES: readonly {
  id: StructureLineId;
  title: string;
  subtitle: string;
  palaceA: string;
  palaceB: string;
}[] = [
  {
    id: "wealth_happiness",
    title: "財福線",
    subtitle: "賺錢與享受是否一致",
    palaceA: "財帛宮",
    palaceB: "福德宮",
  },
  {
    id: "asset_storage",
    title: "子田線",
    subtitle: "資源與資產庫存的結構",
    palaceA: "子女宮",
    palaceB: "田宅宮",
  },
  {
    id: "career_relationship",
    title: "官夫線",
    subtitle: "事業角色與關係結構的平衡",
    palaceA: "官祿宮",
    palaceB: "夫妻宮",
  },
];

/** 每條線「關鍵一句」 */
const HIT_LINE: Record<StructureLineId, string> = {
  wealth_happiness: "你不是沒錢，是沒有感覺",
  asset_storage: "你不是沒收入，是留不住",
  career_relationship: "你不是不努力，是沒有結構",
};

function emptyPalace(canon: string): PalaceStructure {
  return {
    palace: canon,
    mainStars: [],
    assistantStars: [],
    shaStars: [],
    miscStars: [],
    natalTransformsIn: [],
    natalTransformsOut: [],
    decadalTransformsIn: [],
    decadalTransformsOut: [],
    yearlyTransformsIn: [],
    yearlyTransformsOut: [],
  };
}

function resolvePalace(chart: NormalizedChart, palaceName: string): PalaceStructure {
  const canon = toPalaceCanonical(palaceName.trim());
  const found = chart.palaces.find((p) => p.palace === canon);
  return found ?? emptyPalace(canon || palaceName.trim());
}

export function classifyStructureBalance(scoreA: number, scoreB: number): StructureBalanceType {
  const totalScore = (scoreA + scoreB) / 2;
  const gapScore = Math.abs(scoreA - scoreB);
  if (scoreA >= 3.5 && scoreB >= 3.5 && gapScore <= 1.0) return "balanced";
  if (scoreA < 2.5 && scoreB < 2.5 && totalScore < 2.5) return "weak";
  return "biased";
}

/** 取分數較低的一端做「人格鏡頭」 */
function weakerPalace(
  pa: PalaceStructure,
  sa: PalaceScoreResult,
  pb: PalaceStructure,
  sb: PalaceScoreResult
): { p: PalaceStructure; s: PalaceScoreResult } {
  return sa.score <= sb.score ? { p: pa, s: sa } : { p: pb, s: sb };
}

function personalitySnippet(
  pa: PalaceStructure,
  sa: PalaceScoreResult,
  pb: PalaceStructure,
  sb: PalaceScoreResult,
  seed: string
): string {
  const { p, s } = weakerPalace(pa, sa, pb, sb);
  const { styleLabel, pattern } = getPalacePersonality(p, s);
  const syn = pickSynonym("支撐", seed);
  return `（人格參考：${p.palace}偏「${styleLabel}」——${pattern.replace(/打底/g, syn)}）`;
}

function copyForLine(
  id: StructureLineId,
  balance: StructureBalanceType,
  pa: PalaceStructure,
  pb: PalaceStructure,
  sa: PalaceScoreResult,
  sb: PalaceScoreResult
): { summary: string; insight: string; hitLine: string; tags: string[] } {
  const tags = [`s22`, id, balance];
  const lineTitle = LINES.find((l) => l.id === id)!.title;
  const hit = HIT_LINE[id];
  const seed = `${id}-${balance}-${pa.palace}-${pb.palace}`;
  const structWord = pickSynonym("結構", `${seed}-b`);

  if (balance === "balanced") {
    const summary =
      `你在「${lineTitle}」兩端目前能互相補位，比較不像單邊塌。\n\n` +
      `但要小心變成「穩，但不破」：日子好過，卻少了一點衝出去的理由。\n\n` +
      `${personalitySnippet(pa, sa, pb, sb, `${seed}-p`)}\n\n` +
      `給你的建議：把其中一邊刻意「做大一點」，讓${structWord}不只穩，還能長出規模。`;

    const insight = `長期對策：選一個已順手的環節加槓桿（時間、人、${pickSynonym("系統", seed)}擇一），別只維持現狀。`;
    return { summary, insight, hitLine: hit, tags };
  }

  if (balance === "weak") {
    const problemLead =
      id === "wealth_happiness"
        ? `你的問題不是沒錢，`
        : id === "asset_storage"
          ? `你的問題不是沒進帳，`
          : `你的問題不是不夠拼，`;

    const punch =
      id === "wealth_happiness"
        ? ` 而是「該做的都做了，但沒有感覺」。`
        : id === "asset_storage"
          ? ` 而是「有進有出，卻很難留住你要的那份踏實感」。`
          : ` 而是「角色與邊界沒有${structWord}，力氣散在拉扯裡」。`;

    const body =
      id === "wealth_happiness"
        ? `你容易一直在做事情，但內心沒有感到回饋，久了會不知道自己在為什麼努力。`
        : id === "asset_storage"
          ? `錢常常來了又去，心裡少了「留下來」的踏實感，年底一回頭會覺得白忙一場。`
          : `工作與關係互相踩線時，你會同時累在兩邊，卻說不清誰該先收斂。`;

    const summary =
      `${problemLead}\n\n` +
      `${punch}\n\n` +
      `${body}\n\n` +
      `${personalitySnippet(pa, sa, pb, sb, `${seed}-p`)}\n\n` +
      `給你的建議：先求「最小可運作的${structWord}」，再談放大；別只靠意志力硬撐。`;

    const insight =
      id === "wealth_happiness"
        ? `長期對策：儘快建立讓自己「做完有感」的回饋機制，而不是繼續做更多。`
        : id === "asset_storage"
          ? `長期對策：把「存／留」變成自動流程（入帳先轉一筆），而不是靠當下克制。`
          : `長期對策：用制度寫清邊界與分工，再談感情或衝刺。`;

    return { summary, insight, hitLine: hit, tags };
  }

  /* biased */
  const strongPalace = sa.score >= sb.score ? pa : pb;
  const weakPalace = sa.score >= sb.score ? pb : pa;
  const punch =
    id === "wealth_happiness"
      ? `而是一邊很會衝，另一邊長期「接不住感受／回饋」。`
      : id === "asset_storage"
        ? `而是一邊有產出，另一邊「留不住、堆不起來」。`
        : `而是一邊很用力，另一邊「角色混在一起、越界消耗」。`;

  const summary =
    `你在「${lineTitle}」不是沒亮點，\n\n` +
    `${punch.replace(/^而是/, " 而是")}\n\n` +
    `強端在「${strongPalace.palace}」，弱端在「${weakPalace.palace}」；久了會變成單邊拖著全身走。\n\n` +
    `${personalitySnippet(pa, sa, pb, sb, `${seed}-p`)}\n\n` +
    `給你的建議：先補${weakPalace.palace}，別再只放大${strongPalace.palace}。`;

  const biasedInsight =
    id === "wealth_happiness"
      ? `長期對策：給弱端固定配額（休息／花用／回饋），讓感受也能「有位置」。`
      : id === "asset_storage"
        ? `長期對策：為弱端做強制留存或上限支出，讓「${pickSynonym("累積", seed)}」變成流程。`
        : `長期對策：把合作規則寫出來，再談付出與期待。`;

  return { summary, insight: biasedInsight, hitLine: hit, tags };
}

/**
 * S22：三條對宮結構線。
 */
export function getStructureLines(chart: NormalizedChart): StructureLine[] {
  const out: StructureLine[] = [];
  for (const def of LINES) {
    const pa = resolvePalace(chart, def.palaceA);
    const pb = resolvePalace(chart, def.palaceB);
    const sa = getPalaceScore(pa);
    const sb = getPalaceScore(pb);
    const scoreA = sa.score;
    const scoreB = sb.score;
    const totalScore = Math.round(((scoreA + scoreB) / 2) * 10) / 10;
    const gapScore = Math.abs(scoreA - scoreB);
    const balanceType = classifyStructureBalance(scoreA, scoreB);
    const { summary, insight, hitLine, tags } = copyForLine(def.id, balanceType, pa, pb, sa, sb);
    out.push({
      id: def.id,
      title: def.title,
      subtitle: def.subtitle,
      palaceA: pa.palace,
      palaceB: pb.palace,
      scoreA,
      scoreB,
      totalScore,
      gapScore,
      balanceType,
      summary,
      insight,
      hitLine,
      tags,
    });
  }
  return out;
}
