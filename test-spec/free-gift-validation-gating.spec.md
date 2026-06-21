# Test Spec: FPB Free-Gift Validation Gating
**Spec ID:** free-gift-validation-gating  **Created:** 2026-06-21

## Purpose
Lock down two storefront FPB widget behaviors regressed by the Free-Gift / Add-Ons feature:

1. **`bundleHasNoConditions()`** must treat a configured addon-tier rule on the
   free-gift step as a condition. Otherwise the footer/sidebar CTA is rendered
   as "Add to Cart" on a non-last paid step (current bug — merchant report
   from Loom https://www.loom.com/share/5af3ea258fab462ba5216723d40ec89b).
2. **`canProceedToNextStep()`** must refuse to advance into a free-gift step
   whose `addonEligibilityCondition` / `addonTiers[0].eligibilityCondition`
   threshold is not met, regardless of whether the current step's own
   step-level condition is satisfied.

These two together make the storefront flow match the merchant-configured
gate: shopper sees "Next" on the paid step, presses it, gets validated, and
only reaches the free-gift step when their bundle quantity / value clears
the addon threshold.

## Test Cases

### `bundleHasNoConditions` (validation-addons-methods.js)
| # | Scenario | Input | Expected | Notes |
|---|----------|-------|----------|-------|
| 1 | Truly empty bundle (no steps) | `steps: []` | `false` | Guard; existing behavior. |
| 2 | Single paid step with no conditionType | `[{conditionType: null}]` | `true` | Conditionless legacy path. |
| 3 | Paid step + free-gift step with no addon rule | `[{cond}, {isFreeGift:true}]` | `true` | Free gift carries no rule → still conditionless. |
| 4 | Paid step + free-gift step with `addonEligibilityCondition.value > 0` | `[{}, {isFreeGift:true, addonEligibilityCondition:{type:'QUANTITY', value:1}}]` | **`false`** | **Regression fix.** Addon rule counts as a condition. |
| 5 | Paid step + free-gift step with `addonTiers[0].eligibilityCondition.value > 0` | `[{}, {isFreeGift:true, addonTiers:[{eligibilityCondition:{type:'QUANTITY', value:1}, selectedAddonProducts:[]}]}]` | **`false`** | **Regression fix.** Tier-array variant. |
| 6 | Free-gift step with `addonTiers[0].selectedAddonProducts.length > 0` but no eligibility value | `[{}, {isFreeGift:true, addonTiers:[{eligibilityCondition:{value:0}, selectedAddonProducts:[{id:'p'}]}]}]` | **`false`** | Having addon products is itself an intent — gate the flow. |
| 7 | Paid step with `conditionType: 'BUNDLE_QUANTITY'` set | `[{conditionType:'BUNDLE_QUANTITY', conditionValue:3}]` | `false` | Existing behavior; should stay green. |
| 8 | Default step + paid step with no conditions + free-gift with no rule | `[{isDefault:true}, {}, {isFreeGift:true}]` | `true` | Default-only path unchanged. |

### `canProceedToNextStep` (validation-addons-methods.js)
| # | Scenario | Input | Expected | Notes |
|---|----------|-------|----------|-------|
| 9 | Current step is paid step, completed, free-gift NOT unlocked | currentStepIndex 0; paid step satisfied; addon threshold not met | **`false`** | **Bug fix.** Must check `isFreeGiftUnlocked` before allowing advance into a free-gift next step. |
| 10 | Current step is paid step, completed, free-gift unlocked | currentStepIndex 0; paid step satisfied; addon threshold met | `true` | Happy path. |
| 11 | Current step is paid step, NOT completed | currentStepIndex 0; paid step under min | `false` | Existing behavior; should stay green. |
| 12 | Current step is the free-gift step itself | currentStepIndex = freeGiftStepIndex | `true` if step condition satisfied (free-gift has no own condition → always true) | Last step; ATC path takes over. |
| 13 | Bundle has no free-gift step, regular flow | only paid steps | delegates to `isStepCompleted` | Existing behavior. |

## Acceptance Criteria
- [ ] All listed test cases pass.
- [ ] No existing tests in `tests/unit/assets/bundle-widget-free-gift.test.ts` regress.
- [ ] `npm run lint -- app/assets/widgets/full-page/methods/validation-addons-methods.js` is clean.
- [ ] `WIDGET_VERSION` bumped (patch) and `npm run build:widgets` succeeds.
- [ ] `node --check` on raw widget JS passes.
