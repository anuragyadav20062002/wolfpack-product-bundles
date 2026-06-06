# Requirements: Embedded Admin UI Internationalisation

## Context

Wolfpack's embedded Shopify Admin app has a partial `react-i18next` scaffold: the dashboard and shared tooltips use translation keys for six locales, but most Admin routes and components still render hardcoded English strings. The dashboard language dropdown currently writes `localStorage` immediately and does not persist a shop-wide preference. Merchants need one language selection shared by every staff account, persisted in the database, cached in the browser only after save, and applied across the embedded Admin app.

## Audit / Prior Research Reference

- `docs/i18n-research.md`
- Existing app-level provider: `app/routes/app/app.tsx`
- Existing locale config: `app/i18n/config.ts`
- Existing dashboard selector: `app/routes/app/app.dashboard/route.tsx`

## Functional Requirements

- FR-01: The embedded Admin UI SHALL support the Polaris-compatible locales currently exposed in the dashboard: `en`, `fr`, `de`, `es`, `ja`, and `pt-BR`.
- FR-02: English SHALL be the default locale when the shop has no saved preference or the saved value is unsupported.
- FR-03: The dashboard language selector SHALL save the selected Admin locale only when the merchant explicitly clicks Save.
- FR-04: A successful save SHALL persist the locale in the shop-wide `Shop` record so all staff accounts use the same preference.
- FR-05: Browser `localStorage` cache SHALL be updated only after the server confirms a successful locale save.
- FR-06: Changing the dropdown without saving SHALL NOT update the DB, browser cache, or active app locale.
- FR-07: On embedded app load, the server-provided shop preference SHALL be authoritative. Browser cache MAY be refreshed from that confirmed DB value.
- FR-08: All app-owned merchant-visible embedded Admin copy SHALL resolve through the Admin i18n catalog.
- FR-09: Every app-owned Admin translation key SHALL be present in every supported locale catalog.
- FR-10: The existing English fallback SHALL remain enabled for defensive handling of unexpected missing keys.
- FR-11: Expose only locales that have Shopify Polaris resources so app-owned copy and Shopify-owned component internals use the same selected language.
- FR-12: Storefront widget copy, checkout UI extension copy, theme-editor schema copy, and merchant-authored storefront translations SHALL remain unchanged.

## Out of Scope

- Storefront widget translation or DCP controls for storefront text.
- Buyer-locale detection changes.
- Checkout UI extension locale changes.
- RTL layout work.
- Per-staff locale preferences.
- Automatic calls to an external translation service at runtime.

## Acceptance Criteria

### FR-01, FR-02: Supported Locales

- [ ] Given a shop with no saved Admin locale, when the embedded app loads, then English is active.
- [ ] Given the dashboard locale selector, when it renders, then the six Polaris-compatible languages appear.
- [ ] Given locale catalogs, when validated, then all six catalogs contain identical key sets.

### FR-03 to FR-07: Save and Cache Contract

- [ ] Given a merchant changes the language dropdown, when Save has not been clicked, then DB, cache, and active locale remain unchanged.
- [ ] Given a valid supported locale, when Save succeeds, then `Shop.adminLocale` is updated and the browser cache is updated afterward.
- [ ] Given a failed save, when the server responds with an error, then the browser cache and active locale remain unchanged.
- [ ] Given another staff account opens the app after a successful save, when its app loader runs, then the same shop-wide locale is active.

### FR-08 to FR-10: App-Owned Copy

- [ ] Given any embedded Admin route or shared Admin component, when rendered under a supported locale, then app-owned merchant-visible copy resolves through translation keys rather than hardcoded English literals.
- [ ] Given the locale catalog validator, when it scans supported locale files, then no locale is missing a key from `en.json`.

### FR-11: Polaris-Compatible Locales

- [ ] Given the dashboard locale selector, when it renders, then every selectable locale has a matching Polaris locale resource.

## UI/UX Spec

- Keep the language selector in the dashboard header.
- Add a visible `Save` button beside the selector.
- Selector changes are draft-only until Save is clicked.
- While saving, disable the Save button and show loading state.
- After a successful save, switch the active Admin locale and show a translated success toast.
- On failure, retain the previous active locale and show a translated error toast.

## Data Changes

Add one nullable shop-wide field:

```prisma
model Shop {
  adminLocale String?
}
```

`null` means English default. Do not use `Session.locale`: that field belongs to Shopify session/user metadata and is not a shop-wide Wolfpack preference.

## Risks

| Risk | Mitigation |
|---|---|
| Requested locale is unavailable in Polaris | Do not expose it in the dashboard selector until Polaris provides matching internals |
| Large Admin surface leaves untranslated strings | Add a catalog parity test and a hardcoded-copy audit allowlist; extract route-by-route |
| Browser cache diverges from DB | Treat loader DB value as authoritative and write cache only after successful save |
| Staff accounts race to change locale | Last successful shop-wide save wins |
| Translation quality varies | Keep translations in reviewed JSON catalogs; no runtime machine translation |
