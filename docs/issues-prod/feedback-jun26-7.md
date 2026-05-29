# Issue: PDP Widget Placement — 100% EB-style Theme Editor Flow

**Issue ID:** feedback-jun26-7
**Status:** In Progress
**Priority:** 🟡 Medium
**Created:** 2026-05-29
**Last Updated:** 2026-05-29

## Overview

Per user clarification (round 2), copy EB 100%. EB does NOT auto-inject the widget above ATC — it uses a Theme Editor app block that the merchant places via Shopify's deep-link flow.

Live evidence captured 2026-05-29 from EB storefront (`yash-wolfpack.myshopify.com/products/wpb-complete-audit-product-page-2026-05-25`):
- Native Shopify ATC button is **NOT visible** on bundle products — EB hides it via CSS injected by the block.
- DOM order in the product-info column: Quantity controls → bundle widget steps → bundle's own "Add Bundle to Cart" button → Shopify "Buy It Now" payment button.
- EB does NOT auto-inject. The widget renders where the merchant placed the app block.
- The visual "widget above ATC" outcome is achieved because (a) merchant places the block inside the product-form section, and (b) the block hides the native ATC so the bundle ATC sits in its place.

## Wolfpack alignment audit

| Behavior | EB | Wolfpack | Status |
|---|---|---|---|
| Theme app embed (global) | `bundle-app-embed` equivalent | `extensions/bundle-builder/blocks/bundle-app-embed.liquid` exists; `checkAppEmbedEnabled` looks for it | ✅ |
| PDP app block | `Product Page Builder` | `extensions/bundle-builder/blocks/bundle-product-page.liquid` exists with `target: "section"` + `enabled_on.templates: ["product"]` | ✅ |
| Hide native ATC when block placed | Yes | `bundle-product-page.liquid` lines 51–66, default `hide_native_buttons: true` | ✅ |
| Own bundle ATC button | Yes | Line 48 of the block emits `<button class="add-bundle-to-cart">` | ✅ |
| "Place Widget" deep-link from admin | Opens Theme Editor with block pre-selected + toast confirmation | `handlePlaceWidget` in `app.bundles.product-page-bundle.configure.$bundleId/route.tsx` line 1697 opens a page selection modal, then calls `buildProductPageThemeEditorDeepLink` to construct a Shopify-spec deep link | ✅ |
| Deep-link URL parameters | `template`, `addAppBlockId`, `target=newAppsSection`, `previewPath`, plus a bundle ID for auto-population | All present in `app/lib/bundle-config/product-page-admin-sections.ts:149` `buildProductPageThemeEditorDeepLink` | ✅ |

The Shopify-documented deep-link format is followed: `https://{shop}/admin/themes/current/editor?template=product&addAppBlockId={apiKey}/{blockHandle}&target=newAppsSection&bundleId={bundle.id}&previewPath=/products/{handle}` — see https://shopify.dev/docs/apps/build/online-store/theme-app-extensions/deep-links.

## What this commit changes

After the audit, Wolfpack already implements the EB-equivalent flow end-to-end. No code changes are required. This commit:

1. Updates `docs/competitor-analysis/19-pdp-widget-placement-parity.md` (new) with the audit table + evidence so the parity decision is documented.
2. Drops the original plan-level note about adding an auto-inject + DCP toggle for placement. Plan file is the source of truth for the current direction.

## Files Changed

- `docs/competitor-analysis/19-pdp-widget-placement-parity.md` (new) — evidence record.
- `docs/issues-prod/feedback-jun26-7.md` (this file).

No widget redeploy. No production code edits in this commit.

## Tests

`buildProductPageThemeEditorDeepLink` already has a unit test at `tests/unit/lib/product-page-admin-sections.test.ts:129` that asserts the exact URL format including `template=product`, `target=newAppsSection`, and `previewPath` encoding. No additional tests needed for the audit-only outcome.

## Phases Checklist

- [x] Phase 1: Live EB storefront evidence captured (DOM order, no auto-inject, no native ATC visible)
- [x] Phase 2: Audit Wolfpack `handlePlaceWidget` URL + block schema against the EB contract
- [x] Phase 3: Confirm existing deep-link builder unit test covers the documented format
- [x] Phase 4: Write the parity doc
- [x] Phase 5: Commit

**Status:** Completed (audit-only — no production code changes needed)

## Progress Log

### 2026-05-29 — Implementation complete (audit)
- Compared EB's live storefront DOM with Wolfpack's PPB Liquid block + admin deep-link path.
- All 6 behavioral checks align. Existing `buildProductPageThemeEditorDeepLink` unit test (`tests/unit/lib/product-page-admin-sections.test.ts:129`) locks the URL format.
- Wrote `docs/competitor-analysis/19-pdp-widget-placement-parity.md`.
