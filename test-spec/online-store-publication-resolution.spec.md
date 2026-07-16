---
schema_version: 1
id: online-store-publication-resolution
title: Online Store Publication Resolution
type: test-spec
status: completed
summary: Verifies Online Store publication resolution when publication catalog data is unavailable to the app token.
last_audited: 2026-07-14
owners:
  - engineering
domains:
  - shopify-admin
systems:
  - bundle-parent-product
source_paths:
  - app/services/bundles/bundle-parent-product.server.ts
related_docs:
  - internal docs/Architecture/Bundle Parent Product.md
tags:
  - publication
  - parent-product
keywords:
  - Online Store
  - Publication.name
---

# Test Spec: Online Store Publication Resolution

**Spec ID:** online-store-publication-resolution  **Created:** 2026-07-14

## Purpose

Resolve Shopify's Online Store publication through the publication name available to the app's current `read_publications` token instead of an inaccessible catalog.

## Test Cases

### BundleParentProductPublication

| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Online Store catalog is unavailable | Publication is named `Online Store` and `catalog` is `null` | Parent product is published through that publication ID | Matches the app token's live response |
| 2 | Other sales channels are present | Publications include `Point of Sale`, `Shop`, and `Online Store` | Only the `Online Store` publication is selected | Preserves Online Store-only contract |

## Acceptance Criteria

- [x] Publication lookup uses the field available through the installed app token.
- [x] Sync Product resolves the agent store's Online Store publication.
- [x] Focused parent-product and FPB sync tests pass.
- [x] SIT hard-refresh verification succeeds without deployment.
