# PPB Product Page Template Modularization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Split PPB product-page template-specific storefront code out of the monolithic product-page widget source.

**Architecture:** Add a product-page template module list to `scripts/build-widget-bundles.js`, concatenate those modules before `bundle-widget-product-page.js`, and import/install template modules from the raw source so syntax and bundle paths stay aligned. First implementation slice moves the CASCADE/Product List methods into `app/assets/widgets/product-page/templates/cascade-template.js`.

**Tech Stack:** Plain JavaScript storefront widget source, existing custom bundle script, Jest source-contract tests, Shopify theme-extension generated assets.

---

### Task 1: Add Modular Build Contract

**Files:**
- Modify: `tests/unit/assets/bundle-widget-product-page-init.test.ts`
- Modify: `scripts/build-widget-bundles.js`
- Create: `app/assets/widgets/product-page/templates/cascade-template.js`
- Modify: `app/assets/bundle-widget-product-page.js`

- [x] **Step 1: Write failing source-contract test**

Add a Jest test that checks the build script has `PRODUCT_PAGE_MODULES`, that the CASCADE template file exists in the module list, and that module code is emitted before the main widget source.

- [x] **Step 2: Add module bundling**

Add `PRODUCT_PAGE_MODULES` to `scripts/build-widget-bundles.js`, read/process modules with the existing `removeModuleStatements` and `removeUseStrict` helpers, and place them before `processedWidget` in `buildProductPageBundle()`.

- [x] **Step 3: Move CASCADE methods**

Create `app/assets/widgets/product-page/templates/cascade-template.js` exporting `installCascadeTemplate(BundleWidgetProductPage)` and move `_isProductPageCascadeTemplate`, `_getSelectedProductEntries`, `_getCascadeFooterMessage`, and `_renderCascadeFooter` into prototype assignments.

- [x] **Step 4: Install module from main widget**

Import `installCascadeTemplate` in `app/assets/bundle-widget-product-page.js`, remove the moved class methods, and call `installCascadeTemplate(BundleWidgetProductPage)` before `initializeProductPageWidget()`.

- [x] **Step 5: Verify and build**

Run `node --check` on the widget and module, focused Jest, `npm run build:widgets`, `npm run minify:assets css`, modified-file ESLint, and graphify rebuild.
