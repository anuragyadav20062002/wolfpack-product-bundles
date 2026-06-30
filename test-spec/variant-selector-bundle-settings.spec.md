# Test Spec: Variant Selector Bundle Settings
**Spec ID:** variant-selector-bundle-settings  **Created:** 2026-06-13

## Purpose
Verify the bundle-level Variant Selector setting is saved and emitted separately from the Step Setup display-variants setting, and that storefront runtime code gives expanded variant cards precedence over inline selectors.

## Test Cases

### BundleSettingsSaveAndRuntime
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | FPB save disables bundle-level variant selector | `variantSelectorEnabled=false` form field | DB update includes `variantSelectorEnabled:false` | Separate from Step Setup variant expansion |
| 2 | Formatter emits disabled variant selector | bundle row with `variantSelectorEnabled:false` | widget config includes `variantSelectorEnabled:false` | Applies to FPB and PPB runtime config |
| 3 | Formatter defaults missing variant selector to enabled | bundle row missing field | widget config includes `variantSelectorEnabled:true` | Matches schema default |

### StorefrontVariantSelectorPolicy
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Inline selectors enabled for multi-variant product cards | toggle on, product has 2 variants, not expanded | `true` | Inline selector may render |
| 2 | Inline selectors disabled by bundle toggle | toggle off, product has 2 variants, not expanded | `false` | Product should use quick-look/modal variant flow |
| 3 | Expanded variant card suppresses inline selector | toggle on, expanded variant card | `false` | Each card already represents a variant |
| 4 | Single-variant product suppresses inline selector | toggle on, one variant | `false` | No variant choice needed |

### FullPageCategoryVariantSelector
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Category checkbox off keeps multi-variant product grouped | category-backed FPB step with `displayVariantsAsIndividualProducts=false` and stale step-level display flag true | product grid does not expand variants into separate cards | EB stores the checkbox per category; grouped card can render the variant selector |
| 2 | Category checkbox on expands multi-variant product | active category with `displayVariantsAsIndividualProducts=true` | product grid expands variants as individual cards | Expanded cards suppress the inline selector |

## Acceptance Criteria
- [ ] All listed test cases pass.
- [ ] Tests verify behavior/output, not CSS or visual placement.
