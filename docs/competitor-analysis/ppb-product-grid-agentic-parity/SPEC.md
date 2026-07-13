# PPB Product Grid Parity

## Status

In progress. EB-first runtime and responsive baseline captured. WPB comparison,
interaction states, implementation deltas, regression proof, and fixture
restoration remain open.

## Contract

- `bundleDesignTemplate = "PDP_INPAGE"`
- `bundleDesignTemplateData.templateId = "COGNIVE"`

## Fixture

- Store: `yash-wolfpack.myshopify.com`
- Bundle: `WPB PPB Product List Parity 2026-07-11`
- Offer: `MIX-156854`
- Steps: 2
- Step 1 contains two categories, including a long-label empty category
- Current Step 1 rule: quantity greater than or equal to 2

## Evidence protocol

Browser evidence uses direct Chrome DevTools MCP only. Each accepted storefront
state requires cache-bypassed reload, runtime attributes, accessibility state,
computed geometry, interaction behavior, and an equivalent WPB pass.

## Current rows

| Case | EB | WPB | Delta | Status |
| --- | --- | --- | --- | --- |
| PG00 runtime/baseline | `PDP_INPAGE + COGNIVE` proven at 1280x800 and 390x844 | Pending | Pending | EB captured |
| PG01 responsive grid | Three columns in 345px host; two columns in 360px mobile grid; 15px gap and 8px side padding | Pending | Pending | EB captured |

## Acceptance boundary

Product Grid is not accepted until every applicable Product Grid requirement in
`broader-PPB-template-parity.md` has EB-first evidence, equivalent WPB evidence,
an explicit delta, desktop/mobile verification, and shared-template regression
proof.
