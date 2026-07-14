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

## Acceptance Criteria
- [ ] All listed test cases pass
- [ ] Deploy scripts invoke the backfill gate before Shopify deploy but the gate is disabled by default
- [ ] Docs warn that production apply mode is dangerous and requires manual user approval
