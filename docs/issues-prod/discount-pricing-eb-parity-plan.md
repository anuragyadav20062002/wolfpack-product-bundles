# Discount & Pricing - Live EB Parity Implementation Plan

**Issue ID:** eb-configure-sections-parity-1
**Status:** Ready for implementation after review
**Created:** 2026-05-25
**Revised:** 2026-05-25 17:51 IST
**Scope:** Discount & Pricing admin UI parity for Full Page Bundle (FPB) and Product Page Bundle (PPB)

## Purpose

This plan replaces the earlier draft with requirements observed directly in the live EB PPB configure flow on 2026-05-25. No implementation should rely on the superseded draft assumptions.

The live audit covered:

- All four discount types: Fixed Amount Off, Percentage Off, Fixed Bundle Price, and Buy X, get Y.
- Bundle Quantity Options enabled presentation and its multi-language modal.
- Progress Bar Simple Bar and Step-Based Bar states and its multi-language modal.
- Discount Messaging enabled, disabled, multi-language, Buy X, get Y notice, and Variables modal states.
- Multiple-rule layout and the no-rules disabled display-options state.

FPB must be visually checked against live EB before completing FPB code changes. The confirmed PPB controls are the implementation source of truth unless FPB live evidence proves a type-specific difference.

## Audit Corrections To The Draft

| Draft assumption | Confirmed live EB behavior |
| --- | --- |
| Rule header places `Remove` at the far right | `Rule #N` and red `Remove` are adjacent at the left of the rule header. |
| Fixed Bundle Price follows the threshold-field rule layout | It has only `Number of Products in Bundle` and currency-prefixed `Price`. |
| Buy X, get Y uses `All items` / `Cheapest items` apply options | It uses `The lowest priced items` and `The latest added items`. |
| Progress fields/modal use `Tier Label` | They use `Tier Text` and `Tier Subtext`. |
| Progress and BQO multi-language modals only show rule text fields | Both modals also show a `Select Language` dropdown. |
| Buy X, get Y messaging notice is shown only while messaging is enabled | The notice remains visible when Discount Messaging is disabled. |
| Simple Bar has configurable simple/success message inputs | Simple Bar shows no per-rule progress text fields; its multi-language action is disabled. |
| Discount Messaging success text may be per rule | Each rule has `Discount Text`; a single `Success Message` card appears after all rules. |

## Live Ground Truth

### Card 1: Discount Rules

| State | Required UI |
| --- | --- |
| Discount Type | Select options in this order: `Fixed Amount Off`, `Percentage Off`, `Fixed Bundle Price`, `Buy X, get Y`. |
| Rule container | Light gray rounded rule card with a subtle border. |
| Rule header | `Rule #N` immediately followed by a red `Remove` action, with no delete icon. |
| Percentage Off | Inline fields: `Discount on` (`Quantity` / `Amount`), `is greater than or equal to`, `Percentage Off` with percent suffix. |
| Fixed Amount Off | Inline fields: `Discount on` (`Quantity` / `Amount`), `is greater than or equal to`, `Fixed Amount Off` with currency prefix. For amount-based conditions, the threshold input also uses a currency prefix. |
| Fixed Bundle Price | Inline fields: `Number of Products in Bundle`, `Price` with currency prefix. It does not render `Discount on` or a threshold-label field. |
| Add rule | Full-width bordered action below the rule cards with a blue circled-plus icon and `Add rule`. |
| Type change | In the audited PPB state, selecting another discount type restored a single default rule for that type. Preserve/verify this behavior during implementation. |

### Buy X, get Y Rule

The Buy X, get Y rule is a stacked card rather than the non-BXY inline field layout.

| Sequence | Required UI |
| --- | --- |
| 1 | Subheading `Customer buys`. |
| 2 | `Minimum quantity of items` numeric input. |
| 3 | Subheading `Customer gets`. |
| 4 | `Quantity` numeric input. |
| 5 | Help text: `Customer must add the quantity of items specified above to their cart`. |
| 6 | `Discount value` numeric input. |
| 7 | `Discount type` select with `% off` and currency-off choice. |
| 8 | `Apply Discount to` select with `The lowest priced items` and `The latest added items`. |

### Card 2: Discount Display Options

| State | Required UI |
| --- | --- |
| Card heading | `Discount Display Options` and subtitle `Choose how discounts are displayed`. |
| No discount rules | Card stays present but is visually muted and its controls are inactive; `Add rule` in Card 1 remains available. |

#### Bundle Quantity Options

| State | Required UI |
| --- | --- |
| Buy X, get Y | The Bundle Quantity Options section is not rendered. |
| Non-BXY base state | Toggle `Bundle Quantity Options`, text `Configure this section to enable quantity options.`, multi-language action, and note `Note: Bundle Quantity Options can only be enabled when discount rules are based on quantity.` |
| Enabled quantity-rule state | One gray card per discount rule, with `Box Label` and `Box Subtext` inputs. |
| Default rule | Each enabled rule card has a star action labelled `Make this rule default`; the selected rule is visually filled/active. |
| Amount-rule eligibility | The live note establishes that amount-based rules are not eligible. Confirm the disabled interaction in the implementation verification pass before sign-off. |

#### Progress Bar

| State | Required UI |
| --- | --- |
| Section | Toggle `Progress Bar`, text `Edit the progress bar content and settings.`, radio options `Simple Bar` and `Step-Based Bar`, and multi-language action. |
| Simple Bar | No per-rule tier text cards are rendered; multi-language action is disabled. |
| Step-Based Bar | One gray card per discount rule with `Tier Text` and `Tier Subtext`. |
| Buy X, get Y Step-Based Bar defaults | Audited initial values: `Add 3` and `1 Product(s) @ 100% off` for the default rule. |

#### Discount Messaging

| State | Required UI |
| --- | --- |
| Section | Toggle `Discount Messaging`, inline checkbox `Enable multi-language`, text `Edit how discount messages appear above the subtotal.`, and `Show Variables`. |
| Messaging off | Message text inputs are hidden and the multi-language checkbox is disabled. |
| Multi-language off while messaging on | Message text inputs remain; language selector and active-language display are hidden. |
| Multi-language on | Language selector and `Active languages` display appear above message cards. |
| Rule content | One gray `Rule #N` card containing `Discount Text` for each rule. |
| Shared content | One gray `Success Message` card after all rule cards, not one per rule. |
| Buy X, get Y notice | Show this notice whenever the selected type is Buy X, get Y, including when messaging is off: `Discount messaging displays the Total Quantity to Claim Offer (Buy + Get) to ensure customers add their rewards to the cart`. |

## Modal Contract

### Bundle Quantity Options - Multi Language

| Element | Required UI |
| --- | --- |
| Title | `Customize Text for Multiple Languages` |
| Top control | `Select Language` dropdown |
| Per rule | `Rule #N`, `Box Label`, `Box Subtext` |
| Footer action | `Save and close` |

### Progress Bar - Multi Language

| Element | Required UI |
| --- | --- |
| Title | `Customize Text for Multiple Languages` |
| Top control | `Select Language` dropdown |
| Per rule | `Rule #N`, `Tier Text`, `Tier Subtext` |
| Footer action | `Save and close` |

### Discount Messaging - Variables

The modal is titled `Variables`, has a close action, and does not show a save/footer action.

| Explanation | Token |
| --- | --- |
| Remaining quantity or monetary amount needed to unlock the discount | `{{discountConditionDiff}}` |
| Symbol for the discount requirement, such as store currency for amount rules | `{{discountUnit}}` |
| Numerical discount reward value | `{{discountValue}}` |
| Reward symbol, such as percent or store currency | `{{discountValueUnit}}` |
| Quantity discounted or free in a Buy X, get Y offer | `{{discountedItems}}` |

## Implementation Constraints

1. Use Polaris web components for embedded admin controls wherever the existing component supports the live behavior. Do not introduce raw button/input JSX solely to imitate the screenshot.
2. Keep changes within Discount & Pricing presentation and its existing form-state wiring. Do not change schema, storefront widget behavior, or serialized payload shape unless inspection proves the current implementation cannot represent the live UI; if that occurs, stop and log the expanded blast radius before editing.
3. Do not add compatibility fallbacks or new merchant-facing copy. Use only strings observed live or already defined for this feature.
4. Do not commit Chrome audit artifacts.
5. No relevant `How to setup` or `Learn More` link was visible in the audited Discount & Pricing surface. Recheck the section once at implementation start; if a link appears, read and document it before code changes.

## Expected Files

Inspect first and edit only when required by an identified gap:

| File area | Intended change |
| --- | --- |
| FPB configure route/components | Rule and display-option structure/copy parity. |
| PPB configure route/components | Mirror confirmed behavior and maintain consistent state wiring. |
| Existing Discount & Pricing CSS modules/styles | Measured spacing, border, muted, and action styling only where missing. |
| Existing pricing UI tests/spec | Assertions for the live-rendered states changed by the implementation. |

Not in scope without a documented contract failure: storefront widget assets, SDK assets, Prisma schema, metafield writers, cart transform, or new routes.

## Implementation Phases

### Phase 0 - Pre-Implementation Baseline

- Re-open the live EB Discount & Pricing section for the bundle type being changed.
- Recheck for Discount & Pricing help links.
- Capture an FPB reference state before editing FPB, because the detailed correction audit used PPB.
- Inspect current WPB FPB and PPB implementation and tests against the tables above.
- Update `test-spec/discount-pricing-parity.spec.md` before code where rendered behavior requires new or corrected assertions.

**Exit contract:** Every intended code change maps to a confirmed live gap and a test or explicit visual-verification state.

### Phase 1 - Shared Visual Foundation

- Add or adjust only the styling needed for rule cards, full-width `Add rule`, adjacent header actions, disabled/muted display options, and gray content cards.
- Retain Polaris components and existing styling ownership.

**Verify:** Compare card borders, radii, spacing, heading/action alignment, and disabled opacity against live EB at matching viewport width.

### Phase 2 - Rule Types

- Correct Percentage Off and Fixed Amount Off field order and unit adornments.
- Correct Fixed Bundle Price to the two-field `Number of Products in Bundle` / `Price` layout.
- Correct Buy X, get Y stacked labels, help copy, discount type options, and apply-to options.
- Preserve/verify type-change default-rule behavior.

**Verify:** Render each type in FPB and PPB; confirm label order, adornments, options, and initial visible rule state.

### Phase 3 - Rule Collection And Disabled State

- Align rule header presentation and removal behavior.
- Align full-width `Add rule` presentation and add/remove transitions.
- Render the muted, inactive Discount Display Options state when no rules remain.

**Verify:** Multiple rules, removing a middle/last rule, zero-rule state, and adding a new rule back.

### Phase 4 - Bundle Quantity Options

- Hide the section entirely for Buy X, get Y.
- Render the note and eligibility behavior for non-BXY rules.
- Align enabled per-rule `Box Label`, `Box Subtext`, and default-rule star action.

**Verify:** Quantity-rule enabled state, selected default rule, amount-rule disabled eligibility, and absence for Buy X, get Y.

### Phase 5 - Progress Bar

- Align Simple Bar and Step-Based Bar selection behavior.
- Ensure Simple Bar hides rule tier fields and disables multi-language.
- Ensure Step-Based Bar renders `Tier Text` and `Tier Subtext` per rule.

**Verify:** Simple/Step-Based Bar toggle, multiple-rule cards, Buy X, get Y initial Step-Based Bar content, and enable/disable interactions.

### Phase 6 - Discount Messaging

- Align enabled, disabled, and multi-language states.
- Render one `Discount Text` per rule and one final shared `Success Message`.
- Keep the Buy X, get Y notice visible based on discount type, independent of messaging toggle.

**Verify:** Messaging off/on, multi-language off/on, two-rule layout, all four discount types, and Buy X, get Y with messaging off.

### Phase 7 - Modals

- Align both multi-language modals to the confirmed language selector, field labels, and `Save and close` action.
- Align Variables modal content and close-only behavior.

**Verify:** Open/close each modal via keyboard and pointer, inspect labels in the accessibility snapshot, and confirm no unintended save action in Variables.

### Phase 8 - FPB And PPB Cross-Check

- Apply the confirmed behavior to both bundle configure surfaces.
- Compare FPB and PPB against live EB state-by-state; document any live bundle-type difference before preserving it.

**Verify:** Identical contract coverage for both route surfaces, except an explicitly documented live difference.

### Phase 9 - Verification, Issue Log, And Commit

- Run focused tests defined by the updated test spec.
- Run ESLint on modified code files with `npx eslint --max-warnings 9999 <files>`.
- If code files are modified, rebuild the graph and inspect generated changes according to repository rules.
- Update `docs/issues-prod/eb-configure-sections-parity-1.md` with completed changes and verification before committing.
- Commit only scoped source, test, and issue-document changes with an `[eb-configure-sections-parity-1]` prefix; exclude audit screenshots and transient artifacts.

## Acceptance Checklist

- [ ] Live FPB baseline captured before FPB implementation.
- [ ] Rule headers, rule layouts, type options, and type-change behavior match live EB.
- [ ] Fixed Bundle Price and Buy X, get Y use their confirmed distinct field structures.
- [ ] Discount Display Options muted state matches live EB when there are no rules.
- [ ] Bundle Quantity Options rendering, eligibility, rule cards, and modal match live EB.
- [ ] Progress Bar Simple Bar and Step-Based Bar states and modal match live EB.
- [ ] Discount Messaging states, shared success field, Buy X, get Y notice, and Variables modal match live EB.
- [ ] Both FPB and PPB have been verified for the affected states.
- [ ] Focused tests and ESLint pass for modified code.
- [ ] Issue log is updated before any commit and audit artifacts are excluded.
