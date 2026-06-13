# Test Spec: Admin Root Link Warnings
**Spec ID:** admin-root-link-warnings  **Created:** 2026-06-12

## Purpose
Prevent React console warnings in the embedded Admin app. The root document should not pass string event handlers to React, and dashboard preload/image priority hints should use DOM-safe attributes.

## Test Cases
### RootHeadLinks
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Root app renders font stylesheet swap | Root `App` rendered with mocked Remix data | No React console error about `onLoad` string listener | Matches DevTools warning seen in Agent store |
| 2 | Dashboard hero preload descriptor | Dashboard `links()` output | Image preload uses lowercase `fetchpriority` and no camel-case `fetchPriority` | Prevents React warning from Remix `<Links />` |
| 3 | OptimisedImage renders priority hint | `OptimisedImage` rendered with `fetchPriority="high"` | DOM output uses lowercase `fetchpriority` and no camel-case `fetchPriority` | Prevents React warning from dashboard `<img>` |

## Acceptance Criteria
- [ ] Agent store console no longer logs the `onLoad string` warning from `app/root.tsx`.
- [ ] Agent store console no longer logs the `fetchPriority` DOM prop warning.
