# Test Spec: Edit Bundle Flow — FPB & PPB

**Spec ID:** edit-bundle-flow
**Issue:** [edit-bundle-flow-tests-1]
**Created:** 2026-05-18

## Purpose

End-to-end coverage of the edit-bundle action flow for both Full Page Bundle (FPB) and
Product Page Bundle (PPB) configure routes. The flow encompasses:
1. Input validation and normalisation at the boundary (`normaliseShopifyProductId`, `safeJsonParse`)
2. The primary save handler (`handleSaveBundle`) — DB writes, auto-activate logic, metafield
   sync, and error propagation
3. Bundle status transitions (`handleUpdateBundleStatus`) — status mapping to Shopify
4. Product sync (`handleSyncProduct`) — Shopify fetch, no-product creation, stale-product cleanup

All tests run against mocked Prisma and mocked Shopify admin. No real DB or network calls.

---

## Test Cases

### Suite 1 — `normaliseShopifyProductId` (pure)

| # | Scenario | Input | Expected |
|---|----------|-------|----------|
| 1 | GID passthrough | `gid://shopify/Product/123456` | returns same GID unchanged |
| 2 | Numeric → GID | `123456` | returns `gid://shopify/Product/123456` |
| 3 | UUID rejected | `550e8400-e29b-41d4-a716-446655440000` | throws with "corrupted browser state" |
| 4 | Malformed GID | `gid://shopify/Product/abc` | throws with "must be numeric" |
| 5 | Empty string | `""` | throws with "non-empty string" |
| 6 | Null/undefined | `null` | throws with "non-empty string" |
| 7 | Random string | `"not-a-product-id"` | throws with "Expected Shopify GID" |

### Suite 2 — `safeJsonParse` (pure)

| # | Scenario | Input | Expected |
|---|----------|-------|----------|
| 1 | Valid JSON string | `'[{"id":1}]'` | parsed array |
| 2 | Already-parsed object | `{key: "val"}` | same object reference |
| 3 | Null/falsy | `null` | returns default |
| 4 | Malformed JSON | `'{bad'` | returns default, no throw |
| 5 | Custom default | `null`, default `{}` | returns `{}` |

### Suite 3 — FPB `handleSaveBundle` (mocked DB + admin)

| # | Scenario | Setup | Expected |
|---|----------|-------|----------|
| 1 | Happy path — no shopifyProductId | draft bundle, 1 step with product, no product ID | DB.update called; returns success JSON; NO metafield calls |
| 2 | Auto-activate on products | status=draft + step has StepProduct | finalStatus=active, DB update called with `status: 'active'` |
| 3 | No auto-activate when no products | status=draft + empty steps | stays draft |
| 4 | StepCategory creates records | step.StepCategory present | DB.update called with nested StepCategory.create |
| 5 | Fixed bundle price stored | discountType=fixed_bundle_price | rule gets `fixedBundlePrice` field set |
| 6 | UUID product ID rejected | StepProduct.id is UUID | returns 500 with "corrupted browser state" |
| 7 | DB.update throws | DB throws generic error | returns 500 JSON with error message |
| 8 | With shopifyProductId — products present | productId set, step has products | metafield calls invoked; returns success |
| 9 | With shopifyProductId — no products in any step | productId set, empty StepProduct | throws "Please add products…"; returns 500 |
| 10 | Component metafield failure is fatal | updateComponentProductMetafields rejects | propagates error; returns 500 |
| 11 | Standard metafield failure is non-fatal | convertBundleToStandardMetafields rejects | still returns success |
| 12 | Variant metafield failure is fatal | updateBundleProductMetafields rejects | returns 500 |
| 13 | showStepTimeline reset when < 2 tiers | tierConfig has 1 item, showStepTimeline=true | DB update sets `showStepTimeline: null` |
| 14 | floatingBadgeText truncated to 60 chars | text is 100 chars | DB gets first 60 chars |

### Suite 4 — PPB `handleSaveBundle` (mocked DB + admin)

| # | Scenario | Setup | Expected |
|---|----------|-------|----------|
| 1 | Happy path — no shopifyProductId | draft, 1 step with product, no product ID | DB.update called; success; no metafield calls |
| 2 | Auto-activate via StepProduct | status=draft, StepProduct present | finalStatus=active |
| 3 | Auto-activate via StepCategory.products | status=draft, StepCategory with products | finalStatus=active |
| 4 | No auto-activate when StepCategory empty | status=draft, StepCategory exists but empty | stays draft |
| 5 | Bundle settings parsed from form | variantSelectorEnabled=false | DB.update includes variantSelectorEnabled:false |
| 6 | StepCategory records created | step.StepCategory present | nested StepCategory.create in DB call |
| 7 | UUID product ID rejected | StepProduct.id is UUID | returns 500 with corruption message |
| 8 | With shopifyProductId — has products | productId set, step has StepProduct | metafield calls invoked; success |
| 9 | With shopifyProductId — no products | productId set, no products in any step | returns 500 "Please add products…" |
| 10 | DB throws | db.bundle.update throws | returns 500 |
| 11 | Fixed bundle price stored | discountType=fixed_bundle_price | rule gets fixedBundlePrice field |

### Suite 5 — `handleUpdateBundleStatus` (shared, mocked DB + admin)

| # | Scenario | Setup | Expected |
|---|----------|-------|----------|
| 1 | Status updated in DB | status=active | db.bundle.update called with { status: 'active' } |
| 2 | Status synced to Shopify when productId set | productId present | admin.graphql called with ACTIVE status |
| 3 | "unlisted" maps to ACTIVE for Shopify | status=unlisted, productId present | admin.graphql called with shopifyStatus='ACTIVE' |
| 4 | "archived" maps to ARCHIVED | status=archived | admin.graphql called with 'ARCHIVED' |
| 5 | Shopify sync skipped when no productId | shopifyProductId=null | admin.graphql NOT called |
| 6 | GraphQL errors logged, not thrown | admin.graphql returns errors | still returns success JSON |

### Suite 6 — FPB `handleSyncProduct` (mocked DB + admin)

| # | Scenario | Setup | Expected |
|---|----------|-------|----------|
| 1 | Bundle not found | db.findUnique returns null | returns 404 JSON |
| 2 | Product exists — no changes | Shopify product same description | returns success; no db.update |
| 3 | Product exists — description changed | Shopify product has different description | db.update called with new description |
| 4 | Product deleted in Shopify | Shopify returns null product | db.update clears productId; returns 404 |
| 5 | GraphQL errors from Shopify | data.errors present | returns 400 with error message |
| 6 | No productId — creates new product | productId=null | admin.graphql called with productCreate mutation |

### Suite 7 — PPB `handleSyncProduct` (mocked DB + admin)

| # | Scenario | Setup | Expected |
|---|----------|-------|----------|
| 1 | Bundle not found | db.findUnique returns null | returns 404 JSON |
| 2 | Product exists — syncs successfully | Shopify product returned | compact success JSON with productId/productHandle |
| 3 | Product deleted in Shopify | Shopify returns null | db.update clears productId; returns 404 |
| 4 | No productId — creates new product | productId=null | admin.graphql productCreate called |
| 5 | GraphQL errors from Shopify | data.errors present | returns 400 |

---

## Acceptance Criteria

- [ ] All 55 test cases pass `npm run test:unit`
- [ ] Zero ESLint errors on all new test files
- [ ] No TypeScript errors (ts-jest compilation passes)
- [ ] Tests complete in < 5s (no real I/O)
- [ ] No test depends on another test's state (beforeEach resets all mocks)
