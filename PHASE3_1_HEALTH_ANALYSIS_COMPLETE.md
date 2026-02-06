# Phase 3.1: 五行健康預警系統實現完成報告

## ✅ 已完成功能

### 1. 核心模組
- ✅ `js/calc/healthAnalysis.js` - 五行健康預警計算模組
- ✅ 整合到 `js/calc.js` 的 `computeAllPalaceScores` 函數
- ✅ 添加到 `index.html` 腳本引用
- ✅ 整合到後台數據導出系統

### 2. 功能組件

#### 2.1 五行對應生理系統映射
- ✅ 木：肝、膽系統
- ✅ 火：心、小腸系統
- ✅ 土：脾、胃系統
- ✅ 金：肺、大腸系統
- ✅ 水：腎、膀胱系統

#### 2.2 健康狀態分析
- ✅ 過弱檢測（level 0-1）：生成嚴重警告或一般警告
- ✅ 過旺檢測（level 3）：生成警告和建議
- ✅ 風險等級評估：'normal' | 'warning' | 'critical'
- ✅ 結合疾厄宮分數分析

#### 2.3 健康預警生成
- ✅ 生成詳細警告列表（包含器官、系統、症狀、建議）
- ✅ 生成健康建議列表（按優先級排序）
- ✅ 生成完整健康報告文字

## 📊 數據結構

### 健康預警結果
```javascript
{
  riskLevel: 'warning', // 'normal' | 'warning' | 'critical'
  summary: '發現 2 個健康警告。建議關注 木氣、火氣 相關系統。',
  jiePalaceNote: '⚠️ 疾厄宮能量較弱（45.2分），需要特別注意健康管理。',
  warnings: [
    {
      element: '木',
      level: 0,
      severity: 'critical',
      type: 'weak',
      organs: ['肝', '膽'],
      systems: ['肝膽系統', '神經系統', '筋骨系統'],
      risk: '肝膽功能偏弱，容易疲勞、情緒不穩、筋骨痠痛。建議：規律作息、適度運動、避免過度飲酒。',
      symptoms: ['疲勞', '情緒不穩', '筋骨痠痛', '視力模糊', '失眠'],
      recommendation: '【木氣偏弱】肝膽功能偏弱，容易疲勞、情緒不穩、筋骨痠痛。建議：規律作息、適度運動、避免過度飲酒。'
    }
  ],
  recommendations: [
    {
      element: '木',
      priority: 'high',
      action: '規律作息、適度運動、避免過度飲酒。',
      focus: '肝、膽'
    }
  ],
  elementLevels: {
    '木': 0,
    '火': 2,
    '土': 1,
    '金': 2,
    '水': 1
  },
  strongestElement: '火',
  weakestElement: '木',
  detailedReport: '...完整報告文字...'
}
```

## 🔍 健康預警邏輯

### 風險等級判定
- **critical**：任何五行 level = 0（嚴重過弱）
- **warning**：任何五行 level = 1（一般過弱）或 level = 3（過旺）
- **normal**：所有五行 level = 1-2（相對均衡）

### 疾厄宮結合分析
- 如果疾厄宮分數 < 50：增加健康警告
- 如果疾厄宮分數 >= 80：標記為健康基礎良好

## 🔄 使用方式

### 自動模式（已整合）
```javascript
// 系統會自動計算五行健康預警（在 computeAllPalaceScores 中）
computeAllPalaceScores(ziwei, horoscope, { bazi, age })
// 結果存儲在 window.healthWarning
```

### 手動模式
```javascript
// 1. 準備五行數據
const wuxingData = {
  raw: bazi.wuxing.strategic || bazi.wuxing.raw || {}
};

// 2. 準備宮位分數（可選，用於結合疾厄宮分析）
const palaceScores = {
  "疾厄": 45.2,
  // ... 其他宮位
};

// 3. 生成健康預警
const healthWarning = window.HealthAnalysis.generateHealthWarning(
  wuxingData,
  palaceScores
);

console.log('風險等級:', healthWarning.riskLevel);
console.log('摘要:', healthWarning.summary);
console.log('警告數量:', healthWarning.warnings.length);
```

## 📝 五行健康映射表

| 五行 | 器官 | 系統 | 過弱風險 | 過旺風險 |
|------|------|------|---------|---------|
| 木 | 肝、膽 | 肝膽、神經、筋骨 | 疲勞、情緒不穩、筋骨痠痛 | 易怒、頭痛、高血壓 |
| 火 | 心、小腸 | 心血管、循環、小腸 | 心悸、手腳冰冷、精神不振 | 心煩、失眠、口乾舌燥 |
| 土 | 脾、胃 | 消化、免疫、肌肉 | 消化不良、食慾不振 | 腹脹、便秘、體重增加 |
| 金 | 肺、大腸 | 呼吸、大腸、皮膚 | 感冒、氣喘、皮膚乾燥 | 咳嗽、皮膚過敏 |
| 水 | 腎、膀胱 | 泌尿、生殖、骨骼 | 腰痠背痛、頻尿、記憶力下降 | 水腫、頻尿、關節疼痛 |

## 🧪 測試建議

1. **基本測試**：
   - 完成計算後，檢查 `window.healthWarning`
   - 查看控制台日誌

2. **過弱測試**：
   - 測試五行 level = 0 的情況
   - 驗證是否生成 critical 警告

3. **過旺測試**：
   - 測試五行 level = 3 的情況
   - 驗證是否生成 warning

4. **疾厄宮結合測試**：
   - 測試疾厄宮分數 < 50 的情況
   - 驗證是否增加健康警告

## 📝 下一步

1. ✅ 五行健康預警完成
2. ⏳ 整合到後台管理界面顯示
3. ⏳ 整合到 AI Prompt 生成（Phase 4）
4. ⏳ 實現 Phase 3.2: 戰略標籤優化

