---
title: Deployment
type: operations
audited: 2026-07-10
sources: docs/DEPLOYMENT.md (largely current as of Jan 14 2026)
---

# Deployment

## Environments

| Environment | App | Command |
|---|---|---|
| Production | `wolfpack-product-bundles-4` | `npm run deploy:prod` |
| SIT | `wolfpack-product-bundles-sit` | `npm run deploy:sit` |

**Never run `shopify app deploy` directly.** The npm scripts run `scripts/generate-extension-templates.js` first to stamp the correct app handle into extension template JSON files.

## App Server (Render)

- Node.js 22
- PostgreSQL database
- Server cold-starts: ~3–10s on starter plans (widget has retry logic for this)

## Shopify Extension Deploy

1. Increment `WIDGET_VERSION` in `scripts/build-widget-bundles.js`
2. Run `npm run build:widgets`
3. Check CSS file sizes: `wc -c extensions/bundle-builder/assets/*.css` (must be < 100,000 B)
4. Run `npm run deploy:prod` or `npm run deploy:sit`
5. Wait 2–10 min for Shopify CDN cache to propagate
6. Verify: `console.log(window.__BUNDLE_WIDGET_VERSION__)` in storefront DevTools

For CSS changes, also verify the exact served CSS asset. `window.__BUNDLE_WIDGET_VERSION__` only proves the JS bundle is current. Product Page template styles are separate assets such as `bundle-widget-product-page-cascade.css`; Shopify CDN can serve an updated JS bundle while still serving an older CSS asset. Fetch the active CSS URL from the storefront and confirm the expected token or rule exists before accepting visual proof.

## Cart Transform WASM

```bash
cd extensions/bundle-cart-transform-rs
rustup run stable cargo build --target=wasm32-unknown-unknown --release
```

The SIT and production deploy scripts run this build before `shopify app deploy`:

```bash
npm run deploy:sit
npm run deploy:prod
```

If the rustup proxy cannot find the `wasm32-unknown-unknown` target in a local shell, the explicit stable compiler path has been verified:

```bash
RUSTC="$(rustup which rustc)" cargo build --target=wasm32-unknown-unknown --release
```

## Prisma Migrations

```bash
npx prisma migrate dev   # dev
npx prisma migrate deploy # production
```

## Environment Variables

- App server env: Render dashboard
- Prisma dev env: `prisma/.env` (not project root)
- Extension env: `shopify.app.toml` + Shopify Partner Dashboard

## Note on vercel.json

`DEPLOYMENT.md` references `vercel.json` for potential Vercel use. This format is deprecated — prefer `vercel.ts` (`@vercel/config`) for new Vercel configuration. The app currently runs on Render, not Vercel.
