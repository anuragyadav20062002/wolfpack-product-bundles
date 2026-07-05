# Test Spec: Checkout Integrations Discount Codes
**Spec ID:** checkout-integrations-discount-code  **Created:** 2026-07-02

## Purpose
Verify checkout integrations use a typed provider selection and short-lived app discount codes instead of merchant-pasted checkout scripts.

## Test Cases
### SettingsControlsRuntime
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Landing page checkout provider selected | Checkout Settings = Redirect to Checkout, Checkout Integration = GoKwik | Runtime checkout action is `checkout`, provider is `gokwik`, no execute script is exposed | FPB only |
| 2 | Unknown provider value | Checkout Integration = unexpected value | Runtime provider falls back to `native` | Prevents unsafe callbacks |
| 3 | Article-listed cart app selected | Checkout Integration = Kaching Cart | Runtime provider is `kaching_cart` | Side-cart/cart refresh providers are saved as typed IDs |

### CheckoutIntegrationProviderRegistry
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Provider options exposed | none | Options include Shopify checkout, Theme cart drawer, GoKwik, Shopflo, Zecpay, Rebuy, Shiprocket/Fastrr, Monster cart, Upcart, Kaching Cart | Mirrors article-listed functions |
| 2 | Discount-code provider classification | provider IDs | GoKwik, Shopflo, Zecpay, Shiprocket/Fastrr return true; side-cart/cart-refresh providers return false | Keeps app-proxy endpoint closed |

### CheckoutIntegrationDiscountCodeService
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Supported provider creates code | admin, shop, provider `gokwik` | `discountCodeAppCreate` called with one-use `PRODUCT` code, app config metafield, startsAt and endsAt | Default TTL 30 minutes unless EB proves another TTL |
| 2 | Missing discount function | function lookup returns empty | Failure result without mutation | No hardcoded function ID |
| 3 | Shopify user error | mutation returns userErrors | Failure includes message | Surface setup issue |
| 4 | Shiprocket/Fastrr handoff creates code | admin, shop, provider `shiprocket_fastrr` | Code title and metafield use `shiprocket_fastrr` | Covers article-listed checkout handoff |

### AppProxyRoute
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Signed storefront request | supported provider | JSON `{ ok: true, code, expiresAt }` | Uses unauthenticated Admin |
| 2 | Unsupported or side-cart provider | provider outside discount-code provider set | 400 and no code creation | Closed list |
| 3 | Unsigned request | bad signature | 400 and no Admin call | App proxy guard |
| 4 | Article-listed checkout handoff provider | provider `shiprocket_fastrr` | Code creation is allowed | Checkout handoffs only |

### DiscountFunction
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Automatic add-on mode | no triggering WPB code | Existing add-on percentage candidates still emitted | Regression |
| 2 | Automatic mode with generated code present | entered code starts `WPB-` | Automatic add-on branch emits no candidates | Prevents double discount |
| 3 | Code mode with bundle group | triggering code + checkout integration metafield + bundle component lines | Bundle discount candidate emitted from component parent price adjustment | Replaces Cart Transform pricing |
| 4 | Code mode with add-on line | triggering code + add-on line | Add-on candidate emitted by code branch | Provider checkout still gets add-on savings |

## Acceptance Criteria
- [ ] All listed unit and function tests pass.
- [ ] Admin exposes a provider dropdown instead of FPB Checkout Settings Execute Script.
- [ ] Admin Settings dropdown includes all article-listed checkout/cart redirect providers.
- [ ] Admin Integrations contains Checkout entries only, with visible cards limited to GoKwik and Shopflo.
- [ ] Storefront creates and applies a short-lived discount code before invoking GoKwik, Shopflo, Zecpay, or Shiprocket/Fastrr.
- [ ] Storefront opens or refreshes cart drawer integrations without calling the discount-code endpoint.
- [ ] Native checkout/cart paths remain unchanged when provider is `native`.
