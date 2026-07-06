# Test Spec: Dashboard Language Selector Update Depth
**Spec ID:** dashboard-language-selector-depth  **Created:** 2026-07-06

## Purpose
Prevent the Dashboard language selector from repeatedly applying the same saved locale response, which can trigger React's maximum update depth guard during i18n and URL synchronization.

## Test Cases
### DashboardLocaleState
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | First saved locale response | `responseLocale=fr`, `lastApplied=null` | apply response | Allows real language change |
| 2 | Replayed saved locale response | `responseLocale=fr`, `lastApplied=fr` | skip response | Prevents repeated `changeLanguage` / URL updates |
| 3 | Different saved locale response | `responseLocale=de`, `lastApplied=fr` | apply response | Allows later language changes |
| 4 | URL already has locale | `?locale=fr`, locale `fr` | no update | Avoids no-op navigation |
| 5 | URL missing or different locale | `?page=2`, locale `fr` | new params with `locale=fr` | Keeps current dashboard state params |

## Acceptance Criteria
- [ ] Focused locale helper tests pass.
- [ ] Dashboard language save response is applied once per saved locale response.
- [ ] Dashboard URL locale sync does not navigate when already current.
- [ ] Language selector still persists through `saveAdminLocale`.
