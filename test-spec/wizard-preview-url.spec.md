# Test Spec: buildWizardPreviewUrl

**Spec ID:** wizard-preview-url  **Issue:** [feedback-jun26-2]  **Created:** 2026-05-29

## Purpose

`buildWizardPreviewUrl` is a pure helper that picks the right storefront URL to open from the CREATE wizard's Preview button, given the bundle type and the available handles.

Contract:

```ts
buildWizardPreviewUrl({
  shop: string,                 // e.g. "wolfpack-store-test-1.myshopify.com"
  bundleId: string,             // Wolfpack bundle id
  bundleType: "full_page" | "product_page",
  productHandle: string | null,
  pageHandle: string | null,
}): { kind: "url"; url: string } | { kind: "error"; reason: "missing_product_handle" }
```

## Test Cases

| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | FPB always returns app-proxy URL | `{ shop: "s.myshopify.com", bundleId: "abc", bundleType: "full_page", productHandle: null, pageHandle: null }` | `{ kind: "url", url: "https://s.myshopify.com/apps/product-bundles/wpb/abc" }` | FPB does not need a page handle — the app proxy route resolves by bundle id |
| 2 | FPB with page handle still uses app proxy | `{ ..., pageHandle: "build-your-box" }` | Same as #1 | We use the app-proxy URL as the canonical preview destination |
| 3 | PPB with product handle | `{ shop: "s.myshopify.com", bundleId: "abc", bundleType: "product_page", productHandle: "summer-bundle", pageHandle: null }` | `{ kind: "url", url: "https://s.myshopify.com/products/summer-bundle" }` | |
| 4 | PPB without product handle | `{ shop: "s.myshopify.com", bundleId: "abc", bundleType: "product_page", productHandle: null, pageHandle: null }` | `{ kind: "error", reason: "missing_product_handle" }` | Bundle product not yet created or handle not backfilled |
| 5 | Shop with `https://` prefix is normalized | `{ shop: "https://s.myshopify.com", bundleId: "abc", bundleType: "full_page", productHandle: null, pageHandle: null }` | URL exactly `https://s.myshopify.com/apps/product-bundles/wpb/abc` (no double-`https://`) | Helper must strip protocol if accidentally passed |
| 6 | Shop with trailing slash is normalized | `{ shop: "s.myshopify.com/", ... }` | URL with single slash before path | |

## Acceptance Criteria

- [ ] All 6 test cases pass
- [ ] Function is pure (no DOM, no network, no `window`)
- [ ] No competitor keywords (`eb`, `gbb`, `easybundles`) in source or tests
