# Architecture: Embedded Admin UI Internationalisation

## Fast-Track Note

Business context from `docs/i18n-research.md`, updated by `docs/admin-ui-i18n/01-requirements.md` for confirmed Admin-only scope and shop-wide persistence.

## Impact Analysis

- **Communities touched:** Community 0 (app shell, DB access, shared Admin infrastructure), Community 6 (dashboard route), Admin route/component surfaces.
- **God nodes affected:** `AppStateService` is adjacent but will not be modified. Storefront widget god nodes are not touched.
- **Blast radius:** Embedded Admin shell locale resolution, dashboard language-save flow, Prisma `Shop` model, locale catalogs, and app-owned copy in Admin routes/components. Storefront widgets, app-proxy APIs, checkout UI, and DCP storefront settings are excluded.
- **Graph query:** `graphify query "What depends on the app route root i18n config dashboard locale Session locale and Admin UI components?"` identifies `app/routes/app/app.tsx`, `app/i18n/config.ts`, dashboard handlers, auth/session infrastructure, and shared Admin components as the primary dependency chain.

## Decision

Persist locale on `Shop.adminLocale`, not `Session.locale`. `Session.locale` reflects Shopify-associated user/session metadata and cannot represent one shop-wide preference shared by all staff accounts.

The dashboard selector uses a draft state and an explicit save action. The server updates `Shop.adminLocale`; only a successful response updates `localStorage`, the URL locale parameter, and the active `i18next` language. The app-shell loader reads the DB preference as the authoritative locale for every Admin screen.

Use catalog-based translation for app-owned copy and expose only locales with matching `@shopify/polaris` resources. Hindi is excluded because the installed Polaris package does not provide `hi.json`.

## Data Model

```prisma
model Shop {
  adminLocale String?
}
```

Migration:

```sql
ALTER TABLE "Shop" ADD COLUMN "adminLocale" TEXT;
```

## Locale Resolution

```text
app shell loader
  -> authenticate Admin session
  -> read Shop.adminLocale by shopDomain
  -> validate supported locale
  -> default to en
  -> return locale + Polaris resource

dashboard dropdown change
  -> update draft locale only

dashboard Save
  -> POST intent=saveAdminLocale
  -> validate locale
  -> update Shop.adminLocale
  -> return confirmed locale
  -> client updates localStorage, URL locale, and i18next
```

## Catalog Rules

- `en.json` is the source-of-truth key set.
- Supported catalogs: `en`, `fr`, `de`, `es`, `ja`, `pt-BR`.
- All supported catalogs must expose the same key set.
- App-owned UI strings use `t("...")`.
- Merchant-authored content, bundle names, product names, dynamic API errors, and storefront copy are not catalog entries.
- Every selectable locale has a Shopify Polaris resource.

## Files

### Persistence and Locale Infrastructure

| File | Action | What changes |
|---|---|---|
| `prisma/schema.prisma` | modify | Add `Shop.adminLocale` |
| `prisma/migrations/<timestamp>_add_shop_admin_locale/migration.sql` | create | Add nullable DB column |
| `app/i18n/config.ts` | modify | Add shared locale normalization and keep supported locale list aligned with Polaris resources |
| `app/i18n/polaris-locales.server.ts` | inspect | Keep Polaris locale map aligned with selectable locales |
| `app/routes/app/app.tsx` | modify | Resolve authoritative shop-wide locale from DB and stop writing cache from arbitrary URL changes |
| `app/routes/app/app.dashboard/route.tsx` | modify | Add `saveAdminLocale` action, draft selector state, Save CTA, success-only cache update |

### Locale Catalogs

| File | Action | What changes |
|---|---|---|
| `app/i18n/locales/en.json` | modify | Add Admin shell, dashboard save-state, route, and shared-component keys |
| `app/i18n/locales/fr.json` | modify | Add matching French translations |
| `app/i18n/locales/de.json` | modify | Add matching German translations |
| `app/i18n/locales/es.json` | modify | Add matching Spanish translations |
| `app/i18n/locales/ja.json` | modify | Add matching Japanese translations |
| `app/i18n/locales/pt-BR.json` | modify | Add matching Brazilian Portuguese translations |

### Admin UI Extraction

Extract app-owned merchant-visible strings from `app/routes/app/**/*.tsx` and `app/components/**/*.tsx` route-by-route. Keep the implementation reviewable by grouping catalog namespaces by screen:

| Namespace | Primary surfaces |
|---|---|
| `nav.*` | `app/routes/app/app.tsx` |
| `dashboard.*` | Dashboard and dashboard-only banners |
| `bundles.*` | Create, wizard, cart-transform, FPB configure, PPB configure, shared configure components |
| `designControlPanel.*` | DCP route and DCP settings/components |
| `analytics.*` | Attribution route |
| `billing.*` | Pricing, billing, and billing shared components |
| `events.*` | Updates and FAQ route |
| `common.*` | Reused buttons, errors, modal actions, status labels |

### Tests and Records

| File | Action | What changes |
|---|---|---|
| `test-spec/admin-ui-i18n.spec.md` | create | TDD test contract |
| `tests/unit/i18n/admin-ui-i18n.test.ts` | create | Locale support, catalog parity, Polaris-compatible locale coverage, shell behavior |
| `tests/unit/routes/dashboard-admin-locale.test.ts` | create | Dashboard action persistence and client save/cache contract |
| `docs/issues-prod/admin-ui-i18n-1.md` | create | Progress record |
| `docs/app-nav-map/APP_NAVIGATION_MAP.md` | inspect/update if flow map documents dashboard language flow | Record explicit Save flow if applicable |
| `graphify-out/graph.json` | regenerate | Required graph refresh |
| `graphify-out/GRAPH_REPORT.md` | regenerate | Required graph refresh |

## Test Plan

| Test file | Scope | Key behaviors |
|---|---|---|
| `tests/unit/i18n/admin-ui-i18n.test.ts` | unit/contract | Six Polaris-compatible locales, identical locale key sets, English fallback, no unsupported locale activation |
| `tests/unit/routes/dashboard-admin-locale.test.ts` | route/contract | `saveAdminLocale` validates input, persists `Shop.adminLocale`, cache update appears only in success handling, unsaved dropdown does not write cache |
| Existing dashboard tests | regression | Existing preview/clone/delete flows unchanged |

**Mock:** Prisma shop lookup/update, Admin session, dashboard fetcher response.

**Do not mock:** Locale normalization and catalog parity.

**No tests needed:** CSS-only layout adjustments for the Save CTA.

## Delivery Sequence

1. Add persistence, save contract, Polaris-compatible locale validation, and tests.
2. Extract Admin shell and dashboard shared copy.
3. Extract remaining Admin routes and shared components by namespace.
4. Run catalog parity and hardcoded-copy audit tests after each namespace.
5. Regenerate Prisma client and graphify outputs.
