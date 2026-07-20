---
schema_version: 1
id: bfs-analytics-controls
title: BFS Analytics Controls Test Spec
type: test-spec
status: active
summary: Behavior gates for analytics save, export, compare, and backfill controls.
last_audited: 2026-07-20
owners:
  - engineering
domains:
  - admin
systems:
  - analytics
source_paths:
  - app/routes/app/app.attribution/AttributionDashboard.tsx
  - app/routes/app/app.attribution.tsx
related_docs:
  - docs/app-nav-map/APP_NAVIGATION_MAP.md
tags:
  - bfs
  - analytics
keywords:
  - contextual-save-bar
  - export
---

# Test Spec: BFS Analytics Controls
**Spec ID:** bfs-analytics-controls  **Created:** 2026-07-20

## Purpose
Verify that Analytics commands submit correctly and editable UTM settings use the App Bridge contextual save bar.

## Test Cases
### AnalyticsControls
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Export analytics | Selected date window | Remix fetcher receives CSV data and the browser downloads the named file | Must not trigger session-token reauthentication |
| 2 | Open backfill information | Selected analytics window | Modal explains Shopify order reconciliation, selected range, and duplicate handling | No request yet |
| 3 | Confirm backfill | Backfill modal CTA | Backfill submission uses the selected window and returns persistent feedback | Immediate action, no CSB |
| 4 | Edit custom UTM settings | Text differs from saved value | CSB opens; Save persists; Discard restores | Programmatic save bar only |
| 5 | Toggle comparison | Compare button click | Pressed state and comparison period are visible | Behavioral state only |

## Acceptance Criteria
- [x] All listed test cases pass
- [x] No in-page save button remains for custom UTM settings
