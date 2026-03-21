# Lifebook Test Ticket: Palace Mapping / S17 Reader

Date: 2026-03-19  
Scope: palace slot mapping, source-of-truth consistency, reader narrative rendering

## Goal

Validate that palace/star assignment is correct after the recent fixes:

1. `palaces[i].name` priority and anti-override behavior
2. complete-source rule for stars (no mixed source between `palaces` and `starByPalace`)
3. brightness lookup from the same slot
4. fallback safety when `name` is missing

## Commands Executed

```bash
npx vitest run tests/getStarByPalaceMerge.test.ts tests/findZiweiPalaceSlotIndexForCanonical.test.ts tests/getPalaceSectionReaderOverrides.test.ts tests/PalaceNarrativeBuilder.test.ts tests/defaultSanfangRelatedNote.test.ts
npx vitest run tests/lifeBookPrompts-module2.test.ts tests/normalizeChart.test.ts
```

## Result Summary

- Test files passed: **7 / 7**
- Tests passed: **33 / 33**
- Failures: **0**

## Key Assertions Covered

- `name` exists => palace identity comes from `palaces[i].name`, not rotation overwrite.
- when `palaces` has 12 slots => ignore `starByPalace` for render input mapping.
- same-palace stars are taken from one slot (major/minor/adjective path).
- slot index resolution for brightness uses canonical palace -> slot mapping.
- fallback path still works when `name` is missing (rotation path).

## Judgment

Current test run indicates the mapping fix is **correct** for covered scenarios.

## Remaining Risk / Next Ticket

- Four-transform display logic should be verified in an isolated ticket to ensure:
  - only in-palace matched transformed stars are rendered
  - no inferred transform list is generated from wrong palace lead stars
  - mismatch between `natalTransforms` and palace membership is rejected
