---
schema_version: 1
id: create-bundle-entry
title: Create Bundle Entry Test Spec
type: test-spec
status: active
summary: Verifies bundle creation redirects directly to the selected bundle type's configure page.
last_audited: 2026-07-23
owners:
  - engineering
domains:
  - admin
systems:
  - bundle-create
source_paths:
  - app/routes/app/app.bundles.create/route.tsx
related_docs:
  - docs/app-nav-map/APP_NAVIGATION_MAP.md
tags:
  - tdd
  - create
keywords:
  - bundle-entry
  - configure-redirect
---

# Test Spec: Create Bundle Entry

**Spec ID:** create-bundle-entry  **Issue:** [create-flow-edit-screen-1]  **Created:** 2026-05-22

## Purpose

Document the create bundle entry action behavior, including the first-load guided tour redirect signal after a merchant creates a bundle. Successful creation redirects directly into the selected bundle type's configure screen.

## Test Cases

### CreateBundleEntryAction

| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Successful PPB create for first-install-eligible shop | Valid product-page bundle form with `showFirstLoadTour: true` | 302 redirect to `/app/bundles/product-page-bundle/configure/:id?mode=create&first_load=true` | Ensures first-load tour can open only for eligible new installs |
| 2 | Successful FPB create for ineligible shop | Valid full-page bundle form with `showFirstLoadTour: false` | 302 redirect to `/app/bundles/full-page-bundle/configure/:id?mode=create` | Ensures existing shops do not receive the first-load query |
| 3 | Missing bundle name | Empty `bundleName` | 400 JSON error | Existing validation path |
| 4 | Subscription limit | Guard returns limit error | 403 JSON error | Existing guard path |
| 5 | Form forwarding | Valid full-page bundle form with stale `description` | `handleCreateBundle` receives `bundleName` and `bundleType`, but no `description` | Description is removed from create payload |

## Acceptance Criteria

- [x] All listed test cases pass.
- [x] Redirect includes `first_load=true` only when the create handler marks the shop eligible.
