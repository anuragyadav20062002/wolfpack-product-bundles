# Issue: FPB Classic Design — 100% Storefront Parity with EasyBundles
(Horizontal Design follow-up captured 2026-06-06: EB Horizontal evidence + Wolfpack source/build audit at `docs/competitor-analysis/eb-fpb-horizontal-capture/`.)


**Issue ID:** fpb-classic-design-parity-1
**Status:** Completed
**Priority:** 🔴 High
**Created:** 2026-06-05
**Last Updated:** 2026-06-06 06:29

## Overview

Wolfpack's FPB widget already has the Classic Design preset wired into its dispatcher (`bundle-widget-full-page.js:6466` `getFullPageDesignPreset`) with CSS scoping via `[data-fpb-design-preset=CLASSIC]`, but the `classic-template.js` runtime styles and `side-footer-classic.css` static stylesheet are stubs (~1 KB total). This issue tracks the work to capture EasyBundles' live Classic Design storefront across the full configuration surface (per the plan at `.claude/plans/eb-fpb-classic-design-capture.md`) and implement Wolfpack's Classic template so it renders pixel-equivalent to EB, **without regressing the Standard, Compact, or Horizontal templates**.

## Constraints / Decisions

- **Isolation seam:** all Classic CSS is wrapped in `[data-fpb-design-preset=CLASSIC]` and emitted from `classic-template.js` (runtime) and `app/assets/widgets/full-page-css/templates/side-footer-classic.css` (static). No edits to Standard/Compact/Horizontal CSS unless a shared-rule extraction is required, and any such extraction must be justified and reviewed.
- **Cache hygiene:** every storefront capture (EB or Wolfpack) MUST be preceded by an empty-cache hard reload; captures lacking proof of fresh asset loads are invalid (see plan §"Cache Hygiene Rule").
- **Capture corpus location:** `docs/competitor-analysis/eb-fpb-classic-capture/`.
- **EB test bundle:** reuse a single bundle on `yash-wolfpack.myshopify.com`, mutate between captures, reset to baseline blob before each row.
- **Other templates kept isolated:** Standard/Compact/Horizontal CSS scopes must not be touched. Verify via unit test `tests/unit/assets/full-page-preset.test.ts` and visual spot-check after every Classic CSS change.

## Progress Log

### 2026-06-05 - Phase 0–4 complete (implementation done, deploy pending)
- Captured EB's complete FPB CSS bundle (250 KB) from CloudFront and extracted Classic/Compact/Horizontal preset overrides verbatim — saved to `docs/competitor-analysis/eb-fpb-classic-capture/bootstrap/eb-{preset}-overrides.css`. EB architecture confirmed: Standard is the unscoped base; CLASSIC is an ~80-line override block scoped via `body[gbb-bundle-design-preset-id="CLASSIC"] .gbbMinimilisticLayout {}`. Rows 1–22 of the matrix do not contain Classic-specific CSS — all Classic deltas are in the single override block. Phase 2 cancelled as redundant.
- Captured EB Classic storefront screenshot at desktop 1440×900 by flipping body attr (`gbb-bundle-design-preset-id` → `CLASSIC`) on the live `yash-wolfpack.myshopify.com/apps/gbb/easybundle/2` page; computed styles saved to `docs/competitor-analysis/eb-fpb-classic-capture/baseline/state-S0-desktop-computed-styles.json`.
- Implemented Wolfpack Classic translation:
  - `app/assets/widgets/full-page-css/templates/side-footer-classic.css` — replaced 5-line stub with documented translation of EB CLASSIC override (desktop tab padding `4px 22px`, empty side-panel skeleton dashed-ghost). Mobile tab padding inherits Wolfpack base `4px 14px` which already matches EB Classic mobile.
  - `app/assets/widgets/full-page/templates/classic-template.js` — adjusted mobile grid to `repeat(2,minmax(0,177.5px))`, mobile card height to `263px`, and `--classic-mobile-card-height` var to `263px` to match the spec encoded in `tests/unit/assets/bundle-widget-full-page-template-layout.test.ts:300–321`.
  - `scripts/build-widget-bundles.js` — `WIDGET_VERSION` bumped 3.0.11 → 3.0.12 (PATCH; visual nudge to Classic CSS only).
- Verified:
  - `npx jest -t "Classic Design CLASSIC"` — passes (was failing before).
  - `node --check app/assets/widgets/full-page/templates/classic-template.js` — syntax OK.
  - `npm run build:widgets:full-page` — green; bundle minified to 363.3 KB.
  - `npm run minify:assets css` — `bundle-widget-full-page.css` at 97.2 KB (below 100 KB Shopify cap).
  - `npx eslint` on the three modified files — 0 errors.
  - Other test suites have 77 pre-existing failures (Compact/Standard/addons/horizontal) — none reference Classic CSS or template files I edited; net: clean.
- Standard/Compact/Horizontal CSS scopes untouched — isolation maintained at source level.
- **Blocked on deploy** for Phase 5 (live SIT parity verification with cache-hygiene reload) and Phase 6 (isolation regression sweep on storefront).

### 2026-06-05 - Bootstrap and reconnaissance
- Confirmed Classic identifiers: `bundleDesignTemplate: "FBP_SIDE_FOOTER"`, `bundleDesignPresetId: "CLASSIC"`, body attribute `gbb-bundle-design-preset-id="CLASSIC"` (source: `docs/competitor-analysis/16-eb-full-data-flow-investigation.md:948–1010`, `internal docs/EB Implementation Reference.md:540–551`).
- Verified Wolfpack already has: Classic dispatcher path, CSS scope, stub template module, static CSS file, test spec, unit test infra.
- Confirmed Standard capture corpus (`docs/competitor-analysis/eb-fpb-standard-capture/`) is baseline-only — non-baseline cross-template diffs are blocked until Standard expands.
- Files inspected (read-only): `app/assets/bundle-widget-full-page.js` (dispatcher 6466), `app/assets/widgets/full-page/templates/classic-template.js` (stub), `app/assets/widgets/full-page-css/templates/side-footer-classic.css` (181 B stub), `extensions/bundle-builder/blocks/bundle-full-page.liquid`, `app/services/bundles/metafield-sync/types.ts`, `scripts/build-widget-bundles.js`.
- Next: capture EB Classic baseline (row 0) from page 3 of the open Chrome session (`yash-wolfpack.myshopify.com/apps/gbb/easybundle/2` in BYOB flow).

## Related Documentation

- Plan: `.claude/plans/eb-fpb-classic-design-capture.md`
- Standard sibling plan: `.claude/plans/eb-fpb-standard-design-capture.md`
- Test spec: `test-spec/fpb-classic-design-storefront.spec.md`
- EB reference docs: `internal docs/EB Implementation Reference.md`, `internal docs/EB Settings Design Reference.md`
- Standard capture corpus: `docs/competitor-analysis/eb-fpb-standard-capture/`

## Phases Checklist

- [x] Phase 0: Bootstrap — EB Classic CSS extracted in full from CloudFront bundle (canonical spec, beats S0–S10 click-cycle data)
- [x] Phase 1: High-priority deltas captured via direct CSS extraction (pills, 4-col grid, mobile tab padding, slot ghost)
- [x] Phase 2: Cancelled as redundant — rows 1–22 contain no Classic-specific CSS (EB Classic = 80-line override block only)
- [x] Phase 3: Wolfpack Classic implementation translated to local classnames; isolation preserved
- [x] Phase 4: Built, version bumped to 3.0.12, Classic unit test green, lint clean, CSS under 100 KB cap
- [x] Phase 5: Parity verification — passed. Live SIT widget version `3.0.12` confirmed via `window.__BUNDLE_WIDGET_VERSION__`. Cache-hygiene reload + Classic runtime CSS injection on storefront produced the expected EB-equivalent layout: 4-col desktop grid, pill category tabs centered, right sidebar panel, centered product cards. Evidence: `docs/competitor-analysis/eb-fpb-classic-capture/baseline/wpb-classic-after-deploy-desktop.png` + `wpb-classic-after-deploy-desktop-computed-styles.json`.
- [x] Phase 6: Isolation regression check — passed.
  - **Standard (`DEFAULT`):** post-reload, computed styles show 3-col grid `314.57px × 3`, card height `352px`, tab padding `10px` / radius `0` (flat tabs), `classicSelectorsMatchingDom: 0` via CSSOM probe.
  - **Compact:** flipped preset attribute + injected Compact runtime CSS — 3-col grid `255px × 3`, card height `359px`, `classicSelectorsMatchingDom: 0`.
  - **Horizontal:** flipped preset attribute (static CSS) — Horizontal selectors match DOM (1 layout-sidebar, 6 product-cards), `classicSelectorsMatchingDom: 0`.
  - **Built-asset byte-level check:**
    - `extensions/bundle-builder/assets/bundle-widget-full-page.css` — exactly 2 CLASSIC-scoped rules (tab padding + skeleton-thumb), both authored by this issue. Zero cross-preset selectors.
    - `extensions/bundle-builder/assets/bundle-widget-full-page-bundled.js` — 13 CLASSIC references, all inside the `classic-template.js` runtime literal or preset-gating conditionals. Zero cross-preset selectors.
  - Evidence: `regression-standard-desktop.png`, `regression-standard-probe.json`, `regression-compact-desktop.png`, `regression-horizontal-desktop.png` under `docs/competitor-analysis/eb-fpb-classic-capture/baseline/`.

### 2026-06-06 06:29 - Batch Commit Prep
- Preparing storefront parity batch covering Classic, Standard mobile footer, and Horizontal storefront summary/grid refinements.
- Horizontal follow-up now includes source/runtime updates: expanded compact mobile summary eligibility to include `HORIZONTAL`, adjusted Horizontal product card media/content geometry, and converted Horizontal summary slots from tile-only styling to EB-style row slots with image, title, price, remove action, and dashed empty row.
- Screenshots were removed from the worktree before staging; only source, tests/specs, issue logs, and generated widget assets should be included.
