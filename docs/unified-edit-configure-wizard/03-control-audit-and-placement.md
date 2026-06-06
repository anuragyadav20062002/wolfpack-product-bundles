# Unified Edit Flow Control Audit and Placement

**Issue ID:** unified-edit-flow-control-audit-1
**Status:** Draft for discussion
**Last Updated:** 2026-05-11 19:20

## Direction Change

The earlier route-only alignment sent dashboard Edit and Clone success into
`/app/bundles/create/configure/:bundleId`. The current product direction supersedes
that: edit should use the same wizard design philosophy as create, but be served from
a separate edit endpoint such as `/app/bundles/edit/:bundleId`.

No implementation should proceed until the extra edit-only controls below are reviewed
and placement decisions are agreed.

## Sources Audited

- `app/routes/app/app.bundles.create/route.tsx`
- `app/routes/app/app.bundles.create_.configure.$bundleId/route.tsx`
- `app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/route.tsx`
- `app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/route.tsx`
- `app/hooks/useBundleConfigurationState.ts`
- `prisma/schema.prisma`
- Shopify docs checked for implementation guardrails:
  - https://shopify.dev/docs/api/polaris/using-polaris-web-components
  - https://shopify.dev/docs/api/app-bridge-library/apis/save-bar

## Chrome Verification Status

Live verification could not continue in this pass because the Chrome DevTools MCP
session reported that the selected page was closed for `list_pages`, `select_page`,
and `new_page`. Querying the local debug endpoint also did not expose a tab list.
Earlier live attempts had reached a Shopify/Cloudflare challenge. No browser-only
control result should be treated as verified from this continuation.

## Current Create Wizard Controls

### Step 01: Bundle name and description

Route: `/app/bundles/create`

- Bundle name text field with client validation.
- Description text area.
- Bundle type selection:
  - Product page bundle builder.
  - Full page bundle builder.
- Full-page-only page layout selection:
  - Floating card.
  - Side Panel.
- Help link.
- Next action.

### Step 02: Configuration

Route: `/app/bundles/create/configure/:bundleId`

- Step chip navigation.
- Add step.
- Remove current step.
- Step icon upload.
- Step name.
- Product page title.
- Step-name translations modal.
- Product/collection source tabs.
- Shopify product picker.
- Shopify collection picker.
- Selected count badges.
- Step rules:
  - Type.
  - Operator.
  - Value.
  - Add rule.
  - Remove rule.
- Bundle status select.
- Step summary.
- Preview action placeholder/toast.
- Guided tour and readiness overlay.

### Step 03: Pricing

- Enable bundle discounts switch.
- Discount type select.
- Up to 4 discount rules.
- Rule condition type, operator, threshold value.
- Discount value.
- Remove discount rule.
- Progress bar switch.
- Discount messaging switch.
- Global progress message.
- Global qualified message.

### Step 04: Assets

- Promo banner image picker and crop.
- Loading GIF picker.
- Filters drawer:
  - Per-step selection.
  - Filter tab label.
  - Collection mapping.
  - Add/remove filter.
- Search bar switch.
- Custom fields modal:
  - Field label.
  - Type: text, dropdown, checkbox, number.
  - Required checkbox.
  - Dropdown options text area.
  - Add/remove field.

### Step 05: Pricing tiers

Full-page bundles only.

- Tier label.
- Linked full-page bundle select.
- Add tier.
- Delete tier.
- Finish action.

## Legacy Edit Flow Controls

### Shared edit shell

Both legacy edit screens have controls that are not part of the create wizard shell:

- App Bridge SaveBar for dirty edits.
- Discard changes.
- Title-bar actions.
- App embed banner.
- Section navigation sidebar.
- Sync Bundle confirmation modal.
- Selected products modal.
- Selected collections modal.

### Product and status controls

Product-page edit has:

- Bundle product card.
- Sync Product.
- Open linked Shopify product.
- Replace/select bundle product.
- Bundle status select.
- Add to Storefront / Preview Bundle title-bar action.
- Open in Theme Editor.
- Widget installed state.

Full-page edit has:

- Bundle status select.
- Add to Storefront when no page is linked.
- Preview on Storefront when no page is linked.
- View on Storefront when a page exists.

### Step Setup extras

Both legacy edit flows have extra step controls beyond create:

- Clone step.
- Delete step.
- Category filters inline in Step Setup.
- Advanced step options:
  - Regular step vs Add-On / Upsell step.
  - Add-on tab label.
  - Add-on panel title.
  - Display add-on products as free.
  - Unlock add-on step after bundle completion.
  - Mandatory default product.
  - Default variant GID.
  - Available variants shortcut buttons.

Product-page edit also supports drag and drop reordering in its step list.

### Pricing extras

Legacy edit has:

- Show footer display option.
- Rule-level discount text.
- Rule-level success message.
- More detailed variable reference for message templates.
- Preview text per discount rule.

Create currently has global progress and qualified messages instead of rule-level
messages.

### Asset extras

Product-page edit has:

- Per-step banner image.
- Loading GIF.

Full-page edit has:

- Storefront page URL slug.
- Storefront URL preview.
- View on Storefront.
- Promo banner image and crop.
- Per-step tab/icon image.
- Per-step banner image.
- Loading GIF.
- Floating promo badge enablement.
- Floating promo badge text.

### Pricing tier extras

Full-page edit has:

- Show step timeline setting inside `PricingTiersSection`.
- Steps and pricing tiers conflict warning modal.

Create currently saves tier labels and linked bundles, but does not expose the step
timeline control or conflict warning.

### Bundle Settings extras

Both legacy edit flows have:

- Show product prices.
- Show compare-at prices.
- Allow quantity changes.
- Redirect to checkout after adding to cart.

Product-page edit additionally has:

- Enable SDK mode.

### Widget Text extras

Both edit flows have widget text overrides and locale-specific overrides.

Full-page fields:

- Add to Cart button.
- Next Step button.
- Done button.
- Free gift badge.
- Included badge.
- Sidebar title.

Product-page fields:

- Add Bundle to Cart button.
- Next Step button.
- Done button.
- Free gift badge.
- Included badge.
- Incomplete bundle message.
- Adding to cart message.

Create currently only exposes step-name translation, not widget text overrides.

### Placement and sync extras

Product-page edit:

- Place Widget modal.
- Theme template selection.
- Bundle-product template preparation.
- Theme Editor deep link with app block targeting.
- Sync Bundle destructive confirmation.

Full-page edit:

- Add to Storefront modal.
- Page selection.
- Auto-install for full-page widget on a selected page.
- Theme Editor fallback.
- Draft preview page creation.
- Page slug rename before save.
- Sync Bundle destructive confirmation.

## Proposed Superimposition Onto Create Wizard Design

The edit wizard should preserve the create flow's top step indicator, page header,
card-based main column, and right summary/action column. The legacy sidebar section
navigation should not be carried forward.

### Step 01: Bundle Details

Use the existing create design and prefill:

- Bundle name.
- Description.
- Bundle type.
- Full-page layout for full-page bundles.
- Bundle status.

Discussion needed:

- Should bundle type be read-only in edit?
- Should full-page layout be editable after a bundle is live?
- For product-page bundles, should the bundle product card live here or in the final
  placement step?

### Step 02: Configuration

Keep the current create Step Configuration, Select Product, Rules, sidebar summary,
and step chip pattern. Add an "Advanced step options" card or drawer only when needed.

Candidate edit-only additions:

- Clone step.
- Add-on / upsell step controls.
- Mandatory default product controls.
- Variant selection helper.
- Step reorder control for product-page bundles.

Discussion needed:

- Whether inline category filters should stay in Step 04's drawer for consistency or
  also appear in Step 02 as legacy edit currently does.
- Whether default variant should remain a raw GID text field or be replaced with a
  picker-style selection from selected variants.

### Step 03: Pricing

Keep the create pricing layout and add:

- Show footer.
- Rule-level message overrides.
- Rule preview text.

Discussion needed:

- Replace create's global discount messages with rule-level messages, or keep both?
- Current legacy fallback copy includes fabricated customer-facing strings. This
  conflicts with the repo rule against hardcoded fallback storefront copy and should
  be resolved before implementation.

### Step 04: Assets and Shopper Inputs

Keep create's media card, filters drawer, search bar, and custom fields modal. Add:

- Per-step banner images.
- Full-page per-step timeline/tab icon if different from the Step 02 icon.
- Full-page floating promo badge controls.
- Full-page storefront page slug controls, if this is the preferred location.

Discussion needed:

- Whether placement/page slug belongs here or in a final publish step.
- Whether floating promo badge is a core merchant control or should be hidden behind
  an advanced section.

### Step 05: Settings, Tiers, and Placement

The current create Step 05 is Pricing Tiers. Edit needs additional finalization controls.
There are two viable designs:

1. Keep Step 05 as Pricing Tiers for FPB and add a separate Settings/Placement card below.
2. Rename Step 05 to Settings & Placement, with Pricing Tiers shown as an FPB-only card.

Candidate controls:

- Pricing tiers.
- Show step timeline.
- Show product prices.
- Show compare-at prices.
- Allow quantity changes.
- Redirect to checkout.
- SDK mode for product-page bundles.
- Widget text overrides.
- Add to Storefront / Place Widget.
- Open in Theme Editor.
- Preview Bundle / View on Storefront.
- Sync Product.
- Sync Bundle.

Discussion needed:

- Whether widget text deserves its own wizard step instead of living in the final step.
- Whether SDK mode should be visible to all merchants.
- Whether Sync Bundle should be a final-step action, a title-bar action, or both.

## Endpoint Recommendation

Use a new edit route such as:

```text
/app/bundles/edit/:bundleId
```

Implementation should share the wizard shell and most state/payload builders with
create configure, but it should not masquerade as create in the URL. This means the
previous route helper that returns `/app/bundles/create/configure/:bundleId` must be
revisited before implementation.

## Dirty Save Recommendation

Use the current create wizard dirty-payload idea and combine it with App Bridge's
recommended save-bar behavior for edit:

- Wizard Next can skip server saves when the active step payload is unchanged.
- Dirty forms should expose Save/Discard when the merchant edits existing bundles.
- Preview, placement, and Sync Bundle should require clean saved state.
- Discard should reset only the changed wizard state, not reload unrelated app data.

## Open Decisions

| Area | Decision needed |
|---|---|
| Endpoint | Confirm exact route: `/app/bundles/edit/:bundleId` or another path. |
| Step count | Keep 5 steps or add a 6th Widget Text / Publish step. |
| Bundle type | Read-only in edit or editable with guardrails. |
| Product-page bundle product | Step 01, final step, or persistent side summary. |
| Advanced step options | Visible by default, collapsible, or hidden behind advanced action. |
| Default variant | Keep raw GID field or use selected variant picker. |
| Widget text | Final step card or standalone step. |
| SDK mode | Merchant-visible, advanced-only, or hidden/internal. |
| Sync Bundle | Title-bar action, final-step action, or both. |
| Legacy route cleanup | Keep old direct routes during transition or redirect to edit endpoint. |
