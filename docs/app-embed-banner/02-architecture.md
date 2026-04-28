# Architecture: App Embed Banner + Readiness Score Integration

**Feature name:** `app-embed-banner`
**Stage:** 2 — Architecture
**Created:** 2026-04-26

## Fast-Track Note
BR context from: `docs/app-embed-banner/01-requirements.md`
Competitor context from: `docs/competitor-analysis/14-eb-addon-upsell-analysis.md` §1 and §2

---

## Impact Analysis

- **Communities touched:**
  - Dashboard community (SetupScoreCard, dashboard route loader)
  - FPB configure route community (god node — 125 edges on BundleWidgetFullPage)
  - PPB configure route community
  - Theme services community (theme-colors.server.ts pattern reused)

- **God nodes affected:**
  - `BundleWidgetFullPage` (125 edges) — FPB configure route touches this node; banner added here
  - `AppStateService` (61 edges) — dashboard loader change touches this community

- **Blast radius:**
  - Dashboard loader gains one new async call (embed check) — non-blocking if cached
  - FPB + PPB configure loaders each gain one embed check call (cached via metafield)
  - SetupScoreCard gets a new step: POINTS_PER_STEP drops from 20 → 16.67 (rounded: score out of 100 with 6 steps = ~16 pts each; OR keep 20 pts and cap at 100)
  - No widget JS changes — purely admin UI + server

- **Surprising connections:** `theme-colors.server.ts` already implements the exact GraphQL pattern for reading `config/settings_data.json` from the active theme. The new embed check service is a direct clone of that pattern with different parsing logic.

---

## Decision

**Clone the `theme-colors.server.ts` GraphQL pattern** into a new `app/services/theme/app-embed-check.server.ts`. The service reads `config/settings_data.json` from the active theme, scans `current.blocks` for a key matching `shopify://apps/wolfpack-product-bundles` prefix, and returns a boolean. Cache the result in a shop-level metafield (TTL 24h). The banner component is a standalone Polaris `Banner` with session-storage dismiss. This keeps embed detection isolated, reuses proven infrastructure, and adds zero new Prisma tables.

Rejected: Using Shopify's REST theme API — GraphQL is already authenticated and used elsewhere; REST would require a different auth pattern and adds a REST dependency.

---

## Data Model

```typescript
// New field on existing SetupScoreData interface (SetupScoreCard.tsx)
export interface SetupScoreData {
  bundlesExist: boolean;
  hasProductsAdded: boolean;
  hasDiscount: boolean;
  hasActiveBundleOnStore: boolean;
  hasDcpConfigured: boolean;
  appEmbedEnabled: boolean;   // NEW
}

// Return type of new service
// app/services/theme/app-embed-check.server.ts
export interface AppEmbedCheckResult {
  enabled: boolean;
  themeId: string | null;   // needed for deep-link URL
}
```

No Prisma model changes. Caching uses the existing shop metafield pattern (same metafield namespace used by theme-colors).

---

## Score Recalculation

With 6 steps, `POINTS_PER_STEP` stays at `20` and `max` cap stays at `100`. The score ring can show 120/100 internally capped to 100 — OR we adjust `POINTS_PER_STEP = Math.floor(100 / STEPS.length)` = 16. **Decision: keep `POINTS_PER_STEP = 20`, clamp final score to 100.** This preserves existing step values and only the "all done" label changes.

---

## Files

| File | Action | What changes |
|---|---|---|
| `extensions/bundle-builder/shopify.extension.toml` | modify | Add 2 `[[extensions.blocks]]` entries with `target = "body"` for the two embed liquid files |
| `app/services/theme/app-embed-check.server.ts` | create | `checkAppEmbedEnabled(admin, shop)` — reads settings_data.json, scans for Wolfpack embed block, returns `AppEmbedCheckResult`; caches result in shop metafield (24h TTL) |
| `app/components/AppEmbedBanner.tsx` | create | Polaris `Banner` with `tone="warning"`, "Enable here" action (opens theme editor deep-link in new tab), dismiss ×  (writes `wb_embed_dismissed=1` to `sessionStorage`); renders nothing when `appEmbedEnabled === true` or when session-dismissed |
| `app/components/SetupScoreCard.tsx` | modify | Add `appEmbedEnabled: boolean` to `SetupScoreData`; add 6th STEPS entry; clamp score to 100; add `actionUrl` field to step config for "Enable now →" button on incomplete embed step |
| `app/routes/app/app.dashboard/route.tsx` | modify | Add embed check call in loader (parallel with existing `Promise.all`); include `appEmbedEnabled` in `setupScore` object passed to `SetupScoreCard` |
| `app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/route.tsx` | modify | Loader: call `checkAppEmbedEnabled`; pass `appEmbedEnabled` + `themeEditorUrl` to component. JSX: render `<AppEmbedBanner>` above the configure card |
| `app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/route.tsx` | modify | Same as FPB configure route |
| `tests/unit/services/app-embed-check.test.ts` | create | Unit tests: embed present+enabled, embed present+disabled, embed absent, malformed JSON, missing theme |

---

## Key Implementation Details

### Embed block key pattern in settings_data.json

```json
{
  "current": {
    "blocks": {
      "shopify://apps/wolfpack-product-bundles/blocks/bundle-full-page-embed/23b807f7-472d-4f93-e241-5a1e079d6b51548daaf2": {
        "type": "shopify://apps/wolfpack-product-bundles/blocks/bundle-full-page-embed",
        "disabled": false
      }
    }
  }
}
```

The service must scan all keys in `current.blocks` for any key that starts with `shopify://apps/wolfpack-product-bundles/blocks/` and check `disabled !== true`.

### Theme editor deep-link URL

```
https://{shop}/admin/themes/{themeId}/editor?context=apps&appEmbed={CLIENT_ID}%2F{EMBED_BLOCK_HANDLE}
```

- `CLIENT_ID` = `63077bb0483a6ce08a2d6139b14d170b`
- `EMBED_BLOCK_HANDLE` = handle from TOML (to be confirmed post deploy:sit)
- `themeId` = numeric ID extracted from GraphQL GID (`gid://shopify/OnlineStoreTheme/12345` → `12345`)

### Caching strategy

The embed check result is cached in a shop-level App metafield (existing `app` namespace). The loader reads the metafield first; calls the theme API only when the metafield is null or `syncedAt` is older than 24h. On a successful check, the metafield is written with `{ enabled: boolean, syncedAt: ISO8601 }`.

---

## Test Plan

| Test file | Scope | Key behaviors |
|---|---|---|
| `tests/unit/services/app-embed-check.test.ts` | unit | embed key present + not disabled → true; embed key present + disabled → false; no blocks key → false; malformed JSON → false (safe default); no active theme → false |

**Mock:** Shopify Admin GraphQL (`admin.graphql`), Prisma (metafield read/write)
**Do not mock:** JSON parsing logic, key-scan loop, URL construction
**No tests needed:** Polaris Banner rendering, sessionStorage dismiss, TOML config changes
