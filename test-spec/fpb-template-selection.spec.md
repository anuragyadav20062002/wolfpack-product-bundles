# Test Spec: FPB Template Selection
**Spec ID:** fpb-template-selection  **Created:** 2026-06-21

## Purpose
Ensure full-page bundle Admin template selection uses Standard as the canonical default whenever saved template fields are missing, so newly created or fallback FPB bundles show Standard as selected in the UI.

## Test Cases
### FpbTemplateSelection
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Full-page bundle has no saved template fields | `{ bundleType: "full_page", bundleDesignTemplate: null, bundleDesignPresetId: null }` | `{ bundleDesignTemplate: "FBP_SIDE_FOOTER", bundleDesignPresetId: "STANDARD" }` | Drives Admin selected card state |
| 2 | Full-page bundle has saved Classic preset | `{ bundleType: "full_page", bundleDesignTemplate: "FBP_SIDE_FOOTER", bundleDesignPresetId: "CLASSIC" }` | Saved Classic selection | Ensures saved merchant choice wins |
| 3 | Product-page bundle has no FPB template fields | `{ bundleType: "product_page" }` | Null fields | FPB default must not leak into PPB |

## Acceptance Criteria
- [ ] All listed test cases pass
- [ ] WPB Select Template modal preselects Standard for FPB bundles missing saved template fields
- [ ] Existing saved FPB template choices remain unchanged
