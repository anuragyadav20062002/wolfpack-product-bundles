# Architecture: Create Flow Uses Edit Configure Screen

## Fast-Track Note
BR context from `docs/create-flow-edit-screen/01-requirements.md`, with guided-tour gating context from `docs/first-load-min-config-tour/01-requirements.md` and `docs/first-load-min-config-tour/02-architecture.md`.

## Impact Analysis
- **Communities touched:** create bundle route, dashboard create navigation, FPB configure route, PPB configure route, guided tour/readiness components.
- **God nodes affected:** `app/routes/app/app.bundles.create/route.tsx`, `app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/route.tsx`, and `app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/route.tsx` are route-level modules with high user-flow blast radius.
- **Graph checks:** `graphify path` from the create route to FPB configure returned a 3-hop route/loader path; create route to PPB configure returned a 3-hop route/loader path.
- **Blast radius:** dashboard create entry, new-bundle redirect targets, first-load tour triggering, and stale nav-map/docs. Storefront runtime is not touched.

## Decision
Keep `/app/bundles/create` as the only create-specific UI. It renders type-card selection and opens a bundle-name-only modal after Continue. The route action creates the bundle through the existing server handler, then redirects to the existing FPB or PPB configure route with `mode=create`; when the existing first-create-tour gate says the tour should show, append `first_load=true`. The old `/app/bundles/create/configure/:bundleId` screen is removed from active navigation and treated as obsolete.

## Data Model
No data model change expected.

```typescript
type ConfigureMode = "create" | "edit";
```

## Files
| File | Action | What changes |
|---|---|---|
| `docs/issues-prod/create-flow-edit-screen-1.md` | create/update | Track progress and validation evidence |
| `docs/create-flow-edit-screen/01-requirements.md` | create | Requirements |
| `docs/create-flow-edit-screen/02-architecture.md` | create | Architecture |
| `app/routes/app/app.bundles.create/route.tsx` | modify | Replace wizard form with type-card selection plus bundle-name modal; remove description from UI/payload; redirect to existing configure route |
| `app/routes/app/app.bundles.create/create-bundle.module.css` | modify | Remove obsolete wizard-step styling and support type-card/modal screen |
| `app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/route.tsx` | inspect/modify if needed | Read create-mode/first-load signal and keep existing configure UI |
| `app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/route.tsx` | inspect/modify if needed | Read create-mode/first-load signal and keep existing configure UI |
| `app/components/bundle-configure/BundleGuidedTour.tsx` | inspect/modify if needed | Confirm shop-level first-use gate works with `first_load=true` on edit routes |
| `app/lib/bundle-navigation.ts` | modify if route helpers point create results to old wizard configure route | Redirect create results to bundle-type edit configure paths |
| `tests/unit/routes/create-bundle-wizard.test.ts` | modify/create | Verify create action redirects to FPB/PPB edit configure routes and excludes description |
| `test-spec/create-flow-edit-screen.spec.md` | create | TDD spec |
| `docs/app-nav-map/APP_NAVIGATION_MAP.md` | modify | Replace create wizard docs with new create entry + configure redirect flow |

## Test Plan
| Test file | Scope | Key behaviors |
|---|---|---|
| `tests/unit/routes/create-bundle-wizard.test.ts` | route action | PPB create redirects to PPB configure, FPB create redirects to FPB configure, first-load query is appended only when eligible, description is not required |

**Manual e2e:** Shopify Admin Chrome create flow for PPB and FPB, including type selection, name modal validation, save loading, redirect into existing configure screen, and first-load tour behavior where eligible.

**No tests needed:** CSS-only card spacing after route behavior is covered; visual behavior will be checked through Chrome e2e.
