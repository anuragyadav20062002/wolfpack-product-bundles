---
schema_version: 1
id: fpb-app-proxy-host-migration
title: "Test Spec: FPB App Proxy Host Migration"
type: test-spec
status: active
summary: Verifies the FPB storefront host migration from Shopify Pages to signed app-proxy Liquid documents.
last_audited: 2026-07-14
owners:
  - engineering
domains:
  - storefront
systems:
  - fpb-app-proxy
source_paths:
  - app/routes/root/wpb.$bundleId.tsx
  - app/lib/fpb-storefront-url.ts
  - app/lib/fpb-preview-token.server.ts
related_docs:
  - internal docs/Architecture/Widget Architecture.md
tags:
  - tdd
  - fpb
  - app-proxy
keywords:
  - wpb_preview
  - application/liquid
---

# Test Spec: FPB App Proxy Host Migration

**Spec ID:** fpb-app-proxy-host-migration  **Created:** 2026-07-14

## Purpose

Make the signed FPB app-proxy route the only runtime document host while keeping Shopify theme layout and extension CDN asset ownership.

## Test Cases

### FpbStorefrontUrl

| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Canonical public URL | Shop and bundle ID | `/apps/product-bundles/wpb/{id}` URL | Default installed proxy root only |
| 2 | Draft preview URL | Valid preview token | Canonical URL with `wpb_preview` | No persisted preview record |

### FpbPreviewToken

| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Valid token | Matching shop, bundle, unexpired payload | Accepted | Version 1, 15-minute TTL |
| 2 | Tampered token | Modified payload or signature | Rejected | Timing-safe signature comparison |
| 3 | Expired token | Past `expiresAt` | Rejected | Route returns 404 |
| 4 | Mismatched binding | Different shop or bundle | Rejected | Route returns 404 |

### FpbAppProxyDocument

| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Invalid proxy HMAC | Unsigned or invalid request | 400 before DB access | Structured failure log |
| 2 | Public statuses | Active or unlisted FPB | 200 `application/liquid` | `Cache-Control: no-store` |
| 3 | Draft status | Valid preview token | 200 `application/liquid` | Unsigned/expired/mismatched drafts are 404 |
| 4 | Hidden statuses | Archived, missing, wrong type, cross-shop | 404 | No bundle disclosure |
| 5 | Runtime payload | Ordered steps/categories and template/preset | Escaped full formatter payload in marker | No proxy asset URLs |
| 6 | Proxy document bootstrap | Marker declares `data-bundle-config-source="app_proxy"` with full payload | Widget uses inline payload without bundle JSON request | Legacy Page payloads still hydrate through API |

### DashboardPreview

| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Preview any FPB status | Active, unlisted, or draft FPB | Request `createFpbPreview` | Every click mints a new signed URL |
| 2 | Preview PPB | Parent product handle | Open product URL | PPB behavior unchanged |
| 3 | Async signed preview response | FPB preview click followed by action response | Reserve a blank tab during the click and navigate it after the URL arrives | Avoid popup blocking |

### ParentProductRedirect

| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Migrated FPB parent route | Old product URL no longer owns the synthetic parent handle | Shopify serves the stored redirect to the canonical proxy | Native redirect is the primary path |
| 2 | PPB parent route | Product variant has a `product_page` bundle UI config | No redirect | PPB remains product-hosted |
| 3 | Theme Editor | FPB parent product opened in design mode | No redirect | Preserve merchant theme editing |
| 4 | Existing published FPB fallback | Parent has not completed native handle migration | App embed replaces the location with the canonical proxy | Safety fallback until migration succeeds |
| 5 | New FPB parent | Parent product creation | Deterministic `wpb-parent-{bundleId}` handle | No merchant-facing FPB product route is created |

## Acceptance Criteria

- [ ] All listed test cases pass
- [ ] Proxy HMAC verification happens before database access
- [ ] Draft previews are stateless and expire after 15 minutes
- [ ] Liquid output relies on the app embed for Shopify CDN assets
- [ ] No widget configuration-loading priority is changed
- [ ] App-proxy documents render from their complete inline payload without a bundle JSON fallback
- [ ] Every dashboard FPB preview click requests a new signed URL
- [ ] Dashboard FPB previews open after the asynchronous signed URL response
- [ ] Published FPB parent-product documents redirect through the app embed without affecting PPB or Theme Editor
- [ ] Shopify-native redirects are primary after FPB parents move to deterministic internal handles
