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
| PG00 runtime/baseline | `PDP_INPAGE + COGNIVE` proven at 1280x800 and 390x844 | Equivalent runtime contract proven on 5.0.161 | None | Accepted runtime dispatch |
| PG01 responsive grid | Three columns in 345px host; two columns in 360px mobile grid; 15px gap and 8px side padding | Three columns in real 372.34px host; two columns in 358px mobile host; same gap/padding | Fixed 300px cap removed; exact owner width differs by theme | Accepted responsive ownership at 1280x800 and 390x844 |
| PG02 multi-step flow | One active body/grid with step navigation and Next/final CTA | Equivalent active-step flow on 5.0.161 | Both full grids were stacked before fix | Accepted desktop progression; mobile interaction replay remains |

## Acceptance boundary

Product Grid is not accepted until every applicable Product Grid requirement in
`broader-PPB-template-parity.md` has EB-first evidence, equivalent WPB evidence,
an explicit delta, desktop/mobile verification, and shared-template regression
proof.
