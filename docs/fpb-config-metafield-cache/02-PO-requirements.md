# Product Owner Requirements: FPB Bundle Config Metafield Cache

## User Stories with Acceptance Criteria

### Story 1: Storefront page loads without proxy
**As a** merchant
**I want** my full-page bundle pages to work even if the app proxy is unavailable
**So that** customers always see the bundle and can complete purchases

**Acceptance Criteria:**
- [ ] Given a FPB page whose `custom:bundle_config` metafield is populated, when a customer visits
  the page, then the widget loads without making any proxy API call.
- [ ] Given a FPB page whose `custom:bundle_config` metafield is populated but the app proxy
  returns 404, when a customer visits the page, then the widget loads correctly from the metafield.
- [ ] Given a FPB page with NO `bundle_config` metafield (legacy page), when a customer visits,
  then the widget falls back to the proxy API call (existing behaviour — no regression).
- [ ] Given `data-bundle-config` is present but contains invalid JSON, when the widget parses it,
  then it logs the parse error to the console and falls back to the proxy API call.

### Story 2: "Add to storefront" writes the bundle config metafield
**As a** merchant
**I want** the bundle config to be stored on the page immediately when I add the widget
**So that** the storefront page works correctly from the very first visit

**Acceptance Criteria:**
- [ ] Given a merchant clicks "Add to storefront" on the FPB configure page, when the page is
  created in Shopify, then `page.metafields.custom.bundle_config` is set with the serialised bundle
  config JSON alongside the existing `bundle_id` metafield.
- [ ] Given the bundle has steps with products, pricing, and tier config, when the metafield is
  written, then all those fields are included in the serialised JSON.
- [ ] Given the metafield write fails (Shopify API error), when the page is otherwise created
  successfully, then the error is logged as a warning (non-fatal) and the flow completes —
  the widget falls back to the proxy API.

### Story 3: "Sync Bundle" keeps the metafield up to date
**As a** merchant
**I want** my storefront page to show the latest bundle products and pricing after I sync
**So that** changes I make in the configure page go live immediately

**Acceptance Criteria:**
- [ ] Given a merchant clicks "Sync Bundle" on the FPB configure page, when sync completes, then
  the `custom:bundle_config` page metafield is updated with the current bundle config.
- [ ] Given the sync updates the metafield, when a customer next visits the FPB page, then they
  see the updated products and pricing (no stale cache).
- [ ] Given there is no Shopify page linked to the bundle (shopifyPageId is null), when sync runs,
  then the metafield write is skipped gracefully.

### Story 4: Metafield definition is registered automatically
**As a** developer
**I want** the `custom:bundle_config` metafield definition to be created automatically
**So that** the Liquid template can read it reliably without manual setup

**Acceptance Criteria:**
- [ ] Given the `bundle_config` metafield definition does not exist, when the app writes the
  metafield for the first time, then the definition is created with `type: json`,
  `namespace: custom`, `ownerType: PAGE`, and `access: { storefront: PUBLIC_READ }`.
- [ ] Given the definition already exists, when the app attempts to create it again, then the
  existing definition is used without error (idempotent).

---

## UI/UX Specifications

No new UI components are required. The change is entirely in the data layer and widget JS.

**Info notice on the FPB configure page** (existing "Sync" button area):
No change to wording needed — the existing "Sync Bundle" copy covers this. If desired in a future
iteration, an info callout ("Changes go live after syncing") can be added. Out of scope here.

---

## Data Persistence

| What | Where | Format | Written by |
|------|-------|--------|------------|
| `custom:bundle_config` | Shopify page metafield | JSON string (serialised bundle config object) | `handleWidgetPlacement`, `handleSyncBundle` |

**Metafield definition:**
```
namespace: custom
key: bundle_config
type: json
ownerType: PAGE
access.storefront: PUBLIC_READ
access.admin: MERCHANT_READ_WRITE
```

**Serialised bundle config shape** (matches `formattedBundle` from `api.bundle.$bundleId.json`):
```json
{
  "id": "...",
  "name": "...",
  "description": "...",
  "status": "ACTIVE",
  "bundleType": "full_page",
  "fullPageLayout": "FOOTER_BOTTOM",
  "shopifyProductId": "...",
  "loadingGif": null,
  "tierConfig": null,
  "showStepTimeline": null,
  "steps": [
    {
      "id": "...", "name": "...", "position": 1,
      "minQuantity": 1, "maxQuantity": 1,
      "enabled": true, "displayVariantsAsIndividual": false,
      "products": [...],
      "collections": [],
      "conditionType": null, "conditionOperator": null, ...
    }
  ],
  "pricing": { "enabled": true, "method": "percentage_off", "rules": [...], "messages": {} }
}
```

---

## Backward Compatibility Requirements

- Existing FPB pages with only `bundle_id` metafield and **no** `bundle_config` must continue
  working via the proxy API fallback. No merchant action required.
- After a merchant re-syncs, the `bundle_config` metafield is created and the page becomes
  proxy-independent from that point on.
- The widget's `data-bundle-config` parsing must be lenient — if parsing fails for any reason,
  fall back to proxy API silently.

---

## Out of Scope (explicit)

- No changes to the proxy API endpoint or its HMAC verification.
- No migration script to backfill `bundle_config` on existing pages.
- No UI changes on the configure page.
- No changes to PDP bundles.
- No changes to the design settings CSS proxy path (separate concern).
