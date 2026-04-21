# Architecture: Per-Step Hero Banner Image

## Fast-Track Note
> BR context from: `docs/ui-audit-26.05.md` § "Per-Step Hero Banner Image"

---

## Impact Analysis

- **Communities touched:** Community 0 (`BundleWidgetFullPage`), Community 1 (`BundleWidgetProductPage`)
- **God nodes affected:** `BundleWidgetFullPage` (112 edges) — step rendering loop affected; `BundleWidgetProductPage` (76 edges) — PDP step rendering also needs the field
- **Blast radius:** Step content area in the widget only. Existing `promoBannerEnabled` text banner is a separate element — the new per-step image banner renders above the product grid and coexists with it. No pricing, cart, or auth paths touched.

---

## Decision

Store a per-step banner image URL as `bannerImageUrl String?` on the `BundleStep` Prisma model. Pass it through the metafield writer. In the widget, when rendering the active step's product grid, prepend a full-width `<img>` banner above the grid if `step.bannerImageUrl` is non-null. The image upload UI lives in the admin step setup card, reusing the Shopify Files API pattern already used for `promoBannerBgImage`.

The existing `promoBanner*` DCP settings (bg color, typography, border radius, padding) remain unchanged — they control the text banner. The per-step image banner is a separate element with its own simple CSS block.

---

## Data Model

```typescript
// prisma/schema.prisma — BundleStep model addition
bannerImageUrl String?   // Merchant-uploaded per-step full-width banner image URL
```

```typescript
// Widget step shape (bundle_ui_config metafield) — addition
{
  id: string;
  name: string;
  bannerImageUrl?: string | null;  // NEW — null means no banner image for this step
  // ... existing fields unchanged
}
```

---

## Files

| File | Action | What changes |
|---|---|---|
| `prisma/schema.prisma` | modify | Add `bannerImageUrl String?` to `BundleStep` model |
| `prisma/migrations/*/migration.sql` | create | `ALTER TABLE "BundleStep" ADD COLUMN "bannerImageUrl" TEXT;` |
| `app/services/bundles/metafield-sync/operations/bundle-product.server.ts` | modify | Add `bannerImageUrl: step.bannerImageUrl ?? null` to step map |
| `app/assets/bundle-widget-full-page.js` | modify | In `renderStepContent()` or equivalent: if active step has `bannerImageUrl`, insert `<div class="step-banner-image"><img src="..."></div>` above the product grid |
| `app/assets/bundle-widget-product-page.js` | modify | Same pattern in PDP step rendering |
| `extensions/bundle-builder/assets/bundle-widget-full-page.css` | modify | Add `.step-banner-image { width: 100%; margin-bottom: 16px; } .step-banner-image img { width: 100%; border-radius: var(--bundle-promo-banner-radius, 8px); object-fit: cover; }` |
| `app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/route.tsx` | modify | In step setup card: add banner image upload field per step; reuse Files API upload pattern from `promoBannerBgImage` |
| `app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/route.tsx` | modify | Same upload UI |
| `npm run build:widgets` | run | Rebuild after widget source changes |

---

## Test Plan

| Test file | Scope | Key behaviors |
|---|---|---|
| `tests/unit/services/bundle-product-metafield.test.ts` | unit | `bannerImageUrl` passes through step map; null when absent; non-null string preserved |

**Mock:** Prisma, Shopify Admin API
**Do not mock:** step map transformation (pure function)
**No tests needed:** widget JS rendering, CSS changes, Polaris admin UI

---

## Notes

- Both FPB and PDP widgets get this field — step rendering is independent in each widget JS file.
- The banner image should reuse `var(--bundle-promo-banner-radius)` for border radius so it inherits the DCP promo banner border radius setting without needing a new DCP control.
- Step switching (clicking a different step tab) must update the banner — it should be driven by the same `renderActiveStep()` / `updateStepContent()` call that already re-renders the product grid.
- Widget version must be bumped (MINOR — new visible feature) before deploying.
