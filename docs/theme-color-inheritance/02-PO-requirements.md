# Product Owner Requirements: Theme Color Inheritance for Free Plan Bundle Widget

## Overview

Free plan merchants should see their bundle widget automatically adopt the store's active Shopify theme colors as the base color palette. No configuration required. Colors are synced from the active theme on install and on every "Sync Bundle" action.

---

## User Stories with Acceptance Criteria

### Story 1: Free Plan Widget Inherits Theme Colors on Storefront

**As a** Free plan merchant
**I want** my bundle widget to use my store's primary brand colors automatically
**So that** bundles look native to my store without requiring any setup

**Acceptance Criteria:**
- [ ] Given a merchant is on Free plan, when their storefront renders the bundle widget, then `--bundle-global-primary-button` equals the store's `colors_accent_1` theme color (e.g. `#1A56DB` for a blue-themed store)
- [ ] Given a merchant is on Free plan, when their storefront renders the bundle widget, then all downstream CSS vars that fall back to `globalPrimaryButton` (buttons, tabs, tier pills, step timeline, search focus border, footer scrollbar, toast bg, tile badge) automatically use the theme color — no individual overrides needed
- [ ] Given a merchant is on Free plan AND their `DesignSettings` record has no `themeColors` stored (pre-existing install), then the widget falls back to existing hardcoded defaults (`#000000` buttons etc.) — no regression
- [ ] Given a merchant is on Grow plan, when the CSS endpoint is called, then theme color inheritance is NOT applied — Grow plan always uses the DCP-configured values (or hardcoded defaults if no DCP settings saved)
- [ ] Given `ENFORCE_PLAN_GATES` is not set (SIT environment), when the CSS endpoint is called, theme color inheritance is NOT applied (SIT uses hardcoded defaults, same as current behavior)

---

### Story 2: Theme Colors Are Synced on Sync Bundle

**As a** Free plan merchant
**I want** my bundle colors to update when I sync my bundle after changing my store's theme
**So that** bundle colors stay in sync with my latest storefront branding

**Acceptance Criteria:**
- [ ] Given a merchant clicks "Sync Bundle" on any bundle configure page, then the app fetches the active theme's `config/settings_data.json` via Shopify Admin GraphQL
- [ ] Given the theme sync succeeds, then `themeColors` is written to the `DesignSettings` record for that shop (upserted — created if not exists)
- [ ] Given the theme sync succeeds, then the NEXT request to the CSS endpoint for that shop reflects the updated theme colors (no manual cache busting needed — ETag changes because DB row updates `updatedAt`)
- [ ] Given the theme uses non-standard color keys (keys not in the expected mapping), then those specific anchors fall back to hardcoded defaults while others use the mapped theme color
- [ ] Given the theme `settings_data.json` returns a malformed or empty color value, then that specific anchor falls back to its hardcoded default — other anchors unaffected

---

### Story 3: Theme Colors Are Synced on App Install

**As a** new Free plan merchant
**I want** my bundle widget to have themed colors from day one
**So that** the first time I place a bundle it already looks like part of my store

**Acceptance Criteria:**
- [ ] Given a merchant installs the app, then theme color sync runs automatically as part of the post-install flow
- [ ] Given theme sync fails during install (API error, rate limit), then install still completes successfully — the error is logged but does not surface to the merchant (silent fail with fallback to defaults)
- [ ] Given a shop has two bundle types (product_page and full_page), then the same `themeColors` object is stored on both `DesignSettings` records (same theme for the shop)

---

### Story 4: DCP Preview Reflects Theme Colors for Free Plan

**As a** Free plan merchant looking at the DCP page
**I want** the widget preview to show my theme colors (not generic black/white)
**So that** I can see what a themed bundle looks like before deciding to upgrade

**Acceptance Criteria:**
- [ ] Given a merchant is on Free plan, when they visit `/app/design-control-panel` (which shows the paywall banner), then the preview iframe also renders using theme-inherited colors
- [ ] Given the preview iframe loads the CSS endpoint (`/api/design-settings/{shopDomain}?bundleType=...`), then the same plan check + theme color injection logic applies as on the storefront — the preview is consistent with what merchants see on their store
- [ ] Given no `themeColors` are stored for the shop, then the preview falls back to hardcoded defaults (no change from current behavior)

---

## UI/UX Specifications

### No New UI Required for Free Plan Merchants

Theme color inheritance is **transparent and automatic**. There is no settings page, no color picker, no "sync theme" button for Free plan. The colors apply silently.

### Sync Bundle Button (Existing — No Visual Change)

The existing "Sync Bundle" button on configure pages triggers theme sync as a side effect. No UI change needed. The sync runs server-side and the merchant sees their existing sync confirmation flow.

### DCP Page — Free Plan State (Existing Paywall Banner)

The existing paywall `Banner` (`tone="warning"`, "Upgrade to Grow" CTA) remains unchanged. The preview pane behind it simply uses theme colors instead of generic defaults. No label or copy change needed.

### Error Handling (Silent)

- Theme color fetch failures must never surface as visible errors to the merchant
- Log failures server-side with `AppLogger.warn()` — include `shopDomain` and the error
- Fall back to hardcoded defaults silently

---

## Data Persistence

### New field: `themeColors` on `DesignSettings`

**Type:** `Json?` (nullable)
**Location:** `prisma/schema.prisma` — added to `DesignSettings` model
**Scope:** One `DesignSettings` record per `(shopId, bundleType)` — theme colors are shop-level, so the same values are written to both `product_page` and `full_page` records

**Shape:**
```typescript
interface ThemeColors {
  globalPrimaryButton: string;    // e.g. "#1A56DB"
  globalButtonText: string;       // e.g. "#FFFFFF"
  globalPrimaryText: string;      // e.g. "#111827"
  globalSecondaryText: string;    // e.g. "#6B7280"
  globalFooterBg: string;         // e.g. "#F9FAFB"
  globalFooterText: string;       // e.g. "#111827"
  syncedAt: string;               // ISO 8601 timestamp
}
```

**Null handling:** If `themeColors` is `null` (new field, existing records), the CSS endpoint behaves exactly as today.

---

## Scope: What Colors Are Inherited

Only the **6 global color anchors** are inherited from the theme. Individual DCP settings (e.g. `productCardBgColor`, `modalBgColor`, `discountPillBgColor`) continue to use their own defaults. The 6 anchors control the most visible, brand-defining colors:

| Anchor | Controls |
|--------|---------|
| `globalPrimaryButton` | All buttons, active tabs, step timeline completed state, tier pills, search focus ring, footer scrollbar, toast background, tile qty badge |
| `globalButtonText` | Text inside buttons, quantity selector text, active tab text |
| `globalPrimaryText` | Product titles, prices, modal headings, header text, footer text |
| `globalSecondaryText` | Strike-through prices, empty state text, subdued UI text |
| `globalFooterBg` | Footer section background |
| `globalFooterText` | Footer text, back button text |

---

## Shopify Theme Color Key Mapping

| Bundle Anchor | Shopify `settings_data.json` key | Fallback if missing |
|--------------|----------------------------------|---------------------|
| `globalPrimaryButton` | `colors_accent_1` | `#000000` |
| `globalButtonText` | `colors_solid_button_labels` | `#FFFFFF` |
| `globalPrimaryText` | `colors_text` | `#000000` |
| `globalSecondaryText` | `colors_secondary_button_labels` | `#6B7280` |
| `globalFooterBg` | `colors_background_1` | `#FFFFFF` |
| `globalFooterText` | `colors_text` | `#000000` |

**Note:** `colors_text` maps to both `globalPrimaryText` and `globalFooterText` — this is intentional since footer text and body text are typically the same color in Shopify themes.

---

## `read_themes` Scope

The Shopify app currently does not include `read_themes` in its scopes. This scope is required for the `OnlineStoreTheme.files()` GraphQL query.

**Scope addition:**
- Add `read_themes` to `SCOPES` in `.env.example` and the app's `shopify.app.toml`
- Existing merchants will be prompted to re-authorize — this is a standard Shopify OAuth re-consent flow

---

## Backward Compatibility Requirements

- Existing `DesignSettings` records must remain fully valid after the schema migration
- The new `themeColors` field defaults to `null` — existing behavior is preserved exactly
- No data migration required — null means "use hardcoded defaults" (same as today)
- Grow plan merchants are completely unaffected — the logic branch for theme colors is only entered when `isFeatureGatingEnabled() && plan === "free"`

---

## Out of Scope (Explicit)

- Font family inheritance from Shopify theme
- Typography size inheritance (font sizes, weights)
- Per-color-group selective inheritance (only button colors vs. only text colors)
- Real-time theme change detection via webhooks
- Grow plan merchants seeing their own theme colors as DCP picker defaults
- Showing the merchant a preview of which theme colors were detected
- Support for headless Shopify themes that don't use `settings_data.json`
