# Architecture: First-Load Minimum Configuration Tour

## Fast-Track Note
BR context from `docs/first-load-min-config-tour/01-requirements.md` and prior guided-tour / EB parity docs.

## Impact Analysis
- **Communities touched:** create bundle wizard, unified create configure wizard, shared configure handlers, FPB configure, PPB configure, guided tour/readiness components.
- **God nodes affected:** FPB and PPB configure route modules remain high-blast-radius files; edits should be localized to the Step Setup section and category drag handlers.
- **Graph checks:** `graphify path` did not find a path for `BundleGuidedTour` to `tourSteps.ts`; `StepCategory` was not indexed as a standalone graph node in the current graph snapshot. Source inspection confirmed the relevant links.
- **Blast radius:** create redirect, admin configure UI layout, readiness calculation, category drag UX. No storefront widget source changes.

## Decision
Use the existing unified create configure route and guided tour component. A persisted `Shop.firstCreateTourEligible` flag identifies shops created after the feature exists; the create handler consumes that flag on first successful create and returns `showFirstLoadTour`. The create route appends `?first_load=true` only for that response. `BundleGuidedTour` still uses the shop-level `wpb_first_bundle_tour_seen_${shop}` localStorage key as the client-side dismissal guard. The tour steps stay minimum-only and the readiness calculation will count category products/collections.

## Data Model
Add a direct Shop column with a default that makes existing shops ineligible:

```typescript
type Shop = {
  firstCreateTourEligible: boolean;
};
```

## Files
| File | Action | What changes |
|---|---|---|
| `prisma/schema.prisma` | modify | Add `Shop.firstCreateTourEligible` |
| `prisma/migrations/20260522093000_add_first_create_tour_eligible/migration.sql` | create | Add direct Shop flag defaulting existing shops to false |
| `app/services/billing.server.ts` | modify | Set new shop records as first-create-tour eligible |
| `app/routes/app/app.dashboard/handlers/handlers.server.ts` | modify | Consume the first-create-tour flag on successful create and return `showFirstLoadTour` |
| `app/routes/app/app.bundles.create/route.tsx` | modify | Append `?first_load=true` only when `showFirstLoadTour` is true |
| `app/routes/app/app.bundles.create_.configure.$bundleId/route.tsx` | modify | Count `StepCategory` products/collections in readiness; keep minimum tour steps |
| `app/components/bundle-configure/tourSteps.ts` | modify | Ensure first-load tour copy matches minimum activation only |
| `app/hooks/useSharedBundleHandlers.ts` | modify | Add a drag image for category accordion drag start |
| `app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/route.tsx` | modify | Combine Step Flow and Step Setup into one card with an internal divider; add Step Setup header actions |
| `app/styles/routes/product-page-bundle-configure.module.css` | modify | Add local classes for the combined Step Setup card/divider/actions if needed |
| `app/styles/routes/bundle-configure-shared.module.css` | modify | Add drag feedback class if needed |
| `tests/unit/routes/create-bundle-wizard.test.ts` | modify | Expect redirect to include `first_load=true` |
| `docs/issues-prod/first-load-min-config-tour-1.md` | create | Track implementation progress |

## Test Plan
| Test file | Scope | Key behaviors |
|---|---|---|
| `tests/unit/routes/create-bundle-wizard.test.ts` | unit | eligible successful create redirects with `first_load=true`; ineligible successful create redirects without it |

**Manual verification:** PPB Step Setup visual layout, category drag ghost movement in FPB and PPB, guided tour opening from create flow, and readiness completing for category-selected products.

**No tests needed:** pure JSX/CSS card layout and drag ghost image styling.
