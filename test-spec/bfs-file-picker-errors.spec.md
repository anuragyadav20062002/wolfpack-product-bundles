---
schema_version: 1
id: bfs-file-picker-errors
title: BFS File Picker Errors Test Spec
type: test-spec
status: active
summary: Behavior gates for current-attempt file upload errors and stale mutation results.
last_audited: 2026-07-20
owners:
  - engineering
domains:
  - admin
systems:
  - file-picker
source_paths:
  - app/components/shared/FilePicker.tsx
related_docs:
  - docs/app-nav-map/APP_NAVIGATION_MAP.md
tags:
  - bfs
  - uploads
keywords:
  - file-picker
  - error-timing
---

# Test Spec: BFS File Picker Errors
**Spec ID:** bfs-file-picker-errors  **Created:** 2026-07-20

## Purpose
Ensure media errors appear only after the merchant starts an upload in the current picker session.

## Test Cases
### FilePickerUploadAttempt
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Picker opens with stale mutation error | No current upload attempt | Error ignored | Initial state stays clean |
| 2 | Current upload fails | Active attempt and failed mutation | Contextual error appears | Merchant interacted |
| 3 | Picker closes/reopens | Previous failed attempt | Attempt state resets | No stale error |

## Acceptance Criteria
- [ ] All listed test cases pass
- [ ] Invalid current uploads still explain how to recover
