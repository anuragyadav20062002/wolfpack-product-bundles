---
schema_version: 1
id: settings-design-api-state-ui
title: Settings Design API, State, and UI
type: test-spec
status: active
summary: Behavior coverage for the Settings Design DTO, persistence document, preview state, and lightweight route shell.
last_audited: 2026-07-23
owners:
  - engineering
domains:
  - admin
  - settings
systems:
  - remix
  - design-settings
source_paths:
  - app/lib/settings-design-contract.ts
  - app/lib/settings-design-runtime.ts
  - app/routes/app/app.settings.tsx
  - app/routes/app/app.settings/DesignSettingsView.tsx
  - app/routes/app/app.settings/SettingsDesignFields.tsx
related_docs:
  - internal docs/EB Settings Design Reference.md
  - internal docs/Operations/Admin Performance.md
tags:
  - tdd
  - polaris
keywords:
  - pageCustomization
  - stylePresets
  - LCP
---

# Test Spec: Settings Design API, State, and UI

**Spec ID:** settings-design-api-state-ui  **Created:** 2026-07-22

## Purpose

Keep the Design subpage state and save DTO aligned with the store-level EB-shaped customization document while preserving unrelated API roots and keeping the Settings landing shell lightweight.

## Test Cases

### SettingsDesignContract

| # | Scenario | Input | Expected Output | Notes |
| --- | --- | --- | --- | --- |
| 1 | Valid Design DTO | Complete known field map and expert flag | Normalized typed DTO | Reject unknown fields |
| 2 | Invalid Design DTO | Invalid color, option, number, or malformed object | Validation error | Action returns HTTP 400 |
| 3 | Persisted state hydration | Partial persisted field map | Defaults plus valid persisted values | No legacy aliases |

### SettingsDesignRuntime

| # | Scenario | Input | Expected Output | Notes |
| --- | --- | --- | --- | --- |
| 1 | Preserve unrelated roots | Existing banners and mix-and-match data | Roots survive Design save | Deep merge design patch |
| 2 | EB API metadata | Basic brand settings | stylePresets, quickSettings, applyNewPageCustomization | Store-level contract |
| 3 | Expert precedence | Same basic and expert target values | Expert wins only when enabled | Applies to runtime and preview |

### SettingsDesignState

| # | Scenario | Input | Expected Output | Notes |
| --- | --- | --- | --- | --- |
| 1 | Failed save | Dirty draft and failed response | Draft remains dirty | No optimistic baseline update |
| 2 | Successful save | Pending DTO and successful response | Saved baseline becomes confirmed DTO | Response includes intent |

### SettingsDesignUI

| # | Scenario | Input | Expected Output | Notes |
| --- | --- | --- | --- | --- |
| 1 | Modern field controls | Color, number, select, and status fields | Polaris web components render | Behavior only; no CSS assertions |
| 2 | Lightweight landing shell | Initial Settings route render | Three actionable cards render without Design workspace | Protects landing LCP |
| 3 | Expert visual guides | Expert scope sections | Five local AVIF links open in a new tab | Guides use Wolfpack-owned assets |

## Acceptance Criteria

- [x] DTO validation rejects malformed or unknown Design fields.
- [x] Design saves atomically update both bundle-type rows.
- [x] Existing pageCustomization roots survive a Design save.
- [x] Basic and expert preview precedence matches the expert toggle.
- [x] Failed saves remain dirty; successful saves use confirmed state.
- [x] Design form controls are Polaris-first.
- [x] Expert color scopes link to Wolfpack AVIF guides in a new tab.
- [ ] Settings landing app-owned LCP p75 is at or below 2,000 ms with CLS below 0.1 across at least ten cache-bypassed loads.
