# Chrome DevTools Staging Regression Plan

**Issue:** `chromedevtools-commit-test-plan-1`  
**Created:** 2026-06-03  
**Purpose:** After all five commits are pushed to staging, verify the combined behavior in one Chrome DevTools testing session with Claude.

## Covered Commits

These commits are expected to be present together on staging:

| Commit | Commit message | Covered by |
|---|---|---|
| `355b21f3` | `[feedback-jun26-6] fix: open unlisted bundle manage action in admin modal` | Unlisted bundle Manage modal |
| `c63d96ca` | `[bundle-settings-slot-icon-step-config-parity-1] fix: keep slot icon as bundle setting` | Slot Icon and Step Config separation |
| `8c366493` | `[quantity-validation-eb-parity-create-preview-placement-1] fix: split quantity validation from product slots` | Quantity validation and product slots |
| `102b7b5a` | `[quantity-validation-eb-parity-create-preview-placement-1] fix: move wizard preview to header` | Create wizard Preview placement |
| `f8470ff1` | `[quantity-validation-eb-parity-create-preview-placement-1] docs: keep slot icon as bundle setting` | Slot Icon scope confirmation |

## Test Environment

- Shopify Admin embedded app:
  `https://admin.shopify.com/store/wolfpack-store-test-1/apps/wolfpack-product-bundles-sit/app/`
- Test store:
  `wolfpack-store-test-1.myshopify.com`
- Storefront password:
  `1`
- Use the embedded Shopify Admin URL above. Do not use a tunnel URL directly because it redirects to auth.
- Screenshots are useful as evidence, but do not commit Chrome DevTools investigation screenshots.

## First Check After Push

1. Confirm staging is serving the pushed build.
2. Open the embedded Admin app.
3. Open a storefront bundle page and run:

```js
console.log(window.__BUNDLE_WIDGET_VERSION__)
```

Expected final widget version: `2.9.12`.

If the widget version is lower, stop. The storefront bundle assets are not updated yet.

## Chrome DevTools Operating Notes

The embedded app runs inside a cross-origin Shopify Admin iframe. Use this order:

1. Use `take_snapshot()` to inspect available controls.
2. Click a safe visible control inside the app to place focus in the embedded frame.
3. Use keyboard navigation with `Tab`, `Shift+Tab`, `Enter`, and `Space` when direct clicking fails.
4. If Chrome DevTools exposes the app iframe as a separate page target, use `list_pages()`, `select_page()` for the iframe target, run DOM checks there, then switch back to the Admin page.
5. For storefront checks, test both:
   - Desktop: 1280 x 800 or larger
   - Mobile: iPhone 14 style viewport, 390 x 844

## Test Data Needed

Use existing staging bundles if available:

- One Full Page Bundle, FPB
- One Product Page Bundle, PPB
- One bundle whose Shopify product is unlisted

If the unlisted banner is not visible, use a bundle product that is unpublished or unlisted in Shopify Products, then return to the bundle configure page.

## Scenario 1: Unlisted Bundle Manage Modal

### Admin Steps

1. Open a bundle edit/configure page for a bundle whose Shopify product is unlisted.
2. Locate the `Your bundle is unlisted` banner.
3. Confirm the banner action label is exactly `Manage`.
4. Click `Manage`.
5. Confirm the Shopify Products modal opens inside the app flow.
6. Close the modal.
7. Locate the Bundle Product card and click `Edit Product`.
8. Confirm it opens the same Shopify Products modal behavior as the banner action.

### Expected Results

- The banner button text is `Manage`.
- Clicking `Manage` does not navigate away from the configure flow.
- The modal content and behavior match the Bundle Product card `Edit Product` action.
- Closing the modal returns to the same configure page state.

## Scenario 2: Slot Icon and Step Config Separation

### FPB Admin Steps

1. Open an FPB configure/edit page.
2. Go to `Bundle Settings`.
3. In the `Enable Quantity Validation` card, find the `Slot Icon` control.
4. Click `Change Icon`.
5. Confirm the file picker/modal opens.
6. Confirm the page does not jump or redirect to `Step Setup`.
7. Select or choose a harmless existing image if available.
8. Save the bundle.
9. Reload the page and confirm the Slot Icon selection persists.
10. Click `Reset` for Slot Icon.
11. Confirm only the Slot Icon is cleared.
12. Go to `Step Setup` and inspect the `Step Config` card.

### PPB Admin Steps

1. Open a PPB configure/edit page.
2. Go to `Bundle Settings`.
3. Confirm the same `Slot Icon` control exists in the `Enable Quantity Validation` card.
4. Repeat Change Icon, save, reload, and reset checks.

### Expected Results

- `Change Icon` never redirects to Step Setup.
- Slot Icon is stored per bundle and persists after reload.
- `Reset` clears only the Slot Icon.
- Step Config remains separate from Slot Icon.
- Slot Icon is not controlled from any old Design Control Panel page.

## Scenario 3: Quantity Validation and Product Slots

### Admin Steps: FPB and PPB

For both FPB and PPB configure/edit pages:

1. Open `Bundle Settings`.
2. Find the `Enable Quantity Validation` card.
3. Confirm the Pro Tip banner is visible.
4. Turn `Enable Quantity Validation` on.
5. Confirm the max quantity input is enabled.
6. Set max quantity per product to `1`.
7. Turn `Product Slots` off.
8. Save the bundle.
9. Reload the page.
10. Confirm quantity validation is still enabled, max is still `1`, and Product Slots remains off.
11. Turn Product Slots on and save again.
12. Confirm Slot Icon remains visible as a per-bundle setting in the same Bundle Settings area.

### Expected Admin Results

- Quantity Validation and Product Slots do not toggle each other.
- Quantity Validation persists independently after save and reload.
- Product Slots persists independently after save and reload.
- Slot Icon remains in Bundle Settings only.

## Scenario 4: Storefront Quantity Validation

Run this for both FPB and PPB storefront pages.

### Steps

1. Open the storefront bundle page.
2. Add one product to the bundle.
3. Try to increase the same product quantity above `1`.
4. Confirm the UI blocks the action.
5. Confirm the error/toast text is:

```text
Maximum allowed quantity per product is 1
```

6. Confirm decreasing quantity or removing the product still works.
7. Repeat on desktop and mobile.

### Expected Results

- Storefront blocks duplicate product quantity above the configured max.
- Decrease and remove actions still work.
- No new uncaught console errors appear.

## Scenario 5: Storefront Product Slots and Slot Icon

Run this for both FPB and PPB storefront pages.

### Steps

1. With Product Slots off in Admin, reload the storefront.
2. Confirm empty slot-card placeholders are not shown.
3. Turn Product Slots on in Admin and save.
4. Reload the storefront.
5. Confirm empty slots are shown.
6. Set a custom Slot Icon in Admin and save.
7. Reload the storefront.
8. Confirm empty product slots show the configured Slot Icon.
9. Reset Slot Icon in Admin and save.
10. Reload storefront and confirm empty product slots return to the default plus-style fallback.
11. Repeat on desktop and mobile.

### Expected Results

- Product Slots controls only empty slot rendering.
- Slot Icon changes only the icon used in empty slots.
- Reset clears Slot Icon without changing Step Config.

## Scenario 6: Create Wizard Preview Placement

### Admin Steps

1. Open the create bundle wizard configure page.
2. Inspect the page header.
3. Confirm `Preview` appears next to `How to configure?`.
4. Inspect the wizard footer.
5. Confirm the footer contains navigation actions such as `Back`, `Next`, or `Finish`, but no `Preview`.
6. Go through each wizard step:
   - Configuration
   - Pricing
   - Assets
   - Step Summary if present
7. Confirm `Preview` remains in the top header and does not reappear in the footer or Step Summary.
8. Click the top `Preview` button.

### Expected Preview Behavior

- If the app embed is disabled, the Enable Preview modal appears.
- If the bundle has a preview URL and the app embed is enabled, preview opens normally.
- If the bundle is not saved enough to generate a preview URL, the app shows:

```text
Save the bundle first to generate a preview URL.
```

## Scenario 7: Design Scope Confirmation

### Admin Steps

1. Open an FPB configure/edit page.
2. Confirm Slot Icon is under `Bundle Settings`.
3. Confirm clicking Slot Icon `Change Icon` opens the local image/file selection flow and does not open or navigate to any Design Control Panel page.
4. Open a PPB configure/edit page and repeat the same check.
5. Navigate to Settings Page -> Design if available.
6. Confirm general design settings are separate from per-bundle Slot Icon settings.

### Expected Results

- There is no Slot Icon workflow in the old Design Control Panel page.
- Slot Icon remains a per-bundle control.
- Settings Page -> Design does not replace per-bundle Slot Icon control.

## Full Regression Checklist

| Area | Pass/Fail | Notes |
|---|---|---|
| Staging app loads in embedded Admin |  |  |
| Widget version is `2.9.12` |  |  |
| Unlisted banner button says `Manage` |  |  |
| `Manage` opens Shopify Products modal |  |  |
| Bundle Product `Edit Product` opens same modal |  |  |
| FPB Slot Icon Change Icon does not redirect |  |  |
| PPB Slot Icon Change Icon does not redirect |  |  |
| Slot Icon persists after save/reload |  |  |
| Slot Icon reset only clears slot icon |  |  |
| Step Config remains separate |  |  |
| FPB quantity validation persists |  |  |
| PPB quantity validation persists |  |  |
| FPB product slots persist |  |  |
| PPB product slots persist |  |  |
| FPB quantity max enforced on storefront desktop |  |  |
| FPB quantity max enforced on storefront mobile |  |  |
| PPB quantity max enforced on storefront desktop |  |  |
| PPB quantity max enforced on storefront mobile |  |  |
| FPB product slots toggle empty placeholders |  |  |
| PPB product slots toggle empty placeholders |  |  |
| FPB custom Slot Icon appears on storefront |  |  |
| PPB custom Slot Icon appears on storefront |  |  |
| Create wizard Preview appears in header |  |  |
| Create wizard footer has no Preview |  |  |
| Step Summary has no Preview |  |  |
| Old Design Control Panel is not used for Slot Icon |  |  |
| No new uncaught Admin console errors |  |  |
| No new uncaught storefront console errors |  |  |

## Stop Conditions

Stop and report a blocker if any of these happen:

- Staging does not include the pushed commits.
- Storefront widget version is not `2.9.12`.
- Chrome DevTools cannot access the embedded app iframe and keyboard navigation cannot interact with it.
- The bundle cannot be saved due to an unrelated backend/auth error.
- A storefront-visible change cannot be verified on both desktop and mobile.

## Final Report Template

```markdown
## Staging Regression Result
Status: Pass / Fail / Blocked

Deployment checked:
- Branch/commit:
- Admin URL:
- Storefront URLs:
- Widget version:

Admin evidence:
- Unlisted Manage modal:
- FPB Slot Icon:
- PPB Slot Icon:
- Quantity Validation/Product Slots:
- Create Wizard Preview:
- Design scope:

Storefront evidence:
- FPB desktop:
- FPB mobile:
- PPB desktop:
- PPB mobile:

Issues found:
- <issue or "None">

Console errors:
- Admin: <errors or "None">
- Storefront: <errors or "None">
```
