/**
 * 戰略聯動文案庫
 * key 格式對齊 M7：overlay.xxx、ji_clash.xxx、hidden_merge.xxx、body_move_hint.xxx、lu_gain.xxx、lu_flow.xxx
 * lu_flow 查表時用 key + ".leak" 或 ".compound"
 */

export interface StrategicPhraseEntry {
  title: string;
  summary: string;
  advice: string;
}

/** 戰略聯動 key → { title, summary, advice }，key 為 M7 輸出的 Capitalized 格式 */
export const StrategicPhrases: Record<string, StrategicPhraseEntry> = {
  // ========================= overlay：流年 A 壓原命 B
  "overlay.Wealth_over_Parents": {
    title: "賺錢綁在長輩與制度上",
    summary:
      "今年的賺錢節奏，被長輩、主管或制度牢牢牽著走。妳不是在自由市場打仗，而是在跟規則溝通。",
    advice:
      "要會看臉色，也要看規則。與其硬衝，不如先搞懂上層邏輯，讓自己站在制度縫隙裡賺錢。",
  },
  "overlay.Wealth_over_Property": {
    title: "財帛壓田宅：錢都砸在空間跟房子",
    summary:
      "今年很多錢會自然流向房子、裝修、搬家或空間改善。財帛宮壓在田宅宮，代表「住哪裡」就是今年最大的財務議題。",
    advice:
      "花錢可以，但要分清楚是買安全感，還是買壓力。先算清楚現金流，再決定要不要升級居住條件。",
  },
  "overlay.Career_over_Self": {
    title: "事業壓命宮：工作全面接管人生",
    summary:
      "流年官祿壓在命宮，妳今年會很難把自己從工作中抽離。一舉一動都跟職涯綁在一起，很容易把自我價值全部交給「表現」。",
    advice:
      "可以拼，但別把自尊綁在 KPI 上。適度保持一點和工作無關的生活空間，才不會在失利時整個人一起垮。",
  },
  "overlay.Travel_over_Self": {
    title: "遷移壓命宮：人生主線在移動中展開",
    summary:
      "今年所有重要事件都會在「離開原本位置」時發生。流年遷移壓命宮，代表妳只要一動，就會遇到關鍵轉折。",
    advice:
      "不要守著原地等機會。多出去看、多跑、多換場景，妳的貴人和新劇本都在外面。",
  },
  "overlay.Self_over_Career": {
    title: "命宮壓官祿：人比職稱更重要",
    summary:
      "今年的焦點在妳這個人本身，而不是頭銜。流年命宮壓官祿，妳會被迫面對「到底想成為什麼樣的人」，而不只是「做什麼工作」。",
    advice:
      "把焦點從「我在做什麼職位」轉成「我在長成什麼樣的自己」。職涯的調整會跟自我定位一起發生。",
  },
  "overlay._generic": {
    title: "兩宮疊加：今年的主戰場",
    summary:
      "今年流年的焦點，落在【流年宮位】疊在【原命宮位】的那條軸線上。這兩個主題會被放大、交織，妳會被迫同時處理它們。",
    advice:
      "不要把事情拆開看。今年的課題不是單一面向，而是這兩個領域互相牽動後，妳要怎麼重新排優先順序。",
  },

  // ========================= ji_clash：化忌＋對宮
  "ji_clash.Travel_to_Self": {
    title: "外力撞擊命宮：人被事件推著走",
    summary:
      "今年的壓力來自外部情勢與環境變化，不是妳主動招惹。流年忌在遷移，沖命宮，妳會覺得「世界在推著妳動」。",
    advice:
      "與其硬撐，不如先承認局勢在變。建立備案、分散風險，把自己從單一選項中抽離。",
  },
  "ji_clash.Wealth_to_Parents": {
    title: "財忌沖父母：錢與長輩關係卡關",
    summary:
      "財帛有忌，沖到父母宮，代表今年的金錢壓力，會經由長輩、權威或制度顯現。可能是孝親支出、家族債務、或與主管在資源上拉扯。",
    advice:
      "該給的可以給，但要先算好上限與界線。不要用一時的愧疚感，去換一輩子的財務枷鎖。",
  },
  "ji_clash.Property_to_Career": {
    title: "田宅忌沖官祿：家與事業互相拉扯",
    summary:
      "房子、家務或家庭糾紛，會直接影響妳的工作表現。妳會有「人在上班，心在處理家裡的火」的感覺。",
    advice:
      "先把最耗能的家務問題切割出來，不要讓它們流到工作時段。必要時尋求外部協助，別假裝自己能一打十。",
  },
  "ji_clash.Career_to_Property": {
    title: "事業忌沖田宅：工作把家炸出一個洞",
    summary:
      "這一年工作上的壓力，會直接沖擊妳的居住品質與家中關係。可能是長期加班、異地、或情緒帶回家。",
    advice:
      "下班後要有儀式感，把工作情緒留在門外。家是妳的充電站，不是續攤戰場。",
  },
  "ji_clash._generic": {
    title: "忌星沖對宮：主題被撕裂",
    summary:
      "這是一種「這裡出事，那裡崩潰」的格局。化忌落在一宮，卻用對宮來承擔後果，妳會覺得事情總是「牽一髮動全身」。",
    advice:
      "不要只盯著出事的那一點。去看被沖的那一宮，真正需要止血和調整的，其實在那裡。",
  },

  // ========================= hidden_merge：暗合
  "hidden_merge.Children_Spouse": {
    title: "子女暗合夫妻：感情被第三方牽動",
    summary:
      "妳以為感情問題只在兩個人之間，其實背後有第三個角色在牽引：小孩、合作夥伴，或妳投入的專案。",
    advice:
      "不要只是跟伴侶吵。回頭看看「妳們共同照顧的東西」——孩子、公司、專案，才是情緒真正的戰場。",
  },
  "hidden_merge.Wealth_Property": {
    title: "財帛暗合田宅：錢與房子的暗線",
    summary:
      "表面上是賺錢或花錢，底層其實在處理安全感與居住狀態。妳怎麼賺、怎麼花，最後都會反映在妳住在哪、怎麼住。",
    advice:
      "每一筆大額支出前，問自己一句：這是在買面子，還是在買長期的安穩？",
  },
  "hidden_merge.Self_Friends": {
    title: "命宮暗合交友：人際關係塑造妳的自我",
    summary:
      "妳看起來在經營朋友，其實是在經營「自己想成為什麼樣的人」。妳選的圈子，就是妳未來的樣子。",
    advice:
      "慎選圈子。長期相處的人，比妳的出身更決定妳會長成什麼樣子。",
  },
  "hidden_merge.Friends_Self": {
    title: "命宮暗合交友：人際關係塑造妳的自我",
    summary:
      "妳看起來在經營朋友，其實是在經營「自己想成為什麼樣的人」。妳選的圈子，就是妳未來的樣子。",
    advice:
      "慎選圈子。長期相處的人，比妳的出身更決定妳會長成什麼樣子。",
  },
  "hidden_merge._generic": {
    title: "兩宮暗合：表面無事，背後有線",
    summary:
      "暗合是一種「表面看不出來，但兩宮互相牽動」的鏈結。妳以為 A 宮沒事，其實壓力是從對應的那一宮慢慢滲透過來。",
    advice:
      "當妳覺得某個領域問題怎麼解都解不開時，試著往暗合的那一宮看，答案可能藏在那裡。",
  },

  // ========================= body_move_hint：身宮位移
  "body_move_hint.travel_static": {
    title: "身宮在遷移：身想跑，腳沒動",
    summary:
      "妳的身宮在遷移，代表後半生真正的成就感在「位移」裡。但近年妳把自己鎖在同一個地方，很悶是正常的。",
    advice:
      "安排真正的位移，而不是只在原地換姿勢。換城市、換圈子、換辦公桌，都是一種重新呼吸。",
  },
  "body_move_hint.career_static": {
    title: "身宮在官祿：身綁在職涯上",
    summary:
      "妳的身宮在官祿，代表妳後半生是用「工作成就」在定義自己。若長期不換角色、不升級戰場，壓力會變成自我懷疑。",
    advice:
      "不要只撐在同一個職稱裡。設計一個能讓自己換視角的變動——職責調整、專案轉型、或升級自己的專業。",
  },
  "body_move_hint.travel": {
    title: "身宮在遷移：身想跑，腳沒動",
    summary:
      "妳的身宮在遷移，代表後半生真正的成就感在「位移」裡。但近年妳把自己鎖在同一個地方，很悶是正常的。",
    advice:
      "安排真正的位移，而不是只在原地換姿勢。換城市、換圈子、換辦公桌，都是一種重新呼吸。",
  },
  "body_move_hint.career": {
    title: "身宮在官祿：身綁在職涯上",
    summary:
      "妳的身宮在官祿，代表妳後半生是用「工作成就」在定義自己。若長期不換角色、不升級戰場，壓力會變成自我懷疑。",
    advice:
      "不要只撐在同一個職稱裡。設計一個能讓自己換視角的變動——職責調整、專案轉型、或升級自己的專業。",
  },

  // ========================= lu_gain：祿入口
  "lu_gain.Self": {
    title: "祿在命宮：機會直接落在妳身上",
    summary:
      "今年容易有「被點名」的機會，機會不是經由別人，而是直接要妳出來扛。",
    advice:
      "選對戰場。不是每個機會都要接，但一旦接了，就要全力以赴。",
  },
  "lu_gain.Wealth": {
    title: "祿在財帛：錢比較好賺的一年",
    summary:
      "今年的現金流相對友善，努力會看得到實際報酬。",
    advice:
      "先把主業做厚，把最穩的那條收入管道拉滿，再考慮分散。",
  },
  "lu_gain.Career": {
    title: "祿在官祿：職涯打開一扇門",
    summary:
      "今年在工作、職稱、角色上，有明顯的升級機會。妳會被看見，或被推到一個新位置。",
    advice:
      "任何可以讓妳抬頭變高、責任變清楚的變動，都值得認真評估。",
  },
  "lu_gain.Travel": {
    title: "祿在遷移：動起來就有好事",
    summary:
      "祿落在遷移宮，妳一動就有機會。出差、外派、出國、跨界合作，都會帶來實質好處。",
    advice:
      "不要把自己鎖在一個地點或一種生活方式。刻意製造位移，妳的運勢就會被帶起來。",
  },
  "lu_gain.Property": {
    title: "祿在田宅：空間與房產帶來轉機",
    summary:
      "今年在房產、居住空間、家中環境上，會有明顯的改善或機會。",
    advice:
      "不要衝動買房，但可以認真思考『哪個空間對妳來說才是真正的基地』。",
  },
  "lu_gain._generic": {
    title: "祿進某宮：那一宮是今年的福位",
    summary:
      "祿落在哪一宮，那一宮的主題就比較容易「努力有反應」。",
    advice:
      "把時間和資源往祿所在的宮位多移一點，會比平均分散更有效率。",
  },

  // ========================= lu_flow：祿流向（.leak / .compound）
  "lu_flow.Wealth_to_Children.leak": {
    title: "賺得到，守不住：錢漏在子女／作品上",
    summary:
      "今年賺錢不是問題，問題是錢會很自然流進小孩、學生、作品或合夥案裡，而且常常超出預期。",
    advice:
      "在給之前先想好上限，把情緒和金額切開。該投資的先寫成計畫，不要被臨時的心軟吃掉未來。",
  },
  "lu_flow.Wealth_to_Children.compound": {
    title: "投資下一代與作品的複利年",
    summary:
      "妳把錢放在子女、學生、作品或合夥案上，長期會看到成果。這不是單次花費，而是累積戰力。",
    advice:
      "把對方當成專案經營：設目標、設期限、設回收標準。這樣投入才會變成複利，而不是無止盡的消耗。",
  },
  "lu_flow.Wealth_to_Property.leak": {
    title: "錢鎖在磚頭裡：房產壓力年",
    summary:
      "今年很容易把大部分資源鎖在房貸、裝修或居住成本裡，短期看起來很體面，長期現金流壓力大。",
    advice:
      "不要為了面子買房，也不要為了焦慮大改裝修。先確保自己有足夠的現金緩衝，再談升級空間。",
  },
  "lu_flow.Wealth_to_Property.compound": {
    title: "用空間穩住人生底氣",
    summary:
      "妳把錢放在居住品質與空間上，會換到更穩定的生活節奏與心安感。",
    advice:
      "選擇對的地段與對的空間，把房子當作長期據點，而不是短期炫耀品。",
  },
  "lu_flow.Wealth_to_Friends.leak": {
    title: "人際變成提款機",
    summary:
      "今年容易在聚會、人情、社交關係上出血。短期熱鬧，長期心累又破財。",
    advice:
      "先為社交設一個年度預算，超過就停。不是所有邀約都要答應，也不是所有人的問題都要妳出錢解決。",
  },
  "lu_flow.Wealth_to_Friends.compound": {
    title: "人脈投資年：關係帶來長期案源",
    summary:
      "錢花在對的人脈與圈子上，之後會以合作、案源或機會的形式回來。",
    advice:
      "集中投資在少數真正有長期互惠可能的人身上，不要灑在所有人身上。",
  },
  "lu_flow.Wealth_to_Career.leak": {
    title: "把錢砸進不健康的事業模式裡",
    summary:
      "如果方向不對，妳會不斷把錢丟回一個已經在漏水的事業結構，結果只是在延長痛苦。",
    advice:
      "先檢查商業模式能不能活下去，再談加碼。不要用加班和資金，去拖延一個必須結束的階段。",
  },
  "lu_flow.Wealth_to_Career.compound": {
    title: "把賺到的錢砸回自己實力上",
    summary:
      "這是一個適合『賺了再投回自己事業』的年。妳在專業、系統和品牌上的投資，會帶來下一輪的抬升。",
    advice:
      "優先把錢用在提升能力與提高單價的地方，而不是單純擴張規模。",
  },
  "lu_flow.Career_to_Wealth.leak": {
    title: "工作很多，錢不一定跟上",
    summary:
      "妳可能會忙到飛天，但薪水和實際收入沒有成比例成長，容易有被剝削感。",
    advice:
      "重新談條件、調整接案方式，或思考是不是該把力氣換到更有價值的舞台上。",
  },
  "lu_flow.Career_to_Wealth.compound": {
    title: "抬頭變現的一年",
    summary:
      "職涯上的調整會直接反映在收入上，妳的頭銜與定位，正在被市場認可。",
    advice:
      "勇敢談加薪、分潤或調整收費方式。別再低估自己的產值。",
  },
  "lu_flow.Travel_to_Wealth.leak": {
    title: "亂跑只會變成花錢",
    summary:
      "如果沒有明確目的，出差、旅行、跑來跑去，只會變成一種昂貴的逃避。",
    advice:
      "每一次移動前，先想清楚帶回來的是什麼——人脈、知識、合作機會，還是單純的透氣。",
  },
  "lu_flow.Travel_to_Wealth.compound": {
    title: "動起來就會有錢",
    summary:
      "妳的收入和移動直接連動。外地市場、外國機會、跨領域合作，都會帶來實質金流。",
    advice:
      "主動為自己設計「帶得回東西」的旅行與出差。每一次動身都帶著明確的任務。",
  },
  "lu_flow.Karma_to_Career.leak": {
    title: "想很多，做很少的焦慮年",
    summary:
      "妳會花很多時間在思考、猶豫與想像理想工作，但真正的行動不多，久了會變成對自己的失望。",
    advice:
      "每一輪思考後，強迫自己做一個小小的實驗。不要只在腦內 pivot，要在現實世界動一次。",
  },
  "lu_flow.Karma_to_Career.compound": {
    title: "認知升級，職涯跟著升級",
    summary:
      "妳在價值觀與世界觀上的更新，會直接把妳帶到新的工作位置與合作層級。",
    advice:
      "刻意讓自己接觸更高一階的對話與環境，妳就會被往那個層級拉。",
  },
  "lu_flow.Wealth_to_Karma.leak": {
    title: "把錢花在短暫的快樂上",
    summary:
      "今年容易把錢花在療癒、自我安慰、小確幸上，短期舒服，長期空。",
    advice:
      "給自己一點快樂預算可以，但不要拿未來的安全感去換現在的麻醉。",
  },
  "lu_flow.Wealth_to_Karma.compound": {
    title: "用錢換認知與覺醒",
    summary:
      "如果妳把錢花在學習、內在整理與長期陪伴上，這些投入會變成妳未來的判斷力與底氣。",
    advice:
      "優先選擇會讓妳「看得更清楚」的投資，而不是只是讓妳「暫時好過」的消費。",
  },
  "lu_flow._generic.leak": {
    title: "祿變成漏洞",
    summary:
      "這筆錢或資源進得來，但最後會在另一個地方形成長期消耗。妳會覺得「有賺到，卻沒守住」。",
    advice:
      "先看清楚它最後會被花在哪裡，再決定要不要接這筆祿。不是所有進帳都值得全收。",
  },
  "lu_flow._generic.compound": {
    title: "祿變成複利",
    summary:
      "這筆資源進來後，還有機會在另一個宮位放大效果，變成妳未來幾年的底氣。",
    advice:
      "刻意把它導向對的地方，讓它變成長期可持續的資產，而不是一次性的煙火。",
  },
};

export interface StrategicLinkLike {
  type?: string;
  key?: string;
  isLeak?: boolean;
  isCompound?: boolean;
}

/**
 * 依 strategicLinks 查表組出文案（summary + advice），供命書 prompt 使用。
 * 查不到時用該 type 的 _generic；lu_flow 用 key + ".leak" / ".compound" 再 fallback 到 lu_flow._generic.leak / .compound。
 */
export function getStrategicText(links: StrategicLinkLike[]): string {
  if (!links || links.length === 0) return "";
  const lines: string[] = [];
  for (const link of links) {
    const type = link.type ?? "";
    const key = link.key ?? "";
    let phraseKey = key;
    if (type === "lu_flow") {
      phraseKey = key + (link.isLeak ? ".leak" : ".compound");
    }
    let entry = StrategicPhrases[phraseKey];
    if (!entry && type) {
      if (type === "lu_flow") {
        entry = link.isLeak
          ? StrategicPhrases["lu_flow._generic.leak"]
          : StrategicPhrases["lu_flow._generic.compound"];
      } else {
        entry = StrategicPhrases[`${type}._generic`];
      }
    }
    if (entry) {
      lines.push(`・${entry.title}\n  ${entry.summary}\n  建議：${entry.advice}`);
    }
  }
  return lines.join("\n\n");
}
