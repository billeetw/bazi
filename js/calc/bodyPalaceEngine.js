/* bodyPalaceEngine.js
 * 身宮在 12 宮：行為矩陣、命身錯位、雙忌（同一顆引擎，UI 輕量 / 命書 Pro）
 * 依賴: calc/constants.js (PALACE_DEFAULT, BRANCH_RING)
 */

(function () {
  "use strict";

  if (typeof window === "undefined" || !window.CalcConstants) {
    throw new Error("bodyPalaceEngine.js requires CalcConstants (PALACE_DEFAULT, BRANCH_RING)");
  }

  const PALACE_DEFAULT = window.CalcConstants.PALACE_DEFAULT || [
    "命宮", "兄弟", "夫妻", "子女", "財帛", "疾厄",
    "遷移", "僕役", "官祿", "田宅", "福德", "父母",
  ];
  const BRANCH_RING = window.CalcConstants.BRANCH_RING || [
    "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥", "子", "丑",
  ];

  /** 中文宮位名 → 英文 PalaceId（小寫，與 BODY_COPY key 一致） */
  const ZH_TO_PALACE_ID = {
    "命宮": "self", "兄弟": "siblings", "夫妻": "spouse", "子女": "children",
    "財帛": "wealth", "疾厄": "health", "遷移": "travel", "僕役": "friends",
    "官祿": "career", "田宅": "property", "福德": "fortune", "父母": "parents",
  };

  /** 身宮一般文案：UI 輕量（title, oneLiner, tip）+ 命書 Pro（core[], advice[]） */
  const BODY_COPY = {
    self: {
      ui: {
        title: "命身同宮：想法與行為是同一條線",
        oneLiner: "妳很清楚自己要什麼，也不太會被別人帶走。",
        tip: "保持這種一致性，但記得挑戰要挑對，不然只是白費力。",
      },
      pro: {
        core: [
          "天性與行為重疊度高，基本上妳想的就是妳會去做的。",
          "這讓妳的方向感比一般人穩，但轉彎速度慢。",
        ],
        advice: [
          "重點不是『做很多事』，而是『把不該做的剔掉』。",
          "遇到不熟的領域，讓別人參與一小段決策能降低風險。",
        ],
      },
    },
    siblings: {
      ui: {
        title: "身宮在兄弟：關係會佔據妳的人生版圖",
        oneLiner: "妳對『自己人』的定義很深，所以也容易被捲進去。",
        tip: "情義可以，但界線一定要清楚。特別是牽涉到錢的時候。",
      },
      pro: {
        core: [
          "中年後，妳會把很多時間與資源放在兄弟姊妹、朋友或戰友身上。",
          "這些人一好，妳就好；他們一亂，妳也跟著被拉下來。",
        ],
        advice: [
          "所有跟責任有關的事情都用白紙黑字，省得以後翻舊帳。",
          "幫忙可以，但不要取代別人的人生—那不是妳的工作。",
        ],
      },
    },
    spouse: {
      ui: {
        title: "身宮在夫妻：感情位置高，影響也大",
        oneLiner: "妳的行為會很自然地跟『另一半』綁在一起。",
        tip: "關係沒問題時，妳會走得快；關係不穩時，妳會整盤卡住。",
      },
      pro: {
        core: [
          "妳的行動邏輯常常以伴侶為中心。感情順，人生順；感情亂，人生亂。",
          "妳不是依賴，而是天生把親密關係視為人生主線。",
        ],
        advice: [
          "看感情，要看對方的底層價值觀，而不是情緒上的貼合。",
          "適度保持自己的空間，這樣關係震盪時妳不會整個人掉下去。",
        ],
      },
    },
    children: {
      ui: {
        title: "身宮在子女：妳是『傳承型』的人",
        oneLiner: "妳會把力氣放在下一代、學生或自己的作品上。",
        tip: "先把自己站穩，妳給的才是養分，不是壓力。",
      },
      pro: {
        core: [
          "妳習慣扛責任、帶人、培育人，這是妳的天性。",
          "後半生的很多選擇都會圍繞著『誰是妳要投資的人或作品』。",
        ],
        advice: [
          "不要把所有期待壓在一個人身上，那會拖垮關係。",
          "妳的能力越高，妳能給下一代的空間就越大，所以優先投資自己。",
        ],
      },
    },
    wealth: {
      ui: {
        title: "身宮在財帛：安全感來自可控的現金流",
        oneLiner: "錢不只是錢，是妳感到踏實的來源。",
        tip: "小心『越焦慮越想賺』的循環，這會把妳推進耗損。",
      },
      pro: {
        core: [
          "妳很清楚錢的重要性，也願意為它投入。",
          "妳不是貪婪，而是需要看到數字才安心。",
        ],
        advice: [
          "只投資妳看得懂的工具，其他的都先放著。",
          "把收入、儲蓄、風險分成不同桶，能讓妳更安心。",
        ],
      },
    },
    health: {
      ui: {
        title: "身宮在疾厄：妳的身體影響妳的表現",
        oneLiner: "體能、情緒、精神狀態，會直接決定妳能不能動。",
        tip: "所有小問題，早處理比晚處理省很多成本。",
      },
      pro: {
        core: [
          "妳對身體狀態很敏感，任何小失衡都會被妳放大感受。",
          "如果過度壓榨自己，身體會第一個示警。",
        ],
        advice: [
          "運動是妳最有效的穩定器，比什麼療法都便宜也可靠。",
          "不要等症狀累積，一有異常就交給醫療體系。",
        ],
      },
    },
    travel: {
      ui: {
        title: "身宮在遷移：妳的舞台在遠處",
        oneLiner: "妳的人生主線在『移動』，不在原地。",
        tip: "不必強迫自己定著，妳的貴人通常在外面。",
      },
      pro: {
        core: [
          "妳的成長速度跟『移動頻率』正相關。地方越大，妳的格局越開。",
          "原地不動會讓妳窒息，這不是不穩定，是妳需要空間。",
        ],
        advice: [
          "主動增加跟外界的接觸，遠方的資源會給妳推力。",
          "把每次移動都當成『升級』，不要只是換環境。",
        ],
      },
    },
    friends: {
      ui: {
        title: "身宮在交友：人際即資源",
        oneLiner: "妳對人群有敏銳度，也容易被社交綁住。",
        tip: "圈子要換成『對妳有效』的人，而不是人多的地方。",
      },
      pro: {
        core: [
          "妳的能量來自人，不是物質。圈子一換，人生整個會動。",
          "但妳也很容易在關係裡付出過頭。",
        ],
        advice: [
          "先定義『有效的關係』，而不是讓所有人進入妳的生活。",
          "注意避免成為別人的情緒回收桶，那會拖垮妳。",
        ],
      },
    },
    career: {
      ui: {
        title: "身宮在官祿：工作是妳的主線任務",
        oneLiner: "妳的能量來自產能，沒事做反而不安。",
        tip: "忙不是問題，但忙對方向才是妳的關鍵。",
      },
      pro: {
        core: [
          "妳的價值感有一大部分跟『產出』綁在一起。",
          "對妳來說，工作不是謀生，是自我定義。",
        ],
        advice: [
          "找一個能做長期的領域，而不是只靠任務堆積自信。",
          "把工作分成『累積型』和『耗損型』，優先累積。",
        ],
      },
    },
    property: {
      ui: {
        title: "身宮在田宅：妳需要一個能撐住妳的基地",
        oneLiner: "房子、家庭、土地，是妳的現實底氣。",
        tip: "空間選對，人生順；空間選錯，整盤亂。",
      },
      pro: {
        core: [
          "妳對生活空間很敏感，那是妳的能量來源。",
          "家的狀況好不好，會直接決定妳的人生狀態。",
        ],
        advice: [
          "買房前先想清楚這是安全感需求還是面子需求，兩者差別很大。",
          "任何長期讓妳不舒服的空間，都要重新調整，而不是忍。",
        ],
      },
    },
    fortune: {
      ui: {
        title: "身宮在福德：妳有自己的一套內在系統",
        oneLiner: "後半生妳會越來越重視精神狀態，而不是外在成績。",
        tip: "替自己建立一套心靈 reset 的方法，會非常有用。",
      },
      pro: {
        core: [
          "妳的燃料不是掌聲，而是內在的安定感。",
          "到某個階段後，妳會開始調整人生節奏，不再只追求速度。",
        ],
        advice: [
          "挑一個能讓妳安靜的工具：冥想、占星、紫微或創作都行。",
          "把資訊攝取減到最乾淨，不然容易陷入精神噪音。",
        ],
      },
    },
    parents: {
      ui: {
        title: "身宮在父母：權威是妳的參照點",
        oneLiner: "妳做很多決策時會下意識尋找『上一代的意見』。",
        tip: "適度聽，但不能全聽，不然妳的路會越走越小。",
      },
      pro: {
        core: [
          "妳的人生劇本裡，權威角色（父母、上司、制度）占比很高。",
          "妳不是依賴，而是需要一個基準點來驗證自己的方向。",
        ],
        advice: [
          "成年後要訓練『自己拍板』的能力，這是妳的成長場。",
          "保持距離、保留尊重，但不要讓權威替妳決定人生。",
        ],
      },
    },
  };

  /**
   * 根據身宮地支算出「身宮所在宮位」的宮位名（與 buildSlotsFromZiwei / findShengongPalace 一致）
   * @param {Object} ziwei 紫微命盤（需有 core.shengongBranch, core.minggongBranch）
   * @returns {string|null} 宮位名（命宮、兄弟、…）或 null
   */
  function findShengongPalace(ziwei) {
    if (!ziwei || !ziwei.core) return null;
    const shengongBranch = ziwei.core.shengongBranch;
    const minggongBranch = ziwei.core.minggongBranch || "寅";
    if (!shengongBranch) return null;

    const mingIdx = BRANCH_RING.indexOf(minggongBranch);
    const shenIdx = BRANCH_RING.indexOf(shengongBranch);
    if (mingIdx < 0) return null;
    if (shenIdx < 0) return null;

    const palaceIndex = (mingIdx - shenIdx + 12) % 12;
    return PALACE_DEFAULT[palaceIndex] || null;
  }

  /**
   * 中文宮位名 → PalaceId
   * @param {string} zh 宮位名（命宮、兄弟、…）
   * @returns {string} palaceId（self, siblings, …）
   */
  function zhToPalaceId(zh) {
    if (!zh) return "fortune"; // fallback 福德
    return ZH_TO_PALACE_ID[zh] || "fortune";
  }

  /**
   * 命身錯位說明
   * @param {string} lifePalaceId - PalaceId
   * @param {string} bodyPalaceId - PalaceId
   * @returns {string}
   */
  function getMisalignmentMessage(lifePalaceId, bodyPalaceId) {
    if (lifePalaceId === bodyPalaceId) {
      return "命身同宮：妳的想法與行為在同一條軌道上，人生走向相對清晰。";
    }
    return "命宮與身宮不同宮：前半生多半在演別人的劇本，後半生才開始活出自己的版本。";
  }

  /**
   * 計算身宮報告（供前端 UI 與命書使用）
   * @param {Object} input - { lifePalace: 中文宮位名, bodyPalace: 中文宮位名, doubleJi?: { hasLiuNianJi, hasXiaoXianJi, doubleJiPalace } }
   * @returns {Object} { lifePalace, bodyPalace, behaviorUi, behaviorPro, misalignmentMessage, doubleJiCopy? }
   */
  function computeBodyPalaceReport(input) {
    const lifeZh = input.lifePalace || "命宮";
    const bodyZh = input.bodyPalace || findShengongPalace(input.ziwei) || "福德";
    const lifeId = zhToPalaceId(lifeZh);
    const bodyId = zhToPalaceId(bodyZh);

    const copy = BODY_COPY[bodyId] || BODY_COPY.fortune;
    const behaviorUi = copy.ui;
    const behaviorPro = copy.pro;
    const misalignmentMessage = getMisalignmentMessage(lifeId, bodyId);

    let doubleJiCopy = null;
    if (
      input.doubleJi &&
      input.doubleJi.hasLiuNianJi &&
      input.doubleJi.hasXiaoXianJi &&
      input.doubleJi.doubleJiPalace === bodyId
    ) {
      const BODY_DOUBLE_JI_TEXT = {
        self: { cause: "妳的核心系統被卡住了。", pattern: "妳越想『想清楚再走』，就越想不清楚。", directive: "這一年只需要維持，不需要突破。" },
        siblings: { cause: "妳正在替別人扛本來不屬於妳的問題。", pattern: "妳越出手，事情越複雜。", directive: "停手，讓別人承擔他們自己的劇本。" },
        spouse: { cause: "關係的能量正在把妳往下拉。", pattern: "妳越解釋、越挽回，越站不穩。", directive: "先拉開距離，讓情緒不要替妳決定走向。" },
        children: { cause: "妳替別人急，但對方跟不上妳的節奏。", pattern: "越投入越失衡，越付出越無力。", directive: "改用制度，不要用情緒去推動別人。" },
        wealth: { cause: "妳在補一個補不滿的洞。", pattern: "越急著想賺，越容易做錯判斷。", directive: "把資金凍住，比亂動更安全。" },
        health: { cause: "妳的身體正在示警，別再硬撐。", pattern: "妳越忽略，問題越會被放大。", directive: "立刻交給醫療，不要自行處理。" },
        travel: { cause: "外部環境給不了妳力量。", pattern: "妳越想換地方解決問題，越累。", directive: "今年先穩住原地，把移動降到最低。" },
        friends: { cause: "妳的社交正在流失能量。", pattern: "越想靠圈子，越覺得被掏空。", directive: "縮小人際半徑，把心力收回來。" },
        career: { cause: "工作方向偏掉了。", pattern: "妳越努力證明自己，越被誤會。", directive: "用減法做事，先維持，再調整。" },
        property: { cause: "空間或家庭正在耗妳的底氣。", pattern: "妳越想把它修好，它越失控。", directive: "暫時抽離，物理距離比心理努力有效。" },
        fortune: { cause: "妳的精神能量快用光了。", pattern: "妳越靠意志力撐，越容易崩。", directive: "減少輸入，把腦袋清空，比什麼都重要。" },
        parents: { cause: "權威的壓力正卡住妳的行動。", pattern: "妳越想得到認同，越不自由。", directive: "用制度做決定，不用情緒回應。" },
      };
      doubleJiCopy = BODY_DOUBLE_JI_TEXT[bodyId] || null;
    }

    return {
      lifePalace: lifeId,
      bodyPalace: bodyId,
      bodyPalaceZh: bodyZh,
      behaviorUi,
      behaviorPro,
      misalignmentMessage,
      doubleJiCopy,
    };
  }

  if (typeof window !== "undefined") {
    window.BodyPalaceEngine = {
      findShengongPalace,
      zhToPalaceId,
      computeBodyPalaceReport,
      getMisalignmentMessage,
      BODY_COPY,
    };
  }
})();
