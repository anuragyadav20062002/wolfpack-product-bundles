# Architecture: Create Bundle Wizard

## Fast-Track Note
> BR context from: `docs/create-bundle-wizard/01-requirements.md`

## Impact Analysis
- **Communities touched:** Community 0 (bundle creation + handler chain), Community 2 (dashboard + auth lifecycle)
- **God nodes affected:** `handlers_server_ts` (via hyperedge "Ad-Ready Phase 1: Bundle Creation Price + Inventory Fix") — read-only reuse, no mutation
- **Blast radius:**
  - `app/routes/app/app.dashboard/route.tsx` — modal removal + button change; dashboard table/filter/list sections unaffected
  - `app/hooks/useDashboardState.ts` — create-modal state stripped; delete-modal state untouched
  - FPB + PPB configure routes — additive-only (`data-tour-target` div wrappers); no logic changes
  - `handleCreateBundle` in `handlers.server.ts` — no change; imported from new path

## Decision
Create a new Remix route `app/routes/app/app.bundles.create/route.tsx` that hosts Step 01 of the wizard. It imports `handleCreateBundle` directly from the existing dashboard handler, so zero business logic changes. The dashboard modal is deleted, and the "Create Bundle" button becomes a `useNavigate` call. The `useDashboardState` hook has create-modal fields stripped since they're only consumed by the dashboard route (confirmed by grep — single import).

## Data Model
No new DB fields — the existing `name`, `description`, `bundleType`, `fullPageLayout` columns on `Bundle` are sufficient.

```typescript
// Action form fields (same as current modal)
bundleName: string       // required, min 3 chars
description?: string     // optional
bundleType: "product_page" | "full_page"
fullPageLayout?: "footer_bottom" | "footer_side"  // only when full_page
_action: "createBundle"  // discriminator for handleCreateBundle
```

## Files

| File | Action | What changes |
|---|---|---|
| `app/routes/app/app.bundles.create/route.tsx` | create | New wizard route — loader (auth), action (calls handleCreateBundle), Step 01 JSX |
| `app/routes/app/app.bundles.create/create-bundle.module.css` | create | Wizard layout, step indicator, bundle type cards, page layout cards |
| `app/routes/app/app.dashboard/route.tsx` | modify | Remove `<s-modal id="create-bundle-modal">` JSX; change Create Bundle button to `useNavigate('/app/bundles/create')` |
| `app/hooks/useDashboardState.ts` | modify | Remove `bundleName`, `description`, `bundleType`, `fullPageLayout`, `openCreateModal`, `closeCreateModal` fields + all related `useState` calls |
| `app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/route.tsx` | modify | Add `data-tour-target` wrapper divs on 4 section heading rows: `fpb-step-setup`, `fpb-discount-pricing`, `fpb-design-settings`, `fpb-bundle-visibility` |
| `app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/route.tsx` | modify | Add `data-tour-target` wrapper divs on 4 section heading rows: `ppb-product-selection`, `ppb-discount-pricing`, `ppb-design-settings`, `ppb-bundle-status` |
| `docs/app-nav-map/APP_NAVIGATION_MAP.md` | modify | Add `/app/bundles/create` route entry |
| `tests/unit/routes/create-bundle-wizard.test.ts` | create | Action tests: valid submit, empty name, short name, subscription limit exceeded |

## Route Architecture

```
GET  /app/bundles/create  → loader  → auth check → renders Step 01 wizard
POST /app/bundles/create  → action  → calls handleCreateBundle() → redirect to configure page
```

The loader needs only `authenticate.admin(request)` — no DB reads required for Step 01 (no prefill).

The action pattern mirrors the dashboard action:
```typescript
export async function action({ request }: ActionFunctionArgs) {
  const { admin, session } = await authenticate.admin(request);
  const formData = await request.formData();
  const result = await handleCreateBundle(admin, session, formData);
  if (result.status === "error") return json(result);
  return redirect(result.redirectTo);
}
```

## Step Indicator Design

Five numbered circles: `01` filled dark (`#1a1a1a`), `02`–`05` outlined/muted (`#8c9196`).
Labels below each: `Bundle name & Description`, `Configuration`, `Pricing`, `Assets`, `Pricing Tiers`.
Connector lines between circles, all muted except none (only one active step).

## Bundle Type Cards

Two cards side-by-side:
- **Product Page Bundle Builder** — image `/pdp.jpeg`, description text, `Select` button
- **Full Page Bundle Builder** — image `/full.jpeg`, description text, `Select` button

Selected state: `border: 2px solid #005bd3; background: #f1f7ff`

## Page Layout Cards (conditional — Full Page only)

Two cards:
- **Floating card** (footer_bottom) — SVG preview, `View Demo` button → `https://wolfpackapps.com`
- **Side Panel** (footer_side) — SVG preview, `View Demo` button → `https://wolfpackapps.com`

## data-tour-target Placement

Each attribute goes on the outermost wrapper div of the section (the `<s-section>` container or its parent div), not on inner elements.

**FPB configure sections:**
| Target value | Section | Approx line |
|---|---|---|
| `fpb-step-setup` | Step setup / product configuration | ~1698 |
| `fpb-discount-pricing` | Discount & pricing | ~2119 |
| `fpb-design-settings` | Design settings / bundle_settings | ~2631 |
| `fpb-bundle-visibility` | Bundle visibility / status section | end of route |

**PPB configure sections:**
| Target value | Section | Approx line |
|---|---|---|
| `ppb-product-selection` | Step setup / product selection | ~1408 |
| `ppb-discount-pricing` | Discount & pricing | ~1808 |
| `ppb-design-settings` | Design settings / images_gifs | ~2063 |
| `ppb-bundle-status` | Bundle status section | ~2201+ |

## Test Plan

| Test file | Scope | Key behaviours |
|---|---|---|
| `tests/unit/routes/create-bundle-wizard.test.ts` | unit | action: valid form → redirects to configure page; empty bundleName → 400 json error; bundleName < 3 chars → 400 json error; subscription limit exceeded → 200 json with error |

**Mock:** `handleCreateBundle` from handlers.server.ts, `authenticate.admin`
**Do not mock:** form data parsing, redirect logic
**No tests needed:** JSX rendering, CSS, step indicator, card selection UI state
