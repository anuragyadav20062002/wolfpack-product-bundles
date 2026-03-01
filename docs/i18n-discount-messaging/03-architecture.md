# [Architecture] Multilingual Discount Messaging

**Document Type:** Architecture Decision Record (ADR)
**Feature:** Multilingual Discount Message Configuration
**Date:** 2026-02-19
**Status:** Approved
**Architect:** Senior Software Architect — Wolfpack Product Bundles
**Input:** PO Requirements v1.0

---

## 1. Context & Constraints

**System:** Shopify Remix app + Shopify theme extension (widget) + Prisma/PostgreSQL
**Constraints from PO:**
- No new npm packages for the core feature
- No new API endpoints
- No DB migration (JSON schema evolution only)
- Backward compatibility: existing flat `{progress, qualified, showInCart}` must continue working
- Widget is a bundled IIFE — must run `npm run build:widgets` after JS changes

---

## 2. Architectural Decision: Locale-Keyed Message Map in Existing JSON Field

### Options Considered

**Option A — New DB column `messagesLocalized Json?`**
- Pros: Clean separation, no parsing ambiguity
- Cons: Requires DB migration, schema change, two fields to maintain
- **Rejected:** Violates no-migration constraint

**Option B — Separate `BundlePricingLocale` join table**
- Pros: Normalized, queryable per locale
- Cons: DB migration, Prisma schema change, N+1 query concern, significant complexity
- **Rejected:** Over-engineered for a JSON-stored feature

**Option C — Evolve `BundlePricing.messages` JSON in place (locale-keyed map)**
- Pros: No migration, backward-compatible, zero new columns or tables, fits existing save flow
- Cons: Dual format to handle (old flat + new keyed) in reader code
- **Chosen:** Best fit for constraints

### Decision

Extend the `messages` JSON field from a flat object to a locale-keyed map:

```typescript
// BEFORE (legacy flat format — remains valid)
type PricingMessagesLegacy = {
  progress: string;
  qualified: string;
  showInCart: boolean;
};

// AFTER (new locale-keyed format)
type LocalizedMessages = {
  [locale: string]: {           // IETF subtag: "en", "fr", "de", ...
    progress: string;           // Discount Text template
    qualified: string;          // Success Message template
  };
};

// The stored JSON (BundlePricing.messages) is now a union:
type PricingMessages =
  | PricingMessagesLegacy       // old records — detected by presence of top-level `progress`
  | {
      localized: LocalizedMessages;   // new records — keyed container
      showInCart: boolean;
    };
```

**Detection heuristic:** If `messages.progress` exists → legacy format. If `messages.localized` exists → new format.

---

## 3. Data Model

### Updated Type Definitions (`app/types/pricing.ts`)

```typescript
// Existing (unchanged)
export interface PricingMessagesLegacy {
  progress: string;
  qualified: string;
  showInCart: boolean;
}

// New
export interface LocalizedMessageEntry {
  progress: string;
  qualified: string;
}

export interface PricingMessages {
  localized: Record<string, LocalizedMessageEntry>; // locale → templates
  showInCart: boolean;
}

// Union for backward compat
export type AnyPricingMessages = PricingMessagesLegacy | PricingMessages;
```

### Helper Functions (`app/types/pricing.ts`)

```typescript
export function isLegacyMessages(m: AnyPricingMessages): m is PricingMessagesLegacy {
  return 'progress' in m;
}

export function normalizeMessages(m: AnyPricingMessages): PricingMessages {
  if (isLegacyMessages(m)) {
    return {
      localized: { en: { progress: m.progress, qualified: m.qualified } },
      showInCart: m.showInCart,
    };
  }
  return m;
}

export function getMessageForLocale(
  messages: AnyPricingMessages,
  locale: string
): LocalizedMessageEntry {
  const normalized = normalizeMessages(messages);
  const subtag = locale.split('-')[0];
  return (
    normalized.localized[subtag] ||
    normalized.localized['en'] ||
    { progress: '', qualified: '' }
  );
}
```

---

## 4. Component Architecture

### 4.1 Admin UI (`route.tsx` — Discount Messaging Section)

**State shape change:**

```typescript
// BEFORE (per rule, per PO requirement)
type RuleMessages = {
  discountText: string;
  successMessage: string;
};
// Map<ruleId, RuleMessages>

// AFTER — add selected language, per-locale map
type RuleLocalizedMessages = {
  [locale: string]: {
    discountText: string;
    successMessage: string;
  };
};
// Map<ruleId, RuleLocalizedMessages>

// Lifted UI state (shared across rules)
const [selectedMessageLocale, setSelectedMessageLocale] = useState<string>('en');
```

**New state management functions:**

```typescript
// Replace updateRuleMessage — now locale-aware
function updateRuleMessage(
  ruleId: string,
  field: 'discountText' | 'successMessage',
  value: string,
  locale: string
) {
  setRuleMessages(prev => {
    const ruleMap = prev.get(ruleId) ?? {};
    return new Map(prev).set(ruleId, {
      ...ruleMap,
      [locale]: {
        ...(ruleMap[locale] ?? {}),
        [field]: value,
      },
    });
  });
}
```

**Language dropdown (Polaris `Select`):**

```tsx
const SUPPORTED_LANGUAGES = [
  { label: 'en — English', value: 'en' },
  { label: 'fr — French', value: 'fr' },
  { label: 'de — German', value: 'de' },
  { label: 'es — Spanish', value: 'es' },
  { label: 'it — Italian', value: 'it' },
  { label: 'ja — Japanese', value: 'ja' },
  { label: 'ko — Korean', value: 'ko' },
  { label: 'pt — Portuguese', value: 'pt' },
  { label: 'zh — Chinese (Simplified)', value: 'zh' },
  { label: 'nl — Dutch', value: 'nl' },
  { label: 'da — Danish', value: 'da' },
  { label: 'sv — Swedish', value: 'sv' },
  { label: 'pl — Polish', value: 'pl' },
  { label: 'cs — Czech', value: 'cs' },
  { label: 'fi — Finnish', value: 'fi' },
  { label: 'tr — Turkish', value: 'tr' },
  { label: 'nb — Norwegian', value: 'nb' },
];

<Select
  label="Language"
  options={SUPPORTED_LANGUAGES}
  value={selectedMessageLocale}
  onChange={setSelectedMessageLocale}
/>
```

### 4.2 Save Flow (No New Endpoints)

The existing `discountData` formData field is extended:

```typescript
// BEFORE
formData.append("discountData", JSON.stringify({
  ruleMessages  // Map<ruleId, {discountText, successMessage}>
}));

// AFTER
formData.append("discountData", JSON.stringify({
  ruleMessages  // Map<ruleId, {[locale]: {discountText, successMessage}}>
}));
```

The server action reads `ruleMessages`, builds `PricingMessages.localized`, and saves to `BundlePricing.messages`. No server-side routing changes.

### 4.3 Metafield Sync (`bundle-product.server.ts`)

The metafield builder is updated to emit the full locale map:

```typescript
// BEFORE
messaging: {
  progressTemplate: messages?.progress || DEFAULT_PROGRESS,
  successTemplate: messages?.qualified || DEFAULT_QUALIFIED,
  showDiscountMessaging: messages?.showInCart || false,
  ...
}

// AFTER
messaging: {
  localizedMessages: normalizeMessages(messages).localized,  // locale → {progress, qualified}
  showDiscountMessaging: normalizeMessages(messages).showInCart || false,
  showProgressBar: ...,
  showFooter: ...,
}
```

Legacy flat fields (`progressTemplate`, `successTemplate`) are kept in the metafield as the `en` fallback values for backward compatibility with old widget builds.

### 4.4 Widget (`bundle-widget-product-page.js`)

**`updateMessagesFromBundle()` — locale-aware extension:**

```javascript
function getCustomerLocale() {
  const raw = window?.Shopify?.locale || 'en';
  return raw.split('-')[0]; // "fr-FR" → "fr"
}

function updateMessagesFromBundle(bundleData) {
  const messaging = bundleData?.messaging || {};

  // Locale-aware selection with fallback chain
  const locale = getCustomerLocale();
  const localizedMap = messaging.localizedMessages || {};
  const localeEntry =
    localizedMap[locale] ||
    localizedMap['en'] ||
    null;

  if (localeEntry) {
    discountTextTemplate = localeEntry.progress || '';
    successMessageTemplate = localeEntry.qualified || '';
  } else {
    // Legacy fallback
    discountTextTemplate = messaging.progressTemplate || '';
    successMessageTemplate = messaging.successTemplate || '';
  }

  showDiscountMessaging = messaging.showDiscountMessaging || false;
  showProgressBar = messaging.showProgressBar || false;
  showFooter = messaging.showFooter !== false;
}
```

---

## 5. Data Flow Diagram

```
ADMIN UI (route.tsx)
│
│  selectedMessageLocale (React state, UI-only)
│  ruleMessages: Map<ruleId, {[locale]: {discountText, successMessage}}>
│
│  onChange(locale) → setSelectedMessageLocale (no server call)
│  onChange(field)  → updateRuleMessage(ruleId, field, value, selectedMessageLocale)
│
▼ onSave → formData.discountData (JSON)
│
SERVER ACTION (route.tsx action)
│  Builds PricingMessages:
│  {
│    localized: { en: {progress, qualified}, fr: {progress, qualified}, ... },
│    showInCart: boolean
│  }
│
▼ db.bundlePricing.upsert({ messages: ... })
│
DB (BundlePricing.messages — Json field)
│
▼ metafield-sync triggered
│
METAFIELD BUILDER (bundle-product.server.ts)
│  Emits:
│  {
│    messaging: {
│      localizedMessages: { en: {...}, fr: {...} },
│      progressTemplate: "<en fallback>",   ← backward compat
│      successTemplate: "<en fallback>",    ← backward compat
│      showDiscountMessaging: bool,
│      ...
│    }
│  }
│
▼ Shopify app metafield updated
│
STOREFRONT WIDGET (bundle-widget-product-page-bundled.js)
│  window.Shopify.locale → "fr-FR" → "fr"
│  localizedMessages["fr"] → {progress, qualified}
│  Fallback: ["en"] → legacy progressTemplate
│
▼ Renders discount message in buyer's language
```

---

## 6. Design Patterns

| Pattern | Application |
|---|---|
| **Backward-compatible schema evolution** | Legacy flat format auto-normalised via `normalizeMessages()` |
| **Null object pattern** | Empty `LocalizedMessageEntry` returned instead of null for missing locales |
| **Fallback chain** | `buyer locale → en → legacy flat → empty string` — never throws |
| **UI-only state** | `selectedMessageLocale` is pure React state — never persisted directly |
| **Single save point** | All locales saved atomically in one `discountData` payload |
| **Thin metafield layer** | Server transforms DB format → wire format; widget reads wire format only |

---

## 7. Files to Create / Modify

| File | Change |
|---|---|
| `app/types/pricing.ts` | Add `LocalizedMessageEntry`, `PricingMessages` v2, `normalizeMessages`, `getMessageForLocale` helpers |
| `app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/route.tsx` | Add `selectedMessageLocale` state, `SUPPORTED_LANGUAGES` const, language `Select`, update `ruleMessages` state shape + `updateRuleMessage`, update server action message builder |
| `app/services/bundles/metafield-sync/operations/bundle-product.server.ts` | Update messaging object to emit `localizedMessages` map + keep legacy fields as `en` fallback |
| `app/assets/bundle-widget-product-page.js` | Update `updateMessagesFromBundle()` with locale-aware selection + fallback chain |
| `extensions/bundle-builder/assets/bundle-widget-product-page-bundled.js` | Rebuilt artifact — `npm run build:widgets` |

---

## 8. Risk Register

| Risk | Mitigation |
|---|---|
| `window.Shopify` undefined in headless storefronts | Fallback chain defaults to `en` gracefully |
| `messages` JSON field contains unexpected shape | `normalizeMessages` uses duck typing — safe |
| Widget reads stale metafield before metafield sync | Existing issue, unrelated to this feature |
| Large number of languages bloating metafield JSON | Typical config: 2-3 languages × 2 fields × 50 chars ≈ < 1 KB. Well within Shopify's 128 KB metafield limit |

---

## 9. Handover to SDE

Implementation should follow this order to minimise risk:
1. Type changes first (`pricing.ts`) — establishes contract
2. Admin UI changes (state + dropdown + fields) — testable without widget
3. Server action changes (message builder) — testable with DB inspection
4. Metafield sync changes — testable with metafield query
5. Widget JS changes + build — requires full storefront test
6. End-to-end test: configure `fr` message, browse in `fr` locale, verify display
