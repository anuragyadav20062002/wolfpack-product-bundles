# Test Spec: Settings Controls Runtime Parity
**Spec ID:** settings-controls-runtime-parity  **Issue:** [settings-controls-runtime-parity-1]  **Created:** 2026-06-04

## Purpose
Ensure EB Settings -> Controls values are promoted from Admin state into runtime settings and consumed by storefront widgets for the highest-impact Landing Page and Product Page behavior controls.

## Test Cases
### SettingsControlsRuntime
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Landing controls runtime | EB Landing Page Controls payload | `settingsControls.landingPage` contains checkout action, execute script, inventory toggle, custom font, scoped CSS buckets, integration script/cart selector config, and video player settings | Mirrors EB Additional Configurations |
| 2 | Product controls runtime | EB Product Page Controls payload | `settingsControls.productPage` contains hide out-of-stock, auto-add-after-last-step, empty-state boxes, hide completed titles, product-card-click add, redirect action, execute script, scoped CSS, custom script, and selector config | Mirrors EB Product Page Layout |
| 3 | CSS scope separation | Landing and Product CSS fields set | FPB runtime CSS includes builder/dummy/theme CSS; PPB runtime CSS includes mix-and-match/theme CSS | EB keeps scopes distinct |
| 4 | Cart messaging compatibility | Cart Messaging toggles changed | Existing `bundleCartLineMessaging` shape remains populated | Preserves checkout/cart line behavior |

### StorefrontRuntime
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 5 | Controls settings endpoint | `bundleType=product_page` or `full_page` | Returns `settingsControls` and the active layout controls | Widgets can read one runtime source |
| 6 | PPB widget source contract | Product Page widget JS | Loads controls settings, applies product-card-click, auto-add-after-last-step, redirect action, and execute script hooks | Main PPB behavior flags wired |
| 7 | FPB widget source contract | Full Page widget JS | Loads controls settings and applies checkout/cart redirect plus execute script hooks | Main FPB behavior flags wired |
| 8 | Cart Transform messaging sync | Controls settings save with Bundle Items enabled | Settings action syncs `bundleCartLineMessaging` to the Cart Transform owner metafield | Keeps cart-line `Items` output aligned with the Admin toggle |

## Acceptance Criteria
- [x] Red tests fail for missing runtime mapping and widget source contracts before implementation.
- [x] Focused tests pass after implementation.
- [x] Widget source files pass `node --check`.
- [x] `npm run build:widgets` and CSS minification are run when widget files change.
- [x] Chrome smoke proves the settings save route persists runtime values and storefront widgets fetch/apply the controls settings.
