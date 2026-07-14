---
title: FPB Host Evaluation
type: architecture-decision-deferred
audited: 2026-07-14
sources: app/services/widget-installation/widget-full-page-bundle.server.ts; app/routes/app/app.bundles.full-page-bundle.configure.$bundleId
---

# FPB Host Evaluation

## Decision status

Deferred. FPB continues to use a Shopify Page at `/pages/{handle}`. This slice does not change routes, widget loading, preview behavior, publishing behavior, or theme-extension placement.

## Current blast radius

A 2026-07-14 source scan found:

- 46 files in `app/`, `extensions/`, `tests/`, `prisma/`, and `scripts/` that reference FPB page IDs or page/preview handles.
- 27 files with explicit `/pages/` or `pages/` URL contracts, excluding generated Admin API schema data.

This is larger than the earlier lower-bound estimate of 38 page-handle-dependent files and 24 `/pages/` contracts. A host migration is a breaking cross-layer change, not a route-only refactor.

## Shopify Page benefits

- Native Shopify canonical URL and Shopify-hosted document availability.
- Theme integration through the current page template/app-embed flow.
- Merchant navigation and SEO controls.
- Existing preview, publish, slug, redirect, and page-metafield workflows.
- Storefront document availability is not coupled to Wolfpack application uptime.

## App proxy benefits

- Can match an EB-style app-owned route exactly.
- Removes the Shopify Page create/update/delete lifecycle.
- Keeps dynamic document generation in the application.

## App proxy risks and constraints

- The storefront document becomes dependent on application uptime and cold-start latency.
- Shopify permits one proxy root per app; child paths share that root.
- Merchants can customize the proxy prefix and subpath, so application code cannot assume one immutable public route for every installed shop.
- Shopify strips a documented set of response headers from app-proxy responses.
- Migrating existing page URLs, navigation, previews, redirects, and SEO behavior would be breaking.
- Theme app extensions still have their own app block/embed placement and theme-support constraints; an app proxy does not remove those concerns.

References: [Shopify app proxies](https://shopify.dev/docs/apps/build/online-store/app-proxies) and [theme app extension configuration](https://shopify.dev/docs/apps/build/online-store/theme-app-extensions/configuration).

## Revisit criteria

Reopen this decision only with a migration plan covering URL redirects, merchant navigation, canonical/SEO behavior, preview and publish flows, proxy customization, app availability, cold-start behavior, and all page-handle consumers. No migration decision was made in the parent-product parity slice.
