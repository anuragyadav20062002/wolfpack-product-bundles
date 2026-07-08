# Runtime Config Cart Transform Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove Cart Transform MERGE dependence on per-component `$app:component_parents` variant metafields and instead use EB-style runtime cart-line data backed by a signed, tamper-resistant bundle runtime token.

**Architecture:** Storefront widgets already group bundle component lines with `_wolfpackProductBundle:OfferId`; keep that EB-compatible contract. Add one compact `_wolfpack_bundle_runtime` cart line property containing parent variant id and pricing config, signed server-side with an HMAC secret that the Rust Cart Transform reads from its app-owned CartTransform metafield. The transform verifies the token, groups by OfferId, and emits `linesMerge` without reading component variant metafields; parent-variant metafields can remain for EXPAND/checkout display, but the expensive component-variant fanout is removed.

**Tech Stack:** Remix, Prisma, Shopify Admin GraphQL, Shopify Storefront cart attributes, Rust Shopify Function, Jest, Cargo tests, widget build/minify.

---

## Evidence And Constraints

- EB storefront evidence: FPB/PPB add component variants to cart, group them with `_wolfpackProductBundle:OfferId`, and write `bundle_details` after add-to-cart.
- EB storefront config evidence: FPB config is runtime data embedded in app-proxy HTML; PPB uses product-page runtime data.
- Shopify Function constraint: the Function cannot call our DB/app proxy at transform time. Runtime data must be in Function input: cart line attributes, line merchandise metafields, cart metafields, or CartTransform owner metafields.
- Security constraint: raw cart line properties are customer-controllable. Parent variant id and pricing must not be trusted unless signed.
- No backwards compatibility shims: this is a breaking widget/Function contract. Bump `WIDGET_VERSION`, remove MERGE reliance on `component_parents`, and require merchants to sync/reload storefront assets after deploy.

## File Structure

- Create `app/services/bundles/cart-transform-runtime-token.server.ts`
  - Builds canonical runtime payloads and HMAC signatures.
  - Exposes `buildCartTransformRuntimeToken(bundle, parentVariantId)`.
- Create `tests/unit/services/cart-transform-runtime-token.test.ts`
  - Verifies deterministic signing, tamper detection fixtures, and payload size.
- Modify `app/services/cart-transform-service.server.ts`
  - Writes app-owned CartTransform metafield `runtime_token_secret`.
  - Keeps existing activation behavior.
- Modify `app/services/bundles/storefront-sync.server.ts`
  - Ensures parent product/parent variant sync still happens.
  - Stops calling `updateComponentProductMetafields` once the Rust merge path uses runtime tokens.
- Modify FPB/PPB bundle config builders:
  - `app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/handlers/shared.server.ts`
  - `app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/handlers/runtime-config.server.ts`
  - Add `cartTransformRuntimeToken` to public bundle config.
- Modify widget cart add sources:
  - `app/assets/widgets/shared/engine/cart-submit.js`
  - `app/assets/widgets/full-page/methods/step-footer-methods.js`
  - `app/assets/sdk/cart.js`
  - Product-page methods if they bypass shared submit: `app/assets/widgets/product-page/methods/cart-methods.js`
  - Add `_wolfpack_bundle_runtime` to every non-add-on component line.
- Modify Rust Function:
  - `extensions/bundle-cart-transform-rs/src/run.graphql`
  - `extensions/bundle-cart-transform-rs/src/types.rs`
  - `extensions/bundle-cart-transform-rs/src/merge.rs`
  - Add verified runtime-token merge path and remove `component_parents` requirement for MERGE.
- Modify Rust tests:
  - `extensions/bundle-cart-transform-rs/tests/integration_test.rs`
  - Add signed runtime-token fixtures; update old `component_parents`-only merge tests to expect no merge.
- Modify discount function if it uses `component_parents` for base bundle discounts:
  - `extensions/bundle-discount-function/src/cart_lines_discounts_generate_run.graphql`
  - `extensions/bundle-discount-function/src/cart_lines_discounts_generate_run.rs`
  - Keep add-on discounts working without trusting unsigned base pricing.
- Modify tests:
  - `tests/unit/routes/fpb-metafield-runtime-config.test.ts`
  - `tests/unit/routes/ppb-save-bundle.test.ts`
  - `tests/unit/routes/fpb-save-bundle.test.ts`
  - Widget cart submit tests or add `tests/unit/assets/cart-transform-runtime-token-cart-properties.test.ts`.
- Modify docs:
  - `internal docs/Architecture/Cart Transform Function.md`
  - `internal docs/Shopify Integration/Cart Transform API.md`
  - `internal docs/Shopify Integration/Metafields.md`
  - `docs/app-nav-map/APP_NAVIGATION_MAP.md` only if route/API surface changes.

## Runtime Token Contract

Payload JSON before signing:

```json
{
  "v": 1,
  "offerKey": "FBP-cmr361mz50000v00yrdeyxpf7",
  "bundleId": "cmr361mz50000v00yrdeyxpf7",
  "bundleType": "full_page",
  "parentVariantId": "gid://shopify/ProductVariant/48719529115907",
  "pricing": {
    "method": "percentage_off",
    "value": 10,
    "rules": []
  }
}
```

Cart line attribute value:

```json
{
  "payload": "<base64url canonical json>",
  "sig": "<base64url hmac-sha256(payload, runtime_token_secret)>"
}
```

Cart line properties sent by the widget:

```js
{
  "_wolfpackProductBundle:OfferId": "FBP-cmr361mz50000v00yrdeyxpf7_AQR_1",
  "_wolfpackProductBundle:prodQty": "1",
  "_bundleName": "Daily Essentials",
  "_wolfpack_bundle_runtime": "{\"payload\":\"...\",\"sig\":\"...\"}"
}
```

The Rust Function must reject the group when:

- `_wolfpack_bundle_runtime` is missing.
- `sig` does not match the HMAC.
- `payload.offerKey` does not match the OfferId base prefix before the session key.
- `payload.parentVariantId` is not a Shopify ProductVariant GID.
- `payload.pricing.method` is outside the supported enum.

### Task 1: Runtime Token Service

**Files:**
- Create: `app/services/bundles/cart-transform-runtime-token.server.ts`
- Test: `tests/unit/services/cart-transform-runtime-token.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
import {
  buildCartTransformRuntimeToken,
  verifyCartTransformRuntimeTokenForTest,
} from "../../../app/services/bundles/cart-transform-runtime-token.server";

describe("cart transform runtime token", () => {
  const secret = "test-runtime-secret";
  const payload = {
    v: 1,
    offerKey: "FBP-bundle-1",
    bundleId: "bundle-1",
    bundleType: "full_page",
    parentVariantId: "gid://shopify/ProductVariant/999",
    pricing: { method: "percentage_off", value: 10, rules: [] },
  } as const;

  it("builds a deterministic signed token", () => {
    const first = buildCartTransformRuntimeToken(payload, secret);
    const second = buildCartTransformRuntimeToken(payload, secret);
    expect(first).toBe(second);
    expect(JSON.stringify(first).length).toBeLessThan(1600);
  });

  it("rejects tampered payloads", () => {
    const token = buildCartTransformRuntimeToken(payload, secret);
    const parsed = JSON.parse(token);
    parsed.payload = parsed.payload.replace("MTA", "MTE");
    expect(verifyCartTransformRuntimeTokenForTest(JSON.stringify(parsed), secret)).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npx jest tests/unit/services/cart-transform-runtime-token.test.ts --runInBand
```

Expected: FAIL because the module does not exist.

- [ ] **Step 3: Implement token service**

```ts
import crypto from "node:crypto";

export type CartTransformRuntimePayload = {
  v: 1;
  offerKey: string;
  bundleId: string;
  bundleType: "full_page" | "product_page";
  parentVariantId: string;
  pricing: {
    method: "percentage_off" | "fixed_amount_off" | "fixed_bundle_price" | "buy_x_get_y";
    value: number;
    rules?: unknown[];
    conditions?: unknown;
    customerBuys?: number;
    customerGets?: number;
    discountType?: string;
    applyDiscountTo?: string;
  };
};

function base64url(input: string | Buffer) {
  return Buffer.from(input).toString("base64url");
}

function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return `{${Object.keys(record).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(record[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

function sign(payload: string, secret: string) {
  return crypto.createHmac("sha256", secret).update(payload).digest("base64url");
}

export function buildCartTransformRuntimeToken(
  payload: CartTransformRuntimePayload,
  secret: string,
) {
  const encodedPayload = base64url(canonicalJson(payload));
  return JSON.stringify({
    payload: encodedPayload,
    sig: sign(encodedPayload, secret),
  });
}

export function verifyCartTransformRuntimeTokenForTest(token: string, secret: string) {
  try {
    const parsed = JSON.parse(token) as { payload?: string; sig?: string };
    if (!parsed.payload || !parsed.sig) return null;
    const expected = sign(parsed.payload, secret);
    if (!crypto.timingSafeEqual(Buffer.from(parsed.sig), Buffer.from(expected))) return null;
    return JSON.parse(Buffer.from(parsed.payload, "base64url").toString("utf8")) as CartTransformRuntimePayload;
  } catch {
    return null;
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
npx jest tests/unit/services/cart-transform-runtime-token.test.ts --runInBand
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add app/services/bundles/cart-transform-runtime-token.server.ts tests/unit/services/cart-transform-runtime-token.test.ts
git commit -m "cart-transform: add signed runtime token service"
```

### Task 2: CartTransform Runtime Secret

**Files:**
- Modify: `app/services/cart-transform-service.server.ts`
- Test: `tests/unit/services/cart-transform-service.test.ts` or existing CartTransform service suite.

- [ ] **Step 1: Write failing test**

Add a test that mocks `metafieldsSet` after activation and expects:

```ts
expect(admin.graphql).toHaveBeenCalledWith(
  expect.stringContaining("metafieldsSet"),
  expect.objectContaining({
    variables: expect.objectContaining({
      metafields: expect.arrayContaining([
        expect.objectContaining({
          namespace: "$app",
          key: "runtime_token_secret",
          type: "single_line_text_field",
          ownerId: "gid://shopify/CartTransform/123",
        }),
      ]),
    }),
  }),
);
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npx jest tests/unit/services/cart-transform-service.test.ts --runInBand
```

Expected: FAIL because `runtime_token_secret` is not written.

- [ ] **Step 3: Implement secret write**

Add helper:

```ts
function getRuntimeTokenSecret(shopDomain: string) {
  const base = process.env.CART_TRANSFORM_RUNTIME_TOKEN_SECRET;
  if (!base) throw new Error("Missing CART_TRANSFORM_RUNTIME_TOKEN_SECRET");
  return crypto.createHmac("sha256", base).update(shopDomain).digest("hex");
}
```

After CartTransform activation/find succeeds, write:

```ts
await admin.graphql(METAFIELDS_SET_MUTATION, {
  variables: {
    metafields: [{
      ownerId: cartTransformId,
      namespace: "$app",
      key: "runtime_token_secret",
      type: "single_line_text_field",
      value: getRuntimeTokenSecret(shopDomain),
    }],
  },
});
```

- [ ] **Step 4: Run test**

Run:

```bash
npx jest tests/unit/services/cart-transform-service.test.ts --runInBand
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add app/services/cart-transform-service.server.ts tests/unit/services/cart-transform-service.test.ts
git commit -m "cart-transform: persist runtime token secret"
```

### Task 3: Public Bundle Config Runtime Token

**Files:**
- Modify: `app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/handlers/shared.server.ts`
- Modify: `app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/handlers/runtime-config.server.ts`
- Test: `tests/unit/routes/fpb-metafield-runtime-config.test.ts`
- Test: add or update PPB runtime config test.

- [ ] **Step 1: Write failing tests**

FPB expectation:

```ts
const config = buildFullPageBundleMetafieldConfig(bundleWithParentVariant) as any;
expect(config.cartTransformRuntimeToken).toEqual(expect.any(String));
expect(config.cartTransformRuntimeToken).not.toContain("runtime_token_secret");
```

PPB expectation:

```ts
const config = buildSyncBundleConfiguration(bundleWithParentVariant) as any;
expect(config.cartTransformRuntimeToken).toEqual(expect.any(String));
```

- [ ] **Step 2: Run tests to verify failure**

Run:

```bash
npx jest tests/unit/routes/fpb-metafield-runtime-config.test.ts tests/unit/routes/ppb-metafield-runtime-config.test.ts --runInBand
```

Expected: FAIL because runtime tokens are absent.

- [ ] **Step 3: Implement runtime token injection**

Use `buildCartTransformRuntimeToken` with:

```ts
{
  v: 1,
  offerKey: bundle.bundleType === "full_page" ? `FBP-${bundle.id}` : `MIX-${bundle.id}`,
  bundleId: bundle.id,
  bundleType: bundle.bundleType,
  parentVariantId: bundle.shopifyProductVariantId,
  pricing: normalizePricingForTransform(bundle.pricing),
}
```

Use the same shop-scoped secret derivation as `CartTransformService`.

- [ ] **Step 4: Run tests**

Run:

```bash
npx jest tests/unit/routes/fpb-metafield-runtime-config.test.ts tests/unit/routes/ppb-metafield-runtime-config.test.ts --runInBand
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add app/routes/app/app.bundles.full-page-bundle.configure.\$bundleId/handlers/shared.server.ts app/routes/app/app.bundles.product-page-bundle.configure.\$bundleId/handlers/runtime-config.server.ts tests/unit/routes/fpb-metafield-runtime-config.test.ts tests/unit/routes/ppb-metafield-runtime-config.test.ts
git commit -m "cart-transform: expose signed runtime token in bundle config"
```

### Task 4: Widget Cart Properties

**Files:**
- Modify: `app/assets/widgets/shared/engine/cart-submit.js`
- Modify: `app/assets/widgets/full-page/methods/step-footer-methods.js`
- Modify: `app/assets/sdk/cart.js`
- Modify: `app/assets/widgets/product-page/methods/cart-methods.js`
- Test: `tests/unit/assets/cart-transform-runtime-token-cart-properties.test.ts`

- [ ] **Step 1: Write failing test**

```ts
describe("cart transform runtime cart properties", () => {
  it("adds the signed runtime token to every bundle component line", () => {
    const item = buildCartItemForTest({
      cartTransformRuntimeToken: "{\"payload\":\"abc\",\"sig\":\"def\"}",
    });

    expect(item.properties).toEqual(expect.objectContaining({
      "_wolfpack_bundle_runtime": "{\"payload\":\"abc\",\"sig\":\"def\"}",
    }));
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npx jest tests/unit/assets/cart-transform-runtime-token-cart-properties.test.ts --runInBand
```

Expected: FAIL because the property is absent.

- [ ] **Step 3: Add the property in all cart submit paths**

In each cart item property builder:

```js
if (bundleConfig?.cartTransformRuntimeToken) {
  properties._wolfpack_bundle_runtime = bundleConfig.cartTransformRuntimeToken;
}
```

For add-on lines, do not attach the base runtime token when `_bundle_step_type` starts with `addon:`.

- [ ] **Step 4: Syntax check widget sources**

Run:

```bash
node --check app/assets/widgets/shared/engine/cart-submit.js
node --check app/assets/widgets/full-page/methods/step-footer-methods.js
node --check app/assets/sdk/cart.js
node --check app/assets/widgets/product-page/methods/cart-methods.js
```

Expected: all pass.

- [ ] **Step 5: Build required assets**

Run:

```bash
npm run build:widgets
npm run build:sdk
```

Expected: bundled assets update.

- [ ] **Step 6: Commit**

```bash
git add app/assets/widgets/shared/engine/cart-submit.js app/assets/widgets/full-page/methods/step-footer-methods.js app/assets/sdk/cart.js app/assets/widgets/product-page/methods/cart-methods.js extensions/bundle-builder/assets tests/unit/assets/cart-transform-runtime-token-cart-properties.test.ts scripts/build-widget-bundles.js
git commit -m "widgets: send signed cart transform runtime token"
```

### Task 5: Rust Function Runtime Token MERGE

**Files:**
- Modify: `extensions/bundle-cart-transform-rs/src/run.graphql`
- Modify: `extensions/bundle-cart-transform-rs/src/types.rs`
- Modify: `extensions/bundle-cart-transform-rs/src/merge.rs`
- Test: `extensions/bundle-cart-transform-rs/tests/integration_test.rs`

- [ ] **Step 1: Update Function input query test fixture**

Add to `run.graphql`:

```graphql
cartTransform {
  runtimeTokenSecret: metafield(namespace: "$app", key: "runtime_token_secret") {
    value
  }
}
cart {
  lines {
    wolfpackBundleRuntime: attribute(key: "_wolfpack_bundle_runtime") {
      value
    }
  }
}
```

- [ ] **Step 2: Write failing Rust tests**

Add tests:

```rust
#[test]
fn merges_with_signed_runtime_token_without_component_parents() {
    let input = signed_runtime_input_json();
    let result = run(input);
    assert_eq!(merge_operations(&result).len(), 1);
    assert_eq!(merge_operations(&result)[0].parent_variant_id, "gid://shopify/ProductVariant/999");
}

#[test]
fn skips_merge_when_runtime_token_is_tampered() {
    let input = tampered_runtime_input_json();
    let result = run(input);
    assert_eq!(merge_operations(&result).len(), 0);
}

#[test]
fn skips_merge_without_runtime_token_even_when_offer_id_exists() {
    let input = offer_id_only_input_json();
    let result = run(input);
    assert_eq!(merge_operations(&result).len(), 0);
}
```

- [ ] **Step 3: Run Rust tests to verify failure**

Run:

```bash
cargo test --manifest-path extensions/bundle-cart-transform-rs/Cargo.toml
```

Expected: FAIL because token parsing/verification is absent.

- [ ] **Step 4: Implement Rust token types**

Add:

```rust
#[derive(serde::Deserialize, Debug)]
pub struct RuntimeTokenEnvelope {
    pub payload: String,
    pub sig: String,
}

#[derive(serde::Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct CartTransformRuntimePayload {
    pub v: i64,
    pub offer_key: String,
    pub bundle_id: String,
    pub bundle_type: String,
    pub parent_variant_id: String,
    pub pricing: PriceAdjustmentConfig,
}
```

Use `hmac` + `sha2` crates:

```rust
type HmacSha256 = hmac::Hmac<sha2::Sha256>;
```

Verify `sig` against base64url HMAC of `payload`.

- [ ] **Step 5: Change MERGE parent/pricing selection**

In `process_merge_operations`:

```rust
let runtime = find_verified_runtime_token(lines, &merge_line_indices, runtime_secret, offer_group_id);
let Some(runtime) = runtime else {
    continue;
};
let parent_variant_id = runtime.parent_variant_id.clone();
let price_adjustment = Some(runtime.pricing.clone());
```

Remove the `component_parents_json` lookup from the MERGE path.

- [ ] **Step 6: Run Rust tests**

Run:

```bash
cargo test --manifest-path extensions/bundle-cart-transform-rs/Cargo.toml
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add extensions/bundle-cart-transform-rs/src/run.graphql extensions/bundle-cart-transform-rs/src/types.rs extensions/bundle-cart-transform-rs/src/merge.rs extensions/bundle-cart-transform-rs/tests/integration_test.rs extensions/bundle-cart-transform-rs/Cargo.toml extensions/bundle-cart-transform-rs/Cargo.lock
git commit -m "cart-transform: merge from signed runtime token"
```

### Task 6: Stop Component Variant Fanout

**Files:**
- Modify: `app/services/bundles/storefront-sync.server.ts`
- Modify: `app/services/bundles/metafield-sync.server.ts` if the writer is exported only for now-unused sync paths.
- Modify: `tests/unit/routes/fpb-save-bundle.test.ts`
- Modify: `tests/unit/routes/ppb-save-bundle.test.ts`
- Modify: `tests/unit/services/component-product-metafield.test.ts` only if the exported writer remains as a manual repair utility.

- [ ] **Step 1: Write failing sync test**

```ts
it("does not write component variant component_parents during storefront sync", async () => {
  await runBundleStorefrontSync(event);
  expect(updateComponentProductMetafields).not.toHaveBeenCalled();
  expect(updateBundleProductMetafields).toHaveBeenCalled();
});
```

- [ ] **Step 2: Run test to verify failure**

Run:

```bash
npx jest tests/unit/services/storefront-sync-queue.test.ts --runInBand
```

Expected: FAIL if the sync still calls component variant writer.

- [ ] **Step 3: Remove component fanout from sync worker**

Delete:

```ts
await updateComponentProductMetafields(admin, productId, config);
```

Keep parent product/variant writes required for:

- Parent product existence.
- Parent variant `requiresComponents`.
- Parent variant EXPAND/display metafields if still used by checkout.

- [ ] **Step 4: Run focused tests**

Run:

```bash
npx jest tests/unit/services/storefront-sync-queue.test.ts tests/unit/routes/fpb-save-bundle.test.ts tests/unit/routes/ppb-save-bundle.test.ts --runInBand
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add app/services/bundles/storefront-sync.server.ts tests/unit/services/storefront-sync-queue.test.ts tests/unit/routes/fpb-save-bundle.test.ts tests/unit/routes/ppb-save-bundle.test.ts
git commit -m "storefront-sync: stop component variant metafield fanout"
```

### Task 7: Deployment And Verification

**Files:**
- Modify: `scripts/build-widget-bundles.js`
- Modify: `internal docs/Architecture/Cart Transform Function.md`
- Modify: `internal docs/Shopify Integration/Cart Transform API.md`
- Modify: `internal docs/Shopify Integration/Metafields.md`
- Modify: `internal docs/index.md` if new architecture note links are needed.

- [ ] **Step 1: Bump widget version**

Patch `WIDGET_VERSION` in `scripts/build-widget-bundles.js` with a major or minor bump based on current value. This is a breaking cart contract, so use a major bump.

- [ ] **Step 2: Build assets and Rust function**

Run:

```bash
npm run build:widgets
npm run build:sdk
cargo test --manifest-path extensions/bundle-cart-transform-rs/Cargo.toml
```

Expected: all pass.

- [ ] **Step 3: Run app verification**

Run:

```bash
npx jest tests/unit/services/cart-transform-runtime-token.test.ts tests/unit/services/storefront-sync-queue.test.ts tests/unit/routes/fpb-save-bundle.test.ts tests/unit/routes/ppb-save-bundle.test.ts --runInBand
npx tsc --noEmit --pretty false
npx prisma validate
npx eslint --max-warnings 9999 <touched files>
npm run graphify:rebuild
```

Expected: all pass, ESLint zero errors.

- [ ] **Step 4: Chrome DevTools SIT proof**

Use the embedded Admin app on the SIT store:

```text
https://admin.shopify.com/store/wolfpack-store-test-1/apps/wolfpack-product-bundles-sit/app/...
```

Verify:

- Save returns quickly.
- Sync status reaches synced.
- Storefront cart add sends `_wolfpack_bundle_runtime`.
- Cart response contains one merged parent line.
- Tampering `_wolfpack_bundle_runtime` in DevTools before add-to-cart prevents merge rather than applying an unauthorized discount.

- [ ] **Step 5: Commit**

```bash
git add scripts/build-widget-bundles.js internal\ docs/Architecture/Cart\ Transform\ Function.md internal\ docs/Shopify\ Integration/Cart\ Transform\ API.md internal\ docs/Shopify\ Integration/Metafields.md internal\ docs/index.md graphify-out/GRAPH_REPORT.md graphify-out/graph.json extensions/bundle-builder/assets
git commit -m "docs: document runtime token cart transform contract"
```

## Acceptance Criteria

- Admin save never writes component variant `$app:component_parents`.
- Cart Transform MERGE succeeds with `_wolfpackProductBundle:OfferId` + valid `_wolfpack_bundle_runtime`.
- Cart Transform MERGE does not run when the runtime token is missing or tampered.
- Parent product activation remains handled by the sync worker.
- Cart `bundle_details` remains unchanged for order/cart display attribution.
- FPB and PPB widgets send the same EB-style OfferId grouping property.
- Rust tests cover valid token, tampered token, missing token, duplicate bundle instances, percentage, fixed amount, fixed bundle price, and BXY pricing.
- Browser SIT proof confirms merged cart line after save/sync with no component variant fanout.

## Out Of Scope

- Removing parent variant metafields used by EXPAND/checkout display.
- Changing `bundle_details` cart/order metafield behavior.
- Adding a server-side cart transform lookup API; Shopify Functions cannot call it.
- Supporting old widget assets that do not send `_wolfpack_bundle_runtime`.

## Self-Review

- Spec coverage: The plan covers EB-style runtime cart data, removes component variant fanout, preserves OfferId grouping and `bundle_details`, and accounts for Shopify Function no-network constraints.
- Placeholder scan: No TODO/TBD placeholders remain; each task has exact files, commands, and expected outcomes.
- Type consistency: `cartTransformRuntimeToken`, `_wolfpack_bundle_runtime`, `runtime_token_secret`, and `CartTransformRuntimePayload` are consistently named across server, widget, and Rust tasks.
