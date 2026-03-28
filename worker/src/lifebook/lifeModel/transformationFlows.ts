/**
 * S23 轉化流：單向 A→B、轉化率／flowType
 * 中等長度：情境 + 原因（含來源宮人格）+ 對策；命中句 + 決定性同義詞。
 */

import type { NormalizedChart, PalaceStructure, TransformEdge } from "../normalizedChart.js";
import { toPalaceCanonical } from "../normalizedChart.js";
import { getPalaceScore } from "./palaceScore.js";
import type { PalaceScoreResult } from "./types.js";
import type { TransformationFlow, TransformationFlowId, TransformationFlowType } from "./types.js";
import { getPalacePersonality } from "./palacePersonality.js";
import { pickSynonym } from "./narrativeSynonyms.js";

const FLOWS: readonly {
  id: TransformationFlowId;
  title: string;
  subtitle: string;
  from: string;
  to: string;
}[] = [
  {
    id: "career_to_money",
    title: "事業 → 收入",
    subtitle: "能力與變現是否成比例",
    from: "官祿宮",
    to: "財帛宮",
  },
  {
    id: "money_to_asset",
    title: "現金 → 資產",
    subtitle: "錢能否轉成可留存的根基",
    from: "財帛宮",
    to: "田宅宮",
  },
  {
    id: "mind_to_opportunity",
    title: "內在 → 機會",
    subtitle: "心態與外緣承接",
    from: "福德宮",
    to: "遷移宮",
  },
];

const FLOW_HIT: Record<TransformationFlowId, string> = {
  career_to_money: "你不是不夠拼，是變現的程度，和你付出的努力不成正比",
  money_to_asset: "你不是賺不到錢，是留不住",
  mind_to_opportunity: "你不是沒想法，是機會接不上手",
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

function natalInsToPalace(p: PalaceStructure): TransformEdge[] {
  const canon = toPalaceCanonical(p.palace);
  return (p.natalTransformsIn ?? []).filter(
    (e) => e.layer === "natal" && toPalaceCanonical(e.toPalace) === canon
  );
}

function hasJiInPalace(p: PalaceStructure): boolean {
  return natalInsToPalace(p).some((e) => e.transform === "忌");
}

function hasLuOrQuanInPalace(p: PalaceStructure): boolean {
  return natalInsToPalace(p).some((e) => e.transform === "祿" || e.transform === "權");
}

function shaHeavy(from: PalaceStructure, to: PalaceStructure): boolean {
  return (from.shaStars?.length ?? 0) >= 2 || (to.shaStars?.length ?? 0) >= 2;
}

function applyResistance(rate: number, from: PalaceStructure, to: PalaceStructure): number {
  let r = rate;
  if (hasJiInPalace(to)) r -= 0.2;
  if (hasJiInPalace(from)) r -= 0.1;
  if (shaHeavy(from, to)) r -= 0.15;
  if (hasLuOrQuanInPalace(from) || hasLuOrQuanInPalace(to)) r += 0.1;
  return Math.min(1, Math.max(0, r));
}

export function classifyFlowType(rate: number): TransformationFlowType {
  if (rate >= 0.8) return "smooth";
  if (rate >= 0.5) return "stuck";
  if (rate >= 0.3) return "leaking";
  return "blocked";
}

function actionFor(id: TransformationFlowId, flowType: TransformationFlowType, seed: string): string {
  const sys = pickSynonym("系統", seed);
  const a: Record<TransformationFlowId, Record<TransformationFlowType, string>> = {
    career_to_money: {
      smooth: `提高槓桿與規模：把交付寫成可對價的模組，並用${sys}篩客。`,
      stuck: `優化方法與定價，而不是只加時數；先砍掉低價無「${pickSynonym("累積", seed)}」的案源。`,
      leaking: `合約範圍寫清楚，拆帳分潤要明確，先堵住耗損，再談工作量。`,
      blocked: `暫停舊打法，改一個可驗收的小專案，重建「做→拿得到」。`,
    },
    money_to_asset: {
      smooth: `延續「先留後花」：大額決策先對齊資產目標。`,
      stuck: `把要留下的錢自動轉專戶，與生活帳分離。`,
      leaking: `盤點固定支出與槓桿上限；把「存」變成自動，而不是靠控制。`,
      blocked: `從最小額強制儲蓄／定期定額開始，重建看得見的堆疊。`,
    },
    mind_to_opportunity: {
      smooth: `固定曝光與外出節奏，讓機會有接觸面。`,
      stuck: `把「想」變成一週三次、每次二十分鐘的小行動。`,
      leaking: `縮減人情與資訊透支，力氣集中一個主戰場。`,
      blocked: `先穩睡眠與情緒，再談開源；必要時縮小社交圈。`,
    },
  };
  return a[id][flowType];
}

function bridgePersonality(fromP: PalaceStructure, src: PalaceScoreResult): string {
  const { styleLabel, pattern } = getPalacePersonality(fromP, src);
  return `這跟你自己的特性有關——你帶一點「${styleLabel}」傾向：${pattern}`;
}

function copyFlow(
  id: TransformationFlowId,
  flowType: TransformationFlowType,
  fromP: PalaceStructure,
  toP: PalaceStructure,
  src: PalaceScoreResult,
  tgt: PalaceScoreResult
): { summary: string; advice: string; hitLine: string; tags: string[] } {
  const tags = ["s23", id, flowType];
  const bridge = `${fromP.palace} → ${toP.palace}`;
  const hit = FLOW_HIT[id];
  const seed = `${id}-${flowType}-${fromP.palace}`;

  if (flowType === "smooth") {
    const summary =
      `你在「${bridge}」這條路上，投入較容易變成看得見的結果。\n\n` +
      `${bridgePersonality(fromP, src)}\n\n` +
      `但若不想只停在「普通穩」，仍要刻意放大槓桿，否則容易溫吞。`;

    const advice = `給你的建議：${actionFor(id, "smooth", seed)}`;
    return { summary, advice, hitLine: hit, tags };
  }

  if (flowType === "stuck") {
    const reframe =
      id === "career_to_money"
        ? `你在「${bridge}」不是沒做事，\n\n 而是「做了，但變現對不上力氣」。`
        : id === "money_to_asset"
          ? `你在「${bridge}」不是沒進帳，\n\n 而是「錢常停在當下使用，較少延後${pickSynonym("累積", seed)}」。`
          : `你在「${bridge}」不是沒盤算，\n\n 而是「想得多、出手節奏對不上外頭時機」。`;

    const stuckTail =
      id === "mind_to_opportunity"
        ? `久了你會覺得：腦內劇本很滿，但外在世界回應很慢。`
        : `久了你會覺得：忙得有存在感，但帳上或心裡的「收成」不成比例。`;

    const summary =
      `${reframe}\n\n` +
      `${bridgePersonality(fromP, src)}\n\n` +
      stuckTail;

    const advice = `給你的建議：${actionFor(id, "stuck", seed)}`;
    return { summary, advice, hitLine: hit, tags };
  }

  if (flowType === "leaking") {
    const reframeHead =
      id === "money_to_asset"
        ? `你在「${bridge}」不是賺不到錢，\n\n 是「留不住」。\n\n你比較傾向「當下使用」而不是「延後${pickSynonym("累積", seed)}」，錢很容易在過程中被消耗掉。`
        : id === "career_to_money"
          ? `從你在「${bridge}」的狀態來看，你不是不努力、不是沒回報\n\n 是「自己應得的成果，在合作與拆帳裡被稀釋掉了」。`
          : `你在「${bridge}」不是沒人脈，\n\n 是「心力在雜訊裡被沖掉」。`;

    const tail =
      id === "money_to_asset"
        ? `久了你會覺得：一直有收入，但什麼都沒留下。`
        : id === "career_to_money"
          ? `久了你會覺得：一直在動，但沒有留下太多東西。`
          : `久了你會覺得：一直在動，但抓不住「留下來的東西」。`;

    const summary =
      `${reframeHead}\n\n` +
      `${bridgePersonality(fromP, src)}\n\n` +
      `${tail}`;

    const advice = `給你的建議：${actionFor(id, "leaking", seed)}`;
    return { summary, advice, hitLine: hit, tags };
  }

  /* blocked */
  const reframe =
    id === "money_to_asset"
      ? `你在「${bridge}」不是沒錢流過，\n\n 而是「幾乎堆不成你要的根基」。\n\n${bridgePersonality(fromP, src)}`
      : `你在「${bridge}」投入與結果之間連動很弱。\n\n${bridgePersonality(fromP, src)}`;

  const summary =
    `${reframe}\n\n` +
    `再拚也只是同一個模式空轉，需要先換路，而不是微調。`;

  const advice = `給你的建議：${actionFor(id, "blocked", seed)}`;
  return { summary, advice, hitLine: hit, tags };
}

/**
 * S23：三條單向轉化流。
 */
export function getTransformationFlows(chart: NormalizedChart): TransformationFlow[] {
  const out: TransformationFlow[] = [];
  for (const def of FLOWS) {
    const fromP = resolvePalace(chart, def.from);
    const toP = resolvePalace(chart, def.to);
    const src = getPalaceScore(fromP);
    const tgt = getPalaceScore(toP);

    let baseRate: number;
    if (src.raw < 1) baseRate = 0;
    else baseRate = Math.min(tgt.raw / src.raw, 1);

    const conversionRate = applyResistance(baseRate, fromP, toP);
    const flowType = classifyFlowType(conversionRate);
    const isOverperforming = tgt.score > src.score;

    const { summary, advice, hitLine, tags } = copyFlow(def.id, flowType, fromP, toP, src, tgt);

    out.push({
      id: def.id,
      title: def.title,
      subtitle: def.subtitle,
      from: fromP.palace,
      to: toP.palace,
      sourceScore: src.score,
      targetScore: tgt.score,
      sourceRaw: src.raw,
      targetRaw: tgt.raw,
      conversionRate,
      flowType,
      isOverperforming,
      summary,
      advice,
      hitLine,
      tags,
    });
  }
  return out;
}
