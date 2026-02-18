# Phase 1 Target Modules

First wave of brand rewrite. High visibility, user-facing entry points.

---

## 1. i18n — meta, brand, home

**Files:** `data/i18n/zh-TW.json`, `zh-CN.json`, `en.json`

**Keys:**
- `meta.title`, `meta.description`
- `brand.navFull`, `brand.navShort`, `brand.footerBrand`, `brand.footerHandle`, `brand.tagline`
- `home.heroHeadline`, `home.heroSubheadline`, `home.heroPrimaryCta`, `home.heroTitle`, `home.heroSubtitle`, `home.heroCtaPrimary`
- `home.helperUnsureTime`, `home.helperEstimateBtn`, `home.saveChart`
- `home.feature1Title`, `home.feature1Body`, `home.feature2Title`, `home.feature2Body`, `home.feature3Title`, `home.feature3Body`

**Rationale:** First impression. Homepage, nav, footer. Brand voice foundation.

---

## 2. i18n — ui (core)

**Files:** `data/i18n/*.json`

**Keys:**
- `ui.appTitle`, `ui.submit`, `ui.loading`, `ui.calculate`, `ui.back`, `ui.lang`
- `ui.formTitle`, `ui.formSubtitle`
- `ui.launchBtn`, `ui.saveChart`
- `ui.loadError`, `ui.loadErrorDetail`, `ui.launchFailed`, `ui.unknownError`
- `ui.navZiwei`, `ui.navBazi`, `ui.navLiuyue`, `ui.navHome`, `ui.navConsult`

**Rationale:** Global UI labels. Used across all pages.

---

## 3. i18n — consult

**Files:** `data/i18n/*.json`

**Keys:**
- `consult.ctaHeadline`, `consult.ctaSupport`, `consult.ctaButton`, `consult.ctaFooter`
- `consult.equipmentQuote`

**Rationale:** Primary conversion CTA. High impact on sign-ups.

---

## 4. index.html — Static labels

**File:** `index.html`

**Items:**
- Section subtitle "Five Elements Meanings" (line ~1988) — currently hardcoded; consider i18n
- aria-labels: 回到首頁, 1:1 諮詢, 開啟選單, 戰略導航, 收合宮位說明

**Rationale:** Visible on main dashboard. Some may need i18n migration.

---

## 5. auth-service.js — Login / logout

**File:** `js/ui/services/auth-service.js`

**Strings:**
- 登入為, 登出, 登入
- Error messages: Google 登入失敗…, 登入失敗…, 無法開啟登入視窗…

**Rationale:** Auth flow. User-facing errors.

---

## Summary

| Module | Scope | Priority |
|--------|-------|----------|
| i18n meta/brand/home | Brand identity, homepage | P0 |
| i18n ui (core) | Global labels | P0 |
| i18n consult | CTA, conversion | P0 |
| index.html static | Dashboard labels | P1 |
| auth-service | Login flow | P1 |
