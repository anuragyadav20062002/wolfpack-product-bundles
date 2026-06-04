# Test Spec: decideDashboardPreviewAction

**Spec ID:** dashboard-preview-action  **Issue:** [feedback-jun26-5]  **Created:** 2026-05-29

## Purpose

`decideDashboardPreviewAction` is a pure helper that maps a dashboard bundle's state to the next preview action. Used by the dashboard Preview button.

Contract:

```ts
decideDashboardPreviewAction({
  bundleType: "full_page" | "product_page",
  bundleId: string,
  shopifyProductHandle: string | null,
  shopifyPageHandle: string | null,
  shop: string,
}): { kind: "open_url"; url: string }
 | { kind: "create_preview_page" }
 | { kind: "error"; toast: string }
```

## Test Cases

| # | Scenario | Input | Expected Output |
|---|---|---|---|
| 1 | FPB with Shopify Page already published | `{ bundleType: "full_page", bundleId: "abc", pageHandle: "build-your-box", productHandle: null, shop: "s.myshopify.com" }` | `{ kind: "open_url", url: "https://s.myshopify.com/pages/build-your-box" }` |
| 2 | FPB without Shopify Page | `{ ..., pageHandle: null }` | `{ kind: "create_preview_page" }` |
| 3 | PPB with product handle | `{ bundleType: "product_page", productHandle: "summer-bundle", shop: "s.myshopify.com" }` | `{ kind: "open_url", url: "https://s.myshopify.com/products/summer-bundle" }` |
| 4 | PPB without product handle | `{ bundleType: "product_page", productHandle: null, shop: "s.myshopify.com" }` | `{ kind: "error", toast: "Save and place the bundle on a product first to preview it." }` |
| 5 | Shop with https:// prefix normalized | `{ bundleType: "full_page", pageHandle: "x", shop: "https://s.myshopify.com" }` | URL exactly `https://s.myshopify.com/pages/x` |

## Acceptance Criteria

- [ ] All 5 test cases pass
- [ ] Helper is pure (no DOM, no network)
