/**
 * 命書：十神 × 12 宮、五行 × 12 宮（計算用 mapping + 敘事層句庫）
 * - TEN_GOD_PALACE_ROLE：每宮候選十神（2–3 個），供 assignTenGodByPalace() 計算用
 * - TEN_GOD_PALACE_DESCRIPTION：十神_宮位 120 格，給 AI 技術依據敘述用
 * - WUXING_PALACE_DESCRIPTION：五行_宮位 60 格，給 AI 敘述用
 * - WUXING_PALACE_BASE：計算用（宮位列表、五行列表）
 */

(function () {
  "use strict";

  /** 12 宮順序（與 PALACE_DEFAULT 一致，用於迭代） */
  const PALACE_ORDER = [
    "命宮", "兄弟", "夫妻", "子女", "財帛", "疾厄",
    "遷移", "僕役", "官祿", "田宅", "福德", "父母",
  ];

  /** 宮位簡稱 → 候選列表用的 key（僕役→交友宮） */
  const PALACE_TO_ROLE_KEY = {
    命宮: "命宮",
    兄弟: "兄弟宮",
    夫妻: "夫妻宮",
    子女: "子女宮",
    財帛: "財帛宮",
    疾厄: "疾厄宮",
    遷移: "遷移宮",
    僕役: "交友宮",
    官祿: "官祿宮",
    田宅: "田宅宮",
    福德: "福德宮",
    父母: "父母宮",
  };

  /** 天干 → 五行（供 assignWuxingByPalace 用） */
  const STEM_TO_WUXING = {
    "甲": "木", "乙": "木",
    "丙": "火", "丁": "火",
    "戊": "土", "己": "土",
    "庚": "金", "辛": "金",
    "壬": "水", "癸": "水",
  };

  /** 宮位簡稱 → 對應柱（與十神同一套：命宮=日、兄弟=月、夫妻=時、子女=年…） */
  const PALACE_TO_PILLAR_FOR_WUXING = {
    命宮: "day",
    兄弟: "month",
    夫妻: "hour",
    子女: "year",
    財帛: "month",
    疾厄: "year",
    遷移: "hour",
    僕役: "month",
    官祿: "year",
    田宅: "month",
    福德: "day",
    父母: "year",
  };

  /**
   * 候選十神 × 12 宮（計算用 mapping）
   * 每宮僅 2–3 個十神，最能代表該宮的人際關係角色。
   * Key 用「宮位名」（命宮、兄弟宮、交友宮…）供 assignTenGodByPalace 查候選。
   */
  const TEN_GOD_PALACE_ROLE = {
    命宮: ["比肩", "劫財"],
    兄弟宮: ["比肩", "劫財"],
    夫妻宮: ["正官", "七殺"],
    子女宮: ["食神", "傷官"],
    財帛宮: ["正財", "偏財", "劫財"],
    疾厄宮: ["偏印", "正印"],
    遷移宮: ["偏印", "劫財", "偏財"],
    交友宮: ["比肩", "劫財", "偏財"],
    官祿宮: ["正官", "七殺", "傷官"],
    田宅宮: ["正財", "偏財", "正印"],
    福德宮: ["正印", "偏印"],
    父母宮: ["正印", "偏印", "正官"],
  };

  /**
   * 十神 × 12 宮：120 格敘述（AI 用）
   * Key: "十神_宮位"，宮位用 命宮、兄弟宮、…、交友宮
   */
  const TEN_GOD_PALACE_DESCRIPTION = {
    比肩_命宮: "自主強、重自我、行動靠自己、怕被束縛",
    劫財_命宮: "好勝強、敢爭取、競爭心理重、講究速度",
    食神_命宮: "享樂心強、不急不躁、喜創作、重體驗",
    傷官_命宮: "個性直、反骨、創新強、不愛被管",
    偏財_命宮: "靈活外向、愛社交、重機會、反應快",
    正財_命宮: "務實踏實、重累積、節奏穩、講紀律",
    七殺_命宮: "強勢果斷、動作快、壓力驅動、抗壓高",
    正官_命宮: "端正穩重、重形象、保護自己界線",
    偏印_命宮: "感性直覺強、思考跳躍、孤高、重靈感",
    正印_命宮: "溫和包容、心軟、依賴感強、重安全",
    比肩_兄弟宮: "手足平權、互相較勁、界線明確",
    劫財_兄弟宮: "資源競爭強、彼此搶主導、較量多",
    食神_兄弟宮: "相處和緩、話題多、互相照顧",
    傷官_兄弟宮: "互嗆直話、衝突快、但透明",
    偏財_兄弟宮: "手足外向、跑動多、人脈共享",
    正財_兄弟宮: "手足務實、講責任、互動重規矩",
    七殺_兄弟宮: "強勢手足、說話重、刺激多成長快",
    正官_兄弟宮: "手足端正、講禮節、互動保守",
    偏印_兄弟宮: "距離感強、理念交流多、實際少",
    正印_兄弟宮: "手足互助、情感綁定深、依賴強",
    比肩_夫妻宮: "關係平權、各有主張、互不依附",
    劫財_夫妻宮: "容易較勁、搶主導、磨合需時間",
    食神_夫妻宮: "伴侶好相處、生活感強、重氛圍",
    傷官_夫妻宮: "直話多、容易衝突、但坦白透明",
    偏財_夫妻宮: "伴侶活潑外向、重社交、人脈廣",
    正財_夫妻宮: "伴侶務實、重家庭、習慣穩定生活",
    七殺_夫妻宮: "伴侶強勢、節奏快、壓力中相處",
    正官_夫妻宮: "伴侶穩重、責任強、婚姻偏傳統",
    偏印_夫妻宮: "伴侶想法跳躍、神秘感多、需空間",
    正印_夫妻宮: "伴侶溫暖、體貼、情感需求高",
    比肩_子女宮: "孩子自主早、強個性、不受控制",
    劫財_子女宮: "孩子好勝、討注意、競爭心理強",
    食神_子女宮: "孩子乖巧開朗、生活感強、享樂型",
    傷官_子女宮: "孩子聰明直率、創意強、反骨",
    偏財_子女宮: "孩子外向、動得快、多才多藝",
    正財_子女宮: "孩子穩定、聽話、責任感強",
    七殺_子女宮: "孩子強悍獨立、行動快、敢冒險",
    正官_子女宮: "孩子有禮、守規矩、壓力感較強",
    偏印_子女宮: "孩子敏感、藝術性強、想法跳",
    正印_子女宮: "孩子溫柔、貼心、情緒細膩",
    比肩_財帛宮: "單打獨鬥賺錢、靠自己、重掌握度",
    劫財_財帛宮: "財流起伏大、好勝衝動、易冒險",
    食神_財帛宮: "靠創意自由業、收入較彈性",
    傷官_財帛宮: "創新賺錢、突破式收入、風險高",
    偏財_財帛宮: "偏門財旺、靠機會、人脈走財",
    正財_財帛宮: "穩定收入、重累積、節奏固定",
    七殺_財帛宮: "快財多、壓力型收入、高變動",
    正官_財帛宮: "制度型收入、固定薪水、安全",
    偏印_財帛宮: "非典型收入、靠專才或靈感",
    正印_財帛宮: "照顧型收入、穩定但需能量",
    比肩_疾厄宮: "壓力扛著走、肌肉緊繃、硬撐型",
    劫財_疾厄宮: "爆發型疲勞、情緒起伏影響身體",
    食神_疾厄宮: "代謝緩、易胖體質、重心情療癒",
    傷官_疾厄宮: "神經易敏感、睡眠不穩、情緒快",
    偏財_疾厄宮: "因跑動過勞、消耗快、需補水分",
    正財_疾厄宮: "消化系統強弱直接反應壓力",
    七殺_疾厄宮: "高壓疾病、免疫波動大、急症型",
    正官_疾厄宮: "壓力型慢性、需規律保養",
    偏印_疾厄宮: "自律神經波動、敏感體質",
    正印_疾厄宮: "免疫弱、易疲累、需要休養",
    比肩_遷移宮: "外地靠自己打拼、獨立度高",
    劫財_遷移宮: "競爭強、外地壓力大但突破快",
    食神_遷移宮: "外地生活舒適、靠貴人",
    傷官_遷移宮: "外地挑戰多、創新反骨能見度高",
    偏財_遷移宮: "異地人脈旺、移動帶財",
    正財_遷移宮: "外地務實累積、穩定求成",
    七殺_遷移宮: "外地高壓但有機會、行動快",
    正官_遷移宮: "外地工作端正規律、穩定發展",
    偏印_遷移宮: "外地靈感強、適探索與學習",
    正印_遷移宮: "外地易遇照顧者、貴人強",
    比肩_交友宮: "朋友平權、互推互拉、界線清楚",
    劫財_交友宮: "朋友競爭多、搶資源、刺激成長",
    食神_交友宮: "朋友好玩、有共同興趣、常聚",
    傷官_交友宮: "朋友直來直往、容易吵但快好",
    偏財_交友宮: "社交廣、人脈多、機會靠朋友",
    正財_交友宮: "朋友務實、穩定、互相照應",
    七殺_交友宮: "朋友強勢、競爭性強、壓力中提升",
    正官_交友宮: "朋友端正、正派、教導意味強",
    偏印_交友宮: "朋友奇特、小圈子深度交流",
    正印_交友宮: "朋友溫暖、依賴性高、互助",
    比肩_官祿宮: "靠自己打出位置、獨立性強",
    劫財_官祿宮: "職場競爭激烈、衝勁高、變動多",
    食神_官祿宮: "職涯自由度高、適創意與生活業",
    傷官_官祿宮: "挑戰體制、創新強、適新創",
    偏財_官祿宮: "靠外部機會、人脈型工作",
    正財_官祿宮: "制度內穩定升遷、累積型職涯",
    七殺_官祿宮: "高壓領導、競爭位置、突破快",
    正官_官祿宮: "適公務、管理、制度型工作",
    偏印_官祿宮: "適研究、技術、幕後專業",
    正印_官祿宮: "教育、助人、照護型職涯",
    比肩_田宅宮: "喜自行打理家務、家風獨立",
    劫財_田宅宮: "居住變動多、花費多、易衝動決策",
    食神_田宅宮: "家中舒適、重生活享受",
    傷官_田宅宮: "家務常變動、裝修反覆、創意多",
    偏財_田宅宮: "靠房產流動、喜買賣、偏門財",
    正財_田宅宮: "房產穩、累積型、資產扎實",
    七殺_田宅宮: "居住節奏快、常搬家、高壓位置",
    正官_田宅宮: "家風穩重整齊、責任多",
    偏印_田宅宮: "家有藝術氣息、靈性風格",
    正印_田宅宮: "家溫暖、照護性強、以家養人",
    比肩_福德宮: "精神靠獨處補能、喜自由",
    劫財_福德宮: "內心競爭高、想法快、常自我較勁",
    食神_福德宮: "享受生活、心情好時運勢也好",
    傷官_福德宮: "思維快、創意多、易胡思亂想",
    偏財_福德宮: "精神靠人脈與活動補能",
    正財_福德宮: "心穩定、務實、情緒起伏小",
    七殺_福德宮: "內心壓力強、自我要求高",
    正官_福德宮: "精神端正、重規律、壓力不外露",
    偏印_福德宮: "精神敏感、靈感強、避世傾向",
    正印_福德宮: "心柔軟、需要情感支持與陪伴",
    比肩_父母宮: "長輩自主強、互動平等、距離感明顯",
    劫財_父母宮: "長輩強勢、要求高、衝突後成長",
    食神_父母宮: "家庭氣氛輕鬆、生活感強",
    傷官_父母宮: "溝通直白、易衝突、但透明",
    偏財_父母宮: "家中外緣旺、人情往來多",
    正財_父母宮: "家庭務實、重紀律與責任",
    七殺_父母宮: "管教嚴厲、壓力教育、行動快",
    正官_父母宮: "端正傳統、重禮法、教養嚴謹",
    偏印_父母宮: "長輩想法奇特、情感距離大",
    正印_父母宮: "家庭溫和、照顧較多、偏保護",
  };

  /**
   * 五行 × 12 宮：60 格敘述（AI 用）
   * Key: "五行_宮位"，宮位用 命宮、兄弟宮、…、交友宮
   */
  const WUXING_PALACE_DESCRIPTION = {
    木_命宮: "成長欲強、想突破、行動快、容易急躁",
    木_兄弟宮: "手足互激、學習多、理念相近、競爭正向",
    木_夫妻宮: "關係求成長、講道理、易衝動說重話",
    木_子女宮: "孩子好奇強、學習快、性子直、需要引導",
    木_財帛宮: "靠創意賺錢、投資易衝動、起伏快",
    木_疾厄宮: "肝膽筋系較敏、壓力來時怒氣重",
    木_遷移宮: "外地學習機會多、跑動旺、拓展快",
    木_交友宮: "朋友講理念、互相成長、互推互拉",
    木_官祿宮: "職涯求突破、創新快、易躁進",
    木_田宅宮: "家中愛布置、喜植物木質、變動頻繁",
    木_福德宮: "心思活、想很多、靠成長感補能",
    木_父母宮: "父母講理、多規劃、期待高",
    火_命宮: "行動快、情緒直、衝勁強、容易上火",
    火_兄弟宮: "手足易吵快和、氛圍熱、互相點燃",
    火_夫妻宮: "熱情強、速度快、愛恨明顯、爭執也快",
    火_子女宮: "孩子活潑、脾氣快、反應快、需要耐心",
    火_財帛宮: "財來快、花更快、衝動買賣、高波動",
    火_疾厄宮: "心血管火氣重、易發炎、急性症",
    火_遷移宮: "外地節奏快、易冒險、行動力高",
    火_交友宮: "朋友熱情、玩樂多、衝動決策",
    火_官祿宮: "事業衝刺型、績效快、壓力極大",
    火_田宅宮: "居家火氣旺、活動多、噪音或熱象",
    火_福德宮: "情緒火旺、喜刺激、靠興奮補能",
    火_父母宮: "父母火性強、教育直接、容易急",
    土_命宮: "穩重務實、節奏慢、抗壓強、重安全",
    土_兄弟宮: "手足務實、互助、講責任、氣氛沉穩",
    土_夫妻宮: "伴侶務實、重承諾、節奏慢但可靠",
    土_子女宮: "孩子穩定慢熱、固執、學習需耐心",
    土_財帛宮: "財務穩健、累積型、慢但持久",
    土_疾厄宮: "脾胃弱、消化波動、壓力易脹氣",
    土_遷移宮: "外地務實發展、慢起步但穩",
    土_交友宮: "朋友可靠、圈子小、互相扶持",
    土_官祿宮: "職涯穩固、升遲但穩、耐久型",
    土_田宅宮: "重房產、喜穩定居所、家務厚實",
    土_福德宮: "心靜穩、靠規律補能、慢活風",
    土_父母宮: "父母務實、嚴謹、重責任",
    金_命宮: "講標準、行動果斷、重原則、易緊繃",
    金_兄弟宮: "手足強勢、易比較、講是非、規矩重",
    金_夫妻宮: "伴侶講道理、重承諾、易批評但負責任",
    金_子女宮: "孩子講規矩、易緊繃、責任感強",
    金_財帛宮: "財務清晰、重紀律、適合制度財",
    金_疾厄宮: "肺呼吸弱、易緊繃、筋骨緊張",
    金_遷移宮: "外地講效率、重制度、行動果斷",
    金_交友宮: "朋友務實、講是非、界線明",
    金_官祿宮: "適合管理、制度工作、效率極高",
    金_田宅宮: "家中乾淨、重秩序、有鐵性物",
    金_福德宮: "精神講規則、容易壓抑、靠秩序補能",
    金_父母宮: "父母嚴、重規矩、要求高",
    水_命宮: "思考快、直覺強、善觀察、情緒波動大",
    水_兄弟宮: "手足易敏感、情緒流動多、話多",
    水_夫妻宮: "伴侶情緒細膩、想很多、需要被理解",
    水_子女宮: "孩子聰明、反應快、敏感需安全感",
    水_財帛宮: "靠流動財、人脈財、彈性大、變化快",
    水_疾厄宮: "腎水弱、睡眠影響大、情緒連動身體",
    水_遷移宮: "外地適彈性工作、靠智慧與觀察力",
    水_交友宮: "朋友圈感性、互相支持、情感多",
    水_官祿宮: "職涯需流動性、善溝通、適彈性角色",
    水_田宅宮: "家中靠水能量、易潮濕、重氛圍",
    水_福德宮: "心敏感、靠獨處與音樂補能",
    水_父母宮: "父母感性、情緒化、互動需耐心",
  };

  /** 計算用：五行列表、宮位列表（與 PALACE_ORDER 對應的「帶宮」key 用於 DESCRIPTION 查詢） */
  const WUXING_PALACE_BASE = {
    wuxingList: ["木", "火", "土", "金", "水"],
    palaceOrder: PALACE_ORDER,
    palaceToRoleKey: PALACE_TO_ROLE_KEY,
  };

  /**
   * 依八字四柱天干，為 12 宮指派十神（每宮一顆，且盡量落在該宮候選內）
   * @param {Object} bazi - 八字物件，需含年/月/日/時天干。支援 bazi.display.yG/mG/dG/hG 或 bazi.year/month/day/hour.stem
   * @param {Object} [options] - { tenGodFromStems: (dayStem, otherStem) => string } 若未傳則用 window.CalcHelpers.tenGodFromStems
   * @returns {Record<string, string>} 宮位簡稱 → 十神，key 為 命宮、兄弟、夫妻、子女、財帛、疾厄、遷移、僕役、官祿、田宅、福德、父母
   */
  function assignTenGodByPalace(bazi, options) {
    var tenGodFromStems = (options && options.tenGodFromStems) || (typeof window !== "undefined" && window.CalcHelpers && window.CalcHelpers.tenGodFromStems);
    if (!tenGodFromStems) {
      return {};
    }
    var yS = (bazi.display && bazi.display.yG) || (bazi.year && bazi.year.stem) || "";
    var mS = (bazi.display && bazi.display.mG) || (bazi.month && bazi.month.stem) || "";
    var dS = (bazi.display && bazi.display.dG) || (bazi.day && bazi.day.stem) || "";
    var hS = (bazi.display && bazi.display.hG) || (bazi.hour && bazi.hour.stem) || "";
    if (!dS) return {};

    /** 宮位簡稱 → 對應柱天干（八字 12 宮對應四柱的簡化：命宮=日、兄弟=月、夫妻=時、子女=年、財帛=月、疾厄=年、遷移=時、僕役=月、官祿=年、田宅=月、福德=日、父母=年） */
    var palaceToStem = {
      命宮: dS,
      兄弟: mS,
      夫妻: hS,
      子女: yS,
      財帛: mS,
      疾厄: yS,
      遷移: hS,
      僕役: mS,
      官祿: yS,
      田宅: mS,
      福德: dS,
      父母: yS,
    };

    var out = {};
    for (var i = 0; i < PALACE_ORDER.length; i++) {
      var palace = PALACE_ORDER[i];
      var stem = palaceToStem[palace];
      if (!stem) continue;
      var roleKey = PALACE_TO_ROLE_KEY[palace];
      var candidates = TEN_GOD_PALACE_ROLE[roleKey];
      if (!candidates || candidates.length === 0) continue;
      var tenGod = tenGodFromStems(dS, stem);
      if (tenGod && candidates.indexOf(tenGod) !== -1) {
        out[palace] = tenGod;
      } else {
        out[palace] = candidates[0];
      }
    }
    return out;
  }

  /**
   * 依八字四柱天干，為 12 宮指派五行（天干 → 木火土金水，宮位→柱與十神同一套）
   * @param {Object} bazi - 八字物件，需含年/月/日/時天干。支援 bazi.display.yG/mG/dG/hG 或 bazi.year/month/day/hour.stem
   * @returns {Record<string, string>} 宮位簡稱 → 五行（木、火、土、金、水），key 為 命宮、兄弟、夫妻、…、僕役、…、父母
   */
  function assignWuxingByPalace(bazi) {
    var yS = (bazi.display && bazi.display.yG) || (bazi.year && bazi.year.stem) || "";
    var mS = (bazi.display && bazi.display.mG) || (bazi.month && bazi.month.stem) || "";
    var dS = (bazi.display && bazi.display.dG) || (bazi.day && bazi.day.stem) || "";
    var hS = (bazi.display && bazi.display.hG) || (bazi.hour && bazi.hour.stem) || "";
    var stemByPillar = { year: yS, month: mS, day: dS, hour: hS };
    var out = {};
    for (var i = 0; i < PALACE_ORDER.length; i++) {
      var palace = PALACE_ORDER[i];
      var pillar = PALACE_TO_PILLAR_FOR_WUXING[palace];
      if (!pillar) continue;
      var stem = stemByPillar[pillar];
      if (!stem) continue;
      var wuxing = STEM_TO_WUXING[stem];
      if (wuxing) out[palace] = wuxing;
    }
    return out;
  }

  /**
   * 取得「十神_宮位」敘述（給 AI 技術依據用）
   * @param {string} tenGod - 十神名
   * @param {string} palaceKey - 宮位（命宮、兄弟、夫妻、…、僕役、…），會自動轉 僕役→交友宮
   */
  function getTenGodPalaceDescription(tenGod, palaceKey) {
    var roleKey = PALACE_TO_ROLE_KEY[palaceKey] || palaceKey;
    return TEN_GOD_PALACE_DESCRIPTION[tenGod + "_" + roleKey] || "";
  }

  /**
   * 取得「五行_宮位」敘述（給 AI 用）
   * @param {string} wuxing - 五行（木、火、土、金、水）
   * @param {string} palaceKey - 宮位簡稱，會轉 僕役→交友宮
   */
  function getWuxingPalaceDescription(wuxing, palaceKey) {
    var roleKey = PALACE_TO_ROLE_KEY[palaceKey] || palaceKey;
    return WUXING_PALACE_DESCRIPTION[wuxing + "_" + roleKey] || "";
  }

  if (typeof window !== "undefined") {
    window.LifeBookPalaceConstants = {
      PALACE_ORDER: PALACE_ORDER,
      PALACE_TO_ROLE_KEY: PALACE_TO_ROLE_KEY,
      STEM_TO_WUXING: STEM_TO_WUXING,
      PALACE_TO_PILLAR_FOR_WUXING: PALACE_TO_PILLAR_FOR_WUXING,
      TEN_GOD_PALACE_ROLE: TEN_GOD_PALACE_ROLE,
      TEN_GOD_PALACE_DESCRIPTION: TEN_GOD_PALACE_DESCRIPTION,
      WUXING_PALACE_DESCRIPTION: WUXING_PALACE_DESCRIPTION,
      WUXING_PALACE_BASE: WUXING_PALACE_BASE,
      assignTenGodByPalace: assignTenGodByPalace,
      assignWuxingByPalace: assignWuxingByPalace,
      getTenGodPalaceDescription: getTenGodPalaceDescription,
      getWuxingPalaceDescription: getWuxingPalaceDescription,
    };
  }
  if (typeof module !== "undefined" && module.exports) {
    module.exports = {
      PALACE_ORDER,
      PALACE_TO_ROLE_KEY,
      STEM_TO_WUXING,
      PALACE_TO_PILLAR_FOR_WUXING,
      TEN_GOD_PALACE_ROLE,
      TEN_GOD_PALACE_DESCRIPTION,
      WUXING_PALACE_DESCRIPTION,
      WUXING_PALACE_BASE,
      assignTenGodByPalace,
      assignWuxingByPalace,
      getTenGodPalaceDescription,
      getWuxingPalaceDescription,
    };
  }
})();
