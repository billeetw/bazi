# 命書生成 API 使用說明

## 流程概覽

```
報名紀錄後台 → 點擊「產生命書」→ 跳轉 expert-admin?consultation_id=xxx
    ↓
expert-admin 自動載入該筆諮詢的出生資訊
    ↓
（需先完成計算）點擊「一鍵生成命書」
    ↓
前端：chart_json + weight_analysis → POST bazi-api /api/life-book/generate
    ↓
Worker 依序調用 OpenAI 生成 20 章 → 回傳 sections
    ↓
前端：LifeBookEngine.renderHTML() → 下載 HTML 檔
```

## bazi-api Worker 設定

1. **綁定 OpenAI API Key**（若尚未設定）：
   ```bash
   cd worker
   npx wrangler secret put OPENAI_API_KEY
   # 輸入你的 OpenAI API key
   ```

2. **部署**：
   ```bash
   npx wrangler deploy
   ```

## API 規格

**POST** `https://bazi-api.billeetw.workers.dev/api/life-book/generate`

**Request Body**：
```json
{
  "chart_json": {
    "ziwei": { ... },
    "bazi": { ... },
    "overlapAnalysis": { ... },
    "fourTransformations": { ... },
    "fiveElements": { ... }
  },
  "weight_analysis": {
    "importance_map": { "s01": "high", ... },
    "top_focus_palaces": [ ... ],
    "risk_palaces": [ ... ],
    "stable_palaces": [ ... ]
  }
}
```

**Response**：
```json
{
  "ok": true,
  "sections": {
    "s01": { "section_key": "s01", "title": "...", "structure_analysis": "...", ... },
    "s02": { ... },
    ...
  }
}
```

## 使用注意

- 生成 20 章約需 2–5 分鐘（依 OpenAI 回應速度）
- 需先完成專家系統「計算」（含四化、疊宮、五行）
- 從報名紀錄連結進入時，會自動填入出生資訊，但仍需點擊「計算」後才能產生命書

## Phase 1 優化（2025）

- **system**：專家人格 + 總則規則（固定）
- **user**：題號 + 該題模板 + 命盤切片 + 相關句庫（十神、五行弱項動態注入）
- **模型**：預設 `gpt-4o-mini`，可傳 `model` 參數切換（如 `gpt-5-main`）
