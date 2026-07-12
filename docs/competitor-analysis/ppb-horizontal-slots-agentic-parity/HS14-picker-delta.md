# HS14: Desktop picker geometry delta

**Viewport:** 1280 x 800
**Status:** Delta recorded; not implemented

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
