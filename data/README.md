# 紫微／八字共用對照表

供**前端**與**後端（Worker / iztro）**共用，避免簡繁兩套對照表不同步。

- **`star-name-trad.json`**  
  iztro 回傳簡體星名 → 轉成繁體供前端顯示、以及 content API 的 `stars` 用繁體當 key。  
  用法：`繁體名 = map[iztro星名] ?? iztro星名`

- **`palace-key-map.json`**  
  宮位簡繁對照：key 為繁體宮名（命宮、財帛…），value 為該宮位可能的 key 列表（含簡體、帶「宮」字等）。  
  後端組 `mainStars` 時若 iztro 用簡體宮名，可用此表對齊；前端 `getStarsForPalace` 已用同一邏輯。

後端建議：呼叫 iztro 後用 `star-name-trad.json` 把星名統一轉繁體再回傳（或前端已會轉，但 content 的 `stars` 請用繁體 key）。
