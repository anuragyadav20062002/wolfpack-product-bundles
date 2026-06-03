# Issue: Bundle Settings Slot Icon and Step Config EB Parity
**Issue ID:** bundle-settings-slot-icon-step-config-parity-1
**Status:** Completed
**Priority:** 🔴 High
**Created:** 2026-06-02
**Last Updated:** 2026-06-03 00:07

## Overview

Fix Bundle Settings > Enable Quantity Validation > Slot Icon so it behaves like EB in both FPB and PPB configure editors. Keep Step Setup > Step Config as an independent per-step image upload and verify its existing persistence contract.

## Progress Log

### 2026-06-02 22:46 - Audited EB evidence and current implementation
- Used the repository's completed EB E2E audit because Chrome DevTools is not connected in this workspace.
- EB evidence: Slot Icon changes the default icon rendered in empty slots and offers Change Icon plus Reset controls. Step Config is a separate per-step image upload persisted as `stepImage`.
- Found FPB defect: Slot Icon Change Icon navigates to `step_setup`, and Reset clears `settingsStep.stepImage`, incorrectly coupling Slot Icon to Step Config.
- Found PPB gap: `productSlotIconUrl` state, submit field, parser, and DB column exist, but the Slot Icon UI is missing.
- Impact analysis: touches the FPB and PPB configure-route god nodes plus FPB save handling. Storefront widget source is unchanged.
- Next: add TDD contract, wire dedicated slot-icon state and picker in both editors, preserve Step Config independence, and verify.

### 2026-06-02 22:55 - DCP decision confirmed; starting storefront propagation
- User confirmed the old Design Control Panel page has been removed in favor of Settings Page > Design.
- Slot Icon must remain a per-bundle Bundle Settings control like EB. No DCP control will be added.
- Admin-side dedicated Slot Icon picker and persistence wiring are implemented in FPB and PPB; 34 focused tests pass and Step Config remains independent.
- Found that the saved `productSlotIconUrl` was not emitted into public bundle config or consumed by the PPB empty-slot renderer.
- Next: add TDD coverage for config propagation and storefront rendering, implement the PPB widget change, bump widget patch version, rebuild widget assets, and verify.

### 2026-06-02 23:07 - Storefront propagation Red tests confirmed
- Added formatter, metafield-sync, PPB widget, and FPB widget tests for the saved bundle-level Slot Icon URL.
- Confirmed the expected Red state: all four tests fail because `productSlotIconUrl` is not emitted or rendered yet.
- Impact analysis: storefront propagation touches the shared bundle formatter, Shopify product metafield builder, FPB and PPB runtime save payloads, and both widget source files.
- Next: emit the direct field, render the uploaded image with the existing plus icon as the empty-value default, bump the widget patch version, and rebuild widget assets.

### 2026-06-02 23:18 - Implemented and verified Slot Icon parity
- Propagated `productSlotIconUrl` through proxy formatting, Shopify `bundle_ui_config`, FPB save runtime config, PPB save runtime config, and PPB sync runtime config.
- Updated FPB and PPB storefront widgets to render the uploaded bundle-level Slot Icon in empty slots while preserving the plus icon when no upload is saved.
- Kept Step Setup > Step Config independent: its per-step `stepImage` persistence contract remains unchanged.
- Bumped widget version from `2.9.10` to `2.9.11` and rebuilt deployable widget assets.
- Updated the app navigation map and rebuilt graphify outputs.
- Verification: 140 focused Jest tests passed; ESLint completed with 0 errors; `git diff --check` passed.

### 2026-06-03 00:07 - Preparing commit
- Staging only the Slot Icon and Step Config parity changes for commit.
- Leaving unrelated Admin UI i18n worktree changes unstaged.
- Commit will include the issue file, test spec, admin controls, runtime config propagation, widget source and rebuilt widget assets, focused tests, and the Slot Icon navigation-map update.

## Related Documentation

- `docs/competitor-analysis/14-eb-addon-upsell-analysis.md`
- `docs/competitor-analysis/17-eb-complete-configure-e2e-audit.md`
- `docs/issues-prod/eb-configure-sections-parity-1.md`

## Phases Checklist

- [x] Phase 1: EB evidence review and impact analysis
- [x] Phase 2: TDD slot-icon contract
- [x] Phase 3: FPB and PPB dedicated slot-icon picker implementation
- [x] Phase 4: Step Config independence verification
- [x] Phase 5: Lint, tests, graph refresh
