---
schema_version: 1
id: admin-mobile-responsive
title: Admin Mobile Responsive Behavior
type: test-spec
status: active
summary: Behavior contracts for responsive Admin navigation, bundle tables, overlays, and supporting merchant routes.
last_audited: 2026-07-22
owners:
  - engineering
domains:
  - admin
systems:
  - remix-routes
source_paths:
  - app/routes/app/
related_docs:
  - docs/app-nav-map/APP_NAVIGATION_MAP.md
tags:
  - responsive
keywords:
  - mobile
---

# Test Spec: Admin Mobile Responsive Behavior

**Spec ID:** admin-mobile-responsive  **Created:** 2026-07-22

## Purpose

Keep merchant actions and navigation behavior intact while Admin surfaces adapt to phone, tablet, and desktop containers.

## Test Cases

### Configure mobile navigation

| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Parent section is active | Active parent ID | Current-section label matches the parent | Shared by FPB and PPB |
| 2 | Nested section is active | Active child ID | Current-section label matches the child | Step and visibility children supported |
| 3 | Unknown section is supplied | Unknown ID | First navigable section is used | Avoids an empty disclosure summary |

### Dashboard responsive table

| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Bundle records are prepared for the table | Bundle list and display formatters | Rows preserve ID, source bundle, name, status, and type | Actions retain original record identity |
| 2 | No bundle records exist | Empty bundle list | No table rows are produced | Existing empty state remains responsible for presentation |

### Responsive interaction regressions

| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Accordion header is activated | Click or keyboard activation | Expanded state toggles without changing caller props | Events page |
| 2 | Readiness item is selected | Incomplete actionable item | Overlay closes and original section callback receives the key | Configure editors |
| 3 | Settings section changes on a phone | Existing language/control state | Active section changes without resetting dirty values | No layout assertions |

## Acceptance Criteria

- [ ] All listed behavior tests pass.
- [ ] No tests assert CSS properties, class names, source order, or visual placement.
- [ ] Existing save, row-action, modal, and navigation contracts remain unchanged.
- [ ] Live Chrome checks cover 320, 390, 430, 768, and desktop widths.
