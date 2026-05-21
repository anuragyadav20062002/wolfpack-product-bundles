# Issue: Step Setup + Category UI/UX Parity with Easy Bundles

**Issue ID:** step-category-ui-parity-1
**Status:** In Progress
**Priority:** 🔴 High
**Created:** 2026-05-15
**Last Updated:** 2026-05-16 10:00

## Overview

Full UI/UX parity between WPB Full-Page Bundle edit flow and Easy Bundles for:
- Bundle Product card (step product cards)
- Step Setup section (entirely)
- Category section with per-category Products + Collections tabs

Easy Bundles is the gold standard reference. Every pixel-accurate difference must be
resolved. Architectural/data model changes are driven by EB's category-per-row model.

## Architecture Decisions

- **Data model**: Option B — New `StepCategory` Prisma model (full relational, separate table)
  - Replaces the existing `collections` (Json) + `filters` (Json) blobs on `BundleStep`
  - Each `StepCategory` has: `name`, `sortOrder`, `products` (Json), `collections` (Json)
  - EB's model: each category = { name (storefront tab label), products[], collections[] }
  - `BundleStep.StepProduct[]` relation stays for backward compat during migration

- **Category section**: Both "Browse Products" and "Browse Collections" tabs work per category
  - EB uses category rows so merchants can assign both Products AND Collections to one tab
  - WPB must implement the same per-category Products + Collections tabs

## Phases Checklist

### Phase 1 — Safe UI changes (no data model dependency)
- [x] Nav rail: Replace ✥/◌/⌂/⌘ emoji icons with ●/○ CSS circle indicators
- [x] Step chip: Remove ✕ delete button from chip
- [x] Step Setup header: Add globe (Multi Language) + clone + delete icon buttons alongside checkbox (match EB header layout)
- [x] Step Setup card: Remove bottom Clone Step + Delete Step buttons (moved to header)

### Phase 2 — StepCategory Prisma model
- [x] Add `StepCategory` model to `prisma/schema.prisma`
- [x] Add `StepCategory[]` relation to `BundleStep`
- [x] Run Prisma migration: `npx prisma migrate dev` → `20260515135812_add_step_category`

### Phase 3 — FPB save handler + loader
- [x] Update FPB loader Prisma include to load `StepCategory[]` (`route.tsx` + all handler re-fetches)
- [x] Save handler: add `StepCategory: { create: [...] }` to step create block
- [x] All 5 Prisma includes in `handlers.server.ts` updated with `StepCategory: { orderBy: { sortOrder: 'asc' } }`

### Phase 4 — FPB route UI — Category accordion rows
- [x] Add `categoryActiveTabs: Record<string, number>` state (keyed by `${stepId}__${catId}`)
- [x] Replace old step-level Browse Products/Collections tabs + legacy Category filters section with EB-style per-category accordion rows
- [x] Each row: drag handle + inline name textbox + clone/delete icon buttons
- [x] Per-category Browse Products tab + Browse Collections tab with resourcePicker
- [x] Add Category button appends new empty `StepCategory` to state
- [x] All mutations wired to `stepsState.updateStepField` + `markAsDirty()`
- [x] CSS: added `.categoryAccordion`, `.categoryAccordionHeader`, `.categoryNameInput` classes
- [x] Lint: 0 errors

### Phase 5 — Metafield builders + widget
- [x] Update `bundle-product.server.ts` to read `StepCategory[]` for metafield config
- [x] Update `component-product.server.ts` for variant GID resolution
- [x] Update `handlers.server.ts` buildFpbBaseConfig / buildFullPageBundleMetafieldSteps
- [x] Metafield shape extended with `categories` field; widget backward compat maintained via flattened `products`/`collections`

### Phase 6 — Create wizard parity
- [x] Update `app.bundles.create_.configure.$bundleId/route.tsx` for same Category UI

### Phase 7 — Category card 100% EB design match
- [x] Category heading: "Category ?" with QuestionHelpTooltip (tooltipKey="category")
- [x] Category rows collapsed by default — `categoryOpen` state added
- [x] Collapsed row: ⠿ drag handle + name as plain text + (clone, delete, chevron-▾)
- [x] Expanded row: ⠿ drag handle + name as editable input + (clone, delete, chevron-▴) + Browse tabs body
- [x] Header click toggles open/closed; action buttons stop event propagation
- [x] "Add Category" button: variant="plain" (matches EB link-style button)
- [x] CSS: `.categoryAccordionBody` (padding), `.categoryChevron` (styled button), header `cursor: pointer` + `aria-expanded` border
- [x] CLAUDE.md: documented JS iframe click workaround via `select_page` + `evaluate_script`
- [x] Lint: 0 ESLint errors on all modified files

### Phase 8 — Rules / Step Config / Category DnD pixel-perfect pass
- [x] Category accordion: wire HTML5 drag-to-reorder (drag handle → DnD, drop indicator)
- [x] Rules Configuration header: inline QuestionHelpTooltip (match EB, remove RichHelpTooltip on right)
- [x] Rules Configuration: "Add Rule" → variant="plain" left-aligned (not full-width secondary)
- [x] Step Config: "Upload icon" → variant="plain" (EB button style parity)
- [x] Chrome DevTools E2E screenshot comparison

### Phase 9 — Category accordion body EB parity
- [x] Category header: always plain text (never input) — matches EB collapsed AND expanded header
- [x] Category body: name input + disabled "Multi Language" globe button at top of body
- [x] Tab labels: "Browse Products" → "Products", "Browse Collections" → "Collections" (matches EB tab text)
- [x] Rules Configuration: native `<input>` replaces `s-text-field` for value field (hides label correctly)
- [x] Same tab label fixes applied to create wizard route
- [x] CSS: `.catNameRow` flex row, `.categoryNameInput` updated to visible border + 36px height in body context
- [x] Lint: 0 ESLint errors on all modified files

### Phase 10 — Bundle Product card EB parity
- [x] Product name: `<button>` → `<span>` (plain non-interactive text, matches EB generic div)
- [x] Edit Product icon: `↗` → `<s-icon type="edit" />` (pencil icon, matches EB)
- [x] Edit Product flow: `window.open(_blank)` → `shopify.navigate()` (opens admin product modal, matches EB)
- [x] Product placeholder icon: `□` → `<s-icon type="product" />` (Polaris icon, matches EB style)
- [x] CSS: `.bundleProductName` stripped of button styles (cursor, hover underline, border, background)
- [x] Lint: 0 ESLint errors

## Progress Log

### 2026-05-16 10:00 — Completed Phase 10 — Bundle Product card EB parity

- ✅ Product name changed from `<button>` (clickable, opens admin) to `<span>` (plain text) — matches EB exactly
- ✅ Edit Product icon: `↗` → `<s-icon type="edit" />` pencil icon — matches EB
- ✅ Edit Product flow: `shopify.navigate(productUrl)` instead of `window.open(_blank)` — opens admin product page as Shopify modal, matches EB
- ✅ Placeholder icon: `□` character → `<s-icon type="product" />` Polaris icon — cleaner UI
- ✅ CSS: `.bundleProductName` stripped of cursor, hover underline, border, background (no longer a button)
- ✅ Lint: 0 ESLint errors on route.tsx
- Files modified: `route.tsx` (FPB), `full-page-bundle-configure.module.css`, `step-category-ui-parity-1.md`

### 2026-05-16 02:00 — Completed Phase 8 + Phase 9 — Category accordion body EB parity

- ✅ HTML5 DnD wired: `handleCatDragStart`, `handleCatDragEnd`, `handleCatDrop`, `categoryDragOver` CSS highlight
- ✅ Rules Configuration: inline QuestionHelpTooltip, "Add Rule" plain left-aligned, native number input for rule value
- ✅ Step Config: "Upload icon" plain button, "Cancel" toggle
- ✅ Category accordion header: always shows plain text (never editable input) — matches EB exactly
- ✅ Category accordion body: name input (visible border, 36px height) + disabled "Multi Language" button at top — matches EB expanded layout
- ✅ Tab labels updated: "Browse Products"→"Products", "Browse Collections"→"Collections" (FPB + create wizard)
- ✅ CSS: `.catNameRow` flex container, `.categoryNameInput` updated to bordered body-context style
- ✅ E2E verified via Chrome DevTools MCP snapshot/screenshot comparison with EB (page 2)
- ✅ Lint: 0 ESLint errors on all modified files
- Files modified: `route.tsx` (FPB), `route.tsx` (create wizard), `full-page-bundle-configure.module.css`, `step-category-ui-parity-1.md`

### 2026-05-16 00:15 — Completed Phase 7 — Category card 100% EB design match

- ✅ Added `categoryOpen: Record<string, boolean>` state to FPB route (keyed by `${stepId}__${catId}`)
- ✅ Category heading: "Category ?" with `<QuestionHelpTooltip tooltipKey="category" />`
- ✅ Rows collapsed by default; entire header row is clickable (role="button", aria-expanded)
- ✅ Collapsed state: `⠿ | name-as-text | [clone] [delete] [▾]`
- ✅ Expanded state: `⠿ | name-as-editable-input | [clone] [delete] [▴]` + body with Browse tabs
- ✅ Action buttons (`ebCategoryActions` div) stop click propagation so they don't toggle the row
- ✅ "Add Category" changed from `variant="secondary"` to `variant="plain"` (matches EB plain link style)
- ✅ CSS: `.categoryAccordionBody` (12px padding), `.categoryChevron` (hover bg), header `cursor: pointer`, `aria-expanded="true"` adds bottom border
- ✅ CLAUDE.md: added "🖱️ Chrome DevTools — Clicking Inside the Shopify Admin Iframe" section
- ✅ Lint: 0 ESLint errors on FPB route
- Files modified: `route.tsx` (FPB), `full-page-bundle-configure.module.css`, `CLAUDE.md`, `step-category-ui-parity-1.md`

### 2026-05-15 23:30 — Completed Phase 6

- ✅ Added `StepCategoryState` interface to create wizard
- ✅ `emptyStep()` now initializes with 1 default category
- ✅ `initSteps()` loads `StepCategory` from DB; falls back to 1 default category for legacy bundles
- ✅ Loader includes `StepCategory: { orderBy: { sortOrder: "asc" } }` alongside StepProduct
- ✅ `buildCreateWizardConfigPayload` serializes `StepCategory` in the payload
- ✅ Save action: `db.stepCategory.deleteMany + create` for each step's categories
- ✅ Added `categoryActiveTabs` state (keyed by `${tempId}__${catId}`)
- ✅ Added `updateStepCategory`, `addCategory`, `deleteCategory`, `pickCategoryProducts`, `pickCategoryCollections` callbacks
- ✅ "Select Product" card replaced with EB-style category accordion
- ✅ CSS: `.categoryAccordion`, `.categoryAccordionHeader`, `.categoryNameInput` added to wizard CSS
- ✅ Lint: 0 errors on route + CSS
- Files modified: `route.tsx` (create wizard), `wizard-configure.module.css`

### 2026-05-15 23:00 — Completed Phase 5

- ✅ `buildFullPageBundleMetafieldSteps` updated: flattens StepCategory products into `step.products` (backward compat) and StepCategory collections into `step.collections`; writes optional `step.categories` array for future widget tab support
- ✅ Validation in `handleSaveBundle` now counts StepCategory products/collections as valid "has products" signal
- ✅ `bundle-product.server.ts`: after StepProduct/collections processing, also resolves product GIDs from `step.StepCategory[i].products` and fetches collection products from `step.StepCategory[i].collections`
- ✅ `component-product.server.ts`: same StepCategory additions — ensures `component_parents` metafield is written to component variants even when products come from categories
- ✅ Lint: 0 errors on all modified files
- Files modified: `handlers.server.ts`, `bundle-product.server.ts`, `component-product.server.ts`

### 2026-05-15 22:15 — Auto-save bug fix (FPB + PDP)

- **Root cause**: `<form>` wrapped the entire canvas (~2000 lines of JSX including all text inputs). Pressing Enter in any text field submitted the form → `handleSave()` → auto-save
- **Fix FPB**: Closed `</form>` after the last `<input type="hidden">` (stepConditions), BEFORE `<div className={canvasHeader}>` — canvas content now outside the form
- **Fix PDP**: Same fix applied — form closed after hidden inputs, before AppEmbedBanner
- `handleSave()` uses `fetcher.submit(formData)` with a freshly built FormData from React state; the SaveBar `<button type="submit">` still submits the (now smaller) form correctly
- Lint: 0 errors on both routes
- Files modified: `route.tsx` (FPB), `route.tsx` (PDP)

### 2026-05-15 22:00 — Completed Phase 4

- ✅ Added `categoryActiveTabs` state to FPB route for per-category tab selection
- ✅ Replaced old Category card body (step-level tabs + legacy filters section) with EB-style accordion
- ✅ Each `StepCategory` row renders: drag handle (⋮⋮), inline-editable name input, clone/delete icons, Browse Products + Browse Collections tabs with resourcePicker, product/collection lists with Remove buttons
- ✅ "Add Category" button appends `{ id: cat-${Date.now()}, name, sortOrder, products: [], collections: [] }` to `step.StepCategory`
- ✅ CSS: `.categoryAccordion`, `.categoryAccordionHeader`, `.categoryNameInput` added to `full-page-bundle-configure.module.css`
- ✅ Lint: 0 errors on FPB route
- Files modified: `route.tsx` (FPB), `full-page-bundle-configure.module.css`

### 2026-05-15 21:45 — Completed Phase 3

- ✅ `route.tsx` loader include: added `StepCategory: { orderBy: { sortOrder: 'asc' } }` alongside `StepProduct: true`
- ✅ `handlers.server.ts`: all 5 `StepProduct: true` includes updated to also include `StepCategory`
- ✅ `handlers.server.ts` step create: added `StepCategory: { create: [...] }` block — creates category rows from payload on save
- ✅ Lint: 0 errors on both files
- Files modified: `route.tsx` (FPB), `handlers.server.ts`

### 2026-05-15 21:30 — Completed Phase 1 + Phase 2

- ✅ Nav rail: `isActive ? "●" : "○"` replaces all 4 emoji icons
- ✅ Step chip: `✕` remove span block removed
- ✅ Step Setup cardHeader: added globe (disabled, conditional on shopLocales), duplicate, delete icon buttons in a flex wrapper alongside the s-checkbox
- ✅ Step Setup card: removed bottom `<s-divider>` + `Clone Step` + `Delete Step` stack
- ✅ `StepCategory` model added to `prisma/schema.prisma` with `stepId`, `name`, `sortOrder`, `products` (Json), `collections` (Json)
- ✅ `BundleStep` gained `StepCategory[]` relation
- ✅ Migration `20260515135812_add_step_category` applied to SIT DB
- Files modified: `route.tsx` (FPB), `prisma/schema.prisma`, `prisma/migrations/20260515135812_add_step_category/migration.sql`
- Lint: 0 errors on FPB route

### 2026-05-15 21:00 — Starting Phase 1 (safe UI changes)

Files to modify:
- `app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/route.tsx`
- `app/styles/routes/full-page-bundle-configure.module.css` (if needed)

Changes:
1. Nav rail icons: `isActive ? "●" : "○"` for all 4 nav items
2. Step chip: remove `✕` span block
3. Step Setup cardHeader: add 3 icon buttons (globe, duplicate, delete) before checkbox
4. Step Setup card: remove bottom divider + Clone Step + Delete Step buttons block

## Related Documentation

- Issue: `docs/issues-prod/edit-bundle-ui-redesign-1.md` (parent UI redesign)
- Issue: `docs/issues-prod/savebar-wiring-audit-2.md` (save bar fixes, completed)
- Issue: `docs/issues-prod/step-category-filters-1.md` (earlier step-level filters work)
