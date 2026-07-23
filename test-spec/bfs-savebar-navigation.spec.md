---
schema_version: 1
id: bfs-savebar-navigation
title: BFS Save Bar Navigation Test Spec
type: test-spec
status: active
summary: Behavior gates for awaiting App Bridge leave confirmation before Admin navigation.
last_audited: 2026-07-20
owners:
  - engineering
domains:
  - admin
systems:
  - navigation
source_paths:
  - app/lib/admin-savebar-navigation.client.ts
related_docs:
  - docs/app-nav-map/APP_NAVIGATION_MAP.md
tags:
  - bfs
  - save-bar
keywords:
  - leave-confirmation
  - navigation
---

# Test Spec: BFS Save Bar Navigation
**Spec ID:** bfs-savebar-navigation  **Created:** 2026-07-20

## Purpose
Prevent app-controlled navigation from discarding unsaved merchant changes.

## Test Cases
### SaveBarNavigation
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Save bar API available | Navigation callback | Leave confirmation resolves before navigation | App Bridge contract |
| 2 | Save bar API unavailable | Navigation callback | Navigation still runs once | Non-embedded test safety |
| 3 | Confirmation rejects | Navigation callback | Navigation does not run | Merchant remains on form |

## Acceptance Criteria
- [x] All listed test cases pass
- [x] Admin nav and configure-route programmatic navigation use the shared guard
