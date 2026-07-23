---
schema_version: 1
id: fpb-template-dialog-actions
title: FPB Template Dialog Actions
type: test-spec
status: active
summary: Verify FPB template dialog actions do not submit the enclosing bundle form and persist the selected preset through the template action.
last_audited: 2026-07-22
owners:
  - wolfpack
domains:
  - storefront-bundles
systems:
  - fpb-configure
source_paths:
  - app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/sections/ConfigureTemplateDialog.tsx
related_docs:
  - docs/competitor-analysis/fpb-feature-to-storefront-matrix.md
tags:
  - fpb
  - template-selection
keywords:
  - updateBundleDesignTemplate
  - saveBundle
---

# Test Spec: FPB Template Dialog Actions

**Spec ID:** fpb-template-dialog-actions  **Created:** 2026-07-22

## Purpose

Ensure template-dialog controls remain isolated from the enclosing bundle form so selecting and confirming a preset invokes the dedicated template update without accidentally submitting the full bundle configuration.

## Test Cases

### Template confirmation

| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Confirm a different preset | Open Select Template, choose Standard, activate Next | One `updateBundleDesignTemplate` request persists `STANDARD`; no `saveBundle` request is caused by Next | Reproduces the live dev regression found during F3 parity |
| 2 | Confirm after customization | Choose a preset, advance through customization, activate Done | One `updateBundleDesignTemplate` request persists the selected preset; no enclosing-form submission | Same action boundary as Next |
| 3 | Reload storefront | Hard reload after a successful confirmation | Bundle API and runtime both expose the selected preset | Verifies persistence rather than transient card state |
| 4 | Keyboard traversal | Open Select Template and press Tab through its controls | Focus reaches every native template card and Polaris action, including Next and Done, without escaping or resetting | Polaris hosts must participate in the focus trap |

## Acceptance Criteria

- [ ] Next and Done cannot submit the enclosing bundle form.
- [ ] Keyboard traversal reaches Polaris actions inside the focus trap.
- [ ] The dedicated template update action persists the selected preset.
- [ ] A cache-bypassed storefront reload uses the persisted preset.
