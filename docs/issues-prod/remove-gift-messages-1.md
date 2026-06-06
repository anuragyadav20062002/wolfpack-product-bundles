# Issue: Remove Gift Messages Feature
**Issue ID:** remove-gift-messages-1
**Status:** Completed
**Priority:** High
**Created:** 2026-06-05
**Last Updated:** 2026-06-05 03:46

## Overview
Remove the gift/message-product Messages feature from the app for now. This includes Admin Messages sections, save/runtime gift-message serialization, storefront gift-message rendering, cart gift-message line items, and related tests/styles. Discount/pricing message templates are a separate pricing feature and remain in scope for the app.

## Progress Log
### 2026-06-05 03:33 - Removal started
- User requested removing the Messages section altogether and all related code from the app.
- Identified two message concepts: gift/message-product Messages and discount/pricing messages.
- Scope selected: remove gift/message-product messaging; keep discount/pricing progress and success copy.
- Next: create removal test spec and failing tests before production code edits.

### 2026-06-05 03:35 - RED removal tests verified
- Created `test-spec/remove-gift-messages.spec.md`.
- Added RED removal-contract test: `tests/unit/routes/remove-gift-messages.test.ts`.
- Focused RED command failed as expected: `npx jest --selectProjects unit --runTestsByPath tests/unit/routes/remove-gift-messages.test.ts`.
- Failures confirm gift-message code still exists in FPB Admin, FPB widget runtime/cart code, PPB widget runtime/cart code, and widget CSS.
- Next: remove the gift/message-product Messages feature surfaces.

### 2026-06-05 03:46 - Removal implemented and verified
- Removed FPB and PPB Admin Messages sections, gift-message state, save serialization, parsers, handler writes, metafield sync fields, widget rendering, widget validation, cart line-item logic, and widget CSS.
- Removed Bundle gift-message Prisma fields and added migration `prisma/migrations/20260605090000_remove_gift_messages/migration.sql`.
- Removed stale gift-message tests/spec rows and added removal guard coverage in `tests/unit/routes/remove-gift-messages.test.ts`.
- Bumped `WIDGET_VERSION` to `3.0.0`, rebuilt widget JS bundles, minified widget CSS, and rebuilt `graphify-out`.
- Verified:
  - `npx jest --selectProjects unit --runTestsByPath tests/unit/routes/remove-gift-messages.test.ts tests/unit/routes/fpb-addons-admin-layout.test.ts tests/unit/routes/fpb-save-bundle.test.ts tests/unit/routes/ppb-save-bundle.test.ts tests/unit/services/bundle-product-metafield.test.ts tests/unit/assets/bundle-widget-product-page-init.test.ts`
  - `node --check app/assets/bundle-widget-full-page.js`
  - `node --check app/assets/bundle-widget-product-page.js`
  - `npm run build:widgets`
  - `npm run minify:assets css`
  - `npx eslint --max-warnings 9999 <modified source/test files>`
  - `npx prisma validate`
  - `python -c "from graphify.watch import _rebuild_code; from pathlib import Path; _rebuild_code(Path('.'))"`

## Related Documentation
- `test-spec/remove-gift-messages.spec.md`
- `docs/issues-prod/fpb-addons-messages-email-capture-parity-1.md`
- `docs/issues-prod/eb-ui-clone-rewrite-1.md`

## Phases Checklist
- [x] Phase 1: Add removal test spec and RED tests
- [x] Phase 2: Remove Admin gift-message sections and save serialization
- [x] Phase 3: Remove storefront gift-message runtime/cart behavior and styles
- [x] Phase 4: Rebuild widget assets and graph outputs
- [x] Phase 5: Verify, lint, and commit
