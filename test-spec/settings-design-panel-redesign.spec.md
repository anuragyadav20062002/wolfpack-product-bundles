---
schema_version: 1
id: settings-design-panel-redesign-spec
title: Settings Design Panel Redesign Test Spec
type: test-spec
status: active
summary: Behavior coverage for the three-column Settings Design workspace, storefront-faithful template previews, and local colour guides.
last_audited: 2026-07-23
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

Verify that the Design subpage keeps its existing settings behavior while the local preview models the real structure of every landing-page and product-page template, responds to every previewable setting, and exposes the relevant local colour guides.

## Test Cases

### DesignPreviewState

| # | Scenario | Input | Expected Output | Notes |
| --- | --- | --- | --- | --- |
| 1 | Default preview state | No prior preview state | Landing Page, Standard, desktop | Preview-only state |
| 2 | Change bundle type | Product Page | Product List becomes the template | Invalid cross-type template is not retained |
| 3 | Change template | Every registered key | The matching type/template pair is accepted | Covers all eight templates |
| 4 | Reject invalid combination | Landing Page with Product Grid | Combination is rejected | Uses existing template identifiers |
| 5 | Change viewport | Mobile, then desktop | Only viewport changes | Type, template, and unsaved settings remain intact |
| 6 | Change preview mode | Builder, Loading, Validation, Upsell | Only preview mode changes | Template and viewport remain intact |

### DesignPreviewModel

| # | Scenario | Input | Expected Output | Notes |
| --- | --- | --- | --- | --- |
| 1 | Resolve template structures | Eight registered template keys | Each key resolves to its storefront family, product arrangement, navigation, and summary structure | Pure descriptor behavior |
| 2 | Resolve preview targets | Every editable Design field | Every previewable field resolves to a semantic target and preview mode | Disabled GIF placeholders are excluded |
| 3 | Build preview theme | Valid Design state | Theme values come from the normalized storefront runtime | Includes weights, radii, image fit, and every expert scope |
| 4 | Resolve applicability | Field and selected template | Unsupported template-specific controls return a clear inapplicable result | No fabricated visual effect |

### DesignLivePreview

| # | Scenario | Input | Expected Output | Notes |
| --- | --- | --- | --- | --- |
| 1 | Render selectors | Default state | Both bundle types and all valid templates are selectable | Preview-only controls |
| 2 | Render viewport controls | Desktop state | Desktop and mobile buttons have labels and tooltips; desktop is active | One-click buttons |
| 3 | Render each template | Eight valid initial states | The matching storefront-faithful fixture structure renders | No iframe or remote media |
| 4 | Render representative states | Loading, Validation, and Upsell modes | The relevant non-default surface renders without shopping behavior | Deterministic local fixtures |
| 5 | Images and GIFs preview | Images & GIFs active | Image Fit updates fixture media and loading mode remains local | No asynchronous preview work exists |
| 6 | Missing real bundle | Empty preview-bundle list | Design controls and local fixture preview remain available | Only Preview Bundle needs a real URL |

### ColourGuideLinks

| # | Scenario | Input | Expected Output | Notes |
| --- | --- | --- | --- | --- |
| 1 | Render relevant Expert groups | General, Categories, Product Card, Bundle Cart, Upsell | Each group shows a `Show Colour Guide` link | Exact link copy |
| 2 | Open guide | Activate a guide link | The matching local `.avif` URL opens in a new tab | AVIF generation remains CI-owned |

## Acceptance Criteria

- [x] All listed test cases pass.
- [x] All eight template identifiers render their dedicated structures in desktop and mobile preview modes.
- [x] Viewport and preview-mode switching preserve bundle type, template, and unsaved field values.
- [x] Every editable preview-relevant field is mapped through the storefront runtime.
- [x] Design controls and local previews work without a storefront-ready bundle.
- [x] All five relevant Expert groups expose local AVIF colour-guide links.
- [ ] Entering Design crosses one lazy workspace boundary and reaches a usable preview within 750ms p75 in SIT.
- [x] Existing save, discard, and reset behavior remains unchanged; Preview Bundle remains separate and requires a real storefront URL.
