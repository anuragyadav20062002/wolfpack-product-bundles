# Test Spec: Settings Design EB Parity
**Spec ID:** settings-design-eb-parity  **Issue:** [eb-settings-design-parity-1]  **Created:** 2026-06-04

## Purpose

Pin the Settings -> Design mapper against the observed Easy Bundles pageCustomization contract before wiring Wolfpack saves and CSS output.

## Test Cases

### buildSettingsDesignRuntime

| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Brand colors fan out when expert controls are disabled | Primary, button text, primary text, secondary, and background colors | `pageCustomization` updates product card, navigation, category, cart, summary, landing page, and PPB `mixAndMatchConfig` target paths | Mirrors EB chunk `8587` mapping |
| 2 | `stylePresets` stores full design state | Color, typography, corners, images, expert toggle | `stylePresets.colors`, `stylePresets.typography`, `stylePresets.corners`, `stylePresets.images`, `isExpertControlsEnabled` are complete | Required by EB Admin read/edit behavior |
| 3 | Typography maps labels and storefront numeric columns | Primary/secondary/body font size and weight | PageCustomization font paths receive `px` strings; DB runtime fields receive numeric sizes and weights | `Bold -> 700`, `Regular -> 400` |
| 4 | Button and card/cart radius logic follows EB | Sharp/Base/Round and base px values | Button radius paths use `0px`, `{base}px`, or `40px`; card image radius is `max(2, base - 2)` | Product card/cart supports Sharp/Base only in EB UI |
| 5 | Image fit maps to FPB and PPB paths | Cover/Contain/Fill | `productCard.productImageFit`, `mixAndMatchConfig.productCard.productCardImageFit`, and runtime direct column are lowercase | CSS should emit same object-fit value |
| 6 | Expert controls override component fields | Expert general/product/cart/upsell values | Expert targets replace brand fan-out values while `stylePresets` keeps brand colors | Expert toggle gates Brand Colors UI, not persisted brand state |
| 7 | Runtime update is usable for both bundle types | Any design payload | Save action can upsert identical runtime payload into `product_page` and `full_page` rows | EB behavior is store-level |

### generateCSSVariables

| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | PPB EB direct variable aliases are emitted | Design settings containing mapped fields | CSS contains `--product-card-*`, `--tabs-*`, `--footer-*`, and empty-state aliases | Required for PPB template parity |
| 2 | PPB consolidated bridge is emitted | Same settings | CSS contains `body[wpb-mix-consolidated-design="true"]` bridge to `--wpbMix-*` vars | EB sets this body attr on current PPB templates |
| 3 | PDP_INPAGE font adjustment is emitted | Same settings | CSS includes `calc(... - 2px)` rules for `body[wpbmix-template-type="PDP_INPAGE"]` | EB Product List/Grid behavior |

## Acceptance Criteria

- [ ] Tests fail before the mapper/CSS changes.
- [ ] Tests pass after implementation.
- [ ] Save action writes design runtime to both `product_page` and `full_page` rows.
- [ ] Chrome e2e confirms Admin save affects both FPB and PPB storefront variables.
