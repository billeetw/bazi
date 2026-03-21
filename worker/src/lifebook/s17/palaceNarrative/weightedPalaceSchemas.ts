export type PalaceSegmentSchema = {
  coreFocus: string;
  decisionFocus: string;
  phenomenonFocus: string;
  pitfallFocus: string;
};

export const PALACE_SEGMENT_SCHEMA: Record<string, PalaceSegmentSchema> = {
  命宮: {
    coreFocus: "你如何運作自己（人格結構／反應模式／自我穩定方式）",
    decisionFocus: "做決定時的內在標準與優先順序",
    phenomenonFocus: "壓力下的變化與平常維持自己的方式",
    pitfallFocus: "容易把慣性當本質，形成自我限制",
  },
  兄弟宮: {
    coreFocus: "你與同輩／同事／合作夥伴的協作結構",
    decisionFocus: "合作時如何分工、信任與判斷人",
    phenomenonFocus: "互動節奏、權力距離與支援模式",
    pitfallFocus: "責任與金錢界線不清，合作破局風險",
  },
  夫妻宮: {
    coreFocus: "你如何建立親密關係與長期承諾",
    decisionFocus: "感情與現實之間的取捨方式",
    phenomenonFocus: "相處模式與衝突處理節奏",
    pitfallFocus: "投射、權力失衡與情感消耗",
  },
  子女宮: {
    coreFocus: "你如何把自己向外延伸成成果與傳承",
    decisionFocus: "投入資源培養他人或作品的方式",
    phenomenonFocus: "控制與放手的實際拉扯",
    pitfallFocus: "過度期待與投入回收失衡",
  },
  財帛宮: {
    coreFocus: "現金流、風險承受、進出節奏與守破財機制",
    decisionFocus: "金錢決策的風控順序與投入節點",
    phenomenonFocus: "收入波動、支出壓力與資金周轉現象",
    pitfallFocus: "破財機制、過度加碼與錯估風險",
  },
  疾厄宮: {
    coreFocus: "身心壓力承載方式與修復系統",
    decisionFocus: "你如何處理疲勞、警訊與復原節奏",
    phenomenonFocus: "壓力累積型態與身心連動",
    pitfallFocus: "忽略警訊、硬撐與錯誤紓壓",
  },
  遷移宮: {
    coreFocus: "你在外部世界的表現方式與移動策略",
    decisionFocus: "面對換環境與冒險時的判斷",
    phenomenonFocus: "外出後的機會流動與風險變化",
    pitfallFocus: "誤判環境、過度冒險或過度保守",
  },
  僕役宮: {
    coreFocus: "你的人脈結構與資源網絡質地",
    decisionFocus: "如何挑選合作對象與關係深度",
    phenomenonFocus: "人際互利或單向消耗的運作模式",
    pitfallFocus: "誤判人、被拖累與關係不對等",
  },
  官祿宮: {
    coreFocus: "你在社會角色中的站位與做事方式",
    decisionFocus: "工作發展、權責取捨與策略選擇",
    phenomenonFocus: "職場節奏與責任壓力的日常呈現",
    pitfallFocus: "方向錯置、承擔失衡與名實落差",
  },
  田宅宮: {
    coreFocus: "你建立安全基地與資產根基的方式",
    decisionFocus: "資產配置與穩定感建構策略",
    phenomenonFocus: "累積與流失在日常中的表現",
    pitfallFocus: "資產錯配與安全感失衡",
  },
  福德宮: {
    coreFocus: "你如何休息、消化並回到自己",
    decisionFocus: "先處理情緒或先處理事情的偏好",
    phenomenonFocus: "腦內活動與能量恢復方式",
    pitfallFocus: "空轉、想太多與休息失效",
  },
  父母宮: {
    coreFocus: "你面對規範、權威與原始框架的方式",
    decisionFocus: "面對期待與壓力時的反應模式",
    phenomenonFocus: "支持與壓力來源如何被內化",
    pitfallFocus: "內在批判、代溝與框架綁定",
  },
};
