---
title: Database Schema
type: architecture
audited: 2026-07-11
source: prisma/schema.prisma
---

# Database Schema

Authoritative summary derived from `prisma/schema.prisma`. The `APPLICATION_ARCHITECTURE.md` in `docs/` is significantly outdated — this note supersedes it for schema questions.

---

## Key Models

### Bundle

Core model. Key fields beyond basics:
- `status`: `BundleStatus` enum — `active`, `inactive`, `draft`, **`unlisted`** (not in old doc)
- `fullPageLayout`: `FullPageLayout` enum — `CLASSIC`, `EDITORIAL`, `GRID`
- `promoBannerBgImage`: promotional banner image URL
- Promo banner crop data is not part of the schema. The pruned `promoBannerBgImageCrop` column was removed; banners render with the configured image and standard cover/center behavior.
- `tierConfig`: JSON — tiered pricing configuration
- `showStepTimeline`: Boolean — step progress indicator
- `inventorySyncedAt`: DateTime — debounce for inventory sync (skip if < 60s ago)

### BundleStep

Per-step configuration. Links to `Bundle`.

### Product

Product variant selections per step.

### DesignSettings

**Not documented in APPLICATION_ARCHITECTURE.md.** Stores per-bundle design/theme settings. Replaces the old JSON blob approach.

### OrderAttribution

**Not documented in APPLICATION_ARCHITECTURE.md.** Tracks order → bundle attribution for analytics.
Includes standard UTM columns (`utmSource`, `utmMedium`, `utmCampaign`, `utmContent`, `utmTerm`) plus `customUtmAttributes` JSON for merchant-configured URL parameters captured by the Web Pixel.

### Shop

Tracks installed-shop metadata and app-level settings. `customUtmParameters` JSON stores the merchant-configured allowlist of extra URL parameter names the UTM Web Pixel should capture.

### BundleAnalytics

**Not documented in APPLICATION_ARCHITECTURE.md.** Aggregated analytics data per bundle.

### DiscountSettings

Discount configuration linked to `Bundle`. Fields: `discountMethod`, `discountValue`, `discountType`.

### Session

Shopify session storage (standard Remix adapter pattern).

---

## Enums

### BundleStatus
```
active | inactive | draft | unlisted
```
`unlisted` = bundle exists but is not shown in merchant list (used for archived/template bundles).

### FullPageLayout
```
CLASSIC | EDITORIAL | GRID
```
Controls FPB widget layout rendering mode.

---

## Prisma Location

- Schema: `prisma/schema.prisma`
- Dev DB env: `prisma/.env` (not project root — contains SIT credentials)
- Dev DB file: `prisma/dev.db` (SQLite, gitignored)

---

## Notes

- New settings fields should be added as **direct Prisma columns** with sensible defaults, never as JSON blob sub-fields
- The "Sync Bundle" feature lets merchants re-sync to pick up new defaults — no backwards-compat shims needed
- See `CLAUDE.md` → "No Backwards Compatibility Rule" for enforcement details
