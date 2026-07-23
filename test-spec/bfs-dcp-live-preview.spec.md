---
schema_version: 1
id: bfs-dcp-live-preview
title: BFS Design Control Panel Live Preview Test Spec
type: test-spec
status: active
summary: Behavior gates for a live app-owned design preview with inert commerce controls.
last_audited: 2026-07-20
owners:
  - engineering
domains:
  - admin
systems:
  - design-control-panel
source_paths:
  - app/routes/app/app.settings/DesignSettingsView.tsx
  - app/routes/app/app.settings/settings-state.ts
related_docs:
  - docs/app-nav-map/APP_NAVIGATION_MAP.md
tags:
  - bfs
  - live-preview
keywords:
  - design-variables
  - live-preview
---

# Test Spec: BFS Design Control Panel Live Preview
**Spec ID:** bfs-dcp-live-preview  **Created:** 2026-07-20

## Purpose
Apply unsaved design values to a simultaneous app-owned bundle preview without persisting settings or allowing cart actions.

## Test Cases
### ExistingDesignSettingsView
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Build preview variables | Unsaved design field values | Only validated mapped CSS variables are returned | No arbitrary CSS |
| 2 | Render configured bundle | Previewable bundle and design values | Existing design settings view renders a preview without a storefront iframe | Avoids Shopify frame restrictions |
| 3 | Preview commerce actions | Product and cart actions | Actions remain disabled | Preview cannot mutate cart state |
| 4 | No previewable bundle | Empty bundle list | Existing controls remain disabled | No editor without preview |

## Acceptance Criteria
- [ ] All listed test cases pass
- [ ] Desktop controls and preview are visible simultaneously
- [x] Preview interactions cannot mutate cart state
