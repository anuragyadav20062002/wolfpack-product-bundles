# Test Spec: Admin LCP Route Optimization
**Spec ID:** admin-lcp-route-optimization  **Created:** 2026-06-28

## Purpose
Reduce local Admin LCP on routes that exceeded 2500 ms during Shopify Admin iframe sampling while preserving route behavior.

## Test Cases

### RouteOptimization
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Cart-transform Admin list route remains removed | Route file inventory | `/app/bundles/cart-transform` route files are absent; API/function support remains | Existing integration test covers this |
| 2 | Pricing route can paint before subscription lookup settles | `/app/pricing` loader | Route returns deferred subscription data and renders a skeleton while it resolves | Targets local 2592 ms sample |
| 3 | Attribution route can paint before analytics queries settle | `/app/attribution` loader | Route returns independent deferred `pixelStatus` and `analytics` promises; pixel status can resolve/render before analytics DB work settles | Targets local 4876 ms sample |
| 4 | Dashboard route removes avoidable sequential DB wait | `/app/dashboard` loader | Bundle and shop metadata reads start concurrently before secondary work | Targets local 4476 ms sample |
| 5 | Support chat does not configure Crisp on the critical path | Admin app root support chat loader | Crisp configures after a delayed fallback, or immediately when a support action explicitly opens chat | Fallback if attribution p75 still exceeds local target after loader split |
| 6 | Admin i18n avoids loading inactive locales on first paint | Admin i18n config import | English catalog is present at bootstrap; non-English catalogs load only when requested | Fallback if attribution p75 still exceeds local target after loader split |
| 7 | Attribution Admin title bar is available before analytics dashboard modules load | `/app/attribution` default export | Route shell renders `<ui-title-bar title="Analytics">` without the dashboard skeleton or pixel-status skeleton on the initial shell render | Targets outer Shopify Admin H1 LCP candidate |

## Acceptance Criteria
- [ ] Focused cart-transform route removal test passes.
- [ ] Pricing route still renders quota, plan cards, comparison, and FAQ after deferred data resolves.
- [ ] Attribution route still renders the title bar and pixel status before analytics settles, then funnel, charts, matrix, activity, and campaigns after analytics resolves.
- [ ] Attribution route title bar renders from a lightweight shell before the heavy dashboard module is loaded.
- [ ] Crisp chat is deferred until the delayed fallback while explicit support actions still open chat immediately.
- [ ] Admin i18n does not load inactive locale catalogs on the critical path.
- [ ] Local Admin debug bridge shows improved LCP samples on affected routes after reload.
