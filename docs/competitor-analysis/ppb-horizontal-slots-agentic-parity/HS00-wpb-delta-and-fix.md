# HS00: WPB empty-slot delta and source fix

**Captured:** 2026-07-13
**WPB widget:** 5.0.149 before; 5.0.150 after

## Equivalent runtime contract

After selecting Horizontal Slots through WPB Admin and hard reloading the agent
storefront, the body reported:

```text
wpbmix-template-type="PDP_MODAL"
wpbmix-template-id="MODAL"
wpb-mix-consolidated-design="true"
```

The runtime mapping therefore matches EB's `PDP_MODAL + MODAL` contract.

## Confirmed pre-fix delta

WPB 5.0.149 rendered one aggregate `Add N more` card for every incomplete step.
EB renders one empty Product slot for every required selection.

For the equivalent two-step fixture:

- EB Step 1: Product 1 and Product 2 empty slots
- WPB Step 1: one `Add 2 more` card
- EB Step 2: Product 1 empty slot
- WPB Step 2: one `Add 1 more` card

This was a behavioral/structural delta, not a CSS-only difference.

## Root cause

`renderProductPageLayout()` routed all incomplete regular steps through the
generic `createAddMoreCard()` path, including `PDP_MODAL` templates. The dedicated
modal-slot module already owned `createEmptyStateCard()` with EB-style Product N
labels, but the layout never used it for incomplete steps.

## Source correction

Modal-slot templates now append one empty card per remaining required selection.
The slot index starts after the current selected quantity, so an exact-two step
with one selected product renders `Product 2`. Greater-than rules preserve the
existing threshold behavior by requiring `conditionValue + 1` slots.

Product List and Product Grid retain the aggregate add-more path.

## Post-fix proof

On widget 5.0.150, the live WPB DOM rendered:

- Step 1: Product 1 and Product 2 empty cards
- Step 2: Product 1 empty card

The WPB host is 300px wide while the EB theme's host is 345px wide. This is a
theme/placement difference, not a fixed-width parity defect:

- WPB grid: three tracks of approximately 89.33px with 16px gaps
- EB grid: three tracks of approximately 104.33px with 16px gaps

Both satisfy the same responsive three-column equation `(host - 2 gaps) / 3`.
No store-specific width was copied into CSS.

## Verification

- Red: focused test failed because `_appendModalSlotEmptyCards` did not exist.
- Green: 3 placeholder cases passed.
- Vertical Slots shared-shell regression passed.
- Template registry integration regression passed.
- Raw widget source syntax checks passed.
- `npm run build:widgets` passed.
- Live hard-refresh served widget 5.0.150.

## Remaining HS00 work

Mobile and narrow-placement proof remain required before the complete HS00 row is
accepted across all mandatory viewports.
