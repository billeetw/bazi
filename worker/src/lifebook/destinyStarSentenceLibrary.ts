/**
 * 命主星曜句庫：內在動力與渴望（core / tension / strategy）。
 * 供 s04 核心配置與 buildDestinyBodyDialogue 使用；與身主句庫區分為「靈魂驅力」vs「後天工具」。
 */

export type DestinyStarKey =
  | "貪狼"
  | "巨門"
  | "祿存"
  | "文曲"
  | "廉貞"
  | "武曲"
  | "破軍"
  | "紫微"
  | "天府"
  | "天機"
  | "太陰"
  | "天同"
  | "天梁"
  | "天相"
  | "七殺"
  | "文昌"
  | "太陽";

export interface DestinyStarSentences {
  core: string[];
  tension: string[];
  strategy: string[];
}

export const DESTINY_STAR_SENTENCE_LIBRARY: Record<DestinyStarKey, DestinyStarSentences> = {
  貪狼: {
    core: [
      "命主是貪狼，你的靈魂帶有原始的慾望與才華，你這輩子都在處理「想要」與「擁有」的關係。",
      "當命主是貪狼時，你內在最深的動力來自對生命力的渴望與對機會的敏感。",
    ],
    tension: [
      "最容易失衡的地方，是想要太多、太散，反而忘了自己真正要的是哪一種擁有。",
      "當貪狼作為命主時，壓力常來自「都想要」與「只能選」之間的拉扯。",
    ],
    strategy: [
      "你真正要練的，是讓渴望變成方向，而不是永遠在追下一樣東西。",
      "成熟的貪狼命主，會把生命力用在主線上，而不是耗散在每一個可能。",
    ],
  },
  巨門: {
    core: [
      "命主是巨門，你的靈魂深處帶著觀察與懷疑，你不輕信，這讓你精明也讓你孤獨。",
      "當命主是巨門時，你內在的動力來自想看清真相、拆解問題、不被表面話騙。",
    ],
    tension: [
      "最容易失衡的地方，是卡在懷疑與確認之間，讓自己很難真正放鬆或信任。",
      "當巨門作為命主時，壓力常來自太想先把一切看透才肯動。",
    ],
    strategy: [
      "你真正要練的，是讓洞察力變成解題能力，而不是自我消耗。",
      "成熟的巨門命主，會知道什麼值得深究、什麼可以先放，把聰明用在對的地方。",
    ],
  },
  祿存: {
    core: [
      "命主是祿存，你天生自帶保守的財源，你的底色是「守成」，安全感是你的第一優先。",
      "當命主是祿存時，你內在的動力來自穩穩接住、慢慢累積、不讓已有的流失。",
    ],
    tension: [
      "最容易失衡的地方，是為了守成而不敢動，久了讓該變的也僵住。",
      "當祿存作為命主時，壓力常來自「動了會不會失去」的焦慮。",
    ],
    strategy: [
      "你真正要練的，是讓穩定變成底盤，而不是變成不敢前進的理由。",
      "成熟的祿存命主，會分清楚什麼值得守、什麼可以放出去長大。",
    ],
  },
  文曲: {
    core: [
      "命主是文曲，你的靈魂是感性的、帶戲劇性的，你這輩子必須活得有美感、有共鳴。",
      "當命主是文曲時，你內在的動力來自對感受、層次與表達的敏感。",
    ],
    tension: [
      "最容易失衡的地方，是太在意感受與細節，反而難以下決定或往前推。",
      "當文曲作為命主時，壓力常來自「味道不對就不想動」的完美傾向。",
    ],
    strategy: [
      "你真正要練的，是讓細膩感成為理解力與表達力，而不是猶豫來源。",
      "成熟的文曲命主，會把美感用在溝通與連結，而不是只留在內心。",
    ],
  },
  廉貞: {
    core: [
      "命主是廉貞，你的靈魂帶有高傲與野心，你不甘於平凡，你是天生的外交家或囚徒。",
      "當命主是廉貞時，你內在的動力來自對位置、權力與界線的敏感。",
    ],
    tension: [
      "最容易失衡的地方，是把野心活成壓力，或把界線活成孤島。",
      "當廉貞作為命主時，壓力常來自「要嘛全拿、要嘛不要」的極端。",
    ],
    strategy: [
      "你真正要練的，是讓野心變成戰略，而不是自我囚禁。",
      "成熟的廉貞命主，會把權力感用在對的戰場，而不是到處樹敵。",
    ],
  },
  武曲: {
    core: [
      "命主是武曲，你的靈魂是硬核的、務實的，你不相信眼淚，你只相信實力與結果。",
      "當命主是武曲時，你內在的動力來自做出來、扛起來、用成果說話。",
    ],
    tension: [
      "最容易失衡的地方，是把所有事都活成責任與績效，久了很難真正放鬆。",
      "當武曲作為命主時，壓力常來自「不能停、不能軟」的自我要求。",
    ],
    strategy: [
      "你真正要練的，是讓執行力有節奏，而不是一直用力。",
      "成熟的武曲命主，會把結果感變成穩定推進，而不是自我壓迫。",
    ],
  },
  破軍: {
    core: [
      "命主是破軍，你的靈魂就是為了摧毀舊秩序而來，你的生命力在於不斷的「重啟」。",
      "當命主是破軍時，你內在的動力來自更新、翻新、不想用同一套活到老。",
    ],
    tension: [
      "最容易失衡的地方，是還沒站穩就先推翻，讓自己一直停在重整期。",
      "當破軍作為命主時，壓力常來自「乾脆重來」的衝動取代了整理。",
    ],
    strategy: [
      "你真正要練的，是讓改變有結構，而不是每次都從零開始。",
      "成熟的破軍命主，會把翻新能力變成戰略，而不是反射。",
    ],
  },
  紫微: {
    core: [
      "命主是紫微，你的靈魂帶著整合與尊嚴感，你內在的動力來自想主導、想被尊重、想讓局面照著合理的方式運作。",
    ],
    tension: ["最容易失衡的地方，是把尊嚴感活成孤高，或把主導活成控制。"],
    strategy: ["你真正要練的，是讓整合力變成資源，而不是負擔。"],
  },
  天府: {
    core: [
      "命主是天府，你的靈魂帶著穩定與承接感，你內在的動力來自想接住、想留住、想慢慢養大。",
    ],
    tension: ["最容易失衡的地方，是為了穩而太慢，或太怕動了會失去。"],
    strategy: ["你真正要練的，是讓穩定變成底盤，而不是停滯。"],
  },
  天機: {
    core: [
      "命主是天機，你的靈魂帶著思考與變動感，你內在的動力來自想算準、想調整、想找到最優解。",
    ],
    tension: ["最容易失衡的地方，是一直修、一直想，反而延後了行動。"],
    strategy: ["你真正要練的，是讓策略服務推進，而不是卡住推進。"],
  },
  太陰: {
    core: [
      "命主是太陰，你的靈魂帶著感受與內斂，你內在的動力來自想被理解、想安穩、想有品質地活。",
    ],
    tension: ["最容易失衡的地方，是太多感受放在心裡，最後悶著承受。"],
    strategy: ["你真正要練的，是把感受轉成清楚表達，而不是只留在內心。"],
  },
  天同: {
    core: [
      "命主是天同，你的靈魂帶著和諧與柔軟，你內在的動力來自想被接住、想舒服、想關係裡有溫度。",
    ],
    tension: ["最容易失衡的地方，是為了和諧而延後面對真正的問題。"],
    strategy: ["你真正要練的，是在柔軟裡保留方向，而不是一直讓步。"],
  },
  天梁: {
    core: [
      "命主是天梁，你的靈魂帶著承擔與保護感，你內在的動力來自想接住人、想分辨對錯、想當那個穩住的人。",
    ],
    tension: ["最容易失衡的地方，是不知不覺把過多責任收進來，活得太重。"],
    strategy: ["你真正要練的，是讓承擔有邊界，而不是一切都往身上接。"],
  },
  天相: {
    core: [
      "命主是天相，你的靈魂帶著平衡與秩序感，你內在的動力來自想讓局面順、想大家都剛剛好。",
    ],
    tension: ["最容易失衡的地方，是太顧全、太想平衡，最後把自己放到後面。"],
    strategy: ["你真正要練的，是在協調裡保有自己的位置，而不是一直補位。"],
  },
  七殺: {
    core: [
      "命主是七殺，你的靈魂帶著決斷與破局感，你內在的動力來自想切開模糊、想快狠準、想直接到核心。",
    ],
    tension: ["最容易失衡的地方，是還沒讓局勢長出資訊就先下重手。"],
    strategy: ["你真正要練的，是讓決斷力有分寸，而不是永遠用最高檔。"],
  },
  文昌: {
    core: [
      "命主是文昌，你的靈魂帶著邏輯與清楚感，你內在的動力來自想把事情說明白、排整齊、有方法。",
    ],
    tension: ["最容易失衡的地方，是太想整理到清楚，反而延後了推進。"],
    strategy: ["你真正要練的，是讓清楚服務行動，而不是取代行動。"],
  },
  太陽: {
    core: [
      "命主是太陽，你的靈魂帶著照亮與付出感，你內在的動力來自想被看見、想有影響力、想讓事情發光。",
    ],
    tension: ["最容易失衡的地方，是燃燒自己照亮別人，久了忘了自己也需要被照到。"],
    strategy: ["你真正要練的，是讓付出有邊界，光才不會熄。"],
  },
};

function normalizeDestinyStarKey(starName?: string | null): DestinyStarKey | null {
  const key = (starName ?? "").trim();
  if (!key) return null;
  if (key in DESTINY_STAR_SENTENCE_LIBRARY) return key as DestinyStarKey;
  return null;
}

function pickBySeed(arr: string[], seed?: number): string {
  if (!arr.length) return "";
  if (seed == null || !Number.isFinite(seed)) return arr[0];
  return arr[Math.abs(Math.floor(seed)) % arr.length];
}

export function pickDestinyStarCore(starName?: string | null, seed?: number): string {
  const key = normalizeDestinyStarKey(starName);
  if (!key) return "";
  return pickBySeed(DESTINY_STAR_SENTENCE_LIBRARY[key].core, seed);
}

export function pickDestinyStarTension(starName?: string | null, seed?: number): string {
  const key = normalizeDestinyStarKey(starName);
  if (!key) return "";
  return pickBySeed(DESTINY_STAR_SENTENCE_LIBRARY[key].tension, seed);
}

export function pickDestinyStarStrategy(starName?: string | null, seed?: number): string {
  const key = normalizeDestinyStarKey(starName);
  if (!key) return "";
  return pickBySeed(DESTINY_STAR_SENTENCE_LIBRARY[key].strategy, seed);
}
