/**
 * 多宮讀者 premium 層：batch-1（財帛、官祿、夫妻）專屬語料；
 * batch-2（其餘八宮）以 PALACE_SEGMENT_SCHEMA + 星曜語義為主，田宅加 tianZhaiPalaceProfiles。
 * 命宮由 mingReaderPremium 專責；統一入口 buildReaderPremiumPayload。
 */
import { getStarSemantic } from "../../starSemanticDictionary.js";
import type {
  MingNarrativePremiumPayload,
  PalaceRawInput,
  ReaderNarrativeIntensity,
  ReaderTurn,
} from "./palaceNarrativeTypes.js";
import { buildMingNarrativePremiumPayload, resolveReaderIntensity } from "./mingReaderPremium.js";
import { normalizeNarrativePunctuation } from "./narrativePunctuation.js";
import { PALACE_SEGMENT_SCHEMA } from "./weightedPalaceSchemas.js";
import { getWealthProfile } from "./wealthPalaceProfiles.js";
import { getCareerProfile } from "./careerProfiles.js";
import { getTianZhaiProfile } from "./tianZhaiPalaceProfiles.js";

function tone(s: string): string {
  return normalizeNarrativePunctuation(s.trim());
}

type Tier = ReaderNarrativeIntensity;

type RulePack = {
  headline: Record<Tier, string>;
  questions: Record<Tier, string[]>;
  mirror: Record<Tier, string>;
  turn: Record<Tier, ReaderTurn>;
  bodyOverrides?: {
    phenomenonLines?: string[];
    pitfallLines?: string[];
  };
};

const TIERS: Tier[] = ["soft", "standard", "direct"];

function pickTier<T extends Record<Tier, unknown>>(pack: T, tier: Tier): T[Tier] {
  return pack[tier];
}

function leaders(raw: PalaceRawInput): { lead: string; co: string | null } {
  const lead = (raw.mainStars[0] ?? "").trim();
  const c2 = (raw.mainStars[1] ?? "").trim();
  const co = c2 && c2 !== lead ? c2 : null;
  return { lead, co };
}

function fallbackLeadFromPool(raw: PalaceRawInput): string {
  const { lead } = leaders(raw);
  if (lead) return lead;
  return (raw.minorStars[0] ?? raw.miscStars[0] ?? "").trim();
}

function buildCaiPack(lead: string, co: string | null): RulePack {
  const schema = PALACE_SEGMENT_SCHEMA["財帛宮"];
  const w = getWealthProfile(lead);
  const sem = lead ? getStarSemantic(lead) : undefined;
  const phenomenon = w?.phenomenon?.trim();
  const decision = w?.decision?.trim();
  const pitfall = w?.pitfall?.trim();
  const plain = sem?.plain?.trim();
  const risk = sem?.risk?.trim();

  const headlineStd = tone(
    phenomenon ||
      (plain && risk ? `${plain.replace(/。$/, "")}，落在金錢現場常變成：${risk.replace(/。$/, "")}。` : "") ||
      decision ||
      plain ||
      `你的現金流與用錢節奏，其實都圍繞「${schema.coreFocus}」。`
  );

  const headlineSoft = tone(
    phenomenon
      ? `有時你也會感覺到：${phenomenon.replace(/^你/, "自己")}`
      : decision
        ? `你可能慢慢發現：${decision}`
        : `你也許正經歷一些反覆的財務節奏，它們其實都指向同一件事。`
  );

  const headlineDirect = tone(
    (risk && plain ? `${plain.replace(/。$/, "")}——說得直白一點：${risk.replace(/。$/, "")}。` : "") ||
      phenomenon ||
      headlineStd
  );

  const qStd: string[] = [
    `你是不是常常在帳戶數字還沒動之前，心裡就先預演過一輪「最壞會怎麼賠」？`,
    `你真正守的，可能不是錢本身，而是不要讓自己再次失去安全感。`,
  ];
  if (co) qStd.push(`當兩種用錢／求財風格同時在場時，你較常先犧牲哪一邊的紀律？`);
  if (pitfall) qStd.push(`若把「想賺的」跟「其實在躲的」各寫一行，會長什麼樣子？`);

  const qSoft = qStd.map((q, i) => (i === 0 ? q.replace(/^你是不是/, "您是否也會") : q));
  const qDirect = qStd.map((q, i) =>
    i === 0 ? `${q}（不用答我，對自己誠實就好。）` : q
  );

  let mirStd: string;
  if (plain && risk) {
    mirStd = tone(
      `你以為自己只是在選擇花不花，其實更深的，是${risk.replace(/。$/, "")}。`
    );
  } else if (pitfall && plain) {
    mirStd = tone(`你以為自己在顧節奏，其實很多時候是在躲一種不舒服的帳面感。`);
  } else {
    mirStd = tone(`你以為當下只是消費選擇，其實背後常有一套你早就學會的生存策略。`);
  }
  const mirSoft = tone(mirStd.replace("其實", "有時更像是"));
  const mirDirectTier = tone(mirStd.replace("其實", "坦白講，是"));

  const actStd = tone(`寫下這週三筆最大支出：哪些是「必要」、哪些是「買安心」——只標記，不批判。`);

  const refrStd = tone(
    pitfall
      ? `這不代表你不會理財，而是你把「先穩住心」看得比「先出手」更優先。`
      : `你的用錢慣性不是問題，問題是：它是否還在服務現在的你。`
  );
  const refrSoft = tone(
    `你不需要逼自己立刻變狠變冷，你只需要分得清：此刻是「還沒準備好」，還是「不敢承認想要」。`
  );
  const turnDirect: ReaderTurn = {
    reframe: tone(
      pitfall
        ? `你不是不知道錢卡在哪，你是太清楚代價，所以一邊拖一邊恨自己拖。`
        : `你不是需要更多理財課，你是需要一把能把「停損」說進心裡的鑰匙。`
    ),
    action: tone(`選一個你拖延最久的財務決定，只問一句：若一週後必交卷，我會選哪個不太漂亮但真實的答案？`),
  };

  return {
    headline: { soft: headlineSoft, standard: headlineStd, direct: headlineDirect },
    questions: { soft: qSoft.slice(0, 3), standard: qStd.slice(0, 3), direct: qDirect.slice(0, 3) },
    mirror: { soft: mirSoft, standard: mirStd, direct: mirDirectTier },
    turn: {
      soft: { reframe: refrSoft, action: actStd },
      standard: { reframe: refrStd, action: actStd },
      direct: turnDirect,
    },
  };
}

function buildGuanluPack(lead: string, co: string | null): RulePack {
  const schema = PALACE_SEGMENT_SCHEMA["官祿宮"];
  const c = getCareerProfile(lead);
  const sem = lead ? getStarSemantic(lead) : undefined;
  const plain = sem?.plain?.trim();
  const risk = sem?.risk?.trim();

  const headlineStd = tone(
    c
      ? `你在角色與責任上，較容易走向「${c.careerFit}」累積舞台；同時要警覺：${c.riskAlert}`
      : plain && risk
        ? `${plain.replace(/。$/, "")}，落在職場現場常變成：${risk.replace(/。$/, "")}。`
        : `你在職涯上的站位移動，其實圍繞著「${schema.coreFocus}」。`
  );

  const headlineSoft = tone(
    c
      ? `有時你也會感覺到：在「${c.careerFit}」這條路上，壓力不只在做事，也在名實是否對得上。`
      : plain
        ? `你可能慢慢發現：${plain}`
        : `你也許正經歷一些反覆的職場節奏，它們其實都指向同一件事。`
  );

  const headlineDirect = tone(
    (plain && risk ? `${plain.replace(/。$/, "")}——說得直白一點：${risk.replace(/。$/, "")}。` : "") ||
      (c ? `${headlineStd}` : headlineStd)
  );

  const qStd: string[] = [
    `你是不是常常先把責任扛滿，才回頭問自己：這件事到底該不該由我定義成敗？`,
    `你真正在意的，是成果，還是「不要被看扁」？`,
  ];
  if (co) qStd.push(`當兩種做事風格同時在場，你較常先犧牲效率還是關係？`);
  if (c) qStd.push(`若把「我想證明」跟「我其實在怕」各寫一行，會長什麼樣子？`);

  const qSoft = qStd.map((q, i) => (i === 0 ? q.replace(/^你是不是/, "您是否也會") : q));
  const qDirect = qStd.map((q, i) =>
    i === 0 ? `${q}（不用答我，對自己誠實就好。）` : q
  );

  let mirStd: string;
  if (plain && risk) {
    mirStd = tone(
      `你以為自己只是在選工作方法，其實更深的，是${risk.replace(/。$/, "")}。`
    );
  } else if (c) {
    mirStd = tone(
      `你以為自己在拼專業，其實有時更像是在用忙碌換取一點可控感。`
    );
  } else {
    mirStd = tone(`你以為當下只是取捨，其實背後常有一套你早就學會的生存策略。`);
  }
  const mirSoft = tone(mirStd.replace("其實", "有時更像是"));
  const mirDirectTier = tone(mirStd.replace("其實", "坦白講，是"));

  const actStd = tone(`挑一件你正在拖的職涯決定，只寫兩行：若不做，你怕什麼；若做了，你怕什麼。`);

  const refrStd = tone(
    c
      ? `你不是不夠努力，而是你太習慣用「承擔」換取位置感；位置感不等於界線。`
      : `你的慣性不是問題，問題是：它是否還在服務現在的你。`
  );
  const refrSoft = tone(
    `你不需要逼自己立刻開戰或撤退，你只需要分得清：此刻是「還沒準備好」，還是「不敢承認想要」。`
  );
  const turnDirect: ReaderTurn = {
    reframe: tone(
      risk
        ? `你不是不知道問題在哪，你是太清楚代價，所以一邊拖一邊恨自己拖。`
        : `你不是需要更多雞湯，你是需要一把能把話說進心裡的鑰匙。`
    ),
    action: tone(`選一個你拖延最久的職涯決定，只問一句：若一週後必交卷，我會選哪個不太漂亮但真實的答案？`),
  };

  return {
    headline: { soft: headlineSoft, standard: headlineStd, direct: headlineDirect },
    questions: { soft: qSoft.slice(0, 3), standard: qStd.slice(0, 3), direct: qDirect.slice(0, 3) },
    mirror: { soft: mirSoft, standard: mirStd, direct: mirDirectTier },
    turn: {
      soft: { reframe: refrSoft, action: actStd },
      standard: { reframe: refrStd, action: actStd },
      direct: turnDirect,
    },
  };
}

function buildFuqiPack(lead: string, co: string | null): RulePack {
  const schema = PALACE_SEGMENT_SCHEMA["夫妻宮"];
  const sem = lead ? getStarSemantic(lead) : undefined;
  const plain = sem?.plain?.trim();
  const risk = sem?.risk?.trim();

  const headlineStd = tone(
    plain && risk
      ? `${plain.replace(/。$/, "")}，落在關係裡常變成：${risk.replace(/。$/, "")}。`
      : plain ||
          `你在親密關係與長期承諾上，核心課題圍繞「${schema.coreFocus}」。`
  );

  const headlineSoft = tone(
    plain
      ? `有時你也會感覺到：${plain.replace(/^你/, "自己")}`
      : `你也許正經歷一些反覆的相處節奏，它們其實都指向同一件事。`
  );

  const headlineDirect = tone(
    (risk && plain ? `${plain.replace(/。$/, "")}——說得直白一點：${risk.replace(/。$/, "")}。` : "") ||
      headlineStd
  );

  const qStd: string[] = [
    `你是不是常常在關係裡先顧對方的感受，才回頭問自己：那我呢？`,
    `你真正守的，可能不是這段關係本身，而是不要再次面對失控感。`,
  ];
  if (co) qStd.push(`當兩種親密腳本同時在場，你較常先退讓還是先硬撐？`);
  qStd.push(`若把「我想要的」跟「我害怕的」各寫一行，會長什麼樣子？`);

  const qSoft = qStd.map((q, i) => (i === 0 ? q.replace(/^你是不是/, "您是否也會") : q));
  const qDirect = qStd.map((q, i) =>
    i === 0 ? `${q}（不用答我，對自己誠實就好。）` : q
  );

  let mirStd: string;
  if (plain && risk) {
    mirStd = tone(
      `你以為自己只是在磨合，其實更深的，是${risk.replace(/。$/, "")}。`
    );
  } else {
    mirStd = tone(
      `你以為自己在顧感情，其實有時更像是在用退讓換取短暫的確定感。`
    );
  }
  const mirSoft = tone(mirStd.replace("其實", "有時更像是"));
  const mirDirectTier = tone(mirStd.replace("其實", "坦白講，是"));

  const actStd = tone(`挑一件你最近又在忍的點，只寫一句：「我需要被看見的是…」。`);

  const refrStd = tone(
    risk
      ? `這不代表你難搞，而是你把「連結」看得比「邊界」更早出手。`
      : `你的相處慣性不是問題，問題是：它是否還在服務現在的你。`
  );
  const refrSoft = tone(
    `你不需要逼自己立刻講清楚全部，你只需要分得清：此刻是「還沒準備好」，還是「不敢承認想要」。`
  );
  const turnDirect: ReaderTurn = {
    reframe: tone(
      risk
        ? `你不是不知道關係卡在哪，你是太清楚代價，所以一邊忍一邊恨自己忍。`
        : `你不是需要更多道理，你是需要一把能把話說進心裡的鑰匙。`
    ),
    action: tone(`選一個你一直退讓的點，設定一條「到此為止」，用行為而不是解釋守住它。`),
  };

  return {
    headline: { soft: headlineSoft, standard: headlineStd, direct: headlineDirect },
    questions: { soft: qSoft.slice(0, 3), standard: qStd.slice(0, 3), direct: qDirect.slice(0, 3) },
    mirror: { soft: mirSoft, standard: mirStd, direct: mirDirectTier },
    turn: {
      soft: { reframe: refrSoft, action: actStd },
      standard: { reframe: refrStd, action: actStd },
      direct: turnDirect,
    },
  };
}

function rulePackToPayload(pack: RulePack, tier: Tier): MingNarrativePremiumPayload {
  const headlines = {} as Record<Tier, string>;
  const mirrors = {} as Record<Tier, string>;
  const turns = {} as Record<Tier, ReaderTurn>;
  for (const t of TIERS) {
    headlines[t] = tone(pickTier(pack.headline, t));
    mirrors[t] = tone(pickTier(pack.mirror, t));
    const tu = pickTier(pack.turn, t);
    turns[t] = { reframe: tone(tu.reframe), action: tu.action ? tone(tu.action) : undefined };
  }
  return {
    provocativeQuestions: pickTier(pack.questions, tier).slice(0, 2),
    headlines,
    mirrors,
    turns,
    bodyOverrides: pack.bodyOverrides,
  };
}

/**
 * batch-1：財帛／官祿／夫妻（需有至少一顆可解讀的宮內星作為 lead；無主星時取輔／雜第一顆）。
 */
export function buildBatch1PalacePremium(raw: PalaceRawInput): MingNarrativePremiumPayload | null {
  const p = raw.palace;
  if (p !== "財帛宮" && p !== "官祿宮" && p !== "夫妻宮") return null;

  let { lead, co } = leaders(raw);
  if (!lead) lead = fallbackLeadFromPool(raw);
  if (!lead) return null;

  const tier = resolveReaderIntensity(raw);
  let pack: RulePack;
  if (p === "財帛宮") pack = buildCaiPack(lead, co);
  else if (p === "官祿宮") pack = buildGuanluPack(lead, co);
  else pack = buildFuqiPack(lead, co);

  return rulePackToPayload(pack, tier);
}

/**
 * 福德宮・天同＋巨門：讀者向斷語／問答／鏡像／轉念／真實運作／坑（與產品校稿對齊）。
 */
function buildFudeTianTongJumenPack(): RulePack {
  const headlineBase =
    "你很在意事情做起來舒不舒服，也很在意關係穩不穩。\n\n但很多時候，你不是不知道現實，只是不想破壞那個穩定感。";
  const mirrorBase =
    "你以為自己是在應對事情，其實很多時候，你是在維持一種「不要失衡」的狀態。\n\n為什麼會這樣？\n天同讓你很重感受，也很在意舒服與否；\n巨門讓你對細節與傷痕記得很清楚，不想讓同樣的事發生第二次。\n所以你不是不面對，而是會先確保自己不再受傷。";

  const qStd = [
    "你最近一次明知道該處理，卻還是擱著沒做的，是什麼？",
    "所以你在意的是結果，還是不要讓氣氛變差？",
  ];
  const qSoft = [
    "您是否也曾在某個瞬間覺得：某件事明明該處理，卻還是先擱著？",
    qStd[1],
  ];
  const qDirect = qStd.map((q, i) =>
    i === 0 ? `${q}（不用答我，對自己誠實就好。）` : q
  );

  const actStd = tone(
    "你只需要先分清楚一件事：現在這個狀態，是在讓自己恢復過來，還只是繼續消耗。"
  );
  const refrStd = tone("你不需要馬上改變節奏。");

  const phenomenonLines = [
    "你很容易在腦中反覆整理事情，但這樣做不一定真能讓事情變得更好，反而讓自己更累。",
    "你以為是在等待更好的時機，其實有時候反而是讓問題拖延下去。",
  ];
  const pitfallLines = [
    "你不是不知道要休息，而是休息了，卻沒有讓自己真的恢復。",
    "你看起來停下來了，但腦袋沒有。",
  ];

  return {
    headline: {
      soft: tone(
        "你其實很在意做起來舒不舒服，也很在意關係穩不穩；有時不是不懂現實，而是先護著那份穩定感。"
      ),
      standard: tone(headlineBase),
      direct: tone(
        "你在意舒服、也在意關係穩——但很多時候你不是看不清現實，而是不想先捅破那層穩定。"
      ),
    },
    questions: {
      soft: qSoft.slice(0, 3),
      standard: qStd.slice(0, 3),
      direct: qDirect.slice(0, 3),
    },
    mirror: {
      soft: tone(mirrorBase.replace("其實很多時候", "有時更像是")),
      standard: tone(mirrorBase),
      direct: tone(
        `${mirrorBase}\n\n再說直白一點：你不是在拖，你是在用「維持平衡」換一點可控感。`
      ),
    },
    turn: {
      soft: { reframe: refrStd, action: actStd },
      standard: { reframe: refrStd, action: actStd },
      direct: {
        reframe: tone("你不需要立刻把節奏扭轉，但你需要停止用「假休息」騙自己還在回血。"),
        action: actStd,
      },
    },
    bodyOverrides: { phenomenonLines, pitfallLines },
  };
}

function hasMainPair(raw: PalaceRawInput, a: string, b: string): boolean {
  const mains = new Set((raw.mainStars ?? []).map((s) => (s ?? "").trim()).filter(Boolean));
  return mains.has(a) && mains.has(b);
}

/**
 * 福德宮：若主星為天同＋巨門，使用專屬語料；否則回 null（改走 schema 泛用）。
 */
export function buildFudePalacePremium(raw: PalaceRawInput): MingNarrativePremiumPayload | null {
  if (raw.palace !== "福德宮") return null;
  if (!hasMainPair(raw, "天同", "巨門")) return null;
  return rulePackToPayload(buildFudeTianTongJumenPack(), resolveReaderIntensity(raw));
}

/**
 * batch-2：兄弟、子女、疾厄、遷移、僕役、田宅、福德、父母（schema + 語義；田宅優先用田宅語料）。
 */
export function buildSchemaDrivenPalacePremium(raw: PalaceRawInput): MingNarrativePremiumPayload | null {
  const palace = raw.palace;
  if (palace === "命宮") return null;
  if (palace === "財帛宮" || palace === "官祿宮" || palace === "夫妻宮") return null;

  if (palace === "福德宮") {
    const fude = buildFudePalacePremium(raw);
    if (fude) return fude;
  }

  let { lead, co } = leaders(raw);
  if (!lead) lead = fallbackLeadFromPool(raw);
  if (!lead) return null;

  const pack = buildSchemaDrivenPalacePack(palace, lead, co);
  if (!pack) return null;
  return rulePackToPayload(pack, resolveReaderIntensity(raw));
}

function buildSchemaDrivenPalacePack(palace: string, lead: string, co: string | null): RulePack | null {
  const schema = PALACE_SEGMENT_SCHEMA[palace];
  if (!schema) return null;

  const sem = lead ? getStarSemantic(lead) : undefined;
  const plain = sem?.plain?.trim();
  const risk = sem?.risk?.trim();

  let richPhenomenon: string | undefined;
  let richDecision: string | undefined;
  let richPitfall: string | undefined;
  if (palace === "田宅宮") {
    const tz = getTianZhaiProfile(lead);
    richPhenomenon = tz?.phenomenon?.trim();
    richDecision = tz?.decision?.trim();
    richPitfall = tz?.pitfall?.trim();
  }

  const headlineStd = tone(
    richPhenomenon ||
      (plain && risk ? `${plain.replace(/。$/, "")}，落在日常裡常變成：${risk.replace(/。$/, "")}。` : "") ||
      richDecision ||
      plain ||
      `你在「${palace}」這條線上，核心主軸圍繞「${schema.coreFocus}」。`
  );

  const headlineSoft = tone(
    richPhenomenon
      ? `有時你也會感覺到：${richPhenomenon.replace(/^你/, "自己")}`
      : plain
        ? `你可能慢慢發現：${plain}`
        : `你也許正經歷一些反覆節奏，它們其實都指向「${schema.coreFocus}」。`
  );

  const headlineDirect = tone(
    (risk && plain ? `${plain.replace(/。$/, "")}——說得直白一點：${risk.replace(/。$/, "")}。` : "") ||
      richPhenomenon ||
      headlineStd
  );

  const qStd: string[] = [
    `你是不是常常在「${schema.phenomenonFocus}」還沒被你看清前，就先做出反應？`,
    `若把「你最在意的」跟「你其實在躲的」各寫一行，會長什麼樣子？`,
  ];
  if (co) qStd.push(`當兩種風格同時在場時，你較常先犧牲哪一邊？`);
  if (richPitfall) qStd.push(`這條線上，你是否也看過「${richPitfall.slice(0, 28)}…」的影子？`);

  const qSoft = qStd.map((q, i) => (i === 0 ? q.replace(/^你是不是/, "您是否也會") : q));
  const qDirect = qStd.map((q, i) =>
    i === 0 ? `${q}（不用答我，對自己誠實就好。）` : q
  );

  let mirStd: string;
  if (plain && risk) {
    mirStd = tone(
      `你以為自己只是在應對眼前事，其實更深的，是${risk.replace(/。$/, "")}。`
    );
  } else if (richPitfall && plain) {
    mirStd = tone(`你以為自己在顧全「${schema.coreFocus}」，其實很多時候是在躲一種不舒服。`);
  } else {
    mirStd = tone(
      `你以為當下只是選擇，其實背後常有一套你早就學會、在「${palace}」反覆上場的策略。`
    );
  }
  const mirSoft = tone(mirStd.replace("其實", "有時更像是"));
  const mirDirectTier = tone(mirStd.replace("其實", "坦白講，是"));

  const actStd = tone(
    `把與「${schema.decisionFocus}」有關的一件事，寫成一個本週可完成的最小步驟。`
  );

  const refrStd = tone(
    risk || plain
      ? `這不代表你錯，而是你在「${schema.coreFocus}」裡，往往先把穩定感放在最前面。`
      : `你的慣性不是問題，問題是：它是否還在服務現在的你。`
  );
  const refrSoft = tone(
    `你不需要逼自己立刻變強或變硬，你只需要分得清：此刻是「還沒準備好」，還是「不敢承認想要」。`
  );
  const turnDirect: ReaderTurn = {
    reframe: tone(
      richPitfall
        ? `你不是沒警覺，而是你太清楚「${schema.pitfallFocus}」的代價，所以一邊拖一邊心裡發急。`
        : risk
          ? `你不是不知道問題在哪，你是太清楚代價，所以一邊拖一邊恨自己拖。`
          : `你不是需要更多道理，你是需要一把能把下一步說進心裡的鑰匙。`
    ),
    action: tone(`只選一件跟「${schema.decisionFocus}」有關的事，回答：若一週後必交卷，我會選哪個不太漂亮但真實的答案？`),
  };

  return {
    headline: { soft: headlineSoft, standard: headlineStd, direct: headlineDirect },
    questions: { soft: qSoft.slice(0, 3), standard: qStd.slice(0, 3), direct: qDirect.slice(0, 3) },
    mirror: { soft: mirSoft, standard: mirStd, direct: mirDirectTier },
    turn: {
      soft: { reframe: refrSoft, action: actStd },
      standard: { reframe: refrStd, action: actStd },
      direct: turnDirect,
    },
  };
}

export function buildReaderPremiumPayload(raw: PalaceRawInput): MingNarrativePremiumPayload | null {
  if (raw.palace === "命宮") return buildMingNarrativePremiumPayload(raw);
  const b1 = buildBatch1PalacePremium(raw);
  if (b1) return b1;
  return buildSchemaDrivenPalacePremium(raw);
}
