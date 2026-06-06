# Issue: Storefront Analytics Event Taxonomy + Session-Engagement Beacon (EB parity)

**Issue ID:** wpb-storefront-analytics-events-1
**Status:** In Progress
**Priority:** 🟡 Medium
**Created:** 2026-06-06
**Last Updated:** 2026-06-06

## Overview

Today WPB dispatches 4 storefront `CustomEvent`s (`wbp:ready`, `wbp:item-added`, `wbp:item-removed`, `wbp:step-cleared`) from the SDK. EB dispatches **21** named events from its FPB widget for the same surface (`gbb-page-init`, `gbb-next-button-click`, `gbb-add-bundle-to-cart-success`, etc.) plus a server-side `trackBundleSessionInitiated` beacon. The richer event taxonomy is how EB enables merchants to wire third-party analytics (GTM, Meta Pixel, Klaviyo, Northbeam) without app-side changes.

This issue closes two of those gaps:

1. **Event taxonomy expansion.** Add `wpb:*` `CustomEvent` dispatches at every interactive surface in the FPB widget so themes / GTM / Klaviyo can subscribe and forward to their analytics back-ends.
2. **Session-engagement beacon.** Fire-and-forget POST to `/api/attribution/engagement` the first time the user interacts with the bundle inside a single browser session. Server logs only for this pass; durable persistence (a `BundleEngagement` Prisma model) is deferred to a follow-up so this issue does not need to ship a DB migration.

Out of scope here: UTM revenue attribution (already shipped via `extensions/wolfpack-utm-pixel/`), checkout-completed beacon (already shipped), engagement DB persistence, dashboard UI for engagement metrics.

## Constraints / Decisions

- **Event namespace:** `wpb:*` (NOT `wbp:*` — `wbp` was an SDK-only prefix; widget-emitted events use the canonical `wpb` brand prefix). Existing SDK `wbp:*` events stay where they are; the new widget-level events are a separate, additive surface.
- **Event payload schema:** every dispatched event carries `detail = { bundleId, bundleType, presetId, sessionId, timestamp, ...eventSpecific }`. `sessionId` is generated once per bundle mount and stored on the widget instance.
- **No analytics retention on the client.** Events bubble on `window`; consumers (themes, pixels, GTM) listen and forward. WPB itself does not persist any of these CustomEvents.
- **Engagement beacon is rate-limited per session.** Guard via `sessionStorage` keyed on the bundle id so a single browser session fires the beacon at most once per bundle.
- **Endpoint contract.** `POST /api/attribution/engagement` accepts `{ shopId, bundleId, sessionId, presetId, bundleType, firstInteraction, eventName, timestamp }`, responds `{ ok: true }`. CORS-enabled (the storefront origin is different from the app origin) following the same pattern as `api.attribution.tsx`.
- **No deploy of `shopify app deploy`** is performed by this issue — that is the user's manual step (CLAUDE.md rule 6).

## Event Taxonomy (this pass)

| `wpb:*` event | Fires when | EB equivalent |
|---|---|---|
| `wpb:bundle-ready` | Widget mounted, first paint complete | `gbb-page-init` |
| `wpb:session-engaged` | User's first interaction inside the bundle (any product click / step advance / category switch). At most once per session per bundle. ALSO triggers the engagement beacon POST. | `trackBundleSessionInitiated` |
| `wpb:product-selected` | A product's quantity transitions from 0 to ≥1 | `gbb-add-to-bundle` (implicit) |
| `wpb:product-deselected` | A product's quantity transitions to 0 | `gbb-remove-from-bundle` (implicit) |
| `wpb:step-changed` | Step index changes (next or back) | `gbb-next-button-click` + `gbb-back-button-click` |
| `wpb:category-changed` | User clicks a different category tab inside the current step | `gbb-category-change` |
| `wpb:bundle-add-to-cart-success` | `/cart/add.js` returned 2xx and metafield sync completed | `gbb-add-bundle-to-cart-success` |
| `wpb:bundle-add-to-cart-failed` | `/cart/add.js` failed or threw | `gbb-add-bundle-to-cart-failed` |
| `wpb:checkout-clicked` | User clicked the post-add Checkout button | `gbb-checkout-button-click` |

Events EB has that this issue does not yet wire (deferred to follow-up because the underlying features are not yet shipped in WPB or are merchant-pixel surfaces, not widget surfaces):
- `gbb-variants-modal-open`, `gbb-variants-modal-close`
- `gbb-subscription-selling-plan-change`, `gbb-purchase-option-change`
- `gbb-product-personalization-radio-selection-change`
- `gbb-bundle-discount-applied` (WPB calculates discount inline; would emit on every selection — noisy)

## Endpoint

`app/routes/api/api.attribution.engagement.tsx` — new file.

- `OPTIONS` returns CORS preflight headers (`*`, `POST, OPTIONS`).
- `POST` accepts the JSON payload, validates `shopId` and `bundleId`, logs via `AppLogger.info` with the full payload. Returns `{ ok: true }`.
- **Does NOT write to the database in this pass.** Logs are sufficient for an MVP signal that the wiring works end-to-end; merchants can forward via Render log drains if they want immediate funnel metrics. Persistence is a separate issue.

## Progress Log

### 2026-06-06 - Initial implementation
- Drafted this issue.
- Audited EB JS bundle to confirm the 21-event taxonomy (`emitCustomEvent({eventName:"…"})` at 36 sites; 21 unique names).
- Audited WPB current state: SDK at `app/assets/sdk/wolfpack-bundles.js` emits 4 events via `app/assets/sdk/events.js`. Widget at `app/assets/bundle-widget-full-page.js` does NOT dispatch any storefront analytics CustomEvents today.
- Added helper methods to widget:
  - `_emitStorefrontEvent(name, detail)` — dispatches a `wpb:*` CustomEvent on `window`, bubbles, non-cancelable. Wraps in try/catch so a listener throwing does not break the widget.
  - `_sendEngagementBeacon(eventName)` — fire-and-forget POST to `/apps/product-bundles/api/attribution/engagement` with `{shopId, bundleId, sessionId, presetId, bundleType, eventName, timestamp}`. Guarded by `sessionStorage.getItem('wpb_engaged_' + bundleId)` so it fires at most once per bundle per session.
  - `_ensureWpbSessionId()` — lazily generates and caches a UUID-like session id on the widget instance.
- Wired the helper into 7 interaction sites in `bundle-widget-full-page.js` (bundle init, product-selection state mutation, step navigation, category switch, ATC success, ATC failure, checkout click).
- New endpoint `app/routes/api/api.attribution.engagement.tsx` accepts the beacon POST and logs it.
- Built widget; CSS unchanged so 100 KB cap not relevant. `WIDGET_VERSION` bumped 3.0.21 → 3.0.22.
- Stopped for deploy (manual `npm run deploy:sit` per CLAUDE.md rule 6).

## Related Documentation

- EB taxonomy reference: see prior analytics audit in chat — 21 unique `eventName` values extracted from `easy-bundle-full-page-min.js`.
- WPB existing pixel: `extensions/wolfpack-utm-pixel/src/index.ts` (UTM capture + checkout_completed beacon).
- Existing attribution endpoint: `app/routes/api/api.attribution.tsx`.
- SDK event emitter: `app/assets/sdk/events.js`.

## Phases Checklist

- [x] Phase 1: Draft taxonomy + endpoint contract (this file).
- [x] Phase 2: Add `_emitStorefrontEvent` / `_sendEngagementBeacon` / `_ensureWpbSessionId` helpers to the widget.
- [x] Phase 3: Wire helpers into 7 interaction sites.
- [x] Phase 4: Create `api.attribution.engagement.tsx` (DB-persisting endpoint with CORS + idempotent `createMany({ skipDuplicates: true })` write to BundleEngagement table).
- [x] Phase 5: Added `BundleEngagement` Prisma model + SQL migration at `prisma/migrations/20260606000000_add_bundle_engagement/migration.sql`. Ran `prisma generate` so the client knows about the new model.
- [x] Phase 6: Build, bump `WIDGET_VERSION` 3.0.21 → 3.0.22, lint (0 errors), Horizontal jest contract green, built JS contains the 3 new helper methods, CSS at 99 888 B (under 100 000 B cap).
- [ ] Phase 7: User deploy — TWO commands needed:
  1. `npx prisma migrate deploy` against SIT (applies the BundleEngagement migration). The shipped Dockerfile / start script also runs `prisma migrate deploy` via the `setup` npm script, so this happens automatically on Render deploy.
  2. `npm run deploy:sit` (Shopify CLI deploy for the widget JS + endpoint).
- [ ] Phase 8: Verify on storefront that all `wpb:*` events fire at the right moments and the engagement beacon hits the endpoint once per session, creating one BundleEngagement row per (shop, bundle, session).
- [ ] Phase 9 (deferred): Build engagement funnel chart in `app/routes/app/app.attribution.tsx`. Add SDK-level emits in `app/assets/sdk/wolfpack-bundles.js` so the existing `wbp:*` SDK surface stays in sync with the new `wpb:*` widget surface.
