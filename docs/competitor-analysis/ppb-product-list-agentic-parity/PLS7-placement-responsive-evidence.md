# PLS7 Placement Responsive Evidence

Date: 2026-07-12

Scope: Product Page Bundle Product List only (`PDP_INPAGE` + `CASCADE`).

Evidence files:
- EB desktop reset: `/private/tmp/ppb-product-list-agentic-parity/PLS7-placement-responsive/eb-desktop-reset.json`
- EB desktop probes: `/private/tmp/ppb-product-list-agentic-parity/PLS7-placement-responsive/eb-desktop-placement-probes-host.json`
- WPB desktop reset: `/private/tmp/ppb-product-list-agentic-parity/PLS7-placement-responsive/wpb-desktop-reset.json`
- WPB desktop probes: `/private/tmp/ppb-product-list-agentic-parity/PLS7-placement-responsive/wpb-desktop-placement-probes-host.json`
- EB mobile reset: `/private/tmp/ppb-product-list-agentic-parity/PLS7-placement-responsive/eb-mobile-reset.json`
- EB mobile probes: `/private/tmp/ppb-product-list-agentic-parity/PLS7-placement-responsive/eb-mobile-placement-probes-host.json`
- WPB mobile reset: `/private/tmp/ppb-product-list-agentic-parity/PLS7-placement-responsive/wpb-mobile-reset.json`
- WPB mobile probes: `/private/tmp/ppb-product-list-agentic-parity/PLS7-placement-responsive/wpb-mobile-placement-probes-host.json`

## State Tested

1. Clear local storage, session storage, and Cache Storage.
2. Reload EB and WPB Product List storefronts.
3. Constrain the live widget host in-browser to simulate placements:
   - Desktop: default, `300px`, `360px`, `520px`.
   - Mobile: default, `300px`, `360px`.
4. Measure list width, row width, scroll width, client width, title width, action width, add-button width, and horizontal overflow.

No screenshots were committed. Chrome DevTools MCP captured computed layout measurements only.

## EB Source Of Truth

Desktop:
- Default host width: `345px`.
- Constrained host widths tested: `300px`, `360px`, `520px`.
- Horizontal list overflow: none.
- Row overflow: none.
- Action rail stays `90px`.
- Add button stays `90px`.
- Title column absorbs the remaining width.

Mobile:
- Real viewport width: `390px`.
- Default host width: `345px`.
- Constrained host widths tested: `300px`, `360px`.
- Horizontal list overflow: none.
- Row overflow: none.
- Action rail stays `90px`.
- Add button stays `90px`.

## WPB Result

Desktop on widget version `5.0.136`:
- Default host width: `372px`.
- Constrained host widths tested: `300px`, `360px`, `520px`.
- Horizontal list overflow: none.
- Row overflow: none.
- Action rail stays `90px`.
- Add button stays `90px`.
- Title column absorbs the remaining width.

Mobile on widget version `5.0.136`:
- Real viewport width: `390px`.
- Default host width: `347px`.
- Constrained host widths tested: `300px`, `360px`.
- Horizontal list overflow: none.
- Row overflow: none.
- Action rail stays `90px`.
- Add button stays `90px`.

## Decision

No Product List source patch is needed for the measured placement-responsive states. WPB matches EB's responsive behavior for narrow, default, and wider placements: the list stays within its host, rows do not create horizontal overflow, and the fixed action rail remains stable while title/content width flexes.

## 2026-07-13 Widget 5.0.148 Recheck

The placement matrix was repeated after the content-driven Product List row change.

Desktop:
- EB and WPB were measured at default, `300px`, `360px`, and `520px` widths.
- Both retain a `90px` action rail and produce no list or row horizontal overflow.
- The title column absorbs the available-width change.

Mobile at `390 x 844`:
- EB and WPB were measured at default, `300px`, and `360px` widths.
- Both retain a `90px` action rail and produce no list or row horizontal overflow.
- WPB retains the separately accepted `410px` vertical list cap.

Evidence:
- `/private/tmp/ppb-product-list-agentic-parity/PLS7-placement-responsive/eb-desktop-placement-probes-2026-07-13.json`
- `/private/tmp/ppb-product-list-agentic-parity/PLS7-placement-responsive/wpb-desktop-placement-probes-5-0-148-2026-07-13.json`
- `/private/tmp/ppb-product-list-agentic-parity/PLS7-placement-responsive/eb-mobile-placement-probes-2026-07-13.json`
- `/private/tmp/ppb-product-list-agentic-parity/PLS7-placement-responsive/wpb-mobile-placement-probes-5-0-148-2026-07-13.json`

Decision: the post-row-change placement recheck is accepted.
