# SDE Implementation Plan: EB Evidence UI Clone Rewrite

**Feature ID:** eb-ui-clone-rewrite
**Issue:** eb-ui-clone-rewrite-1
**Status:** Ready for TDD Start
**Created:** 2026-05-26
**Author:** Feature Pipeline

## Pre-Implementation Checklist

- [x] Read `CLAUDE.md` and current repo rules.
- [x] Create `docs/issues-prod/eb-ui-clone-rewrite-1.md` before file modifications.
- [x] Read the repo-local `feature-pipeline` skill.
- [x] Read the Shopify skill entrypoint because this touches embedded Admin, app proxy, Liquid assets, and storefront widgets.
- [x] Review `internal docs/Architecture/Widget Architecture.md`, `internal docs/Architecture/Database Schema.md`, and `internal docs/Features/Pricing Pipeline.md`.
- [x] Review graph god nodes and run graph path checks for widget/schema route blast radius.
- [ ] Create `test-spec/eb-ui-clone-rewrite.spec.md`.
- [ ] Add RED tests before implementation code.
- [ ] Confirm current `WIDGET_VERSION` before widget edits.

## Phase 1: Contract Tests

Create `tests/unit/lib/bundle-config-contracts.test.ts` with RED tests for:
- FPB and PPB template mapping.
- control dependency states.
- category source contracts.
- default/preselected product contracts.
- Bundle Quantity Options and Buy X, get Y mutual exclusion.
- global cart-line messaging serialization.
- FPB config-load invariant: metafield cache remains before proxy fallback.

Expected first command:

```bash
npx jest tests/unit/lib/bundle-config-contracts.test.ts --runInBand
```

## Phase 2: Pure Helpers

Create the smallest helper modules needed to pass Phase 1:
- `app/lib/bundle-config/evidence-template-mapping.ts`
- `app/lib/bundle-config/control-dependencies.ts`
- `app/lib/bundle-config/category-contracts.ts`
- `app/lib/bundle-config/cart-line-messaging.ts`

Rules:
- no competitor names in code
- no fallback shims
- no route or widget edits until helpers pass focused tests

## Phase 3: Save Contract Integration

Add or update integration tests that prove Admin payloads write the direct DB/metafield contracts. Then update:
- FPB configure handlers
- PPB configure handlers
- metafield sync writers
- Prisma schema/migrations only where current schema lacks direct fields

## Phase 4: Admin Configure UI

Replace FPB and PPB configure sections in evidence-backed slices:
1. shared shell, left rail, readiness score, save/discard
2. Step Setup and category contracts
3. Discount & Pricing dependency wiring
4. Bundle Visibility and Bundle Widget/Embed
5. Bundle Settings and global Edit Defaults
6. Subscriptions
7. Select Template

Run route/UI contract tests and modified-file ESLint after each slice.

## Phase 5: Storefront Runtime

FPB:
- templates, variants-as-cards, collections, defaults, BQO, progress, BXY, add-ons, non-email messages, banner placement, upsell redirect.

PPB:
- Product List, Product Grid, Horizontal Slots, Vertical Slots, in-page/modal dispatch, default products, quantity validation, BQO, BXY, widget/embed branches.

Maintain the FPB config-load order. Bump widget version before deploy handoff because this is a breaking redesign.

## Phase 6: Evidence Loop

For every manifest row:
1. Create the same WPB configuration as the audit evidence.
2. Capture Admin screenshot.
3. Capture network payload or DB/metafield proof.
4. Capture runtime JSON.
5. Capture desktop storefront at 1280x800 or larger.
6. Capture mobile storefront at 390x844.
7. Capture cart JSON when relevant.
8. Compare DOM, screenshots, and measured computed styles.
9. Patch only the mismatch, rebuild, reload, and repeat.

Rows with missing proof stay blocked.

## Required Final Verification

```bash
npx jest tests/unit/lib/bundle-config-contracts.test.ts --runInBand
npx jest tests/integration/bundle-config-save-contract.test.ts --runInBand
npx eslint --max-warnings 9999 <modified files>
npm run build
npm run build:widgets
npm run minify:assets css
wc -c extensions/bundle-builder/assets/bundle-widget-full-page.css extensions/bundle-builder/assets/bundle-widget.css
python3 -c "from graphify.watch import _rebuild_code; from pathlib import Path; _rebuild_code(Path('.'))"
```

Do not run `shopify app deploy`. Provide manual deploy instructions only after verified builds.
