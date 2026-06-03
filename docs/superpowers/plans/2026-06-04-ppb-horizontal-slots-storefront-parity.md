# PPB Horizontal Slots Storefront Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Match PPB Horizontal Slots storefront UI to the EB `PDP_MODAL` + `MODAL` reference while continuing the product-page template modularization.

**Architecture:** Add `modal-slot-template.js` to the product-page template module pipeline, move modal-slot helper methods out of the main widget, and apply Horizontal Slots CSS under `#bundle-builder-app[data-ppb-template-type="PDP_MODAL"][data-ppb-design-preset="MODAL"][data-ppb-slot-orientation="horizontal"]`. Live EB after switching the target Product Page bundle to Horizontal Slots renders a 345px widget column with a 104px by 200px dashed slot card and 80px by 80px placeholder image. Leave Vertical Slots scoped to `SIMPLIFIED`/vertical selectors.

**Tech Stack:** Plain JavaScript storefront widget source, existing widget bundle script, Jest source-contract tests, Shopify theme-extension generated assets.

---

### Task 1: Modularize Modal Slot Template

**Files:**
- Create: `app/assets/widgets/product-page/templates/modal-slot-template.js`
- Modify: `app/assets/bundle-widget-product-page.js`
- Modify: `scripts/build-widget-bundles.js`
- Modify: `tests/unit/assets/bundle-widget-product-page-init.test.ts`
- Modify: `app/assets/widgets/product-page-css/bundle-widget.css`

- [x] **Step 1: Write failing source-contract test**

Add a Jest test that checks `modal-slot-template.js` exists, is listed before `cascade-template.js` in `PRODUCT_PAGE_MODULES`, and is installed before widget initialization.

- [x] **Step 2: Move modal-slot helpers**

Move `_isProductPageModalSlotTemplate`, `_usesVerticalModalSlotLayout`, `syncProductPagePrimaryCtaStyle`, `_createModalSlotStepSection`, `createEmptyStateCard`, and `_appendSlotIcon` into `installModalSlotTemplate(BundleWidgetProductPage)`.

- [x] **Step 3: Add Horizontal Slots CSS parity**

Add `PDP_MODAL` + `MODAL` + horizontal-scoped CSS for EB-like 345px widget width, 104px by 200px dashed slot card, 80px by 80px salmon placeholder block, Product label spacing below the image, disabled Add Bundle CTA, and Buy It Now block.

- [x] **Step 4: Verify and build**

Run syntax checks, focused Jest, `npm run build:widgets`, `npm run minify:assets css`, ESLint, and graphify rebuild before commit.
