# Requirements: First-Load Minimum Configuration Tour

## Context
New merchants need a short guided path through only the steps required for a bundle to become storefront-visible after the create bundle workflow. The broader readiness score can continue to track quality/commercial setup, but the first-load tour should not force optional items such as discount setup. The tour must work for both full-page bundles and product-page bundles.

## Audit / Prior Research Reference
Existing references:
- `docs/guided-tour-reference.md`
- `docs/guided-tour-comparison.md`
- `docs/create-bundle-wizard/01-requirements.md`
- `docs/eb-step-setup-readiness-parity/02-architecture.md`
- `internal docs/Features/Bundle Types.md`
- `internal docs/Architecture/Widget Architecture.md`
- `internal docs/Shopify Integration/Metafields.md`

## Functional Requirements
- FR-01: The create bundle flow must open the configure wizard with a first-load signal only when a first-install-eligible shop creates its first post-install bundle through the create workflow.
- FR-02: The guided tour must be shop-level first-install gated, not per-bundle gated and not inferred from bundle count.
- FR-03: The guided tour must include only the minimum storefront activation steps.
- FR-04: The minimum activation checks must correctly detect products selected through category accordions, not only legacy flat step products.
- FR-05: The PPB configure Step Flow and Step Setup areas must be presented as one EB-style card separated by a horizontal rule.
- FR-06: FPB and PPB category accordion dragging must show the dragged accordion moving with the pointer.
- FR-07: Category accordion body controls must preserve the EB-style title input, multi-language button, Products/Collections tabs with selected counts, and Add Products/Add Collections actions.

## Minimum Activation Definition
For both bundle types, the minimum configuration is:
- App embed / app block is available to render the widget.
- At least one step has at least one product or collection selection.
- Bundle configuration has been saved so bundle metafields/config data exist.
- Bundle status is `active`, which also syncs the Shopify bundle product to active.

Additional FPB requirement:
- A storefront page is linked/placed for the full-page widget, because the FPB widget needs a page block/metafield cache or proxy fallback.

Additional PPB requirement:
- The product-page bundle product must have `bundle_ui_config` on its first variant so the product-page app embed renders on that product page.

Not required for initial storefront visibility:
- Discount/pricing configuration.
- Design customization.
- Readiness score completion.

## Out of Scope
- Storefront widget rendering changes.
- DCP controls.
- Deploying Shopify extension changes.
- Changing FPB config loading priority or retry behavior.

## Acceptance Criteria

### FR-01: First-load signal
- [ ] Given a newly installed merchant creates a bundle successfully while `Shop.firstCreateTourEligible` is true, when Remix redirects to the create configure wizard, then the URL contains `first_load=true`.
- [ ] Given an existing merchant creates a bundle successfully while `Shop.firstCreateTourEligible` is false, when Remix redirects to the create configure wizard, then the URL does not contain `first_load=true`.

### FR-02: Shop-level gating
- [ ] Given the shop has not seen the first bundle tour, when `first_load=true` is present, then the guided tour opens.
- [ ] Given the merchant completes or dismisses the tour, when another bundle is opened, then the tour remains hidden for that shop.

### FR-03: Minimum-only tour
- [ ] Given the tour opens, then the steps are App embed, Add products, Place/save bundle, and Set active.
- [ ] Given pricing is not configured, then the tour does not include a discount/pricing step.

### FR-04: Category readiness
- [ ] Given products are selected inside `StepCategory`, when readiness is computed, then "Products added to a step" is complete.
- [ ] Given collections are selected inside `StepCategory`, when readiness is computed, then "Products added to a step" is complete.

### FR-05: PPB Step Flow/Setup card
- [ ] Given the merchant opens PPB Step Setup, then Step Flow and Step Setup render inside one card with a horizontal rule between them.
- [ ] Given the Step Setup header is visible, then enable, clone, multi-language, and delete actions are grouped in the header.

### FR-06: Category drag feedback
- [ ] Given the merchant drags a category accordion in FPB or PPB configure, then a drag image follows the pointer.
- [ ] Given the merchant drops the category on another accordion, then sort order updates as before.

## UI/UX Spec
- Keep Polaris web components for admin buttons and switches where available.
- Use the existing `BundleGuidedTour` component and shop-level localStorage key.
- Keep category accordion copy neutral and aligned to existing EB-parity language.
- Horizontal rules should be visual separators inside the card, not new nested cards.

## Data Changes
- Add `Shop.firstCreateTourEligible Boolean @default(false)`.
- `BillingService.ensureShop()` sets the field to `true` only when creating a new shop record.
- The create bundle handler consumes the flag on first successful create and sets it to `false`.
None.

## Risks
| Risk | Mitigation |
|---|---|
| First-load query can show the tour too often | Keep shop-level localStorage gate in `BundleGuidedTour` |
| Category readiness undercounts products | Include `StepCategory.products` and `StepCategory.collections` in the check |
| Drag image styling regresses reorder behavior | Change only `dataTransfer.setDragImage`; leave drop/reorder logic intact |
