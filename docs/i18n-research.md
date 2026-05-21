# i18n Research — Wolfpack Product Bundles

**Created:** 2026-05-09  
**Status:** Research complete — architecture scaffolding next  
**Scope:** Admin UI (active) · Storefront widget (future)

---

## 1. Admin UI i18n

### Recommended stack

| Concern | Choice | Reason |
|---------|--------|--------|
| Translation engine | `react-i18next` + `i18next` | Industry standard, `@shopify/react-i18n` is deprecated ([source](https://community.shopify.dev/t/shopify-react-i18n-deprecated/1832)) |
| Polaris component strings | `@shopify/polaris/locales/{locale}.json` | Shopify ships locale JSON for every Polaris component |
| Locale detection | URL search param `?locale=en` (manual dropdown) | Matches the existing manual language-selector UX |
| Locale persistence | URL search param only | No DB storage needed; deeplink-friendly |

### How locale flows through the Remix app

```
Merchant clicks language dropdown
  → setSearchParams({ locale: "fr" })
  → URL: /app/dashboard?locale=fr
  → loader reads searchParams.get("locale")
  → passes { locale } to useLoaderData()
  → client initialises i18next with that locale
  → all t("key") calls resolve to French strings
```

### Package installation

```bash
npm install i18next react-i18next i18next-resources-to-backend
# Polaris locale files are already shipped with @shopify/polaris
```

### Directory layout

```
app/
├── i18n/
│   ├── config.ts           ← i18next instance + init options
│   ├── provider.tsx        ← <I18nProvider> wrapping the app
│   └── locales/
│       ├── en.json         ← base strings (extracted from UI)
│       ├── fr.json
│       ├── de.json
│       ├── es.json
│       ├── ja.json
│       └── pt-BR.json
```

### `app/i18n/config.ts` scaffold

```ts
import i18n from "i18next";
import { initReactI18next } from "react-i18next";

export const SUPPORTED_LOCALES = ["en", "fr", "de", "es", "ja", "pt-BR"] as const;
export type SupportedLocale = typeof SUPPORTED_LOCALES[number];

export function initI18n(locale: SupportedLocale, resources: Record<string, unknown>) {
  if (i18n.isInitialized) {
    void i18n.changeLanguage(locale);
    return i18n;
  }
  void i18n
    .use(initReactI18next)
    .init({
      lng: locale,
      fallbackLng: "en",
      resources: { [locale]: { translation: resources } },
      interpolation: { escapeValue: false },
    });
  return i18n;
}
```

### Loader pattern

```ts
// In each route loader that needs i18n strings:
const locale = (new URL(request.url).searchParams.get("locale") ?? "en") as SupportedLocale;
const messages = (await import(`../i18n/locales/${locale}.json`)).default;
return json({ locale, messages });
```

### Client hydration

```tsx
// In root.tsx or the relevant route:
const { locale, messages } = useLoaderData<typeof loader>();
useEffect(() => { initI18n(locale, messages); }, [locale, messages]);
```

### Polaris component translations

The `AppProvider` in `app/root.tsx` accepts an `i18n` prop for Polaris's own component strings:

```tsx
import polarisEn from "@shopify/polaris/locales/en.json";
// dynamically import the correct locale file:
<AppProvider i18n={polarisLocaleMessages}>
```

Polaris locale files live at:  
`node_modules/@shopify/polaris/locales/{locale}.json`  
Available: `en`, `cs`, `da`, `de`, `es`, `fi`, `fr`, `it`, `ja`, `ko`, `nb`, `nl`, `pl`, `pt-BR`, `pt-PT`, `sv`, `th`, `tr`, `vi`, `zh-CN`, `zh-TW`

### String extraction approach

1. Replace every hardcoded UI string with `t("namespace.key")`:
   ```tsx
   // Before
   <s-heading>No bundles yet</s-heading>
   // After
   <s-heading>{t("dashboard.emptyState.title")}</s-heading>
   ```
2. Build `app/i18n/locales/en.json` with all keys as you extract.
3. Once English is complete, machine-translate to other locales via DeepL/Google Translate API, then review.

### Priority extraction order

| Priority | File | Key areas |
|----------|------|-----------|
| 1 | `app/routes/app/app.dashboard/route.tsx` | Dashboard titles, filter labels, empty state, toast messages |
| 2 | `app/routes/app/app.bundles.*/route.tsx` | Bundle configure pages, wizard steps, form labels |
| 3 | `app/components/**` | Shared UI components (readiness overlay, guided tour, banners) |
| 4 | Error messages | Validation errors, API error responses shown in UI |

---

## 2. Storefront Widget i18n (future — research only)

### Constraint

The storefront widget (`bundle-widget-full-page-bundled.js`, `bundle-widget-product-page-bundled.js`) is a plain vanilla JS IIFE bundle. It does **not** use React or any npm build system accessible from the theme side. i18n must be solved without React or i18next.

### Recommended approach: DCP-driven translation strings

The cleanest pattern for Shopify storefront apps is to pass translated strings from the Liquid layer into the widget via `data-*` attributes. The merchant's active storefront locale is available in Liquid via `{{ request.locale.iso_code }}`.

#### How it works

1. **Liquid block** reads `{{ request.locale.iso_code }}` and selects the right translation object.
2. Translations are written into a `data-i18n` JSON attribute on the widget container.
3. The widget JS reads `dataset.i18n` on init and uses those strings for all UI copy.

#### Liquid side

```liquid
{% comment %} In bundle-full-page.liquid {% endcomment %}
{% assign locale = request.locale.iso_code %}
{% assign t_en = '{"addToBundle":"Add to bundle","total":"Total","next":"Next","back":"Back"}' %}
{% assign t_fr = '{"addToBundle":"Ajouter au bundle","total":"Total","next":"Suivant","back":"Retour"}' %}
{% assign translations = t_en %}
{% if locale == 'fr' %}{% assign translations = t_fr %}{% endif %}
{%- comment -%} … add other locales … {%- endcomment -%}

<div
  id="wolfpack-bundle-widget"
  data-bundle-id="{{ block.settings.bundle_id }}"
  data-i18n="{{ translations | escape }}"
></div>
```

#### Widget JS side

```js
// In bundle-widget-full-page.js — init()
const raw = container.dataset.i18n ?? '{}';
let t = {};
try { t = JSON.parse(raw); } catch {}
const getString = (key, fallback) => t[key] ?? fallback;

// Usage:
addBtn.textContent = getString('addToBundle', 'Add to bundle');
```

### Alternative: DCP text controls

Each translatable string could be a DCP text field (one per language), letting merchants enter their own translations without Liquid changes. This is the fully merchant-controlled option but creates DCP UI bloat for many languages.

### Alternative: Shopify theme locales

Shopify supports `locales/{locale}.json` inside the theme for theme-owned strings. App blocks can't directly access these, but a workaround is to inject them via a Liquid `script` tag into the page. Not recommended — creates a theme dependency.

### Recommended path for storefront widget

1. Start with DCP-driven `data-i18n` JSON blob (above) — covers 80% of use cases.
2. Add a Liquid `{% case locale %}` block for all supported languages.
3. Later, if merchant customisation of strings is needed, add DCP text fields per string (scoped to the most-used strings only).

### Supported storefront locales to target (first pass)

`en`, `fr`, `de`, `es`, `ja`, `pt-BR` — mirrors the admin UI dropdown.

---

## 3. Open questions / decisions required before implementation

- [ ] **Admin UI**: Should locale be stored in a user preference on the server (per merchant in DB), or is URL param sufficient long-term?
- [ ] **Storefront**: Are there existing Shopify theme locale files in merchant themes we should hook into?
- [ ] **Translation quality**: Machine translate first, then manual review by native speakers, or contract a localisation agency?
- [ ] **Fallback behaviour**: If a key is missing in a locale, fall back silently to English or show a visible placeholder?
- [ ] **RTL support**: Are any target languages right-to-left (Arabic, Hebrew)? Not in current list but worth confirming.

---

## 4. Implementation checklist (admin UI — Phase 18+)

- [ ] Install `i18next`, `react-i18next`
- [ ] Create `app/i18n/config.ts` with `initI18n()` and `SUPPORTED_LOCALES`
- [ ] Create `app/i18n/locales/en.json` with all extracted English strings
- [ ] Create `app/i18n/provider.tsx` wrapping `I18nextProvider`
- [ ] Wire locale into `root.tsx` loader + `AppProvider` Polaris i18n
- [ ] Extract dashboard strings → `dashboard.*` namespace keys
- [ ] Machine translate `en.json` to fr/de/es/ja/pt-BR
- [ ] Verify language dropdown triggers locale change end-to-end
- [ ] Test Polaris component strings (date pickers, modals, etc.) switch correctly
