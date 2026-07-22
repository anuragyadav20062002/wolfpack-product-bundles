---
schema_version: 1
id: configuration-wizard-removal
title: Configuration Wizard Removal Test Spec
type: test-spec
status: active
summary: Verifies bundle creation and cloning use the type-specific configure pages after the obsolete configuration wizard is removed.
last_audited: 2026-07-23
owners:
  - engineering
domains:
  - admin
systems:
  - remix-routes
source_paths:
  - app/lib/bundle-navigation.ts
  - app/routes/app/app.dashboard/DashboardPage.tsx
  - app/routes/app/app.dashboard/handlers/handlers.server.ts
related_docs:
  - docs/app-nav-map/APP_NAVIGATION_MAP.md
tags:
  - tdd
  - configure
keywords:
  - clone
  - configuration-wizard
---

# Test Spec: Configuration Wizard Removal

**Spec ID:** configuration-wizard-removal  **Created:** 2026-07-23

## Purpose

Verify that no active create or clone flow depends on the obsolete configuration wizard and that merchants land on the bundle type's configure page.

## Test Cases

### BundleNavigation

| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Full-page configure path | FPB bundle ID | `/app/bundles/full-page-bundle/configure/:bundleId` | Current configure page |
| 2 | Product-page configure path | PPB bundle ID | `/app/bundles/product-page-bundle/configure/:bundleId` | Current configure page |
| 3 | Successful clone redirect | Same-origin configure `redirectTo` | Returned configure path | Preserves `mode=create` |
| 4 | Invalid clone redirect | Failed, missing, or external response | `null` | Prevents stale or external navigation |
| 5 | Full-page clone response | FPB source bundle | FPB configure `redirectTo` | Server chooses type-specific route |
| 6 | Product-page clone response | PPB source bundle | PPB configure `redirectTo` | Server chooses type-specific route |

## Acceptance Criteria

- [x] The obsolete `/app/bundles/create/configure/:bundleId` route is absent.
- [x] Dashboard clone success follows the server's type-specific configure redirect.
- [x] New-bundle creation continues to redirect to FPB/PPB configure pages.
- [x] No production code imports wizard-only navigation or preview helpers.
- [x] Focused tests, lint, route generation, and production compilation pass.
