# Test Spec: Embedded Admin UI Internationalisation
**Spec ID:** admin-ui-i18n  **Issue:** [admin-ui-i18n-1]  **Created:** 2026-06-02

## Purpose

Verify that the embedded Admin locale is shop-wide, defaults to English, exposes only Polaris-compatible locales, persists only through an explicit dashboard save action, and updates browser cache only after server confirmation. Also verify that supported locale catalogs remain key-compatible.

## Test Cases

### Locale Configuration
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Supported locales | config import | `en`, `fr`, `de`, `es`, `ja`, `pt-BR` | Polaris-compatible list |
| 2 | Supported locale normalization | `"fr"` | `"fr"` | Valid locale preserved |
| 3 | Unsupported locale normalization | `"xx"` | `"en"` | English fallback |
| 4 | Catalog parity | all locale JSON files | identical flattened key sets | No missing translations |

### Dashboard Save Contract
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 6 | Valid locale save | `intent=saveAdminLocale`, `locale=fr` | `Shop.adminLocale` updated to `fr` | Shop-wide record |
| 7 | Invalid locale save | `intent=saveAdminLocale`, `locale=xx` | HTTP 400; DB untouched | Fail closed |
| 8 | Dropdown change before save | select `hi` | no `localStorage.setItem` | Draft only |
| 9 | Successful save response | confirmed `fr` | cache, URL, and active i18n locale update | Cache after DB only |
| 10 | Failed save response | error | cache and active locale unchanged | No optimistic cache |

### App Shell Resolution
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 11 | Shop preference exists | `Shop.adminLocale=fr` | loader locale `fr` | DB authoritative |
| 12 | Shop preference missing | `Shop.adminLocale=null` | loader locale `en` | English default |
| 13 | Saved preference unsupported | `Shop.adminLocale=xx` | loader locale `en` | Defensive fallback |

### Admin Copy Extraction
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 14 | Catalog key validation | Admin translation catalogs | every supported catalog contains every English key | Required after each extraction batch |
| 15 | Storefront exclusion | widget sources | unchanged | Admin-only feature |
| 16 | Shared Admin copy extraction | shared Admin banners and configure modals | merchant-facing copy resolves through translation keys | Shared component batch |
| 17 | Create-bundle wizard extraction | `/app/bundles/create` | wizard chrome, fields, validation, and actions resolve through translation keys | Top-level route batch |
| 18 | Billing feedback extraction | billing feedback banners and upgrade modal | feedback copy resolves through translation keys | Billing leaf batch |
| 19 | Billing plan-card extraction | Free/Grow cards and upgrade CTA | plan-card chrome resolves through translation keys | Billing card batch |
| 20 | Billing route extraction | `/app/billing` | plan status, usage, cancellation, feature, and support copy resolves through translation keys | Billing route batch |

## Acceptance Criteria

- [ ] All listed tests pass
- [ ] `Shop.adminLocale` is nullable and defaults to English through application logic
- [ ] Every selectable language has a Polaris locale resource
- [ ] Browser cache writes occur only after successful locale save
- [ ] No storefront widget source files are modified
