# Issue: Product Page Bundle Configure EB Parity Clone

**Issue ID:** ppb-eb-configure-clone-1
**Status:** Completed
**Priority:** 🔴 High
**Created:** 2026-05-21
**Last Updated:** 2026-05-21 04:30

## Overview
Clone the Product Page Bundle configure page behavior and appearance from the EB reference, excluding Subscriptions, Select Template nav items, and email-related functionality. Reuse the existing FPB configure page layout/components wherever possible and document observed EB behavior before implementation.

## Progress Log

### 2026-05-21 02:05 - Starting commit direction summary and EB audit
- Read `CLAUDE.md` session guidelines.
- Reviewed last 25 commit descriptions to capture the recent direction of the codebase.
- Next: create a dated summary document, inspect EB in Chrome end-to-end from Admin to storefront, and document each applicable nav item before implementation.

### 2026-05-21 02:08 - Completed commit direction summary
- Added `docs/ppb-eb-configure-clone/commit-direction-summary-2026-05-21.md`.
- Summarized the last 25 commits into parity themes, shared configure direction, storefront/widget implications, and session implementation implications.
- Next: inspect the EB PPB configure implementation in Chrome using keyboard navigation and document each applicable nav item.

### 2026-05-21 02:33 - EB Admin configure audit completed, storefront password handoff
- Added `docs/ppb-eb-configure-clone/eb-ppb-configure-audit-2026-05-21.md`.
- Audited Step Setup, Discount & Pricing, Bundle Visibility, Bundle Widget, Bundle Embed, Bundle Settings, Save/Discard modal behavior, and Preview preflight modal.
- Preview Bundle opened `https://yash-wolfpack.myshopify.com/password`; storefront E2E is paused for user password handoff before implementation.
- Next: continue storefront audit after password screen, then create implementation plan and begin PPB parity changes.

### 2026-05-21 02:46 - Storefront troubleshooting message audited
- Continued storefront audit after password entry.
- Confirmed EB product page does not render the bundle builder for `Test PPB Bundle`.
- Captured EB's troubleshooting/help block shown below `Add to cart` / `Buy it now`, including unlisted-status explanation, discoverability instructions, and management warnings.
- Next: confirm whether Wolfpack's similar storefront help message should be DCP-customizable before implementation.

### 2026-05-21 02:51 - Investigated implementation layer for troubleshooting message
- Checked PPB app embed block and PPB sync/create handlers.
- Current PPB auto-created Shopify product description is `bundle.description || "{bundle.name} - Bundle Product"`.
- Best implementation candidate is generating Wolfpack troubleshooting HTML into the Shopify product description during product create/recreate/sync, because it appears even when the bundle app embed/widget is not rendering.
- Blocked on DCP/customizability decision before making storefront-visible code changes.

### 2026-05-21 03:06 - Implemented deterministic troubleshooting category copy
- Added `app/lib/bundle-product-description.server.ts`.
- Added deterministic category mapping with `visibility_unlisted` for unlisted bundle products.
- Generated fixed Wolfpack troubleshooting copy from the category and intentionally overrides merchant custom description for soft-error cases.
- Wired description generation into PPB save/sync/create/recreate paths and shared bundle status updates.
- Added focused tests in `tests/unit/lib/bundle-product-description.test.ts` and updated `tests/unit/routes/bundle-update-status.test.ts`.
- Added `test-spec/bundle-product-description.spec.md`.
- Verification: focused Jest suites pass; ESLint produced 0 errors with existing warnings.

### 2026-05-21 02:23 - Researched Shopify direct-link behavior for unlisted products
- Confirmed from Shopify Admin GraphQL docs that `UNLISTED` products are active but direct-link only, hidden from search, collections, and recommendations.
- Confirmed product publication still matters: products must be active and published to a channel to be visible there.
- Next: ensure PPB-generated bundle products are published to available sales channels before applying unlisted status, so direct-link purchase works for newly created/recreated PPB bundle products.

### 2026-05-21 02:23 - Implemented PPB direct-link publication support
- Added `app/services/shopify-publications.server.ts` to discover publications and publish generated products via `publishablePublish`.
- Wired PPB `handleSyncProduct` create and `handleSyncBundle` recreate paths to publish the bundle product before syncing final bundle status.
- Added `tests/unit/services/shopify-publications.test.ts` and asserted PPB create calls the publication helper.
- Updated `test-spec/bundle-product-description.spec.md` with publication/direct-link acceptance cases.
- Verification: focused Jest suites pass and ESLint exits 0 with warnings only.

### 2026-05-21 02:23 - Rechecked EB storefront direct-link evidence
- Revisited `https://yash-wolfpack.myshopify.com/products/test-ppb-bundle` in Chrome.
- The EB troubleshooting copy still states direct-link purchase support for unlisted products.
- Correction after user feedback and live recheck: clicking `Add to cart` successfully opens the storefront cart modal with `Item added to your cart`, `View cart (1)`, `Check out`, and `Continue shopping`.
- The bundle looks empty because no steps/products are saved in the EB configuration; direct-link add-to-cart works.
- Updated the EB storefront audit to remove the earlier incorrect disabled-button conclusion.

### 2026-05-21 02:23 - Re-ran EB Step Setup and Discount interactions
- Rechecked Step Setup from Admin: `Add Step`, product picker, Step Rules, `Add Rule`, and SaveBar discard modal.
- Rechecked Discount & Pricing: discount type options, Percentage Off default rule, and discount display sections.
- Temporary EB changes were discarded; no EB bundle configuration was saved.

### 2026-05-21 02:36 - Entered implementation planning
- Read Shopify Polaris App Home web components docs for current Admin UI component guidance.
- Added `docs/ppb-eb-configure-clone/implementation-plan-2026-05-21.md`.
- Plan locks scope to EB PPB parity excluding Subscriptions, Select template, and email-related functionality.
- Open implementation questions captured before broader PPB configure edits.

### 2026-05-21 02:36 - Started PPB Admin parity implementation
- Removed visible Step Setup child nav items from PPB (`Free Gift & Add Ons`, `Messages`) so the nav matches audited EB PPB.
- Added the left-column Readiness Score card below Bundle Setup.
- Added an EB-aligned Bundle Settings view with Pre Selected Product, Enable Quantity Validation, Cart line item discount display, Bundle Level CSS, and Bundle Status.
- Kept Subscriptions and Select template excluded.

### 2026-05-21 02:41 - Verified first PPB implementation pass
- Removed the temporary gated copy of the older Bundle Settings UI, leaving one active EB-aligned Bundle Settings implementation.
- Re-ran focused Jest suites for deterministic troubleshooting descriptions, bundle status sync, PPB product sync, and sales-channel publication support.
- Re-ran ESLint on the modified route, handlers, services, and tests; result was 0 errors with existing warning noise.
- Browser note: the active Shopify Admin dev iframe is connected to the local Cloudflare/Vite preview, but the dashboard iframe snapshot is currently blank outside the already-open FPB configure route; next step is to reopen a PPB configure route from a concrete bundle id or dashboard row and verify the new nav/settings UI.

### 2026-05-21 02:45 - Browser verified PPB configure first pass
- Opened live PPB configure in Shopify Admin via `cmp0v7rfh0000v05abe1zppc9` (`QA PDP Create 124215`).
- Confirmed left Bundle Setup nav now shows only `Step Setup`, `Discount & Pricing`, `Bundle Visibility`, and `Bundle Settings`; `Free Gift & Add Ons`, `Messages`, `Subscriptions`, and `Select template` are not visible.
- Confirmed Readiness Score card appears in the left column below Bundle Setup.
- Confirmed Bundle Settings renders EB-aligned sections: `Pre Selected Product`, `Enable Quantity Validation`, `Cart line item discount display`, `Bundle Level CSS`, and `Bundle Status`.
- Captured screenshot: `docs/ppb-eb-configure-clone/wpb-ppb-bundle-settings-first-pass-20260521.png`.

### 2026-05-21 02:46 - Production build verification
- Ran `npm run build`.
- Build completed successfully.
- Vite reported existing dynamic-import/static-import chunking warnings only; no build failure.

## Related Documentation
- `docs/ppb-eb-configure-clone/`
- `docs/app-nav-map/APP_NAVIGATION_MAP.md`

### 2026-05-21 04:10 - Bundle Visibility sub-nav + EB-aligned widget/embed sections

Identified remaining gaps via code audit of route.tsx:
- Publishing Best Practices cards were setup steps, not EB's placement guidance cards (Hero Banner, Navigation Menu, Announcement Banner, Featured Product Card).
- Bundle Widget was inline under bundle_visibility with wrong fields (Display Mode block/inline/drawer, wrong Display On options); missing image upload, Widget Title/Description/Button Text.
- Bundle Embed was entirely absent.
- No sub-nav for Bundle Widget and Bundle Embed (user confirmed: sub-nav closer to EB preferred).
- Cart line item discount display in Bundle Settings used raw HTML radio inputs.

Implementing:
- Add `bundleVisibilityChildItems` with Bundle Widget + Bundle Embed.
- Update nav isActive + sub-nav rendering to match FPB pattern.
- Replace Publishing Best Practices with 4 EB placement cards.
- Replace inline Bundle Widget with "Want more placement options?" card.
- Add new `bundle_widget` section with upsell block/button radio, image upload, title/desc/button text, Display Widget on, Add browsed product, Embed Upsell Block.
- Add new `bundle_embed` section with title/subtitle, Display Bundle on, Add browsed product, Place Block.
- New widget/embed fields stored in existing `textOverrides` JSONB (no migration needed).

## Phases Checklist
- [x] Phase 1: Dated summary of last 25 commits
- [x] Phase 2: EB Admin configure page E2E audit
- [x] Phase 3: EB storefront behavior audit
- [x] Phase 4: Implementation plan
- [x] Phase 5: PPB configure implementation
- [x] Phase 6: Bundle Visibility sub-nav + EB-aligned widget/embed sections
- [x] Phase 7: Verification and documentation updates
