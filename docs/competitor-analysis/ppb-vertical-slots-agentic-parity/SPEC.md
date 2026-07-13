# PPB Vertical Slots Parity

## Status

In progress. EB-first desktop empty baseline captured. WPB comparison,
mobile/interactions, deltas, implementation, and regression proof remain open.

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
| VS00 runtime/empty desktop | `PDP_MODAL + SIMPLIFIED`; three vertical rows captured | Pending | Pending | EB captured at 1280x800 |

## Acceptance boundary

Vertical Slots is not accepted until every applicable requirement in
`broader-PPB-template-parity.md` has EB-first and WPB evidence, an explicit
delta, desktop/mobile verification, restored fixtures, and shared-template
regression proof.
