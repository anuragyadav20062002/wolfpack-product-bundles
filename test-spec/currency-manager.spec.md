# Test Spec: currency-manager
**Spec ID:** currency-manager  **Created:** 2026-06-15

## Purpose
Validate storefront currency format normalization now replaces market-supplied currency codes with local symbols while preserving placeholder shape and keeps fallback behavior stable.

## Test Cases
### normalizeCurrencyFormat
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Replace three-letter code with mapped symbol and preserve comma placeholder | format:`PKR {{amount_with_comma_separator}}`, code:`PKR`, symbol:`Rs.` | `Rs. {{amount_with_comma_separator}}` | Covers PKR-style bug path |
| 2 | Replace legacy basic code format | format:`USD {{amount}}`, code:`USD`, symbol:`$` | `$ {{amount}}` | Ensures common code format is normalized |
| 3 | No-op when symbol matches code | format:`AED {{amount}}`, code:`AED`, symbol:`AED` | `AED {{amount}}` | Preserves explicit symbol-less mappings |
| 4 | Fallback when format is missing | format:`null`, code:`PKR`, symbol:`Rs.` | `Rs.{{amount}}` | Preserves default placeholder fallback |

## Acceptance Criteria
- [ ] `normalizeCurrencyFormat` replaces code with symbol for code-based formats
- [ ] Placeholder style (`{{amount}}` vs `{{amount_with_comma_separator}}`) is preserved
- [ ] Symbol-equals-code inputs are preserved unchanged
- [ ] Missing format returns `<symbol>{{amount}}`
