# Test Spec: Admin Web Vitals LCP Diagnostics
**Spec ID:** admin-web-vitals-lcp-diagnostics  **Created:** 2026-06-21

## Purpose
Use Shopify App Bridge Web Vitals reporting to observe Admin LCP values, pair LCP reports with browser LCP element attribution, and make dashboard first-viewport image preloads match the actual responsive image candidates.

## Test Cases

### AdminWebVitalsDiagnostics
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Register Shopify Web Vitals callback | Mock `shopify.webVitals.onReport` | Callback registered and cleanup unregisters with `null` | Uses App Bridge API, not the retired `/api/web-vitals` endpoint |
| 2 | Report LCP element in debug mode | Mock LCP PerformanceObserver entry + LCP report | Logger receives metric plus element selector | Shopify report supplies value; PerformanceObserver supplies element |
| 3 | Report browser LCP candidate without Shopify callback | Mock debug query param + LCP PerformanceObserver entry | Logger receives browser LCP candidate selector and timing | Lets embedded iframe identify its own LCP element even when the parent Shopify chrome owns the outer trace |
| 4 | Enable diagnostics from embedded URL | URL contains `wpbWebVitalsDebug=1` | Debug logging is enabled without iframe localStorage access | Useful when parent page cannot access cross-origin iframe storage |
| 5 | Compute route p75 | Recorded LCP values `[1000, 1800, 2600, 3000]` | p75 is `2600` | Uses nearest-rank percentile for proof reporting |
| 6 | Store debug-only route samples | Mock Shopify LCP report in debug mode | Local storage receives route-keyed sample and logger receives p75 summary | Provides app-wide p75 proof without server telemetry |

### DashboardLcpPreload
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Support avatar preload | Dashboard `links()` | Preload includes `/Parth.avif`, `imageSrcSet`, `imageSizes`, and high priority | Kept because it is above the fold |
| 2 | App embed LCP image preload | Dashboard `links()` | Preload includes `/appEmbed.avif`, `imageSrcSet`, `imageSizes`, and high priority | Live iframe LCP candidate was `img[src="/appEmbed.png"]` rendering the AVIF source |
| 3 | HTTP preload header | Dashboard `headers()` | `Link` header preloads `/appEmbed.avif` and `/Parth.avif` as images | Lets the browser start fetches before parsing the iframe HTML body |

### CreateBundleLcpPreload
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Product-page thumbnail LCP preload | Create bundle `links()` and `headers()` | `/ppb.avif` is preloaded as a high-priority image | Live iframe LCP candidate was `img[src="/ppb.png"]` |
| 2 | Full-page thumbnail preload | Create bundle `links()` and `headers()` | `/fpb.avif` is preloaded as a high-priority image | Adjacent first-viewport card image; prevents it becoming next LCP candidate |

## Acceptance Criteria
- [ ] Focused unit tests pass.
- [ ] Admin shell installs diagnostics without reviving app-owned Web Vitals persistence.
- [ ] Dashboard support avatar remains eager/high priority and is preloaded during HTML parse.
- [ ] Dashboard app embed image remains eager/high priority and is preloaded during HTML parse.
