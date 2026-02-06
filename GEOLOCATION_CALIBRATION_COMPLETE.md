# 經緯度校準功能完成報告

## ✅ 功能概述

已成功實現 **Phase 2.2: 經緯度校準**，用於後台管理界面，採集出生地點的經緯度座標，支持瀏覽器定位和手動輸入，整合到計算流程和後台數據導出系統。

## 📁 新增文件

### `js/ui/components/geolocation-calibration.js`
經緯度校準組件，提供以下核心功能：

1. **瀏覽器定位**
   - 使用 `navigator.geolocation.getCurrentPosition()` API
   - 高精度定位（`enableHighAccuracy: true`）
   - 10秒超時設置
   - 錯誤處理（權限拒絕、位置不可用、超時）

2. **手動輸入**
   - 經度輸入（-180 到 180）
   - 緯度輸入（-90 到 90）
   - 格式驗證和範圍檢查
   - 支持小數點後6位精度

3. **數據管理**
   - 本地存儲自動保存
   - 全局狀態同步（`window.geolocationData`）
   - 數據載入和清空功能

## 🔗 整合點

### `index.html`
- 添加經緯度校準組件腳本引用
- 添加經緯度校準樣式（CSS）

### `js/calc/adminExport.js`
- 在 `exportCalculationResults` 函數中自動包含經緯度數據
- 導出格式包含經度、緯度、精度、來源、時間戳

### `js/calc/aiPromptGenerator.js`
- 在 `collectStructuredData` 函數中自動收集經緯度數據
- 整合到結構化數據中，供 AI Prompt 生成使用

## 📊 數據結構

### 經緯度數據結構

```javascript
{
  longitude: 121.5654,    // 經度（-180 到 180）
  latitude: 25.0330,      // 緯度（-90 到 90）
  accuracy: 10.5,         // 精度（米，僅瀏覽器定位時有）
  source: 'browser' | 'manual',  // 來源
  timestamp: '2026-02-05T12:00:00.000Z'  // 獲取時間
}
```

### 導出數據結構

```javascript
{
  geolocation: {
    longitude: 121.5654,
    latitude: 25.0330,
    accuracy: 10.5,
    source: 'browser',
    timestamp: '2026-02-05T12:00:00.000Z'
  }
}
```

## 🎯 使用範例

### 1. 初始化組件

```javascript
// 在後台管理界面中初始化
const container = document.getElementById('admin-geolocation-container');

window.GeolocationCalibration.init(container, {
  onSuccess: function(data) {
    console.log('經緯度設置成功:', data);
    console.log('經度:', data.longitude);
    console.log('緯度:', data.latitude);
    console.log('來源:', data.source);
  }
});
```

### 2. 使用瀏覽器定位

```javascript
// 手動調用瀏覽器定位
window.GeolocationCalibration.getBrowserLocation({
  onSuccess: function(data) {
    console.log('定位成功:', data);
  },
  onError: function(error) {
    console.error('定位失敗:', error.message);
  }
});
```

### 3. 手動設置經緯度

```javascript
// 手動設置（例如：台北101）
try {
  const data = window.GeolocationCalibration.setManualLocation(121.5654, 25.0330);
  console.log('設置成功:', data);
} catch (error) {
  console.error('設置失敗:', error.message);
}
```

### 4. 獲取當前經緯度數據

```javascript
// 獲取當前數據
const geoData = window.GeolocationCalibration.getGeolocationData();

if (geoData.longitude && geoData.latitude) {
  console.log('當前經緯度:', geoData.longitude, geoData.latitude);
} else {
  console.log('尚未設置經緯度');
}
```

### 5. 在後台導出中使用

```javascript
// 自動包含在後台數據導出中
const exportData = window.AdminExport.exportCalculationResults();

if (exportData.geolocation) {
  console.log('經緯度數據:', exportData.geolocation);
  console.log('經度:', exportData.geolocation.longitude);
  console.log('緯度:', exportData.geolocation.latitude);
}
```

### 6. 驗證經緯度格式

```javascript
// 驗證格式
const validation = window.GeolocationCalibration.validateCoordinates('121.5654', '25.0330');

if (validation.valid) {
  console.log('格式正確:', validation.longitude, validation.latitude);
} else {
  console.error('格式錯誤:', validation.error);
}
```

## 🔒 安全考慮

- **隱私保護**：瀏覽器定位需要用戶明確授權
- **數據存儲**：經緯度數據存儲在本地存儲和全局狀態中，不會自動上傳
- **可選功能**：經緯度數據為可選，不影響核心計算流程
- **權限處理**：如果用戶拒絕定位權限，提供手動輸入選項

## 📝 錯誤處理

### 瀏覽器定位錯誤

1. **權限拒絕**（PERMISSION_DENIED）
   - 提示：'用戶拒絕了地理位置請求'
   - 建議：使用手動輸入

2. **位置不可用**（POSITION_UNAVAILABLE）
   - 提示：'無法獲取地理位置資訊'
   - 建議：檢查設備定位功能

3. **請求超時**（TIMEOUT）
   - 提示：'地理位置請求超時'
   - 建議：重試或使用手動輸入

### 手動輸入驗證

- 經度必須在 -180 到 180 之間
- 緯度必須在 -90 到 90 之間
- 必須為有效數字格式

## ✅ 測試建議

1. **測試瀏覽器定位**
   ```javascript
   // 需要用戶授權
   window.GeolocationCalibration.getBrowserLocation({
     onSuccess: (data) => console.log('成功:', data),
     onError: (error) => console.error('失敗:', error.message)
   });
   ```

2. **測試手動輸入**
   ```javascript
   // 測試有效輸入
   const data1 = window.GeolocationCalibration.setManualLocation(121.5654, 25.0330);
   console.log('有效輸入:', data1);

   // 測試無效輸入（應該拋出錯誤）
   try {
     window.GeolocationCalibration.setManualLocation(200, 100);
   } catch (error) {
     console.log('捕獲錯誤:', error.message);
   }
   ```

3. **測試數據持久化**
   ```javascript
   // 設置數據
   window.GeolocationCalibration.setManualLocation(121.5654, 25.0330);
   
   // 重新載入頁面後
   const data = window.GeolocationCalibration.getGeolocationData();
   console.log('持久化數據:', data);
   ```

4. **測試後台導出**
   ```javascript
   const exportData = window.AdminExport.exportCalculationResults();
   if (exportData.geolocation) {
     console.log('經緯度數據已包含在導出中');
   }
   ```

## 🚀 下一步

根據項目計劃，下一步可以：

1. **整合到計算流程**
   - 在 `baziCore.js` 中使用經緯度數據進行天文校準
   - 調整時區計算（如果需要）

2. **後台管理界面開發**
   - 創建經緯度校準管理頁面
   - 實現地圖選擇器（可選）
   - 整合到命書生成流程

3. **數據庫整合**
   - 保存經緯度數據到數據庫
   - 實現歷史記錄查詢功能

## 📚 相關文檔

- `EXPERT_ADMIN_EDITION_ANALYSIS.md` - 項目整體分析
- `BACKEND_DATA_EXPORT_GUIDE.md` - 後端數據導出指南
- `EXPERT_QUESTIONNAIRE_COMPLETE.md` - 15題專家問卷文檔

---

**完成時間**：2026-02-05  
**狀態**：✅ 已完成並整合到後台數據導出系統
