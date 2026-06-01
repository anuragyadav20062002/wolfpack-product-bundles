# Anti-Pattern Catalog — Code Simplification

> Real examples are drawn from this codebase. When auditing, look for the exact patterns described here.

---

## AP-01: CASCADING_FALLBACK — Cascading Fallback Chain

**Severity:** CRITICAL

**Definition:** Code that sequentially attempts multiple strategies when an earlier one fails, creating a "try X, then Y, then Z" execution path. Each fallback adds a hidden code path that is almost never tested under production load and accumulates technical debt.

**Why it's bad:**
- Hidden paths are essentially untested — you only know they work if primary path is always healthy
- If primary fails silently (returns bad data instead of throwing), the fallback fires unpredictably
- Creates a second "mode" of operation that engineers forget exists
- Cascading: if primary is down, fallback takes extra time/resources, potentially triggering downstream failures too
- Violates fail-fast: a clear error at the boundary is far more useful than a confused success from a fallback

**Real example from this codebase:**
```typescript
// app/routes/api/api.storefront-products.tsx:134-179

let session = await db.session.findFirst({ where: { shop }, select: { ... } });

if (!session) {
  return json({ error: "Shop not configured." }, { status: 404 });
}

// FALLBACK: If no storefront token, try to create one on-demand
if (!session.storefrontAccessToken && session.accessToken) {
  try {
    const admin = {
      graphql: async (query: string, options?: any) => { ... }
    } as any; // manually-constructed admin context
    const token = await createStorefrontAccessToken(admin, shop);
    // Re-query to pick up new token
    session = await db.session.findFirst({ where: { shop }, select: { ... } });
  } catch (error) {
    return json({ error: "Could not create storefront access token" }, { status: 500 });
  }
}

// SECOND CHECK: same condition again after fallback
if (!session?.storefrontAccessToken) {
  return json({ error: "Shop not configured." }, { status: 404 });
}
```

**What's wrong:**
1. Token creation is a symptom fix for a setup problem. On-demand creation inside a request is a race condition: two concurrent requests can both attempt creation simultaneously.
2. The comment says "handles race condition" but there is no locking — it makes the race condition worse.
3. Two separate DB queries + an Admin GraphQL call inside a single loader request.
4. Manually-constructed `admin` object (`as any`) is not the real AdminApiContext — missing methods will cause runtime errors if `createStorefrontAccessToken` calls more than just `graphql`.

**Correct pattern:**
```typescript
// Storefront token is created at install time (webhook handler or session lifecycle).
// If it's missing at request time, it's a real setup error — fail clearly.
const session = await db.session.findFirst({
  where: { shop },
  select: { storefrontAccessToken: true },
});

if (!session?.storefrontAccessToken) {
  // No fallback. Clear error. Fix belongs in install flow, not here.
  throw new Response(
    JSON.stringify({ error: "Shop not configured. Please reinstall the app." }),
    { status: 404 }
  );
}
```

---

## AP-02: SILENT_SWALLOW — Silent Error Swallow

**Severity:** CRITICAL

**Definition:** A `catch` block logs a message and continues execution as if nothing went wrong, hiding the failure from callers.

**Why it's bad:**
- The function appears to succeed when it has actually partially failed
- Callers get no signal that data is incomplete or incorrect
- Users see wrong data rather than an error they can act on
- Debugging is impossible because the error is emitted only as a log line

**Real example from this codebase:**
```typescript
// handlers/handlers.server.ts — inside Promise.all

await Promise.all([
  (async () => {
    try {
      await updateProductStandardMetafields(admin, productId, metafields);
    } catch (error) {
      AppLogger.debug("[STANDARD_METAFIELD] Skipping standard metafields (optional):", {}, (error as Error).message);
      // Continues silently — the function that called Promise.all will return { success: true }
    }
  })(),

  // Other parallel tasks with NO try/catch — if these throw,
  // Promise.all rejects, but the outer catch swallows it too.
  (async () => {
    await updateComponentProductMetafields(admin, productId, config);
  })(),
]);
```

**Correct pattern:**
```typescript
// Option A: If a failure is truly non-critical, be explicit about partial success
const results = await Promise.allSettled([
  updateProductStandardMetafields(admin, productId, metafields),
  updateComponentProductMetafields(admin, productId, config),
]);

const failures = results.filter(r => r.status === "rejected");
if (failures.length > 0) {
  // Log and include in response — caller can decide
  AppLogger.warn("[METAFIELDS] Partial failure updating metafields", { failures });
}

// Option B: If failure IS critical, don't catch — let it propagate
await updateComponentProductMetafields(admin, productId, config);
```

---

## AP-03: TRIPLE_VALIDATION — Redundant Validation

**Severity:** WARN

**Definition:** The same validation logic runs 2 or more times within a single function call path. Usually happens when upfront validation and in-loop validation check the same precondition.

**Why it's bad:**
- If the upfront check is correct, the in-loop check can never trigger — dead code
- If both can trigger, it means the upfront check doesn't actually prevent the bad state
- Copy-pasted logic means errors must be fixed in multiple places
- Reader has to parse both paths to understand the invariant

**Real example from this codebase:**
```typescript
// handlers/handlers.server.ts — handleSaveBundle

// CHECK 1: UUID validation upfront (lines ~101-118)
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-...-[0-9a-f]{12}$/i;
for (const step of stepsData) {
  for (const product of step.StepProduct) {
    if (uuidRegex.test(product.id)) {
      throw new Error(`Invalid product ID: UUID detected "${product.id}"`);
    }
  }
}

// ... 100+ lines of other code ...

// CHECK 2: Exact same UUID check again during mapping (lines ~209-218)
const isUUID = /^[0-9a-f]{8}-...-[0-9a-f]{12}$/i.test(productId);
if (isUUID) {
  throw new Error(`Invalid product ID: UUID detected "${productId}"`);
}

// CHECK 3: And then format normalisation (lines ~220-230)
if (productId.startsWith('gid://shopify/Product/')) { ... }
else if (/^\d+$/.test(productId)) { productId = `gid://shopify/Product/${productId}`; }
else { throw new Error(`Invalid product ID format: "${productId}"`); }
```

**Correct pattern:**
```typescript
// Validate and normalise once, at the boundary, returning a clean value
function normaliseShopifyProductId(raw: string): string {
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(raw)) {
    throw new Error(`Expected Shopify GID, received UUID: "${raw}"`);
  }
  if (raw.startsWith("gid://shopify/Product/")) return raw;
  if (/^\d+$/.test(raw)) return `gid://shopify/Product/${raw}`;
  throw new Error(`Invalid product ID format: "${raw}"`);
}

// Called once, at the top of the function
const productIds = stepsData.flatMap(s =>
  s.StepProduct.map(p => normaliseShopifyProductId(p.id))
);
```

---

## AP-04: ANY_ESCAPE — `as any` Type Escape

**Severity:** CRITICAL when at a system boundary; WARN inside a single function

**Definition:** Using `as any` to suppress TypeScript errors rather than properly typing the value.

**Why it's bad:**
- Tells TypeScript to stop checking — all downstream accesses are unchecked
- Runtime errors from missing methods/properties on the asserted object won't surface until production
- Signals that the type design is wrong and needs to be fixed at the source

**Real example from this codebase:**
```typescript
// api.storefront-products.tsx:150-165 — CRITICAL: boundary object
const admin = {
  graphql: async (query: string, options?: any) => {
    const response = await fetch(`https://${shop}/admin/api/...`, { ... });
    return response;
  }
} as any; // "Type assertion since we're creating a minimal admin context"
```
The comment explains *why* it's `any` — the admin context type is more complex than what's being constructed. This is a real structural mismatch that `as any` is hiding.

```typescript
// handlers.server.ts:49 — WARN: parameter types
export async function handleSaveBundle(admin: any, session: any, ...) {
```
The proper type is `AdminApiContext["admin"]` from `@shopify/shopify-app-remix/server`.

**Correct patterns:**
```typescript
// Option A: Use the real type from @shopify/shopify-app-remix
import type { AdminApiContext } from "@shopify/shopify-app-remix/server";
import type { Session } from "@shopify/shopify-api";

export async function handleSaveBundle(
  admin: AdminApiContext["admin"],
  session: Session,
  ...
)

// Option B: If building a minimal context, define an explicit minimal type
interface MinimalAdminContext {
  graphql: (query: string, opts?: { variables?: Record<string, unknown> }) => Promise<Response>;
}
// No need for `as any` — you can then pass it to functions expecting this shape
```

---

## AP-05: GIANT_FUNCTION — Single Function with Multiple Responsibilities

**Severity:** WARN

**Definition:** A function that exceeds ~100 lines because it is doing several distinct operations that each deserve their own function.

**Why it's bad:**
- Cannot be unit-tested in isolation — you have to trigger the whole thing
- Impossible to understand the function's contract from its signature
- Errors deep inside provide no context about which logical phase failed
- Merge conflicts are more frequent and harder to resolve

**Real example from this codebase:**
```typescript
// handlers.server.ts — handleSaveBundle (~500 lines) doing all of:
// 1. Parse and validate formData
// 2. Validate + normalise product IDs
// 3. Auto-set bundle status
// 4. Update bundle in DB
// 5. Sync Shopify product status via mutation
// 6. Update 3 different types of metafields in parallel
// 7. Return success/error response
```

**Correct pattern — decompose into orchestrator + specialist functions:**
```typescript
export async function handleSaveBundle(admin, session, bundleId, formData) {
  const input = parseBundleFormData(formData);           // 1. parse + validate
  const status = resolveBundleStatus(input.steps);       // 3. status logic (pure fn)

  await updateBundleRecord(bundleId, session.shop, input, status);  // 4. DB write

  if (input.shopifyProductId) {
    await Promise.all([
      syncShopifyProductStatus(admin, input.shopifyProductId, status), // 5.
      updateAllMetafields(admin, input.shopifyProductId, input),       // 6.
    ]);
  }

  return json({ success: true });
}
```
Each extracted function is independently testable, has a clear purpose, and can fail with a meaningful error.

---

## AP-06: CONSOLE_SPAM — `console.log` in Production Code

**Severity:** WARN

**Definition:** `console.log`, `console.error`, `console.warn` used directly in route handlers or services instead of `AppLogger`.

**Why it's bad:**
- Bypasses the centralized logging system (`AppLogger`) which provides structured metadata, log levels, and context
- No way to filter by environment (debug logs in production)
- Inconsistent log format — some have emoji + ASCII borders, others are plain
- Makes grep-based log analysis impossible

**Real example from this codebase:**
```typescript
// api.bundle.$bundleId[.]json.tsx
console.log('═══════════════════════════════════════════════════════════');
console.log('[APP_PROXY] 🔍 INCOMING REQUEST:', { url: url.href, ... });
console.log('═══════════════════════════════════════════════════════════');

// api.storefront-products.tsx
console.log("[STOREFRONT_API] No storefront token found. Creating on-demand for shop:", shop);
```

**Correct pattern:**
```typescript
AppLogger.debug("Incoming app proxy request", {
  component: "api.bundle.json",
  url: url.href,
  method: request.method,
});
```
Use: `AppLogger.debug` (dev-only details) / `AppLogger.info` (notable events) / `AppLogger.warn` (degraded state) / `AppLogger.error` (failures).

---

## AP-07: REPEAT_EXTRACT — Repeated Shape-Extraction Functions

**Severity:** WARN

**Definition:** Multiple functions that do the same operation (pick specific keys from an `any` object) written out longhand N times.

**Real example from this codebase:**
```typescript
// handlers.server.ts — 5 functions all doing the same thing:
function extractFooterSettings(settings: any) {
  return { footerBgColor: settings.footerBgColor, /* 25 more lines */ };
}
function extractStepBarSettings(settings: any) {
  return { stepNameFontColor: settings.stepNameFontColor, /* 16 more lines */ };
}
// ... extractGlobalColorsSettings, extractGeneralSettings, extractPromoBannerSettings
```

**Correct pattern:**
```typescript
// Define field lists as typed constants — they serve as documentation too
const FOOTER_FIELDS = [
  "footerBgColor", "footerTotalBgColor", "footerBorderRadius",
  // ...
] as const;

// One generic helper
function pick<T extends object, K extends keyof T>(obj: T, keys: readonly K[]): Pick<T, K> {
  return Object.fromEntries(keys.map(k => [k, obj[k]])) as Pick<T, K>;
}

const footerSettings = pick(settings, FOOTER_FIELDS);
```

---

## AP-08: GENERIC_CATCH — Overly Broad Catch Without Type Narrowing

**Severity:** WARN

**Definition:** `(error as Error).message` used without first checking that `error` is actually an `Error` instance.

**Why it's bad:**
- `throw "string"` or `throw { code: 500 }` are valid JS — `.message` would be `undefined`
- The assertion hides these cases and silently produces `undefined` in error responses

**Real example from this codebase:**
```typescript
} catch (error) {
  AppLogger.error("[BUNDLE_CONFIG] Error:", {}, error as any);
  return json({
    success: false,
    error: (error as Error).message || "Failed to save bundle configuration"
  }, { status: 500 });
}
```

**Correct pattern:**
```typescript
} catch (error) {
  const message = error instanceof Error
    ? error.message
    : "Failed to save bundle configuration";
  AppLogger.error("[BUNDLE_CONFIG] Error:", {}, error);
  return json({ success: false, error: message }, { status: 500 });
}
```

---

## AP-09: INCONSISTENT_GQL — Inconsistent GraphQL Error Handling

**Severity:** WARN

**Definition:** Different files check different error fields after Admin GraphQL calls, with no consistent approach.

**Real example from this codebase:**
- Some code checks `responseData.errors` (top-level transport errors)
- Some checks `responseData.data?.productUpdate?.userErrors` (mutation user errors)
- Some checks neither and assumes success
- Some checks both but only if one exists

**Correct pattern — always check both:**
```typescript
const responseData = await response.json();

// 1. Transport/parse errors (network issues, auth problems)
if (responseData.errors?.length) {
  throw new Error(`GraphQL error: ${responseData.errors[0].message}`);
}

// 2. Mutation user errors (business logic violations)
const userErrors = responseData.data?.productUpdate?.userErrors ?? [];
if (userErrors.length > 0) {
  throw new Error(`Shopify rejected update: ${userErrors[0].message}`);
}
```

---

## AP-10: MIXED_PROMISES — `Promise.all` with Mixed Safety

**Severity:** CRITICAL

**Definition:** Some tasks in `Promise.all` have internal `try/catch` (fail silently) while others don't (fail loudly), creating asymmetric behaviour that masks partial failures.

**Real example from this codebase:**
```typescript
await Promise.all([
  (async () => {
    try {
      await updateStandardMetafields(admin, productId, meta);
    } catch {
      AppLogger.debug("Skipping standard metafields (optional)"); // Silent
    }
  })(),
  (async () => {
    // No try/catch — will reject Promise.all if it fails
    await updateComponentProductMetafields(admin, productId, config);
  })(),
]);
```
If `updateComponentProductMetafields` throws, Promise.all rejects. The outer catch also swallows it. Net result: nothing works but `{ success: true }` is returned.

**Correct pattern:**
```typescript
// Use Promise.allSettled for genuinely optional tasks
const [metaResult, componentResult] = await Promise.allSettled([
  updateStandardMetafields(admin, productId, meta),
  updateComponentProductMetafields(admin, productId, config),
]);

// Handle failures explicitly
if (componentResult.status === "rejected") {
  // Component metafields are described as CRITICAL in comments — throw or return error
  throw new Error(`Failed to update component metafields: ${componentResult.reason}`);
}
if (metaResult.status === "rejected") {
  AppLogger.warn("Standard metafields update failed (non-critical)", {}, metaResult.reason);
}
```

---

## AP-11: APP_BRIDGE_INVALID_PROP — Invalid Prop on App Bridge Web Component

**Severity:** WARN

**Definition:** Passing a prop that does not exist on an App Bridge web component (`<ui-save-bar>`, `<ui-modal>`, etc.), causing a console error on every render.

**Why it's bad:**
- Produces a console error on every page load: `Unexpected value for attribute "X" on <ui-Y>`
- The prop is silently ignored — the intended behaviour (e.g. discard confirmation dialog) never fires
- Misled by React prop naming conventions — App Bridge components are DOM web components and only accept their documented HTML attributes

**Real example from this codebase:**
```tsx
// Both configure routes had this — fires error twice per page load
<SaveBar id="bundle-save-bar" open={isDirty} discardConfirmation={true}>
// Error: Unexpected value for attribute "discardconfirmation" on <ui-save-bar>
```

**Correct pattern:**
```tsx
// Only pass props documented in the App Bridge web component spec
<SaveBar id="bundle-save-bar" open={isDirty}>
  <button variant="primary" slot="save-action">Save</button>
  <button slot="discard-action">Discard</button>
</SaveBar>
```

**How to audit:** Search for `<SaveBar`, `<Modal`, `<TitleBar`, `<ContextualSaveBar` and cross-reference every prop with the App Bridge React v4 component API. Any prop not in the documented API is invalid.

---

## AP-12: HARDCODED_CSS_VALUE — Hardcoded Hex/RGB in Widget JS

**Severity:** WARN

**Definition:** Widget JavaScript that sets colours, sizes, or other merchant-customisable values as hardcoded literals (`#1e3a8a`, `rgba(30, 58, 138, 0.08)`, `200px`) instead of reading from CSS custom properties set by the DCP.

**Why it's bad:**
- The merchant's DCP theme settings have no effect — the hardcoded value always wins
- Creates visual inconsistency: different parts of the widget use DCP colours, the hardcoded section does not
- Silent bug: merchant changes primary colour in DCP but one card ignores it

**Real example from this codebase:**
```javascript
// bundle-widget-product-page.js — createFreeGiftSlotCard()
iconWrapper.style.cssText = `
  background: rgba(30, 58, 138, 0.08);  // ❌ hardcoded blue tint
`;
iconWrapper.style.color = '#1e3a8a';     // ❌ hardcoded primary blue
```

**Correct pattern:**
```javascript
iconWrapper.style.color = getComputedStyle(document.documentElement)
  .getPropertyValue('--bundle-global-primary-button').trim() || '#1e3a8a';
// The fallback (#1e3a8a) is only used if the CSS variable is not set
```

**When it's OK:** Structural properties (border-radius on a circle icon, flex layout) are not merchant-customisable and can be hardcoded. Colours and sizes controlled by the DCP must use CSS variables.

---

## AP-13: DIRECT_AUTHENTICATE — Direct `authenticate.admin()` in Routes

**Severity:** WARN

**Definition:** Calling `authenticate.admin(request)` directly inside a route loader or action, bypassing the `requireAdminSession` auth guard in `app/lib/auth-guards.server.ts`.

**Why it's bad:**
- Any auth logic change (token refresh, session scope, logging) must be updated in every route instead of one place
- No centralised audit trail of which routes require admin auth
- Pattern established in `auth-guards.server.ts` is the project standard — diverging creates two auth code paths

**Real example from this codebase:**
```typescript
// ❌ Direct call in route — bypasses auth guard layer
const { admin, session } = await authenticate.admin(request);
```

**Correct pattern:**
```typescript
// ✅ Use the project auth guard — always
import { requireAdminSession } from "~/lib/auth-guards.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin, session } = await requireAdminSession(request);
  // admin and session are now typed and guaranteed
};
```

---

## Severity Summary

| Code | Default Severity | Escalate to CRITICAL if... |
|------|-----------------|---------------------------|
| CASCADING_FALLBACK | WARN | Race condition risk or manual `as any` boundary object |
| SILENT_SWALLOW | CRITICAL | always |
| TRIPLE_VALIDATION | WARN | — |
| ANY_ESCAPE | WARN | At a public API boundary or crosses module boundary |
| GIANT_FUNCTION | WARN | >300 lines or handles DB + Shopify + response |
| CONSOLE_SPAM | INFO | In a hot path (called on every request) |
| REPEAT_EXTRACT | INFO | — |
| GENERIC_CATCH | WARN | Could hide non-Error throws |
| INCONSISTENT_GQL | WARN | Mutation (data changes) — unchecked userErrors is CRITICAL |
| MIXED_PROMISES | CRITICAL | always |
| APP_BRIDGE_INVALID_PROP | WARN | always |
| HARDCODED_CSS_VALUE | WARN | Colour/size controlled by DCP but hardcoded |
| DIRECT_AUTHENTICATE | WARN | Multiple routes bypassing the auth guard |
