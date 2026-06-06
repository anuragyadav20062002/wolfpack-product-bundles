# Issue: App Embed Rename + Settings Strip + Per-Bundle SDK

**Issue ID:** app-embed-settings-strip-1
**Status:** Completed
**Priority:** 🟡 Medium
**Created:** 2026-04-30
**Last Updated:** 2026-04-30

## Overview

Three related changes to both app embed blocks:
1. Rename both embeds to "Wolfpack: Product Bundles" with type-specific descriptions
2. Strip all theme-editor-level settings from both embeds (hardcode defaults)
3. Move SDK mode from embed-level setting to per-bundle DB field, surfaced in configure page

## Phases Checklist
- [x] Phase 1: Create issue file
- [x] Phase 2: Prisma migration — add sdkMode to Bundle model
- [x] Phase 3: Add sdkMode to BundleUiConfig type + metafield sync
- [x] Phase 4: Configure route — handler + UI for sdkMode toggle
- [x] Phase 5: Full-page embed — rename, description, strip settings, hardcode defaults
- [x] Phase 6: Product-page embed — rename, description, strip settings, hardcode defaults, sdkMode from metafield
- [x] Phase 7: Lint + commit
- [ ] Phase 8: Deploy (manual — user action required)

## Progress Log

### 2026-04-30 — Completed

- ✅ Prisma: `sdkMode Boolean @default(false)` added to Bundle model; migration applied to SIT DB
- ✅ BundleUiConfig type: `sdkMode?: boolean` added
- ✅ bundle-product.server.ts: `sdkMode` included in bundleUiConfig object
- ✅ Configure handler: parses `sdkMode` from formData, saves to DB
- ✅ Configure UI: "Developer" card with SDK mode toggle (product-page bundles only)
- ✅ Full-page embed: name="Wolfpack: Product Bundles", description="WP | Full Page", all settings stripped, defaults hardcoded, tier logic removed (tiers live in configure page)
- ✅ Product-page embed: name="Wolfpack: Product Bundles", description="WP | Product Page", all settings stripped, CSS defaults hardcoded, sdkMode reads from bundle_ui_config metafield
- ✅ ESLint: 0 errors on all modified TS/TSX files
- Next: Deploy required — run `npm run deploy:sit` then `npm run deploy:prod`

### 2026-04-30 — Starting Implementation
- Files: prisma/schema.prisma, metafield-sync/types.ts, bundle-product.server.ts, configure route + handler, both embed liquids
- Hardcoded defaults: full-page (show_bundle_title=true, show_bundle_description=true, show_category_tabs=true, hide_page_title=true, product_card_spacing=20, product_cards_per_row=4, show_promo_banner=true, promo banner text defaults); product-page (all sizing/spacing/modal CSS variables at schema defaults)
- Tier settings removed from full-page embed (tiers already in configure page per-bundle)
- sdk_mode removed from product-page embed schema → per-bundle sdkMode DB field
