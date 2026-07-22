---
schema_version: 1
id: settings-design-panel-redesign-spec
title: Settings Design Panel Redesign Test Spec
type: test-spec
status: active
summary: Behavior coverage for the responsive Settings Design inspector and eight-template live preview.
last_audited: 2026-07-22
owners:
  - engineering
domains:
  - admin
systems:
  - settings-design
source_paths:
  - app/routes/app/app.settings/DesignSettingsView.tsx
  - app/routes/app/app.settings/DesignLivePreview.tsx
related_docs:
  - docs/app-nav-map/APP_NAVIGATION_MAP.md
  - internal docs/Operations/Admin Performance.md
tags:
  - tdd
  - design-preview
keywords:
  - viewport
  - templates
---

# Test Spec: Settings Design Panel Redesign

**Spec ID:** settings-design-panel-redesign  **Created:** 2026-07-22

## Purpose

Verify that the Design subpage keeps its existing settings behavior while the local live preview supports every landing-page and product-page template in desktop and mobile modes.

## Test Cases

### DesignPreviewState

| # | Scenario | Input | Expected Output | Notes |
| --- | --- | --- | --- | --- |
| 1 | Default preview state | No prior preview state | Landing Page, Standard, desktop | Preview-only state |
| 2 | Change bundle type | Product Page | Product List becomes the template | Invalid cross-type template is not retained |
| 3 | Change template | Every registered key | The matching type/template pair is accepted | Covers all eight templates |
| 4 | Reject invalid combination | Landing Page with Product Grid | Combination is rejected | Uses existing template identifiers |
| 5 | Change viewport | Mobile, then desktop | Only viewport changes | Type, template, and unsaved settings remain intact |

### DesignLivePreview

| # | Scenario | Input | Expected Output | Notes |
| --- | --- | --- | --- | --- |
| 1 | Render selectors | Default state | Both bundle types and all valid templates are selectable | Preview-only controls |
| 2 | Render viewport controls | Desktop state | Desktop and mobile buttons have labels and tooltips; desktop is active | One-click buttons |
| 3 | Render each template | Eight valid initial states | Shared preview renders the selected template | No iframe or remote media |
| 4 | Loading preview | Images & GIFs active | Shared preview renders a loading status | Same preview surface |
| 5 | Reactive variables | Valid preview variable record | Variables are applied to preview markup | Mapping remains separately validated |

## Acceptance Criteria

- [x] All listed test cases pass.
- [x] All eight template identifiers render in desktop and mobile preview modes.
- [x] Viewport switching preserves bundle type, template, and unsaved field values.
- [x] Desktop and mobile controls expose accessible labels, tooltips, and active state.
- [x] Images & GIFs renders the preview loading state.
- [x] Existing save, discard, reset, preview-bundle, and CSS-variable behavior remains unchanged.
