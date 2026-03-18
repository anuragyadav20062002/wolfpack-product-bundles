# SDE Implementation Plan: Toast DCP Customization

## Overview
8 new toast settings across DB → TypeScript → CSS generator → widget CSS/JS → DCP UI layers. No tests required (all CSS/UI/data changes per CLAUDE.md TDD exceptions).

## Phase 1: Schema + Types + Defaults + Merge
- `prisma/schema.prisma` — 8 new columns
- `app/types/state.types.ts` — 8 new fields
- `app/components/design-control-panel/config/defaultSettings.ts` — both defaults objects
- `app/components/design-control-panel/config/mergeSettings.ts` — direct column reads

## Phase 2: CSS Variable Generation + API Route
- `app/lib/css-generators/css-variables-generator.ts` — 8 new variables
- `app/routes/api/api.design-settings.$shopDomain.tsx` — inline defaults sync

## Phase 3: Handler + Widget CSS + Widget JS
- `app/routes/app/app.design-control-panel/handlers.server.ts` — `buildSettingsData`
- `extensions/bundle-builder/assets/bundle-widget.css` — CSS variable migration + from-bottom
- `extensions/bundle-builder/assets/bundle-widget-full-page.css` — same
- `app/assets/widgets/shared/toast-manager.js` — read CSS var, add class
- `scripts/build-widget-bundles.js` — WIDGET_VERSION → 2.0.0

## Phase 4: DCP UI — Settings Panel + Preview
- `app/components/design-control-panel/settings/ToastsSettings.tsx` — 8 new controls
- `app/components/design-control-panel/preview/GeneralPreview.tsx` — update toast preview

## Phase 5: Build + Lint + Commit
- `npm run build:widgets` — rebuild both widget bundles
- `npx eslint --max-warnings 9999` — zero errors on modified files
- `npx tsc --noEmit` — zero new TS errors
- Update issue file + commit

## Build & Verification Checklist
- [ ] `prisma migrate dev` creates migration cleanly
- [ ] TypeScript compiles without new errors
- [ ] ESLint: 0 errors on all modified files
- [ ] Widget rebuild succeeds, `window.__BUNDLE_WIDGET_VERSION__` = "2.0.0"
- [ ] DCP preview: toast updates in real time for all 8 new settings
- [ ] Storefront: toast slides from bottom when `toastEnterFromBottom` is ON
- [ ] Storefront: animation duration matches configured value
- [ ] Existing settings (bg color, text color) still work

## Rollback
Revert the 8 new Prisma columns (prisma migrate dev --name revert, or just delete migration file + `prisma db push --force-reset` on SIT). Widget CSS/JS changes can be reverted by rebuilding from the previous git state.
