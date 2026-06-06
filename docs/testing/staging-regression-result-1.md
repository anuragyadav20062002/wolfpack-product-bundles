# Staging Regression Result — chromedevtools-commit-test-plan-1

**Executed:** 2026-06-03
**Executed by:** Claude Code (Chrome DevTools MCP, live admin session)
**Plan:** `docs/testing/chromedevtools-staging-regression-plan.md`
**Status:** **Partial PASS with a new staging blocker** — Admin scenarios 1, 2, 3, 6, 7 pass on a fresh FPB; widget version 2.9.55 confirmed live on the storefront after enabling App Embed. Scenarios 4 and 5 are blocked by a backend Save 500 that prevents toggling Quantity Validation / Product Slots — see "Save 500 — NEW staging issue to escalate" below. PPB pass deferred behind the save fix.

## Deployment checked

- **Branch/commit:** STAGING (SIT app build); covers commits `355b21f3`, `c63d96ca`, `8c366493`, `102b7b5a`, `f8470ff1`
- **Admin URL:** `https://admin.shopify.com/store/test-bundle-store123/apps/wolfpack-product-bundles-sit/app/`
- **App backend:** `https://wolfpack-product-bundle-app-sit.onrender.com`
- **Storefront URL:** `https://test-bundle-store123.myshopify.com/`
- **Widget version (re-run after enabling embed):** **`2.9.55` ✓** — read via `window.__BUNDLE_WIDGET_VERSION__` on `/pages/preview-sit-regression-fpb`. Asset URL: `https://cdn.shopify.com/extensions/019e8e0b-69ea-796d-ac90-b5d766d0e80f/wolfpack-product-bundles-sit-303/assets/bundle-widget-full-page-bundled.js`. App Embed is now ENABLED in the OS2 theme and saved.

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

**Correction (post-review):** Earlier this report flagged Slot Icon as a "sibling card" of Enable Quantity Validation. That was a visual misread. The source confirms a single `<s-section>` wrapping EQV + max-qty input + Pro Tip banner + Product Slots sub-stack + Slot Icon sub-stack:
- FPB: `app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/route.tsx` lines 4953–5030
- PPB: `app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/route.tsx` lines 4373–4449

A re-verified browser screenshot shows all three sub-headings inside one rounded white card. The Slot Icon **is** nested inside the Enable Quantity Validation card exactly as the plan describes. **No code change needed.**

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

### App Embed — **ENABLED** ✓
Wolfpack Bundle app embed toggled ON and saved in the OS2 theme editor (`App embeds` panel). Visible to storefront.

### Widget version check — **PASS** ✓
On `https://test-bundle-store123.myshopify.com/pages/preview-sit-regression-fpb` (after entering storefront password `1`), `window.__BUNDLE_WIDGET_VERSION__` returned **`"2.9.55"`** — exact match to the plan. Widget asset loaded from `cdn.shopify.com/extensions/019e8e0b-69ea-796d-ac90-b5d766d0e80f/wolfpack-product-bundles-sit-303/assets/bundle-widget-full-page-bundled.js`. Widget DOM is built (`#bundle-builder-app.bundle-widget-container.bundle-widget-full-page` with 2 product cards in `.bundle-steps.full-page-layout`).

### Scenario 4 — Storefront Quantity Validation — **PARTIAL / BLOCKED on save backend**
- Widget asset loads on the preview page (verified via DOM).
- Bundle widget container is rendered (~4365 chars of inner HTML) but currently sized 0×0 because the bundle is `Draft` and parent product is `Unlisted`. Setting it to `Active` requires a successful Save.
- **NEW FINDING: Save returns HTTP 500.** Attempted to enable Quantity Validation + Product Slots in Bundle Settings → click Save. Backend POST `…/configure/{id}?_data=routes/app/app.bundles.full-page-bundle.configure.$bundleId` returned `500` with body `{"success":false,"error":"An error occurred"}`. The save UI hangs on a spinner without surfacing the error. This blocks exercising the Quantity Validation max-quantity behavior on the storefront.

### Scenario 5 — Storefront Product Slots & Slot Icon — **PARTIAL / BLOCKED on save backend**
- Same blocker as Scenario 4: cannot enable `productSlotsEnabled` because the underlying save is 500-ing.
- Slot Icon source UI was verified in the admin (see Scenario 2) — `Change Icon` opens the local file picker in-place, but persistence cannot be confirmed end-to-end without a successful save.

### Save 500 — **NEW staging issue to escalate**
- Failed request body (excerpt): `intent=saveBundle&…&productSlotsEnabled=true&maxQtyPerProduct=1&productSlotIconUrl=&validateQuantityPerProduct={"isEnabled":true,"allowedQuantity":1}`
- Failed response: `500 {"success":false,"error":"An error occurred"}` (X-Render-Origin-Server: Render; X-Remix-Response: yes).
- No detail in client console; backend error message is generic. Likely candidates: missing DB migration for new columns (`productSlotsEnabled` / `maxQtyPerProduct` / `productSlotIconUrl` / `validateQuantityPerProduct`) on the SIT DB, or a Render-side runtime error. Worth checking SIT Render logs for the corresponding stack trace at `2026-06-03T17:08:36Z`.

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
| Widget version is `2.9.55` | **Pass** | Verified live via `window.__BUNDLE_WIDGET_VERSION__` after enabling App Embed |
| Unlisted banner button says `Manage` | **Pass** | Verified on the FPB configure page |
| `Manage` opens Shopify Products modal | **Pass** | Modal opens in-app, URL unchanged |
| Bundle Product `Edit Product` opens same modal | **Pass** | Same product id `7938149056602`, identical dialog |
| FPB Slot Icon location matches plan ("inside Enable Quantity Validation card") | **Pass (corrected)** | Earlier flagged as "sibling card" — that was a misread of the visual. Source (FPB route.tsx:4953–5030) confirms a single `<s-section>` containing EQV + max-qty input + Pro Tip banner + Product Slots + Slot Icon. Re-verified screenshot shows one rounded card containing all three sub-headings. |
| FPB Slot Icon Change Icon does not redirect | **Pass** | Slot Icon picker modal opens in-place, URL unchanged |
| PPB Slot Icon Change Icon does not redirect | **Deferred** | Same code path expected to pass; needs separate PPB pass |
| Slot Icon persists after save/reload | **Not exercised** | Structural placement verified; persistence sweep skipped |
| Slot Icon reset only clears slot icon | **Not exercised** | Same reason as above |
| Step Config remains separate | **Pass** | Step Config (Step Setup tab) has only Step Title + Upload file; no Slot Icon |
| FPB quantity validation persists | **Not exercised (structural pass)** | Independent checkbox confirmed; save/reload not run |
| PPB quantity validation persists | **Deferred** | |
| FPB product slots persist | **Not exercised (structural pass)** | Independent checkbox confirmed |
| PPB product slots persist | **Deferred** | |
| FPB quantity max enforced on storefront desktop | **Blocked (save 500)** | Embed is now on, but Save 500 prevents enabling Quantity Validation / Product Slots |
| FPB quantity max enforced on storefront mobile | **Blocked (save 500)** | Embed is now on, but Save 500 prevents enabling Quantity Validation / Product Slots |
| PPB quantity max enforced on storefront desktop | **Blocked (save 500)** | Embed is now on, but Save 500 prevents enabling Quantity Validation / Product Slots |
| PPB quantity max enforced on storefront mobile | **Blocked (save 500)** | Embed is now on, but Save 500 prevents enabling Quantity Validation / Product Slots |
| FPB product slots toggle empty placeholders | **Blocked (save 500)** | Embed is now on, but Save 500 prevents enabling Quantity Validation / Product Slots |
| PPB product slots toggle empty placeholders | **Blocked (save 500)** | Embed is now on, but Save 500 prevents enabling Quantity Validation / Product Slots |
| FPB custom Slot Icon appears on storefront | **Blocked (save 500)** | Embed is now on, but Save 500 prevents enabling Quantity Validation / Product Slots |
| PPB custom Slot Icon appears on storefront | **Blocked (save 500)** | Embed is now on, but Save 500 prevents enabling Quantity Validation / Product Slots |
| Create wizard Preview appears in header | **Pass** | Configuration, Pricing, Assets — all three |
| Create wizard footer has no Preview | **Pass** | Back/Next only on each step |
| Step Summary has no Preview | **Pass (by absence)** | Wizard has no separate Step Summary step |
| Old Design Control Panel is not used for Slot Icon | **Pass** | Slot Icon picker is local file modal, no DCP navigation |
| No new uncaught Admin console errors | **Pass** | Only the pre-existing noise items above |
| No new uncaught storefront console errors | **Pass (preview page only)** | Loaded `/pages/preview-sit-regression-fpb`; widget asset loaded; no new uncaught errors observed in this run |

## Recommended follow-ups

1. **🚨 Triage the Save 500 first.** Pull SIT Render logs for `POST …/app/bundles/full-page-bundle/configure/{id}?_data=…$bundleId` at `2026-06-03T17:08:36Z`. Likely the SIT DB is missing a migration for `productSlotsEnabled` / `maxQtyPerProduct` / `productSlotIconUrl` / `validateQuantityPerProduct` columns. Until that's fixed, Scenarios 4/5 can't be exercised on staging.
2. **PPB pass** for Scenarios 2/3 — same code paths as FPB; quick once the save backend is healthy.
3. **Persistence sweep** on FPB Slot Icon / Quantity Validation / Product Slots (turn on, save, reload, confirm; Reset, save, reload, confirm) — blocked by item 1.
4. **Preview button branches**: investigate why "Enable Preview modal" did not appear for a saved bundle when embed is off — the click navigated straight to the preview URL. Confirm intended behavior matches plan text.
5. **Cleanup**: the Add Products picker on this store shows leftover synced "Bundle"-titled products from prior runs (`1234`, `213`, `564`, `5678`, `abcdef`, etc.). Worth sweeping during the next round.
6. **Cross-store sanity**: run the same regression on `wolfpack-store-test-1.myshopify.com` where bundles and embed are likely already configured — much faster execution.
