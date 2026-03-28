/**
 * Root v1 降生藍圖 — mock 資料（之後由 summary／引擎替換）。
 */

export interface RootBlueprintHeroMock {
  tag: string;
  titleLine1: string;
  titleLine2: string;
  mingZhuLabel: string;
  mingZhuName: string;
  shenZhuLabel: string;
  shenZhuName: string;
  shenGongLabel: string;
  shenGongName: string;
}

export interface RootAuditCardMock {
  variant: "drive" | "tension" | "ultimate";
  title: string;
  tag: string;
  body: string;
  insight: string;
}

export interface RootPrimaryFocusMock {
  /** 推薦理由（一句） */
  reasonLine: string;
  /** 建議閱讀宮位 */
  palaceId: string;
  palaceLabelZh: string;
  /** 可選：對應時間節點（展示用） */
  timelineNodeId: string;
  timelineNodeLabel: string;
}

export interface RootTimelinePreviewNodeMock {
  id: string;
  year: number;
  label: string;
  oneLiner: string;
}

export const ROOT_BLUEPRINT_MOCK = {
  hero: {
    tag: "INCARNATION BLUEPRINT",
    titleLine1: "降生藍圖",
    titleLine2: "你為這具身體準備了什麼？",
    mingZhuLabel: "命主",
    mingZhuName: "廉貞",
    shenZhuLabel: "身主",
    shenZhuName: "天相",
    shenGongLabel: "身宮",
    shenGongName: "夫妻宮",
  } satisfies RootBlueprintHeroMock,

  auditCards: [
    {
      variant: "drive",
      title: "內在驅力",
      tag: "命主 × 身主",
      body: "你靈魂裡要位置與權力（命主），身主偏策略與分寸。想與做都偏理性，容易把局面算得很準，但也容易把關係算成棋。",
      insight: "靈魂功課：在策略裡保留一點真實的溫度與信任。",
    },
    {
      variant: "tension",
      title: "命身同步校準",
      tag: "命宮 vs 身宮",
      body: "身宮掌管你後天修煉的重心。命宮與身宮的主題若有張力，容易在「做自己」與「配合外界」之間拉扯。",
      insight: "靈魂功課：在張力裡找平衡點，而不是壓掉其中一邊。",
    },
    {
      variant: "ultimate",
      title: "最終 alignment",
      tag: "THE ALIGNMENT",
      body: "你真正要練的，是讓靈魂的渴望與身體的行動變成同一套節奏，而不是彼此拉扯。尤其在一對一關係的議題上，把力氣放在對的順序上。",
      insight: "這是你此生突破局限的終極鑰匙。",
    },
  ] satisfies RootAuditCardMock[],

  primaryFocus: {
    reasonLine: "目前最優先：把「關係裡的界線」說清楚，再談承諾。",
    palaceId: "fuqi",
    palaceLabelZh: "夫妻宮",
    timelineNodeId: "y2026",
    timelineNodeLabel: "2026 流年節點",
  } satisfies RootPrimaryFocusMock,

  timelinePreview: {
    summaryLine: "完整節點與決策脈絡在時間軸展開；此處僅摘取 1～2 個節點作預覽。",
    nodes: [
      { id: "y2026", year: 2026, label: "流年 2026", oneLiner: "外緣變動多，先穩定內在節奏再出手。" },
      { id: "y2027", year: 2027, label: "流年 2027", oneLiner: "資源與合作機會浮現，慎選盟友。" },
    ],
  } satisfies { summaryLine: string; nodes: RootTimelinePreviewNodeMock[] },
};
