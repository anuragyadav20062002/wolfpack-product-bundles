# Product Requirements: Discount Pricing Display Options

**Issue ID:** discount-pricing-display-options-1
**Stage:** PO
**Created:** 2026-05-11

## Acceptance Criteria

- Given a bundle has quantity discount rules, when Bundle Quantity Options is enabled,
  the edit UI shows one option row per quantity rule.
- Given multiple quantity rules exist, the merchant can click `Make this rule default` on
  one rule and only that rule is marked default.
- Given the saved default rule no longer exists, the normalizer selects the first valid
  quantity rule as the default.
- Given a discount rule is amount-based, it is not rendered as a bundle quantity option.
- Given a quantity option is tied to steps that cannot satisfy the threshold, the UI can
  surface compatibility metadata instead of silently treating the option as valid.
- Given Progress Bar is enabled, the merchant can choose Simple Bar or Step-Based Bar.
- Given Step-Based Bar is selected, milestones are derived from pricing rules and must
  respect applicable rule/step conditions.
- Given Discount Messaging is enabled, the existing per-rule discount/success messages are
  preserved and edited from the Discount Display Options area.
- Given tooltip help is needed, the implementation uses Polaris `s-tooltip` before custom
  CSS.

## UX Rules

- The main card remains compact until the merchant enables or expands a display option.
- Bundle Quantity Options appears above Progress Bar in Discount Display Options.
- The default rule action uses the explicit label `Make this rule default`.
- The selected default rule should have a clear selected/pressed state.
- Dense explanations should use tooltip affordances, not long visible paragraphs.

## Open Product Questions

- Whether `Show footer` belongs in Advanced Display Options or Bundle Settings.
- Exact text fields for Progress Bar content beyond the initial EB-inspired bar type.
- Whether quantity option compatibility warnings block save or warn only.
