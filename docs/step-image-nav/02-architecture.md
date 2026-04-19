# Architecture: Step Navigation — Image Circles + Progress Line

## Fast-Track Note
> BR context from: `docs/ui-audit-26.05.md` § "Step Navigation: Image Circles + Progress Line"

---

## Impact Analysis

- **Communities touched:** Community 0 (`BundleWidgetFullPage`), Community 2 (widget rendering)
- **God nodes affected:** `BundleWidgetFullPage` (112 edges) — the tab rendering lives inside this class; any change to `renderSteps()` or step HTML structure propagates to all consumers
- **Blast radius:** Step tab UI only. No pricing, cart transform, checkout, or DB query path affected. The metafield writer (`bundle-product.server.ts`) gets a one-line addition. Admin UI gets a new upload field in the Step Setup card. Widget CSS gets new rules — cannot regress existing tab layout since the new `.step-tab-icon` element is conditionally inserted only when `imageUrl` is non-null.

---

## Decision

Store a merchant-uploaded step icon URL as `imageUrl String?` on the `BundleStep` Prisma model. Pass it through the metafield writer into the widget config. In the widget, when the step tab is in empty state, render the icon image (if present) in place of the step number `div.tab-number`. Add a `::before` CSS connecting line between tabs. DCP already exposes `stepBarProgressFilledColor` for the line color — no new DCP setting needed.

This is the minimal-footprint approach: one DB column, one field in the step map, one conditional branch in the tab HTML, and one new CSS block for the connecting line.

---

## Data Model

```typescript
// prisma/schema.prisma — BundleStep model addition
imageUrl String?   // Merchant-uploaded step icon image URL
```

```typescript
// Widget step shape (bundle_ui_config metafield) — addition
{
  id: string;
  name: string;
  imageUrl?: string | null;  // NEW — null means fall back to step number
  // ... existing fields unchanged
}
```

---

## Files

| File | Action | What changes |
|---|---|---|
| `prisma/schema.prisma` | modify | Add `imageUrl String?` to `BundleStep` model |
| `prisma/migrations/*/migration.sql` | create | `ALTER TABLE "BundleStep" ADD COLUMN "imageUrl" TEXT;` |
| `app/services/bundles/metafield-sync/operations/bundle-product.server.ts` | modify | Add `imageUrl: step.imageUrl ?? null` to step map (line ~234) |
| `app/assets/bundle-widget-full-page.js` | modify | In the empty-state branch of tab rendering (line ~1315): if `step.imageUrl`, render `<img class="tab-step-icon" src="${step.imageUrl}">` instead of `<div class="tab-number">` |
| `extensions/bundle-builder/assets/bundle-widget-full-page.css` | modify | Add `.step-tabs-container` flex layout with `::before` connecting line pseudo-element; `.tab-step-icon` styles (40px circle, object-fit cover) |
| `app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/route.tsx` | modify | In step setup card (line ~1667): add Polaris `DropZone` / `Button` for step icon image upload per step; wire to existing promo banner upload pattern |
| `app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/route.tsx` | modify | Same step icon upload UI (PDP also has step tabs) |
| `npm run build:widgets` | run | Rebuild bundled widget JS after widget source changes |

---

## Test Plan

| Test file | Scope | Key behaviors |
|---|---|---|
| `tests/unit/services/bundle-product-metafield.test.ts` | unit | `imageUrl` passes through step map; null when absent; non-null string preserved |

**Mock:** Prisma, Shopify Admin API
**Do not mock:** step map transformation (pure function)
**No tests needed:** widget JS rendering (Liquid/JS), CSS changes, admin UI Polaris components

---

## Notes

- The connecting line is purely CSS — `::before` on `.step-tabs-container` or `position: absolute` between tabs. DCP `stepBarProgressFilledColor` already controls the color.
- Image upload should reuse the same Shopify Files API pattern already used for `promoBannerBgImage` — no new upload infrastructure.
- When `imageUrl` is null, the tab renders the existing number pill — zero visual regression for existing merchants.
- Widget version must be bumped (PATCH → next patch) before deploying.
