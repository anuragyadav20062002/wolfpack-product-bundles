# HS09 Expanded Responsive Placement Evidence

Date: 2026-07-13

## Pre-change evidence

EB was inspected first with direct Chrome DevTools MCP after a cache-bypassing reload at each viewport. WPB was then reloaded and measured through the same sequence.

| Viewport | EB mounted grid | WPB mounted host/grid | EB overflow | WPB overflow |
| --- | --- | --- | --- | --- |
| 1440 x 900 | 345px / 345px | 425.66px containing column; 300px host/grid | None | None |
| 768 x 1024 | 276.5px / 276.5px | 360px containing column; 300px host/grid | None | None |
| 390 x 844 | 360px / 360px | 358px / 358px | None | None |
| 360 x 800 | 330px / 330px | 328px / 328px | None | None |

At every width both implementations use three responsive `minmax(0, 1fr)` tracks and keep the grid inside the host. The two-pixel mobile difference comes from the themes' 15px versus 16px page gutters.

## Exact pre-change delta

On desktop and tablet, EB fills the available product-information column. WPB's actual product-information column measured 425.66px at 1440 x 900 and 360px at 768 x 1024, but the widget host stopped at 300px because the Horizontal Slots source owner set `max-width: 300px` on the complete `PDP_MODAL` widget.

The fixed cap does not represent EB behavior and violates the plan's content-driven host-width requirement. The correction must make Horizontal Slots fill its mounted container while preserving Vertical Slots' separately scoped width rules.

## Post-change verification

The widget and generated assets were rebuilt as `5.0.154`. Direct Chrome DevTools MCP then repeated cache-bypassing WPB reloads at every viewport:

| Viewport | Available WPB column | WPB host/grid after fix | Slot track | Overflow |
| --- | --- | --- | --- | --- |
| 1440 x 900 | 425.66px | 425.66px | 131.22px | None |
| 768 x 1024 | 360px | 360px | 109.33px | None |
| 390 x 844 | 358px | 358px | 108.66px | None |
| 360 x 800 | 328px | 328px | 98.66px | None |

The host now reports `max-width: 100%`, fills its real mounted product-form container, preserves three content-driven tracks, and produces no document or grid overflow.

The served runtime contract remained `PDP_MODAL + MODAL` with `data-ppb-slot-orientation="horizontal"`.

## Result

The required viewport matrix is accepted. A separate real-placement pass is still required for the plan's approximately 520px and section/full-width placements where the theme permits them; this document does not treat synthetic width probes as substitutes.
