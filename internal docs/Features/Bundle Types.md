---
title: Bundle Types
type: feature
audited: 2026-04-16
sources: prisma/schema.prisma, CLAUDE.md
---

# Bundle Types

## Full-Page Bundle (FPB)

A dedicated bundle-builder page hosted on a Shopify page (not a product page). The customer configures the bundle by selecting from each step.

- **Widget**: `bundle-widget-full-page.js` → `bundle-full-page.liquid` block
- **Layouts** (`FullPageLayout` enum):
  - `CLASSIC` — standard step-by-step layout
  - `EDITORIAL` — rich media / editorial style
  - `GRID` — compact grid layout
- **Config delivery**: Metafield cache (Stage 1) + proxy API fallback (Stage 2) — see [[Architecture/Widget Architecture]]
- **Promo banner**: per-bundle `promoBannerBgImage` field
- **Step timeline**: optional progress indicator (`showStepTimeline`)
- **Tier config**: tiered pricing JSON (`tierConfig`)

## Product-Page Bundle (PDP)

Embeds the bundle selector directly on a Shopify product page.

- **Widget**: `bundle-widget-product-page.js` → product page block
- Simpler load strategy (product context already available)

## Bundle Status

| Status | Meaning |
|---|---|
| `active` | Live, visible on storefront |
| `inactive` | Disabled, not visible |
| `draft` | In progress, not yet published |
| `unlisted` | Exists but hidden from merchant list (archive/template use) |

## Inventory Sync

Bundle stock = `MIN(component_inventory / component_quantity)` across all steps.
- Updated via `inventoryAdjustQuantities` mutation (not deprecated singular form)
- Debounced: skip if `inventorySyncedAt` < 60 seconds ago
