# Bundle Level CSS Storefront Wiring Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire the per-bundle Bundle Level CSS field from FPB and PPB Bundle Settings into the storefront exactly as EB does: CSS saved on the bundle applies only to that bundle builder page, after app/template CSS, with sanitized merchant CSS and Chrome-verified storefront behavior.

**Architecture:** Keep store-level Design Settings CSS on the existing `/apps/product-bundles/api/design-settings/:shop` stylesheet, and add per-bundle CSS to the bundle runtime config because Bundle Level CSS is bundle-specific. The saved `Bundle.bundleLevelCss` must be sanitized at the FPB and PPB save boundaries, emitted by `formatBundleForWidget()` into each storefront bundle config, then injected by both full-page and product-page widgets as a scoped `<style>` after `selectedBundle` is resolved. Do not add a new network request for bundle-level CSS unless Chrome evidence proves the config payload path cannot satisfy EB parity.

**Tech Stack:** Remix route handlers, Prisma `Bundle.bundleLevelCss`, `processCss()` sanitizer, shared widget formatter, raw storefront widget JS, Shopify theme app extension Liquid, Jest unit tests, Chrome DevTools MCP, `npm run build:widgets`, `npm run minify:assets css`, graphify.

---

## Current Evidence And Constraints

- EB evidence: `docs/competitor-analysis/18-eb-settings-integrations-replication-evidence.md` records Bundle Settings order with `Bundle Level CSS` below Bundle Banner and above Bundle Status.
- WPB Admin map: `docs/app-nav-map/APP_NAVIGATION_MAP.md` already lists `Custom CSS textarea (bundleLevelCss — sanitized via processCss)`.
- WPB FPB Admin UI already has `bundleLevelCss` state and posts it from `app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/route.tsx`.
- WPB PPB Admin UI also has `bundleLevelCss` state and posts it from `app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/route.tsx`.
- WPB FPB save handler currently reads `bundleLevelCssRaw` and saves it directly in `app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/handlers/handlers.server.ts`; unlike PPB, it does not yet use `processCss()`.
- WPB PPB parser already sanitizes `bundleLevelCss` in `app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/handlers/parsers.ts`; keep that behavior and cover it in the plan's test matrix.
- Storefront config is formatted by `app/lib/bundle-formatter.server.ts` and delivered by FPB and PPB surfaces including:
  - `app/routes/api/api.bundle.$bundleId[.]json.tsx`
  - `app/services/widget-installation/widget-full-page-bundle.server.ts`
- The FPB Liquid block injects cached config through `data-bundle-config` in `extensions/bundle-builder/blocks/bundle-full-page.liquid`; keep the existing two-stage config loading order intact.
- The PPB Liquid block injects cached config through `data-bundle-config` in `extensions/bundle-builder/blocks/bundle-product-page.liquid`; PPB currently uses the product metafield config as its single source.
- Store-level custom CSS is separate and remains in `api.design-settings.$shopDomain.tsx`; do not mix per-bundle CSS into `DesignSettings.customCss`.
- Bundle Level CSS must work for both FPB and PPB in this implementation slice.
- No unit tests should grep CSS files for visual layout. Tests may verify data flow, sanitizer usage, emitted config shape, and runtime JS source behavior.
- Never run `npm run dev` or `shopify app deploy`.

## Files And Responsibilities

- Modify: `app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/handlers/handlers.server.ts`
  - Sanitize FPB `bundleLevelCss` with `processCss()` before saving.
  - Persist `null` for empty sanitized CSS.
- Verify/test existing: `app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/handlers/parsers.ts`
  - PPB already sanitizes `bundleLevelCss` with `processCss()`; add no duplicate parser unless tests expose a real gap.
- Modify: `app/lib/bundle-formatter.server.ts`
  - Add `bundleLevelCss: string | null` to `FormattedBundle`.
  - Emit the saved sanitized per-bundle CSS into FPB and PPB storefront bundle config.
- Create: `app/assets/widgets/shared/bundle-level-css-methods.js`
  - Shared focused runtime helper for injecting/removing per-bundle CSS style tags.
- Modify: `app/assets/bundle-widget-full-page.js`
  - Import and mix in the new helper.
  - Call the helper after `selectedBundle` is set and before first visible render.
- Modify: `app/assets/bundle-widget-product-page.js`
  - Import and mix in the same helper.
  - Call the helper after `selectedBundle` is set and before first product-page render.
- Generated: `extensions/bundle-builder/assets/bundle-widget-full-page-bundled.js`
  - Rebuilt by `npm run build:widgets`.
- Generated: `extensions/bundle-builder/assets/bundle-widget-product-page-bundled.js`
  - Rebuilt by `npm run build:widgets`.
- Optional generated/no-op expected: `extensions/bundle-builder/assets/bundle-widget-full-page-standard.css`
  - Not expected for this JS-only storefront slice unless CSS source changes.
- Modify: `tests/unit/lib/bundle-formatter.test.ts`
  - Verifies formatter emits per-bundle CSS and preserves `null` for both `full_page` and `product_page` bundles.
- Modify: `tests/unit/routes/fpb-save-bundle.test.ts`
  - Verifies FPB save sanitizes `bundleLevelCss`.
- Verify existing / extend if needed: `tests/unit/routes/ppb-bundle-settings.test.ts`
  - Confirms PPB `parsePPBBundleSettings()` keeps sanitizing `bundleLevelCss`.
- Create: `tests/unit/assets/bundle-level-css-runtime.test.ts`
  - Source-contract tests for shared helper import/mixin/call in FPB and PPB and scoped style behavior. This is not a visual CSS test.
- Create: `test-spec/bundle-level-css-storefront.spec.md`
  - TDD session spec covering FPB and PPB save, format, runtime injection, and Chrome verification.
- Update if route/API behavior changes: `docs/app-nav-map/APP_NAVIGATION_MAP.md`
  - Only update if implementation changes visible route/API behavior. The current map already names `bundleLevelCss`.
- Update if a durable gotcha is learned: `internal docs/Architecture/Widget Architecture.md` or `internal docs/Operations/Build Process.md`
  - Only update if execution discovers a non-obvious CSS injection/cache gotcha not already documented.

---

## Agentic Loop 0: EB And WPB Baseline Confirmation

**Goal:** Confirm the target behavior and current WPB gap before writing code.

**Files:**
- Read: `docs/competitor-analysis/18-eb-settings-integrations-replication-evidence.md`
- Read: `docs/app-nav-map/APP_NAVIGATION_MAP.md`
- Read: `app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/route.tsx`
- Read: `app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/handlers/handlers.server.ts`
- Read: `app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/route.tsx`
- Read: `app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/handlers/parsers.ts`
- Read: `app/lib/bundle-formatter.server.ts`
- Read: `app/assets/bundle-widget-full-page.js`
- Read: `app/assets/bundle-widget-product-page.js`

- [ ] **Step 1: Confirm FPB Admin UI field exists and posts value**

Run:

```bash
rg -n "bundleLevelCss|Bundle Level CSS|formData.append\\(\"bundleLevelCss\"" 'app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/route.tsx'
```

Expected:

```text
state initialization for bundleLevelCss
formData.append("bundleLevelCss", bundleLevelCss)
Bundle Level CSS UI section
```

- [ ] **Step 1b: Confirm PPB Admin UI field exists and posts value**

Run:

```bash
rg -n "bundleLevelCss|Bundle Level CSS|formData.append\\(\"bundleLevelCss\"" 'app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/route.tsx'
```

Expected:

```text
state initialization for bundleLevelCss
formData.append("bundleLevelCss", bundleLevelCss)
Bundle Level CSS UI section
```

- [ ] **Step 2: Confirm current FPB save handler does not sanitize**

Run:

```bash
rg -n "bundleLevelCss|processCss" 'app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/handlers/handlers.server.ts'
```

Expected current gap:

```text
bundleLevelCssRaw is read
bundleLevelCss is saved
processCss is absent or not used for FPB bundleLevelCss
```

- [ ] **Step 2b: Confirm current PPB parser already sanitizes**

Run:

```bash
rg -n "bundleLevelCss|processCss" 'app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/handlers/parsers.ts' tests/unit/routes/ppb-bundle-settings.test.ts
```

Expected:

```text
parsePPBBundleSettings reads bundleLevelCss
processCss(rawCss) is called
ppb-bundle-settings.test.ts covers sanitizer and empty CSS behavior
```

- [ ] **Step 3: Confirm current formatter does not emit bundleLevelCss**

Run:

```bash
rg -n "bundleLevelCss" app/lib/bundle-formatter.server.ts tests/unit/lib/bundle-formatter.test.ts
```

Expected current gap:

```text
No formatter output contract for bundleLevelCss
```

- [ ] **Step 4: Confirm EB evidence**

Run:

```bash
rg -n "Bundle Level CSS|Custom CSS for bundle builder pages|Custom CSS for theme pages" docs/competitor-analysis/18-eb-settings-integrations-replication-evidence.md internal\ docs/EB\ Edit\ Settings\ Gap\ Audit\ 2026-06-04.md
```

Expected:

```text
Bundle Level CSS exists in EB Bundle Settings evidence; WPB FPB and PPB configure routes expose the same field
Custom CSS fields exist in EB settings evidence
```

- [ ] **Step 5: Record baseline Chrome evidence**

Use Chrome DevTools MCP against the SIT embedded app:

```text
https://admin.shopify.com/store/wolfpack-store-test-1/apps/wolfpack-product-bundles-sit/app/bundles/full-page-bundle/configure/<bundleId>
```

Actions:

1. Open FPB Bundle Settings.
2. Expand Bundle Level CSS.
3. Enter a harmless visible CSS rule:

```css
#bundle-builder-app {
  outline: 6px solid rgb(255, 0, 204);
}
```

4. Save.
5. Hard reload the storefront page.
6. Confirm the outline does not appear before implementation.

Expected current FPB gap:

```text
Admin field saves or appears to save, but storefront does not apply the per-bundle CSS.
```

- [ ] **Step 6: Record baseline PPB Chrome evidence**

Use Chrome DevTools MCP against the SIT embedded app:

```text
https://admin.shopify.com/store/wolfpack-store-test-1/apps/wolfpack-product-bundles-sit/app/bundles/product-page-bundle/configure/<bundleId>
```

Actions:

1. Open PPB Bundle Settings.
2. Expand Bundle Level CSS.
3. Enter a harmless visible CSS rule:

```css
.bundle-widget-product-page,
.bundle-widget-product-page-container {
  outline: 6px solid rgb(0, 200, 255);
}
```

4. Save.
5. Hard reload the product-page bundle storefront page.
6. Confirm the outline does not appear before implementation.

Expected current PPB gap:

```text
Admin field saves or appears to save, but PPB storefront does not apply the per-bundle CSS.
```

---

## Agentic Loop 1: TDD Spec And Save Sanitization

**Goal:** Make FPB Bundle Level CSS use the same sanitizer boundary PPB already uses, and keep PPB sanitizer coverage explicit.

**Files:**
- Create: `test-spec/bundle-level-css-storefront.spec.md`
- Modify: `tests/unit/routes/fpb-save-bundle.test.ts`
- Verify/extend: `tests/unit/routes/ppb-bundle-settings.test.ts`
- Modify: `app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/handlers/handlers.server.ts`

- [ ] **Step 1: Create the TDD spec file**

Create `test-spec/bundle-level-css-storefront.spec.md`:

```markdown
# Test Spec: Bundle Level CSS Storefront Wiring
**Spec ID:** bundle-level-css-storefront  **Created:** 2026-06-12

## Purpose
Wire per-bundle Bundle Level CSS from FPB and PPB Bundle Settings into the storefront safely and with EB-equivalent per-bundle scope.

## Test Cases

### FPB Save Sanitization
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Saves safe CSS | `.bundle-widget-container { outline: 1px solid red; }` | DB update receives same CSS | Uses `processCss()` |
| 2 | Strips unsafe CSS | `<script>alert(1)</script>.bundle-widget-container { color: red; }` | DB update receives sanitized CSS without script tag | Mirrors PPB parser behavior |
| 3 | Empty CSS | empty string | DB update receives `null` | Avoids empty style injection |

### PPB Save Sanitization
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Saves safe CSS | `.bundle-widget-product-page { outline: 1px solid blue; }` | `parsePPBBundleSettings().bundleLevelCss` equals same CSS | Existing parser path |
| 2 | Strips unsafe CSS | `<script>alert(1)</script>.bundle-widget-product-page { color: blue; }` | Parsed CSS excludes script tag | Existing PPB test should cover |
| 3 | Empty CSS | empty string | Parsed CSS is `null` | Existing PPB test should cover |

### Storefront Config Formatting
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | FPB bundle has CSS | `bundleType: "full_page"`, `bundleLevelCss: "#bundle-builder-app { outline: 1px solid red; }"` | `formatBundleForWidget().bundleLevelCss` equals CSS | Proxy + metafield share formatter |
| 2 | PPB bundle has CSS | `bundleType: "product_page"`, `bundleLevelCss: ".bundle-widget-product-page { outline: 1px solid blue; }"` | `formatBundleForWidget().bundleLevelCss` equals CSS | Product metafield config uses formatter |
| 3 | Bundle has no CSS | `bundleLevelCss: null` | `formatBundleForWidget().bundleLevelCss` is `null` | Runtime can no-op |

### Runtime Injection
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | FPB selected bundle has CSS | `selectedBundle.bundleLevelCss` non-empty | One `<style data-wpb-bundle-level-css="bundleId">` exists | Scoped to active FPB bundle |
| 2 | PPB selected bundle has CSS | `selectedBundle.bundleLevelCss` non-empty | One `<style data-wpb-bundle-level-css="bundleId">` exists | Scoped to active PPB bundle |
| 3 | Selected bundle has no CSS | `selectedBundle.bundleLevelCss` empty | Existing bundle-level style is removed | Prevent stale CSS between bundles |
| 4 | Re-render same bundle | Call injection twice | Still one style tag | No duplicates |

### Chrome Verification
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | FPB metafield cached config | Hard reload after save/sync | CSS applies on first paint | Use FPB `data-bundle-config` |
| 2 | FPB proxy fallback | Verify proxy JSON | CSS exists in proxy payload | No extra CSS endpoint needed |
| 3 | PPB metafield config | Hard reload product-page bundle | CSS applies on first paint | Use PPB `data-bundle-config` |
| 4 | Scope | Open another FPB/PPB bundle/storefront | CSS does not leak | Verify style tag data attr |

## Acceptance Criteria
- [ ] FPB save sanitizes `bundleLevelCss` via `processCss()`.
- [ ] PPB save path continues sanitizing `bundleLevelCss` via `processCss()`.
- [ ] Formatted bundle config includes sanitized `bundleLevelCss`.
- [ ] FPB and PPB runtimes inject per-bundle CSS after app/template CSS.
- [ ] Runtime removes stale per-bundle CSS when selected bundle changes or CSS is empty.
- [ ] Chrome hard reload shows visible test CSS on the target FPB storefront.
- [ ] Chrome hard reload shows visible test CSS on the target PPB storefront.
- [ ] Chrome verifies CSS does not leak to another FPB or PPB bundle.
- [ ] No new storefront network request is added for Bundle Level CSS unless implementation evidence requires it.
```

- [ ] **Step 2: Mock `processCss()` in FPB save tests**

In `tests/unit/routes/fpb-save-bundle.test.ts`, add this mock near the other `jest.mock(...)` blocks if no sanitizer mock already exists:

```ts
jest.mock("../../../app/lib/css-sanitizer", () => ({
  processCss: jest.fn((css: string) => ({
    sanitizedCss: css.replace(/<script/gi, ""),
    isValid: true,
    warnings: [],
    syntaxErrors: [],
  })),
}));
```

- [ ] **Step 3: Add the failing save sanitizer test**

Append to the existing `describe("handleSaveBundle"...` area in `tests/unit/routes/fpb-save-bundle.test.ts`:

```ts
it("sanitizes FPB bundleLevelCss before saving", async () => {
  const { processCss } = require("../../../app/lib/css-sanitizer");
  const db = getDb();
  db.bundle.findUnique.mockResolvedValueOnce({ shopifyProductId: "gid://shopify/Product/1" });
  db.bundle.update.mockResolvedValueOnce({
    id: "bundle-1",
    shopifyProductId: "gid://shopify/Product/1",
    bundleType: "full_page",
    steps: [],
    pricing: null,
  });

  const formData = makeValidFormData();
  formData.set("bundleLevelCss", "<script>alert(1)</script>#bundle-builder-app { outline: 1px solid red; }");

  await handleSaveBundle({
    request: new Request("https://app.test", { method: "POST", body: formData }),
    params: { bundleId: "bundle-1" },
    context: {},
  } as any, MOCK_SESSION, MOCK_ADMIN);

  expect(processCss).toHaveBeenCalledWith("<script>alert(1)</script>#bundle-builder-app { outline: 1px solid red; }");
  expect(db.bundle.update).toHaveBeenCalledWith(
    expect.objectContaining({
      data: expect.objectContaining({
        bundleLevelCss: "alert(1)</script>#bundle-builder-app { outline: 1px solid red; }",
      }),
    }),
  );
});
```

If `makeValidFormData()` is not the local helper name, use the existing helper that the file already uses for successful save tests. Do not invent a new giant fixture if the existing helper already covers valid FPB form data.

- [ ] **Step 4: Add the empty CSS test**

```ts
it("stores null for empty FPB bundleLevelCss", async () => {
  const db = getDb();
  db.bundle.findUnique.mockResolvedValueOnce({ shopifyProductId: "gid://shopify/Product/1" });
  db.bundle.update.mockResolvedValueOnce({
    id: "bundle-1",
    shopifyProductId: "gid://shopify/Product/1",
    bundleType: "full_page",
    steps: [],
    pricing: null,
  });

  const formData = makeValidFormData();
  formData.set("bundleLevelCss", "");

  await handleSaveBundle({
    request: new Request("https://app.test", { method: "POST", body: formData }),
    params: { bundleId: "bundle-1" },
    context: {},
  } as any, MOCK_SESSION, MOCK_ADMIN);

  expect(db.bundle.update).toHaveBeenCalledWith(
    expect.objectContaining({
      data: expect.objectContaining({
        bundleLevelCss: null,
      }),
    }),
  );
});
```

- [ ] **Step 5: Run the failing tests**

Run:

```bash
npx jest tests/unit/routes/fpb-save-bundle.test.ts --runInBand
```

Expected before implementation:

```text
FAIL sanitizes FPB bundleLevelCss before saving
```

- [ ] **Step 5b: Run existing PPB sanitizer tests**

Run:

```bash
npx jest tests/unit/routes/ppb-bundle-settings.test.ts --runInBand
```

Expected before implementation:

```text
PASS tests/unit/routes/ppb-bundle-settings.test.ts
```

If this suite does not already cover safe CSS, unsafe CSS, and empty CSS for `bundleLevelCss`, add those cases to `tests/unit/routes/ppb-bundle-settings.test.ts` before touching runtime code.

- [ ] **Step 6: Implement sanitizer import and save handling**

In `app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/handlers/handlers.server.ts`, import:

```ts
import { processCss } from "../../../../lib/css-sanitizer";
```

Replace:

```ts
const bundleLevelCssRaw = formData.get("bundleLevelCss") as string | null;
const bundleLevelCss = bundleLevelCssRaw || null;
```

with:

```ts
const bundleLevelCssRaw = formData.get("bundleLevelCss") as string | null;
const bundleLevelCssInput = typeof bundleLevelCssRaw === "string" ? bundleLevelCssRaw : "";
const { sanitizedCss: sanitizedBundleLevelCss } = processCss(bundleLevelCssInput);
const bundleLevelCss = sanitizedBundleLevelCss.trim() || null;
```

- [ ] **Step 7: Run save tests**

Run:

```bash
npx jest tests/unit/routes/fpb-save-bundle.test.ts --runInBand
```

Expected:

```text
PASS tests/unit/routes/fpb-save-bundle.test.ts
```

- [ ] **Step 8: Commit Loop 1**

```bash
git add test-spec/bundle-level-css-storefront.spec.md tests/unit/routes/fpb-save-bundle.test.ts tests/unit/routes/ppb-bundle-settings.test.ts 'app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/handlers/handlers.server.ts'
git commit -m "[bundle-level-css] test: sanitize bundle CSS"
```

Commit body:

```text
Impact: touches FPB Bundle Settings save boundary and verifies existing PPB Bundle Settings sanitizer boundary.
Affected: handlers.server.ts, fpb-save-bundle.test.ts, ppb-bundle-settings.test.ts, test-spec/bundle-level-css-storefront.spec.md
Tested by: npx jest tests/unit/routes/fpb-save-bundle.test.ts --runInBand; npx jest tests/unit/routes/ppb-bundle-settings.test.ts --runInBand
```

---

## Agentic Loop 2: Emit Bundle Level CSS In Storefront Config

**Goal:** Make FPB and PPB storefront configs contain the saved sanitized CSS.

**Files:**
- Modify: `app/lib/bundle-formatter.server.ts`
- Modify: `tests/unit/lib/bundle-formatter.test.ts`
- Optional test if needed: `tests/unit/services/fpb-config-metafield.test.ts`
- Optional test if needed: existing PPB product metafield/config delivery test file
- Optional test if needed: `tests/unit/routes/api.bundle.$bundleId.json.test.ts` or existing API bundle test file

- [ ] **Step 1: Add failing formatter tests**

Append to `tests/unit/lib/bundle-formatter.test.ts`:

```ts
it("emits per-bundle Bundle Level CSS for FPB storefront runtime", () => {
  const css = "#bundle-builder-app { outline: 1px solid rgb(255, 0, 204); }";
  const result = formatBundleForWidget(makeBundle({
    bundleType: "full_page",
    bundleLevelCss: css,
  }) as any);

  expect(result.bundleLevelCss).toBe(css);
});

it("emits per-bundle Bundle Level CSS for PPB storefront runtime", () => {
  const css = ".bundle-widget-product-page { outline: 1px solid rgb(0, 200, 255); }";
  const result = formatBundleForWidget(makeBundle({
    bundleType: "product_page",
    bundleLevelCss: css,
  }) as any);

  expect(result.bundleLevelCss).toBe(css);
});

it("emits null bundleLevelCss when the bundle has no Bundle Level CSS", () => {
  const result = formatBundleForWidget(makeBundle({
    bundleType: "product_page",
    bundleLevelCss: null,
  }) as any);

  expect(result.bundleLevelCss).toBeNull();
});
```

- [ ] **Step 2: Run failing formatter tests**

Run:

```bash
npx jest tests/unit/lib/bundle-formatter.test.ts --runInBand
```

Expected before implementation:

```text
FAIL emits per-bundle Bundle Level CSS for FPB storefront runtime
FAIL emits per-bundle Bundle Level CSS for PPB storefront runtime
```

- [ ] **Step 3: Add `bundleLevelCss` to formatted type**

In `app/lib/bundle-formatter.server.ts`, add this to `FormattedBundle`:

```ts
  bundleLevelCss: string | null;
```

Place it near other per-bundle runtime settings, before `steps`.

- [ ] **Step 4: Emit `bundleLevelCss`**

In the object returned by `formatBundleForWidget()`, add:

```ts
    bundleLevelCss: typeof bundle.bundleLevelCss === "string" && bundle.bundleLevelCss.trim()
      ? bundle.bundleLevelCss
      : null,
```

Place it near `bundleTextConfig` / `personalizationData` so the config shape is easy to audit.

- [ ] **Step 5: Run formatter tests**

Run:

```bash
npx jest tests/unit/lib/bundle-formatter.test.ts --runInBand
```

Expected:

```text
PASS tests/unit/lib/bundle-formatter.test.ts
```

- [ ] **Step 6: Verify FPB and PPB config paths use formatter**

Run:

```bash
rg -n "formatBundleForWidget\\(bundle\\)|bundle_ui_config|data-bundle-config" app/services/widget-installation/widget-full-page-bundle.server.ts 'app/routes/api/api.bundle.$bundleId[.]json.tsx' extensions/bundle-builder/blocks/bundle-full-page.liquid extensions/bundle-builder/blocks/bundle-product-page.liquid
```

Expected:

```text
FPB page metafield writer and proxy API use formatBundleForWidget(bundle)
FPB and PPB Liquid blocks expose data-bundle-config to widgets
```

- [ ] **Step 7: Run related service/API tests**

Run:

```bash
npx jest tests/unit/services/fpb-config-metafield.test.ts tests/unit/routes/api.bundles.test.ts --runInBand
```

Expected:

```text
PASS both suites
```

If an existing mock formatter in `tests/unit/services/fpb-config-metafield.test.ts` snapshots a fixed object, update only that mock to include `bundleLevelCss: bundle.bundleLevelCss ?? null`.

- [ ] **Step 8: Commit Loop 2**

```bash
git add app/lib/bundle-formatter.server.ts tests/unit/lib/bundle-formatter.test.ts tests/unit/services/fpb-config-metafield.test.ts tests/unit/routes/api.bundles.test.ts
git commit -m "[bundle-level-css] feat: emit bundle CSS in widget config"
```

Commit body:

```text
Impact: touches shared widget config formatter used by FPB and PPB storefront config payloads.
Affected: bundle-formatter.server.ts, formatter tests, optional formatter-dependent mocks.
Tested by: npx jest tests/unit/lib/bundle-formatter.test.ts --runInBand; npx jest tests/unit/services/fpb-config-metafield.test.ts tests/unit/routes/api.bundles.test.ts --runInBand
```

---

## Agentic Loop 3: Runtime Style Injection

**Goal:** Apply per-bundle CSS in both storefront widgets after the selected bundle config is known, without duplicate style tags and without stale CSS between bundles.

**Files:**
- Create: `app/assets/widgets/shared/bundle-level-css-methods.js`
- Modify: `app/assets/bundle-widget-full-page.js`
- Modify: `app/assets/bundle-widget-product-page.js`
- Create: `tests/unit/assets/bundle-level-css-runtime.test.ts`
- Generated: `extensions/bundle-builder/assets/bundle-widget-full-page-bundled.js`
- Generated: `extensions/bundle-builder/assets/bundle-widget-product-page-bundled.js`

- [ ] **Step 1: Write source-contract tests for runtime wiring**

Create `tests/unit/assets/bundle-level-css-runtime.test.ts`:

```ts
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const fullPageSource = () =>
  readFileSync(join(root, "app/assets/bundle-widget-full-page.js"), "utf8");
const productPageSource = () =>
  readFileSync(join(root, "app/assets/bundle-widget-product-page.js"), "utf8");
const helperSource = () =>
  readFileSync(join(root, "app/assets/widgets/shared/bundle-level-css-methods.js"), "utf8");

describe("Bundle Level CSS storefront runtime wiring", () => {
  it("mixes bundle-level CSS methods into the full-page widget", () => {
    const source = fullPageSource();

    expect(source).toContain("bundleLevelCssMethods");
    expect(source).toContain("Object.assign(BundleWidgetFullPage.prototype");
  });

  it("mixes bundle-level CSS methods into the product-page widget", () => {
    const source = productPageSource();

    expect(source).toContain("bundleLevelCssMethods");
    expect(source).toContain("Object.assign(");
    expect(source).toContain("BundleWidgetProductPage.prototype");
  });

  it("applies bundle-level CSS after full-page selectedBundle is resolved", () => {
    const source = fullPageSource();

    expect(source).toContain("this.applyBundleLevelCss(this.selectedBundle)");
    expect(source.indexOf("this.selectBundle();")).toBeLessThan(
      source.indexOf("this.applyBundleLevelCss(this.selectedBundle)"),
    );
  });

  it("applies bundle-level CSS after product-page selectedBundle is resolved", () => {
    const source = productPageSource();

    expect(source).toContain("this.applyBundleLevelCss(this.selectedBundle)");
    expect(source.indexOf("this.selectBundle();")).toBeLessThan(
      source.indexOf("this.applyBundleLevelCss(this.selectedBundle)"),
    );
  });

  it("runtime helper scopes and deduplicates per-bundle CSS style tags", () => {
    const source = helperSource();

    expect(source).toContain("data-wpb-bundle-level-css");
    expect(source).toContain("removeExistingBundleLevelCss");
    expect(source).toContain("style.textContent = css");
    expect(source).toContain("document.head.appendChild(style)");
  });
});
```

This is a JS source wiring test, not a UI styling/layout test.

- [ ] **Step 2: Run failing runtime tests**

Run:

```bash
npx jest tests/unit/assets/bundle-level-css-runtime.test.ts --runInBand
```

Expected before implementation:

```text
FAIL because shared bundle-level-css-methods.js does not exist
```

- [ ] **Step 3: Create runtime helper**

Create `app/assets/widgets/shared/bundle-level-css-methods.js`:

```js
export const bundleLevelCssMethods = {
  getBundleLevelCssStyleId(bundleId) {
    const safeId = String(bundleId || 'unknown').replace(/[^a-zA-Z0-9_-]/g, '-');
    return `wpb-bundle-level-css-${safeId}`;
  },

  removeExistingBundleLevelCss() {
    document
      .querySelectorAll('style[data-wpb-bundle-level-css]')
      .forEach((style) => style.remove());
  },

  applyBundleLevelCss(bundle) {
    this.removeExistingBundleLevelCss();

    const css = typeof bundle?.bundleLevelCss === 'string'
      ? bundle.bundleLevelCss.trim()
      : '';

    if (!css) return;

    const style = document.createElement('style');
    style.id = this.getBundleLevelCssStyleId(bundle.id);
    style.type = 'text/css';
    style.dataset.wpbBundleLevelCss = String(bundle.id || '');
    style.textContent = css;
    document.head.appendChild(style);
  },
};
```

- [ ] **Step 4: Import helper in full-page widget**

In `app/assets/bundle-widget-full-page.js`, add:

```js
import { bundleLevelCssMethods } from './widgets/shared/bundle-level-css-methods.js';
```

Then add it to the existing prototype mixin:

```js
Object.assign(BundleWidgetFullPage.prototype,
  // existing method groups...
  bundleLevelCssMethods,
);
```

Follow the file’s existing import/mixin ordering. Do not create a second `Object.assign()`.

- [ ] **Step 4b: Import helper in product-page widget**

In `app/assets/bundle-widget-product-page.js`, add:

```js
import { bundleLevelCssMethods } from './widgets/shared/bundle-level-css-methods.js';
```

Then add it to the existing prototype mixin:

```js
Object.assign(
  BundleWidgetProductPage.prototype,
  // existing method groups...
  bundleLevelCssMethods,
);
```

Follow the file’s existing import/mixin ordering. Do not create a second `Object.assign()`.

- [ ] **Step 5: Call helper after selecting the bundle**

In `app/assets/bundle-widget-full-page.js`, immediately after:

```js
this.selectBundle();
```

and after the `!this.selectedBundle` guard, add:

```js
this.applyBundleLevelCss(this.selectedBundle);
```

The call must run before first product/sidebar render so merchant CSS is present before visible UI settles.

- [ ] **Step 5b: Call helper after selecting the PPB bundle**

In `app/assets/bundle-widget-product-page.js`, immediately after:

```js
this.selectBundle();
```

and after the `!this.selectedBundle` guard, add:

```js
this.applyBundleLevelCss(this.selectedBundle);
```

The call must run before `initializeDataStructures()`, `_markProductPageTemplate()`, and `renderUI()` so merchant CSS is present before the first product-page UI settles.

- [ ] **Step 6: Run runtime test**

Run:

```bash
npx jest tests/unit/assets/bundle-level-css-runtime.test.ts --runInBand
```

Expected:

```text
PASS tests/unit/assets/bundle-level-css-runtime.test.ts
```

- [ ] **Step 7: Build widget bundle**

Run:

```bash
npm run build:widgets
```

Expected:

```text
bundle-widget-full-page-bundled.js rebuilt successfully
bundle-widget-product-page-bundled.js rebuilt successfully
```

- [ ] **Step 8: Syntax checks**

Run:

```bash
node --check app/assets/bundle-widget-full-page.js
node --check app/assets/bundle-widget-product-page.js
node --check app/assets/widgets/shared/bundle-level-css-methods.js
node --check extensions/bundle-builder/assets/bundle-widget-full-page-bundled.js
node --check extensions/bundle-builder/assets/bundle-widget-product-page-bundled.js
```

Expected:

```text
all commands exit 0
```

- [ ] **Step 9: Commit Loop 3**

```bash
git add app/assets/bundle-widget-full-page.js app/assets/bundle-widget-product-page.js app/assets/widgets/shared/bundle-level-css-methods.js extensions/bundle-builder/assets/bundle-widget-full-page-bundled.js extensions/bundle-builder/assets/bundle-widget-product-page-bundled.js tests/unit/assets/bundle-level-css-runtime.test.ts
git commit -m "[bundle-level-css] feat: apply bundle CSS at runtime"
```

Commit body:

```text
Impact: touches FPB and PPB storefront runtime initialization and generated widget assets.
Affected: bundle-widget-full-page.js, bundle-widget-product-page.js, shared bundle-level-css-methods.js, generated widget bundles, runtime source-contract test.
Tested by: npx jest tests/unit/assets/bundle-level-css-runtime.test.ts --runInBand; npm run build:widgets; node --check app/assets/bundle-widget-full-page.js; node --check app/assets/bundle-widget-product-page.js; node --check app/assets/widgets/shared/bundle-level-css-methods.js; node --check extensions/bundle-builder/assets/bundle-widget-full-page-bundled.js; node --check extensions/bundle-builder/assets/bundle-widget-product-page-bundled.js
```

---

## Agentic Loop 4: Metafield/Proxy Cache Verification

**Goal:** Prove FPB and PPB storefront data paths carry Bundle Level CSS.

**Files:**
- Modify only if tests expose a gap:
  - `app/services/widget-installation/widget-full-page-bundle.server.ts`
  - `app/routes/api/api.bundle.$bundleId[.]json.tsx`
  - existing PPB product metafield/config writer if located during Loop 0
- Tests:
  - `tests/unit/services/fpb-config-metafield.test.ts`
  - existing PPB product metafield/config delivery test file if present
  - `tests/unit/routes/api.bundles.test.ts`
  - `tests/unit/lib/bundle-formatter.test.ts`

- [ ] **Step 1: Add page-metafield assertion if missing**

In `tests/unit/services/fpb-config-metafield.test.ts`, add or update a test so the mock bundle includes:

```ts
bundleLevelCss: "#bundle-builder-app { outline: 1px solid red; }",
```

Assert the written metafield JSON contains:

```ts
expect(metafieldValue).toContain('"bundleLevelCss":"#bundle-builder-app { outline: 1px solid red; }"');
```

Use the existing test’s captured metafield variable name; do not rewrite the test harness.

- [ ] **Step 2: Add proxy JSON assertion if missing**

In `tests/unit/routes/api.bundles.test.ts`, add a bundle fixture with:

```ts
bundleLevelCss: "#bundle-builder-app { outline: 1px solid red; }",
```

Assert response JSON:

```ts
expect(body.bundle.bundleLevelCss).toBe("#bundle-builder-app { outline: 1px solid red; }");
```

Use the existing API test loader helper and DB mock. Do not add a new request stack if one already exists in the file.

- [ ] **Step 2b: Add PPB product metafield/config assertion if a focused suite exists**

Search:

```bash
rg -n "bundle-product-page|product page.*metafield|bundle_ui_config|data-bundle-config|formatBundleForWidget" tests/unit app/services app/routes -g '*.{ts,tsx}'
```

If a focused PPB config delivery suite exists, add a product-page bundle fixture with:

```ts
bundleType: "product_page",
bundleLevelCss: ".bundle-widget-product-page { outline: 1px solid blue; }",
```

Assert the written/serialized config contains:

```ts
expect(serializedConfig).toContain('"bundleLevelCss":".bundle-widget-product-page { outline: 1px solid blue; }"');
```

Use the existing captured variable name in that suite. If no focused PPB delivery suite exists, rely on `tests/unit/lib/bundle-formatter.test.ts` for shared formatter coverage and Chrome PPB verification for end-to-end evidence.

- [ ] **Step 3: Run cache-path tests**

Run:

```bash
npx jest tests/unit/services/fpb-config-metafield.test.ts tests/unit/routes/api.bundles.test.ts tests/unit/lib/bundle-formatter.test.ts --runInBand
```

Expected:

```text
PASS both suites
```

- [ ] **Step 4: Confirm no new CSS endpoint was added**

Run:

```bash
git diff --name-only | rg "api\\..*css|design-settings|controls-settings" || true
```

Expected:

```text
No new API route for per-bundle CSS unless a previous step documented why config payload cannot be used.
```

- [ ] **Step 5: Commit Loop 4 if tests changed**

```bash
git add tests/unit/services/fpb-config-metafield.test.ts tests/unit/routes/api.bundles.test.ts tests/unit/lib/bundle-formatter.test.ts
git commit -m "[bundle-level-css] test: cover bundle CSS config delivery"
```

Commit body:

```text
Impact: tests the existing bundle config delivery paths, no runtime behavior change.
Affected: fpb-config-metafield.test.ts, api.bundles.test.ts, formatter tests, optional PPB config delivery suite.
Tested by: npx jest tests/unit/services/fpb-config-metafield.test.ts tests/unit/routes/api.bundles.test.ts tests/unit/lib/bundle-formatter.test.ts --runInBand
```

Skip the commit if Loop 2 already covered both paths and this loop creates no diff.

---

## Agentic Loop 5: Chrome Storefront Verification

**Goal:** Verify the EB-equivalent merchant workflow on the hot-reload Agent store with real Admin save and real storefront render.

**Files:**
- No code files unless Chrome finds a defect.
- Evidence files in `/private/tmp`.

- [ ] **Step 1: Prepare visible test CSS**

Use this CSS in FPB Bundle Settings → Bundle Level CSS:

```css
#bundle-builder-app {
  outline: 6px solid rgb(255, 0, 204);
}

#bundle-builder-app .bundle-widget-container,
#bundle-builder-app .sidebar-layout-wrapper {
  --wpb-bundle-level-css-proof: applied;
}
```

Use this CSS in PPB Bundle Settings → Bundle Level CSS:

```css
.bundle-widget-product-page,
.bundle-widget-product-page-container {
  outline: 6px solid rgb(0, 200, 255);
}

.bundle-widget-product-page * {
  --wpb-ppb-bundle-level-css-proof: applied;
}
```

- [ ] **Step 2: Save FPB CSS in Admin**

Use Chrome DevTools MCP on the embedded Admin URL:

```text
https://admin.shopify.com/store/wolfpack-store-test-1/apps/wolfpack-product-bundles-sit/app/bundles/full-page-bundle/configure/<bundleId>
```

Actions:

1. Go to Bundle Settings.
2. Expand Bundle Level CSS.
3. Paste the test CSS.
4. Save.
5. Confirm save success UI.

Expected:

```text
Admin keeps the CSS in the textarea after save/reload.
```

- [ ] **Step 2b: Save PPB CSS in Admin**

Use Chrome DevTools MCP on the embedded Admin URL:

```text
https://admin.shopify.com/store/wolfpack-store-test-1/apps/wolfpack-product-bundles-sit/app/bundles/product-page-bundle/configure/<bundleId>
```

Actions:

1. Go to Bundle Settings.
2. Expand Bundle Level CSS.
3. Paste the PPB test CSS.
4. Save.
5. Confirm save success UI.

Expected:

```text
Admin keeps the PPB CSS in the textarea after save/reload.
```

- [ ] **Step 3: Hard reload FPB storefront desktop**

Use the bundle storefront URL produced by the Admin "View your bundle" action or the existing test page.

Chrome DevTools MCP:

```json
{"type":"reload","ignoreCache":true,"timeout":60000}
```

Evaluate:

```js
() => {
  const app = document.querySelector('#bundle-builder-app');
  const style = document.querySelector('style[data-wpb-bundle-level-css]');
  const outline = app ? getComputedStyle(app).outline : null;
  return {
    hasApp: !!app,
    outline,
    styleTag: style ? {
      id: style.id,
      bundleId: style.getAttribute('data-wpb-bundle-level-css'),
      text: style.textContent,
    } : null,
    scrollWidth: document.documentElement.scrollWidth,
    viewportWidth: window.innerWidth,
  };
}
```

Expected:

```json
{
  "hasApp": true,
  "outline": "rgb(255, 0, 204) solid 6px",
  "styleTag": { "text": "...outline..." },
  "scrollWidth": same as viewportWidth or no unexpected overflow
}
```

Save output:

```text
/private/tmp/bundle-level-css-desktop.json
/private/tmp/bundle-level-css-desktop.png
```

- [ ] **Step 4: Hard reload storefront mobile**

Set viewport:

```text
390x844x3,mobile,touch
```

Hard reload ignoring cache. Evaluate the same script.

Expected:

```text
Same FPB style tag exists, outline applies, no horizontal scroll introduced by app code.
```

Save output:

```text
/private/tmp/bundle-level-css-mobile.json
/private/tmp/bundle-level-css-mobile.png
```

- [ ] **Step 4b: Hard reload PPB storefront desktop and mobile**

Use the PPB product-page storefront URL for the saved bundle. Hard reload ignoring cache on desktop, then set viewport `390x844x3,mobile,touch` and hard reload again.

Evaluate:

```js
() => {
  const app = document.querySelector('.bundle-widget-product-page, .bundle-widget-product-page-container, [data-bundle-config]');
  const style = document.querySelector('style[data-wpb-bundle-level-css]');
  const outline = app ? getComputedStyle(app).outline : null;
  return {
    hasApp: !!app,
    outline,
    styleTag: style ? {
      id: style.id,
      bundleId: style.getAttribute('data-wpb-bundle-level-css'),
      text: style.textContent,
    } : null,
    scrollWidth: document.documentElement.scrollWidth,
    viewportWidth: window.innerWidth,
  };
}
```

Expected:

```text
PPB style tag exists, rgb(0, 200, 255) outline applies to the PPB widget root, and mobile has no app-caused horizontal overflow.
```

Save output:

```text
/private/tmp/bundle-level-css-ppb-desktop.json
/private/tmp/bundle-level-css-ppb-desktop.png
/private/tmp/bundle-level-css-ppb-mobile.json
/private/tmp/bundle-level-css-ppb-mobile.png
```

- [ ] **Step 5: Verify stale CSS removal for FPB and PPB**

In each Admin configure route, clear Bundle Level CSS, save, then hard reload the matching storefront.

Evaluate:

```js
() => ({
  styleTagCount: document.querySelectorAll('style[data-wpb-bundle-level-css]').length,
  outline: getComputedStyle(document.querySelector('#bundle-builder-app')).outline,
})
```

Expected:

```json
{
  "styleTagCount": 0,
  "outline": "rgb(0, 0, 0) none 0px"
}
```

- [ ] **Step 6: Verify no cross-bundle leak**

Open a different FPB storefront bundle and a different PPB storefront bundle that have no Bundle Level CSS.

Evaluate:

```js
() => ({
  bundleId: document.querySelector('#bundle-builder-app')?.dataset.bundleId,
  styleTagCount: document.querySelectorAll('style[data-wpb-bundle-level-css]').length,
  outline: document.querySelector('#bundle-builder-app')
    ? getComputedStyle(document.querySelector('#bundle-builder-app')).outline
    : null,
})
```

Expected:

```text
No Bundle Level CSS style tag from the first bundle appears on either FPB or PPB.
```

- [ ] **Step 7: Verify FPB proxy fallback if possible**

If the current page has `data-bundle-config` populated, do not change the widget config loading order. Instead, verify the proxy directly:

```js
async () => {
  const bundleId = document.querySelector('#bundle-builder-app')?.dataset.bundleId;
  const response = await fetch(`/apps/product-bundles/api/bundle/${bundleId}.json`, { cache: 'no-store' });
  const json = await response.json();
  return {
    status: response.status,
    bundleLevelCss: json.bundle?.bundleLevelCss || null,
  };
}
```

Expected:

```text
Proxy response includes the same sanitized CSS when the field is set.
```

- [ ] **Step 7b: Verify PPB config payload from DOM**

Because PPB uses `data-bundle-config` as its storefront source, evaluate:

```js
() => {
  const node = document.querySelector('[data-bundle-config]');
  const raw = node?.getAttribute('data-bundle-config') || null;
  const parsed = raw ? JSON.parse(raw) : null;
  return {
    bundleId: parsed?.id || null,
    bundleType: parsed?.bundleType || null,
    bundleLevelCss: parsed?.bundleLevelCss || null,
  };
}
```

Expected:

```text
PPB DOM config contains bundleLevelCss matching the saved sanitized CSS.
```

- [ ] **Step 8: Remove test CSS before final commit if needed**

If Chrome testing saved visible outline CSS on shared FPB or PPB fixtures, clear it again in Admin and verify both storefronts return to normal. Do not leave visual proof CSS on the shared test store unless the user explicitly asks.

---

## Agentic Loop 6: Regression, Build, And Graph Verification

**Goal:** Finish with repo-required verification and generated assets.

**Files:**
- Generated: `extensions/bundle-builder/assets/bundle-widget-full-page-bundled.js`
- Generated: `extensions/bundle-builder/assets/bundle-widget-product-page-bundled.js`
- Generated only if CSS changed: `extensions/bundle-builder/assets/bundle-widget-full-page*.css`
- Generated only if CSS changed: `extensions/bundle-builder/assets/bundle-widget-product-page*.css`
- Generated: `graphify-out/GRAPH_REPORT.md`, `graphify-out/graph.json`

- [ ] **Step 1: Run focused unit suites**

Run:

```bash
npx jest tests/unit/routes/fpb-save-bundle.test.ts tests/unit/routes/ppb-bundle-settings.test.ts tests/unit/lib/bundle-formatter.test.ts tests/unit/assets/bundle-level-css-runtime.test.ts --runInBand
```

Expected:

```text
PASS all listed suites
```

- [ ] **Step 2: Run related config delivery suites**

Run:

```bash
npx jest tests/unit/services/fpb-config-metafield.test.ts tests/unit/routes/api.bundles.test.ts --runInBand
```

Expected:

```text
PASS all listed suites
```

- [ ] **Step 3: Build widgets**

Run:

```bash
npm run build:widgets
```

Expected:

```text
full-page widget bundle rebuilt
product-page widget bundle rebuilt
SDK rebuilt
```

- [ ] **Step 4: Run CSS minifier only if CSS source changed**

Run if any file under `app/assets/widgets/full-page-css/` or `app/assets/widgets/product-page-css/` changed:

```bash
npm run minify:assets css
```

Expected:

```text
CSS assets minify successfully and remain under Shopify's 100,000 B app-block asset limit where applicable.
```

- [ ] **Step 5: Syntax checks**

Run:

```bash
node --check app/assets/bundle-widget-full-page.js
node --check app/assets/bundle-widget-product-page.js
node --check app/assets/widgets/shared/bundle-level-css-methods.js
node --check extensions/bundle-builder/assets/bundle-widget-full-page-bundled.js
node --check extensions/bundle-builder/assets/bundle-widget-product-page-bundled.js
```

Expected:

```text
all commands exit 0
```

- [ ] **Step 6: Lint modified TS/TSX files**

Run:

```bash
npx eslint --max-warnings 9999 app/lib/bundle-formatter.server.ts 'app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/handlers/handlers.server.ts' 'app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/handlers/parsers.ts' tests/unit/lib/bundle-formatter.test.ts tests/unit/routes/fpb-save-bundle.test.ts tests/unit/routes/ppb-bundle-settings.test.ts tests/unit/assets/bundle-level-css-runtime.test.ts
```

Expected:

```text
0 ESLint errors. Warnings are acceptable only if pre-existing or caused by files outside the lintable project.
```

If raw widget JS is ignored by ESLint, record that and rely on `node --check` for those files.

- [ ] **Step 7: Rebuild graph**

Run:

```bash
npm run graphify:rebuild
```

Expected:

```text
graphify completes. Existing extraction warning about app_constants_errors_ts may remain.
```

- [ ] **Step 8: Final whitespace and status checks**

Run:

```bash
git diff --check
git status --short
```

Expected:

```text
git diff --check exits 0
Only intended files are modified or staged
```

- [ ] **Step 9: Final commit**

If previous loop commits were not used, commit the complete slice:

```bash
git add test-spec/bundle-level-css-storefront.spec.md \
  tests/unit/routes/fpb-save-bundle.test.ts \
  tests/unit/routes/ppb-bundle-settings.test.ts \
  tests/unit/lib/bundle-formatter.test.ts \
  tests/unit/assets/bundle-level-css-runtime.test.ts \
  app/routes/app/app.bundles.full-page-bundle.configure.\$bundleId/handlers/handlers.server.ts \
  app/routes/app/app.bundles.product-page-bundle.configure.\$bundleId/handlers/parsers.ts \
  app/lib/bundle-formatter.server.ts \
  app/assets/bundle-widget-full-page.js \
  app/assets/bundle-widget-product-page.js \
  app/assets/widgets/shared/bundle-level-css-methods.js \
  extensions/bundle-builder/assets/bundle-widget-full-page-bundled.js \
  extensions/bundle-builder/assets/bundle-widget-product-page-bundled.js \
  graphify-out/GRAPH_REPORT.md \
  graphify-out/graph.json

git commit -m "[bundle-level-css] feat: wire Bundle Level CSS to storefront"
```

Commit body:

```text
Impact: touches FPB Bundle Settings save boundary, verifies PPB Bundle Settings sanitizer boundary, shared widget config formatter, FPB and PPB storefront runtime initialization, generated widget assets, and graphify outputs.
Affected: handlers.server.ts, parsers.ts if PPB sanitizer tests require changes, bundle-formatter.server.ts, bundle-widget-full-page.js, bundle-widget-product-page.js, shared bundle-level-css-methods.js, generated widget bundles, focused tests, graphify outputs.
Tested by: npx jest tests/unit/routes/fpb-save-bundle.test.ts tests/unit/routes/ppb-bundle-settings.test.ts tests/unit/lib/bundle-formatter.test.ts tests/unit/assets/bundle-level-css-runtime.test.ts --runInBand; npx jest tests/unit/services/fpb-config-metafield.test.ts tests/unit/routes/api.bundles.test.ts tests/unit/lib/bundle-formatter.test.ts --runInBand; npm run build:widgets; node --check app/assets/bundle-widget-full-page.js; node --check app/assets/bundle-widget-product-page.js; node --check app/assets/widgets/shared/bundle-level-css-methods.js; node --check extensions/bundle-builder/assets/bundle-widget-full-page-bundled.js; node --check extensions/bundle-builder/assets/bundle-widget-product-page-bundled.js; npx eslint --max-warnings 9999 <modified TS/TSX/test files>; npm run graphify:rebuild; git diff --check; Chrome FPB/PPB desktop/mobile hard reload verification.
```

---

## Stopping Criteria

- Bundle Level CSS entered in FPB Bundle Settings is sanitized, saved, and reloads in Admin.
- Bundle Level CSS entered in PPB Bundle Settings is sanitized, saved, and reloads in Admin.
- `formatBundleForWidget()` includes `bundleLevelCss` so both page-metafield config and proxy API config carry it.
- Full-page storefront injects exactly one `style[data-wpb-bundle-level-css]` tag for the selected bundle when CSS exists.
- Product-page storefront injects exactly one `style[data-wpb-bundle-level-css]` tag for the selected bundle when CSS exists.
- Full-page and product-page storefronts remove the bundle-level style tag when CSS is empty or bundle changes.
- Merchant CSS applies after app/template CSS and can override widget styles, matching EB's Bundle Level CSS intent.
- Chrome desktop and mobile hard reloads prove the CSS applies on the target FPB bundle.
- Chrome desktop and mobile hard reloads prove the CSS applies on the target PPB bundle.
- Chrome verifies CSS does not leak to another FPB or PPB bundle.
- No `shopify app deploy` or `npm run dev` was run.
- All focused tests, build, syntax, graphify, and diff checks pass.

## Open Implementation Questions To Resolve During Loop 0

- Do the shared test FPB and PPB pages already have stable bundle IDs suitable for Chrome verification, or should execution use the Admin "View your bundle" action for the active fixtures?
- Does the Admin save flow automatically refresh the page `custom.bundle_config` metafield after saving Bundle Settings, or does the user need to click the existing sync/place-widget flow? Do not change the config loading priority while answering this; inspect current save side effects first.
- If the page metafield remains stale after Admin save, is that an existing sync gap or expected Shopify CDN delay? Prefer proxy JSON verification and document the cache behavior before changing architecture.

## Self-Review

- Spec coverage: Plan covers FPB and PPB Admin save, sanitizer, config emission, runtime injection, cache/proxy paths, Chrome desktop/mobile testing, cross-bundle leak testing, generated assets, and graphify.
- Placeholder scan: No step uses TBD/TODO/fill-in instructions. Steps reference exact files and commands.
- Type consistency: `bundleLevelCss` is consistently `string | null` on formatted config and raw `string` only inside sanitizer input handling.
