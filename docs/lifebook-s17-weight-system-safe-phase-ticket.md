# S17 Weight System Safe Phase Ticket

Date: 2026-03-19  
Scope: data structure + parser only (no renderer wiring)

## Accepted Requirements

- Display label uses `交友宮`; internal canonical remains `僕役宮`.
- Malefic tone strength is `中等` (clear influence, not fear-based).
- First palace strategy target: 財帛宮 style bias = practical risk-control first.
- Safety gate: parser can resolve main/supportive/misc/brightness/weights in the same palace, while current output remains unchanged.

## Implemented

- Added S17 weight model modules:
  - `worker/src/lifebook/s17/weights/types.ts`
  - `worker/src/lifebook/s17/weights/config.ts`
  - `worker/src/lifebook/s17/weights/registry.ts`
  - `worker/src/lifebook/s17/weights/alias.ts`
  - `worker/src/lifebook/s17/weights/parser.ts`
  - `worker/src/lifebook/s17/weights/index.ts`
- Added alias mapping:
  - canonical: `交友宮 -> 僕役宮`
  - display: `僕役宮 -> 交友宮`
- Added moderate malefic bias and multipliers.
- Added parse-time weighted context builder (`buildWeightedPalaceContext`) without touching renderer flow.

## Verification

Executed:

```bash
npx vitest run tests/s17WeightsParser.test.ts tests/PalaceNarrativeBuilder.test.ts tests/getPalaceSectionReaderOverrides.test.ts tests/getStarByPalaceMerge.test.ts
```

Result:

- Files passed: 4/4
- Tests passed: 17/17
- Failures: 0

## Safety Conclusion

- Parsing and normalization requirements are met.
- Existing S17 rendering outputs remain unchanged in this phase because renderer code path is not switched to weighted selection yet.

## Next Phase (renderer integration)

- Add layer-wise top-N selection (`core/decision/phenomenon/pitfall`) with threshold.
- Keep low-score stars only in `星曜結構解析`.
- Start with 財帛宮 (70% practical risk control, 30% psychological narrative).

---

## Phase 2 Update (財帛宮 pilot enabled)

- Enabled weighted narrative selection for `財帛宮` only in `PalaceNarrativeBuilder`:
  - `core` top2 -> structural summary emphasis
  - `decision` top2 -> decision section
  - `phenomenon` top3 -> real-operation section
  - `pitfall` top2 -> pitfalls section
  - threshold: `DEFAULT_DRIVE_THRESHOLD = 2.8`
- Existing other palaces remain on previous path.
- Regression + new behavior test passed:
  - `tests/PalaceNarrativeBuilder.test.ts` includes no-main-star + `地劫` pull-through check.
