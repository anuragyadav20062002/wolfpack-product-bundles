---
schema_version: 1
id: fpb-host-evaluation
title: FPB App Proxy Host
type: architecture-decision
status: accepted
summary: Full Page Bundles use the signed app proxy as their sole storefront document host.
last_audited: 2026-07-14
owners:
  - engineering
domains:
  - storefront
systems:
  - fpb-app-proxy
source_paths:
  - app/routes/root/wpb.$bundleId.tsx
  - app/services/bundles/fpb-page-host-migration.server.ts
  - extensions/bundle-builder/blocks/bundle-app-embed.liquid
related_docs:
  - Architecture/Widget Architecture.md
  - Operations/Deployment Backfill.md
tags:
  - architecture
  - fpb
keywords:
  - application/liquid
  - wpb_preview
---

# FPB App Proxy Host

## Decision

`/apps/product-bundles/wpb/{bundleId}` is the only FPB storefront document host. Shopify verifies and forwards the request through the installed default app-proxy root. The Remix route verifies the proxy HMAC before database access and returns `application/liquid`, so Shopify wraps the response in the active theme layout.

Active and unlisted bundles are public. Draft bundles require a 15-minute `wpb_preview` token bound to version, shop, bundle ID, and expiry. Archived, missing, cross-shop, and invalid-preview requests return `404`; invalid Shopify signatures return `400`.

Admin Preview actions mint a fresh signed URL for every FPB status. Public bundles do not require the token, but using the same stateless action for active, unlisted, and draft previews prevents Admin surfaces from diverging and guarantees a new URL on every click.

The Liquid response embeds the complete formatted runtime configuration in `data-bundle-config`. The single app embed detects that marker and loads widget JavaScript and CSS from theme-extension assets through Shopify `asset_url`. App-proxy asset URLs and a Page fallback are not supported.

## Canonical URL

The application builds one canonical FPB URL:

```text
https://{shop}/apps/product-bundles/wpb/{bundleId}
```

Merchant-customized proxy prefixes and subpaths are unsupported in this migration. PPB remains at `/products/{handle}`.

## Migration order

Existing hosts migrate in this order:

1. Ensure `/pages/{oldHandle}` redirects to the proxy path.
2. Read the FPB parent product's live handle by its stored Shopify product ID.
3. Ensure `/products/{oldParentHandle}` redirects to the proxy path while the product route is still active.
4. Move the synthetic parent to `wpb-parent-{bundleId}` with Shopify's automatic handle redirect disabled.
5. Re-read the redirect and require it to still target the proxy path.
6. Delete the stored public and preview Page GIDs.
7. Clear Page references and persist Shopify's returned internal handle only after redirect and Page cleanup succeed.

Retries accept already-correct redirects, an already-moved live product handle, and already-deleted Pages. The live-handle lookup lets a retry recover when Shopify completed the handle move but the prior process stopped before the database update. A redirect or product-handle failure stops before Page deletion and normal FPB sync.

Shopify applies URL redirects only when the source path returns `404`. Moving the synthetic FPB parent to its app-owned internal handle makes the old merchant-facing path redirect-eligible while keeping the product `UNLISTED`, published, and available as the storefront cart and Cart Transform identity. The handle update sends only product ID, handle, and `redirectNewHandle: false`; it does not write status, publication, media, variants, or merchandising metadata. New FPB parents start with the deterministic internal handle, while PPB handles remain product-hosted and merchant-owned.

The single app embed redirect remains a safety fallback for an FPB parent that has not completed native migration. It does not redirect PPB parents and is disabled when `request.design_mode` is true so Theme Editor remains usable. After migration, Shopify's platform redirect is the primary and faster path because the old product URL no longer owns a valid resource.

The Page columns remain temporarily available only to drive this guarded migration. Remove them after an approved apply run and a zero-reference preflight.
