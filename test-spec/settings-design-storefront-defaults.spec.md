---
schema_version: 1
id: settings-design-storefront-defaults
title: Settings Design Storefront Defaults
type: test-spec
status: active
summary: Verifies storefront design-settings fallback defaults match current EB Product Page design defaults.
last_audited: 2026-07-15
owners:
  - Wolfpack Product Bundles
domains:
  - storefront
systems:
  - product-page-bundle-widget
source_paths:
  - app/routes/api/api.design-settings.$shopDomain.tsx
related_docs:
  - internal docs/EB Settings Design Reference.md
tags:
  - ppb
  - design-settings
keywords:
  - G32
  - storefront defaults
---

# Test Spec: Settings Design Storefront Defaults
**Spec ID:** settings-design-storefront-defaults  **Created:** 2026-07-15

## Purpose

Pin the storefront design-settings API fallback against the current Easy Bundles Product Page radius defaults so PPB widgets do not receive stale corner values when a shop has no persisted design row.

## Test Cases

### DesignSettingsApiFallback

| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Product Page fallback corner defaults | No persisted design settings row | Product card radius `10`, product image radius `8`, product-card button radius `5` | Matches EB runtime Product Grid `appearanceSettings` captured on 2026-07-15 |

## Acceptance Criteria

- [ ] Test fails before the fallback default change.
- [ ] Test passes after implementation.
- [ ] CSS-only deploy is not run; hard reload verifies any storefront behavior change.
