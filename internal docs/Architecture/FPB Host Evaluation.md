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
2. Ensure a `/products/{parentHandle}` redirect record targets the proxy path.
3. Delete the stored public and preview Page GIDs.
4. Clear Page references only after both redirects and Page cleanup succeed.

Retries accept already-correct redirects and already-deleted Pages. A redirect failure stops before Page deletion.

Shopify applies URL redirects only when the source path returns `404`. The FPB parent product must remain published because its variant is the storefront cart and Cart Transform identity, so its product route remains a valid `200` document and takes precedence over the redirect record. The single app embed closes that platform gap: when the current product variant's public `$app.bundle_ui_config` identifies a `full_page` bundle, it replaces the browser location with the canonical proxy path. It does not redirect PPB parents and it is disabled when `request.design_mode` is true so Theme Editor remains usable.

The Page columns remain temporarily available only to drive this guarded migration. Remove them after an approved apply run and a zero-reference preflight.
