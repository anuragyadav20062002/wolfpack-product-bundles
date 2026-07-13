# PPB Vertical Slots Parity

## Status

In progress. EB-first and WPB desktop empty baselines captured. Mobile,
interactions, implementation, and regression proof remain open.

## Contract

- `bundleDesignTemplate = "PDP_MODAL"`
- `bundleDesignTemplateData.templateId = "SIMPLIFIED"`
- vertical slot orientation

## Fixture

- Store: `yash-wolfpack.myshopify.com`
- Bundle: `WPB PPB Product List Parity 2026-07-11`
- Offer: `MIX-156854`
- Steps: 2
- empty requirements: two rows for Step 1 and one row for Step 2

## Current rows

| Case | EB | WPB | Delta | Status |
| --- | --- | --- | --- | --- |
| VS00 runtime/empty desktop | `PDP_MODAL + SIMPLIFIED`; `345x60px` rows, `16x16px` icon, `26px` group gap | pre-change `300x104px`; post-change responsive full-width `372.34x60px`, `16x16px` icon, `26px` group gap | fixed at source; width follows the host product column instead of copying EB's store-specific width | Desktop verified |
| VS01 runtime/empty mobile | `360x60px` rows, `16x16px` icon, 10px labels | `358x60px` rows, `16x16px` icon, 10px labels | host-theme horizontal padding differs by 2px; row contract matches and overflow is zero | Mobile verified at 390x844 |

## Acceptance boundary

Vertical Slots is not accepted until every applicable requirement in
`broader-PPB-template-parity.md` has EB-first and WPB evidence, an explicit
delta, desktop/mobile verification, restored fixtures, and shared-template
regression proof.
