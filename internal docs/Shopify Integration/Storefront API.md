---
title: Shopify Storefront API Notes
type: reference
last_audited: 2026-07-07
---

# Shopify Storefront API Notes

## Product descriptions

Use `Product.descriptionHtml` when rendering merchant-authored product descriptions in storefront UI. Shopify documents `Product.description` as the plain string with HTML tags removed, while `Product.descriptionHtml` is the HTML scalar that preserves merchant formatting such as bold and italic text.

For product detail modals, query and preserve both fields:

- `descriptionHtml` is the primary render source.
- `description` remains the plain-text fallback when HTML is absent.

