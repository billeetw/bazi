#!/usr/bin/env node
/**
 * 從 hexagrams.json + Gemini 八宮參數，產生 data/iching/lines-384.json
 * 當位：135陽、246陰 = +10
 * 應與：1-4, 2-5, 3-6 陰陽配 = +15
 * 流年加權由 divinationWuxing 依卦宮決定
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const BINARY_TO_KING_WEN = {
  "111111": 1, "000000": 2, "010001": 3, "100010": 4, "010111": 5, "111010": 6,
  "000010": 7, "010000": 8, "110111": 9, "111011": 10, "000111": 11, "111000": 12,
  "111101": 13, "101111": 14, "000100": 15, "001000": 16, "011001": 17, "100110": 18,
  "000011": 19, "110000": 20, "101001": 21, "100101": 22, "100000": 23, "000001": 24,
  "111001": 25, "100111": 26, "100001": 27, "011110": 28, "010010": 29, "101101": 30,
  "011100": 31, "001110": 32, "111100": 33, "001111": 34, "101000": 35, "000101": 36,
  "110101": 37, "101011": 38, "010100": 39, "001010": 40, "100011": 41, "110001": 42,
  "011111": 43, "111110": 44, "011000": 45, "000110": 46, "011010": 47, "010110": 48,
  "011101": 49, "101110": 50, "001001": 51, "100100": 52, "110100": 53, "001011": 54,
  "001101": 55, "101100": 56, "110110": 57, "011011": 58, "110010": 59, "010011": 60,
  "110011": 61, "001100": 62, "010101": 63, "101010": 64,
};

const KING_WEN_TO_BINARY = {};
for (const [k, v] of Object.entries(BINARY_TO_KING_WEN)) {
  KING_WEN_TO_BINARY[v] = k.split("").map(Number);
}

/** 取得卦的六爻陰陽：lines[0]=上爻, lines[5]=初爻 */
function getLineYinYang(hexagramIndex) {
  const bin = KING_WEN_TO_BINARY[hexagramIndex];
  if (!bin) return [0, 0, 0, 0, 0, 0];
  return bin; // 1=陽, 0=陰。index 0=上爻, 5=初爻
}

/** 當位：1,3,5 陽 +10；2,4,6 陰 +10。反之 -10。pos 0-based, 0=初爻 */
function getCorrectScore(yang, pos) {
  const oddPos = (pos % 2) === 0; // pos 0,2,4 = 初三五 = 奇數位
  const shouldBeYang = oddPos;
  return (yang === 1) === shouldBeYang ? 10 : -10;
}

/** 應與：1-4, 2-5, 3-6。pos 0-based。lines 為 [初,二,三,四,五,上] 的陰陽 */
function getResonanceScore(lines, pos) {
  const pairs = [[0, 3], [1, 4], [2, 5]]; // 初-四, 二-五, 三-上
  const pair = pairs.find(([a, b]) => a === pos || b === pos);
  if (!pair) return 0;
  const [a, b] = pair;
  const yinYangA = lines[a];
  const yinYangB = lines[b];
  const isComplement = (yinYangA === 1 && yinYangB === 0) || (yinYangA === 0 && yinYangB === 1);
  return isComplement ? 15 : -15;
}

// Gemini 八宮 384 爻 base_score 與 hint（King Wen 序 1-64）
// 格式：hexagramIndex -> [6 爻的 { base, mag, hint }]，爻序 0=初爻…5=上爻
const LINE_PARAMS = {
  // 乾宮（金）
  1: [{ base: 0, mag: 1, hint: "潛龍勿用：初期壓力大，宜觀望。" }, { base: 15, mag: 2, hint: "見龍在田：雖不當位但有貴人。" }, { base: -10, mag: 3, hint: "夕惕若厲：身處高壓需戒懼。" }, { base: 5, mag: 4, hint: "或躍在淵：考驗轉型智慧。" }, { base: 30, mag: 5, hint: "飛龍在天：登頂但防高處不勝寒。" }, { base: -20, mag: 2, hint: "亢龍有悔：火剋金過頭易崩潰。" }],
  44: [{ base: -15, mag: 1, hint: "繫於金柅：防微杜漸防陰長。" }, { base: 10, mag: 2, hint: "包有魚：內在充實可抗外壓。" }, { base: -5, mag: 3, hint: "臀無膚行次且：處境尷尬。" }, { base: -20, mag: 4, hint: "包無魚：遠離群眾，資源斷絕。" }, { base: 25, mag: 5, hint: "以杞包瓜：高位者的包容智慧。" }, { base: -10, mag: 2, hint: "姤其角：剛猛過頭，孤立無援。" }],
  33: [{ base: -10, mag: 1, hint: "遁尾：危難之際，宜靜不宜動。" }, { base: 20, mag: 2, hint: "執之用黃牛之革：意志堅定。" }, { base: -15, mag: 3, hint: "係遁有疾憊：被瑣事牽絆。" }, { base: 10, mag: 4, hint: "好遁：君子吉，能抽身而退。" }, { base: 25, mag: 5, hint: "嘉遁：正應二爻，退得漂亮。" }, { base: 30, mag: 2, hint: "肥遁：無所疑慮，最為逍遙。" }],
  12: [{ base: -5, mag: 1, hint: "拔茅茹：小人結黨，宜守。" }, { base: 15, mag: 2, hint: "包承：小人吉，君子需包容。" }, { base: -25, mag: 3, hint: "包羞：行為不正，必遭羞辱。" }, { base: 20, mag: 4, hint: "有命無咎：天命轉機開始出現。" }, { base: 30, mag: 5, hint: "大人吉其亡其亡：繫於苞桑。" }, { base: 25, mag: 2, hint: "傾否：黑暗結束，迎向黎明。" }],
  20: [{ base: -10, mag: 1, hint: "童觀：眼光短淺，無大礙。" }, { base: 5, mag: 2, hint: "闚觀利女貞：視野仍受限。" }, { base: 0, mag: 3, hint: "觀我生進退：自省不急進。" }, { base: 20, mag: 4, hint: "觀國之光：發現機會，利賓王。" }, { base: 30, mag: 5, hint: "觀我生：君子無咎，自我檢驗。" }, { base: 15, mag: 2, hint: "觀其生：高處觀望，志在天下。" }],
  23: [{ base: -30, mag: 1, hint: "剝床以足：基礎受損，凶。" }, { base: -25, mag: 2, hint: "剝床以辨：危機迫近，憂慮。" }, { base: 10, mag: 3, hint: "剝之無咎：眾叛親離中保正道。" }, { base: -40, mag: 4, hint: "剝床以膚：災禍臨頭，大凶。" }, { base: 15, mag: 5, hint: "貫魚以寵妃應之：轉危為安。" }, { base: 25, mag: 2, hint: "碩果不食：最後的希望，重生。" }],
  35: [{ base: 0, mag: 1, hint: "晉如摧如：進取受阻，宜寬裕。" }, { base: 20, mag: 2, hint: "晉如愁如：憂慮但能得祖母福。" }, { base: 15, mag: 3, hint: "眾允悔亡：獲得大家支持。" }, { base: -20, mag: 4, hint: "晉如鼫鼠：貪婪失正，有危。" }, { base: 30, mag: 5, hint: "悔亡往吉無不利：晉升之極。" }, { base: -10, mag: 2, hint: "晉其角維用伐邑：厲吉。" }],
  14: [{ base: 0, mag: 1, hint: "無交害：富有之初，戒驕戒躁。" }, { base: 30, mag: 2, hint: "大車以載：資源豐厚，大有可為。" }, { base: 10, mag: 3, hint: "公用亨于天子：慷慨施捨。" }, { base: 20, mag: 4, hint: "匪其彭：不炫耀財富，無咎。" }, { base: 35, mag: 5, hint: "厥孚交如威如：大吉。" }, { base: 40, mag: 2, hint: "自天佑之：吉無不利，完美終局。" }],
  // 兌宮（金）
  58: [{ base: 15, mag: 1, hint: "和兌：心平氣和的溝通。" }, { base: 20, mag: 2, hint: "孚兌：誠信能化解壓力。" }, { base: -25, mag: 3, hint: "來兌：盲目追求感官快樂，凶。" }, { base: 5, mag: 4, hint: "商兌未寧介疾有喜：需抉擇。" }, { base: -15, mag: 5, hint: "孚於剝：過度信任小人，有厲。" }, { base: 0, mag: 2, hint: "引兌：被外力牽引的快樂。" }],
  47: [{ base: -30, mag: 1, hint: "臀困於株木：處境極度孤立。" }, { base: 10, mag: 2, hint: "困於酒食：雖受困但生活無虞。" }, { base: -35, mag: 3, hint: "困於石據於蒺藜：進退維谷。" }, { base: -5, mag: 4, hint: "來徐徐困於金車：行動遲緩。" }, { base: 15, mag: 5, hint: "劓刖困於赤紱：在壓力中脫困。" }, { base: 20, mag: 2, hint: "困於葛藟：困境即將結束。" }],
  45: [{ base: -5, mag: 1, hint: "有孚不終乃亂乃萃：心情浮躁。" }, { base: 25, mag: 2, hint: "引吉無咎：誠信感應，有貴人引薦。" }, { base: -10, mag: 3, hint: "萃如嗟如：團隊不和。" }, { base: 20, mag: 4, hint: "大吉無咎：位不當但大有作為。" }, { base: 15, mag: 5, hint: "萃有位無咎：居領導位獲得信任。" }, { base: -5, mag: 2, hint: "齎咨涕洟：目標未達，憂慮感傷。" }],
  31: [{ base: 0, mag: 1, hint: "咸其拇：感應尚淺，不宜行動。" }, { base: -10, mag: 2, hint: "咸其腓凶：隨人而動，失去主見。" }, { base: -15, mag: 3, hint: "咸其股執其隨：過於衝動。" }, { base: 25, mag: 4, hint: "貞吉悔亡：心念堅定，貴人感應。" }, { base: 5, mag: 5, hint: "咸其脢：感應在背，無實質進展。" }, { base: 0, mag: 2, hint: "咸其輔頰舌：僅止於口頭承諾。" }],
  39: [{ base: 10, mag: 1, hint: "往蹇來譽：見險而止，獲得名譽。" }, { base: 15, mag: 2, hint: "王臣蹇蹇：為公奔勞。" }, { base: 20, mag: 3, hint: "往蹇來反：不冒險，回歸本位。" }, { base: 5, mag: 4, hint: "往蹇來連：需要聯合他人度難關。" }, { base: 30, mag: 5, hint: "大蹇朋來：大難當頭，盟友出現。" }, { base: 35, mag: 2, hint: "往蹇來碩：苦盡甘來，吉。" }],
  15: [{ base: 25, mag: 1, hint: "謙謙君子用涉大川：吉。" }, { base: 30, mag: 2, hint: "鳴謙貞吉：謙遜之名遠播。" }, { base: 40, mag: 3, hint: "勞謙君子有終：辛勤獲報，吉。" }, { base: 20, mag: 4, hint: "無不利撝謙：發揮謙遜精神。" }, { base: 15, mag: 5, hint: "不富以其鄰：以德服人。" }, { base: 10, mag: 2, hint: "鳴謙利用行師：謙極轉剛。" }],
  62: [{ base: -20, mag: 1, hint: "飛鳥以凶：自視過高，必招災。" }, { base: 15, mag: 2, hint: "過其祖遇其妣：得不到大助得小助。" }, { base: -25, mag: 3, hint: "弗過防之從或戕之：嚴防意外。" }, { base: 0, mag: 4, hint: "無咎弗過遇之：保持謹慎。" }, { base: 10, mag: 5, hint: "密雲不雨：能量積聚但尚未爆發。" }, { base: -35, mag: 2, hint: "弗遇過之飛鳥離之：凶。" }],
  54: [{ base: 10, mag: 1, hint: "歸妹以娣跛能履：勉強可行。" }, { base: 5, mag: 2, hint: "眇能視利幽人之貞：守靜為吉。" }, { base: -25, mag: 3, hint: "歸妹以須反歸以娣：期望落空。" }, { base: 0, mag: 4, hint: "歸妹愆期遲歸有時：等待時機。" }, { base: 20, mag: 5, hint: "帝乙歸妹其君之袂不如其娣之良。" }, { base: -40, mag: 2, hint: "女承筐無實士刲羊無血：虛耗。" }],
  // 坤宮（土）
  2: [{ base: -5, mag: 1, hint: "履霜堅冰至：環境變冷的預兆，宜防微杜漸。" }, { base: 25, mag: 2, hint: "直方大：環境得助，不習無不利。" }, { base: 10, mag: 3, hint: "含章可貞：才華內斂，保持低調可成事。" }, { base: 5, mag: 4, hint: "括囊：高壓環境下，謹言慎行為妙。" }, { base: 20, mag: 5, hint: "黃裳元吉：處於尊位而謙下，大吉之象。" }, { base: -30, mag: 2, hint: "龍戰於野：防範激烈的利益衝突。" }],
  24: [{ base: 35, mag: 1, hint: "不遠復無祇悔：及時回頭，元吉之始。" }, { base: 30, mag: 2, hint: "休復吉：親近仁者，回歸正道的喜悅。" }, { base: -15, mag: 3, hint: "頻復厲無咎：反覆不定，雖有驚險但無大害。" }, { base: 10, mag: 4, hint: "中行獨復：在群體中堅持正確的道路。" }, { base: 20, mag: 5, hint: "敦復無悔：誠懇地自我反省與回歸。" }, { base: -35, mag: 2, hint: "迷復凶：執迷不悟，將錯失良機。" }],
  19: [{ base: 25, mag: 1, hint: "咸臨貞吉：感應得當，好運開始臨門。" }, { base: 30, mag: 2, hint: "咸臨吉無不利：與上級感應，大有可為。" }, { base: -10, mag: 3, hint: "甘臨無攸利：沉溺於現狀的安逸，有危。" }, { base: 20, mag: 4, hint: "至臨無咎：親自督導，處事妥當。" }, { base: 35, mag: 5, hint: "知臨大君之宜：智慧治理，受人敬重。" }, { base: 25, mag: 2, hint: "敦臨吉無咎：以敦厚之德結尾，圓滿。" }],
  11: [{ base: 25, mag: 1, hint: "拔茅茹以其彙：志同道合者共進。" }, { base: 20, mag: 2, hint: "包荒用馮河：具備包容心與冒險勇氣。" }, { base: 5, mag: 3, hint: "無平不陂無往不復：泰極將否，宜守。" }, { base: 15, mag: 4, hint: "翩翩不富以其鄰：與他人誠信合作。" }, { base: 40, mag: 5, hint: "帝乙歸妹以祉元吉：聯姻或結盟獲大利。" }, { base: -30, mag: 2, hint: "城復於隍：局面崩塌，宜自守不宜遠行。" }],
  34: [{ base: -15, mag: 1, hint: "壯於趾征凶：根基未穩即衝動，凶。" }, { base: 20, mag: 2, hint: "貞吉：守持正道，雖有力而不亂用。" }, { base: -20, mag: 3, hint: "小人用壯君子用罔：防範過度剛猛。" }, { base: 25, mag: 4, hint: "藩決不羸壯於大輿之輹：障礙消除。" }, { base: 15, mag: 5, hint: "喪羊於易無悔：放下執著，反而輕鬆。" }, { base: 0, mag: 2, hint: "羝羊觸藩：進退不得，唯有冷靜待時。" }],
  43: [{ base: -15, mag: 1, hint: "壯於前趾往不勝：輕敵必敗。" }, { base: 20, mag: 2, hint: "惕號莫夜有戎：提高警覺，有備無患。" }, { base: 0, mag: 3, hint: "壯於頄有凶：情緒激昂，需防官司。" }, { base: -10, mag: 4, hint: "臀無膚其行次且：決心動搖，行程受阻。" }, { base: 10, mag: 5, hint: "莧陸夬夬中行無咎：果斷剷除弊端。" }, { base: -35, mag: 2, hint: "無號終有凶：最後的隱患爆發。" }],
  5: [{ base: 15, mag: 1, hint: "需於郊利用恆：在邊緣等待，需耐心。" }, { base: 10, mag: 2, hint: "需於沙小有言：流言蜚語中等待轉機。" }, { base: -15, mag: 3, hint: "需於泥致寇至：等待過久或策略失當招災。" }, { base: 5, mag: 4, hint: "需於血出自穴：險境中的生存等待。" }, { base: 35, mag: 5, hint: "需於酒食貞吉：等待成功，享受成果。" }, { base: 20, mag: 2, hint: "入於穴有不速之客三人來：意外之助。" }],
  8: [{ base: 20, mag: 1, hint: "有孚比之無咎：建立誠信的夥伴關係。" }, { base: 30, mag: 2, hint: "比之自內貞吉：內部團結，感應上級。" }, { base: -25, mag: 3, hint: "比之匪人：與不當的人結盟，後悔莫及。" }, { base: 20, mag: 4, hint: "外比之貞吉：尋求外部支援或擴大社交。" }, { base: 40, mag: 5, hint: "顯比王用三驅：光明磊落。" }, { base: -30, mag: 2, hint: "比之無首凶：合作失去重心，終局不利。" }],
  // 離宮（火）
  30: [{ base: 0, mag: 1, hint: "履錯然：起步匆忙，需端正志向。" }, { base: 30, mag: 2, hint: "黃離元吉：得中道，文明之象。" }, { base: -15, mag: 3, hint: "日昃之離：過度憂慮或過度歡樂皆非宜。" }, { base: -25, mag: 4, hint: "突如其來如焚如：發展太快易崩潰。" }, { base: 15, mag: 5, hint: "出涕沱若：憂患中得吉，有名望。" }, { base: 10, mag: 2, hint: "王用出征：撥亂反正，去邪務盡。" }],
  56: [{ base: -10, mag: 1, hint: "旅瑣瑣：心志卑微，易招致災禍。" }, { base: 25, mag: 2, hint: "旅即次懷其資：旅途中得財與僕。" }, { base: -20, mag: 3, hint: "旅焚其次：客居他鄉與人衝突，失資。" }, { base: 0, mag: 4, hint: "旅於處得其資斧：雖安定但心不快。" }, { base: 20, mag: 5, hint: "射雉一矢亡：終以譽命，獲名聲。" }, { base: -30, mag: 2, hint: "鳥焚其巢：先笑後號啕，客居受挫。" }],
  50: [{ base: 5, mag: 1, hint: "鼎顛趾：革故鼎新，掃除舊弊。" }, { base: 20, mag: 2, hint: "鼎有實：內在充實，慎防遭人嫉妒。" }, { base: -5, mag: 3, hint: "鼎耳革：轉型受阻，才華暫難發揮。" }, { base: -35, mag: 4, hint: "鼎折足覆公餗：能力不足負重任。" }, { base: 30, mag: 5, hint: "鼎黃耳金鉉：中庸之道，大吉。" }, { base: 35, mag: 2, hint: "鼎玉鉉：剛柔並濟，完美收官。" }],
  64: [{ base: -15, mag: 1, hint: "濡其尾：準備不足即衝刺，難堪。" }, { base: 20, mag: 2, hint: "曳其輪：能自控，守正則吉。" }, { base: -10, mag: 3, hint: "未濟征凶：實力不足，宜涉大川。" }, { base: 10, mag: 4, hint: "貞吉悔亡：持久奮鬥終有賞。" }, { base: 30, mag: 5, hint: "君子之光：誠信感人，輝煌之時。" }, { base: -5, mag: 2, hint: "有孚於飲酒：過度沉溺會失節。" }],
  4: [{ base: 0, mag: 1, hint: "發蒙：教育啟蒙，利用刑人以規範。" }, { base: 35, mag: 2, hint: "包蒙吉納婦子克家：具包容力。" }, { base: -20, mag: 3, hint: "勿用取女：行為放蕩，失去主見。" }, { base: -15, mag: 4, hint: "困蒙：陷入孤立的無知，吝。" }, { base: 20, mag: 5, hint: "童蒙吉：保持純真，虛心受教。" }, { base: 5, mag: 2, hint: "擊蒙：嚴厲教導，擊退無知。" }],
  59: [{ base: 25, mag: 1, hint: "用拯馬壯吉：危機初現即獲助。" }, { base: 20, mag: 2, hint: "渙奔其機：尋求穩固的支撐。" }, { base: 0, mag: 3, hint: "渙其躬無悔：放下自我，化解隔閡。" }, { base: 30, mag: 4, hint: "渙其群元吉：打破小圈子，大團結。" }, { base: 35, mag: 5, hint: "渙汗其大號：發布重要政令，大吉。" }, { base: 15, mag: 2, hint: "渙其血去逖出：脫離險境與恐懼。" }],
  6: [{ base: 15, mag: 1, hint: "不永所事：爭端宜早結束，小有言。" }, { base: -20, mag: 2, hint: "歸而逋：爭不過對方，逃避為上。" }, { base: 0, mag: 3, hint: "食舊德：守住舊有成果，不爭功。" }, { base: 10, mag: 4, hint: "復即命渝：放棄訴訟，轉凶為吉。" }, { base: 35, mag: 5, hint: "訟元吉：公正無私，裁決得勝。" }, { base: -15, mag: 2, hint: "或錫之鞶帶：雖贏得爭鬥也難持久。" }],
  13: [{ base: 20, mag: 1, hint: "同人於門：廣泛交流，無偏私。" }, { base: -10, mag: 2, hint: "同人於宗：限於家族小圈子，吝。" }, { base: -15, mag: 3, hint: "伏戎於莽：心懷叵測，難以成功。" }, { base: 5, mag: 4, hint: "乘其墉弗克攻：及時收手，無咎。" }, { base: 30, mag: 5, hint: "同人先號啕而後笑：大師相遇。" }, { base: 10, mag: 2, hint: "同人於郊：雖無大合，亦無遺憾。" }],
  // 坎宮（水）
  29: [{ base: -30, mag: 1, hint: "習坎入於坎窞：重重險難，宜靜守。" }, { base: 10, mag: 2, hint: "坎有險求小得：險中求生，小有所獲。" }, { base: -25, mag: 3, hint: "來之坎坎：進退維谷，不可妄動。" }, { base: 15, mag: 4, hint: "樽酒簋貳：誠信結交，尋求外部支援。" }, { base: 20, mag: 5, hint: "坎不盈祇既平：險境即將度過，趨於平穩。" }, { base: -35, mag: 2, hint: "係用徽纆：陷入困境，需長時間脫困。" }],
  60: [{ base: 20, mag: 1, hint: "不出戶庭：節制之始，守住根基。" }, { base: -15, mag: 2, hint: "不出門庭凶：過度節制，錯失良機。" }, { base: -10, mag: 3, hint: "不節若則嗟若：不加節制，必遭憂患。" }, { base: 25, mag: 4, hint: "安節亨：心安理得地執行計畫。" }, { base: 35, mag: 5, hint: "甘節吉：推行節制得到他人擁護。" }, { base: -20, mag: 2, hint: "苦節貞凶：過度苛刻，難以持久。" }],
  3: [{ base: 25, mag: 1, hint: "磐桓利居貞：萬事開頭難，宜厚積薄發。" }, { base: 10, mag: 2, hint: "屯如邅如：進展緩慢，守正待時。" }, { base: -15, mag: 3, hint: "即鹿無虞：盲目冒進會迷失方向。" }, { base: 20, mag: 4, hint: "求婚媾往吉：積極尋求合作對象。" }, { base: 5, mag: 5, hint: "屯其膏：施捨不足，小事吉大事難。" }, { base: -30, mag: 2, hint: "乘馬班如泣血漣如：處境極艱。" }],
  63: [{ base: 15, mag: 1, hint: "曳其輪濡其尾：成功之初，謹慎慢行。" }, { base: 30, mag: 2, hint: "婦喪其茀勿逐：資源暫失不需追，自回。" }, { base: 0, mag: 3, hint: "高宗伐鬼方三年克之：辛苦的守成期。" }, { base: -10, mag: 4, hint: "繻有衣袽終日戒：防範未然。" }, { base: 20, mag: 5, hint: "東鄰殺牛不如西鄰：貴在誠信而非排場。" }, { base: -35, mag: 2, hint: "濡其首厲：盛極而衰，最終的危機。" }],
  49: [{ base: 0, mag: 1, hint: "鞏用黃牛之革：變革之初，宜堅守不動。" }, { base: 25, mag: 2, hint: "巳日乃革之征吉：時機成熟，大膽改革。" }, { base: 5, mag: 3, hint: "革言三就：多次商議，求穩而後變。" }, { base: 30, mag: 4, hint: "悔亡有孚改命：變革獲得公信力。" }, { base: 40, mag: 5, hint: "大人虎變：領導者展現威信，大吉。" }, { base: 15, mag: 2, hint: "君子豹變：改革完成，微調鞏固。" }],
  55: [{ base: 20, mag: 1, hint: "遇其配主：找到合適的拍檔，無咎。" }, { base: -10, mag: 2, hint: "豐其蔀日中見斗：被遮蔽，需誠信感應。" }, { base: -15, mag: 3, hint: "豐其沛日中見沫：能量過大導致失控。" }, { base: 15, mag: 4, hint: "豐其蔀日中見斗：再次面臨決策迷霧。" }, { base: 35, mag: 5, hint: "來章有慶譽：展現才華，獲得名望。" }, { base: -40, mag: 2, hint: "豐其屋蔀其家：高傲自大，最終孤立。" }],
  36: [{ base: -10, mag: 1, hint: "明夷于飛垂其翼：受挫，需隱藏光芒。" }, { base: 25, mag: 2, hint: "明夷夷于左股：雖受傷但有良馬救助。" }, { base: 10, mag: 3, hint: "明夷于南狩得其大首：反擊成功的機會。" }, { base: 0, mag: 4, hint: "入於左腹：洞悉黑暗核心，及時脫離。" }, { base: 20, mag: 5, hint: "箕子之明夷：極度艱難下保持內心光明。" }, { base: -35, mag: 2, hint: "不知晦後明：黑暗到極點，即將轉折。" }],
  7: [{ base: -5, mag: 1, hint: "師出以律：紀律是行動的首要條件。" }, { base: 35, mag: 2, hint: "在師中吉無咎：核心統帥，受王三錫。" }, { base: -30, mag: 3, hint: "師或輿尸凶：決策失當，損失慘重。" }, { base: 10, mag: 4, hint: "師左次無咎：適時退卻，保存實力。" }, { base: 15, mag: 5, hint: "田有禽：應對挑戰，宜速戰速決。" }, { base: 20, mag: 2, hint: "大君有命：開國承家，賞功罰過。" }],
  // 震宮（木）
  51: [{ base: 25, mag: 1, hint: "震來虩虩後笑言啞啞：先驚後吉。" }, { base: -10, mag: 2, hint: "震來厲喪其資：丟失財務，不需追尋。" }, { base: 0, mag: 3, hint: "震蘇蘇：驚懼不安，及時行動可無災。" }, { base: -15, mag: 4, hint: "震遂泥：陷入泥沼，才華難以施展。" }, { base: 10, mag: 5, hint: "震往來厲：處於危險邊緣，守中則無大患。" }, { base: -25, mag: 2, hint: "震索索視矍矍：能量耗盡，宜止不宜動。" }],
  16: [{ base: -20, mag: 1, hint: "鳴豫凶：過早炫耀或耽於享樂，凶。" }, { base: 35, mag: 2, hint: "介于石不終日：意志堅定，中正之吉。" }, { base: -10, mag: 3, hint: "盱豫悔：諂媚於上，遲疑則生悔恨。" }, { base: 30, mag: 4, hint: "由豫大有得：快樂的源頭，凝聚人心。" }, { base: -5, mag: 5, hint: "貞疾恆不死：長期處於微疾或壓力中。" }, { base: -15, mag: 2, hint: "冥豫：昏昧的享樂，及時改變可無咎。" }],
  40: [{ base: 15, mag: 1, hint: "無咎：困難初解，宜休養生息。" }, { base: 25, mag: 2, hint: "田獲三狐得黃矢：除去小人，獲得中道。" }, { base: -30, mag: 3, hint: "負且乘致寇至：身份不配資源，易招盜。" }, { base: 10, mag: 4, hint: "解而拇：擺脫不當的依附，朋友才來。" }, { base: 30, mag: 5, hint: "君子維有解：展現威信，困難徹底消除。" }, { base: 35, mag: 2, hint: "公用射隼於高墉之上：剷除禍根。" }],
  32: [{ base: -15, mag: 1, hint: "浚恆：追求長遠過頭，欲速則不達。" }, { base: 20, mag: 2, hint: "悔亡：雖不當位，但守中能持之以恆。" }, { base: -25, mag: 3, hint: "不恆其德或承之羞：情緒不穩易致羞辱。" }, { base: -10, mag: 4, hint: "田無禽：方法不對，再堅持也無收穫。" }, { base: 15, mag: 5, hint: "恆其德貞：對女性吉，對開創者受限。" }, { base: -30, mag: 2, hint: "振恆凶：心急氣躁，無法安定。" }],
  46: [{ base: 25, mag: 1, hint: "允升大吉：獲得認可，開始上升。" }, { base: 20, mag: 2, hint: "孚乃利用禴：以誠信祭祀，得無形之助。" }, { base: 30, mag: 3, hint: "升虛邑：升遷如入無人之境，順遂。" }, { base: 15, mag: 4, hint: "王用亨于岐山：獲得高層授權與福佑。" }, { base: 35, mag: 5, hint: "貞吉升階：一步步穩健上升，大吉。" }, { base: -10, mag: 2, hint: "冥升：盲目上升，宜守正不息。" }],
  48: [{ base: -15, mag: 1, hint: "井泥不食：資源被污染或未被開發。" }, { base: -10, mag: 2, hint: "井谷射鮒：資源浪費在小處，無法大用。" }, { base: 10, mag: 3, hint: "井渫不食：才華已備但無人賞識，憂心。" }, { base: 5, mag: 4, hint: "井甃無咎：內部修整，修繕基礎。" }, { base: 35, mag: 5, hint: "井冽寒泉食：資源成熟，廣惠大眾。" }, { base: 40, mag: 2, hint: "井收勿幕：成功不居，財源滾滾。" }],
  28: [{ base: 5, mag: 1, hint: "藉用白茅：極度謹慎，防範壓力過大。" }, { base: 20, mag: 2, hint: "枯楊生稊：老而得助，枯木逢春。" }, { base: -35, mag: 3, hint: "棟橈凶：結構崩潰，無法支撐重壓。" }, { base: 15, mag: 4, hint: "棟隆吉：壓力中撐起局面，有助。" }, { base: -5, mag: 5, hint: "枯楊生華：虛有其表，難以長久。" }, { base: -30, mag: 2, hint: "過涉滅頂：冒險過頭，陷入絕境。" }],
  17: [{ base: 15, mag: 1, hint: "官有渝貞吉：適應變化，出門交友。" }, { base: -10, mag: 2, hint: "係小子失丈夫：因小失大，選擇錯誤。" }, { base: 10, mag: 3, hint: "係丈夫失小子：選擇正確，雖有損失。" }, { base: -15, mag: 4, hint: "隨有獲貞凶：雖有所得，但防招嫉。" }, { base: 35, mag: 5, hint: "孚于嘉吉：誠信待人，獲得美滿。" }, { base: 10, mag: 2, hint: "拘係之：緊緊維繫，意志堅定。" }],
  // 巽宮（木）
  57: [{ base: -5, mag: 1, hint: "進退利武人之貞：意志不堅，宜果斷。" }, { base: 20, mag: 2, hint: "巽在床下用史巫紛若：需借助溝通化解疑慮。" }, { base: -25, mag: 3, hint: "頻巽吝：反覆思考過度，顯得優柔寡斷。" }, { base: 25, mag: 4, hint: "悔亡田獲三品：在執行中獲得實質收益。" }, { base: 30, mag: 5, hint: "貞吉悔亡無不利：先庚三日後庚三日。" }, { base: -30, mag: 2, hint: "巽在床下喪其資斧：滲透過度反而失資。" }],
  9: [{ base: 20, mag: 1, hint: "復自道何其咎：回歸本位，守住初衷。" }, { base: 15, mag: 2, hint: "牽復吉：與志同道合者一起回歸。" }, { base: -20, mag: 3, hint: "輿說輻夫妻反目：內部產生摩擦。" }, { base: 10, mag: 4, hint: "有孚血去惕出：憑誠信脫離恐懼與險境。" }, { base: 35, mag: 5, hint: "有孚攣如富以其鄰：財富共享，元吉。" }, { base: -5, mag: 2, hint: "既雨既處：能量積累已達上限，宜止。" }],
  37: [{ base: 25, mag: 1, hint: "閑有家悔亡：建立規矩與界線。" }, { base: 30, mag: 2, hint: "無攸遂在中饋：安於內部的管理與協調。" }, { base: -10, mag: 3, hint: "家人嗃嗃悔厲：管理過於嚴厲，小有摩擦。" }, { base: 35, mag: 4, hint: "富家大吉：內部資源充沛，家運興隆。" }, { base: 40, mag: 5, hint: "王假有家：領導者展現慈愛與威信。" }, { base: 30, mag: 2, hint: "有孚威如終吉：以誠信與威儀收尾。" }],
  42: [{ base: 35, mag: 1, hint: "利用為大作元吉：最利於開啟大計畫。" }, { base: 40, mag: 2, hint: "或益之十朋之龜：天佑之，資源主動上門。" }, { base: 0, mag: 3, hint: "益之用凶事：在困難中獲得成長。" }, { base: 20, mag: 4, hint: "中行告公從：建議被採納，有利轉向。" }, { base: 45, mag: 5, hint: "有孚惠心勿問元吉：大得民心。" }, { base: -40, mag: 2, hint: "莫益之或擊之：貪心不足，反遭損害。" }],
  25: [{ base: 30, mag: 1, hint: "無妄往吉：不存幻想，順勢而行。" }, { base: 25, mag: 2, hint: "不耕穫不菑畬：不計回報，反而獲益。" }, { base: -25, mag: 3, hint: "無妄之災：路人牽牛，邑人之災。" }, { base: 15, mag: 4, hint: "可貞無咎：保持本心，不隨便改弦更張。" }, { base: 20, mag: 5, hint: "無妄之疾勿藥有喜：小問題會自然化解。" }, { base: -15, mag: 2, hint: "無妄行有眚：時機已盡，不宜再進。" }],
  21: [{ base: 0, mag: 1, hint: "屨校滅趾：受到小懲罰以防大過。" }, { base: 25, mag: 2, hint: "噬膚滅鼻：處理困難極為容易，雖有受損。" }, { base: -15, mag: 3, hint: "噬腊肉遇毒：處理舊弊，遇到頑抗。" }, { base: 20, mag: 4, hint: "噬乾胏得金矢：艱難解決障礙。" }, { base: 15, mag: 5, hint: "噬乾肉得黃金：處理問題得當。" }, { base: -40, mag: 2, hint: "何校滅耳凶：執迷不悟，終受重罰。" }],
  27: [{ base: -15, mag: 1, hint: "舍爾靈龜觀我朵頤：自失立場，貪圖他物。" }, { base: -10, mag: 2, hint: "顛頤拂經：求養方式錯誤，有違常理。" }, { base: -25, mag: 3, hint: "拂頤貞凶：違背養生之道，十年勿用。" }, { base: 20, mag: 4, hint: "顛頤吉：向下尋求賢才以供養大眾。" }, { base: 15, mag: 5, hint: "拂經居貞吉：雖違常理但守正，不可涉川。" }, { base: 35, mag: 2, hint: "由頤厲吉：成為供養源頭，任重道遠。" }],
  18: [{ base: 25, mag: 1, hint: "幹父之蠱：承擔舊任，整頓舊弊。" }, { base: 20, mag: 2, hint: "幹母之蠱：溫和地處理內部的積弊。" }, { base: -5, mag: 3, hint: "幹父之蠱小有悔：處理過急，小有遺憾。" }, { base: -20, mag: 4, hint: "裕父之蠱：對弊端過於寬容，導致失敗。" }, { base: 30, mag: 5, hint: "幹父之蠱用譽：整頓成功，贏得名譽。" }, { base: 35, mag: 2, hint: "不事王侯高尚其事：跳脫俗務，志向高遠。" }],
  // 艮宮（土）
  52: [{ base: 15, mag: 1, hint: "艮其趾：起步即止，守正則無咎。" }, { base: -10, mag: 2, hint: "艮其腓：隨人而止，心中不快。" }, { base: -20, mag: 3, hint: "艮其限：強制停止，心火灼身，危。" }, { base: 20, mag: 4, hint: "艮其身：自我約束，情緒平穩。" }, { base: 25, mag: 5, hint: "艮其輔：言出有章，有序止爭。" }, { base: 40, mag: 2, hint: "敦艮：厚實之止，圓滿結束。" }],
  22: [{ base: 5, mag: 1, hint: "賁其趾：捨車而徒，樸實起步。" }, { base: 15, mag: 2, hint: "賁其須：依附強者，修飾儀表。" }, { base: 25, mag: 3, hint: "賁如濡如：潤澤之象，永貞吉。" }, { base: 10, mag: 4, hint: "賁如皤如：白馬翰如，追求本色。" }, { base: 30, mag: 5, hint: "賁於丘園：樸實無華，大吉。" }, { base: 35, mag: 2, hint: "白賁：返璞歸真，最高境界。" }],
  26: [{ base: -5, mag: 1, hint: "有厲利已：前方有阻，宜自止。" }, { base: 15, mag: 2, hint: "輿說輹：主動停車，蓄勢待發。" }, { base: 20, mag: 3, hint: "良馬逐：與強者同步，利艱貞。" }, { base: 35, mag: 4, hint: "童牛之牿：防範未然，元吉。" }, { base: 30, mag: 5, hint: "豶豕之牙：化解暴力於無形。" }, { base: 45, mag: 2, hint: "何天之衢：大路通天，無阻。" }],
  41: [{ base: 15, mag: 1, hint: "已事遄往：速戰速決，酌損。" }, { base: 20, mag: 2, hint: "利貞征凶：守中不損，即是益。" }, { base: 0, mag: 3, hint: "三人行則損一人：需精簡團隊。" }, { base: 25, mag: 4, hint: "損其疾：革除弊端，使人喜悅。" }, { base: 45, mag: 5, hint: "或益之十朋之龜：大吉受惠。" }, { base: 40, mag: 2, hint: "弗損益之：惠而不費，大獲名利。" }],
  38: [{ base: 15, mag: 1, hint: "悔亡：見惡人以避難，不失正。" }, { base: 20, mag: 2, hint: "遇主於巷：非正式場合得遇貴人。" }, { base: -25, mag: 3, hint: "見輿曳其牛掣：多重阻礙。" }, { base: 10, mag: 4, hint: "睽孤：孤立中遇知音，結伴前行。" }, { base: 30, mag: 5, hint: "悔亡厥宗噬膚：往何咎。" }, { base: 20, mag: 2, hint: "見豕負塗：化敵為友，雨過天晴。" }],
  10: [{ base: 15, mag: 1, hint: "素履：按本分行事，平平安安。" }, { base: 20, mag: 2, hint: "履道坦坦：幽人貞吉，守靜利。" }, { base: -35, mag: 3, hint: "眇能視跛能履：不自量力招禍。" }, { base: 10, mag: 4, hint: "履虎尾愬愬終吉：驚險中過關。" }, { base: -5, mag: 5, hint: "夬履：決斷果敢，但需防風險。" }, { base: 45, mag: 2, hint: "視履考祥：回顧總結，大吉圓滿。" }],
  61: [{ base: 20, mag: 1, hint: "虞吉：守持誠信，有備無患。" }, { base: 35, mag: 2, hint: "鳴鶴在陰其子和之：共鳴感應。" }, { base: -15, mag: 3, hint: "得敵或鼓或罷：對手現身。" }, { base: 25, mag: 4, hint: "月幾望馬匹亡：專注目標。" }, { base: 40, mag: 5, hint: "有孚攣如：誠信連結，元吉。" }, { base: -30, mag: 2, hint: "翰音登於天：虛名難持久，凶。" }],
  53: [{ base: 10, mag: 1, hint: "鴻漸於干：循序漸進之始。" }, { base: 35, mag: 2, hint: "鴻漸於磐：飲食衎衎，得吉。" }, { base: -20, mag: 3, hint: "鴻漸於陸：夫征不復，防意外。" }, { base: 15, mag: 4, hint: "鴻漸於木：找到棲息之地。" }, { base: 40, mag: 5, hint: "鴻漸於陵：終勝，獲大成功。" }, { base: 45, mag: 2, hint: "鴻漸於陸其羽可用：功德圓滿。" }],
};

// 若無專用參數，用通用規則推估
function getDefaultParams(hexagrams, hexagramIndex, lineIndex) {
  const h = hexagrams.find((x) => x.i === hexagramIndex);
  const lineText = h?.lines?.[lineIndex] || "";
  let base = 0;
  if (/吉|亨|利/.test(lineText) && !/凶|吝|厲/.test(lineText)) base = 15;
  else if (/凶|吝|厲/.test(lineText)) base = -15;
  const mag = lineIndex === 4 ? 5 : lineIndex === 0 ? 1 : lineIndex === 5 ? 2 : lineIndex + 1;
  return { base, mag, hint: lineText || "—" };
}

/** 取得完整爻辭（來自 hexagrams.json） */
function getLineText(hexagrams, hexagramIndex, lineIndex) {
  const h = hexagrams.find((x) => x.i === hexagramIndex);
  return h?.lines?.[lineIndex] || "";
}

function build() {
  const hexData = JSON.parse(fs.readFileSync(path.join(__dirname, "../data/iching/hexagrams.json"), "utf8"));
  const hexagrams = hexData.hexagrams;
  const out = { lines: {} };

  for (const h of hexagrams) {
    const i = h.i;
    const bin = KING_WEN_TO_BINARY[i];
    if (!bin) continue;
    const lines = bin.slice().reverse(); // [初,二,三,四,五,上]
    const arr = [];
    for (let pos = 0; pos < 6; pos++) {
      const yang = lines[pos];
      const correct = getCorrectScore(yang, pos);
      const resonance = getResonanceScore(lines, pos);
      const params = LINE_PARAMS[i]?.[pos] ?? getDefaultParams(hexagrams, i, pos);
      const text = getLineText(hexagrams, i, pos);
      arr.push({
        yang,
        correct,
        resonance,
        base: params.base,
        mag: params.mag,
        text: text || params.hint?.split("：")[0] || "",
        hint: params.hint,
      });
    }
    out.lines[i] = arr;
  }

  const outPath = path.join(__dirname, "../data/iching/lines-384.json");
  fs.writeFileSync(outPath, JSON.stringify(out, null, 2), "utf8");
  console.log("Wrote", outPath, Object.keys(out.lines).length, "hexagrams");
}

build();
