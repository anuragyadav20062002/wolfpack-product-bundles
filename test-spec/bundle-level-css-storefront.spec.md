# Test Spec: Bundle Level CSS Storefront Wiring
**Spec ID:** bundle-level-css-storefront  **Created:** 2026-06-12

## Purpose
Wire per-bundle Bundle Level CSS from FPB and PPB Bundle Settings into the storefront safely and with EB-equivalent per-bundle scope.

## Test Cases

### FPB Save Sanitization
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Saves safe CSS | `.bundle-widget-container { outline: 1px solid red; }` | DB update receives same CSS | Uses `processCss()` |
| 2 | Strips unsafe CSS | `<script>alert(1)</script>.bundle-widget-container { color: red; }` | DB update receives sanitized CSS without script tag | Mirrors PPB parser behavior |
| 3 | Empty CSS | empty string | DB update receives `null` | Avoids empty style injection |

### PPB Save Sanitization
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Saves safe CSS | `.bundle-widget-product-page { outline: 1px solid blue; }` | `parsePPBBundleSettings().bundleLevelCss` equals same CSS | Existing parser path |
| 2 | Strips unsafe CSS | `<script>alert(1)</script>.bundle-widget-product-page { color: blue; }` | Parsed CSS excludes script tag | Existing parser path |
| 3 | Empty CSS | empty string | Parsed CSS is `null` | Existing parser path |

### Storefront Config Formatting
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | FPB bundle has CSS | `bundleType: "full_page"`, `bundleLevelCss: "#bundle-builder-app { outline: 1px solid red; }"` | `formatBundleForWidget().bundleLevelCss` equals CSS | Proxy + metafield share formatter |
| 2 | PPB bundle has CSS | `bundleType: "product_page"`, `bundleLevelCss: ".bundle-widget-product-page { outline: 1px solid blue; }"` | `formatBundleForWidget().bundleLevelCss` equals CSS | Product metafield config uses formatter |
| 3 | Bundle has no CSS | `bundleLevelCss: null` | `formatBundleForWidget().bundleLevelCss` is `null` | Runtime can no-op |

### Runtime Injection
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | FPB selected bundle has CSS | `selectedBundle.bundleLevelCss` non-empty | One `<style data-wpb-bundle-level-css="bundleId">` exists | Scoped to active FPB bundle |
| 2 | PPB selected bundle has CSS | `selectedBundle.bundleLevelCss` non-empty | One `<style data-wpb-bundle-level-css="bundleId">` exists | Scoped to active PPB bundle |
| 3 | Selected bundle has no CSS | `selectedBundle.bundleLevelCss` empty | Existing bundle-level style is removed | Prevent stale CSS between bundles |
| 4 | Re-render same bundle | Call injection twice | Still one style tag | No duplicates |

### Chrome Verification
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | FPB metafield cached config | Hard reload after save/sync | CSS applies on first paint | Use FPB `data-bundle-config` |
| 2 | FPB proxy fallback | Verify proxy JSON | CSS exists in proxy payload | No extra CSS endpoint needed |
| 3 | PPB metafield config | Hard reload product-page bundle | CSS applies on first paint | Use PPB `data-bundle-config` |
| 4 | Scope | Open another FPB/PPB bundle/storefront | CSS does not leak | Verify style tag data attr |

## Acceptance Criteria
- [ ] FPB save sanitizes `bundleLevelCss` via `processCss()`.
- [ ] PPB save path continues sanitizing `bundleLevelCss` via `processCss()`.
- [ ] Formatted bundle config includes sanitized `bundleLevelCss`.
- [ ] FPB and PPB runtimes inject per-bundle CSS after app/template CSS.
- [ ] Runtime removes stale per-bundle CSS when selected bundle changes or CSS is empty.
- [ ] Chrome hard reload shows visible test CSS on the target FPB storefront.
- [ ] Chrome hard reload shows visible test CSS on the target PPB storefront.
- [ ] Chrome verifies CSS does not leak to another FPB or PPB bundle.
- [ ] No new storefront network request is added for Bundle Level CSS unless implementation evidence requires it.
