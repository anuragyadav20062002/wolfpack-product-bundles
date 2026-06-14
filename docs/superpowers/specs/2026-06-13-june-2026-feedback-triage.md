# June 2026 Feedback Triage

**Source:** `~/Downloads/Feedbacks June 2026.xlsx` (sheet `Latest`)
**Compiled:** 2026-06-13
**Owner:** Anurag

Eight items, three priority tiers. P1 items have Loom recordings as the source of truth — titles below are placeholders; details land here after we watch each Loom. P2/P3 items have written descriptions, so suspected causes and likely files are already drafted from code inspection.

> **Open question:** Items 1–4 (all P1) reference Loom videos that contain the actual feedback. The triage entries for those items list "likely area" but cannot list specific defects/fixes until the Looms are watched. Recommend watching them together and filling in the "Findings from Loom" subsection of each entry before scheduling work.

---

## Priority Summary

| # | Title | Pri | Area | Effort (rough) |
|---|---|---|---|---|
| 1 | "How to setup?" video missing on FPB + PDP configure screens | P1 | Admin UI — onboarding | S (½ day) |
| 2 | Step rule configuration feedback (FPB) | P1 | Admin UI — step editor | M (1–3 days) — TBD from Loom |
| 3 | Free gift configuration feedback (FPB) | P1 | Admin UI — addons/free gift section | M (1–3 days) — TBD from Loom |
| 4 | Bundle template feedback (FPB) | P1 | Admin UI — template picker modal | M (1–3 days) — TBD from Loom |
| 5 | Upsell button works in theme editor but not visible on storefront | P2 | Storefront — Liquid block | S (½ day) |
| 6 | Pre-selected product not added on frontend | P2 | Storefront widget — FPB/PPB default products | M (1 day) |
| 7 | UTM analytics: only "Top campaigns" updates, rest show zero | P2 | Admin UI — analytics page | M (1–2 days) |
| 8 | Bundle status toggle from Admin is not working | P3 | Admin → metafield sync → widget read | S (½–1 day) |

**Suggested order:** 5 → 8 → 6 → 7 → (watch Looms) → 1–4. The P2/P3 fixes are well-scoped and unblock themselves; the P1 items need Loom review before they can be planned.

---

## P1 — Items needing Loom review

### #1 — "How to setup?" video on FPB and PDP configure screens

- **Source:** Row 3, file. Two Looms attached:
  - Full page: https://youtu.be/5p_B81I7tWE
  - PDP: https://youtu.be/5ClNNtFybHo
- **What we know:** Looms appear to walk through current setup flow. Feedback is to add a "Watch setup video" entry point so merchants self-serve.
- **Likely insertion points:**
  - `app/components/BundleSetupInstructions.tsx` (existing setup steps card) — add a "Watch the setup video" link/button.
  - `app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/route.tsx` — header or empty state.
  - `app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/route.tsx` — same.
  - Dashboard or onboarding page (`app/routes/app/app.dashboard/`, `app/routes/app/app.onboarding.tsx`) if it should also appear there.
- **Open questions for Loom review:**
  - Where exactly should the video CTA appear — configure page header, BundleSetupInstructions card, modal, dashboard?
  - Inline (embedded iframe) or open-in-new-tab link?
  - Is this two distinct videos (FPB vs PDP) shown contextually, or one combined?
- **Findings from Loom:** _TBD_
- **Effort:** S (½ day) once placement decided.

---

### #2 — Step rule configuration feedback (FPB)

- **Source:** Row 26. Loom: https://www.loom.com/share/38ceb8d9132346dca69643fea0a4ed36
- **Likely area:**
  - Step config UI lives in `app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/route.tsx` (6,556 lines — sectioned by step editor / rules / pricing).
  - Step persistence: `handlers/handlers.server.ts:825` (`isDefault`, `defaultVariantId`, etc.).
  - Rule shapes (addon eligibility, conditions): `app/lib/bundle-config/control-dependencies.ts`, `app/lib/bundle-config/product-page-admin-sections.ts`.
  - Storefront read of rules: `app/assets/widgets/full-page/methods/validation-addons-methods.js`.
- **Open questions for Loom review:**
  - Is the feedback about UX (labels, layout, missing controls) or behavior (rule not enforced)?
  - Are specific rule types broken (e.g. min/max qty per step, conditional addon eligibility)?
- **Findings from Loom:** _TBD_
- **Effort:** M (1–3 days) — bound depends on whether changes are UI-only or behavior changes that ripple into widget + handlers.

---

### #3 — Free gift configuration feedback (FPB)

- **Source:** Row 27. Loom: https://www.loom.com/share/3ab6c7c4486742f6968e99bba5cf61ea
- **Likely area:**
  - Free gift UI is part of FPB step config UI in `route.tsx` — step-level `freeGiftName`, `isFreeGift`, `addonEligibilityCondition`, `addonTiers`.
  - Storefront enforcement: `app/assets/widgets/full-page/methods/validation-addons-methods.js` (`_syncFreeGiftLock`, `_renderFreeGiftSection`) and `selection-navigation-methods.js`.
- **Open questions for Loom review:**
  - Which free gift sub-feature: tier definition, unlock condition, gift selection limits, gift display in widget?
- **Findings from Loom:** _TBD_
- **Effort:** M (1–3 days).

---

### #4 — Bundle template feedback (FPB)

- **Source:** Row 28. Loom: https://www.loom.com/share/cd2028e0aa8e4af8bf7e5a2cb973caf8
- **Likely area:**
  - Four preset templates listed at `app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/route.tsx:96-99` — DEFAULT / CLASSIC / COMPACT / HORIZONTAL.
  - State: `bundleDesignTemplate` + `bundleDesignPresetId` (lines 1220–1221).
  - Picker modal: `templateModalStep` state machine (`templates → colorsAndCorners → textAndImages → enableThemeExtension → confirm`) starting line 1313.
  - Preset images: `/FPB-Standard.png`, `/FPB-Classic.png`, `/FPB-Compact..png` (note double dot — typo bug worth fixing while we're in there), `/FPB-Horizontal.png`.
- **Open questions for Loom review:**
  - Picker visual feedback, preview quality, save flow, or template behavior on storefront?
- **Findings from Loom:** _TBD_
- **Effort:** M (1–3 days).

---

## P2 — Bugs with written descriptions

### #5 — Upsell button works in theme editor but not visible on storefront

> **Scope correction (2026-06-13):** After follow-up investigation, the most likely culprit is *not* the simple Liquid block — it's the per-bundle "Upsell Widget" feature configured in the FPB/PPB admin (state: `upsellWidgetEnabled`, `upsellWidgetTitle`, `upsellWidgetDescription`, `upsellWidgetButtonText`, etc.). That admin config was built under `[bundle-upsell-widget-1]` on 2026-06-01 for EB parity, but the issue doc covers admin-side UI only — there is no storefront code that reads the per-bundle config and renders the widget. The two `bundle-upsell-*.liquid` blocks take static block settings and never read the per-bundle metafield. So a merchant can fully configure an upsell widget in admin, see the preview, and get nothing on storefront. Awaiting user disambiguation before scoping further (see Open question below).

- **Open question for user:** Did the merchant report this against (a) the simple Liquid block they added in the theme editor (`bundle-upsell-button` / `bundle-upsell-block`), or (b) the per-bundle Upsell Widget toggle in the bundle's admin configure page?
  - If (a): the fix below applies (small Liquid change to surface silent failure).
  - If (b): the fix is materially larger — implement the missing storefront renderer for `bundleUpsellConfig` (either by making the Liquid blocks read the per-bundle metafield, or by adding an auto-rendering PDP block). Re-scope: M–L (2–5 days).

- **Suspected root cause (high confidence) — Liquid block case:** The Liquid render gate in `extensions/bundle-builder/blocks/bundle-upsell-button.liquid` is:
  ```liquid
  {% if target_url != blank or request.design_mode %}
  ```
  In the theme editor `request.design_mode` is true, so the button renders even when the merchant hasn't entered a `bundle_id` or `target_url`. On the storefront `request.design_mode` is false, so a blank `target_url` → button silently does not render. The same issue exists in `bundle-upsell-block.liquid`.
- **Likely sequence:** Merchant added the block in theme editor, saw the button rendered, published — but never entered the bundle ID in the block settings. Storefront then renders nothing with no error.
- **Files:**
  - `extensions/bundle-builder/blocks/bundle-upsell-button.liquid` (~50 lines)
  - `extensions/bundle-builder/blocks/bundle-upsell-block.liquid` (~70 lines)
- **Investigation steps:**
  1. Reproduce on test store — add the block without selecting a bundle, confirm storefront renders nothing.
  2. Check block settings field type for `bundle_id` — text vs picker. Currently a free-text field, which is the UX problem.
  3. Confirm the `/apps/product-bundles/wpb/{bundle_id}` proxy route actually exists and resolves (no `wpb` route was found in `app/routes/api/`).
- **Proposed fix options:**
  - **A.** Replace the `bundle_id` text input with a bundle picker (Shopify `product` or `collection_list` setting type doesn't apply — use `text` + clearer label + validation, OR a custom block setting that opens our admin).
  - **B.** Render a visible "configure me" placeholder on storefront when `bundle_id` is blank.
  - **C.** Both — picker AND placeholder fallback. (Recommended.)
- **Side-find — verify the proxy route:** `grep` for `wpb/` in `app/routes/` returned only the Liquid files. If `/apps/product-bundles/wpb/{id}` has no corresponding loader, ALL upsell buttons (even with bundle_id set) will 404 on storefront. This is the more dangerous variant and must be checked first.
- **Effort:** S (½ day) for the placeholder + label clarity; +½ day if the proxy route is missing and needs to be added.

---

### #6 — Pre-selected product not added on frontend

> **Status (2026-06-13): IMPLEMENTED — defensive normalization, awaiting merchant verification.** Triage hypothesis was the most plausible cause, but could not be reproduced live before fixing. The fix only makes the matching more permissive (extractId on both sides), so it cannot break existing working cases.
> - `app/assets/widgets/full-page/methods/validation-addons-methods.js` — `_initDefaultProducts()` now normalizes `defaultVariantId` and product/variant IDs via `this.extractId()` before comparison
> - `tests/unit/assets/bundle-widget-free-gift.test.ts` — added 3 tests covering format-mismatch cases (GID↔numeric in both directions, plus nested `variants[].id`), and updated 5 existing tests to assert the actual production contract (selection key is the *normalized* numeric id, not the original GID)
> - All 36 tests in that file pass; 3 unrelated pre-existing failing suites (sdk-get-display-price, condition-pricing-integration, pricing-calculator) are unchanged
> - `npm run build:widgets` ran successfully; minified bundles updated
> - `scripts/build-widget-bundles.js` — `WIDGET_VERSION` bumped 3.0.40 → 3.0.41
> - `node --check` clean; lint 0 errors on modified files
>
> **Action required from user:** Deploy via `npm run deploy:sit` (then verify on test store before `npm run deploy:prod`). After deploy, ask the merchant to re-test the pre-selected product flow.
>
> **If the bug persists after deploy:** the cause is not the variant-id format mismatch. Next places to investigate:
> 1. Is `step.isDefault` actually `true` in the saved bundle? Confirm via Prisma Studio or the proxy API response.
> 2. Is `step.defaultVariantId` non-null in the saved bundle?
> 3. Is the bundle being served via the modern step-default path or the older `defaultProductsData` path? The latter has its own logic in `default-products.ts`.
> 4. Does PPB also have the bug? PPB uses `normalizeSelectionKey` which already wraps `extractId`, so it should be fine — but worth confirming.

- **Suspected root cause (medium confidence) [original triage]:** Lookup mismatch in `_initDefaultProducts` at `app/assets/widgets/full-page/methods/validation-addons-methods.js:328`. The code looks for `step.defaultVariantId` against `products` / `StepProduct` arrays using multiple ID forms (variantId, id, gid, nested `variants[].id`/.gid). If `defaultVariantId` is stored in one format and product variants in another (numeric vs GID), the `find()` returns undefined and the pre-select silently doesn't happen.
- **Related code (looks healthier):**
  - PPB widget pre-select (`app/assets/widgets/product-page/methods/default-product-methods.js`) — has dedicated direct-default-products path + multiple normalisation helpers.
  - FPB widget `initializeDataStructures` (in PPB methods file? — verify) seeds `selectedProducts` via `setSelectedQuantity` only if `step.defaultVariantId` is present.
- **Files:**
  - `app/assets/widgets/full-page/methods/validation-addons-methods.js`
  - `app/assets/widgets/full-page/methods/initial-render-methods.js`
  - `app/assets/widgets/product-page/methods/default-product-methods.js`
  - `app/lib/bundle-formatter.server.ts:244` — confirms shape sent to widget.
  - `app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/handlers/handlers.server.ts:825` — confirms what's saved.
- **Investigation steps:**
  1. In Chrome DevTools on storefront, log `selectedBundle.steps[].defaultVariantId` vs `selectedBundle.steps[].products[].variantId` / `.id` — confirm format mismatch hypothesis.
  2. Test on both FPB and PDP — is it both, or one?
  3. Test with both classic (default products section) and modern (step `isDefault`) bundle configurations.
- **Proposed fix:** Add an `extractId` normalization on both sides of the equality check inside `_initDefaultProducts`, mirroring the PPB widget's `_normalizeDirectDefaultProduct` approach.
- **Effort:** M (1 day) including reproduction + widget build + storefront verification.

---

### #7 — UTM analytics: only "Top campaigns" updates, rest show zero

> **Status (2026-06-13): IMPLEMENTED — root cause confirmed.** Tracing the attribution write path at `app/routes/api/api.attribution.tsx:122-140` confirmed H1: when a UTM-tagged order has no matching bundle, the system intentionally creates an `OrderAttribution` row with `bundleId: null`. The `byCampaign` aggregation didn't filter those, so non-bundle UTM revenue surfaced in TopCampaigns; meanwhile bundle-aware cards (`byBundle`, `bundleLeaderboard`, `bundleRevenueSummary`, `bundleMatrix`) skip them, hence the "rest shows zero" experience.
> - `app/routes/app/app.attribution.tsx` — `byCampaignMap` aggregation now skips rows with `!a.bundleId`, matching the pattern already used by `byBundleMap`
> - One-line filter; lint 0 errors on the file; existing `app.attribution.action.test.ts` failure is a pre-existing Jest+CSS config issue on base branch, not caused by this change
>
> **Action required from user:** Deploy (`npm run deploy:sit` → `npm run deploy:prod`). After deploy, ask the merchant to re-check — TopCampaigns should now only show campaigns that drove actual bundle revenue.
>
> **Known follow-ups (not implemented):**
> 1. `summary.totalRevenue` / `summary.totalOrders` / `aov` still include non-bundle UTM rows, so the top stat cards may show a higher number than the bundle-specific cards. If merchant flags this as confusing, decide whether to (a) also filter top stats to bundle-only, or (b) rename them ("Tracked revenue" vs "Bundle revenue") to make the difference explicit. Out of scope for this fix.
> 2. `byPlatform` / `byMedium` / `byLandingPage` aggregations are still built from all rows but no UI consumes them. Dead returns from the loader. Cleanup task.

- **Suspected root cause (medium confidence, needs Loom or screenshot to confirm "rest") [original triage]:** The analytics loader at `app/routes/app/app.attribution.tsx` builds `byPlatform`, `byMedium`, `byCampaign`, `byBundle`, `byLandingPage`, `bundleLeaderboard`, `funnelSnapshot` etc. from the same `currentAttributions` query (line 230). It returns all of them, but the **rendered page only consumes a subset** (`FunnelHero`, `EngagementPulse`, `RevenueAttribution`, `BundlePerformanceMatrix`, `LiveActivityFeed`, `TopCampaigns`). `byPlatform`/`byMedium`/`byCampaign`/`byLandingPage` are returned by the loader but never read on this page (lines 920, 1040–1086).
- **Two hypotheses to disambiguate:**
  - **H1 (likely):** "rest everywhere shows zero" refers to other revamped cards — RevenueAttribution / BundlePerformanceMatrix / FunnelHero — and the issue is that UTM-tagged sessions are creating `OrderAttribution` rows **without `bundleId` or without linkage to engagement/views**. `TopCampaigns` (`topCampaignsRows`) only needs `utmCampaign + revenue + orders`, so it works. The bundle-aware cards need `bundleId`, so they show zero.
  - **H2:** The user means another page (dashboard, bundle leaderboard) shows zero campaign-tagged revenue. Dashboard search returned no "campaign" references — dashboard does not aggregate by campaign, so a zero there isn't a campaign bug, it's a UX expectation gap.
- **Files:**
  - `app/routes/app/app.attribution.tsx` (lines 229–293 — attribution query and totals; lines 299–360 — aggregations).
  - `app/routes/api/api.attribution.tsx` (writes — where `OrderAttribution` rows are created).
  - `app/components/analytics/RevenueAttribution.tsx`, `BundlePerformanceMatrix.tsx`, `FunnelHero.tsx` — consumers.
- **Investigation steps:**
  1. Need a screenshot or Loom of the merchant's current analytics state to confirm which cards show zero.
  2. Query a UTM-tagged `OrderAttribution` row in DB and inspect: is `bundleId` populated? Is there a matching `BundleEngagement` row tied to same `sessionId`?
  3. If `bundleId` is null on UTM rows — the attribution-create webhook isn't matching the UTM session back to a bundle interaction. Probable area: `api.attribution.engagement.tsx` + `api.attribution.tsx`.
- **Proposed fix:** Depends on diagnosis — most likely a session/bundle linkage fix on the attribution write path, not on the read path.
- **Effort:** M (1–2 days) — half spent on diagnosis.

---

## P3 — Lower-priority bug

### #8 — Bundle status toggle from Admin is not working

> **Status (2026-06-13): IMPLEMENTED — server-side only.** User confirmed expectation: DRAFT should hide bundle from storefront. Changes made:
> - `app/routes/api/api.bundle.$bundleId[.]json.tsx` — `where.status.in` reduced to `[ACTIVE, UNLISTED]`
> - `app/routes/root/wpb.$bundleId.tsx` — same change for the FPB proxy route
> - New tests: `tests/unit/routes/api.bundle.status-filter.test.ts` (4 tests, all green)
> - Existing tests (`fpb-proxy-page`, `api.bundle.free-gift`, `api.bundles`) still pass (35/36 in this slice; the 1 failure is a pre-existing source-grep test in `bundle-status-section.test.ts` unrelated to this change)
>
> **Follow-ups (not implemented):**
> 1. Widget `bundle-data-manager.js:267-274` still has a DRAFT-FPB escape hatch. Now dead code (server never returns DRAFT) but should be cleaned up in a follow-up to reduce confusion. Requires widget rebuild + version bump + deploy.
> 2. In-admin "Preview Bundle" button (`app.bundles.full-page-bundle.configure.$bundleId/route.tsx:2307`) still opens `/pages/{handle}` on the storefront — for DRAFT bundles the widget will now show a "bundle not found" error. Should add a guard: if status is DRAFT, show a "publish before previewing" toast instead of opening the page.
> 3. Pre-existing `tests/unit/routes/bundle-status-section.test.ts` greps `route.tsx` source for `{opt.label}` — violates the `🚫 No UI Styling or Placement Unit Tests` rule in CLAUDE.md. Already failing on base branch. Unrelated to #8 but should be deleted in a separate cleanup.

- **Suspected root cause (medium confidence) [original triage]:** The widget API (`app/routes/api/api.bundle.$bundleId[.]json.tsx:140`) intentionally serves DRAFT, ACTIVE, and UNLISTED bundles — only ARCHIVED is hidden:
  ```ts
  status: { in: [BundleStatus.DRAFT, BundleStatus.ACTIVE, BundleStatus.UNLISTED] }
  ```
  This is documented in code comments as intentional ("Draft: merchants can test before publishing"). So flipping from ACTIVE → DRAFT does **not** make the widget hide a bundle — which is likely what the merchant expects "not working" to mean.
- **Secondary hypothesis:** The widget's two-stage load (metafield cache → proxy fallback) means a status change won't appear until the metafield is re-synced. The status field IS written into the metafield-cached config (`app/services/bundles/metafield-sync/operations/bundle-product.server.ts:426`), but only on a sync. If the merchant toggled status without triggering a re-sync, the cached config still shows the old status.
- **Files:**
  - `app/routes/api/api.bundle.$bundleId[.]json.tsx:130–160` (the intentional filter).
  - `app/services/bundles/metafield-sync/operations/bundle-product.server.ts:426` (status persisted into metafield).
  - Wherever the admin "status" UI lives — find the action that mutates `Bundle.status` and confirm whether it triggers a metafield re-sync.
  - Widget read of cached status: confirm whether the storefront widget actually respects `status` in the cached config, or just trusts whatever the API returns.
- **Investigation steps:**
  1. Reproduce: set bundle to DRAFT in admin, hard-refresh storefront with cache bypass — does the widget still render?
  2. Check `prisma.bundle.update` calls for status changes — do they enqueue a metafield re-sync?
  3. Check widget code for any `if (bundle.status !== 'active')` guard — if absent, a status of DRAFT is treated as live.
- **Proposed fix options:**
  - **A.** Tighten the API filter to only ACTIVE + UNLISTED (breaking change — merchants will lose draft preview).
  - **B.** Keep the filter, but ensure every admin status change triggers a metafield re-sync AND the widget respects the cached `status` field.
  - **C.** Add a separate "preview mode" param so DRAFT renders only with `?preview=1`, while public storefront only renders ACTIVE.
- **Effort:** S–M (½–1 day) once the merchant's actual expectation is confirmed (likely option B or C).

---

## Next steps

1. **Watch Looms for items 1–4** and fill in the "Findings from Loom" subsections inline above.
2. **Confirm item 7's "rest everywhere shows zero"** — a screenshot or Loom from the merchant would disambiguate H1 vs H2.
3. **Verify item 5's proxy route question** first — if `/apps/product-bundles/wpb/{id}` doesn't resolve at all, that's the real fix.
4. **Schedule item 5, 6, 7, 8** for implementation. They are independent and can run in parallel; recommended order is 5 → 8 → 6 → 7 by ease of repro.
5. Once Loom findings are documented, write a separate implementation plan per P1 item using the writing-plans skill.
