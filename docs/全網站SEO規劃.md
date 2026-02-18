# 全網站 SEO 規劃

> 目標：提升搜尋能見度、結構化資料、多語系與 Core Web Vitals

---

## 一、現況盤點

| 項目 | 狀態 | 說明 |
|------|------|------|
| meta description | ✅ 有 | index.html、i18n 依語系切換 |
| meta title | ✅ 有 | 人生說明書｜一起出來玩 |
| og:image / og:title | ✅ 有 | index.html 已含 og:image、og:title、Twitter Card |
| sitemap.xml | ✅ 有 | 專案根目錄 |
| robots.txt | ✅ 有 | 專案根目錄 |
| canonical URL | ✅ 有 | index.html 已含 canonical |
| hreflang | ❌ 缺 | 多語系未標註 |
| JSON-LD 結構化 | ❌ 缺 | 無 |
| GA4 | ✅ 有 | 已串接 |

---

## 二、技術 SEO 清單

### 2.1 每頁必備（優先）

| 頁面 | title | description | og:image |
|------|-------|-------------|----------|
| index.html | 人生說明書｜八字紫微 2026 戰略｜一起出來玩 | 輸入出生時間，取得八字五行、紫微 12 宮與 2026 流月紅綠燈。了解角色設定，迎向無悔人生。 | 1200×630 主視覺 |
| consultation.html | 1:1 深度諮詢｜人生說明書 | 專業命理師一對一深度諮詢，結合命盤與流年，協助你做出關鍵決策。 | 同上或專屬圖 |
| startup.html | — | — | 可 noindex |
| 後台頁面 | — | — | 建議 noindex |

### 2.2 Open Graph / Twitter Card

```html
<!-- index.html head 內新增 -->
<meta property="og:type" content="website" />
<meta property="og:url" content="https://www.17gonplay.com/" />
<meta property="og:title" content="人生說明書｜八字紫微 2026 戰略｜一起出來玩" />
<meta property="og:description" content="輸入出生時間，取得八字五行、紫微 12 宮與 2026 流月紅綠燈。" />
<meta property="og:image" content="https://www.17gonplay.com/assets/og-image.jpg" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:locale" content="zh_TW" />
<meta property="og:site_name" content="一起出來玩" />

<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="人生說明書｜八字紫微 2026 戰略" />
<meta name="twitter:description" content="輸入出生時間，取得八字五行、紫微 12 宮與 2026 流月紅綠燈。" />
<meta name="twitter:image" content="https://www.17gonplay.com/assets/og-image.jpg" />
```

### 2.3 canonical

```html
<link rel="canonical" href="https://www.17gonplay.com/" />
```

（consultation 用 `https://www.17gonplay.com/consultation.html`）

### 2.4 hreflang（多語系）

若繁中／簡中／英為同一 URL 切換（非子路徑），可擇一：

**方案 A**：單一 canonical + 不設 hreflang（簡化，適合 SPA 語系切換）

**方案 B**：若有獨立語系 URL（如 /en/、/zh-TW/），則加：

```html
<link rel="alternate" hreflang="zh-TW" href="https://www.17gonplay.com/?lang=zh-TW" />
<link rel="alternate" hreflang="zh-CN" href="https://www.17gonplay.com/?lang=zh-CN" />
<link rel="alternate" hreflang="en" href="https://www.17gonplay.com/?lang=en" />
<link rel="alternate" hreflang="x-default" href="https://www.17gonplay.com/" />
```

---

## 三、結構化資料（JSON-LD）

### 3.1 WebApplication（首頁）

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "name": "人生說明書",
  "alternateName": "一起出來玩",
  "description": "結合八字五行、紫微斗數與 2026 流月紅綠燈的個人戰略指揮中心。",
  "url": "https://www.17gonplay.com/",
  "applicationCategory": "LifestyleApplication",
  "operatingSystem": "Any",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "TWD"
  }
}
</script>
```

### 3.2 Organization（全站可選）

```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "一起出來玩",
  "url": "https://www.17gonplay.com",
  "logo": "https://www.17gonplay.com/assets/logo-circle.png"
}
```

---

## 四、sitemap.xml

**路徑**：`/sitemap.xml`（根目錄或 `public/sitemap.xml`）

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://www.17gonplay.com/</loc>
    <lastmod>2026-02-16</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://www.17gonplay.com/consultation.html</loc>
    <lastmod>2026-02-16</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
</urlset>
```

---

## 五、robots.txt

**路徑**：`/robots.txt`

```
User-agent: *
Allow: /
Disallow: /expert-admin.html
Disallow: /admin.html
Disallow: /admin-copy.html
Disallow: /test-
Disallow: /activity-

Sitemap: https://www.17gonplay.com/sitemap.xml
```

---

## 六、Core Web Vitals 優化

| 指標 | 建議 | 作法 |
|------|------|------|
| LCP | < 2.5s | 主視覺圖優化、font-display: swap、preload 關鍵資源 |
| FID / INP | < 100ms | 減少主執行緒阻塞、defer 非關鍵 script |
| CLS | < 0.1 | 圖片設 width/height、保留版面空間、避免動態插入無預留空間內容 |

**可檢查**：Cloudflare Web Analytics、GA4、PageSpeed Insights

---

## 七、內容與關鍵字建議

### 7.1 主關鍵字（繁中）

- 八字算命、紫微斗數、命盤、2026 流年、五行
- 人生說明書、命運分析、個人戰略

### 7.2 長尾關鍵字

- 「八字 紫微 免費」「2026 流年 運勢」「五行 缺什麼」

### 7.3 description 優化

- 控制在 150–160 字元
- 包含主要關鍵字與行動呼籲
- 範例：`輸入出生時間，免費取得八字五行、紫微 12 宮與 2026 流月紅綠燈。了解你的角色設定，迎向無悔人生。`

---

## 八、實作優先順序

| 優先 | 項目 | 工作量 | 效益 |
|------|------|--------|------|
| 1 | og:image、og:title、og:description | 低 | 社群分享品質、點擊率 |
| 2 | sitemap.xml + robots.txt | 低 | 索引效率 |
| 3 | canonical | 低 | 避免重複內容 |
| 4 | JSON-LD WebApplication | 低 | 搜尋結果豐富摘要 |
| 5 | 後台頁面 noindex | 低 | 避免無效頁面被索引 |
| 6 | hreflang（若有獨立語系 URL） | 中 | 多語系搜尋 |
| 7 | og-image 主視覺製作 | 中 | 分享與品牌一致性 |
| 8 | Core Web Vitals 調校 | 中 | 排名與體驗 |

---

## 九、Search Console 設定

1. 到 [Google Search Console](https://search.google.com/search-console) 新增資源
2. 驗證網域（DNS 或 HTML 檔案）
3. 提交 `sitemap.xml` 網址
4. 定期查看「成效」與「涵蓋範圍」

---

## 十、已實作項目（2026-02-16）

- [x] index.html：canonical、OG、Twitter、JSON-LD、SEO 內容區塊
- [x] sitemap.xml、robots.txt
- [x] 後台頁面 noindex
- [x] **og-image**：`assets/og-image.jpg`（1200×630，約 138KB）供 OG / Twitter 分享

---

## 十一、檢查清單（部署前）

- [ ] 每頁有 unique title、description
- [x] og:image 為 1200×630 且可正確載入
- [ ] sitemap.xml 可存取
- [ ] robots.txt 可存取
- [ ] canonical 正確
- [ ] JSON-LD 無語法錯誤（可先用 [Rich Results Test](https://search.google.com/test/rich-results) 驗證）
- [ ] 後台、測試頁加上 `<meta name="robots" content="noindex, nofollow" />`
