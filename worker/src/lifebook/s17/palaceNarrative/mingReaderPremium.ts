/**
 * 命宮讀者敘事加值層：斷語、先問後答、鏡像、力量收尾（全 deterministic）。
 * 強度由 raw.readerNarrativeIntensity 控制，預設 standard。
 * UI 可切換強度而不必重算盤（headlines / mirrors / turns 保留三档）。
 */
import { getStarSemantic } from "../../starSemanticDictionary.js";
import type {
  MingNarrativePremiumPayload,
  PalaceRawInput,
  ReaderNarrativeIntensity,
  ReaderTurn,
} from "./palaceNarrativeTypes.js";
import { getMingProfile } from "./mingProfiles.js";
import { normalizeNarrativePunctuation } from "./narrativePunctuation.js";

function tone(s: string): string {
  return normalizeNarrativePunctuation(s.trim());
}

function natalJi(raw: PalaceRawInput): string | undefined {
  const j = raw.natalTransforms?.忌?.trim();
  return j || undefined;
}

function inPalace(raw: PalaceRawInput, star: string): boolean {
  const pool = [...raw.mainStars, ...raw.minorStars, ...raw.miscStars];
  return pool.some((x) => x === star);
}

type Tier = ReaderNarrativeIntensity;

type RulePack = {
  headline: Record<Tier, string>;
  questions: Record<Tier, string[]>;
  mirror: Record<Tier, string>;
  turn: Record<Tier, ReaderTurn>;
};

const TIERS: Tier[] = ["soft", "standard", "direct"];

function pickTier<T extends Record<Tier, unknown>>(pack: T, tier: Tier): T[Tier] {
  return pack[tier];
}

const MING_PREMIUM_RULES: {
  when: (raw: PalaceRawInput, lead: string, co: string | null) => boolean;
  pack: RulePack;
}[] = [
  {
    when: (raw, lead, _co) => lead === "天梁" && natalJi(raw) === "天梁" && inPalace(raw, "天梁"),
    pack: {
      headline: {
        soft: "你多半會不自覺想撐住局面、照著自己的標準把路扛下來，事後才發現自己其實也很需要被接住。",
        standard: "你在關係與責任裡很容易先撐住全場，但界線常常是在事後才補上。",
        direct: "你習慣當結構裡的那根樑：別人看你穩，你自己知道累；界線慢了半拍，委屈就容易堆。",
      },
      questions: {
        soft: [
          "你是否常常自然成為安撫或收尾的人，卻很少把『我也需要支援』說出口？",
          "當你覺得『我不撐誰撐』的時候，那件事真的必須由你全扛嗎？",
        ],
        standard: [
          "你是不是常在關係裡當那個撐住局面的人，但其實很少有人真的撐過你？",
          "你最近一次把責任往外分一點，結果有變得更糟嗎？還是其實沒那麼可怕？",
        ],
        direct: [
          "你是不是早就發現：你再怎麼講理和扛責，有些人就是不會回應到你要的那種對等？",
          "若你現在立刻少扛一件事，你最怕『場面』會變成什麼樣子？",
        ],
      },
      mirror: {
        soft: "你以為自己只是在幫忙把對方拉上岸，其實你已經把很多不屬於你的重量放進自己的背包。",
        standard: "你以為你是在顧全大局、守護正當性，其實更像是在用扛責換取一點可控感。",
        direct: "你以為你只要再撐一下、講清楚一點就會好，其實有些局缺的是『停損』而不是更多力氣。",
      },
      turn: {
        soft: {
          reframe: "你不是太好說話，而是你把『可靠』看得太重，以至於先給別人安全，把自己的需要放後面。",
          action: "今天先練習一件事：對方還沒開口求助前，你先停三秒，問自己『這真的是我的格子嗎？』。",
        },
        standard: {
          reframe: "你不是太容易承擔，而是你太習慣在『沒被正式請求』之前就先撐住。",
          action: "下次當你想接手時，試著多問一句：『這件事一定需要我嗎？如果沒有我，會怎麼走？』",
        },
        direct: {
          reframe: "你的強項是扛，但你的課題是『何時不扛』；不扛不是冷酷，是把力量留給值得你出手的事。",
          action: "選一件你最近又在硬撐的事，寫下『最低限度的完成長什麼樣』，照那個版本交出去。",
        },
      },
    },
  },
  {
    when: (raw, lead, _co) => lead === "天同" && natalJi(raw) === "天同" && inPalace(raw, "天同"),
    pack: {
      headline: {
        soft: "你很在意氣氛好不好、大家舒不舒服，但壓力常常被自己用『算了』先吞下去。",
        standard: "你習慣先顧場面與和諧，真正的界線與需求常常晚一步才浮上來。",
        direct: "你用和諧買平安，但代價常常是——你的感受永遠排在第二順位。",
      },
      questions: {
        soft: ["你是不是常常先讓別人舒服，再來才問自己：那我呢？"],
        standard: ["你是不是怕一堅持就大吵，所以寧可先吞，結果心裡更悶？"],
        direct: ["你最近一次『不想惹麻煩』的退讓，換來的是平靜，還是更大顆的計時炸彈？"],
      },
      mirror: {
        soft: "你以為自己在體貼，其實有時是在用委屈換短暫的平靜。",
        standard: "你以為自己在顧大局，其實更像是在用退讓躲避衝突帶來的失控感。",
        direct: "你以為忍一下就過去，其實忍的是邊界，過不去的是累積的不甘。",
      },
      turn: {
        soft: {
          reframe: "和諧不是錯，但如果只剩你在付代價，那就不是關係，是一邊倒。",
          action: "試著把一句話說完整：『我也想…』，不要求漂亮，只要是真的。",
        },
        standard: {
          reframe: "你不是軟弱，你是把『維持連結』看得比『說真話』更早出手。",
          action: "下次想說『算了』之前，改成：『我需要十分鐘把話想清楚再回你。』",
        },
        direct: {
          reframe: "你不是不會爭，而是你太知道爭的代價；但長期不爭，代價會反過來找你。",
          action: "選一個你一直退讓的點，設定一條『到此為止』，用行為而不是解釋守住它。",
        },
      },
    },
  },
  {
    when: (raw, lead, _co) => lead === "巨門" && natalJi(raw) === "巨門" && inPalace(raw, "巨門"),
    pack: {
      headline: {
        soft: "你對資訊與話語很敏感，容易在心裡反覆推演，表面卻常常選擇保留。",
        standard: "你習慣先看清、先求證，但在關係裡也可能卡在『講了怕傷、不講又內耗』之間。",
        direct: "你嘴上有分寸，心上有一把尺：不信任不是任性，是你看過太多次話語的後座力。",
      },
      questions: {
        soft: ["你是不是常常把話吞回去，因為你預感一講就會變複雜？"],
        standard: ["你是不是寧可自己消化，也不太相信說出來會被好好接住？"],
        direct: ["你最近一次『講真話』的代價是什麼？如果永遠不講，代價又會是什麼？"],
      },
      mirror: {
        soft: "你以為自己在謹慎，其實有時是在用安靜保護自己不被誤解。",
        standard: "你以為自己是在理性，其實更像是在避免話一出口就失控的場面。",
        direct: "你以為沉默能換太平，其實沉默常常只是讓誤會長得更大。",
      },
      turn: {
        soft: {
          reframe: "你不需要立刻講滿，但你需要一個安全的最小表達版本。",
          action: "練習一句：『我現在不確定怎麼說，但我不是沒感覺。』",
        },
        standard: {
          reframe: "你不是多心，你是把語言當武器也當護城河，所以出手很慢。",
          action: "下次先講『我需要被聽見的部分』而不是『你為什麼要這樣』。",
        },
        direct: {
          reframe: "你不是不會溝通，是你太清楚溝通的代價，所以選擇精準開火或完全熄火。",
          action: "把最想說的一句話寫下來，刪到剩下核心，再決定要不要說出口。",
        },
      },
    },
  },
  {
    when: (raw, lead, co) =>
      (lead === "廉貞" || co === "廉貞") && natalJi(raw) === "廉貞" && inPalace(raw, "廉貞"),
    pack: {
      headline: {
        soft: "你對關係與界線很敏銳，常在想要與克制之間反覆整理自己。",
        standard: "你在人際裡同時想要連結與掌控感，節奏一亂就容易內耗放大。",
        direct: "你要的不是黏，是邊界清楚的靠近；一亂套，你就會用力抓或乾脆切。",
      },
      questions: {
        soft: ["你是不是常常在關係裡先把對方顧好，卻忘了自己也需要被尊重？"],
        standard: ["你是不是一感覺界線被踩，反應會比以前更大，因為你早就累積很久了？"],
        direct: ["你現在在守的是愛，還是在守『我不能輸』這件事？"],
      },
      mirror: {
        soft: "你以為自己在投入，其實有時是在用投入換掌控感。",
        standard: "你以為自己在爭的是道理，其實更像在爭『我能不能被當回事』。",
        direct: "你以為你在克制，其實你是在等一個爆點才把真話倒出來。",
      },
      turn: {
        soft: {
          reframe: "欲望與克制並存不是錯，需要的是可被說出口的節奏。",
          action: "寫下：『我可以給多少、不能給多少』，用一句話對自己誠實。",
        },
        standard: {
          reframe: "你不是太強勢，你是太怕再度失控，所以先把控制權抓回手上。",
          action: "下次情緒上來，先做兩分鐘離場，再決定要不要把話說重。",
        },
        direct: {
          reframe: "你不是難搞，是你對忠誠與邊界有硬標準；硬標準要用在值得的人身上。",
          action: "把『我必須忍受』改成『我選擇交換什麼』，你會更清楚值不值得。",
        },
      },
    },
  },
];

const TAIYIN_MIRROR: Record<Tier, string> = {
  soft: "你以為自己是在等對的時機，其實很多時候，你是在等自己先安心。",
  standard: "你以為自己只是慢，其實更深的是你不想在沒有把握時就把心掏出來。",
  direct: "你以為自己在顧節奏，其實你常常是在避開內在失衡的感覺。",
};

function buildFallbackRulePack(raw: PalaceRawInput, lead: string, co: string | null): RulePack {
  const profile = lead ? getMingProfile(lead) : undefined;
  const sem = lead ? getStarSemantic(lead) : undefined;
  const coProf = co ? getMingProfile(co) : undefined;

  const phenomenon = profile?.phenomenon?.trim();
  const risk = sem?.risk?.trim();
  const plain = sem?.plain?.trim();
  const advice = sem?.advice?.trim();
  const pitfall = profile?.pitfall?.trim();

  const headlineStd = tone(
    phenomenon ||
      (plain && risk ? `${plain.replace(/。$/, "")}，落在日常裡常變成：${risk.replace(/。$/, "")}。` : "") ||
      risk ||
      plain ||
      "你運作自己的方式其實很一致：同樣的節奏會在不同場域反覆出現。"
  );

  const headlineSoft = tone(
    phenomenon
      ? `有時你也會感覺到：${phenomenon.replace(/^你/, "自己")}`
      : plain
        ? `你可能慢慢發現：${plain}`
        : `你也許正經歷一些反覆的模式，它們其實都指向同一件事。`
  );

  const headlineDirect = tone(
    (risk && plain ? `${plain.replace(/。$/, "")}——說得直白一點：${risk.replace(/。$/, "")}。` : "") ||
      phenomenon ||
      headlineStd
  );

  const qStd: string[] = [
    `你是不是常常在事情還沒明朗前，心裡就已經先預想過一輪又一輪最壞的版本？`,
    `你真正守的，可能不是結果本身，而是不要讓自己再次失去安全感。`,
  ];
  if (coProf?.core)
    qStd.push(`當兩種主軸同時在你身上時，你較常先犧牲哪一邊的自己？`);
  if (qStd.length < 2 && risk) {
    qStd.unshift(
      `你是否常在事情還沒爆開前，就已經在心裡演過很多遍「最壞版本」？`
    );
  }
  if (qStd.length === 0)
    qStd.push(
      `如果把「你以為自己在追求的」跟「你實際在逃避的」各寫一行，會長什麼樣子？`
    );

  const qSoft = qStd.map((q, i) =>
    i === 0
      ? q.replace(/^你是不是/, "您是否也會")
      : q
  );
  const qDirect = qStd.map((q, i) =>
    i === 0 ? `${q}（不用答我，對自己誠實就好。）` : q
  );

  let mirSoft: string;
  let mirStd: string;
  let mirDirectTier: string;

  if (lead === "太陰") {
    mirSoft = tone(TAIYIN_MIRROR.soft);
    mirStd = tone(TAIYIN_MIRROR.standard);
    mirDirectTier = tone(TAIYIN_MIRROR.direct);
  } else {
    mirStd = tone(
      risk && plain
        ? `你以為自己只是${plain.replace(/。$/, "").slice(0, 22)}……其實更深的，是${risk.replace(/。$/, "")}。`
        : pitfall && plain
          ? `你以為自己在照節奏走，其實很多時候是在躲一種不舒服。`
          : `你以為當下只是選擇，其實背後常有一套你早就學會的生存策略。`
    );
    mirSoft = tone(mirStd.replace("其實", "有時更像是"));
    mirDirectTier = tone(mirStd.replace("其實", "坦白講，是"));
  }

  const reframeStandard = tone(
    `你不用先配合眼前的氣氛，再回頭找自己。先確認你的需要，才決定要不要跟著眼前的局走。`
  );
  const refrSoft = tone(
    `你不需要逼自己變快變硬，你只需要分得清：此刻是「還沒準備好」，還是「不敢承認想要」。`
  );

  const actStd = tone(
    `挑一件你正在拖的事，只寫兩行：若不做，你怕什麼；若做了，你怕什麼。`
  );

  const refrStd =
    lead === "太陰" || (advice && advice.includes("氣氛"))
      ? reframeStandard
      : tone(
          pitfall
            ? `這不代表你軟弱，而是你把「先穩住心」看得比「先出手」更優先。`
            : `你的慣性不是問題，問題是：它是否還在服務現在的你。`
        );

  const turnDirect: ReaderTurn = {
    reframe: tone(
      pitfall
        ? `你不是不知道問題在哪，你是太清楚代價，所以一邊拖一邊恨自己拖。`
        : `你不是需要更多道理，你是需要一把能把話說進心裡的鑰匙。`
    ),
    action: `選一個你拖延最久的決定，只問一句：『若一週後必交卷，我會選哪個不太漂亮但真實的答案？』`,
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

export function resolveReaderIntensity(raw: PalaceRawInput): ReaderNarrativeIntensity {
  const x = raw.readerNarrativeIntensity;
  if (x === "soft" || x === "direct" || x === "standard") return x;
  return "standard";
}

export function buildMingNarrativePremiumPayload(raw: PalaceRawInput): MingNarrativePremiumPayload | null {
  if (raw.palace !== "命宮") return null;

  const lead = raw.mainStars[0] ?? "";
  const co = raw.mainStars[1] && raw.mainStars[1] !== lead ? raw.mainStars[1] : null;
  const tier = resolveReaderIntensity(raw);

  let pack: RulePack | undefined;
  for (const r of MING_PREMIUM_RULES) {
    if (r.when(raw, lead, co)) {
      pack = r.pack;
      break;
    }
  }
  if (!pack) pack = buildFallbackRulePack(raw, lead, co);

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
  };
}
