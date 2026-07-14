# HS01: Modal category controls and filtering

**Viewport:** 390 x 844 mobile emulation, DPR 3
**WPB widget:** 5.0.152

## EB source of truth

For the two-category Step 1 fixture, EB renders category controls between the
step selector and discount message:

- row x=20, width=350, height=35;
- 16px horizontal gap and horizontal scrolling;
- active Category 1 button approximately 91.88 x 33;
- inactive long-label button approximately 298.38 x 33;
- 5px padding, 1px border, 5px radius, 16px/700 text;
- active state uses the primary dark background and white text.

Selecting the second category replaces the product set without closing the
picker or changing the active step.

## WPB pre-fix gap

WPB rendered step tabs and discount messaging but no category controls anywhere
inside the modal DOM. All products for the step were rendered together. The
missing category row explained the apparent picker-header height delta; it was
not a padding-only issue.

## Source correction

- The bottom-sheet header now owns a dedicated category-tabs region.
- Multi-category steps render one button per category.
- Single-category steps hide the redundant category region.
- Active category indexes remain keyed by step, preserving independent state.
- Activating a category rerenders modal products through the existing category
  product-filter contract.
- The category row uses intrinsic button widths and horizontal overflow so long
  labels remain reachable without forcing the picker wider than its host.

## Live proof

The 5.0.152 accessibility snapshot exposes both `Category 1` and
`Category 2Long Label Empty Category` as buttons. Activating the second button:

- keeps Step 1 active;
- keeps the modal open;
- replaces the mixed first-category product set with the six `18k Pedal Ring`
  variants assigned to the second category;
- keeps the discount and footer state mounted.

## Verification

- Red: runtime test failed because `renderModalCategoryTabs` did not exist.
- Green: category rendering, activation, single-category hiding, and modal filter
  delegation pass.
- Existing Product List category filtering and category-variant display tests
  remain green.
- Raw widget source syntax checks pass.
- Widget build and CSS minification pass.

## 2026-07-13 desktop replay

At 1280 x 800, EB centers a two-column category wrapper inside the modal header:

- parent content width: 1240px from 20px modal gutters;
- category wrapper: 744px, `max-width: 60%`, two equal 363px tracks;
- gap: 16px;
- each button: 33px high;
- selecting the long second category changes the active colors and filters six Category 1 products to the single grouped `18k Pedal Ring` card.

WPB filtering and active-state colors match, but the pre-fix row used intrinsic text widths: approximately 94.86px and 312.44px, left-aligned at x=21. The desktop correction must use the same centered 60% equal-track wrapper while preserving the already accepted intrinsic, horizontally scrollable mobile row.

Widget `5.0.158` post-fix proof:

- desktop row: x=268, width=744px, height=35px;
- equal 363px tracks with 16px gap;
- buttons: x=269 and x=648, each 363 x 33px, matching EB;
- active colors and long-label filtering remain correct;
- after product hydration, Category 2 renders the single grouped `18k Pedal Ring` product;
- mobile regression at 390 x 844 retains the 350px horizontally scrollable flex row with intrinsic 94.86px and 312.44px buttons.
