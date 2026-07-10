# Test Spec: Admin Root LCP Bootstrap
**Spec ID:** admin-root-lcp-bootstrap  **Created:** 2026-07-10

## Purpose
Keep the shared Admin app shell focused on dependencies required by every route.

## Test Cases
### AdminRootBootstrap
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Admin app shell renders | Loader data with Shopify API key, locale, translations, and shop | AppProvider, navigation, and outlet render without a Mantle provider wrapper | Mantle has no runtime consumers and should not ship on every route |

## Acceptance Criteria
- [ ] Admin root does not render a global Mantle provider.
- [ ] Admin root loader does not build Mantle provider config.
