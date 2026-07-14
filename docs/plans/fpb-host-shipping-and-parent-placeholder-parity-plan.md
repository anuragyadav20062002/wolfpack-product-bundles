---
schema_version: 1
id: fpb-host-shipping-and-parent-placeholder-parity-plan
title: FPB Host Shipping Decision and Parent Placeholder Parity Plan
type: implementation-plan
status: superseded
summary: Historical Page-host proposal superseded by the shipped FPB app-proxy host migration.
last_audited: 2026-07-14
owners:
  - engineering
domains:
  - storefront
systems:
  - full-page-bundle-hosting
source_paths:
  - app/services/bundles/bundle-parent-product.server.ts
related_docs:
  - internal docs/Architecture/Bundle Parent Product.md
tags:
  - fpb
  - historical-plan
keywords:
  - Shopify Page host
  - app proxy migration
---

# Plan — FPB Host Shipping Decision and Parent Placeholder Parity

> Superseded on 2026-07-14. FPB now uses the signed app-proxy document host. This file remains only as historical decision context and must not be used as current implementation guidance.

**Status:** Superseded

**Created:** 2026-07-14

**Scope:** FPB storefront host decision; FPB/PPB Shopify parent-product creation media

**No deployment in this plan:** verify on SIT with cache bypass and hard refresh

## Outcome

Ship FPB with its existing Shopify Page host at `/pages/{handle}`. Keep the existing app proxy root at `/apps/product-bundles` for signed application data and API traffic, not as the FPB document host.

Use one canonical app-owned parent-product image for both FPB and PPB:

```text
public/bundle-product-placeholder.avif
```

New and recreated parents must receive that exact image through the shared parent-product service. Explicit sync must continue to preserve merchant-owned media.

## Why this is the shipping decision

The current Page host is already integrated with FPB preview, publishing, slug changes, redirects, theme placement, navigation, and SEO. The current architecture scan records 46 page-ID/page-handle-dependent files and 27 explicit page URL contracts. Moving the document host is therefore a breaking cross-layer migration.

An app proxy would remove the Shopify Page lifecycle and provide an app-owned route, but it would also:

- make the FPB document depend on Wolfpack application uptime and cold-start latency;
- share the app's single configured proxy root with the existing signed API routes;
- require route generation to respect Shopify's forwarded `path_prefix`, because merchants can customize the proxy prefix and subpath;
- require a replacement for existing Page preview, publish, redirect, navigation, canonical, and SEO behavior;
- retain separate theme-app-extension placement and theme-support constraints.

Exact route parity alone does not justify that migration for this release. Reopen app-proxy document hosting only as a separately approved breaking migration with an uptime target, redirect strategy, and merchant transition plan.

Official constraints: [Shopify app proxies](https://shopify.dev/docs/apps/build/online-store/app-proxies), [app-proxy authentication](https://shopify.dev/docs/apps/build/online-store/app-proxies/authenticate-app-proxies), and [theme app extension configuration](https://shopify.dev/docs/apps/build/online-store/theme-app-extensions/configuration).

## Grounded current state

- FPB storefront URL: `/pages/{shopifyPageHandle}`.
- PPB storefront URL: `/products/{shopifyProductHandle}`.
- Both bundle types now enter `ensureBundleParentProduct()` for parent creation and explicit sync.
- The shared service builds creation media through `buildBundleProductPlaceholderMediaInput()`.
- The canonical parent placeholder is `/bundle-product-placeholder.avif`.
- `public/bundle.avif` is a different, small Admin/storefront fallback illustration. It must not be used as Shopify parent-product media.
- Older Shopify parents can still retain images created before the shared service or images later changed by a merchant. That explains why live products can differ even when current creation code is shared.

## Contract to lock

### Parent creation

FPB and PPB creation input must use the same media array:

```ts
[
  {
    originalSource: `${appUrl}/bundle-product-placeholder.avif`,
    alt: null,
    mediaContentType: "IMAGE",
  },
]
```

The media source must come from the shared helper. Configure routes must not construct bundle-type-specific creation media.

### Deleted-parent recreation

When a stored Shopify parent no longer exists, the replacement product must receive the same canonical placeholder as a first-time parent.

### Existing parents and merchant ownership

Sync Product and Sync Bundle must not replace media on an existing parent. Shopify product media remains merchant-owned after creation.

To correct the two currently inconsistent test-store parents, use a one-time, explicitly scoped SIT operation against the known FPB and PPB parent product IDs. Do not turn that correction into autonomous backfill behavior and do not run it across production shops. Before changing either product, confirm that its current image is an app-created historical placeholder rather than a merchant image.

## Implementation sequence

### Batch 1 — Close the host decision

1. Change `internal docs/Architecture/FPB Host Evaluation.md` from deferred to accepted.
2. Record the decision: Shopify Page is the FPB document host; app proxy is the data/API plane.
3. Keep `/pages/{handle}` preview, publish, slug, redirect, and storefront URL behavior unchanged.
4. Add explicit reconsideration criteria:
   - a required app-owned public route that Page hosting cannot satisfy;
   - a documented availability and cold-start SLO for document requests;
   - canonical, SEO, navigation, preview, publish, and redirect replacements;
   - migration and rollback for all page-handle consumers;
   - handling of merchant-customized proxy prefixes/subpaths under the existing single proxy root.
5. Update `internal docs/index.md` only if the architecture-note link or title changes.

No route, Liquid, widget, navigation-map, or Shopify app-proxy configuration change belongs in this batch.

### Batch 2 — Prove and enforce placeholder parity with TDD

1. Create `test-spec/parent-product-placeholder-parity.spec.md` before code changes.
2. Add failing service tests proving:
   - an FPB and a PPB produce byte-for-byte equal `media` variables;
   - both use `${appUrl}/bundle-product-placeholder.avif`;
   - deleted-parent recreation uses the same media;
   - missing `appUrl` does not invent or hotlink an alternate image;
   - an existing parent does not receive a media mutation during Sync Product or Sync Bundle.
3. Audit all parent `productCreate` call sites. Route all bundle-parent creation through `ensureBundleParentProduct()`; remove any remaining bundle-type-specific parent creation input rather than adding a compatibility branch.
4. Keep `BUNDLE_PRODUCT_PLACEHOLDER_IMAGE_PATH` as the single source of truth.
5. Ensure `handleUpdateBundleProduct` cannot be reached by current configure UI to silently rewrite parent media. If it is unreachable, remove the dead route action and its tests in the same focused slice. If it is still reachable, replace the app-owned edit path with **Edit Product** in Shopify Admin; do not make Sync Product overwrite merchant media.
6. Update `internal docs/Architecture/Bundle Parent Product.md` to name the canonical AVIF path explicitly.

### Batch 3 — Correct SIT data without a deployment

1. In Shopify Admin, identify the FPB and PPB parent product IDs for the agreed SIT bundles.
2. Read each product's current media URL, alt text, creation/update timestamps, and live bundle association.
3. Confirm both mismatched images are historical app placeholders. Stop if either appears merchant-owned.
4. Apply a narrowly scoped media correction to those two parent products only, using the canonical AVIF URL.
5. Do not change product title, description, handle, status, variant, or other media.
6. Record the before/after product IDs and Shopify CDN media URLs in the verification notes; do not commit screenshots.

This is an external Shopify data correction and must be performed only after explicit approval for the named products. It is not a deployment or a production backfill.

### Batch 4 — Verification

Run focused automated checks:

```bash
npx jest --selectProjects unit --runTestsByPath \
  tests/unit/lib/bundle-product-media.test.ts \
  tests/unit/services/bundle-parent-product.test.ts \
  tests/unit/routes/fpb-sync-product.test.ts \
  tests/unit/routes/ppb-sync-product.test.ts
```

Run scoped lint with zero errors on every modified TypeScript file, then rebuild Graphify because code or architecture documentation changed:

```bash
npx eslint --max-warnings 9999 <modified-files>
npm run graphify:rebuild
```

Chrome DevTools MCP verification on SIT:

1. Open the FPB `/pages/{handle}` URL and PPB `/products/{handle}` URL.
2. Clear Cache Storage where available and hard reload with cache disabled.
3. Verify FPB remains Page-hosted and its preview/publish/slug behavior is unchanged.
4. Verify PPB remains product-hosted.
5. Open both parent products and confirm the same canonical placeholder artwork and canonical source lineage.
6. Edit one test parent's media in Shopify Admin, run Sync Product, hard reload, and verify the merchant edit survives.
7. Create or recreate disposable SIT test parents for both bundle types and verify both begin with the canonical placeholder.

No production deployment or autonomous backfill is part of verification.

## Acceptance criteria

- [ ] The FPB host architecture decision is recorded as Shopify Page, not deferred.
- [ ] Existing FPB `/pages/{handle}` and PPB `/products/{handle}` contracts are unchanged.
- [ ] App proxy remains the existing signed data/API plane under its single configured root.
- [ ] FPB and PPB parent creation use identical media input.
- [ ] The canonical parent image is `public/bundle-product-placeholder.avif` for both types.
- [ ] `public/bundle.avif` is never supplied as Shopify parent-product media.
- [ ] Deleted-parent recreation uses the canonical placeholder.
- [ ] Explicit sync preserves merchant-owned media.
- [ ] The two approved SIT test parents are corrected only after ownership verification.
- [ ] Focused tests and scoped ESLint pass with zero errors.
- [ ] SIT browser verification passes after cache bypass and hard reload.

## Expected files in the implementation slice

- `test-spec/parent-product-placeholder-parity.spec.md`
- `tests/unit/lib/bundle-product-media.test.ts`
- `tests/unit/services/bundle-parent-product.test.ts`
- relevant FPB/PPB sync route tests if a remaining divergent path is found
- `app/lib/bundle-product-media.server.ts` only if the tests expose a missing invariant
- `app/services/bundles/bundle-parent-product.server.ts` only if the tests expose a divergent path
- configure route/action files only if the legacy `updateBundleProduct` action is still reachable
- `internal docs/Architecture/FPB Host Evaluation.md`
- `internal docs/Architecture/Bundle Parent Product.md`
- Graphify outputs regenerated by the repository command

## Non-goals

- App-proxy FPB document hosting.
- Removal of the existing Shopify Page lifecycle.
- Widget layout, storefront design, cart, or checkout changes.
- Replacing merchant-owned media during sync.
- Autonomous migration or production backfill.
- Shopify app deployment.
