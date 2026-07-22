---
schema_version: 1
id: admin-mobile-bundle-setup-accordion
title: Admin Mobile Bundle Setup Accordion
type: test-spec
status: active
summary: Verifies the mobile Bundle Setup disclosure state and active-section labeling.
last_audited: 2026-07-23
owners:
  - engineering
domains:
  - admin-ui
systems:
  - bundle-configure
source_paths:
  - app/routes/app/_shared/bundle-configure/CommonConfigureSidebar.tsx
  - tests/unit/routes/admin-mobile-navigation.test.ts
related_docs: []
tags:
  - mobile
  - accordion
keywords:
  - Bundle Setup
  - chevron
  - active section
---

# Test Spec: Admin Mobile Bundle Setup Accordion

**Spec ID:** admin-mobile-bundle-setup-accordion  **Created:** 2026-07-23

## Purpose

Confirm that the mobile Bundle Setup accordion communicates its disclosure state and current configure section correctly.

## Test Cases

### Admin mobile configure navigation

| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Accordion is collapsed | `open: false` | `chevron-down` | Indicates that the setup navigation can be expanded |
| 2 | Accordion is expanded | `open: true` | `chevron-up` | Indicates that the setup navigation can be collapsed |
| 3 | Parent section is active | Parent section ID | Matching section label | Existing behavior remains intact |
| 4 | Nested section is active | Nested section ID | Matching nested label | Existing behavior remains intact |

## Acceptance Criteria

- [x] Collapsed and expanded states return the correct semantic chevron icon.
- [x] The active parent or nested section label remains available to the accordion summary.
- [x] Selecting a mobile navigation item closes the disclosure.
