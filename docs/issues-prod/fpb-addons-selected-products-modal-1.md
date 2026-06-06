# Issue: FPB Add-ons Selected Products Modal Picker Stack
**Issue ID:** fpb-addons-selected-products-modal-1
**Status:** Completed
**Priority:** 🔴 High
**Created:** 2026-06-05
**Last Updated:** 2026-06-05 10:02

## Overview
Fix the Free Gift & Add Ons tier selected-products modal when merchants add products from inside the modal. The current flow opens the Shopify resource picker while the app's `s-modal` remains open, causing an empty picker shell to remain after selection.

## Progress Log
### 2026-06-05 09:48 - Root cause reproduced
- Chrome reproduction: open Free Gift & Add Ons, click `1 Selected`, click modal `Add Products`, then click picker `Add`.
- Result: selected-products modal remains underneath and an empty Shopify picker dialog `:r53:` stays above it.
- Root cause: App Bridge resource picker is launched while the selected-products `s-modal` is still open.
- Next: add source guard and close/reopen the selected-products modal around picker invocation.

### 2026-06-05 09:53 - Fixed and verified
- Added focused source guard for closing the selected-products modal before launching the Shopify resource picker from inside it.
- Updated `handleAddonSelectedProductAdd` to hide the selected-products modal before picker launch and reopen it after picker completion for modal-launched flows.
- Chrome verified the broken flow no longer leaves an empty picker shell after pressing picker `Add`.
- Proof screenshot: `/private/tmp/wpb-addons-selected-products-modal-fixed-2026-06-05.png`.

### 2026-06-05 09:54 - Close behavior follow-up
- User reported the Selected Products modal is not closing after it is opened.
- Next: reproduce the close failure, identify whether the close button, modal dismiss event, or reopen logic is keeping it open, then add a focused guard before patching.

### 2026-06-05 09:59 - Close behavior fixed
- Reproduced that the modal stayed open after clicking footer Close and header Close.
- Confirmed Shopify modal examples use `commandFor` with `command="--hide"` for modal action buttons.
- Added `id="addon-selected-products-modal"` to the selected-products modal and wired footer Close with `variant="secondary"`, `commandFor="addon-selected-products-modal"`, and `command="--hide"`.
- Kept direct `hidePolarisModal(addonSelectedProductsModalRef)` in the close handler so React state and the web component overlay are both closed.
- Chrome verified footer Close now dismisses the modal and returns focus to `1 Selected`.
- Proof screenshot: `/private/tmp/wpb-addons-selected-products-modal-close-fixed-2026-06-05.png`.

### 2026-06-05 10:02 - Focused verification complete
- Ran focused unit regression: `npx jest --selectProjects unit --runTestsByPath tests/unit/routes/fpb-addons-selected-products-modal.test.ts`.
- Result: 4 tests passed.
- Ran lint on modified route and selected-products modal test: `npx eslint --max-warnings 9999 'app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/route.tsx' tests/unit/routes/fpb-addons-selected-products-modal.test.ts`.
- Result: 0 errors, 979 warnings.
- Chrome verified the modal opens from `1 Selected` and footer Close dismisses it.
- Final proof screenshot: `/private/tmp/wpb-addons-selected-products-modal-close-final-2026-06-05.png`.

## Related Documentation
- `test-spec/fpb-addons-selected-products-modal.spec.md`

## Phases Checklist
- [x] Phase 1: Source guard for closing selected-products modal before picker launch
- [x] Phase 2: Implement modal close/reopen behavior
- [x] Phase 3: Chrome verify selected-products picker flow
- [x] Phase 4: Close behavior verified
- [x] Phase 5: Lint and commit-ready status
