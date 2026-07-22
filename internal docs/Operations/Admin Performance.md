---
schema_version: 1
id: admin-performance
title: Admin Performance
type: operations
status: authoritative
summary: Embedded Admin Web Vitals instrumentation, route-level LCP findings, and critical-path constraints.
last_audited: 2026-07-22
owners:
  - engineering
domains:
  - admin
  - performance
systems:
  - app-bridge
  - remix
source_paths:
  - app/lib/admin-web-vitals-diagnostics.client.ts
  - app/routes/app/app.settings/SettingsRoute.tsx
  - app/routes/app/app.settings/DesignSettingsView.tsx
related_docs:
  - internal docs/Operations/LCP and CLS Playbook.md
tags:
  - web-vitals
  - lcp
keywords:
  - wpbWebVitalsDebug
  - settings
---

# Admin Performance

## Web Vitals Source

Shopify App Bridge is the source of embedded Admin Web Vitals used for Built for Shopify assessment. The root document must keep:

- `<meta name="shopify-api-key" ...>`
- `<script src="https://cdn.shopify.com/shopifycloud/app-bridge.js">`

The App Bridge script should be the first script in `<head>` and should not be pinned to a versioned URL.

The Admin shell registers `shopify.webVitals.onReport(...)` through `app/lib/admin-web-vitals-diagnostics.client.ts`. Shopify's callback reports metric data such as LCP value and ID; it does not include the DOM node. For LCP element attribution, the client pairs Shopify's LCP report with the browser `largest-contentful-paint` `PerformanceObserver` candidate.

Debug usage:

```js
localStorage.setItem("wpb:web-vitals-debug", "1");
location.reload();
```

For embedded Admin URLs where the parent page cannot write iframe storage, add
`wpbWebVitalsDebug=1` to the Admin app URL. Shopify forwards it into the app
iframe and the app logs `Admin Browser LCP Candidate` from the iframe's own
`largest-contentful-paint` observer.

When enabled, LCP reports are logged to the browser console as `Admin Web Vitals` with the metric value and latest candidate element selector. This is diagnostic only and does not persist data.

The debug hook also keeps a local, iframe-only p75 sample set in
`localStorage["wpb:web-vitals-debug:lcp-samples"]`. Each sample stores:

- `route` and generated `routeLoadId` (single page-load correlation)
- `id`, `value`, `timestamp`
- `country` (from Shopify Web Vitals payload)
- `candidate`, `candidateType`, `candidateResource`, `blockingTime`

This does not send data to the app server and must not replace Shopify-collected
field data for BFS.

Console helpers:

```js
window.__wpbAdminWebVitals.getLcpP75Summary()
window.__wpbAdminWebVitals.clearLcpSamples()
```

Temporary cross-origin verification bridge:

Do not keep the parent-frame `postMessage` verification bridge in committed
runtime code. It was removed after the local dashboard optimization pass. When a
future major Admin UI change requires route-level LCP work and DevTools cannot
read the cross-origin iframe directly, recreate the bridge temporarily in dev/SIT
using the local console API above as the data source, then remove it before
shipping.

Use the summary after repeated route loads to prove local p75. A route passes
the local target only when its p75 is `<= 2500` ms. For field proof, collect
enough real Shopify Web Vitals samples by route and device class; a single
Chrome session or dev tunnel run is not field p75 proof.

## Embedded Admin LCP Findings

Measured in the Shopify Admin chrome on `wolfpack-store-test-1` / SIT using
`?wpbWebVitalsDebug=1`.

| Route | Iframe LCP candidate / source-audited candidate | Fix status |
|---|---|---|
| `/app/dashboard` | Current local app candidate: support card content text; historical candidates: `/bundleGallery.avif`, `/appEmbed.avif` | Keep only the above-the-fold support avatar preload; render the top cards immediately; do not load decorative dashboard guide screenshots in the initial viewport; use CSS-only thumbnail placeholders for app-embed and resources-card previews. Keep the support card outside delayed Polaris custom-element wrappers; defer the lower resources card until the main content has settled; render row action-menu content only after a row menu is opened. App-embed theme detection is deferred from the initial loader payload and hydrated via a deferred promise; the app-embed card can still run an on-demand status check before opening the theme editor. |
| `/app/bundles/create` | Measured: bundle type thumbnail rendered via `/ppb.avif` | Preloaded in route `links()` and HTTP `Link`; adjacent `/fpb.avif` also preloaded. The thumbnail is now a CSS background with stable dimensions, and local candidate paint was under target. |
| `/app/integrations` | Measured: text subtitle (`p._subtitle...`) | No image preload fix; page LCP is text/bootstrap-bound |
| `/app/events` | Source audit: no first-viewport owned image | No image preload fix |
| `/app/billing` | Source audit: no first-viewport owned image | No image preload fix |
| `/app/pricing` | Source audit: no first-viewport owned image | No image preload fix |
| `/app/bundles/cart-transform` | Source audit: no first-viewport owned image | No image preload fix |
| `/app/attribution` | Current local app candidate: critical funnel heading; historical candidates: inactive tracking body copy, deferred funnel hero title | Render the funnel heading in the route shell before analytics resolves; keep inactive/no-data copy out of the critical first-paint path; render the deferred funnel metrics without duplicating the late heading. |
| `/app/settings` | Source audit: dynamic settings preview images are not route hero content | The Design subpage and its redesigned CSS are lazy-loaded only after the merchant enters Design. Its representative preview uses local markup and CSS with no remote media, storefront iframe, or widget runtime. Do not add speculative preloads; use repeated `?wpbWebVitalsDebug=1` samples for concrete settings-subview evidence. |
| `/app/store-files` / `/app/upload-store-file` | Source audit: images are picker/file content, not initial route hero content | No route preload |
| Configure routes | Source audit: dynamic product/template images depend on loaded bundle state and active section/modal | Do not globally preload; measure concrete FPB/PPB configure URLs and preload only confirmed above-fold candidates |

Pages without first-viewport owned media should be treated as text/bootstrap-bound
unless a future debug run logs an owned image candidate. For text LCP pages, do
not add image preloads speculatively; focus on loader critical path and reducing
first-render JavaScript instead.

## Settings Design Control Panel

The Settings landing route keeps the redesigned Design view behind a React lazy
boundary. The Design chunk owns its two-pane inspector/preview layout and the
eight-template representative preview. The preview uses local fixture markup,
validated CSS variables, and Polaris controls; it does not fetch storefront
assets or duplicate the storefront runtime.

For local acceptance, collect at least ten cache-bypassed loads of
`/app/settings?wpbWebVitalsDebug=1`, enter Design on each pass, and inspect the
app-owned sample set. The planned Design target is LCP p75 at or below `2000ms`,
with a hard failure above `2500ms`, and CLS below `0.1`. Shopify/App Bridge field
metrics after a manual SIT deployment remain the final p75 source of truth.

## Removed Custom Telemetry

The previous app-owned Web Vitals pipeline was retired on 2026-06-12:

- `app/lib/web-vitals.client.ts`
- `app/routes/api/api.web-vitals.tsx`
- Prisma model/table `AdminWebVital`
- npm dependency `web-vitals`

Do not recreate custom `/api/web-vitals` telemetry for BFS eligibility. Use Shopify-collected metrics for BFS and Chrome Performance / Network `Server-Timing` for local diagnosis.

`/api/web-vitals` remains only as a no-op tombstone route so stale browser sessions can POST old beacons without hitting authenticated code or emitting warning logs. It must not persist data, authenticate Admin sessions, or import app-owned Web Vitals collection code.

## Critical Path Rule

The `/app` layout loader must keep Shopify authentication on the critical path, but non-critical maintenance should not block the initial shell. Offline-session migration runs in the background and logs failures instead of delaying first render.

The `/app/dashboard` loader must also keep non-critical Admin checks off the
response path. App-embed refresh/status checks and web-pixel reconciliation are
deferred or scheduled as post-response background tasks; the first dashboard
payload should come from the shop, bundle summary, and subscription data needed
to render above the fold.

The shared `/app` shell must not import or await providers that do not have
runtime consumers on every Admin page. On 2026-07-10, the global Mantle provider
and server-side Mantle identify call were removed from the app shell after an
audit found no `@heymantle/react` hook usage in Admin routes. Billing still uses
the Shopify billing service directly. Keep any future third-party billing or
analytics provider route-scoped until a shared runtime consumer exists.

## 2026-07-06 Attribution LCP Follow-up

A fresh Chrome trace on `/app/attribution?wpbWebVitalsDebug=1&days=7` showed
the lab LCP candidate as the outer Shopify Admin page-title H1 (`Analytics`),
not an iframe chart, banner, or image. The app-owned lever for that candidate is
how quickly the route emits `<ui-title-bar title="Analytics">`.

The attribution route now uses a lightweight shell that renders the title bar
before loading the analytics dashboard module. The dashboard module is delayed
briefly after shell mount so chart and analytics chunks do not compete with the
Admin shell title paint. Support chat auto-load also uses the delayed fallback
instead of `requestIdleCallback`, because Chrome can run idle callbacks before
LCP on quiet traces; explicit support-click loading still opens chat
immediately.

If attribution remains above target in field data, keep optimizing the route
shell and parent Admin boot path first. Do not add attribution image preloads:
the confirmed candidate is text in the Shopify Admin shell.

## 2026-07-10 Candidate Fix Proof

Dev/SIT measurements used a temporary parent-frame `postMessage` bridge to read
the iframe's browser `largest-contentful-paint` candidate from
`PerformanceObserver`. The bridge was removed before committing runtime code.

Spot checks after the candidate fixes:

| Route | Previous candidate/value | Post-fix candidate/value |
|---|---:|---:|
| `/app/attribution` | inactive tracking body copy and deferred funnel title, ~8-9s | `h2#wpb-critical-funnel-hero-title`, 1460ms |
| `/app/dashboard` | `/bundleGallery.avif` ~6164ms, then `/appEmbed.avif` ~4572ms | support card text, 1700ms |
| `/app/bundles/create` | `/ppb.avif` p75 previously above target | `/ppb.avif`, 1156ms |

These are dev tunnel spot checks, not Shopify field p75. Final BFS proof still
comes from Shopify-collected field metrics after deployment.
