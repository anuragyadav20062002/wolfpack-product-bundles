# PLS1 Combined Product List Stress Evidence

Date: 2026-07-13

Scope: Product Page Bundle Product List only (`PDP_INPAGE + CASCADE`).

Chrome DevTools MCP evidence:
- EB desktop initial snapshot: `/private/tmp/ppb-product-list-agentic-parity/PLS1-combined/eb-desktop-initial-snapshot-2026-07-13.txt`
- WPB desktop initial snapshot: `/private/tmp/ppb-product-list-agentic-parity/PLS1-combined/wpb-desktop-initial-snapshot-5-0-147-2026-07-13.txt`
- EB mobile final state: `/private/tmp/ppb-product-list-agentic-parity/PLS1-combined/eb-mobile-final-390-2026-07-13.json`
- WPB mobile final state: `/private/tmp/ppb-product-list-agentic-parity/PLS1-combined/wpb-mobile-final-390-5-0-147-2026-07-13.json`

## Combined Fixture

Both fixtures exercised the Product List features together rather than as isolated rows:
- two active steps;
- Step 1 quantity greater than or equal to `2`;
- Step 2 quantity equal to `1`;
- percentage discount tiers at quantities `2` and `3`;
- grouped variants and a native variant selector on Step 1;
- mixed inventory on Step 2, including one grouped product with a single sellable surviving variant;
- cross-step selected-items drawer persistence;
- Product List loading during the Step 2 transition.

## Desktop Result

EB:
- Two selected Step 1 products enabled `Next` and showed the 5% tier.
- Entering Step 2 preserved all selected drawer rows.
- The mixed-inventory list rendered the sellable rows only, including `Massage Oil / Grapefruit` as static variant identity.
- Selecting exactly one Step 2 product produced three selected products, the 10% success message, and an enabled `Add Bundle to Cart` CTA.

WPB on widget `5.0.147`:
- Two selected Step 1 products enabled `Next` and showed the same 5% progression state.
- Entering Step 2 preserved both selected drawer rows while the Product List target showed its loading status.
- The settled list omitted the fully unavailable product and rendered `Selling Plans Ski Wax / Special Selling Plans Ski Wax` as static sole-variant identity.
- Selecting exactly one Step 2 product produced three selected products, `Success! Your 10% discount has been applied to your cart.`, and enabled `Add Bundle to Cart` with the 10% tier.

## Mobile Result

At `390 x 844`:
- EB retained the three cross-step selections, the sole-variant label, the 10% success message, and the final enabled CTA.
- WPB retained `PDP_INPAGE + CASCADE`, widget `5.0.147`, three selected drawer rows, the sole-variant label, the 10% success message, and the enabled final CTA.
- WPB Step 2 rows remained `358 x 70px` inside the `358px` widget width.
- The WPB final CTA remained within the widget at `305 x 38px`.

## Decision

PLS1 is accepted for the Product List combination that EB actually supports. PPB box-selection tiers are excluded because PL06 proved that feature is inert and FPB-only; Product List quantity validation is represented by the live Step 1 and Step 2 rules.

The Step 2 transition also re-proves PLS5: the app-owned loading status renders in the Product List target while the drawer and footer remain in place, then the final rows replace that same target. No runtime source patch is required.
