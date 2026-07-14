# HS02 Picker Product-Card Grid Evidence

Date: 2026-07-13

## EB-first measurements

All states were measured with direct Chrome DevTools MCP after cache-bypassing reloads.

| Viewport | Modal grid | Columns | Gap | Card width |
| --- | --- | --- | --- | --- |
| 1440 x 900 | 1270px content region | 5 | 30px | 230px |
| 1280 x 800 | 1110px content region | 4 | 30px | 255px |
| 768 x 1024 | 728px content region | 2 | 20px | 354px |
| 390 x 844 | 350px content region | 2 | 20px | 165px |

EB uses content-driven desktop columns: a fifth column fits at 1440px, while 1280px naturally falls to four. Tablet and mobile use two columns with 20px modal gutters and a 20px gap.

At 390 x 844 the first EB card measured 165 x 264.16px with a 143 x 119.16px image region, 10px padding, a 1px border, and 10px radius.

## Exact pre-change WPB delta

WPB's bottom-sheet-specific selector forced five columns and 65px horizontal grid padding at every viewport. That selector had higher specificity than the generic responsive rules.

At 390 x 844 this produced:

- five 22px grid tracks;
- 30px gaps;
- 65px horizontal padding inside an already constrained modal body;
- 26px card boxes whose content visibly escaped the grid track;
- a nominal two-column media rule that never won the cascade.

At 1280 x 800 WPB rendered five 197.8px cards where EB rendered four 255px cards.

## Required correction

- Use intrinsic desktop columns with a measured 230px minimum.
- Remove desktop-only horizontal grid padding at tablet/mobile widths.
- Match EB's two-column, 20px-gap layout at 768px and below.
- Keep the modal body as the scroll owner and preserve the fixed footer clearance.

## Post-change verification

The raw bottom-sheet stylesheet was corrected and rebuilt as widget `5.0.156`.

Direct Chrome DevTools MCP replay after cache-bypassing reloads confirmed:

| Viewport | WPB columns | WPB card width | EB card width | Overflow |
| --- | --- | --- | --- | --- |
| 1440 x 900 | 5 | 229.8px | 230px | None |
| 1280 x 800 | 4 | 254.75px | 255px | None |
| 768 x 1024 | 2 | 348.5px | 354px | None |
| 390 x 844 | 2 | 165px | 165px | None |

The tablet width difference comes from the real modal scroll gutter: WPB's measured grid client region was 717px while EB's was 728px. Both retain two equal fluid tracks without clipping.

Final 390 x 844 comparison:

| Part | EB | WPB |
| --- | --- | --- |
| Card | 165 x 264.16px | 165 x 264.37px |
| Image | 143 x 119.16px | 143 x 119.37px |
| Title | 143 x 40px | 143 x 40px |
| Price row | 143 x 18px | 143 x 18px |
| Add action | 143 x 33px | 143 x 33px |

WPB now matches EB's 10px card padding, 1px border, 10px radius, `16px/700` title, `16px/700` price, and `16px/400` action treatment.

## Result

HS02 picker card grid and the baseline image/title/price/action hierarchy are accepted across the required viewport matrix. Sale-price, missing-image, and mixed-inventory states remain tracked in their dedicated rows.
