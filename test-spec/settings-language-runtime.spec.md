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

## Acceptance Criteria
- [ ] All listed test cases pass
- [ ] Runtime response exposes full language document, FPB active locale, PPB custom text settings, and shared cart labels
