# Test Spec: Product Card CTA Mode
**Spec ID:** product-card-cta-mode  **Created:** 2026-06-12

## Purpose

Verify storefront product cards resolve their add-button state from the right runtime source: FPB uses the saved FPB Bundle Settings field for compact-plus vs text-button mode, while PPB keeps PPB-specific add/selected copy and does not render raw template tokens.

## Test Cases

### RuntimeCartSettingsMethods
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | FPB Classic default | `bundleDesignPresetId = "CLASSIC"` | `resolveFullPageCardCtaMode()` returns `text`; `getProductAddButtonText()` returns `Add To Box` | Matches current Classic storefront parity proof |
| 2 | FPB Classic merchant text override | `bundleDesignPresetId = "CLASSIC"`, `textOverrides.productAddButton` set | `getProductAddButtonText()` returns the override | Keeps text config merchant-controlled |
| 3 | FPB text-button setting is enabled | `selectedBundle.showTextOnPlusEnabled = true` | `resolveFullPageCardCtaMode()` returns `text`; `getProductAddButtonText()` returns `Add +` | Uses persisted FPB field |
| 4 | FPB text-button setting is disabled | `selectedBundle.showTextOnPlusEnabled = false` | `resolveFullPageCardCtaMode()` returns `icon`; `getProductAddButtonText()` returns `+` | Keeps compact icon mode |
| 5 | Newer direct add-button field is enabled | `selectedBundle.showTextOnAddButton = true` | `resolveFullPageCardCtaMode()` returns `text` | Keeps current direct field support |
| 6 | FPB Compact selected card | `bundleDesignPresetId = "COMPACT"`, icon CTA mode | `usesSelectedQuantityBadge()` returns `false` | Compact selected cards keep the inline quantity selector, not a badge-only count |
| 7 | FPB Standard selected icon card | `bundleDesignPresetId = "STANDARD"`, icon CTA mode | `usesSelectedQuantityBadge()` returns `false` | Icon selected cards keep the inline quantity selector |
| 8 | FPB Standard selected text card | `bundleDesignPresetId = "STANDARD"`, text CTA mode | `usesSelectedQuantityBadge()` returns `false` | Text selected cards keep the inline quantity selector |

### FullPageBundleSettingsPersistence
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | FPB Show Text toggle is saved | Toggle state is true with default/empty button copy | Save form includes `showTextOnAddButton`; handler persists it; widget formatter emits it | Keeps runtime in sync with the actual switch, not only text override copy |

### ProductPageCardCopy
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | PPB selected copy contains a quantity token | `currentStep.addonReplaceText = "Added x{{allowedQuantity}}"`, `currentQuantity = 1` | Button copy is `Added x1` | Prevents raw token leak in selected state |
| 2 | PPB modal product is unselected | `currentQuantity = 0`, `defaultAddText = "Add to Cart"` | Button copy is `Add to Cart` | Keeps PPB modal unselected copy |

## Acceptance Criteria

- [ ] All listed test cases pass.
- [ ] The test does not assert CSS, class names, or element placement.
