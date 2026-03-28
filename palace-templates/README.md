# Palace section shell

Two layers:

1. **Base palace template** — one layout / component tree (`palace-section-shell.css` + HTML structure).
2. **Palace theme presets** — per-gong skin via config, not forked page layouts.

## Files

| File | Role |
|------|------|
| [`palace-section-shell.css`](./palace-section-shell.css) | Shared layout, typography, cards, lifeline SVG classes, a11y. |
| [`palace-section-themes.css`](./palace-section-themes.css) | `[data-palace="<id>"]` tokens, core-orb variants, gradient overrides, 財帛中段加粗. |
| [`palace-theme-presets.json`](./palace-theme-presets.json) | **Single config source:** 12 宮 → `lifelineFamily` + `symbolGlyph` + copy; five **line families** (`balanced`, `sharp`, `wave`, `spiral`, `broken`) each with four SVG `d` strings. |
| [`palace-theme-apply.js`](./palace-theme-apply.js) | Loads JSON, sets `document.documentElement.dataset.palace`, applies paths to `#pmso-*` ids, updates title/subtitle/symbol. |

## Typed mirror (TypeScript)

- `src/lifebook-viewer/themes/palaceVisualTheme.ts` — `PalaceId`, exports.
- `src/lifebook-viewer/themes/palaceThemePresets.ts` — imports `palace-theme-presets.json`, `getLifelinePathsForPalace`, `resolvePalacePreset`, etc.

## React (`SectionPalaceTemplate`)

- Pass **`palaceId`** (e.g. `ming`, `guanlu`, `caibo`) together with **`vm`** (content only).
- Root node: **`data-palace-root` + `data-palace={resolvedId}`** so `palace-section-themes.css` applies (same tokens as static HTML).
- Imports **`palace-section-shell.css`** + **`palace-section-themes.css`** from `src/lifebook-viewer/components/section/SectionPalaceTemplate.tsx` (single theme pipeline; do not fork palette in the module).

## Demos (repo root)

- `palace-ming-refactor-section-order.html`, `palace-ming-refactor.html` — link shell + themes CSS, include theme picker + `palace-theme-apply.js`.

**Query / hash:** `?palace=guanlu` or `#guanlu` picks initial palace (after JSON loads).

## Local preview

- **`npx serve .`** (repo root): relative `palace-templates/palace-theme-presets.json` works.
- **Vite** (`npm run dev`, e.g. `localhost:3000`): only files under **`public/`** are exposed at `/`. Run **`npm run sync:palace-presets`** so `public/palace-templates/palace-theme-presets.json` exists; `palace-theme-apply.js` tries the relative URL first, then **`/palace-templates/palace-theme-presets.json`**.
- Opening HTML via `file://` may not load JSON.

## Section order

The “Section 順序對齊” demo follows `SectionPalaceTemplate` / lifebook section flow; see `docs/lifebook-palace-visual-fold-spec.md` if present.
