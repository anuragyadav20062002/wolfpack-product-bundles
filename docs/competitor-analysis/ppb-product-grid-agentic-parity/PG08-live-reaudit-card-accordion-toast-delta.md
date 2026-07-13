# PG08: Live Re-audit — Cards, Accordion, and Toast

Date: 2026-07-13
Status: Proven on hot-reloaded dev widget `5.0.167`

## Reopened gaps

The live EB/WPB comparison disproved the earlier Product Grid acceptance:

- WPB used a detached horizontal step rail instead of EB's accordion ordering.
- Mobile cards were clipped near the image and hid title, price, and action.
- Selected cards showed a marker and inline quantity controls instead of `Added xN`.
- The intermediate CTA could not consistently surface EB's validation feedback.
- The mobile footer did not retain EB's sticky reachability.

## Corrected source behavior

- Multi-step COGNIVE renders each header in sequence and inserts the active body
  immediately after the active header.
- Grid cards use natural content height. Desktop resolves to three columns;
  mobile resolves to two complete columns without clipping.
- Selected cards render one quantity-aware `Added xN` action, with no selection
  marker or inline quantity controls.
- An incomplete intermediate Grid CTA stays actionable and shows the rule text in
  a fixed bottom, 46px-high, non-dismissible toast.
- The mobile Product Grid footer is sticky.

## Direct Chrome DevTools proof

The EB reference and WPB dev storefront were inspected using direct
`mcp__chrome_devtools__*` calls only. WPB loaded widget `5.0.167` without a
deployment step.

Desktop at 1440x900:

- Runtime attributes: `PDP_INPAGE + COGNIVE`.
- Initial order: active Step 1 header, Step 1 body, Step 2 header.
- Grid: three columns, 15px gaps, 410px scrolling region.
- Cards expose image, title, price, and 32px action.
- Two selections each produced `Added x1`; neither card contained a marker or
  quantity-control group.
- After Next: completed Step 1 header, active Step 2 header, Step 2 body.

Mobile at 390x844:

- Grid: two 163.5px columns with 15px gap and natural 879.5px height.
- First card: 269.5px high with image, title, price, and action visible.
- Footer: `position: sticky; bottom: 0`.
- Validation toast: fixed at `bottom: 0`, 46px high, no close control.
- No horizontal overflow.

Additional responsive checks at 360px and 768px also had no horizontal
overflow. Investigation screenshots remain under `/private/tmp` and are not
repository artifacts.

## Behavior verification

`ppb-product-grid-interaction-parity.test.ts` covers accordion ordering,
quantity-aware selected actions, the actionable incomplete Grid CTA, and
preservation of native disabled behavior for non-Grid templates.
