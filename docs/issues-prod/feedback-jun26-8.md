# Issue: Quantity Rules Enforcement (Partial — Repro Needed)

**Issue ID:** feedback-jun26-8
**Status:** Partial — defensive fix landed; live repro needed for any remaining bug
**Priority:** 🟡 Medium
**Created:** 2026-05-29
**Last Updated:** 2026-05-29

## Overview

PDF feedback: "Rules not working for quantity". The Loom URL was not watched in this session; without a specific reproduction the original "rules don't work" claim couldn't be confirmed against current code.

## What I verified statically

Both widgets DO gate ATC on validation:

- FPB (`app/assets/bundle-widget-full-page.js:3952`): `addBundleToCart` calls `areBundleConditionsMet()` → `isStepCompleted(index)` → `ConditionValidator.isStepConditionSatisfied(step, stepSelections)`.
- PPB (`app/assets/bundle-widget-product-page.js:3315`): `addToCart` calls `validateStep(index)` → `ConditionValidator.isStepConditionSatisfied(step, currentSelections)`.

The save path persists `conditionType`, `conditionOperator`, and `conditionValue` to flat columns. The server formatter (`app/lib/bundle-formatter.server.ts:176`) emits them to the storefront. The 97 unit tests in `tests/unit/assets/condition-validator.test.ts` exercise every operator + edge case.

## What I fixed defensively

Admin save handlers used the pattern `value ? parseInt(value) || null : null` which silently drops `conditionValue: 0` to null. If a merchant set a rule like "quantity equal_to 0", the rule was lost. Replaced with a small `parseConditionValue` helper that uses `Number(value)` + finite check + accepts `0`.

Occurrences fixed:
- `app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/handlers/handlers.server.ts` lines 445, 447, 798, 800
- `app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/handlers/handlers.server.ts` lines 423, 425, 1126, 1128
- `app/routes/app/app.bundles.create_.configure.$bundleId/route.tsx` lines 592, 594

(The wizard's pre-existing `c1?.conditionValue ? parseInt(c1.conditionValue, 10) : null` form is OK for "0" because the ternary uses the original string in the falsy branch and doesn't follow with `|| null` — but I still routed through the shared helper for consistency.)

## What still needs the user's input

If "rules not working for quantity" describes a specific failure mode beyond the `0` case (e.g., a particular operator misbehaves, the ATC button isn't disabled, the toast doesn't appear), I need either:

1. A reproducible setup on Wolfpack SIT (bundle ID + step rule config + ATC steps to fail), OR
2. The Loom from the PDF watched + specific timestamps for the failing behavior.

Until then this commit is a defensive cleanup; the headline bug remains unverified.

## Files Changed

- `app/lib/parse-condition-value.ts` (new) — pure helper.
- `tests/unit/lib/parse-condition-value.test.ts` (new).
- FPB handlers, PPB handlers, CREATE wizard route — drop the `|| null` pattern, use the helper.

## Tests

- `parseConditionValue("0")` → `0` (the bug fix).
- `parseConditionValue("3")` → `3`.
- `parseConditionValue("")` → `null`.
- `parseConditionValue(null)` → `null`.
- `parseConditionValue("abc")` → `null` (NaN).

## Phases Checklist

- [x] Phase 1: Audit save paths, confirm widget ATC gates wire to validators
- [x] Phase 2: Identify defensive parseInt bug, write helper + tests
- [x] Phase 3: Apply across admin save handlers
- [ ] Phase 4: Live repro of the original PDF claim (deferred — needs user input)
- [x] Phase 5: Commit + document partial completion

**Status:** Partial. Defensive fix landed. Headline bug pending repro.

## Progress Log

### 2026-05-29 — Partial implementation complete
- Confirmed both widget ATC paths gate on validation.
- Helper + 5 unit tests + replaced all occurrences in three save paths.
- No `WIDGET_VERSION` bump — admin-side save only; no widget code changed.

### 2026-05-29 — Starting investigation
- Code trace started.
