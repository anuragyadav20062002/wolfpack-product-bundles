# Issue: EB Configure Sections Parity — Step Flow, Bundle Visibility, Bundle Settings, Select Template, Discount & Pricing

**Issue ID:** eb-configure-sections-parity-1
**Status:** In Progress
**Priority:** 🔴 High
**Created:** 2026-05-23
**Last Updated:** 2026-05-28 11:07 IST

## Overview

Full EB parity pass on configure-page sections, for both FPB and PPB:
1. **Step Flow card + Step Setup + Category accordion** — inner content, heading, card structure
2. **Bundle Visibility** — entire section + sub-sections
3. **Bundle Settings** — entire section
4. **Select Template** — full reaudit (modals, buttons, copy, layout)
5. **Discount & Pricing** — full section parity: BXY rule UI, Progress Bar (Step-Based + Multi Language), Discount Messaging (language UI + default texts)

Done section-by-section, FPB+PPB together per section. Screenshots taken at each stage to verify 100% accuracy before committing.

## Related Documentation
- `internal docs/EB Implementation Reference.md`
- `docs/competitor-analysis/16-eb-full-data-flow-investigation.md`

## Progress Log

### 2026-05-28 11:07 IST - Create flow discount rule card/CTA aligned to EB pattern

- Updated create-configure discount rule layout to match EB-like rule card behavior:
  - Rule header now uses shared spacing so `Rule #N` and `Remove` remain adjacent with no wide separation.
  - "Add rule" call-to-action now uses lower-case text, secondary variant, plus icon, full-width style, and 4-rule max notice.
  - Discount rule card now uses shared EB-style discount rule card background/border treatment.
- Next: verify in create flow and finalize commit under `eb-configure-sections-parity-1`.

### 2026-05-28 11:02 IST - Discount & Pricing rule cards aligned to EB gray style containers

- Matched EB-style gray rule-card treatment in Discount & Pricing (`discountRuleCard`) for both FPB and PPB configure surfaces.
- Added `className={...discountRuleCard}` to all per-rule sections in Bundle Quantity Options and Progress Bar (Step-Based).
- Added `className={...discountRuleCard}` to per-rule Discount Messaging sections for `Discount Text` and `Success Message`.
- Scope: only FPB/PPB Discount & Pricing UI parity UI-structure styling; no behavioral logic changes in this pass.
- Next: run full parity verification and commit these UI-style updates with an issue-prefixed commit message.

### 2026-05-28 10:54 IST - BXY discount messaging defaults made rule-order aware

- Added rule-order-aware `Buy X, get Y` default text generation in `app/lib/pricing-display-options.ts` so only the first BXY tier uses the existing base default while later tiers use the `... more to get ...` text.
- Passed the discount method and rule index through live form hydration (`app/hooks/useBundlePricing.ts`, `app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/route.tsx`, `app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/route.tsx`) so newly created and existing BXY tiers receive the correct defaults.
- Added/updated unit assertions in `tests/unit/lib/pricing-display-options.test.ts` for `getDefaultDiscountRuleText` and `normalizePricingRuleMessages` to lock the first-vs-subsequent BXY wording behavior.

### 2026-05-28 11:05 IST - Added one-time nested pricing rule migration script

- Added `scripts/migrate-pricing-rules.ts` to migrate stored nested pricing rules to flat format used by current admin code.
- Script supports `--dry-run` mode and only writes `BundlePricing.rules` when migration is needed.
- Migration uses `migrateNestedRule` + `parsePricingRule` from `app/lib/pricing-rule-parser.ts` to validate and normalize output.
- Added `npm run migrate:pricing-rules` as a convenience entrypoint for dry-run execution.

### 2026-05-28 10:58 IST - Bulk parity completion + storefront/template/SDK follow-up committed in-progress

- Completed a large in-progress batch across Discount & Pricing parity, configure route behavior, template parity, widget/template runtime, shared hooks/services, unit coverage, and evidence docs.
- Updated issue log and supporting evidence in `docs/issues-prod/select-template-1.md`, `docs/issues-prod/discount-pricing-eb-parity-plan.md`, and `docs/eb-ui-clone-rewrite/*.md`.
- Rebuilt/generated assets and related graph outputs were included in the working set for this batch.
- Next: continue from same issue scope with remaining parity polish and final verification pass after this handoff.

### 2026-05-25 20:20 IST - Scoped Discount & Pricing implementation committed

- Created commit `485f9f6b` (`[eb-configure-sections-parity-1] fix: match discount pricing configure behavior`) containing the verified implementation, revised plan, navigation map update, and focused tests.
- The commit hook rebuilt `graphify-out/GRAPH_REPORT.md` and `graphify-out/graph.json`; these generated files remain outside the scoped commit because they already contained unrelated working-tree modifications.
- Issue remains `In Progress` until the multi-language modal interactions can be repeated in a store context with configured shop locales; the committed code contract, unit tests, and production build cover their current field structure and modal wiring.

### 2026-05-25 20:20 IST - Discount & Pricing live-parity implementation verified

- Completed the scoped FPB and PPB Discount & Pricing corrections: confirmed discount-type order and rule structures, Buy X/get Y field layout and persistent notice, Bundle Quantity Options eligibility and localized Box fields, Progress Bar mode/language fields, Discount Messaging Variables behavior, and method-aware Buy X/get Y default messages.
- Kept the implementation within existing pricing display-option and configure-route persistence paths. The shared discount method labels also affect the create-configure consumer; no schema, widget, storefront, or compatibility migration code was introduced.
- Runtime verification passed in embedded PPB and FPB for Buy X/get Y rendering, notice behavior, Variables modal contents, and native modal close. A fresh PPB fixed-amount rule also showed eligible Box Label/Box Subtext fields. Multi-language modal activation cannot be runtime-exercised in SIT because the loaded shop exposes no locales; its fields and modal targets are covered by source-contract tests and the production build.
- Regression coverage passed: `npx jest tests/unit/routes/discount-pricing-ui-contract.test.ts tests/unit/lib/pricing-rule-defaults.test.ts tests/unit/lib/pricing-display-options.test.ts tests/unit/routes/discount-pricing-parity.test.ts --runInBand --silent` (49 tests), `npx eslint --max-warnings 9999 ...` (0 errors, 1234 accepted existing warnings), and `npm run build`. `npx tsc --noEmit --pretty false` remains blocked by pre-existing syntax errors at `tests/unit/lib/analytics-helpers.test.ts:308`.
- Updated the app navigation map for the changed modal/control flow and rebuilt the graphify code graph (3340 nodes, 4542 edges, 512 communities). Generated graph outputs were already modified in the working tree before this scoped implementation and are excluded from its commit.

### 2026-05-25 20:12 IST - FPB BXY browser pass identifies method-aware message default gap

- In the live embedded FPB route, switching an unsaved discount to `Buy X, get Y` correctly renders the BXY rule inputs, hides Bundle Quantity Options, and displays the persistent messaging notice.
- The same FPB state renders the standard `Discount Text` default rather than the confirmed BXY default. PPB renders the BXY default correctly.
- Root cause: FPB uses `normalizePricingRuleMessages()` for unsaved/default rule text, but that helper currently has no discount-method input and can only synthesize standard defaults.
- Next: add a failing unit case for BXY default normalization, pass the existing method into current normalization consumers, and repeat FPB runtime proof.

### 2026-05-25 20:12 IST - Runtime verification identifies modal target wiring correction

- Verified the updated PPB Discount & Pricing surface in a fresh embedded Admin tab: the confirmed discount-type order, display-option ordering, Discount Messaging fields, and five Variables tokens render from the current implementation.
- A direct click and keyboard activation of the native close control left the new Variables modal open. Shopify's Polaris web-component guidance requires addressable modal IDs for command/method-controlled overlays, while the new Discount & Pricing modals currently lack IDs.
- A saved pre-existing PPB test bundle displays a quantity selection with missing stored `conditionType`, which keeps Bundle Quantity Options ineligible. A newly created quantity rule enables the section correctly; no backwards-compatibility inference will be added.
- Next: add failing source-contract assertions for addressable pricing modals, add the scoped Polaris modal IDs without changing live copy/layout, and repeat embedded close/BXY verification.

### 2026-05-25 17:54 IST - TDD red baseline identifies bounded pricing-message wiring addition

- Added `tests/unit/routes/discount-pricing-ui-contract.test.ts` and expanded `test-spec/discount-pricing-parity.spec.md` for the confirmed live admin controls.
- Red baseline: `npx jest tests/unit/routes/discount-pricing-ui-contract.test.ts --runInBand` fails 13 of 14 assertions; FPB already passes only the display-option ordering assertion.
- Confirmed implementation gaps include Simple Bar extra fields, wrong Buy X, get Y option copy/notice, missing type-change default rule, wrong Variables modal behavior/content, missing Bundle Quantity Options language modal, rule-header/disabled-state styling hooks, and PPB display-option ordering.
- The missing Bundle Quantity Options language modal cannot persist translations using the existing payload. Scope is therefore expanded only to carry localized `Box Label` / `Box Subtext` values through existing `displayOptions.bundleQuantityOptions` form-state and save wiring; no schema, widget, or storefront change is introduced.
- Next: implement route/style/state/payload corrections, then make the new contract tests green and run the focused existing pricing suite.

### 2026-05-25 17:51 IST - Implementation baseline completed from live FPB and PPB

- Rechecked the live EB Discount & Pricing surface in both a Full Page Bundle and Product Page Bundle before source changes; no `How to setup` or `Learn More` action is visible within the affected section.
- Confirmed FPB renders the same distinct Fixed Bundle Price and Buy X, get Y rule structures already captured for PPB, and that Buy X, get Y hides Bundle Quantity Options.
- Corrected one audit transcription: both live bundle types label the progress radio `Step-Based Bar`, not `Step-Based`.
- Existing repository code already contains earlier Discount & Pricing work; this pass is a corrective parity implementation against the revised live contract rather than a new feature pipeline.
- Next: update the plan/reference/test contract for the corrected radio label, write failing parity assertions for remaining gaps, then edit the two configure surfaces and scoped styles only where the tests/live comparison identify differences.

### 2026-05-25 17:34 IST - Discount & Pricing live-parity plan revised

- Replaced the draft plan in `docs/issues-prod/discount-pricing-eb-parity-plan.md` with a live-evidence implementation contract, corrected UI state tables, modal contracts, scoped implementation phases, and verification checklist.
- Updated the local ignored reference `internal docs/EB Implementation Reference.md` with confirmed Fixed Bundle Price fields, Bundle Quantity Options modal behavior, Progress Bar labels/state behavior, shared Discount Messaging success field, and the Buy X, get Y notice behavior.
- No application code, tests, widget assets, SDK assets, or generated graph outputs were changed during this plan-revision pass.
- Next: begin implementation only from the revised plan after review of this corrected baseline.

### 2026-05-25 17:31 IST - Re-audited Discount & Pricing plan against live EB before implementation

- User directed that `docs/issues-prod/discount-pricing-eb-parity-plan.md` be revised before any implementation changes.
- Captured live PPB Discount & Pricing states for Percentage Off, Fixed Amount Off, Fixed Bundle Price, and Buy X, get Y in a disposable unsaved EB tab; opened the Bundle Quantity Options, Progress Bar, and Variables modals for exact labels and behavior.
- Corrected plan targets: non-Buy X, get Y rules retain threshold fields; Fixed Bundle Price uses `Number of Products in Bundle` and `Price`; Buy X, get Y uses `Minimum quantity of items`, `Quantity`, and the exact apply-to choices; both multi-language modals include `Select Language`; progress inputs use `Tier Text` and `Tier Subtext`; the Buy X, get Y messaging notice remains visible when messaging is disabled.
- Confirmed with two percentage rules that Discount Messaging has one per-rule `Discount Text` field and a single bottom `Success Message` field.
- This documentation correction supersedes the unverified layout assumptions in the draft plan; no implementation code is changed in this pass.
- Next: revise the plan and internal EB reference, then review them as the implementation contract.

### 2026-05-25 12:00 - Section 6: Exact type shape confirmed, beginning TDD

**Scope re-confirmed by user:** Full flat-shape migration (EB shape, not nested WPB shape).

**Blast radius (all consumers of `rule.discount` / `rule.condition`):**
- `app/types/pricing.ts` — type definition (core change)
- `app/lib/pricing-display-options.ts` — normalize/serialize
- FPB handler, FPB route.tsx
- PPB handler, PPB route.tsx
- `app/routes/app/app.bundles.create_.configure.$bundleId/route.tsx`
- `app/services/bundles/metafield-sync/operations/bundle-product.server.ts`
- `app/services/bundles/metafield-sync/operations/component-product.server.ts`
- `app/services/bundles/standard-metafields.server.ts`
- `app/services/bundles/pricing-calculation.server.ts`
- `app/assets/bundle-widget-full-page.js` + product-page + pricing-calculator.js (+ rebuild)
- Cart transform (Rust) reads a SEPARATE compact `$app:price_adjustment` metafield — not directly the PricingRule type. Metafield writer changes shape written, Rust stays the same.

**New flat `PricingRule` interface (target):**
```typescript
export interface PricingRule {
  id: string;
  // Flat condition (replaces nested condition: { type, operator, value })
  conditionType: 'quantity' | 'amount';
  conditionValue: number;
  // Flat discount value (method is top-level on PricingConfiguration.method)
  discountValue: number;
  // BXY-specific fields (only when PricingConfiguration.method === BUY_X_GET_Y)
  customerBuys?: number;
  customerGets?: number;
  bxyDiscountType?: 'percentage' | 'fixed_amount';
  bxyApplyMode?: 'lowest_priced' | 'latest_added';
}
```

**Dropped from PricingRule:**
- `condition: { type, operator, value }` — replaced by `conditionType` + `conditionValue`
- `discount: { method, value }` — replaced by `discountValue`; `method` stays top-level
- `condition.operator` — dropped; EB always uses ≥; cart transform compact writer hard-codes `"gte"`
- `display?: { label, color }` — not in EB, dropped
- `buyStepId`, `getStepId` — PPB step-based BXY removed, dropped
- `getQty` — replaced by `customerGets`

**Extended `PricingMessages`:**
```typescript
export interface PricingMessages {
  progress: string;
  qualified: string;
  showInCart: boolean;
  // NEW: for Progress Bar Step-Based per-rule tier text
  tierTextByRuleId?: Record<string, { tierText: string; tierSubtext: string }>;
  // NEW: for Progress Bar Multi Language modal
  tierTextByLocaleByRuleId?: Record<string, Record<string, { tierText: string; tierSubtext: string }>>;
}
```

**Implementation sequence (TDD):**
1. [x] Type shape defined (this log entry)
2. [x] Create test spec `test-spec/discount-pricing-parity.spec.md`
3. [x] Write failing tests for `parsePricingRule` and `parsePricingConfiguration` (19 RED)
4. [x] Create `app/lib/pricing-rule-parser.ts` — make tests GREEN (19/19)
5. [x] Update `app/types/pricing.ts` — new flat PricingRule, extended PricingMessages
6. [x] Update `app/lib/pricing-display-options.ts`
7. [x] Update FPB + PPB handlers (flat shape in buildFullPageBundlePricing + Prisma upsert + metafield payload)
8. [x] Update metafield sync writers (bundle-product + component-product + standard-metafields)
9. [x] Update pricing-calculation.server.ts
10. [x] BXY UI: FPB + PPB route.tsx (Customer buys/gets + discount type + apply mode)
11. [x] Progress Bar: Step-Based tier text/subtext fields + Multi Language modal (FPB + PPB)
12. [x] Discount Messaging: dropdown + chips language selector (FPB + PPB)
13. [x] Update widget JS + rebuild (pricing-calculator, template-manager, full-page, product-page; v2.9.2)
14. [x] Data migration: not needed — metafield write boundary already normalizes inline
15. [x] UI parity pass: Discount & Pricing section (FPB + PPB) — all EB-matching changes
16. [x] Lint + commit

### 2026-05-25 21:30 - FPB Card 2 parity: BQO + Progress Bar + Discount Messaging updated to match PPB

**FPB route.tsx Card 2 changes:**
- BQO section: gated on `discountType !== BUY_X_GET_Y` (was always visible); Multi Language button moved inline with toggle header at `justifyContent: space-between` level (removed from inside nested div); "Make this rule default" changed from `variant={isDefault ? "primary" : "secondary"}` → ★/☆ pattern matching PPB
- Progress Bar section: Multi Language button moved inline with toggle header; Simple Bar text fields changed from `s-stack direction="inline"` → `direction="block"`; help text updated to match PPB (`"Shown while customer..."` / `"Shown when the discount is unlocked..."`)
- Discount Messaging section: "Enable multi-language" checkbox moved from inside nested div → inline with toggle header (gated on `discountMessagingEnabled && shopLocales.length > 0`); added BXY info banner; removed per-rule Success Message field; added global Success Message `<s-section>` after all rule sections; wired to `globalSuccessMessage` / `successMessageByLocale` state

**ESLint:** 0 errors on both files.

**Status:** Both FPB and PPB Card 1 and Card 2 are now identical. All UI parity complete.

### 2026-05-25 20:00 - Step 15 complete: Discount & Pricing UI parity (FPB + PPB)

**FPB route.tsx changes:**
- Discount Messaging toggle: `s-checkbox` → `s-switch`
- Added explicit "Enable multi-language" `s-checkbox` inside expanded Discount Messaging (was implicit via language select)
- Multi-language section now gated on `discountMessagingMultiLanguageEnabled`: shows language dropdown + "Active languages" label + primary locale chip always + saved locale chips
- Removed `setDiscountMessagingMultiLanguageEnabled(true)` side-effect from language select onChange (now purely checkbox-controlled)
- Discount Text / Success Message: `s-text-area` → `s-text-field` with BXY-aware default texts (`DEFAULT_DISCOUNT_RULE_TEXT_BXY` / `DEFAULT_DISCOUNT_RULE_SUCCESS_MESSAGE_BXY` when `discountType === BUY_X_GET_Y`)
- Added `DEFAULT_DISCOUNT_RULE_TEXT_BXY` + `DEFAULT_DISCOUNT_RULE_SUCCESS_MESSAGE_BXY` to imports

**PPB route.tsx changes:**
- Added imports: `DEFAULT_DISCOUNT_RULE_TEXT`, `DEFAULT_DISCOUNT_RULE_SUCCESS_MESSAGE`, `DEFAULT_DISCOUNT_RULE_TEXT_BXY`, `DEFAULT_DISCOUNT_RULE_SUCCESS_MESSAGE_BXY`, `DEFAULT_PROGRESS_BAR_PROGRESS_TEXT`, `DEFAULT_PROGRESS_BAR_SUCCESS_TEXT` from `pricing-display-options`
- Removed `generateRulePreview` import (no longer used after Preview line removal)
- Progress Bar useState defaults: replaced hardcoded strings with `DEFAULT_PROGRESS_BAR_PROGRESS_TEXT` / `DEFAULT_PROGRESS_BAR_SUCCESS_TEXT`
- BXY rule layout: restructured from 2 inline rows → vertical with bold "Customer buys" / "Customer gets" headings, then inline row [discountValue | discountType select | applyMode select]; labels "Lowest Priced" → "The lowest priced items", "Latest Added" → "The latest added items"
- Non-BXY rules: renamed "Condition type" → "Discount on", "Minimum quantity/amount" → "is greater than or equal to"; added Fixed Bundle Price branch (shows only "Number of Products in Bundle" + "Price", no "Discount on" select); removed "Preview:" line
- Discount Messaging: moved from Card 1 to Card 2 (Discount Display Options section); toggle `s-checkbox` → `s-switch`; added "Enable multi-language" checkbox; restructured multi-lang section with "Active languages" label + primary locale chip always shown; `s-text-area` → `s-text-field` with BXY-aware defaults
- BQO toggle: `s-checkbox` → `s-switch`
- Progress Bar toggle: `s-checkbox` → `s-switch`
- Progress Bar type: `s-select` → `s-choice-list` with `<s-choice>` children
- Tier Text/Subtext: `s-text-area` → `s-text-field`; labels simplified to "Tier Text" / "Tier Subtext" with "Rule #N" heading above
- Simple Bar text fields: `s-text-area` → `s-text-field`; switched from inline to block stack

**ESLint:** 0 errors on all modified files.

**Status:** All Discount & Pricing UI changes complete. Ready to commit.

### 2026-05-25 17:30 - Step 13 complete: Widget JS updated to flat rule shape (v2.9.2)

**Finding:** `bundle-product.server.ts:349-351` and `handlers.server.ts:128` already inline-normalize nested → flat on every metafield write. No standalone migration script needed.

**Files changed:**
- `app/assets/widgets/shared/pricing-calculator.js` — `calculateDiscount`: replaced `rule.condition.*` reads with `rule.conditionType || rule.condition?.type` + `rule.conditionValue ?? rule.condition?.value`; replaced `rule.discount.method/value` with `bundle.pricing?.method` + `rule.discountValue ?? rule.discount?.value`; fixed early-skip guard (`!rule.condition` → `!conditionType`); fixed sort comparator. `getNextDiscountRule`: same reads updated.
- `app/assets/widgets/shared/template-manager.js` — `createDiscountVariables`: same flat-first fallback reads.
- `app/assets/bundle-widget-full-page.js` — promo banner block: `rule.discount?.method/value` → `pricing.method` + `rule.discountValue ?? rule.discount?.value`; `bestRule.condition?.value/operator` → flat-first.
- `app/assets/bundle-widget-product-page.js` — progress bar block: `rule?.condition?.value/type` → `rule?.conditionValue ?? rule?.condition?.value`; `rule.discount?.value` → `rule.discountValue ?? rule.discount?.value`.
- `scripts/build-widget-bundles.js` — `WIDGET_VERSION` bumped 2.9.1 → 2.9.2
- `npm run build:widgets` — FPB bundled 239.1 KB, PPB bundled 148.8 KB ✓

**Next:** Lint + commit (step 15)

### 2026-05-25 16:30 - Steps 11–12 complete: Progress Bar Multi Language + Discount Messaging (FPB + PPB)

**FPB route.tsx** (previously completed):
- Added `tierTextByRuleId`, `tierTextByLocaleByRuleId`, `progressBarMultiLangModalRef`, `isProgressBarMultiLangModalOpen`, `activeProgressBarLocale` state
- Added `discountMessagingMultiLanguageEnabled`, `ruleMessagesByLocale`, `activeDiscountLocale` state with `originalRef` mirrors
- Progress Bar section: Multi Language button enabled when `step_based` + has locales; step_based shows per-rule Tier Text/Subtext; simple shows Progress/Success text
- Added Progress Bar Multi Language `<s-modal>` with language dropdown + per-rule tier text/subtext per locale
- Discount Messaging: replaced `<details>/<summary>` Show Variables with `<s-button variant="plain">` + added language `<s-select>` + "Active languages" `<s-chip>` row; per-locale rule message editing wired
- `discountData` formData updated to include `tierTextByRuleId`, `tierTextByLocaleByRuleId`, `ruleMessagesByLocale`, `discountMessagingMultiLanguageEnabled`

**PPB route.tsx** (this entry):
- Added same state block: `tierTextByRuleId`, `tierTextByLocaleByRuleId`, `progressBarMultiLangModalRef`, `isProgressBarMultiLangModalOpen`, `activeProgressBarLocale`, `discountMessagingMultiLanguageEnabled`, `ruleMessagesByLocale`, `activeDiscountLocale`
- Added `useEffect` wiring for Progress Bar Multi Language modal open/close
- Added `useModalHideListener` for progress bar modal
- Progress Bar section: Multi Language button now conditional on `progressBarType === "step_based"` (was hardcoded `disabled`); step_based shows per-rule Tier Text/Subtext; simple shows Progress/Success text
- Added Progress Bar Multi Language `<s-modal>` with same language dropdown + per-rule tier text pattern
- Discount Messaging: removed old `<details>/<summary>` "Show Variables" + pre-existing multi-language absence; added language `<s-select>` + chips + per-locale rule message editing
- Both `formData.append("discountData", ...)` and hidden `<input name="discountData">` updated with new fields
- ESLint: 0 errors

**Next:** Lint + commit (step 15)

### 2026-05-25 14:00 - Step 10 complete: BXY rule UI updated in all three configure routes

- FPB `route.tsx`: removed `ConditionType`, `ConditionOperator`, `DISCOUNT_CONDITION_TYPE_OPTIONS`, `DISCOUNT_OPERATOR_OPTIONS` imports; replaced old nested rule fields with flat-shape conditional render — BXY shows customerBuys/customerGets/discountValue/bxyDiscountType/bxyApplyMode; non-BXY shows conditionType/conditionValue/discountValue
- PPB `route.tsx`: same import cleanup; replaced old step-based BXY UI (`buyStepId`/`getStepId`/`getQty`) with new quantity-based BXY section; replaced non-BXY nested fields with flat-shape fields
- `create_.configure.$bundleId/route.tsx`: same import cleanup; added BXY/non-BXY conditional inside wizard rule builder
- 28 unit tests GREEN (pricing-display-options + discount-pricing-parity)
- ESLint: 0 errors on all three files

### 2026-05-25 10:00 - Section 6: Discount & Pricing — research complete, beginning implementation

Scope decisions (confirmed prior session):
- **DTO:** Keep WPB's nested `PricingRule` shape; add missing BXY fields (`applyDiscountTo`). No full flat-shape migration needed — EB's flat shape is less expressive and migration would be destructive.
- **BXY approach:** Replace BXY rule UI to match EB — "Customer buys" / "Customer gets" / "Discount value" / "Discount type" (% off | ₹ off) / "Apply Discount to" (lowest | latest). Both FPB + PPB.
- **Multi-language:** Implement full EB pattern for both Discount Messaging (language dropdown + chips + per-rule text fields) and Progress Bar Step-Based (tier text/subtext per rule + Multi Language modal).

Key findings from live EB investigation:
- BXY rule: `customerBuys` (min qty) + `customerGets` (qty) + `discountValue` + `discountType` (% off | ₹ off) + `applyDiscountTo` (lowest | latest)
- Progress Bar Simple Bar → Multi Language button disabled; Step-Based Bar → button enabled
- Step-Based Bar reveals per-rule "Tier Text" (e.g., "Add 3") + "Tier Subtext" (e.g., "1 Product(s) @ 100% off") editable fields
- Progress Bar Multi Language modal: "Customize Text for Multiple Languages" → Select Language dropdown + per-rule Tier Text | Tier Subtext → "Save and close"
- Discount Messaging: language dropdown (not tabs), "Active languages" chip, "Show Variables" button
- BXY default texts: Rule 1 = `"Add {{discountConditionDiff}} product(s) to get {{discountedItems}} of them at..."`, Rule N = `"Add {{discountConditionDiff}} more to get {{discountedItems}}..."`, Success = `"Success! You got {{discountedItems}}..."`
- All findings added to `internal docs/EB Implementation Reference.md`

Implementation plan for FPB + PPB:
1. Extend `PricingRule` type with `applyDiscountTo?: "lowest" | "latest"` and `bxyDiscountSubtype?: "percentage" | "fixed_amount"`
2. BXY rule UI: conditional render when `discountType === BUY_X_GET_Y` — show Customer buys/gets/discount value/type/apply-to fields
3. Progress Bar: when Step-Based Bar — show per-rule Tier Text + Tier Subtext fields; "Multi Language" button opens `<s-modal>` with language dropdown + per-rule fields
4. Add `tierTextByRuleId` + `tierTextByLocaleByRuleId` to `BundlePricing.messages` JSON
5. Discount Messaging: change from tab-based locale selector to dropdown + chips
6. Update default text constants for BXY
7. Update `pricingState` hook + FPB/PPB handlers
8. Run lint + commit

### 2026-05-24 21:00 - Step Flow card: move divider from above step tabs to below (FPB + PPB)

FPB changes:
- `full-page-bundle-configure.module.css`: `.stepNav` changed `border-top` → `border-bottom` (divider now appears after step tabs, not before them)
- `full-page-bundle-configure.module.css`: `.stepFlowCard` changed `padding-bottom: 0` → `padding-bottom: 8px` (gives the border-bottom breathing room inside the card before the card's outer border)

PPB changes:
- `product-page-bundle-configure.module.css`: `.stepNav` changed `border-top` → `border-bottom`
- `app.bundles.product-page-bundle.configure.$bundleId/route.tsx`: added `style={{ paddingTop: "16px" }}` to slide animation wrapper div so "Step Setup" heading has breathing room below the new divider

Also read EB "How to setup?" popup content in full — our implementation is aligned with EB's multi-step flow: Steps → Categories → Products, selection rules (step-level and category-level), discounts, and design.

### 2026-05-23 06:00 - Section 1 complete: Category accordion + Step Setup parity

FPB + PPB changes:
- Removed "Category Title" s-text-field from category accordion body — EB does not have this field
- Changed "Edit Products"/"Add Products" conditional → always "Add Products" (EB constant label)
- Changed "Edit Collections"/"Add Collections" conditional → always "Add Collections" (EB constant label)
- Rules Configuration: changed description bottom margin 16px → 8px
- Added "Learn More" linkButton below description (confirmed via live EB accessibility tree uid=123_63)
- Restored `{ label: "Category rules", value: "category" }` radio option — live EB has this (uid=123_68); was wrongly removed in eb-fpb-parity-clone-6
- Files: `app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/route.tsx`, `app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/route.tsx`
- ESLint: 0 errors; all unit tests passing

### 2026-05-24 10:00 - Section 2 complete: Bundle Visibility parity (FPB + PPB)

FPB + PPB changes:
- App Embed Status: removed leading `<s-icon>` — EB has no icon before the heading
- Publishing Best Practices cards: replaced `<s-icon name="image-alt" />` placeholder with `<img src={img} alt={title} />` using WPB public images (bundleGallery.png, fpb.png, pdp.png, productPageThumbnail.png); `.visibilityGuideMedia` height raised 74px → 120px with `overflow:hidden` + `img { object-fit:cover }` in shared CSS
- Your Bundle Link: removed `<s-icon name="globe" />` before heading; changed inline stack → block stack; added "emails," to description to match EB copy exactly
- Files: `app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/route.tsx`, `app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/route.tsx`, `app/styles/routes/bundle-configure-shared.module.css`
- ESLint: 0 errors; visually verified in Chrome (App Embed Status no icon, cards with images, Bundle Link no globe)

### 2026-05-24 12:30 - Section 4 complete: Select Template modal (FPB + PPB)

FPB + PPB changes:
- Removed inline `{activeSection === "select_template" && ...}` panel — Select Template no longer occupies main content area
- Added `selectTemplateModalRef` + `isSelectTemplateModalOpen` state to both routes
- Nav "Select Template" click now opens `<s-modal heading="Customization">` instead of switching inline section
- Modal contains: "Customize your bundle" header + subtitle + "Customize Colors & Language" secondary button; 2×2 template grid with `<h3>` card names (matching EB a11y pattern); "Next" primary button that closes modal
- `useModalHideListener` wired so Escape/backdrop/X also closes and resets state
- FPB templates: STANDARD/CLASSIC/COMPACT/HORIZONTAL with FBP_SIDE_FOOTER layout
- PPB templates: CASCADE/COGNIVE/MODAL/SIMPLIFIED with PDP_INPAGE/PDP_MODAL layouts
- Files: `app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/route.tsx`, `app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/route.tsx`
- ESLint: 0 errors

### 2026-05-24 11:30 - Section 3 complete: Bundle Settings parity (FPB + PPB)

FPB + PPB changes:
- Pre Selected Product: changed `s-checkbox` → `s-switch`; added second description paragraph "These products will be added to user's box automatically on the first step."
- Enable Quantity Validation: added `productSlotsEnabled` + `maxQtyPerProduct` state/formData/handler for FPB (PPB already had it); max qty field now disabled when toggle is OFF
- Slot Icon: moved from standalone section → nested inside EQV section block
- Variant Selector + Show Text on + Button: kept as SettingsRow entries; "Show Text on + Button" now gated (text field only shown when toggle is ON; clearing addToCartButton on toggle OFF)
- Cart line item discount display: extracted into its own dedicated s-section; "Edit Defaults" button moved inline with section heading
- Redirect to checkout: kept as its own section (WPB-specific)
- Bundle Banner: changed from stacked vertical → 2-column CSS grid side-by-side ("Banner Image: Desktop" 1900x230 | "Banner Image: Mobile" 1100x500); same change applied to PPB where section was previously missing
- Bundle Level CSS: changed from always-open textarea → collapsible button (▾ chevron) revealing textarea on click
- WPB-specific rows (Show product prices, Show compare-at prices, Allow quantity changes) kept in own section
- Files: `app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/route.tsx`, `app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/handlers/handlers.server.ts`, `app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/route.tsx`
- Chrome DevTools verified: a11y tree confirmed all 13 sub-sections present; visual confirmed Bundle Banner 2-col + CSS collapsible render correctly

### 2026-05-23 - Issue created, starting Section 1: Step Flow + Step Setup + Category accordion

### 2026-05-24 14:00 - Starting Section 5: Select Template v2 — full-screen overlay + field rename + dedicated save + dismiss bug fix

New phases (extending existing Section 4 work):
- Rename DB fields: `wpbLayoutTemplate` → `bundleDesignTemplate`, `wpbPresetId` → `bundleDesignPresetId` (match EB names)
- Replace `s-modal` with `position:fixed;inset:0` full-screen overlay (EB parity; z-index 2147482000)
- Dedicated `useFetcher` save on "Next" click (`intent: "updateBundleDesignTemplate"`) — independent of main form
- Dismiss bug eliminated by removing `s-modal` entirely
- Both FPB + PPB routes

### 2026-05-24 20:00 - Select Template: align modal pattern with all other modals (FPB + PPB)

- Added `isSelectTemplateModalOpen` state (initialized `false`) to both FPB + PPB
- Added `useEffect` watching `isSelectTemplateModalOpen` → `showPolarisModal`/`hidePolarisModal` — exactly the same pattern as `isSyncModalOpen`, `isProductsModalOpen`, etc.
- `openSelectTemplateModal` now calls `setIsSelectTemplateModalOpen(true)` (was direct `showPolarisModal`)
- `useModalHideListener` now calls `setIsSelectTemplateModalOpen(false)` + `setTemplateModalStep("select")`
- "Preview bundle" button calls `setIsSelectTemplateModalOpen(false)` (not `hidePolarisModal` directly)
- `size="large"` + confirm step layout retained from prior session
- Files: `app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/route.tsx`, `app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/route.tsx`
- ESLint: 0 errors

### 2026-05-24 19:00 - Select Template: full-screen modal, dismiss fix, confirm step layout, divider removal (FPB + PPB)

- Added `size="large"` to `<s-modal>` — opens full-screen
- Confirm step: moved "View your bundle" heading + subtitle outside the gray card to match EB screenshot (previously they were inside)
- Removed `stepSetupDivider` HR from PPB Step Flow card (was 1px gray line between step nav chips and step content)
- Files: `app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/route.tsx`, `app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/route.tsx`
- ESLint: 0 errors

### 2026-05-24 18:00 - Select Template: switch to s-modal, add confirm step (FPB + PPB)

- Replaced position:fixed custom overlay with `s-modal heading="Customization"` — Shopify Admin renders native chrome (heading + X dismiss button)
- Removed manual keyboard Escape listener (s-modal handles natively); added `useModalHideListener` to reset step on close
- "Next" no longer closes modal — transitions to "confirm" step showing "Your bundle is ready / Preview bundle" screen (EB parity)
- "Preview bundle" calls `hidePolarisModal` to close
- `openSelectTemplateOverlay` renamed `openSelectTemplateModal`; uses `showPolarisModal` imperatively

### 2026-05-24 17:30 - Post-E2E fixes: barrel export + X dismiss button (FPB + PPB)

- Fixed `handleUpdateBundleDesignTemplate` missing from PPB + FPB `handlers/index.ts` barrel re-exports — caused HTTP 500 on template save POST
- Added X dismiss button (top-right of overlay header) to both FPB + PPB overlays; calls `setIsSelectTemplateOverlayOpen(false)`

### 2026-05-24 16:30 - Section 5 complete

Files changed:
- `prisma/schema.prisma` — renamed `wpbLayoutTemplate` → `bundleDesignTemplate`, `wpbPresetId` → `bundleDesignPresetId`
- `prisma/migrations/20260524081409_rename_bundle_design_template_fields/` — migration applied
- `app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/handlers/parsers.ts` — renamed `parseWpbTemplate` → `parseBundleDesignTemplate`, updated field names
- `app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/handlers/handlers.server.ts` — removed template fields from `handleSaveBundle`, added `handleUpdateBundleDesignTemplate`
- `app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/handlers/handlers.server.ts` — same; fixed stray extra `}` parsing error
- `app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/route.tsx` — full-screen overlay, `templateFetcher`, Escape key, pending state, removed s-modal; fixed stray extra `}` parsing error
- `app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/route.tsx` — same
- `tests/unit/routes/select-template.test.ts` — updated to `parseBundleDesignTemplate` + new field names (12 tests, all green)

## Phases Checklist

- [x] Section 1: Step Flow card + Step Setup + Category accordion (FPB + PPB)
  - [x] Audit EB screenshots
  - [x] Implement FPB changes
  - [x] Implement PPB changes
  - [ ] E2E verify in Chrome (full E2E at end of all sections)
- [x] Section 2: Bundle Visibility (FPB + PPB)
- [x] Section 3: Bundle Settings (FPB + PPB)
- [x] Section 4: Select Template — modal (FPB + PPB)
- [x] Section 5: Select Template v2 — full-screen overlay + EB field rename + dedicated save + dismiss fix
  - [x] TDD: update tests (RED)
  - [x] Update parsers.ts (GREEN)
  - [x] Schema migration: rename DB fields
  - [x] FPB handler: remove from saveBundle, add handleUpdateBundleDesignTemplate
  - [x] PPB handler: same
  - [x] FPB route.tsx: full-screen overlay + templateFetcher
  - [x] PPB route.tsx: same
  - [x] Lint + commit
- [ ] Section 6: Discount & Pricing parity (FPB + PPB)
  - [x] Audit EB — BXY rule UI, Progress Bar, Discount Messaging (complete)
  - [x] Exact new flat PricingRule type shape defined (see 2026-05-25 12:00 log)
  - [x] TDD: test spec `test-spec/discount-pricing-parity.spec.md`
  - [x] TDD RED: failing tests for `parsePricingRule` + `parsePricingConfiguration`
  - [x] TDD GREEN: `app/lib/pricing-rule-parser.ts` parsers
  - [x] Update `app/types/pricing.ts` — new flat PricingRule, extended PricingMessages
  - [x] Update `app/lib/pricing-display-options.ts` — adapt to flat shape
  - [x] Update FPB + PPB handlers (remove nested backwards-compat readers)
  - [x] Update metafield sync writers (bundle-product, component-product, standard-metafields)
  - [x] Update pricing-calculation.server.ts
  - [x] BXY UI: FPB + PPB + create-configure route.tsx — Customer buys/gets + discount type + apply mode
  - [x] Progress Bar Step-Based: per-rule Tier Text + Tier Subtext fields (FPB + PPB)
  - [x] Progress Bar Multi Language modal (s-modal, language dropdown, per-rule tier texts) (FPB + PPB)
  - [x] Discount Messaging: dropdown + chips language selector (FPB + PPB)
  - [x] Update BXY default text constants
  - [ ] Widget JS update + rebuild (bundle-widget-full-page.js, bundle-widget-product-page.js, pricing-calculator.js)
  - [x] Data migration script: nested → flat format for existing DB records
  - [ ] Lint + tests + commit
