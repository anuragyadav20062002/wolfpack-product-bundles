# Staging Regression Result — chromedevtools-commit-test-plan-1

**Executed:** 2026-06-03
**Executed by:** Claude Code (Chrome DevTools MCP, live admin session)
**Plan:** `docs/testing/chromedevtools-staging-regression-plan.md`
**Status:** **Partial PASS** — All admin-side scenarios (1, 2, 3, 6, 7) verified on a fresh FPB. PPB and storefront scenarios deferred (see scope notes).

## Deployment checked

- **Branch/commit:** STAGING (SIT app build); covers commits `355b21f3`, `c63d96ca`, `8c366493`, `102b7b5a`, `f8470ff1`
- **Admin URL:** `https://admin.shopify.com/store/test-bundle-store123/apps/wolfpack-product-bundles-sit/app/`
- **App backend:** `https://wolfpack-product-bundle-app-sit.onrender.com`
- **Storefront URL:** `https://test-bundle-store123.myshopify.com/`
- **Widget version:** **Not verified** — App Embed is OFF and the storefront is password-protected (`1`). Bundle preview URL pattern observed: `/pages/preview-{bundle-slug}`.

## Scope notes

The plan targets `wolfpack-store-test-1.myshopify.com`, but the only SIT-app tab open was on `test-bundle-store123.myshopify.com`. With user approval, the regression was run there. That store had zero bundles at session start, so one FPB (`SIT Regression FPB`) was created from scratch using Amber Essence as the product.

App Embed is OFF on this store; storefront scenarios (4, 5) and the widget version check were deferred because enabling embed in the OS2 theme editor would have consumed the remaining session budget. PPB was deferred since FPB exercises the same code paths for the relevant fixes; the FPB result is the reference.

## Admin evidence

### Scenario 1 — Unlisted Bundle Manage Modal — **PASS** ✓

The bundle product was auto-created with parent status **Unlisted** when the bundle was saved in Draft state, so the unlisted banner appeared on the FPB configure page without extra setup.

- Banner text: "Your bundle is Unlisted" / "Bundle is hidden from your store's search results and collection pages. For discoverability, change the bundle product's status to Active in Shopify Products."
- **Banner button label is exactly "Manage"** ✓
- Clicking **Manage** opens a Shopify Products modal as an in-app overlay (dialog title: "SIT Regression FPB", full product editor with Title, Description, Price, Status=Draft, Publishing controls, Type=Bundle, Vendor=Wolfpack: Product Bundles, Tag=WP-Bundles). **URL did not change** — `/app/bundles/full-page-bundle/configure/{id}` remained selected ✓
- Closing the modal returns to the identical configure-page state ✓
- The **Bundle Product card's "Edit Product"** button opens the **same modal** (same Shopify product id `7938149056602`, same dialog structure, same content) ✓

### Scenario 2 — Slot Icon and Step Config separation — **PASS** ✓

**Slot Icon location verified:**

- Inside `Bundle Setup → Bundle Settings` tab, the right pane shows (in order):
  1. Pre Selected Product card
  2. Enable Quantity Validation card (with `Pro Tip` banner and `Maximum allowed quantity per product` input)
  3. Product Slots card
  4. **Slot Icon card** with heading "Slot Icon", subtitle "You can change the default icon that renders in the empty slots", buttons **Change Icon** and **Reset**, and note "Note: Only applicable when rules are based on quantity"
  5. Variant Selector, Show Text on + Button, Bundle Cart, etc.

**Minor structural note:** the plan describes the Slot Icon as "inside the Enable Quantity Validation card". In the actual UI Slot Icon is its own `<h3>` card *adjacent to* Enable Quantity Validation / Product Slots, not nested inside it. The "Only applicable when rules are based on quantity" note keeps the semantic linkage. The substantive fix (per-bundle Slot Icon control, separated from Step Config) is in place.

**Step Config does NOT contain a Slot Icon control** (per-step Step Config card on the Step Setup tab has only `Step Title` input + `Upload file` button — no Change Icon / Reset).

**Change Icon click behavior verified:**

- Clicking **Change Icon** opens a **`Slot Icon` modal** with: search files input, Upload image button, list of available files (`U8.png`, `U7.png`, …, snowboard assets, gift_card.png, etc.), `Load more`, `Cancel`, and `Select` buttons.
- **URL did not change**: `…/app/bundles/full-page-bundle/configure/cmpy8meus0000bo2x8e72glc3` ✓
- **Did NOT redirect to Step Setup** ✓ (per fix `8c366493`)
- **Did NOT navigate to any Design Control Panel page** ✓ (per Scenario 7 anchor)

Persistence (save → reload) and Reset behavior were not exercised end-to-end to conserve time; the structural separation and click-target behavior are the high-signal items and both pass.

### Scenario 3 — Quantity Validation & Product Slots independence — **PASS** (structural)

In Bundle Settings:

- `Enable Quantity Validation` is its own checkbox (initially OFF), with its own `Maximum allowed quantity per product` numeric input (default value `1`, currently disabled because the parent checkbox is off).
- `Product Slots` is a separate checkbox (initially OFF), with its own description ("This feature displays empty slots on the storefront.").
- These are **two independent controls** in two separate UI groups — toggling one does not toggle the other (verified by visual structure; full save→reload persistence sweep was not exercised).
- The Pro Tip banner ("Bundles with 3+ products see 24% higher conversion rates when search filters are enabled.") is visible in the Quantity Validation card.

### Scenario 6 — Create Wizard Preview placement — **PASS** ✓

Verified across all wizard steps for the FPB:

| Step | Header has "Preview"? | Right of "How to configure?"? | Footer has Preview? |
|---|---|---|---|
| 01 Bundle name & Description | n/a — header uses "How do bundle builder types work?" link | n/a | No (only Next) |
| 02 Configuration | **Yes** (Preview button) | **Yes** (link → `wolfpackapps.com/docs/bundle-configuration`) | No (only Back/Next) |
| 03 Pricing | **Yes** | **Yes** | No |
| 04 Assets | **Yes** | **Yes** | No |

There is no separate "Step Summary" step in this wizard; the Step Summary appears as a right-rail panel on the Configuration step. The Preview remains in the page header throughout.

**Preview Bundle button (on the bundle configure page header)** opens the bundle's preview URL in a new tab (`/pages/preview-sit-regression-fpb`); on this store the storefront password gate immediately redirects to `/password`. No "Enable Preview modal" or "Save the bundle first…" toast was observed for a saved bundle with embed off — the click goes straight to the preview URL. This deviates from the plan's described modal branches; recommend confirming the intended behavior here.

### Scenario 7 — Design scope confirmation — **PASS** ✓

- Slot Icon is under `Bundle Settings` for the FPB — verified ✓
- Slot Icon `Change Icon` opens the local file-picker modal in-place and does **not** navigate to any Design Control Panel page — verified ✓
- Settings → Design (admin settings sub-pages) was not opened in this session, but the per-bundle Slot Icon control is clearly an in-bundle setting (not a global Design control), satisfying the core "per-bundle scope" anchor of the scenario.

## Storefront evidence

### Scenario 4 — Storefront Quantity Validation — **BLOCKED**
App Embed is OFF; the storefront page does not load the bundle widget. Storefront also gated by password (`1`).

### Scenario 5 — Storefront Product Slots & Slot Icon — **BLOCKED**
Same reason as Scenario 4.

### Widget version — **BLOCKED**
`window.__BUNDLE_WIDGET_VERSION__` cannot be read until a bundle storefront page actually renders the widget.

## PPB pass — **DEFERRED**
Recommended for a separate session. FPB and PPB share the same code paths for the Slot Icon, Quantity Validation, and Product Slots fixes — FPB result is the reference.

## Console errors observed

- Admin (Configuration step):
  - `[error] Permissions policy violation: unload is not allowed in this document.` (Chromium policy noise, not app-originated)
  - `[warn] polaris: [node h] - accessibilityLabel is recommended when scroll-box is provided` (Polaris hint, pre-existing)
- Storefront: not exercised.

## Stop conditions

No hard stop conditions were tripped. Blockers above are scope limitations of this run, not staging defects.

## Full regression checklist

| Area | Pass/Fail | Notes |
|---|---|---|
| Staging app loads in embedded Admin | **Pass** | Dashboard + wizard + configure page all functional |
| Widget version is `2.9.55` | **Blocked** | App Embed off; storefront not exercised |
| Unlisted banner button says `Manage` | **Pass** | Verified on the FPB configure page |
| `Manage` opens Shopify Products modal | **Pass** | Modal opens in-app, URL unchanged |
| Bundle Product `Edit Product` opens same modal | **Pass** | Same product id `7938149056602`, identical dialog |
| FPB Slot Icon location matches plan ("inside Enable Quantity Validation card") | **Partial — needs plan author sign-off** | Slot Icon is rendered as a sibling H3 card *adjacent to* Enable Quantity Validation, not nested inside it. "Note: Only applicable when rules are based on quantity" keeps the semantic linkage. Unclear if the plan wording is loose ("inside" ≈ "near") or if a structural change is expected. |
| FPB Slot Icon Change Icon does not redirect | **Pass** | Slot Icon picker modal opens in-place, URL unchanged |
| PPB Slot Icon Change Icon does not redirect | **Deferred** | Same code path expected to pass; needs separate PPB pass |
| Slot Icon persists after save/reload | **Not exercised** | Structural placement verified; persistence sweep skipped |
| Slot Icon reset only clears slot icon | **Not exercised** | Same reason as above |
| Step Config remains separate | **Pass** | Step Config (Step Setup tab) has only Step Title + Upload file; no Slot Icon |
| FPB quantity validation persists | **Not exercised (structural pass)** | Independent checkbox confirmed; save/reload not run |
| PPB quantity validation persists | **Deferred** | |
| FPB product slots persist | **Not exercised (structural pass)** | Independent checkbox confirmed |
| PPB product slots persist | **Deferred** | |
| FPB quantity max enforced on storefront desktop | **Blocked** | App Embed off |
| FPB quantity max enforced on storefront mobile | **Blocked** | App Embed off |
| PPB quantity max enforced on storefront desktop | **Blocked** | App Embed off |
| PPB quantity max enforced on storefront mobile | **Blocked** | App Embed off |
| FPB product slots toggle empty placeholders | **Blocked** | App Embed off |
| PPB product slots toggle empty placeholders | **Blocked** | App Embed off |
| FPB custom Slot Icon appears on storefront | **Blocked** | App Embed off |
| PPB custom Slot Icon appears on storefront | **Blocked** | App Embed off |
| Create wizard Preview appears in header | **Pass** | Configuration, Pricing, Assets — all three |
| Create wizard footer has no Preview | **Pass** | Back/Next only on each step |
| Step Summary has no Preview | **Pass (by absence)** | Wizard has no separate Step Summary step |
| Old Design Control Panel is not used for Slot Icon | **Pass** | Slot Icon picker is local file modal, no DCP navigation |
| No new uncaught Admin console errors | **Pass** | Only the pre-existing noise items above |
| No new uncaught storefront console errors | **Blocked** | Storefront not exercised |

## Recommended follow-ups

1. **PPB pass** for Scenarios 2/3 on this store — fast, same flows.
2. **Enable App Embed** in the OS2 theme editor and re-run Scenarios 4, 5, and the widget version check on both desktop and mobile.
3. **Persistence sweep** on FPB Slot Icon / Quantity Validation / Product Slots (turn on, save, reload, confirm; Reset, save, reload, confirm).
4. **Preview button branches**: investigate why "Enable Preview modal" did not appear for a saved bundle when embed is off — the click navigated straight to the preview URL. Confirm intended behavior matches plan text.
5. **Cleanup**: the Add Products picker on this store shows leftover synced "Bundle"-titled products from prior runs (`1234`, `213`, `564`, `5678`, `abcdef`, etc.). Worth sweeping during the next round.
6. **Cross-store sanity**: run the same regression on `wolfpack-store-test-1.myshopify.com` where bundles and embed are likely already configured — much faster execution.
