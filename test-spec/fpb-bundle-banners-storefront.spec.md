# Test Spec: FPB Bundle Banners Storefront
**Spec ID:** fpb-bundle-banners-storefront  **Issue:** [fpb-eb-bundle-banners-storefront-1]  **Created:** 2026-06-04

## Purpose
Ensure FPB bundle-level desktop and mobile banners render on the storefront through separate responsive image elements and stay isolated from PPB and unrelated FPB template CSS.

## Test Cases
### FPBBundleBannerRuntimeContract
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Metafield config includes bundle banners | FPB bundle config with `bundleBannerDesktopUrl` and `bundleBannerMobileUrl` | `bundle_ui_config` contains both fields | Required for metafield-first FPB load |
| 2 | Lightweight settings include bundle banners | FPB bundle with the two banner URLs | `bundle_settings` contains both fields | Required for display-only settings merge |
| 3 | Widget renders desktop/mobile banner image pair | Full-page widget source | Widget has a `createBundleBanners()` renderer, appends it before step timeline, and injects FPB-only desktop/mobile visibility styles | Mirrors the verified sibling-image behavior without growing the Shopify CSS asset |
| 4 | Template isolation stays scoped | Full-page widget source and product-page CSS source | FPB banner selectors stay in the FPB widget runtime and no PPB template CSS imports FPB banner selectors | Prevents PPB template leakage |

## Acceptance Criteria
- [x] RED tests fail before implementation and pass after implementation
- [x] Raw widget JS syntax checks pass
- [x] Widget bundles rebuild successfully
- [x] CSS minification resolves imports and stays under Shopify size limits
- [x] Desktop runtime contract renders desktop banner image before template content
- [x] Mobile runtime contract injects responsive image visibility rules
- [ ] Live desktop/mobile storefront smoke after deploy and CDN propagation
