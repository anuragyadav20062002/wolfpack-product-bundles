# SDE Implementation Plan: Per-Bundle Images & GIFs

**Feature ID:** bundle-images-gifs
**Issue ID:** bundle-images-gifs-1
**Architecture Reference:** `docs/bundle-images-gifs/03-architecture.md`

---

## Overview

Adds a `promoBannerBgImage` field to each bundle, exposes it in an "Images & GIFs" section
on the full-page bundle configure page, serialises it into the `bundle_ui_config` metafield,
and applies it as a CSS variable in the widget. Also increases the promo banner height in CSS.

**Files touched:** 7 source files + 1 widget bundle rebuild.

---

## Phase 1: Data Layer

### Step 1.1 — Prisma schema
- File: `prisma/schema.prisma`
- Change: Add `promoBannerBgImage String?` to `Bundle` model (after `templateName`)

### Step 1.2 — Prisma migration
- Command: `npx prisma migrate dev --name add-promo-banner-bg-image`

---

## Phase 2: TypeScript + Metafield Sync

### Step 2.1 — BundleUiConfig type
- File: `app/services/bundles/metafield-sync/types.ts`
- Change: Add `promoBannerBgImage?: string | null` to `BundleUiConfig`

### Step 2.2 — bundleUiConfig builder
- File: `app/services/bundles/metafield-sync/operations/bundle-product.server.ts`
- Change: Add `promoBannerBgImage: bundleConfiguration.promoBannerBgImage ?? null` at line ~210

---

## Phase 3: Server-Side Save Handler

### Step 3.1 — Parse + persist
- File: `app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/handlers/handlers.server.ts`
- Parse `promoBannerBgImage` from FormData (string or null)
- Add to `db.bundle.update({ data: { ..., promoBannerBgImage: ... } })`

---

## Phase 4: Configure Page UI

### Step 4.1 — bundleSetupItems + imports
- File: `app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/route.tsx`
- Add `ImageIcon`, `LockIcon`, `Box` imports
- Add `FilePicker` import
- Add `{ id: "images_gifs", label: "Images & GIFs", icon: ImageIcon }` to `bundleSetupItems`

### Step 4.2 — Component state + discard + save
- Add `promoBannerBgImage` state (init from `bundle.promoBannerBgImage`)
- Store original in a ref for discard
- Override `handleDiscard` to also reset image state
- Add `formData.append("promoBannerBgImage", promoBannerBgImage ?? "")` in `handleSave`
- Add `promoBannerBgImage` to `handleSave` useCallback dep array

### Step 4.3 — Nav filter
- Filter `bundleSetupItems` in the nav render to hide `images_gifs` for non-full-page bundles

### Step 4.4 — Right-panel section
- Add `{activeSection === "images_gifs" && ...}` section with FilePicker, hint text, coming soon card

---

## Phase 5: Widget JS + CSS

### Step 5.1 — Apply CSS variable in widget
- File: `app/assets/bundle-widget-full-page.js`
- In `createPromoBanner()` after `banner.innerHTML = ...` and before `return banner`
- Read `this.selectedBundle?.promoBannerBgImage`, set `--bundle-promo-banner-bg-image` on element

### Step 5.2 — Increase promo banner height in CSS
- File: `extensions/bundle-builder/assets/bundle-widget-full-page.css`
- Add `min-height` to `.promo-banner` breakpoints (140px mobile, 180px tablet, 220px desktop)
- Increase desktop padding to `48px 48px`

### Step 5.3 — Rebuild widget bundle
- Command: `npm run build:widgets`
- Verify output in `extensions/bundle-builder/assets/bundle-widget-full-page-bundled.js`

---

## Build & Verification Checklist

- [ ] `npx prisma migrate dev --name add-promo-banner-bg-image` succeeds
- [ ] TypeScript: `npm run typecheck` passes (or zero new errors)
- [ ] ESLint: `npx eslint --max-warnings 9999 <changed files>` passes with zero errors
- [ ] Widget rebuilt: `npm run build:widgets`
- [ ] Manual test: configure page → Images & GIFs section is visible for full_page bundles
- [ ] Manual test: select image → save → storefront shows image in promo banner
- [ ] Manual test: remove image → save → promo banner reverts to background color
- [ ] Manual test: product-page bundles → "Images & GIFs" nav item does NOT appear
- [ ] Manual test: discard → image reverts to last saved value
- [ ] Promo banner is visually taller on storefront

## Rollback Notes

If needed, run `npx prisma migrate resolve --rolled-back <migration-name>` and revert
the schema addition. The column is nullable — existing rows are unaffected. The widget
fallback `var(--bundle-promo-banner-bg-image, none)` means old bundles continue to work
even if the column is removed from the metafield payload.
