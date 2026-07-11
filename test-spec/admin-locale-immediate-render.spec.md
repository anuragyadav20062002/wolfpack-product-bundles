# Test Spec: Admin Locale Immediate Render
**Spec ID:** admin-locale-immediate-render  **Created:** 2026-07-11

## Purpose
Render translated embedded Admin UI immediately when the merchant changes the dashboard language selector, without waiting for navigation or reload.

## Test Cases
### DashboardLocaleState
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Select a different supported locale | `locale=fr`, active `en` | selected state updates, i18n switches to `fr`, save intent submits | Immediate render path |
| 2 | Select current locale | `locale=en`, active `en` | selected state updates, no i18n switch, no save submit | No duplicate work |
| 3 | Select unsupported locale | `locale=xx`, active `fr` | normalizes to `en` before state/switch/save | Existing normalization contract |

## Acceptance Criteria
- [ ] Dashboard language selector calls the immediate i18n switch helper before persistence completes
- [ ] Browser cache is still written only after the save response confirms the locale
- [ ] Focused unit tests pass
