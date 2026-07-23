# Test Spec: Settings Language Runtime
**Spec ID:** settings-language-runtime  **Issue:** [eb-settings-language-parity-1]  **Created:** 2026-06-04

## Purpose
Verify Settings -> Language creates an EB-shaped store-level language contract for both Landing Page and Product Page bundle storefronts.

## Test Cases

### SettingsLanguageRuntime
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Multilanguage enabled | `isMultilanguageEnabled: true` | `languageMode` is `MULTIPLE` | Matches EB save document |
| 2 | Shared cart labels | Custom shared cart fields | `sharedComponents.en.cartAndCheckout` and `sharedCartLabels` use custom values | Used by cart line display |
| 3 | Landing page labels | Custom FPB product and cart labels | `en.general` and FPB `textOverrides` map to widget keys | FPB active runtime remains field objects |
| 4 | Product page labels | Custom PPB product and cart labels | `mixAndMatchTextData.en` and PPB `customTextSettings` map to independent widget keys | Product card add and bundle ATC stay separate |
| 5 | Product page inline card labels | Custom `productCardAddBtnText_inPage`, `productVariantLabelText`, plus modal add text | PPB `textOverrides.productCardInlineAddButton` and `productVariantLabel` map separately from `productCardAddButton` | Product Grid and Cascade cards use EB inline add copy; selectors use active variant label |
| 6 | Product page bundle cart labels | Custom inline drawer and selected-products labels | PPB `textOverrides.viewBundleItems` and `bundleCartSelectedProductsText` map from EB runtime keys | Cascade bundle cart copy uses active locale |
| 7 | Product page validation labels | Custom quantity and amount validation messages | PPB `textOverrides` maps validation message aliases used by Product Page modal/in-page navigation | Validation toasts use active locale instead of hardcoded copy |

## Acceptance Criteria
- [ ] All listed test cases pass
- [ ] Runtime response exposes full language document, FPB active locale, PPB custom text settings, PPB text override aliases, and shared cart labels
