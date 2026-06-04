# Issue: FPB Template Deep Parity Audit
**Issue ID:** fpb-template-deep-parity-audit-1
**Status:** Completed
**Priority:** High
**Created:** 2026-06-04
**Last Updated:** 2026-06-04 06:35

## Overview
Deep-audit all FPB storefront templates against live EB behavior and close any missed UI, JS, or runtime data-wiring gaps from the earlier Standard, Classic, Compact, and Horizontal implementation slices.

## Progress Log
### 2026-06-04 06:16 - Started deep parity audit
- Read the grounded EB implementation reference for FPB template architecture: all four FPB templates use `bundleDesignTemplate: "FBP_SIDE_FOOTER"` and differ by `bundleDesignPresetId`.
- Read prior per-template issue logs and recent commits for Standard, Classic, Compact, Horizontal, modularization, and banner wiring.
- Confirmed this pass must be evidence-backed and must not rewrite template code based only on old static CSS notes.
- Next: capture fresh live EB desktop/mobile evidence template-by-template, compare against WPB source/runtime contracts, then patch confirmed gaps in narrow commits.

### 2026-06-04 06:30 - Completed live EB FPB template measurements
- Captured live EB storefront desktop and mobile DOM/computed-style evidence for `DEFAULT`, `CLASSIC`, `COMPACT`, and `HORIZONTAL` on the configured FPB bundle.
- Confirmed Standard desktop is container-responsive in EB: at 1280 viewport the body columns are `813.938px 366.266px`, the product grid is 3 columns of `261.312px`, and card images are `245.312px x 240px`.
- Confirmed Classic and Compact source contracts are broadly aligned with live EB for desktop ratios, mobile card sizes, pill tabs, and side-panel sizing.
- Confirmed Horizontal EB uses `object-fit: cover` for product images on both desktop (`105.609px x 140px`) and mobile (`103.797px x 120px`), while WPB source still uses `contain`.
- Next: add/update source-contract tests, patch Standard responsive sizing and Horizontal image fit, rebuild widget assets, then commit this narrow gap fix.

### 2026-06-04 06:35 - Patched confirmed deep-audit gaps
- Updated FPB Standard runtime styles to use EB's responsive desktop body ratio and container-responsive three-column product grid instead of fixed desktop pixel columns/cards.
- Updated FPB Horizontal runtime and static template CSS to use `object-fit: cover` for product images, matching live EB desktop and mobile computed styles.
- Updated the FPB template layout contract test and related test specs with the fresh deep-audit evidence.
- Bumped `WIDGET_VERSION` to `2.9.70`, rebuilt widget bundles, and minified CSS assets.
- Verification so far: focused Jest contract passed, raw full-page widget syntax check passed, ESLint returned zero errors for modified lintable files, and generated full-page CSS is `99,986` bytes.
- Ready to commit as the first deep-parity hardening slice.

## Audit Matrix
| Template | EB preset | EB desktop evidence | EB mobile evidence | Runtime/data wiring checked | Confirmed gaps | Patch status |
|---|---|---|---|---|---|---|
| Standard Design | `DEFAULT` | Captured: `813.938px 366.266px` body columns, 3 x `261.312px` cards, `245.312px x 240px` images | Captured: 2 x `177.5px` cards, `161.5px x 150px` images | Checked against runtime source | WPB runtime used fixed `993px 447px` and fixed `321px` desktop cards instead of EB's responsive ratio/container math | Patched |
| Classic Design | `CLASSIC` | Captured: `813.938px 366.266px` body columns, 4 x `182.05px` cards, pill tabs | Captured: 2 x `177.5px` cards, `161.5px x 150px` images | Checked against runtime source | No confirmed source gap in this pass | No patch needed |
| Compact Design | `COMPACT` | Captured: `699.125px 466.094px` body columns, 30px body gap, 3 x `223.03px` cards | Captured: 2 x `177.5px` cards, wider pill tabs | Checked against runtime source | No confirmed source gap in this pass | No patch needed |
| Horizontal Design | `HORIZONTAL` | Captured: `767.141px 413.062px` body columns, 2 x `376.06px` row cards, image `object-fit: cover` | Captured: 1 x `370px` row card, `103.797px x 120px` image, `object-fit: cover` | Checked against runtime and static template CSS | WPB source used `object-fit: contain` | Patched |

## Related Documentation
- `internal docs/EB Implementation Reference.md`
- `docs/competitor-analysis/16-eb-full-data-flow-investigation.md`
- `docs/issues-prod/fpb-standard-design-storefront-parity-1.md`
- `docs/issues-prod/fpb-classic-design-storefront-parity-1.md`
- `docs/issues-prod/fpb-compact-design-storefront-parity-1.md`
- `docs/issues-prod/fpb-horizontal-design-storefront-parity-1.md`
- `test-spec/fpb-standard-design-storefront.spec.md`
- `test-spec/fpb-classic-design-storefront.spec.md`
- `test-spec/fpb-compact-design-storefront.spec.md`
- `test-spec/fpb-horizontal-design-storefront.spec.md`

## Phases Checklist
- [x] Live EB Standard desktop/mobile audit completed
- [x] Live EB Classic desktop/mobile audit completed
- [x] Live EB Compact desktop/mobile audit completed
- [x] Live EB Horizontal desktop/mobile audit completed
- [x] WPB source/runtime gap comparison completed
- [x] Confirmed gaps patched with RED/GREEN tests
- [x] Widget assets rebuilt and minified
- [x] Verification completed
- [x] Changes committed
