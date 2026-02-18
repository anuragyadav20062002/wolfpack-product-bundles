# [SDE] Implementation Plan: Multilingual Discount Messaging

**Document Type:** Senior Developer Implementation Plan
**Feature:** Multilingual Discount Message Configuration
**Date:** 2026-02-19
**Input:** Architecture Decision Record v1.0
**Engineer:** Senior Software Engineer — Wolfpack Product Bundles

---

## Implementation Overview

Six files modified, one widget rebuild. No new files, no new packages, no DB migration.

```
app/types/pricing.ts                                    [+types +helpers]
app/hooks/useBundleConfigurationState.ts                [+locale state]
app/routes/…configure.$bundleId/route.tsx               [+dropdown +locale-aware fields]
app/routes/…configure.$bundleId/handlers/handlers.server.ts  [+localizedMessages builder]
app/services/bundles/metafield-sync/operations/bundle-product.server.ts  [+localizedMessages emit]
app/assets/bundle-widget-product-page.js                [+locale detection fallback]
extensions/bundle-builder/assets/bundle-widget-product-page-bundled.js  [rebuilt]
```

---

## Step 1 — Type Definitions (`app/types/pricing.ts`)

Add new types alongside existing ones. Keep `PricingMessages` interface untouched for backward compat.

**Add after line 114 (after `PricingMessages` interface):**

```typescript
/** Per-locale message entry */
export interface LocalizedMessageEntry {
  progress: string;
  qualified: string;
}

/** New locale-keyed messages format (stored in BundlePricing.messages) */
export interface LocalizedPricingMessages {
  localized: Record<string, LocalizedMessageEntry>;
  showInCart: boolean;
}

/** Union type: handles both old flat format and new locale-keyed format */
export type AnyPricingMessages = PricingMessages | LocalizedPricingMessages;

/** Type guard: detect legacy flat format */
export function isLegacyMessages(m: AnyPricingMessages): m is PricingMessages {
  return 'progress' in m;
}

/** Normalize either format to the new locale-keyed format */
export function normalizeMessages(m: AnyPricingMessages | null | undefined): LocalizedPricingMessages {
  if (!m) {
    return { localized: {}, showInCart: true };
  }
  if (isLegacyMessages(m)) {
    return {
      localized: { en: { progress: m.progress, qualified: m.qualified } },
      showInCart: m.showInCart,
    };
  }
  return m;
}

/** Get message entry for a specific locale with en fallback */
export function getMessageForLocale(
  m: AnyPricingMessages | null | undefined,
  locale: string
): LocalizedMessageEntry {
  const normalized = normalizeMessages(m);
  const subtag = locale.split('-')[0];
  return (
    normalized.localized[subtag] ||
    normalized.localized['en'] ||
    { progress: '', qualified: '' }
  );
}
```

---

## Step 2 — State Hook (`app/hooks/useBundleConfigurationState.ts`)

**Change (line 230):** Update `ruleMessages` type from flat per-rule to locale-keyed per-rule.

```typescript
// BEFORE
const [ruleMessages, setRuleMessagesRaw] = useState<Record<string, { discountText: string; successMessage: string }>>({});

// AFTER
const [ruleMessages, setRuleMessagesRaw] = useState<Record<string, Record<string, { discountText: string; successMessage: string }>>>({});
```

**Change (lines 233–235):** Update `setRuleMessages` overload type to match.

```typescript
const setRuleMessages = useCallback((
  value: Record<string, Record<string, { discountText: string; successMessage: string }>> |
  ((prev: Record<string, Record<string, { discountText: string; successMessage: string }>>) =>
    Record<string, Record<string, { discountText: string; successMessage: string }>>)
) => {
  setRuleMessagesRaw(value);
  markAsDirty();
}, [markAsDirty]);
```

The `originalValuesRef` at line 264 stores `ruleMessages: JSON.stringify({})` — no change needed there.

---

## Step 3 — Admin UI (`route.tsx`)

### 3a — Add constant (add near other constants, before the component)

```typescript
const SUPPORTED_LANGUAGES: { label: string; value: string }[] = [
  { label: 'en — English',             value: 'en' },
  { label: 'fr — French',              value: 'fr' },
  { label: 'de — German',              value: 'de' },
  { label: 'es — Spanish',             value: 'es' },
  { label: 'it — Italian',             value: 'it' },
  { label: 'ja — Japanese',            value: 'ja' },
  { label: 'ko — Korean',              value: 'ko' },
  { label: 'pt — Portuguese',          value: 'pt' },
  { label: 'zh — Chinese (Simplified)', value: 'zh' },
  { label: 'nl — Dutch',               value: 'nl' },
  { label: 'da — Danish',              value: 'da' },
  { label: 'sv — Swedish',             value: 'sv' },
  { label: 'pl — Polish',              value: 'pl' },
  { label: 'cs — Czech',               value: 'cs' },
  { label: 'fi — Finnish',             value: 'fi' },
  { label: 'tr — Turkish',             value: 'tr' },
  { label: 'nb — Norwegian',           value: 'nb' },
];
```

### 3b — Add `selectedMessageLocale` state (add near other UI states, after line ~424)

```typescript
const [selectedMessageLocale, setSelectedMessageLocale] = useState<string>('en');
```

### 3c — Update `updateRuleMessage` (line 1076)

```typescript
// BEFORE
const updateRuleMessage = useCallback((ruleId: string, field: 'discountText' | 'successMessage', value: string) => {
  setRuleMessages(prev => ({
    ...prev,
    [ruleId]: { ...prev[ruleId], [field]: value }
  }));
}, []);

// AFTER
const updateRuleMessage = useCallback((ruleId: string, field: 'discountText' | 'successMessage', value: string, locale: string) => {
  setRuleMessages(prev => ({
    ...prev,
    [ruleId]: {
      ...prev[ruleId],
      [locale]: {
        ...(prev[ruleId]?.[locale] ?? {}),
        [field]: value,
      }
    }
  }));
}, []);
```

### 3d — Add language Select dropdown + update TextFields (lines ~1824–1906)

**After the `Checkbox` toggle (after line 1828), add:**

```tsx
{pricingState.discountMessagingEnabled && (
  <Select
    label="Language"
    options={SUPPORTED_LANGUAGES}
    value={selectedMessageLocale}
    onChange={setSelectedMessageLocale}
    helpText="Configure discount messages for the selected language"
  />
)}
```

**Update each `TextField` value and `onChange` (lines ~1883–1901):**

```tsx
// Discount Text TextField
value={ruleMessages[rule.id]?.[selectedMessageLocale]?.discountText ?? ''}
onChange={(value) => updateRuleMessage(rule.id, 'discountText', value, selectedMessageLocale)}
placeholder="Add {{conditionText}} to get {{discountText}}"

// Success Message TextField
value={ruleMessages[rule.id]?.[selectedMessageLocale]?.successMessage ?? ''}
onChange={(value) => updateRuleMessage(rule.id, 'successMessage', value, selectedMessageLocale)}
placeholder="Congratulations! You got {{discountText}} on {{bundleName}}! 🎉"
```

Note: Switch `||` fallback with actual default message to `placeholder` prop so the field is visually empty (not pre-filled with the default) for unconfigured locales — cleaner UX.

### 3e — Add `selectedMessageLocale` to `handleSave` dependency array (line ~479)

Add `selectedMessageLocale` to the `useCallback` dependency array of `handleSave`. (It's not actually used in the save payload, but keeping it consistent prevents stale closure lint warnings.)

---

## Step 4 — Server Handler (`handlers.server.ts`)

**Replace the `messages` builder (lines 419–430):**

```typescript
// BEFORE
messages: (() => {
  const firstRuleId = discountData.discountRules?.[0]?.id;
  const firstRuleMsg = firstRuleId && discountData.ruleMessages?.[firstRuleId];
  return {
    progress: firstRuleMsg?.discountText || 'Add {conditionText} to get {discountText}',
    qualified: firstRuleMsg?.successMessage || 'Congratulations! You got {discountText}',
    showDiscountMessaging: discountData.discountMessagingEnabled || false,
    showProgressBar: discountData.showProgressBar || false,
    showInCart: true
  };
})()

// AFTER
messages: (() => {
  const rawRuleMessages: Record<string, Record<string, { discountText: string; successMessage: string }>> =
    discountData.ruleMessages || {};
  const firstRuleId = discountData.discountRules?.[0]?.id;
  const firstRuleLocales = firstRuleId ? (rawRuleMessages[firstRuleId] ?? {}) : {};

  // Build locale-keyed map from first rule's messages
  const localized: Record<string, { progress: string; qualified: string }> = {};
  for (const [locale, msgs] of Object.entries(firstRuleLocales)) {
    if (msgs.discountText || msgs.successMessage) {
      localized[locale] = {
        progress: msgs.discountText || '',
        qualified: msgs.successMessage || '',
      };
    }
  }

  // Ensure `en` always has a fallback
  if (!localized['en']) {
    const enMsgs = firstRuleLocales['en'];
    if (enMsgs?.discountText || enMsgs?.successMessage) {
      localized['en'] = {
        progress: enMsgs.discountText || '',
        qualified: enMsgs.successMessage || '',
      };
    }
  }

  return {
    localized,
    // Legacy flat fields for backward compat (en fallback)
    progress: localized['en']?.progress || 'Add {conditionText} to get {discountText}',
    qualified: localized['en']?.qualified || 'Congratulations! You got {discountText}',
    showDiscountMessaging: discountData.discountMessagingEnabled || false,
    showProgressBar: discountData.showProgressBar || false,
    showInCart: true,
  };
})()
```

---

## Step 5 — Metafield Sync (`bundle-product.server.ts`)

**Update the `messaging` object (lines 203–209):**

```typescript
// BEFORE
messaging: {
  progressTemplate: bundleConfiguration.pricing?.messages?.progress || ...,
  successTemplate: bundleConfiguration.pricing?.messages?.qualified || ...,
  showProgressBar: ...,
  showDiscountMessaging: ...,
  showFooter: ...
}

// AFTER
messaging: {
  // Locale-keyed message map for multilingual support
  localizedMessages: (bundleConfiguration.pricing?.messages as any)?.localized || {},
  // Legacy flat fields: en fallback for old widget builds
  progressTemplate: bundleConfiguration.pricing?.messages?.progress ||
    (bundleConfiguration.pricing?.messages as any)?.localized?.en?.progress ||
    'Add {conditionText} to get {discountText}',
  successTemplate: bundleConfiguration.pricing?.messages?.qualified ||
    (bundleConfiguration.pricing?.messages as any)?.localized?.en?.qualified ||
    'Congratulations! You got {discountText}',
  showProgressBar: bundleConfiguration.pricing?.messages?.showProgressBar ||
    bundleConfiguration.pricing?.display?.showProgressBar || false,
  showDiscountMessaging: (bundleConfiguration.pricing?.messages as any)?.showDiscountMessaging || false,
  showFooter: bundleConfiguration.pricing?.display?.showFooter !== false,
}
```

---

## Step 6 — Widget (`app/assets/bundle-widget-product-page.js`)

**Replace `updateMessagesFromBundle()` method (lines 267–316):**

```javascript
updateMessagesFromBundle() {
  const messaging = this.selectedBundle?.messaging;
  const pricingMessages = this.selectedBundle?.pricing?.messages;

  // Locale detection: window.Shopify.locale (e.g., "fr-FR") → subtag "fr"
  const rawLocale = (typeof window !== 'undefined' && window.Shopify?.locale) || 'en';
  const locale = rawLocale.split('-')[0];

  if (messaging) {
    const localizedMap = messaging.localizedMessages || {};
    const localeEntry = localizedMap[locale] || localizedMap['en'] || null;

    if (localeEntry) {
      // New locale-keyed format
      this.config.discountTextTemplate = localeEntry.progress || messaging.progressTemplate || '';
      this.config.successMessageTemplate = localeEntry.qualified || messaging.successTemplate || '';
    } else {
      // Legacy flat format fallback
      this.config.discountTextTemplate = messaging.progressTemplate || '';
      this.config.successMessageTemplate = messaging.successTemplate || '';
    }

    this.config.showDiscountMessaging = messaging.showDiscountMessaging !== false;
    this.config.showProgressBar = messaging.showProgressBar || false;

    console.log('[BUNDLE_MESSAGES] Using messaging config (locale: ' + locale + '):', {
      progress: this.config.discountTextTemplate,
      qualified: this.config.successMessageTemplate,
      showDiscountMessaging: this.config.showDiscountMessaging,
    });
  } else if (pricingMessages) {
    // Legacy path: pricing.messages.progress / pricing.messages.qualified
    this.config.discountTextTemplate = pricingMessages.progress || '';
    this.config.successMessageTemplate = pricingMessages.qualified || '';
    this.config.showDiscountMessaging = pricingMessages.showDiscountMessaging !== false;
    this.config.showProgressBar = pricingMessages.showProgressBar || false;

    console.log('[BUNDLE_MESSAGES] Using legacy pricing messages:', {
      progress: this.config.discountTextTemplate,
      qualified: this.config.successMessageTemplate,
    });
  } else {
    this.config.showDiscountMessaging = this.selectedBundle?.pricing?.enabled || false;
    this.config.showProgressBar = false;
    console.log('[BUNDLE_MESSAGES] No messaging config found, using defaults');
  }
}
```

---

## Step 7 — Build Widget

```bash
npm run build:widgets
```

Verify `extensions/bundle-builder/assets/bundle-widget-product-page-bundled.js` is updated.

---

## Testing Checklist

- [ ] `en` tab: type a message → switch to `fr` → switch back to `en` → message preserved
- [ ] `fr` tab: type a message → save → reload page → French message still shown when `fr` selected
- [ ] Existing bundle (old flat messages format): opens without error, `en` fields pre-populate
- [ ] Empty locale fields: save → widget falls back to `en` gracefully
- [ ] Widget in `fr` locale: correct French template renders
- [ ] Widget when `window.Shopify.locale` = `fr-FR`: subtag `fr` extracted correctly
- [ ] Widget when `window.Shopify.locale` undefined: falls back to `en` template
- [ ] `window.Shopify.locale` set to a language with no configured template: falls back to `en`
