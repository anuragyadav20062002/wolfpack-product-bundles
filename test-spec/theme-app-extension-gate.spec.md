# Test Spec: Theme App Extension Gate
**Spec ID:** theme-app-extension-gate  **Created:** 2026-07-06

## Purpose
Match EB's configure-page app embed gate for FPB and PPB: show a persistent warning while the Theme app extension is disabled, shake that warning when Preview is clicked, and read Shopify app embed state live when merchants enable or disable the embed in Theme Editor.

## Test Cases
### ThemeEmbedStatus
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Stale DB cache is ignored | Fresh DB cache true, Shopify `settings_data.json` reports disabled | `appEmbedEnabled: false`; no app-embed cache read or write | Ensures banner returns after merchant disables embed |
| 2 | Theme editor URL uses current Shopify activation parameter | Theme GID, activation identifier, block handle | URL contains Shopify's `activateAppId` parameter with the app activation path and block handle | Aligns with Shopify docs |
| 3 | Dashboard reads live embed state | Stale DB shop row says enabled | Dashboard loader returns the live disabled status from Shopify | Keeps dashboard, configure banner, and Bundle Visibility in sync |
| 4 | Disabled Shopify app embed block | `current.blocks` contains numeric block ID, `type=shopify://apps/{current_app}/blocks/bundle-app-embed/{uuid}`, `disabled=true` | `appEmbedEnabled: false` | Shopify stores disabled embeds this way after merchant turns the embed off |
| 5 | Malformed Shopify settings file | Active theme exists but `settings_data.json` cannot be parsed | `appEmbedEnabled: true` | Fail open because Shopify can truncate large settings files and we cannot prove the embed is disabled |
| 6 | Other Wolfpack app handle in theme settings | `current.blocks` contains a different Wolfpack app handle | `appEmbedEnabled: false` | One installed app instance should not inherit another app config |
| 7 | Merchant opens Theme Editor from banner or Bundle Visibility | Configure page has `appEmbedEnabled=false`; merchant clicks `Enable Here` | Theme Editor opens in a new tab and the configure banner plus Bundle Visibility status hide/update optimistically | Matches EB's optimistic setup flow |
| 8 | Merchant forgets to enable embed before preview | Banner/status was hidden optimistically after `Enable Here`; Shopify still reports disabled | Preview click reads live Shopify app embed status, blocks preview, and shows the warning banner/status again | Prevents false-ready state after optimistic hide |
| 9 | Merchant enables embed before preview | Banner was hidden optimistically after `Enable Here`; Shopify reports enabled | Preview click reads live Shopify app embed status and proceeds without showing the warning banner | Confirms optimistic state with Shopify before storefront preview |
| 10 | Configure state already disabled | Page load live status reports disabled; merchant clicks Preview without clicking `Enable here` | Preview blocks and triggers feedback without making another app embed status request | Avoids unnecessary client work and protects Admin LCP |
| 11 | Shopify returns theme settings as base64 | `settings_data.json` body is `OnlineStoreThemeFileBodyBase64` and contains an enabled `bundle-app-embed` block | `appEmbedEnabled: true` | Prevents false disabled state when Shopify returns a non-text body variant |
| 12 | Optimistic state is revalidated from Preview button | Configure state says enabled; live Shopify status request is pending | Preview button enters loading before the request resolves | Makes the validation visible in the button flow |
| 13 | Shopify stores app embed under theme extension handle | `current.blocks` contains `type=shopify://apps/bundle-builder/blocks/bundle-app-embed/{uuid}` | `appEmbedEnabled: true` | Matches Shopify's documented `settings_data.json` block type shape for the installed theme extension |
| 14 | Preview revalidation uses status resource route | Client calls Preview while optimistic state is enabled | POST goes to `/app/app-embed-status` and expects JSON | Avoids configure document action HTML responses being interpreted as disabled |

### PreviewGate
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Disabled embed with feedback mode | `appEmbedEnabled=false`, theme editor URL, `blockBehavior=feedback` | `block_with_feedback` | EB-style preview click feedback |
| 2 | Enabled embed | `appEmbedEnabled=true` | Preview proceeds | Existing behavior preserved |

### Banner
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Embed enabled | `appEmbedEnabled=true` | No banner | Prevents stale warning |
| 2 | Embed disabled | `appEmbedEnabled=false` | Persistent warning and Enable action, no dismiss control | Matches EB persistent setup alert |
| 3 | Learn More guide | Merchant clicks `Learn More` on the disabled embed banner | Opens a modal with `/appEmbedGuide.avif`, `Enable`, and `Close` actions | Enables setup help without leaving the app |
| 4 | Guide Enable action | Merchant clicks `Enable` in the guide modal | Theme Editor opens in a new tab and the configure banner hides optimistically | Reuses the EB-style setup flow |

## Acceptance Criteria
- [ ] All listed test cases pass
- [ ] FPB and PPB configure pages use the same app embed status source
- [ ] Preview does not open when the embed is disabled; it triggers banner feedback
- [ ] Banner reappears after a merchant disables the app embed and the route refreshes
- [ ] Obsolete no-op code from the old modal/dismiss gate is removed where no longer used
