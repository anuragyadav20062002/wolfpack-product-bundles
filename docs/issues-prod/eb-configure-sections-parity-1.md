# Issue: EB Configure Sections Parity — Step Flow, Bundle Visibility, Bundle Settings, Select Template, Discount & Pricing

**Issue ID:** eb-configure-sections-parity-1
**Status:** In Progress
**Priority:** 🔴 High
**Created:** 2026-05-23
**Last Updated:** 2026-05-25 17:30

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
15. [ ] Lint + commit

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
  - [ ] Update BXY default text constants
  - [ ] Widget JS update + rebuild (bundle-widget-full-page.js, bundle-widget-product-page.js, pricing-calculator.js)
  - [ ] Data migration script: nested → flat format for existing DB records
  - [ ] Lint + tests + commit
