# Test Spec: PPB Select Template Default
**Spec ID:** ppb-select-template-default  **Created:** 2026-07-11

## Purpose
Verify the Product Page Bundle Select Template modal has Product List selected by default when the bundle has no complete saved template selection, while preserving valid merchant-saved template selections.

## Test Cases

### resolveProductPageTemplateSelection

| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Empty bundle template fields | `{}` | `PDP_INPAGE + CASCADE` | Product List is the modal default |
| 2 | Null bundle template fields | `{ bundleDesignTemplate: null, bundleDesignPresetId: null }` | `PDP_INPAGE + CASCADE` | Product List is the modal default |
| 3 | Valid saved Product Grid | `{ bundleDesignTemplate: "PDP_INPAGE", bundleDesignPresetId: "COGNIVE" }` | `PDP_INPAGE + COGNIVE` | Existing merchant selection is preserved |
| 4 | Incomplete saved selection | `{ bundleDesignTemplate: "PDP_INPAGE" }` | `PDP_INPAGE + CASCADE` | Invalid partial state falls back to Product List |

## Acceptance Criteria
- [ ] Product List is preselected when the PPB Select Template modal opens without a complete saved selection.
- [ ] Existing valid saved template choices still open selected.
- [ ] Focused unit tests pass.
