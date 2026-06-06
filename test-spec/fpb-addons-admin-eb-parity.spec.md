# Test Spec: FPB Add-ons Admin EB Parity
**Spec ID:** fpb-addons-admin-eb-parity  **Issue:** [fpb-addons-admin-eb-parity-1]  **Created:** 2026-06-05

## Purpose
Prove the Full Page Bundle Free Gift & Add Ons Admin section uses EB's visible control model and wires every editable control into explicit SaveBar save/discard behavior.

## Test Cases
### Admin Layout Contract
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Add-ons section exposes EB card markers | Route and CSS sources | Source contains EB-style shell markers for step card, add-ons card, tier card, selected products row, discount grid, tier rules, add-tier button, and footer messaging card | Custom components allowed |
| 2 | Add-ons help action stays wired | Route source | `How to setup?` opens the configured setup URL and route source contains no competitor-domain references | EB help-link evidence is documented, not embedded in app code |
| 3 | Add-ons control order matches EB | Route source | `Add-Ons with Bundles` appears before description/title, tier card fields precede footer messaging, and selected-products row appears after Add Products | Source order guard |

### SaveBar Wiring
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Add-ons draft controls dirty page | Route source | Toggle, image picker, step name/title, add-ons title, tier fields, product picker, variants toggle, discount basis/value, tier rules, and add-tier use `updateAddonDraft` or `markAsDirty` | SaveBar opens |
| 2 | Footer messaging controls dirty page | Route source | Both `setRuleMessages` paths in Add-ons footer call `markAsDirty()` | Regression for silent unsaved changes |
| 3 | Save/discard baseline covers Add-ons | Route source | Save success updates `originalAddonDraftRef`; discard restores `addonDraft`; Add-ons messages stay in original rule message baselines | Existing SaveBar model preserved |

### Runtime Contract
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Save serializes direct Add-ons personalization | Handler/unit test | `personalizationData.addonProducts` persists title, tiers, products, eligibility, discount, variants display, and footer messaging | Existing direct contract |
| 2 | Storefront reflects saved Add-ons | Chrome Admin save + preview | Storefront shows the saved Add-ons title/message/product behavior and cart payload carries selected add-on line metadata | E2E proof |

## Acceptance Criteria
- [x] RED tests fail before production edits for missing/incorrect EB parity markers.
- [x] Focused unit tests pass after implementation.
- [x] Chrome verifies SaveBar appears for toggles, text fields, selects, tier buttons, and footer message fields.
- [x] Chrome verifies Admin save reflects on storefront and cart behavior.
- [x] Widget build/minify run only if storefront source/assets change.
- [x] No autonomous Shopify deploy.
