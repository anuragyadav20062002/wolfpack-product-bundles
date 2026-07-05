# Test Spec: Integrations Page Parity
**Spec ID:** integrations-page-parity  **Issue:** [eb-integrations-page-parity-1]  **Created:** 2026-06-04

## Purpose
Lock the Checkout-only Integrations page inventory, setup-link behavior, and browser-verified visible layout contract before updating the WPB Admin route.

## Test Cases
### IntegrationsData
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Checkout integration inventory is exposed | `INTEGRATION_CATEGORIES` | 1 category, 2 cards | Gokwik and Shopflo only |
| 2 | Setup actions route to temporary WPB guide destination | All cards | `setupUrl` is `https://wolfpackapps.com` | WPB guides will be authored later |
| 3 | Non-Checkout integrations stay out of source inventory | `INTEGRATION_CATEGORIES` | No Stoq, Zapiet, Skio, Appstle, Bold, Judge.me, PageFly, or GemPages records | Prevents reintroducing removed cards |

### IntegrationsRoute
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Route renders Checkout cards only | Chrome DevTools MCP snapshot | Checkout panel, Gokwik tile, Shopflo tile, logo slots, CTA arrow | No inline guide expansion |
| 2 | Request Integration mirrors EB action shape | Chrome DevTools MCP click/inspection | Single CTA link opens the interim WPB support destination | EB chat request errored in audited store |
| 3 | External links are safe | Browser element attributes | External setup/request actions use a new browsing context without leaking session tokens | Applies to setup and request actions |

### UtmPixelTrackingBanner
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Active tracker is slim | `getUtmPixelStatusBannerModel(true)` | Active chip, online dot, no disclosure action | Banner spacing verified in Chrome |
| 2 | Disabled tracker stays slim | `getUtmPixelStatusBannerModel(false)` | Not active chip, Learn more action, modal disclosure enabled | Activate Tracking lives inside modal |
| 3 | Trust copy is grounded in Shopify privacy behavior | `UTM_PIXEL_PRIVACY_MESSAGE` | Plain-language consent/privacy message | Based on Shopify pixel privacy and compliance docs |

## Acceptance Criteria
- [ ] All listed test cases pass
- [ ] Chrome screenshot confirms WPB page follows EB visible layout
- [ ] UTM Pixel Tracking banner has compact active/disabled states and a disabled-state modal with enabled Activate Tracking action
