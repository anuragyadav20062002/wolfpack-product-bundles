# Architecture Decision Record: Promo Banner Background Image

**Feature ID:** promo-banner-bg-image
**Created:** 2026-02-20
**Input:** docs/promo-banner-bg-image/00-BR.md + docs/promo-banner-bg-image/02-PO-requirements.md
**Status:** Architecture Complete → Handoff to SDE

---

## Context

The full-page bundle widget promo banner currently renders only a solid background colour
via `background: var(--bundle-promo-banner-bg, #F3F4F6)`. Merchants want to use an image
from their Shopify Content → Files as the banner background.

The pipeline that must change end-to-end:

```
Merchant picks image in DCP
  → CDN URL stored in DesignSettings.promoBannerSettings (Json)
    → css-variables-generator emits --bundle-promo-banner-bg-image
      → Widget CSS applies background-image: url(...) with cover/center
```

---

## Constraints

- No new DB migration — `promoBannerSettings Json` column must absorb the new field.
- Must not alter the visual appearance of banners with no image configured.
- Shopify CDN URLs are public — no CORS issues in the storefront widget.
- Widget bundle must be rebuilt and committed after CSS changes.
- Must use existing Remix + Prisma + Shopify Admin GraphQL stack.

---

## Options Considered

### Option A — Extend existing `promoBannerSettings` Json column (Recommended ✅)

Add `promoBannerBgImage?: string | null` to the `PromoBannerSettings` TypeScript interface.
The field is persisted inside the existing `promoBannerSettings Json` column alongside the
11 existing fields. `mergeSettings.ts` already spreads this column last, so the new field
flows through with zero changes to the merge logic.

**Pros:**
- Zero DB migration — Json column is schema-less for its stored object.
- Exactly mirrors how all 11 existing promo banner fields work.
- `extractPromoBannerSettings()` already collects into an object; add one line.
- `mergeSettings.ts` spread handles it automatically.
- `defaultSettings.ts` provides the `null` fallback — backward-compatible.

**Cons:** None material.

**Verdict:** ✅ Recommended.

---

### Option B — New `promoBannerBgImageUrl String?` column on `DesignSettings` table

Add a dedicated nullable column via a Prisma migration.

**Pros:** Explicit relational schema, easier to query in raw SQL.
**Cons:** Requires a migration deploy, adds operational risk, no advantage over Json for a
single optional URL string that logically belongs with the other promo banner fields.

**Verdict:** ❌ Rejected — unnecessary migration, no benefit.

---

### Option C — Store in a Shopify App Metafield

Save the CDN URL as a shop-scoped metafield alongside the existing metafields.

**Pros:** Trivial to query in Liquid themes directly.
**Cons:** All design settings live in the Postgres `DesignSettings` table — this would be the
only design setting in a metafield, creating an inconsistent access pattern. Requires a
separate metafield upsert on save.

**Verdict:** ❌ Rejected — inconsistent with existing design settings architecture.

---

## Files API Route Architecture

The file picker requires calling Shopify Admin GraphQL `files(first:25)`. Two options:

### Option X — Inline in DCP loader

Load the first 25 files unconditionally every time the DCP page opens.

**Cons:** Every DCP page load incurs the Admin API latency even when the merchant never
opens the image picker. Pagination via cursor cannot be done via the loader alone.

**Verdict:** ❌ Rejected.

### Option Y — Dedicated resource route `api.store-files.tsx` (Recommended ✅)

A Remix resource route that accepts `?cursor=` for pagination and returns
`{ files, pageInfo }`. The `FilePicker` component calls it via `useFetcher` when the
merchant opens the picker modal and again when they click "Load more".

**Pros:** Zero latency impact on DCP page load. Pagination is natural (cursor as query
param). Reusable from any future component.

**Verdict:** ✅ Recommended.

---

## Decision

**Data persistence:** Option A — extend `promoBannerSettings` Json column.
**Files API:** Option Y — dedicated resource route.

---

## Data Model

### `app/types/state.types.ts` — `PromoBannerSettings` interface

```typescript
export interface PromoBannerSettings {
  promoBannerEnabled: boolean;
  promoBannerBgColor: string;
  promoBannerBgImage: string | null;   // ← NEW: CDN URL or null
  promoBannerTitleColor: string;
  promoBannerTitleFontSize: number;
  promoBannerTitleFontWeight: number;
  promoBannerSubtitleColor: string;
  promoBannerSubtitleFontSize: number;
  promoBannerNoteColor: string;
  promoBannerNoteFontSize: number;
  promoBannerBorderRadius: number;
  promoBannerPadding: number;
}
```

### DB storage (no migration)

`DesignSettings.promoBannerSettings` Json column — existing rows remain valid.
New field simply absent (treated as `null` by spread + default).

```json
{ "promoBannerBgImage": "https://cdn.shopify.com/s/files/1/0123/image.png" }
{ "promoBannerBgImage": null }
```

### CSS variable

```
--bundle-promo-banner-bg-image: url('https://cdn.shopify.com/.../image.png');
/* or when no image: */
--bundle-promo-banner-bg-image: none;
```

### Widget CSS change

```css
/* Before */
.promo-banner {
  background: var(--bundle-promo-banner-bg, #F3F4F6);
  ...
}

/* After — background-image layered on top of background-color fallback */
.promo-banner {
  background: var(--bundle-promo-banner-bg, #F3F4F6);
  background-image: var(--bundle-promo-banner-bg-image, none);
  background-size: cover;
  background-position: center;
  ...
}
```

When `--bundle-promo-banner-bg-image` is `none` (default), there is no visual difference
from today — `background-image: none` is a CSS no-op. The solid colour continues to show.

---

## Component Architecture

### New: `FilePicker` component

```
app/components/design-control-panel/settings/FilePicker.tsx
```

Props:
```typescript
interface FilePickerProps {
  value: string | null;          // currently selected CDN URL
  onChange: (url: string | null) => void;
}
```

Internal state: `{ open, files, search, selectedUrl, cursor, hasNextPage, loading }`

Behaviour:
- "Choose from store files" button → sets `open = true` → useFetcher loads `/app/api.store-files`
- Search input filters `files` client-side (and re-fetches with `?query=` for large sets)
- Grid of thumbnails (3-col desktop, 2-col mobile), selected = blue border ring
- "Load more" → useFetcher with `?cursor=<cursor>`
- "Select" → calls `onChange(selectedUrl)`, closes modal
- "Remove image" → calls `onChange(null)`, shown only when value is set

### New: Resource route

```
app/routes/app/api.store-files.tsx
```

Loader accepts: `?cursor=&query=`
Returns: `{ files: Array<{ id, url, filename, createdAt, thumbnail }>, pageInfo: { hasNextPage, endCursor } }`

GraphQL query used:
```graphql
query StoreFiles($first: Int!, $after: String, $query: String) {
  files(first: $first, after: $after, query: $query) {
    edges {
      node {
        id
        ... on MediaImage {
          image {
            url
            originalSrc
          }
          createdAt
          alt
        }
      }
    }
    pageInfo {
      hasNextPage
      endCursor
    }
  }
}
```

---

## Files to Modify

| File | Change |
|---|---|
| `app/types/state.types.ts` | Add `promoBannerBgImage: string \| null` to `PromoBannerSettings` |
| `app/components/design-control-panel/config/defaultSettings.ts` | Add `promoBannerBgImage: null` to both product-page and full-page defaults |
| `app/lib/css-generators/css-variables-generator.ts` | Emit `--bundle-promo-banner-bg-image` in PROMO BANNER block |
| `app/routes/app/app.design-control-panel/handlers.server.ts` | Add `promoBannerBgImage` to `extractPromoBannerSettings()` |
| `app/components/design-control-panel/settings/PromoBannerSettings.tsx` | Add Background Image subsection using `<FilePicker>` |
| `extensions/bundle-builder/assets/bundle-widget-full-page.css` | Add `background-image`, `background-size`, `background-position` to `.promo-banner` |

## Files to Create

| File | Purpose |
|---|---|
| `app/routes/app/api.store-files.tsx` | Resource route — Shopify Admin `files` GraphQL query |
| `app/components/design-control-panel/settings/FilePicker.tsx` | Polaris Modal file picker component |

## Files NOT Changed

| File | Reason |
|---|---|
| `app/components/design-control-panel/config/mergeSettings.ts` | Spread already handles new Json fields |
| `app/assets/bundle-widget-full-page.js` | No JS logic needed — CSS handles background-image |
| `prisma/schema.prisma` | No migration — Json column absorbs new field |
| `extensions/bundle-builder/assets/bundle-widget-full-page-bundled.js` | Auto-generated by `npm run build:widgets` |

---

## Migration / Backward Compatibility Strategy

1. `defaultSettings.ts` sets `promoBannerBgImage: null` for all defaults.
2. `mergeSettings.ts` spreads the DB Json last — if the row has no `promoBannerBgImage` key,
   the default `null` is used.
3. `css-variables-generator.ts` emits `--bundle-promo-banner-bg-image: none` when value is
   null/undefined — `background-image: none` is a CSS no-op.
4. Existing rows with no `promoBannerBgImage` key render identically to today.

---

## Testing Approach

- Unit tests for `css-variables-generator.ts`: assert `--bundle-promo-banner-bg-image: url('...')` when URL set; `none` when null.
- Unit tests for `extractPromoBannerSettings()`: assert `promoBannerBgImage` is extracted.
- Unit tests for `mergeSettings`: assert null default when key absent in DB Json.
- Manual: Open DCP → Full Page tab → Promo Banner → pick image → save → reload → image persists.
- Manual: Storefront — promo banner renders image with solid-colour fallback visible during load.

---

## Build Steps After Implementation

```bash
# Rebuild widget bundles (CSS changes)
npm run build:widgets

# Commit bundled files alongside source
git add extensions/bundle-builder/assets/bundle-widget-full-page-bundled.js
git add app/assets/bundle-widget-full-page.js  # unchanged but commit for clarity
```
