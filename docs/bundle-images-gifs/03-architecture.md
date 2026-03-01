# Architecture Decision Record: Per-Bundle Images & GIFs

**Feature ID:** bundle-images-gifs
**Created:** 2026-02-20
**BR Reference:** `docs/bundle-images-gifs/00-BR.md`
**PO Reference:** `docs/bundle-images-gifs/02-PO-requirements.md`

---

## Context

Full-page bundles need a per-bundle promo banner background image. The previous global DCP
setting has been removed. This feature adds `promoBannerBgImage` to each bundle record,
exposes it in the full-page bundle configure page via an "Images & GIFs" nav section, serialises
it into the `bundle_ui_config` metafield, and has the widget apply it as a CSS variable at runtime.

## Constraints

- Must not break existing bundles (nullable column, widget fallback to `none`)
- Must work within the existing Remix + Prisma + Shopify metafield stack
- No changes to the DCP pipeline or product-page bundles
- The `write_files` scope is already present in both `shopify.app.toml` files — no scope changes

---

## Options Considered

### Option A: New nullable column on `Bundle` model ✅ Recommended

Add `promoBannerBgImage String?` directly to the `Bundle` Prisma model.

**Pros:**
- Clean, typed, queryable
- Matches existing nullable string patterns on `Bundle` (`shopifyPageHandle`, `templateName`, etc.)
- One `ALTER TABLE ... ADD COLUMN` migration — safe on a nullable column, zero downtime
- No JSON schema drift risk
- The configure-page save handler already does `db.bundle.update()` — trivial to include

**Cons:**
- Requires a Prisma migration

**Verdict: ✅ Recommended**

### Option B: Store in `BundlePricing.messages` JSON blob ❌ Rejected

Extend the existing `messages` JSON field on `BundlePricing`.

**Cons:**
- Wrong semantic home — `messages` is for discount messaging copy
- No type safety; JSON blobs grow unbounded
- Harder to query or index

**Verdict: ❌ Rejected**

### Option C: New `BundleMedia` table ❌ Rejected (premature)

A new table with `bundleId`, `type`, `url` rows — extensible for future hero/GIF needs.

**Cons:**
- Overkill for a single nullable URL
- Adds join on every page load
- Can be introduced later if media requirements grow

**Verdict: ❌ Rejected for now**

---

## Decision: Option A — new `Bundle.promoBannerBgImage` column

Rationale: Simplest, safest, fits existing patterns, and fully addresses the requirement.

---

## Data Model

### Prisma schema change (`prisma/schema.prisma`)

```prisma
model Bundle {
  id                String     @id @default(cuid())
  name              String
  description       String?
  shopId            String
  shopifyProductId  String?
  shopifyPageHandle String?
  shopifyPageId     String?
  templateName      String?
  promoBannerBgImage String?   // ← NEW: URL of promo banner background image
  bundleType        BundleType @default(product_page)
  status            BundleStatus @default(draft)
  createdAt         DateTime   @default(now())
  updatedAt         DateTime   @updatedAt
  steps             BundleStep[]
  pricing           BundlePricing?
  analytics         BundleAnalytics[]
  // ... existing indexes unchanged
}
```

Migration command:
```bash
npx prisma migrate dev --name add-promo-banner-bg-image
```

### TypeScript type change (`app/services/bundles/metafield-sync/types.ts`)

```typescript
export interface BundleUiConfig {
  id: string;
  bundleId: string;
  name: string;
  description: string;
  status: string;
  bundleType: string;
  shopifyProductId: string | null;
  bundleVariantId: string;
  steps: BundleUiStep[];
  pricing: BundleUiPricing | null;
  messaging: BundleUiMessaging;
  promoBannerBgImage?: string | null;  // ← NEW
}
```

---

## Data Flow

```
Configure Page (React)
  └─ FilePicker component (image URL state)
  └─ Save → formData.append("promoBannerBgImage", url | "")
       │
       ▼
handleSaveBundle (handlers.server.ts)
  └─ formData.get("promoBannerBgImage") → string | null
  └─ db.bundle.update({ promoBannerBgImage: url || null })
  └─ updateBundleProductMetafields() ← triggered after DB update
       │
       ▼
bundle-product.server.ts — bundleUiConfig construction (line ~210)
  └─ promoBannerBgImage: bundleConfiguration.promoBannerBgImage ?? null
       │
       ▼
bundle_ui_config metafield (JSON on bundle variant)
       │
       ▼
Widget JS — createPromoBanner()
  └─ const url = this.selectedBundle?.promoBannerBgImage;
  └─ banner.style.setProperty(
       '--bundle-promo-banner-bg-image',
       url ? `url('${url}')` : 'none'
     );
```

---

## Files to Modify

| File | Change |
|------|--------|
| `prisma/schema.prisma` | Add `promoBannerBgImage String?` to `Bundle` model |
| `app/services/bundles/metafield-sync/types.ts` | Add `promoBannerBgImage?: string | null` to `BundleUiConfig` |
| `app/services/bundles/metafield-sync/operations/bundle-product.server.ts` | Include `promoBannerBgImage` in `bundleUiConfig` at line ~210 |
| `app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/route.tsx` | Add `images_gifs` to `bundleSetupItems` (conditionally for `full_page` only), add `promoBannerBgImage` state, wire FilePicker in right-panel, `formData.append` on save |
| `app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/handlers/handlers.server.ts` | Parse `promoBannerBgImage` from FormData; include in `db.bundle.update()` |
| `app/assets/bundle-widget-full-page.js` | Read `this.selectedBundle.promoBannerBgImage` in `createPromoBanner()` and call `style.setProperty` |

### Files NOT modified

- `app/components/design-control-panel/` — DCP is already stripped of `promoBannerBgImage`
- `app/routes/app/app.bundles.product-page-bundle.*` — product-page bundles are untouched
- `app/assets/bundle-widget-product-page.js` — product-page widget untouched
- `extensions/bundle-builder/assets/bundle-widget-full-page.css` — CSS already has the variable rule

---

## Configure Page Architecture

### Nav item addition

`bundleSetupItems` is a constant defined outside the component at line 235 of `route.tsx`.
It cannot be dynamically filtered there because `bundle` is not in scope at module level.

**Decision:** Keep `bundleSetupItems` as-is; render the "Images & GIFs" button conditionally
inside the map loop using `bundle.bundleType === 'full_page'`.

```tsx
const bundleSetupItems = [
  { id: "step_setup",       label: "Step Setup",         icon: ListNumberedIcon },
  { id: "discount_pricing", label: "Discount & Pricing",  icon: DiscountIcon },
  { id: "images_gifs",      label: "Images & GIFs",       icon: ImageIcon },
  // ^ always in array; rendered conditionally below
];

// In the nav render loop:
{bundleSetupItems
  .filter(item => item.id !== "images_gifs" || bundle.bundleType === "full_page")
  .map(item => <Button ... />)}
```

### State

```tsx
// In component:
const [promoBannerBgImage, setPromoBannerBgImage] = useState<string | null>(
  loaderData.bundle.promoBannerBgImage ?? null
);
```

Wired into the existing dirty-state system via the existing `isDirty` / `setIsDirty` pattern.

### Save FormData

```tsx
formData.append("promoBannerBgImage", promoBannerBgImage ?? "");
```

### Right-panel section UI

```tsx
{activeSection === "images_gifs" && (
  <BlockStack gap="400">
    <Text as="h2" variant="headingMd">Images & GIFs</Text>
    <Divider />
    <Text as="p" variant="headingSm">Promo Banner Background</Text>
    <Text tone="subdued" variant="bodySm">
      Sets the background image for the promo banner at the top of this bundle page.
    </Text>
    <FilePicker
      value={promoBannerBgImage}
      onChange={(url) => { setPromoBannerBgImage(url); setIsDirty(true); }}
    />
    <Divider />
    {/* Coming soon card */}
    <Box background="bg-surface-secondary" padding="400" borderRadius="200">
      <InlineStack gap="200" align="center">
        <Icon source={LockIcon} tone="subdued" />
        <BlockStack gap="100">
          <Text variant="headingSm">More media options</Text>
          <Text tone="subdued" variant="bodySm">
            Coming soon: hero images, step illustrations, and GIF overlays.
          </Text>
        </BlockStack>
      </InlineStack>
    </Box>
  </BlockStack>
)}
```

---

## Widget Change

In `app/assets/bundle-widget-full-page.js`, inside `createPromoBanner()` (currently lines 1032–1115):

After the promo banner element is created and before it is appended to the DOM, add:

```js
const bgImageUrl = this.selectedBundle && this.selectedBundle.promoBannerBgImage;
if (bgImageUrl) {
  banner.style.setProperty('--bundle-promo-banner-bg-image', `url('${bgImageUrl}')`);
} else {
  banner.style.setProperty('--bundle-promo-banner-bg-image', 'none');
}
```

The existing CSS already handles this variable:
```css
.promo-banner {
  background-image: var(--bundle-promo-banner-bg-image, none);
  background-size: cover;
  background-position: center;
}
```

After widget JS changes, **must run** `npm run build:widgets` to regenerate
`extensions/bundle-builder/assets/bundle-widget-full-page-bundled.js`.

---

## Migration / Backward Compatibility

- Column is nullable — existing rows get `NULL` automatically, no data migration needed
- Widget fallback: `var(--bundle-promo-banner-bg-image, none)` — `none` is the CSS default
- Loader on the configure page already selects all Bundle fields; the new field is included automatically via Prisma
- `updateBundleProductMetafields` is called as part of the save flow, so the metafield is synced on the next save

---

## Testing Approach

- Unit test: `handleSaveBundle` with `promoBannerBgImage` set → confirm `db.bundle.update` receives the URL
- Unit test: `handleSaveBundle` with empty string → confirm DB receives `null`
- Unit test: `bundleUiConfig` builder with `promoBannerBgImage` set → confirm field is in serialised output
- Widget test: `createPromoBanner()` with `promoBannerBgImage` URL → CSS variable is set on element
- Widget test: `createPromoBanner()` with `null` → CSS variable is set to `none`
- Manual: configure page → set image → save → view storefront → confirm banner shows image
- Manual: remove image → save → confirm banner falls back to background color only
