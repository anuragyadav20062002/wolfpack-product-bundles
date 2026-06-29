---
title: Admin Performance
type: operations
last_audited: 2026-06-28
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
| `/app/dashboard` | Current local app candidate: support card content text; historical candidate: app-embed instructional screenshot | Keep only the above-the-fold support avatar preload; render the top cards immediately with the app-embed screenshot loading after hydration; keep the support card outside delayed Polaris custom-element wrappers; defer the lower resources card until the main content has settled; render row action-menu content only after a row menu is opened. |
| `/app/bundles/create` | Measured: `img[src="/ppb.png"]` rendered via `/ppb.avif` | Preloaded in route `links()` and HTTP `Link`; adjacent `/fpb.avif` also preloaded |
| `/app/integrations` | Measured: text subtitle (`p._subtitle...`) | No image preload fix; page LCP is text/bootstrap-bound |
| `/app/events` | Source audit: no first-viewport owned image | No image preload fix |
| `/app/billing` | Source audit: no first-viewport owned image | No image preload fix |
| `/app/pricing` | Source audit: no first-viewport owned image | No image preload fix |
| `/app/bundles/cart-transform` | Source audit: no first-viewport owned image | No image preload fix |
| `/app/attribution` | Source audit: analytics cards/charts, no owned image hero | No image preload fix; evaluate JS/data path if future LCP is slow text |
| `/app/settings` | Source audit: dynamic settings preview images are not route hero content | No speculative preload; measure a concrete settings subview before adding one |
| `/app/store-files` / `/app/upload-store-file` | Source audit: images are picker/file content, not initial route hero content | No route preload |
| Configure routes | Source audit: dynamic product/template images depend on loaded bundle state and active section/modal | Do not globally preload; measure concrete FPB/PPB configure URLs and preload only confirmed above-fold candidates |

Pages without first-viewport owned media should be treated as text/bootstrap-bound
unless a future debug run logs an owned image candidate. For text LCP pages, do
not add image preloads speculatively; focus on loader critical path and reducing
first-render JavaScript instead.

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
response path. App-embed refresh and web-pixel reconciliation are scheduled as
post-response background tasks; the first dashboard payload should come from
the shop, bundle summary, and subscription data needed to render above the fold.
