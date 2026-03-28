# Lifebook ViewModel Field Source Map

This table keeps Home/Section builders aligned and prevents source drift.

## SectionViewModel

- `status` -> `resolveSignals()` (priority: findings -> time-module -> keyword fallback)
- `signals` -> `resolveSignals()` (priority: findings -> time-module -> keyword fallback)
- `gate` / `isLocked` / `lockReason` / `previewMode` / `ctaVariant` -> `resolveGateContract()` from plan access + locked sections
- `summary` -> section raw (`structure_analysis`, first sentence)
- `whyItMatters` -> section raw (`behavior_pattern`, first sentence)
- `recommendAction` -> section raw + time context (`strategic_advice`, first sentence)
- `primaryWarnings` -> section raw (`blind_spots`, split)
- `relatedTimeline` -> `chart_json.yearlyHoroscope.year` + monthly context
- `sourceTrace` -> adapter-injected debug origin metadata

## HomeSummary

- `timeline[].status` / `timeline[].signals` -> `resolveSignals()` (same priority as Section)
- `timeline[].gate` / `timeline[].isLocked` -> `resolveGateContract()`
- `timeline[].monthPreview` -> `s19/time-module` first, fallback to summary defaults
- `revelation payload (month)` -> `buildRevelationPayloadFromAction()` auto-build rows:
  - why
  - how
  - consequence

