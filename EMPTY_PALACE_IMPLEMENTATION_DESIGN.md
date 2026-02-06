# 空宮處理實作設計建議

## 📋 設計目標

根據 `CONSULTATION_PROMPT_SYSTEM.md` 中的系統指令，實作空宮處理邏輯，確保：
1. 空宮時正確「借對宮」主星
2. 生成符合「三段式心靈直擊」格式的諮詢腳本
3. 正確轉譯煞星、輔星、雜曜的含義

---

## 🏗️ 架構設計

### 1. 星曜分類系統

#### 1.1 星曜類型定義

```javascript
// 在 consultationScriptEngine.js 中添加
const STAR_CATEGORIES = {
  MAIN_STARS: [
    "紫微", "天機", "太陽", "武曲", "天同", "廉貞", 
    "天府", "太陰", "貪狼", "巨門", "天相", "天梁", 
    "七殺", "破軍"
  ],
  
  MALEFIC_STARS: {
    "火星": { trait: "爆發力", feeling: "急躁、衝動、憤怒的積累" },
    "擎羊": { trait: "攻擊性", feeling: "防衛機制、尖銳的保護殼" },
    "陀羅": { trait: "糾結", feeling: "拖延、無法釋放的壓力" },
    "地空": { trait: "虛無感", feeling: "不安全感、對現實的逃避" },
    "地劫": { trait: "失去感", feeling: "破滅感、對擁有的恐懼" },
    "鈴星": { trait: "焦慮", feeling: "不安、持續的緊張感" },
    "天刑": { trait: "自我懲罰", feeling: "內疚感、道德枷鎖" }
  },
  
  ASSISTANT_STARS: {
    "左輔": { trait: "外在貴人", feeling: "社會資源、對他人的依賴" },
    "右弼": { trait: "內在支持", feeling: "自我調節、對完美的追求" },
    "文昌": { trait: "外在學識", feeling: "文憑、社會認可的追求" },
    "文曲": { trait: "內在才華", feeling: "藝術天賦、對美的渴望" },
    "天魁": { trait: "外在貴人", feeling: "機會、對權威的依賴" },
    "天鉞": { trait: "內在貴人", feeling: "直覺、對靈性的追求" },
    "祿存": { trait: "穩定資源", feeling: "安全感、對物質的依賴" },
    "天馬": { trait: "變動", feeling: "遷移、對自由的渴望" }
  },
  
  MINOR_STARS: {
    "天虛": { trait: "空虛感", feeling: "不真實感、對存在的質疑" },
    "破碎": { trait: "破碎感", feeling: "不完整、對完美的執著" },
    "旬空": { trait: "虛無感", feeling: "不確定感、對未來的恐懼" },
    "截空": { trait: "失落", feeling: "中斷感、對連續性的渴望" },
    "孤辰": { trait: "孤獨感", feeling: "疏離感、對連結的渴望" },
    "寡宿": { trait: "寂寞感", feeling: "被遺棄感、對歸屬的渴望" },
    "天哭": { trait: "悲傷", feeling: "失落感、對過去的執著" },
    "天姚": { trait: "浪漫", feeling: "對愛的渴望、對完美的幻想" }
  }
};
```

---

### 2. 空宮檢測與對宮借星

#### 2.1 對宮映射表

```javascript
// 在 consultationScriptEngine.js 中添加
const OPPOSITE_PALACE_MAP = {
  "命宮": "遷移",
  "遷移": "命宮",
  "兄弟": "僕役",
  "僕役": "兄弟",
  "夫妻": "官祿",
  "官祿": "夫妻",
  "子女": "田宅",
  "田宅": "子女",
  "財帛": "福德",
  "福德": "財帛",
  "疾厄": "父母",
  "父母": "疾厄"
};

function getOppositePalace(palaceName) {
  return OPPOSITE_PALACE_MAP[palaceName] || null;
}
```

#### 2.2 空宮檢測函數

```javascript
/**
 * 檢測宮位是否為空宮（無主星）
 * @param {Object} ziwei 紫微命盤資料
 * @param {string} palaceName 宮位名稱
 * @returns {boolean} 是否為空宮
 */
function isPalaceEmpty(ziwei, palaceName) {
  const mainStars = getPalaceMainStars(ziwei, palaceName);
  return mainStars.length === 0;
}

/**
 * 獲取宮位的所有星曜（包括主星、煞星、輔星、雜曜）
 * @param {Object} ziwei 紫微命盤資料
 * @param {string} palaceName 宮位名稱
 * @returns {Object} 分類後的星曜 { mainStars, maleficStars, assistantStars, minorStars }
 */
function classifyPalaceStars(ziwei, palaceName) {
  const getStarsForPalaceHelper = window.CalcHelpers?.getStarsForPalace;
  const toTraditionalStarNameHelper = window.CalcHelpers?.toTraditionalStarName;
  
  if (!getStarsForPalaceHelper) {
    return { mainStars: [], maleficStars: [], assistantStars: [], minorStars: [] };
  }
  
  const stars = getStarsForPalaceHelper(ziwei, palaceName);
  const mainStars = [];
  const maleficStars = [];
  const assistantStars = [];
  const minorStars = [];
  
  stars.forEach(star => {
    let starName;
    if (typeof star === 'string') {
      starName = toTraditionalStarNameHelper ? toTraditionalStarNameHelper(star) : star;
    } else if (star && typeof star === 'object') {
      const name = star.name || star.id || star;
      starName = toTraditionalStarNameHelper ? toTraditionalStarNameHelper(name) : name;
    } else {
      starName = String(star);
    }
    
    const normalizedName = starName.trim();
    
    if (STAR_CATEGORIES.MAIN_STARS.includes(normalizedName)) {
      mainStars.push(normalizedName);
    } else if (STAR_CATEGORIES.MALEFIC_STARS[normalizedName]) {
      maleficStars.push(normalizedName);
    } else if (STAR_CATEGORIES.ASSISTANT_STARS[normalizedName]) {
      assistantStars.push(normalizedName);
    } else if (STAR_CATEGORIES.MINOR_STARS[normalizedName]) {
      minorStars.push(normalizedName);
    }
  });
  
  return { mainStars, maleficStars, assistantStars, minorStars };
}
```

---

### 3. 三段式話術生成

#### 3.1 空宮話術生成器

```javascript
/**
 * 生成空宮的直擊話術 (50%)
 * @param {string} palaceName 宮位名稱
 * @param {string} oppositeMainStar 對宮主星名稱
 * @returns {string} 直擊話術
 */
function generateEmptyPalaceHook(palaceName, oppositeMainStar) {
  const PALACE_EMPTY_TRAITS = {
    "命宮": "容易受環境影響",
    "兄弟": "對關係的依賴",
    "夫妻": "受伴侶影響",
    "子女": "對成果的依賴",
    "財帛": "對資源的依賴",
    "疾厄": "對健康的焦慮",
    "遷移": "受外界影響",
    "僕役": "對關係的依賴",
    "官祿": "受職場影響",
    "田宅": "對穩定的渴望",
    "福德": "對內在平靜的渴望",
    "父母": "對權威的依賴"
  };
  
  const trait = PALACE_EMPTY_TRAITS[palaceName] || "受環境影響";
  
  return `你的${palaceName}是空宮，借對宮的${oppositeMainStar}，代表你在這個領域${trait}，對吧？你覺得你現在的狀態，有多少是環境塑造的？`;
}

/**
 * 生成空宮的啟發話術 (30%)
 * @param {Array<string>} maleficStars 煞星列表
 * @param {Array<string>} minorStars 雜曜列表
 * @returns {string} 啟發話術
 */
function generateEmptyPalaceReflection(maleficStars, minorStars) {
  let reflection = "空宮的人往往有一種『變色龍』的特質。你會不會有時候覺得，你在不同場合表現出來的自己，好像不太一樣？那種內在的矛盾感，你怎麼看待？";
  
  if (maleficStars.length > 0) {
    const firstMalefic = maleficStars[0];
    const maleficInfo = STAR_CATEGORIES.MALEFIC_STARS[firstMalefic];
    if (maleficInfo) {
      reflection += ` 你的${firstMalefic}，那種${maleficInfo.trait}和${maleficInfo.feeling}，你覺得它是在保護你，還是在限制你？`;
    }
  }
  
  if (minorStars.length > 0) {
    const firstMinor = minorStars[0];
    const minorInfo = STAR_CATEGORIES.MINOR_STARS[firstMinor];
    if (minorInfo) {
      reflection += ` 那種${minorInfo.feeling}，你覺得它是在提醒你什麼？還是只是在折磨你？`;
    }
  }
  
  return reflection;
}

/**
 * 生成空宮的採集話術 (20%)
 * @param {Array<string>} assistantStars 輔星列表
 * @param {string} palaceName 宮位名稱
 * @returns {string} 採集話術
 */
function generateEmptyPalaceCapture(assistantStars, palaceName) {
  if (assistantStars.length === 0) {
    return `在你做這個領域的決定時，那個『說不出理由，但就是覺得應該這樣做』的感覺，通常會出現在什麼時候？`;
  }
  
  const firstAssistant = assistantStars[0];
  const assistantInfo = STAR_CATEGORIES.ASSISTANT_STARS[firstAssistant];
  
  if (assistantInfo) {
    return `你的${palaceName}有${firstAssistant}，代表你在這個領域會${assistantInfo.trait}。那個讓你${assistantInfo.feeling}的資源或人，現在對你來說，它的意義是什麼？`;
  }
  
  return `在你做這個領域的決定時，那個『說不出理由，但就是覺得應該這樣做』的感覺，通常會出現在什麼時候？`;
}
```

#### 3.2 一般宮位話術生成器

```javascript
/**
 * 生成一般宮位的直擊話術 (50%)
 * @param {string} palaceName 宮位名稱
 * @param {string} mainStar 主星名稱
 * @param {string} trait 主星特質
 * @returns {string} 直擊話術
 */
function generateNormalPalaceHook(palaceName, mainStar, trait) {
  const PALACE_CONTEXTS = {
    "命宮": "你天生就有種",
    "兄弟": "你在這個領域有一種",
    "夫妻": "你在這個領域有一種",
    "子女": "你在這個領域有一種",
    "財帛": "你對這個領域有一種",
    "疾厄": "你的這個領域有一種",
    "遷移": "你出外運有一種",
    "僕役": "你在這個領域有一種",
    "官祿": "你在職場上有一種",
    "田宅": "你對這個領域有一種",
    "福德": "你內心最深處追求的是一種",
    "父母": "你在這個領域有一種"
  };
  
  const context = PALACE_CONTEXTS[palaceName] || "你在這個領域有一種";
  
  return `你的${palaceName}坐${mainStar}，${context}${trait}的氣場，對吧？`;
}

/**
 * 生成一般宮位的啟發話術 (30%)
 * @param {Array<string>} maleficStars 煞星列表
 * @param {Array<string>} minorStars 雜曜列表
 * @returns {string} 啟發話術
 */
function generateNormalPalaceReflection(maleficStars, minorStars) {
  let reflection = "";
  
  if (maleficStars.length > 0) {
    const firstMalefic = maleficStars[0];
    const maleficInfo = STAR_CATEGORIES.MALEFIC_STARS[firstMalefic];
    if (maleficInfo) {
      reflection = `那種${maleficInfo.trait}和${maleficInfo.feeling}，你覺得它是在保護你，還是在限制你？你什麼時候開始意識到，你其實一直在用這種方式保護自己？`;
    }
  } else if (minorStars.length > 0) {
    const firstMinor = minorStars[0];
    const minorInfo = STAR_CATEGORIES.MINOR_STARS[firstMinor];
    if (minorInfo) {
      reflection = `那種${minorInfo.feeling}，你覺得它是在提醒你什麼？還是只是在折磨你？`;
    }
  } else {
    reflection = "這種特質在你意識不到的時候影響著你的選擇。你覺得你現在的人生軌跡，有多少是這種潛意識在推動的？";
  }
  
  return reflection;
}

/**
 * 生成一般宮位的採集話術 (20%)
 * @param {Array<string>} assistantStars 輔星列表
 * @param {string} palaceName 宮位名稱
 * @returns {string} 採集話術
 */
function generateNormalPalaceCapture(assistantStars, palaceName) {
  if (assistantStars.length > 0) {
    const firstAssistant = assistantStars[0];
    const assistantInfo = STAR_CATEGORIES.ASSISTANT_STARS[firstAssistant];
    
    if (assistantInfo) {
      return `你的${palaceName}有${firstAssistant}，代表你在這個領域會${assistantInfo.trait}。那個讓你${assistantInfo.feeling}的資源或人，現在對你來說，它的意義是什麼？`;
    }
  }
  
  return `在你做這個領域的決定時，那個『說不出理由，但就是覺得應該這樣做』的感覺，通常會出現在什麼時候？`;
}
```

---

### 4. 統一話術生成入口

#### 4.1 主要生成函數

```javascript
/**
 * 生成宮位的三段式諮詢腳本
 * @param {Object} ziwei 紫微命盤資料
 * @param {string} palaceName 宮位名稱
 * @param {Object} overlapAnalysis 疊宮分析資料（可選）
 * @returns {Object} { hook50, reflection30, capture20, isEmpty, oppositePalace }
 */
function generatePalaceConsultationScript(ziwei, palaceName, overlapAnalysis) {
  const isEmpty = isPalaceEmpty(ziwei, palaceName);
  let stars = classifyPalaceStars(ziwei, palaceName);
  let oppositePalace = null;
  
  // 如果是空宮，借對宮的星曜
  if (isEmpty) {
    oppositePalace = getOppositePalace(palaceName);
    if (oppositePalace) {
      const oppositeStars = classifyPalaceStars(ziwei, oppositePalace);
      // 使用對宮的主星，但保留本宮的煞星、輔星、雜曜
      stars = {
        mainStars: oppositeStars.mainStars,
        maleficStars: stars.maleficStars,
        assistantStars: stars.assistantStars,
        minorStars: stars.minorStars
      };
    }
  }
  
  const { mainStars, maleficStars, assistantStars, minorStars } = stars;
  const mainStar = mainStars.length > 0 ? mainStars[0] : null;
  const trait = getPalaceTrait(mainStars);
  
  let hook50, reflection30, capture20;
  
  if (isEmpty && mainStar) {
    // 空宮話術
    hook50 = generateEmptyPalaceHook(palaceName, mainStar);
    reflection30 = generateEmptyPalaceReflection(maleficStars, minorStars);
    capture20 = generateEmptyPalaceCapture(assistantStars, palaceName);
  } else if (mainStar) {
    // 一般宮位話術
    hook50 = generateNormalPalaceHook(palaceName, mainStar, trait);
    reflection30 = generateNormalPalaceReflection(maleficStars, minorStars);
    capture20 = generateNormalPalaceCapture(assistantStars, palaceName);
  } else {
    // 完全空宮（對宮也無主星）
    hook50 = `你的${palaceName}是空宮，代表你在這個領域容易受環境影響，對吧？`;
    reflection30 = "空宮的人往往有一種『變色龍』的特質。你會不會有時候覺得，你在不同場合表現出來的自己，好像不太一樣？";
    capture20 = `在你做這個領域的決定時，那個『說不出理由，但就是覺得應該這樣做』的感覺，通常會出現在什麼時候？`;
  }
  
  return {
    hook50,
    reflection30,
    capture20,
    isEmpty,
    oppositePalace,
    stars: {
      mainStars,
      maleficStars,
      assistantStars,
      minorStars
    }
  };
}
```

---

## 🔄 整合到現有系統

### 修改 `consultationScriptEngine.js`

#### 步驟 1: 添加星曜分類常數

在文件開頭添加 `STAR_CATEGORIES` 和 `OPPOSITE_PALACE_MAP`。

#### 步驟 2: 添加輔助函數

添加所有上述的輔助函數：
- `isPalaceEmpty`
- `classifyPalaceStars`
- `getOppositePalace`
- `generateEmptyPalaceHook`
- `generateEmptyPalaceReflection`
- `generateEmptyPalaceCapture`
- `generateNormalPalaceHook`
- `generateNormalPalaceReflection`
- `generateNormalPalaceCapture`
- `generatePalaceConsultationScript`

#### 步驟 3: 修改現有的 `generateQ` 函數

將所有 `generateQ1` 到 `generateQ15` 函數改為使用 `generatePalaceConsultationScript`：

```javascript
function generateQ1(ziwei, overlapAnalysis, fourTransformations) {
  const script = generatePalaceConsultationScript(ziwei, "命宮", overlapAnalysis);
  
  return {
    id: 'Q1',
    palace: '命宮',
    dimension: '核心本質',
    title: '命宮（原廠設定）',
    hook50: script.hook50,
    reflection30: script.reflection30,
    capture20: script.capture20,
    data: {
      isEmpty: script.isEmpty,
      oppositePalace: script.oppositePalace,
      stars: script.stars
    }
  };
}
```

---

## 📊 測試案例

### 測試案例 1: 命宮空宮，遷移宮有太陽

**輸入**：
```javascript
{
  ziwei: {
    mainStars: {
      "命宮": [],
      "遷移": ["太陽"]
    }
  },
  palaceName: "命宮"
}
```

**預期輸出**：
```javascript
{
  hook50: "你的命宮是空宮，借對宮的太陽，代表你在這個領域容易受環境影響，對吧？你覺得你現在的狀態，有多少是環境塑造的？",
  reflection30: "空宮的人往往有一種『變色龍』的特質。你會不會有時候覺得，你在不同場合表現出來的自己，好像不太一樣？那種內在的矛盾感，你怎麼看待？",
  capture20: "在你做這個領域的決定時，那個『說不出理由，但就是覺得應該這樣做』的感覺，通常會出現在什麼時候？",
  isEmpty: true,
  oppositePalace: "遷移"
}
```

### 測試案例 2: 命宮有紫微，且有火星

**輸入**：
```javascript
{
  ziwei: {
    mainStars: {
      "命宮": ["紫微", "火星"]
    }
  },
  palaceName: "命宮"
}
```

**預期輸出**：
```javascript
{
  hook50: "你的命宮坐紫微，你天生就有種領導統御的氣場，對吧？",
  reflection30: "那種爆發力和急躁、衝動、憤怒的積累，你覺得它是在保護你，還是在限制你？你什麼時候開始意識到，你其實一直在用這種方式保護自己？",
  capture20: "在你做這個領域的決定時，那個『說不出理由，但就是覺得應該這樣做』的感覺，通常會出現在什麼時候？",
  isEmpty: false,
  oppositePalace: null
}
```

---

## ✅ 實作檢查清單

- [ ] 添加 `STAR_CATEGORIES` 常數定義
- [ ] 添加 `OPPOSITE_PALACE_MAP` 映射表
- [ ] 實作 `isPalaceEmpty` 函數
- [ ] 實作 `classifyPalaceStars` 函數
- [ ] 實作 `getOppositePalace` 函數
- [ ] 實作空宮話術生成函數（hook, reflection, capture）
- [ ] 實作一般宮位話術生成函數（hook, reflection, capture）
- [ ] 實作 `generatePalaceConsultationScript` 統一入口
- [ ] 修改所有 `generateQ` 函數使用新系統
- [ ] 添加單元測試
- [ ] 測試空宮情況
- [ ] 測試一般宮位情況
- [ ] 測試煞星、輔星、雜曜的轉譯

---

## 🚀 後續優化建議

1. **話術模板化**：將話術模板提取為配置，方便調整
2. **多語言支持**：支持簡體中文、英文等
3. **個性化調整**：根據用戶的疊宮分析結果調整話術強度
4. **AI 增強**：使用 AI 模型生成更自然的對話
5. **話術庫擴展**：建立話術庫，支持更多星曜組合
