# EB ↔ WPB API Parity Plan

**Status:** Draft — 2026-05-31  
**Author:** Claude Code (session)  
**Issue:** preview-bundle-gate-1 + broader architecture alignment  
**Sources:**
- Live Chrome DevTools network inspector (paths, methods, status codes, response sizes — bodies evicted from memory except where noted)
- `internal docs/EB Implementation Reference.md` (grounded truth for response body shapes)
- `docs/competitor-analysis/16-eb-full-data-flow-investigation.md` (full evidence record)
- `docs/competitor-analysis/17-eb-complete-configure-e2e-audit.md`

---

## Data Provenance Legend

| Symbol | Meaning |
|--------|---------|
| ✅ | Directly observed in network inspector (path + method + status + body) |
| 🔍 | Path + method + status observed live; response body shape from `internal docs/EB Implementation Reference.md` |
| 📖 | Shape from reference doc only — not directly observed in this session's network trace |

---

## Part 1 — EB Endpoint Inventory

All EB Admin API requests target `https://prod.backend.giftbox.giftkart.app` with session token auth (JWT via `X-Shopify-Session-Token` or equivalent). All GET endpoints use HTTP ETag caching (304 Not Modified on repeat calls). Frontend origin: `https://prod.frontend.giftbox.giftkart.app`.

### 1.1 App Embed / Utility

| Method | Path | Status | Body Captured | Notes |
|--------|------|--------|---------------|-------|
| `GET` | `/api/utility/isAppEmbedEnabled?shopName={shop}` | 200 | ✅ `{"statusCode":200,"message":"success","data":{"isAppEmbedEnabled":true}}` | CORS `*`; cached with ETag (304 on repeat); 72 bytes |

### 1.2 FPB (Full Page Bundle) — stepsConfiguration

| Method | Path | Status | Body Shape | Notes |
|--------|------|--------|------------|-------|
| `POST` | `/api/stepsConfiguration/create` | 201 | 🔍 Returns created bundle with numeric `bundleId` | Called on "Create Bundle" |
| `GET` | `/api/stepsConfiguration?bundleId={id}&shopName={shop}` | 200 | 🔍 Full FPB config object including all `productsData{N}`, `landingPageData`, `bundleTextConfig`, `discountConfiguration`, `boxSelection`, `bundleDesignTemplate`, `bundleDesignPresetId` | Called on configure page load |
| `POST` | `/api/stepsConfiguration/saveMultipleCategoriesData?bundleId={id}&shopName={shop}` | 200 | 🔍 Updated step config | Save step categories (hydrated product objects in payload — see reference doc) |
| `POST` | `/api/stepsConfiguration/update?bundleId={id}&shopName={shop}` | 200 | 🔍 Full updated bundle config (37 KB wrapper payload) | Top-level keys: `landingPageData`, `bundleTextConfig`, `summaryPageData`, `personalizationData`, `boxSelection`, `bundleDesignTemplate`, `bundleDesignPresetId`, `productsData1`, `productsData2`, `readinessScore` |
| `POST` | `/api/stepsConfiguration/savePersonalization?shopName={shop}` | 200 | 🔍 Updated personalization section | Handles both add-ons and gift message (same endpoint, different shape — see reference doc) |
| `POST` | `/api/discount/get?shopName={shop}` | 200 | 🔍 `{"discountConfiguration": {...}, "metafieldData": {"discount": {...}}}` | Separate read for discount data |

### 1.3 PPB (Product Page Bundle / Mix & Match)

| Method | Path | Status | Body Shape | Notes |
|--------|------|--------|------------|-------|
| `POST` | `/api/mixAndMatch/create` | 201 | 🔍 Returns `{"offerId": "MIX-XXXXXX", "bundleDesignTemplate": "PDP_INPAGE", ...}` | Called on "Create Bundle" |
| `GET` | `/api/mixAndMatch?offerId={MIX-id}&shopName={shop}` | 200 | 🔍 Full PPB config object including all steps/categories, conditions, `discountConfiguration`, `defaultProductsData`, template fields | Called on configure page load |
| `POST` | `/api/mixAndMatch/update?offerId={MIX-id}&shopName={shop}` | 200 | 🔍 Full updated PPB config — see reference doc for exact shape including `conditions`, `displayVariantsAsIndividualProducts`, `displayVariantsAsSwatches` per category | Save any PPB field |

### 1.4 Design / DCP Settings

| Method | Path | Status | Body Shape | Notes |
|--------|------|--------|------------|-------|
| `GET` | `/api/pageCustomization/getSettings?shopName={shop}` | 200 | 🔍 Store-level DCP including `mixAndMatchBundleSettings` (25+ fields), PPB global controls | Called on configure page load (shared store-level settings) |
| `POST` | `/api/pageCustomization/updateSettings?shopName={shop}` | 200 | 🔍 Updated settings ack | Save DCP changes |

### 1.5 Storefront App-Proxy Endpoints (storefront widget)

| Method | Path | Status | Notes |
|--------|------|--------|-------|
| `GET` | `/apps/gbb/{bundleId}` or `/apps/gbb/bundle/{id}` | 200 | Returns HTML page with `stepsConfigurationData` inline JSON (no separate async fetch) |
| `POST` | `/apps/gbb/updateMixAndMatchBundleView` | 200 | PPB view tracking — called before cart add |
| `GET` | `/cart.js?app=gbbMixBundleApp` | 200 | Pre-add cart state read (PPB only) |

---

## Part 2 — WPB Current Equivalent Mapping

### 2.1 App Embed Check

| EB Endpoint | WPB Current | Gap |
|-------------|------------|-----|
| `GET /api/utility/isAppEmbedEnabled` | `checkAppEmbedEnabled()` in `app/services/theme/app-embed-check.server.ts` — reads `settings_data.json` via Shopify Admin GQL | Architecture gap: EB hits own backend with cached result; WPB parses theme file on each call. **Partially closed**: DB cache (5-min TTL) added in `fetchEmbedData` — matches EB's ETag TTL pattern. |

### 2.2 FPB Create

| EB Endpoint | WPB Current | Gap |
|-------------|------------|-----|
| `POST /api/stepsConfiguration/create` | `app/routes/app/app.bundles.create_.configure.$bundleId/route.tsx` — action creates bundle record via Prisma | **Architecture gap**: EB returns a numeric `bundleId` from a dedicated create endpoint; WPB creates the bundle record in the configure route action (coupled). Otherwise functionally equivalent. |

### 2.3 FPB Read (configure page load)

| EB Endpoint | WPB Current | Gap |
|-------------|------------|-----|
| `GET /api/stepsConfiguration?bundleId={id}` | `loader` in `app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/route.tsx` — Prisma read of `Bundle` + related records | **Architecture gap**: EB has a dedicated read endpoint returning a normalized bundle DTO; WPB loader returns raw Prisma shape + some transforms inline. No functional gap if data is equivalent. |

### 2.4 FPB Save (steps / categories)

| EB Endpoint | WPB Current | Gap |
|-------------|------------|-----|
| `POST /api/stepsConfiguration/saveMultipleCategoriesData?bundleId={id}` | `action` in FPB configure route — handles multiple `_action` types | **Data shape gap**: EB saves hydrated product objects (with GIDs, handles, variants, titles) in `categories.{categoryId}.products[]`. WPB stores product IDs only in `BundleStep` model. See gap detail in §3. |
| `POST /api/stepsConfiguration/update?bundleId={id}` | Same FPB action — wrapper update | **Payload gap**: EB wrapper payload includes `readinessScore`, `summaryPageData`, `landingPageData` as top-level co-updates. WPB handles these as separate action types. |

### 2.5 FPB Personalization

| EB Endpoint | WPB Current | Gap |
|-------------|------------|-----|
| `POST /api/stepsConfiguration/savePersonalization` | Not yet implemented in WPB | **Missing feature** — Add-ons and Gift Message personalization endpoints have no WPB equivalent yet. Out of scope for this plan. |

### 2.6 PPB Create

| EB Endpoint | WPB Current | Gap |
|-------------|------------|-----|
| `POST /api/mixAndMatch/create` | `action` in `app/routes/app/app.bundles.create_.configure.$bundleId/route.tsx` | Functionally equivalent. |

### 2.7 PPB Read

| EB Endpoint | WPB Current | Gap |
|-------------|------------|-----|
| `GET /api/mixAndMatch?offerId={id}` | `loader` in `app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/route.tsx` | **Data shape gap**: EB returns `conditions` per step (`isEnabled`, `rules[{type, condition, value}]`). WPB step conditions model needs verification. |

### 2.8 PPB Save

| EB Endpoint | WPB Current | Gap |
|-------------|------------|-----|
| `POST /api/mixAndMatch/update?offerId={id}` | `action` in PPB configure route | **Data shape gap**: EB category save includes `displayVariantsAsIndividualProducts`, `displayVariantsAsSwatches` per category. WPB equivalent needs verification. |

### 2.9 Discount

| EB Endpoint | WPB Current | Gap |
|-------------|------------|-----|
| `POST /api/discount/get` | Discount data loaded inline in configure loader | **Architecture note**: EB separates discount read to its own endpoint with `discountConfiguration` (full) + `metafieldData.discount` (compact metafield mirror). WPB currently stores discount in a JSONB blob on the Bundle record. |

### 2.10 DCP / Page Customization Settings

| EB Endpoint | WPB Current | Gap |
|-------------|------------|-----|
| `GET /api/pageCustomization/getSettings` | `app/routes/api/api.design-settings.$shopDomain.tsx` | Functionally equivalent. `mixAndMatchBundleSettings` schema (25+ fields) documented in reference doc — verify WPB covers all fields. |
| `POST /api/pageCustomization/updateSettings` | DCP update actions in design-control-panel routes | Functionally equivalent. |

### 2.11 Storefront / App Proxy

| EB Endpoint | WPB Current | Gap |
|-------------|------------|-----|
| `/apps/gbb/{id}` — HTML with inline `stepsConfigurationData` JSON | `app/routes/api/api.bundle.$bundleId[.]json.tsx` returns JSON; Liquid block embeds config as `data-bundle-config` attribute | **Architecture difference**: EB serves a full HTML page from its backend. WPB uses Shopify App Proxy to serve JSON, with Liquid embedding the config. This is an intentional architectural divergence — WPB's approach reduces latency via metafield cache. No migration needed. |

---

## Part 3 — Gap Analysis (Actionable)

### Gap 1: App Embed Check — Architecture (CLOSED)
**EB:** Dedicated HTTP endpoint with ETag caching.  
**WPB:** `checkAppEmbedEnabled` + DB cache (5-min TTL).  
**Status:** ✅ Closed — DB cache matches EB's TTL pattern. Fail-open JSON parse also fixed.

### Gap 2: FPB Category Save — Product Data Hydration
**EB:** Saves full hydrated product objects `{productId, graphqlId, handle, variants, title}` in category's `products[]` array.  
**WPB:** Stores product IDs only in `BundleStep` model; enrichment happens at render time via Shopify Admin GQL.  
**Impact:** WPB storefront widget fetches product detail via `nodes(ids:[...])` on load — functionally equivalent. Cart properties use numeric IDs. No breaking gap unless storefront fetch fails.  
**Status:** 🟡 Architectural difference — no functional gap in current scope. Flag for future if offline/webhook processing of bundle products is needed.

### Gap 3: Discount Storage — `discountConfiguration` vs JSONB blob
**EB:** `discountConfiguration` (full admin shape) + `metafieldData.discount` (compact metafield mirror) stored as co-equal top-level fields.  
**WPB:** Discount stored in JSONB blob on Bundle model; metafield written on sync.  
**Impact:** No user-visible gap currently. Schema alignment needed if adding new discount types (BXY) that reference the `discountConfiguration` shape directly.  
**Status:** 🟡 Low priority — track but no immediate migration needed.

### Gap 4: FPB `readinessScore` Field
**EB:** Top-level `readinessScore` in update payload — likely a percentage reflecting "bundle completeness."  
**WPB:** No equivalent field.  
**Impact:** Admin UX only — EB shows a progress indicator. No storefront impact.  
**Status:** 🟢 Out of scope for this plan.

### Gap 5: PPB Step Conditions (`isEnabled` + `rules[]`)
**EB:** `conditions: { isEnabled: bool, rules: [{type, condition, value}] }` per step.  
**WPB:** Needs verification — `BundleStep` model may or may not have `conditions` stored separately.  
**Status:** ❓ Needs code audit before declaring closed or open.

### Gap 6: PPB Category `displayVariantsAsIndividualProducts` + `displayVariantsAsSwatches`
**EB:** Stored per category (not per step).  
**WPB:** Needs verification — check `BundleCategory` or `BundleStep` Prisma model.  
**Status:** ❓ Needs code audit.

### Gap 7: Preview Gate Modal — Copy + Design
**EB:** Modal triggered when `isAppEmbedEnabled: false`. Modal content not captured (embed was enabled on test store; troubleshooting modal path could not be triggered).  
**WPB:** `app/components/EnablePreviewModal.tsx` — current copy does not match EB (EB copy unknown).  
**Status:** 🔴 Blocked on EB modal content — see §4 for resolution approach.

---

## Part 4 — Migration Plan

### Phase 0 — Already Complete ✅
- Fail-open JSON parse in `checkAppEmbedEnabled`
- DB cache (5-min TTL) for app embed check in `fetchEmbedData`
- Unit tests: 17 passing

### Phase 1 — Gap Verification (no migration, audit only)
**Scope:** Confirm or close Gaps 5 and 6.
1. Read `prisma/schema.prisma` — `BundleStep` + `BundleCategory` models
2. Confirm `conditions` field exists and matches `{isEnabled, rules[{type, condition, value}]}` shape
3. Confirm `displayVariantsAsIndividualProducts` + `displayVariantsAsSwatches` stored at category level
4. If gap found: add migration issue, add to Phase 2 scope
5. **No tests required** — read-only audit

### Phase 2 — Preview Gate Modal Replication
**Scope:** `app/components/EnablePreviewModal.tsx` — copy + design parity with EB.
**Prerequisite:** EB modal content must be known (see §4).
1. Update modal title, body text, button copy to match EB
2. Update modal styling to match EB visual design (colors, layout, icon usage)
3. Regression: `useEnablePreviewGate` hook logic must remain unchanged
4. **Tests:** No new unit tests needed (modal is pure UI); E2E on SIT Chrome verifies correct trigger + display
5. Commit: `[preview-bundle-gate-1] feat: replicate preview gate modal copy + design`

### Phase 3 — Discount Schema Alignment (future, not this plan)
**Scope:** Align WPB discount storage with EB's `discountConfiguration` + `metafieldData.discount` co-equal shape.
**Blocked on:** New discount types (BXY) feature decision — do not migrate speculatively.

### Phase 4 — FPB/PPB Configure Loader E2E Verification
**Scope:** Verify Phase 0 changes (DB cache + fail-open) work correctly end-to-end on SIT.
1. Load FPB configure page on SIT — confirm no "enable app extension" gate appears
2. Load PPB configure page on SIT — same check
3. Confirm DB cache is written (check `Shop` record in DB for `appEmbedEnabled`, `appEmbedCheckedAt`)
4. Simulate stale cache (update `appEmbedCheckedAt` to 10 min ago in DB) — confirm fresh Shopify fetch occurs
5. Document results in `docs/issues-prod/preview-bundle-gate-1.md`

---

## Part 5 — EB Modal Copy Resolution (Gap 7)

Since the EB embed-disabled modal could not be triggered in the test environment (embed IS active on `yash-wolfpack` store), three approaches to obtain the copy:

**Option A — Disable embed on test store:** Go to Shopify Admin → Online Store → Themes → Customize → App Embeds → disable "Wolfpack" block → reload EB configure page → screenshot modal. Re-enable after capture.

**Option B — Search EB minified JS:** EB's frontend JS bundle contains all modal copy as string literals. Search for `"Enable"` or `"App Embed"` or `"extension"` in `easy-bundle-full-page-min.js` / `easy-bundle-product-page-min.js` to extract exact copy.

**Option C — Use current WPB copy as-is:** If EB's exact copy is not critical to the fix, polish current copy to be accurate and user-friendly without matching EB verbatim.

**Recommendation:** Option A — takes 2 minutes and gives exact visual + copy capture. Required for full parity per the user's task.

---

## E2E Test Plan (all phases)

| Test | Method | Scope |
|------|--------|-------|
| App embed cache DB write | Chrome DevTools — SIT | Check `Shop` record after configure page load |
| App embed cache hit (fresh) | Chrome DevTools — verify `checkAppEmbedEnabled` not called | Network tab: no `settings_data.json` GQL call |
| Stale cache refresh | Manual DB update → reload page | Confirm Shopify GQL call fires |
| Preview gate NOT shown when embed enabled | SIT configure page load | Gate modal must not appear |
| Preview gate SHOWN when embed disabled | Option A above | Gate modal must appear with correct copy |
| Preview button proceeds when gate passes | SIT configure → Preview | Storefront opens, no gate |

---

*All response body shapes marked 🔍 or 📖 are sourced from `internal docs/EB Implementation Reference.md` — the grounded truth document built from live authenticated inspection with captured network payloads.*
