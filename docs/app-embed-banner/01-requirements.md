# Requirements: App Embed Banner + Readiness Score Integration

**Feature name:** `app-embed-banner`
**Status:** In Progress
**Created:** 2026-04-26

## Fast-Track Note
Prior research from `docs/competitor-analysis/14-eb-addon-upsell-analysis.md` §1 and §2 covers the full competitive context.

---

## Context
Wolfpack merchants who install the app don't know they need to enable the theme extension before bundles can render on the storefront. EB shows a persistent amber banner on every bundle configure page until the merchant enables their app embed block. Wolfpack has the same embed liquid files (`bundle-full-page-embed.liquid`, `bundle-product-page-embed.liquid`) but they are not registered in the extension TOML and no detection/banner exists. This creates silent failures and a poor onboarding experience.

---

## Functional Requirements

- **FR-01** — Register the embed blocks in the extension TOML so they appear in the merchant's Theme Editor > App Embeds panel.
- **FR-02** — Detect whether the Wolfpack app embed block is enabled in the merchant's active theme (via Shopify Admin GraphQL: query active theme → read `config/settings_data.json` → parse for the extension block key).
- **FR-03** — Show a persistent amber/warning banner at the top of every bundle configure page (FPB and PPB) when the embed is NOT enabled.
- **FR-04** — Banner contains: warning icon, copy "Enable the Wolfpack theme extension to display your bundles on the storefront.", and an "Enable here" button.
- **FR-05** — "Enable here" opens Shopify Theme Editor App Embeds panel in a new tab, deep-linked to the Wolfpack embed block.
- **FR-06** — Banner is dismissible per session (merchant can dismiss and place widget manually).
- **FR-07** — Banner disappears automatically once the embed is confirmed enabled (re-check on page load).
- **FR-08** — Add "Enable theme extension" as a new step in the existing `SetupScoreCard` on the dashboard, contributing to the readiness score.
- **FR-09** — The new SetupScoreCard step links/prompts the merchant to the Theme Editor when not yet completed.
- **FR-10** — Cache the embed-enabled status (in a shop-level metafield or server-side session) to avoid an Admin API call on every configure page load.

## Out of Scope
- Changing the existing "Place Widget Now" per-page block placement flow.
- Adding email notifications or Slack alerts for embed not enabled.
- Tracking which specific embed block (FPB vs PPB) is enabled — treat any Wolfpack embed block as "enabled".
- Multi-store or organisation-level tracking.

---

## Acceptance Criteria

### FR-01
- [ ] `shopify.extension.toml` has two new `[[extensions.blocks]]` entries with `target = "body"` pointing to the embed liquid files.
- [ ] After `npm run deploy:sit`, the merchant sees Wolfpack embed blocks in Theme Editor > App Embeds.

### FR-02
- [ ] `checkAppEmbedEnabled(admin, shop)` service function returns `true` when the embed block is present and not disabled in `settings_data.json`.
- [ ] Returns `false` when the block is absent or `disabled: true`.
- [ ] Unit tests cover: embed present+enabled, embed present+disabled, embed absent, malformed JSON.

### FR-03 / FR-04
- [ ] `AppEmbedBanner` component renders when `appEmbedEnabled === false`.
- [ ] Does not render when `appEmbedEnabled === true`.
- [ ] Banner uses Polaris `Banner` with `tone="warning"`, warning icon, correct copy, "Enable here" action button.

### FR-05
- [ ] "Enable here" constructs URL: `https://{shop}/admin/themes/{activeThemeId}/editor?context=apps&appEmbed={CLIENT_ID}%2F{EMBED_BLOCK_HANDLE}` and opens in `_blank`.

### FR-06
- [ ] Dismiss button (×) visible on banner.
- [ ] After dismiss, banner hidden for the session (sessionStorage key).
- [ ] Dismissed banner does not reappear on route re-renders within the same session.

### FR-07
- [ ] On next page load after merchant enables embed, banner is gone (embed check in loader returns true).

### FR-08 / FR-09
- [ ] `SetupScoreData` has new boolean `appEmbedEnabled`.
- [ ] STEPS array in `SetupScoreCard` includes "Enable theme extension" step.
- [ ] Score ring percentage increments correctly (6 steps × ~16.67 pts, or adjusted weighting).
- [ ] Incomplete step shows action button linking to Theme Editor.

### FR-10
- [ ] Embed check result stored in `shop.metafields.app.appEmbedEnabled` (boolean, already in toml).
- [ ] Loader reads metafield first; only calls theme API if metafield is null/stale (older than 24h).

---

## UI/UX Spec

### Banner (Configure Pages)
```
┌─────────────────────────────────────────────────────────────────┐
│ ⚠  Enable the Wolfpack theme extension to display bundles on   │
│    your storefront.                                   [Enable here] [×] │
└─────────────────────────────────────────────────────────────────┘
```
- Polaris `Banner` component, `tone="warning"`
- Full-width, appears above the bundle configure card
- "Enable here" = primary action, opens theme editor in new tab
- Dismiss (×) = secondary, stores `wb_embed_dismissed=1` in `sessionStorage`

### SetupScoreCard Step
- Label: "Enable your theme app extension"
- Description: "Allow Wolfpack to display bundles automatically on your storefront."
- Incomplete state: shows "Enable now →" button → opens theme editor
- Complete state: green checkmark

---

## Data Changes

### Extension TOML (no Prisma change)
Add to `extensions/bundle-builder/shopify.extension.toml`:
```toml
[[extensions.blocks]]
target = "body"
liquid_path = "blocks/bundle-full-page-embed.liquid"

[[extensions.blocks]]
target = "body"
liquid_path = "blocks/bundle-product-page-embed.liquid"
```

### New service file
`app/services/theme/app-embed-check.server.ts` — `checkAppEmbedEnabled(admin, shop)`

### SetupScoreData interface
Add `appEmbedEnabled: boolean` to existing interface in `app/components/SetupScoreCard.tsx`

### Dashboard loader
Add embed check call; pass result into `SetupScoreCard`

### Configure route loaders
Add embed check call (cached); pass `appEmbedEnabled` to route

---

## Risks

| Risk | Mitigation |
|---|---|
| `settings_data.json` parse may fail for unusual theme structures | Wrap in try/catch, return `false` on parse error (safe default: show banner) |
| Shopify theme API rate limit (40 req/min for REST) | Cache result in metafield; skip API call if cache < 24h old |
| Embed block handle in deep-link URL may differ from liquid filename | Verify after deploy:sit; hard-code the correct handle constant |
| TOML change requires `npm run deploy:sit` before banner logic has any effect | Document in issue file; implement detection first, then deploy |
