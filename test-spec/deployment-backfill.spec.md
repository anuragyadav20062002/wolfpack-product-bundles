---
schema_version: 1
id: deployment-backfill
title: "Test Spec: Deployment Backfill"
type: test-spec
status: active
summary: Verifies guarded deployment-time FPB Page-host migration and bundle storefront synchronization.
last_audited: 2026-07-14
owners:
  - engineering
domains:
  - operations
systems:
  - deployment-backfill
source_paths:
  - app/services/deployment-backfill.server.ts
  - app/services/bundles/fpb-page-host-migration.server.ts
  - app/services/cart-transform-service.server.ts
  - scripts/deployment-backfill.ts
related_docs:
  - internal docs/Operations/Deployment Backfill.md
tags:
  - tdd
  - backfill
keywords:
  - fpbProxyMigrations
  - pageDelete
---

# Test Spec: Deployment Backfill
**Spec ID:** deployment-backfill  **Created:** 2026-07-10

## Purpose
Provide a guarded deployment-time maintenance script that migrates FPB Page hosts to the app proxy before synchronization and leaves PPB product hosting unchanged.

## Test Cases
### Backfill Safety and Sync Loop
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Disabled by default | Empty env | No shop scan and no sync calls | Deployment-safe default |
| 2 | Apply without confirmation | Enabled + apply env, no confirmation | Throws before syncing | Protects production |
| 3 | Dry-run | Enabled only | Lists shops and bundles, no sync calls | Preview path |
| 4 | Apply with confirmation | Enabled + apply + exact confirmation | Calls existing bundle sync for each target | Uses offline Admin client per shop |
| 5 | Single-shop limit | Shop + limit env | Queries only that shop and limit | Focused recovery path |
| 6 | FPB dry-run counts | Stored public/preview Page references and parent handle | Reports proxy, Page deletion, and redirect counts without mutations | No Admin client acquisition |
| 7 | FPB apply ordering | Confirmed apply | Redirects and deletes Pages before FPB sync | PPB skips host migration |
| 8 | FPB migration failure | Redirect or Page cleanup failure | Does not sync failed FPB and records failure | Process exits non-zero |
| 9 | Retry | Existing correct redirects or missing Pages | Succeeds and clears Page references | Idempotent |
| 10 | Native FPB product redirect | Published FPB parent with merchant-facing handle | Reserves redirect, moves product to deterministic internal handle with automatic redirect disabled, verifies proxy redirect | Shopify serves the old route as a platform 301 |
| 11 | Partial handle-move retry | Shopify handle already moved but DB still stores old handle | Repairs/verifies old redirect and persists live internal handle without another rename | Idempotent after interrupted apply |
| 12 | Parent handle update failure | `productUpdate` user error | Preserves Page references and skips FPB sync | No partial Page cleanup |
| 13 | Deleted parent | Stored product ID no longer resolves | Keeps old route redirect, completes Page cleanup, then normal sync recreates parent | Deleted route is already redirect-eligible |
| 14 | Cart Transform apply sweep | Confirmed apply across selected shops | Deletes and recreates one CartTransform per shop with `blockOnFailure: true` before bundle sync | Includes shops with no bundles |
| 15 | Cart Transform dry-run | Enabled without apply | Reports transforms to replace without acquiring Admin clients or mutating Shopify | Mutation-free preview |
| 16 | Cart Transform deletion failure | Delete returns a Shopify error | Does not create a replacement, skips that shop's bundles, records failure, exits non-zero | Avoids ambiguous active configuration |
| 17 | Runtime-secret restoration | Replacement succeeds | Writes the derived runtime-token secret to the new CartTransform owner | Keeps signed runtime validation operational |
| 18 | Ambiguous delete response | Delete returns no user errors but omits `deletedId` | Does not create a replacement and records failure | Requires positive deletion confirmation |

## Acceptance Criteria
- [x] All listed test cases pass
- [x] Deploy scripts invoke the backfill gate before Shopify deploy but the gate is disabled by default
- [x] Docs warn that production apply mode is dangerous and requires manual user approval
- [x] FPB parent handle migration never changes product status, publication, media, variant, or PPB handles
- [x] Apply replaces the CartTransform exactly once per selected shop before syncing its bundles
- [x] A shop-level replacement failure skips that shop's bundles and produces a non-zero command result
