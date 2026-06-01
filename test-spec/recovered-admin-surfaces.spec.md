# Test Spec: Recovered Admin Surfaces
**Spec ID:** recovered-admin-surfaces  **Issue:** [eb-replication-recovery-1]  **Created:** 2026-06-01

## Purpose
Lock the recovered Settings and Integrations Admin contracts so route UI stays aligned with the deployed-bundle evidence captured in the research document.

## Test Cases
### RecoveredAdminSurfaces
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Settings landing card order | Settings surface config | Design, Language, Controls | Matches captured Settings landing |
| 2 | Language configuration support | Language panel config | Multilanguage enabled, English selected, supported language list includes captured values | Prevents flattening the language model |
| 3 | Controls layout split | Controls panel config | Landing Page Layout and Product Page Layout both exist | Prevents merging distinct EB branches |
| 4 | Integrations categories | Integration config | Five categories and ten integration cards | Matches captured hub inventory |
| 5 | Setup actions | Integration config | Zapiet is chat-based; other cards expose internal guide summaries | Avoids external competitor URLs in code |
| 6 | Detailed Settings fields | Settings detail config | Design tabs, shared language fields, template sections, controls tabs, and per-layout control fields are present | Moves route beyond summary-only parity |
| 7 | Request Integration flow | Integrations route source | Request Integration reveals sanitized request guidance and does not route to unrelated app events | Captured deployed bundle behavior is request/chat-backed |
| 8 | Integrations logos | Integration config and route source | Cards render captured public vendor logo images with text fallback | Captured from live Integrations Hub snapshot |
| 9 | Integrations CTA type behavior | Integrations route source | Card details distinguish `chat` setup outcomes from standard setup guides while keeping visible CTA labels as `View Setup` | Captured from deployed Integrations bundle behavior |

## Acceptance Criteria
- [ ] All listed test cases pass.
- [ ] Settings and Integrations routes render from the shared recovered Admin surface contract.
- [ ] No sensitive token values or external competitor URLs are present in route source.

### SettingsLandingCardOnly
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Settings landing is card-only | app.settings.tsx source | Route maps SETTINGS_CARDS and does not reference SETTINGS_PANELS, activePanel, or DESIGN_CONFIGURATION | Prevents non-EB inline panels returning to landing |
| 2 | Configure actions route to dedicated screens | app.settings.tsx source | Design navigates to DCP; Language and Controls open dedicated views | Matches EB card landing behavior |

### SettingsControlsBundleDefaults
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Product Card language defaults | Shared Settings contract | Clear Selection, Search, Add To Box, Choose Options, Load More Products, and Loading Checkout defaults exist | Captured from deployed Settings bundle |
| 2 | Controls configuration labels | Shared Settings contract | Configuration tab includes Bundle Settings, Show Compare At Price, cart messaging, discount format, checkout, script, and font settings | Captured from deployed Settings bundle and live Controls UI |
| 3 | Route contract source | app.settings.tsx source | Route imports CONTROL_LAYOUTS and does not reference the stale CONTROLS_CONFIGURATION symbol | Prevents broken route/data contract drift |
| 4 | Controls content headings | app.settings.tsx source | Route renders `contentTitle` and `contentDescription` from the active Controls tab | Keeps tab labels separate from live EB content headings |
| 5 | Product Page Layout controls | Shared Settings contract | Product Page Layout exposes only Configuration and CSS & Scripts with product-page-specific bundle settings, redirect settings, CSS, custom script, and selector fields | Captured from live Product Page Layout Additional Configurations evidence |
| 6 | Layout selector behavior | app.settings.tsx source | Additional Configurations uses a single layout selector instead of rendering layout choices as tabs | Captured from live Settings Controls layout selector evidence |
| 7 | CSS and JavaScript grouping | Shared Settings contract and app.settings.tsx source | CSS & Scripts fields render under `CSS` and `JavaScript & Selectors` groups instead of one flat grid | Captured from live Additional Configurations CSS & Scripts evidence |
| 8 | Integrations grouping | Shared Settings contract and app.settings.tsx source | Integrations fields render under theme script, cart integration, and Judge.me groups instead of one flat grid | Captured from live Additional Configurations Integrations evidence |
| 9 | Advanced video player settings | Shared Settings contract | Advanced tab renders `Video Player Page Settings` with Logo, Background Color, Upload file, and Update Image grouped under that section | Captured from live Additional Configurations Advanced evidence |
| 10 | Configuration grouping | Shared Settings contract | Landing Configuration groups Bundle Settings, Cart Messaging, Checkout Settings, and Font Settings; Product Page Configuration groups Bundle Settings, Cart Messaging, and Redirect Settings | Captured from live Additional Configurations Configuration evidence |

### SettingsLanguageSectionCopy
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Language section descriptions | app.settings.tsx source | Shared Components and Template Language descriptions match captured EB copy | Captured from live Settings Language Configurations evidence |
| 2 | Shared Components action | app.settings.tsx source | Shared Components renders visible `Cart & Checkout` action/chip | Captured from live Settings Language Configurations evidence |
| 3 | Product Card language hierarchy | app.settings.tsx source | Template Language renders Product Card context before Button Configuration with `Product card button text and action labels` description | Captured from live Settings Language Configurations evidence |

### ProductPageBundleEmbedCopy
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Bundle Embed setup copy | PPB configure route source | Heading, exact description, custom-location title, `Place app block on the theme`, and `Place Block` action exist | Captured from live PPB Bundle Embed evidence |
| 2 | Bundle Embed multilingual action | PPB configure route source | `Multi Language` renders as visible action text before Title and Sub Title fields | Captured from live PPB Bundle Embed evidence |
| 3 | Bundle Embed defaults and save shape | PPB configure route source | Title falls back to `Build Your Bundle & Save More` and save payload writes `upsellConfiguration.title`, `subTitle`, display configuration, and browsed-product default flag | Captured from PPB Bundle Embed UI and deployed bundle payload model |

### FullPageBundleWidgetMultilanguageGate
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Widget multilingual unavailable | FPB configure route source | Bundle Widget Multi Language action is disabled when `shopLocales.length === 0` | Captured from live FPB Bundle Widget evidence |

### FullPageBundleWidgetButtonTextDefault
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Widget button text without saved value | FPB configure route source | Widget Button Text falls back to `Save More With Bundle` while preserving saved config and text overrides | Captured from live FPB Bundle Widget evidence |

### ProductPageBundleWidgetDefaultMode
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Widget display mode without saved value | PPB configure route source | `upsellWidgetDisplayMode` falls back to `block` for state and original ref | Captured from live PPB Bundle Widget evidence where Offer Upsell Block was selected |

### ProductPageBundleSubscriptionsSetupGuide
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Subscriptions setup action | PPB configure route source | `How to setup?` toggles sanitized setup guidance and preserves `Get Subscription Plans` flow | Captured from live PPB Subscriptions UI and setup article evidence |
| 2 | Subscriptions discount gating | PPB configure route source | Section warns that subscriptions cannot be enabled on Buy X, Get Y discounts and recommends a different discount type | Captured from live PPB Subscriptions evidence |
| 3 | Setup rail reachability | PPB configure route source | Route uses the recovered setup rail list, exposes Bundle Widget and Bundle Embed children, and renders Subscriptions as an active section | Captured from live PPB setup rail evidence |

### BundleVisibilityQuickGuideContract
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Publishing quick guides | FPB and PPB configure route source | Visibility cards render Quick Setup Guide and 5 min setup with sanitized in-app guide details for hero, navigation, announcement, and featured product placements | Captured from Bundle Visibility quick-guide article evidence |
| 2 | PPB Widget and Embed overview copy | PPB configure route source | Bundle Visibility overview cards use the captured Widget and Embed descriptions instead of generic placeholder copy | Captured from PPB Bundle Widget and Bundle Embed section evidence |
| 3 | FPB Widget overview copy | FPB configure route source | Bundle Visibility `Want more placement options` card uses the captured upsell block/button description instead of generic bundle-button copy | Captured from FPB Bundle Widget section evidence |

### SelectTemplateModalContract
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Modal shell and actions | FPB and PPB configure route source | `Customization`, `Customize your bundle`, `Customize Colors & Language`, Selected/Select state, and `Next` action exist | Captured from Select template overlay evidence |
| 2 | Template inventory | FPB and PPB configure route source | FPB has Standard, Classic, Compact, Horizontal; PPB has Product List, Horizontal Slots, Product Grid, Vertical Slots in captured order | Captured from FPB and PPB Select template overlay evidence |
| 3 | Post-Next bundle-ready state | FPB and PPB configure route source | `View your bundle`, `View your bundle with your customizations`, `Your bundle is ready`, `Preview it now with your customizations`, and `Preview bundle` exist | Captured from live FPB Select template post-Next overlay evidence |
| 4 | Customization tab flow | FPB and PPB configure route source | Templates, Colors and corners, Text and images, Back, Next, and Done states exist before the ready screen | Captured from deployed Select Template modal bundle evidence |

### ProductPageBundleSettingsSurfaceContract
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | PPB Bundle Settings sections | PPB configure route source | Pre Selected Product, Quantity Validation, Pre-order & Subscription Integration, Cart line item discount display, Bundle Level CSS, and Bundle Status exist | Captured from PPB Bundle Settings evidence |
| 2 | PPB excludes FPB-only cart labels | PPB configure route source | Bundle Cart Title and Bundle Cart Subtitle are absent from PPB Bundle Settings | Captured PPB evidence explicitly excludes those fields |

### FullPageBundleSettingsSurfaceContract
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | FPB Bundle Settings sections | FPB configure route source | Pre Selected Product, Quantity Validation, Product Slots, Slot Icon, Variant Selector, Show Text on + Button, Bundle Cart title/subtitle, cart line item discount display, Bundle Banner, Bundle Level CSS, and Bundle Status exist | Captured from FPB Bundle Settings evidence |
| 2 | FPB banner recommendations | FPB configure route source | Desktop and mobile banner recommendations include `1900x230` and `1100x500` | Captured from FPB Bundle Settings evidence |
| 3 | FPB excludes non-EB display controls | FPB configure route source | Show product prices, Show compare-at prices, and Allow quantity changes are absent from FPB Bundle Settings | Captured FPB evidence explicitly excludes those fields |
