---
schema_version: 1
id: settings-design-panel-redesign-spec
title: Settings Design Panel Redesign Test Spec
type: test-spec
status: active
summary: Behavior coverage for the three-column Settings Design workspace, canonical storefront template scenes, and local colour guides.
last_audited: 2026-07-24
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
| 6 | Change preview surface | Any surface supported by the selected template | Only preview surface changes | Template and viewport remain intact |
| 7 | Reject unsupported surface | Product Picker on Product List | State remains on Builder | Template-aware surface contract |
| 8 | Change template with incompatible surface | Product Picker, then Product List | Surface falls back to Builder | Valid state is always preserved |

### DesignPreviewModel

| # | Scenario | Input | Expected Output | Notes |
| --- | --- | --- | --- | --- |
| 1 | Resolve canonical template structures | Eight registered template keys | Each key resolves from the canonical selection and widget config to its real product, navigation, category, summary, and responsive structure | Pure descriptor behavior |
| 2 | Resolve preview targets | Every editable Design field and template | Every previewable field resolves to a semantic target and visible surface | Slot product-card controls resolve to Product Picker |
| 3 | Build preview themes | Valid FPB and PPB Design state | Semantic tokens come from the correct normalized runtime family | Includes weights, radii, image fit, quantity, toast, footer, empty slot, and upsell tokens |
| 4 | Resolve applicability | Field and selected template | Unsupported template-specific controls return a clear inapplicable result | No fabricated visual effect |
| 5 | Build deterministic fixture | Local fixture registry | Multiple products, selections, slots, steps, categories, tiers, validation, and upsell data are present | Local media only |
| 6 | Resolve scene regions | Template, surface, and viewport | Required storefront-owned regions are returned for all valid combinations | No merchant-theme chrome |

### DesignLivePreview

| # | Scenario | Input | Expected Output | Notes |
| --- | --- | --- | --- | --- |
| 1 | Render selectors | Default state | Both bundle types and all valid templates are selectable | Preview-only controls |
| 2 | Render viewport controls | Desktop state | Desktop and mobile buttons have labels and tooltips; desktop is active | One-click buttons |
| 3 | Render each template | Eight valid initial states | The matching storefront-faithful fixture structure renders | No iframe or remote media |
| 4 | Render template-aware surfaces | Product Picker, Cart / Summary, Loading, Validation, and Upsell | Only surfaces supported by the selected template are selectable and rendered | Deterministic local fixtures |
| 5 | Images and GIFs preview | Images & GIFs active | Image Fit updates fixture media and loading mode remains local | No asynchronous preview work exists |
| 6 | Missing real bundle | Empty preview-bundle list | Design controls and local fixture preview remain available | Only Preview Bundle needs a real URL |
| 7 | Local preview media | Any Builder or Product Picker surface | Images use `OptimisedImage` with local PNG sources and generated-format siblings | CI owns AVIF/WebP generation |

### ColourGuideLinks

| # | Scenario | Input | Expected Output | Notes |
| --- | --- | --- | --- | --- |
| 1 | Render relevant Expert groups | General, Categories, Product Card, Bundle Cart, Upsell | Each group shows a `Show Colour Guide` link | Exact link copy |
| 2 | Open guide | Activate a guide link | The matching local `.avif` URL opens in a new tab | AVIF generation remains CI-owned |

## Acceptance Criteria

- [x] All listed local test cases pass.
- [x] All eight template identifiers resolve from canonical storefront contracts and render dedicated desktop/mobile structures.
- [x] Viewport and preview-surface switching preserve bundle type, template, and unsaved field values.
- [x] Slot product-card controls reveal Product Picker and Product List cart controls reveal Cart / Summary.
- [x] Every editable preview-relevant field is mapped through the correct FPB or PPB storefront runtime family.
- [x] Deterministic fixture media is local and uses the optimized image pipeline without committed AVIF/WebP output.
- [x] Design controls and local previews work without a storefront-ready bundle.
- [x] All five relevant Expert groups expose local AVIF colour-guide links.
- [ ] Entering Design crosses one lazy workspace boundary and reaches a usable preview within 750ms p75 in SIT.
- [x] Existing save, discard, and reset behavior remains unchanged; Preview Bundle remains separate and requires a real storefront URL.
