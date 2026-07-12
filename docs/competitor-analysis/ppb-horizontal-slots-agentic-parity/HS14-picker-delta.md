# HS14: Desktop picker geometry delta

**Viewport:** 1280 x 800
**Status:** Mobile scroll/footer delta fixed; category-control delta remains

## Shared geometry

Both EB and WPB:

- mount the picker at x=0, y=120;
- fill 1280 x 680 to the viewport bottom;
- use a fixed full-viewport overlay;
- keep the modal shell overflow hidden;
- use a scrollable product body;
- use a centered 300 x 84 absolute footer near the bottom.

## Remaining delta

| Measurement | EB | WPB 5.0.150 | Delta |
| --- | ---: | ---: | ---: |
| Header height | 160px | 94.59px | WPB -65.41px |
| Product body y | 280px | 214.59px | WPB -65.41px |
| Product body height | 520px | 585.41px | WPB +65.41px |
| Footer y | 695.61px | 698px | WPB +2.39px |

The next implementation slice must inspect the header's actual EB content and
spacing at desktop and mobile before changing CSS. The current evidence does not
yet prove whether the missing height belongs to tabs, discount messaging, header
padding, or another conditional header row.

## Mobile evidence and fixes

At 390 x 844, EB uses a 717.39px fixed picker shell from y=126.61 to the viewport
bottom. Its 570.39px body owns vertical scrolling and its 270 x 76 footer remains
visible at y=746.48.

Before the WPB fix, the panel owned vertical scrolling, the product body expanded
to 1,121px, and the footer was pushed below the viewport to y=1,356.20. WPB now:

- keeps the 717.39px panel overflow hidden;
- gives the body a 608.80px internal scroll area;
- keeps the 300 x 84 footer absolute at y=742;
- preserves the footer y-position while the body scrolls from 0 to 400;
- retains bottom padding so the final product remains reachable above the footer.

The remaining body-height difference is explained by a behavioral header gap,
not spacing: EB includes category controls between its step tabs and discount
message; WPB currently does not render modal category controls. That is tracked
as the next TDD behavior slice.
