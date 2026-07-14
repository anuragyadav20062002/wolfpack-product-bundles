# HS19 — Modal Product Card and Toast Delta

**Status:** Accepted on dev widget `5.0.166`
**Captured:** 2026-07-13
**Viewports:** 1280×800 desktop, 390×844 mobile
**Evidence method:** Direct Chrome DevTools MCP against live EB and WPB storefronts

## Fixture

- EB: `MIX-156854`, `PDP_MODAL` + `MODAL`
- WPB: `cmrf19c8d0000v0xpj8rz2wgh`, `PDP_MODAL` + `MODAL`
- Step 1 rule: quantity greater than or equal to 2
- Two categories, including a long category label
- Six products, including a multi-variant product

## Desktop Delta

| Surface | EB reference | WPB before fix | Delta |
|---|---|---|---|
| Bottom sheet | 1280×680 at y=120 | 1280×680 at y=120 | Matched |
| Header/body split | Header 160; body starts y=280 | Header 129.59; body starts y=249.59 | WPB header is about 30px too short |
| Grid | Four 255px tracks, 30px gap | Four 254.75px tracks, 30px gap | Matched within subpixel rounding |
| Empty card | 255×350.83; 12px padding; layered 1px card shadow | 254.75×339.31; 10px padding; no shadow | WPB card is shorter, tighter, and flat |
| Media | 229×190.83 | 232.75×194.31 | WPB media/content track is too wide |
| Selected state | 2px black outline; 42px overlapping check; 227×35 white `Added x1` action; no visible quantity row | 1px gray border; small green check; card grows to 399.31px; visible quantity row; `Selected ✓` | Selection treatment and height stability do not match |
| Validation toast | `Add at least 02 products on this step`; 292.52×46 at y=672.39; inside modal above/overlapping footer | Generic 360×56.38 toast at viewport top; different copy; close icon | Copy, ownership, size, and placement are wrong |

## Mobile Delta

| Surface | EB reference | WPB before fix | Delta |
|---|---|---|---|
| Bottom sheet | 390×717.39 at y=126.61 | 390×717.39 at y=126.61 | Matched |
| Grid/card | Two 165px tracks; first card about 165×264.16 | Two 165px tracks; first card 165×264.38 | Base responsive card height matches |
| Card shadow | Layered 1px/2px shadow | None | Missing reference depth |
| Footer | 270×76 at x=60 | 300×84 at x=45 | WPB footer is too wide and tall |
| Validation toast | 85% viewport width, 331.5×46 at y=699.78, directly above modal footer | 366×56.38 at viewport top | Modal-relative placement and sizing are wrong |

## Source-Level Correction

1. Keep the shared `PDP_MODAL` bottom-sheet shell.
2. Correct modal-only card padding, gap, media ratio, shadow, and selected state in raw product-page CSS.
3. Keep selected cards height-stable by hiding the modal quantity row and using the configured selected-action pattern.
4. Route modal validation through a rule-derived message and a modal-owned toast target.
5. Correct the mobile footer dimensions and toast relationship with responsive modal tokens.

## Acceptance Gate

- Pre-deploy source probe after the fix matched the measured targets: desktop
  header 160px/body y=280, category tabs x=268/y=218, empty card about
  254.75×350.97, and mobile footer 270×76 with a 331.5×46 toast at y=700.
  This probe is supplemental and is not the live acceptance proof.
- Live hot-reload proof used a fresh Shopify dev-preview asset UUID and verified
  the served product-page bundle contained `syncProductPageSelectedOverlay`.
- Desktop 1280×800 matched the EB reference at the focused surfaces: 160px
  header, body y=280, x=268 category tabs, four 254.75px cards, selected 2px
  outline, 42px overlapping marker, hidden quantity row, `Added x1`, and a
  modal-owned 292.5×46 toast at x=493.75/y=672.
- Mobile 390×844 matched the focused card/toast surfaces: two 165px tracks,
  165×264.38 empty card, 270×76 footer at x=60/y=746, 331.5×46 toast at
  x=29.25/y=700, and height-stable selected state with a 42px marker.
- Step 1 retained two selections and two markers through Step 2 navigation and
  return. The long second category switched successfully and returning to
  Category 1 retained both selections.
- Responsive passes at 1440×900, 768×1024, 390×844, and 360×800 had no document
  overflow. The long category strip remained internally scrollable where
  needed.
- Console inspection found no app-owned errors or warnings; all app-owned
  bundle/config/product/collection requests returned 200/304.
