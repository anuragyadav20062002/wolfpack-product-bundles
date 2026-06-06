# Edit Bundle Discount & Pricing: Image 2 Control Map

**Issue ID:** edit-bundle-ui-redesign-1
**Status:** Draft for discussion
**Last Updated:** 2026-05-11 20:31

## Direction

The Discount & Pricing edit section should follow the supplied design image while
preserving existing merchant controls that are still needed for the storefront widget and
cart transform.

Implementation constraints:

- Use Polaris web components (`s-*`) where available.
- Keep custom CSS limited to layout or visual gaps that Polaris web components do not cover.
- Use App Bridge Save Bar for dirty edit state; do not implement the Back/Next footer shown
  in the image.
- All pricing controls should read/write through the future canonical bundle editor state
  hook, not route-local pricing state.
- Bundle Quantity Options and Progress Bar Options are required and must integrate with
  existing step conditions and discount conditions.

## Chrome DevTools Status

Verified current Wolfpack route:

- Embedded Admin URL:
  `/app/bundles/full-page-bundle/configure/cmp0dksyu0000v0g5gd15wcjn`
- Section clicked: `Discount & Pricing`
- Screenshot:
  `docs/app-nav-map/screenshots/edit-discount-pricing-current-20260511.png`

Verified Easy Bundles reference:

- Shopify Admin page 2: `EB | Easy Bundle Builder`
- Section clicked: `Discount & Pricing`
- Screenshot:
  `docs/app-nav-map/screenshots/easy-bundles-discount-pricing-20260511.png`
- Hover investigation screenshot:
  `docs/app-nav-map/screenshots/easy-bundles-tooltip-hover-quantity-options-20260511.png`

Tooltip implementation references:

- Shopify Polaris Web Components docs:
  `https://shopify.dev/docs/api/polaris/using-polaris-web-components`
- Installed Polaris Admin component types confirm `s-tooltip` exists and that its default
  slot accepts text, paragraph components, and raw text content.

## Target Layout From Image 2

The Discount & Pricing image shows:

- Header row:
  - Back arrow.
  - Page title: `Pricing`.
  - Secondary help action: `Help`.
- Left column:
  - `Bundle Setup` navigation card:
    - Step Setup active visual in the image, despite the page title being Pricing.
    - Discount & Pricing with `None` status.
    - Bundle Assets with `None` status.
    - Pricing Tiers with `Disabled` status.
  - `Bundle Status` card with status select.
- Main column:
  - `Bundle pricing & Discounts` card:
    - Section title.
    - Subtitle: discount rules applied from lowest to highest.
    - Enable toggle in the top-right.
    - Blue tip banner about discounts being calculated from cart products.
    - Discount Type select.
    - Add Rule button.
  - `Discount Display Options` card:
    - Progress bar toggle.
    - Discount Messaging toggle.
- Footer actions:
  - Back.
  - Next.

Per latest product direction, the footer actions should not be implemented. Save Bar owns
unsaved-change behavior.

## Current Wolfpack Controls That Directly Fit The Image

- Bundle Setup section nav.
- Bundle Status select.
- Discount enabled toggle.
- Discount type select.
- Add rule button.
- Discount rules, including quantity/amount threshold and discount value.
- Discount Messaging toggle and templates.
- Progress bar toggle.

## Chrome-Verified Current Wolfpack Defects Against Image 2

- Page title is still `Configure: My Bundle` in the Shopify title area; target image shows
  app-body title `Pricing`.
- Title-bar actions still live outside the app body:
  - Preview on Storefront.
  - Sync Bundle.
  - Add to Storefront.
- App Embed banner is present above the edit layout.
- Bundle Setup nav has extra items not shown in the image:
  - Bundle Settings.
  - Widget Text.
- The current section header is `Discount & Pricing`; target card title is
  `Bundle pricing & Discounts`.
- The current tip copy is implementation-oriented:
  `Discounts are applied at checkout via Shopify's cart transform...`
  Target image uses merchant-facing cart-product copy.
- Current route renders rule rows immediately when rules exist; the target image shows the
  compact disabled/empty state.
- Current route renders `Discount Messaging` as a large inline section with variables and
  per-rule message fields; target image only shows a toggle row.
- Current `Display Options` card includes `Show footer`, which is not present in the
  target image.
- Current discount select uses native `<option>` children in touched code and should be
  migrated to `s-option` during implementation.
- Current section uses route-local `pricingState`; it needs to move behind the canonical
  bundle editor state hook.

## Easy Bundles Reference Findings

Easy Bundles Discount & Pricing includes the design-image controls plus extra settings:

- Discount enable checkbox.
- Discount type with:
  - Fixed Amount Off.
  - Percentage Off.
  - Fixed Bundle Price.
  - Buy X, get Y.
- Rule builder:
  - Discount on Quantity/Amount.
  - Greater-than-or-equal threshold.
  - Discount value.
- Discount Display Options:
  - Bundle Quantity Options.
- Per-rule default selector.
- Per-rule default action labelled `Make this rule default`.
- Box Label.
- Box Subtext.
  - Progress Bar toggle.
  - Progress Bar type: Simple Bar / Step-Based Bar.
  - Discount Messaging toggle.
  - Enable multi-language checkbox.
  - Show Variables button.
  - Per-rule Discount Text.
  - Per-rule Success Message.

Important implications:

- The supplied image is not the full expanded pricing feature set. It is the overview /
  collapsed state. Extra controls should be revealed from the two display-option rows,
  not removed.
- Bundle Quantity Options are not deferred. They are required because they map to the same
  shopper-facing concept as pricing tiers: quantity-based bundle choices.
- Progress Bar Options are also required, not just a toggle. They should be implemented
  with the same EB-inspired structure while staying inside Wolfpack's cleaner card layout.
- Tooltip behavior should use Polaris `s-tooltip` first. Custom CSS is only acceptable if
  Polaris cannot reproduce the needed hover/focus affordance.

## Current Wolfpack Controls Missing From The Image

### Discount rule editor

Existing Wolfpack supports:

- Up to 4 rules.
- Quantity or amount conditions.
- Operators.
- Percentage off, fixed amount off, and fixed bundle price.
- Per-rule preview copy.

The image shows only `Add Rule`, not the expanded rule editor.

### Discount Messaging editor

Existing Wolfpack supports:

- Enable/disable discount messaging.
- Template variable reference.
- Rule-specific discount text.
- Rule-specific success message.

The image shows only the Discount Messaging toggle.

### Footer display

Existing Wolfpack supports:

- `Show footer`.
- `Progress bar`.

The image only shows `Progress bar` and `Discount Messaging`.

### Bundle Quantity Options

Easy Bundles has this control set in Discount Display Options:

- Enable bundle quantity options.
- Box label.
- Box subtext.
- Default rule.

Wolfpack does not currently expose this same concept in the verified edit route. This is
now required for the redesign and should be implemented as a pricing-display layer derived
from quantity-based discount rules and compatible step conditions.

### Buy X, get Y

Easy Bundles lists `Buy X, get Y` as a discount type. Wolfpack's current pricing type
model only includes:

- Percentage off.
- Fixed amount off.
- Fixed bundle price.

This should not be added casually because it affects cart transform behavior, validation,
metafields, and storefront messaging.

## Recommended Placement Options

### 1. Main pricing card

Recommended: match the image card and keep the top-level controls compact:

- Title: `Bundle pricing & Discounts`.
- Enable toggle in the top-right.
- Blue tip banner with merchant-facing wording.
- Discount Type select.
- Add Rule button.
- Expanded rules render below Add Rule only when rules exist.

Why:

- Keeps the supplied design intact.
- Preserves existing rule functionality.
- Makes disabled state clear when pricing is off.

### 2. Discount rules

Recommended: use the existing rule model, but restyle each rule into a compact repeated
block under the main pricing card.

Controls:

- Rule title and remove action.
- Condition type.
- Operator.
- Threshold value.
- Discount value.
- Preview text.

Tradeoff:

- More content than the image, but it only appears after merchant action or existing data.

### 3. Discount Display Options

Confirmed: the visible card starts with the image rows, then expands into full EB-inspired
settings:

- Bundle Quantity Options.
- Progress bar toggle.
- Discount Messaging toggle.

When enabled, each row expands inline under the row.

Why:

- Matches the image's simple summary surface.
- Preserves existing settings without creating another nav item.
- Mirrors Easy Bundles, where display option rows reveal deeper settings.

### 4. Progress bar settings

Confirmed: when Progress bar is enabled, reveal a compact inline panel under that row.

Required controls:

- Simple Bar.
- Step-Based Bar.
- Progress text/content settings.
- Multi-language support where supported by the existing text infrastructure.
- Integration with quantity and amount discount conditions.
- Integration with step conditions so the progress calculation does not advertise an
  impossible or invalid bundle state.

Behavior requirements:

- Quantity-based discounts should progress against selected item count.
- Amount-based discounts should progress against selected subtotal.
- Step-based bar should map milestones to discount rules and applicable step/rule
  conditions.
- The storefront widget and cart transform metafields must receive a single normalized
  configuration.

### 5. Discount Messaging settings

Recommended: when Discount Messaging is enabled, reveal the existing message editor below
the row:

- Multi Language action or enable checkbox.
- Show Variables button.
- Per-rule Discount Text.
- Per-rule Success Message.

Why:

- The image only shows the toggle.
- EB reveals this deeper editor in the same section.
- This avoids keeping discount-related copy inside the separate `Widget Text` section.

### 6. Show footer

Recommended: hide `Show footer` from this image-level overview and decide whether it should
move into Bundle Settings or remain as an advanced display option.

Options:

- Put it under an `Advanced display options` disclosure inside Discount Display Options.
- Move it to Bundle Settings as a widget layout behavior.
- Remove merchant control if it is obsolete and always required.

Recommendation:

- Keep it under `Advanced display options` for now until we verify if storefront behavior
  depends on it.

### 7. Bundle Quantity Options

Confirmed: implement fully.

Required controls:

- Enable bundle quantity options.
- Gate to quantity-based discount rules.
- Per-rule default selection.
- Per-rule `Make this rule default` button matching the EB interaction pattern.
- Per-rule Box Label.
- Per-rule Box Subtext.
- Multi-language support where supported by the existing text infrastructure.
- Tooltip on the section label/action explaining that this controls shopper-facing
  quantity choices generated from qualifying quantity discount rules.

Integration requirements:

- Use existing discount rule thresholds as the source of quantity option values.
- Respect step conditions when a quantity option cannot be completed by the currently
  configured steps.
- Store settings in pricing display metadata so they travel with widget/metafield sync.
- Avoid duplicating Pricing Tiers as a separate engine; this is the per-bundle pricing
  display surface for quantity-based tiers.

### 8. Tooltip behavior

Confirmed: take inspiration from Easy Bundles' compact help affordance, but implement with
Polaris Web Components first.

Recommended implementation:

- Use an icon button or clickable icon next to dense option labels.
- Attach `s-tooltip` with concise text content.
- Tooltip must be accessible by hover and keyboard focus through the Polaris overlay
  behavior.
- Do not custom-build tooltip hover state unless `s-tooltip` cannot satisfy the interaction
  after live verification.

### 9. Buy X, get Y

Recommended: do not add from the EB reference during UI migration.

Why:

- It is a new discount engine capability, not just a UI control.
- It would require backend, metafield, cart transform, widget messaging, tests, and
  migration handling.

## Product Decisions Needed

| Area | Recommended choice | Needs confirmation |
|---|---|---|
| Back/Next footer | Do not implement; use Save Bar | Already decided |
| Card title | Use `Bundle pricing & Discounts` from design | Yes |
| Tip copy | Use merchant-facing cart-product copy from design | Yes |
| Expanded rule editor | Keep existing functionality under Add Rule | Yes |
| Display options visible rows | Bundle Quantity Options, Progress bar, Discount Messaging | Confirmed |
| Discount Messaging editor | Inline expansion below toggle | Yes |
| Progress bar settings | Full EB-inspired options integrated with conditions | Confirmed |
| Show footer | Move to Advanced display options or Bundle Settings | Yes |
| Bundle Quantity Options | Full implementation based on pricing tiers concept, including `Make this rule default` per quantity rule | Confirmed |
| Tooltips | Use Polaris `s-tooltip` first; custom only if required | Confirmed |
| Buy X, get Y | Do not include in UI migration | Yes |

## Implementation Notes For Later

- Replace native `option` tags inside touched `s-select` controls with `s-option`.
- Move pricing state into the canonical bundle editor state hook.
- Dirty state should change only when canonical pricing state differs from baseline.
- Disabled controls should remain visible but inert when discount pricing is off.
- Validate and serialize pricing through a shared normalizer/serializer, not route-local
  form assembly.
- Bundle Quantity Options and Progress Bar Options require tests for quantity rules,
  amount rules, step-condition compatibility, serialization, and metafield/widget payloads.
