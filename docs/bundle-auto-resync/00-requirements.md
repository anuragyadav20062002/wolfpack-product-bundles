# Bundle Auto Re-sync — Requirements & Discussion Notes

**Status:** Parked — to be picked up in a future sprint
**Last Updated:** 2026-03-20

---

## Core Use Case

When we ship a code change that alters bundle processing logic (e.g. new `formatBundleForWidget` output shape, new metafield structure, changed cart transform behaviour), all existing merchants' bundles need to re-process against the new logic.

Currently merchants must manually click "Sync Bundle" per bundle — impractical at scale.

---

## Mental Model: Version-Gated Lazy Migration

Not a time-based periodic sync. A **version mismatch** triggers re-sync:

- Every `Bundle` row tracks `syncedAtVersion` (the code version it was last synced against)
- A `BUNDLE_SYNC_VERSION` env var represents the current required version
- A background job finds bundles where `syncedAtVersion != BUNDLE_SYNC_VERSION` and re-processes them
- When we deploy a logic change: bump `BUNDLE_SYNC_VERSION` → all bundles re-sync within ~1 cron cycle
- Self-healing: failed syncs automatically retry on the next cycle (version still mismatches)

---

## What "Soft Sync" Does Per Bundle

This is NOT the hard reset (`handleSyncBundle` — which deletes + recreates the Shopify page).
No page deletion. No URL changes. Merchant-visible storefront is untouched.

| Bundle Type | Operation |
|---|---|
| Full-Page (FPB) | Re-write `custom:bundle_config` page metafield via `formatBundleForWidget()` |
| Product-Page (PDP) | Re-write `$app:bundle_ui_config` variant metafield |
| Both | Mark `bundle.syncedAtVersion = BUNDLE_SYNC_VERSION` on success |

---

## Role of `shop.metafields.app.lastSync`

Already declared in `shopify.app.toml` but never written anywhere in the codebase.
In this design: written after all bundles for a shop complete → **merchant-visible audit trail** in Shopify admin.
NOT used for debounce (the DB `syncedAtVersion` field handles that).

---

## Open Questions (to resolve before building)

| # | Question | Notes |
|---|---|---|
| Q1 | **Soft sync scope for PDP** | Re-write only `bundle_ui_config`, or run the full `updateBundleProductMetafields` (all 6 variant metafields)? Full re-run is safer but more API calls. |
| Q2 | **Cron frequency** | Hourly Render Cron Job feels right (re-syncs complete within ~1 hr of deploy). Agree? |
| Q3 | **Batch size / rate limits** | Process N bundles per shop per run (e.g. 10), or all at once and rely on retry? |
| Q4 | **Cron endpoint auth** | Shared secret in `Authorization` header on `POST /api/cron/sync-bundles`, validated server-side. Standard pattern. |
| Q5 | **Write `shop.metafields.app.lastSync`** | Write after each shop's batch, or skip for simplicity in v1? |

---

## Proposed Data Model Changes

```prisma
model Bundle {
  // ... existing fields ...
  syncedAtVersion  String?   // Code version this bundle was last synced against
}
```

```
BUNDLE_SYNC_VERSION=1   // env var — bump to trigger a re-sync of all bundles
```

---

## Proposed Infrastructure

- New route: `POST /api/cron/sync-bundles` (authenticated via shared secret header)
- New Render Cron Job: calls the endpoint every hour
- Uses `unauthenticated.admin(shopDomain)` (offline session) — same pattern as inventory sync webhooks

---

## Workflow on Future Logic Change

```
1. Update the logic (e.g. new formatBundleForWidget output)
2. Bump BUNDLE_SYNC_VERSION in Render env vars (e.g. "1" → "2")
3. Deploy
4. Cron runs → finds all bundles with syncedAtVersion != "2" → re-syncs them
5. Within ~1 hour, all merchants' bundles reflect the new logic
```
