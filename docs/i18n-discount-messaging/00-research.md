# i18n Research: Shopify Merchant Apps & UI Extensions

**Date:** 2026-02-19
**Purpose:** Inform the multilingual discount messaging feature for Wolfpack Product Bundles

---

## Executive Summary

There are two separate i18n universes in a Shopify app:

| Layer | Context | Recommended Approach |
|---|---|---|
| UI Extensions (Preact/React) | Checkout, thank-you, POS | **Built-in `shopify.i18n` / `useTranslate`** |
| Remix Admin App — Polaris strings | Component labels, ARIA | **`AppProvider i18n` + Polaris locale JSON** |
| Remix Admin App — App strings | Route labels, error messages | **`i18next` + `remix-i18next`** |
| Theme Editor settings | Merchant-facing schema labels | **`locales/*.schema.json`** |

> **Important distinction for this feature:** The discount messaging requirement is **merchant-authored multilingual content**, not app UI translation. Merchants configure message templates per language; the storefront widget serves the right template based on the buyer's locale. This is a content-management problem solved at the data layer — not solved by i18next or `shopify.i18n`.

---

## Approach 1: Shopify Built-in Extension i18n (UI Extensions)

### How it works
Shopify resolves locale using this precedence at runtime:
1. Customer locale (e.g., `de-DE`)
2. Non-regional customer locale (`de`)
3. Shop locale (`fr-FR`)
4. Non-regional shop locale (`fr`)
5. Extension's default locale (`.default.json` fallback)

No configuration needed — Shopify injects the resolved locale via the `shopify.i18n` global.

### File structure
```
extensions/bundle-checkout-ui/locales/
├── en.default.json     ← Required fallback
├── fr.json
├── de.json
└── en-CA.json          ← Regional overrides supported
```

### JSON format — double curly braces, CLDR pluralization
```json
// en.default.json
{
  "retailPrice": "Retail Price:",
  "bundleSavings": "Save {{amount}}",
  "youHaveMessages": {
    "one": "You have one message",
    "other": "You have {{count}} messages"
  }
}
```

### API (Preact — current extension pattern)
```tsx
const i18n = shopify.i18n;
const label = i18n.translate('bundleSavings', { amount: '$5.00' });
const formatted = i18n.formatCurrency(49.99);   // locale-aware
const num = i18n.formatNumber(10000);            // locale-aware
```

### API (React extensions — `useTranslate`)
```tsx
import { useTranslate, useApi } from '@shopify/ui-extensions-react/checkout';
const translate = useTranslate();
const { i18n } = useApi();
const msg = translate('bundleSavings', { amount: i18n.formatCurrency(5) });
```

**Verdict:** Use this for checkout UI extension static strings. NOT applicable for merchant-configured message templates.

---

## Approach 2: Polaris `AppProvider` i18n (Remix Admin App)

Translates Polaris's own internal component strings (modal dismiss, pagination, date pickers, ARIA labels).

```tsx
// app/routes/app/app.tsx loader
const url = new URL(request.url);
const lang = (url.searchParams.get('locale') || 'en').split('-')[0];
const polarisTranslations = await import(`@shopify/polaris/locales/${lang}.json`)
  .catch(() => import('@shopify/polaris/locales/en.json'));

// Component
<AppProvider isEmbeddedApp apiKey={apiKey} i18n={polarisTranslations.default}>
```

Shopify passes merchant admin language via `?locale=fr` query param on every embedded app request.

**Verdict:** Low effort, zero new dependencies. Should be implemented. Does NOT translate app-authored strings.

---

## Approach 3: i18next + remix-i18next (Remix Admin App Strings)

Industry standard for Remix app string translation. Shopify's documentation explicitly recommends it.

```bash
npm install i18next react-i18next i18next-http-backend remix-i18next
```

**File structure:**
```
app/locales/
├── en/common.json
├── fr/common.json
└── de/common.json
```

**JSON format — single curly braces:**
```json
{
  "discountMessaging": {
    "sectionTitle": "Discount Messaging",
    "languageDropdownLabel": "Configure messages for",
    "discountTextLabel": "Discount Text",
    "successMessageLabel": "Success Message"
  }
}
```

**Usage:**
```tsx
import { useTranslation } from 'react-i18next';
const { t } = useTranslation('common');
return <TextField label={t('discountMessaging.discountTextLabel')} />;
```

**Locale detection in embedded app:** `remix-i18next` reads the `?locale=` param set by Shopify automatically.

**Verdict:** Best choice for translating admin UI labels. Required if we want the bundle config page itself to be multilingual. Out of scope for the immediate feature but noted for future.

---

## Approach 4: Merchant-Authored Multilingual Content (This Feature)

**Not a library problem — a data model problem.**

The requirement is: merchant writes discount message templates in multiple languages; buyer sees the template matching their locale.

**Pattern:**
```typescript
// Before (single-language)
type PricingMessages = {
  progress: string;
  qualified: string;
  showInCart: boolean;
};

// After (multi-language)
type LocalizedPricingMessages = {
  [locale: string]: {           // e.g., "en", "fr", "de"
    progress: string;
    qualified: string;
  };
  showInCart: boolean;          // global flag, not per-language
};
```

**Widget locale detection:**
```javascript
// Storefront widget — reads Shopify's customer locale
const customerLocale = window.Shopify?.locale?.split('-')[0] || 'en';
const messages = messagingConfig[customerLocale] || messagingConfig['en'] || defaultMessages;
```

**Verdict:** This is the correct approach for the feature. No additional npm packages required.

---

## Key Findings for Feature Implementation

1. **`window.Shopify.locale`** — Shopify injects this global on all storefront pages. Value is IETF BCP 47 (e.g., `en-US`, `fr-FR`). Use the language subtag (`en`, `fr`) for matching.
2. **`BundlePricing.messages`** is currently a `Json?` field storing a single `PricingMessages` object — can be extended to a locale-keyed map without a DB migration (just a schema change).
3. **Existing widget** already calls `updateMessagesFromBundle()` — the locale-selection logic slots in there.
4. **Checkout UI extension** shows pricing breakdown, not merchant-configured message templates — out of scope.
5. **Languages to support initially:** Start with Shopify's 20 admin languages: `en`, `fr`, `de`, `es`, `it`, `ja`, `ko`, `pt-BR`, `pt-PT`, `zh-CN`, `zh-TW`, `da`, `nl`, `fi`, `nb`, `pl`, `sv`, `cs`, `th`, `tr`.

---

## Recommended Implementation Stack for This Feature

| Component | Approach | Effort |
|---|---|---|
| Admin UI language dropdown | Polaris `Select` component | Low |
| Per-language message storage | Extend `BundlePricing.messages` JSON schema | Low |
| Data serialization | Existing `discountData` formData flow | Low |
| Widget locale detection | `window.Shopify.locale` + fallback chain | Low |
| Checkout UI extension | No change needed | None |
| Polaris i18n in AppProvider | Polaris locale JSON from `?locale=` param | Low |

**Total complexity: Low-Medium.** No new npm packages required for the core feature.
